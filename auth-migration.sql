-- Run this migration in the Neon SQL Editor before deploying the auth-enabled branch.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lifepilot_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lifepilot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES lifepilot_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifepilot_sessions_user_idx ON lifepilot_sessions(user_id);
CREATE INDEX IF NOT EXISTS lifepilot_sessions_expiry_idx ON lifepilot_sessions(expires_at);

ALTER TABLE lifepilot_plans
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES lifepilot_users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS lifepilot_plans_user_created_idx
  ON lifepilot_plans(user_id, created_at DESC);
