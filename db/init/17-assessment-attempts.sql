-- Server-side assessment attempt tracking for tamper-proof scoring.
-- When a user starts an assessment, the attempt and its exercise list are
-- persisted here. Individual exercise results are recorded as the user
-- validates each answer. On submit, the score is computed from server data.

-- Active assessment attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  assessment_id   INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  exercise_ids    TEXT[] NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  submitted       BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_assessment_attempts_user ON assessment_attempts(user_id);

-- Individual exercise results within an attempt
CREATE TABLE IF NOT EXISTS assessment_exercise_results (
  id          SERIAL PRIMARY KEY,
  attempt_id  INTEGER NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  passed      BOOLEAN NOT NULL,
  validated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attempt_id, exercise_id)
);

CREATE INDEX idx_assessment_exercise_results_attempt ON assessment_exercise_results(attempt_id);
