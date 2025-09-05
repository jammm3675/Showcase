package main

import (
	"log"
	"showcase/backend-go/api"
	"showcase/backend-go/database"
	"showcase/backend-go/models"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Connect to the database
	database.Connect()

	// Auto-migrate the schema
	err = database.DB.AutoMigrate(&models.User{}, &models.Showcase{}, &models.ShowcaseNft{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	// Set up Gin router
	r := gin.Default()

	// API routes
	apiGroup := r.Group("/api")
	{
		// User and NFT routes
		apiGroup.POST("/connect_wallet", api.ConnectWallet)
		apiGroup.GET("/nfts/:wallet_address", api.GetNfts)

		// Showcase routes
		apiGroup.POST("/showcases", api.CreateShowcase)
		apiGroup.GET("/users/:telegram_id/showcases", api.GetUserShowcases)
		apiGroup.POST("/showcases/:id/export", api.ExportShowcase)
	}

	// Start the server
	log.Println("Starting server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}
