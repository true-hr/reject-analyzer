#Requires -Version 5.1
# passmap-doctor.ps1 - Session startup environment summary (read-only)

function Safe {
    param([scriptblock]$Block, [string]$Default = "N/A")
    try { $r = & $Block; if ($r) { $r } else { $Default } } catch { $Default }
}

$topLevel  = Safe { git rev-parse --show-toplevel 2>$null }
$branch    = Safe { git branch --show-current 2>$null }
$dirtyCount = Safe { (git status --short 2>$null | Measure-Object -Line).Lines } 0
$statusLabel = if ([int]$dirtyCount -eq 0) { "clean" } else { "dirty ($dirtyCount lines)" }

$aheadBehind = Safe {
    $ab = (git rev-list --left-right --count "origin/main...HEAD" 2>$null).Trim() -split '\s+'
    if ($ab.Count -ge 2) { "behind=$($ab[0]) ahead=$($ab[1])" } else { "N/A" }
}

$nodePath    = Safe { (Get-Command node    -ErrorAction SilentlyContinue).Source }
$nodeVer     = Safe { node --version 2>$null }
$npmVer      = Safe { npm  --version 2>$null }
$wranglerPath = Safe { (Get-Command wrangler -ErrorAction SilentlyContinue).Source }
$wranglerVer  = Safe { wrangler --version 2>$null }
$ghPath      = Safe { (Get-Command gh -ErrorAction SilentlyContinue).Source }
$ghVer       = Safe { (gh --version 2>$null | Select-Object -First 1) }

$prInfo = Safe {
    $pr = gh pr view --json number,url 2>$null | ConvertFrom-Json
    if ($pr -and $pr.number) { "#$($pr.number)  $($pr.url)" } else { "none" }
} "none"

Write-Output "=== PASSMAP DOCTOR ==="
Write-Output "Repo:         $topLevel"
Write-Output "Branch:       $branch"
Write-Output "Status:       $statusLabel"
Write-Output "Ahead/Behind: $aheadBehind"
Write-Output ""
Write-Output "node:         $nodeVer  ($nodePath)"
Write-Output "npm:          v$npmVer"
Write-Output "wrangler:     $wranglerVer  ($wranglerPath)"
Write-Output "gh:           $ghVer  ($ghPath)"
Write-Output ""
Write-Output "PR:           $prInfo"
Write-Output "=== END DOCTOR ==="
