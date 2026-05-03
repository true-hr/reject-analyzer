# Newgrad Axis4 P3 Industry/Experience Context - Implementation Scope Plan

**Date**: 2026-05-04  
**Status**: Design Phase  
**Branch**: docs/newgrad-axis4-p3-scope-plan  
**Author**: MoAI Strategic Orchestrator

---

## 1. Executive Summary

Axis4 P2.5 완료 후, 6개 직무(데이터분석, 회계/재무, 생산관리, 품질QA, PMM, 퍼포먼스마케팅)의 설명이 PARTIAL 상태이다. P3에서는 산업별/경험별 이해관계자 맥락을 추가하여 이들을 PASS로 개선한다.

**P3 핵심 설계**:
- 산업 정보는 현재 Axis4에 전달되지 않는다. 최소 구조로 전달 경로를 확보한다.
- 경험/활동 선택값은 이미 Axis4 신호에 포함되어 있다. P3에서는 이를 명시적으로 해석한다.
- Axis2와의 책임 분리: Axis2는 산업 이해도, Axis4는 산업 내 이해관계자 소통 방식.
- P3-1 Batch는 5개 케이스(금융, IT/SaaS, 제조)에서 산업 registry만 추가.

---

## 2. Current Axis4 Status After P2.5

### Completed
- **P2.5 Clean PR 반영 완료** (commit 7b586bd)
- buildAxis4StakeholderRoleHint() / buildAxis4RoleHintClosing() 정상 작동
- 6개 직무 stakeholderRoles 정의 완료
- 첫 문장 "맞닭아" 정확 적용
- 타이포 "맞닭을" → "맞닿을" 수정 완료

### Current PARTIAL Status Breakdown

| 직무 | 원인 | 부족한 것 |
|-----|-----|---------|
| 데이터분석 | 산업별 이해관계자 차이 미반영 | 금융 vs IT에서 다른 "분석 요청자" |
| 회계/재무 | 산업별 규제/감사 맥락 부재 | 제조 vs 금융에서 다른 "외부 감사자" |
| 생산관리 | 산업별 공급망 구조 차이 | 자재/협력사 관계 산업별 차이 |
| 품질QA | 산업별 규제 수준 차이 | 바이오 vs 제조의 엄격도 |
| PMM | (분리 완료됨) | 맥락 강화만 필요 |
| 퍼포먼스마케팅 | (분리 완료됨) | 맥락 강화만 필요 |

---

## 3. Remaining Problem Definition

### 3.1 What P2.5 Solved
✅ 6개 직무별 primary/secondary/tertiary 이해관계자 정의  
✅ role별 closing 문구 차별화 (internal vs external)  
✅ 첫 문장 문법 정확화

### 3.2 What P3 Must Solve

**문제 1: 산업별 이해관계자 역할 다양성**
```
현재 (P2.5):
"데이터분석에서는 현업/기획/마케팅팀과 맞닭아... 분석 요청 배경을 이해하고..."

부족한 점:
- 금융에서는 "Risk/Compliance팀"도 주요 분석 요청자
- IT/SaaS에서는 "Product/Engineering팀"이 분석 수요 주도
- 제조에서는 "품질/생산팀"이 실시간 분석 필요
```

**문제 2: 산업별 규제/감사 맥락 부재**
```
회계/재무 × 제조 vs 회계/재무 × 금융:
- 제조: 원가/재정관리 중심, 내부 부서와 구매/생산 조율
- 금융: 규제/콤플라이언스 중심, 외부 감시자(규제당국) 존재
```

**문제 3: 경험/활동 선택값 해석 부족**
```
현재:
- baseSignals에 포함되어 있음
- 하지만 "어떤 활동=어떤 이해관계자 신호"인지 명시 부재

필요한 것:
- 인턴/아르바이트 → 현장/운영자 접점
- 프로젝트/R&D → 협업자/리더 접점
- 자격증 → 산업 기본 이해만 신호
```

---

## 4. Current Data Flow (Axis4)

```
Input Layer:
  input.targetJobId
  input.targetIndustryId ← 전달되지만 사용 안 함
  input.targetIndustryLabel ← 전달되지만 사용 안 함
  input.experienceCategories[]
  input.interactionEvidence[] (프로젝트, 인턴 등)
         ↓
buildNewgradAxisPack.js::evaluateInteractionFit()
         ↓
collectNewgradAxis4InteractionEvidence(input)
computeAxis4BaseInteractionSignals(evidenceList)
getAxis4StakeholderRelevanceByJobId(input.targetJobId)
computeAxis4JobRelevanceSignals(evidenceList, relevanceMeta)
         ↓
buildAxis4EvidenceSummary(baseSignals, relevanceSignals)
  ↑
  └─ targetIndustryId/Label 전달 안 됨 ← P3 추가 필요
  
buildAxis4IntensitySummary(baseSignals)
         ↓
Output Layer:
  score: 1-5
  positives[]
  gaps[]
  hints (stakeholderRole hint)
```

---

## 5. Industry Input Contract

### Current State
- `input.targetIndustryId`: 사용자가 드롭다운에서 선택
- `input.targetIndustryLabel`: 해당 산업 명칭 (예: "제조업", "금융/핀테크")
- 위치: buildNewgradAxisPack.js의 evaluateInteractionFit() 호출 지점

### What's Available
```javascript
// src/lib/analysis/buildNewgradAxisPack.js line 1029
const industryProfile = _getIndustryPrepProfile(input.targetIndustryId);

// src/lib/analysis/buildNewgradAxisPack.js line 2345
const targetIndustryLabel = toStr(signals.targetIndustryLabel);
```

이미 Axis2(산업 이해도)에서 사용 중.

---

## 6. Existing Industry Registry Structure

### Location
- **Main registry**: `src/data/industry/registry/`
- **Archetype registry**: `src/data/transitionLite/industryArchetypeRegistry.js`

### Current Usage Pattern (Axis2)
```
getIndustryRegistryItemById(targetIndustryId)
  → label: 산업 명칭
  → majorAlignments: 전공 적합 여부
  → businessModels: 비즈니스 모델 타입
```

### What Axis4 Needs Differently
```
Axis2 uses: 산업 이해도 (경험자인가?)
Axis4 uses: 산업 내 이해관계자 구조 (어떤 역할과 소통하나?)

예:
- 금융: {"regulatoryBody": true, "riskManagement": true, ...}
- 제조: {"productionFloor": true, "qualityAssurance": true, ...}
- IT/SaaS: {"endUsers": true, "enterprise": true, ...}
```

---

## 7. Axis2 vs Axis4 Responsibility Boundary

### Axis2 (산업 이해도)
**What**: 신입이 산업을 "이해"하고 있는가?  
**Signals**: 전공, 자격증, 프로젝트 주제, 인턴 회사 산업  
**Output**: "제조 산업 이해의 기본 기반이 비교적 또렷합니다"

### Axis4 (이해관계자 소통 적합성)  
**What**: 신입이 산업 내 "이해관계자와 소통"할 수 있는가?  
**Signals**: 경험한 role/position, 협업 상대, 의사결정 참여  
**Output**: "생산 현장과 맞닭아... 품질 문제를 즉시 대응하는 부분이 중요합니다"

### Non-Overlap Rule
❌ Axis4 금지: "금융산업을 이해하고 있습니다" ← Axis2 영역  
❌ Axis2 금지: "고객과 소통하는 경험이 있습니다" ← Axis4 영역  
✅ OK: "금융에서 고객과 협협의하는 역할 경험"

---

## 8. Experience Input Contract

### What's Currently Captured in Axis4 Evidence
```
From input.interactionEvidence[]:
  - type: "project" | "internship" | "parttime" | "activity" | "research" | "certification"
  - stakeholder: 누구와 일했나 (customer, team, manager, ...)
  - intensity: "support" | "adjacent" | "direct" | "owner"
  
Examples:
- 프로젝트 (팀장과 협업, direct) → manager_reviewer 신호
- 인턴 (생산팀과 현장 관여, direct) → field_practitioner_operator 신호
- 자격증 → 신호 없음 (산업 이해만)
```

### How P3 Will Interpret

**활동 유형 → 이해관계자 매핑**

| 활동 유형 | 신호 | Axis4 해석 |
|---------|-----|-----------|
| 인턴/아르바이트 | "실제 현장 경험" | "생산 현장 / 운영자" |
| 프로젝트/팀 작업 | "협업 경험" | "내부 협력자" |
| 고객 대면 | "고객 대응" | "customer_user" |
| R&D / 연구 | "기술/분석 주도" | "cross_function_partner" |
| 공모전 | "제한적 신호" | 보수적 해석만 |

---

## 9. P3 Implementation Options

### Option A: Extend industryArchetypeRegistry.js with axis4StakeholderContext

**파일 변경**:
- `src/data/transitionLite/industryArchetypeRegistry.js`

**구조**:
```javascript
export const INDUSTRY_ARCHETYPE_REGISTRY = {
  "financial_services": {
    label: "금융/핀테크",
    axis2: {...},
    axis4: {
      primaryStakeholders: {
        "customer_user": "고객/투자자",
        "regulatory_body": "규제 당국/금융감독",
        "internal_risk_team": "리스크/콤플라이언스팀"
      },
      contextNotes: {...}
    }
  },
  ...
}
```

**장점**:
- 기존 archetype registry와 통합
- 산업별 단일 지점 관리
- 확장성 좋음

**위험**:
- industryArchetypeRegistry.js가 이미 커짐
- Axis4 context 추가로 인한 데이터 중복 가능성

**Fallback**:
- axis4 필드가 없으면 기본값 (generic)

**추천**: ⭐⭐⭐⭐ (가장 안전)

---

### Option B: New File newgradAxis4IndustryStakeholderContextRegistry.js

**파일 생성**:
- `src/data/transitionLite/newgradAxis4IndustryStakeholderContextRegistry.js`

**구조**:
```javascript
export const AXIS4_INDUSTRY_STAKEHOLDER_CONTEXT = {
  "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS": {
    "금융_핀테크": {
      primaryOverride: ["internal_risk_team", "customer_user"],
      contextSummary: "금융에서는 리스크/데이터팀과의 협업이..."
    },
    "IT_SaaS": {
      primaryOverride: ["product_team", "customer_user"],
      contextSummary: "IT에서는 제품팀 주도 분석 요청..."
    }
  }
}
```

**장점**:
- Axis4 전용, 분리 명확
- Job × Industry 매트릭스로 관리 직관적

**위험**:
- 새 파일 추가로 인한 관리 부담
- Job-Industry 조합 폭발적 증가 (직무 × 산업)

**Fallback**:
- 매트릭스에 없으면 job-only 사용

**추천**: ⭐⭐ (복잡도 높음)

---

### Option C: Inline Map in axisExplanationRegistry.js

**파일 변경**:
- `src/data/transitionLite/axisExplanationRegistry.js` (상단에 map 추가)

**구조**:
```javascript
const AXIS4_INDUSTRY_ROLE_MODIFIERS = {
  "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS": {
    "금융": { addStakeholders: ["internal_risk_team"], ...},
    "제조": { addStakeholders: ["production_team"], ...},
  },
  ...
};

function buildAxis4StakeholderRoleHint(signals) {
  const industryMod = AXIS4_INDUSTRY_ROLE_MODIFIERS[signals.jobId]?.[signals.industryLabel];
  // industryMod 적용
}
```

**장점**:
- 최소 변경 (하나의 파일)
- 빠른 구현

**위험**:
- 파일 크기 증가 (3274 → 3500+ 줄)
- 혼잡해질 가능성

**추천**: ⭐⭐⭐ (중간 선택)

---

### Option D: Industry Signal Summary Only

**파일 변경**:
- `src/lib/analysis/buildNewgradAxisPack.js` (신호 생성만)

**구조**:
```javascript
function buildAxis4IndustrySignalSummary(targetIndustryId) {
  const industrialContext = {...};
  return {
    primaryIndustryStakeholders: [...],
    industryContextGap: "제조 환경에서는...",
  };
}

// 이를 signal에 추가하고, axisExplanationRegistry에 전달
```

**장점**:
- registry 수정 최소
- 신호 생성 로직만 추가

**위험**:
- 해석 규칙이 명확하지 않음
- Axis4 설명 함수가 복잡해짐

**추천**: ⭐ (불확실성 높음)

---

## 10. Recommended P3 Architecture

### ✅ Chosen: Option A (Extend industryArchetypeRegistry.js)

**이유**:
1. 기존 데이터 흐름과 최소 충돌
2. Axis2 산업 정보와 통합 관리
3. registry 단일 지점 원칙 유지

**구현 단계**:

1. **Phase 1**: industryArchetypeRegistry.js에 axis4Context 필드 추가
```javascript
export const INDUSTRY_ARCHETYPE_REGISTRY = {
  "manufacturing": {
    label: "제조업",
    description: "...",
    axis4Context: {
      stakeholdersByJob: {
        "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT": {
          relatedStakeholders: ["field_practitioner_operator", "cross_function_partner"],
          industryNote: "생산 현장의 자재/품질 조율이 핵심"
        },
        "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS": {
          relatedStakeholders: ["production_team", "quality_team"],
          industryNote: "생산/품질 데이터 요청이 주 분석 신호"
        }
      }
    }
  },
  ...
}
```

2. **Phase 2**: buildNewgradAxisPack.js에서 산업 context 전달
```javascript
function evaluateInteractionFit(input = {}) {
  const industryContext = getIndustryAxis4Context(input.targetIndustryId, input.targetJobId);
  return {
    ...existing,
    industryAxis4Context: industryContext
  };
}
```

3. **Phase 3**: axisExplanationRegistry.js에서 활용
```javascript
function buildAxis4StakeholderRoleHint(signals) {
  const industryContext = signals.industryAxis4Context;
  // industryContext 기반으로 hint 강화
}
```

---

## 11. Batch 1 Industry Targets

### Priority: Focus on P2 PARTIAL Cases

**선정 기준**:
- P2.5 후 PARTIAL 상태인 직무들
- 산업별 이해관계자 차이가 명확한 산업들
- 최소 5-6개 산업 대상

### Batch 1 Recommended Industries

#### 1. 금융/핀테크
**대상 직무**: 데이터분석, 회계/재무  
**핵심 이해관계자**: 
- Risk/Compliance팀 (금융 특화)
- Regulatory bodies (금융 특화)
- 고객/투자자 (공통)

**P3 추가 맥락**:
```
데이터분석 × 금융:
"금융에서는 분석 요청자가 현업/마케팅팀뿐 아니라 
리스크/규제 준수팀도 포함되어, 분석 기준의 엄격도가 다릅니다."
```

#### 2. IT/SaaS/플랫폼
**대상 직무**: 데이터분석, PMM, 품질QA  
**핵심 이해관계자**:
- Product팀 (IT 특화)
- Engineering팀 (IT 특화)
- 고객/사용자 (공통)

**P3 추가 맥락**:
```
PMM × IT/SaaS:
"기술 제품 포지셔닝은 개발팀의 기술 강점을 
정확히 이해하고 설명할 수 있는 협업이 핵심입니다."
```

#### 3. 제조업
**대상 직무**: 데이터분석, 회계/재무, 생산관리, 품질QA  
**핵심 이해관계자**:
- 생산 현장 (제조 특화)
- 품질/자재팀 (제조 특화)
- 협력사/구매 (제조 특화)

**P3 추가 맥락**:
```
생산관리 × 제조:
"제조 현장과의 즉시 대응이 핵심이며, 
자재/품질/협력사 간 조율이 일일 운영의 중심입니다."
```

#### 4. 바이오/헬스케어
**대상 직무**: 품질QA, 데이터분석  
**핵심 이해관계자**:
- 임상/의료팀 (바이오 특화)
- 규제/허가팀 (바이오 특화)
- R&D (바이오 특화)

#### 5. 유통/커머스
**대상 직무**: 데이터분석, PMM, 퍼포먼스마케팅  
**핵심 이해관계자**:
- 판매채널 (유통 특화)
- 물류팀 (유통 특화)
- 고객/사용자 (공통)

---

## 12. Target Output Examples

### Example 1: 데이터분석 × 금융

**현재 (P2.5)**:
```
"데이터분석에서는 현업/기획/마케팅팀과 맞닭아 
분석 요청 배경을 이해하고, 분석 결과를 실무 액션으로 
연결하는 부분이 중요합니다. 
지원서에서는 이 상대에게 무엇을 설명했고, 
어떤 기준을 맞췄는지 드러내면 더 설득력 있게 보완됩니다."
```

**P3 추가 후 (목표)**:
```
"데이터분석에서는 현업/기획/마케팅팀과 맞닭아 
분석 요청 배경을 이해하고, 분석 결과를 실무 액션으로 
연결하는 부분이 중요합니다.

다만 금융 환경에서는 리스크팀, 준법팀의 분석 요청이 
높은 기준의 정확성을 요구합니다. 
따라서 금융 데이터 분석 경험이 있다면 
결과의 신뢰성 검증과 규제 기준 이해 경험을 
함께 설명하면 더욱 설득력 있습니다."
```

**금지할 표현**:
- ❌ "금융을 이해하고 있습니다" (Axis2 영역)
- ❌ "정확도가 매우 중요합니다" (과장)
- ❌ "리스크팀과의 직접 협업 경험" (검증 안 된 주장)

---

### Example 2: 회계/재무 × 제조

**현재 (P2.5)**:
```
"회계/재무에서는 내부 부서와 맞닭아 
거래 기록, 증빙 요청, 예산 집행 내역, 
정산 정보를 정확히 맞추는 부분이 중요합니다.
지원서에서는 이 상대에게 무엇을 설명했고, 
어떤 기준을 맞췄는지 드러내면 더 설득력 있게 보완됩니다."
```

**P3 추가 후 (목표)**:
```
"회계/재무에서는 내부 부서와 맞닭아 
거래 기록, 증빙 요청, 예산 집행 내역, 
정산 정보를 정확히 맞추는 부분이 중요합니다.

다만 제조 환경에서는 원가 관리, 자재비, 
재정 상태의 정확성이 생산 일정과 직결되며, 
외부 감사자(세무/감사)와의 기준 맞춤도 
중요한 소통 지점입니다.
따라서 원가 계산, 자재 정산, 외부 감사 대응 경험이 
함께 있다면 더욱 적합한 경험으로 평가됩니다."
```

---

### Example 3: 생산관리 × 제조

**현재 (P2.5)**:
```
"생산관리에서는 생산 현장과 맞닭아 
생산 계획, 자재 공급, 공정 흐름, 
품질 문제를 즉시 대응하는 부분이 중요합니다.
지원서에서는 이 상대의 요구나 반응을 어떻게 파악했고, 
어떤 방식으로 대응했는지 구체화하면 좋습니다."
```

**P3 추가 후 (목표)**:
```
"생산관리에서는 생산 현장과 맞닭아 
생산 계획, 자재 공급, 공정 흐름, 
품질 문제를 즉시 대응하는 부분이 중요합니다.

제조 현장에서 이러한 조율은 일일 운영의 핵심이며, 
품질팀, 자재팀, 협력사와의 병렬 소통도 동시에 
진행됩니다. 따라서 한 번의 결정 이후 
여러 부서의 반응을 한 번에 대응해본 경험이 
있다면 현장감 있는 답변이 가능합니다.

인턴/프로젝트에서 생산 현장 방문, 
자재 관리 개선안 참여, 품질 이슈 대응 협력 같은 
실제 경험이 있다면 구체적으로 설명해주시기 바랍니다."
```

---

### Example 4: 품질QA × 바이오/헬스케어

**P3 추가 후 (목표)**:
```
"품질보증/QA에서는 생산/개발팀과 맞닭아 
품질 기준 정의, 검증 방법, 불량 기준, 
승인 프로세스를 맞추는 부분이 중요합니다.

다만 바이오/헬스케어 산업은 임상 데이터, 
의료 규정, GMP(의약품 제조 관리 기준) 등으로 
품질 기준의 엄격도가 제조업보다 높습니다.
또한 임상팀, 규제팀, R&D팀과의 
품질 검증 기준 조율이 추가로 필요합니다.

따라서 의약품/의료기기 규정 이해, 
GMP 프로세스 관찰, 또는 임상 데이터 검증 
같은 경험이 있다면, 높은 기준의 
품질 문화 이해를 보여줄 수 있습니다."
```

---

### Example 5: PMM × IT/SaaS

**현재 (P2.5)**:
```
"상품·프로덕트마케팅에서는 고객/사용자와 맞닭아 
고객 반응과 시장 피드백을 바탕으로 
제품의 가치 제안과 메시지 방향을 
점검하는 부분이 중요합니다.

지원서에서는 이 상대의 요구나 반응을 어떻게 파악했고, 
어떤 방식으로 대응했는지 구체화하면 좋습니다."
```

**P3 추가 후 (목표)**:
```
"상품·프로덕트마케팅에서는 고객/사용자와 맞닭아 
고객 반응과 시장 피드백을 바탕으로 
제품의 가치 제안과 메시지 방향을 
점검하는 부분이 중요합니다.

IT/SaaS 환경에서는 개발팀의 기술 로드맵, 
제품팀의 사용자 경험 데이터, 
영업팀의 현장 고객 반응이 
모두 포지셔닝 결정에 영향을 미칩니다.
따라서 기술 제품의 강점을 
정확히 이해하고 설명할 수 있는 능력이 
PMM으로서 핵심 경쟁력입니다.

기술 스타트업, SaaS 제품팀 프로젝트, 
또는 개발자와의 직접 협업 경험이 있다면, 
기술 이해도와 시장 연결 능력을 
동시에 보여줄 수 있습니다."
```

**금지할 표현**:
- ❌ "기술을 깊이 있게 이해합니다" (과장)
- ❌ "개발팀의 요구를 완벽히 충족" (단정)
- ❌ "강한 기술 배경" (Axis3의 영역)

---

## 13. Risk Assessment

### Risk 1: Axis2 vs Axis4 경계 붕괴
**Symptom**: 
```
❌ "금융 산업을 이해하고 있습니다" (Axis4에 산업 이해 포함)
```
**Mitigation**:
- Axis4 설명 템플릿에 "who" 강조, 산업 이해는 명시 제외
- Code review: 산업 이해도 표현 grep

### Risk 2: 산업 registry 복잡도 폭발
**Symptom**: 
```
25개 직무 × 15개 산업 = 375개 조합
모두 Axis4 context 정의 필요?
```
**Mitigation**:
- P3-1 Batch: 5개 산업, 8개 직무만 (40개 조합)
- P3-2부터 확장
- Job-only fallback (산업 context 없으면 generic)

### Risk 3: 경험 선택값 해석 부족
**Symptom**:
```
"인턴 경험이 생산 현장 이해"라는 가정이 과함
```
**Mitigation**:
- 경험 해석은 "가능성 신호", 단정 금지
- "...경험이 있다면" (conditional) 톤 사용

### Risk 4: 구현 복잡도 증가
**Symptom**:
```
buildAxis4StakeholderRoleHint()가 이미 복잡한데
산업 context 추가로 더 복잡
```
**Mitigation**:
- Helper function 분리
  - buildAxis4RoleHintWithIndustryContext()
  - buildAxis4IndustryContextModifier()

---

## 14. Recommended Implementation Sequence

### Phase 1: Foundation (P3-1a: 1-2주)

**Target**:
- industryArchetypeRegistry.js 확장 설계
- 5개 산업에 대한 axis4Context 정의

**Deliverables**:
1. INDUSTRY_ARCHETYPE_REGISTRY 확장 PR
2. 5개 산업별 axis4Context 필드 추가
3. Fallback 메커니즘 구현

**Files**:
- `src/data/transitionLite/industryArchetypeRegistry.js`

**Risk**: 낮음 (데이터 추가만)

---

### Phase 2: Read Path (P3-1b: 1주)

**Target**:
- buildNewgradAxisPack.js에서 산업 context 전달
- evaluateInteractionFit() → buildAxis4EvidenceSummary()

**Deliverables**:
1. getAxis4IndustryContext() helper function
2. evaluateInteractionFit()에서 industryAxis4Context 추가
3. axisExplanationRegistry로 신호 전달

**Files**:
- `src/lib/analysis/buildNewgradAxisPack.js`
- `src/data/transitionLite/axisExplanationRegistry.js` (import만)

**Risk**: 중간 (signal 구조 변경)

---

### Phase 3: Rendering Logic (P3-1c: 1-2주)

**Target**:
- buildAxis4StakeholderRoleHint()에서 산업 context 적용
- 경험 선택값 해석 명시

**Deliverables**:
1. buildAxis4StakeholderRoleHint() 개선
   - industryAxis4Context 기반 문구 생성
   - 경험 신호 명시적 해석
2. Helper functions
   - buildAxis4IndustryContextSentence()
   - buildAxis4ExperienceSignalSentence()
3. Template strings 정의

**Files**:
- `src/data/transitionLite/axisExplanationRegistry.js`

**Risk**: 높음 (복잡한 로직)

---

### Phase 4: QA & Polish (P3-1d: 1주)

**Target**:
- 5개 케이스 smoke test
- 금지 표현 검증
- 문법 점검

**Deliverables**:
1. 5개 케이스 한글 정확도 QA
2. 과장 표현 제거 (grep: "경험이 있습니다", "직접 소통" 등)
3. Axis2-Axis4 경계 검증

**Files**:
- 없음 (코드 수정은 P3-1c에서)

**Risk**: 낮음 (QA만)

---

### ⏭️ P3-2 (이후)

**Target**: 추가 산업 & 직무 확장  
**Scope**: 10개 산업, 모든 직무

---

## 15. Files Reviewed

### Core Analysis
```
✅ src/lib/analysis/buildNewgradAxisPack.js (4287줄)
   - evaluateInteractionFit(): Axis4 신호 계산
   - input.targetIndustryId/Label 확인
   
✅ src/data/transitionLite/axisExplanationRegistry.js (3274줄)
   - buildAxis4StakeholderRoleHint()
   - buildAxis4RoleHintClosing()
   - buildAxis4EvidenceSummary()
   - buildNewgradInteractionFitPositives()
   
✅ src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js (306줄)
   - 6개 직무 stakeholderRoles 정의 확인
```

### Data Registries
```
✅ src/data/transitionLite/industryArchetypeRegistry.js
   - 산업 archetype 정의
   - Axis4 확장 가능 여부 확인
   
✅ src/data/industry/registry/ (구조만 확인)
   - 기존 산업 데이터 구조
   - Axis2 사용 방식
```

### Evidence Collection
```
✅ src/data/transitionLite/newgradAxis4InteractionEvidenceUtils.js (203줄)
   - collectNewgradAxis4InteractionEvidence()
   - computeAxis4BaseInteractionSignals()
   - 경험 선택값이 어떻게 신호로 변환되는지 확인
```

### Input
```
✅ src/components/input/categoryOptions.js (365줄)
   - 직무 카테고리 (경험 선택과 무관)
   - 경험 타입은 별도로 정의 (미확인)
```

---

## Summary: Key Findings

1. **Axis4에 산업 정보 전달 안 됨**: ✅ 확인
   - input.targetIndustryId/Label 있음
   - evaluateInteractionFit() → buildAxis4EvidenceSummary()로 전달 안 됨
   - 최소 2줄 추가로 해결 가능

2. **경험 선택값 이미 포함**: ✅ 확인
   - baseSignals에 포함
   - P3에서는 명시적 해석만 추가

3. **Axis2 vs Axis4 책임 분리 명확**: ✅ 확인
   - Axis2: 산업 이해도
   - Axis4: 산업 내 이해관계자 소통

4. **산업 registry 구조 적합**: ✅ 확인
   - industryArchetypeRegistry.js 확장 가능
   - Fallback 메커니즘 구현 가능

5. **P3-1 Batch 1 규모 적절**: ✅ 확인
   - 5개 산업 (금융, IT/SaaS, 제조, 바이오, 유통)
   - 8개 직무 (6개 P2 PARTIAL + PMM, 퍼포먼스)
   - 40개 조합 관리 가능

---

## Next Immediate Actions

1. ✅ **Design Document Complete** (this file)
2. → **P3-1a**: industryArchetypeRegistry.js 확장 PR
3. → **P3-1b**: Read path 연결 PR
4. → **P3-1c**: buildAxis4StakeholderRoleHint() 개선 PR
5. → **P3-1d**: 5케이스 QA 및 최종 점검

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2026-05-04  
**Next Review**: After P3-1a completion
