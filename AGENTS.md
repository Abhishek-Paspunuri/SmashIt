<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Prisma / Database Schema Changes

**CRITICAL — always follow this exact order when changing `prisma/schema.prisma`:**

1. Stop the dev server (it locks `query_engine-windows.dll.node` on Windows — `generate` fails while it runs)
2. Apply to database: `npm run db:push`  
   - This runs `prisma db push --skip-generate && prisma generate` together
3. Restart the dev server

**Why `prisma db push` alone is not enough:**  
`db push` syncs the database schema but the Prisma client (in `node_modules/.prisma/client/`) must also be regenerated. If `generate` is skipped or fails, the client queries for columns that don't exist — causing `P2022` runtime errors.

**Supabase connection note:**  
`DIRECT_URL` (port 5432) may be unreachable from local machines on some networks (firewall/VPN). If `db:push` fails with `P1001: Can't reach database server`, add the column manually via **Supabase Dashboard → SQL Editor**:
```sql
ALTER TABLE "TableName" ADD COLUMN IF NOT EXISTS "columnName" TEXT;
```
Then run `npm run db:generate` separately (no db connection needed).
