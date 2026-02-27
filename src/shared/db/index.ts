import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/shared/config/env';
import fs from 'fs';
import path from 'path';

// Import all schemas so Drizzle knows about our tables and relations
import * as authSchema from './schema/auth';
import * as financeSchema from './schema/finance';
import * as kycSchema from './schema/kyc';
import * as platformSchema from './schema/platform';

/**
 * 🛠 Connection Pool Engineering
 * This prevents "Too many connections" errors in Next.js/Vercel serverless environments.
 */
const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  ssl: { rejectUnauthorized: false },
});

/**
 * 🚀 The Database Instance
 * We pass the 'schema' property here to enable powerful relational queries.
 */
export const db = drizzle(client, { 
  schema: { ...authSchema, ...financeSchema, ...kycSchema, ...platformSchema } 
});

// Export types for use in services
export type DatabaseType = typeof db;
export type TransactionType = Parameters<Parameters<DatabaseType['transaction']>[0]>[0];