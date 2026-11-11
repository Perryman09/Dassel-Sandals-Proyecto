import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export function createPrismaAdapter(): PrismaPg {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/postgres';

  const pool = new Pool({ connectionString });
  return new PrismaPg(pool);
}
