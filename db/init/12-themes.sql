-- ============================================================
-- Theme Infrastructure
-- Creates separate PostgreSQL schemas for each learning theme
-- ============================================================

-- Add theme column to app_users
ALTER TABLE app_users ADD COLUMN theme TEXT NOT NULL DEFAULT 'serious';

-- ============================================================
-- SERIOUS THEME (mirrors existing public schema)
-- ============================================================
CREATE SCHEMA theme_serious;

CREATE TABLE theme_serious.users (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  plan        TEXT NOT NULL DEFAULT 'free',
  country     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  churned_at  TIMESTAMPTZ
);

CREATE TABLE theme_serious.products (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE theme_serious.subscriptions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES theme_serious.users(id),
  product_id      INTEGER NOT NULL REFERENCES theme_serious.products(id),
  status          TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL,
  cancelled_at    TIMESTAMPTZ,
  mrr_cents       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE theme_serious.orders (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES theme_serious.users(id),
  total_cents INTEGER NOT NULL,
  status      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE theme_serious.order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES theme_serious.orders(id),
  product_id       INTEGER NOT NULL REFERENCES theme_serious.products(id),
  quantity         INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL
);

CREATE TABLE theme_serious.events (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES theme_serious.users(id),
  event_type  TEXT NOT NULL,
  properties  JSONB,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_serious_events_user_id ON theme_serious.events(user_id);
CREATE INDEX idx_serious_events_occurred_at ON theme_serious.events(occurred_at);
CREATE INDEX idx_serious_subscriptions_user_id ON theme_serious.subscriptions(user_id);
CREATE INDEX idx_serious_orders_user_id ON theme_serious.orders(user_id);
CREATE INDEX idx_serious_orders_created_at ON theme_serious.orders(created_at);

-- Copy data from public schema into theme_serious
INSERT INTO theme_serious.products SELECT * FROM public.products;
SELECT setval('theme_serious.products_id_seq', (SELECT MAX(id) FROM theme_serious.products));
INSERT INTO theme_serious.users SELECT * FROM public.users;
SELECT setval('theme_serious.users_id_seq', (SELECT MAX(id) FROM theme_serious.users));
INSERT INTO theme_serious.subscriptions SELECT * FROM public.subscriptions;
SELECT setval('theme_serious.subscriptions_id_seq', (SELECT MAX(id) FROM theme_serious.subscriptions));
INSERT INTO theme_serious.orders SELECT * FROM public.orders;
SELECT setval('theme_serious.orders_id_seq', (SELECT MAX(id) FROM theme_serious.orders));
INSERT INTO theme_serious.order_items SELECT * FROM public.order_items;
SELECT setval('theme_serious.order_items_id_seq', (SELECT MAX(id) FROM theme_serious.order_items));
INSERT INTO theme_serious.events SELECT * FROM public.events;
SELECT setval('theme_serious.events_id_seq', (SELECT MAX(id) FROM theme_serious.events));

-- ============================================================
-- SILLY THEME — Galactic Pizza Delivery
-- ============================================================
CREATE SCHEMA theme_silly;

CREATE TABLE theme_silly.aliens (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  species         TEXT NOT NULL,
  appetite_level  TEXT NOT NULL DEFAULT 'hungry',
  planet          TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  banned_at       TIMESTAMPTZ
);

CREATE TABLE theme_silly.pizzas (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  cost_credits  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE theme_silly.subscriptions (
  id              SERIAL PRIMARY KEY,
  alien_id        INTEGER NOT NULL REFERENCES theme_silly.aliens(id),
  pizza_id        INTEGER NOT NULL REFERENCES theme_silly.pizzas(id),
  status          TEXT NOT NULL,
  started_at      TIMESTAMPTZ NOT NULL,
  cancelled_at    TIMESTAMPTZ,
  monthly_credits INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE theme_silly.orders (
  id            SERIAL PRIMARY KEY,
  alien_id      INTEGER NOT NULL REFERENCES theme_silly.aliens(id),
  total_credits INTEGER NOT NULL,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE theme_silly.order_items (
  id               SERIAL PRIMARY KEY,
  order_id         INTEGER NOT NULL REFERENCES theme_silly.orders(id),
  pizza_id         INTEGER NOT NULL REFERENCES theme_silly.pizzas(id),
  quantity         INTEGER NOT NULL DEFAULT 1,
  unit_cost_credits INTEGER NOT NULL
);

CREATE TABLE theme_silly.incidents (
  id            SERIAL PRIMARY KEY,
  alien_id      INTEGER NOT NULL REFERENCES theme_silly.aliens(id),
  incident_type TEXT NOT NULL,
  properties    JSONB,
  occurred_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_silly_incidents_alien_id ON theme_silly.incidents(alien_id);
CREATE INDEX idx_silly_incidents_occurred_at ON theme_silly.incidents(occurred_at);
CREATE INDEX idx_silly_subscriptions_alien_id ON theme_silly.subscriptions(alien_id);
CREATE INDEX idx_silly_orders_alien_id ON theme_silly.orders(alien_id);
CREATE INDEX idx_silly_orders_created_at ON theme_silly.orders(created_at);

-- ============================================================
-- PROFESSIONAL THEME — TechCorp HR & Operations
-- ============================================================
CREATE SCHEMA theme_professional;

CREATE TABLE theme_professional.employees (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  role            TEXT NOT NULL DEFAULT 'junior',
  department      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  terminated_at   TIMESTAMPTZ
);

CREATE TABLE theme_professional.projects (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  budget_cents INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE theme_professional.assignments (
  id           SERIAL PRIMARY KEY,
  employee_id  INTEGER NOT NULL REFERENCES theme_professional.employees(id),
  project_id   INTEGER NOT NULL REFERENCES theme_professional.projects(id),
  status       TEXT NOT NULL,
  started_at   TIMESTAMPTZ NOT NULL,
  ended_at     TIMESTAMPTZ,
  hourly_rate  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE theme_professional.expenses (
  id           SERIAL PRIMARY KEY,
  employee_id  INTEGER NOT NULL REFERENCES theme_professional.employees(id),
  total_cents  INTEGER NOT NULL,
  status       TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL
);

CREATE TABLE theme_professional.expense_items (
  id             SERIAL PRIMARY KEY,
  expense_id     INTEGER NOT NULL REFERENCES theme_professional.expenses(id),
  project_id     INTEGER NOT NULL REFERENCES theme_professional.projects(id),
  quantity       INTEGER NOT NULL DEFAULT 1,
  unit_cost_cents INTEGER NOT NULL
);

CREATE TABLE theme_professional.timesheet_entries (
  id          SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES theme_professional.employees(id),
  entry_type  TEXT NOT NULL,
  properties  JSONB,
  logged_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_prof_timesheet_employee_id ON theme_professional.timesheet_entries(employee_id);
CREATE INDEX idx_prof_timesheet_logged_at ON theme_professional.timesheet_entries(logged_at);
CREATE INDEX idx_prof_assignments_employee_id ON theme_professional.assignments(employee_id);
CREATE INDEX idx_prof_expenses_employee_id ON theme_professional.expenses(employee_id);
CREATE INDEX idx_prof_expenses_created_at ON theme_professional.expenses(created_at);

-- ============================================================
-- SCI-FI THEME — Starfleet Command Database
-- ============================================================
CREATE SCHEMA theme_scifi;

CREATE TABLE theme_scifi.crew_members (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  callsign      TEXT NOT NULL UNIQUE,
  rank          TEXT NOT NULL DEFAULT 'ensign',
  homeworld     TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharged_at TIMESTAMPTZ
);

CREATE TABLE theme_scifi.starships (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  class         TEXT NOT NULL,
  cost_credits  INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE theme_scifi.deployments (
  id          SERIAL PRIMARY KEY,
  crew_id     INTEGER NOT NULL REFERENCES theme_scifi.crew_members(id),
  starship_id INTEGER NOT NULL REFERENCES theme_scifi.starships(id),
  status      TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL,
  ended_at    TIMESTAMPTZ,
  daily_pay   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE theme_scifi.missions (
  id             SERIAL PRIMARY KEY,
  crew_id        INTEGER NOT NULL REFERENCES theme_scifi.crew_members(id),
  reward_credits INTEGER NOT NULL,
  status         TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL
);

CREATE TABLE theme_scifi.mission_objectives (
  id             SERIAL PRIMARY KEY,
  mission_id     INTEGER NOT NULL REFERENCES theme_scifi.missions(id),
  starship_id    INTEGER NOT NULL REFERENCES theme_scifi.starships(id),
  quantity       INTEGER NOT NULL DEFAULT 1,
  bounty_credits INTEGER NOT NULL
);

CREATE TABLE theme_scifi.sensor_logs (
  id          SERIAL PRIMARY KEY,
  crew_id     INTEGER NOT NULL REFERENCES theme_scifi.crew_members(id),
  log_type    TEXT NOT NULL,
  properties  JSONB,
  recorded_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_scifi_sensor_logs_crew_id ON theme_scifi.sensor_logs(crew_id);
CREATE INDEX idx_scifi_sensor_logs_recorded_at ON theme_scifi.sensor_logs(recorded_at);
CREATE INDEX idx_scifi_deployments_crew_id ON theme_scifi.deployments(crew_id);
CREATE INDEX idx_scifi_missions_crew_id ON theme_scifi.missions(crew_id);
CREATE INDEX idx_scifi_missions_created_at ON theme_scifi.missions(created_at);

-- ============================================================
-- FANTASY THEME — Kingdom of Eldoria
-- ============================================================
CREATE SCHEMA theme_fantasy;

CREATE TABLE theme_fantasy.adventurers (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  title      TEXT NOT NULL,
  class      TEXT NOT NULL DEFAULT 'warrior',
  kingdom    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  exiled_at  TIMESTAMPTZ
);

CREATE TABLE theme_fantasy.artifacts (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  value_gold  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE theme_fantasy.enrollments (
  id            SERIAL PRIMARY KEY,
  adventurer_id INTEGER NOT NULL REFERENCES theme_fantasy.adventurers(id),
  artifact_id   INTEGER NOT NULL REFERENCES theme_fantasy.artifacts(id),
  status        TEXT NOT NULL,
  acquired_at   TIMESTAMPTZ NOT NULL,
  lost_at       TIMESTAMPTZ,
  upkeep_gold   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE theme_fantasy.quests (
  id            SERIAL PRIMARY KEY,
  adventurer_id INTEGER NOT NULL REFERENCES theme_fantasy.adventurers(id),
  reward_gold   INTEGER NOT NULL,
  status        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE theme_fantasy.quest_loot (
  id            SERIAL PRIMARY KEY,
  quest_id      INTEGER NOT NULL REFERENCES theme_fantasy.quests(id),
  artifact_id   INTEGER NOT NULL REFERENCES theme_fantasy.artifacts(id),
  quantity      INTEGER NOT NULL DEFAULT 1,
  appraisal_gold INTEGER NOT NULL
);

CREATE TABLE theme_fantasy.tavern_logs (
  id            SERIAL PRIMARY KEY,
  adventurer_id INTEGER NOT NULL REFERENCES theme_fantasy.adventurers(id),
  event_type    TEXT NOT NULL,
  properties    JSONB,
  occurred_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_fantasy_tavern_logs_adventurer_id ON theme_fantasy.tavern_logs(adventurer_id);
CREATE INDEX idx_fantasy_tavern_logs_occurred_at ON theme_fantasy.tavern_logs(occurred_at);
CREATE INDEX idx_fantasy_enrollments_adventurer_id ON theme_fantasy.enrollments(adventurer_id);
CREATE INDEX idx_fantasy_quests_adventurer_id ON theme_fantasy.quests(adventurer_id);
CREATE INDEX idx_fantasy_quests_created_at ON theme_fantasy.quests(created_at);

-- ============================================================
-- GRANT sandbox_user access to ALL theme schemas
-- ============================================================
GRANT USAGE ON SCHEMA theme_serious TO sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA theme_serious TO sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA theme_serious GRANT SELECT ON TABLES TO sandbox_user;

GRANT USAGE ON SCHEMA theme_silly TO sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA theme_silly TO sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA theme_silly GRANT SELECT ON TABLES TO sandbox_user;

GRANT USAGE ON SCHEMA theme_professional TO sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA theme_professional TO sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA theme_professional GRANT SELECT ON TABLES TO sandbox_user;

GRANT USAGE ON SCHEMA theme_scifi TO sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA theme_scifi TO sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA theme_scifi GRANT SELECT ON TABLES TO sandbox_user;

GRANT USAGE ON SCHEMA theme_fantasy TO sandbox_user;
GRANT SELECT ON ALL TABLES IN SCHEMA theme_fantasy TO sandbox_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA theme_fantasy GRANT SELECT ON TABLES TO sandbox_user;
