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
import { Share2, Copy, Check } from "lucide-react";
import { getTodayDateString, getDaysSinceEpoch } from "@/lib/daily-color";

interface GameCompleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  gameState: GameState;
  won: boolean;
  gaveUp: boolean;
  dayNumber: number;
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

  // Generate share text
  const generateShareText = () => {
    const title = `Colordle #${dayNumber} ${
      won ? `${gameState.attempts}/6` : "X/6"
    }`;

    // Generate colored squares based on similarity
    const squares = gameState.guesses
      .map((guess) => {
        const similarity = guess.similarity;
        if (similarity === 100) return "🟩"; // Perfect match
        if (similarity >= 90) return "🟧"; // Very close
        if (similarity >= 70) return "🟨"; // Close
        if (similarity >= 50) return "🟦"; // Medium
        if (similarity >= 30) return "🟪"; // Far
        return "⬜"; // Very far
      })
      .join("");

    return `${title}\n\n${squares}\n\nPlay at colordle.game`;
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
              ? "🎉 Congratulations!"
              : gaveUp
              ? "Better luck tomorrow!"
              : "Game Over"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Result Summary */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              Colordle #{dayNumber}
            </p>
            <p className="text-3xl font-bold">
              {won ? `${gameState.attempts}/6` : "X/6"}
            </p>
            {gameState.targetColor && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Target Color</p>
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-16 h-16 border-2 border-border"
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

          {/* Visual Results */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-center">Your Guesses</p>
            <div className="flex flex-col gap-1 items-center">
              {gameState.guesses.map((guess, i) => {
                const similarity = guess.similarity;
                let emoji = "⬜";
                if (similarity === 100) emoji = "🟩";
                else if (similarity >= 90) emoji = "🟧";
                else if (similarity >= 70) emoji = "🟨";
                else if (similarity >= 50) emoji = "🟦";
                else if (similarity >= 30) emoji = "🟪";

                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-sm text-muted-foreground w-16 text-right">
                      {similarity.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleCopy}
              className="w-full"
              variant="default"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Results
                </>
              )}
            </Button>

            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => handleShare("twitter")}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Button>
              <Button
                onClick={() => handleShare("facebook")}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </Button>
              <Button
                onClick={() => handleShare("whatsapp")}
                variant="outline"
                size="sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Next Game Timer */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Next Colordle</p>
            <p className="text-2xl font-mono font-bold">{timeUntilNext}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
