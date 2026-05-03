# Axis1 경제학→PMM majorKey 조건부 로직 실제 작동 여부 검증

**검증 일시:** 2026-05-03  
**대상:** PR #54 (fix/newgrad-axis1-pmm-economics-output-quality, commit 3940b8d)  
**목표:** isEconomicsToPMM 조건이 실제 런타임에서 true가 되는지 확인

---

## 1. 문제 요약

### 현재 상황
- PR #54 머지됨 (2026-05-03)
- 경제학→PMM "목표 산출물 수준 달성"으로 보고됨
- 하지만 Axis1 Major Key Inventory 조사에서 **조건 hit 불가 위험** 발견

### 의심 증상
```javascript
// axisExplanationRegistry.js line 2443
const isEconomicsToPMM = majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM");
```

**문제:** 
- 조건이 `majorKey === "ECONOMICS"` (대문자 영문)
- 실제 전달값이 `majorKey = "경제학"` (정규화된 한글)일 가능성
- → 조건이 절대 true가 될 수 없음 (FALSE가 고정됨)

---

## 2. 실제 majorKey 전달 경로 (정적 분석)

### 2.1 경로 추적

**Step 1: buildNewgradAxisPack.js line 2916**
```javascript
const canonicalReading = buildNewgradAxis1CanonicalReading({
  ...
  majorKey: signals.majorCanonicalKey,
  ...
});
```
→ `input.majorKey = signals.majorCanonicalKey`

**Step 2: buildNewgradAxisPack.js line 3773**
```javascript
majorCanonicalKey: _jobFitMajorPrior.selectedMajorKey ?? ""
```
→ `signals.majorCanonicalKey = _jobFitMajorPrior.selectedMajorKey`

**Step 3: newgradAxis1MajorPriorRegistry.js line 652**
```javascript
export function resolveNewgradAxis1MajorPrior(targetJobId, majorText) {
  ...
  const normalizedKey = normalizeMajorPriorKey(safeMajorText);
  ...
  return {
    ...
    selectedMajorKey: normalizedKey,
    ...
  };
}
```
→ `_jobFitMajorPrior.selectedMajorKey = normalizedKey`

**Step 4: newgradAxis1MajorPriorRegistry.js line 7-13**
```javascript
function normalizeMajorPriorKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}
```
→ 사용자 입력 "경제학" → `normalizedKey = "경제학"` (한글 유지)

### 2.2 최종 값

```
사용자 입력: "경제학"
    ↓ normalizeMajorPriorKey
normalizedKey: "경제학"
    ↓ resolveNewgradAxis1MajorPrior return
selectedMajorKey: "경제학"
    ↓ buildNewgradAxisPack.js signals
majorCanonicalKey: "경제학"
    ↓ buildNewgradAxis1CanonicalReading
input.majorKey: "경제학"
    ↓ axisExplanationRegistry.js line 2442-2443
const majorKey = "경제학"
const isEconomicsToPMM = ("경제학" === "ECONOMICS") && ... = FALSE
```

**결론:** 경제학 입력 시 `input.majorKey = "경제학"` (정규화된 한글)

---

## 3. 현재 조건 hit 가능 여부

### 3.1 조건식 분석

**axisExplanationRegistry.js line 2443:**
```javascript
const isEconomicsToPMM = majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM");
```

**실제값:**
```javascript
majorKey = "경제학"  // 정규화된 한글
targetJobId = "PRODUCT_MARKETING_PMM"  // 이것은 맞음

isEconomicsToPMM = ("경제학" === "ECONOMICS") && true
                 = FALSE && true
                 = FALSE
```

### 3.2 판정

**🔴 현재 조건은 절대 true가 될 수 없음 (항상 FALSE)**

---

## 4. 그럼 왜 "목표 산출물 수준 달성"했다고 보고됐는가?

### 4.1 가능성 분석

**가능성 A: 다른 분기에서 비슷한 문구를 제공**
- Line 2450-2451의 `shouldUseJobSpecificText` 분기가 활성화?
- newgradJobSpecificAxis1ActionsRegistry.js의 PRODUCT_MARKETING_PMM 엔트리에 어필 과목 정의?
- ✅ **확인 필요**

**가능성 B: majorCanonicalActions에서 경제학 특화 정보 제공**
- Line 2420: `majorCanonicalActions = input?.majorCanonicalActions || resolveMajorCanonicalActions(...)`
- resolveMajorCanonicalActions 함수가 "경제학" → ECONOMICS로 매핑 후 특화 정보 제공?
- ✅ **확인 필요**

### 4.2 resolveMajorCanonicalActions 함수 확인

**newgradMajorCanonicalActionsRegistry.js:**
```javascript
export function resolveMajorCanonicalActions(majorKey = "", majorLabel = "") {
  const candidateKeys = [
    normalizeMajorCanonicalKey(majorKey),     // "경제학"
    normalizeMajorCanonicalKey(majorLabel),   // "경제학"
  ].filter(Boolean);

  for (const candidateKey of candidateKeys) {
    const canonicalId = NORMALIZED_MAJOR_KEY_TO_ID[candidateKey];
    if (canonicalId) {
      return getMajorCanonicalActionEntry(canonicalId);  // "ECONOMICS" entry
    }
  }
}
```

**결과:** "경제학" → NORMALIZED_MAJOR_KEY_TO_ID["경제학"] → "ECONOMICS" → MAJOR_CANONICAL_ACTIONS["ECONOMICS"]

→ `majorCanonicalActions.label = "경제학"` 반환됨

### 4.3 결론

경제학입력 시 두 곳에서 정보를 얻을 수 있음:
1. **isEconomicsToPMM 조건** (현재 FALSE 고정) ← 어플 과목 "미시경제학, 산업조직론..." 제공
2. **jobSpecificActions 분기** (active?) ← foundationActions 제공
3. **majorCanonicalActions** (항상 active) ← canonicalActions 제공

**가능성:** jobSpecificActions.nextEvidenceActions가 이미 경제학 전용 값을 가지고 있어서, isEconomicsToPMM 조건이 false여도 목표 산출물이 제공되는 상황?

---

## 5. 핫픽스 필요 여부

### 판정: 🟡 **필요** (안전성 확보)

**이유:**
1. 현재 isEconomicsToPMM 조건이 절대 true가 될 수 없음 (코드상 버그)
2. 경제학→PMM이 목표 산출물을 제공하는 이유가 다른 분기 때문일 가능성
3. **향후 확장 시 위험:** 다른 전공 (경영학, 통계학 등)에 동일 패턴 적용 시 더 심각한 문제 발생 가능
4. **의도와 실제의 불일치:** 코드 작성자의 의도("경제학"일 때 이 조건을 타겠다)와 실제 동작이 다름

---

## 6. 핫픽스 방향

### 6.1 권장 수정

**파일:** `src/data/transitionLite/axisExplanationRegistry.js`  
**라인:** 2443

**현재 코드:**
```javascript
const isEconomicsToPMM = majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM");
```

**수정 코드:**
```javascript
const isEconomicsToPMM = (majorKey === "ECONOMICS" || majorKey === "경제학") && targetJobId.includes("PRODUCT_MARKETING_PMM");
```

**근거:**
- majorKey는 정규화된 한글값 ("경제학")
- majorKey === "ECONOMICS"는 절대 true가 될 수 없음
- 따라서 majorKey === "경제학" 조건 추가 필요
- 다른 전공은 영향 없음 (경영학, 통계학 등은 각각 "경영학", "수학통계" 조건이 필요)

### 6.2 경영학→PMM 오염 방지

**검증 케이스:**
```javascript
// 경영학 입력
majorKey = "경영학"
majorKey === "ECONOMICS" ? false
majorKey === "경제학" ? false
→ isEconomicsToPMM = false
→ 경제학 특화 문구 미출력 ✅
```

**결론:** 오염 없음 ✅

### 6.3 수정 후 조건 재확인

```javascript
const isEconomicsToPMM = (majorKey === "ECONOMICS" || majorKey === "경제학") && targetJobId.includes("PRODUCT_MARKETING_PMM");

// 경제학→PMM
majorKey = "경제학", targetJobId = "PRODUCT_MARKETING_PMM"
isEconomicsToPMM = (false || true) && true = TRUE ✅

// 경영학→PMM
majorKey = "경영학", targetJobId = "PRODUCT_MARKETING_PMM"
isEconomicsToPMM = (false || false) && true = FALSE ✅

// 경제학→서비스기획
majorKey = "경제학", targetJobId = "JOB_..."
isEconomicsToPMM = (false || true) && false = FALSE ✅
```

---

## 7. 검증 케이스

### 필수 케이스

| 입력 | 예상 | 검증 항목 |
|------|------|---------|
| 경제학 → PMM | TRUE | 어플 과목 "미시경제학, 산업조직론..." 활성화 |
| 경영학 → PMM | FALSE | 일반 PMM 문구 (경제학 문구 없음) |
| 경제학 → 서비스기획 | FALSE | 일반 경제학 문구 (PMM 특화 문구 없음) |
| 컴퓨터공학 → 백엔드 | N/A | 기존 경로 유지 |

### 검증 방법

**npm run build 가능한 경우:**
```bash
npm run build
# 경제학→PMM, 경영학→PMM, 경제학→서비스기획 샘플 데이터로 테스트
```

**npm 불가한 경우:**
- 정적 분석으로 조건식 재확인
- majorKey 값 경로 재추적
- 기타 분기 (jobSpecificActions, majorCanonicalActions) 상태 확인

---

## 8. 수정 전/후 비교

### 수정 전

```javascript
// Line 2443
const isEconomicsToPMM = majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM");

// 경제학→PMM 입력 시
majorKey = "경제학"
isEconomicsToPMM = ("경제학" === "ECONOMICS") && true = FALSE (조건 miss)
→ 다른 분기에서 처리 (우연히 목표 산출물 제공?)
```

### 수정 후

```javascript
// Line 2443
const isEconomicsToPMM = (majorKey === "ECONOMICS" || majorKey === "경제학") && targetJobId.includes("PRODUCT_MARKETING_PMM");

// 경제학→PMM 입력 시
majorKey = "경제학"
isEconomicsToPMM = (false || true) && true = TRUE (조건 hit)
→ Line 2447-2449 경제학 특화 scoreReason 실행 ✅
→ Line 2462-2464 경제학 특화 liftOrLimit 실행 ✅
```

---

## 9. 현재 상태 종합

| 항목 | 상태 | 설명 |
|------|------|------|
| **이론적 조건** | 🔴 FALSE | majorKey === "ECONOMICS"는 절대 true 불가 |
| **실제 목표 산출물** | 🟡 불명확 | 다른 분기에서 제공되는 것 같음 (확인 필요) |
| **핫픽스 필요도** | 🟠 높음 | 의도와 실제의 불일치, 향후 확장 위험 |
| **경영학 오염** | ✅ 없음 | majorKey === "경영학"이므로 조건 미hit |
| **Build/Runtime** | ⏳ 미실행 | JavaScript runtime unavailable |

---

## 10. 결론

### 최종 판정: 🟡 **핫픽스 필요 (안전성 확보)**

**이유:**
1. ✅ 현재 isEconomicsToPMM 조건이 코드상 작동하지 않음 (버그 확정)
2. ✅ 경제학→PMM이 "목표 산출물 수준" 달성한 이유가 다른 분기일 가능성
3. ⚠️ 향후 경영학→PMM, 통계학→PMM 등 확장 시 동일 문제 반복됨
4. ✅ 수정 영향: 경영학→PMM 등 다른 전공에 오염 없음 (경영학 majorKey = "경영학")

### 추천 조치

**1순위:** majorKey 조건 수정 (2분)
```javascript
const isEconomicsToPMM = (majorKey === "ECONOMICS" || majorKey === "경제학") && targetJobId.includes("PRODUCT_MARKETING_PMM");
```

**2순위:** npm run build 후 경제학→PMM 실제 출력 확인 (사용자 환경)
- 경제학→PMM: 어플 과목 (미시경제학, 산업조직론...)
- 경영학→PMM: 경제학 문구 없음 (오염 방지)

**3순위:** 경제학 외 전공 확장 시 동일 패턴 적용 (향후)

---

**검증 완료:** 정적 분석 기반

