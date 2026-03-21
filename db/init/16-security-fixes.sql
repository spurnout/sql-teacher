-- Security and data integrity fixes
-- H4: Prevent a user from joining multiple organizations.
-- The existing UNIQUE(user_id, org_id) only prevents duplicates within the
-- same org. This partial unique index enforces one-org-per-user globally.
-- NOTE: If a user is already in multiple orgs, this migration will fail.
-- Clean up duplicates first if needed.
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_one_per_user
  ON org_members (user_id);

-- M8: Prevent duplicate attempt_numbers from concurrent inserts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_unique_number
  ON user_exercise_attempts (user_id, exercise_id, attempt_number);

-- M4: Index for efficient expired session cleanup.
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires
  ON app_sessions (expires_at);
