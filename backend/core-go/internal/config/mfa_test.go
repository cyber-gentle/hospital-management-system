package config

import (
	"bytes"
	"encoding/base64"
	"testing"
)

func TestMFAEncryptionKeyFailsClosed(t *testing.T) {
	for _, value := range []string{"", "not base64", base64.StdEncoding.EncodeToString([]byte("short"))} {
		t.Setenv("MFA_ENCRYPTION_KEY", value)
		if _, err := LoadMFAEncryptionKey(); err == nil {
			t.Fatal("Invalid MFA encryption key accepted")
		}
	}
	expected := bytes.Repeat([]byte{42}, 32)
	t.Setenv("MFA_ENCRYPTION_KEY", base64.StdEncoding.EncodeToString(expected))
	actual, err := LoadMFAEncryptionKey()
	if err != nil || !bytes.Equal(actual, expected) {
		t.Fatal("Valid encryption key rejected")
	}
}
