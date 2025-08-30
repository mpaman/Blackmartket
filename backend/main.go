package main

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/mpaman/config"
	"github.com/mpaman/controllers"
	"github.com/mpaman/middlewares"
)

const PORT = "8000"

func SetupRouter() *gin.Engine {
	r := gin.Default()
	r.Use(CORSMiddleware())
	// Public Routes
	r.POST("/signup", controllers.SignUp)
	r.POST("/signin", controllers.SignIn)
	r.GET("/products", controllers.GetAllProducts)
	r.GET("/products/:id", controllers.GetProductByID)
	r.GET("/categories", controllers.GetAllCategories)
	r.POST("/categories", controllers.CreateCategory)
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// Protected Routes
	auth := r.Group("/api")
	auth.Use(middlewares.Authorizes())
	auth.GET("/current-user", controllers.GetCurrentUser)
	auth.PUT("/update-profile-image", controllers.UpdateProfileImage)
	auth.PUT("/update-profile", controllers.UpdateUserProfile)
	auth.PUT("/change-password", controllers.ChangePassword)

	// Product
	auth.POST("/products", controllers.CreateProduct)
	auth.GET("/user/products", controllers.GetUserProducts)
	auth.PUT("/products/:id", controllers.UpdateProduct)
	auth.DELETE("/products/:id", controllers.DeleteProduct)

	// Cart
	auth.GET("/cart", controllers.GetUserCart)
	auth.GET("/cart/count", controllers.GetCartCount)
	auth.POST("/cart", controllers.AddToCart)
	auth.PUT("/cart", controllers.UpdateCartItem)
	auth.DELETE("/cart/item/:productId", controllers.RemoveCartItem)
	auth.DELETE("/cart", controllers.DeleteCart)

	// Order
	auth.POST("/orders", controllers.CreateOrder)
	auth.GET("/orders", controllers.GetAllOrders)
	auth.GET("/orders/:id", controllers.GetOrderByID)
	auth.PUT("/orders/:id/status", controllers.UpdateOrderStatus)

	// Checkout
	auth.GET("/checkout", controllers.CreateCheckoutSession)
	auth.POST("/checkout", controllers.ProcessCheckout)
	auth.GET("/checkout/order/:id", controllers.GetOrderStatus)

	// Payment
	auth.POST("/payments", controllers.CreatePayment)
	auth.GET("/payments/:orderId", controllers.GetPaymentByOrderID)

	// Address
	auth.GET("/addresses", controllers.GetUserAddresses)
	auth.POST("/addresses", controllers.AddAddress)

	r.POST("/api/auth/social-login", controllers.SocialLoginController)
	return r
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	r := SetupRouter()
	config.ConnectionDB()
	config.SetupDatabase()

	r.Run("localhost:" + PORT)
}
