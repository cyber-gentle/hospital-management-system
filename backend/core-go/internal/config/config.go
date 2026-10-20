package config

import (
	"fmt"
	"os"
	"strings"
)

// Minimum secret lengths. HMAC-SHA256 keys shorter than the 32-byte block
// size carry less entropy than the hash function can use, so a short key is
// treated as a configuration error rather than quietly accepted.
const (
	MinJWTSecretLen   = 32
	MinInternalKeyLen = 16
)

// insecurePlaceholders are values that have appeared in this repository's
// documentation and compose files as development defaults. They are rejected
// outright: if one of these reaches a running service it means a real secret
// was never configured, and failing at boot is the only safe response.
var insecurePlaceholders = []string{
	"dev_insecure_jwt_secret_key_32bytes_long",
	"dev_internal_service_key_secret",
}

// Config holds validated process configuration.
type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          []byte
	InternalServiceKey string
}

// Load reads configuration from the environment and validates it.
//
// This deliberately fails closed. An earlier version of this service
// substituted a hard-coded development secret whenever JWT_SECRET or
// INTERNAL_SERVICE_KEY was unset, which meant a production deployment that
// forgot to configure them would still start — and would then sign tokens and
// authorise internal service calls with a value published in the repository.
// A missing secret is now a startup error.
func Load() (*Config, error) {
	cfg := &Config{
		Port:        envOrDefault("PORT", "8080"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
	}

	jwtSecret, err := requiredSecret("JWT_SECRET", MinJWTSecretLen, "openssl rand -base64 48")
	if err != nil {
		return nil, err
	}
	cfg.JWTSecret = []byte(jwtSecret)

	internalKey, err := requiredSecret("INTERNAL_SERVICE_KEY", MinInternalKeyLen, "openssl rand -base64 32")
	if err != nil {
		return nil, err
	}
	cfg.InternalServiceKey = internalKey

	return cfg, nil
}

// requiredSecret returns the named environment variable, rejecting unset,
// too-short, and known-placeholder values.
func requiredSecret(name string, minLen int, generateHint string) (string, error) {
	value := os.Getenv(name)
	if value == "" {
		return "", fmt.Errorf("%s is not set; generate one with `%s` and set it before starting the service", name, generateHint)
	}

	for _, placeholder := range insecurePlaceholders {
		if strings.EqualFold(value, placeholder) {
			return "", fmt.Errorf("%s is set to a known development placeholder published in this repository; generate a real secret with `%s`", name, generateHint)
		}
	}

	if len(value) < minLen {
		return "", fmt.Errorf("%s must be at least %d bytes, got %d; generate one with `%s`", name, minLen, len(value), generateHint)
	}

	return value, nil
}

func envOrDefault(name, fallback string) string {
	if value := os.Getenv(name); value != "" {
		return value
	}
	return fallback
}
