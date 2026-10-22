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
