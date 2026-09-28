package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// Read port from environment or fallback to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Initialize Gin engine with default logger and recovery middleware
	router := gin.Default()

	// Base health check endpoints
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "core-go",
		})
	})

	apiV1 := router.Group("/api/v1")
	{
		apiV1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":  "healthy",
				"service": "core-go",
				"version": "v1",
			})
		})
	}

	log.Printf("Starting core-go service on port %s...", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
