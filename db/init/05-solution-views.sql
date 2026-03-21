-- Records when a user views the solution for an exercise.
-- Used by the solution-viewing-with-variation feature and the progress dashboard.
CREATE TABLE user_solution_views (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)  -- one record per user/exercise; tracks first view only
);

CREATE INDEX idx_solution_views_user ON user_solution_views(user_id);
