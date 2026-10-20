package auth

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// productionBcryptCost is the work factor for stored passwords. 12 is above the
// bcrypt default of 10 and is the current common floor for stored credentials;
// it costs roughly a quarter second per verification on server hardware, which
// is acceptable for an interactive login and expensive for an offline attacker.
const productionBcryptCost = 12

// bcryptCost is the work factor actually used. It is a variable rather than a
// constant only so the test suite can lower it — bcrypt cost dominates the
// runtime of the auth tests, and the cost factor is a property of the
// algorithm, not of this service's logic. Production never reassigns it.
var bcryptCost = productionBcryptCost

// maxPasswordLen is bcrypt's hard input limit. Longer input is rejected rather
// than silently truncated, so a user whose 80-character passphrase is accepted
// today is not locked out when the truncation behaviour changes.
const maxPasswordLen = 72

// ErrPasswordTooLong is returned when the supplied password exceeds bcrypt's
// input limit.
var ErrPasswordTooLong = fmt.Errorf("password exceeds the maximum length of %d bytes", maxPasswordLen)

// HashPassword returns a bcrypt hash of plaintext, suitable for storing in
// users.password_hash.
func HashPassword(plaintext string) (string, error) {
	if plaintext == "" {
		return "", errors.New("password must not be empty")
	}
	if len(plaintext) > maxPasswordLen {
		return "", ErrPasswordTooLong
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(plaintext), bcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hash), nil
}

// VerifyPassword reports whether plaintext matches the stored bcrypt hash.
// It returns false rather than an error for every mismatch: the caller is
// expected to respond identically to "wrong password" and "no such user".
func VerifyPassword(hash, plaintext string) bool {
	if hash == "" {
		return false
	}
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(plaintext)) == nil
}
