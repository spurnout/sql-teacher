-- Gamification tables — XP, streaks, badges, capstones, certificates
-- Accessible via admin connection only (not sandbox_user)

-- XP events (event-sourced: total XP = SUM of all events for a user)
CREATE TABLE user_xp_events (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  xp_amount   INTEGER NOT NULL,
  reason      TEXT NOT NULL,       -- 'completion', 'first_attempt_bonus', 'streak_bonus'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exercise_id, reason)
);

-- Streak tracking (one row per user, updated on each activity)
CREATE TABLE user_streaks (
  user_id            INTEGER PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  longest_streak     INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Badge awards
CREATE TABLE user_badges (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  badge_id  TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Capstone project progress
CREATE TABLE user_capstone_progress (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  capstone_id  TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, capstone_id)
);

-- Certificates (public verification via certificate_id UUID)
CREATE TABLE user_certificates (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL UNIQUE,
  issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_xp       INTEGER NOT NULL,
  level          TEXT NOT NULL,
  capstone_data  JSONB NOT NULL
);

-- Indexes
CREATE INDEX idx_xp_events_user ON user_xp_events(user_id);
CREATE INDEX idx_badges_user ON user_badges(user_id);
CREATE INDEX idx_capstone_progress_user ON user_capstone_progress(user_id);
CREATE INDEX idx_certificates_user ON user_certificates(user_id);
