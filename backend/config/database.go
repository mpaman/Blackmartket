package config

import (
	"fmt"

	"github.com/mpaman/models"

	"encoding/base64"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"log"
	"os"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db

}

func ConnectionDB() {

	database, err := gorm.Open(sqlite.Open("Blackbaket.db?cache=shared"), &gorm.Config{})

	if err != nil {

		panic("failed to connect database")

	}

	fmt.Println("connected database")

	db = database

}
func EncodeImageToBase64(filePath string) string {
	imageBytes, err := os.ReadFile(filePath)
	if err != nil {
		log.Printf("Error reading file %s: %v", filePath, err)
		return ""
	}
	base64Str := base64.StdEncoding.EncodeToString(imageBytes)
	return "data:image/jpeg;base64," + base64Str
}

func SetupDatabase() {
	db.AutoMigrate(
		&models.User{},
		&models.Category{},
		&models.Product{},
		&models.ProductImage{},
		&models.Cart{},
		&models.CartItem{},
		&models.Order{},
		&models.OrderItem{},
		&models.Payment{},
		&models.Address{},
	)

	hashedPassword, _ := HashPassword("1")
	users := []models.User{
		{
			Name:     "Software",
			Email:    "1@gmail.com",
			Password: hashedPassword,
			Address: []models.Address{
				{Phone: "00000000", Address: "Address 1"},
			},
			ProfileImageURL: "https://example.com/profiles/software.jpg",
		},
		{
			Name:     "Hardware",
			Email:    "2@gmail.com",
			Password: hashedPassword,
			Address: []models.Address{
				{Phone: "11111111", Address: "Address 2"},
			},
			ProfileImageURL: "https://example.com/profiles/software.jpg",
		},
		{
			Name:     "Network",
			Email:    "3@gmail.com",
			Password: hashedPassword,
			Address: []models.Address{
				{Phone: "22222222", Address: "Address 3"},
			},
			ProfileImageURL: "https://example.com/profiles/network.jpg",
		},
	}

	for _, u := range users {
		db.FirstOrCreate(&u, models.User{Email: u.Email})
	}

	categories := []models.Category{
		{Name: "Electronics"},
		{Name: "Fashion"},
		{Name: "Home & Garden"},
		{Name: "Sports"},
		{Name: "Books"},
		{Name: "Automotive"},
	}
	for i := range categories {
		db.FirstOrCreate(&categories[i], models.Category{Name: categories[i].Name})
	}

	products := []models.Product{
		{
			Name:        "iPhone 13 Pro",
			Description: "Latest Apple smartphone, gently used.",
			Price:       32000,
			CategoryID:  categories[0].ID,
			UserID:      1,
		},
		{
			Name:        "Designer Handbag",
			Description: "Luxury handbag, like new.",
			Price:       8000,
			CategoryID:  categories[1].ID,
			UserID:      2,
		},
		{
			Name:        "NY Hat",
			Description: "Stylish New York hat.",
			Price:       1500,
			CategoryID:  categories[1].ID,
			UserID:      3,
		},
	}

	for i := range products {
		db.FirstOrCreate(&products[i], models.Product{Name: products[i].Name})
	}

	images := [][]string{
		{
			EncodeImageToBase64("config/images/p1-1.jpg"),
			EncodeImageToBase64("config/images/p1-2.jpg"),
		},
		{
			EncodeImageToBase64("config/images/p2-1.jpg"),
			EncodeImageToBase64("config/images/p2-2.jpg"),
		},
		{
			EncodeImageToBase64("config/images/p3-1.jpg"),
			EncodeImageToBase64("config/images/p3-2.jpg"),
		},
	}

	for i, product := range products {
		for _, url := range images[i] {
			db.FirstOrCreate(&models.ProductImage{}, models.ProductImage{
				ProductID: product.ID,
				URL:       url,
			})
		}
	}
}
