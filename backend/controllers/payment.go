package controllers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
)

func CreatePayment(c *gin.Context) {
	var payment models.Payment
	if err := c.ShouldBindJSON(&payment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if payment.OrderID == 0 || payment.Amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing or invalid payment data"})
		return
	}

	db := config.DB()

	// เช็คว่า order มีอยู่จริงไหมก่อนชำระเงิน
	var order models.Order
	if err := db.First(&order, payment.OrderID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Order not found"})
		return
	}

	// สร้างการชำระเงิน
	if err := db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create payment"})
		return
	}

	// อัปเดตสถานะ order
	db.Model(&order).Update("status", "paid")

	c.JSON(http.StatusCreated, payment)
}

func GetPaymentByOrderID(c *gin.Context) {
	orderIDStr := c.Param("orderId")
	orderID, err := strconv.Atoi(orderIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order ID"})
		return
	}

	var payment models.Payment
	if err := config.DB().Where("order_id = ?", orderID).First(&payment).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	c.JSON(http.StatusOK, payment)
}
func GetAllPayments(c *gin.Context) {
	var payments []models.Payment
	if err := config.DB().Find(&payments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payments"})
		return
	}
	c.JSON(http.StatusOK, payments)
}
