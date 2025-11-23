import { router } from "./init";
import { gameRouter } from "./routers/game";
import { authRouter } from "./routers/auth";

export const appRouter = router({
  game: gameRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
