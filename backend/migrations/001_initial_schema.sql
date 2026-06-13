CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email citext UNIQUE NOT NULL,
  phone text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'trainer')),
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_goals (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  goal text NOT NULL CHECK (goal IN ('bulking', 'cutting')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('Push', 'Pull', 'Legs', 'Core')),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, name)
);

CREATE TABLE IF NOT EXISTS exercise_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  youtube_id text NOT NULL,
  tips text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  exercise_name text NOT NULL,
  note text,
  mode text NOT NULL CHECK (mode IN ('bulking', 'cutting')),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  set_number integer NOT NULL CHECK (set_number > 0),
  weight_kg numeric(7,2) CHECK (weight_kg >= 0),
  reps integer CHECK (reps >= 0),
  duration_seconds integer CHECK (duration_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workout_session_id, set_number)
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg numeric(6,2) NOT NULL CHECK (weight_kg > 0),
  body_fat_percent numeric(5,2) CHECK (body_fat_percent BETWEEN 0 AND 100),
  waist_cm numeric(6,2),
  chest_cm numeric(6,2),
  arms_cm numeric(6,2),
  note text,
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calorie_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  age integer NOT NULL CHECK (age BETWEEN 5 AND 120),
  height_cm numeric(6,2) NOT NULL CHECK (height_cm > 0),
  weight_kg numeric(6,2) NOT NULL CHECK (weight_kg > 0),
  activity text NOT NULL CHECK (activity IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  target_calories integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal text NOT NULL CHECK (meal IN ('Breakfast', 'Lunch', 'Dinner', 'Snacks')),
  name text NOT NULL,
  unit text,
  calories integer NOT NULL CHECK (calories >= 0),
  eaten_on date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_steps (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_date date NOT NULL DEFAULT CURRENT_DATE,
  steps integer NOT NULL CHECK (steps >= 0),
  calories_burned integer CHECK (calories_burned >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, step_date)
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gym_name text NOT NULL,
  plan_id text NOT NULL,
  plan_label text NOT NULL,
  months integer NOT NULL CHECK (months > 0),
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  start_date date NOT NULL,
  expiry_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  receipt_id text UNIQUE NOT NULL,
  provider text NOT NULL DEFAULT 'demo',
  provider_payment_id text,
  amount_paise integer NOT NULL CHECK (amount_paise >= 0),
  currency char(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL CHECK (status IN ('paid', 'failed', 'refunded')),
  paid_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_body_metrics_user_date ON body_metrics(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_entries_user_day ON food_entries(user_id, eaten_on DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_paid ON payment_transactions(user_id, paid_at DESC);

INSERT INTO exercises (category, name) VALUES
  ('Push','Bench Press'), ('Push','Incline Bench'), ('Push','Overhead Press'), ('Push','Tricep Pushdown'), ('Push','Chest Fly'), ('Push','Dips'), ('Push','Lateral Raise'),
  ('Pull','Deadlift'), ('Pull','Barbell Row'), ('Pull','Pull-ups'), ('Pull','Lat Pulldown'), ('Pull','Cable Row'), ('Pull','Face Pull'), ('Pull','Bicep Curl'),
  ('Legs','Squat'), ('Legs','Leg Press'), ('Legs','Romanian Deadlift'), ('Legs','Leg Curl'), ('Legs','Leg Extension'), ('Legs','Calf Raise'), ('Legs','Hack Squat'),
  ('Core','Plank'), ('Core','Ab Wheel'), ('Core','Cable Crunch'), ('Core','Hanging Leg Raise'), ('Core','Russian Twist')
ON CONFLICT DO NOTHING;
