package models

import "gorm.io/gorm"

type Cart struct {
	gorm.Model
	UserID    uint       `json:"user_id"`
	User      User       `json:"user" gorm:"foreignKey:UserID"`
	CartItems []CartItem `json:"items"`
}

type CartItem struct {
	gorm.Model
	CartID    uint    `json:"cart_id"`
	ProductID uint    `json:"product_id"`
	Product   Product `json:"product"`
	Quantity  int     `json:"quantity"`
}
