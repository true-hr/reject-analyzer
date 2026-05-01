/**
 * run-special-transition-diagnostics-baseline.mjs
 *
 * Special Transition Diagnostics 9개 rule의 matcher 회귀 검수 스크립트.
 * production 코드 수정 없이 findSpecialTransitionDiagnostics()만 import.
 * 실제 ontology 전체를 import하지 않고 minimal mock item 사용.
 *
 * 실행 방법:
 *   node scripts/regression/run-special-transition-diagnostics-baseline.mjs
 *
 * 검수 대상 rules:
 *   SPECIAL_B2C_CS_TO_B2B_CSM                (priority 100)
 *   SPECIAL_MFG_QA_TO_IT_QA_SQA              (priority 90)
 *   SPECIAL_MFG_QA_TO_REGULATED_QA_RA        (priority 80)
 *   SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING   (priority 70)
 *   SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS     (priority 60)
 *   SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX (priority 50)
 *   SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES    (priority 40)
 *   SPECIAL_PERFORMANCE_MARKETING_TO_PMM        (priority 30)
 *   SPECIAL_DOC_ADMIN_TO_RA                     (priority 25)
 */

import { findSpecialTransitionDiagnostics } from "../../src/lib/transitionLite/specialTransitionDiagnostics.js";

// ─── Mock helpers ─────────────────────────────────────────────────────────────
// shape mirrors the fields matchJob / matchIndustry read:
//   matchJob:     item.subVertical ?? item.subcategory
//   matchIndustry: item.sector, item.subSector

function job({ subVertical, subcategory, label = "", aliases = [] } = {}) {
  return { id: subVertical || subcategory || label, subVertical, subcategory, label, aliases };
}

function industry({ sector, subSector, label = "", aliases = [] } = {}) {
  return { id: sector || subSector || label, sector, subSector, label, aliases };
}

// ─── Case runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let firesPassed = 0;
let silentPassed = 0;

function runCase({
  name,
  currentJobItem,
  targetJobItem,
  currentIndustryItem = null,
  targetIndustryItem = null,
  expectedId,
}) {
  const result = findSpecialTransitionDiagnostics({
    currentJobItem,
    targetJobItem,
    currentIndustryItem,
    targetIndustryItem,
    classification: {},
  });

  const firstId = result?.[0]?.id || null;
  const isFire = expectedId !== null;

  if (expectedId && firstId !== expectedId) {
    console.error(`FAIL: ${name}`);
    console.error(`  expected: ${expectedId}`);
    console.error(`  actual:   ${firstId ?? "(none)"}`);
    failed++;
    return;
  }

  if (!expectedId && firstId) {
    console.error(`FAIL: ${name}`);
    console.error(`  expected: (silent — no rule fires)`);
    console.error(`  actual:   ${firstId}`);
    failed++;
    return;
  }

  passed++;
  if (isFire) firesPassed++;
  else silentPassed++;
}

// ─── Fire cases (17) ──────────────────────────────────────────────────────────

// 1. B2C CS → B2B CSM
runCase({
  name: "[fire-1] B2C CS → B2B CSM",
  currentJobItem: job({ subVertical: "CUSTOMER_SUPPORT_CS" }),
  targetJobItem:  job({ subVertical: "CUSTOMER_SUCCESS" }),
  expectedId: "SPECIAL_B2C_CS_TO_B2B_CSM",
});

// 2. 품질 QA → IT QA/SQA
runCase({
  name: "[fire-2] 품질 QA → IT QA/SQA",
  currentJobItem: job({ subVertical: "QUALITY_ASSURANCE_QA" }),
  targetJobItem:  job({ subVertical: "QA_TEST_AUTOMATION" }),
  expectedId: "SPECIAL_MFG_QA_TO_IT_QA_SQA",
});

// 3. 제조 QA → 의료기기/제약 RA (industry guard 포함)
runCase({
  name: "[fire-3] 제조 QA → 의료기기/제약 RA",
  currentJobItem:      job({ subVertical: "QUALITY_ASSURANCE_QA" }),
  currentIndustryItem: industry({ sector: "MANUFACTURING" }),
  targetJobItem:       job({ subVertical: "REGULATORY_AFFAIRS" }),
  targetIndustryItem:  industry({ sector: "HEALTHCARE_PHARMA_BIO" }),
  expectedId: "SPECIAL_MFG_QA_TO_REGULATED_QA_RA",
});

// 4. 영업관리 → 사업기획 (subcategory schema)
runCase({
  name: "[fire-4] 영업관리 → 사업기획",
  currentJobItem: job({ subcategory: "SALES_OPERATIONS" }),
  targetJobItem:  job({ subcategory: "BUSINESS_PLANNING" }),
  expectedId: "SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING",
});

// 5. 운영관리 → 전략기획 (subVertical + subcategory 혼합)
runCase({
  name: "[fire-5] 운영관리 → 전략기획",
  currentJobItem: job({ subVertical: "OPERATIONS_MANAGEMENT" }),
  targetJobItem:  job({ subcategory: "STRATEGY" }),
  expectedId: "SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING",
});

// 6. 일반 운영 → 생산관리
runCase({
  name: "[fire-6] 일반 운영 → 생산관리",
  currentJobItem: job({ subVertical: "OPERATIONS_MANAGEMENT" }),
  targetJobItem:  job({ subVertical: "PRODUCTION_MANAGEMENT" }),
  expectedId: "SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS",
});

// 7. 일반 운영 → SCM
runCase({
  name: "[fire-7] 일반 운영 → SCM",
  currentJobItem: job({ subVertical: "OPERATIONS_MANAGEMENT" }),
  targetJobItem:  job({ subVertical: "DEMAND_SUPPLY_PLANNING" }),
  expectedId: "SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS",
});

// 8. 일반 운영 → 안전관리
runCase({
  name: "[fire-8] 일반 운영 → 안전관리",
  currentJobItem: job({ subVertical: "OPERATIONS_MANAGEMENT" }),
  targetJobItem:  job({ subVertical: "ENVIRONMENT_HEALTH_SAFETY" }),
  expectedId: "SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS",
});

// 9. 경영지원 → 회계
runCase({
  name: "[fire-9] 경영지원 → 회계",
  currentJobItem: job({ subVertical: "BUSINESS_SUPPORT" }),
  targetJobItem:  job({ subVertical: "ACCOUNTING" }),
  expectedId: "SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX",
});

// 10. 경영지원 → 세무
runCase({
  name: "[fire-10] 경영지원 → 세무",
  currentJobItem: job({ subVertical: "BUSINESS_SUPPORT" }),
  targetJobItem:  job({ subVertical: "TAX" }),
  expectedId: "SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX",
});

// 11. 채널/파트너영업 → 솔루션영업
runCase({
  name: "[fire-11] 채널/파트너영업 → 솔루션영업",
  currentJobItem: job({ subVertical: "PARTNER_CHANNEL_SALES" }),
  targetJobItem:  job({ subVertical: "SOLUTION_SALES" }),
  expectedId: "SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES",
});

// 12. B2C/리테일영업 → B2B영업
runCase({
  name: "[fire-12] B2C/리테일영업 → B2B영업",
  currentJobItem: job({ subVertical: "B2C_SALES" }),
  targetJobItem:  job({ subVertical: "B2B_SALES" }),
  expectedId: "SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES",
});

// 13. 퍼포먼스 마케팅 → PMM
runCase({
  name: "[fire-13] 퍼포먼스 마케팅 → PMM",
  currentJobItem: job({ subVertical: "PERFORMANCE_MARKETING" }),
  targetJobItem:  job({ subVertical: "PRODUCT_MARKETING_PMM" }),
  expectedId: "SPECIAL_PERFORMANCE_MARKETING_TO_PMM",
});

// 14. CRM 마케팅 → PMM
runCase({
  name: "[fire-14] CRM 마케팅 → PMM",
  currentJobItem: job({ subVertical: "CRM_MARKETING" }),
  targetJobItem:  job({ subVertical: "PRODUCT_MARKETING_PMM" }),
  expectedId: "SPECIAL_PERFORMANCE_MARKETING_TO_PMM",
});

// 15. 채널/파트너영업 → B2B영업 (cross combination)
runCase({
  name: "[fire-15] 채널/파트너영업 → B2B영업",
  currentJobItem: job({ subVertical: "PARTNER_CHANNEL_SALES" }),
  targetJobItem:  job({ subVertical: "B2B_SALES" }),
  expectedId: "SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES",
});

// 16. B2C/리테일영업 → 솔루션영업 (cross combination)
runCase({
  name: "[fire-16] B2C/리테일영업 → 솔루션영업",
  currentJobItem: job({ subVertical: "B2C_SALES" }),
  targetJobItem:  job({ subVertical: "SOLUTION_SALES" }),
  expectedId: "SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES",
});

// 17. 문서관리/사무지원 → RA/인증
runCase({
  name: "[fire-17] 문서관리/사무지원 → RA/인증",
  currentJobItem: job({ subVertical: "DOCUMENT_ADMIN_SUPPORT" }),
  targetJobItem:  job({ subVertical: "REGULATORY_AFFAIRS" }),
  expectedId: "SPECIAL_DOC_ADMIN_TO_RA",
});

// ─── Silent cases (15) ───────────────────────────────────────────────────────

// 1. IT 개발자 → PM (어떤 rule도 없음)
runCase({
  name: "[silent-1] IT 개발자 → PM",
  currentJobItem: job({ subVertical: "SOFTWARE_ENGINEERING" }),
  targetJobItem:  job({ subVertical: "PRODUCT_MANAGER" }),
  expectedId: null,
});

// 2. 마케팅 → 사업기획 (source 미일치)
runCase({
  name: "[silent-2] 마케팅 → 사업기획",
  currentJobItem: job({ subVertical: "CONTENT_MARKETING" }),
  targetJobItem:  job({ subcategory: "BUSINESS_PLANNING" }),
  expectedId: null,
});

// 3. 제조 QA → 제조 QA (tgtInd MANUFACTURING ≠ HEALTHCARE_PHARMA_BIO → Rule 3 tgtIndOk false)
runCase({
  name: "[silent-3] 제조 QA → 제조 QA (same industry)",
  currentJobItem:      job({ subVertical: "QUALITY_ASSURANCE_QA" }),
  currentIndustryItem: industry({ sector: "MANUFACTURING" }),
  targetJobItem:       job({ subVertical: "QUALITY_ASSURANCE_QA" }),
  targetIndustryItem:  industry({ sector: "MANUFACTURING" }),
  expectedId: null,
});

// 4. 회계 → 회계 (same subVertical, no rule covers this direction)
runCase({
  name: "[silent-4] 회계 → 회계",
  currentJobItem: job({ subVertical: "ACCOUNTING" }),
  targetJobItem:  job({ subVertical: "ACCOUNTING" }),
  expectedId: null,
});

// 5. 영업관리 → 영업관리 (same job, Rule 4 target 미일치)
runCase({
  name: "[silent-5] 영업관리 → 영업관리",
  currentJobItem: job({ subcategory: "SALES_OPERATIONS" }),
  targetJobItem:  job({ subcategory: "SALES_OPERATIONS" }),
  expectedId: null,
});

// 6. 운영관리 → 운영관리 (Rule 4 target 미일치, Rule 5 target 미일치)
runCase({
  name: "[silent-6] 운영관리 → 운영관리",
  currentJobItem: job({ subVertical: "OPERATIONS_MANAGEMENT" }),
  targetJobItem:  job({ subVertical: "OPERATIONS_MANAGEMENT" }),
  expectedId: null,
});

// 7. 생산관리 → SCM (Rule 5 source = OPERATIONS_MANAGEMENT 만 허용, PRODUCTION_MANAGEMENT 미일치)
runCase({
  name: "[silent-7] 생산관리 → SCM",
  currentJobItem: job({ subVertical: "PRODUCTION_MANAGEMENT" }),
  targetJobItem:  job({ subVertical: "DEMAND_SUPPLY_PLANNING" }),
  expectedId: null,
});

// 8. 경영기획 → 전략기획 (Rule 4 source = SALES_OPERATIONS/OPERATIONS_MANAGEMENT 만, BUSINESS_PLANNING 미일치)
runCase({
  name: "[silent-8] 경영기획 → 전략기획",
  currentJobItem: job({ subcategory: "BUSINESS_PLANNING" }),
  targetJobItem:  job({ subcategory: "STRATEGY" }),
  expectedId: null,
});

// 9. 일반영업 → 솔루션영업 (GENERAL_SALES는 Rule 7 source 미해당)
runCase({
  name: "[silent-9] 일반영업 → 솔루션영업",
  currentJobItem: job({ subVertical: "GENERAL_SALES" }),
  targetJobItem:  job({ subVertical: "SOLUTION_SALES" }),
  expectedId: null,
});

// 10. 솔루션영업 → 솔루션영업 (Rule 7 source 미해당)
runCase({
  name: "[silent-10] 솔루션영업 → 솔루션영업",
  currentJobItem: job({ subVertical: "SOLUTION_SALES" }),
  targetJobItem:  job({ subVertical: "SOLUTION_SALES" }),
  expectedId: null,
});

// 11. 콘텐츠마케팅 → PMM (CONTENT_MARKETING은 Rule 8 source 미해당)
runCase({
  name: "[silent-11] 콘텐츠마케팅 → PMM",
  currentJobItem: job({ subVertical: "CONTENT_MARKETING" }),
  targetJobItem:  job({ subVertical: "PRODUCT_MARKETING_PMM" }),
  expectedId: null,
});

// 12. 브랜드마케팅 → PMM (BRAND_MARKETING은 이번 P1에서 의도적으로 source 제외)
runCase({
  name: "[silent-12] 브랜드마케팅 → PMM",
  currentJobItem: job({ subVertical: "BRAND_MARKETING" }),
  targetJobItem:  job({ subVertical: "PRODUCT_MARKETING_PMM" }),
  expectedId: null,
});

// 13. 문서관리/사무지원 → 내부통제 (이번 Rule 9 target 미해당)
runCase({
  name: "[silent-13] 문서관리/사무지원 → 내부통제",
  currentJobItem: job({ subVertical: "DOCUMENT_ADMIN_SUPPORT" }),
  targetJobItem:  job({ subVertical: "INTERNAL_CONTROL" }),
  expectedId: null,
});

// 14. 문서관리/사무지원 → 문서관리/사무지원 (동일 직무 이동)
runCase({
  name: "[silent-14] 문서관리/사무지원 → 문서관리/사무지원",
  currentJobItem: job({ subVertical: "DOCUMENT_ADMIN_SUPPORT" }),
  targetJobItem:  job({ subVertical: "DOCUMENT_ADMIN_SUPPORT" }),
  expectedId: null,
});

// 15. 행정 → RA/인증 (이번 Rule 9 source는 DOCUMENT_ADMIN_SUPPORT 단독)
runCase({
  name: "[silent-15] 행정 → RA/인증",
  currentJobItem: job({ subVertical: "ADMINISTRATION" }),
  targetJobItem:  job({ subVertical: "REGULATORY_AFFAIRS" }),
  expectedId: null,
});

// ─── 최종 요약 ────────────────────────────────────────────────────────────────

const total = passed + failed;

console.log(`\nPASSMAP Special Transition Diagnostics baseline`);
console.log(`PASS: ${passed} / ${total}`);
console.log(`- fires:  ${firesPassed}`);
console.log(`- silent: ${silentPassed}`);

if (failed > 0) {
  console.error(`FAIL: ${failed} / ${total}`);
  process.exitCode = 1;
}
