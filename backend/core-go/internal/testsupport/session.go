package testsupport

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"testing"
)

// SeedMFASession supplies session state for module/RBAC fixtures, which do not
// test credential enrollment. Authentication tests exercise real enrollment.
func SeedMFASession(t *testing.T, db *sql.DB, userID string) string {
	t.Helper()
	block, err := aes.NewCipher(bytes.Repeat([]byte{42}, 32))
	if err != nil {
		t.Fatal(err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		t.Fatal(err)
	}
	nonce := make([]byte, aead.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		t.Fatal(err)
	}
	sealed := aead.Seal(nonce, nonce, bytes.Repeat([]byte{7}, 20), []byte(userID))
	_, err = db.Exec(`INSERT INTO auth_account_security(user_id,encrypted_totp_secret,mfa_enrolled_at) VALUES($1,$2,NOW()) ON CONFLICT(user_id) DO NOTHING`, userID, sealed)
	if err != nil {
		t.Fatal(err)
	}
	var id string
	err = db.QueryRow(`INSERT INTO auth_sessions(id,user_id,token_version,expires_at) SELECT gen_random_uuid(),id,token_version,NOW()+INTERVAL '24 hours' FROM users WHERE id=$1 RETURNING id::text`, userID).Scan(&id)
	if err != nil {
		t.Fatal(err)
	}
	return id
}

func SeedRecoveryCode(t *testing.T, db *sql.DB, userID string) string {
	t.Helper()
	raw := make([]byte, 16)
	if _, err := rand.Read(raw); err != nil {
		t.Fatal(err)
	}
	code := hex.EncodeToString(raw)
	digest := sha256.Sum256([]byte(userID + ":" + code))
	if _, err := db.Exec(`INSERT INTO auth_recovery_codes(user_id,code_digest) VALUES($1,$2)`, userID, hex.EncodeToString(digest[:])); err != nil {
		t.Fatal(err)
	}
	return code
}
