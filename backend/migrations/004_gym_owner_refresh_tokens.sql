CREATE TABLE IF NOT EXISTS gym_owner_refresh_tokens (
  id uuid PRIMARY KEY,
  gym_owner_id uuid NOT NULL REFERENCES gym_owners(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
