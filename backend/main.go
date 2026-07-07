package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

var daneCodes []DaneCode

func main() {
	app := pocketbase.New()

	// 1. Load DANE codes for Colombia shipping calculations
	var err error
	daneCodes, err = LoadDaneCodes("./dane_codes.csv")
	if err != nil {
		daneCodes, err = LoadDaneCodes("/app/dane_codes.csv")
		if err != nil {
			log.Printf("[Warning] Failed to load DANE codes: %v", err)
		}
	}

	// 2. Initialize Hugging Face Database sync backup / restore
	hfToken := os.Getenv("HF_TOKEN")
	repoId := "InBizBreaking/sys-v2-db"
	gitRepoPath := "/tmp/db_repo"
	localDbPath := "pb_data/data.db"


	if _, err := os.Stat("/app"); os.IsNotExist(err) {
		// Not running in Docker, adjust paths for local testing
		gitRepoPath = "./db_repo"
	}

	InitBackup(hfToken, repoId, localDbPath, gitRepoPath)
	StartBackupCron(hfToken, repoId, localDbPath, gitRepoPath)

	// 4. Configure HTTP routes and endpoints
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// --- AUTO-SETUP POCKETBASE ADMIN & COLLECTIONS ---
		// 1. Check and create superuser if none exists
		superusers, err := app.FindRecordsByFilter("_superusers", "1=1", "", 1, 0)
		if err != nil || len(superusers) == 0 {
			collection, err := app.FindCollectionByNameOrId("_superusers")
			if err == nil {
				record := core.NewRecord(collection)
				record.Set("email", "admin@admin.com")
				record.Set("password", "admin1234")
				record.Set("passwordConfirm", "admin1234")
				if err := app.Save(record); err == nil {
					log.Println("[Auto-Setup] Created initial superuser: admin@admin.com")
				} else {
					log.Printf("[Auto-Setup] Failed to create superuser: %v", err)
				}
			}
		}

		// 2. Automate custom collections setup and seeding
		AutoCreateCollections(app)

		// 4. Start background tracking updates from Envioclick now that database is active
		StartTrackingCron(app)

		// A. OTP Authentication
		se.Router.POST("/api/sendOtp", func(e *core.RequestEvent) error {
			var req SendOtpRequest
			if err := e.BindBody(&req); err != nil {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": "Email is required"})
			}
			if req.Email == "" {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": "Email is required"})
			}

			if err := SendOtp(req.Email, app); err != nil {
				return e.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
			}
			return e.JSON(http.StatusOK, map[string]interface{}{"success": true, "message": "OTP sent"})
		})

		se.Router.POST("/api/verifyOtp", func(e *core.RequestEvent) error {
			var req VerifyOtpRequest
			if err := e.BindBody(&req); err != nil {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
			}
			if req.Email == "" || req.Code == "" {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": "Email and Code are required"})
			}

			token, userRecord, err := VerifyOtp(req.Email, req.Code, app)
			if err != nil {
				return e.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
			}

			// Map record to simple auth structure for frontend compat
			return e.JSON(http.StatusOK, map[string]interface{}{
				"success": true,
				"token":   token,
				"user": map[string]interface{}{
					"uid":         userRecord.Id,
					"email":       userRecord.Email(),
					"displayName": userRecord.GetString("displayName"),
					"role":        userRecord.GetString("role"),
				},
			})
		})

		// B. Shipping Quote (Firebase Callable format: wraps inside {"data": ...} and returns {"result": ...})
		se.Router.POST("/api/calculateShipping", func(e *core.RequestEvent) error {
			var wrapper struct {
				Data QuoteRequest `json:"data"`
			}
			if err := e.BindBody(&wrapper); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Invalid request format: " + err.Error(),
					},
				})
			}

			quotes, err := QuoteShipping(wrapper.Data, daneCodes)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   err.Error(),
					},
				})
			}

			return e.JSON(http.StatusOK, map[string]interface{}{
				"result": map[string]interface{}{
					"success": true,
					"quotes":   quotes,
				},
			})
		})

		// C. Manual Tracking Update (Admin Panel)
		se.Router.POST("/api/manualTrackingUpdate", func(e *core.RequestEvent) error {
			var wrapper struct {
				Data struct {
					OrderId string `json:"orderId"`
				} `json:"data"`
			}
			if err := e.BindBody(&wrapper); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Invalid parameters",
					},
				})
			}

			orderRecord, err := app.FindRecordById("orders", wrapper.Data.OrderId)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Order not found",
					},
				})
			}

			trackingNumber := orderRecord.GetString("trackingNumber")
			if trackingNumber == "" {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Order has no tracking number",
					},
				})
			}

			trackResult, err := TrackShipment(trackingNumber)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   err.Error(),
					},
				})
			}

			statusLower := strings.ToLower(trackResult.Status)
			newStatus := ""
			if strings.Contains(statusLower, "entregado") || strings.Contains(statusLower, "delivered") {
				newStatus = "delivered"
			} else if strings.Contains(statusLower, "transito") || strings.Contains(statusLower, "recolección") {
				newStatus = "shipped"
			} else if strings.Contains(statusLower, "cancelado") {
				newStatus = "cancelled"
			}

			orderRecord.Set("trackingStatus", trackResult.Status)
			orderRecord.Set("trackingUpdatedAt", time.Now().Format(time.RFC3339))
			if newStatus != "" && newStatus != orderRecord.GetString("status") {
				orderRecord.Set("status", newStatus)
			}

			if err := app.Save(orderRecord); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Failed to update database record: " + err.Error(),
					},
				})
			}

			return e.JSON(http.StatusOK, map[string]interface{}{
				"result": map[string]interface{}{
					"success":   true,
					"status":    trackResult.Status,
					"newStatus": newStatus,
				},
			})
		})

		// D. Retry Shipment Generation (Admin Panel)
		se.Router.POST("/api/retryShipmentGeneration", func(e *core.RequestEvent) error {
			var wrapper struct {
				Data struct {
					OrderId string `json:"orderId"`
				} `json:"data"`
			}
			if err := e.BindBody(&wrapper); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Invalid parameters",
					},
				})
			}

			orderRecord, err := app.FindRecordById("orders", wrapper.Data.OrderId)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Order not found",
					},
				})
			}

			if orderRecord.GetString("trackingNumber") != "" {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Order already has a tracking number",
					},
				})
			}

			var items []QuoteItem
			if err := unmarshalRecordField(orderRecord, "items", &items); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Failed to parse order items: " + err.Error(),
					},
				})
			}

			var cust ShipmentCustomer
			if err := unmarshalRecordField(orderRecord, "customer", &cust); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Failed to parse customer details: " + err.Error(),
					},
				})
			}

			var shippingOption struct {
				IdRate    int    `json:"idRate"`
				IdProduct int    `json:"idProduct"`
				Carrier   string `json:"carrier"`
				Service   string `json:"service"`
			}
			_ = unmarshalRecordField(orderRecord, "shippingOption", &shippingOption)

			req := CreateShipmentRequest{
				Customer: cust,
				Items:    items,
				Total:    orderRecord.GetFloat("total"),
			}
			req.ShippingOption.IdRate = shippingOption.IdRate
			req.ShippingOption.IdProduct = shippingOption.IdProduct
			req.ShippingOption.Carrier = shippingOption.Carrier
			req.ShippingOption.Service = shippingOption.Service

			res, err := CreateShipment(req, daneCodes)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   err.Error(),
					},
				})
			}

			orderRecord.Set("trackingNumber", res.TrackingNumber)
			orderRecord.Set("shippingLabelUrl", res.LabelUrl)
			orderRecord.Set("shippingProvider", res.Carrier)
			orderRecord.Set("shippingGeneratedAt", time.Now().Format(time.RFC3339))
			orderRecord.Set("status", "processing")

			if err := app.Save(orderRecord); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"success": false,
						"error":   "Failed to update database record: " + err.Error(),
					},
				})
			}

			return e.JSON(http.StatusOK, map[string]interface{}{
				"result": map[string]interface{}{
					"success":        true,
					"trackingNumber": res.TrackingNumber,
					"labelUrl":       res.LabelUrl,
				},
			})
		})

		// E. Download PDF Invoice (Admin & Customer Receipts)
		se.Router.POST("/api/downloadInvoicePdf", func(e *core.RequestEvent) error {
			var wrapper struct {
				Data struct {
					OrderId string `json:"orderId"`
				} `json:"data"`
			}
			if err := e.BindBody(&wrapper); err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"error": "Invalid request",
					},
				})
			}

			orderRecord, err := app.FindRecordById("orders", wrapper.Data.OrderId)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"error": "Order not found",
					},
				})
			}

			var items []CartItem
			_ = unmarshalRecordField(orderRecord, "items", &items)
			var customer Customer
			_ = unmarshalRecordField(orderRecord, "customer", &customer)

			orderObj := &Order{
				ID:            orderRecord.Id,
				Customer:      customer,
				Items:         items,
				Total:         orderRecord.GetFloat("total"),
				PaymentMethod: orderRecord.GetString("paymentMethod"),
			}

			pdfBytes, err := CreateInvoicePdf(orderObj, orderRecord.Id)
			if err != nil {
				return e.JSON(http.StatusOK, map[string]interface{}{
					"result": map[string]interface{}{
						"error": "Failed to create PDF invoice: " + err.Error(),
					},
				})
			}

			pdfBase64 := base64.StdEncoding.EncodeToString(pdfBytes)
			return e.JSON(http.StatusOK, map[string]interface{}{
				"result": map[string]interface{}{
					"pdfBase64": pdfBase64,
				},
			})
		})

		// F. Facebook and Google Catalog Feeds
		se.Router.GET("/api/facebook-product-feed", func(e *core.RequestEvent) error {
			xmlStr, err := GenerateXmlFeed("facebook", app)
			if err != nil {
				return e.String(http.StatusInternalServerError, err.Error())
			}
			e.Response.Header().Set("Content-Type", "text/xml")
			return e.String(http.StatusOK, xmlStr)
		})

		se.Router.GET("/api/google-product-feed", func(e *core.RequestEvent) error {
			xmlStr, err := GenerateXmlFeed("google", app)
			if err != nil {
				return e.String(http.StatusInternalServerError, err.Error())
			}
			e.Response.Header().Set("Content-Type", "text/xml")
			return e.String(http.StatusOK, xmlStr)
		})

		// Serve static frontend files (Vite build)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), true))

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}

// InitBackup pulls/clones database dataset repo and restores it on startup
func InitBackup(hfToken, repoId, localDbPath, gitRepoPath string) {
	if hfToken == "" {
		log.Println("[Backup] HF_TOKEN missing. Skipping database recovery.")
		return
	}

	if _, err := os.Stat(gitRepoPath); os.IsNotExist(err) {
		log.Printf("[Backup] Cloning database dataset %s to %s...", repoId, gitRepoPath)
		// git clone https://InBizBreaking:<TOKEN>@huggingface.co/datasets/<repoId> <gitRepoPath>
		cloneUrl := fmt.Sprintf("https://InBizBreaking:%s@huggingface.co/datasets/%s", hfToken, repoId)
		cmd := exec.Command("git", "-c", "safe.directory=*", "clone", cloneUrl, gitRepoPath)
		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		if err := cmd.Run(); err != nil {
			log.Printf("[Backup] Git clone failed: %v. Stderr: %s", err, stderr.String())
			return
		}
		log.Println("[Backup] Dataset cloned successfully.")
	} else {
		log.Println("[Backup] Dataset directory exists. Pulling latest...")
		_ = exec.Command("git", "-c", "safe.directory=*", "-C", gitRepoPath, "pull").Run()
	}

	// Restore database file to Pocketbase folder
	repoDbPath := filepath.Join(gitRepoPath, "data.db")
	if _, err := os.Stat(repoDbPath); err == nil {
		log.Printf("[Backup] Restoring local database from Dataset backup: %s", repoDbPath)
		_ = os.MkdirAll(filepath.Dir(localDbPath), 0755)

		input, err := os.ReadFile(repoDbPath)
		if err != nil {
			log.Printf("[Backup] Failed to read backup DB file: %v", err)
			return
		}
		err = os.WriteFile(localDbPath, input, 0644)
		if err != nil {
			log.Printf("[Backup] Failed to write local DB: %v", err)
			return
		}
		log.Println("[Backup] Database file restored successfully.")
	} else {
		log.Println("[Backup] No backup file data.db found in dataset. Starting fresh database.")
	}
}

// StartBackupCron runs a background worker to backup sqlite to git repo and push to Hugging Face
func StartBackupCron(hfToken, repoId, localDbPath, gitRepoPath string) {
	if hfToken == "" {
		return
	}

	ticker := time.NewTicker(2 * time.Minute)
	go func() {
		for range ticker.C {
			repoDbPath := filepath.Join(gitRepoPath, "data.db")

			// Check if local database exists
			if _, err := os.Stat(localDbPath); os.IsNotExist(err) {
				continue
			}

			// Safe backup using SQLite CLI
			// sqlite3 localDbPath ".backup repoDbPath"
			_ = os.MkdirAll(filepath.Dir(repoDbPath), 0755)
			cmd := exec.Command("sqlite3", localDbPath, fmt.Sprintf(".backup %s", repoDbPath))
			if err := cmd.Run(); err != nil {
				log.Printf("[Backup Cron] SQLite backup failed: %v", err)
				continue
			}

			// Check git status
			statusCmd := exec.Command("git", "-c", "safe.directory=*", "-C", gitRepoPath, "status", "--porcelain")
			var statusStderr bytes.Buffer
			statusCmd.Stderr = &statusStderr
			out, err := statusCmd.Output()
			if err != nil {
				log.Printf("[Backup Cron] Git status error: %v. Stderr: %s", err, statusStderr.String())
				continue
			}

			if len(bytes.TrimSpace(out)) == 0 {
				continue // No changes
			}

			log.Println("[Backup Cron] Database changed. Committing and pushing to Hugging Face Dataset...")

			_ = exec.Command("git", "-c", "safe.directory=*", "-C", gitRepoPath, "add", "data.db").Run()
			commitMsg := fmt.Sprintf("Auto-backup: %s", time.Now().Format(time.RFC3339))
			_ = exec.Command("git", "-c", "safe.directory=*", "-C", gitRepoPath, "commit", "-c", "user.name=HF Backup Bot", "-c", "user.email=bot@huggingface.co", "-m", commitMsg).Run()

			pushCmd := exec.Command("git", "-c", "safe.directory=*", "-C", gitRepoPath, "push")
			var pushStderr bytes.Buffer
			pushCmd.Stderr = &pushStderr
			if err := pushCmd.Run(); err != nil {
				log.Printf("[Backup Cron] Git push failed: %v. Stderr: %s", err, pushStderr.String())
				continue
			}

			log.Println("[Backup Cron] Dataset database backup pushed successfully.")
		}
	}()
}

func AutoCreateCollections(app *pocketbase.PocketBase) {
	// 1. Update users collection to add custom fields required by verifying logic
	usersColl, err := app.FindCollectionByNameOrId("users")
	if err == nil {
		hasRole := false
		for _, f := range usersColl.Fields {
			if f.GetName() == "role" {
				hasRole = true
				break
			}
		}
		if !hasRole {
			f1 := &core.TextField{}
			f1.Name = "role"
			usersColl.Fields.Add(f1)

			f2 := &core.TextField{}
			f2.Name = "displayName"
			usersColl.Fields.Add(f2)

			f3 := &core.TextField{}
			f3.Name = "firstName"
			usersColl.Fields.Add(f3)

			f4 := &core.TextField{}
			f4.Name = "lastName"
			usersColl.Fields.Add(f4)

			if err := app.Save(usersColl); err != nil {
				log.Printf("[Auto-Setup] Failed to update users collection: %v", err)
			}
		}
	}

	// 2. Define custom collections schemas using JSON unmarshaling into NewBaseCollection
	collectionsToCreate := []struct {
		Name string
		JSON string
	}{
		{
			Name: "media",
			JSON: `{
				"name": "media",
				"type": "base",
				"listRule": "",
				"viewRule": "",
				"createRule": "",
				"updateRule": "",
				"deleteRule": "",
				"fields": [
					{"name": "file", "type": "file", "maxSelect": 1, "maxSize": 5242880, "required": true}
				]
			}`,
		},
		{
			Name: "otp_codes",
			JSON: `{
				"name": "otp_codes",
				"type": "base",
				"listRule": null,
				"viewRule": null,
				"createRule": null,
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "email", "type": "email", "required": true},
					{"name": "code", "type": "text", "required": true},
					{"name": "expiresAt", "type": "number", "required": true},
					{"name": "attempts", "type": "number"}
				]
			}`,
		},
		{
			Name: "products",
			JSON: `{
				"name": "products",
				"type": "base",
				"listRule": "",
				"viewRule": "",
				"createRule": null,
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "name", "type": "text", "required": true},
					{"name": "description", "type": "text", "required": true},
					{"name": "longDescription", "type": "text"},
					{"name": "price", "type": "number", "required": true},
					{"name": "image", "type": "text", "required": true},
					{"name": "category", "type": "text", "required": true},
					{"name": "ingredients", "type": "json"},
					{"name": "usage", "type": "text"},
					{"name": "benefits", "type": "json"},
					{"name": "weight", "type": "number"}
				]
			}`,
		},
		{
			Name: "categories",
			JSON: `{
				"name": "categories",
				"type": "base",
				"listRule": "",
				"viewRule": "",
				"createRule": null,
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "name", "type": "text", "required": true},
					{"name": "description", "type": "text"}
				]
			}`,
		},
		{
			Name: "orders",
			JSON: `{
				"name": "orders",
				"type": "base",
				"listRule": null,
				"viewRule": null,
				"createRule": "",
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "userId", "type": "text"},
					{"name": "customer", "type": "json"},
					{"name": "items", "type": "json"},
					{"name": "total", "type": "number"},
					{"name": "status", "type": "text"},
					{"name": "trackingNumber", "type": "text"},
					{"name": "trackingStatus", "type": "text"},
					{"name": "trackingUpdatedAt", "type": "text"},
					{"name": "shippingCost", "type": "number"},
					{"name": "isSample", "type": "bool"},
					{"name": "note", "type": "text"}
				]
			}`,
		},
		{
			Name: "chats",
			JSON: `{
				"name": "chats",
				"type": "base",
				"listRule": "@request.auth.id != ''",
				"viewRule": "@request.auth.id != ''",
				"createRule": "@request.auth.id != ''",
				"updateRule": "@request.auth.id != ''",
				"deleteRule": "@request.auth.id != ''",
				"fields": [
					{"name": "messages", "type": "json"},
					{"name": "orderId", "type": "text"},
					{"name": "userId", "type": "text"},
					{"name": "status", "type": "text"}
				]
			}`,
		},
		{
			Name: "coupons",
			JSON: `{
				"name": "coupons",
				"type": "base",
				"listRule": "",
				"viewRule": "",
				"createRule": null,
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "code", "type": "text", "required": true},
					{"name": "discount", "type": "number", "required": true},
					{"name": "type", "type": "text", "required": true},
					{"name": "active", "type": "bool"}
				]
			}`,
		},
		{
			Name: "leads",
			JSON: `{
				"name": "leads",
				"type": "base",
				"listRule": null,
				"viewRule": null,
				"createRule": "",
				"updateRule": "",
				"deleteRule": null,
				"fields": [
					{"name": "name", "type": "text"},
					{"name": "email", "type": "text"},
					{"name": "phone", "type": "text"},
					{"name": "status", "type": "text"}
				]
			}`,
		},
		{
			Name: "forms",
			JSON: `{
				"name": "forms",
				"type": "base",
				"listRule": "",
				"viewRule": "",
				"createRule": null,
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "name", "type": "text"},
					{"name": "data", "type": "json"}
				]
			}`,
		},
		{
			Name: "form_responses",
			JSON: `{
				"name": "form_responses",
				"type": "base",
				"listRule": null,
				"viewRule": null,
				"createRule": "",
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "formId", "type": "text"},
					{"name": "data", "type": "json"}
				]
			}`,
		},
		{
			Name: "posts",
			JSON: `{
				"name": "posts",
				"type": "base",
				"listRule": "",
				"viewRule": "",
				"createRule": null,
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "title", "type": "text", "required": true},
					{"name": "content", "type": "text", "required": true},
					{"name": "image", "type": "text"},
					{"name": "active", "type": "bool"}
				]
			}`,
		},
		{
			Name: "payments",
			JSON: `{
				"name": "payments",
				"type": "base",
				"listRule": null,
				"viewRule": null,
				"createRule": "",
				"updateRule": null,
				"deleteRule": null,
				"fields": [
					{"name": "orderId", "type": "text"},
					{"name": "amount", "type": "number"},
					{"name": "status", "type": "text"},
					{"name": "method", "type": "text"}
				]
			}`,
		},
	}

	for _, item := range collectionsToCreate {
		_, err := app.FindCollectionByNameOrId(item.Name)
		if err != nil {
			coll := core.NewBaseCollection(item.Name)
			if err := json.Unmarshal([]byte(item.JSON), coll); err == nil {
				if err := app.Save(coll); err == nil {
					log.Printf("[Auto-Setup] Created collection: %s", item.Name)
				} else {
					log.Printf("[Auto-Setup] Failed to save collection %s: %v", item.Name, err)
				}
			} else {
				log.Printf("[Auto-Setup] Failed to parse collection %s JSON: %v", item.Name, err)
			}
		}
	}

	// 3. Auto-seed products if none exist
	productsColl, err := app.FindCollectionByNameOrId("products")
	if err == nil {
		countRecords, err := app.FindRecordsByFilter("products", "1=1", "", 1, 0)
		if err == nil && len(countRecords) == 0 {
			log.Println("[Auto-Setup] Seeding initial products list...")
			seedProducts := []map[string]interface{}{
				{
					"name":            "Kit Post-Care RostroDorado",
					"description":     "Rutina completa para maximizar los resultados de tu armonización.",
					"longDescription": "Nuestro Kit Post-Care ha sido diseñado específicamente para la recuperación y mantenimiento después de procedimientos estéticos. Combina limpieza suave, hidratación profunda y protección solar para asegurar que tu piel sane correctamente y los resultados perduren.",
					"price":           250000,
					"image":           "https://images.unsplash.com/photo-1556228720-198307a659cc?auto=format&fit=crop&q=80&w=800",
					"category":        "Kits",
					"ingredients":     []string{"Ácido Hialurónico", "Aloe Vera", "Vitamina E", "Pantenol"},
					"usage":           "Usar mañana y noche. Paso 1: Limpiador. Paso 2: Sérum. Paso 3: Hidratante (solo noche). Paso 4: Protector Solar (solo día).",
					"benefits":        []string{"Acelera la recuperación", "Reduce la inflamación", "Protege de rayos UV", "Mantiene la hidratación"},
					"weight":          1,
				},
				{
					"name":            "Sérum Hialurónico Puro",
					"description":     "Hidratación profunda para mantener el volumen y brillo.",
					"longDescription": "Concentrado de Ácido Hialurónico de bajo y alto peso molecular. Penetra en las capas profundas de la piel para rellenar arrugas finas mientras crea una barrera protectora en la superficie para retener la humedad.",
					"price":           120000,
					"image":           "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800",
					"category":        "Cuidado Facial",
					"ingredients":     []string{"Ácido Hialurónico 2%", "Niacinamida", "Agua Termal"},
					"usage":           "Aplicar 3-4 gotas sobre la piel limpia y húmeda antes de tu crema hidratante.",
					"benefits":        []string{"Hidratación intensa", "Efecto relleno inmediato", "Mejora la textura de la piel"},
					"weight":          0.2,
				},
				{
					"name":            "Protector Solar Toque Seco",
					"description":     "Protección esencial SPF 50+ sin efecto graso.",
					"longDescription": "Protector solar de amplio espectro (UVA/UVB) con textura ligera y acabado mate. Ideal para pieles mixtas a grasas y para uso diario después de tratamientos faciales.",
					"price":           85000,
					"image":           "https://images.unsplash.com/photo-1556228578-8d8959d5771c?auto=format&fit=crop&q=80&w=800",
					"category":        "Protección",
					"ingredients":     []string{"Dióxido de Titanio", "Óxido de Zinc", "Vitamina C"},
					"usage":           "Aplicar generosamente 15 minutos antes de la exposición solar. Reaplicar cada 4 horas.",
					"benefits":        []string{"Protección SPF 50+", "No comedogénico", "Acabado invisible", "Antioxidante"},
					"weight":          0.2,
				},
				{
					"name":            "Crema Reparadora Noche",
					"description":     "Regeneración celular intensiva mientras duermes.",
					"longDescription": "Fórmula rica en péptidos y ceramidas que trabaja durante el ciclo nocturno de reparación de la piel. Restaura la barrera cutánea y mejora la firmeza.",
					"price":           95000,
					"image":           "https://images.unsplash.com/photo-1617220029071-29eac1115849?auto=format&fit=crop&q=80&w=800",
					"category":        "Cuidado Facial",
					"ingredients":     []string{"Ceramidas", "Péptidos", "Retinol Suave"},
					"usage":           "Aplicar en rostro y cuello como último paso de tu rutina nocturna.",
					"benefits":        []string{"Reparación barrera cutánea", "Estimula colágeno", "Nutrición profunda"},
					"weight":          0.3,
				},
				{
					"name":            "Jabón Facial pH Balanceado",
					"description":     "Limpieza suave que respeta la barrera natural de la piel.",
					"longDescription": "Limpiador facial sin sulfatos que elimina impurezas y maquillaje sin resecar la piel. Su pH balanceado es ideal para pieles sensibles o sensibilizadas por tratamientos.",
					"price":           45000,
					"image":           "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=800",
					"category":        "Limpieza",
					"ingredients":     []string{"Extracto de Avena", "Glicerina", "Caléndula"},
					"usage":           "Masajear sobre la piel húmeda y enjuagar con agua tibia.",
					"benefits":        []string{"Limpieza efectiva", "Calma la irritación", "No reseca"},
					"weight":          0.3,
				},
				{
					"name":            "Mascarilla Hidratante",
					"description":     "Boost de hidratación instantánea para eventos especiales.",
					"longDescription": "Mascarilla de biocelulosa impregnada en un suero concentrado de vitaminas y antioxidantes. Proporciona un efecto \"glow\" inmediato, ideal para preparar la piel antes de maquillaje o eventos.",
					"price":           60000,
					"image":           "https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&q=80&w=800",
					"category":        "Mascarillas",
					"ingredients":     []string{"Vitamina C", "Ácido Hialurónico", "Colágeno Hidrolizado"},
					"usage":           "Dejar actuar por 20 minutos. Masajear el exceso de producto.",
					"benefits":        []string{"Luminosidad instantánea", "Hidratación flash", "Piel descansada"},
					"weight":          0.1,
				},
			}

			for _, p := range seedProducts {
				record := core.NewRecord(productsColl)
				record.Set("name", p["name"])
				record.Set("description", p["description"])
				record.Set("longDescription", p["longDescription"])
				record.Set("price", p["price"])
				record.Set("image", p["image"])
				record.Set("category", p["category"])
				record.Set("ingredients", p["ingredients"])
				record.Set("usage", p["usage"])
				record.Set("benefits", p["benefits"])
				record.Set("weight", p["weight"])

				if err := app.Save(record); err != nil {
					log.Printf("[Auto-Setup] Failed to seed product %s: %v", p["name"], err)
				}
			}
			log.Println("[Auto-Setup] Seeding completed.")
		}
	}
}
