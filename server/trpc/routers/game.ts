import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";
import { gameScores, dailyColors, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { loadColors } from "@/lib/colors";
import {
  getTodayDateString,
  getSeedFromDate,
  getDailyColorForDate,
} from "@/lib/daily-color";

export const gameRouter = router({
  // Get today's daily color
  getDailyColor: publicProcedure.query(async ({ ctx }) => {
    const dateString = getTodayDateString();

    // Check if we already have a color for today
    const [existingColor] = await ctx.db
      .select()
      .from(dailyColors)
      .where(eq(dailyColors.gameDate, dateString))
      .limit(1);

    if (existingColor) {
      return {
        dayNumber: existingColor.dayNumber,
        colorName: existingColor.colorName,
        colorHex: existingColor.colorHex,
        gameDate: existingColor.gameDate,
        difficulty: existingColor.difficulty,
      };
    }

    // If no color exists, return an error (should be seeded beforehand)
    throw new Error(`No daily color found for ${dateString}. Please run the seed script.`);
  }),

  // Submit or update a game score (protected - requires auth)
  submitScore: protectedProcedure
    .input(
      z.object({
        gameDate: z.string(),
        colorName: z.string(),
        colorHex: z.string(),
        attempts: z.number(),
        won: z.boolean(),
        gaveUp: z.boolean().default(false),
        guesses: z.array(
          z.object({
            colorName: z.string(),
            colorHex: z.string(),
            similarity: z.number(),
            timestamp: z.string(), // ISO string
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already has a score for this date
      const [existingScore] = await ctx.db
        .select()
        .from(gameScores)
        .where(
          and(
            eq(gameScores.userId, ctx.user.id),
            eq(gameScores.gameDate, input.gameDate)
          )
        )
        .limit(1);

      if (existingScore) {
        // Update the existing score with latest guesses
        await ctx.db
          .update(gameScores)
          .set({
            attempts: input.attempts,
            won: input.won,
            gaveUp: input.gaveUp,
            guesses: input.guesses,
            updatedAt: new Date(),
          })
          .where(eq(gameScores.id, existingScore.id));

        return { success: true, message: "Score updated" };
      }

      // Insert new score
      await ctx.db.insert(gameScores).values({
        userId: ctx.user.id,
        gameDate: input.gameDate,
        colorName: input.colorName,
        colorHex: input.colorHex,
        attempts: input.attempts,
        won: input.won,
        gaveUp: input.gaveUp,
        guesses: input.guesses,
      });

      return { success: true, message: "Score submitted" };
    }),

  // Get user's game history
  getUserHistory: protectedProcedure.query(async ({ ctx }) => {
    const scores = await ctx.db
      .select()
      .from(gameScores)
      .where(eq(gameScores.userId, ctx.user.id))
      .orderBy(desc(gameScores.gameDate))
      .limit(30);

    return scores;
  }),

  // Get user's stats
  getUserStats: protectedProcedure.query(async ({ ctx }) => {
    const allScores = await ctx.db
      .select()
      .from(gameScores)
      .where(eq(gameScores.userId, ctx.user.id));

    const totalGames = allScores.length;
    const wins = allScores.filter((s) => s.won).length;
    const totalAttempts = allScores.reduce((sum, s) => sum + s.attempts, 0);
    const avgAttempts = totalGames > 0 ? totalAttempts / totalGames : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedScores = [...allScores].sort((a, b) =>
      b.gameDate.localeCompare(a.gameDate)
    );

    for (let i = 0; i < sortedScores.length; i++) {
      if (sortedScores[i].won) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      totalGames,
      wins,
      winRate: totalGames > 0 ? (wins / totalGames) * 100 : 0,
      avgAttempts: Math.round(avgAttempts * 10) / 10,
      currentStreak,
    };
  }),

  // Check if user has played today
  hasPlayedToday: protectedProcedure.query(async ({ ctx }) => {
    const dateString = getTodayDateString();

    const [score] = await ctx.db
      .select()
      .from(gameScores)
      .where(
        and(
          eq(gameScores.userId, ctx.user.id),
          eq(gameScores.gameDate, dateString)
        )
      )
      .limit(1);

    return { hasPlayed: !!score, score };
  }),

  // Get today's game state if it exists
  getTodayGameState: protectedProcedure.query(async ({ ctx }) => {
    const dateString = getTodayDateString();

    const [score] = await ctx.db
      .select()
      .from(gameScores)
      .where(
        and(
          eq(gameScores.userId, ctx.user.id),
          eq(gameScores.gameDate, dateString)
        )
      )
      .limit(1);

    return score || null;
  }),
});
