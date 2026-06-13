import { z } from "zod";
import { pool } from "../db/pool.js";

const workoutSchema = z.object({
  category: z.string(),
  exercise: z.string(),
  note: z.string().optional().nullable(),
  mode: z.enum(["bulking", "cutting"]).default("bulking"),
  performedAt: z.string().datetime().optional(),
  sets: z.array(z.object({
    weight: z.coerce.number().nonnegative().optional().nullable(),
    reps: z.coerce.number().int().nonnegative().optional().nullable(),
    durationSeconds: z.coerce.number().int().nonnegative().optional().nullable(),
  })).min(1),
});

export async function createWorkout(req, res, next) {
  const client = await pool.connect();
  try {
    const input = workoutSchema.parse(req.body);
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO workout_sessions (user_id, category, exercise_name, note, mode, performed_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, now()))
       RETURNING *`,
      [req.user.sub, input.category, input.exercise, input.note || null, input.mode, input.performedAt || null],
    );
    for (const [index, set] of input.sets.entries()) {
      await client.query(
        `INSERT INTO workout_sets (workout_session_id, set_number, weight_kg, reps, duration_seconds)
         VALUES ($1, $2, $3, $4, $5)`,
        [rows[0].id, index + 1, set.weight || null, set.reps || null, set.durationSeconds || null],
      );
    }
    await client.query("COMMIT");
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
}

export async function listWorkouts(req, res, next) {
  try {
    const { rows } = await pool.query("SELECT * FROM workout_sessions WHERE user_id = $1 ORDER BY performed_at DESC", [req.user.sub]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
