CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS lifepilot_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_date DATE,
  session_id TEXT
);

CREATE INDEX IF NOT EXISTS lifepilot_plans_session_created_idx
  ON lifepilot_plans (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lifepilot_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES lifepilot_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'Practice',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifepilot_tasks_plan_day_idx
  ON lifepilot_tasks (plan_id, day_index);


-- Authentication tables and per-user plan ownership.
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
