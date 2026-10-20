package auth

import (
	"database/sql"
	"encoding/base32"
	"errors"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-gonic/gin"
	"hospital-hims/backend/core-go/internal/auditlog"
)

// SecurityHandler keeps MFA, lockout and session state in Go's database.
// No access token is issued until both password and a second factor succeed.
type SecurityHandler struct {
	db            *sql.DB
	tokens        *TokenService
	audit         *auditlog.Writer
	encryptionKey []byte
}

func NewSecurityHandler(db *sql.DB, tokens *TokenService, audit *auditlog.Writer, key []byte) (*SecurityHandler, error) {
	if _, err := mfaCipher(key); err != nil {
		return nil, err
	}
	return &SecurityHandler{db: db, tokens: tokens, audit: audit, encryptionKey: append([]byte(nil), key...)}, nil
}

type securityLoginRequest struct {
	Username string `json:"username" binding:"required,max=100"`
	Password string `json:"password" binding:"required,max=72"`
	Code     string `json:"code" binding:"max=32"`
}

func securityUnavailable(c *gin.Context, err error) {
	log.Printf("[AUTH] security operation failed: %v", err)
	c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Authentication is temporarily unavailable"})
}

func (h *SecurityHandler) commit(c *gin.Context, tx *sql.Tx, user User, action string, success bool) error {
	status := "SUCCESS"
	if !success {
		status = "FAILURE"
	}
	if h.audit == nil {
		return errors.New("audit writer unavailable")
	}
	err := h.audit.RecordTx(c.Request.Context(), tx, auditlog.Entry{UserID: &user.ID, UserName: user.Username, UserRole: user.Role, Service: "core-go", Module: "auth", Action: action, ResourceType: "User", ResourceID: user.ID, IPAddress: c.ClientIP(), Status: status})
	if err != nil {
		return err
	}
	return tx.Commit()
}

// HandleLogin requires the password on each MFA submission. Enrollment responses
// are not bearer credentials and cannot authorize a protected endpoint.
func (h *SecurityHandler) HandleLogin(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	var req securityLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Valid username, password and optional MFA code are required"})
		return
	}
	if h.db == nil {
		securityUnavailable(c, errors.New("database unavailable"))
		return
	}
	ctx := c.Request.Context()
	tx, err := h.db.BeginTx(ctx, nil)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	defer tx.Rollback()
	var user User
	err = tx.QueryRowContext(ctx, `SELECT id::text,username,password_hash,role,department,is_active,token_version FROM users WHERE username=$1 AND deleted_at IS NULL FOR UPDATE`, req.Username).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.Role, &user.Department, &user.IsActive, &user.TokenVersion)
	if errors.Is(err, sql.ErrNoRows) {
		VerifyPassword(placeholderHash(), req.Password)
		if h.audit == nil {
			securityUnavailable(c, errors.New("audit writer unavailable"))
			return
		}
		err = h.audit.RecordTx(ctx, tx, auditlog.Entry{UserName: req.Username, Service: "core-go", Module: "auth", Action: "LOGIN_FAILURE", ResourceType: "User", ResourceID: req.Username, IPAddress: c.ClientIP(), Status: "FAILURE"})
		if err == nil {
			err = tx.Commit()
		}
		if err != nil {
			securityUnavailable(c, err)
			return
		}
		c.JSON(401, gin.H{"error": "Invalid credentials or account unavailable"})
		return
	}
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	if _, err = tx.ExecContext(ctx, `INSERT INTO auth_account_security(user_id) VALUES($1) ON CONFLICT DO NOTHING`, user.ID); err != nil {
		securityUnavailable(c, err)
		return
	}
	var failed, maxFailed, lockMinutes int
	var locked, enrolled sql.NullTime
	var encrypted []byte
	var lastStep int64
	var now time.Time
	err = tx.QueryRowContext(ctx, `SELECT a.failed_attempts,a.locked_until,a.encrypted_totp_secret,a.mfa_enrolled_at,a.last_totp_step,s.max_failed_attempts,s.lockout_minutes,clock_timestamp() FROM auth_account_security a CROSS JOIN auth_security_settings s WHERE a.user_id=$1 AND s.id=true FOR UPDATE OF a`, user.ID).Scan(&failed, &locked, &encrypted, &enrolled, &lastStep, &maxFailed, &lockMinutes, &now)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	passwordOK := VerifyPassword(user.PasswordHash, req.Password)
	if !user.IsActive || (locked.Valid && now.Before(locked.Time)) {
		if err = h.commit(c, tx, user, "LOGIN_DENIED", false); err != nil {
			securityUnavailable(c, err)
			return
		}
		c.JSON(401, gin.H{"error": "Invalid credentials or account unavailable"})
		return
	}
	if locked.Valid {
		failed = 0
	}
	fail := func() {
		failed++
		var until any
		action := "LOGIN_FAILURE"
		if failed >= maxFailed {
			until = now.Add(time.Duration(lockMinutes) * time.Minute)
			action = "ACCOUNT_LOCKED"
		}
		_, err = tx.ExecContext(ctx, `UPDATE auth_account_security SET failed_attempts=$2,locked_until=$3 WHERE user_id=$1`, user.ID, failed, until)
		if err == nil {
			err = h.commit(c, tx, user, action, false)
		}
		if err != nil {
			securityUnavailable(c, err)
			return
		}
		c.JSON(401, gin.H{"error": "Invalid credentials or account unavailable"})
	}
	if !passwordOK {
		fail()
		return
	}
	if len(encrypted) == 0 {
		raw, _, generateErr := newTOTPSecret()
		if generateErr != nil {
			securityUnavailable(c, generateErr)
			return
		}
		encrypted, err = sealMFASecret(h.encryptionKey, raw, user.ID)
		if err != nil {
			securityUnavailable(c, err)
			return
		}
		if _, err = tx.ExecContext(ctx, `UPDATE auth_account_security SET encrypted_totp_secret=$2 WHERE user_id=$1`, user.ID, encrypted); err != nil {
			securityUnavailable(c, err)
			return
		}
	}
	secret, err := openMFASecret(h.encryptionKey, encrypted, user.ID)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	if req.Code == "" {
		action := "MFA_CHALLENGE"
		response := gin.H{"mfa_required": true, "enrollment_required": !enrolled.Valid}
		if !enrolled.Valid {
			action = "MFA_ENROLLMENT_STARTED"
			encoded := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(secret)
			values := url.Values{"secret": {encoded}, "issuer": {"HIMS"}, "algorithm": {"SHA1"}, "digits": {"6"}, "period": {"30"}}
			response["secret"] = encoded
			response["otpauth_uri"] = "otpauth://totp/" + url.PathEscape("HIMS:"+user.Username) + "?" + values.Encode()
		}
		if err = h.commit(c, tx, user, action, true); err != nil {
			securityUnavailable(c, err)
			return
		}
		c.JSON(200, response)
		return
	}
	step, verified := verifyTOTP(secret, req.Code, now, lastStep)
	recoveryUsed := false
	if !verified && enrolled.Valid && len(req.Code) == 32 {
		var consumed string
		err = tx.QueryRowContext(ctx, `UPDATE auth_recovery_codes SET consumed_at=$3 WHERE user_id=$1 AND code_digest=$2 AND consumed_at IS NULL RETURNING code_digest`, user.ID, recoveryDigest(user.ID, req.Code), now).Scan(&consumed)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			securityUnavailable(c, err)
			return
		}
		verified = err == nil
		recoveryUsed = verified
	}
	if !verified {
		fail()
		return
	}
	if recoveryUsed {
		step = lastStep
	}
	var backupCodes []string
	if !enrolled.Valid {
		for i := 0; i < 10; i++ {
			code, digest, codeErr := newRecoveryCode(user.ID)
			if codeErr != nil {
				securityUnavailable(c, codeErr)
				return
			}
			if _, err = tx.ExecContext(ctx, `INSERT INTO auth_recovery_codes(user_id,code_digest) VALUES($1,$2)`, user.ID, digest); err != nil {
				securityUnavailable(c, err)
				return
			}
			backupCodes = append(backupCodes, code)
		}
	}
	if _, err = tx.ExecContext(ctx, `UPDATE auth_account_security SET failed_attempts=0,locked_until=NULL,mfa_enrolled_at=COALESCE(mfa_enrolled_at,$2),last_totp_step=$3 WHERE user_id=$1`, user.ID, now, step); err != nil {
		securityUnavailable(c, err)
		return
	}
	var sessionID string
	if err = tx.QueryRowContext(ctx, `SELECT gen_random_uuid()::text`).Scan(&sessionID); err != nil {
		securityUnavailable(c, err)
		return
	}
	token, err := h.tokens.GenerateSession(user.ID, user.Username, user.Role, user.Department, user.TokenVersion, sessionID)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	claims, err := h.tokens.Validate(token)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	if _, err = tx.ExecContext(ctx, `INSERT INTO auth_sessions(id,user_id,token_version,created_at,last_activity_at,expires_at) VALUES($1,$2,$3,$4,$4,$5)`, sessionID, user.ID, user.TokenVersion, now, claims.ExpiresAt.Time); err != nil {
		securityUnavailable(c, err)
		return
	}
	action := "LOGIN_SUCCESS_MFA"
	if !enrolled.Valid {
		action = "MFA_ENROLLED"
	}
	if recoveryUsed {
		action = "LOGIN_SUCCESS_RECOVERY"
	}
	if err = h.commit(c, tx, user, action, true); err != nil {
		securityUnavailable(c, err)
		return
	}
	c.JSON(200, gin.H{"token": token, "user": UserSummary{ID: user.ID, Username: user.Username, Role: user.Role, Department: user.Department}, "backup_codes": backupCodes})
}
