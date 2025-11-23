import { pgTable, text, timestamp, integer, date, uuid, boolean, jsonb, real } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  profileColor: text("profile_color"),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const gameScores = pgTable("game_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  gameDate: date("game_date").notNull(), // The date of the game (YYYY-MM-DD)
  colorName: text("color_name").notNull(),
  colorHex: text("color_hex").notNull(),
  attempts: integer("attempts").notNull(),
  won: boolean("won").notNull(),
  guesses: jsonb("guesses").notNull(), // Array of {colorName, colorHex, similarity, timestamp}
  gaveUp: boolean("gave_up").default(false).notNull(), // Whether the user gave up
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  scores: many(gameScores),
}));

export const gameScoresRelations = relations(gameScores, ({ one }) => ({
  user: one(users, {
    fields: [gameScores.userId],
    references: [users.id],
  }),
}));

export const dailyColors = pgTable("daily_colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameDate: date("game_date").notNull().unique(), // The date for this color (YYYY-MM-DD)
  dayNumber: integer("day_number").notNull(), // Day number (1, 2, 3, etc.) starting from epoch
  colorName: text("color_name").notNull(),
  colorHex: text("color_hex").notNull(),
  seed: integer("seed").notNull(), // Day number since epoch (for backwards compatibility)
  difficulty: text("difficulty").notNull(), // easy, medium, hard
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
