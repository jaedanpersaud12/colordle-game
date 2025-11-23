"use client";

import {
  Dialog,
  DialogBody,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Modal, ModalOverlay } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { GameStats } from "@/lib/game";

interface StatsDialogProps {
  stats: GameStats;
}

export function StatsDialog({ stats }: StatsDialogProps) {
  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  const maxGuesses = Math.max(
    ...Object.keys(stats.guessDistribution).map(Number),
    0
  );
  const maxCount = Math.max(...Object.values(stats.guessDistribution), 1);

  return (
    <ModalOverlay>
      <Modal>
        <Dialog>
          {({ close }) => (
            <>
              <DialogHeader
                title="Statistics"
                description="Your Colordle performance"
              />
              <DialogBody className="space-y-6">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold">{stats.gamesPlayed}</p>
                    <p className="text-xs text-muted-foreground">Played</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{winRate}%</p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.currentStreak}</p>
                    <p className="text-xs text-muted-foreground">Streak</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.maxStreak}</p>
                    <p className="text-xs text-muted-foreground">Max Streak</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    Guess Distribution
                  </h3>
                  <div className="space-y-2">
                    {maxGuesses === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No games won yet
                      </p>
                    ) : (
                      Array.from(
                        { length: Math.min(maxGuesses, 20) },
                        (_, i) => i + 1
                      ).map((guessCount) => {
                        const count = stats.guessDistribution[guessCount] || 0;
                        const percentage = (count / maxCount) * 100;

                        return (
                          <div
                            key={guessCount}
                            className="flex items-center gap-2"
                          >
                            <span className="text-sm w-4">{guessCount}</span>
                            <div className="flex-1 bg-muted rounded-sm h-6 relative">
                              <div
                                className="bg-primary h-full rounded-sm flex items-center justify-end pr-2 transition-all"
                                style={{
                                  width: `${Math.max(
                                    percentage,
                                    count > 0 ? 10 : 0
                                  )}%`,
                                }}
                              >
                                {count > 0 && (
                                  <span className="text-xs text-primary-foreground font-medium">
                                    {count}
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
              </DialogBody>
            </>
          )}
        </Dialog>
      </Modal>
      <DialogTrigger>
        <Button variant="outline" size="icon-sm">
          <BarChart3 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
    </ModalOverlay>
  );
}
