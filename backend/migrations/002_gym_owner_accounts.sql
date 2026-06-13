CREATE TABLE IF NOT EXISTS gym_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email citext UNIQUE NOT NULL,
  password_hash text NOT NULL,
  city text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'disabled')),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS gym_owner_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_owner_id uuid NOT NULL REFERENCES gym_owners(id) ON DELETE CASCADE,
  type text NOT NULL,
  recipient text NOT NULL DEFAULT 'RS Fitness Admin',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_gym_owners_city ON gym_owners(city);
CREATE INDEX IF NOT EXISTS idx_gym_owner_notifications_status ON gym_owner_notifications(status, created_at DESC);
