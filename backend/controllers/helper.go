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
	userIDValue, exists := c.Get("userID")
	if !exists {
		return 0
	}

	userID, ok := userIDValue.(uint)
	if !ok {
		return 0
	}

	return userID
}
