# JOB Ontology Inventory

## 범위

- 이 문서는 Phase 2 inventory 문서다.
- 대상은 프로젝트 내 직무 특성 원재료 성격이 명확한 1차 후보 자산이다.
- 이번 문서에서는 `src/lib/roleDictionary.js`의 `ROLE_RULES`를 primary job candidate asset으로 inventory 한다.
- 아래 파일들은 보조 참고 자산으로만 취급하고, 본 표의 primary inventory 대상에서는 제외한다.
  - `src/lib/ontology/jobOntology.js`
  - `src/lib/roleDistance.js`
  - `src/lib/decision/roleOntology/canonicalRoleMap.js`

## Primary Source

- source file: `src/lib/roleDictionary.js`
- export: `ROLE_RULES`
- item count: 49

## Inventory Table

| source file | export/key/item name | candidate id | major | sub | label | aliases 존재 여부 | families 존재 여부 | roles 존재 여부 | axes 존재 여부 | adjacentFamilies 존재 여부 | boundaryHints 존재 여부 | summaryTemplate 존재 여부 | required fields 충족 상태 | inventory grade | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=recruiter_ta` | `JOB_RECRUITER_TA` | `hr` | `recruiter_ta` | `recruiter_ta` | N | Y | Y | N | N | N | N | Fail | Raw Material | `label`은 role key 기반, `aliases/axes/adjacentFamilies/boundaryHints/summaryTemplate` 없음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=hrbp` | `JOB_HRBP` | `hr` | `hrbp` | `hrbp` | N | Y | Y | N | N | N | N | Fail | Raw Material | major는 `family`, sub는 `role key` 수준. Phase 1 최소 스키마와 직접 불일치 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=comp_benefits_cnb` | `JOB_COMP_BENEFITS_CNB` | `hr` | `comp_benefits_cnb` | `comp_benefits_cnb` | N | Y | Y | N | N | N | N | Fail | Raw Material | 보상/복지 특성 신호는 있으나 canonical job item 필드 부족 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=labor_relations_er` | `JOB_LABOR_RELATIONS_ER` | `hr` | `labor_relations_er` | `labor_relations_er` | N | Y | Y | N | N | N | N | Fail | Raw Material | role/family 외 required field 없음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=people_dev_ld` | `JOB_PEOPLE_DEV_LD` | `hr` | `people_dev_ld` | `people_dev_ld` | N | Y | Y | N | N | N | N | Fail | Raw Material | summaryTemplate, boundaryHints 부재 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=product_manager_pm` | `JOB_PRODUCT_MANAGER_PM` | `pm` | `product_manager_pm` | `product_manager_pm` | N | Y | Y | N | N | N | N | Fail | Raw Material | PM 특성 강도는 높지만 schema 필수 필드 대부분 없음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=pmo_program_manager` | `JOB_PMO_PROGRAM_MANAGER` | `pm` | `pmo_program_manager` | `pmo_program_manager` | N | Y | Y | N | N | N | N | Fail | Raw Material | label/aliases 분리 없음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=project_manager_delivery` | `JOB_PROJECT_MANAGER_DELIVERY` | `pm` | `project_manager_delivery` | `project_manager_delivery` | N | Y | Y | N | N | N | N | Fail | Raw Material | role key 중심 raw material |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=growth_pm` | `JOB_GROWTH_PM` | `pm` | `growth_pm` | `growth_pm` | N | Y | Y | N | N | N | N | Fail | Raw Material | axes/family depth 미정 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=data_analyst_bi` | `JOB_DATA_ANALYST_BI` | `data` | `data_analyst_bi` | `data_analyst_bi` | N | Y | Y | N | N | N | N | Fail | Raw Material | BI/분석 혼합 가능성, major/sub 재정의 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=data_scientist_ds` | `JOB_DATA_SCIENTIST_DS` | `data` | `data_scientist_ds` | `data_scientist_ds` | N | Y | Y | N | N | N | N | Fail | Raw Material | family는 있으나 SSOT 분류표 major/sub와 아직 미매핑 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=data_engineer_de` | `JOB_DATA_ENGINEER_DE` | `data` | `data_engineer_de` | `data_engineer_de` | N | Y | Y | N | N | N | N | Fail | Raw Material | id 규칙은 가능하나 label/aliases 부재 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=ml_engineer_mle` | `JOB_ML_ENGINEER_MLE` | `data` | `ml_engineer_mle` | `ml_engineer_mle` | N | Y | Y | N | N | N | N | Fail | Raw Material | summaryTemplate 없음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=frontend_engineer` | `JOB_FRONTEND_ENGINEER` | `engineering` | `frontend_engineer` | `frontend_engineer` | N | Y | Y | N | N | N | N | Fail | Raw Material | family 값과 Phase 1 major 체계 연결 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=backend_engineer` | `JOB_BACKEND_ENGINEER` | `engineering` | `backend_engineer` | `backend_engineer` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=fullstack_engineer` | `JOB_FULLSTACK_ENGINEER` | `engineering` | `fullstack_engineer` | `fullstack_engineer` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=devops_sre` | `JOB_DEVOPS_SRE` | `engineering` | `devops_sre` | `devops_sre` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=qa_test_engineer_sw` | `JOB_QA_TEST_ENGINEER_SW` | `engineering` | `qa_test_engineer_sw` | `qa_test_engineer_sw` | N | Y | Y | N | N | N | N | Fail | Raw Material | QA를 독립 family로 둘지 재검토 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=security_engineer` | `JOB_SECURITY_ENGINEER` | `engineering` | `security_engineer` | `security_engineer` | N | Y | Y | N | N | N | N | Fail | Raw Material | security 세부 family 여부 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=rnd_researcher` | `JOB_RND_RESEARCHER` | `engineering` | `rnd_researcher` | `rnd_researcher` | N | Y | Y | N | N | N | N | Fail | Raw Material | 연구/R&D family 분리 여부 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=product_development_engineer` | `JOB_PRODUCT_DEVELOPMENT_ENGINEER` | `engineering` | `product_development_engineer` | `product_development_engineer` | N | Y | Y | N | N | N | N | Fail | Raw Material | 제조 개발계열 세분화 가능성 높음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=process_engineer_mfg` | `JOB_PROCESS_ENGINEER_MFG` | `engineering` | `process_engineer_mfg` | `process_engineer_mfg` | N | Y | Y | N | N | N | N | Fail | Raw Material | manufacturing 전용 raw material |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=quality_engineer_mfg` | `JOB_QUALITY_ENGINEER_MFG` | `engineering` | `quality_engineer_mfg` | `quality_engineer_mfg` | N | Y | Y | N | N | N | N | Fail | Raw Material | 품질/제조 경계 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=manufacturing_engineer_me` | `JOB_MANUFACTURING_ENGINEER_ME` | `engineering` | `manufacturing_engineer_me` | `manufacturing_engineer_me` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=maintenance_facility_engineer` | `JOB_MAINTENANCE_FACILITY_ENGINEER` | `engineering` | `maintenance_facility_engineer` | `maintenance_facility_engineer` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=ehs_safety` | `JOB_EHS_SAFETY` | `engineering` | `ehs_safety` | `ehs_safety` | N | Y | Y | N | N | N | N | Fail | Raw Material | EHS를 job ontology로 둘지 별도 registry로 둘지 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=production_operator` | `JOB_PRODUCTION_OPERATOR` | `engineering` | `production_operator` | `production_operator` | N | Y | Y | N | N | N | N | Fail | Raw Material | operator 계층 포함 범위 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=account_executive_ae` | `JOB_ACCOUNT_EXECUTIVE_AE` | `sales` | `account_executive_ae` | `account_executive_ae` | N | Y | Y | N | N | N | N | Fail | Raw Material | label/aliases/summary 부족 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=sales_engineer_se` | `JOB_SALES_ENGINEER_SE` | `sales` | `sales_engineer_se` | `sales_engineer_se` | N | Y | Y | N | N | N | N | Fail | Raw Material | technical sales 계열 P1 후보 가능 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=customer_success_cs` | `JOB_CUSTOMER_SUCCESS_CS` | `sales` | `customer_success_cs` | `customer_success_cs` | N | Y | Y | N | N | N | N | Fail | Raw Material | CS와 support 경계 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=partnership_bd` | `JOB_PARTNERSHIP_BD` | `sales` | `partnership_bd` | `partnership_bd` | N | Y | Y | N | N | N | N | Fail | Raw Material | BD/partnership 혼합 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=performance_marketer` | `JOB_PERFORMANCE_MARKETER` | `marketing` | `performance_marketer` | `performance_marketer` | N | Y | Y | N | N | N | N | Fail | Raw Material | 마케팅 세부 분류 raw material |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=growth_marketer` | `JOB_GROWTH_MARKETER` | `marketing` | `growth_marketer` | `growth_marketer` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=brand_marketer` | `JOB_BRAND_MARKETER` | `marketing` | `brand_marketer` | `brand_marketer` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=content_marketer` | `JOB_CONTENT_MARKETER` | `marketing` | `content_marketer` | `content_marketer` | N | Y | Y | N | N | N | N | Fail | Raw Material | same |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=pr_communications` | `JOB_PR_COMMUNICATIONS` | `marketing` | `pr_communications` | `pr_communications` | N | Y | Y | N | N | N | N | Fail | Raw Material | PR를 marketing major에 둘지 확인 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=hr_people_ops_admin` | `JOB_HR_PEOPLE_OPS_ADMIN` | `strategy` | `hr_people_ops_admin` | `hr_people_ops_admin` | N | Y | Y | N | N | N | N | Fail | Raw Material | family=`strategy`인데 HR admin 성격. 명칭/분류 불일치 가능성 큼 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=general_affairs_admin` | `JOB_GENERAL_AFFAIRS_ADMIN` | `strategy` | `general_affairs_admin` | `general_affairs_admin` | N | Y | Y | N | N | N | N | Fail | Raw Material | support/admin 계열로 분류 불일치 가능성 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=legal_compliance_support` | `JOB_LEGAL_COMPLIANCE_SUPPORT` | `strategy` | `legal_compliance_support` | `legal_compliance_support` | N | Y | Y | N | N | N | N | Fail | Raw Material | legal/compliance support 성격 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=biz_ops_management_support` | `JOB_BIZ_OPS_MANAGEMENT_SUPPORT` | `strategy` | `biz_ops_management_support` | `biz_ops_management_support` | N | Y | Y | N | N | N | N | Fail | Raw Material | support/coordination 계열, over-broad |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=planning_budget_control` | `JOB_PLANNING_BUDGET_CONTROL` | `strategy` | `planning_budget_control` | `planning_budget_control` | N | Y | Y | N | N | N | N | Fail | Raw Material | biz/finance bridge 가능성. major 확정 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=corp_strategy` | `JOB_CORP_STRATEGY` | `strategy` | `corp_strategy` | `corp_strategy` | N | Y | Y | N | N | N | N | Fail | Raw Material | 전략 core item 후보이나 summary/axes 없음 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=bizops_ops_strategy` | `JOB_BIZOPS_OPS_STRATEGY` | `strategy` | `bizops_ops_strategy` | `bizops_ops_strategy` | N | Y | Y | N | N | N | N | Fail | Raw Material | bizops/ops 혼합 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=finance_strategy_fpa` | `JOB_FINANCE_STRATEGY_FPA` | `strategy` | `finance_strategy_fpa` | `finance_strategy_fpa` | N | Y | Y | N | N | N | N | Fail | Raw Material | finance major와 strategy major 중복 가능성 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=investment_ma` | `JOB_INVESTMENT_MA` | `strategy` | `investment_ma` | `investment_ma` | N | Y | Y | N | N | N | N | Fail | Raw Material | M&A / investment 전용 major 필요성 확인 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=procurement_buyer` | `JOB_PROCUREMENT_BUYER` | `strategy` | `procurement_buyer` | `procurement_buyer` | N | Y | Y | N | N | N | N | Fail | Raw Material | procurement를 strategy family에 둔 점 재검토 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=srm_vendor_mgmt` | `JOB_SRM_VENDOR_MGMT` | `strategy` | `srm_vendor_mgmt` | `srm_vendor_mgmt` | N | Y | Y | N | N | N | N | Fail | Raw Material | supplier/vendor management raw material |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=supply_chain_scm` | `JOB_SUPPLY_CHAIN_SCM` | `strategy` | `supply_chain_scm` | `supply_chain_scm` | N | Y | Y | N | N | N | N | Fail | Raw Material | SCM를 strategy family에 둔 점 재검토 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=logistics_trade` | `JOB_LOGISTICS_TRADE` | `strategy` | `logistics_trade` | `logistics_trade` | N | Y | Y | N | N | N | N | Fail | Raw Material | 물류/무역 혼합, boundary 필요 |
| `src/lib/roleDictionary.js` | `ROLE_RULES.role=production_planning_control_ppc` | `JOB_PRODUCTION_PLANNING_CONTROL_PPC` | `strategy` | `production_planning_control_ppc` | `production_planning_control_ppc` | N | Y | Y | N | N | N | N | Fail | Raw Material | 제조 운영/SCM/계획 경계 혼합 |

## Grade Summary

- Ready: 0
- Partial: 0
- Raw Material: 49
- Reject for Now: 0

## Auxiliary References

다음 파일은 job inventory 보조 참고로만 확인했다.

- `src/lib/ontology/jobOntology.js`
- `src/lib/roleDistance.js`
- `src/lib/decision/roleOntology/canonicalRoleMap.js`

이유:

- Phase 1 기준에서 legacy ontology / role map / canonical role map은 보조 힌트다.
- 이번 Phase 2에서는 "특성 코드 원재료"를 우선 inventory 대상으로 삼는다.
