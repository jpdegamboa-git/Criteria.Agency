export { createDb, type Database } from './connection.js';
export * from './schema.js';
export * as authSchema from './auth-schema.js';

// Re-export drizzle-orm operators for use in API layer (single instance)
export { eq, and, or, sql, desc, asc } from 'drizzle-orm';
