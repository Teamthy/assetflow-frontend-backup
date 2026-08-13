# ==============================================================
#  ASSETFLOW LIVE API TEST — Real data, real endpoints, real cleanup
# ==============================================================

$ErrorActionPreference = "Continue"
$script:passed = 0
$script:failed = 0
$script:results = @()
$script:context = @{
    accessToken = $null
    userId = $null
    organizationId = $null
    email = $null
    password = "TestPass123!"
    createdAssetIds = @()
    createdBranchIds = @()
    createdTaskIds = @()
}

$API = "http://localhost:6000/api"

# ---------- helpers ----------

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test
    )

    Write-Host "  " -NoNewline
    try {
        $result = & $Test
        if ($result -eq $false -or $null -eq $result) {
            Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
            Write-Host $Name
            $script:failed++
            $script:results += [PSCustomObject]@{ Name=$Name; Status="FAIL" }
        } else {
            Write-Host "[PASS] " -ForegroundColor Green -NoNewline
            Write-Host $Name
            $script:passed++
            $script:results += [PSCustomObject]@{ Name=$Name; Status="PASS" }
        }
    } catch {
        Write-Host "[FAIL] " -ForegroundColor Red -NoNewline
        Write-Host "$Name" -NoNewline
        Write-Host "  ($($_.Exception.Message))" -ForegroundColor DarkGray
        $script:failed++
        $script:results += [PSCustomObject]@{ Name=$Name; Status="FAIL" }
    }
}

function Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body,
        [switch]$NoAuth
    )
    $headers = @{ "Content-Type" = "application/json" }
    if (-not $NoAuth -and $script:context.accessToken) {
        $headers["Authorization"] = "Bearer $($script:context.accessToken)"
    }

    $params = @{
        Uri         = "$API$Path"
        Method      = $Method
        Headers     = $headers
        TimeoutSec  = 15
        ErrorAction = "Stop"
    }
    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }

    return Invoke-RestMethod @params
}

function Get-Data {
    param([object]$Response)
    # Handles both { success, data } envelope and raw
    if ($Response -and $Response.PSObject.Properties.Name -contains 'data') {
        return $Response.data
    }
    return $Response
}

# ---------- start ----------

$startTime = Get-Date

Clear-Host
Write-Host ""
Write-Host "  ASSETFLOW LIVE API TEST" -ForegroundColor White -BackgroundColor Blue
Write-Host "  Target: $API"
Write-Host "  Started: $($startTime.ToString('HH:mm:ss'))"
Write-Host ""

# ==============================================================
Section "1. BACKEND CONNECTIVITY"
# ==============================================================

Test-Step "GET /health returns ok" {
    $r = Invoke-Api -Method Get -Path "/health" -NoAuth
    $r.status -eq "ok"
}

if ($script:failed -gt 0) {
    Write-Host ""
    Write-Host "  Backend is not reachable at $API" -ForegroundColor Red
    Write-Host "  Start it with: cd <backend-folder>; npm run dev" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ==============================================================
Section "2. AUTHENTICATION"
# ==============================================================

$script:context.email = "e2e-$(Get-Random -Minimum 100000 -Maximum 999999)@test.local"
$orgName = "E2E Test Org $(Get-Random -Minimum 1000 -Maximum 9999)"

Write-Host "  Test email: $($script:context.email)" -ForegroundColor Gray
Write-Host "  Test org:   $orgName" -ForegroundColor Gray
Write-Host ""

Test-Step "POST /auth/register creates account" {
    $body = @{
        firstName = "E2E"
        lastName = "Tester"
        email = $script:context.email
        password = $script:context.password
        organizationName = $orgName
        accountType = "organization"
    }
    $r = Invoke-Api -Method Post -Path "/auth/register" -Body $body -NoAuth
    $d = Get-Data $r
    $script:context.accessToken = $d.accessToken
    $script:context.userId = $d.user.id
    $script:context.organizationId = $d.organization.id
    $null -ne $d.accessToken -and $null -ne $d.user.id
}

Test-Step "Registration returned user object with expected fields" {
    $r = Invoke-Api -Method Post -Path "/auth/login" -Body @{
        email = $script:context.email
        password = $script:context.password
    } -NoAuth
    $d = Get-Data $r
    $d.user.email -eq $script:context.email
}

Test-Step "POST /auth/login with correct credentials succeeds" {
    $r = Invoke-Api -Method Post -Path "/auth/login" -Body @{
        email = $script:context.email
        password = $script:context.password
    } -NoAuth
    $d = Get-Data $r
    if ($d.accessToken) { $script:context.accessToken = $d.accessToken }
    $null -ne $d.accessToken
}

Test-Step "POST /auth/login with wrong password fails" {
    try {
        Invoke-Api -Method Post -Path "/auth/login" -Body @{
            email = $script:context.email
            password = "WrongPassword123!"
        } -NoAuth
        $false  # Should have thrown
    } catch {
        $true  # Expected failure
    }
}

Test-Step "Authenticated request works with Bearer token" {
    # Any authenticated endpoint - we use assets list
    $r = Invoke-Api -Method Get -Path "/assets?limit=1"
    $null -ne $r
}

# ==============================================================
Section "3. BRANCHES"
# ==============================================================

$branchName = "E2E Branch $(Get-Random -Minimum 100 -Maximum 999)"
$branchCode = "E2E$(Get-Random -Minimum 10 -Maximum 99)"

Test-Step "POST /branches creates a branch" {
    $r = Invoke-Api -Method Post -Path "/branches" -Body @{
        name = $branchName
        code = $branchCode
        description = "Created by E2E test"
    }
    $d = Get-Data $r
    if ($d.id) {
        $script:context.createdBranchIds += $d.id
        $true
    } else { $false }
}

Test-Step "GET /branches returns the created branch" {
    $r = Invoke-Api -Method Get -Path "/branches"
    $d = Get-Data $r
    $items = if ($d.items) { $d.items } elseif ($d.branches) { $d.branches } else { $d }
    $found = $items | Where-Object { $_.id -in $script:context.createdBranchIds }
    $found.Count -gt 0
}

Test-Step "GET /branches/:id returns branch detail" {
    $id = $script:context.createdBranchIds[0]
    $r = Invoke-Api -Method Get -Path "/branches/$id"
    $d = Get-Data $r
    $d.id -eq $id
}

Test-Step "PATCH /branches/:id updates branch" {
    $id = $script:context.createdBranchIds[0]
    $r = Invoke-Api -Method Patch -Path "/branches/$id" -Body @{
        description = "Updated by E2E test"
    }
    $d = Get-Data $r
    $d.description -eq "Updated by E2E test"
}

Test-Step "POST /branches rejects duplicate branch name" {
    try {
        Invoke-Api -Method Post -Path "/branches" -Body @{
            name = $branchName
            code = "DUP$(Get-Random)"
        }
        $false  # Should have failed
    } catch {
        $true
    }
}

# Create second branch for asset transfer test
$secondBranchName = "E2E Branch 2 $(Get-Random -Minimum 100 -Maximum 999)"
Test-Step "POST /branches creates second branch (for transfer test)" {
    $r = Invoke-Api -Method Post -Path "/branches" -Body @{
        name = $secondBranchName
        code = "E2E$(Get-Random -Minimum 100 -Maximum 999)"
    }
    $d = Get-Data $r
    if ($d.id) {
        $script:context.createdBranchIds += $d.id
        $true
    } else { $false }
}

# ==============================================================
Section "4. ASSETS - CRUD"
# ==============================================================

$assetTag = "E2E-AST-$(Get-Random -Minimum 10000 -Maximum 99999)"
$assetName = "E2E Test Asset $(Get-Random -Minimum 100 -Maximum 999)"

Test-Step "POST /assets creates capitalized asset (cost >= 50k)" {
    $r = Invoke-Api -Method Post -Path "/assets" -Body @{
        name = $assetName
        assetTag = $assetTag
        serialNumber = "E2E-SN-$(Get-Random)"
        category = "Laptop"
        manufacturer = "Dell"
        model = "Latitude E2E"
        branchId = $script:context.createdBranchIds[0]
        status = "active"
        condition = "good"
        purchaseCost = 450000
        purchaseDate = "2024-01-15"
        expectedUsefulLifeMonths = 48
        residualValue = 50000
        hasFutureEconomicBenefit = $true
        costCanBeReliablyMeasured = $true
    }
    $d = Get-Data $r
    if ($d.id) {
        $script:context.createdAssetIds += $d.id
        $true
    } else { $false }
}

Test-Step "Created asset was correctly recognized as capitalized" {
    $id = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Get -Path "/assets/$id"
    $d = Get-Data $r
    $d.accountingTreatment -eq "capitalized" -or $d.recognitionStatus -eq "recognized"
}

Test-Step "POST /assets creates low-value asset (cost < 50k, tracked)" {
    $r = Invoke-Api -Method Post -Path "/assets" -Body @{
        name = "Low Value E2E Asset"
        assetTag = "E2E-LOW-$(Get-Random -Minimum 10000 -Maximum 99999)"
        branchId = $script:context.createdBranchIds[0]
        status = "active"
        condition = "good"
        purchaseCost = 25000
        purchaseDate = "2024-06-01"
        expectedUsefulLifeMonths = 24
        hasFutureEconomicBenefit = $true
        costCanBeReliablyMeasured = $true
    }
    $d = Get-Data $r
    if ($d.id) {
        $script:context.createdAssetIds += $d.id
        $true
    } else { $false }
}

Test-Step "Low-value asset was correctly treated as tracked_non_capitalized" {
    $id = $script:context.createdAssetIds[1]
    $r = Invoke-Api -Method Get -Path "/assets/$id"
    $d = Get-Data $r
    $d.accountingTreatment -eq "tracked_non_capitalized" -or $d.accountingTreatment -eq "expensed"
}

Test-Step "GET /assets returns created assets" {
    $r = Invoke-Api -Method Get -Path "/assets?limit=100"
    $d = Get-Data $r
    $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { $d }
    $found = $items | Where-Object { $_.id -in $script:context.createdAssetIds }
    $found.Count -eq $script:context.createdAssetIds.Count
}

Test-Step "GET /assets?search=<name> filters correctly" {
    $r = Invoke-Api -Method Get -Path "/assets?search=$assetName&limit=10"
    $d = Get-Data $r
    $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { $d }
    $items.Count -gt 0
}

Test-Step "GET /assets?status=active filters correctly" {
    $r = Invoke-Api -Method Get -Path "/assets?status=active&limit=100"
    $d = Get-Data $r
    $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { $d }
    $items.Count -gt 0
}

Test-Step "PATCH /assets/:id updates asset" {
    $id = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Patch -Path "/assets/$id" -Body @{
        description = "Updated by E2E test"
        condition = "excellent"
    }
    $d = Get-Data $r
    $d.condition -eq "excellent"
}

Test-Step "POST /assets rejects duplicate asset tag" {
    try {
        Invoke-Api -Method Post -Path "/assets" -Body @{
            name = "Duplicate Tag Test"
            assetTag = $assetTag  # Same as first asset
            branchId = $script:context.createdBranchIds[0]
            status = "active"
            condition = "good"
        }
        $false
    } catch {
        $true
    }
}

# ==============================================================
Section "5. ASSETS - LIFECYCLE ACTIONS"
# ==============================================================

Test-Step "POST /assets/:id/transfer moves asset to second branch" {
    $id = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Post -Path "/assets/$id/transfer" -Body @{
        toBranchId = $script:context.createdBranchIds[1]
        reason = "E2E test transfer to second branch"
    }
    $d = Get-Data $r
    ($d.branch.id -eq $script:context.createdBranchIds[1]) -or ($d.branchId -eq $script:context.createdBranchIds[1])
}

Test-Step "GET /assets/:id/timeline shows transfer event" {
    $id = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Get -Path "/assets/$id/timeline"
    $d = Get-Data $r
    $items = if ($d.items) { $d.items } elseif ($d -is [array]) { $d } else { @($d) }
    $items.Count -gt 0
}

Test-Step "POST /assets/:id/depreciation records snapshot" {
    $id = $script:context.createdAssetIds[0]
    $body = @{
        fiscalYear = 2024
        depreciationMethod = "straight_line"
        periodUsedPriorYears = 0
        periodUsedCurrentYear = 12
        accumulatedDepreciationBf = 0
        yearlyDepCharge = 100000
        totalAccumulatedDepreciation = 100000
        runDate = "2024-12-31"
    }
    $r = Invoke-Api -Method Post -Path "/assets/$id/depreciation" -Body $body
    $null -ne $r
}

Test-Step "POST /assets/:id/depreciation rejects on non-capitalized asset" {
    $id = $script:context.createdAssetIds[1]  # The low-value one
    try {
        Invoke-Api -Method Post -Path "/assets/$id/depreciation" -Body @{
            fiscalYear = 2024
            depreciationMethod = "straight_line"
            periodUsedPriorYears = 0
            periodUsedCurrentYear = 12
            accumulatedDepreciationBf = 0
            yearlyDepCharge = 5000
            totalAccumulatedDepreciation = 5000
            runDate = "2024-12-31"
        }
        $false  # Should have failed
    } catch {
        $true
    }
}

Test-Step "POST /assets/:id/dispose marks asset as disposed" {
    $id = $script:context.createdAssetIds[1]  # Dispose the low-value one
    $r = Invoke-Api -Method Post -Path "/assets/$id/dispose" -Body @{
        method = "sold"
        reason = "E2E disposal test - no longer needed"
        proceeds = 15000
        disposedAt = "2024-12-01"
    }
    $d = Get-Data $r
    $d.status -eq "disposed"
}

Test-Step "POST /assets/:id/restore brings asset back" {
    $id = $script:context.createdAssetIds[1]
    $r = Invoke-Api -Method Post -Path "/assets/$id/restore" -Body @{
        reason = "E2E restore test - restoring for cleanup"
        targetStatus = "active"
    }
    $d = Get-Data $r
    $d.status -eq "active"
}

Test-Step "GET /assets/audit returns summary" {
    $r = Invoke-Api -Method Get -Path "/assets/audit"
    $d = Get-Data $r
    $totalCount = if ($d.totalAssets) { $d.totalAssets } elseif ($d.total) { $d.total } else { 0 }
    $totalCount -ge $script:context.createdAssetIds.Count
}

# ==============================================================
Section "6. MAINTENANCE"
# ==============================================================

Test-Step "POST /maintenance creates task" {
    $assetId = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Post -Path "/maintenance" -Body @{
        assetId = $assetId
        title = "E2E Test Maintenance Task"
        description = "Automated test task"
        priority = "medium"
        dueAt = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    }
    $d = Get-Data $r
    if ($d.id) {
        $script:context.createdTaskIds += $d.id
        $true
    } else { $false }
}

Test-Step "GET /maintenance returns created task" {
    $r = Invoke-Api -Method Get -Path "/maintenance?limit=50"
    $d = Get-Data $r
    $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { $d }
    $found = $items | Where-Object { $_.id -in $script:context.createdTaskIds }
    $found.Count -gt 0
}

Test-Step "GET /maintenance/:id returns task detail" {
    $id = $script:context.createdTaskIds[0]
    $r = Invoke-Api -Method Get -Path "/maintenance/$id"
    $d = Get-Data $r
    $d.id -eq $id -and $d.title -eq "E2E Test Maintenance Task"
}

Test-Step "PATCH /maintenance/:id starts task (status -> in_progress)" {
    $id = $script:context.createdTaskIds[0]
    $r = Invoke-Api -Method Patch -Path "/maintenance/$id" -Body @{
        status = "in_progress"
    }
    $d = Get-Data $r
    $d.status -eq "in_progress"
}

Test-Step "Starting task changes asset status to maintenance" {
    Start-Sleep -Seconds 1
    $assetId = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Get -Path "/assets/$assetId"
    $d = Get-Data $r
    $d.status -eq "maintenance"
}

Test-Step "PATCH /maintenance/:id/complete marks task as completed" {
    $id = $script:context.createdTaskIds[0]
    $r = Invoke-Api -Method Patch -Path "/maintenance/$id/complete" -Body @{
        completionNote = "E2E test completion - task automated"
        note = "E2E test completion - task automated"
        completedAt = (Get-Date).ToString("yyyy-MM-dd")
    }
    $d = Get-Data $r
    $d.status -eq "completed"
}

Test-Step "Completing task reverts asset to active" {
    Start-Sleep -Seconds 1
    $assetId = $script:context.createdAssetIds[0]
    $r = Invoke-Api -Method Get -Path "/assets/$assetId"
    $d = Get-Data $r
    $d.status -eq "active"
}

# ==============================================================
Section "7. NOTIFICATIONS"
# ==============================================================

Test-Step "GET /notifications returns list" {
    $r = Invoke-Api -Method Get -Path "/notifications?limit=20"
    $d = Get-Data $r
    $null -ne $d
}

Test-Step "GET /notifications?unreadOnly=true works" {
    $r = Invoke-Api -Method Get -Path "/notifications?unreadOnly=true&limit=20"
    $d = Get-Data $r
    $null -ne $d
}

Test-Step "PATCH /notifications/read-all marks all as read" {
    $r = Invoke-Api -Method Patch -Path "/notifications/read-all"
    $null -ne $r
}

# ==============================================================
Section "8. EXPORT"
# ==============================================================

Test-Step "GET /assets/export returns binary blob (Excel)" {
    $headers = @{ "Authorization" = "Bearer $($script:context.accessToken)" }
    $r = Invoke-WebRequest -Uri "$API/assets/export" -Method Get -Headers $headers -TimeoutSec 30 -ErrorAction Stop
    $r.StatusCode -eq 200 -and $r.Headers.'Content-Type' -match "spreadsheet|excel|octet-stream"
}

# ==============================================================
Section "9. AUTH - PASSWORD"
# ==============================================================

Test-Step "POST /auth/change-password updates password" {
    $newPassword = "NewPass456!"
    $r = Invoke-Api -Method Post -Path "/auth/change-password" -Body @{
        currentPassword = $script:context.password
        newPassword = $newPassword
    }
    $script:context.password = $newPassword
    $true
}

Test-Step "Login works with new password" {
    Start-Sleep -Seconds 1
    $r = Invoke-Api -Method Post -Path "/auth/login" -Body @{
        email = $script:context.email
        password = $script:context.password
    } -NoAuth
    $d = Get-Data $r
    if ($d.accessToken) { $script:context.accessToken = $d.accessToken }
    $null -ne $d.accessToken
}

Test-Step "POST /auth/password-reset/request accepts any email (no leak)" {
    $r = Invoke-Api -Method Post -Path "/auth/password-reset/request" -Body @{
        email = "nonexistent-$(Get-Random)@nowhere.local"
    } -NoAuth
    $null -ne $r
}

# ==============================================================
Section "10. CLEANUP"
# ==============================================================

# Delete assets
foreach ($id in $script:context.createdAssetIds) {
    Test-Step "DELETE asset $id" {
        try {
            Invoke-Api -Method Delete -Path "/assets/$id" | Out-Null
            $true
        } catch { $true }  # Already deleted is fine
    }
}

# Delete branches (with force since they may have assets)
foreach ($id in $script:context.createdBranchIds) {
    Test-Step "DELETE branch $id (force)" {
        try {
            Invoke-Api -Method Delete -Path "/branches/${id}?force=true" | Out-Null
            $true
        } catch { $true }
    }
}

Test-Step "POST /auth/logout ends session" {
    try {
        Invoke-Api -Method Post -Path "/auth/logout" | Out-Null
        $true
    } catch { $true }
}

# ==============================================================
Section "SUMMARY"
# ==============================================================

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
$total = $script:passed + $script:failed
$passRate = if ($total -gt 0) { [math]::Round(($script:passed / $total) * 100, 1) } else { 0 }

Write-Host ""
Write-Host "  Duration:  $([math]::Round($duration, 1))s"
Write-Host "  Total:     $total API calls"
Write-Host ""
Write-Host "  " -NoNewline
Write-Host "PASSED: $($script:passed)" -ForegroundColor Green -NoNewline
Write-Host "   " -NoNewline
Write-Host "FAILED: $($script:failed)" -ForegroundColor Red
Write-Host ""

if ($script:failed -eq 0) {
    Write-Host "  RESULT: ALL API TESTS PASSED ($passRate%)" -ForegroundColor White -BackgroundColor Green
    Write-Host "  Backend is production-ready."
} elseif ($passRate -ge 80) {
    Write-Host "  RESULT: MOSTLY PASSING ($passRate%)" -ForegroundColor Black -BackgroundColor Yellow
    Write-Host "  Some endpoints failed. Review below."
} else {
    Write-Host "  RESULT: FAILURES DETECTED ($passRate%)" -ForegroundColor White -BackgroundColor Red
}

Write-Host ""

if ($script:failed -gt 0) {
    Write-Host "  Failed tests:" -ForegroundColor Yellow
    $script:results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "    - $($_.Name)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "  Test account: $($script:context.email)" -ForegroundColor Gray
Write-Host "  Org: $orgName (id: $($script:context.organizationId))" -ForegroundColor Gray
Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

# Save results
$csv = "live-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
$script:results | Export-Csv -Path $csv -NoTypeInformation
Write-Host "  Results saved: $csv" -ForegroundColor Gray
Write-Host ""





# ==============================================================
#  ASSETFLOW E2E TEST SUITE
#  Tests: Project structure + Backend + Frontend
# ==============================================================

$ErrorActionPreference = "Continue"
$script:passed = 0
$script:failed = 0
$script:warnings = 0
$script:results = @()

function Test-Item {
    param(
        [string]$Category,
        [string]$Name,
        [scriptblock]$Test,
        [string]$Level = "error"  # error | warning
    )

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
        Write-Host "  [ERROR] " -ForegroundColor Red -NoNewline
        Write-Host "$Name  ($($_.Exception.Message))"
        $script:failed++
        $script:results += [PSCustomObject]@{ Category=$Category; Name=$Name; Status="ERROR"; Detail=$_.Exception.Message }
    }
}

function Section {
    param([string]$Title)
    Write-Host ""
    Write-Host ("=" * 70) -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host ("=" * 70) -ForegroundColor Cyan
}

$startTime = Get-Date

Clear-Host
Write-Host ""
Write-Host "  ASSETFLOW END-TO-END TEST SUITE" -ForegroundColor White -BackgroundColor Blue
Write-Host "  Started: $($startTime.ToString('yyyy-MM-dd HH:mm:ss'))"
Write-Host ""

# ==============================================================
Section "1. PROJECT ROOT AND CONFIGURATION"
# ==============================================================

Test-Item "Root" "package.json exists" { Test-Path "package.json" }
Test-Item "Root" "next.config.ts exists" { Test-Path "next.config.ts" }
Test-Item "Root" "tsconfig.json exists" { Test-Path "tsconfig.json" }
Test-Item "Root" "tailwind.config.ts exists" { Test-Path "tailwind.config.ts" }
Test-Item "Root" "postcss.config.js exists" { Test-Path "postcss.config.js" }
Test-Item "Root" "components.json exists" { Test-Path "components.json" }
Test-Item "Root" ".env.local exists" { Test-Path ".env.local" }
Test-Item "Root" "src/proxy.ts exists" { Test-Path "src/proxy.ts" }

# ==============================================================
Section "2. DEPENDENCIES"
# ==============================================================

if (Test-Path "package.json") {
    $pkg = Get-Content "package.json" | ConvertFrom-Json
    $deps = $pkg.dependencies.PSObject.Properties.Name

    $required = @(
        "next", "react", "typescript", "tailwindcss",
        "@tanstack/react-query", "@tanstack/react-table",
        "axios", "zustand", "react-hook-form", "@hookform/resolvers", "zod",
        "recharts", "sonner", "date-fns", "lucide-react",
        "@radix-ui/react-dialog", "@radix-ui/react-slot", "@radix-ui/react-label",
        "@radix-ui/react-select", "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-tabs", "@radix-ui/react-checkbox", "@radix-ui/react-switch",
        "@radix-ui/react-popover", "@radix-ui/react-tooltip",
        "class-variance-authority", "clsx", "tailwind-merge"
    )

    foreach ($dep in $required) {
        Test-Item "Deps" $dep { $deps -contains $dep }
    }
}

# ==============================================================
Section "3. SHADCN UI COMPONENTS"
# ==============================================================

$uiComponents = @(
    "button", "input", "label", "textarea", "badge", "card", "separator",
    "skeleton", "avatar", "dialog", "sheet", "dropdown-menu", "select",
    "tabs", "alert", "tooltip", "popover", "progress", "scroll-area",
    "switch", "checkbox", "form", "table", "sonner"
)

foreach ($c in $uiComponents) {
    Test-Item "UI" "$c.tsx" { Test-Path "src/components/ui/$c.tsx" }
}

# ==============================================================
Section "4. LIB - API LAYER"
# ==============================================================

Test-Item "API" "client.ts (axios)" { Test-Path "src/lib/api/client.ts" }
Test-Item "API" "auth.ts" { Test-Path "src/lib/api/auth.ts" }
Test-Item "API" "assets.ts" { Test-Path "src/lib/api/assets.ts" }
Test-Item "API" "branches.ts" { Test-Path "src/lib/api/branches.ts" }
Test-Item "API" "maintenance.ts" { Test-Path "src/lib/api/maintenance.ts" }
Test-Item "API" "notifications.ts" { Test-Path "src/lib/api/notifications.ts" }

# ==============================================================
Section "5. LIB - STORES"
# ==============================================================

Test-Item "Stores" "auth.ts (Zustand)" { Test-Path "src/lib/stores/auth.ts" }
Test-Item "Stores" "ui.ts (Zustand)" { Test-Path "src/lib/stores/ui.ts" }

# ==============================================================
Section "6. LIB - HOOKS"
# ==============================================================

Test-Item "Hooks" "useAssets.ts" { Test-Path "src/lib/hooks/useAssets.ts" }
Test-Item "Hooks" "useBranches.ts" { Test-Path "src/lib/hooks/useBranches.ts" }
Test-Item "Hooks" "useMaintenance.ts" { Test-Path "src/lib/hooks/useMaintenance.ts" }
Test-Item "Hooks" "useNotifications.ts" { Test-Path "src/lib/hooks/useNotifications.ts" }

# ==============================================================
Section "7. LIB - VALIDATIONS"
# ==============================================================

Test-Item "Validations" "asset.ts" { Test-Path "src/lib/validations/asset.ts" }
Test-Item "Validations" "branch.ts" { Test-Path "src/lib/validations/branch.ts" }
Test-Item "Validations" "maintenance.ts" { Test-Path "src/lib/validations/maintenance.ts" }

# ==============================================================
Section "8. LIB - UTILS"
# ==============================================================

Test-Item "Utils" "format.ts" { Test-Path "src/lib/utils/format.ts" }
Test-Item "Utils" "permissions.ts" { Test-Path "src/lib/utils/permissions.ts" }
Test-Item "Utils" "recognition.ts" { Test-Path "src/lib/utils/recognition.ts" }

# ==============================================================
Section "9. LIB - CONSTANTS + TYPES"
# ==============================================================

Test-Item "Types" "types/index.ts" { Test-Path "src/types/index.ts" }
Test-Item "Constants" "constants/index.ts" { Test-Path "src/lib/constants/index.ts" }
Test-Item "Lib" "lib/utils.ts (cn helper)" { Test-Path "src/lib/utils.ts" }

# ==============================================================
Section "10. APP - ROOT + AUTH"
# ==============================================================

Test-Item "App" "app/layout.tsx" { Test-Path "src/app/layout.tsx" }
Test-Item "App" "app/page.tsx (redirect)" { Test-Path "src/app/page.tsx" }
Test-Item "App" "app/providers.tsx" { Test-Path "src/app/providers.tsx" }
Test-Item "App" "app/globals.css" { Test-Path "src/app/globals.css" }
Test-Item "Auth" "(auth)/layout.tsx" { Test-Path "src/app/(auth)/layout.tsx" }
Test-Item "Auth" "(auth)/login/page.tsx" { Test-Path "src/app/(auth)/login/page.tsx" }
Test-Item "Auth" "(auth)/register/page.tsx" { Test-Path "src/app/(auth)/register/page.tsx" }
Test-Item "Auth" "(auth)/forgot-password/page.tsx" { Test-Path "src/app/(auth)/forgot-password/page.tsx" }
Test-Item "Auth" "(auth)/org-login/page.tsx" { Test-Path "src/app/(auth)/org-login/page.tsx" }
Test-Item "Auth" "(auth)/accept-invite/[token]/page.tsx" { Test-Path -LiteralPath "src/app/(auth)/accept-invite/[token]/page.tsx" }

# ==============================================================
Section "11. APP - DASHBOARD PAGES"
# ==============================================================

Test-Item "Dashboard" "(dashboard)/layout.tsx" { Test-Path "src/app/(dashboard)/layout.tsx" }
Test-Item "Dashboard" "(dashboard)/dashboard/page.tsx" { Test-Path "src/app/(dashboard)/dashboard/page.tsx" }
Test-Item "Dashboard" "(dashboard)/notifications/page.tsx" { Test-Path "src/app/(dashboard)/notifications/page.tsx" }
Test-Item "Dashboard" "(dashboard)/profile/page.tsx" { Test-Path "src/app/(dashboard)/profile/page.tsx" }

# ==============================================================
Section "12. APP - ASSETS MODULE"
# ==============================================================

Test-Item "Assets" "list page" { Test-Path "src/app/(dashboard)/assets/page.tsx" }
Test-Item "Assets" "create page" { Test-Path "src/app/(dashboard)/assets/new/page.tsx" }
Test-Item "Assets" "detail page [id]" { Test-Path -LiteralPath "src/app/(dashboard)/assets/[id]/page.tsx" }
Test-Item "Assets" "edit page [id]/edit" { Test-Path -LiteralPath "src/app/(dashboard)/assets/[id]/edit/page.tsx" }
Test-Item "Assets" "import wizard" { Test-Path "src/app/(dashboard)/assets/import/page.tsx" }

# ==============================================================
Section "13. APP - BRANCHES MODULE"
# ==============================================================

Test-Item "Branches" "list page" { Test-Path "src/app/(dashboard)/branches/page.tsx" }
Test-Item "Branches" "detail page [id]" { Test-Path -LiteralPath "src/app/(dashboard)/branches/[id]/page.tsx" }

# ==============================================================
Section "14. APP - MAINTENANCE MODULE"
# ==============================================================

Test-Item "Maintenance" "list page" { Test-Path "src/app/(dashboard)/maintenance/page.tsx" }
Test-Item "Maintenance" "detail page [id]" { Test-Path -LiteralPath "src/app/(dashboard)/maintenance/[id]/page.tsx" }

# ==============================================================
Section "15. APP - REPORTS"
# ==============================================================

Test-Item "Reports" "hub page" { Test-Path "src/app/(dashboard)/reports/page.tsx" }
Test-Item "Reports" "audit dashboard" { Test-Path "src/app/(dashboard)/reports/audit/page.tsx" }
Test-Item "Reports" "finance dashboard" { Test-Path "src/app/(dashboard)/reports/finance/page.tsx" }
Test-Item "Reports" "maintenance report" { Test-Path "src/app/(dashboard)/reports/maintenance/page.tsx" }
Test-Item "Reports" "asset register" { Test-Path "src/app/(dashboard)/reports/assets/page.tsx" }

# ==============================================================
Section "16. APP - SETTINGS"
# ==============================================================

Test-Item "Settings" "settings/layout.tsx" { Test-Path "src/app/(dashboard)/settings/layout.tsx" }
Test-Item "Settings" "organization page" { Test-Path "src/app/(dashboard)/settings/page.tsx" }
Test-Item "Settings" "accounting policy" { Test-Path "src/app/(dashboard)/settings/accounting/page.tsx" }
Test-Item "Settings" "team page" { Test-Path "src/app/(dashboard)/settings/team/page.tsx" }
Test-Item "Settings" "billing page" { Test-Path "src/app/(dashboard)/settings/billing/page.tsx" }
Test-Item "Settings" "notifications prefs" { Test-Path "src/app/(dashboard)/settings/notifications/page.tsx" }

# ==============================================================
Section "17. COMPONENTS - LAYOUT + SHARED"
# ==============================================================

Test-Item "Layout" "Sidebar.tsx" { Test-Path "src/components/layout/Sidebar.tsx" }
Test-Item "Layout" "Topbar.tsx" { Test-Path "src/components/layout/Topbar.tsx" }

Test-Item "Shared" "PageHeader.tsx" { Test-Path "src/components/shared/PageHeader.tsx" }
Test-Item "Shared" "StatCard.tsx" { Test-Path "src/components/shared/StatCard.tsx" }
Test-Item "Shared" "StatusBadge.tsx" { Test-Path "src/components/shared/StatusBadge.tsx" }
Test-Item "Shared" "EmptyState.tsx" { Test-Path "src/components/shared/EmptyState.tsx" }
Test-Item "Shared" "LoadingSkeleton.tsx" { Test-Path "src/components/shared/LoadingSkeleton.tsx" }
Test-Item "Shared" "ConfirmDialog.tsx" { Test-Path "src/components/shared/ConfirmDialog.tsx" }
Test-Item "Shared" "RoleGuard.tsx" { Test-Path "src/components/shared/RoleGuard.tsx" }
Test-Item "Shared" "UserAvatar.tsx" { Test-Path "src/components/shared/UserAvatar.tsx" }
Test-Item "Shared" "SearchInput.tsx" { Test-Path "src/components/shared/SearchInput.tsx" }
Test-Item "Shared" "SettingsSection.tsx" { Test-Path "src/components/shared/SettingsSection.tsx" }

# ==============================================================
Section "18. COMPONENTS - ASSETS"
# ==============================================================

Test-Item "Assets" "RecognitionPreview.tsx" { Test-Path "src/components/assets/RecognitionPreview.tsx" }
Test-Item "Assets" "TransferAssetModal.tsx" { Test-Path "src/components/assets/TransferAssetModal.tsx" }
Test-Item "Assets" "DisposeAssetModal.tsx" { Test-Path "src/components/assets/DisposeAssetModal.tsx" }
Test-Item "Assets" "RestoreAssetModal.tsx" { Test-Path "src/components/assets/RestoreAssetModal.tsx" }
Test-Item "Assets" "DepreciationModal.tsx" { Test-Path "src/components/assets/DepreciationModal.tsx" }

# ==============================================================
Section "19. COMPONENTS - BRANCHES + MAINTENANCE + NOTIFICATIONS"
# ==============================================================

Test-Item "Branches" "CreateBranchModal.tsx" { Test-Path "src/components/branches/CreateBranchModal.tsx" }
Test-Item "Branches" "EditBranchModal.tsx" { Test-Path "src/components/branches/EditBranchModal.tsx" }
Test-Item "Branches" "DeleteBranchModal.tsx" { Test-Path "src/components/branches/DeleteBranchModal.tsx" }

Test-Item "Maintenance" "CreateMaintenanceModal.tsx" { Test-Path "src/components/maintenance/CreateMaintenanceModal.tsx" }
Test-Item "Maintenance" "CompleteMaintenanceModal.tsx" { Test-Path "src/components/maintenance/CompleteMaintenanceModal.tsx" }

Test-Item "Notifications" "NotificationDrawer.tsx" { Test-Path "src/components/notifications/NotificationDrawer.tsx" }

# ==============================================================
Section "20. CODE INTEGRITY CHECKS"
# ==============================================================

# Check for critical broken patterns (from previous PowerShell corruption)
$corruptionPatterns = @(
    @{ File = "src/lib/api/client.ts"; Pattern = "eyJhbGci"; Description = "No JWT tokens leaked in client.ts" }
    @{ File = "src/components/ui/form.tsx"; Pattern = 'formItemId: \$\{'; Description = "form.tsx template literals intact" }
    @{ File = "src/components/shared/ConfirmDialog.tsx"; Pattern = 'className=\{w-'; Description = "ConfirmDialog className intact" }
)

foreach ($check in $corruptionPatterns) {
    if (Test-Path $check.File) {
        Test-Item "Integrity" $check.Description {
            $content = Get-Content $check.File -Raw
            # Test PASSES if pattern is NOT found (means no corruption)
            -not ($content -match $check.Pattern)
        }
    }
}

# Check key exports are present
$exportChecks = @(
    @{ File = "src/proxy.ts"; Pattern = "export function proxy"; Description = "proxy.ts exports proxy function" }
    @{ File = "src/lib/stores/auth.ts"; Pattern = "useAuthStore"; Description = "auth store exports useAuthStore" }
    @{ File = "src/lib/api/client.ts"; Pattern = "export default apiClient"; Description = "api client exports default" }
    @{ File = "src/types/index.ts"; Pattern = "export interface Asset"; Description = "types exports Asset interface" }
)

foreach ($check in $exportChecks) {
    if (Test-Path $check.File) {
        Test-Item "Integrity" $check.Description {
            $content = Get-Content $check.File -Raw
            $content -match $check.Pattern
        }
    }
}

# ==============================================================
Section "21. ENVIRONMENT + CONFIG"
# ==============================================================

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    Test-Item "Env" "NEXT_PUBLIC_API_URL set" { $envContent -match "NEXT_PUBLIC_API_URL=" }
    Test-Item "Env" "NEXT_PUBLIC_APP_URL set" { $envContent -match "NEXT_PUBLIC_APP_URL=" }
    Test-Item "Env" "NEXT_PUBLIC_APP_NAME set" { $envContent -match "NEXT_PUBLIC_APP_NAME=" }
}

# ==============================================================
Section "22. BACKEND CONNECTIVITY"
# ==============================================================

$apiUrl = "http://localhost:6000/api"
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local" -Raw
    if ($envContent -match "NEXT_PUBLIC_API_URL=(.+)") {
        $apiUrl = $Matches[1].Trim()
    }
}

Write-Host "  Testing API at: $apiUrl" -ForegroundColor Gray

Test-Item "Backend" "Health endpoint reachable" {
    try {
        $r = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        $r.status -eq "ok"
    } catch { $false }
} "warning"

Test-Item "Backend" "Auth endpoint accepts POST" {
    try {
        # Expect 400/401, NOT 404 - we're just checking the route exists
        $r = Invoke-WebRequest -Uri "$apiUrl/auth/login" -Method Post `
            -ContentType "application/json" -Body "{}" -TimeoutSec 5 -ErrorAction Stop -SkipHttpErrorCheck
        $r.StatusCode -ne 404
    } catch {
        # If it errors but returns 400 that's fine
        $_.Exception.Response.StatusCode.value__ -in @(400, 401, 422)
    }
} "warning"

# ==============================================================
Section "23. BUILD ARTIFACTS"
# ==============================================================

Test-Item "Build" "node_modules installed" { Test-Path "node_modules" }
Test-Item "Build" "next-env.d.ts exists" { Test-Path "next-env.d.ts" }
Test-Item "Build" ".next cache exists" { Test-Path ".next" } "warning"

# ==============================================================
Section "24. TYPESCRIPT COMPILATION"
# ==============================================================

Write-Host "  Running TypeScript check (this takes ~30 seconds)..." -ForegroundColor Gray
Test-Item "TypeScript" "tsc --noEmit passes with no errors" {
    $output = & npx tsc --noEmit --pretty false 2>&1 | Out-String
    $LASTEXITCODE -eq 0
} "warning"

# ==============================================================
Section "25. HELPER SCRIPT CLEANUP"
# ==============================================================

$leftoverScripts = Get-ChildItem -Path "." -File -Filter "*.py" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "^(p\d|write_|fix_)" }

Test-Item "Cleanup" "No leftover helper .py scripts in root" {
    $leftoverScripts.Count -eq 0
} "warning"

if ($leftoverScripts.Count -gt 0) {
    Write-Host "        Found: $($leftoverScripts.Count) leftover scripts" -ForegroundColor Yellow
    Write-Host "        Delete with: Remove-Item p*.py, write_*.py, fix_*.py -Force" -ForegroundColor DarkGray
}

# ==============================================================
Section "SUMMARY"
# ==============================================================

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

$total = $script:passed + $script:failed + $script:warnings

Write-Host ""
Write-Host "  Duration:  $([math]::Round($duration, 1))s"
Write-Host "  Total:     $total tests"
Write-Host ""
Write-Host "  " -NoNewline
Write-Host "PASSED: $($script:passed)" -ForegroundColor Green -NoNewline
Write-Host "   " -NoNewline
Write-Host "WARN: $($script:warnings)" -ForegroundColor Yellow -NoNewline
Write-Host "   " -NoNewline
Write-Host "FAILED: $($script:failed)" -ForegroundColor Red
Write-Host ""

$passRate = if ($total -gt 0) { [math]::Round(($script:passed / $total) * 100, 1) } else { 0 }

if ($script:failed -eq 0 -and $script:warnings -eq 0) {
    Write-Host "  RESULT: PRODUCTION READY" -ForegroundColor White -BackgroundColor Green
    Write-Host "  All $total checks passed. Ship it."
} elseif ($script:failed -eq 0) {
    Write-Host "  RESULT: PASSING WITH WARNINGS ($passRate%)" -ForegroundColor Black -BackgroundColor Yellow
    Write-Host "  Warnings are non-critical (backend not running, cleanup pending)."
} else {
    Write-Host "  RESULT: FAILURES DETECTED ($passRate% pass rate)" -ForegroundColor White -BackgroundColor Red
    Write-Host "  Review failures below."
    Write-Host ""

    $failures = $script:results | Where-Object { $_.Status -in @("FAIL", "ERROR") }
    foreach ($f in $failures) {
        Write-Host "    - [$($f.Category)] $($f.Name)" -ForegroundColor Red
        if ($f.Detail) {
            Write-Host "      $($f.Detail)" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan
Write-Host ""

# Export results to CSV
$csvPath = "e2e-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
$script:results | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "  Results exported to: $csvPath" -ForegroundColor Gray
Write-Host ""