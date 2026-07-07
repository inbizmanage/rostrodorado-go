package main

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
)

type Product struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Description     string   `json:"description"`
	Price           float64  `json:"price"`
	Category        string   `json:"category"`
	LongDescription string   `json:"longDescription"`
	Ingredients     []string `json:"ingredients"`
	Usage           string   `json:"usage"`
	Benefits        []string `json:"benefits"`
	CostPrice       float64  `json:"costPrice"`
	BasePrice       float64  `json:"basePrice"`
	Stock           int      `json:"stock"`
	Brand           string   `json:"brand"`
	Weight          float64  `json:"weight"`
	Slug            string   `json:"slug"`
}

type CartItem struct {
	Product
	Quantity int `json:"quantity"`
}

type Customer struct {
	Name           string `json:"name"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Address        string `json:"address"`
	City           string `json:"city"`
	Department     string `json:"department"`
	PostalCode     string `json:"postalCode"`
	Notes          string `json:"notes"`
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Identification string `json:"identification"`
	Apartment      string `json:"apartment"`
}

type ShippingOption struct {
	IdRate          int                  `json:"idRate"`
	IdProduct       int                  `json:"idProduct"`
	Carrier         string               `json:"carrier"`
	Service         string               `json:"service"`
	ShippingCost    float64              `json:"shippingCost"`
	DeliveryCompany *DeliveryCompanyInfo `json:"deliveryCompany"`
}

type Order struct {
	ID               string         `json:"id"`
	UserID           string         `json:"userId"`
	Customer         Customer       `json:"customer"`
	Items            []CartItem     `json:"items"`
	Total            float64        `json:"total"`
	Status           string         `json:"status"` // pending, processing, shipped, etc.
	PaymentStatus    string         `json:"paymentStatus"`
	CreatedAt        string         `json:"createdAt"`
	UpdatedAt        string         `json:"updatedAt"`
	PaymentMethod    string         `json:"paymentMethod"`
	TransactionID    string         `json:"transactionId"`
	CouponCode       string         `json:"couponCode"`
	DiscountApplied  float64        `json:"discountApplied"`
	TrackingNumber   string         `json:"trackingNumber"`
	ShippingLabelUrl string         `json:"shippingLabelUrl"`
	ShippingProvider string         `json:"shippingProvider"`
	ShippingOption   ShippingOption `json:"shippingOption"`
	TrackingStatus   string         `json:"trackingStatus"`
}

// unmarshalRecordField converts raw field values from pocketbase records into Go structs/slices using JSON
func unmarshalRecordField(record *core.Record, key string, dst interface{}) error {
	raw := record.Get(key)
	if raw == nil {
		return nil
	}
	bytesData, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	return json.Unmarshal(bytesData, dst)
}
