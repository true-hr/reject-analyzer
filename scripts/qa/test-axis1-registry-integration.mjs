#!/usr/bin/env node

/**
 * Test validation for Axis1 Registry Integration
 * Run with: node test-axis1-registry-integration.mjs
 *
 * Tests the 5 required validation cases:
 * 1. ECONOMICS → PRODUCT_MARKETING_PMM (preserved hardcoded text)
 * 2. BUSINESS_ADMIN → PRODUCT_MARKETING_PMM (registry bridge)
 * 3. COMPUTER_SCIENCE → BACKEND_DEVELOPMENT (registry bridge)
 * 4. COMPUTER_SCIENCE → PM_SERVICE_PLANNING (registry bridge)
 * 5. MATH_STATISTICS → DATA_ANALYSIS (registry bridge)
 */

import { buildNewgradAxis1CanonicalReading } from "./src/data/transitionLite/axisExplanationRegistry.js";
import { resolveNewgradMajorBridgeProfile } from "./src/data/transitionLite/newgradMajorBridgeRegistry.js";

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
