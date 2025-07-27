package models

import "gorm.io/gorm"

type Order struct {
	gorm.Model
	UserID     uint        `json:"user_id"`
	User       User        `json:"user"`
	TotalPrice float64     `json:"total_price"`
	Status     string      `json:"status"` // e.g., pending, paid, shipped
	OrderItems []OrderItem `json:"items"`
	Payment    Payment     `json:"payment"`
	AddressID  uint        `json:"address_id"`
	Address    Address     `json:"address"`
}

type OrderItem struct {
	gorm.Model
	OrderID   uint    `json:"order_id"`
	ProductID uint    `json:"product_id"`
	Product   Product `json:"product"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"` // price at time of purchase
}
