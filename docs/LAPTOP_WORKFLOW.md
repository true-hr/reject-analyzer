# PASSMAP Laptop Workflow Rules

This document describes operating rules for working on PASSMAP from a laptop clone that is physically separate from the primary PC workspace.

## 1. Scope of This Document

These rules apply only when the working clone is the laptop clone located at:

```
C:\Users\qorrk\Documents\passmap-work\reject-analyzer
```

If the active clone is anywhere else (for example a PC path under `D:\패스맵\reject-analyzer` or any worktree), this document does not apply and the standard PASSMAP PC workflow takes precedence.

## 2. Repository Identity

- The laptop clone is a **separate local clone** of the same GitHub repository used by the PC workspace. It is not a worktree of the PC clone and does not share `.git` with it.
- The GitHub remote for both clones is the existing PASSMAP repository:
  - `origin` -> `https://github.com/true-hr/reject-analyzer.git`
- Both clones push to and pull from the same `origin`. The only thing that differs is the local filesystem location, the local branches, and the local working tree.

## 3. Path Assumptions

The laptop clone must never assume the existence of PC-only paths. The following paths exist only on the PC and must not appear in laptop-side commands, scripts, or generated docs:

- `D:\패스맵\reject-analyzer`
- `D:\패스맵\worktrees`
- `D:\passmap-worktrees`
- `D:\잡다\...`
- Any other `D:\` path used by the PC workflow

If a laptop session needs to reference PC-only paths (for example when documenting a PC-side incident), reference them as historical strings only, never as targets of file I/O or shell commands.

## 4. Mandatory Pre-Work Environment Check

Before any task (including read-only investigation), confirm the laptop environment by running, in order:

1. `pwd` (or PowerShell equivalent) to confirm the current directory
2. `git rev-parse --show-toplevel` to confirm the repo root is the laptop path in section 1
3. `git branch --show-current` to confirm the current branch
4. `git status --short` to confirm the working tree state
5. `git remote -v` to confirm the remote URL matches section 2

If any of these checks does not match expectations, stop and report rather than proceeding.

## 5. Branching

- Direct work on `main` is forbidden on the laptop clone, the same as on the PC clone.
- Always work on a dedicated task branch.
- The laptop maintenance branch `batch/laptop-safe-work-YYYYMMDD` is reserved for laptop setup and laptop hygiene tasks; do not mix product feature work into it.

## 6. Batching Small Edits

- Do not split every small edit into its own PR.
- Group 3 to 7 related small edits into one batch branch and open one PR.
- A PR should be sized as a **QA-able verification unit**, not as a wrapper for a single edit.

## 7. Build and Test Discipline

- Do not run `npm run build` or the test suite after every edit inside a batch.
- Run build or tests at most once per batch, at the end, and only when the change class actually requires it (see CLAUDE.md "Verification Rules").
- Documentation-only changes do not require build or test runs.

## 8. Staging Discipline

- `git add .` and `git add -A` are forbidden.
- Stage only explicitly named files, for example:
  - `git add docs/LAPTOP_WORKFLOW.md CLAUDE.md`
- If `git status` shows any unrelated modified file (especially `.claude/settings.local.json`), do not include it in the current commit.

## 9. Protected Surface on the Laptop

The following changes are Protected on the laptop clone and must be split into a dedicated branch with a dedicated PR. They also require explicit user approval before push, merge, or deploy:

- Any direct edit to `main` or `gh-pages`
- Merge operations
- Deploy or redeploy (Vercel, GitHub Pages, etc.)
- Vercel project or environment configuration changes
- Supabase changes (DB schema, Auth, Storage, RLS)
- Environment variable changes
- GitHub Actions workflow changes under `.github/`
- Authentication, login, payment, or routing structure changes
- Large-scale `src/App.jsx` structural changes
- Destructive git operations (`git reset --hard`, `git push --force`, `git clean -fd`, branch deletion of unmerged work, etc.)

## 10. Allowed Laptop Work

Work that is acceptable to perform from the laptop without special approval:

- Code investigation and read-only analysis
- Small bug fixes scoped to a single feature
- UI copy and microcopy adjustments
- Report quality improvements
- Test additions and QA passes
- Commits and PR creation on dedicated task branches

## 11. Merge and Deploy on Laptop

- `merge` and deploy actions are technically possible from the laptop, but they are Protected (see section 9).
- Perform them only when the user has explicitly requested that specific merge or deploy.
- Never merge or deploy as an "obvious next step" inferred from the task description.

## 12. Local Settings File Hygiene

- `.claude/settings.local.json` is currently a tracked file in the repository.
- Claude Code may automatically accumulate permission allow entries into this file during a session.
- Such accumulated changes must **not** be folded into a feature, fix, or docs commit.
- Default handling: at the end of a session, if `.claude/settings.local.json` is the only modified file and the additions are session-incidental permission entries, restore it with `git restore -- .claude/settings.local.json`.

## 13. Out of Scope for Laptop Routine

Deciding whether to untrack `.claude/settings.local.json` (for example via `git rm --cached` plus a `.gitignore` entry) is **not** part of this laptop workflow. It is a separate cross-clone decision that affects the PC environment too, and must be planned and executed as its own dedicated task.

## 14. Reporting

Every laptop session should end with a short report following the format in `CLAUDE.md` "Chat Final Report Format", with one addition: the report should make the environment check result explicit (pwd, repo root, branch, working-tree-clean status) so that future sessions can see which clone the work was performed in.
