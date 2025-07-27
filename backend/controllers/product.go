package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func GetAllProducts(c *gin.Context) {
	var products []models.Product
	config.DB().Preload("Images").Preload("Category").Preload("User").Find(&products)
	c.JSON(http.StatusOK, products)
}

func GetProductByID(c *gin.Context) {
	id := c.Param("id")
	var product models.Product
	if err := config.DB().Preload("Images").Preload("Category").Preload("User").First(&product, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}
	c.JSON(http.StatusOK, product)
}

func CreateProduct(c *gin.Context) {
	var product models.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// แยกรูปออกก่อน (จะได้ไม่สร้างพร้อมกัน)
	images := product.Images
	product.Images = nil

	if err := config.DB().Create(&product).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	// ใส่ ProductID แล้วค่อยบันทึกรูป
	for i := range images {
		images[i].ProductID = product.ID
		config.DB().Create(&images[i])
	}
	product.Images = images

	c.JSON(http.StatusCreated, product)
}

func DeleteProduct(c *gin.Context) {
	id := c.Param("id")
	if err := config.DB().Delete(&models.Product{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Delete failed"})
		return
	}
	c.Status(http.StatusNoContent)
}
