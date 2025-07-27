package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Name            string    `json:"name"`
	Email           string    `json:"email" gorm:"uniqueIndex"`
	Password        string    `json:"-"`
	ProfileImageURL string    `json:"profile_image_url"`
	Orders          []Order   `json:"orders"`
	Address         []Address `json:"address"`
	Products        []Product `json:"products" gorm:"foreignKey:UserID"`
}

type Address struct {
	gorm.Model
	UserID  uint   `json:"user_id"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}
