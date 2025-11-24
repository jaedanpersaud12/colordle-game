"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GameState } from "@/lib/game";
import { Share2, Copy, Check, Trophy, Star, ThumbsUp, Target } from "lucide-react";
import { getTodayDateString, getDaysSinceEpoch } from "@/lib/daily-color";

interface GameCompleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gameState: GameState;
  won: boolean;
  gaveUp: boolean;
  dayNumber: number;
}

// Get difficulty rating based on number of guesses
function getDifficultyRating(guesses: number) {
  if (guesses === 1) return { emoji: "🎯", label: "Perfect!", color: "text-yellow-600" };
  if (guesses <= 3) return { emoji: "🏆", label: "Expert", color: "text-yellow-600" };
  if (guesses <= 6) return { emoji: "⭐", label: "Great", color: "text-blue-600" };
  if (guesses <= 10) return { emoji: "👍", label: "Good", color: "text-green-600" };
  return { emoji: "💪", label: "Persistent", color: "text-purple-600" };
}

// Get emoji for similarity
function getSimilarityEmoji(similarity: number) {
  if (similarity === 100) return "🟩";
  if (similarity >= 90) return "🟧";
  if (similarity >= 70) return "🟨";
  if (similarity >= 50) return "🟦";
  if (similarity >= 30) return "🟪";
  return "⬜";
}

export function GameCompleteDialog({
  isOpen,
  onOpenChange,
  gameState,
  won,
  gaveUp,
  dayNumber,
}: GameCompleteDialogProps) {
  const [copied, setCopied] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState("");

  const guessCount = gameState.guesses.length;
  const rating = getDifficultyRating(guessCount);

  // Calculate time until next game
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilNext(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Generate share text - focus on efficiency and progression
  const generateShareText = () => {
    if (gaveUp) {
      return `Colordle #${dayNumber} 🎨\n\nGave up after ${guessCount} ${guessCount === 1 ? 'guess' : 'guesses'}\n\nPlay at colordle.game`;
    }

    // Show last 4-5 guesses as progression
    const lastGuesses = gameState.guesses.slice(-5);
    const progression = lastGuesses
      .map((g) => getSimilarityEmoji(g.similarity))
      .join(" → ");

    const title = `Colordle #${dayNumber} ${rating.emoji}`;
    const result = guessCount === 1
      ? "Perfect! Solved in 1 guess!"
      : `${rating.label} - ${guessCount} guesses`;

    return `${title}\n${result}\n\n${progression}\n\nPlay at colordle.game`;
  };

  const handleCopy = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleShare = (platform: string) => {
    const text = generateShareText();
    const url = encodeURIComponent("https://colordle.game");
    const encodedText = encodeURIComponent(text);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
    };

    window.open(
      shareUrls[platform as keyof typeof shareUrls],
      "_blank",
      "width=600,height=400"
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {won
              ? guessCount === 1
                ? "🎯 Perfect!"
                : "🎉 Success!"
              : "💭 Better luck tomorrow!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Result Summary */}
          <div className="text-center space-y-3">
            <p className="text-lg font-semibold text-muted-foreground">
              Colordle #{dayNumber}
            </p>

            {won ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl">{rating.emoji}</span>
                </div>
                <p className={`text-2xl font-bold ${rating.color}`}>
                  {rating.label}
                </p>
                <p className="text-lg text-muted-foreground">
                  {guessCount} {guessCount === 1 ? 'guess' : 'guesses'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-lg text-muted-foreground">
                  {guessCount} {guessCount === 1 ? 'guess' : 'guesses'} attempted
                </p>
              </div>
            )}

            {/* Target Color */}
            {gameState.targetColor && (
              <div className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">Target Color</p>
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-16 h-16 border-2 border-border shadow-lg"
                    style={{ backgroundColor: gameState.targetColor.hex }}
                  />
                  <div className="text-left">
                    <p className="font-semibold">
                      {gameState.targetColor.name}
                    </p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {gameState.targetColor.hex}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progression Visual - Show last 5 guesses */}
          {won && gameState.guesses.length > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-semibold text-center text-muted-foreground">
                Your Journey
              </p>
              <div className="flex items-center justify-center gap-2">
                {gameState.guesses.slice(-5).map((guess, i) => (
                  <span key={i} className="text-3xl">
                    {getSimilarityEmoji(guess.similarity)}
                  </span>
                ))}
              </div>
              {gameState.guesses.length > 5 && (
                <p className="text-xs text-center text-muted-foreground">
                  Showing last 5 guesses
                </p>
              )}
            </div>
          )}

          {/* Share Buttons */}
          <div className="space-y-3 border-t border-border pt-4">
            <Button
              onClick={handleCopy}
              className="w-full"
              variant="default"
              size="lg"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Results
                </>
              )}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleShare("twitter")}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                onClick={() => handleShare("facebook")}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                onClick={() => handleShare("whatsapp")}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Next Game Timer */}
          <div className="text-center pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Next Colordle</p>
            <p className="text-2xl font-mono font-bold">{timeUntilNext}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
