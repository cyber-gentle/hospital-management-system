package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// tokenTTL is how long an issued access token remains valid.
const tokenTTL = 24 * time.Hour

// tokenIssuer identifies this service as the sole issuer of HIMS tokens.
const tokenIssuer = "hims-core-go"

// UserClaims defines custom claims embedded in the JWT token.
type UserClaims struct {
	UserID     string `json:"user_id"`
	Username   string `json:"username"`
	Role       string `json:"role"`
	Department string `json:"department"`
	jwt.RegisteredClaims
}

// TokenService issues and validates HIMS access tokens.
//
// The signing secret is injected rather than read from the environment on each
// call, so a misconfigured service fails during startup (see internal/config)
// instead of silently signing tokens with a placeholder value at request time.
type TokenService struct {
	secret []byte
	ttl    time.Duration
}

// NewTokenService returns a TokenService that signs with the given secret.
func NewTokenService(secret []byte) *TokenService {
	return &TokenService{secret: secret, ttl: tokenTTL}
}

// Generate creates a signed JWT for the authenticated user. The caller is
// responsible for passing the role and department recorded against the user in
// the database — never a value supplied by the client.
func (s *TokenService) Generate(userID, username, role, department string) (string, error) {
	now := time.Now().UTC()
	claims := UserClaims{
		UserID:     userID,
		Username:   username,
		Role:       role,
		Department: department,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    tokenIssuer,
			Subject:   userID,
			Audience:  jwt.ClaimStrings{"hims-clients"},
			ExpiresAt: jwt.NewNumericDate(now.Add(s.ttl)),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(s.secret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return signedToken, nil
}

// Validate parses and verifies the signature, issuer, and expiration of a JWT.
func (s *TokenService) Validate(tokenStr string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(
		tokenStr,
		&UserClaims{},
		func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return s.secret, nil
		},
		jwt.WithIssuer(tokenIssuer),
		jwt.WithAudience("hims-clients"),
		jwt.WithExpirationRequired(),
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
	)
	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}

	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}
	if claims.UserID == "" || claims.Role == "" || claims.Subject != claims.UserID {
		return nil, errors.New("invalid token identity claims")
	}

	return claims, nil
}
