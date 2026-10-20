-- Go owns authentication state; Python authorizes sessions through Go.
CREATE TABLE auth_security_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
    max_failed_attempts INTEGER NOT NULL CHECK (max_failed_attempts BETWEEN 1 AND 10),
    lockout_minutes INTEGER NOT NULL CHECK (lockout_minutes BETWEEN 1 AND 1440),
    idle_timeout_minutes INTEGER NOT NULL CHECK (idle_timeout_minutes BETWEEN 1 AND 30),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);
INSERT INTO auth_security_settings(id,max_failed_attempts,lockout_minutes,idle_timeout_minutes)
VALUES(TRUE,5,15,30);

CREATE TABLE auth_account_security (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    failed_attempts INTEGER NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
    locked_until TIMESTAMPTZ,
    encrypted_totp_secret BYTEA,
    mfa_enrolled_at TIMESTAMPTZ,
    last_totp_step BIGINT NOT NULL DEFAULT -1,
    CHECK (mfa_enrolled_at IS NULL OR encrypted_totp_secret IS NOT NULL)
);

CREATE TABLE auth_recovery_codes (
    user_id UUID NOT NULL REFERENCES users(id),
    code_digest TEXT NOT NULL CHECK (length(code_digest) = 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMPTZ,
    PRIMARY KEY(user_id,code_digest)
);

CREATE TABLE auth_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    token_version INTEGER NOT NULL CHECK (token_version >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    CHECK (expires_at > created_at)
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
