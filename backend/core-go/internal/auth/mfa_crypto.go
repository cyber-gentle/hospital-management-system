package auth

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base32"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"time"
)

// TOTP uses RFC 6238's interoperable SHA-1/6-digit/30-second profile.
// SHA-1 is used solely inside the RFC-defined HMAC construction.
func totpCode(secret []byte, step int64) string {
	var counter [8]byte
	binary.BigEndian.PutUint64(counter[:], uint64(step))
	mac := hmac.New(sha1.New, secret)
	_, err := mac.Write(counter[:])
	if err != nil {
		return ""
	} // hash.Hash.Write cannot fail.
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 15
	value := binary.BigEndian.Uint32(sum[offset:offset+4]) & 0x7fffffff
	return fmt.Sprintf("%06d", value%1000000)
}

// The caller must atomically persist the returned step with authentication.
// Accepting a step already consumed would permit replay within the time window.
func verifyTOTP(secret []byte, code string, now time.Time, lastStep int64) (int64, bool) {
	if len(secret) < 20 || len(code) != 6 {
		return 0, false
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			return 0, false
		}
	}
	current := now.UTC().Unix() / 30
	for _, step := range []int64{current, current - 1, current + 1} {
		if step <= lastStep || step < 0 {
			continue
		}
		if subtle.ConstantTimeCompare([]byte(totpCode(secret, step)), []byte(code)) == 1 {
			return step, true
		}
	}
	return 0, false
}
func newTOTPSecret() ([]byte, string, error) {
	raw := make([]byte, 20)
	if _, err := rand.Read(raw); err != nil {
		return nil, "", err
	}
	return raw, base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(raw), nil
}
func mfaCipher(key []byte) (cipher.AEAD, error) {
	if len(key) != 32 {
		return nil, errors.New("MFA encryption key must contain 32 bytes")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

// Bind ciphertext to the account so stored secrets cannot be swapped between users.
func sealMFASecret(key, secret []byte, userID string) ([]byte, error) {
	aead, err := mfaCipher(key)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return aead.Seal(nonce, nonce, secret, []byte(userID)), nil
}
func openMFASecret(key, sealed []byte, userID string) ([]byte, error) {
	aead, err := mfaCipher(key)
	if err != nil {
		return nil, err
	}
	if len(sealed) < aead.NonceSize()+aead.Overhead() {
		return nil, errors.New("Invalid encrypted MFA secret")
	}
	return aead.Open(nil, sealed[:aead.NonceSize()], sealed[aead.NonceSize():], []byte(userID))
}
func recoveryDigest(userID, code string) string {
	digest := sha256.Sum256([]byte(userID + ":" + code))
	return hex.EncodeToString(digest[:])
}
func newRecoveryCode(userID string) (string, string, error) {
	raw := make([]byte, 16)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	code := hex.EncodeToString(raw)
	return code, recoveryDigest(userID, code), nil
}
