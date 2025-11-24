"use client";

import { useEffect, useState } from "react";
import {
  Color,
  loadColors,
  calculateColorSimilarity,
  hexToHsl,
} from "@/lib/colors";
import {
  GameState,
  GameStats,
  getInitialGameState,
  loadGameStats,
  saveGameStats,
  updateStatsOnWin,
  loadDailyGameState,
  saveDailyGameState,
  clearOldGameStates,
  getTodayDateString,
} from "@/lib/game";
import { trpc } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { ColorInput } from "@/components/ColorInput";
import { GuessHistory } from "@/components/GuessHistory";
import { HelpDialog } from "@/components/HelpDialog";
import { StatsDialog } from "@/components/StatsDialog";
import { UserMenu } from "@/components/UserMenu";
import { GameCompleteDialog } from "@/components/GameCompleteDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lightbulb, Flag } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

// Cookie helper functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, days: number = 365) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

export default function Home() {
  const [colors, setColors] = useState<Color[]>([]);
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [stats, setStats] = useState<GameStats>(loadGameStats());
  const [isLoading, setIsLoading] = useState(true);
  const [showTarget, setShowTarget] = useState(false);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [gameCompleteDialogOpen, setGameCompleteDialogOpen] = useState(false);

  const supabase = createClient();
  const utils = trpc.useUtils();

  // Fetch daily color using tRPC hook
  const {
    data: dailyColorData,
    error: dailyColorError,
    isLoading: dailyColorLoading
  } = trpc.game.getDailyColor.useQuery(undefined, {
    retry: 3,
    retryDelay: 1000,
  });

  // Fetch today's game state from backend (if user is logged in)
  const {
    data: backendGameState,
    error: backendGameStateError
  } = trpc.game.getTodayGameState.useQuery(
    undefined,
    {
      retry: false,
    }
  );

  // Mutation for submitting scores
  const submitScoreMutation = trpc.game.submitScore.useMutation();

  // Save game state before user signs in
  const handleSignInClick = () => {
    if (dailyColorData && gameState.guesses.length > 0) {
      // Save current game state to a special key for post-onboarding restoration
      localStorage.setItem(
        "pre-auth-game-state",
        JSON.stringify({
          gameDate: dailyColorData.gameDate,
          targetColor: gameState.targetColor,
          guesses: gameState.guesses,
          isComplete: gameState.isComplete,
          attempts: gameState.attempts,
          won: gameState.guesses.some((g) => g.similarity === 100),
          gaveUp: false,
        })
      );
    }
  };

  // Listen for auth changes and refetch game state when user logs in
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Refetch backend game state when user signs in
        utils.game.getTodayGameState.invalidate();
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, utils.game.getTodayGameState]);

  useEffect(() => {
    async function initGame() {
      const loadedColors = await loadColors();
      setColors(loadedColors);

      // Clear old game states from localStorage
      clearOldGameStates();

      // Check if this is the user's first time visiting
      const hasSeenHelp = getCookie('colordle_seen_help');
      if (!hasSeenHelp) {
        setHelpDialogOpen(true);
      }

      setIsLoading(false);
    }

    initGame();
  }, []);

  // Set target color and load saved game state when daily color data is loaded
  useEffect(() => {
    if (dailyColorData) {
      const dailyColor: Color = {
        name: dailyColorData.colorName,
        hex: dailyColorData.colorHex,
        goodName: true, // Colors from DB are curated
      };

      const today = getTodayDateString();

      // Priority 1: Try to load from backend (if user is logged in)
      if (backendGameState && backendGameState.guesses) {
        const guesses = (backendGameState.guesses as any[]).map((g: any) => ({
          color: {
            name: g.colorName,
            hex: g.colorHex,
            goodName: true,
          },
          similarity: g.similarity,
          timestamp: new Date(g.timestamp),
        }));

        const restoredState = {
          targetColor: dailyColor,
          guesses,
          isComplete: backendGameState.won || backendGameState.gaveUp,
          attempts: backendGameState.attempts,
        };

        setGameState(restoredState);

        // Save to localStorage for offline access
        saveDailyGameState({
          gameDate: today,
          targetColor: dailyColor,
          guesses,
          isComplete: backendGameState.won || backendGameState.gaveUp,
          attempts: backendGameState.attempts,
          won: backendGameState.won,
          gaveUp: backendGameState.gaveUp,
        });

        // If game was already complete, show the target
        if (backendGameState.won || backendGameState.gaveUp) {
          setShowTarget(true);
        }
      }
      // Priority 2: Try to load saved game state from localStorage
      else {
        const savedState = loadDailyGameState(today);

        if (savedState && savedState.targetColor.hex === dailyColor.hex) {
          // Restore saved game state
          setGameState({
            targetColor: dailyColor,
            guesses: savedState.guesses,
            isComplete: savedState.isComplete,
            attempts: savedState.attempts,
          });

          // If game was already complete, show the target
          if (savedState.isComplete) {
            setShowTarget(true);
          }
        } else {
          // Start new game
          setGameState((prev) => ({
            ...prev,
            targetColor: dailyColor,
          }));
        }
      }
    }
  }, [dailyColorData, backendGameState]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-600 dark:text-green-500 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
      case "medium":
        return "text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700";
      case "hard":
        return "text-red-600 dark:text-red-500 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600";
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleGuess = (color: Color) => {
    if (!gameState.targetColor || gameState.isComplete) return;

    const similarity = calculateColorSimilarity(
      color.hex,
      gameState.targetColor.hex
    );
    const newGuess = {
      color,
      similarity,
      timestamp: new Date(),
    };

    const newGuesses = [...gameState.guesses, newGuess];
    const isWin = similarity === 100;
    const newAttempts = gameState.attempts + 1;

    const newGameState = {
      ...gameState,
      guesses: newGuesses,
      attempts: newAttempts,
      isComplete: isWin,
    };

    setGameState(newGameState);

    // Show game complete dialog if won
    if (isWin) {
      setGameCompleteDialogOpen(true);
    }

    // Save to localStorage
    if (dailyColorData && gameState.targetColor) {
      saveDailyGameState({
        gameDate: dailyColorData.gameDate,
        targetColor: gameState.targetColor,
        guesses: newGuesses,
        isComplete: isWin,
        attempts: newAttempts,
        won: isWin,
        gaveUp: false,
      });

      // Sync to backend
      submitScoreMutation.mutate({
        gameDate: dailyColorData.gameDate,
        colorName: gameState.targetColor.name,
        colorHex: gameState.targetColor.hex,
        attempts: newAttempts,
        won: isWin,
        gaveUp: false,
        guesses: newGuesses.map((g) => ({
          colorName: g.color.name,
          colorHex: g.color.hex,
          similarity: g.similarity,
          timestamp: g.timestamp.toISOString(),
        })),
      });
    }

    if (isWin) {
      const newStats = updateStatsOnWin(stats, newAttempts);
      setStats(newStats);
      saveGameStats(newStats);
      setShowTarget(true);
    }
  };

  const handleGiveUp = () => {
    const newGameState = {
      ...gameState,
      isComplete: true,
    };

    setGameState(newGameState);
    setShowTarget(true);

    // Show game complete dialog
    setGameCompleteDialogOpen(true);

    // Save to localStorage and sync to backend
    if (dailyColorData && gameState.targetColor) {
      saveDailyGameState({
        gameDate: dailyColorData.gameDate,
        targetColor: gameState.targetColor,
        guesses: gameState.guesses,
        isComplete: true,
        attempts: gameState.attempts,
        won: false,
        gaveUp: true,
      });

      submitScoreMutation.mutate({
        gameDate: dailyColorData.gameDate,
        colorName: gameState.targetColor.name,
        colorHex: gameState.targetColor.hex,
        attempts: gameState.attempts,
        won: false,
        gaveUp: true,
        guesses: gameState.guesses.map((g) => ({
          colorName: g.color.name,
          colorHex: g.color.hex,
          similarity: g.similarity,
          timestamp: g.timestamp.toISOString(),
        })),
      });
    }
  };

  // Show error state if daily color fetch fails
  if (dailyColorError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 p-8 text-center">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-black text-red-800 dark:text-red-400 mb-2">
              Failed to Load Game
            </h1>
            <p className="text-red-700 dark:text-red-300 text-sm mb-4">
              {dailyColorError.message || "Unable to fetch today's color. Please try again."}
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || dailyColorLoading || !dailyColorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <div className="w-16 h-16 mx-auto bg-muted border border-border"></div>
          </div>
          <p className="text-lg font-semibold">Loading colors...</p>
          <p className="text-sm text-muted-foreground mt-2">This should only take a moment</p>
        </div>
      </div>
    );
  }

  const targetHsl = gameState.targetColor
    ? hexToHsl(gameState.targetColor.hex)
    : null;
  const showHint = gameState.guesses.length >= 3;

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar
        onHelpClick={() => setHelpDialogOpen(true)}
        onStatsClick={() => setStatsDialogOpen(true)}
        onSignInClick={handleSignInClick}
      />
      <main className="h-screen overflow-hidden flex flex-col bg-background w-full">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1
                className="text-xl sm:text-3xl font-bold tracking-tight colordle-title flex-shrink-0"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {"Colordle".split("").map((letter, i) => (
                  <span
                    key={i}
                    className={`colordle-letter colordle-letter-${i}`}
                  >
                    {letter}
                  </span>
                ))}
              </h1>
              {dailyColorData && (
                <>
                  <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide border text-foreground bg-muted border-border whitespace-nowrap">
                    Day {dailyColorData.dayNumber}
                  </span>
                  <span
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide border whitespace-nowrap ${getDifficultyColor(
                      dailyColorData.difficulty
                    )}`}
                  >
                    {dailyColorData.difficulty}
                  </span>
                </>
              )}
            </div>
            {debugMode && gameState.targetColor && (
              <p className="text-xs font-mono text-yellow-600 dark:text-yellow-500 mt-1 truncate">
                DEBUG: {gameState.targetColor.name} ({gameState.targetColor.hex}
                )
              </p>
            )}
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            {/* Mobile menu trigger */}
            <SidebarTrigger />

            {/* Desktop menu buttons */}
            <div className="hidden md:flex gap-1 sm:gap-2">
              <UserMenu onSignInClick={handleSignInClick} />
              <HelpDialog
                open={helpDialogOpen}
                onOpenChange={(open) => {
                  setHelpDialogOpen(open);
                  // Set cookie when dialog is closed
                  if (!open) {
                    setCookie('colordle_seen_help', 'true');
                  }
                }}
              />
              <StatsDialog
                stats={stats}
                open={statsDialogOpen}
                onOpenChange={setStatsDialogOpen}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="flex-shrink-0">
          <ColorInput
            colors={colors}
            onGuess={handleGuess}
            disabled={gameState.isComplete}
            guessedColors={gameState.guesses.map((g) => g.color)}
          />
        </div>

        {/* Game Info Bar */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div className="text-sm font-semibold">
            <span className="text-xl sm:text-2xl font-black">{gameState.attempts}</span>
            <span className="text-muted-foreground ml-1 sm:ml-2">guesses</span>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {showHint && (
              <Button
                onClick={() => setHintEnabled(!hintEnabled)}
                variant="outline"
                size="icon-sm"
                title="Show hint"
              >
                <Lightbulb className="w-4 h-4" />
              </Button>
            )}
            {!gameState.isComplete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="bg-red-600 text-white hover:text-white hover:bg-red-500 hover:opacity-90 border-0"
                    size="icon-sm"
                    title="Give up"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-0">
                  <div
                    className="px-4 py-3 text-center text-lg font-bold border-b"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    Give up?
                  </div>
                  <div className="grid grid-cols-2 gap-0">
                    <DropdownMenuItem
                      onClick={handleGiveUp}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950 rounded-none border-r py-3 justify-center cursor-pointer"
                    >
                      Yes
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-3 justify-center cursor-pointer rounded-none">
                      No
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Color Hint Modal */}
        <Dialog
          open={showHint && hintEnabled}
          onOpenChange={() => setHintEnabled(false)}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader className="border-b border-border pb-3 sm:pb-4">
              <DialogTitle className="text-xl sm:text-2xl">Color Hint</DialogTitle>
            </DialogHeader>
            <div>
              {targetHsl && (
                <div className="space-y-5 sm:space-y-8 py-4 sm:py-6">
                  {/* Hue */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide">
                        Hue
                      </span>
                      <span className="text-2xl sm:text-3xl font-black tabular-nums">
                        {Math.round(targetHsl.h)}
                        <span className="text-sm sm:text-base text-muted-foreground font-bold">
                          °
                        </span>
                      </span>
                    </div>
                    <div className="relative h-10 sm:h-12 border border-border shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))",
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                        style={{
                          left: `${(targetHsl.h / 360) * 100}%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Saturation */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide">
                        Saturation
                      </span>
                      <span className="text-2xl sm:text-3xl font-black tabular-nums">
                        {Math.round(targetHsl.s)}
                        <span className="text-sm sm:text-base text-muted-foreground font-bold">
                          %
                        </span>
                      </span>
                    </div>
                    <div className="relative h-10 sm:h-12 border border-border shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to right, hsl(${targetHsl.h}, 0%, 50%), hsl(${targetHsl.h}, 100%, 50%))`,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                        style={{
                          left: `${targetHsl.s}%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Lightness */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide">
                        Lightness
                      </span>
                      <span className="text-2xl sm:text-3xl font-black tabular-nums">
                        {Math.round(targetHsl.l)}
                        <span className="text-sm sm:text-base text-muted-foreground font-bold">
                          %
                        </span>
                      </span>
                    </div>
                    <div className="relative h-10 sm:h-12 border border-border shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to right, hsl(${targetHsl.h}, ${targetHsl.s}%, 0%), hsl(${targetHsl.h}, ${targetHsl.s}%, 50%), hsl(${targetHsl.h}, ${targetHsl.s}%, 100%))`,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                        style={{
                          left: `${targetHsl.l}%`,
                          transform: "translateX(-50%)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Win/Complete State */}
        {showTarget && gameState.targetColor && (
          <div className="flex-shrink-0 p-4 sm:p-6 bg-card border border-border">
            <div className="flex items-center gap-4 sm:gap-6">
              <div
                className="w-20 h-20 sm:w-32 sm:h-32 border border-border shadow-lg flex-shrink-0"
                style={{ backgroundColor: gameState.targetColor.hex }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-lg sm:text-2xl font-black truncate">
                  {gameState.targetColor.name}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground font-mono mt-1 truncate">
                  {gameState.targetColor.hex}
                </p>
                {gameState.guesses.some((g) => g.similarity === 100) ? (
                  <div className="mt-4">
                    <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1.5 border border-green-300 dark:border-green-700 font-bold">
                      <span className="text-xl">🎉</span>
                      Won in {gameState.attempts} guesses!
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Come back tomorrow for a new color!
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p className="text-base font-semibold text-muted-foreground">
                      Better luck tomorrow!
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      A new color will be available tomorrow.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Guess History - Takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <GuessHistory guesses={gameState.guesses} />
        </div>
      </div>

      {/* Mobile dialogs - controlled by sidebar */}
      <div className="md:hidden">
        <HelpDialog
          open={helpDialogOpen}
          onOpenChange={(open) => {
            setHelpDialogOpen(open);
            if (!open) {
              setCookie('colordle_seen_help', 'true');
            }
          }}
        />
        <StatsDialog
          stats={stats}
          open={statsDialogOpen}
          onOpenChange={setStatsDialogOpen}
        />
      </div>

      {/* Game Complete Dialog */}
      {dailyColorData && (
        <GameCompleteDialog
          isOpen={gameCompleteDialogOpen}
          onOpenChange={setGameCompleteDialogOpen}
          gameState={gameState}
          won={gameState.guesses.some((g) => g.similarity === 100)}
          gaveUp={gameState.isComplete && !gameState.guesses.some((g) => g.similarity === 100)}
          dayNumber={dailyColorData.dayNumber}
        />
      )}
    </main>
    </SidebarProvider>
  );
}
