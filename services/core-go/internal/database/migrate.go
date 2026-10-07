package database

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"sort"
	"strings"

	"hospital-hims/services/core-go/internal/common"
	"hospital-hims/services/core-go/migrations"
)

// RunMigrations applies all pending .up.sql migrations embedded in the migrations package
func (db *DB) RunMigrations(ctx context.Context) error {
	tx, err := db.BeginTx(ctx, &sql.TxOptions{})
	if err != nil {
		return fmt.Errorf("start migrations: %w", err)
	}
	defer common.Rollback(tx)
	// Serialize startup across service instances and parallel integration tests.
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock(734901825)`); err != nil {
		return fmt.Errorf("lock migrations: %w", err)
	}
	// 1. Ensure the schema_migrations tracking table exists
	tableQuery := `
	CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := tx.ExecContext(ctx, tableQuery); err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// 2. Fetch already applied migration versions
	rows, err := tx.QueryContext(ctx, "SELECT version FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("failed to query applied migrations: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return fmt.Errorf("failed to scan migration version: %w", err)
		}
		applied[version] = true
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("error reading applied migrations: %w", err)
	}
	if err := rows.Close(); err != nil {
		return fmt.Errorf("close migration versions: %w", err)
	}

	// 3. Find and sort all .up.sql files from embedded migrations FS
	entries, err := fs.ReadDir(migrations.FS, ".")
	if err != nil {
		return fmt.Errorf("failed to read embedded migrations: %w", err)
	}

	var upFiles []string
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".up.sql") {
			upFiles = append(upFiles, entry.Name())
		}
	}
	sort.Strings(upFiles)

	// 4. Apply pending migrations within transactions
	for _, fileName := range upFiles {
		if applied[fileName] {
			continue
		}

		content, err := fs.ReadFile(migrations.FS, fileName)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", fileName, err)
		}

		if _, err := tx.ExecContext(ctx, string(content)); err != nil {
			return fmt.Errorf("failed executing migration %s: %w", fileName, err)
		}

		if _, err := tx.ExecContext(ctx, "INSERT INTO schema_migrations (version) VALUES ($1)", fileName); err != nil {
			return fmt.Errorf("failed to record migration %s: %w", fileName, err)
		}

		log.Printf("Applied database migration: %s", fileName)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit migrations: %w", err)
	}
	return nil
}
