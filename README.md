# Colordle - Color Guessing Game

A daily color guessing game inspired by Wordle, where you guess a color name from a database of 30,000+ colors.

## Features

- **30,000+ Colors**: Comprehensive color database with unique and creative color names
- **Smart Help System**: Balanced difficulty with progressive hints
  - Autocomplete search to discover color names
  - Color wheel visualization
  - Hue hints unlock after 3 guesses
  - Similarity percentage feedback on each guess
- **Daily Challenge**: New color every day using seeded randomization
- **Statistics Tracking**: Track your games, win rate, streaks, and guess distribution
- **Beautiful UI**: Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui

## How to Play

1. Type a color name in the input field
2. Select from autocomplete suggestions or press Enter
3. See how close your guess is (0-100% similarity)
4. Use the color wheel and your previous guesses to narrow down the target
5. After 3 guesses, a hint marker appears on the color wheel showing the hue area
6. Keep guessing until you find the exact color!

## Getting Started

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Game Mechanics

### Similarity Scoring

Colors are compared using RGB Euclidean distance:
- **100%**: Exact match (you win!)
- **95-99%**: Extremely close, almost identical
- **80-94%**: Very similar, getting warm
- **60-79%**: Somewhat similar
- **Below 60%**: Keep exploring

### Help System Design Philosophy

The game balances challenge with discoverability:

1. **Autocomplete Search**: Helps you discover color names without giving away the answer
2. **Color Wheel**: Shows the full spectrum, giving spatial context
3. **Progressive Hints**: After 3 guesses, a marker shows the general hue area
4. **Sorted Guess History**: Automatically ranks your guesses by similarity
5. **Contextual Feedback**: Visual and textual cues guide your next guess

This design ensures the game is challenging but not frustrating - you're learning color names while playing!

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **State Management**: React Hooks + LocalStorage

## Project Structure

```
colordle-game/
├── app/
│   └── page.tsx              # Main game page
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── ColorWheel.tsx        # Interactive color wheel with hints
│   ├── ColorInput.tsx        # Autocomplete color search
│   ├── GuessHistory.tsx      # Sorted guess list with feedback
│   ├── HelpDialog.tsx        # Game instructions
│   └── StatsDialog.tsx       # Player statistics
├── lib/
│   ├── colors.ts             # Color utilities and calculations
│   └── game.ts               # Game logic and state management
└── public/
    └── colornames.csv        # 30,000+ color database
```

## Future Enhancements

- Share results (copy to clipboard)
- Multiple difficulty modes (fewer/more colors)
- Hints system (show similar colors)
- Theme customization
- Mobile app version
- Multiplayer mode
