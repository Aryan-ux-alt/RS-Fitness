import { pool } from "./src/db/pool.js";

async function main() {
  try {
    const res = await pool.query("UPDATE gym_owners SET status = 'active'");
    console.log(`Activated ${res.rowCount} gym owners.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
