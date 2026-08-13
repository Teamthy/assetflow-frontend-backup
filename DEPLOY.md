# Deploy AssetFlow client — Vercel

Client = this Next.js app on **Vercel**. API = Express on **Render** (or Railway / Fly).  
Do **not** point Vercel at `localhost`. `NEXT_PUBLIC_*` is baked in at **build** time — change it, then redeploy.

## 0. Push the branch first

```powershell
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowclient
git checkout feat/production-ready
git remote set-url origin https://github.com/olumatty/assetflowclient.git
git push -u origin feat/production-ready
git push backup feat/production-ready
```

Open the PR (do not commit to `main`):  
https://github.com/olumatty/assetflowclient/compare/main...feat/production-ready

## 1. Deploy the API first

You need a public API URL before the Vercel build:

```
https://YOUR-SERVICE.onrender.com/api
```

Confirm:

```powershell
Invoke-RestMethod -UseBasicParsing https://YOUR-SERVICE.onrender.com/api/health
```

## 2. Create the Vercel project

1. https://vercel.com/new
2. Import **`olumatty/assetflowclient`** (or `Teamthy/assetflow-frontend-backup`).
3. Settings:

| Field | Value |
|---|---|
| Framework | Next.js |
| Root directory | `./` (this repo is the client) |
| Branch | `feat/production-ready` |
| Install | `npm install` |
| Build | `npm run build` |
| Output | leave default |

## 3. Environment variables (set before the first production build)

Vercel → Project → Settings → Environment Variables → Production + Preview:

```
NEXT_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api
NEXT_PUBLIC_APP_NAME=AssetFlow
NEXT_PUBLIC_ENFORCE_RBAC=false
```

- Must include the `/api` suffix.
- No trailing slash.
- Never `http://127.0.0.1:7000/api` on Vercel.
- After changing any `NEXT_PUBLIC_*`, **Redeploy** (they are compiled in).

## 3b. Turn off Vercel Deployment Protection (required)

Preview URLs like `https://assetflow-frontend-backup-xxxxx.vercel.app` **302 to vercel.com/sso-api** until this is off. Register/login/e2e cannot reach the app.

1. Vercel → the project → **Settings** → **Deployment Protection**
2. Set **Standard Protection** to **Disabled** (or “Only Preview Deployments” **and** promote this deploy to Production)
3. **Save**
4. Deployments → the latest deploy → **⋯** → **Promote to Production**

After that, `https://<project>.vercel.app/login` must return **200** (HTML), not a Vercel login page.

```powershell
# Must be 200, not 302 to vercel.com/sso-api
(Invoke-WebRequest -UseBasicParsing https://YOUR-APP.vercel.app/login).StatusCode
```

## 4. Deploy

Click **Deploy**. Copy the URL (`https://assetflowclient-….vercel.app`).

Put that exact origin on the API:

```
FRONTEND_URL=https://assetflowclient-xxxx.vercel.app
CORS_ORIGIN=https://assetflowclient-xxxx.vercel.app
```

`https://*.vercel.app` is already allowed by the API CORS code. Setting the exact origin is still required for invite links / emails.

## 5. Smoke

```powershell
$ui  = "https://assetflowclient-xxxx.vercel.app"
$api = "https://YOUR-SERVICE.onrender.com/api"

Invoke-RestMethod -UseBasicParsing "$api/health"
Invoke-WebRequest -UseBasicParsing "$ui/login" | Select-Object StatusCode
Invoke-WebRequest -UseBasicParsing "$ui/register" | Select-Object StatusCode
```

In the browser: open `/register`, create an org, land on `/onboarding` then `/dashboard`.  
Create an asset **with a purchase cost**. Transfer by branch. Open `/documents` and `/audit`.

## Local (Windows)

Port **7000** only. Browsers and Node `fetch` treat **6000** as a blocked X11 port.

```powershell
# API
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowserver
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# .env: PORT=7000, DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, TOKEN_HASH_PEPPER
pnpm db:migrate
pnpm dev
# Must log: API running on port 7000

# Client (second window)
cd C:\Users\USER\Desktop\PROJECTS\Assetflow\assetflowclient
# .env.local:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:7000/api
# NEXT_PUBLIC_ENFORCE_RBAC=false
npx next dev --webpack
```

Browser traffic should use same-origin `/backend/api` once Next is up.
