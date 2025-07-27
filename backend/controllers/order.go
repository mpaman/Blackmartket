package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func CreateOrder(c *gin.Context) {
	userID := getUserIDFromContext(c)
	db := config.DB()

	var cart models.Cart
	if err := db.Preload("CartItems.Product").Where("user_id = ?", userID).First(&cart).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cart not found"})
		return
	}

	var address models.Address
	db.Where("user_id = ?", userID).First(&address)

	order := models.Order{
		UserID:    userID,
		Status:    "pending",
		AddressID: address.ID,
	}

	db.Create(&order)

	var orderItems []models.OrderItem
	var total float64

	for _, item := range cart.CartItems {
		orderItem := models.OrderItem{
			OrderID:   order.ID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Product.Price,
		}
		total += item.Product.Price * float64(item.Quantity)
		orderItems = append(orderItems, orderItem)
	}

	db.Create(&orderItems)
	db.Model(&order).Update("total_price", total)

	// clear cart
	db.Where("cart_id = ?", cart.ID).Delete(&models.CartItem{})

	c.JSON(http.StatusCreated, order)
}

func GetAllOrders(c *gin.Context) {
	userID := getUserIDFromContext(c)
	db := config.DB()

	var orders []models.Order
	db.Preload("OrderItems.Product.Images").Preload("Address").Where("user_id = ?", userID).Find(&orders)
	c.JSON(http.StatusOK, orders)
}

func GetOrderByID(c *gin.Context) {
	orderID, _ := strconv.Atoi(c.Param("id"))
	db := config.DB()

	var order models.Order
	if err := db.Preload("OrderItems.Product.Images").Preload("Address").First(&order, orderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	c.JSON(http.StatusOK, order)
}
