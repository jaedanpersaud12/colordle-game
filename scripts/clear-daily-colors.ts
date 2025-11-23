import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dailyColors } from "@/lib/db/schema";

config();

async function clearDailyColors() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("Clearing daily_colors table...");
  await db.delete(dailyColors);

  console.log("✅ daily_colors table cleared!");
  await client.end();
}

clearDailyColors().catch((error) => {
  console.error("Error clearing daily colors:", error);
  process.exit(1);
});
