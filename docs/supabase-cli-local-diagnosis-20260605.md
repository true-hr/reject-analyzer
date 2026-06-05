# Supabase CLI Local Diagnosis

## Purpose

This document diagnoses the local Supabase CLI issue that blocked the scheduler v2 local DB apply test because the `supabase-go` binary was missing.

The goal is to confirm the current Windows CLI installation method, path resolution, `supabase-go` availability, recovery actions, and whether the next local-only preflight batch can retry `supabase status`.

This batch did not run DB migration apply, `supabase start`, `supabase db reset`, or any remote Supabase command.

## Previous BLOCKED summary

- PR #781 recorded the scheduler v2 local DB apply test result as `BLOCKED`.
- `supabase status` failed with `Could not find the supabase-go binary`.
- Local DB safety could not be confirmed.
- `supabase start` and `supabase db reset` were not executed.
- No production, staging, or remote DB access was performed.

## Environment information

| Item | Result |
| --- | --- |
| OS | Microsoft Windows NT 10.0.19045.0 |
| Shell | Windows PowerShell |
| Node path | `D:\잡다\node.exe` |
| Node version | `v25.6.1` |
| npm path | `D:\잡다\npm.ps1` |
| npm version | `11.9.0` |
| npm global prefix | `D:\tools\npm-global` |
| npm global root | `D:\tools\npm-global\node_modules` |
| Supabase CLI path before recovery | `D:\tools\npm-global\supabase.exe` |
| Supabase CLI version before recovery | `2.104.0` |
| Supabase CLI path after recovery | `D:\tools\npm-global\supabase.ps1` in PowerShell |
| Supabase CLI version after recovery | `2.105.0` |
| `supabase-go` discovery | Found inside npm package at `D:\tools\npm-global\node_modules\supabase\node_modules\@supabase\cli-windows-x64\bin\supabase-go.exe` |
| Docker version | `Docker version 29.5.2, build 79eb04c` |

PATH entries relevant to this diagnosis:

- `D:\tools\npm-global`
- `C:\Users\LG\AppData\Roaming\npm`
- `D:\tools\claude`
- `D:\Tools\moai`

No secret/env values, project refs, DB URLs, or access tokens were recorded.

## Diagnostic commands and results

| Command | Result | Interpretation |
| --- | --- | --- |
| `git status --short --branch` | Clean branch before document creation | Safe to diagnose in isolated worktree |
| `git diff --name-status origin/main...HEAD` | Empty before document creation | No pending branch changes |
| `Get-Command supabase` before recovery | `D:\tools\npm-global\supabase.exe` | PowerShell initially resolved an executable shim |
| `supabase --version` before recovery | `2.104.0` | Shim could print version but was missing runtime companion binary |
| `where.exe supabase` before recovery | `D:\tools\npm-global\supabase.exe` | PATH resolved only the old Supabase executable |
| `where.exe supabase-go` before recovery | Not found | `supabase-go` was not globally available |
| `Get-ChildItem D:\tools\npm-global -Filter supabase*` before recovery | Only `supabase.exe` | npm prefix had an orphan Supabase executable |
| `Get-ChildItem D:\tools\npm-global\node_modules -Recurse -Filter *supabase*` before recovery | No Supabase package files | npm global `supabase` package was not installed |
| `npm root -g` | `D:\tools\npm-global\node_modules` | Global package root confirmed |
| `npm config get prefix` | `D:\tools\npm-global` | Global prefix confirmed |
| `npm list -g --depth=0` before recovery | No `supabase` package | Installed CLI was not an npm-managed package |
| `Get-Command node` | `D:\잡다\node.exe` | Node available |
| `node --version` | `v25.6.1` | Node version captured |
| `Get-Command npm` | `D:\잡다\npm.ps1` | npm available |
| `npm --version` | `11.9.0` | npm version captured |
| `$env:PATH -split ';' \| Select-String -Pattern "supabase\|npm\|tools"` | npm prefix present | PATH includes npm global prefix |
| `docker --version` | `Docker version 29.5.2, build 79eb04c` | Docker available, recorded as reference only |

## Cause assessment

Conclusion:

- `Supabase CLI installed through unsupported/broken shim`
- `npm global supabase package installed but supabase-go binary missing` before recovery

Details:

- Before recovery, `D:\tools\npm-global\supabase.exe` existed and returned `2.104.0`.
- The executable identified as a Bun-based binary and could not find `supabase-go`.
- `npm list -g --depth=0` did not show a `supabase` package.
- `D:\tools\npm-global\node_modules` did not contain Supabase CLI package files.
- This indicates the previous CLI was an orphan or unsupported shim in the npm global prefix, not a complete npm global Supabase CLI installation.

After recovery:

- `npm install -g supabase` installed `supabase@2.105.0`.
- The platform package `@supabase/cli-windows-x64` is present under the package.
- `supabase-go.exe` is present inside the npm package.
- PowerShell resolves `supabase` to `D:\tools\npm-global\supabase.ps1`, which invokes `node_modules/supabase/dist/supabase.js`.

Remaining note:

- `where.exe supabase-go` still does not find a global `supabase-go` command because the binary is nested inside the npm package, not directly on PATH.
- This is acceptable for the npm wrapper because the wrapper resolves the platform binary internally.
- The old root `D:\tools\npm-global\supabase.exe` still exists, so non-PowerShell shells should verify their own command resolution before use.

## Recovery actions performed

Performed:

```powershell
npm install -g supabase
supabase --version
where.exe supabase
where.exe supabase-go
npm list -g --depth=0
Get-ChildItem "D:\tools\npm-global" -Filter "supabase*" -Force
Get-ChildItem "D:\tools\npm-global\node_modules" -Recurse -Filter "*supabase*" -ErrorAction SilentlyContinue
Get-ChildItem "D:\tools\npm-global\node_modules\supabase\node_modules\@supabase\cli-windows-x64\bin" -Force
Get-Command supabase
Get-Command supabase.cmd
Get-Command supabase.ps1
Get-Command supabase.exe
supabase --version
& "D:\tools\npm-global\supabase.cmd" --version
& "D:\tools\npm-global\node_modules\supabase\node_modules\@supabase\cli-windows-x64\bin\supabase-go.exe" --version
```

Not performed:

- `npm uninstall -g supabase`, because npm did not have a global `supabase` package before recovery.
- Manual deletion of the old root `supabase.exe`.
- Standalone binary download or administrator-level installation.
- `supabase status`, by batch rule.
- `supabase start`, `supabase db reset`, `supabase db push`, or `supabase migration up`.

## Recovery result

`PASS`

Evidence:

- `supabase --version` returns `2.105.0`.
- `D:\tools\npm-global\supabase.cmd --version` returns `2.105.0`.
- Internal package binary `supabase-go.exe --version` returns `2.105.0`.
- npm global package list now includes `supabase@2.105.0`.
- PowerShell resolves `supabase` to the npm-generated `supabase.ps1` wrapper.

The next batch can retry local-only preflight starting with `supabase status`, while keeping the same production/staging/remote guardrails.

## Next actions

Because the result is `PASS`:

- In the next batch, retry local-only preflight starting with `supabase status`.
- Only if `supabase status` confirms local-only safety should that batch consider `supabase start`.
- Only after local-only safety is confirmed should that batch consider `supabase db reset`.
- Production/staging/remote DB access remains prohibited.
- If a non-PowerShell shell is used, verify whether it resolves `supabase` to the npm wrapper or the older root `supabase.exe`.

## Out of scope

- DB migration apply.
- `supabase start`.
- `supabase db reset`.
- `supabase db push`.
- `supabase migration up`.
- Production, staging, or remote DB access.
- Supabase SQL Editor execution.
- Migration changes.
- SQL patch writing.
- RLS SQL writing.
- Edge Function changes.
- Frontend changes.
- Provider/live sending.
- Cron, env, or production configuration.
- Real user data import.
- Backfill.
- Account merge.
- Web Push subscription migration.
