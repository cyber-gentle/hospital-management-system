package config

import (
	"strings"
	"testing"
)

const (
	validJWTSecret   = "a-real-jwt-secret-of-sufficient-length-000000"
	validInternalKey = "a-real-internal-service-key"
)

func setValidEnv(t *testing.T) {
	t.Helper()
	t.Setenv("JWT_SECRET", validJWTSecret)
	t.Setenv("INTERNAL_SERVICE_KEY", validInternalKey)
}

func TestLoadSucceedsWithValidSecrets(t *testing.T) {
	setValidEnv(t)
	t.Setenv("PORT", "9999")
	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/hims")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected valid configuration, got %v", err)
	}

	if cfg.Port != "9999" {
		t.Errorf("expected port 9999, got %s", cfg.Port)
	}
	if string(cfg.JWTSecret) != validJWTSecret {
		t.Errorf("expected JWT secret to be carried through, got %q", cfg.JWTSecret)
	}
	if cfg.InternalServiceKey != validInternalKey {
		t.Errorf("expected internal key to be carried through, got %q", cfg.InternalServiceKey)
	}
}

func TestLoadDefaultsPort(t *testing.T) {
	setValidEnv(t)
	t.Setenv("PORT", "")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected valid configuration, got %v", err)
	}
	if cfg.Port != "8080" {
		t.Errorf("expected default port 8080, got %s", cfg.Port)
	}
}

// The central regression guard for the fail-open behaviour: an unset secret
// must be a startup error, never a silent fallback.
func TestLoadFailsClosedWhenSecretsMissing(t *testing.T) {
	cases := []struct {
		name string
		env  map[string]string
	}{
		{"both missing", map[string]string{"JWT_SECRET": "", "INTERNAL_SERVICE_KEY": ""}},
		{"jwt missing", map[string]string{"JWT_SECRET": "", "INTERNAL_SERVICE_KEY": validInternalKey}},
		{"internal key missing", map[string]string{"JWT_SECRET": validJWTSecret, "INTERNAL_SERVICE_KEY": ""}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			for k, v := range tc.env {
				t.Setenv(k, v)
			}
			if _, err := Load(); err == nil {
				t.Fatal("expected Load to fail when a required secret is unset")
			}
		})
	}
}

func TestLoadRejectsShortSecrets(t *testing.T) {
	t.Setenv("JWT_SECRET", "too-short")
	t.Setenv("INTERNAL_SERVICE_KEY", validInternalKey)

	if _, err := Load(); err == nil {
		t.Fatal("expected Load to reject a JWT_SECRET below the minimum length")
	}
}

// The values that previously served as in-code fallbacks are published in this
// repository, so configuring one explicitly must still be refused.
func TestLoadRejectsKnownPlaceholders(t *testing.T) {
	cases := []struct {
		name      string
		jwtSecret string
		internal  string
	}{
		{"old jwt placeholder", "dev_insecure_jwt_secret_key_32bytes_long", validInternalKey},
		{"old internal placeholder", validJWTSecret, "dev_internal_service_key_secret"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("JWT_SECRET", tc.jwtSecret)
			t.Setenv("INTERNAL_SERVICE_KEY", tc.internal)

			_, err := Load()
			if err == nil {
				t.Fatal("expected Load to reject a known development placeholder")
			}
			if !strings.Contains(err.Error(), "placeholder") {
				t.Errorf("expected a placeholder-specific error, got %v", err)
			}
		})
	}
}
