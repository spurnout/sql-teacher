-- Adaptive learning — per-attempt tracking for mastery scoring
-- Accessible via admin connection only (not sandbox_user)

CREATE TABLE user_exercise_attempts (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  exercise_id     TEXT NOT NULL,
  attempt_number  INTEGER NOT NULL,
  passed          BOOLEAN NOT NULL,
  hints_used      INTEGER NOT NULL DEFAULT 0,
  time_spent_ms   INTEGER,
  user_sql        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_user ON user_exercise_attempts(user_id);
CREATE INDEX idx_attempts_exercise ON user_exercise_attempts(user_id, exercise_id);
