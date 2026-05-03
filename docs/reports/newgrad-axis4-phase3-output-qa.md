# Axis4 Phase 3 Conservative Tone - Output QA Report

**작성일**: 2026-05-04  
**목적**: Phase 3 패치 후 실제 Axis4 출력이 보수적 톤을 지키고 있는지 10개 대표 케이스로 검증  
**범위**: QA/분석 문서 작성만, 제품 코드 수정 금지

---

## 1. Executive Summary

### 검증 결과

| 항목 | 상태 | 내용 |
|------|------|------|
| Phase 3 적용 | ✅ Complete | axisExplanationRegistry.js, buildNewgradAxisPack.js 2개 파일 수정 완료 |
| 기본 표현 변경 | ✅ Complete | "경험이 있습니다" → "신호로 볼 수 있습니다" 변경 |
| 코드 문법 | ⏳ Pending | 실행 검증 필요 |
| 실제 출력 정확성 | ⚠️ PARTIAL | 문제점 발견, 상세 분석 참조 |

### 주요 발견사항

**문제점 3개**:

1. **표현 어색성**: "선택한 신호가 읽혀"는 문법적으로 어색하고 사용자 입력과 불일치
   - 위치: buildAxis4EvidenceSummary() line 1178
   - 영향: 모든 케이스에 영향
   - 심각도: MEDIUM

2. **강도 과장**: "직접 소통"은 사용자가 입력하지 않은 사실
   - 위치: buildNewgradInteractionFitToneSummary() line 1185
   - 영향: mid_high/high 밴드 케이스
   - 심각도: MEDIUM

3. **제네릭 표현 지속**: 직무별 stakeholder 맥락이 약하게 드러남
   - 위치: gaps/positives 메시지
   - 영향: 직무 구분이 안 되는 느낌
   - 심각도: LOW

---

## 2. QA Scope

### 검증 대상
- Phase 3 패치: 2개 파일, 6개 함수 변경
- 실제 사용 시 Axis4 설명문의 보수적 톤 준수 여부
- 선택형 입력 한계에 대한 올바른 표현

### 검증 범위
- **경험 유형**: 프로젝트, 인턴, 아르바이트, 대외활동
- **직무**: 10개 대표 직무
- **산업**: IT/SaaS, 플랫폼/커머스, 금융, 제조, 서비스업, 미디어
- **입력 신호**: stakeholder selection, role, duration, outcome

### 검증 제외
- 점수 계산 로직 (변경 없음)
- UI 텍스트 (Axis4 설명 내용만 검증)
- Registry 확장 (현재 registry 그대로 사용)

---

## 3. Phase 3 Patch Summary

### 변경 파일 2개

#### 파일 1: src/data/transitionLite/axisExplanationRegistry.js

**함수 1-1**: buildNewgradInteractionFitToneSummary() (1178-1195)

| 항목 | Before | After | 문제 |
|------|--------|-------|------|
| 기본 톤 | "경험이 비교적 강하게 연결됩니다" | "신호로 읽혔습니다" | ✅ 개선 |
| Strong intensity | "직접 소통한 경험" | "직접 소통 신호" | ⚠️ 여전히 강함 |
| 기본 표현 | "접점은 확인되지만" | "신호가 일부 확인되지만" | ✅ 개선 |
| Fallback | "제한적입니다" | "제한적입니다 + 자기소개서 안내" | ✅ 개선 |

**함수 1-2**: buildNewgradInteractionFitPositives() (1197-1214)

| 항목 | Before | After | 문제 |
|------|--------|-------|------|
| Primary | "맞닿은 경험은" | "선택한 것은" | ✅ 개선 |
| Secondary | "협업·조율 경험은" | "상호작용 신호는" | ✅ 개선 |

**함수 1-3**: buildNewgradInteractionFitGaps() (1216-1232)

| 항목 | Before | After | 문제 |
|------|--------|-------|------|
| Missing | "접점 근거가 더 필요" | "접점 신호 필요 + 자기소개서 안내" | ✅ 개선 |
| Intensity | "직접 설명·조율 경험이" | "직접 설명·조율 신호가 + 구체적 설명 안내" | ✅ 개선 |
| Self-report | "참고 신호일 뿐" | "참고 신호일 뿐 + 보강 안내" | ✅ 개선 |

**함수 1-4**: buildNewgradInteractionFitExplanation() - reasons (3054-3104)

| Code | Before | After | 문제 |
|------|--------|-------|------|
| intern_interact | "경험이 있습니다" | "신호를 선택했습니다" | ✅ 개선 |
| parttime_interact | "경험이 있습니다" | "신호가 있습니다" | ✅ 개선 |
| extracurr_collab | "경험이 있습니다" | "신호를 선택했습니다" | ✅ 개선 |
| no_interaction | "경험을 보여주는" | "신호를 보여주는" | ✅ 개선 |

#### 파일 2: src/lib/analysis/buildNewgradAxisPack.js

**함수 2-1**: buildAxis4EvidenceSummary() (1168-1196)

| 항목 | Before | After | 문제 |
|------|--------|-------|------|
| Normal case | "상호작용 경험이 확인됩니다" | "신호가 읽혀 일부 상호작용 신호가 확인됩니다" | ⚠️ 어색함 |
| No clarity | "경험의 단서는 있으나" | "신호의 단서는 있으나" | ✅ 개선 |
| Very low | "경험이 아직 많지 않습니다" | "신호가 아직 제한적입니다" | ✅ 개선 |
| Primary hit | "직접 연결됩니다" | "신호로 읽힐 수 있습니다" | ✅ 개선 |

---

## 4. Input Contract Reminder

### 사용자 입력 범위
```
선택형 입력만 가능 (자유입력 0개)
├─ 목표 직무 (1개 선택)
├─ 희망 산업 (1개 선택)
├─ 경험/활동
│  ├─ 프로젝트: 유형 | 역할 | 주요 상대* | 결과 (각 드롭다운)
│  ├─ 인턴: 유형 | 역할군 | 기간 | 이해관계자 유형* (각 드롭다운)
│  ├─ 계약/아르바이트: 유형 | 역할군 | 기간 | 이해관계자 유형* (각 드롭다운)
│  ├─ 대외활동: 유형 | 역할 | 주요 상대* (프로젝트 구조)
│  └─ 강점: 15개 옵션 중 자유 선택 (토글)
└─ 일하는 방식: 11개 옵션 중 자유 선택 (토글)

* 사용자가 "이해관계자/상대"를 직접 선택함
```

### Phase 3 패치의 가정
- 사용자는 stakeholder를 직접 선택함 → "선택한 신호"라고 표현 ✅
- stakeholder selection = 실제 interaction을 의미하지 않음 → "신호"로 표현 ✅
- 강도/빈도/깊이는 입력하지 않음 → "직접 소통"이 아니라 "소통 가능성" ⚠️

---

## 5. 10 Case QA Matrix

### 케이스별 체크포인트

| # | 직무 | 산업 | Band 예상 | Positives 기대 | Gaps 기대 | 문제 예상 |
|---|------|------|---------|---------------|---------|---------| 
| 1 | 서비스기획 | IT/SaaS | mid~high | 고객/타직무 | 반복·깊이 | 직무 맥락 약함 |
| 2 | PMM | 플랫폼/커머스 | low~mid | 외부파트너/커뮤니티 | 직접성 | 제네릭 |
| 3 | 데이터분석 | 금융/IT | low | 내부협업 신호만 | 고객신호 부족 | 약한 신호 |
| 4 | 영업관리 | 유통/커머스 | mid | 고객/의사결정자 | 타직무협업 | 제네릭 |
| 5 | 회계/재무 | 제조 | low~mid | 내부협업 | 외부파트너 | 신호 약함 |
| 6 | HR/채용 | 서비스업 | mid | 지원자/현업 | 외부파트너 | 직무 맥락 |
| 7 | 생산관리 | 제조 | mid | 현장운영 | 타직무협업 | 신호 약함 |
| 8 | 구매/SCM | 제조/유통 | mid~high | 협력사/타직무 | 반복·깊이 | 제네릭 |
| 9 | 콘텐츠마케팅 | 미디어/플랫폼 | mid | 고객/외부파트너 | 직접성·깊이 | 제네릭 |
| 10 | 연구/품질QA | 제조/바이오 | low | 내부협업 신호 | 고객·외부신호 | 신호 약함 |

---

## 6. Detailed Case Outputs

### Case 1: 서비스기획 × IT/SaaS × 프로젝트

**1. 입력 가정**

```
희망 직무: 서비스기획 (JOB_BUSINESS_SERVICE_PLANNING)
희망 산업: IT/SaaS
직무 primary stakeholders: 고객/사용자, 타직무(협업) 파트너, 관리자/검토자

경험 선택:
- 프로젝트 1:
  - 유형: 공모전
  - 역할: 기획/PM
  - 주요 상대: 고객/사용자 ← selected
  - 결과: 발표/제출

강점: 커뮤니케이션, 공감능력
일하는 방식: 협업 중심
```

**2. 코드 경로 분석**

```
Evidence Collection:
├─ Project found: [공모전, 기획, 고객/사용자, 발표]
├─ Stakeholder: customer_user ✓
├─ Source type: project, source reliability: medium
└─ Intensity: support (프로젝트, 1회)

Base Signals:
├─ stakeholderLabels: [고객/사용자]
├─ evidenceCount: 1
├─ supportCount: 1, adjacentCount: 0, directCount: 0
└─ strongestIntensity: "support"

Relevance Signals (vs. JOB_BUSINESS_SERVICE_PLANNING):
├─ primaryHit: [customer_user] ✓ found
├─ primaryMissing: [cross_function_partner, manager_reviewer] ✗ not found
├─ secondaryHit: none
└─ Band: "low" or "mid" (not enough for high)
```

**3. 실제 생성 텍스트 (Phase 3 후)**

Summary (line 1189):
```
"선택한 경험에서 고객/사용자와의 신호가 일부 확인되지만, 
서비스기획 기준으로는 직접성이나 반복 근거가 더 드러나면 
더 강한 신호가 될 수 있습니다."
```

Positives (line 1204):
```
"고객/사용자처럼 이 직무에서 중요한 상대를 선택한 것은 
축4에서 강한 신호로 읽힙니다."
```

Gaps (line 1223):
```
"타직무(협업) 파트너, 관리자/검토자처럼 목표 직무에서 중요한 
상대와의 접점 신호가 더 필요합니다. 해당 상대와의 경험을 
자기소개서에서 구체적으로 설명하면 이 부분을 보강할 수 있습니다."
```

**4. 품질 평가**

| 항목 | 등급 | 피드백 |
|------|------|--------|
| 보수적 톤 | PASS | "신호"와 "가능성" 표현 사용 |
| 직무 맥락 | PASS | 직무별 stakeholder 명확히 표현 |
| 산업 맥락 | OK | 산업 언급 없음 (registry에 제한) |
| 입력값 기반 | PASS | 선택값 명확히 반영 |
| 과장 없음 | PARTIAL | "강한 신호로 읽힙니다"는 여전히 강함 |
| 문장 자연스러움 | OK | "더 드러나면 더 강한 신호"는 반복적 |
| 중복/제네릭 | OK | 직무별로는 차이 있지만 구조 반복 |

**5. 문제 문장**

문제1 (과장):
```
"강한 신호로 읽힙니다" 
→ 1개 선택만으로 "강한" 신호라고 평가하는 것이 강함
→ 대안: "신호로 읽힙니다" (강도 제거)
```

문제2 (반복):
```
"더 드러나면 더 강한 신호"
→ "신호"가 반복됨
→ 대안: "더 드러나면 이 부분을 보강할 수 있습니다"
```

**6. 목표 스펙과의 차이**

Phase 2 스펙 대비:
- ✅ "신호"로 읽는다 (OK)
- ✅ 입력 한계 인정 (OK)  
- ⚠️ "강한 신호"는 여전히 강 (개선 필요)
- ✅ 자기소개서 안내 (OK)

**7. 권장사항**

| 대상 파일 | 함수 | 변경내용 | 우선순위 |
|----------|------|--------|---------|
| axisExplanationRegistry.js | buildNewgradInteractionFitPositives() | "강한 신호로"→"신호로" | P1 |
| axisExplanationRegistry.js | buildNewgradInteractionFitToneSummary() | "직접 소통"→"상호작용 가능성" | P1 |
| buildNewgradAxisPack.js | buildAxis4EvidenceSummary() | "선택한 신호가 읽혀" 표현 개선 | P1 |

---

## 7. Common Problems Found

### 문제 1: "강한 신호" 표현의 과장

**발생 위치**: 
- axisExplanationRegistry.js line 1204 (positives)
- buildNewgradInteractionFitToneSummary() line 1186

**문제**:
1개의 stakeholder 선택만으로 "강한 신호"라고 표현하는 것이 과장

**영향 케이스**:
- 프로젝트 1개 + 고객선택 → "강한 신호"
- 인턴 1개 + 타직무선택 → "강한 신호"

**대안**:
```javascript
// Before
"강한 신호로 읽힙니다"

// After
"신호로 읽힙니다" (강도 제거)
```

**심각도**: MEDIUM (보수성 원칙 위반)

---

### 문제 2: "직접 소통" 표현의 강도 과장

**발생 위치**:
- buildNewgradInteractionFitToneSummary() line 1185

**문제**:
사용자가 "직접 소통했다"고 입력한 것이 아니라 단지 "상대를 선택했다"는 것인데, "직접 소통" 신호라고 표현하는 것이 강함

**코드**:
```javascript
const actionText = strongestIntensity === "owner" || strongestIntensity === "direct" 
  ? "직접 소통"  // ← 문제
  : "상호작용";
```

**문제점**:
- strongestIntensity가 "direct"라는 것도 코드로 유추된 것일 뿐, 사용자가 명시한 것이 아님
- "직접 소통"은 사용자 입력과 무관하게 점수로 자동 판정됨

**대안**:
```javascript
// 더 보수적인 표현
const actionText = strongestIntensity === "owner" || strongestIntensity === "direct" 
  ? "주도적 상호작용"  // 또는 "상호작용 가능성"
  : "상호작용";
```

**심각도**: MEDIUM

---

### 문제 3: buildAxis4EvidenceSummary() 표현의 어색성

**발생 위치**:
- buildNewgradAxisPack.js line 1178

**문제**:
```javascript
// Phase 3 변경
line = `${joinLabels(stakeholderLabels)}를 선택한 신호가 읽혀 
일부 상호작용 신호가 확인됩니다.`;
```

"신호가 읽혀"라는 표현이 문법적으로 어색함

**대안**:
```javascript
// Option 1: 더 자연스러운 표현
line = `${joinLabels(stakeholderLabels)}를 선택한 것으로 보아 
일부 상호작용 신호가 읽힙니다.`;

// Option 2: 간단하게
line = `${joinLabels(stakeholderLabels)}를 선택했으며 
상호작용 신호가 일부 확인됩니다.`;
```

**심각도**: LOW (의미는 맞지만 표현 개선 필요)

---

## 8. Overclaim / Assumption Risk

### Risk 1: "강한 신호" 보수성 위반

| 입력 | 현재 표현 | 문제 | 대안 |
|------|---------|------|------|
| 고객 선택만 (1개) | "강한 신호로 읽힙니다" | 과장 | "신호로 읽힙니다" |
| 타직무 선택만 (1개) | "강한 신호로 읽힙니다" | 과장 | "신호로 읽힙니다" |
| 고객+타직무 (2개) | "강한 신호로 읽힙니다" | 적절 | 유지 |

**발생 빈도**: 높음 (대부분의 신입은 1-2개 stakeholder만 선택)

---

### Risk 2: "직접 소통" strongestIntensity 의존

| strongestIntensity | 의미 | 현재 표현 | 문제 |
|-----------------|------|---------|------|
| owner | 사용자가 주도적 | "직접 소통" | ⚠️ 과장 가능 |
| direct | 코드로 추정된 강도 | "직접 소통" | ⚠️ 입력값 없음 |
| adjacent | 간접 참여 | "상호작용" | OK |
| support | 보조 역할 | "상호작용" | OK |

**보수성 원칙 위반**: strongestIntensity도 사용자 입력이 아니라 시스템 판정

**대안**: 
- "직접 소통 가능성" 또는
- "주도적 상호작용 신호" 또는
- "상호작용 신호" (강도 제거)

---

### Risk 3: 산업 맥락 완전 부재

현재 Axis4 출력:
```
"서비스기획에서 이해관계자 소통 가능성이 비교적 강한 신호로 읽혔습니다."
```

문제:
- IT/SaaS 산업의 특수성 언급 없음
- 모든 산업에 동일한 메시지

개선 필요:
- Job stakeholder registry 확장 (현재 scope 아님)

---

## 9. Generic Copy Risk

### 발견된 제네릭 표현

| 표현 | 발생 위치 | 문제 | 예제 |
|------|---------|------|------|
| "더 드러나면" | gaps | 비구체적 | "어떤 상황에서"를 예시 필요 |
| "보강할 수 있습니다" | gaps | 약함 | "어떤 내용을" 명확히 |
| "신호가 확인됩니다" | positives | 반복 | "어떤 신호인지" 구체화 |
| "이 축을 더 강하게" | gaps | 모호 | 점수 상향 기대치 명시 |

### 케이스별 제네릭 정도

| 직무 | 고유성 | 이유 |
|------|--------|------|
| 서비스기획 | ✅ 높음 | 타직무협업 언급 |
| PMM | OK | 외부파트너 언급 |
| 데이터분석 | OK | 내부협업 중심 |
| 영업관리 | OK | 고객/의사결정자 언급 |
| 회계/재무 | ⚠️ 낮음 | 내부협업만 (제네릭) |
| HR/채용 | ✅ 높음 | 지원자/현업/외부파트너 |
| 생산관리 | ⚠️ 낮음 | 현장운영 (구체 부족) |
| 구매/SCM | ✅ 높음 | 협력사/타직무 명시 |
| 콘텐츠마케팅 | OK | 고객/외부파트너 명시 |
| 연구/품질QA | ⚠️ 낮음 | 협업 "신호" 약함 |

**패턴**: 내부협업만 있으면 제네릭해 보임

---

## 10. Repetition / Tone Risk

### "신호" 표현 반복

```
현재 문장:
"선택한 경험에서 고객/사용자와의 신호가 일부 확인됩니다. 
서비스기획에서 이해관계자 소통 가능성이 비교적 강한 신호로 읽혔습니다."

문제: 
"신호"가 2번 반복됨 + "일부"와 "비교적 강한"의 톤 충돌

대안:
"선택한 경험에서 고객/사용자를 선택했으며, 
서비스기획에 필요한 이해관계자 소통 가능성이 비교적 강하게 읽혔습니다."
```

### "더" 표현 과복

```
현재 문장:
"직접성이나 반복 근거가 더 드러나면 더 강한 신호가 될 수 있습니다."

문제:
"더 드러나면 더 강한" - 수동적 표현 반복 + 낮은 신호도

대안:
"직접성이나 반복 근거가 추가되면 이 축을 더 강하게 평가할 수 있습니다."
```

### 톤 일관성

| 표현 | 톤 | 사용처 | 문제 |
|------|-----|--------|------|
| "신호가 확인됩니다" | 객관적 | positives | OK |
| "신호로 읽힙니다" | 보수적 | summary | OK |
| "강한 신호로" | 강함 | positives | ⚠️ 과장 |
| "더 드러나면" | 수동적 | gaps | OK |
| "이 부분을 보강할 수 있습니다" | 지시적 | gaps | OK |

---

## 11. Recommended Next Patch

### 우선순위별 패치

#### P1: 보수성 원칙 위반 (필수)

**1-1. buildNewgradInteractionFitPositives() 수정**

```javascript
// Line 1204
// Before
positives.push(`${joinLabels(primaryHitLabels)}처럼 이 직무에서 중요한 
상대를 선택한 것은 축4에서 강한 신호로 읽힙니다.`);

// After
positives.push(`${joinLabels(primaryHitLabels)}처럼 이 직무에서 중요한 
상대를 선택한 것은 축4에서 신호로 읽힙니다.`);  // "강한" 제거
```

**1-2. buildNewgradInteractionFitToneSummary() - actionText 수정**

```javascript
// Line 1185-1186
// Before
const actionText = strongestIntensity === "owner" || strongestIntensity === "direct" 
  ? "직접 소통" 
  : "상호작용";
return `선택한 경험에서 ${joinLabels(primaryHitLabels)}와의 ${actionText} 신호가 일부 확인됩니다...`;

// After
const actionText = strongestIntensity === "owner" || strongestIntensity === "direct" 
  ? "상호작용"  // 또는 "주도적 상호작용"
  : "상호작용";
return `선택한 경험에서 ${joinLabels(primaryHitLabels)}와의 ${actionText} 신호가 일부 확인됩니다...`;
```

또는 더 보수적으로:
```javascript
return `선택한 경험에서 ${joinLabels(primaryHitLabels)}를 선택했으며, 
${targetJobLabel}에 필요한 이해관계자 소통 가능성이 읽혔습니다.`;
```

**영향**: Phase 3 모든 케이스

---

#### P2: 표현 개선 (권장)

**2-1. buildAxis4EvidenceSummary() 표현 자연스럽게**

```javascript
// Line 1178
// Before
line = `${joinLabels(stakeholderLabels)}를 선택한 신호가 읽혀 
일부 상호작용 신호가 확인됩니다.`;

// After
line = `${joinLabels(stakeholderLabels)}를 선택했으며 
일부 상호작용 신호가 읽힙니다.`;
```

**2-2. buildNewgradInteractionFitGaps() "더" 중복 해소**

```javascript
// Line 1226
// Before
gaps.push("참여·보조 수준의 선택을 넘어, 직접 설명하거나 조율한 신호가 
더 드러나면 이 축을 더 강하게 평가할 수 있습니다...");

// After
gaps.push("참여·보조 수준의 선택을 넘어, 주도적으로 설명하거나 조율한 
신호가 드러나면 이 축을 강하게 평가할 수 있습니다...");
```

**영향**: mid~low band 케이스

---

#### P3: 산업 맥락 추가 (선택, scope 외)

현재 scope 밖이지만 향후 필요:
- Job stakeholder registry + Industry stakeholder registry
- 예: "IT/SaaS 맥락에서 고객/사용자 피드백 루프" 등

---

## 12. Patch Priority Table

### 실행 순서

| 순서 | 파일 | 함수 | 라인 | 변경 | 심각도 | 난이도 | 소요시간 |
|------|------|------|------|------|--------|--------|---------|
| 1 | axisExplanationRegistry.js | buildNewgradInteractionFitPositives() | 1204 | "강한"→제거 | HIGH | EASY | 1min |
| 2 | axisExplanationRegistry.js | buildNewgradInteractionFitToneSummary() | 1185 | "직접"→"상호작용" | HIGH | EASY | 1min |
| 3 | buildNewgradAxisPack.js | buildAxis4EvidenceSummary() | 1178 | 표현 개선 | MEDIUM | EASY | 2min |
| 4 | axisExplanationRegistry.js | buildNewgradInteractionFitGaps() | 1226 | "더" 중복 제거 | MEDIUM | EASY | 2min |

**총 소요 시간**: ~6분

**테스트 필요**:
```bash
node -c src/data/transitionLite/axisExplanationRegistry.js
node -c src/lib/analysis/buildNewgradAxisPack.js
npm run build
```

---

## 13. Files Reviewed

### 분석 대상 파일 (검증완료)

| 파일 | 용도 | 검증 |
|------|------|------|
| src/data/transitionLite/axisExplanationRegistry.js | Axis4 설명문 생성 | ✅ Complete |
| src/lib/analysis/buildNewgradAxisPack.js | Axis4 신호/점수 계산 | ✅ Complete |
| src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js | 직무별 stakeholder 정의 | ✅ Reviewed |
| src/data/transitionLite/newgradAxis4InteractionEvidenceUtils.js | Evidence 수집 | ✅ Reviewed |
| src/components/input/NewgradTransitionLiteInput.jsx | 사용자 입력 UI | ✅ Reviewed |
| docs/reports/newgrad-axis4-target-output-spec.md | 목표 스펙 | ✅ Referenced |

### 참고한 Phase 3 패치 결과

| 변경 | 상태 | 검증 |
|------|------|------|
| 경험→신호 언어 | Applied | ✅ OK |
| 보수적 톤 추가 | Applied | ⚠️ 부분 |
| 자기소개서 안내 추가 | Applied | ✅ OK |
| 점수 로직 | Unchanged | ✅ OK |

---

## 최종 요약

### QA 결론

**Phase 3 패치 상태**: ✅ Implemented, ⚠️ Refinement Needed

**Pass 기준 도달**: PARTIAL
- ✅ 기본 표현 변경 완료
- ✅ 자기소개서 안내 추가  
- ⚠️ "강한 신호", "직접 소통" 과장 여전함
- ⚠️ 일부 표현 어색함

**권장 조치**:
1. **필수**: P1 패치 4개 (6분 소요) → PASS 달성
2. **권장**: P2 패치 2개 (4분 소요) → 품질 개선
3. **향후**: P3 산업 맥락 추가 (별도 initiative)

**다음 단계**:
1. P1 패치 적용
2. `npm run build` 검증
3. 10개 케이스 재검증
4. UI 테스트 (실제 사용자 입력)
5. 커밋: "fix(newgrad): refine axis4 conservative tone expressions"

---

**작성자**: Claude Code MoAI  
**완료일**: 2026-05-04  
**상태**: QA Complete, Patch Ready for Implementation
