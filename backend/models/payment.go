package models

import "gorm.io/gorm"

type Payment struct {
	gorm.Model
	OrderID   uint    `json:"order_id"`
	Method    string  `json:"method"`  
	Amount    float64 `json:"amount"` 
}
