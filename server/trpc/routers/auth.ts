import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../init";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const authRouter = router({
  // Get current user or create if doesn't exist
  getCurrentUser: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      return null;
    }

    // Check if user exists in our database
    const [existingUser] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (existingUser) {
      return existingUser;
    }

    // Create user in our database
    const [newUser] = await ctx.db
      .insert(users)
      .values({
        id: ctx.user.id,
        email: ctx.user.email!,
      })
      .returning();

    return newUser;
  }),

  // Complete onboarding
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
          ),
        profileColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // First ensure user exists in database
        const [existingUser] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        if (!existingUser) {
          // Create user if doesn't exist
          const [newUser] = await ctx.db
            .insert(users)
            .values({
              id: ctx.user.id,
              email: ctx.user.email!,
            })
            .returning();
        }

        // Check if username is already taken
        const [existingUsername] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.username, input.username))
          .limit(1);

        if (existingUsername && existingUsername.id !== ctx.user.id) {
          throw new Error("Username is already taken");
        }

        // Update user with onboarding data
        const [updatedUser] = await ctx.db
          .update(users)
          .set({
            username: input.username,
            profileColor: input.profileColor,
            onboardingComplete: true,
          })
          .where(eq(users.id, ctx.user.id))
          .returning();

        return updatedUser;
      } catch (error: any) {
        console.error("Onboarding error:", error);
        throw new Error(error.message || "Failed to complete onboarding");
      }
    }),

  // Check if username is available
  checkUsernameAvailability: publicProcedure
    .input(
      z.object({
        username: z.string(),
        currentUserId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (input.username.length < 3) {
        return { available: false, message: "Username must be at least 3 characters" };
      }

      if (input.username.length > 20) {
        return { available: false, message: "Username must be at most 20 characters" };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
        return {
          available: false,
          message: "Username can only contain letters, numbers, and underscores",
        };
      }

      const [existingUser] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.username, input.username))
        .limit(1);

      if (existingUser && existingUser.id !== input.currentUserId) {
        return { available: false, message: "Username is already taken" };
      }

      return { available: true, message: "Username is available" };
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least 3 characters")
          .max(20, "Username must be at most 20 characters")
          .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
          ),
        profileColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if username is already taken by another user
        const [existingUsername] = await ctx.db
          .select()
          .from(users)
          .where(eq(users.username, input.username))
          .limit(1);

        if (existingUsername && existingUsername.id !== ctx.user.id) {
          throw new Error("Username is already taken");
        }

        // Update user profile
        const [updatedUser] = await ctx.db
          .update(users)
          .set({
            username: input.username,
            profileColor: input.profileColor,
          })
          .where(eq(users.id, ctx.user.id))
          .returning();

        return updatedUser;
      } catch (error: any) {
        console.error("Profile update error:", error);
        throw new Error(error.message || "Failed to update profile");
      }
    }),
});
