package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

const DefaultApiKey = "6118c7fb-4b7d-4be9-92ce-503c55f40444"
const ApiUrl = "https://api.envioclickpro.com.co/api/v2"

func getApiKey() string {
	if key := os.Getenv("ENVIOCLICK_API_KEY"); key != "" {
		return key
	}
	return DefaultApiKey
}

type PackageData struct {
	Weight float64 `json:"weight"`
	Height float64 `json:"height"`
	Width  float64 `json:"width"`
	Length float64 `json:"length"`
}

type OriginData struct {
	Company     string `json:"company"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	Suburb      string `json:"suburb"`
	CrossStreet string `json:"crossStreet"`
	Reference   string `json:"reference"`
	DaneCode    string `json:"daneCode"`
}

var OriginInfo = OriginData{
	Company:     "Rostro Dorado Clinic",
	FirstName:   "Rostro",
	LastName:    "Dorado",
	Email:       "contacto@rostrodorado.com",
	Phone:       "3000000000",
	Address:     "Calle 12 #12-03 local 2",
	Suburb:      "Centro",
	CrossStreet: "Calle 12",
	Reference:   "Local 2",
	DaneCode:    OriginCode,
}

// Request models

type QuoteItem struct {
	Weight   float64 `json:"weight"`
	Quantity int     `json:"quantity"`
}

type QuoteRequest struct {
	City       string      `json:"city"`
	Department string      `json:"department"`
	Items      []QuoteItem `json:"items"`
	Total      float64     `json:"total"`
}

type ShipmentCustomer struct {
	FirstName      string `json:"firstName"`
	LastName       string `json:"lastName"`
	Email          string `json:"email"`
	Phone          string `json:"phone"`
	Address        string `json:"address"`
	City           string `json:"city"`
	Department     string `json:"department"`
	Neighborhood   string `json:"neighborhood"`
	Notes          string `json:"notes"`
	Identification string `json:"identification"`
}

type CreateShipmentRequest struct {
	Customer       ShipmentCustomer `json:"customer"`
	Items          []QuoteItem      `json:"items"`
	Total          float64          `json:"total"`
	ShippingOption struct {
		IdRate    int    `json:"idRate"`
		IdProduct int    `json:"idProduct"`
		Carrier   string `json:"carrier"`
		Service   string `json:"service"`
	} `json:"shippingOption"`
}

// Response models

type Rate struct {
	Carrier      string  `json:"carrier"`
	Product      string  `json:"product"`
	Flete        float64 `json:"flete"`
	DeliveryDays int     `json:"deliveryDays"`
	IdRate       int     `json:"idRate"`
	IdProduct    int     `json:"idProduct"`
}

type EnvioclickResponseData struct {
	Rates   []Rate `json:"rates"`
	Tracker string `json:"tracker"`
	URL     string `json:"url"`
	Status  string `json:"status"`
	Detail  string `json:"statusDetail"`
}

type EnvioclickResponse struct {
	Status         string                 `json:"status"`
	Data           EnvioclickResponseData `json:"data"`
	StatusMessages []struct {
		Error []string `json:"error"`
	} `json:"status_messages"`
	Message string `json:"message"`
}

type DeliveryCompanyInfo struct {
	CompanyName      string  `json:"companyName"`
	DeliveryEstimate string  `json:"deliveryEstimate"`
	ShippingCost     float64 `json:"shippingCost"`
	Service          string  `json:"service"`
}

type FrontendQuote struct {
	Carrier         string              `json:"carrier"`
	Service         string              `json:"service"`
	ShippingCost    float64             `json:"shippingCost"`
	DeliveryDay     int                 `json:"deliveryDay"`
	DeliveryCompany DeliveryCompanyInfo `json:"deliveryCompany"`
	IdRate          int                 `json:"idRate"`
	IdProduct       int                 `json:"idProduct"`
}

func doRequest(method, endpoint string, payload interface{}) ([]byte, error) {
	var bodyReader io.Reader
	if payload != nil {
		b, err := json.Marshal(payload)
		if err != nil {
			return nil, fmt.Errorf("marshal payload error: %w", err)
		}
		bodyReader = bytes.NewReader(b)
	}

	req, err := http.NewRequest(method, ApiUrl+endpoint, bodyReader)
	if err != nil {
		return nil, fmt.Errorf("create request error: %w", err)
	}

	req.Header.Set("Authorization", getApiKey())
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http request error: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response body error: %w", err)
	}

	return respBody, nil
}

func QuoteShipping(reqData QuoteRequest, daneCodes []DaneCode) ([]FrontendQuote, error) {
	destination := FindDaneCode(reqData.City, reqData.Department, daneCodes)
	if destination == nil {
		return nil, fmt.Errorf("ciudad no cubierta (%s, %s)", reqData.City, reqData.Department)
	}

	// Calculate total weight in Kg
	var totalWeightRaw float64
	for _, item := range reqData.Items {
		w := item.Weight
		if w == 0 {
			w = 500 // default 500g
		}
		totalWeightRaw += w * float64(item.Quantity)
	}

	weightKg := totalWeightRaw
	if totalWeightRaw > 10 {
		weightKg = totalWeightRaw / 1000 // Convert grams to kg if logic suggests it was in grams
	}
	if weightKg < 0.5 {
		weightKg = 0.5 // Min 0.5 Kg
	}

	pkg := PackageData{
		Weight: weightKg,
		Height: 10,
		Width:  10,
		Length: 10,
	}

	val := reqData.Total
	if val <= 0 {
		val = 20000 // default content value
	}

	payload := map[string]interface{}{
		"packages":     []PackageData{pkg},
		"description":  "Productos de Belleza",
		"contentValue": val,
		"origin": map[string]string{
			"daneCode": OriginCode,
			"address":  OriginInfo.Address,
		},
		"destination": map[string]string{
			"daneCode": destination.CityCode,
			"address":  "Calle Principal",
		},
	}

	respBytes, err := doRequest("POST", "/quotation", payload)
	if err != nil {
		return nil, fmt.Errorf("api request failed: %w", err)
	}

	var evResp EnvioclickResponse
	if err := json.Unmarshal(respBytes, &evResp); err != nil {
		return nil, fmt.Errorf("parse response failed: %w", err)
	}

	if evResp.Status != "OK" || len(evResp.Data.Rates) == 0 {
		return nil, fmt.Errorf("no se encontraron cotizaciones")
	}

	var quotes []FrontendQuote
	for _, r := range evResp.Data.Rates {
		quotes = append(quotes, FrontendQuote{
			Carrier:      r.Carrier,
			Service:      r.Product,
			ShippingCost: r.Flete,
			DeliveryDay:  r.DeliveryDays,
			DeliveryCompany: DeliveryCompanyInfo{
				CompanyName:      r.Carrier,
				DeliveryEstimate: fmt.Sprintf("%d días hábiles", r.DeliveryDays),
				ShippingCost:     r.Flete,
				Service:          r.Product,
			},
			IdRate:    r.IdRate,
			IdProduct: r.IdProduct,
		})
	}

	return quotes, nil
}

type CreatedShipment struct {
	TrackingNumber string `json:"trackingNumber"`
	LabelUrl       string `json:"labelUrl"`
	Carrier        string `json:"carrier"`
}

func CreateShipment(reqData CreateShipmentRequest, daneCodes []DaneCode) (*CreatedShipment, error) {
	destination := FindDaneCode(reqData.Customer.City, reqData.Customer.Department, daneCodes)
	if destination == nil {
		return nil, fmt.Errorf("destino no válido (%s)", reqData.Customer.City)
	}

	var totalWeightRaw float64
	for _, item := range reqData.Items {
		w := item.Weight
		if w == 0 {
			w = 500
		}
		totalWeightRaw += w * float64(item.Quantity)
	}

	weightKg := totalWeightRaw
	if totalWeightRaw > 10 {
		weightKg = totalWeightRaw / 1000
	}
	if weightKg < 0.5 {
		weightKg = 0.5
	}

	pkg := PackageData{
		Weight: weightKg,
		Height: 10,
		Width:  10,
		Length: 10,
	}

	val := reqData.Total
	if val <= 0 {
		val = 20000
	}

	// Format phone: keep only last 10 digits
	reg := regexp.MustCompile(`\D`)
	phoneClean := reg.ReplaceAllString(reqData.Customer.Phone, "")
	if len(phoneClean) > 10 {
		phoneClean = phoneClean[len(phoneClean)-10:]
	}
	if phoneClean == "" {
		phoneClean = "3000000000"
	}

	addr := reqData.Customer.Address
	if len(addr) > 40 {
		addr = addr[:40]
	}

	suburb := reqData.Customer.Neighborhood
	if suburb == "" {
		suburb = "Centro"
	}

	ref := reqData.Customer.Notes
	if ref == "" {
		ref = "Residencial"
	}

	buildPayload := func(rateId int) map[string]interface{} {
		return map[string]interface{}{
			"idRate":               rateId,
			"myShipmentReference":  fmt.Sprintf("ORD-%d", time.Now().UnixNano()/1e6),
			"requestPickup":        false,
			"insurance":            true,
			"description":          "Productos de Belleza",
			"contentValue":         val,
			"packages":             []PackageData{pkg},
			"origin":               OriginInfo,
			"destination": map[string]interface{}{
				"company":     "Particular",
				"firstName":   reqData.Customer.FirstName,
				"lastName":    reqData.Customer.LastName,
				"email":       reqData.Customer.Email,
				"phone":       phoneClean,
				"address":     addr,
				"suburb":      suburb,
				"crossStreet": "N/A",
				"reference":   ref,
				"daneCode":    destination.CityCode,
			},
		}
	}

	endpoint := "/shipment" // PRODUCTION MODE
	idRate := reqData.ShippingOption.IdRate

	if idRate > 0 {
		payload := buildPayload(idRate)
		respBytes, err := doRequest("POST", endpoint, payload)
		if err == nil {
			var evResp EnvioclickResponse
			if json.Unmarshal(respBytes, &evResp) == nil && evResp.Status == "OK" {
				return &CreatedShipment{
					TrackingNumber: evResp.Data.Tracker,
					LabelUrl:       evResp.Data.URL,
					Carrier:        reqData.ShippingOption.Carrier,
				}, nil
			}
		}
	}

	// Fallback: Re-quote
	fmt.Println("[Envioclick Go] Re-quoting because idRate failed or was missing...")
	quoteReq := QuoteRequest{
		City:       reqData.Customer.City,
		Department: reqData.Customer.Department,
		Items:      reqData.Items,
		Total:      reqData.Total,
	}

	quotes, err := QuoteShipping(quoteReq, daneCodes)
	if err != nil || len(quotes) == 0 {
		return nil, fmt.Errorf("failed to re-quote: %v", err)
	}

	// Find best quote matching preferred carrier or pick the first
	bestQuote := quotes[0]
	for _, q := range quotes {
		if strings.EqualFold(q.Carrier, reqData.ShippingOption.Carrier) {
			bestQuote = q
			break
		}
	}

	payload := buildPayload(bestQuote.IdRate)
	respBytes, err := doRequest("POST", endpoint, payload)
	if err != nil {
		return nil, fmt.Errorf("re-shipment API request failed: %w", err)
	}

	var evResp EnvioclickResponse
	if err := json.Unmarshal(respBytes, &evResp); err != nil {
		return nil, fmt.Errorf("parse re-shipment response failed: %w", err)
	}

	if evResp.Status == "OK" {
		return &CreatedShipment{
			TrackingNumber: evResp.Data.Tracker,
			LabelUrl:       evResp.Data.URL,
			Carrier:        bestQuote.Carrier,
		}, nil
	}

	// Parse custom nested errors from Envioclick
	var errorMsg = "Envioclick API Failed: Unknown error"
	if len(evResp.StatusMessages) > 0 {
		if len(evResp.StatusMessages[0].Error) > 0 {
			errorMsg = strings.Join(evResp.StatusMessages[0].Error, " ")
		}
	} else if evResp.Message != "" {
		errorMsg = evResp.Message
	}

	return nil, fmt.Errorf(errorMsg)
}

type TrackResult struct {
	Status string `json:"status"`
	Detail string `json:"detail"`
}

func TrackShipment(trackingCode string) (*TrackResult, error) {
	payload := map[string]string{"trackingCode": trackingCode}
	respBytes, err := doRequest("POST", "/track", payload)
	if err != nil {
		return nil, fmt.Errorf("api request failed: %w", err)
	}

	var evResp EnvioclickResponse
	if err := json.Unmarshal(respBytes, &evResp); err != nil {
		return nil, fmt.Errorf("parse response failed: %w", err)
	}

	if evResp.Status == "OK" {
		return &TrackResult{
			Status: evResp.Data.Status,
			Detail: evResp.Data.Detail,
		}, nil
	}

	return nil, fmt.Errorf("tracking code not found")
}
