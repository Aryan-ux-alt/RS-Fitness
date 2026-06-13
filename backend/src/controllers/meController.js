import { query } from "../db/pool.js";

export async function summary(req, res, next) {
  try {
    const userId = req.user.sub;
    const [
      goal,
      workouts,
      weights,
      calorieProfile,
      foodEntries,
      membership,
      transactions,
    ] = await Promise.all([
      query("SELECT goal FROM user_goals WHERE user_id = $1", [userId]),
      query(`SELECT ws.*, COALESCE(json_agg(json_build_object('setNumber', wset.set_number, 'weight', wset.weight_kg, 'reps', wset.reps, 'durationSeconds', wset.duration_seconds) ORDER BY wset.set_number) FILTER (WHERE wset.id IS NOT NULL), '[]') AS sets FROM workout_sessions ws LEFT JOIN workout_sets wset ON wset.workout_session_id = ws.id WHERE ws.user_id = $1 GROUP BY ws.id ORDER BY ws.performed_at DESC`, [userId]),
      query("SELECT * FROM body_metrics WHERE user_id = $1 ORDER BY measured_at DESC", [userId]),
      query("SELECT * FROM calorie_profiles WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]),
      query("SELECT * FROM food_entries WHERE user_id = $1 ORDER BY eaten_on DESC, created_at DESC", [userId]),
      query("SELECT * FROM memberships WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1", [userId]),
      query("SELECT pt.*, m.gym_name, m.plan_label, m.months FROM payment_transactions pt LEFT JOIN memberships m ON pt.membership_id = m.id WHERE pt.user_id = $1 ORDER BY pt.paid_at DESC", [userId]),
    ]);
    res.json({
      goal: goal.rows[0]?.goal || "bulking",
      workouts: workouts.rows,
      bodyMetrics: weights.rows,
      calorieProfile: calorieProfile.rows[0] || null,
      foodEntries: foodEntries.rows,
      membership: membership.rows[0] || null,
      transactions: transactions.rows,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveSnapshot(req, res) {
  res.status(202).json({
    ok: true,
    message: "Use the feature CRUD endpoints for normalized writes. Snapshot accepted for frontend migration compatibility.",
  });
}
