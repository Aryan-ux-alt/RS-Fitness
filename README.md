# RS Fitness Production Structure

This folder contains the split React frontend and a production-style Express/Postgres backend.

## Structure

- `frontend/src/components` contains the original UI split into feature folders.
- `frontend/src/constants` contains exercise, food, theme, and membership constants.
- `frontend/src/services/api.js` contains the API client.
- `frontend/src/legacy-RSFitness-v2.jsx` keeps the original big file as a reference.
- `backend/src` contains config, database, middleware, controllers, routes, and services.
- `backend/migrations/001_initial_schema.sql` creates the Postgres schema.

## Database URL

Your original URL has spaces, so it must be URL-encoded:

```env
DATABASE_URL=postgresql://postgres:aryan%207106@localhost:5432/RS%20Fitness
```

## Run Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

## Run Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:4000/api` by default.

## Tables Created

The migration creates:

- `users`
- `refresh_tokens`
- `user_goals`
- `exercises`
- `exercise_videos`
- `workout_sessions`
- `workout_sets`
- `body_metrics`
- `calorie_profiles`
- `food_entries`
- `daily_steps`
- `memberships`
- `payment_transactions`

Passwords are stored as bcrypt hashes, and refresh tokens are stored as SHA-256 hashes.
