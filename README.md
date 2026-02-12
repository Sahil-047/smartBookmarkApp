# Smart Bookmark App

A simple, real-time bookmark manager built with Next.js, Supabase, and Tailwind CSS.

## Features

- ✅ Google OAuth authentication (no email/password)
- ✅ Add bookmarks with title and URL
- ✅ Private bookmarks per user (using Row Level Security)
- ✅ Real-time updates across multiple tabs
- ✅ Delete your own bookmarks
- ✅ Clean, minimal UI with Tailwind CSS
- ✅ Deployed on Vercel

## Tech Stack

- **Next.js 15** (App Router)
- **Supabase** (Authentication, Database, Realtime)
- **Tailwind CSS** (Styling)
- **TypeScript** (Type safety)

## Project Structure

```
├── app/
│   ├── auth/callback/route.ts    # OAuth callback handler
│   ├── login/page.tsx            # Login page
│   ├── page.tsx                  # Main bookmarks page
│   └── layout.tsx                # Root layout
├── components/
│   ├── AddBookmarkForm.tsx       # Form to add new bookmarks
│   ├── BookmarkItem.tsx          # Individual bookmark with delete
│   ├── BookmarksList.tsx         # List with realtime updates
│   ├── GoogleSignInButton.tsx    # Google OAuth button
│   └── Header.tsx                # Header with user info
├── lib/supabase/
│   ├── client.ts                 # Browser Supabase client
│   ├── server.ts                 # Server Supabase client
│   └── middleware.ts             # Session refresh logic
├── types/
│   └── database.types.ts         # Database type definitions
├── middleware.ts                 # Auth middleware
└── supabase-setup.sql            # Database schema & RLS policies
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish setting up (this takes 2-3 minutes)
3. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon/Public key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can also copy from the template:
```bash
cp env.template .env.local
```

### 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the sidebar
3. Create a new query
4. Copy the contents of `supabase-setup.sql` and paste it
5. Click **Run** to execute the SQL

This will:
- Create the `bookmarks` table
- Enable Row Level Security (RLS)
- Add RLS policies so users can only see their own bookmarks
- Enable Realtime for live updates

### 5. Enable Realtime (IMPORTANT!)

1. In Supabase dashboard, go to **Database > Replication**
2. Find the `bookmarks` table in the list
3. **Toggle it ON** to enable realtime updates
4. This allows changes to sync across multiple browser tabs

### 6. Configure Google OAuth

1. In Supabase dashboard, go to **Authentication > Providers**
2. Find **Google** and click to configure
3. Enable Google provider
4. You need to set up a Google Cloud project:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project (or use existing)
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - Choose **Web application**
   - Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Copy the Client ID and Client Secret
5. Paste Client ID and Secret in Supabase Google provider settings
6. Save the configuration

### 7. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

For local OAuth testing, you'll need to add `http://localhost:3000` as an authorized domain in Google Cloud Console.

### 8. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add environment variables in Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

After deployment:
- Update Google OAuth authorized redirect URIs to include your Vercel domain
- Update Supabase **Site URL** in Authentication settings to your Vercel URL
- Add your Vercel domain to **Redirect URLs** in Supabase Auth settings

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. After approval, Google redirects to `/auth/callback`
4. Callback exchanges the code for a Supabase session
5. User is redirected to the home page with active session

### Real-time Updates

The app uses Supabase Realtime to sync bookmarks across tabs:

```typescript
// Subscribe to changes for the current user's bookmarks
const channel = supabase
  .channel('bookmarks-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    // Update UI based on INSERT/UPDATE/DELETE events
  })
  .subscribe()
```

When you add or delete a bookmark in one tab, the realtime subscription fires in all other open tabs, keeping them in sync without page refresh.

### Row Level Security (RLS)

RLS policies ensure data privacy:

- Users can only SELECT their own bookmarks (`WHERE user_id = auth.uid()`)
- Users can only INSERT bookmarks with their own user_id
- Users can only DELETE their own bookmarks
- Even if someone tries to manipulate the API, Supabase blocks unauthorized access at the database level

## Problems Faced & Solutions

### Problem 1: OAuth Redirect Loop

**Issue:** After Google login, the app kept redirecting between `/auth/callback` and `/login`.

**Cause:** The callback wasn't properly exchanging the authorization code for a session.

**Solution:** Used `supabase.auth.exchangeCodeForSession(code)` instead of `getSession()`. The code exchange is essential for the OAuth flow to complete.

### Problem 2: Realtime Not Working

**Issue:** Changes in one tab weren't showing up in another tab.

**Cause 1:** Forgot to enable realtime for the `bookmarks` table in Supabase dashboard.

**Solution:** Go to Database > Replication and toggle ON for the `bookmarks` table.

**Cause 2:** The SQL publication wasn't set up.

**Solution:** Added `ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;` to the setup SQL.

### Problem 3: Users Could See Other Users' Bookmarks

**Issue:** During testing, realized RLS policies weren't working as expected.

**Cause:** Policies were created but RLS wasn't enabled on the table.

**Solution:** Added `ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;` before creating policies. RLS must be explicitly enabled - it's not automatic.

### Problem 4: Session Expiration

**Issue:** Users were getting logged out after 1 hour.

**Cause:** Supabase sessions expire and need to be refreshed.

**Solution:** Created middleware that runs on every request to refresh the session using `supabase.auth.getUser()`. This keeps users logged in as long as they're active.

### Problem 5: TypeScript Errors with Supabase SSR

**Issue:** Type errors when using `cookies()` in server components.

**Cause:** Next.js 15 changed `cookies()` to be async.

**Solution:** Updated to use `await cookies()` and used `@supabase/ssr` instead of `@supabase/auth-helpers-nextjs` which is deprecated.

## Development Notes

### Why App Router?

Used Next.js App Router (not Pages Router) because:
- It's the recommended approach for new Next.js projects
- Better support for Server Components and streaming
- Cleaner file-based routing
- Built-in loading and error states

### Why No Complex State Management?

Kept it simple with React's `useState` because:
- Small app doesn't need Redux/Zustand
- Supabase realtime handles cross-tab sync for us
- Server Components handle initial data fetching
- Component-level state is sufficient

### Code Style Choices

- Short, conversational comments explaining "why" not "what"
- Clear variable names (`handleSignIn`, not `doAuth`)
- No unnecessary abstractions (no custom hooks for single-use logic)
- Kept components focused on single responsibility
- Used TypeScript for safety but didn't over-type everything

## Testing the App

1. **Test OAuth:** Click "Sign in with Google" - should redirect and log you in
2. **Test Add:** Add a bookmark - should appear immediately
3. **Test Realtime:** Open in two tabs, add bookmark in one, should appear in both
4. **Test Delete:** Delete a bookmark - should remove from all tabs
5. **Test Privacy:** Log in with different Google accounts in different browsers - users shouldn't see each other's bookmarks

## Future Improvements

If I had more time, I'd add:
- Search/filter bookmarks
- Tags or categories
- Edit bookmark functionality
- Bookmark folders
- Import/export bookmarks
- Chrome extension
- Bookmark previews with screenshots

## License

MIT

---

Built as a 72-hour assessment project. Kept simple and practical on purpose.
