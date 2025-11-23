# Colordle Setup Guide

## What Has Been Built

Your Colordle game now includes a complete production-ready backend:

✅ **Supabase Authentication** - Email/password auth with session management
✅ **PostgreSQL Database** - With Drizzle ORM for type-safe queries
✅ **tRPC API** - Type-safe backend endpoints
✅ **Daily Color System** - Deterministic color selection (same for all users daily)
✅ **Score Tracking** - User game history and statistics
✅ **Middleware** - Automatic auth session refresh

## Next Steps to Deploy

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in:
   - **Name**: colordle-game
   - **Database Password**: (save this!)
   - **Region**: Choose closest to your users
4. Wait 2-3 minutes for provisioning

### 2. Get Supabase Credentials

Once your project is ready:

1. Go to **Project Settings** > **API**
2. Copy:
   - `URL` (starts with https://xxx.supabase.co)
   - `anon/public` key (long string)

3. Go to **Project Settings** > **Database** > **Connection Pooling**
4. Copy the **Connection string** in "Transaction" mode:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
5. Replace `[password]` with your database password

### 3. Add Environment Variables

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 4. Push Database Schema

```bash
pnpm db:push
```

This creates three tables:
- `users` - User accounts (synced with Supabase Auth)
- `game_scores` - Daily game results
- `daily_colors` - Daily color challenges

### 5. Test Locally

```bash
pnpm dev
```

Visit http://localhost:3000 and try:
1. Playing the game without signing in (works locally)
2. Click sign in → create account → play again (saves to database)
3. Check your Supabase dashboard to see the data

### 6. Deploy to Vercel

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/colordle-game.git
   git push -u origin main
   ```

2. Go to https://vercel.com
3. Click "New Project" → Import your GitHub repo
4. Add environment variables (same as `.env.local`)
5. Deploy!

### 7. Configure Supabase Redirects

After deploying to Vercel:

1. Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**
2. Add your Vercel URL to **Site URL**: `https://your-app.vercel.app`
3. Add to **Redirect URLs**: `https://your-app.vercel.app/**`

## Architecture Overview

### Daily Color System

```
User opens app
  ↓
tRPC calls game.getDailyColor
  ↓
Backend checks daily_colors table for today's date
  ↓
If exists → return color
If not → generate deterministic color from date seed → store → return
```

**Key**: All users get the same color because the seed is based on the date string, not randomness.

### Score Submission Flow

```
User completes game (win or give up)
  ↓
If signed in:
  ↓
  tRPC calls game.submitScore
  ↓
  Backend checks if user already played today
  ↓
  If not → save score to database
  If yes → return "already submitted"
```

### Authentication Flow

```
User clicks sign in
  ↓
AuthModal opens with Supabase UI
  ↓
User signs up/signs in
  ↓
Supabase creates auth session (stored in cookies)
  ↓
Middleware refreshes session on each request
  ↓
tRPC context includes user (from session)
  ↓
Protected endpoints can access ctx.user
```

## Integrating Game State with Database

To complete the integration, you need to update `app/page.tsx` to:

1. Call `trpc.game.getDailyColor.useQuery()` instead of local state
2. Call `trpc.game.submitScore.useMutation()` when game completes
3. Show auth modal if user isn't signed in
4. Display user stats using `trpc.game.getUserStats.useQuery()`

Example integration:

```tsx
"use client";

import { trpc } from "@/lib/trpc/client";
import { AuthModal } from "@/components/AuthModal";
import { useState } from "react";

export default function Home() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Get daily color from backend
  const { data: dailyColor } = trpc.game.getDailyColor.useQuery();

  // Submit score mutation
  const submitScore = trpc.game.submitScore.useMutation();

  // Get user stats
  const { data: stats } = trpc.game.getUserStats.useQuery();

  const handleGameComplete = async (attempts: number, won: boolean) => {
    if (!dailyColor) return;

    try {
      await submitScore.mutateAsync({
        gameDate: dailyColor.gameDate,
        colorName: dailyColor.colorName,
        colorHex: dailyColor.colorHex,
        attempts,
        won,
      });
    } catch (error) {
      // If user not signed in, show auth modal
      setShowAuthModal(true);
    }
  };

  // ... rest of component
}
```

## Testing the Backend

### 1. Test tRPC Endpoints

You can test endpoints directly in the browser console:

```javascript
// Open http://localhost:3000
// Open browser console

// Get daily color
fetch('/api/trpc/game.getDailyColor')
  .then(r => r.json())
  .then(console.log)

// Submit score (requires auth)
fetch('/api/trpc/game.submitScore', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gameDate: '2025-11-23',
    colorName: 'Beaded Blue',
    colorHex: '#494d8b',
    attempts: 5,
    won: true
  })
}).then(r => r.json()).then(console.log)
```

### 2. Test Database

```bash
# Open Drizzle Studio
pnpm db:studio
```

This opens a visual database editor at http://localhost:4983

### 3. Test Auth

1. Open app
2. Sign up with test email
3. Check Supabase dashboard:
   - **Authentication** > **Users** → should see new user
   - **Table Editor** > **users** → should see user record

## Troubleshooting

### "Database connection failed"
- Check DATABASE_URL is correct
- Verify password has no special URL characters (if it does, URL-encode it)
- Ensure you're using the **pooler** connection string

### "Unauthorized" on tRPC calls
- Check middleware.ts is running (should see console logs)
- Verify Supabase keys are correct
- Clear cookies and sign in again

### Daily color not updating
- The color changes at midnight local device time
- Check `daily_colors` table to see stored colors
- Seed is deterministic - same date = same color always

### Migrations not applying
- Use `pnpm db:push` for development (faster)
- Use `pnpm db:generate` + `pnpm db:migrate` for production

## Production Checklist

Before going live:

- [ ] Supabase project created
- [ ] Environment variables set in Vercel
- [ ] Database schema pushed
- [ ] Site URL configured in Supabase
- [ ] Email templates customized (Supabase > Auth > Email Templates)
- [ ] Rate limiting enabled (Supabase > Auth > Rate Limits)
- [ ] Custom domain added (optional)
- [ ] Analytics added (optional)

## Support

If you run into issues:
1. Check the Supabase logs (Dashboard > Logs)
2. Check Vercel logs (Vercel Dashboard > Functions tab)
3. Check browser console for errors
4. Verify environment variables are set correctly

Good luck! 🎨
