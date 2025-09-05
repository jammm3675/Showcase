package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/url"
	"sort"
	"strings"
)

// ValidateInitData checks if the initData string from Telegram is authentic.
func ValidateInitData(initData, botToken string) (bool, error) {
	// Parse the initData string
	parsedQuery, err := url.ParseQuery(initData)
	if err != nil {
		return false, fmt.Errorf("failed to parse initData: %w", err)
	}

	hash := parsedQuery.Get("hash")
	if hash == "" {
		return false, fmt.Errorf("initData is missing hash")
	}

	// Prepare the data-check-string
	var dataCheckParts []string
	for k, v := range parsedQuery {
		if k != "hash" {
			// Using v[0] as url.ParseQuery returns a map of string to []string
			dataCheckParts = append(dataCheckParts, fmt.Sprintf("%s=%s", k, v[0]))
		}
	}
	sort.Strings(dataCheckParts)
	dataCheckString := strings.Join(dataCheckParts, "\n")

	// Perform the HMAC-SHA256 validation
	secretKey := hmac.New(sha256.New, []byte("WebAppData"))
	secretKey.Write([]byte(botToken))

	h := hmac.New(sha256.New, secretKey.Sum(nil))
	h.Write([]byte(dataCheckString))
	calculatedHash := hex.EncodeToString(h.Sum(nil))

	return calculatedHash == hash, nil
}
