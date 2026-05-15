# Branch Cleanup Execution Log — Batch 1 (2026-05-15)

**Executed on:** 2026-05-15  
**Scope:** Phase 3 merged branch candidates — Group B/C low-risk batch  
**Target count:** 45 candidates (30–50 range)

---

## Selection Criteria

### Included (must satisfy ALL)
- `git branch --merged main` 포함
- Not attached to any worktree
- Last commit older than 7 days (before 2026-05-08)
- Matches safe pattern: `qa/*`, `temp*`, `docs/*`, `chore/*`, `fix/revert-*`, `fix/*typo*`, `fix/*copy*`, `fix/*polish*`, `fix/*label*`, `fix/*mapping*`, `fix/mobile-*`, `fix/newgrad-axis*`

### Excluded
- `main`, current branch, protected patterns (`release/*`, `batch/*` etc.)
- Worktree-attached branches
- Branches with: `auth`, `supabase`, `vercel`, `cloudflare`, `worker`, `deploy`, `security`, `env`, `routing`, `payment`, `login`, `migration`, `data`, `refactor`
- `feat/*`, `feature/*` (excluded by design)
- Branches committed within 7 days of 2026-05-15

---

## Before / After

| Metric | Before | After |
|--------|--------|-------|
| Phase 1 candidates | 0 | 0 |
| Phase 2 candidates | 10 | 10 |
| Phase 3 candidates | 105 | **61** |
| Phase 3 protected | 24 | 24 |
| Phase 3 wt-skip | 109 | 109 |

Δ Phase 3: −44 (matches deletion count exactly)

---

## Deletion Results

**Total candidates:** 45  
**Deleted (success):** 44  
**Failed:** 1  
**Skipped:** 0

### Deleted Successfully (44)

| Branch | Date |
|--------|------|
| fix/mobile-dashboard-compact-redesign | 2026-05-01 |
| fix/mobile-result-ux-round2a | 2026-05-02 |
| fix/newgrad-axis2-lift-rendering-field | 2026-05-03 |
| fix/newgrad-axis2-card3-industry-archetypes-batch1a | 2026-05-03 |
| fix/newgrad-axis1-economics-pmm-major-key-hit | 2026-05-03 |
| fix/newgrad-axis2-batch2a-copy-quality | 2026-05-03 |
| fix/newgrad-axis5-get-strength-groups-hotfix-v2 | 2026-05-03 |
| fix/mobile-post-save-prompt-round3c | 2026-05-03 |
| fix/mobile-home-record-status-card | 2026-05-03 |
| fix/mobile-post-save-prompt | 2026-05-03 |
| fix/mobile-home-record-status-round3b | 2026-05-03 |
| fix/newgrad-axis4-stakeholder-copy-variation-clean | 2026-05-04 |
| fix/newgrad-axis4-stakeholder-context-grounding | 2026-05-04 |
| fix/newgrad-axis4-job-stakeholder-profiles-batch1 | 2026-05-04 |
| fix/newgrad-axis4-copy-variation-final | 2026-05-04 |
| fix/newgrad-axis4-p3-industry-context-registry | 2026-05-04 |
| fix/newgrad-axis4-p3-wire-industry-context | 2026-05-04 |
| fix/newgrad-axis4-p3-render-industry-context | 2026-05-04 |
| qa/newgrad-axis4-p2-batch2-after-merge-reqa | 2026-05-04 |
| qa/newgrad-axis4-p1-hotfix-partial-reqa | 2026-05-04 |
| temp-safe | 2026-05-04 |
| qa/newgrad-report-e2e-after-axis1 | 2026-05-04 |
| qa/axis1-special-output-quality | 2026-05-04 |
| fix/newgrad-axis5-strength-workstyle-grounding | 2026-05-04 |
| fix/newgrad-axis4-typo-match-contact | 2026-05-04 |
| qa/axis1-round3-output-quality | 2026-05-04 |
| fix/revert-axis2-batch2e-from-axis4-pr94 | 2026-05-04 |
| fix/newgrad-axis4-conservative-tone-hotfix | 2026-05-04 |
| fix/newgrad-axis2-batch2c-content-media-entertainment | 2026-05-04 |
| fix/newgrad-axis2-batch2bc-dropdown-registry | 2026-05-04 |
| fix/newgrad-axis2-batch2e-manufacturing-it-retail | 2026-05-04 |
| fix/newgrad-axis2-batch2d-public-services | 2026-05-04 |
| docs/newgrad-axis4-p3-option-b-lock | 2026-05-04 |
| chore/github-actions-pr-validation | 2026-05-04 |
| fix/newgrad-axis1-major-job-fit-grounding | 2026-05-04 |
| fix/newgrad-axis2-batch2e-manufacturing-it-retail-clean | 2026-05-04 |
| fix/newgrad-axis3-detail-signal-separation-clean | 2026-05-04 |
| fix/newgrad-axis3-detail-signal-separation | 2026-05-04 |
| fix/newgrad-axis4-comparison-block-output-path | 2026-05-04 |
| fix/newgrad-axis3-experience-evidence-grounding-clean | 2026-05-04 |
| fix/newgrad-axis2-batch2g-healthcare-lifestyle-services | 2026-05-04 |
| fix/newgrad-axis2-batch2f-logistics-construction-energy-clean | 2026-05-04 |
| fix/newgrad-axis3-detail-reading-phase1 | 2026-05-04 |
| fix/newgrad-axis2-education-label-mapping | 2026-05-04 |

### Failed (1)

| Branch | Reason |
|--------|--------|
| fix/newgrad-axis1-bridge-coverage-batch1 | `git branch -d` refused: not merged to `refs/remotes/origin/fix/newgrad-axis1-major-job-fit-grounding` (remote tracking divergence). Merged to local main. `-D` forbidden. |

---

## What Was NOT Done

| Item | Action |
|------|--------|
| `git branch -D` (force) | NOT used |
| Remote branch deletion | NOT done |
| Worktree deletion | NOT done |
| Phase 2 worktrees (10 candidates) | NOT touched |
| Phase 3 remaining 61 branches | NOT touched |
| `scripts/passmap-cleanup.ps1` | NOT modified |

---

## Command Used

```bash
git branch -d <branch>   # safe delete only; refused if not merged
```

---

## Next Batch Suggestions (Batch 2)

**Remaining Phase 3 candidates: 61**

### Immediate (safe patterns, no worktree)

From remaining merged-branch list, next candidates likely include:
- `fix/axis2-consulting-research-archetype`
- `fix/experienced-axis3-*` series (3 entries)
- `fix/experienced-industry-relevance-tier-gate`
- `chore/passmap-*` (2 entries — caution: passmap workflow)
- `compound-read-patch`
- `fix/newgrad-mobile-goal-connection-structure-compact`
- `fix/resume-ai-bullet-preview-rendering-clean`
- `fix/resume-ai-success-state-binding`
- `fix/resume-ai-production-response-diagnosis`
- `fix/resume-ai-after-preview-debug`
- `fix/resume-ai-selected-record-source-binding`
- `fix/precise-analysis-result-rendering`
- `fix/report-accuracy-p0-integrated`
- `fix/industry-customer-structure-cap`

→ 별도 검토 후 Batch 2 승인 필요

### Deferred
- `feat/*` 계열 (reject engines, required gates, web push): 별도 검토
- `feature/*` 계열: 별도 검토
- `fix/newgrad-axis1-bridge-coverage-batch1`: `-D` 없이 삭제 불가 — 보류
