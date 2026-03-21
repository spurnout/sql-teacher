-- Daily challenges — personalized daily exercise selection per user
-- Accessible via admin connection only (not sandbox_user)

CREATE TABLE daily_challenges (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL,
  exercise_id  TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, challenge_date)
);

-- Indexes
CREATE INDEX idx_daily_challenges_user_date ON daily_challenges(user_id, challenge_date DESC);
