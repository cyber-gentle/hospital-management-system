package admin

import (
	"database/sql"
	"net/mail"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/common"
	"hospital-hims/services/core-go/internal/common/operations"
)

type Handler struct {
	db     *sql.DB
	writer *auditlog.Writer
	tokens *auth.TokenService
}

func NewHandler(db *sql.DB, writer *auditlog.Writer, tokens *auth.TokenService) *Handler {
	return &Handler{db, writer, tokens}
}
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) {
	r := api.Group("/admin", auth.AuthRequired(h.tokens))
	read := r.Group("", auth.RequirePermission(h.db, "admin", "read"), auth.RequireRole("ADMIN", "AUDITOR"))
	read.GET("/directory", h.Directory)
	write := r.Group("", auth.RequirePermission(h.db, "admin", "write"), auth.RequireRole("ADMIN"))
	write.POST("/users", h.CreateUser)
	write.POST("/users/:id/reset-password", h.ResetPassword)
	write.POST("/users/:id/reactivate", h.Reactivate)
	write.POST("/users/:id/permissions", h.GrantPermission)
	write.DELETE("/users/:id/permissions/:permission", h.RevokePermission)
}

// Lock and re-check the actual actor in the same transaction as the change.
// This prevents a concurrently demoted administrator from completing a write.
func (h *Handler) begin(c *gin.Context) *sql.Tx {
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return nil
	}
	var role string
	var version int
	err = tx.QueryRowContext(c.Request.Context(), "SELECT role,token_version FROM users WHERE id=$1 AND is_active AND deleted_at IS NULL FOR SHARE", c.GetString(auth.ContextUserID)).Scan(&role, &version)
	if err != nil {
		common.Rollback(tx)
		operations.OperationError(c, err)
		return nil
	}
	if version != c.GetInt(auth.ContextTokenVersion) {
		common.Rollback(tx)
		c.JSON(401, gin.H{"error": "Session revoked; sign in again"})
		return nil
	}
	if role != "ADMIN" {
		common.Rollback(tx)
		c.JSON(403, gin.H{"error": "Current ADMIN role required"})
		return nil
	}
	return tx
}
func (h *Handler) Directory(c *gin.Context) {
	// A repeatable-read snapshot keeps displayed grants and accounts consistent.
	tx, err := h.db.BeginTx(c.Request.Context(), &sql.TxOptions{ReadOnly: true, Isolation: sql.LevelRepeatableRead})
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var users, permissions, roleGrants, userGrants string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT
 COALESCE((SELECT jsonb_agg(row_to_json(u) ORDER BY username) FROM (SELECT id,username,email,first_name,last_name,role,department,is_active FROM users WHERE deleted_at IS NULL) u),'[]'::jsonb)::text,
 COALESCE((SELECT jsonb_agg(row_to_json(p) ORDER BY id) FROM (SELECT id,module,action,description FROM permissions) p),'[]'::jsonb)::text,
 COALESCE((SELECT jsonb_agg(row_to_json(r) ORDER BY role,permission_id) FROM role_permissions r),'[]'::jsonb)::text,
 COALESCE((SELECT jsonb_agg(row_to_json(g) ORDER BY user_id,permission_id) FROM (SELECT user_id,permission_id FROM user_permissions) g),'[]'::jsonb)::text
 `).Scan(&users, &permissions, &roleGrants, &userGrants)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	// Database-built JSON contains only the explicitly selected non-secret columns.
	c.Data(200, "application/json", []byte(`{"users":`+users+`,"permissions":`+permissions+`,"roleGrants":`+roleGrants+`,"userGrants":`+userGrants+`,"canManage":`+map[bool]string{true: "true", false: "false"}[c.GetString(auth.ContextUserRole) == "ADMIN"]+`}`))
}

type createInput struct {
	Username   string `json:"username"`
	Email      string `json:"email"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	Role       string `json:"role"`
	Department string `json:"department"`
	Password   string `json:"password"`
}

func validText(s string, max int) bool {
	return strings.TrimSpace(s) != "" && utf8.RuneCountInString(s) <= max
}
func validPassword(s string) bool {
	return strings.TrimSpace(s) != "" && utf8.RuneCountInString(s) >= 12 && len(s) <= 72
}
func (h *Handler) CreateUser(c *gin.Context) {
	var input createInput
	if !operations.BindOperation(c, &input) {
		return
	}
	email, err := mail.ParseAddress(input.Email)
	if err != nil || email.Address != input.Email || len(input.Email) > 255 || !validText(input.Username, 100) || strings.IndexFunc(input.Username, unicode.IsSpace) >= 0 || !validText(input.FirstName, 100) || !validText(input.LastName, 100) || !validText(input.Department, 100) || !validText(input.Role, 50) || !validPassword(input.Password) {
		c.JSON(400, gin.H{"error": "Valid named staff details and a password of at least 12 characters (maximum 72 bytes) are required"})
		return
	}
	hash, err := auth.HashPassword(input.Password)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	tx := h.begin(c)
	if tx == nil {
		return
	}
	defer common.Rollback(tx)
	var known bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS(SELECT 1 FROM role_permissions WHERE role=$1 UNION ALL SELECT 1 FROM users WHERE role=$1 AND deleted_at IS NULL)`, input.Role).Scan(&known)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !known {
		c.JSON(400, gin.H{"error": "Choose an existing staff role"})
		return
	}
	var id string
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO users(username,email,password_hash,first_name,last_name,role,department,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8) RETURNING id`, input.Username, input.Email, hash, input.FirstName, input.LastName, input.Role, input.Department, c.GetString(auth.ContextUserID)).Scan(&id)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !operations.CommitOperation(c, tx, h.writer, "admin", "CREATE_USER", "USER", id, map[string]interface{}{"role": input.Role}) {
		return
	}
	c.JSON(201, gin.H{"id": id, "username": input.Username, "role": input.Role})
}
func (h *Handler) GrantPermission(c *gin.Context) {
	var input struct {
		PermissionID string `json:"permissionId"`
	}
	if !operations.BindOperation(c, &input) {
		return
	}
	h.permission(c, input.PermissionID, true)
}
func (h *Handler) RevokePermission(c *gin.Context) { h.permission(c, c.Param("permission"), false) }
func (h *Handler) permission(c *gin.Context, permission string, grant bool) {
	if !validText(permission, 100) {
		c.JSON(400, gin.H{"error": "A registered permission is required"})
		return
	}
	tx := h.begin(c)
	if tx == nil {
		return
	}
	defer common.Rollback(tx)
	var id string
	if err := tx.QueryRowContext(c.Request.Context(), "SELECT id FROM users WHERE id=$1 AND deleted_at IS NULL FOR SHARE", c.Param("id")).Scan(&id); err != nil {
		operations.OperationError(c, err)
		return
	}
	var found string
	if err := tx.QueryRowContext(c.Request.Context(), "SELECT id FROM permissions WHERE id=$1 FOR SHARE", permission).Scan(&found); err != nil {
		operations.OperationError(c, err)
		return
	}
	action := "GRANT_USER_PERMISSION"
	var err error
	if grant {
		_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO user_permissions(user_id,permission_id,granted_by) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, id, permission, c.GetString(auth.ContextUserID))
	} else {
		action = "REVOKE_USER_PERMISSION"
		_, err = tx.ExecContext(c.Request.Context(), "DELETE FROM user_permissions WHERE user_id=$1 AND permission_id=$2", id, permission)
	}
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !operations.CommitOperation(c, tx, h.writer, "admin", action, "USER", id, map[string]interface{}{"permissionId": permission}) {
		return
	}
	c.JSON(200, gin.H{"id": id, "permissionId": permission, "granted": grant, "note": "Role-inherited permissions are unchanged"})
}

// ResetPassword changes credentials without activating an inactive account.
func (h *Handler) ResetPassword(c *gin.Context) {
	var input struct {
		Password string `json:"password"`
		Reason   string `json:"reason"`
	}
	if !operations.BindOperation(c, &input) {
		return
	}
	if !validPassword(input.Password) || !validText(input.Reason, 500) {
		c.JSON(400, gin.H{"error": "A password of at least 12 characters (maximum 72 bytes) and a reason (maximum 500 characters) are required"})
		return
	}
	hash, err := auth.HashPassword(input.Password)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	h.changeAccount(c, hash, input.Reason, false)
}
func (h *Handler) Reactivate(c *gin.Context) {
	var input struct {
		Reason string `json:"reason"`
	}
	if !operations.BindOperation(c, &input) {
		return
	}
	if !validText(input.Reason, 500) {
		c.JSON(400, gin.H{"error": "A reactivation reason (maximum 500 characters) is required"})
		return
	}
	h.changeAccount(c, "", input.Reason, true)
}
func (h *Handler) changeAccount(c *gin.Context, hash, reason string, reactivate bool) {
	tx := h.begin(c)
	if tx == nil {
		return
	}
	defer common.Rollback(tx)
	var active bool
	err := tx.QueryRowContext(c.Request.Context(), "SELECT is_active FROM users WHERE id=$1 AND deleted_at IS NULL FOR UPDATE", c.Param("id")).Scan(&active)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if reactivate && active {
		c.JSON(409, gin.H{"error": "Account is already active"})
		return
	}
	action := "RESET_PASSWORD"
	if reactivate {
		action = "REACTIVATE_USER"
		_, err = tx.ExecContext(c.Request.Context(), "UPDATE users SET is_active=true,token_version=token_version+1,updated_by=$2,updated_at=NOW() WHERE id=$1", c.Param("id"), c.GetString(auth.ContextUserID))
	} else {
		_, err = tx.ExecContext(c.Request.Context(), "UPDATE users SET password_hash=$2,token_version=token_version+1,updated_by=$3,updated_at=NOW() WHERE id=$1", c.Param("id"), hash, c.GetString(auth.ContextUserID))
	}
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !operations.CommitOperation(c, tx, h.writer, "admin", action, "USER", c.Param("id"), map[string]interface{}{"reason": strings.TrimSpace(reason), "sessionsRevoked": true}) {
		return
	}
	c.JSON(200, gin.H{"id": c.Param("id"), "sessionsRevoked": true})
}
