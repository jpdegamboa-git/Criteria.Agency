import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { config } from "../shared/config.js";

const client = postgres(config.databaseUrl, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });
export { schema };
