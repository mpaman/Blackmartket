package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func GetUserAddresses(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var addresses []models.Address
	config.DB().Where("user_id = ?", userID).Find(&addresses)
	c.JSON(http.StatusOK, addresses)
}

func AddAddress(c *gin.Context) {
	userID := getUserIDFromContext(c)

	var address models.Address
	if err := c.ShouldBindJSON(&address); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	address.UserID = userID
	config.DB().Create(&address)

	c.JSON(http.StatusCreated, address)
}
