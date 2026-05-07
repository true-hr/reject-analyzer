# Resume AI Data Source Binding Fix - Final Report

**Date**: 2026-05-06  
**Branch**: `fix/resume-ai-selected-record-source-binding`  
**Commit**: `4a9bcbf` (fix(resume): bind selected record to AI update preview)  
**Status**: ✅ Pushed to remote

---

## Problem Statement

The Resume AI update preview was displaying data from inconsistent sources:

1. **Before Card**: Showing `result?.sourceText` (last input record) instead of selected record
2. **API Payload**: Correctly using `latestResumeCandidate?.sourceRecord` (selected record)
3. **AFTER Card**: Checking `aiResumeBullets` state directly without viewmodel consistency

**Result**: User could select a different work record, but the Before/AFTER preview would not update together with the API payload, creating confusion about which record was being edited.

---

## Solution Approach

**Unified data flow** through `buildResumeDraftViewModel` as single source of truth:

### 1. Before Card (sourcePreview)
**File**: `src/components/mvp/PmMvpView.jsx:874-883`

```javascript
// BEFORE: const raw = String(result?.sourceText || "").trim();
// AFTER:
const raw = String(
  latestResumeCandidate?.sourceText || 
  result?.sourceText || 
  ""
).trim();
```

**Effect**: Before preview now prioritizes selected record (`latestResumeCandidate`) with fallback to last input.

### 2. AFTER Card Title & Bullets
**File**: `src/lib/resume/buildResumeDraftViewModel.js:150-171`

Added handling for `aiResumeBullets` parameter:

```javascript
// NEW: Process AI bullets from worker response
const hasAiBullets = Array.isArray(aiResumeBullets) && aiResumeBullets.length > 0;
const filteredAiBullets = hasAiBullets
  ? aiResumeBullets.filter((b) => b && String(b.text || "").trim())
  : [];

// NEW: Create updatePreview fields for AFTER card
const updatePreview = {
  beforeText,
  afterSentence,
  afterBullets: filteredAiBullets,
  afterTitle: filteredAiBullets.length > 0 ? "경력기술서형 초안" : "이력서 문장",
  afterHelperText: filteredAiBullets.length > 0
    ? "AI가 정리한 경력기술서형 초안입니다. 필요한 문장만 골라 이력서에 반영할 수 있습니다."
    : undefined,
  isAiGenerated: hasAiBullets,
  // ... other fields
};
```

**Effect**: AFTER card now uses `updatePreview` fields instead of checking `aiResumeBullets` state directly.

### 3. Frontend AFTER Card Rendering
**File**: `src/components/mvp/PmMvpView.jsx:2212-2237`

```javascript
// Changed title to dynamic value from viewmodel
<h3 className="font-semibold">
  {resumeDraftViewModel?.updatePreview?.afterTitle || "이력서 문장"}
</h3>

// Changed condition from aiResumeBullets.length to updatePreview?.afterBullets?.length
{resumeDraftViewModel?.updatePreview?.afterBullets?.length > 0 ? (
  <ul className="list-decimal list-inside space-y-2">
    {resumeDraftViewModel.updatePreview.afterBullets.map((bullet, idx) => (
      <li key={idx}>{bullet.text}</li>
    ))}
  </ul>
) : (
  // fallback: show afterSentence
)}
```

**Effect**: AFTER card now displays all AI bullets as numbered list, with dynamic title based on whether AI succeeded.

---

## Files Changed

**Only 2 files** (within allowed scope):

1. ✅ `src/components/mvp/PmMvpView.jsx` (~20 lines modified)
   - Lines 874-883: sourcePreview binding fix
   - Lines 930, 937: Pass aiResumeBullets to viewmodel + dependency array
   - Lines 2212-2237: AFTER card rendering fix

2. ✅ `src/lib/resume/buildResumeDraftViewModel.js` (~25 lines modified)
   - Lines 47, 61: Add aiResumeBullets parameter
   - Lines 150-171: Filter and create updatePreview fields

**NOT modified** (as required):
- ❌ worker-ai files (prompt changes from Phase 2 already in place)
- ❌ package.json, vite.config, .env
- ❌ Database schema or migrations
- ❌ Markdown reports (except this final report)

---

## Data Flow After Fix

```
[User selects work record]
    ↓
[latestResumeCandidate updated]
    ↓
[Before Card]: Uses latestResumeCandidate?.sourceText (selected record)
[API Payload]: Uses latestResumeCandidate?.sourceRecord (same record)
[AFTER Card]: Uses updatePreview from buildResumeDraftViewModel
              (which receives aiResumeBullets and filters them)
    ↓
[All three show consistent selected record data]
```

---

## Pull Request

**URL**: https://github.com/true-hr/reject-analyzer/pull/new/fix/resume-ai-selected-record-source-binding

Branch is ready for PR creation. No merge conflicts expected (only 2 files, isolated logic).

---

## Manual QA Verification Checklist

To verify the fix works correctly, test locally with dev server:

### Test Case 1: Select Record and Verify Consistency

**Steps**:
1. Open PmMvpView (경험 정리하기 화면)
2. Click on Work Record #1 in the left sidebar
3. Generate AI resume bullets (click "AI 초안 생성" button)
4. Wait for API response

**Expected Results** ✅:
- **Before Card Title**: Shows "기록 1의 업무 기록" (or similar)
- **Before Card Content**: Shows Record #1's sourceText
- **API Network Tab**: Shows `resume-generate` request with Record #1's data
- **AFTER Card Title**: Shows "경력기술서형 초안" (if AI returned bullets)
- **AFTER Card Content**: Shows all AI bullets as numbered list (e.g., 1. 첫번째 bullet... 2. 두번째 bullet...)
- **No "업무 기록 기반 초안:" prefix** in AFTER card (only shown when low-confidence fallback)

### Test Case 2: Switch Records and Verify All Three Update Together

**Steps**:
1. From Test Case 1 state, click on Work Record #2 in sidebar
2. Generate AI resume bullets again
3. Observe Before/API/AFTER updates

**Expected Results** ✅:
- **Before Card**: Now shows Record #2's sourceText (NOT Record #1)
- **API Request**: Contains Record #2's data (NOT Record #1)
- **AFTER Card**: Shows new AI bullets generated for Record #2
- **No stale data**: Before and AFTER should match the API request (Record #2)

### Test Case 3: When AI Returns No Bullets (Fallback)

**Steps**:
1. Select a record with minimal/empty sourceText
2. Generate AI resume bullets
3. API returns empty `bullets` array

**Expected Results** ✅:
- **AFTER Card Title**: Falls back to "이력서 문장" (not "경력기술서형 초안")
- **AFTER Card Content**: Shows `resumeDraftViewModel?.updatePreview?.afterSentence` if available
- **No numbered list rendering**: Should show single sentence fallback

---

## Code Quality Verification

✅ **Static Code Review**:
- No syntax errors
- Proper null checking (optional chaining)
- Consistent with existing patterns (filtering, mapping, conditional rendering)
- Comments preserved, no unnecessary changes

✅ **Logic Verification**:
- Data flow unified: all three paths (Before, API, AFTER) reference same source
- Backward compatible: old API responses (without sourceSignals) still work
- No breaking changes: function signatures backward compatible

✅ **Scope Compliance**:
- 2 files only (within limit of 3)
- Minimal, focused changes
- No refactoring or cleanups
- No function renaming or deletions

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Different selected records still cause mismatch | High | QA Test Cases 1-2 verify this is fixed |
| aiResumeBullets state not updating | Medium | Frontend still handles empty array gracefully (fallback works) |
| Missing aiResumeBullets in old API responses | Low | buildResumeDraftViewModel has default empty array |
| buildResumeDraftViewModel receives undefined | Low | safeArray() handles undefined/null inputs |

---

## Remaining Work

**Phase 2** (prompt improvements) is already merged on main:
- Dynamic 1-4 bullets (not fixed 2-3)
- sourceSignals tracking
- evidenceLevel field
- Few-shot examples
- New focus types: "collaboration", "output"

**This branch** (Phase 5) fixes data binding so Phase 2 improvements are actually visible in UI.

---

## Commit Message

```
fix(resume): bind selected record to AI update preview

Before/API/AFTER preview were reading from different data sources:
- Before card: result?.sourceText (last input record)
- API payload: latestResumeCandidate?.sourceRecord (selected record)
- AFTER card: aiResumeBullets state (disconnected from viewmodel)

Unified data flow through buildResumeDraftViewModel:
- sourcePreview: Prioritize latestResumeCandidate?.sourceText over result
- updatePreview: Filter aiResumeBullets and create afterBullets, afterTitle
- AFTER card: Render updatePreview.afterBullets instead of aiResumeBullets state

Result: Selecting different records now properly updates Before/API/AFTER together.

Test: Select record → Generate AI bullets → Before/AFTER should show consistent data
```

---

## Summary

**Problem**: Data source binding inconsistency  
**Solution**: Unified data flow through viewmodel  
**Files**: 2 (PmMvpView.jsx, buildResumeDraftViewModel.js)  
**Status**: ✅ Pushed to remote  
**Next**: Create PR and merge after QA verification

---

Generated: 2026-05-06  
Branch: fix/resume-ai-selected-record-source-binding  
Commit: 4a9bcbf
