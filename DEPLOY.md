# Deploy AssetFlow

Client = Next.js on **Vercel**. API = Express + Neon on Railway / Render / Fly / a VM.  
This split is what 100 daily users need: Vercel does not run BullMQ, disk uploads, or a long-lived Postgres pool well.

## Local (Lagos / Windows)

Port **7000** only. Browsers and Node `fetch` treat **6000** as a blocked X11 port.

```powershell
# API
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowserver
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# .env: PORT=7000, DATABASE_URL=..., JWT_SECRET, JWT_REFRESH_SECRET, TOKEN_HASH_PEPPER
pnpm db:migrate
pnpm dev
# Must log: API running on port 7000

# Client (second window)
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowclient
# .env.local
# NEXT_PUBLIC_API_URL=http://127.0.0.1:7000/api
# NEXT_PUBLIC_ENFORCE_RBAC=false
npx next dev --webpack
```

Health: `Invoke-RestMethod http://127.0.0.1:7000/api/health`  
Browser should use same-origin `/backend/api` once Next is up.

## Client — Vercel

1. Import `assetflowclient` (or the client folder of the monorepo).
2. Framework preset: Next.js. Build: `npm run build`.
3. Environment variables:

```
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api
NEXT_PUBLIC_APP_NAME=AssetFlow
NEXT_PUBLIC_ENFORCE_RBAC=false
```

4. After first deploy, add the Vercel URL to the API `CORS_ORIGIN` and `FRONTEND_URL`.
5. Redeploy the client if you change `NEXT_PUBLIC_*` (they are baked in at build time).

Do **not** point `NEXT_PUBLIC_API_URL` at `localhost` on Vercel.

## API — not Vercel (recommended)

```
pnpm install
pnpm build
pnpm db:migrate
pnpm start          # PORT=7000
```

Minimum production env:

```
NODE_ENV=production
PORT=7000
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
TOKEN_HASH_PEPPER=...
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com
ENFORCE_RBAC=false
PG_CONNECTION_TIMEOUT_MS=20000
PG_STATEMENT_TIMEOUT_MS=60000
```

CORS already allows `https://*.vercel.app` and localhost.

## Sized for ~100 DAU

- Client React Query: 2-minute stale time, no refetch on tab focus.
- Asset list is paged (25/50/100). Do not dump the whole register in the browser.
- Import is capped at 5 MB `.xlsx`.
- API already has global + upload rate limits.
- Document binaries stay on the API host, not on Vercel’s serverless filesystem.
- Neon pool + 15–20s connect timeout handles cold starts.

If you later exceed a few hundred DAU: add Redis for the worker, move uploads to S3/R2, and put a CDN in front of the client only.
