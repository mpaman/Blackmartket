package controllers

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
	"gorm.io/gorm"
)

func CreateOrder(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := config.DB()

	// Get user's cart
	var cart models.Cart
	if err := db.Preload("CartItems.Product").Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart not found or empty"})
		return
	}

	if len(cart.CartItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Get user's default address
	var address models.Address
	if err := db.Where("user_id = ? AND is_default = ?", userID, true).First(&address).Error; err != nil {
		// If no default address, get any address
		if err := db.Where("user_id = ?", userID).First(&address).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No delivery address found"})
			return
		}
	}

	// Calculate total
	var total float64
	for _, item := range cart.CartItems {
		total += item.Product.Price * float64(item.Quantity)
	}

	// Create order
	order := models.Order{
		UserID:     userID,
		Status:     "pending",
		TotalPrice: total,
		AddressID:  address.ID,
	}

	if err := db.Create(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order"})
		return
	}

	// Create order items
	var orderItems []models.OrderItem
	for _, item := range cart.CartItems {
		orderItem := models.OrderItem{
			OrderID:   order.ID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Product.Price,
		}
		orderItems = append(orderItems, orderItem)
	}

	if err := db.Create(&orderItems).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
		return
	}

	// Clear cart
	db.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{})

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Order created successfully",
		"order_id": order.ID,
		"total":    total,
	})
}

func GetAllOrders(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	db := config.DB()

	var orders []models.Order
	if err := db.Preload("OrderItems").Preload("OrderItems.Product").Preload("OrderItems.Product.Images").Preload("Address").Where("user_id = ?", userID).Order("created_at DESC").Find(&orders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	// Format the response to include computed fields
	var response []gin.H
	for _, order := range orders {
		orderData := gin.H{
			"ID":          order.ID,
			"status":      order.Status,
			"total_price": order.TotalPrice,
			"created_at":  order.CreatedAt,
			"updated_at":  order.UpdatedAt,
			"items":       order.OrderItems,
			"address":     order.Address,
		}
		response = append(response, orderData)
	}

	c.JSON(http.StatusOK, response)
}

func GetOrderByID(c *gin.Context) {
	userID := getUserIDFromContext(c)
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	orderID := c.Param("id")
	db := config.DB()

	var order models.Order
	if err := db.Preload("OrderItems").Preload("OrderItems.Product").Preload("OrderItems.Product.Images").Preload("Address").Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch order"})
		}
		return
	}

	// Format the response
	response := gin.H{
		"ID":          order.ID,
		"status":      order.Status,
		"total_price": order.TotalPrice,
		"created_at":  order.CreatedAt,
		"updated_at":  order.UpdatedAt,
		"items":       order.OrderItems,
		"address":     order.Address,
	}

	c.JSON(http.StatusOK, response)
}

func UpdateOrderStatus(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.ParseUint(orderIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var payload struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	validStatuses := []string{"pending", "processing", "shipped", "delivered", "cancelled"}
	isValid := false
	for _, status := range validStatuses {
		if payload.Status == status {
			isValid = true
			break
		}
	}

	if !isValid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid status"})
		return
	}

	db := config.DB()

	var order models.Order
	if err := db.Where("id = ?", orderID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	order.Status = payload.Status
	if err := db.Save(&order).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update order status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Order status updated successfully",
		"status":  order.Status,
	})
}
