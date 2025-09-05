package models

import "gorm.io/gorm"

// Showcase represents a curated collection of NFTs created by a user.
type Showcase struct {
	gorm.Model
	UserID      uint   `gorm:"not null;index"`
	User        User   // Belongs to a User
	Title       string `gorm:"not null"`
	Description string
	ShowcaseNfts []ShowcaseNft `gorm:"foreignKey:ShowcaseID"` // Has many ShowcaseNfts
}

// ShowcaseNft represents a single NFT within a showcase.
// It stores a snapshot of the NFT's metadata at the time of inclusion.
type ShowcaseNft struct {
	gorm.Model
	ShowcaseID  uint   `gorm:"not null;index"`
	// We can't use a foreign key to an external NFT, so we store its address.
	NftAddress  string `gorm:"not null"`
	Name           string
	Description    string
	Image          string
	CollectionName string
}
