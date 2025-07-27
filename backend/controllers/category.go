package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func GetAllCategories(c *gin.Context) {
	var cats []models.Category
	db := config.DB()
	db.Find(&cats)
	c.JSON(http.StatusOK, cats)
}

func CreateCategory(c *gin.Context) {
	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	db := config.DB()
	db.Create(&cat)
	c.JSON(http.StatusCreated, cat)
}
