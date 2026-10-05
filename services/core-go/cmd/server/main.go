package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/config"
	"hospital-hims/services/core-go/internal/database"
	"hospital-hims/services/core-go/internal/internalapi"
	"hospital-hims/services/core-go/internal/modules/medicalrecords"
	"hospital-hims/services/core-go/internal/modules/nursing"
)

func main() {
	// Configuration is validated before anything else starts. A missing or
	// placeholder JWT_SECRET / INTERNAL_SERVICE_KEY is fatal: the service must
	// not run in a state where it would sign tokens with a published default.
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("[FATAL] invalid configuration: %v", err)
	}

	tokens := auth.NewTokenService(cfg.JWTSecret)

	router := gin.Default()

	// 1. Database connection & migrations
	var db *database.DB
	var auditWriter *auditlog.Writer
	var userStore auth.UserStore

	if cfg.DatabaseURL != "" {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		db, err = database.Connect(ctx, cfg.DatabaseURL)
		cancel()

		if err != nil {
			log.Printf("[WARN] PostgreSQL connection failed: %v. Running in limited mode without DB.", err)
		} else {
			defer db.Close()

			migCtx, migCancel := context.WithTimeout(context.Background(), 30*time.Second)
			if err := db.RunMigrations(migCtx); err != nil {
				log.Fatalf("[FATAL] Failed running database migrations: %v", err)
			}
			migCancel()

			auditWriter = auditlog.NewWriter(db.DB)
			userStore = auth.NewPostgresUserStore(db.DB)
		}
	} else {
		log.Println("[WARN] DATABASE_URL not set. Running without a database: login and internal service endpoints are unavailable.")
	}

	// 2. Register Internal API for interop-py (Audit Logging & AuthZ checks)
	if db != nil && auditWriter != nil {
		internalHandler := internalapi.NewHandler(db.DB, auditWriter)
		internalHandler.RegisterRoutes(router, cfg.InternalServiceKey)
	} else {
		log.Println("[WARN] Internal API (/internal/*) not registered: interop-py audit and authz calls will fail.")
	}

	// 3. Health check endpoints
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "core-go",
		})
	})

	loginHandler := auth.NewLoginHandler(userStore, tokens, auditWriter)

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

		// Public authentication routes.
		apiV1.POST("/auth/login", loginHandler.Handle)

		// Protected routes.
		apiV1.GET("/auth/me", auth.AuthRequired(tokens), func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"user_id":    c.GetString(auth.ContextUserID),
				"username":   c.GetString(auth.ContextUsername),
				"role":       c.GetString(auth.ContextUserRole),
				"department": c.GetString(auth.ContextDepartment),
			})
		})

		// Initialize Medical Records Module
		if db != nil && auditWriter != nil {
			mrHandler := medicalrecords.NewHandler(db.DB, auditWriter, tokens)
			mrHandler.RegisterRoutes(apiV1)

			// Initialize Nursing Services Module
			nsHandler := nursing.NewHandler(db.DB, auditWriter, tokens)
			nsHandler.RegisterRoutes(apiV1)
		}
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
	}

	// Shut down cleanly on SIGINT/SIGTERM so in-flight audit writes finish.
	go func() {
		log.Printf("Starting core-go service on port %s...", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to run server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down core-go service...")

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("[WARN] Graceful shutdown failed: %v", err)
	}
}
