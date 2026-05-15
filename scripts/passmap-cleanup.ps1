#Requires -Version 5.1
# passmap-cleanup.ps1 - PASSMAP Git worktree/branch cleanup tool
#
# Usage:
#   .\scripts\passmap-cleanup.ps1                  # dry-run: all phases
#   .\scripts\passmap-cleanup.ps1 -TmpOnly          # dry-run: Phase 1 only
#   .\scripts\passmap-cleanup.ps1 -TmpOnly -Execute # EXECUTE Phase 1 (tmp/claude worktrees)
#   .\scripts\passmap-cleanup.ps1 -IncludeMerged    # dry-run: Phase 1+2+3 verbose
#
# Phase 1: tmp/Claude worktrees (inside-repo or wrong-path worktrees)
# Phase 2: merged+clean worktrees (standard locations, branch merged into main)
# Phase 3: merged local branches (branch --merged main, excluding protected)
#
# NOTE: Phase 2/3 are DRY-RUN ONLY in this version. Use -TmpOnly -Execute for Phase 1.

param(
    [switch]$Execute,
    [switch]$TmpOnly,
    [switch]$IncludeMerged
)

Set-StrictMode -Off
$ErrorActionPreference = "Continue"

# --- Safety: must be in a git repo ---
function Invoke-Safe {
    param([scriptblock]$Block, $Default = $null)
    try { & $Block } catch { $Default }
}

$repoCheck = Invoke-Safe { git rev-parse --is-inside-work-tree 2>$null } ""
if ($repoCheck -ne "true") {
    Write-Error "Not inside a git repository. Aborting."
    exit 1
}

$currentBranch = (Invoke-Safe { git branch --show-current 2>$null } "").Trim()
if (-not $currentBranch) {
    Write-Error "Cannot determine current branch (detached HEAD?). Aborting."
    exit 1
}

$mainExists = Invoke-Safe { git rev-parse --verify main 2>$null } ""
if (-not $mainExists) {
    Write-Error "Branch 'main' not found. Aborting."
    exit 1
}

# --- Determine mode ---
# Only TmpOnly+Execute actually deletes; -Execute alone is still dry-run for Phase 2/3
$isPhase1Execute = ($TmpOnly -and $Execute)
$isDryRun        = -not $isPhase1Execute
$modeLabel       = if ($isDryRun) { "DRY RUN" } else { "EXECUTE (Phase 1 only)" }

Write-Host ""
Write-Host "=== [PASSMAP CLEANUP - $modeLabel] ===" -ForegroundColor Cyan
Write-Host "  Current branch : $currentBranch" -ForegroundColor Gray
Write-Host ""

# --- Parse git worktree list --porcelain ---
$worktrees = [System.Collections.Generic.List[PSCustomObject]]::new()
$repoRoot  = ""

try {
    $porcelain = git worktree list --porcelain 2>&1
    $cur = $null
    $isFirst = $true
    foreach ($line in $porcelain) {
        if ($line -match '^worktree (.+)$') {
            if ($cur) { $worktrees.Add($cur) }
            $path = $Matches[1].Trim()
            $cur = [PSCustomObject]@{
                Path     = $path
                Head     = ""
                Branch   = ""
                Detached = $false
                IsMain   = $isFirst
            }
            if ($isFirst) { $repoRoot = $path.Replace('\','/'); $isFirst = $false }
        } elseif ($line -match '^HEAD ([0-9a-f]+)$' -and $cur) {
            $cur.Head = $Matches[1]
        } elseif ($line -eq "detached" -and $cur) {
            $cur.Detached = $true; $cur.Branch = "(detached)"
        } elseif ($line -match '^branch refs/heads/(.+)$' -and $cur) {
            $cur.Branch = $Matches[1].Trim()
        }
    }
    if ($cur) { $worktrees.Add($cur) }
} catch {
    Write-Warning "Failed to parse worktree list: $_"
    exit 1
}

if (-not $repoRoot) {
    Write-Error "Could not determine repo root from worktree list. Aborting."
    exit 1
}

Write-Host "  Repo root      : $repoRoot" -ForegroundColor Gray
Write-Host "  Total worktrees: $($worktrees.Count)" -ForegroundColor Gray
Write-Host ""

# --- Helpers ---
$protectedBranchPatterns = @(
    '^main$', '^develop$', '^gh-pages$',
    '^release/', '^backup/', '^protected/', '^batch/'
)

function Test-ProtectedBranch([string]$branch) {
    foreach ($pat in $protectedBranchPatterns) {
        if ($branch -match $pat) { return $true }
    }
    return $false
}

function Get-WorktreeCleanStatus([string]$path) {
    if (-not (Test-Path $path)) { return "MISSING" }
    try {
        $s = git -C $path status --short 2>$null
        if ($null -eq $s -or ($s -is [array] -and $s.Count -eq 0) -or ($s -is [string] -and $s.Trim() -eq "")) {
            return "CLEAN"
        }
        $count = if ($s -is [array]) { $s.Count } else { 1 }
        return "DIRTY($count)"
    } catch { return "ERROR" }
}

# --- Get merged branches ---
$mergedBranches = @{}
try {
    git branch --merged main 2>$null | ForEach-Object {
        $b = $_.Trim().TrimStart('*').Trim()
        if ($b -and $b -ne "" ) { $mergedBranches[$b] = $true }
    }
} catch { Write-Warning "Could not enumerate merged branches." }

# ---------------------------------------------------------------------------
# PHASE 1: tmp/Claude worktrees -- inside repo or wrong-path artifacts
# ---------------------------------------------------------------------------
$p1Candidates = [System.Collections.Generic.List[PSCustomObject]]::new()
$p1Skipped    = [System.Collections.Generic.List[string]]::new()

Write-Host "--- Phase 1: tmp/Claude worktrees (inside-repo / wrong-path) -------" -ForegroundColor Yellow

foreach ($wt in $worktrees) {
    if ($wt.IsMain) { continue }
    $wtPath = $wt.Path.Replace('\','/')

    # Detect Phase 1 patterns
    $isP1   = $false
    $reason = ""
    if    ($wtPath -like "$repoRoot/.tmp_vercel_deploy_head*")   { $isP1 = $true; $reason = "tmp_vercel" }
    elseif ($wtPath -like "$repoRoot/.claude/worktrees/*")        { $isP1 = $true; $reason = "claude_worktree" }
    elseif ($wtPath -like "$repoRoot/D/*")                        { $isP1 = $true; $reason = "wrong_path_D" }
    elseif ($wtPath -like "$repoRoot/precise-analysis-result-rendering") { $isP1 = $true; $reason = "stray_inside_repo" }
    elseif ($wtPath.StartsWith($repoRoot + "/") -and ($wtPath -match "worktrees")) {
        # worktrees* pattern: repo-internal encoding failure (Korean path)
        $isP1 = $true; $reason = "encoding_failure_inside_repo"
    }

    if (-not $isP1) { continue }

    # Safety: skip current branch
    if ($wt.Branch -eq $currentBranch) {
        $p1Skipped.Add("  SKIP (current-branch): $($wt.Path)"); continue
    }
    # Safety: skip dirty worktrees
    $status = Get-WorktreeCleanStatus -path $wt.Path
    if ($status -ne "CLEAN" -and $status -ne "MISSING") {
        $p1Skipped.Add("  SKIP ($status): $($wt.Path)"); continue
    }

    $p1Candidates.Add([PSCustomObject]@{
        Path   = $wt.Path
        Branch = $wt.Branch
        Status = $status
        Reason = $reason
    })
}

$p1Success = 0
$p1Failed  = 0

if ($p1Candidates.Count -eq 0) {
    Write-Host "  (no candidates found)" -ForegroundColor DarkGray
} else {
    foreach ($c in $p1Candidates) {
        $action = if ($isPhase1Execute) { "REMOVING  " } else { "would remove" }
        $color  = if ($isPhase1Execute) { "Red" }        else { "DarkYellow" }
        $cPath   = $c.Path
        $cBranch = $c.Branch
        $cStatus = $c.Status
        $cReason = $c.Reason
        Write-Host "  $action | $cPath | branch=$cBranch | $cStatus | $cReason" -ForegroundColor $color

        if ($isPhase1Execute) {
            git worktree remove --force $c.Path 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    removed OK" -ForegroundColor Green
                $p1Success++
            } else {
                Write-Warning "    FAILED to remove $($c.Path) (exit $LASTEXITCODE) -- aborting"
                $p1Failed++
                break
            }
        }
    }
}

if ($p1Skipped.Count -gt 0) {
    Write-Host "  Skipped:" -ForegroundColor DarkGray
    $p1Skipped | ForEach-Object { Write-Host $_ -ForegroundColor DarkGray }
}
Write-Host ""

# ---------------------------------------------------------------------------
# PHASE 2: merged + clean worktrees (standard locations)
# ---------------------------------------------------------------------------
$p2Candidates = [System.Collections.Generic.List[PSCustomObject]]::new()
$p2Skipped    = [System.Collections.Generic.List[string]]::new()

if (-not $TmpOnly) {
    Write-Host "--- Phase 2: merged+clean worktrees (standard locations) -----------" -ForegroundColor Yellow

    $p1Paths = $p1Candidates | ForEach-Object { $_.Path.Replace('\','/') }
    $checked = 0
    $maxCheck = 50  # cap to avoid long wait in dry-run

    foreach ($wt in $worktrees) {
        if ($wt.IsMain) { continue }
        $wtPath = $wt.Path.Replace('\','/')

        # Skip Phase 1 paths
        if ($p1Paths -contains $wtPath) { continue }
        # Skip inside-repo paths (already covered or wrong)
        if ($wtPath.StartsWith($repoRoot + "/")) {
            $p2Skipped.Add("  SKIP (inside-repo, not phase1): $wtPath"); continue
        }
        # Skip detached with no branch
        if ([string]::IsNullOrEmpty($wt.Branch) -or $wt.Branch -eq "(detached)") {
            $p2Skipped.Add("  SKIP (detached): $wtPath"); continue
        }
        if ($wt.Branch -eq $currentBranch) {
            $p2Skipped.Add("  SKIP (current): $wtPath [$($wt.Branch)]"); continue
        }
        if (Test-ProtectedBranch $wt.Branch) {
            $p2Skipped.Add("  SKIP (protected): $wtPath [$($wt.Branch)]"); continue
        }
        if (-not $mergedBranches.ContainsKey($wt.Branch)) {
            $p2Skipped.Add("  SKIP (not-merged): $wtPath [$($wt.Branch)]"); continue
        }

        # Status check (capped)
        if ($checked -ge $maxCheck) {
            $p2Skipped.Add("  SKIP (check-cap reached): $wtPath"); continue
        }
        $checked++
        $status = Get-WorktreeCleanStatus -path $wt.Path
        if ($status -ne "CLEAN") {
            $p2Skipped.Add("  SKIP ($status): $wtPath [$($wt.Branch)]"); continue
        }

        $p2Candidates.Add([PSCustomObject]@{
            Path   = $wt.Path
            Branch = $wt.Branch
        })
    }

    if ($p2Candidates.Count -eq 0) {
        Write-Host "  (no candidates found in checked $checked worktrees)" -ForegroundColor DarkGray
    } else {
        foreach ($c in $p2Candidates) {
            $cPath   = $c.Path
            $cBranch = $c.Branch
            Write-Host "  would remove | $cPath | branch=$cBranch | MERGED+CLEAN" -ForegroundColor DarkYellow
        }
    }

    $skipShown = $p2Skipped | Select-Object -First 8
    if ($p2Skipped.Count -gt 0) {
        $p2SkipCount = $p2Skipped.Count
        Write-Host "  Skipped ($p2SkipCount total, showing up to 8):" -ForegroundColor DarkGray
        $skipShown | ForEach-Object { Write-Host $_ -ForegroundColor DarkGray }
        if ($p2Skipped.Count -gt 8) {
            Write-Host "  ... and $($p2Skipped.Count - 8) more" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

# ---------------------------------------------------------------------------
# PHASE 3: merged local branches
# ---------------------------------------------------------------------------
$p3Candidates = [System.Collections.Generic.List[string]]::new()
$p3Protected  = [System.Collections.Generic.List[string]]::new()

if (-not $TmpOnly) {
    Write-Host "--- Phase 3: merged local branches ---------------------------------" -ForegroundColor Yellow

    foreach ($b in ($mergedBranches.Keys | Sort-Object)) {
        if ($b -eq "main" -or $b -eq $currentBranch) { continue }
        if (Test-ProtectedBranch $b) { $p3Protected.Add($b); continue }
        $p3Candidates.Add($b)
    }

    if ($p3Candidates.Count -eq 0) {
        Write-Host "  (no candidates)" -ForegroundColor DarkGray
    } else {
        $show = [Math]::Min(25, $p3Candidates.Count)
        $p3Candidates | Select-Object -First $show | ForEach-Object {
            Write-Host "  would delete | $_ | merged into main" -ForegroundColor DarkYellow
        }
        if ($p3Candidates.Count -gt $show) {
            Write-Host "  ... and $($p3Candidates.Count - $show) more (total: $($p3Candidates.Count))" -ForegroundColor DarkGray
        }
    }

    Write-Host "  Protected/excluded: $($p3Protected.Count) branches" -ForegroundColor DarkGray
    Write-Host ""
}

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "  Phase 1 candidates : $($p1Candidates.Count)  (tmp/Claude inside-repo worktrees)" -ForegroundColor White
if (-not $TmpOnly) {
    Write-Host "  Phase 2 candidates : $($p2Candidates.Count)  (merged+clean worktrees -- DRY-RUN ONLY)" -ForegroundColor White
    Write-Host "  Phase 3 candidates : $($p3Candidates.Count)  (merged branches -- DRY-RUN ONLY)" -ForegroundColor White
    Write-Host "  Phase 3 protected  : $($p3Protected.Count)  (excluded by pattern)" -ForegroundColor DarkGray
}
Write-Host ""
if ($isDryRun) {
    Write-Host "  No changes made." -ForegroundColor Cyan
    Write-Host "  To remove Phase 1 worktrees: .\scripts\passmap-cleanup.ps1 -TmpOnly -Execute" -ForegroundColor Cyan
} else {
    $p1Color = if ($p1Failed -gt 0) { "Red" } else { "Green" }
    Write-Host "  Phase 1 worktrees: $p1Success removed OK, $p1Failed FAILED." -ForegroundColor $p1Color
    Write-Host "  Phase 2/3: dry-run only in this version." -ForegroundColor DarkYellow
}
Write-Host "===============" -ForegroundColor Cyan
Write-Host ""
