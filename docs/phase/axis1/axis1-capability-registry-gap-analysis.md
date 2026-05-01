# Axis 1 Capability Registry Gap Analysis

- date: 2026-04-20
- scope: SAFE INVESTIGATION ONLY. No production patch.
- purpose: close remaining live-job coverage gaps before writing the full PASSMAP experienced axis1 capability registry body.

---

## Files Inspected

- `docs/axis1-capability-registry-draft.md`
- `docs/axis1-next-rollout-blueprint.md`
- `00_HQ/SSOT_Map.md`
- `src/data/job/jobOntology.index.js`
- `src/data/job/jobLookup.index.js`
- `src/data/job/ontology/sales/general_sales.js`
- `src/data/job/ontology/sales/sales_operations.js`
- `src/data/job/ontology/sales/key_account_management.js`
- `src/data/job/ontology/sales/proposal_sales.js`
- `src/data/job/ontology/marketing/brand_marketing.js`
- `src/data/job/ontology/marketing/crm_marketing.js`
- `src/data/job/ontology/marketing/digital_marketing.js`
- `src/data/job/ontology/business/business_planning.js`
- `src/data/job/ontology/business/business_development.js`
- `src/data/job/ontology/customer_operations/operation_planning.js`
- `src/data/job/ontology/hr_organization/hr_planning.js`
- `src/data/job/ontology/finance_accounting/management_accounting.js`
- `src/data/job/ontology/manufacturing_quality_production/production_management.js`
- `src/data/job/ontology/it_data_digital/product_management.js`
- `src/data/job/ontology/it_data_digital/it_planning.js`
- `src/data/job/ontology/research_professional/consulting.js`
- `src/data/job/ontology/procurement_scm/supplier_vendor_management.js`

---

## Drafted Jobs

- current draft registry size: 20 unique live jobs
- current draft file: `docs/axis1-capability-registry-draft.md`
- intended code path: `src/data/transitionLite/jobCapabilityClusterRegistry.js`

Current 20 drafted live IDs:

1. `JOB_SALES_GENERAL_SALES`
2. `JOB_SALES_B2B_SALES`
3. `JOB_SALES_PARTNER_CHANNEL_SALES`
4. `JOB_SALES_SOLUTION_SALES`
5. `JOB_MARKETING_BRAND_MARKETING`
6. `JOB_MARKETING_PRODUCT_MARKETING_PMM`
7. `JOB_MARKETING_CONTENT_MARKETING`
8. `JOB_MARKETING_PERFORMANCE_MARKETING`
9. `JOB_BUSINESS_BUSINESS_PLANNING`
10. `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`
11. `JOB_HR_ORGANIZATION_RECRUITING`
12. `JOB_HR_ORGANIZATION_HRBP`
13. `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS`
14. `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS`
15. `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
16. `JOB_FINANCE_ACCOUNTING_FP_AND_A`
17. `JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN`
18. `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING`
19. `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING`
20. `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`

---

## Uncovered Jobs

### Must-add before full registry body

- `JOB_SALES_KEY_ACCOUNT_MANAGEMENT`
- `JOB_SALES_PROPOSAL_SALES`
- `JOB_SALES_SALES_OPERATIONS`
- `JOB_MARKETING_CRM_MARKETING`
- `JOB_MARKETING_DIGITAL_MARKETING`
- `JOB_BUSINESS_BUSINESS_DEVELOPMENT`
- `JOB_BUSINESS_STRATEGY`
- `JOB_BUSINESS_SERVICE_PLANNING`
- `JOB_BUSINESS_OPERATIONS_MANAGEMENT`
- `JOB_BUSINESS_PROJECT_MANAGEMENT`
- `JOB_HR_ORGANIZATION_HR_PLANNING`
- `JOB_HR_ORGANIZATION_HR_OPS`
- `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
- `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`
- `JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING`
- `JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA`
- `JOB_IT_DATA_DIGITAL_IT_PLANNING`
- `JOB_RESEARCH_PROFESSIONAL_CONSULTING`

### Medium-priority uncovered jobs

- `JOB_SALES_TECHNICAL_SALES`
- `JOB_MARKETING_PR_COMMUNICATIONS`
- `JOB_MARKETING_MARKETING_RESEARCH`
- `JOB_HR_ORGANIZATION_COMPENSATION_BENEFITS`
- `JOB_CUSTOMER_OPERATIONS_BACKOFFICE_OPERATIONS`
- `JOB_FINANCE_ACCOUNTING_FINANCE`
- `JOB_IT_DATA_DIGITAL_DATA_ENGINEERING`
- `JOB_PROCUREMENT_SCM_SUPPLIER_VENDOR_MANAGEMENT`

### Defer-safe uncovered domains

- Design full surface
- Education/Counseling/Coaching full surface
- Public Administration Support full surface
- Legal / RA / policy-regulation heavy research roles
- Deep specialist engineering branches such as circuit, embedded, systems, security, AI/ML

---

## Verified Live IDs

High-priority additions verified from `JOB_ONTOLOGY_ITEMS`:

| requested label | verified live ID |
| --- | --- |
| Key Account Management(KAM) | `JOB_SALES_KEY_ACCOUNT_MANAGEMENT` |
| 제안영업 | `JOB_SALES_PROPOSAL_SALES` |
| 영업 운영 / 세일즈 옵스 | `JOB_SALES_SALES_OPERATIONS` |
| CRM 마케팅 | `JOB_MARKETING_CRM_MARKETING` |
| 디지털마케팅 | `JOB_MARKETING_DIGITAL_MARKETING` |
| 신사업/사업개발(BD) | `JOB_BUSINESS_BUSINESS_DEVELOPMENT` |
| 전략기획 | `JOB_BUSINESS_STRATEGY` |
| 서비스기획 | `JOB_BUSINESS_SERVICE_PLANNING` |
| 운영관리 | `JOB_BUSINESS_OPERATIONS_MANAGEMENT` |
| 프로젝트관리(PM) | `JOB_BUSINESS_PROJECT_MANAGEMENT` |
| 인사기획 | `JOB_HR_ORGANIZATION_HR_PLANNING` |
| HR 운영(HR Ops) | `JOB_HR_ORGANIZATION_HR_OPS` |
| 운영기획 | `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING` |
| 고객상담 / CS | `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS` |
| 관리회계 | `JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING` |
| 소프트웨어개발 | `JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT` |
| 생산관리 | `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT` |
| 품질보증(QA) | `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA` |
| IT 기획 | `JOB_IT_DATA_DIGITAL_IT_PLANNING` |
| 컨설팅 | `JOB_RESEARCH_PROFESSIONAL_CONSULTING` |

---

## Mismatch Report

### Existing mismatch status

- unchanged and valid:
  - `JOB_PRODUCT_PRODUCT_MANAGER` -> `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`
  - `JOB_HR_RECRUITING` -> `JOB_HR_ORGANIZATION_RECRUITING`
  - `JOB_HR_HRBP` -> `JOB_HR_ORGANIZATION_HRBP`
  - `JOB_OPERATIONS_SERVICE_OPERATIONS` -> `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS`
  - `JOB_CS_CUSTOMER_SUCCESS` -> `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS`
  - `JOB_FINANCE_FPANDA` -> `JOB_FINANCE_ACCOUNTING_FP_AND_A`
  - `JOB_MANUFACTURING_PRODUCTION_TECHNOLOGY` -> `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING`
  - `JOB_MANUFACTURING_PROCESS_DEVELOPMENT` -> `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING`
  - `JOB_IT_DATA_ANALYST` -> `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`

- needs correction / ambiguity note:
  - `JOB_STRATEGY_BUSINESS_PLANNING`
    - previous draft mapped this directly to `JOB_BUSINESS_BUSINESS_PLANNING`
    - updated note: this requested ID mixes two distinct live roles:
      - `JOB_BUSINESS_BUSINESS_PLANNING`
      - `JOB_BUSINESS_STRATEGY`
    - future registry writing must select one by intent, not auto-collapse.
  - `JOB_FINANCE_ACCOUNTING`
    - previous draft mapped this directly to `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
    - updated note: generic label is broader than one live role and can imply:
      - `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
      - `JOB_FINANCE_ACCOUNTING_FINANCE`
      - `JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING`

### New ambiguity findings

- `서비스기획`
  - canonical role intended for business/product planning should be `JOB_BUSINESS_SERVICE_PLANNING`
  - but `JOB_IT_DATA_DIGITAL_IT_PLANNING` also carries service-planning aliases
- `PM`
  - can refer to `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`
  - or `JOB_BUSINESS_PROJECT_MANAGEMENT`
- `운영기획`
  - can resolve to `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
  - but business-side execution planning is closer to `JOB_BUSINESS_OPERATIONS_MANAGEMENT`

---

## Defer List

- Design roles
  - reason: require visual-creative specific clusters and do not materially unblock current axis1 bridge cases.
- Education/Counseling/Coaching roles
  - reason: need people-development/training clusters not yet normalized; current axis1 rollout focus is not here.
- Public administration support roles
  - reason: distinct institutional and policy context; weak value for current commercial/business bridge cases.
- Legal / regulatory / policy research roles
  - reason: require governance/compliance cluster extension to avoid forced mappings.
- Deep specialist engineering branches
  - reason: domain-specific technical depth already represented by mechanical/process/production/software anchors for v1.

---

## Next Decision

- decision: `PROCEED WITH EXPANSION`
- minimum safe coverage before writing the final registry body: 40 jobs
- rationale:
  - current 20-job draft covers only the first bridge layer
  - it does not yet represent:
    - GTM internal planning / lifecycle / bid / account-growth roles
    - product/business planning variants
    - people-ops planning variants
    - customer-ops planning/support split
    - management-accounting / operating-control variants
    - execution-heavy industrial / software anchors
- next round should write the full registry body against:
  - current 20 drafted jobs
  - plus 20 verified must-add jobs above

