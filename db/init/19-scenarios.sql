-- Multi-step scenario progress tracking
-- Scenarios are connected sequences of 3-5 queries with narrative wrappers

CREATE TABLE IF NOT EXISTS user_scenario_progress (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scenario_id     TEXT NOT NULL,
  current_step    INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_scenario_progress_user
  ON user_scenario_progress(user_id);

CREATE TABLE IF NOT EXISTS user_scenario_step_completions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  scenario_id     TEXT NOT NULL,
  step_index      INTEGER NOT NULL,
  user_sql        TEXT,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scenario_id, step_index)
);

CREATE INDEX IF NOT EXISTS idx_scenario_steps_user
  ON user_scenario_step_completions(user_id, scenario_id);
