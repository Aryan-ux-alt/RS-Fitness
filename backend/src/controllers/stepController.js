import { z } from "zod";
import { query } from "../db/pool.js";

const stepSchema = z.object({
  stepDate: z.string().date().optional(),
  steps: z.coerce.number().int().nonnegative(),
  caloriesBurned: z.coerce.number().int().nonnegative().optional(),
});

export async function upsertSteps(req, res, next) {
  try {
    const s = stepSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO daily_steps (user_id, step_date, steps, calories_burned)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4)
       ON CONFLICT (user_id, step_date)
       DO UPDATE SET steps = EXCLUDED.steps, calories_burned = EXCLUDED.calories_burned, updated_at = now()
       RETURNING *`,
      [req.user.sub, s.stepDate || null, s.steps, s.caloriesBurned || null],
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}
