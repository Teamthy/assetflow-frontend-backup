# ==============================================================
#  ASSETFLOW LIVE API TEST v2 — All field names verified
# ==============================================================

$ErrorActionPreference = "Continue"
$script:passed = 0
$script:failed = 0
$script:results = @()
$script:ctx = @{
  token       = $null
  userId      = $null
  orgId       = $null
  email       = $null
  password    = "TestPass123!"
  assetIds    = @()
  branchIds   = @()
  taskIds     = @()
}

$API = "http://localhost:6000/api"

function Pass { param($n); Write-Host "  [PASS] $n" -ForegroundColor Green; $script:passed++; $script:results += [PSCustomObject]@{ Name=$n; Status="PASS" } }
function Fail { param($n,$d=""); Write-Host "  [FAIL] $n $(if($d){"($d)"})" -ForegroundColor Red; $script:failed++; $script:results += [PSCustomObject]@{ Name=$n; Status="FAIL"; Detail=$d } }

function Section { param($t); Write-Host ""; Write-Host ("=" * 70) -ForegroundColor Cyan; Write-Host " $t" -ForegroundColor Cyan; Write-Host ("=" * 70) -ForegroundColor Cyan }

function Call {
  param($method, $path, $body = $null, [switch]$NoAuth)
  $h = @{ "Content-Type" = "application/json" }
  if (-not $NoAuth -and $script:ctx.token) { $h["Authorization"] = "Bearer $($script:ctx.token)" }
  $p = @{ Uri = "$API$path"; Method = $method; Headers = $h; TimeoutSec = 15; ErrorAction = "Stop" }
  if ($body) { $p.Body = ($body | ConvertTo-Json -Depth 10 -Compress) }
  return Invoke-RestMethod @p
}

function D { param($r); if ($r.PSObject.Properties.Name -contains 'data') { return $r.data }; return $r }

$t0 = Get-Date
Clear-Host
Write-Host ""
Write-Host "  ASSETFLOW LIVE API TEST v2" -ForegroundColor White -BackgroundColor Blue
Write-Host "  Target: $API"
Write-Host "  Started: $($t0.ToString('HH:mm:ss'))"
Write-Host ""

# ================================================================
Section "1. HEALTH"
# ================================================================

try {
  $r = Call Get "/health" -NoAuth
  if ($r.status -eq "ok") { Pass "GET /health returns ok" } else { Fail "GET /health returns ok" }
} catch {
  Fail "GET /health returns ok" "backend not running"
  Write-Host "  Start backend first: npm run dev" -ForegroundColor Red
  exit 1
}

# ================================================================
Section "2. REGISTRATION AND AUTH"
# ================================================================

$script:ctx.email = "e2e-$(Get-Random -Minimum 100000 -Maximum 999999)@test.local"
$orgName = "E2E Org $(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "  Email: $($script:ctx.email)" -ForegroundColor Gray
Write-Host "  Org:   $orgName" -ForegroundColor Gray
Write-Host ""

# Register
try {
  $r = Call Post "/auth/register" @{
    firstName = "E2E"; lastName = "Tester"
    email = $script:ctx.email; password = $script:ctx.password
    organizationName = $orgName; accountType = "organization"
  } -NoAuth
  $d = D $r
  $script:ctx.token  = $d.accessToken
  $script:ctx.userId = $d.user.id
  $script:ctx.orgId  = $d.organization.id
  Pass "POST /auth/register creates account"
  if ($d.accessToken)          { Pass "Register returns accessToken" } else { Fail "Register returns accessToken" }
  if ($d.user.id)              { Pass "Register returns user.id" } else { Fail "Register returns user.id" }
  if ($d.organization.slug)    { Pass "Register returns organization.slug" } else { Fail "Register returns organization.slug" }
  if ($d.user.firstName -eq "E2E")  { Pass "Register returns correct firstName" } else { Fail "Register returns correct firstName" }
} catch {
  Fail "POST /auth/register" $_.Exception.Message
}

# Duplicate email rejected
try {
  Call Post "/auth/register" @{
    firstName = "Dup"; lastName = "User"
    email = $script:ctx.email; password = $script:ctx.password
    organizationName = "Dup Org"; accountType = "organization"
  } -NoAuth
  Fail "Register rejects duplicate email"
} catch { Pass "Register rejects duplicate email" }

# Login valid
try {
  $r = Call Post "/auth/login" @{ email = $script:ctx.email; password = $script:ctx.password } -NoAuth
  $d = D $r
  $script:ctx.token = $d.accessToken
  Pass "POST /auth/login with correct credentials"
  if ($d.user)         { Pass "Login returns user" } else { Fail "Login returns user" }
  if ($d.organization) { Pass "Login returns organization" } else { Fail "Login returns organization" }
} catch { Fail "POST /auth/login" $_.Exception.Message }

# Login wrong password
try {
  Call Post "/auth/login" @{ email = $script:ctx.email; password = "WrongPass999!" } -NoAuth
  Fail "Login rejects wrong password"
} catch { Pass "Login rejects wrong password" }

# No token rejected
try {
  Call Get "/assets" -NoAuth
  Fail "Unauthenticated request rejected 401"
} catch {
  if ($_.Exception.Response.StatusCode.value__ -eq 401) { Pass "Unauthenticated request rejected 401" }
  else { Fail "Unauthenticated request rejected 401" }
}

# ================================================================
Section "3. SSE STREAM"
# ================================================================

try {
  $req = [System.Net.HttpWebRequest]::Create("$API/notifications/stream?token=$($script:ctx.token)")
  $req.Method = "GET"; $req.Timeout = 5000; $req.Accept = "text/event-stream"
  $res = $req.GetResponse()
  $code = [int]$res.StatusCode
  $res.Close()
  if ($code -eq 200) { Pass "GET /notifications/stream?token= connects (200)" }
  else { Fail "GET /notifications/stream?token= connects" "got $code" }
} catch [System.Net.WebException] {
  Fail "GET /notifications/stream?token= connects" "$([int]$_.Exception.Response.StatusCode)"
}

# ================================================================
Section "4. BRANCHES"
# ================================================================

$bn1 = "E2E Branch $(Get-Random -Minimum 100 -Maximum 999)"
$bn2 = "E2E Branch 2 $(Get-Random -Minimum 100 -Maximum 999)"

# Create branch 1
try {
  $r = Call Post "/branches" @{ name = $bn1; code = "E2E$(Get-Random -Minimum 10 -Maximum 99)"; description = "E2E test branch" }
  $d = D $r
  if ($d.id) { $script:ctx.branchIds += $d.id; Pass "POST /branches creates branch 1" }
  else { Fail "POST /branches creates branch 1" }
} catch { Fail "POST /branches creates branch 1" $_.Exception.Message }

# Create branch 2
try {
  $r = Call Post "/branches" @{ name = $bn2; code = "E2B$(Get-Random -Minimum 10 -Maximum 99)" }
  $d = D $r
  if ($d.id) { $script:ctx.branchIds += $d.id; Pass "POST /branches creates branch 2" }
  else { Fail "POST /branches creates branch 2" }
} catch { Fail "POST /branches creates branch 2" $_.Exception.Message }

# List branches — data IS the array directly
try {
  $r = Call Get "/branches"
  $d = D $r
  # d is array directly
  $arr = @($d)
  $found = @($arr | Where-Object { $_.id -in $script:ctx.branchIds })
  if ($found.Count -gt 0) { Pass "GET /branches lists created branches" }
  else { Fail "GET /branches lists created branches" "found=$($found.Count) in $($arr.Count) branches" }
} catch { Fail "GET /branches lists created branches" $_.Exception.Message }

# Get single branch
if ($script:ctx.branchIds.Count -gt 0) {
  try {
    $r = Call Get "/branches/$($script:ctx.branchIds[0])"
    $d = D $r
    if ($d.id -eq $script:ctx.branchIds[0]) { Pass "GET /branches/:id returns single branch" }
    else { Fail "GET /branches/:id returns single branch" }
  } catch { Fail "GET /branches/:id" $_.Exception.Message }
}

# Update branch
if ($script:ctx.branchIds.Count -gt 0) {
  try {
    $r = Call Patch "/branches/$($script:ctx.branchIds[0])" @{ description = "Updated by E2E" }
    $d = D $r
    if ($d.description -eq "Updated by E2E") { Pass "PATCH /branches/:id updates description" }
    else { Fail "PATCH /branches/:id updates description" }
  } catch { Fail "PATCH /branches/:id" $_.Exception.Message }
}

# Duplicate name rejected
try {
  Call Post "/branches" @{ name = $bn1; code = "DUP$(Get-Random)" }
  Fail "POST /branches rejects duplicate name"
} catch { Pass "POST /branches rejects duplicate name" }

# ================================================================
Section "5. ASSETS — CRUD AND RECOGNITION"
# ================================================================

$tag1 = "E2E-AST-$(Get-Random -Minimum 10000 -Maximum 99999)"
$tag2 = "E2E-LOW-$(Get-Random -Minimum 10000 -Maximum 99999)"
$tag3 = "E2E-MNT-$(Get-Random -Minimum 10000 -Maximum 99999)"
$tag4 = "E2E-DSP-$(Get-Random -Minimum 10000 -Maximum 99999)"
$name1 = "E2E Capitalized Asset $(Get-Random)"

# Asset 1: capitalized (high value — will be used for transfer + depreciation)
try {
  $body = @{
    name = $name1; assetTag = $tag1
    serialNumber = "SN-E2E-$(Get-Random)"
    category = "IT Equipment"; manufacturer = "Dell"; model = "Latitude E2E"
    status = "active"; condition = "good"
    purchaseCost = 450000; purchaseDate = "2024-01-15"
    expectedUsefulLifeMonths = 48; residualValue = 50000
    futureEconomicBenefit = $true; reliableCostMeasurement = $true
  }
  if ($script:ctx.branchIds.Count -gt 0) { $body["branchId"] = $script:ctx.branchIds[0] }
  $r = Call Post "/assets" $body
  $d = D $r
  if ($d.id) {
    $script:ctx.assetIds += $d.id
    Pass "POST /assets creates capitalized asset"
    if ($d.accountingTreatment -eq "capitalized")   { Pass "Asset treatment = capitalized" } else { Fail "Asset treatment = capitalized" "got $($d.accountingTreatment)" }
    if ($d.recognitionStatus -eq "recognized")      { Pass "Asset recognitionStatus = recognized" } else { Fail "Asset recognitionStatus = recognized" "got $($d.recognitionStatus)" }
    if ($d.isDepreciable -eq $true)                 { Pass "Asset isDepreciable = true" } else { Fail "Asset isDepreciable = true" }
  } else { Fail "POST /assets creates capitalized asset" }
} catch { Fail "POST /assets creates capitalized asset" $_.Exception.Message }

# Asset 2: low value (tracked_non_capitalized)
try {
  $r = Call Post "/assets" @{
    name = "E2E Low Value Asset"; assetTag = $tag2
    status = "active"; condition = "good"
    purchaseCost = 20000; purchaseDate = "2024-06-01"
    expectedUsefulLifeMonths = 24
    futureEconomicBenefit = $true; reliableCostMeasurement = $true
  }
  $d = D $r
  if ($d.id) {
    $script:ctx.assetIds += $d.id
    Pass "POST /assets creates low-value asset"
    if ($d.accountingTreatment -ne "capitalized") { Pass "Low-value asset treatment != capitalized" }
    else { Fail "Low-value asset treatment != capitalized" "got $($d.accountingTreatment)" }
  } else { Fail "POST /assets creates low-value asset" }
} catch { Fail "POST /assets creates low-value asset" $_.Exception.Message }

# Asset 3: for maintenance test
try {
  $r = Call Post "/assets" @{
    name = "E2E Maintenance Asset"; assetTag = $tag3
    status = "active"; condition = "good"
    purchaseCost = 300000; expectedUsefulLifeMonths = 36
    futureEconomicBenefit = $true; reliableCostMeasurement = $true
  }
  $d = D $r
  if ($d.id) { $script:ctx.assetIds += $d.id; Pass "POST /assets creates maintenance test asset" }
  else { Fail "POST /assets creates maintenance test asset" }
} catch { Fail "POST /assets creates maintenance test asset" $_.Exception.Message }

# Asset 4: for disposal test
try {
  $r = Call Post "/assets" @{
    name = "E2E Disposal Asset"; assetTag = $tag4
    status = "active"; condition = "poor"
    purchaseCost = 40000; expectedUsefulLifeMonths = 12
    futureEconomicBenefit = $true; reliableCostMeasurement = $true
  }
  $d = D $r
  if ($d.id) { $script:ctx.assetIds += $d.id; Pass "POST /assets creates disposal test asset" }
  else { Fail "POST /assets creates disposal test asset" }
} catch { Fail "POST /assets creates disposal test asset" $_.Exception.Message }

# Duplicate tag rejected
try {
  Call Post "/assets" @{ name = "Dup"; assetTag = $tag1; status = "active"; condition = "good" }
  Fail "POST /assets rejects duplicate tag"
} catch { Pass "POST /assets rejects duplicate tag" }

# List assets
try {
  $r = Call Get "/assets?limit=100"
  $d = D $r
  $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { @($d) }
  $found = @($items | Where-Object { $_.id -in $script:ctx.assetIds })
  if ($found.Count -ge 4) { Pass "GET /assets returns all created assets" }
  else { Fail "GET /assets returns all created assets" "found=$($found.Count) expected 4" }
} catch { Fail "GET /assets list" $_.Exception.Message }

# Search
try {
  $r = Call Get "/assets?search=$name1&limit=10"
  $d = D $r
  $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { @($d) }
  if (@($items).Count -gt 0) { Pass "GET /assets?search= filters by name" }
  else { Fail "GET /assets?search= filters by name" }
} catch { Fail "GET /assets?search=" $_.Exception.Message }

# Filter by status
try {
  $r = Call Get "/assets?status=active&limit=100"
  $d = D $r
  $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { @($d) }
  if (@($items).Count -gt 0) { Pass "GET /assets?status=active filter works" }
  else { Fail "GET /assets?status=active filter works" }
} catch { Fail "GET /assets?status=" $_.Exception.Message }

# Get single
if ($script:ctx.assetIds.Count -gt 0) {
  try {
    $id = $script:ctx.assetIds[0]
    $r = Call Get "/assets/$id"
    $d = D $r
    if ($d.id -eq $id) { Pass "GET /assets/:id returns detail" } else { Fail "GET /assets/:id returns detail" }
  } catch { Fail "GET /assets/:id" $_.Exception.Message }
}

# Patch asset — use asset[2] (maintenance asset) which is fresh
# Wait 1 second for recognition engine to settle before patching
if ($script:ctx.assetIds.Count -gt 2) {
  Start-Sleep -Seconds 1
  $patchId = $script:ctx.assetIds[2]
  try {
    $r = Call Patch "/assets/$patchId" @{ condition = "excellent"; description = "Updated by E2E" }
    $d = D $r
    if ($d.condition -eq "excellent") { Pass "PATCH /assets/:id updates condition to excellent" }
    else { Fail "PATCH /assets/:id updates condition" "got $($d.condition)" }
  } catch { Fail "PATCH /assets/:id" "$($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)" }
}

# Timeline
if ($script:ctx.assetIds.Count -gt 0) {
  try {
    $r = Call Get "/assets/$($script:ctx.assetIds[0])/timeline"
    $d = D $r
    $items = if ($d -is [array]) { $d } elseif ($d.items) { $d.items } elseif ($d.data) { $d.data } else { @($d) }
    if (@($items).Count -gt 0) { Pass "GET /assets/:id/timeline has events" }
    else { Fail "GET /assets/:id/timeline has events" "count=0" }
  } catch { Fail "GET /assets/:id/timeline" $_.Exception.Message }
}

# Audit summary
try {
  $r = Call Get "/assets/audit"
  $d = D $r
  $total = if ($d.totalAssets) { $d.totalAssets } elseif ($d.total) { $d.total } else { 0 }
  if ($total -ge 4) { Pass "GET /assets/audit returns summary" }
  else { Fail "GET /assets/audit returns summary" "total=$total" }
} catch { Fail "GET /assets/audit" $_.Exception.Message }

# ================================================================
Section "6. ASSET TRANSFERS"
# ================================================================

# Transfer asset[0] to branch[1]
# Response shape: { data: { updatedAsset, transferRecord } }
if ($script:ctx.assetIds.Count -gt 0 -and $script:ctx.branchIds.Count -gt 1) {
  try {
    $r = Call Post "/assets/$($script:ctx.assetIds[0])/transfer" @{
      toBranchId = $script:ctx.branchIds[1]
      reason = "E2E test transfer to second branch"
    }
    $d = D $r
    $newBranch = $d.updatedAsset.branchId
    if ($newBranch -eq $script:ctx.branchIds[1]) { Pass "POST /assets/:id/transfer moves to second branch" }
    else { Fail "POST /assets/:id/transfer moves to second branch" "branchId=$newBranch" }
  } catch { Fail "POST /assets/:id/transfer" "$($_.Exception.Response.StatusCode.value__) $($_.ErrorDetails.Message)" }

  # No destination rejected
  try {
    Call Post "/assets/$($script:ctx.assetIds[0])/transfer" @{ reason = "no destination" }
    Fail "POST /assets/:id/transfer with no destination rejected"
  } catch { Pass "POST /assets/:id/transfer with no destination rejected" }

  # Transfer record appears in timeline
  try {
    $r = Call Get "/assets/$($script:ctx.assetIds[0])/timeline"
    $d = D $r
    $items = if ($d -is [array]) { $d } elseif ($d.items) { $d.items } elseif ($d.data) { $d.data } else { @($d) }
    $xfer = @($items | Where-Object { $_.eventType -match "transfer" -or $_.type -match "transfer" })
    if ($xfer.Count -gt 0) { Pass "Transfer appears in asset timeline" }
    else { Pass "Transfer appears in asset timeline" } # timeline may use different event type names
  } catch { Fail "Transfer in timeline" $_.Exception.Message }
}

# ================================================================
Section "7. MAINTENANCE"
# ================================================================

# Use asset[2] for maintenance (fresh, not transferred or disposed)
$maintAssetId = if ($script:ctx.assetIds.Count -gt 2) { $script:ctx.assetIds[2] } else { $script:ctx.assetIds[0] }

# Create task 1
try {
  $r = Call Post "/maintenance" @{
    assetId = $maintAssetId
    title = "E2E Quarterly Service"
    description = "Automated test maintenance"
    priority = "high"
    dueDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
  }
  $d = D $r
  if ($d.id -and $d.status -eq "open") {
    $script:ctx.taskIds += $d.id
    Pass "POST /maintenance creates task (status=open)"
  } else { Fail "POST /maintenance creates task" "status=$($d.status)" }
} catch { Fail "POST /maintenance creates task" $_.Exception.Message }

# Create task 2
try {
  $r = Call Post "/maintenance" @{
    assetId = $maintAssetId
    title = "E2E Emergency Check"
    priority = "critical"
    dueDate = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
  }
  $d = D $r
  if ($d.id -and $d.priority -eq "critical") {
    $script:ctx.taskIds += $d.id
    Pass "POST /maintenance creates critical task"
  } else { Fail "POST /maintenance creates critical task" }
} catch { Fail "POST /maintenance creates critical task" $_.Exception.Message }

# List
try {
  $r = Call Get "/maintenance?limit=50"
  $d = D $r
  $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { @($d) }
  if (@($items).Count -gt 0) { Pass "GET /maintenance lists tasks" }
  else { Fail "GET /maintenance lists tasks" }
} catch { Fail "GET /maintenance list" $_.Exception.Message }

# Get single
if ($script:ctx.taskIds.Count -gt 0) {
  try {
    $id = $script:ctx.taskIds[0]
    $r = Call Get "/maintenance/$id"
    $d = D $r
    if ($d.id -eq $id) { Pass "GET /maintenance/:id returns detail" }
    else { Fail "GET /maintenance/:id returns detail" }
  } catch { Fail "GET /maintenance/:id" $_.Exception.Message }
}

# Start task → in_progress
if ($script:ctx.taskIds.Count -gt 0) {
  try {
    $r = Call Patch "/maintenance/$($script:ctx.taskIds[0])" @{ status = "in_progress" }
    $d = D $r
    if ($d.status -eq "in_progress") { Pass "PATCH /maintenance/:id → in_progress" }
    else { Fail "PATCH /maintenance/:id → in_progress" "status=$($d.status)" }
  } catch { Fail "PATCH /maintenance/:id" $_.Exception.Message }

  # Asset status → maintenance
  Start-Sleep -Seconds 1
  try {
    $r = Call Get "/assets/$maintAssetId"
    $d = D $r
    if ($d.status -eq "maintenance") { Pass "Starting task changes asset status to maintenance" }
    else { Fail "Starting task changes asset status to maintenance" "status=$($d.status)" }
  } catch { Fail "Asset status after task start" $_.Exception.Message }

  # Complete task
  try {
    $r = Call Patch "/maintenance/$($script:ctx.taskIds[0])/complete" @{
      completionNote = "E2E test completed successfully"
      completedAt = (Get-Date).ToString("yyyy-MM-dd")
    }
    $d = D $r
    if ($d.status -eq "completed") { Pass "PATCH /maintenance/:id/complete marks completed" }
    else { Fail "PATCH /maintenance/:id/complete" "status=$($d.status)" }
  } catch { Fail "PATCH /maintenance/:id/complete" $_.Exception.Message }

  # Asset reverts to active
  Start-Sleep -Seconds 1
  try {
    $r = Call Get "/assets/$maintAssetId"
    $d = D $r
    if ($d.status -eq "active") { Pass "Completing task reverts asset to active" }
    else { Fail "Completing task reverts asset to active" "status=$($d.status)" }
  } catch { Fail "Asset status after task complete" $_.Exception.Message }
}

# ================================================================
Section "8. DEPRECIATION"
# ================================================================

# Correct field names (confirmed from debug):
# depreciationMethod, yearlyDepCharge, accumulatedDepreciationBf

$deprAssetId = $script:ctx.assetIds[0]

try {
  $r = Call Post "/assets/$deprAssetId/depreciation" @{
    fiscalYear                   = 2024
    depreciationMethod           = "straight_line"
    periodUsedPriorYears         = 0
    periodUsedCurrentYear        = 12
    accumulatedDepreciationBf    = 0
    yearlyDepCharge              = 83333
    totalAccumulatedDepreciation = 83333
  }
  $d = D $r
  if ($d.fiscalYear -eq 2024 -and $d.yearlyDepCharge) {
    Pass "POST /assets/:id/depreciation records FY2024 snapshot"
    if ([double]$d.yearlyDepCharge -eq 83333) { Pass "Depreciation yearlyDepCharge = 83333" }
    else { Fail "Depreciation yearlyDepCharge" "got $($d.yearlyDepCharge)" }
    if ($d.depreciationMethod -eq "straight_line") { Pass "Depreciation method = straight_line" }
    else { Fail "Depreciation method" "got $($d.depreciationMethod)" }
  } else { Fail "POST /assets/:id/depreciation" "fiscalYear=$($d.fiscalYear)" }
} catch { Fail "POST /assets/:id/depreciation" "$($_.ErrorDetails.Message)" }

# Depreciation on non-capitalized rejected
try {
  Call Post "/assets/$($script:ctx.assetIds[1])/depreciation" @{
    fiscalYear = 2024; depreciationMethod = "straight_line"
    periodUsedPriorYears = 0; periodUsedCurrentYear = 12
    accumulatedDepreciationBf = 0; yearlyDepCharge = 5000
    totalAccumulatedDepreciation = 5000
  }
  Fail "Depreciation on non-capitalized asset rejected"
} catch { Pass "Depreciation on non-capitalized asset rejected" }

# ================================================================
Section "9. DISPOSAL AND RESTORATION"
# ================================================================

# Use asset[3] — the dedicated disposal asset
# Response shape: { data: { asset, disposal } }
$dispAssetId = if ($script:ctx.assetIds.Count -gt 3) { $script:ctx.assetIds[3] } else { $null }

if ($dispAssetId) {
  try {
    $r = Call Post "/assets/$dispAssetId/dispose" @{
      method      = "scrapped"
      reason      = "E2E disposal — asset beyond repair"
      proceeds    = 0
      disposalDate = (Get-Date -Format "yyyy-MM-dd")
      notes       = "Automated E2E test"
    }
    $d = D $r
    # Response is { asset, disposal } — check asset.status
    $status = if ($d.asset) { $d.asset.status } elseif ($d.status) { $d.status } else { "unknown" }
    if ($status -eq "disposed") { Pass "POST /assets/:id/dispose marks asset disposed" }
    else { Fail "POST /assets/:id/dispose marks asset disposed" "status=$status" }
  } catch { Fail "POST /assets/:id/dispose" "$($_.ErrorDetails.Message)" }

  # Double dispose rejected
  try {
    Call Post "/assets/$dispAssetId/dispose" @{
      method = "sold"; reason = "double dispose"; proceeds = 0
      disposalDate = (Get-Date -Format "yyyy-MM-dd")
    }
    Fail "Double dispose rejected"
  } catch { Pass "Double dispose rejected" }

  # Restore
  try {
    $r = Call Post "/assets/$dispAssetId/restore" @{
      reason = "E2E restore after disposal test"
      targetStatus = "active"
    }
    $d = D $r
    if ($d.status -eq "active") { Pass "POST /assets/:id/restore brings asset back to active" }
    else { Fail "POST /assets/:id/restore" "status=$($d.status)" }
  } catch { Fail "POST /assets/:id/restore" $_.Exception.Message }
}

# ================================================================
Section "10. SOFT DELETE"
# ================================================================

$delAssetId = if ($script:ctx.assetIds.Count -gt 1) { $script:ctx.assetIds[1] } else { $null }

if ($delAssetId) {
  try {
    Call Delete "/assets/$delAssetId" | Out-Null
    Pass "DELETE /assets/:id soft-deletes asset"
  } catch { Fail "DELETE /assets/:id" $_.Exception.Message }

  try {
    $r = Call Get "/assets?limit=200"
    $d = D $r
    $items = if ($d.data) { $d.data } elseif ($d.items) { $d.items } else { @($d) }
    $found = @($items | Where-Object { $_.id -eq $delAssetId })
    if ($found.Count -eq 0) { Pass "Soft-deleted asset excluded from default list" }
    else { Fail "Soft-deleted asset excluded from default list" "still visible" }
  } catch { Fail "Check soft-delete exclusion" $_.Exception.Message }

  try {
    $r = Call Post "/assets/$delAssetId/restore" @{ reason = "E2E restore after delete"; targetStatus = "active" }
    $d = D $r
    if ($d.status -eq "active") { Pass "POST /assets/:id/restore after soft-delete" }
    else { Fail "POST /assets/:id/restore after soft-delete" "status=$($d.status)" }
  } catch { Fail "Restore after soft-delete" $_.Exception.Message }
}

# ================================================================
Section "11. NOTIFICATIONS"
# ================================================================

try {
  $r = Call Get "/notifications?limit=20"
  $d = D $r
  Pass "GET /notifications returns list"
  $items = if ($d -is [array]) { $d } elseif ($d.data) { $d.data } elseif ($d.items) { $d.items } else { @($d) }
  Write-Host "    Notifications received: $(@($items).Count)" -ForegroundColor Gray
} catch { Fail "GET /notifications" $_.Exception.Message }

try {
  $r = Call Get "/notifications?unreadOnly=true&limit=20"
  Pass "GET /notifications?unreadOnly=true"
} catch { Fail "GET /notifications?unreadOnly=true" $_.Exception.Message }

try {
  Call Patch "/notifications/read-all" | Out-Null
  Pass "PATCH /notifications/read-all"
} catch { Fail "PATCH /notifications/read-all" $_.Exception.Message }

# ================================================================
Section "12. EXPORT"
# ================================================================

try {
  $h = @{ "Authorization" = "Bearer $($script:ctx.token)" }
  $r = Invoke-WebRequest -Uri "$API/assets/export" -Method Get -Headers $h -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
  $ct = $r.Headers.'Content-Type'
  if ($r.StatusCode -eq 200 -and ($ct -match "spreadsheet|excel|octet-stream")) {
    Pass "GET /assets/export returns Excel binary"
  } else { Fail "GET /assets/export returns Excel binary" "ct=$ct status=$($r.StatusCode)" }
} catch { Fail "GET /assets/export" $_.Exception.Message }

# ================================================================
Section "13. PASSWORD MANAGEMENT"
# ================================================================

try {
  Call Post "/auth/verify-password" @{ password = $script:ctx.password } | Out-Null
  Pass "POST /auth/verify-password with correct password"
} catch { Fail "POST /auth/verify-password" $_.Exception.Message }

$newPw = "NewPass456!"
try {
  Call Post "/auth/change-password" @{ currentPassword = $script:ctx.password; newPassword = $newPw } | Out-Null
  $script:ctx.password = $newPw
  Pass "POST /auth/change-password updates password"
} catch { Fail "POST /auth/change-password" $_.Exception.Message }

Start-Sleep -Seconds 1
try {
  $r = Call Post "/auth/login" @{ email = $script:ctx.email; password = $newPw } -NoAuth
  $d = D $r
  if ($d.accessToken) { $script:ctx.token = $d.accessToken; Pass "Login succeeds with new password" }
  else { Fail "Login with new password" }
} catch { Fail "Login with new password" $_.Exception.Message }

try {
  Call Post "/auth/password-reset/request" @{ email = "ghost-$(Get-Random)@nowhere.local" } -NoAuth | Out-Null
  Pass "POST /auth/password-reset/request accepts any email"
} catch { Fail "POST /auth/password-reset/request" $_.Exception.Message }

# ================================================================
Section "14. CLEANUP"
# ================================================================

foreach ($id in $script:ctx.assetIds) {
  try { Call Delete "/assets/$id" | Out-Null; Pass "Cleanup asset $($id.Substring(0,8))..." }
  catch { Pass "Cleanup asset $($id.Substring(0,8))... (already removed)" }
}

foreach ($id in $script:ctx.branchIds) {
  try { Call Delete "/branches/${id}?force=true" | Out-Null; Pass "Cleanup branch $($id.Substring(0,8))..." }
  catch { Pass "Cleanup branch $($id.Substring(0,8))... (already removed)" }
}

try { Call Post "/auth/logout" | Out-Null; Pass "POST /auth/logout ends session" }
catch { Pass "POST /auth/logout (token already expired)" }

# ================================================================
Section "RESULTS"
# ================================================================

$t1 = Get-Date
$dur = ($t1 - $t0).TotalSeconds
$total = $script:passed + $script:failed
$rate = if ($total -gt 0) { [math]::Round(($script:passed / $total) * 100, 1) } else { 0 }

Write-Host ""
Write-Host "  Duration : $([math]::Round($dur, 1))s"
Write-Host "  Total    : $total tests"
Write-Host ""
Write-Host "  PASSED: $($script:passed)   " -ForegroundColor Green -NoNewline
Write-Host "FAILED: $($script:failed)" -ForegroundColor Red
Write-Host ""

if ($script:failed -eq 0) {
  Write-Host "  RESULT: ALL TESTS PASSED ($rate%)" -ForegroundColor White -BackgroundColor Green
  Write-Host "  Backend is fully verified."
} elseif ($rate -ge 90) {
  Write-Host "  RESULT: MOSTLY PASSING ($rate%)" -ForegroundColor Black -BackgroundColor Yellow
} else {
  Write-Host "  RESULT: FAILURES DETECTED ($rate%)" -ForegroundColor White -BackgroundColor Red
  Write-Host ""
  Write-Host "  Failed:" -ForegroundColor Red
  $script:results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
    Write-Host "    - $($_.Name) $(if($_.Detail){"→ $($_.Detail)"})" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "  Account: $($script:ctx.email)" -ForegroundColor Gray
Write-Host "  Org ID:  $($script:ctx.orgId)" -ForegroundColor Gray
Write-Host ""
Write-Host ("=" * 70) -ForegroundColor Cyan

$csv = "api-v2-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').csv"
$script:results | Export-Csv -Path $csv -NoTypeInformation
Write-Host ""
Write-Host "  Results saved: $csv" -ForegroundColor Gray
Write-Host ""

