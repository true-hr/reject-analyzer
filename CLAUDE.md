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

When a task fits the allowed scope, proceed immediately without asking.

Ask only when ONE of these is true:
- Goal is logically contradictory
- Exact target file cannot be identified
- Files outside the allowed scope must be modified
- A new Protected condition is discovered mid-task

Never: speculative redesign, opportunistic refactoring, or broad cleanup beyond the task.  
Always: minimal change, one task one purpose.

## Hard Rules

- Direct work on `main` is forbidden.
- `git add .` and `git add -A` are forbidden; stage only named files.
- Korean/CJK text: UTF-8 direct file I/O only; shell redirection forbidden.
- Mojibake detected (see scripts/passmap-pr-check.ps1): stop and report immediately.
- Mixed unrelated commits or files in the same branch: stop.
- One chat = one working branch whenever possible.
