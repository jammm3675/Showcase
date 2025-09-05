package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"showcase/backend-go/database"
	"showcase/backend-go/models"
	"showcase/backend-go/utils"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
)

// --- Cache ---
var nftCache = cache.New(5*time.Minute, 10*time.Minute)

// --- Structs for Wallet Connection ---
type WalletConnectRequest struct {
	TelegramID    int64  `json:"telegram_id"`
	WalletAddress string `json:"wallet_address"`
	Username      string `json:"username"`
	FirstName     string `json:"first_name"`
	InitData      string `json:"init_data"`
}

// --- Structs for NFT Fetching ---

// Simplified NFT structure for our API response
type SimpleNft struct {
	Address        string `json:"address"`
	Name           string `json:"name"`
	Description    string `json:"description"`
	Image          string `json:"image"`
	CollectionName string `json:"collection_name"`
}

// Structs to parse the response from tonapi.io
type NftApiResponse struct {
	NftItems []NftItem `json:"nft_items"`
}
type NftItem struct {
	Address    string     `json:"address"`
	Collection Collection `json:"collection"`
	Metadata   Metadata   `json:"metadata"`
	Previews   []Preview  `json:"previews"`
}
type Collection struct {
	Name string `json:"name"`
}
type Metadata struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Image       string `json:"image"`
}
type Preview struct {
	Resolution string `json:"resolution"`
	URL        string `json:"url"`
}

// --- Handlers ---

func ConnectWallet(c *gin.Context) {
	var req WalletConnectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "TELEGRAM_BOT_TOKEN is not configured"})
		return
	}

	isValid, err := utils.ValidateInitData(req.InitData, botToken)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !isValid {
		c.JSON(http.StatusForbidden, gin.H{"error": "Invalid initData: validation failed"})
		return
	}

	parsedData, _ := url.ParseQuery(req.InitData)
	userJSON := parsedData.Get("user")
	var userData struct {
		ID int64 `json:"id"`
	}
	if err := json.Unmarshal([]byte(userJSON), &userData); err != nil || userData.ID != req.TelegramID {
		c.JSON(http.StatusForbidden, gin.H{"error": "Telegram ID mismatch"})
		return
	}

	var user models.User
	result := database.DB.Where(models.User{TelegramID: req.TelegramID}).First(&user)
	if result.Error != nil {
		user = models.User{
			TelegramID:    req.TelegramID,
			WalletAddress: req.WalletAddress,
			Username:      req.Username,
			FirstName:     req.FirstName,
		}
		database.DB.Create(&user)
	} else {
		user.WalletAddress = req.WalletAddress
		user.Username = req.Username
		user.FirstName = req.FirstName
		database.DB.Save(&user)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Wallet connected successfully."})
}

func GetNfts(c *gin.Context) {
	walletAddress := c.Param("wallet_address")

	// Check cache first
	if cachedNfts, found := nftCache.Get(walletAddress); found {
		fmt.Println("Returning cached NFTs for", walletAddress)
		c.JSON(http.StatusOK, gin.H{"nfts": cachedNfts})
		return
	}

	// Fetch from tonapi.io
	tonapiUrl := fmt.Sprintf("https://tonapi.io/v2/accounts/%s/nfts?limit=100&offset=0&indirect_ownership=false", walletAddress)
	resp, err := http.Get(tonapiUrl)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Failed to contact TonAPI"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		c.JSON(resp.StatusCode, gin.H{"error": "TonAPI returned non-200 status"})
		return
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read TonAPI response"})
		return
	}

	var tonapiResponse NftApiResponse
	if err := json.Unmarshal(body, &tonapiResponse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse TonAPI response"})
		return
	}

	// Transform to simplified format
	simpleNfts := make([]SimpleNft, 0, len(tonapiResponse.NftItems))
	for _, item := range tonapiResponse.NftItems {
		nft := SimpleNft{
			Address:        item.Address,
			Name:           item.Metadata.Name,
			Description:    item.Metadata.Description,
			Image:          item.Metadata.Image,
			CollectionName: item.Collection.Name,
		}
		if nft.Image == "" && len(item.Previews) > 0 {
			nft.Image = item.Previews[len(item.Previews)-1].URL // Use last preview as fallback
		}
		simpleNfts = append(simpleNfts, nft)
	}

	// Store in cache and return
	nftCache.Set(walletAddress, simpleNfts, cache.DefaultExpiration)
	fmt.Println("Cached new NFTs for", walletAddress)
	c.JSON(http.StatusOK, gin.H{"nfts": simpleNfts})
}
