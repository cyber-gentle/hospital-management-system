package auth

import (
	"context"
	"errors"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"hospital-hims/services/core-go/internal/auditlog"
)

// AuditRecorder is the subset of the audit-log writer the login handler needs.
type AuditRecorder interface {
	Record(ctx context.Context, entry auditlog.Entry) error
}

// LoginRequest is the credential payload accepted by the login endpoint.
//
// Note the absence of a role field. An earlier revision accepted one and
// embedded it in the issued token without any lookup against stored
// credentials, which let any caller mint an ADMIN token by sending
// {"role": "ADMIN"}. Unknown fields in the request body are ignored by the
// binder, so sending one now has no effect.
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UserSummary is the user representation returned alongside a token.
type UserSummary struct {
	ID         string `json:"id"`
	Username   string `json:"username"`
	Role       string `json:"role"`
	Department string `json:"department"`
}

// LoginResponse is returned by a successful login.
type LoginResponse struct {
	Token string      `json:"token"`
	User  UserSummary `json:"user"`
}

// LoginHandler authenticates a user against stored credentials and issues a JWT.
type LoginHandler struct {
	store  UserStore
	tokens *TokenService
	audit  AuditRecorder
}

// NewLoginHandler returns a login handler. store may be nil, in which case
// every login attempt fails with 503 — the service can still start without a
// database for health checks, but it will not authenticate anyone.
func NewLoginHandler(store UserStore, tokens *TokenService, audit AuditRecorder) *LoginHandler {
	return &LoginHandler{store: store, tokens: tokens, audit: audit}
}

// Handle processes POST /api/v1/auth/login.
func (h *LoginHandler) Handle(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username and password are required"})
		return
	}

	if h.store == nil {
		log.Printf("[AUTH] login attempt rejected: no user store configured (database unavailable)")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "authentication is temporarily unavailable"})
		return
	}

	ctx := c.Request.Context()
	user, lookupErr := h.store.FindByUsername(ctx, req.Username)
	if lookupErr != nil && !errors.Is(lookupErr, ErrUserNotFound) {
		// A genuine infrastructure failure, not bad credentials. Do not leak
		// the detail to the caller; it is already logged by the store.
		log.Printf("[AUTH] user lookup failed for %q: %v", req.Username, lookupErr)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "authentication is temporarily unavailable"})
		return
	}

	// Only an unknown username or a wrong password reaches this branch, plus
	// the inactive case. All three return an identical response so the
	// endpoint cannot be used to enumerate valid usernames.
	if user == nil || !user.IsActive || !VerifyPassword(user.PasswordHash, req.Password) {
		// Burn a comparable amount of time when the user does not exist,
		// otherwise the fast path for unknown usernames is distinguishable
		// from the slow bcrypt path for real ones.
		if user == nil {
			VerifyPassword(placeholderHash(), req.Password)
		}

		h.record(ctx, c, nil, req.Username, "", "LOGIN_FAILURE",
			"invalid credentials or inactive account", http.StatusUnauthorized)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
		return
	}

	// The role and department come from the stored record, never the request.
	token, err := h.tokens.Generate(user.ID, user.Username, user.Role, user.Department)
	if err != nil {
		log.Printf("[AUTH] failed to issue token for user %s: %v", user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "authentication is temporarily unavailable"})
		return
	}

	h.record(ctx, c, &user.ID, user.Username, user.Role, "LOGIN_SUCCESS", "", http.StatusOK)

	c.JSON(http.StatusOK, LoginResponse{
		Token: token,
		User: UserSummary{
			ID:         user.ID,
			Username:   user.Username,
			Role:       user.Role,
			Department: user.Department,
		},
	})
}

// record writes a login attempt to the audit log. A failure to audit is logged
// but does not alter the HTTP response: refusing to answer a login because the
// audit table is unavailable would turn an audit outage into a total outage,
// and the attempt is already captured in the process log above.
func (h *LoginHandler) record(
	ctx context.Context,
	c *gin.Context,
	userID *string,
	username string,
	role string,
	action string,
	detail string,
	status int,
) {
	if h.audit == nil {
		return
	}

	entry := auditlog.Entry{
		UserID:       userID,
		UserName:     username,
		UserRole:     role,
		Service:      "core-go",
		Module:       "auth",
		Action:       action,
		ResourceType: "User",
		ResourceID:   username,
		Details:      map[string]any{"http_status": status},
		IPAddress:    c.ClientIP(),
		Status:       "SUCCESS",
	}
	if status != http.StatusOK {
		entry.Status = "FAILURE"
	} else if userID != nil {
		entry.ResourceID = *userID
	}
	if detail != "" {
		entry.Details["reason"] = detail
	}

	if err := h.audit.Record(ctx, entry); err != nil {
		log.Printf("[AUTH] failed to write audit entry for %s: %v", action, err)
	}
}

// placeholderHash returns a valid bcrypt hash used only to equalise the
// response time of the unknown-user and wrong-password paths. It is computed
// once, lazily, so tests and cold starts do not pay for it on the happy path.
var placeholderHash = sync.OnceValue(func() string {
	hash, err := bcrypt.GenerateFromPassword([]byte("hims-timing-equalisation-placeholder"), bcryptCost)
	if err != nil {
		// Unreachable for a fixed input well under the length limit. Returning
		// an empty string makes VerifyPassword a no-op, which is the correct
		// degradation: it costs the timing property, not correctness.
		log.Printf("[AUTH] warning: could not build placeholder hash: %v", err)
		return ""
	}
	return string(hash)
})
