package auth

import (
	"crypto/subtle"
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	ContextUserID     = "auth_user_id"
	ContextUsername   = "auth_username"
	ContextUserRole   = "auth_user_role"
	ContextDepartment = "auth_department"
)

// AuthRequired validates bearer tokens on protected endpoints.
func AuthRequired(tokens *TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Missing Authorization header",
			})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid Authorization format. Expected: Bearer <token>",
			})
			return
		}

		claims, err := tokens.Validate(parts[1])
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Invalid or expired token",
			})
			return
		}

		// Inject user context
		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextUsername, claims.Username)
		c.Set(ContextUserRole, claims.Role)
		c.Set(ContextDepartment, claims.Department)

		c.Next()
	}
}

// RequireRole ensures the authenticated user possesses one of the allowed roles
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(ContextUserRole)
		if !exists {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "User role not found in context",
			})
			return
		}

		userRole, ok := roleVal.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Invalid role type",
			})
			return
		}

		// ADMIN always bypasses role checks
		if userRole == "ADMIN" {
			c.Next()
			return
		}

		for _, allowed := range allowedRoles {
			if strings.EqualFold(userRole, allowed) {
				c.Next()
				return
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "Insufficient permissions to access this resource",
		})
	}
}

// InternalServiceAuthRequired ensures requests to internal endpoints come from
// trusted services (like interop-py) via a shared secret header.
//
// The expected key is injected at construction rather than read from the
// environment per request, so a service started without INTERNAL_SERVICE_KEY
// fails at boot instead of accepting a placeholder value that is published in
// this repository's compose files and documentation.
func InternalServiceAuthRequired(internalKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		providedKey := c.GetHeader("X-Internal-Service-Key")
		if subtle.ConstantTimeCompare([]byte(providedKey), []byte(internalKey)) != 1 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Unauthorized internal service call",
			})
			return
		}

		c.Next()
	}
}

// RequirePermission checks if a user has a specific permission via role defaults OR per-user overrides
func RequirePermission(db *sql.DB, module, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, _ := c.Get(ContextUserRole)
		userRole, _ := roleVal.(string)

		userIDVal, _ := c.Get(ContextUserID)
		userID, _ := userIDVal.(string)
		if userID == "" || userRole == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			return
		}
		if db != nil {
			var currentUsername, currentDepartment string
			err := db.QueryRowContext(c.Request.Context(), `SELECT role,username,department FROM users WHERE id=$1 AND is_active=true AND deleted_at IS NULL`, userID).Scan(&userRole, &currentUsername, &currentDepartment)
			if err == sql.ErrNoRows {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Account is inactive or unavailable"})
				return
			}
			if err != nil {
				c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "Authorization service unavailable"})
				return
			}
			c.Set(ContextUserRole, userRole)
			c.Set(ContextUsername, currentUsername)
			c.Set(ContextDepartment, currentDepartment)
		}

		if userRole == "ADMIN" {
			c.Next()
			return
		}

		permissionID := strings.ToLower(module + ":" + action)
		if db == nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "Authorization service unavailable"})
			return
		}

		query := `
			SELECT EXISTS (
				SELECT 1 FROM role_permissions WHERE role = $1 AND permission_id = $2
				UNION ALL
				SELECT 1 FROM user_permissions WHERE user_id = $3 AND permission_id = $2
			)`

		var allowed bool
		err := db.QueryRowContext(c.Request.Context(), query, userRole, permissionID, userID).Scan(&allowed)

		if err != nil {
			c.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"error": "Authorization service unavailable"})
			return
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions to access this resource",
			})
			return
		}

		c.Next()
	}
}
