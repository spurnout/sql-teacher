-- Create read-only sandbox user for student queries
CREATE ROLE sandbox_user WITH LOGIN PASSWORD 'sandbox_password';

-- Grant connect to database
GRANT CONNECT ON DATABASE sql_teacher TO sandbox_user;
GRANT USAGE ON SCHEMA public TO sandbox_user;

-- Grant SELECT only on all current tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO sandbox_user;

-- Ensure future tables are also readable
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO sandbox_user;

-- Set session-level security defaults for sandbox role
ALTER ROLE sandbox_user SET statement_timeout = '5s';
ALTER ROLE sandbox_user SET lock_timeout = '1s';
ALTER ROLE sandbox_user SET default_transaction_read_only = on;
