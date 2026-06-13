ALTER TABLE gym_owners DROP CONSTRAINT IF EXISTS gym_owners_status_check;

ALTER TABLE gym_owners
  ADD CONSTRAINT gym_owners_status_check CHECK (status IN ('pending', 'active', 'paused', 'disabled'));

ALTER TABLE gym_owners
  ALTER COLUMN status SET DEFAULT 'pending';
