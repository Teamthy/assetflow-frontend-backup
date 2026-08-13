# Deploy AssetFlow

## Local — register / login Network Error

The Next app on `:3000` is only the UI. Register posts to `NEXT_PUBLIC_API_URL` (default `http://localhost:6000/api`). If nothing is listening on `:6000`, the browser shows `AxiosError: Network Error`.

`chrome-extension://.../M_ID` errors are a browser extension. Ignore them.

In PowerShell:

```powershell
# 1. Is the API up?
try { (Invoke-RestMethod http://localhost:6000/api/health) } catch { $_.Exception.Message }

# 2. One Next process only
Get-NetTCPConnection -LocalPort 3000,3001,6000 -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess
# If 3000 is an old Next: taskkill /PID <pid> /F

# 3. Start Postgres if needed, then the API (new terminal)
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowserver
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# .env must contain a working DATABASE_URL, e.g.
# DATABASE_URL=postgres://postgres:postgres@localhost:5432/assetflow
pnpm add handlebars bullmq ioredis
pnpm db:migrate
pnpm dev
# Must print: API running on port 6000

# 4. Client env (restart Next after editing)
# assetflowclient\.env.local
# NEXT_PUBLIC_API_URL=http://localhost:6000/api
# NEXT_PUBLIC_ENFORCE_RBAC=false
```

Optional Postgres via Docker (from `assetflowserver`):

```powershell
docker compose up -d
```

Auth pages now show a red banner when `GET /api/health` fails.

## Client — Vercel

The Next.js app in `assetflowclient` is the Vercel target.

1. Import the GitHub repo (or `feat/production-ready`) in Vercel.
2. Root directory: `assetflowclient` if the repo is a monorepo; otherwise the client repo root.
3. Environment variables:

```
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api
NEXT_PUBLIC_APP_NAME=AssetFlow
NEXT_PUBLIC_ENFORCE_RBAC=false
```

4. Build command: `npm run build`

## API + worker — not Vercel

BullMQ workers need a long-lived Node process and Redis/Valkey. Deploy the server on Railway, Render, Fly, or a VM.

```
pnpm install
pnpm build
pnpm db:migrate
pnpm start          # API :6000
pnpm start:worker   # BullMQ worker (requires REDIS_URL or VALKEY_URL)
```

If Redis is unset, the API still runs jobs inline on the cron schedule.

Server env (minimum):

```
NODE_ENV=production
PORT=6000
DATABASE_URL=postgres://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
TOKEN_HASH_PEPPER=...
CORS_ORIGIN=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@yourdomain.com
ENFORCE_RBAC=false
REDIS_URL=redis://...
```

Local CORS already allows any `http://localhost:*` and `*.vercel.app`.
