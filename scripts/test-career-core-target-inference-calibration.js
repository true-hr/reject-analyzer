import assert from "node:assert/strict";
import { buildCareerCoreTargetFromJdFit } from "../src/lib/resume/buildCareerCoreTargetFromJdFit.js";
import { buildRejectionCareerCoreSignal } from "../src/lib/preciseAnalysis/buildRejectionCareerCoreSignal.js";
import {
  REJECTION_CAREER_CORE_REALISTIC_QA_CURRENT_DATE,
  rejectionCareerCoreRealisticQaCases,
} from "../src/lib/preciseAnalysis/__fixtures__/rejectionCareerCoreRealisticQaCases.js";

function infer(input) {
  return buildCareerCoreTargetFromJdFit(input);
}

const genericQualityCases = [
  {
    name: "service quality metrics",
    jdText: "Operations manager for CS workflow, SOP, process improvement, vendor coordination, and service quality metrics.",
    targetRole: "Operations Manager",
    targetIndustry: "Platform Operations",
  },
  {
    name: "customer quality",
    jdText: "Customer operations lead for support quality, customer quality feedback, CS quality metrics, and service improvement.",
    targetRole: "Customer Support Operations",
    targetIndustry: "Platform Operations",
  },
];

for (const testCase of genericQualityCases) {
  const target = infer(testCase);
  assert.notEqual(target?.roleFamily, "production_quality", `${testCase.name} should not infer production_quality`);
}

const serviceQualityTarget = infer(genericQualityCases[0]);
assert.equal(serviceQualityTarget?.roleFamily, "operations");

const productionQualityCases = [
  {
    name: "bio GMP quality",
    jdText: "GMP production quality specialist for bio pharma manufacturing. Review batch records, deviation reports, inspection readiness, and quality process controls.",
    targetRole: "Production Quality",
    targetIndustry: "Bio Pharma",
  },
  {
    name: "korean bio GMP quality",
    jdText: "바이오 의약품 생산 품질 담당자를 채용합니다. GMP 제조 기록서 검토, 일탈 보고, 공정 품질 관리, 실사 대응 경험을 요구합니다.",
  },
  {
    name: "quality control",
    jdText: "Quality control specialist for manufacturing process validation, inspection, CAPA, and batch release.",
  },
];

for (const testCase of productionQualityCases) {
  const target = infer(testCase);
  assert.equal(target?.roleFamily, "production_quality", `${testCase.name} should infer production_quality`);
}

const realisticOperationsCase = rejectionCareerCoreRealisticQaCases.find(
  (testCase) => testCase.id === "real-007-operations-cs-process"
);
assert.ok(realisticOperationsCase, "real-007 fixture is required");

const realisticOperationsSignal = buildRejectionCareerCoreSignal({
  resumeProfile: realisticOperationsCase.resumeProfile,
  jdText: realisticOperationsCase.jdText,
  targetRole: realisticOperationsCase.targetRole,
  targetCompany: realisticOperationsCase.targetCompany,
  targetIndustry: realisticOperationsCase.targetIndustry,
  currentDate: REJECTION_CAREER_CORE_REALISTIC_QA_CURRENT_DATE,
});

assert.equal(realisticOperationsSignal.status, "ready");
assert.notEqual(realisticOperationsSignal.target?.roleFamily, "production_quality");
assert.equal(realisticOperationsSignal.target?.roleFamily, "operations");

const ambiguousTarget = infer({
  jdText: "We are hiring a flexible team member for a growing organization. Communicate well and support business tasks.",
});
assert.equal(ambiguousTarget, null);

console.log("PASS career-core target inference calibration checks");
