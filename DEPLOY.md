# SmashIt — Vercel Deployment Guide

---

## 1. Prerequisites

- [Vercel account](https://vercel.com) (free tier works)
- Your code pushed to a GitHub / GitLab / Bitbucket repository
- Supabase project already running (you have one)

---

## 2. Environment Variables

You need to add these in Vercel **before** the first deploy.

Go to: **Vercel Dashboard → Project → Settings → Environment Variables**

| Variable | Where to find it | Notes |
|---|---|---|
| `DATABASE_URL` | Supabase → Project Settings → Database → Connection string → **Transaction pooler** (port 6543) | Add `?pgbouncer=true` at the end |
| `DIRECT_URL` | Supabase → Project Settings → Database → Connection string → **Session pooler** or **Direct connection** (port 5432) | Used by Prisma migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | Starts with `https://` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | Long JWT string |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key | Keep this secret — never expose client-side |
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console → Credentials → Your OAuth client | |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Same OAuth client | |

### Recommended DATABASE_URL format for Vercel (serverless)

```
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Use the **Transaction pooler** (port 6543 + `?pgbouncer=true`) for `DATABASE_URL` — this is optimized for serverless cold starts. Use the **Session pooler** (port 5432, no pgbouncer flag) for `DIRECT_URL`.

> Both pooler URLs are on the **Supabase → Project Settings → Database → Connection pooling** page.

---

## 3. Prisma — Build Command

Vercel runs `next build` by default. Prisma needs its client generated before the build.

In Vercel: **Project → Settings → Build & Output Settings → Build Command**, set:

```
prisma generate && next build
```

Or add a `postinstall` script in `package.json` so it runs automatically:

```json
"scripts": {
  "postinstall": "prisma generate",
  "build": "next build"
}
```

> You do **not** need to run `prisma migrate` on every deploy — your schema is already applied to the Supabase database. Only run migrations when you change the schema.

---

## 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Vercel auto-detects Next.js — no framework config needed
4. Add all environment variables from Section 2
5. Set build command to `prisma generate && next build` (or use postinstall)
6. Click **Deploy**

After the first successful deploy, Vercel gives you a production URL like:
```
https://smashit-xyz.vercel.app
```

---

## 5. Supabase — Auth Callback URL (Required)

After you have your Vercel URL, you must whitelist it in Supabase **and** Google OAuth.

### 5a. Supabase Auth Settings

Go to: **Supabase → Authentication → URL Configuration**

| Field | Value |
|---|---|
| **Site URL** | `https://your-app.vercel.app` |
| **Redirect URLs** | `https://your-app.vercel.app/api/auth/callback` |

Add both your production URL and any preview deployment patterns:
```
https://your-app.vercel.app/api/auth/callback
https://smashit-*.vercel.app/api/auth/callback
```

### 5b. Google OAuth — Authorized Redirect URIs

Go to: **Google Cloud Console → APIs & Services → Credentials → Your OAuth 2.0 Client**

Under **Authorized redirect URIs**, add:
```
https://your-app.vercel.app/api/auth/callback
```

Also add the Supabase redirect URI (required for Supabase's Google OAuth flow):
```
https://<your-supabase-ref>.supabase.co/auth/v1/callback
```

> The Supabase ref is the part of your project URL before `.supabase.co` — e.g. `eomdaolokoucfpsgbthe`.

---

## 6. Supabase — Row Level Security (RLS)

If you have RLS enabled on any tables, ensure your service role key is used for server-side operations (it bypasses RLS). The app already uses `SUPABASE_SERVICE_ROLE_KEY` for server actions — this is correct.

---

## 7. Custom Domain (Optional)

In Vercel: **Project → Settings → Domains → Add Domain**

After adding, update:
- Supabase Site URL → your custom domain
- Supabase Redirect URLs → `https://yourdomain.com/api/auth/callback`
- Google OAuth Authorized redirect URIs → `https://yourdomain.com/api/auth/callback`

---

## 8. Checklist Before Going Live

- [ ] All 7 environment variables added in Vercel
- [ ] Build command includes `prisma generate`
- [ ] Supabase Site URL updated to production URL
- [ ] Supabase Redirect URL includes `/api/auth/callback`
- [ ] Google OAuth redirect URI updated to production URL
- [ ] Google OAuth redirect URI includes the Supabase callback URL
- [ ] Test login with email/password
- [ ] Test login with Google
- [ ] Test creating a tournament end-to-end

---

## 9. Subsequent Deploys

Every `git push` to your main branch auto-deploys via Vercel. No manual steps needed unless you change the database schema.

### If you change `prisma/schema.prisma`:

```bash
# Run locally against your Supabase DB
npx prisma migrate deploy

# Then push code — Vercel rebuild picks up the new schema via prisma generate
git push
```
