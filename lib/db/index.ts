import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// For serverless environments, we want a singleton connection
// that doesn't use prepared statements
let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!client) {
    client = postgres(connectionString, {
      max: 1, // Serverless works better with fewer connections
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Disable prepared statements for serverless
    });
  }
  return client;
}

export const db = drizzle(getClient(), { schema });
