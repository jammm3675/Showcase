package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	TelegramID    int64  `gorm:"uniqueIndex;not null"`
	WalletAddress string `gorm:"index"`
	Username      string
	FirstName     string
}
