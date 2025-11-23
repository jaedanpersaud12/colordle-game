# Onboarding Flow Documentation

## Overview

After email verification, users are redirected to `/onboarding` where they complete their profile by choosing a username and profile color.

## User Flow

1. **Sign Up**
   - User clicks "Sign In" button in header
   - Enters email and password in auth modal
   - Receives verification email

2. **Email Verification**
   - User clicks verification link in email
   - Supabase verifies email
   - User is redirected to `/onboarding`

3. **Onboarding**
   - User enters a username (3-20 characters, alphanumeric + underscores)
   - User selects a profile color from 10 preset colors
   - Clicks "Continue to Game"
   - Data is saved to database
   - User is redirected to main game

4. **Post-Onboarding**
   - Middleware checks `onboardingComplete` flag
   - If false, redirects to `/onboarding`
   - If true, allows access to all pages
   - User's profile color shows in header icon
   - Username displays in dropdown menu

## Database Schema Changes

### Users Table

```typescript
{
  id: uuid (primary key)
  email: text (unique)
  username: text (unique, nullable)           // NEW
  profileColor: text (nullable)                // NEW
  onboardingComplete: boolean (default false)  // NEW
  createdAt: timestamp
}
```

## API Endpoints

### `auth.completeOnboarding`

**Type**: Protected Mutation

**Input**:
```typescript
{
  username: string (3-20 chars, alphanumeric + underscores)
  profileColor: string (hex color format #RRGGBB)
}
```

**Validation**:
- Username must be unique
- Username must match regex: `/^[a-zA-Z0-9_]+$/`
- Color must be valid hex: `/^#[0-9A-Fa-f]{6}$/`

**Output**:
```typescript
{
  id: string
  email: string
  username: string
  profileColor: string
  onboardingComplete: true
  createdAt: Date
}
```

**Errors**:
- "Username is already taken"
- "Username must be at least 3 characters"
- "Username must be at most 20 characters"
- "Username can only contain letters, numbers, and underscores"
- "Invalid hex color"

## Middleware Logic

```typescript
// For every request (except API and static files):
1. Get authenticated user from Supabase
2. If no user → continue
3. If user on /onboarding → continue
4. If user on other page:
   a. Check database for user record
   b. If onboardingComplete = false → redirect to /onboarding
   c. If onboardingComplete = true → continue
```

## Components

### `/app/onboarding/page.tsx`

**Features**:
- Username input with real-time validation
- 10 preset profile colors in a grid
- Visual feedback for selected color (border + scale)
- Error messages for validation failures
- Loading states
- Auto-redirect if onboarding already complete

**Color Palette**:
```typescript
const PROFILE_COLORS = [
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#A855F7", // Purple
];
```

### `components/UserMenu.tsx`

**Updated Features**:
- Shows profile color as icon background when set
- Displays `@username` in dropdown
- Email shown as secondary text
- Falls back to user icon if no color set

## Configuration Files

### `components/AuthModal.tsx`

**Change**:
```typescript
// Before
redirectTo={`${window.location.origin}/`}

// After
redirectTo={`${window.location.origin}/onboarding`}
```

### `middleware.ts`

**Added**:
- Database connection to check onboarding status
- Redirect logic for incomplete onboarding
- Excludes `/onboarding` and `/api/*` from checks

## Migration Steps

To apply these changes to an existing project:

1. **Update Database Schema**:
   ```bash
   pnpm db:push
   ```

2. **Existing Users**:
   - Will have `onboardingComplete = false`
   - Will be redirected to `/onboarding` on next login
   - Must complete onboarding to access the game

3. **New Users**:
   - Created with `onboardingComplete = false`
   - Redirected to `/onboarding` after email verification
   - Must complete before accessing the game

## Testing Checklist

- [ ] Sign up with new account
- [ ] Verify email and check redirect to `/onboarding`
- [ ] Try invalid usernames (too short, special chars, etc.)
- [ ] Try duplicate username
- [ ] Complete onboarding successfully
- [ ] Check username shows in header dropdown
- [ ] Check profile color shows in header icon
- [ ] Sign out and sign back in
- [ ] Verify no redirect to `/onboarding` (already complete)
- [ ] Try accessing `/` without completing onboarding
- [ ] Verify middleware redirects to `/onboarding`

## Design Decisions

### Why Preset Colors?

- Consistent brand aesthetic
- Prevents inappropriate color choices
- Faster user decision-making
- Better visual hierarchy in future features (leaderboards, etc.)

### Why Require Onboarding?

- Better user experience with personalization
- Prevents anonymous accounts with no identity
- Enables future social features (leaderboards, sharing)
- Collects minimal but meaningful profile data

### Why Username + Color?

- Username: Human-readable identity
- Color: Quick visual identification
- Together: Unique, memorable player identity
- Future-proof: Can add avatars/badges later

## Future Enhancements

Potential additions to onboarding:

- [ ] Avatar upload
- [ ] Bio/description field
- [ ] Notification preferences
- [ ] Tutorial/how-to-play
- [ ] Social connections
- [ ] Custom color picker (advanced mode)
- [ ] Username suggestions if taken
- [ ] Profile preview
