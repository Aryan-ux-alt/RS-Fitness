CREATE TABLE IF NOT EXISTS registered_gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  city text NOT NULL,
  gym_owner_id uuid REFERENCES gym_owners(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert existing gym owners into registered_gyms
INSERT INTO registered_gyms (name, city, gym_owner_id, created_at)
SELECT gym_name, city, id, created_at
FROM gym_owners
ON CONFLICT (name) DO NOTHING;

-- Add gym_name column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gym_name text;

-- Backpopulate gym_name for users from their memberships
UPDATE users u
SET gym_name = m.gym_name
FROM (
  SELECT DISTINCT ON (user_id) user_id, gym_name
  FROM memberships
  ORDER BY user_id, expiry_date DESC
) m
WHERE u.id = m.user_id AND u.gym_name IS NULL;

-- Create index for users(gym_name)
CREATE INDEX IF NOT EXISTS idx_users_gym_name ON users(gym_name);
