# AssetFlow Client

Next.js 16 app for the AssetFlow fixed-asset register.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

The UI expects the API at `http://localhost:6000/api` (see `.env.example`).

`NEXT_PUBLIC_ENFORCE_RBAC` defaults to off for this deployment so every signed-in role can open every screen. Set it to `true` to restore the permission matrix.

## Roles

Canonical roles match the server:

`admin` · `asset_manager` · `finance` · `auditor` · `branch_manager` · `maintenance_staff` · `standard_staff`

Legacy aliases (`primary_admin`, `org_admin`, `finance_user`) are normalized on login and from persisted sessions.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run test:e2e` — Playwright
