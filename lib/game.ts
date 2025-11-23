import { Color } from './colors';

export interface Guess {
  color: Color;
  similarity: number;
  timestamp: Date;
}

export interface GameState {
  targetColor: Color | null;
  guesses: Guess[];
  isComplete: boolean;
  attempts: number;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: { [key: number]: number };
}

export function getInitialGameState(): GameState {
  return {
    targetColor: null,
    guesses: [],
    isComplete: false,
    attempts: 0,
  };
}

export function loadGameStats(): GameStats {
  if (typeof window === 'undefined') {
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: {},
    };
  }

  const saved = localStorage.getItem('colordle-stats');
  if (saved) {
    return JSON.parse(saved);
  }

  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},
  };
}

export function saveGameStats(stats: GameStats): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('colordle-stats', JSON.stringify(stats));
  }
}

export function updateStatsOnWin(stats: GameStats, attempts: number): GameStats {
  const newStreak = stats.currentStreak + 1;

  return {
    gamesPlayed: stats.gamesPlayed + 1,
    gamesWon: stats.gamesWon + 1,
    currentStreak: newStreak,
    maxStreak: Math.max(stats.maxStreak, newStreak),
    guessDistribution: {
      ...stats.guessDistribution,
      [attempts]: (stats.guessDistribution[attempts] || 0) + 1,
    },
  };
}

export function updateStatsOnLoss(stats: GameStats): GameStats {
  return {
    ...stats,
    gamesPlayed: stats.gamesPlayed + 1,
    currentStreak: 0,
  };
}

export function getDailyColorSeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

export function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function getDailyColor(colors: Color[]): Color {
  const seed = getDailyColorSeed();
  const index = Math.floor(seededRandom(seed) * colors.length);
  return colors[index];
}
