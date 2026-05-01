# PASSMAP Special Transition Diagnostics

## 1. 목적

이 문서는 PASSMAP 직무/산업 전환 분석에서 generic ontology/adjacency/evidence rule만으로는 정확히 설명하기 어려운 source → target 특수 전환 케이스를 기록한다.

핵심 원칙:
- score/gate를 바로 수정하지 않는다.
- 먼저 user-facing diagnostic/explanation layer로만 연결한다.
- 특정 source → target pair에서만 나타나는 비대칭 리스크를 설명한다.
- generic rule 중복을 피한다.
- ontology/registry 데이터 계층을 오염시키지 않는다.

---

## 2. 현재 PASSMAP generic 전환 체계

| 구분 | 현재 처리 방식 | owner 후보 | 비고 |
|---|---|---|---|
| 직무 분류 | major/subcategory/family 기반 | src/data/job/jobOntology.index.js | 14개 canonical major 기반 |
| 산업 분류 | sector/subSector/leaf 기반 | src/data/industry/industryRegistry.index.js | 12개 canonical sector 기반 |
| 직무 거리 | same/adjacent/cross | src/lib/transitionLite/classifyTransition.js | id/subcategory/family/adjacentFamilies/boundary hint |
| 산업 거리 | same/adjacent/cross | src/lib/transitionLite/classifyTransition.js | sector만으로 adjacent 처리하지 않고 customerMarket/valueChain/context overlap 확인 |
| alias/compound | exact lookup 우선, compound fallback | src/data/job/jobLookup.index.js, src/data/industry/industryRegistry.index.js | pair rule은 아님 |
| 경험 근거 | experienceEvidencePack | src/lib/transitionLite/buildNewgradTransitionLiteResult.js | 신입 축별 보정 |
| 자격증 근거 | certEvidencePack/newgradCertRegistry | src/data/transitionLite/newgradCertRegistry.js | 일부 target major gating |
| 자기보고 근거 | selfReportEvidencePack | src/lib/transitionLite/buildNewgradTransitionLiteResult.js | axis4/axis5 보조 |
| 고객/구매구조 | customerMarket, buyingMotion | buildTransitionLiteResult / buildAxisConnectivityPack | B2B/B2C, 구매구조 일부 반영 |
| 운영 맥락 | valueChain, coreContext, regulation 등 | buildTransitionLiteResult / buildAxisConnectivityPack | 산업 맥락 보정 |

**요약**: PASSMAP은 이미 "비슷한 직무군/산업군/경험/자격증/고객구조/운영맥락"을 generic하게 처리한다.
따라서 special rule은 단순 유사도 보정이 아니라, generic 판단이 놓치는 특정 pair의 비대칭 리스크만 다룬다.

---

## 3. generic으로 처리하면 위험한 특수 케이스 분류

### A. 직무명은 비슷하지만 실제 수행 체계가 다른 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| QA 계열 | 제조 품질 QA → IT QA/SQA | 제조 품질보증 | 테스트 자동화/SDET | QA 이름 때문에 adjacent/same처럼 보일 수 있음 | 검증 대상, CI/CD, 테스트 자동화, 개발 프로세스 | P0 |
| PM 계열 | 서비스기획/사업 PM → PO/개발 PL | 서비스기획/사업기획 | PO/프로덕트/개발 PL | PM 키워드로 과도한 인접 판단 | backlog, release, tech stakeholder, product metric | P0 |
| 고객 운영 | B2C CS → B2B CSM | 고객상담/CS | CSM/CX | 고객응대 경험으로 과대평가 | account ownership, renewal, adoption, B2B contract | P0 |
| 마케팅 | 마케팅 운영 → PMM | 퍼포먼스/CRM | Product Marketing | 마케팅 major 동일로 과대평가 | positioning, launch, sales enablement, product 이해 | P1 |
| 기획 | 서비스기획 ↔ 사업기획 ↔ 전략기획 | service planner | strategy/business planning | planning label 과대평가 | PRD, 사업계획, 전략 보고서 산출물 구분 | P0/P1 |
| 데이터 분석 | 마케팅 분석 ↔ 제품 분석 ↔ 리스크 분석 | marketing analyst | product/risk analyst | data keyword 과대평가 | metric domain, causal/experiment/risk model | P1 |

### B. 산업은 비슷해 보여도 규제/인증/품질 기준이 다른 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 제조→규제산업 | 일반 제조 품질 → 의료기기/제약 QA/RA | 일반 제조 QA | 의료기기 RA/QA | 품질·문서 경험으로 과대평가 | GMP, ISO13485, 인허가, validation | P0 |
| 공공/문서→RA | 공공행정 → RA/인증 | 공공기관 행정 | RA/인증 | 문서/규정 경험 연결 과대평가 | 산업별 인증 체계, submission, authority 대응 | P0 |
| 금융 | 일반 운영/심사 → 금융심사/컴플라이언스 | 사무/영업관리 | 금융심사/AML | 운영·문서 경험으로 과대평가 | 금융규제, 리스크, 심사 기준 | P0/P1 |
| 보안정책 | 총무/법무 → 개인정보/보안정책 | 총무/법무 | 개인정보/보안정책 | 문서·규정 경험 과대평가 | ISMS, privacy law, security control | P1 |
| 안전/건설 | 운영/총무 → 안전관리/건설 PM | ops/admin | safety/construction | 운영·문서 경험 과대평가 | 법정 자격, 현장 안전, 공정관리 | P0 |

### C. 고객 유형이 달라지는 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| B2C→B2B | 개인고객 응대 → Enterprise CSM/영업 | B2C CS/운영 | B2B SaaS CSM/AE | customerMarket만으로 부족 | 의사결정자, 계약기간, QBR, renewal | P0 |
| SMB→Enterprise | 중소고객 영업 → 엔터프라이즈 영업 | SMB sales | enterprise solution sales | sales adjacent로 과대평가 | buying committee, long cycle, procurement | P1 |
| 오프라인→플랫폼 | 매장 운영 → 플랫폼 운영 | 오프라인 운영 | marketplace/platform ops | 운영 major로 과대평가 | seller/buyer 양면시장, 정책, metric ops | P1 |
| 내부고객→외부고객 | 사내 운영/지원 → 고객 성공/영업 | internal ops | customer-facing role | 커뮤니케이션 경험 과대평가 | 매출/계약/고객성과 책임 | P1 |

### D. 판매/계약 구조가 달라지는 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 단품→구독 | 유통 영업 → SaaS 구독 영업 | 유통/채널영업 | B2B SaaS AE | 영업 adjacent로 과대평가 | ARR, pipeline, renewal, solution demo | P0/P1 |
| 거래→리텐션 | CS/영업지원 → CSM | CS/영업관리 | CSM | 고객 경험으로 과대평가 | adoption, expansion, churn ownership | P0 |
| 유통→솔루션 | 유통 영업 → 솔루션 영업 | channel sales | solution sales | sales family 동일 | technical discovery, presales, ROI proposal | P1 |
| inbound→outbound | 인바운드 상담영업 → B2B outbound sales | inbound sales | outbound sales | 영업 경험 과대평가 | lead sourcing, cold outreach, pipeline 생성 | P1 |

### E. 데이터/시스템/자동화 수준이 달라지는 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 운영→데이터 | 운영관리 → 데이터분석/BI | 일반 운영 | BI/data analyst | KPI 경험으로 과대평가 | SQL, 데이터 모델, dashboard, experiment | P0/P1 |
| 사무→ERP/CRM ops | 일반 사무 → CRM/ERP 운영 | admin | sales ops/revops | office tool 경험 과대평가 | system ownership, workflow automation, data quality | P1 |
| 수기→자동화 | 운영지원 → workflow automation | ops support | ops excellence | 반복업무 경험 과대평가 | 자동화 설계, workflow, tool integration | P1 |
| 사용자→관리자 | CRM 사용자 → CRM Admin/Ops | CRM user | CRM admin | 사용 경험 과대평가 | 필드 설계, 권한, 프로세스 관리 | P1 |

### F. 현장/안전/설비/물류 맥락이 들어가는 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 일반 운영→생산 | 운영관리 → 생산관리 | office ops | production planning | 운영 키워드로 인접 오판 | 공정, 설비, 현장 안전, 납기/재고 | P0 |
| 물류→SCM | 배송/물류 운영 → SCM planning | 물류 운영 | SCM planner | supply chain label 과대평가 | S&OP, demand planning, supplier coordination | P1 |
| 총무/운영→안전 | 시설/총무 → 산업안전관리 | facility/admin | safety manager | 시설 경험 과대평가 | 법정 안전관리, 위험성 평가, 현장 점검 | P0 |
| CS/VOC→품질 | 고객불만 처리 → 제조 품질관리 | CS/VOC | quality control | VOC 경험 과대평가 | 검사, 공정, 불량 분석 | P1 |

### G. 문서/정책/규정 경험이 강하게 작동하지만 과대평가되기 쉬운 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 공공→컴플라이언스 | 행정/민원 → compliance ops | public admin | compliance | 규정 경험 과대평가 | internal control, audit, regulator 대응 | P1 |
| 총무/법무→보안정책 | 총무/법무 → 개인정보/보안정책 | 총무/법무 | 보안정책 | 문서·규정 경험 과대평가 | ISMS, 개인정보보호법, security control | P1 |
| 품질문서→RA | 제조 품질문서 → 의료기기/제약 RA | quality docs | RA | 문서관리 경험 과대평가 | submission, authority, validation | P0 |
| 교육운영→HR 제도기획 | 교육운영 → HR planning | 교육/HRD 운영 | HR 제도기획/평가보상 | 운영 경험 과대평가 | 제도 설계, 평가/보상 구조 | P1 |

### H. 전략/기획으로 상향 전환되는 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 영업관리→사업기획 | sales admin/영업관리 → business planning | 영업관리 | 사업기획 | KPI/매출 경험 과대평가 | 의사결정 레벨, 시장/사업모델 분석, 산출물 | P0 |
| 운영관리→전략기획 | ops manager → strategy planning | 운영관리 | 전략기획 | 운영 개선 경험 과대평가 | hypothesis, portfolio, executive deck | P1 |
| 마케팅 운영→브랜드전략 | campaign ops → brand strategy | 캠페인 운영 | 브랜드전략 | 실행 경험 과대평가 | positioning, brand architecture, market view | P1 |
| HR 운영→HRBP/OD | HR ops → HRBP/OD | HR 운영 | HRBP/OD | HR 운영 경험 과대평가 | 조직 진단, 리더십 협업, 제도 설계 | P1 |

### I. 자격/라이선스/도메인 지식이 사실상 진입장벽인 케이스

| 중분류 | 소분류 특수 케이스 | source 예시 | target 예시 | generic 오판 가능성 | 필요한 판정 포인트 | 우선순위 |
|---|---|---|---|---|---|---|
| 회계/세무 | 일반 재무/사무 → 세무/회계 | finance admin | tax/accounting | 숫자/문서 경험 과대평가 | K-GAAP/IFRS, 세법, 결산, 자격 | P0 |
| 안전/건설 | 운영/총무 → 안전관리/건설 PM | ops/admin | safety/construction | 운영·문서 경험 과대평가 | 법정 자격, 현장 안전, 공정관리 | P0 |
| 의료/제약 | 일반 QA/운영 → 제약/의료 QA/RA | QA/ops | pharma/medical QA/RA | 품질·문서 경험 과대평가 | GMP, validation, clinical/regulatory | P0 |
| 보안 | IT 운영 → 보안관리/정보보호 | IT ops | security | IT 경험 과대평가 | 취약점, 보안통제, 인증 대응 | P1 |
| 금융 | 일반 심사/운영 → 금융 리스크/심사 | ops/review | financial risk | 심사 경험 과대평가 | 금융상품, 규제, 리스크 모델 | P1 |

---

## 4. P0 우선순위 케이스 요약

| 우선순위 | 특수 케이스 | 이유 | 예상 영향 축 | 권장 처리 |
|---|---|---|---|---|
| P0 | B2C CS → B2B CSM | 고객응대 경험 때문에 CSM 적합도를 과대평가할 위험 | jobStructure, customerType, responsibilityScope | topRisks diagnostic |
| P0 | 제조 QA → IT QA/SQA | QA라는 이름은 같지만 검증 대상과 도구가 다름 | jobStructure, responsibilityScope | topRisks diagnostic |
| P0 | 일반 제조 QA → 의료기기/제약 QA/RA | 규제·인증 장벽이 generic 품질 경험보다 중요 | industryContext, jobStructure | topRisks diagnostic |
| P0 | 공공행정/문서행정 → RA/인증/컴플라이언스 | 문서·규정 경험을 과대평가하기 쉬움 | industryContext, jobStructure, responsibilityScope | topRisks diagnostic |
| P0 | 영업관리/운영관리 → 사업기획/전략기획 | 수치·운영 경험과 의사결정 산출물의 레벨 차이 | responsibilityScope, roleCharacter | topRisks diagnostic |
| P0 | 일반 운영 → 생산관리/SCM/안전관리 | 운영이라는 단어는 같지만 현장·공급망·안전 맥락이 다름 | industryContext, jobStructure | topRisks diagnostic |
| P0 | 일반 재무/사무 → 회계/세무 | 숫자·문서 경험과 회계/세무 기준 적용은 다름 | jobStructure, responsibilityScope | topRisks diagnostic |

---

## 5. Special Transition Diagnostic Layer 권장 설계

**상태**: implemented/read-only diagnostic layer

### 5-1. 기본 방향

- **신규 파일 후보**: `src/lib/transitionLite/specialTransitionDiagnostics.js`
- **성격**: read-only pure rule layer
- score/gate 변경 없음
- ontology/registry에 pair metadata를 넣지 않음
- `buildTransitionLiteResult.js`에서 resolved current/target job/industry item을 받은 뒤 호출
- 첫 연결은 기존 `topRisks`에 diagnostic card 1개 append
- JSX 신규 UI 대공사 없이 기존 RiskList 렌더 구조 재사용 우선

### 5-2. 권장 호출 형태

```js
findSpecialTransitionDiagnostics({
  currentJobItem,
  targetJobItem,
  currentIndustryItem,
  targetIndustryItem,
  classification
})
```

### 5-3. 권장 rule shape

```js
{
  id: "SPECIAL_B2C_CS_TO_B2B_CSM",
  priority: 10,
  severity: "high",
  sourceMatchers: {
    job: {
      ids: [],
      majorCategories: [],
      subcategories: [],
      familyIds: [],
      labelIncludes: [],
      aliasIncludes: []
    },
    industry: {
      ids: [],
      sectors: [],
      subSectors: [],
      customerMarkets: [],
      labelIncludes: []
    }
  },
  targetMatchers: {
    job: {
      ids: [],
      majorCategories: [],
      subcategories: [],
      familyIds: [],
      labelIncludes: [],
      aliasIncludes: []
    },
    industry: {
      ids: [],
      sectors: [],
      subSectors: [],
      customerMarkets: [],
      labelIncludes: []
    }
  },
  title: "",
  reason: "",
  checkPoints: [],
  affectedAxes: [],
  recommendedPlacement: "topRisks"
}
```

---

## 6. 1차 구현 추천 P0 rule 3개

1. **B2C CS → B2B CSM**
2. **제조 QA → IT QA/SQA**
3. **일반 제조 QA → 의료기기/제약 QA/RA**

이유:
- generic alias/adjacency로 긍정 오판될 가능성이 가장 큼
- 유저가 결과를 봤을 때 "이건 진짜 내 전환 상황을 이해하고 있다"고 느끼기 쉬움
- score/gate를 건드리지 않고도 설명 품질 개선 효과가 큼

---

## 7. 최소 패치 플랜

| 단계 | 수정 파일 | anchor | 변경 내용 | 위험 | 검증 기준 |
|---|---|---|---|---|---|
| 1 | `src/lib/transitionLite/specialTransitionDiagnostics.js` | 신규 read-only 파일 | P0 rule table + pure matcher/export 함수 | 신규 파일 추가 | score/classification 변경 없음 |
| 2 | `src/lib/transitionLite/buildTransitionLiteResult.js` | classification, targetContext 생성 직후 | `findSpecialTransitionDiagnostics` 호출 | import 추가 | matched diagnostics 배열만 생성 |
| 3 | `src/lib/transitionLite/buildTransitionLiteResult.js` | buildTransitionLiteVM params | specialDiagnostics를 받아 topRisks 뒤에 최대 1개 append | 카드 수 증가 | 기존 topRisks 구조 유지 |
| 4 | `src/lib/transitionLite/buildTransitionLiteResult.js` | topRisks 조립 후 | diagnostic을 `{ key, title, body }` shape로 변환 | 문장 중복 | RiskList가 그대로 렌더 |
| 5 | `docs/PASSMAP_SOURCE_MAP.md` | transition-lite owner 목록 | 새 rule layer owner 추가 | 문서 갱신 필요 | planned owner 경로 명시 |

---

## 8. 경력/신입 적용 범위

| 분석 유형 | 공용 가능 여부 | 판단 |
|---|---|---|
| 경력 전환-lite | 우선 적용 가능 | current/target job/industry resolved item이 모두 있으므로 source→target pair diagnostic에 적합 |
| 신입 전환-lite | 후순위 | current job/industry가 없어서 source→target pair rule이 아니라 target barrier diagnostic으로 변질될 수 있음 |

**결론**: 1차 구현은 경력 전환-lite에만 적용하는 것이 안전하다.

---

## 9. 구현 금지선

- score/gate 직접 수정 금지
- `classifyTransition` 수정 금지
- `pickTransitionLiteRiskKeys` 수정 금지
- `buildAxisConnectivityPack` 수정 금지
- ontology/registry에 pair metadata 대량 추가 금지
- JSX 신규 UI 대공사 금지
- topRisks 카드 shape를 깨지 말 것
- 한 번에 P0 7개 전부 구현하지 말고 1차는 3개만 적용

---

## 10. 최종 결론

PASSMAP은 이미 generic 전환 판단 체계가 꽤 갖춰져 있으므로, 다음 단계는 generic rule을 더 늘리는 것이 아니라 특정 source→target 조합에서만 발생하는 비대칭 전환 리스크를 read-only diagnostic layer로 보강하는 것이다.

가장 안전한 구현 방향은 `src/lib/transitionLite/specialTransitionDiagnostics.js`를 새로 만들고, `buildTransitionLiteResult.js`에서 resolved current/target context를 받은 뒤 matching diagnostics를 찾아 기존 topRisks에 최대 1개 append하는 방식이다.

**현재 구현 완료**: B2C CS→B2B CSM부터 문서관리/사무지원→RA/인증까지 총 9개 rule이 적용되어 있다.

---

## 11. Implemented Rules Inventory

| rule id | source subVerticals | target subVerticals | priority | 단계 |
|---|---|---|---|---|
| SPECIAL_B2C_CS_TO_B2B_CSM | CUSTOMER_SUPPORT_CS | CUSTOMER_SUCCESS | 100 | P0 |
| SPECIAL_MFG_QA_TO_IT_QA_SQA | QUALITY_ASSURANCE_QA | QA_TEST_AUTOMATION | 90 | P0 |
| SPECIAL_MFG_QA_TO_REGULATED_QA_RA | QUALITY_ASSURANCE_QA + industry:MANUFACTURING | QUALITY_ASSURANCE_QA, REGULATORY_AFFAIRS + industry:HEALTHCARE_PHARMA_BIO | 80 | P0 |
| SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING | SALES_OPERATIONS, OPERATIONS_MANAGEMENT | BUSINESS_PLANNING, STRATEGY | 70 | P0 |
| SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS | OPERATIONS_MANAGEMENT | PRODUCTION_MANAGEMENT, DEMAND_SUPPLY_PLANNING, ENVIRONMENT_HEALTH_SAFETY | 60 | P0 |
| SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX | BUSINESS_SUPPORT | ACCOUNTING, TAX | 50 | P0 |
| SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES | PARTNER_CHANNEL_SALES, B2C_SALES | SOLUTION_SALES, B2B_SALES | 40 | P1 |
| SPECIAL_PERFORMANCE_MARKETING_TO_PMM | PERFORMANCE_MARKETING, CRM_MARKETING | PRODUCT_MARKETING_PMM | 30 | P1 |
| SPECIAL_DOC_ADMIN_TO_RA | DOCUMENT_ADMIN_SUPPORT | REGULATORY_AFFAIRS | 25 | P1 |

---

## 12. Current Implementation Status

### 12-1. 완료 상태

| 항목 | 현재 상태 |
|---|---|
| 구현 상태 | 구현 완료 |
| 구현 rule 수 | 총 9개 |
| rule layer | `src/lib/transitionLite/specialTransitionDiagnostics.js` |
| regression baseline | `scripts/regression/run-special-transition-diagnostics-baseline.mjs` |
| baseline cases | 총 32 cases |
| fire cases | 17 |
| silent cases | 15 |
| 최근 확인 결과 | `PASS: 32 / 32`, `fires: 17`, `silent: 15` |

### 12-2. 현재 구조

| 항목 | 상태 |
|---|---|
| score/gate/classification | 변경 없음 |
| `classifyTransition.js` | 변경 없음 |
| `buildTransitionLiteResult.js` | 기존 append 구조 유지 |
| `TransitionLiteResult.jsx` | 수정 없이 기존 `RiskList`/`topRisks` 렌더 재사용 |
| special diagnostic 노출 | `topRisks`에 최대 1개 append |
| 목적 | 점수 보정이 아니라 user-facing 설명 보강 |

### 12-3. 구현 완료 rule 상세

| 번호 | rule id | 전환 케이스 | 구현 상태 | 설명 목적 |
|---:|---|---|---|---|
| 1 | `SPECIAL_B2C_CS_TO_B2B_CSM` | B2C CS → B2B CSM | 구현 완료 | 고객응대 경험과 계정 성과 관리 책임 차이 설명 |
| 2 | `SPECIAL_MFG_QA_TO_IT_QA_SQA` | 품질 QA → IT QA/SQA | 구현 완료 | 품질보증 경험과 소프트웨어 테스트/개발 협업 방식 차이 설명 |
| 3 | `SPECIAL_MFG_QA_TO_REGULATED_QA_RA` | 제조 QA → 의료기기/제약 QA/RA | 구현 완료 | 일반 제조 품질 경험과 규제 산업 QA/RA 기준 차이 설명 |
| 4 | `SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING` | 영업관리/운영관리 → 사업기획/전략기획 | 구현 완료 | 운영·실행 경험과 의사결정용 기획 산출물 차이 설명 |
| 5 | `SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS` | 일반 운영 → 생산관리/SCM/안전관리 | 구현 완료 | 일반 운영 경험과 현장·납기·재고·안전 기준 차이 설명 |
| 6 | `SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX` | 경영지원/사무 → 회계/세무 | 구현 완료 | 숫자·문서 경험과 회계/세무 기준 적용 책임 차이 설명 |
| 7 | `SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES` | 채널/유통/B2C 영업 → 솔루션/B2B 영업 | 구현 완료 | 일반 판매 경험과 고객 문제 진단·제안·장기계약형 영업 차이 설명 |
| 8 | `SPECIAL_PERFORMANCE_MARKETING_TO_PMM` | 퍼포먼스/CRM 마케팅 → PMM/Product Marketing | 구현 완료 | 캠페인 성과 관리와 제품 메시지·출시 전략 차이 설명 |
| 9 | `SPECIAL_DOC_ADMIN_TO_RA` | 문서관리/사무지원 → RA/인증 | 구현 완료 | 문서 처리 경험과 규제 기준 적용/인증 문서 책임 차이 설명 |

---

## 13. Deferred Candidates

| 후보 | 상태 | 보류 이유 | 재검토 조건 |
|---|---|---|---|
| 일반 사무/운영 → CRM/ERP/RevOps | Deferred | CRM/ERP/RevOps 전용 target subVertical이 현재 없음. CRM 운영/RevOps는 `SALES_OPERATIONS`의 aliases/families로만 존재한다. `SALES_OPERATIONS`는 이미 Rule 4의 source로 사용 중이라 target으로 쓰면 source/target 역할이 꼬일 수 있다. | `CRM_OPERATIONS`, `ERP_OPERATIONS`, `REVOPS`, `BUSINESS_SYSTEMS_OPERATIONS` 같은 독립 target subVertical 추가 이후. 또는 `SALES_OPERATIONS`의 source/target 이중 역할 허용 정책 결정 이후. |

---

## 14. Next Candidate Backlog

### 14-1. P1 후보 — 다음 구현 검토 우선순위

| 우선순위 | 후보 | 의도 | 조사 필요 | 권장 상태 |
|---|---|---|---|---|
| P1-A | 브랜드/콘텐츠 마케팅 → PMM/Product Marketing | 브랜드마케팅이나 콘텐츠마케팅 경험은 PMM과 연결될 수 있지만, 기존 Rule 8의 퍼포먼스/CRM → PMM과 성격이 다르다. PMM은 제품 포지셔닝, 출시 메시지, 세일즈 enablement, 제품 가치 전달 구조가 핵심이다. | `BRAND_MARKETING`, `CONTENT_MARKETING`, `PRODUCT_MARKETING_PMM` 존재 여부. 기존 `SPECIAL_PERFORMANCE_MARKETING_TO_PMM`과 중복/충돌 여부. 브랜드마케팅→PMM fire 여부와 콘텐츠마케팅→PMM silent 여부. | Candidate |
| P1-B | HR 운영/채용운영/교육운영 → HRBP/조직개발/HR제도기획 | 채용운영, 교육운영, HR admin 경험은 HR 직무와 연결되지만, HRBP/조직개발/제도기획은 조직 이슈 진단, 리더십 협업, 평가/보상/제도 설계 책임이 중요하다. | `HR_OPERATIONS`, `RECRUITING_OPERATIONS`, `TRAINING_OPERATIONS` source 존재 여부. `HRBP`, `ORGANIZATION_DEVELOPMENT`, `HR_PLANNING`, `COMPENSATION_BENEFITS` target 존재 여부. 운영형 HR과 기획/진단형 HR 구분 가능 여부. | Candidate |
| P1-C | IT 운영/시스템관리 → 보안/정보보호/GRC | IT 운영/시스템관리 경험은 보안 직무와 연결될 수 있지만, 정보보호/GRC/보안정책은 통제, 인증, 취약점, 위험관리, 감사 대응 책임이 중요하다. | `IT_OPERATIONS_SYSTEMS_MANAGEMENT` source 존재 여부. `INFORMATION_SECURITY`, `SECURITY_POLICY`, `GRC`, `PRIVACY`, `ISMS`, `SECURITY_COMPLIANCE` target 존재 여부. 보안 직무가 IT 인프라 운영과 별도 subVertical인지 확인. | Candidate |
| P1-D | SMB/B2B 영업 → Enterprise/Key Account 영업 | B2B 영업 경험은 Enterprise/Key Account 영업과 연결되지만, 엔터프라이즈 영업은 구매위원회, 장기 세일즈 사이클, RFP/조달, 다중 이해관계자 관리, 대형 계약 구조가 중요하다. | `B2B_SALES` source 존재 여부. `ENTERPRISE_SALES`, `KEY_ACCOUNT_MANAGEMENT`, `STRATEGIC_ACCOUNT`, `ACCOUNT_EXECUTIVE` target 존재 여부. 현재 `SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES`와 중복 여부. target이 `B2B_SALES`와 같은 subVertical이면 보류. | Candidate |

### 14-2. P2 후보 — 후순위 검토

| 우선순위 | 후보 | 의도 | 조사 필요 | 권장 상태 |
|---|---|---|---|---|
| P2-A | CS/VOC → CX기획/Product Ops/서비스기획 | CS/VOC 경험은 고객 문제를 많이 접했다는 점에서 CX기획/Product Ops/서비스기획과 연결될 수 있다. 목표 직무는 단순 응대가 아니라 고객 문제를 구조화하고 제품/운영 개선으로 연결하는 책임이 중요하다. | `CUSTOMER_SUPPORT_CS` source, `CX_PLANNING`, `PRODUCT_OPERATIONS`, `SERVICE_PLANNING` target 존재 여부. 기존 `SPECIAL_B2C_CS_TO_B2B_CSM`과 중복 여부. | P2 Candidate |
| P2-B | 물류/배송 운영 → SCM Planning | 물류/배송 운영은 SCM과 연결되지만, SCM Planning은 단순 물류 실행보다 수요예측, S&OP, 공급망 조율, 재고 최적화가 중요하다. | `LOGISTICS_OPERATIONS` source, `DEMAND_SUPPLY_PLANNING` target 존재 여부. 기존 `SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS`와 중복 여부. | P2 Candidate |
| P2-C | 법무/총무/문서관리 → 개인정보/보안정책 | 법무·총무·문서관리 경험은 규정과 문서 처리 측면에서 개인정보/보안정책과 연결될 수 있다. 다만 개인정보/보안정책은 정보보호 통제, 개인정보 처리 기준, 내부 정책 설계 책임이 중요하다. | `LEGAL`, `GENERAL_AFFAIRS`, `DOCUMENT_ADMIN_SUPPORT` source 존재 여부. `PRIVACY`, `SECURITY_POLICY`, `INFORMATION_SECURITY` target 존재 여부. IT 보안/GRC rule과 중복 여부. | P2 Candidate |

---

## 15. 운영 원칙

1. rule 추가는 항상 regression baseline case 추가와 세트로 진행한다.
2. `specialTransitionDiagnostics`는 score/gate/classification을 수정하지 않는다.
3. `topRisks`에는 special diagnostic을 최대 1개만 append한다.
4. 기존 rule보다 특수성이 낮은 rule은 낮은 priority를 사용한다.
5. ontology에 source/target subVertical이 명확하지 않으면 rule을 만들지 않는다.
6. aliases/families에만 존재하는 개념은 독립 rule target으로 쓰기 전에 충돌 가능성을 먼저 검토한다.
7. 문장은 항상 3단 구조를 유지한다: 기존 경험 중 연결되는 부분 인정, 목표 직무/산업에서 추가로 보는 기준 설명, 서류에서 더 설득력 있게 보여줘야 할 포인트 제시.
8. rule을 늘리기 전에 실제 UI에서 카드 노출 위치와 중복감을 확인한다.
9. P1 이후부터는 “구현 가능성 조사 → 구현 → baseline 추가 → verification” 순서로만 진행한다.
10. CRM/ERP/RevOps처럼 ontology가 부족한 후보는 rule이 아니라 ontology 보강 과제로 분리한다.
