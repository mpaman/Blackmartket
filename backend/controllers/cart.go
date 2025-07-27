package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func GetUserCart(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var cart models.Cart
	db := config.DB()
	err := db.
		Preload("CartItems.Product").
		Preload("CartItems.Product.Images").
		Preload("CartItems.Product.Category").
		Preload("CartItems.Product.User").
		Where("user_id = ?", userID).
		First(&cart).Error

	if err != nil {
		// If cart doesn't exist, create an empty one
		cart = models.Cart{
			UserID:    userID,
			CartItems: []models.CartItem{},
		}
		db.Create(&cart)
	}

	// Always return cart with items array (even if empty)
	if cart.CartItems == nil {
		cart.CartItems = []models.CartItem{}
	}

	c.JSON(http.StatusOK, gin.H{
		"ID":      cart.ID,
		"user_id": cart.UserID,
		"items":   cart.CartItems,
	})
}

func AddToCart(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var input struct {
		ProductID uint `json:"product_id"`
		Quantity  int  `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// Add validation to check if ProductID is 0
	if input.ProductID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required and cannot be 0"})
		return
	}

	// Check if the product exists
	var product models.Product
	db := config.DB()
	if err := db.First(&product, input.ProductID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
		return
	}

	var cart models.Cart
	db.FirstOrCreate(&cart, models.Cart{UserID: userID})

	// Check if item already exists in cart
	var existingItem models.CartItem
	err := db.Where("cart_id = ? AND product_id = ?", cart.ID, input.ProductID).First(&existingItem).Error
	if err == nil {
		// Item exists, update quantity
		existingItem.Quantity += input.Quantity
		if err := db.Save(&existingItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item"})
			return
		}

		// Return the updated item
		c.JSON(http.StatusOK, gin.H{
			"message": "Cart item updated successfully",
			"item":    existingItem,
		})
		return
	}

	// Item doesn't exist, create new
	cartItem := models.CartItem{
		CartID:    cart.ID,
		ProductID: input.ProductID,
		Quantity:  input.Quantity,
	}
	if err := db.Create(&cartItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add item to cart"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Item added to cart successfully",
		"item":    cartItem,
	})
}

func UpdateCartItem(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var input struct {
		ProductID uint `json:"product_id"`
		Quantity  int  `json:"quantity"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid input",
			"details": err.Error(),
		})
		return
	}

	// Add validation to check if ProductID is 0
	if input.ProductID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Product ID is required and cannot be 0"})
		return
	}

	// Validate quantity
	if input.Quantity <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Quantity must be greater than 0"})
		return
	}

	var cart models.Cart
	db := config.DB()
	if err := db.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
		return
	}

	// Find and update the cart item
	var cartItem models.CartItem
	if err := db.Where("cart_id = ? AND product_id = ?", cart.ID, input.ProductID).First(&cartItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart item not found"})
		return
	}

	cartItem.Quantity = input.Quantity
	if err := db.Save(&cartItem).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cart item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cart item updated successfully",
		"item":    cartItem,
	})
}

func RemoveCartItem(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	productID := c.Param("productId")

	var cart models.Cart
	db := config.DB()
	if err := db.Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
		return
	}

	// Delete the specific cart item
	result := db.Where("cart_id = ? AND product_id = ?", cart.ID, productID).Delete(&models.CartItem{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove cart item"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart item not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Cart item removed successfully"})
}

func DeleteCart(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var cart models.Cart
	db := config.DB()
	err := db.Where("user_id = ?", userID).First(&cart).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
		return
	}

	db.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{})
	db.Delete(&cart)
	c.Status(http.StatusNoContent)
}

func GetCartCount(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var cart models.Cart
	db := config.DB()
	err := db.Preload("CartItems").Where("user_id = ?", userID).First(&cart).Error
	if err != nil {
		// No cart found, return 0
		c.JSON(http.StatusOK, gin.H{"count": 0})
		return
	}

	// Calculate total quantity
	totalCount := 0
	for _, item := range cart.CartItems {
		totalCount += item.Quantity
	}

	c.JSON(http.StatusOK, gin.H{"count": totalCount})
}
