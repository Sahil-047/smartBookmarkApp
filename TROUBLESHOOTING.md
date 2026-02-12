# Troubleshooting Guide

Common issues and their solutions for the Smart Bookmark App.

## Authentication Issues

### Error: "Unsupported provider: provider is not enabled"

**Symptom**: When clicking "Sign in with Google", you see:
```json
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

**Cause**: Google OAuth provider is not enabled in Supabase.

**Solution**:

#### Quick Fix (For Local Testing)

1. **Go to Supabase Dashboard**
   - Navigate to your project at https://supabase.com/dashboard
   - Select your project

2. **Enable Google Provider**
   - Go to **Authentication** > **Providers**
   - Scroll down to find **Google**
   - Toggle it **ON** (enable it)
   - Click **Save**

3. **For Quick Testing (Optional - Not Secure for Production)**
   - You can temporarily use Supabase's default OAuth credentials
   - This allows you to test locally without setting up Google Cloud
   - ⚠️ **WARNING**: Only for development! Set up proper credentials before deploying

#### Complete Fix (For Production)

1. **Create Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Click "Select a project" > "New Project"
   - Enter project name: "Smart Bookmark App"
   - Click **Create**

2. **Configure OAuth Consent Screen**
   - In Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
   - Select **External** user type
   - Click **Create**
   - Fill in required fields:
     - App name: "Smart Bookmark App"
     - User support email: your email
     - Developer contact: your email
   - Click **Save and Continue**
   - Scopes: Click **Add or Remove Scopes**
     - Add: `userinfo.email`
     - Add: `userinfo.profile`
   - Click **Save and Continue**
   - Add test users (your Google accounts for testing)
   - Click **Save and Continue**

3. **Create OAuth 2.0 Credentials**
   - Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Name: "Smart Bookmark App"
   - **Authorized redirect URIs** - Add these URLs:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - To find YOUR-PROJECT-REF:
     - Go to Supabase > Project Settings > API
     - Your URL looks like: `https://abcdefghijk.supabase.co`
     - The project ref is: `abcdefghijk`
   - Click **Create**
   - **Copy the Client ID and Client Secret** (you'll need these next)

4. **Configure Supabase with Google Credentials**
   - In Supabase Dashboard: **Authentication** > **Providers**
   - Find **Google** and click to expand
   - Enable it (toggle ON)
   - Paste your **Client ID** (from step 3)
   - Paste your **Client Secret** (from step 3)
   - Click **Save**

5. **Test the Login**
   - Restart your dev server: `npm run dev`
   - Go to http://localhost:3000
   - Click "Sign in with Google"
   - Should redirect to Google login
   - Authorize the app
   - Should redirect back and log you in

**Still not working?**
- Clear browser cookies and cache
- Try in incognito/private window
- Check Supabase logs: Dashboard > Logs

---

## Realtime Issues

### Bookmarks don't update across tabs

**Symptom**: Adding a bookmark in one tab doesn't show in another tab without refresh.

**Solution**:

1. **Enable Realtime in Supabase**
   - Go to Supabase Dashboard
   - Navigate to **Database** > **Replication**
   - Find the `bookmarks` table
   - Toggle it **ON** (must show green checkmark)
   - Wait a few seconds for it to activate

2. **Verify the SQL Publication**
   - Go to **SQL Editor**
   - Run this query to check:
   ```sql
   SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
   ```
   - You should see `bookmarks` in the results
   - If not, run:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
   ```

3. **Check Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Look for WebSocket connection errors
   - Should see "Realtime update: ..." when changes happen

**Still not working?**
- Refresh all tabs
- Sign out and sign in again
- Check if you're subscribed to the right user_id

---

## Database/RLS Issues

### Error: "Failed to add bookmark"

**Symptom**: Bookmark form shows error, bookmark not added.

**Causes & Solutions**:

1. **RLS Not Enabled**
   - Go to Supabase > **SQL Editor**
   - Run:
   ```sql
   ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
   ```

2. **Missing RLS Policies**
   - Copy all contents from `supabase-setup.sql`
   - Paste in SQL Editor and run
   - This creates all necessary policies

3. **Check Supabase Logs**
   - Dashboard > **Logs** > **Database**
   - Look for SQL errors
   - Common issue: foreign key constraint (user doesn't exist in auth.users)

### Can see other users' bookmarks (privacy issue!)

**This is critical! Fix immediately:**

1. **Enable RLS**
   ```sql
   ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
   ```

2. **Add Policies**
   - Run the complete `supabase-setup.sql` file
   - Verify policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
   ```
   - Should see 4 policies (SELECT, INSERT, UPDATE, DELETE)

3. **Test Privacy**
   - Log in as User A in one browser
   - Log in as User B in another browser (different Google account)
   - Add bookmarks as each user
   - Verify each user only sees their own bookmarks

---

## Build/Deployment Issues

### Build fails on Vercel

**Symptom**: Deployment fails with TypeScript errors.

**Solution**:

1. **Test build locally first**
   ```bash
   npm run build
   ```
   - Fix any TypeScript errors shown
   - Ensure build completes successfully

2. **Check Environment Variables**
   - In Vercel project settings
   - Ensure these are set:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - No typos in variable names
   - Values should NOT have quotes around them

3. **Redeploy**
   - After fixing, commit and push
   - Vercel auto-deploys on push
   - Or manually trigger: Vercel Dashboard > Deployments > Redeploy

### OAuth works locally but not in production

**Symptom**: Google login works on localhost but fails on Vercel.

**Solution**:

1. **Update Google Cloud OAuth Settings**
   - Go to Google Cloud Console > Credentials
   - Edit your OAuth 2.0 Client ID
   - Add your production URL to **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/auth/callback
   ```
   - Save

2. **Update Supabase Auth Settings**
   - Supabase Dashboard > **Authentication** > **URL Configuration**
   - Set **Site URL**: `https://your-app.vercel.app`
   - Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://your-app.vercel.app/auth/callback
   ```
   - Save

3. **Test Production**
   - Visit your Vercel URL
   - Try Google login
   - Should work now

---

## Session/Cookie Issues

### Getting logged out frequently

**Symptom**: Session expires after an hour or on page refresh.

**Solution**:

1. **Check Middleware**
   - Ensure `middleware.ts` exists at project root
   - Should call `updateSession(request)`
   - This refreshes the session on every request

2. **Check Cookies**
   - Open DevTools > Application > Cookies
   - Should see Supabase auth cookies
   - If not, clear all cookies and sign in again

3. **Check Supabase JWT Expiry**
   - Supabase Dashboard > **Authentication** > **Settings**
   - JWT Expiry: default is 3600 seconds (1 hour)
   - Can increase if needed (up to 604800 = 1 week)

### "Invalid JWT" error

**Symptom**: API calls fail with JWT validation error.

**Solution**:
1. Sign out completely
2. Clear browser cookies
3. Sign in again
4. If persists, check that your Supabase URL and key are correct in `.env.local`

---

## Development Issues

### Hot reload not working

**Solution**:
```bash
# Kill dev server
# Clear Next.js cache
rm -rf .next

# Restart
npm run dev
```

### Port 3000 already in use

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### "Module not found" errors

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Common Questions

### Q: Why do I need to set up Google OAuth?

**A**: This app uses Google as the only authentication method (no email/password). It's more secure and users don't need to remember another password.

### Q: Can I add email/password authentication?

**A**: Yes, but you'll need to:
1. Enable email provider in Supabase
2. Create signup/login forms
3. Handle email verification
4. Update the UI to show both options

### Q: How do I view the database directly?

**A**: 
- Supabase Dashboard > **Table Editor**
- Select `bookmarks` table
- View/edit data directly (useful for debugging)

### Q: How can I test with multiple users?

**A**:
- Use different browsers (Chrome, Firefox, Edge)
- Or use incognito/private windows
- Log in with different Google accounts
- Test that users can't see each other's bookmarks

### Q: Is my data secure?

**A**: Yes:
- Google OAuth handles authentication
- Passwords never stored (Google manages them)
- Row Level Security prevents data leaks
- Supabase uses industry-standard encryption
- HTTPS in production (Vercel provides SSL)

---

## Getting Help

1. **Check Browser Console**
   - Press F12
   - Look for error messages
   - Often shows exactly what's wrong

2. **Check Supabase Logs**
   - Dashboard > Logs
   - View API, Database, and Auth logs
   - Filter by error level

3. **Enable Verbose Logging**
   ```typescript
   // Add to lib/supabase/client.ts for debugging
   const supabase = createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     {
       auth: {
         debug: true // Shows auth logs in console
       }
     }
   )
   ```

4. **Common Debugging Steps**
   ```bash
   # 1. Clear everything
   rm -rf .next node_modules package-lock.json
   
   # 2. Fresh install
   npm install
   
   # 3. Check env vars
   cat .env.local
   
   # 4. Rebuild
   npm run build
   
   # 5. Test
   npm run dev
   ```

---

## Still Stuck?

If none of these solutions work:

1. **Create an Issue**
   - Include error message (exact text)
   - Include steps to reproduce
   - Include browser/OS info
   - Include screenshots if relevant

2. **Check Documentation**
   - [Supabase Docs](https://supabase.com/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)

3. **Community Help**
   - Supabase Discord
   - Next.js Discord
   - Stack Overflow

---

**Remember**: Most issues are configuration problems, not code bugs. Double-check all settings before diving into code changes.
