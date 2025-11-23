"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BarChart3, Gamepad2, TrendingUp, Flame, Trophy } from "lucide-react";
import { GameStats } from "@/lib/game";

interface StatsDialogProps {
  stats: GameStats;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function StatsDialog({ stats, open, onOpenChange }: StatsDialogProps) {
  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  // Group guesses into ranges for better visualization
  const getGuessRanges = () => {
    const ranges: { label: string; count: number }[] = [];
    const guessKeys = Object.keys(stats.guessDistribution)
      .map(Number)
      .sort((a, b) => a - b);

    if (guessKeys.length === 0) return ranges;

    const maxGuess = Math.max(...guessKeys);

    // If max is <= 20, show individual guesses
    if (maxGuess <= 20) {
      for (let i = 1; i <= maxGuess; i++) {
        ranges.push({
          label: i.toString(),
          count: stats.guessDistribution[i] || 0,
        });
      }
    } else {
      // Group into ranges of 5
      const maxRange = Math.ceil(maxGuess / 5) * 5;
      for (let i = 1; i <= maxRange; i += 5) {
        const end = Math.min(i + 4, maxRange);
        let count = 0;
        for (let j = i; j <= end; j++) {
          count += stats.guessDistribution[j] || 0;
        }
        if (count > 0) {
          ranges.push({
            label: i === end ? `${i}` : `${i}-${end}`,
            count,
          });
        }
      }
    }

    return ranges;
  };

  const guessRanges = getGuessRanges();
  const maxCount = Math.max(...guessRanges.map((r) => r.count), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border pb-3 sm:pb-4">
          <DialogTitle className="text-xl sm:text-2xl">Statistics</DialogTitle>
        </DialogHeader>
        <div className="space-y-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2 text-center py-4 sm:py-5 border-b border-border">
            <div className="flex flex-col items-center">
              <Gamepad2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mb-1.5 sm:mb-2 text-muted-foreground" />
              <p className="text-2xl sm:text-3xl font-bold">{stats.gamesPlayed}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                Played
              </p>
            </div>
            <div className="flex flex-col items-center">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 mb-1.5 sm:mb-2 text-muted-foreground" />
              <p className="text-2xl sm:text-3xl font-bold">{winRate}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                Win %
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 mb-1.5 sm:mb-2 text-muted-foreground" />
              <p className="text-2xl sm:text-3xl font-bold">{stats.currentStreak}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                Current
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mb-1.5 sm:mb-2 text-muted-foreground" />
              <p className="text-2xl sm:text-3xl font-bold">{stats.maxStreak}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
                Max
              </p>
            </div>
          </div>

          <div className="pt-4 sm:pt-6 pb-2">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide">
                Guess Distribution
              </h3>
            </div>
            <div className="space-y-1">
              {guessRanges.length === 0 ? (
                <p className="text-sm sm:text-base text-muted-foreground text-center py-3 sm:py-4">
                  No games won yet
                </p>
              ) : (
                guessRanges.map((range) => {
                  const percentage = (range.count / maxCount) * 100;

                  return (
                    <div key={range.label} className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-xs sm:text-sm font-bold w-8 sm:w-10 text-right">
                        {range.label}
                      </span>
                      <div className="flex-1 bg-muted h-5 sm:h-6 relative border border-border">
                        <div
                          className="bg-foreground h-full flex items-center justify-end pr-1.5 sm:pr-2 transition-all text-background border-r-2 border-foreground"
                          style={{
                            width: `${Math.max(
                              percentage,
                              range.count > 0 ? 10 : 0
                            )}%`,
                          }}
                        >
                          {range.count > 0 && (
                            <span className="text-xs sm:text-sm font-bold">
                              {range.count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
