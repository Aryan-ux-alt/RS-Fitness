import { z } from "zod";
import { query } from "../db/pool.js";

const metricSchema = z.object({
  weightKg: z.coerce.number().positive(),
  bodyFatPercent: z.coerce.number().min(0).max(100).optional(),
  waistCm: z.coerce.number().positive().optional(),
  chestCm: z.coerce.number().positive().optional(),
  armsCm: z.coerce.number().positive().optional(),
  note: z.string().optional(),
  measuredAt: z.string().datetime().optional(),
});

export async function addMetric(req, res, next) {
  try {
    const m = metricSchema.parse(req.body);
    const { rows } = await query(
      `INSERT INTO body_metrics (user_id, weight_kg, body_fat_percent, waist_cm, chest_cm, arms_cm, note, measured_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, now())) RETURNING *`,
      [req.user.sub, m.weightKg, m.bodyFatPercent || null, m.waistCm || null, m.chestCm || null, m.armsCm || null, m.note || null, m.measuredAt || null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function listMetrics(req, res, next) {
  try {
    const { rows } = await query("SELECT * FROM body_metrics WHERE user_id = $1 ORDER BY measured_at DESC", [req.user.sub]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}
