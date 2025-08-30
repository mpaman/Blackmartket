package controllers

import (
	"log"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

type CheckoutRequest struct {
	ShippingAddress models.Address `json:"shipping_address"`
	PaymentMethod   string         `json:"payment_method"`
}

type CheckoutResponse struct {
	Order   models.Order `json:"order"`
	Message string       `json:"message"`
}



// CreateCheckoutSession - Creates a checkout session with cart items
func CreateCheckoutSession(c *gin.Context) {
	userID := getUserIDFromContext(c)
	db := config.DB()

	// Get user's cart
	var cart models.Cart
	if err := db.Preload("CartItems.Product.Images").Where("user_id = ?", userID).First(&cart).Error; err != nil {
		log.Printf("Cart not found for user %d: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found or empty"})
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
			log.Printf("No address found for user %d: %v", userID, err)
		}
	}

	// Calculate totals
	var subtotal float64
	for _, item := range cart.CartItems {
		subtotal += item.Product.Price * float64(item.Quantity)
	}

	shipping := 100.0 // Default shipping cost
	if subtotal > 1000 {
		shipping = 0 // Free shipping for orders over 1000
	}

	total := subtotal + shipping

	checkoutData := gin.H{
		"cart_items": cart.CartItems,
		"subtotal":   subtotal,
		"shipping":   shipping,
		"total":      total,
		"address":    address,
	}

	c.JSON(http.StatusOK, checkoutData)
}

// ProcessCheckout - Process the checkout and create order
func ProcessCheckout(c *gin.Context) {
	userID := getUserIDFromContext(c)
	db := config.DB()

	var req CheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("Invalid checkout request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Validate required fields
	if req.ShippingAddress.FirstName == "" || req.ShippingAddress.LastName == "" ||
		req.ShippingAddress.Email == "" || req.ShippingAddress.Phone == "" ||
		req.ShippingAddress.Address == "" || req.ShippingAddress.City == "" ||
		req.ShippingAddress.PostalCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing required shipping information"})
		return
	}

	// Get user's cart
	var cart models.Cart
	if err := db.Preload("CartItems.Product").Where("user_id = ?", userID).First(&cart).Error; err != nil {
		log.Printf("Cart not found for user %d: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found or empty"})
		return
	}

	if len(cart.CartItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cart is empty"})
		return
	}

	// Create or update shipping address
	req.ShippingAddress.UserID = userID
	if err := db.Create(&req.ShippingAddress).Error; err != nil {
		log.Printf("Failed to create address: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save shipping address"})
		return
	}

	// Calculate totals
	var subtotal float64
	for _, item := range cart.CartItems {
		subtotal += item.Product.Price * float64(item.Quantity)
	}

	shipping := 100.0
	if subtotal > 1000 {
		shipping = 0
	}
	total := subtotal + shipping

	// Create order
	order := models.Order{
		UserID:     userID,
		TotalPrice: total,
		Status:     "pending",
		AddressID:  req.ShippingAddress.ID,
	}

	if err := db.Create(&order).Error; err != nil {
		log.Printf("Failed to create order: %v", err)
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
		log.Printf("Failed to create order items: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create order items"})
		return
	}

	// Create payment record
	payment := models.Payment{
		OrderID: order.ID,
		Amount:  total,
		Method:  req.PaymentMethod,
		Status:  "pending",
	}

	if err := db.Create(&payment).Error; err != nil {
		log.Printf("Failed to create payment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment record"})
		return
	}

	// Simulate payment processing (in real app, integrate with Stripe/payment gateway)
	// For now, mark as completed
	payment.Status = "completed"
	db.Save(&payment)

	// Update order status
	order.Status = "paid"
	db.Save(&order)

	// Clear cart after successful order
	if err := db.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{}).Error; err != nil {
		log.Printf("Failed to clear cart: %v", err)
	}

	// Load complete order data for response
	if err := db.Preload("OrderItems.Product.Images").Preload("Address").Preload("Payment").First(&order, order.ID).Error; err != nil {
		log.Printf("Failed to load complete order: %v", err)
	}

	response := CheckoutResponse{
		Order:   order,
		Message: "Order placed successfully",
	}

	c.JSON(http.StatusCreated, response)
}

// GetOrderStatus - Get order status by ID
func GetOrderStatus(c *gin.Context) {
	orderIDStr := c.Param("id")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	userID := getUserIDFromContext(c)
	db := config.DB()

	var order models.Order
	if err := db.Preload("OrderItems.Product.Images").Preload("Address").Preload("Payment").
		Where("id = ? AND user_id = ?", orderID, userID).First(&order).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}
