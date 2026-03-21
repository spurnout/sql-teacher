-- Organizations — teams and membership for B2B upskilling
-- Accessible via admin connection only (not sandbox_user)

-- Organization/team accounts
CREATE TABLE organizations (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  slug       TEXT NOT NULL UNIQUE,
  owner_id   INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Membership: who belongs to which org, with role
CREATE TABLE org_members (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  org_id    INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'manager', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, org_id)
);

-- Invite codes for onboarding new team members
CREATE TABLE org_invites (
  id         SERIAL PRIMARY KEY,
  org_id     INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code       TEXT NOT NULL UNIQUE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('manager', 'member')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_by    INTEGER REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_org ON org_members(org_id);
CREATE INDEX idx_org_invites_code ON org_invites(code);
CREATE INDEX idx_org_invites_org ON org_invites(org_id);
