// One-off migration runner. Credentials come from PG* env vars (never on disk).
// Run: node scripts/db-migrate.mjs <path-to-sql>
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2] || "supabase/migrations/0001_init.sql";
const sql = readFileSync(file, "utf8");

const client = new pg.Client({ ssl: { rejectUnauthorized: false } });
await client.connect();
await client.query(sql);
const { rows } = await client.query(
  "select table_name from information_schema.tables where table_schema='public' order by table_name",
);
console.log("OK — public tables:", rows.map((r) => r.table_name).join(", "));
await client.end();
