-- ============================================================
-- Custom Company Themes
-- Allows organizations to create their own themed databases
-- ============================================================

CREATE TABLE custom_themes (
  id            SERIAL PRIMARY KEY,
  org_id        INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  description   TEXT,
  schema_sql    TEXT NOT NULL,
  seed_sql      TEXT NOT NULL,
  schema_ref    JSONB NOT NULL,
  table_mapping JSONB,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'provisioned', 'error')),
  error_message   TEXT,
  source_dialect  TEXT CHECK (source_dialect IN ('postgresql', 'mysql', 'sqlite', 'sqlserver', 'csv')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE custom_theme_exercises (
  id              SERIAL PRIMARY KEY,
  custom_theme_id INTEGER NOT NULL REFERENCES custom_themes(id) ON DELETE CASCADE,
  exercise_id     TEXT NOT NULL,
  exercise_json   JSONB NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(custom_theme_id, exercise_id)
);

CREATE INDEX idx_custom_themes_org ON custom_themes(org_id);
CREATE INDEX idx_custom_theme_exercises_theme ON custom_theme_exercises(custom_theme_id);
