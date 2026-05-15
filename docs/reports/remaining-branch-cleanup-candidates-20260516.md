# Remaining Branch Cleanup Candidates — Audit (2026-05-16)

**Executed on:** 2026-05-16  
**Branch:** audit/remaining-branch-cleanup-candidates-20260516  
**Scope:** Phase 3 merged branch candidates remaining after Batch 3  
**Purpose:** Read-only re-classification. No branch deletions performed.

---

## Phase 3 Snapshot

| Metric | Value |
|--------|-------|
| Phase 3 candidates | **27** |
| Phase 3 protected | 25 |
| Phase 3 wt-skip (Phase 2) | 109 |

Protected patterns: `^main`, `^develop`, `^gh-pages`, `^release/`, `^backup/`, `^protected/`, `^batch/`

---

## Classification Summary

| Group | Label | Count |
|-------|-------|-------|
| A | SAFE_DELETE_NEXT | 4 |
| B | DEFER_FEAT_FEATURE | 13 |
| C | REMOTE_DIVERGENCE | 2 |
| D | WORKTREE_ATTACHED | 0 |
| E | PROTECTED_OR_DANGER | 5 |
| F | UNKNOWN_REVIEW | 3 |
| **Total** | | **27** |

---

## Group A: SAFE_DELETE_NEXT (4)

Merged, no danger keywords, not worktree-attached. Ready for `git branch -d` in next batch.

| Branch | Last Commit | Upstream | Note |
|--------|-------------|----------|------|
| `compound-read-patch` | 2026-05-08 | _(none)_ | no upstream; no danger keyword |
| `fix/certification-alias-coverage-phase1` | 2026-05-11 | origin/fix/certification-alias-coverage-phase1 | own upstream |
| `fix/reminder-settings-disclosure` | 2026-05-11 | origin/main | tracks main |
| `hotfix/github-pages-transition-lite-jsx-close` | 2026-05-04 | origin/hotfix/github-pages-transition-lite-jsx-close | JSX close fix only |

---

## Group B: DEFER_FEAT_FEATURE (13)

Excluded by design: `feat/*` and `feature/*` patterns. Need separate review before deletion.

| Branch | Last Commit | Upstream |
|--------|-------------|----------|
| `feat/precise-analysis-jd-url-import` | 2026-05-12 | _(none)_ |
| `feat/rejection-p2-1-rolefit-context-risk-engines` | 2026-05-09 | origin/main |
| `feat/rejection-p2-2a-achievement-keyword-context` | 2026-05-09 | origin/main |
| `feat/rejection-p2-2b-gap-context` | 2026-05-09 | origin/main |
| `feat/rejection-p3-1-grounded-ai-explanation-v2` | 2026-05-09 | origin/feat/rejection-p3-1-grounded-ai-explanation-v2 |
| `feat/rejection-p4-1-grounded-ai-ui-v2` | 2026-05-09 | origin/feat/rejection-p4-1-grounded-ai-ui-v2 |
| `feat/rejection-resume-career-interpreter-p1a-clean` | 2026-05-09 | origin/feat/rejection-resume-career-interpreter-p1a-clean |
| `feat/required-gate-signals-contract` | 2026-05-11 | origin/feat/required-gate-signals-contract |
| `feat/required-major-gate` | 2026-05-11 | origin/feat/required-major-gate |
| `feat/web-push-subscription-foundation` | 2026-05-11 | origin/feat/web-push-subscription-foundation |
| `feat/weekly-experience-recall-preferences` | 2026-05-11 | origin/feat/weekly-experience-recall-preferences |
| `feature/career-transition-smoke-coverage-marketing-sales` | 2026-05-03 | origin/main |
| `feature/job-alias-phase1-patch` | 2026-05-03 | _(none)_ |

---

## Group C: REMOTE_DIVERGENCE (2)

`git branch -d` was attempted and refused. Remote tracking branch has diverged from local branch.  
`-D` (force) is forbidden. Needs manual resolution or remote cleanup.

| Branch | Last Commit | Upstream (diverged) | Batch Failed |
|--------|-------------|---------------------|--------------|
| `fix/newgrad-axis1-bridge-coverage-batch1` | 2026-05-04 | origin/fix/newgrad-axis1-**major-job-fit-grounding** | Batch 1 |
| `fix/resume-ai-after-card-loading-state` | 2026-05-08 | origin/fix/resume-ai-after-card-loading-state | Batch 3 |

**Note:** `fix/newgrad-axis1-bridge-coverage-batch1` has a mismatched upstream — it tracks a different remote branch (`origin/fix/newgrad-axis1-major-job-fit-grounding`) not its own origin.

---

## Group D: WORKTREE_ATTACHED (0)

No worktree-attached branches remain in Phase 3 candidates. Worktree-attached branches (109 total) are tracked separately as Phase 2.

---

## Group E: PROTECTED_OR_DANGER (5)

Contains danger keyword (`auth`, `supabase`, `vercel`, `cloudflare`, `worker`, `deploy`, `security`, `env`, `routing`, `payment`, `login`) or matched a previously excluded pattern (`refactor/`).

| Branch | Last Commit | Trigger |
|--------|-------------|---------|
| `fix/mobile-home-login-cta-round2c` | 2026-05-03 | `login` keyword |
| `fix/openai-worker-vercel-delegation` | 2026-05-04 | `worker` + `vercel` keywords |
| `fix/vercel-api-function-count-consolidation` | 2026-05-09 | `vercel` keyword |
| `refactor/00-safety` | 2026-02-13 | `refactor/` pattern + `safety` |
| `refactor/01-utils` | 2026-02-19 | `refactor/` pattern |

---

## Group F: UNKNOWN_REVIEW (3)

Branches that need manual review before classification. Do not delete without explicit approval.

| Branch | Last Commit | Upstream | Issue |
|--------|-------------|----------|-------|
| `chore/passmap-claude-workflow-system` | 2026-05-11 | origin/chore/passmap-claude-workflow-system | chore branch contains app feature commit (`feat(mvp): add editable resume experiences`); passmap workflow exclusion |
| `chore/passmap-workflow-rebase` | 2026-05-11 | origin/chore/passmap-claude-workflow-system | upstream mismatch (tracks different remote branch) — may fail `git branch -d`; passmap workflow exclusion |
| `fix/required-gate-signals-risk-ctx` | 2026-05-11 | origin/fix/required-gate-signals-risk-ctx | `required-gate` exclusion pattern from previous batches; needs separate review |

---

## What Was NOT Done

| Item | Action |
|------|--------|
| `git branch -d` | NOT executed |
| `git branch -D` (force) | NOT executed |
| Remote branch deletion | NOT done |
| Worktree deletion | NOT done |
| Phase 2 worktrees | NOT touched |
| `scripts/passmap-cleanup.ps1` | NOT modified |

---

## Batch 4 Recommendations

### Immediate (Batch 4)
Group A (4 branches) are ready for safe deletion:
- `compound-read-patch`
- `fix/certification-alias-coverage-phase1`
- `fix/reminder-settings-disclosure`
- `hotfix/github-pages-transition-lite-jsx-close`

### Separate Decision Required
- **Group B (13)**: Review feat/* and feature/* merged branches — are they still referenced in any open work?
- **Group C (2)**: `fix/newgrad-axis1-bridge-coverage-batch1` and `fix/resume-ai-after-card-loading-state` — remote divergence; requires either pushing a fix to align the remote tracking branch or using `-D` (force, currently forbidden)
- **Group E (5)**: Danger keyword branches — verify each is truly safe before approving
- **Group F (3)**: Manual review needed — especially `chore/passmap-claude-workflow-system` and `chore/passmap-workflow-rebase`
