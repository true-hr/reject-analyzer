# PASSMAP Claude Working Rules

## Collaboration Model

Design / scope / verification criteria: ChatGPT  
Execution / patch / test / commit / PR: Claude + Codex

## Work Classification

| Class | Description |
|---|---|
| Tiny | ≤3 files, local patch, no new feature |
| Standard | Feature or fix; build or smoke required |
| Batch QA | Multi-case validation across axis or registry |
| Protected | Auth, routing, deploy, env vars, API keys, security, data migration, App.jsx, main/gh-pages direct edit, large-scale refactor |

Default: **Standard**

## Standard Completion Flow

1. Implement
2. Verify (see rules below)
3. `scripts/passmap-pr-check.ps1`
4. `git diff` and `git diff --cached`
5. `git add <named-files-only>`
6. `git commit`
7. `git push`
8. Create PR with template filled
9. Final report in chat (short — detail goes in PR body)

## Chat Final Report Format

```
Branch: <branch>
Commit: <hash>
Files: <list>
Verification: <result or skipped reason>
PR: <URL>
Risks: <or none>
```

## Verification Rules

- Tiny: targeted static check or smoke only
- Standard UI/copy: `npm run build` or smoke preferred
- Standard logic/axis/registry: `npm run build` + representative case QA
- Batch QA: representative case group + classification coverage
- Minimize redundant build runs
- SSOT/docs check: only when the task touches SSOT; skip for simple Tiny
- Read-only investigation: do not stop for dirty worktree or mojibake; report findings

## Protected Class Rules

Protected requires explicit user approval before push, merge, or deploy.  
Exception: user grants explicit per-task permission (as in this session).

Protected surface triggers:
- `src/App.jsx`, `.github/workflows/**`, `api/**`
- auth / env vars / API keys / deploy / security
- data deletion or migration
- direct modification of `main` or `gh-pages`
- mixed branches or large-scale refactor

Protected read-only exception:  
Protected files and surfaces may be inspected in READ-ONLY mode without stopping.  
Stop before modifying, staging, committing, pushing, deploying, or changing settings/env/security-related configuration.  
Do not stop merely because a read-only investigation touches a Protected path.

## Execution Behavior

Default operating style: **DIRECT EXECUTION MODE**

When a task fits the allowed scope, execute immediately. Never ask:
- `Should I modify this file?`
- `Is it okay to add this?`
- `Do you want me to proceed?`
- Anything already derivable from context given in the task

Ask only when ONE of these is true (one question, minimum):
- Goal is logically contradictory
- Exact target file cannot be identified
- Files outside the allowed scope must be modified
- A new Protected condition is discovered mid-task

Never: speculative redesign, opportunistic refactoring, broad cleanup, re-asking answered questions.  
Always: minimal change, one task one purpose.

### Batch / PR Principle

A PR should represent a meaningful verification unit, not a microscopic edit.  
"One task one purpose" means no unrelated scope creep; it does not mean every tiny edit needs a separate PR.  
Group 3–7 related small changes into one batch when they share the same risk profile and verification method.  
Split work when verification method, risk level, or ownership differs.  
Never mix Protected work with unrelated UI/copy/registry changes.

## Hard Rules

- Direct work on `main` is forbidden.
- `git add .` and `git add -A` are forbidden; stage only named files.
- Korean/CJK text: UTF-8 direct file I/O only; shell redirection forbidden.
- Mojibake detected (see scripts/passmap-pr-check.ps1): stop and report immediately.
- Mixed unrelated commits or files in the same branch: stop.
- One chat = one working branch whenever possible.

## Windows GitHub CLI Rules

`gh: command not found`, `gh.exe: command not found`, `powershell: command not found`, or `powershell.exe: command not found` are not valid reasons to skip PR creation or hand it off to the user.

Attempt PR creation using the following fallback order:

PowerShell:
```
& "C:\Program Files\GitHub CLI\gh.exe" ...
```

Git Bash / MSYS / Bash:
```
"/c/Program Files/GitHub CLI/gh.exe" ...
```

Use whichever form works in the current shell and proceed to PR creation.

## Permission Mode Safety

Even when Claude is running with `--dangerously-skip-permissions` or bypass permissions mode, all PASSMAP project rules still apply.

Never treat permission bypass as approval for:
- Direct edits on `main`
- `git add .` or `git add -A`
- Destructive commands
- env / auth / deploy / security changes
- Protected writes without explicit user approval
- Unrelated file changes

## Local Directory / Worktree Hygiene Rules

### Canonical Worktree Location

All new PASSMAP worktrees MUST be created under:

```text
D:\passmap-worktrees\<short-branch-name>
```

Do not create new worktrees directly under `D:\패스맵` or inside `D:\패스맵\reject-analyzer`.

### Prohibited Worktree Locations

Never create Git worktrees, temporary repos, clones, or verification copies in these locations:

- `D:\패스맵\`
- `D:\패스맵\reject-analyzer\`
- `D:\패스맵\reject-analyzer\*` (any subdirectory)

Reason: `D:\패스맵` is reserved for business documents, slides, PDFs, contracts, planning files, and support-program materials. The main repo directory must not contain nested worktrees because they appear as `??` untracked folders and contaminate `git status`.

### Worktree Creation Rule

```bash
cd "D:\패스맵\reject-analyzer"
git worktree add "D:\passmap-worktrees\<short-name>" -b "<branch-name>"
```

### Worktree Removal Rule

Always remove completed worktrees with Git — never delete the folder directly in Windows Explorer:

```bash
git worktree remove "D:\passmap-worktrees\<short-name>"
git worktree prune
```

### Session Cleanup Check

Before the final report, when a task created a worktree, run:

```bash
git worktree list
```

Confirm that no newly created worktree is under `D:\패스맵` or inside `D:\패스맵\reject-analyzer`.

## MCP Permission Rules

### Vercel MCP Permission Rule

When Claude uses Vercel MCP in this project, read-only Vercel inspection commands should not be escalated to the user every time.

If Claude is prompted with a permission choice for read-only Vercel MCP commands, choose the project-scoped "Yes, and don't ask again" option when available.

Read-only Vercel MCP commands that may be auto-allowed:
- `list_deployments`
- `get_deployment`
- `get_project`
- `list_projects`
- `inspect_deployment`
- `get_deployment_events`
- `get_deployment_build_logs`
- `get_runtime_logs`
- `list_teams`
- `search_vercel_documentation`
- `web_fetch_vercel_url`
- `get_access_to_vercel_url`

Do not auto-allow destructive or production-impacting Vercel MCP commands.

Always ask the user before:
- deploy or redeploy (`deploy_to_vercel`)
- delete/remove deployment or project
- add/update/delete environment variables
- change domains or aliases
- change project settings
- change production deployment behavior
- modify team/project access or security settings

Rule: read-only inspection can be auto-allowed; state-changing, security-sensitive, or production-impacting actions require explicit user confirmation.
