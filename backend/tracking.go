package main

import (
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/pocketbase/pocketbase"
)

func StartTrackingCron(app *pocketbase.PocketBase) {
	ticker := time.NewTicker(2 * time.Hour)
	go func() {
		// Run once on startup
		if err := RunTrackingUpdate(app); err != nil {
			log.Printf("[Tracking Cron] Startup run error: %v", err)
		}

		for range ticker.C {
			if err := RunTrackingUpdate(app); err != nil {
				log.Printf("[Tracking Cron] Periodic run error: %v", err)
			}
		}
	}()
}

func RunTrackingUpdate(app *pocketbase.PocketBase) error {
	log.Println("[Tracking Cron] Starting Tracking Update Job (Envioclick)...")

	// 1. Get orders that are "processing" or "shipped" directly from app
	orders, err := app.FindRecordsByFilter(
		"orders",
		"status = 'processing' || status = 'shipped'",
		"created",
		500,
		0,
	)
	if err != nil {
		return fmt.Errorf("failed to fetch active orders: %w", err)
	}

	if len(orders) == 0 {
		log.Println("[Tracking Cron] No active orders to track.")
		return nil
	}

	updatedCount := 0
	for _, order := range orders {
		trackingNumber := order.GetString("trackingNumber")
		if trackingNumber == "" {
			continue
		}

		// 2. Call Envioclick Tracking API
		trackResult, err := TrackShipment(trackingNumber)
		if err != nil {
			log.Printf("[Tracking Cron] Failed to track order %s (%s): %v", order.Id, trackingNumber, err)
			continue
		}

		statusLower := strings.ToLower(trackResult.Status)
		newStatus := ""

		// Map Status
		if strings.Contains(statusLower, "entregado") || strings.Contains(statusLower, "delivered") {
			newStatus = "delivered"
		} else if strings.Contains(statusLower, "transito") || strings.Contains(statusLower, "recolección") || strings.Contains(statusLower, "camino") {
			newStatus = "shipped"
		} else if strings.Contains(statusLower, "cancelado") || strings.Contains(statusLower, "error") {
			newStatus = "error"
		}

		// Only update if status changed or raw status changed
		if newStatus != "" && (newStatus != order.GetString("status") || trackResult.Status != order.GetString("trackingStatus")) {
			log.Printf("[Tracking Cron] Order %s status changed: %s -> %s (%s)", order.Id, order.GetString("status"), newStatus, trackResult.Status)
			
			order.Set("status", newStatus)
			order.Set("trackingStatus", trackResult.Status)
			order.Set("trackingUpdatedAt", time.Now().Format(time.RFC3339))

			if err := app.Save(order); err != nil {
				log.Printf("[Tracking Cron] Failed to update order %s: %v", order.Id, err)
			} else {
				updatedCount++
			}
		}
	}

	log.Printf("[Tracking Cron] Tracking Job Completed. Updated %d orders.", updatedCount)
	return nil
}
