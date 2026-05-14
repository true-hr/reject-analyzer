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

## Bash Permission and Task Execution

The local Claude settings are intended to allow routine Bash usage broadly. Do not stop merely because a normal Bash read/check command requires permission once.

Use Bash directly for routine development work, including:
- `pwd`
- `git status`, `git branch`, `git diff`, `git log`, `git show`
- `ls`, `find`, `grep`, `awk`, `sed`, `cat`, `head`, `tail`, `wc`
- `node`, `npm`, `npx`, `python`, `python3`
- `curl` and `npx vercel` when the task requires it
- read-only filesystem discovery such as finding `wrangler.toml`, `wrangler.json`, `package.json`, API files, worker files, and config files

If a Bash approval prompt appears for a normal read-only command, rewrite and retry once in Bash instead of asking the user. Prefer safer Bash patterns, but keep using Bash.

Examples:

```bash
find /d/패스맵 -name "wrangler.toml" -o -name "wrangler.json" | head -10
```

```bash
git -C /d/패스맵/reject-analyzer status --short
```

```bash
ls /d/패스맵/reject-analyzer/api
```

Avoid unnecessary output redirection when it is only used to hide errors. If a path may not exist, let the error print or use an explicit existence check.

Do not ask the user to run routine Bash commands that Claude can run directly.

## Hard Rules

- Direct work on `main` is forbidden.
- `git add .` and `git add -A` are forbidden; stage only named files.
- Korean/CJK text: UTF-8 direct file I/O only; shell redirection is forbidden for writing or modifying files.
- Read-only shell redirection such as `2>/dev/null` may be used only when necessary, but avoid it if it triggers approval prompts.
- Mojibake detected (see scripts/passmap-pr-check.ps1): stop and report immediately.
- Mixed unrelated commits or files in the same branch: stop.
- One chat = one working branch whenever possible.
