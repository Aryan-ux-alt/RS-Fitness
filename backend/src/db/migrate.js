import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, query } from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, "../../migrations");

await query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const files = (await fs.readdir(migrationsDir)).filter(f => f.endsWith(".sql")).sort();
for (const file of files) {
  const already = await query("SELECT 1 FROM schema_migrations WHERE id = $1", [file]);
  if (already.rowCount) continue;
  const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
  await pool.query("BEGIN");
  try {
    await pool.query(sql);
    await query("INSERT INTO schema_migrations (id) VALUES ($1)", [file]);
    await pool.query("COMMIT");
    console.log(`Applied ${file}`);
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }
}

await pool.end();
