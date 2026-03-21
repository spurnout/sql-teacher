-- Learning paths — structured curricula for role-based progression
-- Accessible via admin connection only (not sandbox_user)

-- Path definitions
CREATE TABLE learning_paths (
  id              SERIAL PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  estimated_hours INTEGER NOT NULL,
  target_role     TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phases within a path (ordered)
CREATE TABLE learning_path_phases (
  id              SERIAL PRIMARY KEY,
  path_id         INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  phase_id        TEXT NOT NULL,
  phase_order     INTEGER NOT NULL,
  milestone_label TEXT,
  UNIQUE(path_id, phase_id)
);

-- Per-user path enrollment and progress
CREATE TABLE user_path_progress (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  path_id      INTEGER NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, path_id)
);

-- Indexes
CREATE INDEX idx_path_phases_path ON learning_path_phases(path_id);
CREATE INDEX idx_user_path_progress_user ON user_path_progress(user_id);
CREATE INDEX idx_user_path_progress_path ON user_path_progress(path_id);

-- Seed: default "Support → Database Professional" path
INSERT INTO learning_paths (slug, title, description, estimated_hours, target_role)
VALUES (
  'support-to-db-professional',
  'Support → Database Professional',
  'A comprehensive learning path that takes support professionals from SQL fundamentals through database administration. Master querying, optimization, and management skills needed for technical roles.',
  80,
  'Database Professional'
);

-- Add all 9 phases to the default path
INSERT INTO learning_path_phases (path_id, phase_id, phase_order, milestone_label) VALUES
  (1, 'phase-0', 1, 'SQL Foundations'),
  (1, 'phase-1', 2, 'Data Combination'),
  (1, 'phase-2', 3, 'Advanced Querying'),
  (1, 'phase-3', 4, NULL),
  (1, 'phase-4', 5, 'Analytics Ready'),
  (1, 'phase-5', 6, NULL),
  (1, 'phase-6', 7, 'Pattern Master'),
  (1, 'phase-7', 8, NULL),
  (1, 'phase-8', 9, 'Database Professional');
