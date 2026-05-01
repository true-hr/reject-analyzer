# PASSMAP Work Record Preset Coverage

> Last updated: 2026-04-28
> 관련 파일: `src/data/workRecord/jobExtensionRegistry.js`

---

## 1. Purpose

이 문서는 업무/이력서관리 화면의 직무별 추천 chip preset 커버리지 현황을 관리하기 위한 문서입니다.

어떤 직무에 맞춤 chip이 있는지, 어떤 직무가 fallback으로 빠지는지 한눈에 파악하고, 향후 확장 작업의 우선순위를 관리하기 위해 작성합니다.

---

## 2. Current Data Flow

```
App.jsx — currentCareerRoleContext.jobId
  ↓
PmMvpView — currentJobId prop
  ↓
getRecordPresetByJobId(currentJobId)  ← jobExtensionRegistry.js
  ↓
recordPreset
  ↓
<PmRecordInput key={recordPreset.jobId} recordPreset={recordPreset} />
  ↓
TagEditorSection — chip 렌더링
  (trackWorkTypePresets / collaborationExtensions / followUpExtensions)
```

`key={recordPreset.jobId}` 를 통해 직무가 바뀔 때 컴포넌트를 remount하여 useState lazy initializer가 새 preset으로 재실행됩니다.

---

## 3. Registry Summary

| 항목 | 수치 |
|---|---|
| 전체 ontology jobId 수 | **117개** |
| jobExtensionRegistry.js 등록 jobId 수 | **117개** |
| 개별 preset (1:1 매핑) | **117개** |
| 그룹공유 (2+ jobId → 1 파일) | **0개** (Round 6-C 이후 모두 분리 완료) |
| fallback 대상 jobId 수 | **0개** (전체 커버 완료) |

**ontology jobId 구조 참고:**
- 신형 구조 (114개): `vertical` + `subVertical` → `JOB_{VERTICAL}_{SUBVERTICAL}`
- 구형 구조 (3개): `majorCategory` + `subcategory` + 명시 `id`
  - `JOB_BUSINESS_STRATEGY`, `JOB_SALES_SALES_OPERATIONS`, `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`

**파일 현황:**
- `src/data/workRecord/jobExtensions/`: 117개 파일 (Wave 10-B에서 orphan 1개 삭제 완료)
- `marketing_planning.js`: Wave 10-B에서 삭제 완료 (orphan, 잘못된 jobId 보유)

**참고 — marketing ontology alias/stub 파일:**
- `src/data/job/ontology/marketing/pr_communication.js` 및 `src/data/job/ontology/marketing/market_research_marketing_research.js`는 실제 jobId를 새로 정의하는 파일이 아니라, 기존 ontology 파일을 다시 export하는 alias/stub 파일입니다.
- 실제 jobId는 각각 `pr_communications.js`(subVertical: PR_COMMUNICATIONS), `marketing_research.js`(subVertical: MARKETING_RESEARCH)에서 정의됩니다.
- 따라서 유효 ontology jobId 수는 **117개**이며, registry coverage는 **117/117**로 유지됩니다.

---

## 4. Registered Preset Table

| # | jobId | label | preset file | status | note |
|---|---|---|---|---|---|
| 1 | JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT | 프로덕트매니지먼트 | product_management.js | fallback-owner | 미등록 직무의 ?? fallback으로도 사용됨 |
| 2 | JOB_BUSINESS_PROJECT_MANAGEMENT | 프로젝트관리(PM) | project_management_pm.js | individual | |
| 3 | JOB_MARKETING_BRAND_MARKETING | 브랜드마케팅 | brand_marketing.js | individual | |
| 4 | JOB_MARKETING_PERFORMANCE_MARKETING | 퍼포먼스마케팅 | performance_marketing.js | individual | |
| 5 | JOB_MARKETING_CONTENT_MARKETING | 콘텐츠마케팅 | content_marketing.js | individual | |
| 6 | JOB_MARKETING_DIGITAL_MARKETING | 디지털마케팅 | digital_marketing.js | individual | |
| 7 | JOB_MARKETING_CRM_MARKETING | CRM마케팅 | crm_marketing.js | individual | |
| 8 | JOB_MARKETING_PRODUCT_MARKETING_PMM | 프로덕트마케팅(PMM) | product_marketing_pmm.js | individual | |
| 9 | JOB_BUSINESS_SERVICE_PLANNING | 서비스기획 | service_planning.js | individual | |
| 10 | JOB_BUSINESS_STRATEGY | 전략기획 | business_strategy.js | individual | 구형 ontology 구조 (id 명시) |
| 11 | JOB_SALES_GENERAL_SALES | 일반영업 | sales_management.js | individual | 구 그룹 파일 1:1로 축소 |
| 12 | JOB_SALES_B2B_SALES | B2B영업 | b2b_sales.js | individual | |
| 13 | JOB_HR_ORGANIZATION_RECRUITING | 채용 | hr_recruiting.js | individual | |
| 14 | JOB_HR_ORGANIZATION_HR_PLANNING | 인사기획 | hr_planning.js | individual | |
| 15 | JOB_HR_ORGANIZATION_HRBP | HRBP | hrbp.js | individual | |
| 16 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | 회계 | accounting_tax.js | individual | 구 그룹 파일 1:1로 축소 |
| 17 | JOB_FINANCE_ACCOUNTING_TAX | 세무 | tax.js | individual | |
| 18 | JOB_FINANCE_ACCOUNTING_FP_AND_A | FP&A | fp_and_a.js | individual | |
| 19 | JOB_IT_DATA_DIGITAL_DATA_ANALYSIS | 데이터분석 | data_analysis.js | individual | 구 그룹 파일 1:1로 축소 |
| 20 | JOB_IT_DATA_DIGITAL_DATA_SCIENCE | 데이터사이언스 | data_science.js | individual | |
| 21 | JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT | 백엔드개발 | backend_development.js | individual | |
| 22 | JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT | 프론트엔드개발 | frontend_development.js | individual | |
| 23 | JOB_IT_DATA_DIGITAL_FULLSTACK_DEVELOPMENT | 풀스택개발 | fullstack_development.js | individual | |
| 24 | JOB_DESIGN_UX_DESIGN | UX디자인 | ux_design.js | individual | Wave 7-A |
| 25 | JOB_DESIGN_UI_DESIGN | UI디자인 | ui_design.js | individual | Wave 7-A |
| 26 | JOB_DESIGN_PRODUCT_DESIGN | 프로덕트디자인 | product_design.js | individual | Wave 7-A |
| 27 | JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS | CS(고객지원) | cs.js | individual | Wave 7-A |
| 28 | JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS | Customer Success | customer_success.js | individual | Wave 7-A |
| 29 | JOB_BUSINESS_BUSINESS_DEVELOPMENT | 사업개발(BD) | business_development.js | individual | Wave 7-A |
| 30 | JOB_IT_DATA_DIGITAL_DATA_ENGINEERING | 데이터엔지니어링 | data_engineering.js | individual | Wave 7-B |
| 31 | JOB_IT_DATA_DIGITAL_DEVOPS_INFRA | DevOps/인프라 | devops_infra.js | individual | Wave 7-B |
| 32 | JOB_IT_DATA_DIGITAL_MOBILE_DEVELOPMENT | 모바일개발 | mobile_development.js | individual | Wave 7-B |
| 33 | JOB_IT_DATA_DIGITAL_AI_ML_ENGINEERING | AI/ML엔지니어링 | ai_ml_engineering.js | individual | Wave 7-B |
| 34 | JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION | QA/Test Automation | qa_test_automation.js | individual | Wave 7-B |
| 35 | JOB_IT_DATA_DIGITAL_SECURITY | 보안 | security.js | individual | Wave 7-B |
| 36 | JOB_FINANCE_ACCOUNTING_FINANCE | 재무 | finance.js | individual | Wave 7-C |
| 37 | JOB_FINANCE_ACCOUNTING_TREASURY | 자금 | treasury.js | individual | Wave 7-C |
| 38 | JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING | 관리회계 | management_accounting.js | individual | Wave 7-C |
| 39 | JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE | IR/공시 | ir_disclosure.js | individual | Wave 7-C |
| 40 | JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL | 내부통제 | internal_control.js | individual | Wave 7-C |
| 41 | JOB_SALES_SALES_OPERATIONS | 세일즈옵스 | sales_operations.js | individual | Wave 7-C, 구형 ontology |
| 42 | JOB_SALES_TECHNICAL_SALES | 기술영업 | technical_sales.js | individual | Wave 7-D |
| 43 | JOB_SALES_SOLUTION_SALES | 솔루션영업 | solution_sales.js | individual | Wave 7-D |
| 44 | JOB_SALES_OVERSEAS_SALES | 해외영업 | overseas_sales.js | individual | Wave 7-D |
| 45 | JOB_SALES_PROPOSAL_SALES | 제안영업 | proposal_sales.js | individual | Wave 7-D |
| 46 | JOB_SALES_PARTNER_CHANNEL_SALES | 파트너/채널영업 | partner_channel_sales.js | individual | Wave 7-D |
| 47 | JOB_SALES_KEY_ACCOUNT_MANAGEMENT | Key Account Management | key_account_management.js | individual | Wave 7-D |
| 48 | JOB_HR_ORGANIZATION_LEARNING_OD | 교육/조직개발 | learning_od.js | individual | Wave 7-E |
| 49 | JOB_HR_ORGANIZATION_TALENT_DEVELOPMENT | 인재육성 | talent_development.js | individual | Wave 7-E |
| 50 | JOB_HR_ORGANIZATION_COMPENSATION_BENEFITS | 보상/복리후생 | compensation_benefits.js | individual | Wave 7-E |
| 51 | JOB_HR_ORGANIZATION_LABOR_RELATIONS | 노무 | labor_relations.js | individual | Wave 7-E |
| 52 | JOB_HR_ORGANIZATION_HR_OPS | HR Ops | hr_ops.js | individual | Wave 7-E |
| 53 | JOB_CUSTOMER_OPERATIONS_COMMUNITY_OPERATIONS | 커뮤니티 운영 | community_ops.js | individual | Wave 7-F |
| 54 | JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS | 서비스 운영 | service_ops.js | individual | Wave 7-F |
| 55 | JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING | 운영기획 | operation_planning.js | individual | Wave 7-F |
| 56 | JOB_CUSTOMER_OPERATIONS_QUALITY_OPERATIONS | 품질운영 | quality_ops.js | individual | Wave 7-F |
| 57 | JOB_CUSTOMER_OPERATIONS_BACKOFFICE_OPERATIONS | 백오피스 | backoffice.js | individual | Wave 7-F |
| 58 | JOB_DESIGN_BX_BRAND_DESIGN | BX/브랜드디자인 | bx_brand_design.js | individual | Wave 7-G |
| 59 | JOB_DESIGN_GRAPHIC_DESIGN | 그래픽디자인 | graphic_design.js | individual | Wave 7-G |
| 60 | JOB_DESIGN_MOTION_DESIGN | 모션디자인 | motion_design.js | individual | Wave 7-G |
| 61 | JOB_DESIGN_CONTENT_DESIGN | 콘텐츠디자인 | content_design.js | individual | Wave 7-G |
| 62 | JOB_DESIGN_INDUSTRIAL_DESIGN | 산업디자인 | industrial_design.js | individual | Wave 7-G |
| 63 | JOB_BUSINESS_OPERATIONS_MANAGEMENT | 운영관리 | operations_management.js | individual | Wave 8-A |
| 64 | JOB_BUSINESS_BUSINESS_PLANNING | 사업기획 | business_planning.js | individual | Wave 8-A |
| 65 | JOB_BUSINESS_BUSINESS_SUPPORT | 경영지원 | business_support.js | individual | Wave 8-A |
| 66 | JOB_SALES_B2C_SALES | B2C영업 | b2c_sales.js | individual | Wave 8-A |
| 67 | JOB_PROCUREMENT_SCM_PURCHASING | 구매 | procurement.js | individual | Wave 8-B |
| 68 | JOB_PROCUREMENT_SCM_STRATEGIC_SOURCING | 전략구매 | strategic_sourcing.js | individual | Wave 8-B |
| 69 | JOB_PROCUREMENT_SCM_SCM | SCM | scm.js | individual | Wave 8-B |
| 70 | JOB_PROCUREMENT_SCM_LOGISTICS | 물류관리 | logistics_management.js | individual | Wave 8-B |
| 71 | JOB_PROCUREMENT_SCM_DEMAND_SUPPLY_PLANNING | 수요/공급계획 | demand_supply_planning.js | individual | Wave 8-B |
| 72 | JOB_PROCUREMENT_SCM_INVENTORY_MANAGEMENT | 재고관리 | material_management.js | individual | Wave 8-B |
| 73 | JOB_PROCUREMENT_SCM_SUPPLIER_VENDOR_MANAGEMENT | 협력사관리 | supplier_management.js | individual | Wave 8-B |
| 74 | JOB_PROCUREMENT_SCM_PROCUREMENT | 조달 | procurement_operations.js | individual | Wave 8-B-1 |
| 75 | JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT | 생산관리 | production_management.js | individual | Wave 8-C-1 |
| 76 | JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL | 품질관리(QC) | quality_control_mfg.js | individual | Wave 8-C-1 |
| 77 | JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA | 품질보증(QA) | quality_assurance_mfg.js | individual | Wave 8-C-1 |
| 78 | JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING | 공정기술 | process_engineering.js | individual | Wave 8-C-1 |
| 79 | JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING | 생산기술 | production_engineering.js | individual | Wave 8-C-1 |
| 80 | JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE | 설비관리 / 유지보수 | equipment_maintenance.js | individual | Wave 8-C-2 |
| 81 | JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY | 안전환경 | environment_health_safety.js | individual | Wave 8-C-2 |
| 82 | JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION | 제조혁신 / 생산혁신 | manufacturing_innovation.js | individual | Wave 8-C-2 |
| 83 | JOB_MANUFACTURING_QUALITY_PRODUCTION_AUTOMATION_CONTROL | 설비제어 / 자동제어 | automation_control.js | individual | Wave 8-C-2 |
| 84 | JOB_IT_DATA_DIGITAL_IT_PLANNING | IT 기획 | it_planning.js | individual | Wave 9-A |
| 85 | JOB_IT_DATA_DIGITAL_IT_OPERATIONS_SYSTEMS_MANAGEMENT | IT 운영 / 시스템관리 | it_operations_systems_management.js | individual | Wave 9-A |
| 86 | JOB_MARKETING_PR_COMMUNICATIONS | PR / 커뮤니케이션 | pr_communications.js | individual | Wave 9-A |
| 87 | JOB_MARKETING_MARKETING_RESEARCH | 시장조사 / 마케팅리서치 | marketing_research.js | individual | Wave 9-A |
| 88 | JOB_EDUCATION_COUNSELING_COACHING_EDUCATION_OPERATIONS | 교육운영 | education_operations.js | individual | Wave 9-B |
| 89 | JOB_EDUCATION_COUNSELING_COACHING_CORPORATE_TRAINING | 기업교육 | corporate_training.js | individual | Wave 9-B |
| 90 | JOB_EDUCATION_COUNSELING_COACHING_CAREER_COACHING | 커리어코칭 | career_coaching.js | individual | Wave 9-B |
| 91 | JOB_EDUCATION_COUNSELING_COACHING_CAREER_COUNSELING | 진로상담 | career_counseling.js | individual | Wave 9-B |
| 92 | JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN | 학습설계 | learning_design.js | individual | Wave 9-B |
| 93 | JOB_EDUCATION_COUNSELING_COACHING_JOB_TRAINING | 직무교육 | job_training.js | individual | Wave 9-B |
| 94 | JOB_EDUCATION_COUNSELING_COACHING_FACILITATION | 퍼실리테이션 | facilitation.js | individual | Wave 9-B |
| 95 | JOB_RESEARCH_PROFESSIONAL_CONSULTING | 컨설팅 | consulting.js | individual | Wave 9-C |
| 96 | JOB_RESEARCH_PROFESSIONAL_LEGAL | 법무 | legal.js | individual | Wave 9-C |
| 97 | JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH | 시장/산업연구 | market_industry_research.js | individual | Wave 9-C |
| 98 | JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH | 기술연구 | technical_research.js | individual | Wave 9-C |
| 99 | JOB_RESEARCH_PROFESSIONAL_PATENT_INTELLECTUAL_PROPERTY | 특허 / 지식재산 | patent_intellectual_property.js | individual | Wave 9-C |
| 100 | JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS | 규제대응 / RA | regulatory_affairs.js | individual | Wave 9-C-2 |
| 101 | JOB_RESEARCH_PROFESSIONAL_EXPERT_REVIEW_EVALUATION | 전문심사 / 평가 | expert_review_evaluation.js | individual | Wave 9-C-2 |
| 102 | JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH | 정책연구 | policy_research.js | individual | Wave 9-C-2 |
| 103 | JOB_PUBLIC_ADMINISTRATION_SUPPORT_ADMINISTRATION | 행정 | administration.js | individual | Wave 9-D |
| 104 | JOB_PUBLIC_ADMINISTRATION_SUPPORT_EXTERNAL_RELATIONS | 대외협력 | external_relations.js | individual | Wave 9-D |
| 105 | JOB_PUBLIC_ADMINISTRATION_SUPPORT_DOCUMENT_ADMIN_SUPPORT | 문서관리 / 사무지원 | document_admin_support.js | individual | Wave 9-D |
| 106 | JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS | 공공사업 운영 | public_program_operations.js | individual | Wave 9-D |
| 107 | JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT | 민원 / 현장지원 | civil_service_field_support.js | individual | Wave 9-D |
| 108 | JOB_PUBLIC_ADMINISTRATION_SUPPORT_POLICY_SUPPORT | 정책지원 | policy_support.js | individual | Wave 9-D |
| 109 | JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT | 소프트웨어개발 | eng_software_development.js | individual | Wave 9-E |
| 110 | JOB_ENGINEERING_DEVELOPMENT_EMBEDDED_DEVELOPMENT | 임베디드개발 | embedded_development.js | individual | Wave 9-E |
| 111 | JOB_ENGINEERING_DEVELOPMENT_TESTING_VALIDATION | 테스트 / 검증 | eng_testing_validation.js | individual | Wave 9-E |
| 112 | JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING | 기술지원 / 필드엔지니어 | technical_support_field_engineering.js | individual | Wave 9-E |
| 113 | JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT | 연구개발(R&D) | research_and_development.js | individual | Wave 9-E |
| 114 | JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN | 기구설계 | mechanical_design.js | individual | Wave 9-F |
| 115 | JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN | 회로설계 | circuit_design.js | individual | Wave 9-F |
| 116 | JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN | 전장/전기설계 | electrical_design.js | individual | Wave 9-F |
| 117 | JOB_ENGINEERING_DEVELOPMENT_SYSTEMS_ENGINEERING | 시스템엔지니어 | systems_engineering.js | individual | Wave 9-F |

---

## 5. Grouped Presets Remaining

Round 6-C 완료 기준으로 그룹공유(2+ jobId → 1 파일) 항목은 **없습니다.**

구 그룹 파일들은 현재 1:1 매핑 상태입니다:

| 파일 | 현재 연결된 jobId | 상태 |
|---|---|---|
| sales_management.js | GENERAL_SALES (1개) | 1:1로 축소됨 |
| accounting_tax.js | ACCOUNTING (1개) | 1:1로 축소됨 |
| data_analysis.js | DATA_ANALYSIS (1개) | 1:1로 축소됨 |
| marketing_planning.js | 없음 | orphan (삭제 금지, deprecated 후보) |

---

## 6. Recommended Next Expansion Waves

### Wave 7 — ✅ 완료 (Wave 7-A)

Wave 7 대상 6개 항목 모두 등록 완료. 잔여 고우선순위 직무는 Wave 8로 이동.

### Wave 8 — ✅ 완료 (Wave 7-B)

Wave 8 대상 IT/데이터 6개 항목 모두 등록 완료. 잔여 고우선순위 직무는 Wave 9로 이동.

### Wave 9 — ✅ 완료 (Wave 7-C)

Wave 9 대상 재무/회계 5개 + 세일즈옵스 1개 등록 완료. 잔여 고우선순위 직무는 Wave 10으로 이동.

### Wave 10 — ✅ 완료 (Wave 7-D)

Wave 10 대상 영업 세부 직무 6개 모두 등록 완료. 잔여 직무는 Wave 11로 이동.

### Wave 11 — ✅ 완료 (Wave 7-E)

Wave 11 대상 HR/조직 직무 5개 모두 등록 완료. 잔여 직무는 Wave 12로 이동.

### Wave 12 — 1순위 (즉시 추가 권장)

| jobId | label | 이유 |
|---|---|---|
| JOB_SALES_B2C_SALES | B2C영업 | 소비자 대면 판매 chip, 일반영업과 다름 |

### Wave 9 — 2순위 (차별화 있음, 다음 단계 추천)

| jobId | label | 이유 |
|---|---|---|
| JOB_SALES_SOLUTION_SALES | 솔루션영업 | 솔루션 제안/도입 컨설팅, 기술영업과 일부 다름 |
| JOB_SALES_KEY_ACCOUNT_MANAGEMENT | KAM | 핵심계정 관리/장기 관계 관리 chip |
| JOB_SALES_SALES_OPERATIONS | 세일즈옵스 | 영업 프로세스/데이터/RevOps chip (일반영업과 다름) |
| JOB_SALES_OVERSEAS_SALES | 해외영업 | 무역/바이어/해외법인 chip |
| JOB_HR_ORGANIZATION_LEARNING_OD | L&OD | HRD/조직개발/교육설계 chip |
| JOB_HR_ORGANIZATION_COMPENSATION_BENEFITS | 보상/복리후생 | 급여설계/복지제도/연봉협상 chip |
| JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING | 관리회계 | 원가/수익성/부문별 손익 chip |
| JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE | IR/공시 | 공시자료/투자자IR/지분구조 chip |
| JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION | QA/테스트자동화 | 테스트케이스/자동화/결함관리 chip |
| JOB_IT_DATA_DIGITAL_SECURITY | 보안 | 취약점/침해사고/컴플라이언스 chip |
| JOB_IT_DATA_DIGITAL_IT_PLANNING | IT기획 | IT전략/시스템기획/RFP chip |
| JOB_DESIGN_BX_BRAND_DESIGN | BX/브랜드디자인 | 브랜드아이덴티티/BI/디자인시스템 chip |
| JOB_BUSINESS_BUSINESS_PLANNING | 사업기획 | 신규사업/기획서/KPI chip |
| JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS | 서비스운영 | SLA/운영효율/프로세스개선 chip |
| JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING | 운영기획 | 운영전략/효율화/대시보드 chip |

### Wave 10 — 3순위 (fallback으로 유지 가능)

| 대분류 | 해당 직무 | 이유 |
|---|---|---|
| ENGINEERING_DEVELOPMENT | 임베디드/회로/기계/전기설계 등 9개 | 제조/HW 직군, 현재 수요 낮음 |
| PROCUREMENT_SCM | 구매/SCM/물류 등 8개 | 도메인 전문성 필요 |
| PUBLIC_ADMINISTRATION_SUPPORT | 행정/공공사업 등 6개 | 공공 특화 직군 |
| RESEARCH_PROFESSIONAL | 컨설팅/법무/특허 등 8개 | 전문직 특화 |
| EDUCATION_COUNSELING_COACHING | 교육/코칭 등 7개 | 특수 도메인 |
| HR 잔여 | LABOR_RELATIONS, HR_OPS, TALENT_DEVELOPMENT | 채용/기획/HRBP와 일부 중복 |
| Design 잔여 | GRAPHIC, MOTION, CONTENT, INDUSTRIAL | UX/UI/Product 이후 우선순위 |

---

## 7. Preset Writing Rules

향후 preset 추가 시 지켜야 할 규칙입니다.

### 필수 shape

```js
export const EXAMPLE_RECORD_PRESET = {
  jobId: "JOB_{VERTICAL}_{SUBVERTICAL}",  // ontology에서 확인한 실제 값만
  label: "직무명",
  workTypeExtensions: [],                  // 현재 미사용, 빈 배열 유지
  trackWorkTypePresets: {
    weekly: ["업무유형1", "업무유형2", ...],   // plain string 배열 OK
    project: ["업무유형1", ...],
  },
  collaborationExtensions: [
    { id: "prefix_collab_key", label: "협업 대상" },  // { id, label } 객체 필수
    ...
  ],
  followUpExtensions: [
    { id: "prefix_result_key", label: "성과/변화" },  // { id, label } 객체 필수
    ...
  ],
  placeholders: {
    weekly: "예: ...",
    project: "",
  },
  sampleRecords: {
    weekly: { text: "...", roleTags: [...], collaborationTags: [...], resultTags: [...] },
  },
};
```

### 금지 사항

- `collaborationExtensions` / `followUpExtensions`에 plain string 배열 사용 금지
  - `mapLabels(items)` 가 `item.label`을 읽으므로 문자열이면 모두 undefined → 빈 chip 렌더링
- 임의 jobId 생성 금지 — 반드시 ontology 파일에서 확인
- analyzer.js / transitionLite / buildNewgradAxisPack.js / 점수 로직 수정 금지
- App.jsx / PmMvpView.jsx / PmRecordInput.jsx / UI 컴포넌트 수정 금지
- 기존 fallback/group 파일 삭제 금지

### jobId 확인 방법

**신형 구조** (대부분의 파일):
```
vertical: "MARKETING",  subVertical: "BRAND_MARKETING"
→ JOB_MARKETING_BRAND_MARKETING
```

**구형 구조** (strategy.js, sales_operations.js, product_management.js):
```
majorCategory: "BUSINESS",  subcategory: "STRATEGY",  id: "JOB_BUSINESS_STRATEGY"
→ id 필드값을 그대로 사용
```

---

## 8. Recent Completed Waves

| Wave | 내용 | 추가/변경 파일 |
|---|---|---|
| 초기 | 프로덕트매니지먼트 preset 최초 등록 | product_management.js |
| PM 개별화 | 프로젝트관리(PM) 개별 preset 추가 | project_management_pm.js |
| Round 6-A | 마케팅 5개 + 서비스기획 개별 분리 (marketing_planning.js 그룹 해체) | brand_marketing.js, performance_marketing.js, content_marketing.js, digital_marketing.js, crm_marketing.js, service_planning.js |
| Round 6-B | IT/개발/데이터 4개 개별 분리 + DATA_SCIENCE 신규 추가 | backend_development.js, frontend_development.js, fullstack_development.js, data_science.js |
| Round 6-C | B2B영업 / 세무 개별 분리 | b2b_sales.js, tax.js |
| Round 6-D | PMM / 전략기획 / 인사기획 / HRBP / FP&A 신규 추가 | product_marketing_pmm.js, business_strategy.js, hr_planning.js, hrbp.js, fp_and_a.js |
| Wave 7-A | UX디자인 / UI디자인 / 프로덕트디자인 / CS / Customer Success / 사업개발 신규 추가 | ux_design.js, ui_design.js, product_design.js, cs.js, customer_success.js, business_development.js |
| Wave 7-B | 데이터엔지니어링 / DevOps인프라 / 모바일개발 / AI-ML엔지니어링 / QA / 보안 신규 추가 | data_engineering.js, devops_infra.js, mobile_development.js, ai_ml_engineering.js, qa_test_automation.js, security.js |
| Wave 7-C | 재무 / 자금 / 관리회계 / IR공시 / 내부통제 / 세일즈옵스 신규 추가 | finance.js, treasury.js, management_accounting.js, ir_disclosure.js, internal_control.js, sales_operations.js |
| Wave 7-D | 기술영업 / 솔루션영업 / 해외영업 / 제안영업 / 파트너채널영업 / KAM 신규 추가 | technical_sales.js, solution_sales.js, overseas_sales.js, proposal_sales.js, partner_channel_sales.js, key_account_management.js |
| Wave 7-E | 교육조직개발 / 인재육성 / 보상복리후생 / 노무 / HR Ops 신규 추가 | learning_od.js, talent_development.js, compensation_benefits.js, labor_relations.js, hr_ops.js |
| Wave 7-F | 커뮤니티운영 / 서비스운영 / 운영기획 / 품질운영 / 백오피스 신규 추가 | community_ops.js, service_ops.js, operation_planning.js, quality_ops.js, backoffice.js |
| Wave 7-G | BX브랜드디자인 / 그래픽디자인 / 모션디자인 / 콘텐츠디자인 / 산업디자인 신규 추가 | bx_brand_design.js, graphic_design.js, motion_design.js, content_design.js, industrial_design.js |
| Wave 8-A | 운영관리 / 사업기획 / 경영지원 / B2C영업 신규 추가 | operations_management.js, business_planning.js, business_support.js, b2c_sales.js |
| Wave 8-B | 구매 / 전략구매 / SCM / 물류관리 / 수요공급계획 / 재고관리 / 협력사관리 신규 추가 (수출입/통관 ontology 미존재 skip) | procurement.js, strategic_sourcing.js, scm.js, logistics_management.js, demand_supply_planning.js, material_management.js, supplier_management.js |
| Wave 8-B-1 | 조달 신규 추가 — PROCUREMENT_SCM 8/8 완전 커버 완료 | procurement_operations.js |
| Wave 8-C-1 | 생산관리 / 품질관리(QC) / 품질보증(QA) / 공정기술 / 생산기술 신규 추가 | production_management.js, quality_control_mfg.js, quality_assurance_mfg.js, process_engineering.js, production_engineering.js |
| Wave 8-C-2 | 설비관리 / 안전환경 / 제조혁신 / 설비제어 신규 추가 — MANUFACTURING_QUALITY_PRODUCTION 9/9 완전 커버 완료 | equipment_maintenance.js, environment_health_safety.js, manufacturing_innovation.js, automation_control.js |
| Wave 9-A | IT 기획 / IT 운영·시스템관리 / PR·커뮤니케이션 / 시장조사·마케팅리서치 신규 추가 — IT_DATA_DIGITAL 14/14, MARKETING 8/8 완전 커버 완료 | it_planning.js, it_operations_systems_management.js, pr_communications.js, marketing_research.js |
| Wave 9-B | 교육운영 / 기업교육 / 커리어코칭 / 진로상담 / 학습설계 / 직무교육 / 퍼실리테이션 신규 추가 — EDUCATION_COUNSELING_COACHING 7/7 완전 커버 완료 | education_operations.js, corporate_training.js, career_coaching.js, career_counseling.js, learning_design.js, job_training.js, facilitation.js |
| Wave 9-C | 컨설팅 / 법무 / 시장·산업연구 / 기술연구 / 특허·지식재산 신규 추가 — RESEARCH_PROFESSIONAL 5/8 커버 (잔여: 규제대응/RA, 전문심사/평가, 정책연구) | consulting.js, legal.js, market_industry_research.js, technical_research.js, patent_intellectual_property.js |
| Wave 9-C-2 | 규제대응/RA / 전문심사·평가 / 정책연구 신규 추가 — RESEARCH_PROFESSIONAL 8/8 완전 커버 완료 | regulatory_affairs.js, expert_review_evaluation.js, policy_research.js |
| Wave 9-D | 행정 / 대외협력 / 문서관리·사무지원 / 공공사업 운영 / 민원·현장지원 / 정책지원 신규 추가 — PUBLIC_ADMINISTRATION_SUPPORT 6/6 완전 커버 완료 | administration.js, external_relations.js, document_admin_support.js, public_program_operations.js, civil_service_field_support.js, policy_support.js |
| Wave 9-E | 소프트웨어개발 / 임베디드개발 / 테스트·검증 / 기술지원·필드엔지니어 / 연구개발(R&D) 신규 추가 — ENGINEERING_DEVELOPMENT 5/9 커버 (잔여: 기구설계, 회로설계, 전장/전기설계, 시스템엔지니어) | eng_software_development.js, embedded_development.js, eng_testing_validation.js, technical_support_field_engineering.js, research_and_development.js |
| Wave 9-F | 기구설계 / 회로설계 / 전장·전기설계 / 시스템엔지니어 신규 추가 — ENGINEERING_DEVELOPMENT 9/9 완전 커버 완료 / 전체 117개 jobId 100% 커버 달성 | mechanical_design.js, circuit_design.js, electrical_design.js, systems_engineering.js |

---

## 9. Ontology Coverage by Vertical

| vertical | 전체 jobId 수 | 등록 수 | 커버리지 |
|---|---|---|---|
| MARKETING | 8 | 8 | 100% |
| BUSINESS | 7 | 7 | 100% |
| SALES | 10 | 10 | 100% |
| HR_ORGANIZATION | 8 | 8 | 100% |
| FINANCE_ACCOUNTING | 8 | 8 | 100% |
| IT_DATA_DIGITAL | 14 | 14 | 100% |
| DESIGN | 8 | 8 | 100% |
| CUSTOMER_OPERATIONS | 7 | 7 | 100% |
| ENGINEERING_DEVELOPMENT | 9 | 9 | 100% ✅ |
| MANUFACTURING_QUALITY_PRODUCTION | 9 | 9 | 100% ✅ |
| EDUCATION_COUNSELING_COACHING | 7 | 7 | 100% ✅ |
| PROCUREMENT_SCM | 8 | 8 | 100% ✅ |
| PUBLIC_ADMINISTRATION_SUPPORT | 6 | 6 | 100% ✅ |
| RESEARCH_PROFESSIONAL | 8 | 8 | 100% ✅ |
| **합계** | **117** | **117** | **100% ✅ 전체 커버 완료** |

---

*이 문서는 업무기록 preset 확장 작업마다 갱신하세요.*
*코드 변경은 이 문서와 무관하게 registry에서 직접 관리됩니다.*
