package auth

import (
	"context"
	"database/sql"
	"errors"
)

// TouchSession is the shared Go authority for access through either service.
// The conditional update prevents an expired session from being revived by a
// later request, and serializes simultaneous requests for the same session.
func TouchSession(ctx context.Context, db *sql.DB, userID, sessionID string, version int) (*User, error) {
	if db == nil {
		return nil, errors.New("session database unavailable")
	}
	if sessionID == "" || userID == "" || version < 0 {
		return nil, sql.ErrNoRows
	}
	var user User
	err := db.QueryRowContext(ctx, `
 UPDATE auth_sessions s SET last_activity_at=clock_timestamp()
 FROM users u,auth_account_security a,auth_security_settings p
 WHERE s.id::text=$1 AND s.user_id=u.id AND u.id::text=$2
 AND a.user_id=u.id AND a.mfa_enrolled_at IS NOT NULL
 AND p.id=true AND s.token_version=$3 AND u.token_version=$3
 AND u.is_active=true AND u.deleted_at IS NULL AND s.revoked_at IS NULL
 AND s.expires_at>clock_timestamp()
 AND s.last_activity_at>clock_timestamp()-make_interval(mins=>p.idle_timeout_minutes)
 RETURNING u.id::text,u.username,u.role,u.department,u.token_version`, sessionID, userID, version).Scan(&user.ID, &user.Username, &user.Role, &user.Department, &user.TokenVersion)
	if err != nil {
		return nil, err
	}
	user.IsActive = true
	return &user, nil
}
