package main

import (
	"fmt"
	"math/rand"
	"net/mail"
	"time"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/mailer"
	"github.com/pocketbase/pocketbase/tools/security"
)

type SendOtpRequest struct {
	Email string `json:"email"`
}

type VerifyOtpRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

func SendOtp(email string, app *pocketbase.PocketBase) error {
	// Generate 6-digit random code
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := fmt.Sprintf("%06d", r.Intn(900000)+100000)
	expiresAt := time.Now().Add(15 * time.Minute).UnixNano() / 1e6 // milliseconds

	// Save/Update in Pocketbase collection "otp_codes"
	otpCollection, err := app.FindCollectionByNameOrId("otp_codes")
	if err != nil {
		return fmt.Errorf("otp_codes collection not found: %w", err)
	}

	// Try to find existing OTP record for this email
	existingRecord, err := app.FindFirstRecordByData("otp_codes", "email", email)
	var otpRecord *core.Record
	if err == nil {
		otpRecord = existingRecord
	} else {
		otpRecord = core.NewRecord(otpCollection)
	}

	otpRecord.Set("email", email)
	otpRecord.Set("code", code)
	otpRecord.Set("expiresAt", expiresAt)
	otpRecord.Set("attempts", 0)

	if err := app.Save(otpRecord); err != nil {
		return fmt.Errorf("failed to save OTP: %w", err)
	}

	// Inline HTML Template for email
	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Montserrat', Helvetica, Arial, sans-serif; }
    .container { 
      max-width: 600px; 
      margin: 40px auto; 
      background-color: #ffffff; 
      padding: 60px 20px; 
      border-radius: 4px;
      text-align: center;
    }
    .logo-img { max-height: 90px; width: auto; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto; }
    .intro-text { color: #333333; font-size: 16px; margin-bottom: 30px; font-weight: 400; }
    .code-display { 
      font-family: 'Montserrat', sans-serif;
      font-size: 48px; 
      color: #111111; 
      letter-spacing: 15px; 
      font-weight: 700; 
      margin: 20px 0;
      line-height: 1;
    }
    .expiry-text { font-size: 14px; color: #666666; margin-top: 20px; margin-bottom: 50px; font-weight: 300; }
    .footer { border-top: 1px solid #eeeeee; padding-top: 30px; margin-top: 20px; }
    .footer-text { color: #999999; font-size: 12px; margin-bottom: 10px; }
    .footer-link { color: #C6A87C; text-decoration: none; font-size: 12px; font-weight: 500; }
    @media (prefers-color-scheme: dark) {
      body { background-color: #1a1a1a !important; }
      .container { background-color: #ffffff !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; word-spacing: normal;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); max-width: 600px; width: 100%;">
          <tr>
            <td align="center" style="padding: 40px 0 30px 0;">
              <img src="https://i.imgur.com/93IWNqy.png" alt="Rostro Dorado Clinic" width="220" style="display: block; width: 220px; max-width: 100%; height: auto; border: 0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 0 40px;">
              <p style="font-family: 'Montserrat', sans-serif;font-size: 16px; color: #333333; margin: 0 0 30px 0; font-weight: 400;">
                Tu código de verificación:
              </p>
              <div style="font-family: 'Montserrat', sans-serif; font-size: 48px; color: #111111; letter-spacing: 12px; font-weight: 700; margin: 20px 0; line-height: 1;">
                %s
              </div>
              <p style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #666666; margin: 40px 0 50px 0; font-weight: 300;">
                Este código solo se puede usar una vez. Vencerá en 15 minutos.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="border-top: 1px solid #eeeeee; padding: 30px 40px 40px 40px;">
              <div style="margin-bottom: 20px;">
                <a href="https://www.instagram.com/rostrodoradoclinic/" style="color: #111111; text-decoration: none; margin: 0 10px; font-weight: 600; font-size: 10px; letter-spacing: 2px; font-family: 'Montserrat', sans-serif; text-transform: uppercase;">INSTAGRAM</a>
                <span style="color: #cccccc;">|</span>
                <a href="https://www.facebook.com/people/Dra-Isaura-Dorado/100067023886893/" style="color: #111111; text-decoration: none; margin: 0 10px; font-weight: 600; font-size: 10px; letter-spacing: 2px; font-family: 'Montserrat', sans-serif; text-transform: uppercase;">FACEBOOK</a>
                <span style="color: #cccccc;">|</span>
                <a href="https://www.tiktok.com/@draisauradorado" style="color: #111111; text-decoration: none; margin: 0 10px; font-weight: 600; font-size: 10px; letter-spacing: 2px; font-family: 'Montserrat', sans-serif; text-transform: uppercase;">TIKTOK</a>
              </div>
              <p style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #999999; margin: 0;">
                &copy; %d ROSTRO DORADO CLINIC
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, code, time.Now().Year())

	senderAddress := app.Settings().Meta.SenderAddress
	senderName := app.Settings().Meta.SenderName
	if senderAddress == "" {
		senderAddress = "no-reply@rostrodorado.com"
	}
	if senderName == "" {
		senderName = "Rostro Dorado Clinic"
	}

	// Prepare mailer message
	message := &mailer.Message{
		From: mail.Address{
			Address: senderAddress,
			Name:    senderName,
		},
		To:      []mail.Address{{Address: email}},
		Subject: "Tu Código de Acceso - Rostro Dorado",
		HTML:    htmlContent,
	}

	// Send using Pocketbase client settings
	if err := app.NewMailClient().Send(message); err != nil {
		return fmt.Errorf("failed to send OTP email: %w", err)
	}

	return nil
}

func VerifyOtp(email, code string, app *pocketbase.PocketBase) (string, *core.Record, error) {
	otpRecord, err := app.FindFirstRecordByData("otp_codes", "email", email)
	if err != nil {
		return "", nil, fmt.Errorf("código inválido o vencido")
	}

	now := time.Now().UnixNano() / 1e6
	expiresAt := int64(otpRecord.GetInt("expiresAt"))
	if now > expiresAt {
		return "", nil, fmt.Errorf("código vencido")
	}

	if otpRecord.GetString("code") != code {
		// Increment attempts
		attempts := otpRecord.GetInt("attempts") + 1
		otpRecord.Set("attempts", attempts)
		_ = app.Save(otpRecord)
		return "", nil, fmt.Errorf("código inválido")
	}

	// Get or Create User in Pocketbase
	usersCollection, err := app.FindCollectionByNameOrId("users")
	if err != nil {
		return "", nil, fmt.Errorf("users collection not found")
	}

	userRecord, err := app.FindFirstRecordByData("users", "email", email)
	if err != nil {
		// Create new user (lazy sync)
		userRecord = core.NewRecord(usersCollection)
		userRecord.Set("email", email)
		userRecord.Set("emailVisibility", true)
		userRecord.Set("password", security.RandomString(32)) // Secure random password
		userRecord.Set("displayName", "")
		userRecord.Set("firstName", "")
		userRecord.Set("lastName", "")
		userRecord.Set("role", "customer")
		if email == "isauradorado@rostrodorado.com" {
			userRecord.Set("role", "admin")
		}

		if err := app.Save(userRecord); err != nil {
			return "", nil, fmt.Errorf("failed to auto-create user: %w", err)
		}
	}

	// Delete OTP record to prevent replay
	if err := app.Delete(otpRecord); err != nil {
		fmt.Printf("[VerifyOtp] warning: failed to delete otp record: %v\n", err)
	}

	// Generate a Pocketbase Auth Token directly from the record model
	token, err := userRecord.NewAuthToken()
	if err != nil {
		return "", nil, fmt.Errorf("failed to generate auth token: %w", err)
	}

	return token, userRecord, nil
}
