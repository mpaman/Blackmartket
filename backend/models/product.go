package models

import (
	"gorm.io/gorm"
)

type Product struct {
	gorm.Model
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Price       float64        `json:"price"`
	Images      []ProductImage `json:"images" gorm:"foreignKey:ProductID"`
	CategoryID  uint           `json:"category_id"`
	Category    Category       `json:"category" gorm:"foreignKey:CategoryID"`
	UserID      uint           `json:"user_id"`
	User        User           `json:"user" gorm:"foreignKey:UserID"`
}

type ProductImage struct {
	gorm.Model
	URL       string `json:"url"`
	ProductID uint   `json:"product_id"`
}
