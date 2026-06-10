// Discover the Supabase session-pooler region and apply a migration.
// Run: node scripts/db-pooler-migrate.mjs [sqlPath]   (PGPASSWORD env required)
import { readFileSync } from "node:fs";
import pg from "pg";

const ref = process.env.SUPA_REF || "trhkhhebhvrrkrmjemdi";
const password = process.env.PGPASSWORD;
const file = process.argv[2] || "supabase/migrations/0001_init.sql";
const sql = readFileSync(file, "utf8");

const regions = [
  "us-east-1", "us-east-2", "us-west-1", "us-west-2",
  "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-central-2", "eu-north-1",
  "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2", "ap-south-1",
  "sa-east-1", "ca-central-1",
];

for (const prefix of ["aws-0", "aws-1"]) {
  for (const region of regions) {
    const host = `${prefix}-${region}.pooler.supabase.com`;
    const client = new pg.Client({
      host,
      port: 5432,
      user: `postgres.${ref}`,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log(`Connected via ${host}`);
      await client.query(sql);
      const { rows } = await client.query(
        "select table_name from information_schema.tables where table_schema='public' order by 1",
      );
      console.log("Tables:", rows.map((r) => r.table_name).join(", "));
      await client.end();
      console.log(`MIGRATION_OK host=${host}`);
      process.exit(0);
    } catch (e) {
      const m = String(e?.message ?? e).split("\n")[0];
      console.log(`  ${host}: ${m}`);
      try {
        await client.end();
      } catch {}
    }
  }
}
console.log("NO_POOLER_WORKED");
process.exit(1);
