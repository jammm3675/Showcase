package api

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"showcase/backend-go/database"
	"showcase/backend-go/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

type CreateShowcaseRequest struct {
	TelegramID  int64  `json:"telegram_id" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
}

func CreateShowcase(c *gin.Context) {
	var req CreateShowcaseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	var user models.User
	if err := database.DB.Where("telegram_id = ?", req.TelegramID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found for the given Telegram ID"})
		return
	}

	showcase := models.Showcase{
		UserID:      user.ID,
		Title:       req.Title,
		Description: req.Description,
	}

	if err := database.DB.Create(&showcase).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create showcase in database"})
		return
	}

	c.JSON(http.StatusOK, showcase)
}

func GetUserShowcases(c *gin.Context) {
	telegramIDStr := c.Param("telegram_id")
	telegramID, err := strconv.ParseInt(telegramIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Telegram ID format"})
		return
	}

	var user models.User
	if err := database.DB.Where("telegram_id = ?", telegramID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var showcases []models.Showcase
	if err := database.DB.Preload("ShowcaseNfts").Where("user_id = ?", user.ID).Find(&showcases).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve showcases"})
		return
	}

	if showcases == nil {
		showcases = make([]models.Showcase, 0)
	}

	c.JSON(http.StatusOK, showcases)
}

func ExportShowcase(c *gin.Context) {
	showcaseIDStr := c.Param("id")
	showcaseID, err := strconv.ParseUint(showcaseIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Showcase ID format"})
		return
	}

	var showcase models.Showcase
	if err := database.DB.Preload("ShowcaseNfts").First(&showcase, uint(showcaseID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Showcase not found"})
		return
	}

	if len(showcase.ShowcaseNfts) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot export a showcase with no NFTs"})
		return
	}

	imageUrls := make([]string, len(showcase.ShowcaseNfts))
	for i, nft := range showcase.ShowcaseNfts {
		imageUrls[i] = nft.Image
	}

	pythonServiceURL := "http://localhost:8081/api/export/collage"
	requestBody, _ := json.Marshal(map[string][]string{
		"image_urls": imageUrls,
	})

	resp, err := http.Post(pythonServiceURL, "application/json", bytes.NewBuffer(requestBody))
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed to contact collage service"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Collage service returned an error", "details": string(bodyBytes)})
		return
	}

    c.Header("Content-Type", "image/png")
    c.Header("Content-Disposition", "attachment; filename=collage.png")
	io.Copy(c.Writer, resp.Body)
}
