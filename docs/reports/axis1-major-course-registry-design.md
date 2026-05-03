# Axis1 전공별 주요 과목/개념 Registry 설계

**작성일:** 2026-05-03  
**대상 브랜치:** qa/newgrad-axis1-major-course-registry-design  
**목표:** 경제학→PMM의 목표 산출물 수준을 기준으로, 모든 주요 전공별로 체계화된 과목/개념/직무 연결 언어 구조 설계

---

## 1. 현재 경제학→PMM 구현 구조 요약

### 1.1 실제 구현 흐름

**파일 1: newgradJobSpecificAxis1ActionsRegistry.js (라인 211-232)**
```javascript
PRODUCT_MARKETING_PMM: {
  foundationActions: ["시장 구조와 경쟁 환경 분석", "고객 세그먼트 파악 및 니즈 이해", ...],
  missingActions: [관련 경험 질문 3개],
  nextEvidenceActions: [근거 장면 5개],
  preferJobSpecificText: true,  // ← 조건부 문구 활성화 신호
}
```

**파일 2: axisExplanationRegistry.js (라인 2310-2340)**
```javascript
const majorKey = String(input?.majorKey || "").trim();
const isEconomicsToPMM = majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM");

if (isEconomicsToPMM) {
  scoreReason = `${majorLabel}은 시장을 숫자와 구조로 읽는 전공입니다...`;
  liftOrLimit = `어필할 수 있는 전공 과목은 미시경제학, 산업조직론...`;
}
```

### 1.2 출력 구조 분석

| 구성 | 소스 | 내용 |
|------|------|------|
| lead | 고정 | "현재 입력한 전공만 보면 {{job}} 직무와의 연결은 {{band}} 편입니다" |
| scoreReason | 조건부 | **Para 1:** 전공 정의 + 개념 해석 + 직무 연결<br/>**Para 2:** 직무 정의<br/>**Para 3:** 자기소개 + 경력 연결 문장 |
| liftOrLimit | 조건부 | **Sentence 1:** 어떤 전공 과목을 어필할 수 있는지<br/>**Sentence 2:** 근거 장면은 무엇인지 |

### 1.3 목표 달성 요소

**7가지 필수 요소 달성:**
1. ✅ 자기소개 문장 (scoreReason Para 3 1절)
2. ✅ 경력 연결 (scoreReason Para 3 2절)
3. ✅ 전공-직무 연결 문장 (scoreReason Para 1)
4. ✅ 직무 정의 (scoreReason Para 2)
5. ✅ 어필 과목 (liftOrLimit Sentence 1)
6. ✅ 근거 장면 (liftOrLimit Sentence 2)
7. ✅ 면접 지침 (liftOrLimit 종합)

---

## 2. 전공별 주요 과목 Registry가 필요한 이유

### 2.1 현재 문제

**경제학→PMM만 해결:**
```
어떤 전공이 PMM에 적합한가?
→ 경제학, 마케팅, 통계, 심리학 등 여러 전공이 가능
→ 각 전공별로 "왜 적합한가"의 근거가 다름
```

**하드코딩된 과목:**
```javascript
// 현재 방식: 경제학만 특화, 다른 전공은 제외
if (majorKey === "ECONOMICS" && targetJobId.includes("PRODUCT_MARKETING_PMM")) {
  liftOrLimit = "어필할 수 있는 전공 과목은 미시경제학, 산업조직론...";
}
// 다른 전공(경영학, 마케팅, 통계)은?
→ 맞춤형 과목이 없어서 일반 템플릿만 나감
```

### 2.2 필요성

1. **전공별 근거 차별화**
   - 경제학: "수요, 가격, 경쟁, 소비자 선택 분석" → 미시경제학, 산업조직론, 계량경제학
   - 마케팅: "세그먼트, 포지셔닝, 메시지 설계" → 마케팅전략, 소비자행동론, 디지털마케팅
   - 통계학: "시장 데이터, 성과 지표 분석" → 통계학, 데이터분석, A/B테스팅
   - 심리학: "소비자 의사결정, 행동 동인" → 소비자심리, 인지심리, 행동경제학

2. **직무별 특화 텍스트 재사용성**
   - 경제학 과목명: 다른 직무(Finance, Data Analysis 등)에도 재사용 가능
   - 경영학 과목명: 다른 직무(Strategy, Operations 등)에도 재사용 가능

3. **오염 방지**
   - 경제학 특화 문구 ("수요, 가격 분석 훈련") → 경제학만 출력
   - 마케팅 특화 문구 ("고객 세그먼트, 포지셔닝 설계") → 마케팅만 출력
   - 통계 특화 문구 ("시장 데이터 해석") → 통계만 출력

---

## 3. 추천 파일 구조

### 3.1 신규 파일 안내

**파일 1: src/data/transitionLite/newgradMajorCourseRegistry.js**
- 목표: 전공별 "과목 예시", "핵심 개념", "학습 기반" 저장
- 역할: 어떤 전공이 어떤 과목을 어필할 수 있는지 정의

**파일 2: src/data/transitionLite/newgradMajorBridgeRegistry.js**
- 목표: 전공별 "직무별 특화 bridge 문장", "전공 정의", "금지 문구" 저장
- 역할: 조건부 분기 시 사용할 전공-직무별 customized text template

### 3.2 기존 파일 확장

**axisExplanationRegistry.js**
- 현재: isEconomicsToPMM만 조건 검사
- 확장: 모든 (majorKey, targetJobId) 조합에 대해 조건 검사
- 패턴: `if (condition(majorKey, targetJobId, jobSpecificActions)) { use specialized bridge }`

---

## 4. 추천 필드 구조

### 4.1 Major Course Registry (per major)

```javascript
ECONOMICS: {
  majorKey: "ECONOMICS",
  majorLabel: "경제학",
  
  // 어떤 과목을 어필할 수 있는가?
  courseExamples: {
    // 직무별 과목
    PRODUCT_MARKETING_PMM: [
      "미시경제학",
      "산업조직론",
      "계량경제학/통계학",
      "행동경제학",
      "국제경제학",
    ],
    JOB_FINANCE_FINANCIAL_ANALYST: [
      "거시경제학",
      "금융론",
      "투자론",
      "기업재무",
      "계량경제학",
    ],
    JOB_DATA_DATA_ANALYST: [
      "계량경제학",
      "통계학",
      "행동경제학",
      "데이터분석",
      "경제통계",
    ],
  },
  
  // 전공의 핵심 개념 (모든 직무에 공통)
  coreConcepts: [
    "시장 메커니즘",
    "수요와 공급",
    "소비자 선택",
    "경쟁 전략",
    "비용-편익 분석",
  ],
  
  // 직무별 bridge 개념 (직무별 특화)
  jobBridgeConcepts: {
    PRODUCT_MARKETING_PMM: [
      "수요 예측",
      "가격 결정",
      "경쟁 분석",
      "시장 세그먼테이션",
      "고객 선택 동인",
    ],
    JOB_FINANCE_FINANCIAL_ANALYST: [
      "자본 비용",
      "현금 흐름 할인",
      "위험 평가",
      "수익성 분석",
    ],
  },
  
  // 직무별 강점/약점
  strongFitJobGroups: [
    "PRODUCT_MARKETING_PMM",
    "JOB_FINANCE_FINANCIAL_ANALYST",
    "JOB_DATA_DATA_ANALYST",
    "JOB_STRATEGY_BUSINESS_STRATEGY",
  ],
  
  // 금지 문구 (다른 전공에 오염되면 안 됨)
  cautionPhrases: [
    "수요, 가격 분석 훈련",
    "경제학 이론",
    "시장의 기본 원리",
  ],
}
```

### 4.2 Major Bridge Registry (per major-job pair)

```javascript
{
  majorKey: "ECONOMICS",
  targetJobId: "PRODUCT_MARKETING_PMM",
  
  // scoreReason Para 1: 전공 정의 + 직무 연결
  majorInterpretation: {
    majorDefinition: "경제학은 시장을 숫자와 구조로 읽는 전공입니다",
    coreConcepts: "수요, 가격, 경쟁, 소비자 선택을 분석하는 훈련",
    jobRelevance: "시장 기회와 고객 세그먼트, 가격/포지션 판단을 이해하는 데 일부 연결됩니다",
  },
  
  // scoreReason Para 2: 직무 정의 (이미 roleProfile에 있음, 참조만)
  jobDefinition: "제품을 시장·고객·경쟁 상황에 맞게 포지셔닝...",
  
  // scoreReason Para 3: 자기소개 + 경력 연결
  careerBridge: {
    selfIntro: "경제학 전공을 통해 수요, 가격, 경쟁, 소비자 선택을 구조적으로 분석하는 훈련을 해왔고",
    careerConnection: "이를 바탕으로 제품이 어떤 고객에게, 어떤 메시지와 가격/포지션으로 전달되어야 하는지 판단하는 {{targetJobLabel}} 직무에 관심을 갖게 되었다고 연결할 수 있습니다",
  },
  
  // liftOrLimit Sentence 1: 어떤 과목을 어필하는가
  appealingCourses: [
    "미시경제학",
    "산업조직론",
    "계량경제학/통계학",
    "행동경제학",
    "국제경제학",
  ],
  
  // liftOrLimit Sentence 2: 근거 장면 (jobSpecificActions.nextEvidenceActions 참조)
  // → 이미 registry에 있음, 별도 정의 불필요
}
```

---

## 5. 우선순위 전공군

### Priority 1 (즉시 적용 가능)
- [x] **ECONOMICS** (경제학) - ✅ 완료 (3940b8d)
- [ ] **BUSINESS_MANAGEMENT** (경영학) - 스택: Business Strategy, Operations, HR
- [ ] **STATISTICS** (통계학) - 스택: Data Analysis, Finance, Product Analytics

### Priority 2 (중기)
- [ ] **COMPUTER_SCIENCE** (컴퓨터공학) - 스택: Backend, Frontend, Data, Product
- [ ] **MARKETING** (마케팅) - 스택: PMM, Growth, Brand
- [ ] **INDUSTRIAL_ENGINEERING** (산업공학) - 스택: Operations, Process, Supply Chain

### Priority 3 (확장)
- [ ] **PSYCHOLOGY** (심리학) - 스택: PMM (소비자 행동), HR (조직심리)
- [ ] **FINANCE** (금융학) - 스택: Finance, Strategy
- [ ] **ENGINEERING_OTHER** (기타 공학) - 직무별로 개별 판정

---

## 6. 우선순위 직무군

### PMM 관련 (Priority 1)
```
PRODUCT_MARKETING_PMM
├─ 경제학 [완료]
├─ 경영학 [예정]
├─ 마케팅 [예정]
├─ 통계학 [예정]
└─ 심리학 [예정]
```

### Finance 관련 (Priority 2)
```
JOB_FINANCE_FINANCIAL_ANALYST
├─ 경제학 [예정]
├─ 경영학 [예정]
├─ 통계학 [예정]
└─ 금융학 [예정]
```

### Data/Analytics (Priority 2)
```
JOB_DATA_DATA_ANALYST
├─ 통계학 [예정]
├─ 컴퓨터공학 [예정]
├─ 경제학 [예정]
└─ 경영학 [예정]
```

---

## 7. 경제학 샘플 Registry 초안

### 7.1 Major Course Registry

```javascript
ECONOMICS: Object.freeze({
  majorKey: "ECONOMICS",
  majorLabel: "경제학",
  
  // 전공별 과목 예시 (직무별 맞춤)
  courseExamples: {
    PRODUCT_MARKETING_PMM: [
      "미시경제학",
      "산업조직론",
      "계량경제학/통계학",
      "행동경제학",
      "국제경제학",
    ],
    JOB_FINANCE_FINANCIAL_ANALYST: [
      "거시경제학",
      "금융론",
      "투자론",
      "기업재무",
      "계량경제학",
    ],
    JOB_DATA_DATA_ANALYST: [
      "계량경제학",
      "통계학",
      "행동경제학",
      "데이터분석",
      "경제통계",
    ],
    JOB_STRATEGY_BUSINESS_STRATEGY: [
      "거시경제학",
      "산업조직론",
      "경제정책론",
      "국제경제학",
      "행동경제학",
    ],
  },
  
  // 핵심 개념 (모든 직무 공통)
  coreConcepts: [
    "시장 메커니즘",
    "수요와 공급",
    "소비자 선택",
    "경쟁 전략",
    "효율성과 최적화",
  ],
  
  // 직무별 강점 (어떤 직무와 가장 잘 맞는가)
  strongFitJobGroups: [
    "PRODUCT_MARKETING_PMM",
    "JOB_FINANCE_FINANCIAL_ANALYST",
    "JOB_DATA_DATA_ANALYST",
    "JOB_STRATEGY_BUSINESS_STRATEGY",
  ],
  
  // 조심해야 할 문구 (다른 전공에 오염되면 안 됨)
  cautionPhrases: [
    "수요, 가격 분석 훈련",
    "경제학 이론 기반",
    "시장의 기본 원리",
    "효율성 분석",
  ],
}),
```

### 7.2 Major Bridge Registry

```javascript
{
  majorKey: "ECONOMICS",
  targetJobId: "PRODUCT_MARKETING_PMM",
  bridgeSentenceTemplate: {
    majorDefinition: "경제학은 시장을 숫자와 구조로 읽는 전공입니다",
    majorConcepts: "수요, 가격, 경쟁, 소비자 선택을 분석하는 훈련",
    jobRelevanceClause: "시장 기회와 고객 세그먼트, 가격/포지션 판단을 이해하는 데 일부 연결됩니다",
    careerBridge: "따라서 경제학 전공을 통해 수요, 가격, 경쟁, 소비자 선택을 구조적으로 분석하는 훈련을 해왔고, 이를 바탕으로 제품이 어떤 고객에게, 어떤 메시지와 가격/포지션으로 전달되어야 하는지 판단하는 {{targetJobLabel}} 직무에 관심을 갖게 되었다고 연결할 수 있습니다",
  },
  appealingCourses: [
    "미시경제학",
    "산업조직론",
    "계량경제학/통계학",
    "행동경제학",
    "국제경제학",
  ],
},
```

---

## 8. 경영학/통계학/컴공/산업공학 샘플 Registry 초안

### 8.1 경영학 (BUSINESS_MANAGEMENT)

**Major Course Registry:**
```javascript
BUSINESS_MANAGEMENT: {
  majorLabel: "경영학",
  courseExamples: {
    PRODUCT_MARKETING_PMM: [
      "마케팅 전략",
      "소비자행동론",
      "제품관리",
      "마켓리서치",
      "디지털마케팅",
    ],
    JOB_STRATEGY_BUSINESS_STRATEGY: [
      "경영전략",
      "조직관리",
      "재무관리",
      "운영관리",
      "경쟁전략",
    ],
    JOB_OPERATIONS_OPERATIONS_MANAGER: [
      "운영관리",
      "공급망관리",
      "품질관리",
      "프로젝트관리",
      "프로세스최적화",
    ],
  },
  coreConcepts: [
    "가치 창출",
    "리소스 배분",
    "고객 만족",
    "경쟁 우위",
    "조직 효율성",
  ],
  strongFitJobGroups: [
    "PRODUCT_MARKETING_PMM",
    "JOB_STRATEGY_BUSINESS_STRATEGY",
    "JOB_OPERATIONS_OPERATIONS_MANAGER",
    "JOB_RECRUITING_RECRUITING",
  ],
}
```

**Major Bridge Registry (PMM):**
```javascript
{
  majorKey: "BUSINESS_MANAGEMENT",
  targetJobId: "PRODUCT_MARKETING_PMM",
  bridgeSentenceTemplate: {
    majorDefinition: "경영학은 고객 가치와 시장 기회를 전략적으로 읽는 전공입니다",
    majorConcepts: "고객 세그먼트, 포지셔닝, 가치 제시, 브랜드 전략을 분석하는 훈련",
    jobRelevanceClause: "고객 세그먼트 분석, 메시지 설계, 포지셔닝 수립과 직결됩니다",
    careerBridge: "따라서 경영학 전공을 통해 고객 관점에서 가치를 설계하는 훈련을 해왔고, 이를 바탕으로 제품의 포지셔닝과 메시지 전략을 고객 세그먼트와 시장 상황에 맞게 수립하는 {{targetJobLabel}} 직무에 관심을 갖게 되었다고 연결할 수 있습니다",
  },
  appealingCourses: [
    "마케팅 전략",
    "소비자행동론",
    "제품관리",
    "브랜드 관리",
    "마켓리서치",
  ],
}
```

### 8.2 통계학 (STATISTICS)

**Major Course Registry:**
```javascript
STATISTICS: {
  majorLabel: "통계학",
  courseExamples: {
    PRODUCT_MARKETING_PMM: [
      "통계학",
      "데이터분석",
      "A/B테스팅",
      "시장조사방법론",
      "인과추론",
    ],
    JOB_DATA_DATA_ANALYST: [
      "통계학",
      "데이터분석",
      "머신러닝",
      "시계열분석",
      "인과추론",
    ],
    JOB_FINANCE_FINANCIAL_ANALYST: [
      "통계학",
      "시계열분석",
      "위험관리",
      "포트폴리오분석",
      "계량금융",
    ],
  },
  coreConcepts: [
    "데이터 기반 의사결정",
    "불확실성 정량화",
    "인과관계 파악",
    "성과 측정",
    "패턴 인식",
  ],
  strongFitJobGroups: [
    "JOB_DATA_DATA_ANALYST",
    "PRODUCT_MARKETING_PMM",
    "JOB_FINANCE_FINANCIAL_ANALYST",
    "JOB_PRODUCT_MANAGER",
  ],
}
```

**Major Bridge Registry (PMM):**
```javascript
{
  majorKey: "STATISTICS",
  targetJobId: "PRODUCT_MARKETING_PMM",
  bridgeSentenceTemplate: {
    majorDefinition: "통계학은 데이터로 시장과 고객을 읽는 전공입니다",
    majorConcepts: "시장 조사, 데이터 분석, A/B테스트, 성과 측정을 통한 의사결정",
    jobRelevanceClause: "시장 데이터 해석, 포지셔닝 검증, 마케팅 성과 분석과 직결됩니다",
    careerBridge: "따라서 통계학 전공을 통해 데이터로 시장 현실을 증명하는 훈련을 해왔고, 이를 바탕으로 설계한 포지셔닝과 메시지가 실제 고객 반응과 시장 성과로 입증되는 {{targetJobLabel}} 직무에 관심을 갖게 되었다고 연결할 수 있습니다",
  },
  appealingCourses: [
    "통계학",
    "데이터분석",
    "A/B테스팅",
    "시장조사방법론",
    "인과추론",
  ],
}
```

### 8.3 컴퓨터공학 (COMPUTER_SCIENCE)

**Major Course Registry:**
```javascript
COMPUTER_SCIENCE: {
  majorLabel: "컴퓨터공학",
  courseExamples: {
    PRODUCT_MARKETING_PMM: [
      "데이터 구조/알고리즘",
      "데이터베이스",
      "데이터분석",
      "웹 개발",
      "사용자인터페이스",
    ],
    JOB_BACKEND_DEVELOPMENT: [
      "데이터 구조/알고리즘",
      "데이터베이스",
      "API 설계",
      "시스템 아키텍처",
      "성능 최적화",
    ],
    JOB_DATA_DATA_ANALYST: [
      "데이터 구조/알고리즘",
      "데이터베이스",
      "데이터분석",
      "머신러닝",
      "빅데이터",
    ],
  },
  coreConcepts: [
    "문제 해결 능력",
    "체계적 사고",
    "효율성 분석",
    "기술 구현",
    "데이터 처리",
  ],
  strongFitJobGroups: [
    "JOB_BACKEND_DEVELOPMENT",
    "JOB_FRONTEND_DEVELOPMENT",
    "JOB_DATA_DATA_ANALYST",
    "JOB_PRODUCT_MANAGER",
  ],
}
```

**Major Bridge Registry (PMM - 약간 약한 연결):**
```javascript
{
  majorKey: "COMPUTER_SCIENCE",
  targetJobId: "PRODUCT_MARKETING_PMM",
  bridgeSentenceTemplate: {
    majorDefinition: "컴퓨터공학은 기술로 문제를 해결하고 데이터를 다루는 전공입니다",
    majorConcepts: "알고리즘적 사고, 데이터 처리, 기술 구현, 성능 분석",
    jobRelevanceClause: "시장 데이터 분석, 고객 행동 추적, 제품 성과 측정과 일부 연결됩니다",
    careerBridge: "따라서 컴퓨터공학 전공을 통해 데이터를 체계적으로 다루고 기술로 문제를 해결하는 훈련을 해왔고, 이를 바탕으로 시장 데이터 기반의 포지셔닝과 메시지 검증을 통해 고객 중심의 제품 전략을 수립하는 {{targetJobLabel}} 직무에 관심을 갖게 되었다고 연결할 수 있습니다",
  },
  appealingCourses: [
    "데이터 구조/알고리즘",
    "데이터베이스",
    "데이터분석",
    "웹 개발",
    "머신러닝",
  ],
  confidenceLevel: "WEAK",  // ← 약한 연결 표시
}
```

### 8.4 산업공학 (INDUSTRIAL_ENGINEERING)

**Major Course Registry:**
```javascript
INDUSTRIAL_ENGINEERING: {
  majorLabel: "산업공학",
  courseExamples: {
    PRODUCT_MARKETING_PMM: [
      "시스템공학",
      "의사결정론",
      "품질관리",
      "프로세스최적화",
      "데이터분석",
    ],
    JOB_OPERATIONS_OPERATIONS_MANAGER: [
      "운영관리",
      "공급망관리",
      "품질관리",
      "프로세스최적화",
      "프로젝트관리",
    ],
    JOB_STRATEGY_BUSINESS_STRATEGY: [
      "의사결정론",
      "비용분석",
      "시스템공학",
      "성과측정",
      "리스크관리",
    ],
  },
  coreConcepts: [
    "프로세스 최적화",
    "효율성 분석",
    "데이터 기반 의사결정",
    "리스크 관리",
    "시스템 사고",
  ],
  strongFitJobGroups: [
    "JOB_OPERATIONS_OPERATIONS_MANAGER",
    "JOB_STRATEGY_BUSINESS_STRATEGY",
    "PRODUCT_MARKETING_PMM",
    "JOB_DATA_DATA_ANALYST",
  ],
}
```

---

## 9. 이후 P3-B 패치 순서 (구현 로드맵)

### Phase 1: 설계 검증 (현재)
- [x] 현재 경제학→PMM 구현 분석
- [x] Registry 구조 설계
- [x] 우선순위 전공/직무 정의
- [x] 샘플 초안 작성
- [ ] 사용자 피드백 수집

### Phase 2: 핵심 전공 구현 (1주)
```
1. newgradMajorCourseRegistry.js 생성 (경제학, 경영학, 통계학)
2. newgradMajorBridgeRegistry.js 생성 (경제학→PMM, 경영학→PMM, 통계→PMM)
3. axisExplanationRegistry.js 수정 (조건 확대: 3 major × 1 job)
4. 테스트/검증
5. PR 생성 (Axis1 P3-B Phase 1)
```

### Phase 3: 직무 확대 (2주)
```
1. Finance, Data, Strategy 직무 추가
2. 각 직무별 3-4 전공 bridge 추가
3. 테스트/검증
4. PR 생성 (Axis1 P3-B Phase 2)
```

### Phase 4: 추가 전공 (2주)
```
1. 마케팅, 심리학, 컴공, 산업공학 추가
2. 다양한 직무 조합 bridge 추가
3. 정적 분석 + 런타임 테스트
4. PR 생성 (Axis1 P3-B Phase 3)
```

### Phase 5: 마무리 (1주)
```
1. 모든 금지 문구 최종 검사
2. 전공별 과목명 정확성 검증
3. 한글 인코딩 postcheck
4. 문서화 + release note
```

---

## 10. 리스크 분석

### 10.1 구조적 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| **하드코딩 증가** | 높음 | Registry화 → 자동 생성 가능 구조로 설계 |
| **전공별 과장 표현** | 높음 | 피드백 루프: 실제 학생 의견 수집 |
| **다른 전공 오염** | 높음 | majorKey 조건 검사 + 금지 문구 리스트 관리 |
| **UI 문장 길이 증가** | 중간 | scoreReason, liftOrLimit 각각 200자 제한 설정 |
| **실제 수강 과목 입력 여부 구분** | 중간 | "어필할 수 있는 과목 **예시**"로 명확히 표현 |

### 10.2 구현 리스크

| 리스크 | 원인 | 대응 |
|--------|------|------|
| **한글 인코딩 문제** | 파일 인코딩 실수 | 매 PR마다 postcheck 수행 |
| **Registry 필드 누락** | 설계 미흡 | Template 기반 생성 (boilerplate) |
| **조건 분기 순서 오류** | 우선순위 지정 오류 | 명확한 우선순위 문서화 (매우 중요) |
| **직무 ID 오타** | 수동 입력 오류 | 자동 생성 스크립트 + 정적 검사 |

### 10.3 품질 리스크

| 리스크 | 대응 |
|--------|------|
| 각 전공별로 실제 학생이 납득할 만한 과목명인가? | 초기에 한 전공씩 feedback loop |
| 과목이 실무 경험을 요구하는 것은 아닌가? | "예시"와 "근거 필수"의 경계 명확히 |
| 다른 전공에 오염되지 않았는가? | majorKey 조건 + unit test |
| 문장 길이가 UI에 맞는가? | 실제 mobile rendering 확인 |

---

## 11. 검증 방법

### 11.1 정적 분석 (현재 가능)
```javascript
// Registry validation
- 각 전공별 courseExamples 필드 존재 확인
- 각 직무별 bridge template 존재 확인
- 금지 문구가 실제로 scoreReason/liftOrLimit에 없는지 확인
- 한글 인코딩 postcheck
```

### 11.2 런타임 테스트 (npm run build 필요)
```javascript
// 실제 출력 확인
- 경영학→PMM: scoreReason에 "경영학은" 있고, "경제학은" 없는가?
- 통계학→PMM: liftOrLimit에 "통계학" 과목이 있고, "경제학" 과목은 없는가?
- 경제학→Finance: scoreReason에 금융 관련 내용이 있는가?
```

### 11.3 UI 렌더링 확인
```
- scoreReason \n\n 구분선 정상 렌더링
- liftOrLimit 길이가 mobile에서도 깨지지 않는가
- 과목 이름이 마크다운으로 이상하게 표현되지 않는가
```

---

## 12. 한글 인코딩 Postcheck 계획

**파일:** docs/reports/axis1-major-course-registry-design.md  
**검사 항목:**
- ✅ 한글 일반 문자 (가-힣)
- ✅ 한글 특수문자 (/, &, (, ) 등)
- ✅ 마크다운 표 한글 정렬
- ✅ JSON 코드블록 한글 문자열

**실행:**
```bash
file docs/reports/axis1-major-course-registry-design.md
grep -P -n "[\x80-\xFF]" docs/reports/axis1-major-course-registry-design.md
```

---

## 13. 결론

### 현재 경제학→PMM의 성공

✅ **목표 달성:**
- 7가지 필수 요소 모두 포함
- 경영학→PMM 오염 방지
- 금지 문구 제거
- 재사용 가능한 구조

### 확장 설계의 핵심

**3가지 핵심 아이디어:**

1. **전공별 Registry 분리**
   - Major Course Registry: 과목/개념 저장
   - Major Bridge Registry: 직무별 특화 문구 저장
   - 조건부 분기 시 lookup하는 방식

2. **금지 문구 명시적 관리**
   - 각 전공별 `cautionPhrases` 리스트
   - Unit test로 다른 전공 오염 여부 확인

3. **점진적 확대**
   - Phase별로 전공/직무 추가
   - 초기에는 1개 전공×1개 직무부터 시작
   - 피드백 반영 후 확대

### 리스크 최소화

- ✅ 하드코딩 회피 (Registry 기반)
- ✅ 오염 방지 (majorKey 조건)
- ✅ 품질 검증 (정적+런타임 테스트)
- ✅ 인코딩 안정성 (postcheck)

---

**최종 판정:** 🟢 **설계 완료, 구현 준비 완료**

**다음 단계:** Phase 2 구현 (newgradMajorCourseRegistry.js, newgradMajorBridgeRegistry.js 생성)

**예상 시간:** 3-4주 (경제학, 경영학, 통계학 → PMM 구현)

