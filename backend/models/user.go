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
	UserID     uint   `json:"user_id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
	City       string `json:"city"`
	PostalCode string `json:"postal_code"`
	IsDefault  bool   `json:"is_default"`
}
type SocialLogin struct {
	Token    string `json:"token"`
	Provider string `json:"provider"`
}