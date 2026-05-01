# Resume ViewModel Migration Map

**Status**: P-5C-0 audit (2026-04-28)
**Scope**: `PmMvpView.jsx` — legacy computed variable inventory vs ViewModel pipeline

---

## Architecture Summary

```
WorkRecord (DB / externalLastInput)
  └─ buildResumeUpdateCandidateFromRecord()   [recordToResumeCandidate.js]
       └─ latestResumeCandidate (ResumeUpdateCandidate)
            └─ buildResumeDraftViewModel()    [buildResumeDraftViewModel.js]
                 └─ resumeDraftViewModel
                      └─ viewModel* aliases  → JSX
```

Legacy path (pre-P-5B):

```
result (buildDemoResult)
  └─ safeCandidateResumeSentence
       └─ finalExperienceBullets / achievementText / finalSkillItems → JSX (direct)
```

Both paths currently coexist. `viewModel*` aliases fall back to legacy vars when ViewModel output is empty.

---

## Variable Inventory

### Group A — ViewModel Pipeline (DO NOT TOUCH)

| Variable | Source | JSX direct | ViewModel input | Notes |
|---|---|---|---|---|
| `result` | `buildDemoResult(lastInput, sourceTrack)` | Yes | Yes | `introParagraph`, `sourcePreview`, `improvementNotes` source |
| `latestResumeCandidate` | useMemo (P-4A) | No | Yes | Central candidate; drives all resume sections |
| `safeCandidateResumeSentence` | derived (P-4A.5) | No | Indirectly | Medium+ only; used by `finalExperienceBullets` |
| `displayAchievementText` | derived (P-4A.6) | No | Yes (`fallbackAchievementText`) | Critical gate: candidate-aware with `hasResumeLine` fallback |
| `improvementNotes` | useMemo | No | Yes | Passed directly to `buildResumeDraftViewModel` |
| `resumeExperienceBullets` | useMemo | No | Yes | Passed directly to `buildResumeDraftViewModel` |
| `resumeSkillItems` | useMemo | No | Yes | Passed directly to `buildResumeDraftViewModel` |
| `resumeHeadline` | `pickFirstText(...)` | Yes | Yes (`profile.role`) | Header + ViewModel profile |
| `resumeDraftViewModel` | useMemo (P-5B) | No | — | Top of ViewModel output |
| `viewModelExperienceBullets` | alias (P-5B) | Yes (경력) | — | `resumeDraftViewModel.experiences` \|\| `finalExperienceBullets` |
| `viewModelAchievementText` | alias (P-5B) | Yes (주요 성과) | — | `resumeDraftViewModel.achievementHighlights[0]` \|\| `displayAchievementText` |
| `viewModelSkillItems` | alias (P-5B) | Yes (보유 역량) | — | `resumeDraftViewModel.skillTags` \|\| `finalSkillItems` |
| `viewModelImprovementNotes` | alias (P-5B) | Yes (개선 메모) | — | `resumeDraftViewModel.improvementNotes` \|\| `improvementNotes` |
| `sourcePreview` | useMemo | Yes (BEFORE-AFTER) | No | BEFORE-AFTER 비교 섹션; not in ViewModel |
| `introParagraph` | `pickFirstText(result.summary...)` | Yes (소개) | No | Not yet in ViewModel |
| `introDetail` | `pickFirstText(result.resumeLine...)` | Yes (소개) | No | Not yet in ViewModel |
| `hasResumeLine` | derived | No | No | Guard inside `displayAchievementText` |

### Group B — Legacy Intermediates (P-5C-1 cleanup candidates)

| Variable | Created | Why legacy | Blocked by | Safe to delete when |
|---|---|---|---|---|
| `finalExperienceBullets` | P-4A useMemo | Replaced by `viewModelExperienceBullets` fallback | `viewModelExperienceBullets` still falls back to it | ViewModel always non-empty for experience section |
| `achievementText` | P-4A useMemo | Replaced via `displayAchievementText` → `viewModelAchievementText` | `displayAchievementText` reads it | Inline `displayAchievementText` without `achievementText` step |
| `finalSkillItems` | P-4A useMemo | Replaced by `viewModelSkillItems` fallback | `viewModelSkillItems` still falls back to it | ViewModel always non-empty for skill section |

### Group C — Guard Variables (keep, not extractable)

| Variable | Role |
|---|---|
| `candidateConfidence` | `latestResumeCandidate?.confidenceLevel` guard |
| `candidateResumeSentence` | raw sentence before draft check |
| `isDraftSentence` | boolean: low confidence OR "기록 기반 초안:" prefix |
| `safeCandidateResumeSentence` | filtered: `!isDraftSentence ? sentence : ""` |

---

## P-5C-1 Cleanup Plan

**Prerequisite**: ViewModel must emit non-empty arrays for all three sections before legacy intermediates can be removed.

**Current ViewModel coverage** (from `buildResumeDraftViewModel`):
- `experiences`: populated from `safeCandidateSentence` + `achievementBullets` + `resumeExperienceBullets` — generally non-empty if `resumeExperienceBullets` has content
- `skillTags`: populated from `competencyTags` + `collaborationTags` + `resumeSkillItems` — generally non-empty if `resumeSkillItems` has content
- `achievementHighlights[0]`: populated from `achievementBullets` or `safeCandidateSentence` or `fallbackAchievementText` — always non-empty given `displayAchievementText` fallback

**Conclusion**: ViewModel coverage is sufficient for P-5C-1 to proceed.

### P-5C-1 Steps (ordered)

1. **Delete `finalExperienceBullets` useMemo** — change `viewModelExperienceBullets` alias to `resumeDraftViewModel.experiences` (no `|| finalExperienceBullets` fallback)
2. **Delete `finalSkillItems` useMemo** — change `viewModelSkillItems` alias to `resumeDraftViewModel.skillTags` (no `|| finalSkillItems` fallback)
3. **Inline `achievementText` into `displayAchievementText`** — merge single-step: `(candidateAchievementBullets[0] || safeCandidateResumeSentence || null) || (latestResumeCandidate ? "최근 기록은..." : (hasResumeLine ? result.resumeLine : "..."))`

**Files**: `src/components/mvp/PmMvpView.jsx` only (1 file)
**Risk**: Low — all fallback paths still covered by ViewModel and `displayAchievementText`

---

## ViewModel Gap List (future P-5D+)

These sections are rendered directly from non-ViewModel sources and could be migrated later:

| JSX Section | Current source | Migration path |
|---|---|---|
| 소개 헤드라인 | `resumeHeadline` (direct) | Already passed as `profile.role` → could read `resumeDraftViewModel.profile.role` |
| 소개 본문 | `introParagraph` / `introDetail` | Could map to `resumeDraftViewModel.introParagraphs[0/1]` |
| BEFORE-AFTER preview | `sourcePreview` (direct useMemo) | Could add `updatePreview` section to ViewModel render |

These are not blocked. Suggested as P-5D scope.

---

## File Ownership

| File | Role |
|---|---|
| `src/components/mvp/PmMvpView.jsx` | Orchestrates state → ViewModel → JSX |
| `src/lib/resume/recordToResumeCandidate.js` | DB row → ResumeUpdateCandidate |
| `src/lib/resume/buildResumeDraftViewModel.js` | ResumeUpdateCandidate + result → ResumeDraftViewModel |
| `docs/record-to-resume-contract.md` | Data shape contracts |
| `docs/resume-viewmodel-migration-map.md` | This file |
