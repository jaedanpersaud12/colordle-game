'use client';

import { Guess } from '@/lib/game';

interface GuessHistoryProps {
  guesses: Guess[];
}

export function GuessHistory({ guesses }: GuessHistoryProps) {
  if (guesses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center text-muted-foreground">
        <p className="text-sm">Start typing a color name to make your first guess!</p>
      </div>
    );
  }

  const sortedGuesses = [...guesses].sort((a, b) => b.similarity - a.similarity);

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-base font-bold mb-3 flex-shrink-0">
        Your Guesses ({guesses.length})
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {sortedGuesses.map((guess, index) => (
          <div
            key={index}
            className="group relative overflow-hidden border border-border bg-card hover:border-foreground/20 transition-all"
          >
            {/* Colored left stripe */}
            <div
              className="absolute left-0 top-0 bottom-0 w-2"
              style={{ backgroundColor: guess.color.hex }}
            />

            <div className="flex items-center gap-4 p-4 pl-6">
              {/* Large color swatch */}
              <div
                className="w-20 h-20 border border-border flex-shrink-0 shadow-sm"
                style={{ backgroundColor: guess.color.hex }}
              />

              {/* Color info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{guess.color.name}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{guess.color.hex}</p>
                {guess.similarity >= 95 && (
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                    🔥 Very close!
                  </p>
                )}
                {guess.similarity >= 80 && guess.similarity < 95 && (
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mt-1">
                    ⚡ Getting warm
                  </p>
                )}
              </div>

              {/* Similarity score */}
              <div className="text-right flex-shrink-0">
                <div className="text-4xl font-black leading-none">
                  {guess.similarity}
                  <span className="text-2xl text-muted-foreground">%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
