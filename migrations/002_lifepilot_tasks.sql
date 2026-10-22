CREATE TABLE IF NOT EXISTS lifepilot_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES lifepilot_plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  day_index INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'Practice',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','done')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)