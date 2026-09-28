package auth

import (
	"crypto/subtle"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	ContextUserID     = "auth_user_id"
	ContextUsername   = "auth_username"
	ContextUserRole   = "auth_user_role"
	ContextDepartment = "auth_department"
)

// AuthRequired validates bearer tokens on protected endpoints
func AuthRequired() gin.HandlerFunc {
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

		claims, err := ValidateToken(parts[1])
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

// InternalServiceAuthRequired ensures requests to internal endpoints
// come from trusted services (like interop-py) via shared secret header
func InternalServiceAuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		internalKey := os.Getenv("INTERNAL_SERVICE_KEY")
		if internalKey == "" {
			internalKey = "dev_internal_service_key_secret"
		}

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
