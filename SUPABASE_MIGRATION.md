# Vercel + Supabase Setup

This repository is now structured as a Next.js app for Vercel.

## Required environment variables

Use one of these database setups:

### Option A: full connection string

```env
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
```

### Option B: split database variables

```env
SUPABASE_DB_HOST=db.project-ref.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_NAME=postgres
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your-db-password
SUPABASE_DB_SSLMODE=require
```

Always set:

```env
SESSION_SECRET=replace-with-a-long-random-string
GROQ_API_KEY=your-groq-key-if-you-still-use-it
```

## Supabase steps

1. Create a Supabase project.
2. Open the SQL editor.
3. Run [supabase/schema.sql](C:\Users\Justin Mark\OneDrive\Desktop\aral monitoring system\supabase\schema.sql:1).
4. Import your data after the schema exists.

## Vercel steps

1. Push this repository to GitHub.
2. Import the repo into Vercel.
3. Framework should detect as `Next.js`.
4. Add the environment variables above in the Vercel project settings.
5. Deploy.

## Current ported flows

- landing page
- teacher login
- teacher registration
- teacher section setup
- teacher dashboard
- student creation
- attendance recording
- admin login
- admin dashboard
- teacher creation by admin
- announcements

## Current gaps

The old PHP-only modules were not fully ported yet:

- reading assessment workflow
- numeracy drill generator UI
- science pages
- intervention pages

The database schema for those modules is still present, so they can be added on top of this Next.js base.
