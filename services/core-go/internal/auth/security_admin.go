package auth

import (
	"database/sql"
	"errors"
	"strings"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
)

func (h *SecurityHandler) RegisterAdminRoutes(api *gin.RouterGroup) {
	group := api.Group("/admin/security", AuthRequired(h.tokens), RequirePermission(h.db, "admin", "read"), RequireRole("ADMIN", "AUDITOR"))
	group.GET("", h.HandleSettings)
	group.POST("/users/:id/unlock", RequirePermission(h.db, "admin", "write"), RequireRole("ADMIN"), h.HandleUnlock)
	group.POST("/users/:id/reset-mfa", RequirePermission(h.db, "admin", "write"), RequireRole("ADMIN"), h.HandleResetMFA)
}

func (h *SecurityHandler) HandleSettings(c *gin.Context) {
	var attempts, lockMinutes, idleMinutes int
	err := h.db.QueryRowContext(c.Request.Context(), `SELECT max_failed_attempts,lockout_minutes,idle_timeout_minutes FROM auth_security_settings WHERE id=true`).Scan(&attempts, &lockMinutes, &idleMinutes)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	c.JSON(200, gin.H{"max_failed_attempts": attempts, "lockout_minutes": lockMinutes, "idle_timeout_minutes": idleMinutes, "mfa_required_for": "ALL_STAFF"})
}

// Lock the acting account so administrative authority cannot be revoked between
// the permission check and the audited change.
func (h *SecurityHandler) adminTransaction(c *gin.Context) (*sql.Tx, error) {
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		return nil, err
	}
	var role string
	var version int
	err = tx.QueryRowContext(c.Request.Context(), `SELECT role,token_version FROM users WHERE id=$1 AND is_active=true AND deleted_at IS NULL FOR SHARE`, c.GetString(ContextUserID)).Scan(&role, &version)
	if err != nil || role != "ADMIN" || version != c.GetInt(ContextTokenVersion) {
		if rollbackErr := tx.Rollback(); rollbackErr != nil {
			return nil, rollbackErr
		}
		return nil, errors.New("administrator authority unavailable")
	}
	return tx, nil
}

func (h *SecurityHandler) HandleUnlock(c *gin.Context)   { h.changeSecurity(c, false) }
func (h *SecurityHandler) HandleResetMFA(c *gin.Context) { h.changeSecurity(c, true) }
func (h *SecurityHandler) changeSecurity(c *gin.Context, reset bool) {
	var req struct {
		Reason           string `json:"reason" binding:"required,max=500"`
		IdentityVerified bool   `json:"identity_verified"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Reason) == "" || (reset && !req.IdentityVerified) {
		c.JSON(400, gin.H{"error": "A reason and, for MFA reset, confirmed staff identity verification are required"})
		return
	}
	target := c.Param("id")
	if reset && target == c.GetString(ContextUserID) {
		c.JSON(403, gin.H{"error": "Another ADMIN must verify your identity and reset your MFA"})
		return
	}
	tx, err := h.adminTransaction(c)
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	defer tx.Rollback()
	var id string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id::text FROM users WHERE id::text=$1 AND deleted_at IS NULL FOR UPDATE`, target).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(404, gin.H{"error": "Account not found"})
		return
	}
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	action := "UNLOCK_ACCOUNT"
	if reset {
		action = "RESET_MFA"
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE auth_account_security SET encrypted_totp_secret=NULL,mfa_enrolled_at=NULL,last_totp_step=-1 WHERE user_id=$1`, id)
		if err == nil {
			_, err = tx.ExecContext(c.Request.Context(), `UPDATE auth_recovery_codes SET consumed_at=COALESCE(consumed_at,NOW()) WHERE user_id=$1`, id)
		}
		if err == nil {
			_, err = tx.ExecContext(c.Request.Context(), `UPDATE users SET token_version=token_version+1,updated_at=NOW() WHERE id=$1`, id)
		}
	} else {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE auth_account_security SET failed_attempts=0,locked_until=NULL WHERE user_id=$1`, id)
	}
	actor := c.GetString(ContextUserID)
	if err == nil {
		err = h.audit.RecordTx(c.Request.Context(), tx, auditlog.Entry{UserID: &actor, UserName: c.GetString(ContextUsername), UserRole: "ADMIN", Service: "core-go", Module: "admin", Action: action, ResourceType: "User", ResourceID: id, Details: map[string]any{"reason": strings.TrimSpace(req.Reason), "identity_verified": req.IdentityVerified, "sessions_revoked": reset}, IPAddress: c.ClientIP(), Status: "SUCCESS"})
	}
	if err == nil {
		err = tx.Commit()
	}
	if err != nil {
		securityUnavailable(c, err)
		return
	}
	c.JSON(200, gin.H{"id": id, "sessions_revoked": reset})
}
