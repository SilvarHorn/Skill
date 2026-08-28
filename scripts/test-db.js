import dotenv from "dotenv";
dotenv.config();
import { Pool } from "@neondatabase/serverless";

const REQUIRED_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "students",
  "industries",
  "institutes",
  "questions",
  "ratings"
];

async function testDatabase() {
  console.log("[db:test] Connecting to database...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("[db:test] Connection check passed.");

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const existingTables = new Set(res.rows.map(r => r.table_name));

    const missingTables = REQUIRED_TABLES.filter(t => !existingTables.has(t));
    if (missingTables.length > 0) {
      throw new Error(`Missing expected tables: ${missingTables.join(", ")}`);
    }

    console.log("[db:test] Schema verification passed (all 9 tables exist).");

    const accountIssuerRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'account'
        AND column_name = 'issuer'
    `);

    if (accountIssuerRes.rows.length !== 1) {
      throw new Error('Missing required "issuer" column on account table for Better Auth OAuth account resolution.');
    }

    await client.query("BEGIN");
    const testUserId = `test-user-${Date.now()}`;
    await client.query(
      `INSERT INTO "user" ("id", "name", "email") VALUES ($1, $2, $3)`,
      [testUserId, "Test User", `${testUserId}@example.com`]
    );

    const userRes = await client.query(
      `SELECT * FROM "user" WHERE "id" = $1`,
      [testUserId]
    );
    if (userRes.rows.length !== 1) {
      throw new Error("CRUD read failed");
    }

    await client.query("ROLLBACK");
    console.log("[db:test] Live CRUD and transaction rollback passed.");
    console.log("[db:test] Skill Bridge database layer is ready.");
  } finally {
    client.release();
    await pool.end();
  }
}

testDatabase().catch(err => {
  console.error("[db:test] Database verification failed:", err.message);
  process.exit(1);
});
