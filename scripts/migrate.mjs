// Applies db/schema.sql to the database in DATABASE_URL.
// Usage: npm run db:migrate   (reads .env.local if present)
import { readFileSync, existsSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL && existsSync('.env.local')) process.loadEnvFile('.env.local');
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env.local or the environment.');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
// The HTTP driver runs one statement per query; the schema has no functions/DO blocks, so splitting on ';' is safe.
const statements = readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8')
  .replace(/--.*$/gm, '')
  .split(';')
  .map(s => s.trim())
  .filter(Boolean);

for (const stmt of statements) await sql.query(stmt);
console.log(`Applied ${statements.length} statements.`);
