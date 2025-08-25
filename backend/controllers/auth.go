package controllers

import (
	"context"
	"errors"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/models"
	"github.com/mpaman/services"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type (
	Authen struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	signUp struct {
		Name            string `json:"name"`
		Email           string `json:"email"`
		Password        string `json:"password"`
		Phone           string `json:"phone"`
		Address         string `json:"address"`
		ProfileImageURL string `json:"profile_image_url"`
	}
)

// Helper function to validate image URL
func isValidImageURL(imageURL string) bool {
	if imageURL == "" {
		return true // Empty is valid, will use default
	}

	// Check if it's a valid URL
	if _, err := url.ParseRequestURI(imageURL); err != nil {
		// If not a valid URL, check if it's a relative path
		if !strings.HasPrefix(imageURL, "/") {
			return false
		}
	}

	// Check common image extensions
	imageURL = strings.ToLower(imageURL)
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
	for _, ext := range validExtensions {
		if strings.HasSuffix(imageURL, ext) {
			return true
		}
	}

	return false
}

func SignUp(c *gin.Context) {
	var payload signUp
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate required fields
	if payload.Name == "" || payload.Email == "" || payload.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name, email, and password are required"})
		return
	}

	// Validate profile image URL if provided
	if !isValidImageURL(payload.ProfileImageURL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile image URL format"})
		return
	}

	// Set default profile image if not provided
	if payload.ProfileImageURL == "" {
		payload.ProfileImageURL = "/images/default-profile.png" // Default profile image
	}

	db := config.DB()

	var userCheck models.User
	result := db.Where("email = ?", payload.Email).First(&userCheck)
	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if userCheck.ID != 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Email is already registered"})
		return
	}

	hashedPassword, _ := config.HashPassword(payload.Password)

	user := models.User{
		Name:            payload.Name,
		Email:           payload.Email,
		Password:        hashedPassword,
		ProfileImageURL: payload.ProfileImageURL, // 👈 เก็บ URL ของรูปโปรไฟล์
		Address: []models.Address{{
			Phone:   payload.Phone,
			Address: payload.Address,
		}},
	}

	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":           "Sign-up successful",
		"id":                user.ID,
		"name":              user.Name,
		"email":             user.Email,
		"profile_image_url": user.ProfileImageURL,
	})
}

func SignIn(c *gin.Context) {
	var payload Authen
	var user models.User

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 🔧 ใช้ GORM query แบบปลอดภัย ไม่ใช้ Raw
	if err := config.DB().Where("email = ?", payload.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email not found"})
		return
	}

	// 🔐 เปรียบเทียบรหัสผ่าน
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password is incorrect"})
		return
	}

	// 🪙 สร้าง JWT
	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	signedToken, err := jwtWrapper.GenerateToken(user.Email, user.ID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}

	// ✅ ส่ง token กลับ
	c.JSON(http.StatusOK, gin.H{
		"token_type":        "Bearer",
		"token":             signedToken,
		"id":                user.ID,
		"name":              user.Name,
		"email":             user.Email,
		"profile_image_url": user.ProfileImageURL,
	})
}

func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	var user models.User
	db := config.DB()
	if err := db.Preload("Address").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot find user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":                user.ID,
		"name":              user.Name,
		"email":             user.Email,
		"profile_image_url": user.ProfileImageURL,
		"address":           user.Address,
	})
}

// UpdateProfileImage updates the user's profile image
func UpdateProfileImage(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}

	var payload struct {
		ProfileImageURL string `json:"profile_image_url"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default profile image if not provided
	if payload.ProfileImageURL == "" {
		payload.ProfileImageURL = "/images/default-profile.png"
	}

	// Validate profile image URL
	if !isValidImageURL(payload.ProfileImageURL) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid profile image URL format"})
		return
	}

	db := config.DB()
	var user models.User

	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot find user"})
		return
	}

	// Update profile image URL
	user.ProfileImageURL = payload.ProfileImageURL
	if err := db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":           "Profile image updated successfully",
		"profile_image_url": user.ProfileImageURL,
	})
}
func SocialLoginController(c *gin.Context) {
	var payload models.SocialLogin
	if err := c.ShouldBindJSON(&payload); err != nil {
		log.Println("Invalid request payload:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	log.Printf("Social login request: provider=%s, token length=%d", payload.Provider, len(payload.Token))

	var email, name string
	
	// Try Firebase verification first
	firebaseApp, err := services.GetFirebaseApp()
	if err != nil {
		log.Println("Firebase init error, using token decoder fallback:", err)
		// Use token decoder as fallback (development only)
		claims, err := services.DecodeFirebaseToken(payload.Token)
		if err != nil {
			log.Println("Token decode error:", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			return
		}
		email = claims.Email
		name = claims.Name
		log.Printf("Token decoded (dev mode): email=%s, name=%s", email, name)
	} else {
		authClient, err := firebaseApp.Auth(context.Background())
		if err != nil {
			log.Println("Firebase auth client error, using token decoder fallback:", err)
			// Use token decoder as fallback
			claims, err := services.DecodeFirebaseToken(payload.Token)
			if err != nil {
				log.Println("Token decode error:", err)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
				return
			}
			email = claims.Email
			name = claims.Name
			log.Printf("Token decoded (fallback): email=%s, name=%s", email, name)
		} else {
			// Verify token properly with Firebase Admin SDK
			token, err := authClient.VerifyIDToken(context.Background(), payload.Token)
			if err != nil {
				log.Println("Firebase token verification error, trying token decoder:", err)
				// Fallback to token decoder
				claims, err := services.DecodeFirebaseToken(payload.Token)
				if err != nil {
					log.Println("Token decode error:", err)
					c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Firebase token"})
					return
				}
				email = claims.Email
				name = claims.Name
				// log.Printf("Token decoded (after Firebase failure): email=%s, name=%s", email, name)
			} else {
				// Successfully verified with Firebase
				email, _ = token.Claims["email"].(string)
				name, _ = token.Claims["name"].(string)
				log.Printf("Firebase token verified: email=%s, name=%s", email, name)
			}
		}
	}

	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Could not extract email from token"})
		return
	}

	db := config.DB()
	var user models.User
	result := db.Where("email = ?", email).First(&user)

	// ถ้า user ยังไม่มีใน DB → สร้างใหม่
	if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
		// log.Printf("Creating new user for email: %s", email)
		user = models.User{
			Name:            name,
			Email:           email,
			ProfileImageURL: "/images/default-profile.png",
		}
		if err := db.Create(&user).Error; err != nil {
			// log.Println("Error creating user:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Cannot create user"})
			return
		}
		// log.Printf("User created successfully with ID: %d", user.ID)
	} else if result.Error != nil {
		log.Println("Database error:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	} else {
		log.Printf("Existing user found: ID=%d, email=%s", user.ID, user.Email)
	}

	// 🔐 สร้าง JWT ของระบบเอง (เหมือน SignIn)
	jwtWrapper := services.JwtWrapper{
		SecretKey:       "SvNQpBN8y3qlVrsGAYYWoJJk56LtzFHx",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}
	signedToken, err := jwtWrapper.GenerateToken(user.Email, user.ID)
	if err != nil {
		log.Println("JWT generation error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	log.Printf("Social login successful for user ID: %d", user.ID)

	c.JSON(http.StatusOK, gin.H{
		"token_type":        "Bearer",
		"token":             signedToken,
		"id":                user.ID,
		"name":              user.Name,
		"email":             user.Email,
		"profile_image_url": user.ProfileImageURL,
	})
}