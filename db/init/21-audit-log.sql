-- Admin audit log — tracks all administrative actions
-- Accessible via admin connection only (not sandbox_user)

CREATE TABLE IF NOT EXISTS audit_log (
  id          SERIAL PRIMARY KEY,
  admin_id    INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin   ON audit_log(admin_id);
CREATE INDEX idx_audit_log_action  ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_target  ON audit_log(target_type, target_id);
