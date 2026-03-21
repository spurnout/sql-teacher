-- Query history — stores all executed queries per user
-- Accessible via admin connection only (not sandbox_user)

CREATE TABLE query_history (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  sql_text     TEXT NOT NULL,
  exercise_id  TEXT,
  success      BOOLEAN NOT NULL DEFAULT true,
  row_count    INTEGER NOT NULL DEFAULT 0,
  duration_ms  INTEGER NOT NULL DEFAULT 0,
  bookmarked   BOOLEAN NOT NULL DEFAULT false,
  executed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_query_history_user ON query_history(user_id);
CREATE INDEX idx_query_history_user_time ON query_history(user_id, executed_at DESC);
CREATE INDEX idx_query_history_bookmarked ON query_history(user_id, bookmarked) WHERE bookmarked = true;
