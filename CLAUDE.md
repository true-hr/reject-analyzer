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

## Hard Rules

- Direct work on `main` is forbidden.
- `git add .` and `git add -A` are forbidden; stage only named files.
- Korean/CJK text: UTF-8 direct file I/O only; shell redirection forbidden.
- Mojibake detected (see scripts/passmap-pr-check.ps1): stop and report immediately.
- Mixed unrelated commits or files in the same branch: stop.
- One chat = one working branch whenever possible.

## GitHub CLI / PR Creation Rule for Windows

This project is developed in a Windows environment.

Do not ask the user to create PRs manually just because `gh` is not recognized in Bash.

If Bash cannot find `gh`, use PowerShell or call the GitHub CLI executable directly:

```
"C:\Program Files\GitHub CLI\gh.exe"
```

Use this path for PR-related commands:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" --version
& "C:\Program Files\GitHub CLI\gh.exe" auth status
& "C:\Program Files\GitHub CLI\gh.exe" pr status
& "C:\Program Files\GitHub CLI\gh.exe" pr create --base main --head <current-branch> --title "<PR title>" --body "<PR body>"
```

`gh: command not found` in Bash is not a valid reason to stop or ask the user to create the PR manually.

Switch to PowerShell or use the full executable path.

Before creating a PR, still follow the project safety rules:

- Do not work directly on `main`, `gh-pages`, or `develop`.
- Do not use `git add .`.
- Add only explicitly named files.
- Check `pwd`, current branch, and `git status --short`.
- Review `git diff --stat` and `git diff --cached`.
- Separate Protected work into its own branch and PR.
