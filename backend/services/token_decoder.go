package services

import (
	"encoding/base64"
	"encoding/json"
	"strings"
)

// FirebaseTokenClaims represents the claims in a Firebase ID token
type FirebaseTokenClaims struct {
	Email         string `json:"email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	EmailVerified bool   `json:"email_verified"`
	Sub           string `json:"sub"`
	Aud           string `json:"aud"`
	Iss           string `json:"iss"`
	Exp           int64  `json:"exp"`
	Iat           int64  `json:"iat"`
}

// DecodeFirebaseToken decodes a Firebase ID token (for development only - doesn't verify signature)
// WARNING: This is for development only! In production, you MUST verify the token signature!
func DecodeFirebaseToken(token string) (*FirebaseTokenClaims, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, json.Unmarshal([]byte("invalid token format"), &FirebaseTokenClaims{})
	}

	// Decode the payload (second part)
	payload := parts[1]
	
	// Add padding if needed
	for len(payload)%4 != 0 {
		payload += "="
	}

	data, err := base64.URLEncoding.DecodeString(payload)
	if err != nil {
		return nil, err
	}

	var claims FirebaseTokenClaims
	err = json.Unmarshal(data, &claims)
	if err != nil {
		return nil, err
	}

	return &claims, nil
}
