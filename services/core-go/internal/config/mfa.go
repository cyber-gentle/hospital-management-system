package config

import (
	"encoding/base64"
	"errors"
	"os"
)

// LoadMFAEncryptionKey requires a separately generated, persistent encryption
// key. Rotating JWT signing keys must not destroy enrolled authenticator secrets.
func LoadMFAEncryptionKey() ([]byte, error) {
	key, err := base64.StdEncoding.DecodeString(os.Getenv("MFA_ENCRYPTION_KEY"))
	if err != nil || len(key) != 32 {
		return nil, errors.New("MFA_ENCRYPTION_KEY must be base64 encoding of 32 random bytes; generate with openssl rand -base64 32")
	}
	return key, nil
}
