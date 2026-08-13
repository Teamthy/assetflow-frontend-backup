# ==============================================================
#  ASSETFLOW PROJECT STRUCTURE + INTEGRITY TEST
# ==============================================================

$ErrorActionPreference = "Continue"
$script:passed   = 0
$script:failed   = 0
$script:warnings = 0
$script:results  = @()

function Test-Item {
    param([string]$Category, [string]$Name, [scriptblock]$Test, [string]$Level = "error")
    try {
        $result = & $Test
        if ($result) {
            Write-Host "  [PASS] " -ForegroundColor Green -NoNewline
            Write-Host "$Name"
            $script:passed++
            $script:results += [PSCustomObject]@{ Category=$Category; Name=$Name; Status="PASS"; Detail="" }
        } else {
            if ($Level -eq "warning") {
                Write-Host "  [WARN] " -ForegroundColor Yellow -NoNewline
                Write-Host "$Name"
                $script:warnings++
                $script:results += [PSCustomObject]@{ Category=$Category; Name=$Name; Status="WARN"; Detail="" }
            } else {
                Write-Host "  [FAIL] " -ForegroundColor Red -NoNewline
                Write-Host "$Name"
                $script:failed++
                $script:results += [PSCustomObject]@{ Category=$Category; Name=$Name; Status="FAIL"; Detail="" }
            }
        }
    } catch {
        Write-Host "  [ERR]  " -ForegroundColor Red -NoNewline
        Write-Host "$Name  ($($_.Exception.Message))"
        $script:failed++
        $script:results += [PSCustomObject]@{ Category=$Category; Name=$Name; Status="ERROR"; Detail=$_.Exception.Message }
    }
}

function Section { param([string]$T); Write-Host ""; Write-Host ("=" * 70) -ForegroundColor Cyan; Write-Host " $T" -ForegroundColor Cyan; Write-Host ("=" * 70) -ForegroundColor Cyan }

$startTime = Get-Date
Clear-Host
Write-Host ""
Write-Host "  ASSETFLOW PROJECT STRUCTURE TEST" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "  Started: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host ""

Section "1. ROOT CONFIGURATION"
Test-Item "Root" "package.json" { Test-Path "package.json" }
Test-Item "Root" "next.config.ts" { Test-Path "next.config.ts" }
Test-Item "Root" "tsconfig.json" { Test-Path "tsconfig.json" }
Test-Item "Root" "tailwind.config.ts" { Test-Path "tailwind.config.ts" }
Test-Item "Root" "postcss.config.mjs or .js" { (Test-Path "postcss.config.mjs") -or (Test-Path "postcss.config.js") }
Test-Item "Root" "components.json (shadcn)" { Test-Path "components.json" }
Test-Item "Root" ".env.local" { Test-Path ".env.local" }
Test-Item "Root" "middleware.ts" { Test-Path "src/middleware.ts" }

Section "2. DEPENDENCIES"
if (Test-Path "package.json") {
    $pkg  = Get-Content "package.json" | ConvertFrom-Json
    $deps = $pkg.dependencies.PSObject.Properties.Name

    $required = @(
        "next","react","react-dom",
        "framer-motion",
        "@tanstack/react-query","@tanstack/react-table",
        "axios","zustand",
        "react-hook-form","@hookform/resolvers","zod",
        "recharts","sonner","date-fns","lucide-react",
        "@radix-ui/react-dialog","@radix-ui/react-slot","@radix-ui/react-label",
        "@radix-ui/react-select","@radix-ui/react-dropdown-menu",
        "@radix-ui/react-tabs","@radix-ui/react-checkbox","@radix-ui/react-switch",
        "class-variance-authority","clsx","tailwind-merge"
    )
    foreach ($dep in $required) {
        Test-Item "Deps" $dep { $deps -contains $dep }
    }
}

Section "3. SHADCN UI COMPONENTS"
$uiComponents = @(
    "button","input","label","textarea","badge","card","separator",
    "skeleton","avatar","dialog","sheet","dropdown-menu","select",
    "tabs","alert","tooltip","popover","progress","scroll-area",
    "switch","checkbox","form","table","sonner"
)
foreach ($c in $uiComponents) {
    Test-Item "UI" "components/ui/$c.tsx" { Test-Path "src/components/ui/$c.tsx" }
}

Section "4. API LAYER"
Test-Item "API" "client.ts" { Test-Path "src/lib/api/client.ts" }
Test-Item "API" "auth.ts" { Test-Path "src/lib/api/auth.ts" }
Test-Item "API" "assets.ts" { Test-Path "src/lib/api/assets.ts" }
Test-Item "API" "branches.ts" { Test-Path "src/lib/api/branches.ts" }
Test-Item "API" "maintenance.ts" { Test-Path "src/lib/api/maintenance.ts" }
Test-Item "API" "notifications.ts" { Test-Path "src/lib/api/notifications.ts" }
Test-Item "API" "settings.ts" { Test-Path "src/lib/api/settings.ts" }

Section "5. STORES"
Test-Item "Stores" "auth.ts" { Test-Path "src/lib/stores/auth.ts" }
Test-Item "Stores" "onboarding.ts" { Test-Path "src/lib/stores/onboarding.ts" }
Test-Item "Stores" "theme.ts" { Test-Path "src/lib/stores/theme.ts" }
Test-Item "Stores" "notifications.ts" { Test-Path "src/lib/stores/notifications.ts" }

Section "6. HOOKS"
Test-Item "Hooks" "useSSE.ts" { Test-Path "src/lib/hooks/useSSE.ts" }
Test-Item "Hooks" "useKeyboardShortcuts.ts" { Test-Path "src/lib/hooks/useKeyboardShortcuts.ts" }

Section "7. UTILS AND TYPES"
Test-Item "Utils" "format.ts" { Test-Path "src/lib/utils/format.ts" }
Test-Item "Utils" "permissions.ts" { Test-Path "src/lib/utils/permissions.ts" }
Test-Item "Types" "types/index.ts" { Test-Path "src/types/index.ts" }
Test-Item "Lib"   "lib/utils.ts (cn)" { Test-Path "src/lib/utils.ts" }

Section "8. ANIMATIONS"
Test-Item "Anim" "animations/tokens.ts" { Test-Path "src/lib/animations/tokens.ts" }

Section "9. APP ROOT"
Test-Item "App" "layout.tsx" { Test-Path "src/app/layout.tsx" }
Test-Item "App" "page.tsx" { Test-Path "src/app/page.tsx" }
Test-Item "App" "globals.css" { Test-Path "src/app/globals.css" }
Test-Item "App" "not-found.tsx" { Test-Path "src/app/not-found.tsx" }

Section "10. AUTH PAGES"
Test-Item "Auth" "(auth)/layout.tsx" { Test-Path "src/app/(auth)/layout.tsx" }
Test-Item "Auth" "login/page.tsx" { Test-Path "src/app/(auth)/login/page.tsx" }
Test-Item "Auth" "register/page.tsx" { Test-Path "src/app/(auth)/register/page.tsx" }
Test-Item "Auth" "org-login/page.tsx" { Test-Path "src/app/(auth)/org-login/page.tsx" }
Test-Item "Auth" "forgot-password/page.tsx" { Test-Path "src/app/(auth)/forgot-password/page.tsx" }
Test-Item "Auth" "accept-invite/[token]/page.tsx" { Test-Path -LiteralPath "src/app/(auth)/accept-invite/[token]/page.tsx" }

Section "11. ONBOARDING"
Test-Item "Onboard" "(onboarding)/layout.tsx" { Test-Path "src/app/(onboarding)/layout.tsx" }
Test-Item "Onboard" "onboarding/page.tsx" { Test-Path "src/app/(onboarding)/onboarding/page.tsx" }

Section "12. DASHBOARD"
Test-Item "Dash" "(dashboard)/layout.tsx" { Test-Path "src/app/(dashboard)/layout.tsx" }
Test-Item "Dash" "dashboard/page.tsx" { Test-Path "src/app/(dashboard)/dashboard/page.tsx" }
Test-Item "Dash" "notifications/page.tsx" { Test-Path "src/app/(dashboard)/notifications/page.tsx" }
Test-Item "Dash" "profile/page.tsx" { Test-Path "src/app/(dashboard)/profile/page.tsx" }

Section "13. ASSETS MODULE"
Test-Item "Assets" "list page" { Test-Path "src/app/(dashboard)/assets/page.tsx" }
Test-Item "Assets" "new/page.tsx" { Test-Path "src/app/(dashboard)/assets/new/page.tsx" }
Test-Item "Assets" "[id]/page.tsx" { Test-Path -LiteralPath "src/app/(dashboard)/assets/[id]/page.tsx" }
Test-Item "Assets" "[id]/edit/page.tsx" { Test-Path -LiteralPath "src/app/(dashboard)/assets/[id]/edit/page.tsx" }
Test-Item "Assets" "import/page.tsx" { Test-Path "src/app/(dashboard)/assets/import/page.tsx" }

Section "14. BRANCHES MODULE"
Test-Item "Branch" "list page" { Test-Path "src/app/(dashboard)/branches/page.tsx" }
Test-Item "Branch" "new/page.tsx" { Test-Path "src/app/(dashboard)/branches/new/page.tsx" }
Test-Item "Branch" "[id]/page.tsx" { Test-Path -LiteralPath "src/app/(dashboard)/branches/[id]/page.tsx" }
Test-Item "Branch" "[id]/edit/page.tsx" { Test-Path -LiteralPath "src/app/(dashboard)/branches/[id]/edit/page.tsx" }

Section "15. MAINTENANCE MODULE"
Test-Item "Maint" "list page" { Test-Path "src/app/(dashboard)/maintenance/page.tsx" }
Test-Item "Maint" "new/page.tsx" { Test-Path "src/app/(dashboard)/maintenance/new/page.tsx" }
Test-Item "Maint" "[id]/page.tsx" { Test-Path -LiteralPath "src/app/(dashboard)/maintenance/[id]/page.tsx" }
Test-Item "Maint" "[id]/edit/page.tsx" { Test-Path -LiteralPath "src/app/(dashboard)/maintenance/[id]/edit/page.tsx" }

Section "16. REPORTS"
Test-Item "Reports" "hub page" { Test-Path "src/app/(dashboard)/reports/page.tsx" }
Test-Item "Reports" "audit" { Test-Path "src/app/(dashboard)/reports/audit/page.tsx" }
Test-Item "Reports" "finance" { Test-Path "src/app/(dashboard)/reports/finance/page.tsx" }
Test-Item "Reports" "maintenance" { Test-Path "src/app/(dashboard)/reports/maintenance/page.tsx" }
Test-Item "Reports" "assets" { Test-Path "src/app/(dashboard)/reports/assets/page.tsx" }

Section "17. SETTINGS"
Test-Item "Settings" "hub/page.tsx" { Test-Path "src/app/(dashboard)/settings/page.tsx" }
Test-Item "Settings" "organization" { Test-Path "src/app/(dashboard)/settings/organization/page.tsx" }
Test-Item "Settings" "accounting" { Test-Path "src/app/(dashboard)/settings/accounting/page.tsx" }
Test-Item "Settings" "team" { Test-Path "src/app/(dashboard)/settings/team/page.tsx" }
Test-Item "Settings" "billing" { Test-Path "src/app/(dashboard)/settings/billing/page.tsx" }
Test-Item "Settings" "notifications" { Test-Path "src/app/(dashboard)/settings/notifications/page.tsx" }

Section "18. SHARED COMPONENTS"
$shared = @(
    "EmptyState","RoleGuard","ThemeToggle",
    "StatCard","PageHeader","LoadingSkeleton",
    "ConfirmDialog","ContextualTooltip"
)
foreach ($c in $shared) {
    Test-Item "Shared" "$c.tsx" { Test-Path "src/components/shared/$c.tsx" }
}

Section "19. PROVIDERS"
$providers = @("ThemeProvider","QueryProvider","SSEProvider","KeyboardShortcutsProvider")
foreach ($p in $providers) {
    Test-Item "Providers" "$p.tsx" { Test-Path "src/components/providers/$p.tsx" }
}

Section "20. ONBOARDING COMPONENTS"
$onboardComps = @("WelcomeScreen","OnboardingBanner","OnboardingComplete")
foreach ($c in $onboardComps) {
    Test-Item "Onboard" "$c.tsx" { Test-Path "src/components/onboarding/$c.tsx" }
}

Section "21. ENVIRONMENT"
if (Test-Path ".env.local") {
    $env = Get-Content ".env.local" -Raw
    Test-Item "Env" "NEXT_PUBLIC_API_URL set" { $env -match "NEXT_PUBLIC_API_URL=" }
    Test-Item "Env" "API URL points to port 4000" { $env -match ":4000" }
    Test-Item "Env" "NEXT_PUBLIC_APP_URL set" { $env -match "NEXT_PUBLIC_APP_URL=" }
    Test-Item "Env" "NEXT_PUBLIC_APP_NAME set" { $env -match "NEXT_PUBLIC_APP_NAME=" }
}

Section "22. CODE INTEGRITY"
$keyExports = @(
    @{ File="src/lib/stores/auth.ts"; Pattern="useAuthStore"; Name="auth store exports useAuthStore" }
    @{ File="src/lib/api/client.ts"; Pattern="export default"; Name="api client has default export" }
    @{ File="src/types/index.ts"; Pattern="Asset"; Name="types exports Asset" }
    @{ File="src/lib/animations/tokens.ts"; Pattern="variants"; Name="animation tokens exports variants" }
    @{ File="src/lib/utils/permissions.ts"; Pattern="usePermission"; Name="permissions exports usePermission" }
)
foreach ($check in $keyExports) {
    if (Test-Path $check.File) {
        Test-Item "Integrity" $check.Name {
            $c = Get-Content $check.File -Raw
            $c -match $check.Pattern
        }
    }
}

Section "23. BACKEND CONNECTIVITY"
$apiUrl = "http://localhost:6000/api"
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_API_URL=([^\r\n]+)") {
        $apiUrl = $Matches[1].Trim()
    }
}
Write-Host "  Testing: $apiUrl" -ForegroundColor Gray

Test-Item "Backend" "Health endpoint reachable" {
    try {
        $r = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        $r.status -eq "ok"
    } catch { $false }
} "warning"

Test-Item "Backend" "Auth route exists (not 404)" {
    try {
        $r = Invoke-WebRequest -Uri "$apiUrl/auth/login" -Method Post `
            -ContentType "application/json" -Body "{}" `
            -TimeoutSec 5 -SkipHttpErrorCheck -ErrorAction Stop
        $r.StatusCode -ne 404
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        $code -in @(400, 401, 422)
    }
} "warning"

Section "24. BUILD ARTIFACTS"
Test-Item "Build" "node_modules installed" { Test-Path "node_modules" }
Test-Item "Build" "next-env.d.ts" { Test-Path "next-env.d.ts" }
Test-Item "Build" ".next cache" { Test-Path ".next" } "warning"

Section "25. TYPESCRIPT"
Write-Host "  Running tsc --noEmit..." -ForegroundColor Gray
Test-Item "TypeScript" "No TypeScript errors" {
    & npx tsc --noEmit --pretty false 2>&1 | Out-Null
    $LASTEXITCODE -eq 0
} "warning"

# ==============================================================
Section "SUMMARY"
# ==============================================================

$endTime  = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
$total    = $script:passed + $script:failed + $script:warnings
$passRate = if ($total -gt 0) { [math]::Round(($script:passed / $total) * 100, 1) } else { 0 }

Write-Host ""
Write-Host "  Duration : $([math]::Round($duration, 1))s"
Write-Host "  Total    : $total checks"
Write-Host ""
Write-Host "  PASSED: $($script:passed)   " -ForegroundColor Green -NoNewline
Write-Host "WARN: $($script:warnings)   " -ForegroundColor Yellow -NoNewline
Write-Host "FAILED: $($script:failed)" -ForegroundColor Red
Write-Host ""

if ($script:failed -eq 0 -and $script:warnings -eq 0) {
    Write-Host "  RESULT: PRODUCTION READY" -ForegroundColor White -BackgroundColor Green
    Write-Host "  All $total checks passed."
} elseif ($script:failed -eq 0) {
    Write-Host "  RESULT: PASSING WITH WARNINGS ($passRate%)" -ForegroundColor Black -BackgroundColor Yellow
    Write-Host "  Warnings are non-critical."
} else {
    Write-Host "  RESULT: FAILURES DETECTED ($passRate%)" -ForegroundColor White -BackgroundColor Red
    Write-Host ""
    Write-Host "  Failed:" -ForegroundColor Red
    $script:results | Where-Object { $_.Status -in @("FAIL","ERROR") } | ForEach-Object {
        Write-Host "    [$($_.Category)] $($_.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan

$csv = "structure-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
$script:results | Export-Csv -Path $csv -NoTypeInformation
Write-Host ""
Write-Host "  Results saved: $csv" -ForegroundColor Gray
Write-Host ""
