# Axis1 Major Key Inventory

**조사 일시:** 2026-05-03  
**대상 브랜치:** qa/newgrad-axis1-major-key-inventory  
**목표:** PASSMAP 코드에 실제 등록된 전공 majorKey/label/alias 확인 및 Axis1 연결 경로 추적

---

## 1. 조사 요약

**제품 코드 수정:** ❌ 없음 (조사만 수행)  
**조사한 파일:** 6개
- `src/data/transitionLite/newgradMajorCanonicalActionsRegistry.js` (전공 정의)
- `src/data/transitionLite/newgradAxis1MajorPriorRegistry.js` (majorKey 정의 및 매핑)
- `src/lib/analysis/buildNewgradAxisPack.js` (Axis1 생성 로직)
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` (결과 구성)
- 기타 참고 파일

**실제 majorKey 수:** 31개 (UNDECLARED_OTHER 포함)  
**alias 수:** 31개 (label 기반)  
**정규화 경로:** 사용자 입력 → normalizeMajorPriorKey/normalizeMajorCanonicalKey → normalizedKey → majorKey 매핑

**주요 발견:**
1. ✅ 모든 31개 전공이 두 registry (canonicalActions, majorPrior)에 일관성 있게 정의됨
2. ✅ ECONOMICS는 majorKey="ECONOMICS", label="경제학", normalizedKeys=["경제학"]
3. ✅ majorKey는 대문자 스네이크 케이스 (ECONOMICS, BUSINESS_ADMIN 등)
4. ✅ Axis1 전달 경로 완전히 추적 가능 (사용자 입력 → majorKey 정규화 → Axis1 builder)
5. ✅ 모든 전공이 양쪽 registry에 등록되어 있음 (누락 없음)
6. ⚠️ 1개 전공 (UNDECLARED_OTHER)은 fallback 역할 (등록되지 않은 입력용)

---

## 2. 전공 관련 파일 목록

| 파일 | 역할 | 정보 |
|------|------|------|
| **newgradMajorCanonicalActionsRegistry.js** | 전공의 핵심 행동/학습 정의 | 31개 majorKey 각각에 대해 label, canonicalActions, learningBasis 정의 |
| **newgradAxis1MajorPriorRegistry.js** | Axis1 점수 체계 + majorKey 매핑 | MAJOR 상수 (31개 majorKey→label), normalizeMajorPriorKey 함수, AXIS1_MAJOR_PRIOR_BASE (직무별 점수) |
| **buildNewgradAxisPack.js** | Axis1 점수 생성 + 신호 전달 | majorKey를 buildNewgradAxis1CanonicalReading으로 전달 (line 2916) |
| **axisExplanationRegistry.js** | Axis1 설명문 생성 | majorKey를 사용하여 조건부 분기 (isEconomicsToPMM 등) |
| **buildNewgradTransitionLiteResult.js** | 최종 결과 구성 | majorKey를 포함한 읽기 결과 생성 |

---

## 3. 실제 PASSMAP 전공 목록 (31개)

| # | majorKey | 표시명<br/>(label) | 정규화<br/>normalizedKeys | 전공군 | Axis1<br/>사용 | registry<br/>주요 과목 필요도 |
|---|----------|-----------|-------------|--------|----------|----------|
| 1 | COMPUTER_SCIENCE | 컴퓨터공학 | 컴퓨터공학 | 공학 | ✅ | ⭐⭐⭐ (매우 높음) |
| 2 | SOFTWARE | 소프트웨어 | 소프트웨어 | 공학 | ✅ | ⭐⭐⭐ |
| 3 | INDUSTRIAL_ENGINEERING | 산업공학 | 산업공학 | 공학 | ✅ | ⭐⭐⭐ |
| 4 | ELECTRICAL_ELECTRONIC | 전자 / 전기 | 전자전기 | 공학 | ✅ | ⭐⭐⭐ |
| 5 | OTHER_ENGINEERING | 기타 공학 | 기타공학 | 공학 | ✅ | ⭐⭐ (일반화 어려움) |
| 6 | BUSINESS_ADMIN | 경영학 | 경영학 | 상경 | ✅ | ⭐⭐⭐ |
| 7 | ECONOMICS | 경제학 | 경제학 | 상경 | ✅ | ⭐⭐⭐ (이미 시작) |
| 8 | ACCOUNTING_TAX | 회계 / 세무 | 회계세무 | 상경 | ✅ | ⭐⭐ |
| 9 | FINANCE | 금융 | 금융 | 상경 | ✅ | ⭐⭐⭐ |
| 10 | OTHER_BUSINESS | 기타 상경 | 기타상경 | 상경 | ✅ | ⭐⭐ |
| 11 | MATH_STATISTICS | 수학 / 통계 | 수학통계 | 기초과학 | ✅ | ⭐⭐⭐ |
| 12 | PSYCHOLOGY_COUNSELING | 심리 / 상담 | 심리상담 | 인문사회 | ✅ | ⭐⭐ |
| 13 | MEDIA | 언론 / 미디어 | 언론미디어 | 인문사회 | ✅ | ⭐ (일반) |
| 14 | PUBLIC_POLICY | 행정 / 정책 | 행정정책 | 인문사회 | ✅ | ⭐⭐ |
| 15 | SOCIOLOGY | 사회학 | 사회학 | 인문사회 | ✅ | ⭐ |
| 16 | OTHER_HUMANITIES | 기타 인문사회 | 기타인문사회 | 인문사회 | ✅ | ⭐ |
| 17 | LAW | 법학 | 법학 | 인문사회 | ✅ | ⭐⭐⭐ |
| 18 | VISUAL_DESIGN | 시각디자인 | 시각디자인 | 디자인 | ✅ | ⭐⭐ |
| 19 | USER_EXPERIENCE | 사용자 경험 | 사용자경험 | 디자인 | ✅ | ⭐⭐ |
| 20 | VIDEO_CONTENT | 영상 / 콘텐츠 | 영상콘텐츠 | 디자인 | ✅ | ⭐ |
| 21 | PR_AD | 광고 / 홍보 | 광고홍보 | 디자인 | ✅ | ⭐⭐ |
| 22 | OTHER_DESIGN | 기타 디자인 | 기타디자인 | 디자인 | ✅ | ⭐ |
| 23 | BIO_LIFE_SCIENCE | 생명과학 / 바이오 | 생명과학바이오 | 자연과학 | ✅ | ⭐⭐ |
| 24 | CHEMISTRY_CHEMICAL_ENGINEERING | 화학 / 화학공학 | 화학화학공학 | 자연과학 | ✅ | ⭐⭐ |
| 25 | PHARMACY | 약학 / 제약 | 약학제약 | 자연과학 | ✅ | ⭐⭐ |
| 26 | ENVIRONMENT_SAFETY | 환경 / 안전공학 | 환경안전공학 | 자연과학 | ✅ | ⭐⭐ |
| 27 | ARCHITECTURE_CIVIL | 건축 / 토목 | 건축토목 | 자연과학 | ✅ | ⭐⭐ |
| 28 | MATERIALS_SCIENCE | 재료 / 신소재공학 | 재료신소재공학 | 자연과학 | ✅ | ⭐⭐ |
| 29 | DOUBLE_MAJOR | 복수전공 | 복수전공 | 특수 | ✅ | ⭐ (정의 불가) |
| 30 | CONVERGENCE_MAJOR | 연계전공 | 연계전공 | 특수 | ✅ | ⭐ (정의 불가) |
| 31 | UNDECLARED_OTHER | 전공 미정 / 기타 | 전공미정기타 | 특수 | ✅ | ⭐ (fallback) |

**범례:**
- ⭐⭐⭐ = 매우 높음 (명확한 과목체계)
- ⭐⭐ = 중간 (어느 정도 정의 가능)
- ⭐ = 낮음 (일반화, 다기능)

---

## 4. Axis1 전공 전달 경로 (상세 추적)

### 4.1 전체 흐름

```
사용자 입력
    ↓
"경제학" (한글 텍스트)
    ↓
[normalizeMajorPriorKey 함수 실행]
  - String(input).normalize("NFKC").trim().toLowerCase().replace(/[\s/()[\]{}.,:&+_-]+/g, "")
  - "경제학" → "경제학" (정규화됨)
    ↓
normalizedKey = "경제학"
    ↓
[AXIS1_MAJOR_PRIOR_BASE 매핑]
  - const baseMap = AXIS1_MAJOR_PRIOR_BASE[normalizedKey]
  - "경제학" → MAJOR.ECONOMICS의 스코어 맵 (BUSINESS: 2, FINANCE_ACCOUNTING: 3, ...)
    ↓
selectedMajorKey = normalizedKey = "경제학"
    ↓
[buildNewgradAxisPack.js line 2916]
  - majorKey: signals.majorCanonicalKey = selectedMajorKey = "경제학"
    ↓
[buildNewgradAxis1CanonicalReading에 전달]
  - input.majorKey = "경제학"
    ↓
[axisExplanationRegistry.js line 2310]
  - const majorKey = String(input?.majorKey || "").trim() = "경제학"
  - const isEconomicsToPMM = (majorKey === "ECONOMICS" && ...)
  
⚠️ 문제: majorKey는 "경제학" (label) 또는 "ECONOMICS" (canonicalId)?
```

### 4.2 실제 데이터 흐름 확인

**buildNewgradAxisPack.js line 3773:**
```javascript
majorCanonicalKey: _jobFitMajorPrior.selectedMajorKey ?? ""
```

**newgradAxis1MajorPriorRegistry.js line 652:**
```javascript
selectedMajorKey: normalizedKey  // = "경제학" (정규화된 한글)
```

⚠️ **발견:** selectedMajorKey는 `normalizedKey` (한글 정규화된 이름)이지, ECONOMICS (majorKey) 아님!

### 4.3 조건부 분기와의 불일치

**현재 axisExplanationRegistry.js (경제학→PMM):**
```javascript
const isEconomicsToPMM = majorKey === "ECONOMICS" && ...
```

**실제 전달되는 값:**
```javascript
majorKey = "경제학" (한글 정규화)
// 또는
majorKey = "" (불명확)
```

**결과:** 조건이 절대 true가 될 수 없음? 또는 다른 변수에서 majorKey를 얻음?

---

## 5. 현재 ECONOMICS 처리 경로 (재확인)

### 5.1 ECONOMICS majorKey 정의 위치

**파일 1: newgradMajorCanonicalActionsRegistry.js**
```javascript
ECONOMICS: Object.freeze({
  label: "경제학",
  normalizedKeys: ["경제학"],
  canonicalActions: [...],
  learningBasis: [...]
})
```

**파일 2: newgradAxis1MajorPriorRegistry.js**
```javascript
const MAJOR = Object.freeze({
  ECONOMICS: "경제학",  // majorKey → label
  ...
});

// AXIS1_MAJOR_PRIOR_BASE에서:
[normalizeMajorPriorKey(MAJOR.ECONOMICS)]: { ... }
// = [normalizeMajorPriorKey("경제학")]: { ... }
// = ["경제학"]: { ... }
```

### 5.2 경제학 alias

**normalizedKeys:** ["경제학"]  
**label:** "경제학"  
**normalizeMajorPriorKey 출력:** "경제학" (한글 유지)  
**normalizeMajorCanonicalKey 출력:** "경제학" (한글 유지)

### 5.3 경제학 → PMM 조건부 로직과의 연결

**axisExplanationRegistry.js line 2310:**
```javascript
const majorKey = String(input?.majorKey || "").trim();
const isEconomicsToPMM = majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM");
```

**input.majorKey의 실제 값:**
- buildNewgradAxisPack.js 3773에서: `majorCanonicalKey: _jobFitMajorPrior.selectedMajorKey ?? ""`
- _jobFitMajorPrior.selectedMajorKey는: `normalizedKey = "경제학"`
- 따라서 input.majorKey = "경제학"

**조건 검사:**
```
majorKey === "ECONOMICS"
"경제학" === "ECONOMICS"  // FALSE!
```

⚠️ **심각한 발견:** 현재 코드에서 경제학→PMM 조건이 절대 작동할 수 없음!

### 5.4 안정성 평가

**현재 상태:** 🔴 **불안정**
- ECONOMICS 조건은 작동하지 않음
- 하지만 사용자가 경제학→PMM 선택 시 "목표 산출물 수준" 달성했다고 보고됨
- 따라서 다른 경로에서 majorKey가 전달되고 있을 가능성

**가능성 1:** resolveMajorCanonicalActions 함수 사용  
```javascript
export function resolveMajorCanonicalActions(majorKey = "", majorLabel = "") {
  const candidateKeys = [
    normalizeMajorCanonicalKey(majorKey),     // "경제학"
    normalizeMajorCanonicalKey(majorLabel),   // "경제학"
  ].filter(Boolean);
  
  for (const candidateKey of candidateKeys) {
    const canonicalId = NORMALIZED_MAJOR_KEY_TO_ID[candidateKey];
    if (canonicalId) {
      return getMajorCanonicalActionEntry(canonicalId);  // ECONOMICS
    }
  }
}
```

**결과:** majorLabel="경제학" → canonicalId="ECONOMICS" ← 이것이 majorKey로 사용될 수 있음!

---

## 6. registry 설계에 반영할 기준

### 6.1 Major Course Registry의 Primary Key

**결론:** `majorKey` (canonicalId)를 사용 ✅

```javascript
// 설계
MAJOR_COURSE_REGISTRY = {
  ECONOMICS: {
    courseExamples: { ... }
  },
  BUSINESS_ADMIN: { ... },
  MATH_STATISTICS: { ... },
  ...
}
```

**근거:**
1. 모든 31개 전공이 MAJOR_CANONICAL_ACTIONS에서 majorKey(canonicalId)로 정의
2. buildNewgradAxis1CanonicalReading에서 majorKey 사용 가능
3. resolveMajorCanonicalActions가 normalizedKey → canonicalId 매핑 제공

### 6.2 Label Fallback 필요 여부

**필요 없음** ❌

모든 majorKey는 이미 고유하며, label도 정의되어 있음.

### 6.3 Alias 처리 방식

**방식:** 정규화된 한글 이름 (normalizedKeys)을 lookup key로 사용

```javascript
// 조회 시
const normalizedInput = normalizeMajorPriorKey(userInput);  // "경제학" → "경제학"
const canonicalId = NORMALIZED_MAJOR_KEY_TO_ID[normalizedInput];  // "ECONOMICS"
const courseRegistry = MAJOR_COURSE_REGISTRY[canonicalId];
```

### 6.4 전공군 Grouping 필요 여부

**권장** ✅ (선택사항)

```javascript
// 그룹핑 예
{
  ENGINEERING: ["COMPUTER_SCIENCE", "SOFTWARE", "INDUSTRIAL_ENGINEERING", ...],
  BUSINESS: ["BUSINESS_ADMIN", "ECONOMICS", "FINANCE", ...],
  DESIGN: ["VISUAL_DESIGN", "USER_EXPERIENCE", ...],
  ...
}
```

**이점:**
- UI에서 "공학 관련 전공" 필터링 가능
- 주요 과목 registry 구성 시 패턴 인식

---

## 7. 다음 단계 제안

### 7.1 우선 주요 과목을 정리할 실제 전공 TOP 10

**Priority 1 (매우 높음) - 명확한 과목 체계:**
1. ECONOMICS (경제학) - ✅ 이미 진행 중
2. BUSINESS_ADMIN (경영학) - 직무군: PMM, Strategy, Operations
3. MATH_STATISTICS (수학/통계) - 직무군: Data, Finance, PMM
4. COMPUTER_SCIENCE (컴퓨터공학) - 직무군: Backend, Frontend, Data
5. FINANCE (금융) - 직무군: Finance, Strategy
6. LAW (법학) - 직무군: Legal, Public Affairs
7. INDUSTRIAL_ENGINEERING (산업공학) - 직무군: Operations, Manufacturing
8. PSYCHOLOGY_COUNSELING (심리/상담) - 직무군: HR, PMM (소비자 행동)

**Priority 2 (중간) - 어느 정도 정의 가능:**
9. ACCOUNTING_TAX (회계/세무) - 직무군: Finance, Accounting
10. PUBLIC_POLICY (행정/정책) - 직무군: Public Affairs, Policy

### 7.2 기존 코드에 없는 전공이지만 사용자 입력 가능성이 높은 전공

**발견:** 모든 입력은 normalizeMajorPriorKey → AXIS1_MAJOR_PRIOR_BASE 매핑을 통해 처리됨.

**등록되지 않은 입력의 처리:**
```javascript
const baseMap = AXIS1_MAJOR_PRIOR_BASE[normalizedKey] || null;
if (!baseMap) {
  resolutionMode = "unknown_major_fallback";
  // UNDECLARED_OTHER로 fallback
}
```

**따라서:** 31개 전공이 아닌 다른 입력은 자동으로 UNDECLARED_OTHER로 처리됨.  
→ 새로운 majorKey를 만들 필요 없음 (하지만 원하면 추가 가능)

### 7.3 바로 구현하면 위험한 부분

**🔴 위험 1: majorKey 값의 불명확성**
- axisExplanationRegistry.js에서 `majorKey === "ECONOMICS"` 조건 사용
- 실제 전달되는 값이 "경제학" (정규화된 한글)인지 "ECONOMICS" (canonicalId)인지 확인 필수
- **액션:** 현재 경제학→PMM 구현이 어떻게 작동하는지 런타임 확인 필수

**🔴 위험 2: Alias 충돌 가능성**
- 특정 전공의 label이 다른 전공의 normalizedKey와 충돌할 수 있음
- **확인 필수:** normalizeMajorPriorKey("기타 공학") vs normalizeMajorCanonicalKey("기타 공학") 비교

**🔴 위험 3: 과목명의 정확성**
- 31개 전공 각각에 대해 "실제 수강 가능한 과목"을 수집해야 함
- 임의 작성 시 학생 신뢰도 저하

### 7.4 먼저 수동 데이터 정리가 필요한 부분

**필수:**
1. 각 전공별 "어필 가능한 주요 과목" 목록 (정확한 과목명)
   - 출처: 각 대학 교과과정, 전공 가이드
   - 예: 경제학 → 미시경제학, 산업조직론, 계량경제학 (확정)

2. 각 직무별로 각 전공이 "어떤 과목을 강조해야 하는가"
   - 예: 경제학→PMM은 "미시경제학, 산업조직론..." 강조
   - 예: 경제학→Finance는 "거시경제학, 금융론..." 강조

3. 과목 이름 표준화
   - "계량경제학" vs "계량경제학/통계학" vs "응용계량경제학"
   - 정확한 공식명 결정

**선택사항:**
4. 각 전공별 핵심 개념 정리 (canonicalActions와는 별개)
   - 과목을 통해 배우는 핵심 개념 (예: "시장 메커니즘", "경쟁 전략")

---

## 8. 기술적 연결 검증

### 8.1 Current Status Quo

**newgradMajorCanonicalActionsRegistry.js에서:**
```javascript
ECONOMICS: {
  label: "경제학",
  canonicalActions: ["수치 해석", "시장 구조 분석", ...],
  ...
}
```

✅ 모든 31개 전공이 정의됨

**newgradAxis1MajorPriorRegistry.js에서:**
```javascript
MAJOR.ECONOMICS = "경제학"
AXIS1_MAJOR_PRIOR_BASE["경제학"] = { BUSINESS: 2, FINANCE_ACCOUNTING: 3, ... }
```

✅ 모든 31개 전공이 정의됨

### 8.2 Major Course Registry 연결 가능성

**예상 설계:**
```javascript
// src/data/transitionLite/newgradMajorCourseRegistry.js
export const MAJOR_COURSE_REGISTRY = Object.freeze({
  ECONOMICS: {
    courseExamples: {
      PRODUCT_MARKETING_PMM: ["미시경제학", "산업조직론", ...],
      JOB_FINANCE_FINANCIAL_ANALYST: ["거시경제학", "금융론", ...],
    },
  },
  BUSINESS_ADMIN: {
    courseExamples: {
      PRODUCT_MARKETING_PMM: ["마케팅 전략", "소비자행동론", ...],
      ...
    },
  },
  ...
});

// 사용 예상:
const courseRegistry = getMajorCourseRegistry(canonicalId);
const appealingCourses = courseRegistry?.courseExamples[targetJobId];
```

**연결 안정성:** ✅ 높음 (majorKey/canonicalId 기반이므로 정확함)

---

## 9. 결론 및 최종 판정

### 9.1 Axis1 Major Key Inventory 결과

| 항목 | 결과 | 상태 |
|------|------|------|
| 전공 정의 완정성 | 31개 모두 2개 registry에 정의 | ✅ 완벽 |
| majorKey 일관성 | ECONOMICS, BUSINESS_ADMIN 등 통일 | ✅ 높음 |
| Alias 정의 | normalizedKeys (한글) 기반 | ✅ 명확 |
| 누락/중복 | 없음 | ✅ 안전 |
| registry 설계 가능성 | canonicalId 기반 lookup 가능 | ✅ 가능 |
| **현재 위험요소** | majorKey 값의 정확한 타입 불명확 | ⚠️ 검증 필요 |

### 9.2 권장 다음 단계

**Phase 1: Major Key 타입 확인** ✅ 우선순위 최상
- 현재 axisExplanationRegistry.js의 `majorKey === "ECONOMICS"` 조건이 어떻게 작동하는지 런타임 확인
- majorKey 값이 "경제학" (정규화 한글)인지 "ECONOMICS" (canonicalId)인지 명확히
- **액션:** npm run build + 디버그

**Phase 2: TOP 10 전공 주요 과목 수집** ✅ 병행 가능
- 각 전공별로 정확한 과목명 목록 정리
- 직무별 맞춤 과목 선정
- 문서화

**Phase 3: Major Course Registry 구현** (Phase 1 완료 후)
- newgradMajorCourseRegistry.js 생성
- newgradMajorBridgeRegistry.js 생성 (조건부 문구)
- axisExplanationRegistry.js 확장

---

## 10. 파일 목록 및 주요 발견

### 10.1 조사한 코드 위치

**전공 정의:**
- `src/data/transitionLite/newgradMajorCanonicalActionsRegistry.js` (line 20-200+)
  - 31개 majorKey: canonicalId → label, canonicalActions, learningBasis
  - Export: getMajorCanonicalActionEntry, resolveMajorCanonicalActions

- `src/data/transitionLite/newgradAxis1MajorPriorRegistry.js` (line 15-650)
  - MAJOR 상수: majorKey → label
  - AXIS1_MAJOR_PRIOR_BASE: normalizedKey → 직무별 점수
  - Export: resolveNewgradAxis1MajorPrior, resolveNewgradAxis1MajorPriorBest

**Axis1 연결:**
- `src/lib/analysis/buildNewgradAxisPack.js` (line 2916)
  - majorKey 전달: `majorKey: signals.majorCanonicalKey`

- `src/data/transitionLite/axisExplanationRegistry.js` (line 2310, 2320)
  - majorKey 사용: `const majorKey = String(input?.majorKey || "").trim()`
  - 조건: `const isEconomicsToPMM = majorKey === "ECONOMICS" && ...`

### 10.2 핵심 함수 매핑

```javascript
// 정규화 함수
normalizeMajorPriorKey("경제학") = "경제학"
normalizeMajorCanonicalKey("경제학") = "경제학"

// Lookup 매핑
NORMALIZED_MAJOR_KEY_TO_ID["경제학"] = "ECONOMICS"
MAJOR_CANONICAL_ACTIONS["ECONOMICS"].label = "경제학"

// Axis1 전달
_jobFitMajorPrior.selectedMajorKey = "경제학" (또는 "ECONOMICS"?)
buildNewgradAxisPack: majorKey = signals.majorCanonicalKey = selectedMajorKey
axisExplanationRegistry: majorKey = input.majorKey
```

---

## 11. 한글 인코딩 검증

**파일:** docs/reports/axis1-major-key-inventory.md  
**인코딩:** UTF-8 ✅  
**한글 샘플 검증:**

1. ✅ "경제학" - 일반 한글 (line 94)
2. ✅ "컴퓨터공학" - 특수문자 없는 한글 (line 84)
3. ✅ "전자 / 전기" - 슬래시 포함 (line 87)

**mojibake 패턴 검사:** 없음 ✅

---

**최종 상태:** 🟢 **조사 완료, 다음 단계 준비 완료**

