#Requires -Version 5.1
# passmap-pr-check.ps1 - Pre-PR verification (read-only)

$FAIL = [System.Collections.Generic.List[string]]::new()
$WARN = [System.Collections.Generic.List[string]]::new()

# Fetch for accuracy
try { git fetch origin main --quiet 2>$null } catch { $WARN.Add("git fetch failed (offline?)") }

$branch = (git branch --show-current 2>$null).Trim()
Write-Output "Branch: $branch"
if ($branch -eq "main") { $FAIL.Add("Current branch is main — create a feature branch first") }

# Changed files vs origin/main
$changedFiles = @(git diff --name-only "origin/main...HEAD" 2>$null)
Write-Output ""
Write-Output "--- Changed files (vs origin/main) ---"
if ($changedFiles.Count -eq 0) { Write-Output "  (none)" }
else { $changedFiles | ForEach-Object { Write-Output "  $_" } }

# Ahead / behind
$ab = (git rev-list --left-right --count "origin/main...HEAD" 2>$null).Trim() -split '\s+'
if ($ab.Count -ge 2) { Write-Output "`nAhead: $($ab[1])  Behind: $($ab[0])" }

# Working tree
$staged    = @(git diff --cached --name-only 2>$null)
$unstaged  = @(git diff          --name-only 2>$null)
$untracked = @(git ls-files --others --exclude-standard 2>$null)

Write-Output ""
Write-Output "--- Working tree ---"
Write-Output "  Staged:    $($staged.Count)"
Write-Output "  Unstaged:  $($unstaged.Count)"
Write-Output "  Untracked: $($untracked.Count)"

if ($staged.Count    -gt 0) { $WARN.Add("Uncommitted staged files: $($staged -join ', ')") }
if ($unstaged.Count  -gt 0) { $WARN.Add("Unstaged changes: $($unstaged -join ', ')") }

# Commits
Write-Output ""
Write-Output "--- Commits (vs origin/main) ---"
$commits = @(git log --oneline "origin/main..HEAD" 2>$null)
if ($commits.Count -eq 0) { Write-Output "  (none)" }
else { $commits | ForEach-Object { Write-Output "  $_" } }

# Protected surface
$protectedPatterns = @("src/App.jsx", ".github/workflows", "api/", "auth", ".env", "deploy", "secret", "payment", "billing")
$protected = $changedFiles | Where-Object {
    $f = $_
    $protectedPatterns | Where-Object { $f -like "*$_*" }
}
if ($protected) {
    Write-Output ""
    Write-Output "--- Protected surface ---"
    $protected | ForEach-Object { Write-Output "  [WARN] $_" }
    $WARN.Add("Protected surface touched: $($protected -join ', ')")
}

# Dependency warning
$depChanged = $changedFiles | Where-Object { $_ -in @("package.json", "package-lock.json") }
if ($depChanged) { $WARN.Add("Dependency files changed: $($depChanged -join ', ')") }

# Mojibake scan
Write-Output ""
Write-Output "--- Mojibake scan ---"
$textFiles = $changedFiles | Where-Object { $_ -match '\.(js|jsx|ts|tsx|md)$' }
$mojibakeFound = $false
# Build mojibake pattern using code points to avoid source encoding issues
# U+81FE 臾  U+6E72 湲  U+B311 댁  U+786B 硫  U+FF1C fullwidth<
$_m = [char]0x81FE, [char]0x6E72, [char]0xB311, [char]0x786B, [char]0xFF1C
$mojibakeRx = ($_m | ForEach-Object { [regex]::Escape($_) }) -join '|'
foreach ($f in $textFiles) {
    if (Test-Path $f) {
        $raw = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
        if ($raw -match $mojibakeRx) {
            Write-Output "  [FAIL] Mojibake in: $f"
            $FAIL.Add("Mojibake in $f")
            $mojibakeFound = $true
        }
    }
}
if (-not $mojibakeFound) { Write-Output "  OK" }

# Summary
Write-Output ""
Write-Output "=== PR CHECK SUMMARY ==="
$readyLabel = if ($FAIL.Count -eq 0) { "YES" } else { "NO" }
Write-Output "READY FOR PR: $readyLabel"
if ($WARN.Count -gt 0) {
    Write-Output "WARNINGS:"
    $WARN | ForEach-Object { Write-Output "  - $_" }
}
if ($FAIL.Count -gt 0) {
    Write-Output "FAILURES:"
    $FAIL | ForEach-Object { Write-Output "  - $_" }
}
