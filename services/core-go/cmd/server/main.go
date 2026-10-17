package main

import (
	"context"
	"database/sql"
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
	"hospital-hims/services/core-go/internal/modules/accounting"
	"hospital-hims/services/core-go/internal/modules/admin"
	"hospital-hims/services/core-go/internal/modules/ae"
	"hospital-hims/services/core-go/internal/modules/appointment"
	"hospital-hims/services/core-go/internal/modules/audit"
	"hospital-hims/services/core-go/internal/modules/billing"
	"hospital-hims/services/core-go/internal/modules/hr"
	"hospital-hims/services/core-go/internal/modules/inventory"
	"hospital-hims/services/core-go/internal/modules/maternity"
	"hospital-hims/services/core-go/internal/modules/medicalrecords"
	"hospital-hims/services/core-go/internal/modules/mortuary"
	"hospital-hims/services/core-go/internal/modules/nursing"
	"hospital-hims/services/core-go/internal/modules/pharmacy"
	"hospital-hims/services/core-go/internal/modules/reporting"
	"hospital-hims/services/core-go/internal/modules/substore"
	"hospital-hims/services/core-go/internal/modules/theatre"
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

	// The legacy password-only handler is not registered on the live server.
	_ = userStore
	mfaKey, err := config.LoadMFAEncryptionKey()
	if err != nil {
		log.Fatal(err)
	}
	var securityDB *sql.DB
	if db != nil {
		securityDB = db.DB
	}
	securityHandler, err := auth.NewSecurityHandler(securityDB, tokens, auditWriter, mfaKey)
	if err != nil {
		log.Fatal(err)
	}

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
		apiV1.POST("/auth/login", securityHandler.HandleLogin)
		if db != nil && auditWriter != nil {
			securityHandler.RegisterAdminRoutes(apiV1)
		}

		// Protected routes.
		var sessionDB *sql.DB
		if db != nil {
			sessionDB = db.DB
		}
		apiV1.GET("/auth/me", auth.AuthRequired(tokens), auth.RequireActiveSession(sessionDB), func(c *gin.Context) {
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

			// Initialize Accounts and Billing Module
			billingHandler := billing.NewHandler(db.DB, auditWriter, tokens)
			billingHandler.RegisterRoutes(apiV1)

			// Initialize Pharmacy Module
			pharmacyHandler := pharmacy.NewHandler(db.DB, auditWriter, tokens)
			pharmacyHandler.RegisterRoutes(apiV1)

			// Initialize Appointment Scheduling Module
			apptHandler := appointment.NewHandler(db.DB, auditWriter, tokens)
			apptHandler.RegisterRoutes(apiV1)

			// Initialize Accounting Module
			accHandler := accounting.NewHandler(db.DB, auditWriter, tokens)
			accHandler.RegisterRoutes(apiV1)

			// Initialize Sub-store Module
			ssHandler := substore.NewHandler(db.DB, auditWriter, tokens)
			ssHandler.RegisterRoutes(apiV1)
			theatre.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			reporting.NewHandler(db.DB, tokens).RegisterRoutes(apiV1)
			admin.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			ae.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			maternity.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			hr.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			inventory.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			mortuary.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
			audit.NewHandler(db.DB, auditWriter, tokens).RegisterRoutes(apiV1)
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
