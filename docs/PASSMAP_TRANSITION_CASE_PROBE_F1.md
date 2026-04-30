# PASSMAP Transition Case Probe — Round F-1

> 목적: 3개 P0 전환 케이스에 대해 career mode 현재 출력을 기준으로 갭 분석 + F-layer 권장 UI 카피 초안 작성
> 규칙: 코드 변경 없음. 커밋 없음. 사용자 검토 후 F-2에서 구현.
> 날짜: 2026-04-30
> 사용 함수: `buildTransitionLiteResult` (src/lib/transitionLite/buildTransitionLiteResult.js:3108)

---

## 0. F-1 전제 확인

### career mode 현재 axis 설명 구조

```
axisPack.axes.{axisKey}.explanation = {
  available:   boolean,
  summary:     string,   // 현재 유일한 lead-like 텍스트
  positives:   string[], // 체크리스트형 긍정 신호
  gaps:        string[], // 체크리스트형 갭 신호
  reasons:     { code, label, direction }[],
  explanationWhyNotHigher: string | null,
  explanationBridgeContext: string | null,
}
```

**F-layer가 추가해야 할 슬롯**: `lead`, `scoreReason`, `liftOrLimit`
- 기존 `summary`는 band-distance 기반 generic 문장 → 소스 직무 특화 해석 부재
- 기존 `positives/gaps`는 구조적 signal 목록 → "이 배경이 구체적으로 왜 연결되는지" 설명 부재
- 신규 `lead/scoreReason/liftOrLimit`은 소스직무×타겟직무 쌍 기준으로 생성

### 공통 발견: classification 빈값

3개 probe 모두 `classification: {}` — `classifyTransition`이 이 job/industry 조합을 인식하지 못함.
→ F-layer pattern 트리거 조건을 `classifyTransition` 대신 `currentJobId + targetJobId` 직접 매칭 방식으로 설계해야 할 가능성 있음.

### 공통 발견: whyThisRead null

MARKETING→PRODUCT, FINANCE→DATA는 `whyThisRead.headline/subline/supportLine` 모두 null.
CS→SERVICE만 supportLine 하나 있음.
→ 이 구간도 F-layer에서 채우거나 별도 수정 필요 가능성. (F-2 범위 검토)

---

## 1. TR-PROBE-CS-TO-SERVICE-001: CS → 서비스기획

### 1-1. 입력

```json
{
  "currentJobId": "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
  "currentIndustryId": "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
  "targetJobId": "JOB_BUSINESS_SERVICE_PLANNING",
  "targetIndustryId": "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM"
}
```

### 1-2. 현재 출력 요약

| axis | band | display | 현재 summary 핵심 |
|---|---|---|---|
| jobStructure | very_low | 20 | "CS와 서비스기획은 하는 일이 많이 다름. 핵심 업무 신호 겹침 없음." |
| industryContext | high | 100 | "동일 산업, 동일 세부업종, 프로세스/맥락/규제/사이클 모두 일치." |
| responsibilityScope | low | 20 | "역할은 일부 닿지만 책임 범위가 크게 확장됨." |
| customerType | high | 100 | "동일 B2C, 구매방식/의사결정 구조 일치." |
| roleCharacter | mid_high | 55 | "운영 실행 중심이지만 부분적으로 닿음. 조율·기획 비중 증가가 갭." |

- specialDiagnostics: 0건 발화
- whyThisReadSupportLine: "이 이동은 완전 전환보다, 기존 경험을 인접 직무 언어로 다시 설명해야 하는 경계 이동에 가깝습니다."

### 1-3. 갭 분석

**jobStructure (very_low, 20점)**

현재 summary는 "CS와 서비스기획은 다르다"는 사실만 전달. CS 경험에서 서비스기획으로 재해석 가능한 브릿지(VOC 패턴 → 기능 개선 아이디어 → 요구사항 정리)를 전혀 언급하지 않음.
- 누락된 인사이트: 반복 VOC 분류 경험이 있다면 서비스기획 산출물(요구사항 정의서, 개선 기획)의 인풋 역할
- 누락된 인사이트: 단순 응대 vs 문제 원인 분석 + 개선 제안 경험의 차이가 점수 차이를 만드는 결정 인자

**responsibilityScope (low, 20점)**

"책임 범위 확장"이라는 구조 사실만 전달. CS에서 반복 이슈를 내부적으로 정리해 개선 방향을 제안한 경험(proto-PM 행동)이 scope 점수를 높이는 근거가 됨을 설명하지 않음.

**roleCharacter (mid_high, 55점)**

"운영 실행 중심 → 기획 설계 비중 증가"의 차이가 있지만 55점은 mid_high. 현재 summary가 "운영 실행 강점이 있어 중간 점수"라고만 함. CS 운영 경험이 서비스기획에서 어떤 방식으로 강점이 되는지(고객 맥락 이해, 사용자 고통 지점 식별) 맥락 없음.

### 1-4. 권장 F-layer UI 카피 초안

#### jobStructure

```
lead:
  "고객상담·CS 경험은 서비스기획의 핵심 인풋인 사용자 불편과 반복 패턴을 직접 접한 배경입니다.
   다만 서비스기획 직무는 그 불편을 어떤 기능·정책·화면 흐름으로 바꿨는지까지 산출물로 보여줘야 합니다."

scoreReason:
  "직무 구조 기준에서 CS와 서비스기획의 핵심 업무 신호(요구사항 정의, 화면 흐름 설계, 기능 우선순위 판단)는
   겹치지 않아 낮게 반영됐습니다. VOC를 수집하고 응대한 것과 그것을 기획 산출물로 전환한 것은
   채용 기준에서 다르게 읽힙니다."

liftOrLimit:
  "이 점수를 높이려면, CS에서 접한 반복 불편·문의를 기능 개선 아이디어, 요구사항 초안,
   또는 화면 개선 제안으로 정리해본 경험이 있어야 합니다. 산출물 이름(기획서, 요구사항 목록)
   이 없어도 '어떤 불편을 발견하고, 어떤 개선을 제안했는지' 흐름이 드러나면 점수 기준이 달라집니다."
```

#### responsibilityScope

```
lead:
  "CS 역할에서 단순 응대를 넘어 내부 이슈를 정리하거나 팀에 개선 방향을 제안한 경험이 있다면,
   서비스기획의 역할 범위 기준으로 가장 가까운 경험 신호가 됩니다."

scoreReason:
  "현재는 CS 업무의 응대·처리 중심 경험만 드러나, 서비스기획에서 요구되는 조율·방향 설정 역할과의
   거리가 커서 낮게 반영됐습니다."

liftOrLimit:
  "불편 처리 이력을 정리해 팀원·리더와 공유한 경험, 또는 반복 문의 원인을 분석해
   제품·정책 개선을 제안한 경험이 있다면 이 축의 설명 근거로 직접 활용 가능합니다."
```

#### roleCharacter

```
lead:
  "고객 응대 경험에서 쌓인 '사용자가 어디서 막히는지 빠르게 파악하는 감각'은
   서비스기획에서 사용자 관점을 유지하는 데 실질적인 강점이 됩니다."

scoreReason:
  "운영 실행 중심 직무 성격은 기획 설계 중심인 서비스기획과 일하는 방식이 다릅니다.
   다만 사용자 접점에서 문제를 직접 인식하는 경험은 기획 역할의 사용자 이해 부분과 이어집니다."

liftOrLimit:
  "기획 역할의 비중을 높이려면, 문제를 인식한 것에서 한 발 더 나아가
   '어떤 해결 방향이 더 나은지 판단하고 제안한' 경험이 지원서에 드러나야 합니다."
```

### 1-5. shouldMention 후보

| 신호 | 설명 |
|---|---|
| VOC 기반 개선 제안 경험 | 단순 응대가 아닌 패턴 분석 → 제안까지 이어진 경험 |
| 내부 이슈 정리/공유 경험 | 반복 문의 분류, 요약 보고 경험 |
| 화면/기능 피드백 전달 경험 | "이 화면이 고객이 자주 막히는 지점"을 개발/기획팀에 전달한 경험 |
| 서비스기획 산출물 접촉 경험 | 기능 명세, 화면 정의서, PRD 등 읽거나 작성해본 경험 |

---

## 2. TR-PROBE-FINANCE-TO-DATA-001: 회계/재무 → 데이터분석

### 2-1. 입력

```json
{
  "currentJobId": "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
  "currentIndustryId": "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
  "targetJobId": "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
  "targetIndustryId": "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD"
}
```

### 2-2. 현재 출력 요약

| axis | band | display | 현재 summary 핵심 |
|---|---|---|---|
| jobStructure | very_low | 20 | "회계와 데이터분석은 하는 일이 많이 다름." — BUT positives에 `mission_match`, `output_match` 있음 |
| industryContext | low | 29 | "금융(자금중개) → IT(데이터수집) cross-industry, 핵심 업무 맥락 다름." |
| responsibilityScope | high | 100 | "의사결정 수준 유사 — 매우 높음." |
| customerType | mid | 48 | "고객 시장 부분 겹침, 구매방식/의사결정 구조 다름." |
| roleCharacter | high | 100 | "분석·판단 중심 + 정확하게 완수 → 완전 일치." |

- specialDiagnostics: 0건
- whyThisRead: 전부 null

### 2-3. 갭 분석

**jobStructure (very_low, 20점) — 중요 발견**

`reasons`에 `mission_match`(직무 미션 유형 일치)와 `output_match`(아웃풋 유형 일치)가 `positive`로 잡혀 있음에도 band는 `very_low`.
이는 strong signal 겹침 없음 + cross distance 감산이 dominant하기 때문임.

현재 summary는 "회계와 데이터분석은 다르다"만 전달하고 `mission_match/output_match` 포지티브 신호를 설명에 반영하지 않음.
누락된 인사이트:
- 회계 업무의 실질 업무는 데이터 수집·검증·분석·보고 루프와 구조적으로 매우 유사
- Excel 피벗, VLOOKUP, SQL 쿼리 활용 등 도구 레벨 겹침이 있어도 job description signal에는 미반영
- `mission_match`가 있다는 것은 "수치 기반 의사결정 지원"이라는 미션 공통점이 있다는 의미

**industryContext (low, 29점)**

금융 → IT/데이터 cross가 낮은 점수의 원인. 현재 summary는 "산업 맥락 다름"만 전달.
누락된 인사이트:
- 금융 도메인 데이터 분석(여신심사, 리스크 분석, 재무 모델링)은 IT 데이터분석과 직무 언어가 상당 부분 겹침
- B2B SaaS/AI 기업의 데이터 직군은 금융 domain knowledge를 갖춘 지원자를 선호하는 경우 있음

**roleCharacter (high, 100점) — 이미 잘 설명됨**

분석·판단 중심 + 정확하게 완수하는 성과 → 완전 일치. 현재 summary 충분.

**whyThisRead 전부 null**

회계→데이터분석은 매우 자주 있는 전환 패턴임에도 whyThisRead headline/subline 없음.
F-layer 또는 별도 수정 필요.

### 2-4. 권장 F-layer UI 카피 초안

#### jobStructure

```
lead:
  "회계 업무는 수치 데이터를 수집·검증·분석해 의사결정을 지원하는 구조로, 데이터분석 직무와
   미션과 아웃풋 방향이 실질적으로 겹칩니다. 다만 데이터분석 직무 기준에서는 Excel·SQL 활용
   수준, 분석 프로젝트 경험, 지표 해석 산출물이 연결 근거로 중요하게 읽힙니다."

scoreReason:
  "직무 구조 기준에서 회계와 데이터분석은 job family 거리가 멀어 기본 점수가 낮게 시작합니다.
   그러나 미션 유형(수치 기반 의사결정 지원)과 아웃풋 방향(분석 보고)이 일치한다는 신호가
   잡혀 있습니다. 이 연결을 점수로 살리려면 '회계 데이터를 직접 가공·분석한 프로젝트 경험'이
   지원서에 드러나야 합니다."

liftOrLimit:
  "이 점수를 높이는 가장 직접적인 방법은, 회계 업무에서 Excel·SQL로 데이터를 분석하고
   인사이트를 도출한 경험을 구체화하는 것입니다. 결산 데이터 오류 탐지, 비용 추이 분석,
   예산 대비 실적 시각화 같은 경험이 있다면 데이터분석 직무 기준으로 직접 설명 가능합니다."
```

#### industryContext

```
lead:
  "금융권 경험은 데이터 정합성, 수치 기반 판단, 엄격한 검증 프로세스에 대한 이해를 쌓는
   환경입니다. AI/데이터 회사에서도 금융 도메인 분석 경험은 차별화 요소가 될 수 있습니다."

scoreReason:
  "금융과 IT/데이터 산업은 업무 흐름과 고객 구조가 달라 산업 연결성은 낮게 반영됐습니다.
   다만 이 차이는 금융 도메인 지식을 강점으로 전환할 수 있는 방향이 있어,
   단순한 약점이 아닌 포지셔닝 선택의 문제로 접근할 수 있습니다."

liftOrLimit:
  "금융 경험을 IT/데이터 업계로 연결하는 가장 효과적인 방법은, 금융 데이터를 분석한 경험을
   '도메인 전문성 + 데이터 분석 기술'의 조합으로 포지셔닝하는 것입니다.
   핀테크, 금융 SaaS, 리스크 분석 플랫폼 쪽에서 특히 이 배경의 선호도가 높습니다."
```

### 2-5. shouldMention 후보

| 신호 | 설명 |
|---|---|
| Excel/SQL 데이터 가공 경험 | 회계 업무에서 직접 데이터를 처리한 구체적 경험 |
| 분석 보고서 작성 경험 | 월별 결산 분석, 예산 대비 실적 분석 등 |
| 수치 이상 탐지/검증 경험 | 오류 발견, 기준 초과 케이스 분류 등 |
| 금융 도메인 데이터 전문성 | 여신/리스크/자산관리 등 특정 금융 도메인 지식 |
| 데이터 분석 학습 이력 | ADsP, SQLD, Python 과정 등 전환 준비 근거 |

---

## 3. TR-PROBE-MARKETING-TO-PRODUCT-001: 퍼포먼스마케팅 → 서비스기획/PM

### 3-1. 입력

```json
{
  "currentJobId": "JOB_MARKETING_PERFORMANCE_MARKETING",
  "currentIndustryId": "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
  "targetJobId": "JOB_BUSINESS_SERVICE_PLANNING",
  "targetIndustryId": "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM"
}
```

### 3-2. 현재 출력 요약

| axis | band | display | 현재 summary 핵심 |
|---|---|---|---|
| jobStructure | very_low | 20 | "퍼포먼스마케팅과 서비스기획은 하는 일이 많이 다름. 핵심 업무 신호 겹침 없음." |
| industryContext | high | 100 | "동일 B2C 플랫폼 산업, 전면 일치." |
| responsibilityScope | low | 20 | "책임 범위가 크게 확장됨." |
| customerType | high | 100 | "동일 B2C, 구매방식/의사결정 일치." |
| roleCharacter | low | 20 | "성과·매출 추진 중심 → 기획 설계 중심으로 미션 불일치. 낮음." |

- specialDiagnostics: 0건
- whyThisRead: 전부 null

### 3-3. 갭 분석

**jobStructure (very_low, 20점)**

퍼포먼스마케팅 → 서비스기획은 실제 채용 시장에서 매우 빈번한 전환 경로. 특히 B2C 플랫폼에서 growth PM, product marketing 출신 PM 채용은 일반적.
현재 summary는 이 컨텍스트를 전혀 반영하지 않음.
누락된 인사이트:
- 퍼포먼스마케팅의 핵심 역량(A/B 테스트, 전환율 최적화, 사용자 행동 데이터 분석)은 서비스기획의 가설 검증, 지표 기반 의사결정과 직접 겹침
- 랜딩 페이지 기획, 크리에이티브 기획 경험은 화면 흐름, UX 감각의 인접 경험
- UA(사용자 획득) 지표 분석 경험은 funnel 분석 경험과 동치

**roleCharacter (low, 20점)**

"성과·매출 추진 중심 → 기획 설계 중심 미션 불일치"가 낮은 점수의 원인.
현재 summary는 이 차이를 기술하기만 함.
누락된 인사이트:
- 퍼포먼스마케팅의 실험 설계(A/B test), 데이터 분석, 지표 해석 역량은 기획 설계 역량의 서브셋
- "성과·매출 추진 중심"이라는 레이블은 "실행·측정 루프"에 익숙하다는 의미이기도 함 — 이는 서비스기획에서도 중요

**responsibilityScope (low, 20점)**

CS probe와 동일 구조. "책임 범위 확장"이라는 팩트만.
퍼포먼스 마케터가 캠페인 기획 → 실행 → 성과 분석 → 개선 사이클을 직접 주도한 경험이 있다면 scope 점수 기준이 달라짐.

**whyThisRead 전부 null**

이 프로필은 summary가 없는 상태 — 커리어 모드에서 지원자에게 아무런 방향성 메시지 없음.

### 3-4. 권장 F-layer UI 카피 초안

#### jobStructure

```
lead:
  "퍼포먼스마케팅 경험에는 서비스기획과 맞닿는 역량이 있습니다.
   A/B 테스트 설계, 사용자 행동 데이터 분석, 전환율 최적화 경험은
   기획 역할의 가설 수립 → 검증 → 개선 루프와 구조적으로 겹칩니다."

scoreReason:
  "직무 구조 기준에서 퍼포먼스마케팅과 서비스기획은 job family 거리가 멀어 점수가 낮습니다.
   핵심 업무 신호(화면 기획, 요구사항 정의, 기능 우선순위 판단)가 직접 겹치지 않기 때문입니다.
   그러나 실험 설계·지표 분석·사용자 관찰 경험은 채용 기준에서 재해석 가능한 인접 신호입니다."

liftOrLimit:
  "이 점수를 높이려면, 마케팅 경험에서 '어떤 화면·기능·메시지를 만들었고, 그 결과를 어떻게
   지표로 확인했는지'가 드러나야 합니다. 랜딩 페이지 기획, 앱 내 메시지 시나리오 설계,
   온보딩 흐름 개선 같은 경험이 있다면 서비스기획 기준에서 직접 설명 가능합니다."
```

#### roleCharacter

```
lead:
  "퍼포먼스마케팅의 '측정 → 실험 → 개선' 루프는 서비스기획에서 요구하는
   데이터 기반 가설 검증 역량과 구조적으로 맞닿습니다.
   성과 지표에 민감한 감각은 기획 역할에서도 강점이 됩니다."

scoreReason:
  "직무 성격 기준에서 퍼포먼스마케팅(성과·매출 추진 중심)과 서비스기획(기획 설계 중심)은
   미션 유형과 성과 측정 방식이 달라 낮게 반영됐습니다.
   다만 '무엇을 실험하고 어떻게 측정했는지'가 드러날수록 이 거리가 줄어듭니다."

liftOrLimit:
  "기획 설계 역할에 가까워지려면, 캠페인 집행 경험보다 '어떤 가설을 세우고,
   어떤 지표로 판단했으며, 그 결과로 무엇을 바꿨는지' 흐름이 지원서에 보여야 합니다."
```

#### responsibilityScope

```
lead:
  "캠페인 기획부터 실행·성과 분석·개선까지 직접 주도한 경험이 있다면,
   이는 서비스기획의 역할 범위 기준에서 가장 가까운 신호입니다."

scoreReason:
  "현재 퍼포먼스마케팅 역할이 실행 중심으로 읽혀, 서비스기획에서 요구하는
   방향 설정과 조율 구조와의 거리가 크게 반영됐습니다."

liftOrLimit:
  "마케팅 프로세스 개선을 제안하거나, 팀 또는 개발팀과 협업해 기능 변경을 이끈 경험이 있다면
   책임 범위 기준이 달라집니다."
```

### 3-5. shouldMention 후보

| 신호 | 설명 |
|---|---|
| A/B 테스트 설계·분석 경험 | 실험 가설, 세그먼트 설정, 결과 해석까지 직접 수행 |
| 사용자 행동 데이터 분석 경험 | GA, Amplitude, Mixpanel 등 활용한 funnel 분석 |
| 랜딩 페이지·앱 내 화면 기획 경험 | UX/화면 관점에서 마케팅 소재 외 기획 관여 |
| 캠페인 전 과정 주도 경험 | 기획→실행→보고→개선 사이클 직접 운영 |
| 서비스기획 산출물 접촉 경험 | 개발/기획팀과 협업하며 PRD·기능 명세 접촉 |

---

## 4. 공통 발견 정리

### 4-1. F-layer 설계 시 반영 필요 사항

| 항목 | 내용 |
|---|---|
| classification 빈값 | 3개 probe 모두 `{}`. F-layer 트리거는 `classifyTransition` 결과가 아닌 `currentJobId + targetJobId` 직접 매칭 필요 |
| whyThisRead null | CS probe 외 2개는 headline/subline 없음. F-layer 또는 별도 수정 범위 검토 필요 |
| D/E 레이어와 격리 | `buildNewgradTransitionLiteResult` vs `buildTransitionLiteResult` 분리 구조이므로 F-layer는 career mode 전용. D/E 코드 오염 없음 |
| generic summary 보완 위치 | `axisPack.axes.{axisKey}.explanation`에 `lead/scoreReason/liftOrLimit` 추가 (extra 파라미터로 전달) |

### 4-2. F-layer pattern 우선순위 제안

| 우선순위 | patternId | 발화 조건 | 핵심 슬롯 |
|---|---|---|---|
| P1 | CS_TO_SERVICE_PLANNING | currentJob=CS, targetJob=SERVICE_PLANNING | jobStructure, responsibilityScope |
| P1 | PERFORMANCE_MARKETING_TO_SERVICE_PLANNING | currentJob=PERFORMANCE_MARKETING, targetJob=SERVICE_PLANNING | jobStructure, roleCharacter |
| P1 | FINANCE_ACCOUNTING_TO_DATA_ANALYSIS | currentJob=ACCOUNTING/FINANCE, targetJob=DATA_ANALYSIS | jobStructure, industryContext |
| P2 | 추가 후보 | (F-2 이후 확장) | — |

### 4-3. 현재 출력에서 이미 잘 작동하는 부분 (F-layer 불필요)

| axis | probe | 이유 |
|---|---|---|
| industryContext | CS (high, 100) | 동일 산업 → generic summary 충분 |
| industryContext | Marketing (high, 100) | 동일 산업 → generic summary 충분 |
| customerType | CS (high, 100) | 동일 B2C → generic summary 충분 |
| customerType | Marketing (high, 100) | 동일 B2C → generic summary 충분 |
| responsibilityScope | Finance (high, 100) | 의사결정 수준 유사 → generic summary 충분 |
| roleCharacter | Finance (high, 100) | 분석·판단 완전 일치 → generic summary 충분 |

---

## 5. F-2 구현 범위 초안

> 사용자 검토 후 확정. F-2에서 구현.

### 5-1. 신규 파일 후보

```
src/lib/analysis/careerTransitionCaseOverlays.js  (D/E layer 구조 참고)
```

- 구조: `PATTERN_REGISTRY` + `applyCareerTransitionCaseOverlays(axisPack, input)` 함수
- 트리거 조건: `currentJobId + targetJobId` 직접 매칭
- 출력: `axisPack.axes.{axisKey}.explanation.lead/scoreReason/liftOrLimit` 주입

### 5-2. 수정 파일 후보

```
src/lib/transitionLite/buildTransitionLiteResult.js
```

- `buildAxisConnectivityPack` 호출 후 `applyCareerTransitionCaseOverlays(axisPack, validated.input)` 적용
- 최대 1개 추가 호출

### 5-3. 신규 fixture 파일 후보

```
scripts/regression/career-transition-case-invariant-cases.js  (15케이스 이내)
scripts/regression/run-career-transition-case-smoke.mjs
```

---

*Runner: 실측 없음 (F-1은 probe 출력 캡처 단계). F-2 구현 후 fixture + runner 작성.*
