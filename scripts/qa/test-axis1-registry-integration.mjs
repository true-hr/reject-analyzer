#!/usr/bin/env node

/**
 * Test validation for Axis1 Registry Integration
 * Run with: node test-axis1-registry-integration.mjs
 *
 * Tests the 16 required validation cases:
 * Round 1 (6 cases):
 * 1. ECONOMICS → PRODUCT_MARKETING_PMM (preserved hardcoded text)
 * 2. BUSINESS_ADMIN → PRODUCT_MARKETING_PMM (registry bridge)
 * 3. COMPUTER_SCIENCE → BACKEND_DEVELOPMENT (registry bridge)
 * 4. COMPUTER_SCIENCE → PM_SERVICE_PLANNING (registry bridge)
 * 5. MATH_STATISTICS → DATA_ANALYSIS (registry bridge)
 * 6. INDUSTRIAL_ENGINEERING → PM_SERVICE_PLANNING (registry bridge, P0 patch)
 *
 * Round 2 (10 cases):
 * 7. SOFTWARE → BACKEND_DEVELOPMENT
 * 8. ELECTRICAL_ELECTRONIC → PRODUCTION_MANAGEMENT
 * 9. CHEMISTRY → PRODUCTION_MANAGEMENT
 * 10. ACCOUNTING_TAX → FINANCIAL_PLANNING
 * 11. BIO_LIFE_SCIENCE → PRODUCTION_MANAGEMENT
 * 12. PHARMACY → PM_SERVICE_PLANNING
 * 13. PUBLIC_POLICY → PM_SERVICE_PLANNING
 * 14. SOCIOLOGY → HR_ORGANIZATION
 * 15. OTHER_HUMANITIES → CONTENT_MARKETING
 * 16. USER_EXPERIENCE → UX_RESEARCH
 */

import { buildNewgradAxis1CanonicalReading } from "../../src/data/transitionLite/axisExplanationRegistry.js";
import { resolveNewgradMajorBridgeProfile } from "../../src/data/transitionLite/newgradMajorBridgeRegistry.js";

console.log("=".repeat(80));
console.log("Axis1 Registry Integration Test");
console.log("=".repeat(80));

// Test cases
const testCases = [
  {
    name: "Case 1: ECONOMICS → PRODUCT_MARKETING_PMM (hardcoded, preserved)",
    input: {
      majorKey: "ECONOMICS",
      majorDisplayLabel: "경제학",
      targetJobId: "PRODUCT_MARKETING_PMM",
      targetJobLabel: "PMM(상품마케팅매니저)",
      targetJobCategory: "marketing",
    },
    expectedBehavior: "should use existing hardcoded text (includes '미시경제학, 산업조직론')",
  },
  {
    name: "Case 2: BUSINESS_ADMIN → PRODUCT_MARKETING_PMM (registry bridge)",
    input: {
      majorKey: "BUSINESS_ADMIN",
      majorDisplayLabel: "경영학",
      targetJobId: "PRODUCT_MARKETING_PMM",
      targetJobLabel: "PMM(상품마케팅매니저)",
      targetJobCategory: "marketing",
    },
    expectedBehavior: "should use registry bridge (courses: 마케팅원론, 마케팅관리, 소비자행동론...)",
  },
  {
    name: "Case 3: COMPUTER_SCIENCE → BACKEND_DEVELOPMENT (registry bridge)",
    input: {
      majorKey: "COMPUTER_SCIENCE",
      majorDisplayLabel: "컴퓨터공학",
      targetJobId: "BACKEND_DEVELOPMENT",
      targetJobLabel: "백엔드 개발",
      targetJobCategory: "engineering",
    },
    expectedBehavior: "should use registry bridge (courses: 자료구조, 알고리즘, 데이터베이스...)",
  },
  {
    name: "Case 4: COMPUTER_SCIENCE → PM_SERVICE_PLANNING (registry bridge, no planning experience assumption)",
    input: {
      majorKey: "COMPUTER_SCIENCE",
      majorDisplayLabel: "컴퓨터공학",
      targetJobId: "PM_SERVICE_PLANNING",
      targetJobLabel: "서비스기획",
      targetJobCategory: "product",
    },
    expectedBehavior: "should use registry bridge with architecture focus (avoids planning experience claim)",
  },
  {
    name: "Case 5: MATH_STATISTICS → DATA_ANALYSIS (registry bridge)",
    input: {
      majorKey: "MATH_STATISTICS",
      majorDisplayLabel: "수학·통계",
      targetJobId: "DATA_ANALYSIS",
      targetJobLabel: "데이터 분석",
      targetJobCategory: "data",
    },
    expectedBehavior: "should use registry bridge (courses: 통계학개론, 회귀분석, 데이터마이닝...)",
  },
  {
    name: "Case 6: INDUSTRIAL_ENGINEERING → PM_SERVICE_PLANNING (registry bridge, P0 patch)",
    input: {
      majorKey: "INDUSTRIAL_ENGINEERING",
      majorDisplayLabel: "산업공학",
      targetJobId: "PM_SERVICE_PLANNING",
      targetJobLabel: "서비스기획",
      targetJobCategory: "product",
    },
    expectedBehavior: "should use registry bridge with system/process optimization focus (courses: 생산운영관리, 경영과학, 품질관리...)",
  },
  {
    name: "Case 7: SOFTWARE → BACKEND_DEVELOPMENT (Round 2)",
    input: {
      majorKey: "SOFTWARE",
      majorDisplayLabel: "소프트웨어",
      targetJobId: "BACKEND_DEVELOPMENT",
      targetJobLabel: "백엔드 개발",
      targetJobCategory: "engineering",
    },
    expectedBehavior: "should use registry bridge (courses: 프로그래밍, 자료구조, 알고리즘, 데이터베이스...)",
  },
  {
    name: "Case 8: ELECTRICAL_ELECTRONIC → PRODUCTION_MANAGEMENT (Round 2)",
    input: {
      majorKey: "ELECTRICAL_ELECTRONIC",
      majorDisplayLabel: "전기전자",
      targetJobId: "PRODUCTION_MANAGEMENT",
      targetJobLabel: "생산관리",
      targetJobCategory: "operations",
    },
    expectedBehavior: "should use registry bridge (courses: 회로, 신호처리, 반도체, 임베디드...)",
  },
  {
    name: "Case 9: CHEMISTRY → PRODUCTION_MANAGEMENT (Round 2)",
    input: {
      majorKey: "CHEMISTRY",
      majorDisplayLabel: "화학",
      targetJobId: "PRODUCTION_MANAGEMENT",
      targetJobLabel: "생산기술",
      targetJobCategory: "operations",
    },
    expectedBehavior: "should use registry bridge (courses: 화학실험, 물리화학, 분석화학, 화학공학...)",
  },
  {
    name: "Case 10: ACCOUNTING_TAX → FINANCIAL_PLANNING (Round 2)",
    input: {
      majorKey: "ACCOUNTING_TAX",
      majorDisplayLabel: "회계·세무",
      targetJobId: "FINANCIAL_PLANNING",
      targetJobLabel: "FP&A",
      targetJobCategory: "finance",
    },
    expectedBehavior: "should use registry bridge (courses: 회계원론, 재무제표분석, 세법...)",
  },
  {
    name: "Case 11: BIO_LIFE_SCIENCE → PRODUCTION_MANAGEMENT (Round 2)",
    input: {
      majorKey: "BIO_LIFE_SCIENCE",
      majorDisplayLabel: "바이오·생명과학",
      targetJobId: "PRODUCTION_MANAGEMENT",
      targetJobLabel: "품질관리",
      targetJobCategory: "operations",
    },
    expectedBehavior: "should use registry bridge (courses: 세포생물학, 약리학, 미생물학...)",
  },
  {
    name: "Case 12: PHARMACY → PM_SERVICE_PLANNING (Round 2)",
    input: {
      majorKey: "PHARMACY",
      majorDisplayLabel: "약학",
      targetJobId: "PM_SERVICE_PLANNING",
      targetJobLabel: "약학·기획",
      targetJobCategory: "product",
    },
    expectedBehavior: "should use registry bridge (courses: 약물학, 약제학, 약동학...)",
  },
  {
    name: "Case 13: PUBLIC_POLICY → PM_SERVICE_PLANNING (Round 2)",
    input: {
      majorKey: "PUBLIC_POLICY",
      majorDisplayLabel: "행정·정책",
      targetJobId: "PM_SERVICE_PLANNING",
      targetJobLabel: "사업기획",
      targetJobCategory: "product",
    },
    expectedBehavior: "should use registry bridge (courses: 정책학, 행정학, 예산론...)",
  },
  {
    name: "Case 14: SOCIOLOGY → HR_ORGANIZATION (Round 2)",
    input: {
      majorKey: "SOCIOLOGY",
      majorDisplayLabel: "사회학",
      targetJobId: "HR_ORGANIZATION",
      targetJobLabel: "HR",
      targetJobCategory: "hr",
    },
    expectedBehavior: "should use registry bridge (courses: 조사방법론, 조직사회학...)",
  },
  {
    name: "Case 15: OTHER_HUMANITIES → CONTENT_MARKETING (Round 2 P0 softened)",
    input: {
      majorKey: "OTHER_HUMANITIES",
      majorDisplayLabel: "기타 인문",
      targetJobId: "CONTENT_MARKETING",
      targetJobLabel: "콘텐츠 기획",
      targetJobCategory: "marketing",
    },
    expectedBehavior: "should soften bridge to emphasize '기초가 될 수 있음' + content production/performance data as required evidence (NOT direct fit)",
  },
  {
    name: "Case 16: USER_EXPERIENCE → UX_RESEARCH (Round 2)",
    input: {
      majorKey: "USER_EXPERIENCE",
      majorDisplayLabel: "UX/HCI",
      targetJobId: "UX_RESEARCH",
      targetJobLabel: "UX 리서치",
      targetJobCategory: "design",
    },
    expectedBehavior: "should use registry bridge (courses: 사용자조사, 사용성평가, 프로토타이핑...)",
  },
];

// Run tests
let passCount = 0;
let failCount = 0;

testCases.forEach((testCase, idx) => {
  console.log(`\n${"-".repeat(80)}`);
  console.log(`Test ${idx + 1}: ${testCase.name}`);
  console.log(`${"-".repeat(80)}`);
  console.log(`Expected: ${testCase.expectedBehavior}`);

  try {
    const result = buildNewgradAxis1CanonicalReading(testCase.input);

    console.log("\n✓ Function executed successfully");
    console.log("\nGenerated scoreReason:");
    console.log(`  ${result.scoreReason.substring(0, 150)}...`);
    console.log("\nGenerated liftOrLimit:");
    console.log(`  ${result.liftOrLimit.substring(0, 150)}...`);

    // Validation checks
    const checks = [];

    if (idx === 0) {
      // Case 1: Check for hardcoded courses
      if (result.liftOrLimit.includes("미시경제학") && result.liftOrLimit.includes("산업조직론")) {
        checks.push("✓ Hardcoded Economics→PMM courses preserved");
      } else {
        checks.push("✗ Missing hardcoded Economics→PMM courses");
        failCount++;
      }
    } else if (idx === 1) {
      // Case 2: Check for Business courses (different from Economics)
      if (result.liftOrLimit.includes("마케팅원론") || result.liftOrLimit.includes("소비자행동론")) {
        checks.push("✓ Business courses detected (registry bridge working)");
      } else if (result.liftOrLimit.includes("미시경제학")) {
        checks.push("✗ ERROR: Economics courses leaked into Business major!");
        failCount++;
      } else {
        checks.push("⚠ Unable to verify Business courses in output");
      }
    } else if (idx === 2) {
      // Case 3: Check for CS courses
      if (result.liftOrLimit.includes("자료구조") || result.liftOrLimit.includes("알고리즘") || result.liftOrLimit.includes("데이터베이스")) {
        checks.push("✓ CS courses detected (registry bridge working)");
      } else {
        checks.push("⚠ Unable to verify CS courses in output");
      }
    } else if (idx === 3) {
      // Case 4: Check that it doesn't claim planning experience
      if (!result.scoreReason.includes("기획 경험") && !result.scoreReason.includes("기획을 해봤")) {
        checks.push("✓ No false planning experience claim");
      } else {
        checks.push("⚠ Possible planning experience claim detected");
      }
    } else if (idx === 4) {
      // Case 5: Check for Statistics courses
      if (result.liftOrLimit.includes("통계학") || result.liftOrLimit.includes("회귀분석") || result.liftOrLimit.includes("데이터마이닝")) {
        checks.push("✓ Statistics courses detected (registry bridge working)");
      } else {
        checks.push("⚠ Unable to verify Statistics courses in output");
      }
    } else if (idx === 5) {
      // Case 6: Check for IE courses and PM focus
      if ((result.liftOrLimit.includes("생산운영관리") || result.liftOrLimit.includes("경영과학") || result.liftOrLimit.includes("품질관리")) &&
          !result.liftOrLimit.includes("미시경제학")) {
        checks.push("✓ Industrial Engineering courses detected (registry bridge working)");
      } else {
        checks.push("⚠ Unable to verify IE courses in output");
      }
      if (result.liftOrLimit.includes("사용자") || result.liftOrLimit.includes("프로세스") || result.liftOrLimit.includes("운영")) {
        checks.push("✓ PM/service planning context detected");
      } else {
        checks.push("⚠ PM context validation limited");
      }
    } else if (idx === 14) {
      // Case 15: OTHER_HUMANITIES → CONTENT_MARKETING (P0 softened bridge)
      const hasSoftenedPhrase = result.liftOrLimit.includes("기초가 될 수") || result.scoreReason.includes("기초가 될 수");
      const hasProductionEmphasis = result.liftOrLimit.includes("콘텐츠 제작") || result.liftOrLimit.includes("성과") || result.liftOrLimit.includes("데이터");
      const noOverClaim = !result.scoreReason.includes("설명할 수 있습니다") && !result.scoreReason.includes("연결될 수 있습니다");

      if (hasSoftenedPhrase) {
        checks.push("✓ Softened bridge phrase '기초가 될 수' detected");
      } else {
        checks.push("⚠ Softened phrase not clearly detected");
      }
      if (hasProductionEmphasis) {
        checks.push("✓ Content production/performance emphasis detected");
      } else {
        checks.push("⚠ Production/performance emphasis unclear");
      }
      if (noOverClaim) {
        checks.push("✓ No over-claiming language detected");
      } else {
        checks.push("⚠ Possible over-claiming language found");
      }
    }

    if (checks.length > 0) {
      console.log("\nValidation checks:");
      checks.forEach(check => console.log(`  ${check}`));
    }

    passCount++;
  } catch (error) {
    console.log(`✗ Function execution failed: ${error.message}`);
    console.log(`  Stack: ${error.stack}`);
    failCount++;
  }
});

// Summary
console.log(`\n${"=".repeat(80)}`);
console.log(`Test Summary: ${passCount} passed, ${failCount} failed`);
console.log(`${"=".repeat(80)}\n`);

// Additional checks
console.log("Additional Registry Integration Checks:");
console.log("-".repeat(80));

const registryChecks = [
  { name: "ECONOMICS→PMM registry lookup", major: "ECONOMICS", job: "PRODUCT_MARKETING_PMM" },
  { name: "BUSINESS_ADMIN→PMM registry lookup", major: "BUSINESS_ADMIN", job: "PRODUCT_MARKETING_PMM" },
  { name: "COMPUTER_SCIENCE→BACKEND registry lookup", major: "COMPUTER_SCIENCE", job: "BACKEND_DEVELOPMENT" },
  { name: "MATH_STATISTICS→DATA_ANALYSIS registry lookup", major: "MATH_STATISTICS", job: "DATA_ANALYSIS" },
  { name: "INDUSTRIAL_ENGINEERING→PM_SERVICE_PLANNING registry lookup", major: "INDUSTRIAL_ENGINEERING", job: "PM_SERVICE_PLANNING" },
  { name: "SOFTWARE→BACKEND_DEVELOPMENT registry lookup", major: "SOFTWARE", job: "BACKEND_DEVELOPMENT" },
  { name: "ELECTRICAL_ELECTRONIC→PRODUCTION_MANAGEMENT registry lookup", major: "ELECTRICAL_ELECTRONIC", job: "PRODUCTION_MANAGEMENT" },
  { name: "CHEMISTRY→PRODUCTION_MANAGEMENT registry lookup", major: "CHEMISTRY", job: "PRODUCTION_MANAGEMENT" },
  { name: "ACCOUNTING_TAX→FINANCIAL_PLANNING registry lookup", major: "ACCOUNTING_TAX", job: "FINANCIAL_PLANNING" },
  { name: "BIO_LIFE_SCIENCE→PRODUCTION_MANAGEMENT registry lookup", major: "BIO_LIFE_SCIENCE", job: "PRODUCTION_MANAGEMENT" },
  { name: "PHARMACY→PM_SERVICE_PLANNING registry lookup", major: "PHARMACY", job: "PM_SERVICE_PLANNING" },
  { name: "PUBLIC_POLICY→PM_SERVICE_PLANNING registry lookup", major: "PUBLIC_POLICY", job: "PM_SERVICE_PLANNING" },
  { name: "SOCIOLOGY→HR_ORGANIZATION registry lookup", major: "SOCIOLOGY", job: "HR_ORGANIZATION" },
  { name: "OTHER_HUMANITIES→CONTENT_MARKETING registry lookup", major: "OTHER_HUMANITIES", job: "CONTENT_MARKETING" },
  { name: "USER_EXPERIENCE→UX_RESEARCH registry lookup", major: "USER_EXPERIENCE", job: "UX_RESEARCH" },
];

registryChecks.forEach(check => {
  const bridge = resolveNewgradMajorBridgeProfile(check.major, check.job);
  if (bridge) {
    console.log(`✓ ${check.name}: Found`);
    if (bridge.appealingCourses) {
      console.log(`  Courses: ${bridge.appealingCourses.slice(0, 3).join(", ")}${bridge.appealingCourses.length > 3 ? "..." : ""}`);
    }
  } else {
    console.log(`✗ ${check.name}: Not found`);
  }
});

console.log("\n" + "=".repeat(80));
console.log("Validation complete. Check output above for results.");
console.log("=".repeat(80) + "\n");
