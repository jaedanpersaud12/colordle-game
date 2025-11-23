import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dailyColors } from "@/lib/db/schema";
import { GAME_EPOCH, getDaysSinceEpoch } from "@/lib/daily-color";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env file
config();

interface Color {
  name: string;
  hex: string;
  goodName: boolean;
}

type Difficulty = "easy" | "medium" | "hard";

interface ColorWithDifficulty extends Color {
  difficulty: Difficulty;
}

function loadColorsSync(): Color[] {
  const csvPath = join(process.cwd(), "public", "colornames.csv");
  const text = readFileSync(csvPath, "utf-8");
  const lines = text.split("\n").slice(1); // Skip header

  return lines
    .filter((line) => line.trim())
    .map((line) => {
      const [name, hex, goodName] = line.split(",");
      return {
        name: name.trim(),
        hex: hex.trim(),
        goodName: goodName?.trim() !== "x",
      };
    });
}

/**
 * Calculate difficulty based on color name characteristics.
 * Easy: Simple, common color names (1-2 words, marked as good names)
 * Medium: Descriptive names, moderate length (2-4 words)
 * Hard: Complex names, obscure references, long names, marked as bad names
 */
function calculateDifficulty(color: Color): Difficulty {
  const name = color.name;
  const wordCount = name.split(/\s+/).length;
  const charCount = name.length;
  const hasNumbers = /\d/.test(name);
  const hasSpecialChars = /[^\w\s-]/.test(name);

  let score = 0;

  // Bad names are generally harder
  if (!color.goodName) score += 3;

  // Word count scoring
  if (wordCount === 1) score += 0; // Simple single words are easy
  else if (wordCount === 2) score += 1;
  else if (wordCount === 3) score += 2;
  else score += 3; // 4+ words is hard

  // Character count
  if (charCount < 8) score += 0;
  else if (charCount < 15) score += 1;
  else if (charCount < 25) score += 2;
  else score += 3;

  // Numbers and special chars make it harder
  if (hasNumbers) score += 2;
  if (hasSpecialChars) score += 1;

  // Determine difficulty based on total score
  if (score <= 2) return "easy";
  if (score <= 5) return "medium";
  return "hard";
}

/**
 * Deterministic shuffle using Fisher-Yates with a seeded random.
 */
function seededShuffle<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  let currentSeed = seed;

  const random = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Strategically mix colors to balance difficulty throughout the year.
 * Creates a pattern: easy, medium, hard, medium, easy, etc.
 */
function strategicMix(colors: ColorWithDifficulty[], seed: number): ColorWithDifficulty[] {
  // Separate by difficulty
  const easy = colors.filter(c => c.difficulty === "easy");
  const medium = colors.filter(c => c.difficulty === "medium");
  const hard = colors.filter(c => c.difficulty === "hard");

  console.log(`\nDifficulty distribution:`);
  console.log(`  Easy: ${easy.length} colors`);
  console.log(`  Medium: ${medium.length} colors`);
  console.log(`  Hard: ${hard.length} colors`);

  // Shuffle each difficulty group
  const shuffledEasy = seededShuffle(easy, seed);
  const shuffledMedium = seededShuffle(medium, seed + 1);
  const shuffledHard = seededShuffle(hard, seed + 2);

  // Mix strategically: cycle through difficulties
  // Pattern: easy, medium, easy, hard, medium, easy, medium, hard, ...
  const mixed: ColorWithDifficulty[] = [];
  const pattern: Difficulty[] = ["easy", "medium", "easy", "hard", "medium", "easy", "medium", "hard"];

  const pools = { easy: shuffledEasy, medium: shuffledMedium, hard: shuffledHard };
  let patternIndex = 0;

  while (mixed.length < colors.length) {
    const difficulty = pattern[patternIndex % pattern.length];
    const pool = pools[difficulty];

    if (pool.length > 0) {
      mixed.push(pool.shift()!);
    } else {
      // If this difficulty is exhausted, take from any available pool
      const anyAvailable = shuffledEasy.shift() || shuffledMedium.shift() || shuffledHard.shift();
      if (anyAvailable) mixed.push(anyAvailable);
    }

    patternIndex++;
  }

  return mixed;
}

async function seedDailyColors() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client);

  console.log("Loading colors from CSV...");
  const colors = loadColorsSync();
  console.log(`Loaded ${colors.length} colors`);

  // Calculate difficulty for each color
  console.log("\nCalculating difficulty for each color...");
  const colorsWithDifficulty: ColorWithDifficulty[] = colors.map(color => ({
    ...color,
    difficulty: calculateDifficulty(color),
  }));

  // Strategically mix colors
  console.log("\nStrategically mixing colors...");
  const mixedColors = strategicMix(colorsWithDifficulty, 42); // Seed 42 for deterministic shuffle

  // Generate colors for the next 365 days
  const startDate = new Date(GAME_EPOCH + "T00:00:00Z");
  const daysToSeed = 365;

  console.log(`\nSeeding daily colors starting from ${GAME_EPOCH}...`);
  console.log(`Generating ${daysToSeed} daily colors\n`);

  const records = [];
  const difficultyCount = { easy: 0, medium: 0, hard: 0 };

  for (let i = 0; i < daysToSeed; i++) {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + i);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const dailyColor = mixedColors[i % mixedColors.length];
    const daysSinceEpoch = getDaysSinceEpoch(dateString);
    const dayNumber = i + 1; // Day 1, 2, 3, etc.

    difficultyCount[dailyColor.difficulty]++;

    records.push({
      gameDate: dateString,
      dayNumber: dayNumber,
      colorName: dailyColor.name,
      colorHex: dailyColor.hex,
      seed: daysSinceEpoch,
      difficulty: dailyColor.difficulty,
    });

    if ((i + 1) % 50 === 0 || i === daysToSeed - 1) {
      console.log(`Generated ${i + 1}/${daysToSeed} colors...`);
    }
  }

  console.log("\nInserting into database...");
  await db.insert(dailyColors).values(records).onConflictDoNothing();

  console.log(`\n✅ Successfully seeded ${records.length} daily colors!`);
  console.log(`📅 Date range: ${records[0].gameDate} to ${records[records.length - 1].gameDate}`);
  console.log(`\nDifficulty breakdown for the year:`);
  console.log(`  🟢 Easy: ${difficultyCount.easy} days`);
  console.log(`  🟡 Medium: ${difficultyCount.medium} days`);
  console.log(`  🔴 Hard: ${difficultyCount.hard} days`);
  console.log(`\nFirst 10 colors:`);
  for (let i = 0; i < Math.min(10, records.length); i++) {
    const emoji = records[i].difficulty === "easy" ? "🟢" : records[i].difficulty === "medium" ? "🟡" : "🔴";
    console.log(`  ${emoji} Day ${records[i].dayNumber} (${records[i].gameDate}): ${records[i].colorName} (${records[i].colorHex})`);
  }

  await client.end();
}

seedDailyColors().catch((error) => {
  console.error("Error seeding daily colors:", error);
  process.exit(1);
});
