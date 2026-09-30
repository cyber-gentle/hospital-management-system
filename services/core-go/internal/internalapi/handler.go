package internalapi

import (
	"database/sql"
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

// RegisterRoutes mounts the internal endpoints with the internal service auth guard
func (h *Handler) RegisterRoutes(router *gin.Engine) {
	internal := router.Group("/internal")
	internal.Use(auth.InternalServiceAuthRequired())
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

	var exists bool
	if h.db != nil {
		query := `
			SELECT EXISTS (
				SELECT 1 FROM role_permissions
				WHERE role = $1 AND permission_id = $2
			)`

		err := h.db.QueryRowContext(c.Request.Context(), query, role, permissionID).Scan(&exists)
		if err == nil {
			c.JSON(http.StatusOK, gin.H{
				"allowed":       exists,
				"role":          role,
				"permission_id": permissionID,
				"source":        "database",
			})
			return
		}
	}

	// Fallback check on standard role matrix if role_permissions table is still unseeded or db is nil
	allowed := fallbackAuthzCheck(role, module, action)
	c.JSON(http.StatusOK, gin.H{
		"allowed": allowed,
		"role":    role,
		"source":  "rule_fallback",
	})
}

// fallbackAuthzCheck provides default rule mapping if DB permissions aren't seeded yet
func fallbackAuthzCheck(role, module, action string) bool {
	upperRole := strings.ToUpper(role)
	lowerModule := strings.ToLower(module)

	switch upperRole {
	case "DOCTOR":
		return lowerModule == "medicalrecords" || lowerModule == "gopd" || lowerModule == "laboratory" || lowerModule == "radiology"
	case "NURSE":
		return lowerModule == "nursing" || lowerModule == "medicalrecords" || lowerModule == "vitals"
	case "PHARMACIST":
		return lowerModule == "pharmacy" || lowerModule == "substore"
	case "ACCOUNTANT", "CHIEF_ACCOUNTANT":
		return lowerModule == "billing" || lowerModule == "accounting" || lowerModule == "nhia"
	case "NHIA_OFFICER":
		return lowerModule == "nhia" || lowerModule == "billing"
	case "LAB_SCIENTIST":
		return lowerModule == "laboratory"
	case "RADIOLOGIST":
		return lowerModule == "radiology"
	case "AUDITOR":
		return action == "view" || action == "read" || action == "inspect"
	default:
		return false
	}
}
