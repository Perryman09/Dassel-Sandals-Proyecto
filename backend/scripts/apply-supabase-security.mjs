import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pg;

async function applySupabaseSecurity() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL no esta definida en el archivo .env');
  }

  const pool = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    const sqlPath = path.resolve(__dirname, '../prisma/supabase-security-rls.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('[Supabase Security] Aplicando configuracion de Row Level Security (RLS)...');
    await client.query(sqlContent);

    const verificationQuery = `
      SELECT
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        has_table_privilege('anon', c.oid, 'SELECT') AS anon_can_select,
        has_table_privilege('authenticated', c.oid, 'SELECT') AS auth_can_select,
        (
          SELECT COUNT(*)::int
          FROM pg_policy p
          WHERE p.polrelid = c.oid
        ) AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
      ORDER BY c.relname;
    `;

    const { rows } = await client.query(verificationQuery);
    console.log('[Supabase Security] Estado de tablas en el esquema public:');
    console.table(rows);

    const passwordExposureQuery = `
      SELECT
        has_column_privilege('anon', 'public."User"', 'password', 'SELECT') AS anon_password_select,
        has_column_privilege('authenticated', 'public."User"', 'password', 'SELECT') AS auth_password_select;
    `;
    const { rows: passRows } = await client.query(passwordExposureQuery);
    console.log('[Supabase Security] Verificacion de columna sensible public.User.password:');
    console.table(passRows);
  } finally {
    client.release();
    await pool.end();
  }
}

applySupabaseSecurity().catch((error) => {
  console.error('[Supabase Security Error]:', error.message);
  process.exit(1);
});
