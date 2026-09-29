package auth

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
)

// ErrUserNotFound is returned when no live user matches the supplied username.
var ErrUserNotFound = errors.New("user not found")

// User is the subset of a users row needed to authenticate a request.
type User struct {
	ID           string
	Username     string
	PasswordHash string
	Role         string
	Department   string
	IsActive     bool
}

// UserStore resolves credentials during login. It is an interface so that the
// login handler can be tested without a live PostgreSQL instance.
type UserStore interface {
	FindByUsername(ctx context.Context, username string) (*User, error)
}

// PostgresUserStore reads users from the shared PostgreSQL instance.
type PostgresUserStore struct {
	db *sql.DB
}

// NewPostgresUserStore returns a UserStore backed by the given connection pool.
func NewPostgresUserStore(db *sql.DB) *PostgresUserStore {
	return &PostgresUserStore{db: db}
}

// FindByUsername returns the active or inactive user with the given username,
// or ErrUserNotFound. Soft-deleted rows are excluded: a deleted account must
// not be able to authenticate.
func (s *PostgresUserStore) FindByUsername(ctx context.Context, username string) (*User, error) {
	const query = `
		SELECT id::text, username, password_hash, role, department, is_active
		FROM users
		WHERE username = $1 AND deleted_at IS NULL`

	var user User
	err := s.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.PasswordHash,
		&user.Role,
		&user.Department,
		&user.IsActive,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to look up user %q: %w", username, err)
	}

	return &user, nil
}
