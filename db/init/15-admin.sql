-- Super admin flag on app_users
-- First registered user becomes admin automatically (handled in application code)
ALTER TABLE app_users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
