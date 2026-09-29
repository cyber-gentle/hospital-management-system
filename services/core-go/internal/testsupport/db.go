// Package testsupport provides shared helpers for tests that need a live
// PostgreSQL instance.
package testsupport

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"sync/atomic"
	"testing"
	"time"

	"hospital-hims/services/core-go/internal/database"
)

// DatabaseURLEnv names the environment variable that points integration tests
// at a disposable PostgreSQL instance.
const DatabaseURLEnv = "TEST_DATABASE_URL"

var counter uint64

// OpenDB connects to the test database and applies pending migrations.
//
// A missing TEST_DATABASE_URL skips the test rather than failing it, so the
// unit suite still runs on a workstation with no database. CI sets the variable
// (see .github/workflows/ci.yml), so the same tests do run there.
func OpenDB(t *testing.T) *sql.DB {
	t.Helper()

	dsn := os.Getenv(DatabaseURLEnv)
	if dsn == "" {
		t.Skipf("%s is not set; skipping database integration test", DatabaseURLEnv)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	db, err := database.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("failed to connect to the database named by %s: %v", DatabaseURLEnv, err)
	}

	if err := db.RunMigrations(ctx); err != nil {
		t.Fatalf("failed to apply migrations: %v", err)
	}

	t.Cleanup(func() { _ = db.Close() })

	return db.DB
}

// UniqueID returns a per-call token for values that must not collide between
// tests or between runs. audit_logs is append-only, so rows written by one test
// cannot be removed before the next — tests must scope their assertions to a
// freshly generated id rather than counting rows.
func UniqueID(prefix string) string {
	return fmt.Sprintf("%s_%d_%d", prefix, time.Now().UnixNano(), atomic.AddUint64(&counter, 1))
}
