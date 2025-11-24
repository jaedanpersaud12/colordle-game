# Supabase Configuration for Account Linking

## Google OAuth Account Linking

To enable automatic account linking when a user signs in with Google but already has an account with that email via email/password:

### 1. Enable Account Linking in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **Authentication** > **Providers**
4. Click on **Google** provider
5. Scroll down to **Advanced Settings**
6. Enable **"Link account if email already exists"**
7. Click **Save**

### 2. Update Redirect URLs

Make sure these URLs are added to your **Redirect URLs** list in **Authentication** > **URL Configuration**:

```
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
https://your-production-domain.vercel.app/auth/callback
```

### 3. How It Works

**New User Flow:**
1. User clicks "Continue with Google"
2. Authenticates with Google
3. Redirects to `/auth/callback` (shows loading)
4. Middleware checks if user exists in database
5. If no database record → redirects to `/onboarding`
6. If onboarding complete → redirects to `/` (home)

**Existing User Flow (Email/Password):**
1. User clicks "Continue with Google"
2. Authenticates with Google
3. **Supabase automatically links accounts** (same email)
4. Redirects to `/auth/callback` (shows loading)
5. Middleware sees user has completed onboarding
6. Redirects to `/` (home)

**Existing User Flow (Previously used Google):**
1. User clicks "Continue with Google"
2. Authenticates with Google
3. Redirects to `/auth/callback` (shows loading)
4. Middleware sees user has completed onboarding
5. Redirects to `/` (home)

### 4. Security Notes

- Account linking only works if the email is verified
- The first authentication method is considered the "primary" identity
- Users can see all linked identities in Supabase Auth
- Both password and Google auth work for the same account after linking
