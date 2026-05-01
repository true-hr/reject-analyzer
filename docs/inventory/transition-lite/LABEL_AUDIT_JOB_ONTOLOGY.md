# Label Audit: Job Ontology & Industry Registry

> **감사 기준일**: 2026-03-27
> **감사 범위**: 직무 ontology 113개, 산업 registry 68개
> **감사 도구**: `scripts/audit/audit-job-industry-labels.mjs`
> **수정 금지**: 이 문서는 조사 결과만 담는다. 패치는 별도 라운드에서 진행.

---

## 1. 조사 결과 요약

| 항목 | 수치 |
|------|------|
| 직무 ontology 총 개수 | 113개 |
| 직무 label 누락 (MISSING_LABEL) | **110개** (97.3%) |
| 직무 label OK_MATCH | 2개 (JOB_BUSINESS_STRATEGY, JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT) |
| 직무 FALLBACK_RISK | 1개 (JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT) |
| 산업 registry 총 개수 | 68개 |
| 산업 label 누락 | **0개** (100% 보유) |
| 산업 FALLBACK_RISK (input 미매핑) | 3개 |
| 직무 input/report 불일치 (P0 즉시 위험) | 10개 (회귀 케이스 사용 직무) |

---

## 2. SSOT 판정

### 직무 label SSOT

| 경로 | 역할 | 현재 상태 |
|------|------|-----------|
| `src/data/job/ontology/**/*.js` | 직무 ontology 정의 | **대부분 label 필드 없음** |
| `src/data/job/jobOntology.index.js:113` | label 결정 로직 | `value.label ?? titleizeToken(subcategory)` fallback |
| `src/data/transitionLite/targetReadAdapter.js:390` | report title 생성 | `targetJobItem?.label + " 특징"` |
| `src/components/input/categoryOptions.js` | input UI label source | 하드코딩 한국어 (SSOT 기능 담당) |

**결론**: 현재 직무 label의 실질 SSOT는 `categoryOptions.js`의 하드코딩 한국어 label이다.
단, ontology 파일에 `label` 필드가 없으면 report에는 `titleizeToken(subcategory)` 영문 fallback이 노출된다.
→ input 선택 label과 report 표시 label이 **서로 다른 source에서 온다** = 구조적 SSOT 불일치.

### 산업 label SSOT

| 경로 | 역할 | 현재 상태 |
|------|------|-----------|
| `src/data/industry/registry/**/*.js` | industry item 정의 | **100% 명시적 label 필드 있음** |
| `src/data/transitionLite/targetReadAdapter.js:430` | report title 생성 | `targetIndustryItem?.label + " 특징"` |
| `src/components/input/categoryOptions.js` | input UI label | 하드코딩 한국어 |

**결론**: 산업은 registry의 `label` 필드가 SSOT이며, input UI label과 65/68개(95.6%)가 일치한다.
input-report label chain이 신뢰 가능한 상태.

### fallback chain 요약

```
직무:
  ontology item.label 없음
    → titleizeToken(subcategory)  ← 영문 Title Case (e.g., "Devops Infra")
    → exportKey                   ← snake_case (e.g., "devops_infra")
    → subcategory raw             ← 원본 (e.g., "DEVOPS_INFRA")

산업:
  registry item.label 있음 → 직접 사용 (fallback 없음)
```

---

## 3. 직무 누락/불일치 표

> 113개 중 대표 항목만 표시. 전체 목록은 `scripts/audit/output/label-audit.json` 참조.
> `input label: (매핑 없음)` = categoryOptions.js에서 해당 직무가 독립 선택지로 없거나 alias 매핑 실패.

### P0 — 회귀 케이스 직접 사용 (즉시 위험)

| canonical id | 현재 fallback label | input label | 상태 | priority |
|---|---|---|---|---|
| `JOB_IT_DATA_DIGITAL_DEVOPS_INFRA` | `Devops Infra` | DevOps / 인프라 | MISSING_LABEL | **P0** |
| `JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION` | `Qa Test Automation` | QA / 테스트 자동화 | MISSING_LABEL | **P0** |
| `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS` | `Service Operations` | 서비스운영 | MISSING_LABEL | **P0** |
| `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING` | `Operation Planning` | 운영기획 | MISSING_LABEL | **P0** |
| `JOB_BUSINESS_SERVICE_PLANNING` | `Service Planning` | 서비스기획 | MISSING_LABEL | **P0** |
| `JOB_BUSINESS_BUSINESS_PLANNING` | `Business Planning` | 사업기획 | MISSING_LABEL | **P0** |
| `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA` | `Quality Assurance Qa` | 품질보증(QA) | MISSING_LABEL | **P0** |
| `JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING` | `Technical Support Field Engineering` | 기술지원 / 필드엔지니어 | MISSING_LABEL | **P0** |
| `JOB_HR_ORGANIZATION_RECRUITING` | `Recruiting` | 채용 | MISSING_LABEL | **P0** |
| `JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS` | `External Relations` | 대외협력 | MISSING_LABEL | **P0** |

**P0 근거**: 회귀 케이스 case-1~case-8에서 current/target job으로 직접 사용.
실제 report의 "지원 직무 특징" 카드 title에 영문이 노출됨.

### P1 — 주요 직무 / input 선택 가능 (노출 가능성 높음)

| canonical id | 현재 fallback label | input label | 상태 | priority |
|---|---|---|---|---|
| `JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING` | `Ai Ml Engineering` | AI / ML 엔지니어링 | MISSING_LABEL | P1 |
| `JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT` | `Frontend Development` | 프론트엔드개발 | MISSING_LABEL | P1 |
| `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS` | `Data Analysis` | 데이터분석 | MISSING_LABEL | P1 |
| `JOB_IT_DATA_DIGITAL_DATA_SCIENCE` | `데이터사이언스` | 데이터사이언스 | OK_MATCH | P1 |
| `JOB_IT_DATA_DIGITAL_DATA_ENGINEERING` | `Data Engineering` | 데이터엔지니어링 | MISSING_LABEL | P1 |
| `JOB_IT_DATA_DIGITAL_IT_PLANNING` | `It Planning` | IT 기획 | MISSING_LABEL | P1 |
| `JOB_MANUFACTURING_QUALITY_PRODUCTION_AUTOMATION_CONTROL` | `설비제어 / 자동제어` | 설비제어 / 자동제어 | OK_MATCH | P1 |
| `JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN` | `전장/전기설계` | 전장/전기설계 | OK_MATCH | P1 |
| `JOB_DESIGN_UI_DESIGN` | `Ui Design` | UI 디자인 | MISSING_LABEL | P1 |
| `JOB_DESIGN_UX_DESIGN` | `Ux Design` | UX 디자인 | MISSING_LABEL | P1 |
| `JOB_DESIGN_PRODUCT_DESIGN` | `Product Design` | 프로덕트디자인 | MISSING_LABEL | P1 |
| `JOB_DESIGN_BX_BRAND_DESIGN` | `Bx Brand Design` | BX / 브랜드디자인 | MISSING_LABEL | P1 |
| `JOB_MARKETING_BRAND_MARKETING` | `Brand Marketing` | 브랜드마케팅 | MISSING_LABEL | P1 |
| `JOB_MARKETING_PR_COMMUNICATIONS` | `Pr Communications` | PR / 커뮤니케이션 | MISSING_LABEL | P1 |
| `JOB_MARKETING_CRM_MARKETING` | `Crm Marketing` | CRM 마케팅 | MISSING_LABEL | P1 |
| `JOB_MARKETING_PRODUCT_MARKETING_PMM` | `Product Marketing Pmm` | 상품마케팅(PMM) | MISSING_LABEL | P1 |
| `JOB_HR_ORGANIZATION_HRBP` | `Hrbp` | HRBP | MISSING_LABEL | P1 |
| `JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE` | `Ir Disclosure` | IR / 공시 | MISSING_LABEL | P1 |
| `JOB_FINANCE_ACCOUNTING_FP_AND_A` | `Fp And A` | 경영분석 / FP&A | MISSING_LABEL | P1 |
| `JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION` | `Administration` | 행정 | MISSING_LABEL | P1 |
| `JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS` | `Public Program Operations` | 공공사업 운영 | MISSING_LABEL | P1 |
| `JOB_PUBLIC_ADMINISTRATION_SUPPORT_POLICY_SUPPORT` | `Policy Support` | 정책지원 | MISSING_LABEL | P1 |
| `JOB_RESEARCH_PROFESSIONAL_CONSULTING` | `Consulting` | 컨설팅 | MISSING_LABEL | P1 |
| `JOB_RESEARCH_PROFESSIONAL_LEGAL` | `Legal` | 법무 | MISSING_LABEL | P1 |

### P2 — 구조적 위험 (현재 직접 노출 낮음)

| canonical id | 현재 fallback label | 상태 | priority | 비고 |
|---|---|---|---|---|
| `JOB_SALES_B2B_SALES` | `B2b Sales` | MISSING_LABEL | P2 | titleize가 "B2b" 소문자 오류 포함 |
| `JOB_SALES_B2C_SALES` | `B2c Sales` | MISSING_LABEL | P2 | 동일 |
| `JOB_MARKETING_PERFORMANCE_MARKETING` | `Performance Marketing` | MISSING_LABEL | P2 | 영문이지만 통용됨 |
| `JOB_PROCUREMENT_SCM_SCM` | `Scm` | MISSING_LABEL | P2 | 어색한 소문자 fallback |
| `JOB_FINANCE_ACCOUNTING_FP_AND_A` | `Fp And A` | MISSING_LABEL | P2 | input "경영분석 / FP&A"와 완전 불일치 |
| `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT` | `프로덕트 매니지먼트` | FALLBACK_RISK | P2 | label 있으나 input 옵션에 없음 — 선택 경로 불명확 |
| 나머지 MISSING_LABEL 전체 (약 89개) | 다양한 영문 fallback | MISSING_LABEL | P2 | transition-lite 확장 시 드러남 |

---

## 4. 산업 누락/불일치 표

### 전체 상태 요약

- 68개 모두 `label` 필드 있음
- 65개 input UI와 정확히 매핑됨 (OK_MATCH)
- 3개 FALLBACK_RISK (아래)

### FALLBACK_RISK 산업 3개

| canonical id | registry label | input에 없는 이유 | 상태 | priority |
|---|---|---|---|---|
| `IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ECOMMERCE_PLATFORM_MARKETPLACE_OPERATOR` | 이커머스 플랫폼 / 오픈마켓 운영사 | input에 "온라인 커머스"만 있고 이 세분화 항목 없음 | FALLBACK_RISK | P2 |
| `IND_IT_SOFTWARE_PLATFORM_CLOUD_MANAGED_SERVICE_MSP` | 클라우드 MSP / 매니지드 서비스 | input에 없음 (IT 섹터 7개에 포함 안 됨) | FALLBACK_RISK | P2 |
| `IND_IT_SOFTWARE_PLATFORM_CYBERSECURITY_INFOSEC_SOLUTION` | 사이버보안 / 정보보안 솔루션 | input에 없음 (IT 섹터 7개에 포함 안 됨) | FALLBACK_RISK | P2 |

**근거**: 이 3개 항목은 사용자가 input에서 직접 선택할 수 없으나 내부 canonical ID로 transition-lite에서 처리될 경우 label은 정상 노출됨 — 큰 위험은 아니지만 input에서 도달 불가한 경로.

---

## 5. 우선 수정 추천 TOP 10

회귀 케이스에서 직접 노출되는 P0 직무 10개를 우선 보강해야 한다.

| 순위 | canonical id | 노출 fallback | 적합한 Korean label | 터지는 경로 | 수정 owner |
|---|---|---|---|---|---|
| 1 | `JOB_IT_DATA_DIGITAL_DEVOPS_INFRA` | `Devops Infra` | `DevOps / 인프라` | case-1,2,3,8 targetJobRead.title | ontology 파일 |
| 2 | `JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION` | `Qa Test Automation` | `QA / 테스트 자동화` | case-3 targetJobRead.title | ontology 파일 |
| 3 | `JOB_HR_ORGANIZATION_RECRUITING` | `Recruiting` | `채용` | case-7 currentJob 기반 분석 표 | ontology 파일 |
| 4 | `JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS` | `External Relations` | `대외협력` | case-7 targetJobRead.title | ontology 파일 |
| 5 | `JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING` | `Technical Support Field Engineering` | `기술지원 / 필드엔지니어` | case-6 targetJobRead.title | ontology 파일 |
| 6 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA` | `Quality Assurance Qa` | `품질보증(QA)` | case-6 currentJob 표시 | ontology 파일 |
| 7 | `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING` | `Operation Planning` | `운영기획` | case-4 targetJobRead.title | ontology 파일 |
| 8 | `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS` | `Service Operations` | `서비스운영` | case-4 currentJob 표시 | ontology 파일 |
| 9 | `JOB_BUSINESS_SERVICE_PLANNING` | `Service Planning` | `서비스기획` | case-5 currentJob 표시 | ontology 파일 |
| 10 | `JOB_BUSINESS_BUSINESS_PLANNING` | `Business Planning` | `사업기획` | case-5 targetJobRead.title | ontology 파일 |

**수정 방법**: 각 ontology 파일의 `JOB_ONTOLOGY_ITEM` 최상단에 `label: "한국어명"` 1줄 추가.
이것이 canonical 접근이며, `jobOntology.index.js:113`이 `value.label`을 우선 참조하므로 즉시 적용된다.

---

## 6. 수정 전략 제안

### A. data 보강으로 해결 가능한 것 (권장 경로)

- 각 job ontology 파일에 `label: "한국어명"` 추가
- P0 10개 → P1 나머지 → P2 순서로 점진적 보강
- 참조 기준: `src/components/input/categoryOptions.js`의 input label을 SSOT로 삼아 동기화
- 파일당 1줄 변경이므로 파급 없음

### B. input label source 정리로 해결 가능한 것

- 현재 `categoryOptions.js`의 `v`, `t` 값이 각각 다른 경우 있음 (e.g., v="프로젝트관리(PM)", t="프로젝트관리(PM)")
- input에 없는 job (FALLBACK_RISK 상태 `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`)은 input option 추가 여부를 판단해야 함
- 산업 3개 FALLBACK_RISK 항목은 input에 대응 옵션 추가 or 내부 전용 경로로 명시화

### C. consumer title resolve 보정이 필요한 것

- `targetReadAdapter.js:390`의 현재 코드는 `targetJobItem?.label`이 없으면 title을 `""` 처리함
- 이 경우 TransitionLiteResult.jsx:302에서 `targetJobRead.title`이 없어도 렌더링 문제는 없으나 카드 heading이 비어 보임
- 별도 fallback (예: "지원 직무 특징")을 consumer에서 처리할 수도 있음 — 단, 근본 해결은 data 보강

### D. SSOT 통합이 필요한 것 (중장기)

- 현재 구조: input label = categoryOptions.js 하드코딩 / report label = ontology item.label
- 두 source가 분리되어 있어 어느 한쪽이 바뀌면 불일치 발생
- 이상적 구조: ontology item.label → input option 자동 populate (현재 아님)
- 산업의 경우 industryRegistry.label ↔ input label이 어느 정도 동기화되어 있으나 완전 자동은 아님

---

## 7. 조사 방법 및 한계

- **스크립트 기준**: `scripts/audit/audit-job-industry-labels.mjs`
- **isFallback 판정 방법**: `item.label === titleizeToken(subcategory)` 비교. 단, 우연히 일치하는 경우 오탐 가능성 있음.
- **input 매핑**: alias 기반 normalize 매핑. alias 목록에 input label이 없는 경우 "매핑 없음"으로 표시됨.
- **산업 FALLBACK_RISK 3개**: input에 없는 경로이므로 실제 사용자에게 노출될 가능성은 낮음. 내부 데이터 일관성 관점에서만 위험.
- **회귀 케이스 이외 직무의 실제 노출 빈도**: 알 수 없음. 사용자 사용 로그가 있다면 P1/P2 재분류 가능.

---

## 8. 참고: 현재 정상 항목 (OK_MATCH)

| id | label | 근거 |
|---|---|---|
| `JOB_BUSINESS_STRATEGY` | `전략기획` | ontology 파일에 `label: "전략기획"` 명시, input 일치 |
| `JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT` | `민원 / 현장지원` | 2026-03-27 패치로 추가, input 일치 |
