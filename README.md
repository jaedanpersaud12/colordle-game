# Colordle - Daily Color Guessing Game

A clean, retro-style daily color guessing game built with Next.js, Supabase, tRPC, and Drizzle ORM.

## Features

- 🎨 Daily color challenge (same color for all users each day)
- 🔐 Supabase authentication
- 📊 Score tracking and statistics
- 🎯 Real-time similarity feedback
- 🌙 Dark mode support
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **API**: tRPC
- **Styling**: Tailwind CSS 4
- **UI Components**: React Aria Components

## Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (or Supabase project)
- Supabase account

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be provisioned
3. Get your project URL and anon key from Project Settings > API

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (use Supabase connection string with pooler)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Note**: For the DATABASE_URL, use the connection pooler URL from Supabase (Project Settings > Database > Connection Pooling). This is important for serverless deployments.

### 4. Push Database Schema

```bash
pnpm db:push
```

This will create all necessary tables in your database:
- `users` - User accounts
- `game_scores` - Daily game scores
- `daily_colors` - Daily color challenges

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## Database Scripts

- `pnpm db:generate` - Generate migration files
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio to view/edit data

## How It Works

### Daily Color System

The game uses a deterministic algorithm to select the same color for all users on a given day:

1. The current date (YYYY-MM-DD) is converted to a numeric seed
2. This seed selects a color from the 30,000+ color database
3. The color is stored in the `daily_colors` table
4. All users see the same color for that day, regardless of timezone

### Authentication Flow

1. Users can play without signing in (local state only)
2. Signing in saves scores to the database
3. Users are automatically created in the database upon first sign-in
4. Middleware handles session refresh

### Score Tracking

- Scores are saved per user per day
- Users cannot submit multiple scores for the same day
- Stats include: total games, wins, win rate, average attempts, current streak

## Project Structure

```
colordle-game/
├── app/                    # Next.js app router
│   ├── api/trpc/          # tRPC API endpoints
│   ├── page.tsx           # Main game page
│   └── layout.tsx         # Root layout with providers
├── components/            # React components
│   ├── ui/               # UI primitives (buttons, modals, etc)
│   ├── AuthModal.tsx     # Authentication modal
│   ├── ColorInput.tsx    # Color search and selection
│   └── GuessHistory.tsx  # Game guess history display
├── lib/                  # Utilities and shared code
│   ├── db/              # Database schema and client
│   ├── supabase/        # Supabase client utilities
│   ├── trpc/            # tRPC client setup
│   ├── colors.ts        # Color data and utilities
│   ├── daily-color.ts   # Daily color algorithm
│   └── game.ts          # Game state management
├── server/              # Server-side code
│   └── trpc/           # tRPC routers and procedures
├── drizzle.config.ts    # Drizzle ORM configuration
└── middleware.ts        # Auth session refresh middleware
```

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

**Important**: Make sure to use the Supabase connection pooler URL for DATABASE_URL in production.

### Environment Variables for Production

Set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL` (use pooler connection string)

## Development Tips

- Use `pnpm db:studio` to visually inspect and edit database data
- Check the tRPC API at `/api/trpc` (when dev server is running)
- Auth state is managed by Supabase and synced via middleware

## License

MIT
