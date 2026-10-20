package auth

import (
	"bytes"
	"testing"
	"time"
)

func TestTOTPStandardVectorsAndReplay(t *testing.T) {
	// RFC 6238 Appendix B SHA-1 vectors, reduced from 8 to 6 digits.
	secret := []byte("12345678901234567890")
	for _, v := range []struct {
		seconds int64
		code    string
	}{{59, "287082"}, {1111111109, "081804"}, {1111111111, "050471"}, {1234567890, "005924"}, {2000000000, "279037"}, {20000000000, "353130"}} {
		now := time.Unix(v.seconds, 0)
		step := v.seconds / 30
		if got := totpCode(secret, step); got != v.code {
			t.Fatalf("RFC vector %d: %s", v.seconds, got)
		}
		used, ok := verifyTOTP(secret, v.code, now, -1)
		if !ok || used != step {
			t.Fatal("Valid code rejected")
		}
		if _, ok := verifyTOTP(secret, v.code, now, used); ok {
			t.Fatal("Replayed code accepted")
		}
		if _, ok := verifyTOTP(secret, v.code, now.Add(2*time.Minute), -1); ok {
			t.Fatal("Expired code accepted")
		}
	}
	if _, ok := verifyTOTP(secret, "abc123", time.Now(), -1); ok {
		t.Fatal("Malformed code accepted")
	}
	if _, ok := verifyTOTP([]byte("short"), "123456", time.Now(), -1); ok {
		t.Fatal("Short secret accepted")
	}
}
func TestMFASecretEncryptionBindingAndRecovery(t *testing.T) {
	key := bytes.Repeat([]byte{7}, 32)
	raw, encoded, err := newTOTPSecret()
	if err != nil || len(raw) != 20 || len(encoded) != 32 {
		t.Fatalf("Secret generation: %v", err)
	}
	sealed, err := sealMFASecret(key, raw, "synthetic-user")
	if err != nil {
		t.Fatal(err)
	}
	decrypted, err := openMFASecret(key, sealed, "synthetic-user")
	if err != nil || !bytes.Equal(raw, decrypted) {
		t.Fatal("Cannot decrypt own secret")
	}
	if _, err := openMFASecret(key, sealed, "another-user"); err == nil {
		t.Fatal("Account binding bypassed")
	}
	sealed[len(sealed)-1] ^= 1
	if _, err := openMFASecret(key, sealed, "synthetic-user"); err == nil {
		t.Fatal("Tampered ciphertext accepted")
	}
	if _, err := sealMFASecret([]byte("short"), raw, "synthetic-user"); err == nil {
		t.Fatal("Short key accepted")
	}
	code, digest, err := newRecoveryCode("synthetic-user")
	if err != nil || len(code) != 32 || len(digest) != 64 {
		t.Fatal("Recovery generation failed")
	}
	if digest == code || digest != recoveryDigest("synthetic-user", code) || digest == recoveryDigest("another-user", code) {
		t.Fatal("Recovery digest binding failed")
	}
}
