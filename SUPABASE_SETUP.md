# 🗄️ Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/Login with GitHub
4. Click "New Project"
5. Choose your organization
6. Fill in:
   - **Name**: `TheraJournal`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

## Step 2: Get Your Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" (or press Ctrl+Enter)

**✅ Expected Result**: You should see "Success. No rows returned" - this means the schema was created successfully!

## Step 4: Configure Authentication

1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your app URL:
   - For development: `http://localhost:5173`
   - For production: `https://your-domain.com`
3. Under **Redirect URLs**, add:
   - `http://localhost:5173/**` (for development)
   - `https://your-domain.com/**` (for production)

## Step 5: Update Your .env File

Create a `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Provider (optional - defaults to Groq)
VITE_AI_PROVIDER=groq
```

## Step 6: Test Your Setup

1. Run your app: `npm run dev`
2. Try to sign up with a test email
3. Check your Supabase dashboard → **Authentication** → **Users** to see if the user was created
4. Check **Table Editor** → **users** to see if the profile was created

## 🔧 Troubleshooting

### "Permission denied" Error
- ✅ **Fixed**: The schema file no longer contains the problematic `ALTER DATABASE` command
- The JWT secret is automatically managed by Supabase

### "Table doesn't exist" Error
- Make sure you ran the entire `supabase-schema.sql` file
- Check that all tables were created in **Table Editor**

### "RLS Policy" Error
- The schema includes Row Level Security policies
- These ensure users can only access their own data
- This is working correctly if you see the error

### Authentication Issues
- Check that your Site URL and Redirect URLs are configured correctly
- Make sure your `.env` file has the correct Supabase URL and key

## 🎯 What Gets Created

The schema creates these tables:
- **users**: User profiles (linked to Supabase auth)
- **entries**: Journal entries (encrypted)
- **conversations**: Chat conversations
- **messages**: Chat messages (encrypted)

Plus:
- **Indexes** for fast queries
- **RLS Policies** for security
- **Triggers** for automatic user profile creation
- **Functions** for timestamp updates

## 🚀 Next Steps

Once Supabase is set up:
1. Your app will have full authentication
2. All data will be encrypted and secure
3. Users can create journal entries and chat with AI
4. Everything syncs automatically

**You're ready to go!** 🎉
