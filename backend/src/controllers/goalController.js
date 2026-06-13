import { z } from "zod";
import { query } from "../db/pool.js";

const goalSchema = z.object({ goal: z.enum(["bulking", "cutting"]) });

export async function updateGoal(req, res, next) {
  try {
    const { goal } = goalSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO user_goals (user_id, goal)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET goal = EXCLUDED.goal, updated_at = now()
       RETURNING *`,
      [req.user.sub, goal],
    );
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}
