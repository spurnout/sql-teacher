-- Skill assessments — timed tests per phase for entry/exit benchmarking
-- Accessible via admin connection only (not sandbox_user)

-- Assessment definitions
CREATE TABLE assessments (
  id                 SERIAL PRIMARY KEY,
  phase_id           TEXT NOT NULL,
  assessment_type    TEXT NOT NULL CHECK (assessment_type IN ('entry', 'exit')),
  title              TEXT NOT NULL,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  exercise_count     INTEGER NOT NULL DEFAULT 10,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phase_id, assessment_type)
);

-- User assessment attempts and results
CREATE TABLE assessment_results (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  assessment_id   INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  score_pct       INTEGER NOT NULL CHECK (score_pct >= 0 AND score_pct <= 100),
  exercises_passed INTEGER NOT NULL DEFAULT 0,
  exercises_total  INTEGER NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessment_results_user ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_assessment ON assessment_results(assessment_id);

-- Seed assessments for each phase
INSERT INTO assessments (phase_id, assessment_type, title, time_limit_minutes, exercise_count) VALUES
  ('phase-0', 'entry', 'SQL Fundamentals — Entry Assessment', 20, 5),
  ('phase-0', 'exit',  'SQL Fundamentals — Exit Assessment',  30, 8),
  ('phase-1', 'entry', 'JOIN Mastery — Entry Assessment',     20, 5),
  ('phase-1', 'exit',  'JOIN Mastery — Exit Assessment',      30, 8),
  ('phase-2', 'entry', 'Subqueries — Entry Assessment',       20, 5),
  ('phase-2', 'exit',  'Subqueries — Exit Assessment',        30, 8),
  ('phase-3', 'entry', 'CTEs — Entry Assessment',             20, 5),
  ('phase-3', 'exit',  'CTEs — Exit Assessment',              30, 8),
  ('phase-4', 'entry', 'Window Functions — Entry Assessment',  25, 6),
  ('phase-4', 'exit',  'Window Functions — Exit Assessment',   30, 8),
  ('phase-5', 'entry', 'Query Optimization — Entry Assessment', 25, 5),
  ('phase-5', 'exit',  'Query Optimization — Exit Assessment',  30, 7),
  ('phase-6', 'entry', 'SQL Patterns — Entry Assessment',      25, 6),
  ('phase-6', 'exit',  'SQL Patterns — Exit Assessment',       30, 8),
  ('phase-7', 'entry', 'DML & DDL — Entry Assessment',         20, 5),
  ('phase-7', 'exit',  'DML & DDL — Exit Assessment',          30, 8),
  ('phase-8', 'entry', 'DB Administration — Entry Assessment',  25, 5),
  ('phase-8', 'exit',  'DB Administration — Exit Assessment',   30, 7);
