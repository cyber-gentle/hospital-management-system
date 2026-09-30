package auth

import (
	"testing"
)

func TestGenerateAndValidateToken(t *testing.T) {
	userID := "usr-12345"
	username := "dr_smith"
	role := "DOCTOR"
	department := "Cardiology"

	token, err := GenerateToken(userID, username, role, department)
	if err != nil {
		t.Fatalf("expected no error generating token, got %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ValidateToken(token)
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
	_, err := ValidateToken("invalid.token.string")
	if err == nil {
		t.Error("expected error for invalid token string, got nil")
	}
}
