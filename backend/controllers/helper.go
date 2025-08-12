package controllers

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

// สมมติคุณมีฟังก์ชันนี้ แปลง email เป็น userID
func getUserIDByEmail(email string) (uint, error) {
	var user models.User
	err := config.DB().Where("email = ?", email).First(&user).Error
	if err != nil {
		return 0, errors.New("User not found")
	}
	return user.ID, nil
}

// ดึง userID จาก context ที่ middleware เซ็ตไว้
func getUserIDFromContext(c *gin.Context) uint {
	// Try different possible key names that might be set by middleware
	userIDValue, exists := c.Get("user_id")
	if !exists {
		userIDValue, exists = c.Get("userID")
		if !exists {
			userIDValue, exists = c.Get("UserID")
			if !exists {
				return 0
			}
		}
	}

	// Handle different types that might be stored
	switch v := userIDValue.(type) {
	case uint:
		return v
	case int:
		return uint(v)
	case float64:
		return uint(v)
	case string:
		// Convert string to uint if needed
		if v != "" {
			// You might need to implement string to uint conversion here
			return 0
		}
	}

	return 0
}
