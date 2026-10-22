ALTER TABLE lifepilot_plans ADD COLUMN IF NOT EXISTS session_id TEXT;
CREATE INDEX IF NOT EXISTS lifepilot_plans_session_created_idx ON lifepilot_plans (session_id, created_at DESC);