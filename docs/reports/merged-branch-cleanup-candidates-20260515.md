# Merged Branch Cleanup Audit Report

**Generated:** 2026-05-15  
**Audit Branch:** `audit/merged-branch-cleanup-candidates-20260515`  
**Purpose:** Read-only audit of merged branch cleanup candidates before any deletion

---

## Cleanup Status Summary

| Phase | Description | Candidates | Status |
|-------|-------------|-----------|--------|
| Phase 1 | tmp/Claude inside-repo worktrees | **0** | DONE (Batch 3-B) |
| Phase 2 | merged+clean standard worktrees | **0** | no candidates |
| Phase 3 | merged local branches | **241 total** | see below |

**Total git worktrees:** 217 (was 225, -8 from Phase 1)

---

## Phase 3 Branch Classification

Total merged branches (including main): 241

| Group | Risk | Count | Action |
|-------|------|-------|--------|
| A | PROTECTED — never delete | 25 | no action |
| B | LOW — 1st delete candidates | 1 | safe to delete |
| C | MEDIUM — review needed | 52 | manual review before delete |
| D | HIGH — skip | 163 | do not delete |

---

## Group A: Protected (25 branches — never delete)

Branches matching protected patterns: `main`, `release/*`, `batch/*`

```
main
batch/work-trace-save-experience-cards-20260515
release/ai-resume-cta-discoverability
release/ai-resume-mvp-main
release/career-transition-batch-3a
release/career-transition-batch-3b
release/career-transition-batch-3d-cx
release/career-transition-batch-3e
release/career-transition-commerce-md-taxonomy
release/career-transition-copy-quality-batch-4b
release/career-transition-copy-quality-batch-4c
release/career-transition-copy-quality-batch-4e
release/career-transition-cs-cx-taxonomy
release/career-transition-customer-ops-cx-planning-archetypes
release/career-transition-cx-planning-taxonomy
release/career-transition-finance-fpa-archetypes
release/career-transition-hrbp-archetypes
release/career-transition-procurement-scm-archetypes
release/career-transition-resolver-v1
release/career-transition-smoke-coverage-batch-3c-3e
release/career-transition-smoke-coverage-marketing-sales
release/career-transition-smoke-coverage-operations-planning
release/career-transition-smoke-coverage-tech-data
release/mobile-app-shell-clean
release/newgrad-axis5-judgment-output
release/newgrad-whatif-ui-only
release/what-if-ui-only
```

---

## Group B: LOW Risk — 1st Delete Candidates (1 branch)

Criteria: merged into main, no worktree attached, older than 14 days, no danger pattern

```
stable/20260301  | 2026-03-02 | fix(api): add CORS + OPTIONS for /api/parse
```

**Recommended action:** safe to delete with `git branch -d stable/20260301`

---

## Group C: MEDIUM Risk — Review Needed (52 branches)

Criteria: merged into main, no worktree attached, within 14 days of 2026-05-15, no danger pattern

These branches are likely clean but were created in active sprints. Review individually before deletion.

```
fix/mobile-dashboard-compact-redesign                    | 2026-05-01
fix/mobile-result-ux-round2a                             | 2026-05-02
fix/mobile-home-record-status-card                       | 2026-05-03
fix/mobile-home-record-status-round3b                    | 2026-05-03
fix/mobile-post-save-prompt                              | 2026-05-03
fix/mobile-post-save-prompt-round3c                      | 2026-05-03
fix/newgrad-axis2-batch2a-copy-quality                   | 2026-05-03
fix/newgrad-axis2-lift-rendering-field                   | 2026-05-03
fix/newgrad-axis1-economics-pmm-major-key-hit            | 2026-05-03
fix/newgrad-axis2-card3-industry-archetypes-batch1a      | 2026-05-03
chore/github-actions-pr-validation                       | 2026-05-04
fix/newgrad-axis2-education-label-mapping                | 2026-05-04
qa/axis1-round3-output-quality                           | 2026-05-04
fix/newgrad-axis2-batch2c-content-media-entertainment    | 2026-05-04
qa/axis1-special-output-quality                          | 2026-05-04
qa/newgrad-report-e2e-after-axis1                        | 2026-05-04
temp-safe                                                | 2026-05-04
fix/newgrad-axis2-batch2bc-dropdown-registry             | 2026-05-04
fix/newgrad-axis3-detail-reading-phase1                  | 2026-05-04
fix/newgrad-axis4-job-stakeholder-profiles-batch1        | 2026-05-04
qa/newgrad-axis4-p2-batch2-after-merge-reqa              | 2026-05-04
fix/newgrad-axis2-batch2d-public-services                | 2026-05-04
fix/newgrad-axis4-stakeholder-copy-variation-clean       | 2026-05-04
fix/newgrad-axis4-copy-variation-final                   | 2026-05-04
fix/newgrad-axis4-typo-match-contact                     | 2026-05-04
fix/newgrad-axis2-batch2e-manufacturing-it-retail        | 2026-05-04
docs/newgrad-axis4-p3-option-b-lock                      | 2026-05-04
fix/newgrad-axis4-p3-industry-context-registry           | 2026-05-04
fix/newgrad-axis4-p3-wire-industry-context               | 2026-05-04
fix/newgrad-axis4-p3-render-industry-context             | 2026-05-04
fix/revert-axis2-batch2e-from-axis4-pr94                 | 2026-05-04
fix/newgrad-axis2-batch2f-logistics-construction-energy-clean | 2026-05-04
fix/newgrad-axis2-batch2g-healthcare-lifestyle-services  | 2026-05-04
fix/newgrad-axis2-batch2e-manufacturing-it-retail-clean  | 2026-05-04
fix/newgrad-axis4-comparison-block-output-path           | 2026-05-04
fix/axis2-consulting-research-archetype                  | 2026-05-04
fix/newgrad-axis3-detail-signal-separation               | 2026-05-04
fix/newgrad-axis3-detail-signal-separation-clean         | 2026-05-04
fix/newgrad-axis5-strength-workstyle-grounding           | 2026-05-04
fix/newgrad-axis3-experience-evidence-grounding-clean    | 2026-05-04
fix/newgrad-axis4-stakeholder-context-grounding          | 2026-05-04
fix/newgrad-axis1-major-job-fit-grounding                | 2026-05-04
fix/newgrad-axis1-bridge-coverage-batch1                 | 2026-05-04
fix/newgrad-mobile-goal-connection-structure-compact     | 2026-05-05
fix/resume-ai-bullet-preview-rendering-clean             | 2026-05-06
fix/resume-ai-success-state-binding                      | 2026-05-06
fix/resume-ai-production-response-diagnosis              | 2026-05-06
fix/resume-ai-after-preview-debug                        | 2026-05-06
fix/resume-ai-selected-record-source-binding             | 2026-05-06
fix/precise-analysis-result-rendering                    | 2026-05-07
fix/report-accuracy-p0-integrated                        | 2026-05-07
fix/industry-customer-structure-cap                      | 2026-05-07
```

**2차 삭제 후보 추천 (Group C에서 우선 검토):**
- `temp-safe` — temp 접두어, 검토 필요
- `fix/revert-*` 계열 — revert 완료 브랜치
- `qa/*` 계열 — QA 완료 후 삭제 가능
- `chore/github-actions-pr-validation` — CI 설정 완료

---

## Group D: HIGH Risk — Do Not Delete (163 branches)

### D-1: Worktree-attached (110 branches) — never delete while worktree exists

These branches are currently checked out in active worktrees at `D:/passmap-worktrees/`. Deleting them would corrupt active worktrees.

Notable patterns:
- `audit/*`, `design/*`, `docs/*` — docs and design research
- `feat/*`, `fix/*` — active feature/fix worktrees
- `investigate/*`, `qa/*`, `refactor/*`, `research/*` — analysis worktrees
- `restore/*` — recovery branch

**To delete these:** first remove the worktree with `git worktree remove` (only after confirming work is complete), then delete the branch.

### D-2: Recent (within 7 days of 2026-05-15) — no worktree but too recent (43 branches)

```
chore/passmap-claude-workflow-system           | 2026-05-11
chore/passmap-workflow-rebase                  | 2026-05-11
compound-read-patch                            | 2026-05-08
feat/precise-analysis-jd-url-import           | 2026-05-12
feat/rejection-p2-1-rolefit-context-risk-engines | 2026-05-09
feat/rejection-p2-2a-achievement-keyword-context | 2026-05-09
feat/rejection-p2-2b-gap-context               | 2026-05-09
feat/rejection-p3-1-grounded-ai-explanation-v2 | 2026-05-09
feat/rejection-p4-1-grounded-ai-ui-v2         | 2026-05-09
feat/rejection-resume-career-interpreter-p1a-clean | 2026-05-09
feat/required-gate-signals-contract            | 2026-05-11
feat/required-major-gate                       | 2026-05-11
feat/web-push-subscription-foundation         | 2026-05-11
feat/weekly-experience-recall-preferences     | 2026-05-11
fix/career-strength-risk-target-context-clean | 2026-05-08
fix/certification-alias-coverage-phase1       | 2026-05-11
fix/experienced-axis3-both-cross-gap          | 2026-05-09
fix/experienced-axis3-cap-explanation         | 2026-05-09
fix/experienced-axis3-cross-industry-explanation-v2 | 2026-05-09
fix/experienced-industry-relevance-tier-gate  | 2026-05-11
fix/experienced-transition-combination-read-3 | 2026-05-09
fix/experienced-transition-read-stability     | 2026-05-09
fix/experienced-transition-read-stability-2   | 2026-05-09
fix/experienced-transition-scoring-calibration-2 | 2026-05-09
fix/newgrad-axis2-industry-copy-separation-clean | 2026-05-09
fix/newgrad-axis2-industry-copy-separation-clean-final | 2026-05-09
fix/newgrad-axis2-industry-copy-separation-clean-v2 | 2026-05-09
fix/newgrad-axis4-evidence-transmission-clean | 2026-05-09
fix/newgrad-axis5-service-planning-traits     | 2026-05-09
fix/newgrad-axis5-service-planning-traits-clean | 2026-05-09
fix/newgrad-industry-archetype-alias-match    | 2026-05-09
fix/newgrad-legal-services-archetype          | 2026-05-09
fix/newgrad-mixed-market-b2bsignal            | 2026-05-09
fix/rejection-p3-1b-grounded-ai-prompt-quality | 2026-05-09
fix/reminder-settings-disclosure             | 2026-05-11
fix/required-gate-signals-risk-ctx           | 2026-05-11
fix/resume-ai-after-card-clean               | 2026-05-08
fix/resume-ai-after-card-loading-state       | 2026-05-08
fix/resume-ai-input-loading-before-navigation | 2026-05-08
fix/seniority-gate-year-unit-clean           | 2026-05-11
fix/vercel-api-function-count-consolidation  | 2026-05-09
fix/work-record-font-size-round3             | 2026-05-09
temp/compound-creative-infra-read            | 2026-05-08
```

### D-3: Danger pattern (no worktree, pattern match) (10 branches)

Branches with dangerous keywords (`hotfix`, `feature/`, `refactor`, pattern implying infra/routing):

```
feature/career-transition-smoke-coverage-marketing-sales  | 2026-05-03
feature/job-alias-phase1-patch                            | 2026-05-03
fix/mobile-home-login-cta-round2c                         | 2026-05-03
fix/newgrad-axis4-conservative-tone-hotfix                | 2026-05-04
fix/newgrad-axis5-get-strength-groups-hotfix-v2           | 2026-05-03
fix/openai-worker-vercel-delegation                       | 2026-05-04
hotfix/github-pages-transition-lite-jsx-close             | 2026-05-04
qa/newgrad-axis4-p1-hotfix-partial-reqa                   | 2026-05-04
refactor/00-safety                                        | 2026-02-13
refactor/01-utils                                         | 2026-02-19
```

---

## Key Finding: Cleanup Script Phase 3 Risk

**The current `passmap-cleanup.ps1` Phase 3 does NOT check worktree attachment before listing delete candidates.**

Previous dry-run showed "218 Phase 3 candidates", but 110 of those are currently attached to active worktrees. Running Phase 3 with `-Execute` would delete active worktree branches, breaking those worktrees.

**Do NOT run `passmap-cleanup.ps1` with Phase 3 `-Execute` until the script adds worktree attachment checks.**

---

## Classification Rules Used

| Rule | Group |
|------|-------|
| `main`, `develop`, `gh-pages`, `release/*`, `backup/*`, `protected/*`, `batch/*` | A |
| Merged, no worktree, age > 14d, no danger pattern | B |
| Merged, no worktree, within 14d | C |
| Has active worktree | D |
| Committed within 7 days | D |
| Name contains: auth, vercel, cloudflare, worker, deploy, migration, env, security, hotfix, refactor, feature/ | D |

---

## Recommended Next Steps

### Phase 3-B-1 (Low risk, minimal): 1 branch
Delete immediately after confirming:
```
git branch -d stable/20260301
```

### Phase 3-B-2 (Medium, after review): up to 52 branches
Review Group C list. Suggested first batch for deletion (all merged, no worktree, > 7d):
- `temp-safe` (temp prefix)
- `qa/*` branches from 2026-05-04 (6 branches — QA work complete)
- `chore/github-actions-pr-validation`
- `fix/revert-axis2-batch2e-from-axis4-pr94`

**Requires explicit approval before running.**

### Phase 3-C (Large scale, high complexity): 110 worktree-attached branches
- First: audit which worktrees are actually still in use
- Then: remove worktree → delete branch (per branch)
- Requires worktree cleanup script enhancements (Phase 2 of passmap-cleanup.ps1)

### Script Enhancement Needed
Before running Phase 3 execute, `passmap-cleanup.ps1` needs to:
1. Check each Phase 3 candidate for active worktree attachment
2. Skip or separately flag worktree-attached branches
3. Add a `--IncludeWorktreeAttached` flag for explicit override

---

*No branches were deleted in generating this report.*  
*All data collected with read-only git commands.*
