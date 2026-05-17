# Phase 2 Worktree Cleanup Candidates Audit

**Audit Date**: 2026-05-18  
**Branch**: audit/phase2-worktree-cleanup-candidates-20260516  
**Scope**: Read-only audit — no worktree or branch deletions executed

---

## 1. Dry-Run Summary

| Phase | Count | Description |
|-------|-------|-------------|
| Phase 1 | 0 | tmp/Claude inside-repo worktrees |
| Phase 2 | 10 | merged+clean standard-location worktrees |
| Phase 3 | 23 | merged local branches (pending) |
| Phase 3 protected | 25 | excluded by pattern |
| Phase 3 wt-skip | 109 | worktree-attached, skipped |

Script: `scripts/passmap-cleanup.ps1` (dry-run only, no `-Execute` flag)

---

## 2. Phase 2 Candidates — Raw Data

All 10 candidates confirmed: path EXISTS, status CLEAN, branch merged into main.

| # | Worktree Path | Branch | HEAD (short) | Last Commit Date | Days Ago | Upstream |
|---|--------------|--------|--------------|------------------|----------|----------|
| 1 | D:/passmap-worktrees/axis1-bridge-sync-structural | fix/newgrad-axis1-bridge-sync-structural | a879b2a | 2026-05-11 | 7 | origin/fix/newgrad-axis1-bridge-sync-structural |
| 2 | D:/passmap-worktrees/deploy-main-check | fix/resume-ai-state-render-binding | 703d1a5 | 2026-05-06 | 12 | origin/fix/resume-ai-state-render-binding |
| 3 | D:/passmap-worktrees/deploy-trigger-vercel-main | chore/vercel-production-redeploy-trigger | fc422e9 | 2026-05-04 | 14 | origin/main (behind 347) |
| 4 | D:/passmap-worktrees/fix-pharma-ra-axis2 | fix/newgrad-axis2-pharma-ra-specialization | 68e708b | 2026-05-12 | 6 | origin/fix/newgrad-axis2-pharma-ra-specialization |
| 5 | D:/passmap-worktrees/fix-service-planning-bridge | fix/newgrad-axis1-service-planning-bridge-key | afabe00 | 2026-05-11 | 7 | origin/fix/newgrad-axis1-service-planning-bridge-key |
| 6 | D:/passmap-worktrees/hotfix-main-industry-registry-build | hotfix/main-industry-registry-build | 2b26ced | 2026-05-04 | 14 | origin/main (behind 349) |
| 7 | D:/passmap-worktrees/newgrad-axis1-bridge-content-batch1 | fix/newgrad-axis1-bridge-content-batch1 | bed2416 | 2026-05-11 | 7 | origin/fix/newgrad-axis1-bridge-content-batch1 |
| 8 | D:/passmap-worktrees/newgrad-whatif-priority-map-step7a | fix/newgrad-whatif-priority-map-step7a | ad22b95 | 2026-05-11 | 7 | origin/fix/newgrad-whatif-priority-map-step7a |
| 9 | D:/passmap-worktrees/resume-ai-source-binding-audit | fix/resume-ai-source-binding-audit-clean | 1ff1e8b | 2026-05-06 | 12 | origin/main (behind 282) |
| 10 | D:/passmap-worktrees/work-record-font-size-round3 | fix/work-record-font-size-round3-clean | 5b21ad9 | 2026-05-09 | 9 | origin/fix/work-record-font-size |

**All paths**: Located under `D:/passmap-worktrees/` (external standard location, not inside repo root).  
**All statuses**: CLEAN (confirmed via `git -C <path> status --short`).  
**All branches**: Confirmed merged into main via `git branch --merged main`.

---

## 3. Classification

### Group Counts

| Group | Count |
|-------|-------|
| A. SAFE_WORKTREE_REMOVE_NEXT | 2 |
| B. DEFER_ACTIVE_OR_RECENT | 5 |
| C. DANGER_OR_PROTECTED | 2 |
| D. DIRTY_OR_ERROR | 0 |
| E. UNKNOWN_REVIEW | 1 |
| **Total** | **10** |

---

### A. SAFE_WORKTREE_REMOVE_NEXT (2개)

Branch merged, clean, >7 days ago, no danger keyword, no protected pattern, not current branch, external path.

#### #9 — resume-ai-source-binding-audit

| Field | Value |
|-------|-------|
| Path | D:/passmap-worktrees/resume-ai-source-binding-audit |
| Branch | fix/resume-ai-source-binding-audit-clean |
| HEAD | 1ff1e8b |
| Status | CLEAN |
| Merged into main | YES |
| Last commit | 2026-05-06 (12 days ago) |
| Upstream | origin/main (behind 282) |
| Danger keyword | none |
| Protected | NO |
| Current branch | NO |
| Reason | Branch HEAD is a Merge PR commit (#145), upstream tracking reset to origin/main. Clearly done. |

#### #10 — work-record-font-size-round3

| Field | Value |
|-------|-------|
| Path | D:/passmap-worktrees/work-record-font-size-round3 |
| Branch | fix/work-record-font-size-round3-clean |
| HEAD | 5b21ad9 |
| Status | CLEAN |
| Merged into main | YES |
| Last commit | 2026-05-09 (9 days ago) |
| Upstream | origin/fix/work-record-font-size (tracking mismatch — remote branch differs from local branch name) |
| Danger keyword | none |
| Protected | NO |
| Current branch | NO |
| Reason | Straightforward UI copy fix. 9 days old, merged, clean. Upstream name mismatch is benign. |

---

### B. DEFER_ACTIVE_OR_RECENT (5개)

Last commit ≤7 days ago (≥ 2026-05-11). Recent enough to defer to a later batch.

| # | Path | Branch | Last Commit | Days Ago | Reason |
|---|------|--------|-------------|----------|--------|
| 1 | D:/passmap-worktrees/axis1-bridge-sync-structural | fix/newgrad-axis1-bridge-sync-structural | 2026-05-11 | 7 (boundary) | 7-day boundary. Bridge resolver alias patch. |
| 4 | D:/passmap-worktrees/fix-pharma-ra-axis2 | fix/newgrad-axis2-pharma-ra-specialization | 2026-05-12 | 6 | Most recent of 5 — still within active window. |
| 5 | D:/passmap-worktrees/fix-service-planning-bridge | fix/newgrad-axis1-service-planning-bridge-key | 2026-05-11 | 7 (boundary) | 7-day boundary. Key scope safety patch. |
| 7 | D:/passmap-worktrees/newgrad-axis1-bridge-content-batch1 | fix/newgrad-axis1-bridge-content-batch1 | 2026-05-11 | 7 (boundary) | 7-day boundary. Batch content data. May still be useful for QA reference. |
| 8 | D:/passmap-worktrees/newgrad-whatif-priority-map-step7a | fix/newgrad-whatif-priority-map-step7a | 2026-05-11 | 7 (boundary) | 7-day boundary. Step 7a in multi-step priority map series. |

**Recommendation**: Re-evaluate in Batch 3-D-2 after 2026-05-25. If still clean and no active QA references, move to SAFE.

---

### C. DANGER_OR_PROTECTED (2개)

Branch name contains danger keywords or matches protected pattern. Do not remove without explicit user approval.

#### #3 — deploy-trigger-vercel-main

| Field | Value |
|-------|-------|
| Path | D:/passmap-worktrees/deploy-trigger-vercel-main |
| Branch | chore/vercel-production-redeploy-trigger |
| HEAD | fc422e9 |
| Status | CLEAN |
| Merged into main | YES |
| Last commit | 2026-05-04 (14 days ago) |
| Upstream | origin/main (behind 347) |
| Danger keyword | `vercel`, `deploy` (both in branch name) |
| Protected | NO (chore/ prefix, but danger keywords present) |
| Reason | Branch name explicitly references Vercel and deploy. Although merged and likely done, deploy-related worktrees need explicit user sign-off before removal. |

#### #6 — hotfix-main-industry-registry-build

| Field | Value |
|-------|-------|
| Path | D:/passmap-worktrees/hotfix-main-industry-registry-build |
| Branch | hotfix/main-industry-registry-build |
| HEAD | 2b26ced |
| Status | CLEAN |
| Merged into main | YES |
| Last commit | 2026-05-04 (14 days ago) |
| Upstream | origin/main (behind 349) |
| Danger keyword | none in branch name |
| Protected | YES (`hotfix/` prefix matches protected pattern) |
| Reason | `hotfix/` is a protected branch prefix per cleanup script rules. Explicit user approval required before removing worktree. |

---

### D. DIRTY_OR_ERROR (0개)

None. All 10 Phase 2 candidates confirmed CLEAN.

---

### E. UNKNOWN_REVIEW (1개)

#### #2 — deploy-main-check

| Field | Value |
|-------|-------|
| Path | D:/passmap-worktrees/deploy-main-check |
| Branch | fix/resume-ai-state-render-binding |
| HEAD | 703d1a5 |
| Status | CLEAN |
| Merged into main | YES |
| Last commit | 2026-05-06 (12 days ago) |
| Upstream | origin/fix/resume-ai-state-render-binding |
| Danger keyword | none in branch name; `deploy` appears in worktree directory name |
| Protected | NO |
| Reason | Branch `fix/resume-ai-state-render-binding` is a clean UI fix — no danger keywords. However, the worktree directory is named `deploy-main-check`, suggesting it was used to verify a deployment. Whether any deployment artifact or verification result depends on this path is unclear. Classified UNKNOWN_REVIEW for safety. |

**Recommendation**: If confirmed that no deployment tooling references this path, reclassify to SAFE in Batch 3-D-1.

---

## 4. tiny/mobile-home-work-calendar-cta-20260515 Contamination Issue

**Relationship to Phase 2 candidates**: NONE

- The branch `tiny/mobile-home-work-calendar-cta-20260515` is NOT attached to any worktree.
- It does NOT appear in the Phase 2 candidates list.
- `git worktree list | grep mobile-home-work-calendar` → no match.
- `git branch --merged main | grep mobile-home-work-calendar` → NOT merged into main.

**Contamination observation (read-only)**:

- `git diff main...tiny/mobile-home-work-calendar-cta-20260515` shows only `docs/reports/branch-cleanup-execution-20260516-batch3.*` as diffs.
- The branch tip commit is `4eb1207 docs(cleanup): record merged branch cleanup batch3` — this is a cleanup docs commit that should not be on a feature branch named `tiny/mobile-home-work-calendar-cta-20260515`.
- This suggests that during Batch3 cleanup execution, a docs commit was accidentally made on (or squashed into) this branch instead of going to the audit branch.

**Action required**: Separate task. Do NOT reset or modify in this session. This branch needs targeted recovery (likely `git reset` to a safe parent or cherry-pick of the actual mobile CTA work). Classify as blocked/contaminated in branch tracking.

---

## 5. Next Steps

### Batch 3-D-1 (Immediate — safe to execute)

Remove only the SAFE_WORKTREE_REMOVE_NEXT worktrees:

```
git worktree remove D:/passmap-worktrees/resume-ai-source-binding-audit
git worktree remove D:/passmap-worktrees/work-record-font-size-round3
```

Note: Removing the worktree does NOT delete the local branch. Branches `fix/resume-ai-source-binding-audit-clean` and `fix/work-record-font-size-round3-clean` will remain (and can be cleaned in a later Phase 3 batch if appropriate).

### Batch 3-D-2 (Deferred — after 2026-05-25)

Re-evaluate the 5 DEFER_ACTIVE_OR_RECENT candidates. If no active QA/reference is ongoing, move to SAFE.

### UNKNOWN_REVIEW (#2 deploy-main-check)

Confirm manually whether any deployment tooling references `D:/passmap-worktrees/deploy-main-check`. If no, add to Batch 3-D-1 or 3-D-2.

### DANGER_OR_PROTECTED (#3, #6)

Require explicit user approval:
- `deploy-trigger-vercel-main`: User confirms vercel redeploy is no longer needed → SAFE
- `hotfix-main-industry-registry-build`: User confirms hotfix is complete and stable → SAFE

### tiny/mobile-home-work-calendar-cta-20260515 Recovery

Separate task. Investigate whether the feature work was properly merged (work-trace calendar display sync PR #350 was merged) and recover the branch to its correct state.

---

## 6. Execution Confirmation

- **Actual worktree deletions executed**: **NO**
- **Actual branch deletions executed**: **NO**
- **reset --hard executed**: **NO**
- **Scripts modified**: **NO**
- **App source modified**: **NO**
- **Files changed**: `docs/reports/phase2-worktree-cleanup-candidates-20260516.md`, `docs/reports/phase2-worktree-cleanup-candidates-20260516.csv`
