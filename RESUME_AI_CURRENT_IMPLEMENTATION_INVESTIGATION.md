# Resume AI Current Implementation Investigation Report

**Date**: 2026-05-06  
**Branch**: main (clean state)  
**Scope**: Investigation only (no code changes)

---

## 1. Current Data Flow

```
[Frontend: PmMvpView]
    ↓
[API Input] → [body.workRecord + tone]
    ↓
[Worker: handleResumeGenerate / handleResumeGenerateOpenAI]
    ↓
[Prompt Building + AI Call] → [Gemini / OpenAI]
    ↓
[Response Parsing + Schema Validation]
    ↓
[Frontend: setAiResumeBullets + setAiResumeMissingHints]
    ↓
[Display in AFTER card + Bullet list]
    ↓
[User selects "이 문장 사용"]
    ↓
[handleSaveResumeCandidate saves to DB]
```

---

## 2. API Input Structure (PmMvpView.jsx:1288-1300)

**Frontend sends to `/api/resume-generate`**:

```javascript
{
  workRecord: {
    title: String (max 200 chars),           // sourceRecord.title
    sourceText: String (max 1000 chars),     // draft.text or sourceRecord.description
    projectActions: [String, ...] (max 500 each),  // from draft.projectActions
    projectResult: String (max 500 chars),   // draft.projectResult or sourceRecord.result
    role: String (max 200 chars),            // sourceRecord.strength_tags joined with ", "
    tools: [String, ...] (max 50 each),      // sourceRecord.skill_tags (up to 10 items)
    targetJob: String (max 100 chars)        // currentCareerRoleLabel
  },
  targetJob: String,                         // repeated
  tone: "default"                            // only hardcoded value
}
```

**Current Input Limitations**:
- ❌ No collaboration context passed separately
- ❌ No outcome/impact signals passed separately
- ❌ tone hardcoded to "default" (never "impact" or "transition")
- ❌ No guide context / business context signals
- ❌ strength_tags (역할/역량) and skill_tags (도구/기술) treated as simple joined strings

---

## 3. Worker Prompt Analysis

### Gemini Handler (worker-ai/src/index.js:3393-3421)

**Location**: Lines 3393-3421  
**Model**: gemini-2.5-flash  
**Temperature**: 0.3  
**Max tokens**: 1024

**Prompt Characteristics**:
```
너는 한국어 이력서/경력기술서 전문 작성 보조 AI다.
사용자가 제공한 업무 기록 정보를 바탕으로 이력서에 활용할 수 있는 경험 기술 문장 초안을 생성해야 한다.

출력 규칙:
- JSON만 출력
- bullets는 2~3개 [FIXED COUNT - NOT DYNAMIC]
- 각 bullet의 text는 150자 이내
- 입력에 있는 내용만 사용. 수치·성과·기술 임의 생성 금지 [VAGUE INSTRUCTION]
- 성과 수치 없으면 missingInfoHints에 안내
- focus 필드: "achievement", "role", "skill", "process" 중 하나

[업무 기록]
제목: ${title}
업무 내용: ${sourceText}
수행 활동: ${projectActions}
결과/성과: ${projectResult}
역할/역량 태그: ${role}
사용 도구/기술: ${tools}
지원 직무: ${targetJob}
```

**Issues with Current Prompt**:
1. ❌ "bullets는 2~3개" — Forces fixed count, doesn't adapt to input
2. ❌ No examples provided
3. ❌ "임의로 지어내지 말 것" is vague
4. ❌ No guidance on combining signals meaningfully
5. ❌ No guidance against tag repetition
6. ❌ No "collaboration" focus option (only 4: achievement, role, skill, process)
7. ❌ Focus options not explained (what does "process" mean?)

### OpenAI Handler (worker-ai/src/index.js:3213-3240)

**Location**: Lines 3213-3240  
**Model**: gpt-4o-mini (or env.OPENAI_MODEL)  
**Temperature**: 0.3  
**Max tokens**: 512

**Prompt**: Identical to Gemini except:
- Same limitations as Gemini
- Missing `"model": "gemini-2.5-flash"` in expected output (line 3230)

**Key Finding**: Both handlers use identical prompts with identical limitations.

---

## 4. Response Schema

### Expected Input (What AI Model Should Return)

```json
{
  "bullets": [
    {
      "text": "string (완결된 한국어 문장)",
      "type": "resume_bullet",
      "focus": "achievement | role | skill | process"
    }
  ],
  "missingInfoHints": [
    "string (구체적 안내)"
  ]
}
```

### Current Worker Parsing (Both Handlers)

**Gemini Parser** (worker-ai/src/index.js:3541-3551):
```javascript
const validFocus = new Set(["achievement", "role", "skill", "process"]);
const bullets = Array.isArray(parsed?.bullets)
  ? parsed.bullets
      .filter((b) => b && typeof b.text === "string" && b.text.trim())
      .map((b) => ({
        text: String(b.text).trim().slice(0, 300),
        type: "resume_bullet",
        focus: validFocus.has(b.focus) ? b.focus : "role",
      }))
      .slice(0, 3)  // [HARD LIMIT: 3 BULLETS]
  : [];
```

**OpenAI Parser** (worker-ai/src/index.js:3310-3319): Identical

### Critical Finding: Field Dropping

**Unknown fields are DROPPED**:
- If AI returns `sourceSignals` → **DROPPED**
- If AI returns `confidence` → **DROPPED**  
- If AI returns `evidenceLevel` → **DROPPED**
- Only these fields are preserved: `text`, `type`, `focus`

**Actual Response Returned** (Both handlers):
```json
{
  "ok": true,
  "bullets": [
    { "text": "...", "type": "resume_bullet", "focus": "..." }
  ],
  "missingInfoHints": [ "..." ],
  "model": "gemini-2.5-flash"  // or gpt-4o-mini
}
```

---

## 5. Frontend Display Paths

### Path 1: Bullet List Section (Lines 1960-1989)

**When**: `aiResumeBullets.length > 0`  
**Display**: All bullets with "이 문장 사용" buttons  
**Behavior**: User can click any bullet to set as `editedResumeSentence`

```jsx
{aiResumeBullets.map((bullet, idx) => (
  <div>
    <span>{bullet.text}</span>
    <button onClick={() => {
      setEditedResumeSentence(bullet.text.trim());
      setIsEditingResumeSentence(true);
    }}>
      이 문장 사용
    </button>
  </div>
))}
```

### Path 2: AFTER Card (Lines 2223-2251)

**Primary Condition** (Lines 2223-2227):
```javascript
{aiResumeBullets.length > 0 && aiResumeBullets[0]?.text ? (
  <div>
    <p>{aiResumeBullets[0].text}</p>  // ONLY FIRST BULLET
    <p className="text-emerald-600">AI가 정리한 초안입니다...</p>
  </div>
)
```

**Issue**: Shows ONLY first bullet, not all bullets

**Fallback Condition** (Lines 2228-2238):
```javascript
: resumeDraftViewModel?.updatePreview?.afterSentence ? (
  <div>
    <p>{resumeDraftViewModel.updatePreview.afterSentence}</p>
    {resumeDraftViewModel.updatePreview.hasAiResult ? (
      <p className="text-emerald-600">AI가 정리한 초안입니다...</p>
    ) : resumeDraftViewModel.updatePreview.isDraft ? (
      <p className="text-amber-600">임시 초안입니다...</p>
    ) : (
      <p className="text-slate-500">비교 정보는 접어두고...</p>
    )}
  </div>
)
```

**Data Source for Fallback**: `buildResumeDraftViewModel.js:146-149`
```javascript
const afterSentence = safeString(
  aiResumeSentence ||  // Derived from aiResumeBullets[0].text
  latestResumeCandidate?.resumeSentence ||
  result?.resumeLine,
);
```

### Save Flow (Lines 1363-1410)

**When user clicks save button**:
1. Reads `editedResumeSentence` (set by "이 문장 사용")
2. Creates `saveCandidate` object
3. Calls `updateWorkRecordWithCandidate`
4. Persists to Supabase

**Key Point**: Only ONE bullet is saved at a time (the one user selected via "이 문장 사용")

---

## 6. Input Signal Completeness Analysis

### Signals Sent:
✅ Title (업무 제목)  
✅ sourceText (자유 기록 텍스트)  
✅ projectActions (수행 활동)  
✅ projectResult (결과/성과)  
✅ role tags (역할/역량 태그, 콤마로 연결)  
✅ tools/skills (도구/기술 태그, 배열로 전달)  
✅ targetJob (지원 직무)  

### Signals NOT Explicitly Sent:
❌ Collaboration context (마케팅팀, PM 등이 role에만 포함)  
❌ Guide context / business context  
❌ Clear separation between outcome signals and activity signals  
❌ Impact/change magnitude signals  
❌ Tone variation (only "default", never "impact" or "transition")

---

## 7. Quality Degradation Root Causes

### 1. Fixed Bullet Count (2~3)
**Problem**: Prompt forces 2-3 bullets regardless of input complexity  
**Impact**: 
- Single work flow gets forced into 2 bullets (artificial split)
- Complex work gets compressed into 3 bullets (lost nuance)
- Difficult for AI to decide natural grouping

### 2. Tag Repetition (No Prohibition)
**Problem**: Prompt doesn't forbid simple tag repetition  
**Impact**: AI often outputs `"마케팅팀 및 PM과 협업"` (literal tag repetition) instead of meaningful integration

### 3. No Examples (Few-Shot Learning)
**Problem**: Prompt has no examples of good vs bad outputs  
**Impact**: 
- AI guesses at desired quality level
- Inconsistent output style

### 4. Vague Safety Rules
**Problem**: "입력에 있는 내용만 사용. 수치·성과·기술을 임의로 지어내지 말 것"  
**Impact**: 
- AI sometimes over-generalizes (avoids any impact language)
- AI sometimes still invents ("사업 확장의 XX% 증대" when no % provided)

### 5. Missing "collaboration" Focus
**Problem**: Only 4 focus values, missing "collaboration"  
**Impact**: Team-based work hard to categorize properly

### 6. No sourceSignals Tracking
**Problem**: Worker drops all sourceSignals data  
**Impact**: 
- Frontend can't verify which inputs AI used
- No traceability for quality review

### 7. Only First Bullet Displayed
**Problem**: AFTER card shows only first bullet from aiResumeBullets  
**Impact**: 
- Multi-bullet results show only 1
- User sees incomplete AI output in comparison view

---

## 8. Files That Need Modification

### MUST Modify (Core Logic)
1. **worker-ai/orange-shadow-95c1/src/index.js**
   - Lines 3213-3240: OpenAI prompt
   - Lines 3393-3421: Gemini prompt
   - Lines 3308: validFocus set (add "collaboration")
   - Lines 3310-3319: Bullet mapping (add sourceSignals, confidence)
   - Lines 3318: Remove `.slice(0, 3)` constraint → `.slice(0, 4)`

2. **src/components/mvp/PmMvpView.jsx**
   - Lines 2208-2251: AFTER card rendering (show all bullets, not just [0])
   - Line 2211: Update title to show "경력기술서형" when AI succeeds

### MAY MODIFY (If New Fields Used)
3. **src/lib/resume/buildResumeDraftViewModel.js**
   - Currently receives `aiResumeSentence` (single) for fallback
   - If frontend needs to pass all bullets → May need signature update
   - **Current status**: OK to leave unchanged if AFTER card shows all bullets directly

### DO NOT MODIFY
❌ src/App.jsx  
❌ src/main.jsx  
❌ package.json  
❌ .env / secrets  
❌ Vite config  
❌ Database schemas

---

## 9. Risk Assessment

### 1. Gemini vs OpenAI Consistency
**Risk**: HIGH  
**Impact**: Both handlers must be updated identically  
**Mitigation**: Ensure both prompts and parsers are synchronized  
**Current State**: Both are already identical

### 2. New Fields (sourceSignals, confidence) Handling
**Risk**: LOW  
**Impact**: Frontend safely handles new fields (defensive coding pattern)  
**Current Code** (line 1316-1322): 
```javascript
let bullets = Array.isArray(data.bullets) ? data.bullets : [];
bullets = bullets.filter((b) => b && String(b.text || "").trim());
```
**Analysis**: Frontend only reads `.text` from bullets, won't break if extra fields exist

### 3. Backward Compatibility
**Risk**: LOW  
**Impact**: 
- Old responses (without sourceSignals) still work
- New responses (with sourceSignals) also work
- No breaking changes to response structure

### 4. Prompt Format Changes
**Risk**: MEDIUM  
**Impact**: If prompt is too detailed, may confuse API or exceed token limits  
**Current limits**: Gemini (1024 tokens), OpenAI (512 tokens)  
**Mitigation**: Monitor token usage if prompt grows significantly

### 5. Tone Parameter Usage
**Risk**: MEDIUM  
**Impact**: Frontend never passes `"impact"` or `"transition"` tone (always "default")  
**Current State**: Dead code (tone instructions defined but never used)  
**Decision**: Can keep as-is or remove in future

---

## 10. Safe Minimum Change Scope

**To achieve design improvements**, MUST change:

1. **Worker Prompt** (both Gemini + OpenAI)
   - Add 1-4 bullet count rule
   - Add "collaboration" focus
   - Add sourceSignals/confidence fields
   - Add few-shot example
   - Add explicit tag-repetition prohibition
   - Add safe language guidance

2. **Worker Response Schema** (both handlers)
   - Add "collaboration" to validFocus
   - Update bullet mapping to preserve sourceSignals, confidence
   - Change slice(0, 3) to slice(0, 4)

3. **Frontend AFTER Card Display**
   - Show all bullets (not just [0])
   - Update title and label text

**Do NOT need to change**:
- buildResumeDraftViewModel.js (it still receives single aiResumeSentence)
- Save flow (still works for individual bullets)
- API input structure (same payload works)

---

## 11. Additional Questions Requiring Clarification

**Q1**: Should older API responses (without sourceSignals) still work?  
**A**: Yes - defensive code already handles missing fields

**Q2**: How should frontend handle multiple bullets being saved?  
**A**: Current design: One at a time (user clicks "이 문장 사용" for chosen bullet)

**Q3**: Should buildResumeDraftViewModel receive all bullets or still just first one?  
**A**: Can still receive first bullet (aiResumeBullets[0].text) for fallback viewmodel

**Q4**: What's the exact character limit for each bullet?  
**A**: Current: 300 chars. Consider 180-200 for better readability

**Q5**: Should missingInfoHints be displayed in UI?  
**A**: Currently only returned in API response, not shown in AFTER card. Could add below bullets.

---

## 12. Summary Table

| Aspect | Current State | Assessment |
|--------|--------------|-----------|
| Bullet count | Fixed 2-3 | ❌ Limiting |
| Few-shot examples | None | ❌ Missing |
| focus options | 4 (no "collaboration") | ❌ Incomplete |
| Tag repetition guard | Vague rule | ⚠️ Weak |
| sourceSignals tracking | Not implemented | ❌ No traceability |
| AFTER card display | Shows only [0] | ❌ Incomplete |
| Fallback mechanism | resumeDraftViewModel | ✅ Working |
| Save flow | Single bullet | ✅ Functional |
| Both handlers sync | Yes, identical | ✅ Consistent |
| New field compatibility | Should work | ✅ Safe |

---

## Conclusion

**Current implementation**:
- ✅ Functional and safe
- ❌ Quality limited by fixed 2-3 bullet count
- ❌ Prone to tag repetition
- ❌ Lacks traceability (no sourceSignals)
- ⚠️ Shows only first bullet in preview

**Safe to modify**:
- Worker prompts (both handlers)
- Worker response schema (add new fields)
- Frontend AFTER card display

**Will NOT break**:
- Frontend API consumption (defensive code)
- Save flow (independent of display changes)
- Fallback mechanism (unchanged)
- Backward compatibility (new fields optional)

**Estimated scope**: 4 files, ~150-200 lines of changes (prompts, schema, display)

