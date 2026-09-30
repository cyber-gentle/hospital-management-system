package auth

import (
	"strings"
	"testing"
	"time"
)

func testTokenService() *TokenService {
	return NewTokenService([]byte("test-secret-key-that-is-long-enough-for-hmac"))
}

func TestGenerateAndValidateToken(t *testing.T) {
	tokens := testTokenService()

	userID := "usr-12345"
	username := "dr_smith"
	role := "DOCTOR"
	department := "Cardiology"

	token, err := tokens.Generate(userID, username, role, department)
	if err != nil {
		t.Fatalf("expected no error generating token, got %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := tokens.Validate(token)
	if err != nil {
		t.Fatalf("expected valid token, got %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected userID %s, got %s", userID, claims.UserID)
	}
	if claims.Username != username {
		t.Errorf("expected username %s, got %s", username, claims.Username)
	}
	if claims.Role != role {
		t.Errorf("expected role %s, got %s", role, claims.Role)
	}
	if claims.Department != department {
		t.Errorf("expected department %s, got %s", department, claims.Department)
	}
}

func TestValidateInvalidToken(t *testing.T) {
	tokens := testTokenService()

	if _, err := tokens.Validate("invalid.token.string"); err == nil {
		t.Error("expected error for invalid token string, got nil")
	}
}

// A token signed with a different secret must not validate. This is the
// property that makes the secret worth configuring at all.
func TestValidateRejectsForeignSignature(t *testing.T) {
	issuer := testTokenService()
	attacker := NewTokenService([]byte("a-completely-different-secret-value-x"))

	token, err := attacker.Generate("usr_evil", "attacker", "ADMIN", "IT")
	if err != nil {
		t.Fatalf("failed to build attacker token: %v", err)
	}

	if _, err := issuer.Validate(token); err == nil {
		t.Fatal("expected a token signed with a foreign secret to be rejected")
	}
}

// A token whose "alg" header has been swapped to "none" must be rejected.
func TestValidateRejectsAlgNone(t *testing.T) {
	tokens := testTokenService()

	// header {"alg":"none","typ":"JWT"} / payload {"user_id":"usr_evil","role":"ADMIN"}
	unsigned := "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0." +
		"eyJ1c2VyX2lkIjoidXNyX2V2aWwiLCJ1c2VybmFtZSI6ImF0dGFja2VyIiwicm9sZSI6IkFETUlOIiwiZGVwYXJ0bWVudCI6IklUIn0."

	if _, err := tokens.Validate(unsigned); err == nil {
		t.Fatal("expected an unsigned (alg=none) token to be rejected")
	}
}

func TestValidateRejectsExpiredToken(t *testing.T) {
	tokens := testTokenService()
	// Force an already-expired token by shortening the TTL into the past.
	tokens.ttl = -1 * time.Minute

	token, err := tokens.Generate("usr_1", "nurse_mary", "NURSE", "ICU")
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	_, err = tokens.Validate(token)
	if err == nil {
		t.Fatal("expected an expired token to be rejected")
	}
	if !strings.Contains(err.Error(), "expired") {
		t.Errorf("expected an expiry error, got %v", err)
	}
}
