package main

import (
	"fmt"
	"net/url"
	"regexp"
	"strings"
	"unicode"

	"github.com/pocketbase/pocketbase"
)

func getGoogleCategory(categoryName string) string {
	mapping := map[string]string{
		"Cuidado Facial":   "Health & Beauty > Personal Care > Cosmetics > Skin Care",
		"Cuidado Corporal": "Health & Beauty > Personal Care > Cosmetics > Bath & Body",
		"Protección Solar": "Health & Beauty > Personal Care > Cosmetics > Skin Care > Sunscreen",
		"Capilar":          "Health & Beauty > Personal Care > Hair Care",
		"Nutrición":        "Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements",
	}
	if val, ok := mapping[categoryName]; ok {
		return val
	}
	return "Health & Beauty > Personal Care"
}

func toTitleCase(str string) string {
	if str == "" {
		return ""
	}
	words := strings.Fields(strings.ToLower(str))
	for i, w := range words {
		if len(w) > 0 {
			r := []rune(w)
			r[0] = unicode.ToUpper(r[0])
			words[i] = string(r)
		}
	}
	return strings.Join(words, " ")
}

func toSentenceCase(str string) string {
	if str == "" {
		return ""
	}
	lower := strings.ToLower(str)
	r := []rune(lower)
	r[0] = unicode.ToUpper(r[0])
	return string(r)
}

func validateAndCleanImageUrl(imageUrl string) string {
	cleanUrl := strings.TrimSpace(imageUrl)
	if !strings.HasPrefix(cleanUrl, "http://") && !strings.HasPrefix(cleanUrl, "https://") {
		return ""
	}

	// Simple check if already encoded, otherwise encode it
	if !strings.Contains(cleanUrl, "%") {
		parsed, err := url.Parse(cleanUrl)
		if err == nil {
			// Reconstruct with path escaped
			parsed.Path = parsed.EscapedPath()
			cleanUrl = parsed.String()
		}
	}

	return cleanUrl
}

func toSlug(text string) string {
	if text == "" {
		return "producto"
	}
	// Simple normalization
	normalized := normalize(text)
	normalized = strings.ToLower(normalized)

	// Replace non-alphanumeric with hyphen
	reg := regexp.MustCompile(`[^a-z0-9]+`)
	slug := reg.ReplaceAllString(normalized, "-")

	// Trim leading/trailing hyphens
	slug = strings.Trim(slug, "-")
	if slug == "" {
		return "producto"
	}
	return slug
}

func escapeXml(unsafe string) string {
	var sb strings.Builder
	for _, r := range unsafe {
		switch r {
		case '<':
			sb.WriteString("&lt;")
		case '>':
			sb.WriteString("&gt;")
		case '&':
			sb.WriteString("&amp;")
		case '\'':
			sb.WriteString("&apos;")
		case '"':
			sb.WriteString("&quot;")
		default:
			sb.WriteRune(r)
		}
	}
	return sb.String()
}

func stripHtml(htmlStr string) string {
	reg := regexp.MustCompile(`<[^>]*>`)
	return reg.ReplaceAllString(htmlStr, "")
}

func GenerateXmlFeed(platform string, app *pocketbase.PocketBase) (string, error) {
	// Retrieve all active products directly from app
	products, err := app.FindRecordsByFilter("products", "1=1", "name", 1000, 0)
	if err != nil {
		return "", fmt.Errorf("failed to fetch products: %w", err)
	}

	var sb strings.Builder
	sb.WriteString(`<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
<channel>
<title>Rostro Dorado Clinic Products</title>
<link>https://rostrodorado.com</link>
<description>Medical and aesthetic products from Rostro Dorado Clinic</description>
`)

	for _, p := range products {
		stock := p.GetInt("stock")
		availability := "out of stock"
		if stock > 0 {
			availability = "in stock"
		}

		productId := p.Id

		// Build description
		desc := p.GetString("description")
		if desc == "" {
			desc = p.GetString("longDescription")
		}
		if desc == "" {
			desc = p.GetString("name")
		}

		// Benefits & Ingredients unmarshaling
		var benefits []string
		if err := unmarshalRecordField(p, "benefits", &benefits); err == nil && len(benefits) > 0 {
			desc += "\n\nBeneficios: " + strings.Join(benefits, ", ")
		}

		var ingredients []string
		if err := unmarshalRecordField(p, "ingredients", &ingredients); err == nil && len(ingredients) > 0 {
			desc += "\n\nIngredientes Clave: " + strings.Join(ingredients, ", ")
		}

		if usage := p.GetString("usage"); usage != "" {
			desc += "\n\nModo de Uso: " + usage
		}

		desc = stripHtml(desc)

		safeTitle := escapeXml(p.GetString("name"))
		safeDescription := escapeXml(desc)
		safeId := escapeXml(productId)

		if platform == "google" || platform == "facebook" {
			safeTitle = escapeXml(toTitleCase(p.GetString("name")))
			safeDescription = escapeXml(toSentenceCase(desc))
		}

		// Image extraction
		rawImage := p.GetString("image")
		if rawImage != "" && !strings.HasPrefix(rawImage, "http") {
			rawImage = fmt.Sprintf("https://rostrodorado.com/api/files/%s/%s/%s", p.Collection().Id, p.Id, rawImage)
		}

		// Fallback for image array
		if rawImage == "" {
			var images []string
			if err := unmarshalRecordField(p, "images", &images); err == nil && len(images) > 0 {
				rawImage = images[0]
				if !strings.HasPrefix(rawImage, "http") {
					rawImage = fmt.Sprintf("https://rostrodorado.com/api/files/%s/%s/%s", p.Collection().Id, p.Id, rawImage)
				}
			}
		}

		imageUrl := validateAndCleanImageUrl(rawImage)
		if imageUrl == "" {
			imageUrl = "https://rostrodorado.com/logo.png"
		}

		slug := p.GetString("slug")
		if slug == "" {
			slug = toSlug(p.GetString("name"))
		}
		urlSlug := escapeXml(slug)

		price := p.GetFloat("price")

		sb.WriteString("<item>\n")
		sb.WriteString(fmt.Sprintf("<g:id>%s</g:id>\n", safeId))
		sb.WriteString(fmt.Sprintf("<g:title>%s</g:title>\n", safeTitle))
		sb.WriteString(fmt.Sprintf("<g:description>%s</g:description>\n", safeDescription))
		sb.WriteString(fmt.Sprintf("<g:link>https://rostrodorado.com/productos/%s/%s</g:link>\n", urlSlug, escapeXml(productId)))
		sb.WriteString(fmt.Sprintf("<g:image_link>%s</g:image_link>\n", escapeXml(imageUrl)))
		sb.WriteString("<g:brand>Rostro Dorado</g:brand>\n")
		sb.WriteString("<g:condition>new</g:condition>\n")
		sb.WriteString(fmt.Sprintf("<g:availability>%s</g:availability>\n", availability))
		sb.WriteString(fmt.Sprintf("<g:price>%.0f COP</g:price>\n", price))
		sb.WriteString("<g:shipping>\n  <g:country>CO</g:country>\n  <g:service>Standard</g:service>\n  <g:price>0 COP</g:price>\n</g:shipping>\n")
		sb.WriteString(fmt.Sprintf("<g:google_product_category>%s</g:google_product_category>\n", escapeXml(getGoogleCategory(p.GetString("category")))))
		sb.WriteString("</item>\n")
	}

	sb.WriteString(`</channel>
</rss>`)

	return sb.String(), nil
}
