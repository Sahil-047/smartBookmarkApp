Smart Bookmark App

A simple real-time bookmark manager built with Next.js 15, Supabase, Tailwind, and TypeScript.
Built as a 72-hour assessment project.

Features

Google OAuth authentication (no email/password)
Private bookmarks per user (RLS secured)
Add & delete bookmarks
Real-time sync across multiple tabs
Clean Tailwind UI
Deployed on Vercel

Tech Stack

Next.js 15 (App Router)
Supabase (Auth, DB, Realtime)
Tailwind CSS
TypeScript

Project Structure
app/
  auth/callback/route.ts
  login/page.tsx
  page.tsx
  layout.tsx

components/
  AddBookmarkForm.tsx
  BookmarkItem.tsx
  BookmarksList.tsx
  GoogleSignInButton.tsx
  Header.tsx

lib/supabase/
  client.ts
  server.ts
  middleware.ts

types/
  database.types.ts

middleware.ts
supabase-setup.sql


Setup
1. Installation
a. git clone <repo-url>
b. cd smart-bookmark-app
c. npm install

2. Supabase Setup

a. Create a new project at supabase.com
b. Copy: Project URL
c. Anon/Public key
d. Add to .env.local:

NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

3. Database Setup

a. Open SQL Editor in Supabase
b. Paste contents of supabase-setup.sql
c. Run it

This:
-- Smart Bookmark App - Database Schema and RLS Policies
-- Run this in your Supabase SQL Editor to set up the database

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON bookmarks(created_at DESC);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable Realtime for the bookmarks table
-- This allows the app to receive real-time updates when bookmarks change
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;


Creates bookmarks table
Enables Row Level Security
Adds RLS policies
Enables Realtime

4. Enable Realtime (Important)

Go to Database > Replication

Toggle ON for bookmarks

5. Google OAuth Setup

In Supabase:

Authentication > Providers > Enable Google

In Google Cloud:

Create OAuth 2.0 Client ID

Add redirect URI:

https://<project-ref>.supabase.co/auth/v1/callback


Paste Client ID + Secret in Supabase.

For local:
Add http://localhost:3000 as an authorized domain.

6. Run
npm run dev

7. Deploy (Vercel)

Push to GitHub

Import to Vercel

Add env variables

Update:

Google OAuth redirect URIs

Supabase Site URL

Supabase Redirect URLs

How It Works
Authentication Flow

User clicks Google sign-in

Google redirects to /auth/callback

exchangeCodeForSession(code) creates session

User redirected to home

Real-time Sync
supabase
  .channel('bookmarks-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${userId}`,
  }, handleUpdate)
  .subscribe()


Changes in one tab instantly reflect in others.

Row Level Security

Users can only:

SELECT their own bookmarks

INSERT with their own user_id

DELETE their own data

RLS blocks unauthorized access at DB level.

Problems & Fixes

OAuth redirect loop
→ Used exchangeCodeForSession(code) instead of getSession().

Realtime not working
→ Enabled replication + added:

ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;


Users saw others’ bookmarks
→ Enabled RLS:

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;


Session expired
→ Added middleware calling supabase.auth.getUser() to refresh.

TypeScript errors (Next 15)
→ Used await cookies() and @supabase/ssr.

Design Decisions

App Router for modern Next.js patterns

No heavy state management (small app)

Supabase handles cross-tab sync

Clear naming, simple logic, minimal abstraction

Testing Checklist

Google login works

Add bookmark works

Realtime works in multiple tabs

Delete syncs instantly

Different users cannot see each other’s data

Future Improvements

Search & filter

Tags / folders

Edit bookmarks

Import / export

Chrome extension

Screenshot previews

