package main

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
)

func CreateInvoicePdf(order *Order, orderId string) ([]byte, error) {
	// Size: 4x6 inches = 288x432 points
	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		UnitStr: "pt",
		Size:    gofpdf.SizeType{Wd: 288, Ht: 432},
	})
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(false, 0)
	pdf.AddPage()

	startX := 15.0
	endX := 273.0 // 288 - 15
	centerX := 144.0

	// Set Font to Courier
	pdf.SetFont("Courier", "", 8)

	// 1. Logo
	logoUrl := "https://i.imgur.com/93IWNqy.png"
	client := http.Client{Timeout: 2 * time.Second}
	resp, err := client.Get(logoUrl)
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		imgData, err := io.ReadAll(resp.Body)
		if err == nil {
			imgReader := bytes.NewReader(imgData)
			// Register image
			pdf.RegisterImageReader("logo", "PNG", imgReader)
			// Fit logo centered
			pdf.Image("logo", centerX-25, pdf.GetY(), 50, 0, false, "PNG", 0, "")
			pdf.SetY(pdf.GetY() + 50)
		} else {
			renderTextFallbackLogo(pdf, centerX)
		}
	} else {
		renderTextFallbackLogo(pdf, centerX)
	}

	pdf.Ln(10)

	// 2. Subheader
	pdf.SetFont("Courier", "", 8)
	pdf.CellFormat(0, 10, "Nit: 1124048278-9", "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 10, "Calle 12 #12-03 local 2", "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 10, "Riohacha, La Guajira", "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Line Separator
	pdf.Line(startX, pdf.GetY(), endX, pdf.GetY())
	pdf.Ln(8)

	// 3. Receipt Details
	pdf.SetFont("Courier", "B", 9)
	currentY := pdf.GetY()
	pdf.Text(startX, currentY+8, "Recibo No:")
	shortId := orderId
	if len(shortId) > 8 {
		shortId = shortId[:8]
	}
	pdf.Text(150, currentY+8, "#"+strings.ToUpper(shortId))

	pdf.Ln(12)
	currentY = pdf.GetY()
	pdf.Text(startX, currentY+8, "Fecha:")
	dateStr := time.Now().Format("02/01/2006")
	pdf.Text(150, currentY+8, dateStr)
	pdf.Ln(16)

	// 4. Customer Info
	pdf.SetFont("Courier", "B", 9)
	pdf.Text(startX, pdf.GetY()+8, "CLIENTE:")
	pdf.Ln(12)

	pdf.SetFont("Courier", "", 8)
	cust := order.Customer
	fullName := cust.Name
	if fullName == "" {
		fullName = cust.FirstName + " " + cust.LastName
	}

	pdf.CellFormat(0, 10, strings.ToUpper(fullName), "", 1, "L", false, 0, "")
	
	addr := cust.Address
	if cust.Apartment != "" {
		addr += " APTO " + cust.Apartment
	}
	pdf.CellFormat(0, 10, strings.ToUpper(addr), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 10, strings.ToUpper(cust.City+", "+cust.Department), "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 10, "TEL: "+cust.Phone, "", 1, "L", false, 0, "")
	pdf.Ln(8)

	// Line Separator
	pdf.Line(startX, pdf.GetY(), endX, pdf.GetY())
	pdf.Ln(8)

	// 5. Items Header
	currentY = pdf.GetY()
	pdf.SetFont("Courier", "B", 8)
	pdf.Text(startX, currentY+8, "DESCR")
	pdf.Text(180, currentY+8, "CANT")
	pdf.Text(230, currentY+8, "TOTAL")
	pdf.Ln(12)

	// Items List
	pdf.SetFont("Courier", "", 8)
	for _, item := range order.Items {
		name := item.Name
		if len(name) > 23 {
			name = name[:23]
		}

		currentY = pdf.GetY()
		pdf.Text(startX, currentY+8, name)
		pdf.Text(185, currentY+8, fmt.Sprintf("%d", item.Quantity))
		
		itemTotal := item.Price * float64(item.Quantity)
		pdf.Text(230, currentY+8, fmt.Sprintf("$%s", formatCopPrice(itemTotal)))
		pdf.Ln(10)
	}
	pdf.Ln(5)

	// Dotted Separator
	pdf.Line(startX, pdf.GetY(), endX, pdf.GetY())
	pdf.Ln(8)

	// 6. Totals
	pdf.SetFont("Courier", "B", 10)
	currentY = pdf.GetY()
	pdf.Text(startX, currentY+8, "TOTAL:")
	pdf.Text(180, currentY+8, fmt.Sprintf("$%s", formatCopPrice(order.Total)))
	pdf.Ln(12)

	paymentMethods := map[string]string{
		"CARD":                 "TARJETA CRÉDITO/DÉBITO",
		"NEQUI":                "NEQUI",
		"PSE":                  "PSE",
		"BANCOLOMBIA":          "BANCOLOMBIA",
		"BANCOLOMBIA_TRANSFER": "TRANSF. BANCOLOMBIA",
		"BANCOLOMBIA_COLLECT":  "CORRESPONSAL BANCOLOMBIA",
		"DAVIPLATA":            "DAVIPLATA",
		"wompi":                "ONLINE",
	}

	payMethod := strings.ToUpper(order.PaymentMethod)
	if mapped, ok := paymentMethods[order.PaymentMethod]; ok {
		payMethod = mapped
	}
	if payMethod == "" {
		payMethod = "ONLINE"
	}

	pdf.SetFont("Courier", "", 8)
	currentY = pdf.GetY()
	pdf.Text(startX, currentY+8, "Pago:")
	pdf.Text(150, currentY+8, payMethod)
	pdf.Ln(15)

	// Bottom Line
	pdf.Line(startX, pdf.GetY(), endX, pdf.GetY())
	pdf.Ln(12)

	// 7. Footer
	pdf.SetFont("Courier", "B", 8)
	pdf.CellFormat(0, 10, "¡GRACIAS POR SU COMPRA!", "", 1, "C", false, 0, "")
	pdf.SetFont("Courier", "", 7)
	pdf.CellFormat(0, 10, "Comprobante de pago electrónico.", "", 1, "C", false, 0, "")
	pdf.CellFormat(0, 8, "ROSTRO DORADO CLINIC", "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF output: %w", err)
	}

	return buf.Bytes(), nil
}

func renderTextFallbackLogo(pdf *gofpdf.Fpdf, centerX float64) {
	pdf.SetFont("Courier", "B", 14)
	title := "ROSTRO DORADO"
	titleW := pdf.GetStringWidth(title)
	titleX := centerX - (titleW / 2.0)
	pdf.SetY(pdf.GetY() + 5)
	
	// Draw rect border around title
	pdf.Rect(titleX-5, pdf.GetY()-3, titleW+10, 20, "D")
	pdf.Text(titleX, pdf.GetY()+11, title)
	pdf.SetY(pdf.GetY() + 25)
}

func formatCopPrice(val float64) string {
	s := fmt.Sprintf("%.0f", val)
	// Add thousands separator (es-CO uses dot)
	var result []string
	length := len(s)
	for i, r := range s {
		result = append(result, string(r))
		if (length-i-1)%3 == 0 && i != length-1 {
			result = append(result, ".")
		}
	}
	return strings.Join(result, "")
}
