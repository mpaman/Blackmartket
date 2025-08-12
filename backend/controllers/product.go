package controllers

import (
	"encoding/base64"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func GetAllProducts(c *gin.Context) {
	var products []models.Product
	config.DB().Preload("Images").Preload("Category").Preload("User").Find(&products)
	c.JSON(http.StatusOK, products)
}

func GetUserProducts(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var products []models.Product
	config.DB().Where("user_id = ?", userID).Preload("Images").Preload("Category").Find(&products)
	c.JSON(http.StatusOK, products)
}

// Helper function to validate base64 image
func isValidBase64Image(data string) bool {
	// Check if it's a data URL with base64 image
	if !strings.HasPrefix(data, "data:image/") {
		return false
	}

	// Extract the base64 part
	parts := strings.Split(data, ",")
	if len(parts) != 2 {
		return false
	}

	// Validate base64 encoding
	_, err := base64.StdEncoding.DecodeString(parts[1])
	return err == nil
}

func CreateProduct(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var input struct {
		Name        string  `json:"name" binding:"required"`
		Description string  `json:"description" binding:"required"`
		Price       float64 `json:"price" binding:"required,min=0.01"`
		CategoryID  uint    `json:"category_id" binding:"required"`
		Images      []struct {
			URL string `json:"url" binding:"required"`
			Alt string `json:"alt"`
		} `json:"images" binding:"required,min=1,max=5"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// Validate all images are valid base64
	for i, img := range input.Images {
		if !isValidBase64Image(img.URL) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid image format",
				"details": "Image " + strconv.Itoa(i+1) + " must be a valid base64 encoded image",
			})
			return
		}

		// Check base64 size (roughly 5MB limit after encoding)
		if len(img.URL) > 7000000 { // ~5MB base64 is about 7MB string
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Image too large",
				"details": "Image " + strconv.Itoa(i+1) + " exceeds size limit",
			})
			return
		}
	}

	// Verify category exists
	var category models.Category
	if err := config.DB().First(&category, input.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	// Create product
	product := models.Product{
		Name:        input.Name,
		Description: input.Description,
		Price:       input.Price,
		CategoryID:  input.CategoryID,
		UserID:      userID,
	}

	db := config.DB()
	if err := db.Create(&product).Error; err != nil {
		log.Printf("Failed to create product: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create product"})
		return
	}

	// Create product images with base64 data
	createdImages := []models.ProductImage{}
	for i, imgInput := range input.Images {
		image := models.ProductImage{
			URL:       imgInput.URL, // Store the full base64 string
			ProductID: product.ID,
		}

		if err := db.Create(&image).Error; err != nil {
			log.Printf("Failed to create image %d: %v", i+1, err)
			// Continue with other images even if one fails
		} else {
			createdImages = append(createdImages, image)
		}
	}

	// Load the complete product with relations
	db.Preload("Images").Preload("Category").Preload("User").First(&product, product.ID)

	log.Printf("Product created successfully: ID=%d, Name=%s, Images=%d",
		product.ID, product.Name, len(createdImages))

	c.JSON(http.StatusCreated, gin.H{
		"message": "Product created successfully",
		"product": product,
	})
}

func UpdateProduct(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id := c.Param("id")
	productID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Product
	if err := config.DB().First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Check if user owns the product
	if product.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own products"})
		return
	}

	var input struct {
		Name        string  `json:"name" binding:"required"`
		Description string  `json:"description" binding:"required"`
		Price       float64 `json:"price" binding:"required,min=0.01"`
		CategoryID  uint    `json:"category_id" binding:"required"`
		Images      []struct {
			URL string `json:"url" binding:"required"`
			Alt string `json:"alt"`
		} `json:"images" binding:"required,min=1,max=5"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// Validate all images are valid base64
	for i, img := range input.Images {
		if !isValidBase64Image(img.URL) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Invalid image format",
				"details": "Image " + strconv.Itoa(i+1) + " must be a valid base64 encoded image",
			})
			return
		}

		// Check base64 size (roughly 5MB limit after encoding)
		if len(img.URL) > 7000000 { // ~5MB base64 is about 7MB string
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "Image too large",
				"details": "Image " + strconv.Itoa(i+1) + " exceeds size limit",
			})
			return
		}
	}

	// Verify category exists
	var category models.Category
	if err := config.DB().First(&category, input.CategoryID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	db := config.DB()

	// Update product
	product.Name = input.Name
	product.Description = input.Description
	product.Price = input.Price
	product.CategoryID = input.CategoryID

	if err := db.Save(&product).Error; err != nil {
		log.Printf("Failed to update product: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update product"})
		return
	}

	// Delete existing images
	config.DB().Where("product_id = ?", productID).Delete(&models.ProductImage{})

	// Create new product images
	createdImages := []models.ProductImage{}
	for i, imgInput := range input.Images {
		image := models.ProductImage{
			URL:       imgInput.URL,
			ProductID: product.ID,
		}

		if err := db.Create(&image).Error; err != nil {
			log.Printf("Failed to create image %d: %v", i+1, err)
		} else {
			createdImages = append(createdImages, image)
		}
	}

	// Load the complete product with relations
	db.Preload("Images").Preload("Category").Preload("User").First(&product, product.ID)

	log.Printf("Product updated successfully: ID=%d, Name=%s, Images=%d",
		product.ID, product.Name, len(createdImages))

	c.JSON(http.StatusOK, gin.H{
		"message": "Product updated successfully",
		"product": product,
	})
}

func DeleteProduct(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	id := c.Param("id")
	productID, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	var product models.Product
	db := config.DB()
	if err := db.First(&product, productID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	// Check if user owns the product
	if product.UserID != userID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own products"})
		return
	}

	// Start a database transaction to ensure all operations complete successfully
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Delete all cart items that reference this product (from all users' carts)
	cartDeleteResult := tx.Where("product_id = ?", productID).Delete(&models.CartItem{})
	if cartDeleteResult.Error != nil {
		tx.Rollback()
		log.Printf("Failed to delete cart items for product %d: %v", productID, cartDeleteResult.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove product from carts"})
		return
	}

	// Log how many cart items were removed
	if cartDeleteResult.RowsAffected > 0 {
		log.Printf("Removed product %d from %d cart items", productID, cartDeleteResult.RowsAffected)
	}

	// 2. Delete product images
	imageDeleteResult := tx.Where("product_id = ?", productID).Delete(&models.ProductImage{})
	if imageDeleteResult.Error != nil {
		tx.Rollback()
		log.Printf("Failed to delete images for product %d: %v", productID, imageDeleteResult.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product images"})
		return
	}

	// 3. Delete the product itself
	if err := tx.Delete(&product).Error; err != nil {
		tx.Rollback()
		log.Printf("Failed to delete product %d: %v", productID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete product"})
		return
	}

	// Commit the transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("Failed to commit transaction for deleting product %d: %v", productID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete product deletion"})
		return
	}

	log.Printf("Product %d deleted successfully (removed from %d carts)", productID, cartDeleteResult.RowsAffected)

	c.JSON(http.StatusOK, gin.H{
		"message": "Product deleted successfully",
		"details": gin.H{
			"product_id":          productID,
			"cart_items_removed":  cartDeleteResult.RowsAffected,
			"images_removed":      imageDeleteResult.RowsAffected,
		},
	})
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
