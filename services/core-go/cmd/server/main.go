package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/database"
	"hospital-hims/services/core-go/internal/internalapi"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := gin.Default()

	// 1. Database connection & Auto-migrations
	dbURL := os.Getenv("DATABASE_URL")
	var db *database.DB
	var auditWriter *auditlog.Writer

	if dbURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		var err error
		db, err = database.Connect(ctx, dbURL)
		cancel()

		if err != nil {
			log.Printf("[WARN] PostgreSQL connection failed: %v. Running in limited mode without DB.", err)
		} else {
			defer db.Close()

			// Run pending embedded database migrations
			migCtx, migCancel := context.WithTimeout(context.Background(), 30*time.Second)
			if err := db.RunMigrations(migCtx); err != nil {
				log.Fatalf("[FATAL] Failed running database migrations: %v", err)
			}
			migCancel()

			auditWriter = auditlog.NewWriter(db.DB)
		}
	} else {
		log.Println("[INFO] DATABASE_URL not set. Running in offline/mock mode.")
	}

	// 2. Register Internal API for interop-py (Audit Logging & AuthZ checks)
	if db != nil && auditWriter != nil {
		internalHandler := internalapi.NewHandler(db.DB, auditWriter)
		internalHandler.RegisterRoutes(router)
	}

	// 3. Health check endpoints
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "core-go",
		})
	})

	apiV1 := router.Group("/api/v1")
	{
		apiV1.GET("/health", func(c *gin.Context) {
			dbStatus := "disconnected"
			if db != nil {
				dbStatus = "connected"
			}
			c.JSON(http.StatusOK, gin.H{
				"status":   "healthy",
				"service":  "core-go",
				"version":  "v1",
				"database": dbStatus,
			})
		})

		// Public authentication route for login/JWT token generation
		apiV1.POST("/auth/login", func(c *gin.Context) {
			type LoginRequest struct {
				Username string `json:"username" binding:"required"`
				Password string `json:"password" binding:"required"`
				Role     string `json:"role"`
			}
			var req LoginRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// For initial dev/seed: authenticate with fallback mock if users table not seeded
			role := req.Role
			if role == "" {
				role = "DOCTOR"
			}

			token, err := auth.GenerateToken("usr_demo_01", req.Username, role, "Clinical Services")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"token": token,
				"user": gin.H{
					"id":         "usr_demo_01",
					"username":   req.Username,
					"role":       role,
					"department": "Clinical Services",
				},
			})
		})

		// Protected /me endpoint
		apiV1.GET("/auth/me", auth.AuthRequired(), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"user_id":    c.GetString(auth.ContextUserID),
				"username":   c.GetString(auth.ContextUsername),
				"role":       c.GetString(auth.ContextUserRole),
				"department": c.GetString(auth.ContextDepartment),
			})
		})
	}

	log.Printf("Starting core-go service on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
