# Phase 3A Normalized Pilot

## 이번에 정규화한 job 목록

- `JOB_BUSINESS_STRATEGY`
- `JOB_PRODUCT_MANAGER_PM`
- `JOB_DATA_ANALYST_BI`
- `JOB_SALES_ENGINEER_SE`
- `JOB_PROCUREMENT_BUYER`

## 이번에 정규화한 industry 목록

- `IND_PROCUREMENT_STRATEGIC_SOURCING`
- `IND_PROCUREMENT_VENDOR_MANAGEMENT`
- `IND_PROCUREMENT_CONTRACT_COMMERCIAL`
- `IND_PROCUREMENT_PURCHASING_ANALYTICS`
- `IND_PROCUREMENT_MANUFACTURING_MATERIALS`

## Source Origin

### job

| canonical id | source origin |
|---|---|
| `JOB_BUSINESS_STRATEGY` | `src/lib/roleDictionary.js` `role: "corp_strategy"` |
| `JOB_PRODUCT_MANAGER_PM` | `src/lib/roleDictionary.js` `role: "product_manager_pm"` |
| `JOB_DATA_ANALYST_BI` | `src/lib/roleDictionary.js` `role: "data_analyst_bi"` |
| `JOB_SALES_ENGINEER_SE` | `src/lib/roleDictionary.js` `role: "sales_engineer_se"` |
| `JOB_PROCUREMENT_BUYER` | `src/lib/roleDictionary.js` `role: "procurement_buyer"` |

### industry

| canonical id | source origin |
|---|---|
| `IND_PROCUREMENT_STRATEGIC_SOURCING` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "strategic_sourcing"` |
| `IND_PROCUREMENT_VENDOR_MANAGEMENT` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "vendor_management"` |
| `IND_PROCUREMENT_CONTRACT_COMMERCIAL` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "contract_commercial"` |
| `IND_PROCUREMENT_PURCHASING_ANALYTICS` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "purchasing_analytics"` |
| `IND_PROCUREMENT_MANUFACTURING_MATERIALS` | `src/lib/semantic/taxonomy/domainTaxonomy.js` `domain: "manufacturing_materials"` |

## major / sub 매핑

### job

| canonical id | major | sub |
|---|---|---|
| `JOB_BUSINESS_STRATEGY` | `STRATEGY` | `BUSINESS_STRATEGY` |
| `JOB_PRODUCT_MANAGER_PM` | `PM` | `PRODUCT_MANAGER` |
| `JOB_DATA_ANALYST_BI` | `DATA` | `DATA_ANALYST_BI` |
| `JOB_SALES_ENGINEER_SE` | `SALES` | `SALES_ENGINEER` |
| `JOB_PROCUREMENT_BUYER` | `PROCUREMENT` | `PROCUREMENT_BUYER` |

### industry

| canonical id | major | sub |
|---|---|---|
| `IND_PROCUREMENT_STRATEGIC_SOURCING` | `PROCUREMENT` | `STRATEGIC_SOURCING` |
| `IND_PROCUREMENT_VENDOR_MANAGEMENT` | `PROCUREMENT` | `VENDOR_MANAGEMENT` |
| `IND_PROCUREMENT_CONTRACT_COMMERCIAL` | `PROCUREMENT` | `CONTRACT_COMMERCIAL` |
| `IND_PROCUREMENT_PURCHASING_ANALYTICS` | `PROCUREMENT` | `PURCHASING_ANALYTICS` |
| `IND_PROCUREMENT_MANUFACTURING_MATERIALS` | `PROCUREMENT` | `MANUFACTURING_MATERIALS` |

## 보강한 필드

### job

- `id`
- `label`
- `major`
- `sub`
- `aliases`
- `families`
- `roles`
- `axes`
- `adjacentFamilies`
- `boundaryHints`
- `summaryTemplate`
- optional:
  - `strongSignals`
  - `mediumSignals`
  - `boundarySignals`
  - `domainHints`
  - `proofStyleHints`
  - `outputArtifacts`
  - `seniorityHints`

### industry

- `id`
- `label`
- `major`
- `sub`
- `aliases`
- `marketType`
- `operatingRhythm`
- `decisionStructure`
- `proofSignals`
- `domainIntensity`
- `adjacentIndustries`
- `jobInteractionHints`
- `summaryTemplate`

## 아직 비어 있는 필드

- 이번 pilot 자산에서는 Phase 1 최소 required fields는 모두 채웠다.
- 추가 optional field는 industry 쪽에 아직 붙이지 않았다.
- industry 쪽의 `customerStructure`, `regulationLevel`, `marginStructure`, `evidenceArtifacts`, `talentMobilityHints`, `boundaryNotes`는 비워 둔 상태다.

## 이후 batch 정규화 시 반복 적용할 규칙

- source origin을 반드시 item 단위로 기록한다.
- source key와 canonical id를 분리한다.
- `aliases`는 탐색용으로만 쓰고 id를 대체하지 않는다.
- `axes`는 최소 3개, `boundaryHints`는 최소 1개를 유지한다.
- `summaryTemplate`는 one-liner / strength or expectation / risk 세 슬롯으로 통일한다.
- source의 raw signal은 optional field로 옮기고, scoring 문법은 넣지 않는다.

## 이번 pilot에서 드러난 naming 충돌/밀도 문제/경계 문제

### naming 충돌

- `roleDictionary.js`의 source key는 snake_case role key이고, canonical id는 SSOT 규칙상 대문자 prefix id여야 한다.
- `procurement_buyer`는 source `family: "strategy"`와 의미상 procurement가 충돌한다.

### 밀도 문제

- roleDictionary 기반 raw material은 신호 밀도는 높지만 label/axes/boundary/summary가 비어 있다.
- domainTaxonomy 기반 raw material은 phrase density는 높지만 industry registry field가 거의 없다.

### 경계 문제

- `corp_strategy`와 `planning_budget_control`, `finance_strategy_fpa` 사이 경계가 가깝다.
- `sales_engineer_se`는 sales와 dev 사이 경계 설명이 필수다.
- procurement 관련 source는 industry보다 function domain 성격이 강해, major/sub를 procurement domain 관점으로 제한해서 pilot화했다.
