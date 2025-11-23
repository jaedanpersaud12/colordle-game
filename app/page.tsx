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
  getDailyColor,
} from "@/lib/game";
import { ColorInput } from "@/components/ColorInput";
import { GuessHistory } from "@/components/GuessHistory";
import { HelpDialog } from "@/components/HelpDialog";
import { StatsDialog } from "@/components/StatsDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalBody,
} from "@/components/ui/modal";
import { Lightbulb, Flag } from "lucide-react";

export default function Home() {
  const [colors, setColors] = useState<Color[]>([]);
  const [gameState, setGameState] = useState<GameState>(getInitialGameState());
  const [stats, setStats] = useState<GameStats>(loadGameStats());
  const [isLoading, setIsLoading] = useState(true);
  const [showTarget, setShowTarget] = useState(false);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    async function initGame() {
      const loadedColors = await loadColors();
      setColors(loadedColors);

      const dailyColor = getDailyColor(loadedColors);
      setGameState((prev) => ({
        ...prev,
        targetColor: dailyColor,
      }));

      setIsLoading(false);
    }

    initGame();
  }, []);

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

    setGameState({
      ...gameState,
      guesses: newGuesses,
      attempts: gameState.attempts + 1,
      isComplete: isWin,
    });

    if (isWin) {
      const newStats = updateStatsOnWin(stats, gameState.attempts + 1);
      setStats(newStats);
      saveGameStats(newStats);
      setShowTarget(true);
    }
  };

  const handleGiveUp = () => {
    setGameState({
      ...gameState,
      isComplete: true,
    });
    setShowTarget(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Loading colors...</p>
      </div>
    );
  }

  const targetHsl = gameState.targetColor
    ? hexToHsl(gameState.targetColor.hex)
    : null;
  const showHint = gameState.guesses.length >= 3;

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-black tracking-tight">Colordle</h1>
            {debugMode && gameState.targetColor && (
              <p className="text-xs font-mono text-yellow-600 dark:text-yellow-500 mt-1">
                DEBUG: {gameState.targetColor.name} ({gameState.targetColor.hex}
                )
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <HelpDialog />
            <StatsDialog stats={stats} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-5xl mx-auto w-full px-6 py-4 gap-4">
        {/* Search Input */}
        <div className="flex-shrink-0">
          <ColorInput
            colors={colors}
            onGuess={handleGuess}
            disabled={gameState.isComplete}
          />
        </div>

        {/* Game Info Bar */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div className="text-sm font-semibold">
            <span className="text-2xl font-black">{gameState.attempts}</span>
            <span className="text-muted-foreground ml-2">guesses</span>
          </div>
          <div className="flex gap-2">
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
                    variant="outline"
                    className="bg-red-600 text-white hover:text-white hover:bg-red-500 hover:opacity-90"
                    size="icon-sm"
                    title="Give up"
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 p-0">
                  <div className="px-4 py-3 text-center text-sm font-semibold border-b">
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
        <Modal isOpen={showHint && hintEnabled} onOpenChange={() => setHintEnabled(false)}>
          <ModalContent size="md" closeButton={true}>
            <ModalHeader>
              <ModalTitle>Color Hint</ModalTitle>
            </ModalHeader>
            <ModalBody>
              {targetHsl && (
                <div className="space-y-8 py-6">
                  {/* Hue */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black uppercase tracking-wide">Hue</span>
                      <span className="text-3xl font-black tabular-nums">{Math.round(targetHsl.h)}<span className="text-base text-muted-foreground font-bold">°</span></span>
                    </div>
                    <div className="relative h-12 border border-border shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                        style={{ left: `${(targetHsl.h / 360) * 100}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                  </div>

                  {/* Saturation */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black uppercase tracking-wide">Saturation</span>
                      <span className="text-3xl font-black tabular-nums">{Math.round(targetHsl.s)}<span className="text-base text-muted-foreground font-bold">%</span></span>
                    </div>
                    <div className="relative h-12 border border-border shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to right, hsl(${targetHsl.h}, 0%, 50%), hsl(${targetHsl.h}, 100%, 50%))`,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                        style={{ left: `${targetHsl.s}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                  </div>

                  {/* Lightness */}
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-black uppercase tracking-wide">Lightness</span>
                      <span className="text-3xl font-black tabular-nums">{Math.round(targetHsl.l)}<span className="text-base text-muted-foreground font-bold">%</span></span>
                    </div>
                    <div className="relative h-12 border border-border shadow-sm">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to right, hsl(${targetHsl.h}, ${targetHsl.s}%, 0%), hsl(${targetHsl.h}, ${targetHsl.s}%, 50%), hsl(${targetHsl.h}, ${targetHsl.s}%, 100%))`,
                        }}
                      />
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-foreground shadow-lg"
                        style={{ left: `${targetHsl.l}%`, transform: 'translateX(-50%)' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Win/Complete State */}
        {showTarget && gameState.targetColor && (
          <div className="flex-shrink-0 p-6 bg-card border border-border">
            <div className="flex items-center gap-6">
              <div
                className="w-32 h-32 border border-border shadow-lg flex-shrink-0"
                style={{ backgroundColor: gameState.targetColor.hex }}
              />
              <div className="flex-1">
                <p className="text-2xl font-black">
                  {gameState.targetColor.name}
                </p>
                <p className="text-base text-muted-foreground font-mono mt-1">
                  {gameState.targetColor.hex}
                </p>
                {gameState.guesses.some((g) => g.similarity === 100) ? (
                  <div className="mt-4 inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-2 border border-green-300 dark:border-green-700 font-bold">
                    <span className="text-xl">🎉</span>
                    Won in {gameState.attempts} guesses!
                  </div>
                ) : (
                  <p className="text-base font-semibold text-muted-foreground mt-4">
                    Better luck tomorrow!
                  </p>
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
    </main>
  );
}
