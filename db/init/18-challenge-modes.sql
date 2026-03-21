-- Speed Run sessions: timed challenges (5 exercises from a phase within a time limit)
CREATE TABLE IF NOT EXISTS speed_run_sessions (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  phase_id            TEXT NOT NULL,
  exercise_ids        TEXT[] NOT NULL,
  time_limit_ms       INTEGER NOT NULL DEFAULT 600000,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  elapsed_ms          INTEGER,
  exercises_completed INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_speed_runs_user
  ON speed_run_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_speed_runs_best
  ON speed_run_sessions(user_id, phase_id, elapsed_ms)
  WHERE completed_at IS NOT NULL;

-- SQL Golf: personal best character counts per exercise
CREATE TABLE IF NOT EXISTS sql_golf_records (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  char_count  INTEGER NOT NULL,
  user_sql    TEXT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_golf_records_user
  ON sql_golf_records(user_id);
