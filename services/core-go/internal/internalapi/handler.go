package internalapi

import (
	"database/sql"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
)

type Handler struct {
	auditWriter *auditlog.Writer
	db          *sql.DB
}

func NewHandler(db *sql.DB, auditWriter *auditlog.Writer) *Handler {
	return &Handler{
		db:          db,
		auditWriter: auditWriter,
	}
}

// RegisterRoutes mounts the internal endpoints with the internal service auth
// guard. internalKey is the shared secret the Python interop service presents.
func (h *Handler) RegisterRoutes(router *gin.Engine, internalKey string) {
	internal := router.Group("/internal")
	internal.Use(auth.InternalServiceAuthRequired(internalKey))
	{
		internal.POST("/audit-log", h.HandleAuditLog)
		internal.GET("/authz/check", h.HandleAuthzCheck)
	}
}

type AuditLogRequest struct {
	UserID       *string                `json:"user_id,omitempty"`
	UserName     string                 `json:"user_name,omitempty"`
	UserRole     string                 `json:"user_role,omitempty"`
	Module       string                 `json:"module" binding:"required"`
	Action       string                 `json:"action" binding:"required"`
	ResourceType string                 `json:"resource_type" binding:"required"`
	ResourceID   string                 `json:"resource_id" binding:"required"`
	Details      map[string]interface{} `json:"details,omitempty"`
	Status       string                 `json:"status"`
}

// HandleAuditLog receives audit logs from interop-py and writes them to the DB
func (h *Handler) HandleAuditLog(c *gin.Context) {
	if h.auditWriter == nil {
		// Reached only if the handler was constructed without a writer. The
		// server does not register these routes in that state, but returning a
		// 503 is preferable to dereferencing nil if that ever changes.
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging is unavailable"})
		return
	}

	var req AuditLogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry := auditlog.Entry{
		UserID:       req.UserID,
		UserName:     req.UserName,
		UserRole:     req.UserRole,
		Service:      "interop-py",
		Module:       req.Module,
		Action:       req.Action,
		ResourceType: req.ResourceType,
		ResourceID:   req.ResourceID,
		Details:      req.Details,
		IPAddress:    c.ClientIP(),
		Status:       req.Status,
	}

	if err := h.auditWriter.Record(c.Request.Context(), entry); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record audit log"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "recorded",
		"service": "core-go",
	})
}

// HandleAuthzCheck performs authoritative permission matrix checks for interop-py
func (h *Handler) HandleAuthzCheck(c *gin.Context) {
	role := c.Query("role")
	module := c.Query("module")
	action := c.Query("action")

	if role == "" || module == "" || action == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Missing required query parameters: role, module, action",
		})
		return
	}

	// ADMIN has universal access
	if strings.EqualFold(role, "ADMIN") {
		c.JSON(http.StatusOK, gin.H{
			"allowed": true,
			"role":    role,
			"reason":  "Administrator override",
		})
		return
	}

	permissionID := strings.ToLower(module + ":" + action)

	if h.db == nil {
		// cmd/server/main.go does not register these routes without a database,
		// so this is unreachable in practice. Refusing is still the right answer
		// if that ever changes: an unavailable authority must never resolve to a
		// permission decision.
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Authorization service unavailable"})
		return
	}

	const query = `
		SELECT EXISTS (
			SELECT 1 FROM role_permissions
			WHERE role = $1 AND permission_id = $2
		)`

	var allowed bool
	if err := h.db.QueryRowContext(c.Request.Context(), query, role, permissionID).Scan(&allowed); err != nil {
		// Deliberately no fallback matrix here. A second, hard-coded copy of the
		// permission rules drifts from role_permissions over time, and resolving
		// a failed query to "allowed" would grant access the matrix never
		// granted. Note that an *unseeded* table is not this case -- it returns a
		// real `false`. This branch is a genuine infrastructure failure, so fail
		// closed and let the caller retry rather than guessing an answer.
		log.Printf("[AUTHZ] permission lookup failed for role=%q permission=%q: %v", role, permissionID, err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Authorization service unavailable"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"allowed":       allowed,
		"role":          role,
		"permission_id": permissionID,
		"source":        "database",
	})
}
