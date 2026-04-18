# Smash — Setup Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.local` and fill in your Supabase credentials:

```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"
```

> **DATABASE_URL** uses the pooler (port 6543) for runtime.
> **DIRECT_URL** uses the direct connection (port 5432) for migrations.

### 3. Configure Supabase Auth

In your Supabase dashboard:

1. Go to **Authentication → Providers**
2. Enable **Google** OAuth (add Client ID + Secret from Google Cloud Console)
3. Enable **Email** provider
4. Under **URL Configuration**, add:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/api/auth/callback`

### 4. Run database migration

```bash
npx prisma migrate dev --name init
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local` in Vercel project settings
4. Add your Vercel domain to Supabase Auth redirect URLs
5. Deploy

The `vercel.json` already configures `prisma generate` to run before build.

---

## Database Schema

The schema lives in `prisma/schema.prisma`. After any schema change:

```bash
npx prisma migrate dev --name describe_change
npx prisma generate
```

---

## Tech Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Backend     | Next.js Route Handlers                             |
| Database    | Supabase Postgres                                  |
| ORM         | Prisma v5                                          |
| Auth        | Supabase Auth (Google OAuth + email/password)      |
| Drag & Drop | @dnd-kit                                           |
| Charts      | Recharts                                           |
| Deployment  | Vercel                                             |
