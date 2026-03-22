// Debug: trace buildCandidateAxisPack chain step by step
import { analyze } from "../src/lib/analyzer.js";
import { buildCandidateAxisPack } from "../src/lib/analysis/buildCandidateAxisPack.js";
import { buildJobOntologyContext } from "../src/lib/adapters/buildJobContext.js";

const PM_RESOLVED = { id: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT" };
const SALES_OPS_RESOLVED = { id: "JOB_SALES_SALES_OPERATIONS" };

// Step 1: Direct adapter test
console.log("=== Step 1: buildJobOntologyContext direct ===");
const jobCtx = buildJobOntologyContext({
  current: { resolvedItem: PM_RESOLVED },
  target: { resolvedItem: PM_RESOLVED },
});
console.log("current.ok:", jobCtx.current.ok);
console.log("target.ok:", jobCtx.target.ok);
console.log("target.targetLevelHints:", jobCtx.target.targetLevelHints);
console.log("target.familyId:", jobCtx.target.familyId);
console.log("target.ontologyId:", jobCtx.target.ontologyId);

console.log("\n=== Step 2: buildCandidateAxisPack direct ===");
const axPack = buildCandidateAxisPack({
  currentJob: PM_RESOLVED,
  targetJob: PM_RESOLVED,
  currentIndustry: null,
  targetIndustry: null,
});
console.log("axPack.available:", axPack.available);
console.log("jobAxis.available:", axPack.jobAxis?.available);
console.log("jobAxis.familyDistance:", axPack.jobAxis?.familyDistance);
console.log("narrativeContext.familyDistance:", axPack.narrativeContext?.familyDistance);
console.log("narrativeContext.targetLevelHints:", axPack.narrativeContext?.targetLevelHints);

console.log("\n=== Step 3: analyze() with roleTargetResolved ===");
const r = analyze({
  company: "테스트", role: "PM", stage: "서류", applyDate: "",
  career: { totalYears: 4, gapMonths: 0, jobChanges: 1, lastTenureMonths: 24 },
  jd: "PM 경력 3년+. 로드맵, OKR, 이해관계자 조율.",
  resume: "PM 4년. 로드맵 수립, OKR 설정, 팀 리딩, 출시 3건.",
  portfolio: "", interviewNotes: "",
  selfCheck: { coreFit: 4, proofStrength: 4, roleClarity: 4, storyConsistency: 4, riskSignals: 2 },
  roleTarget: "", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "", roleCurrent: "",
  roleCurrentSub: "", roleTargetSub: "",
  currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
  roleTargetResolved: PM_RESOLVED,
  roleCurrentResolved: PM_RESOLVED,
}, null);

const vm = r?.reportPack?.simulationViewModel ?? {};
const canonical = r?.canonical ?? r?.stateCanonical?.canonical ?? null;
console.log("canonical.selectionResolved.targetJob:", canonical?.selectionResolved?.targetJob ?? "(missing)");
console.log("canonical.selectionResolvedMeta.hasTargetJob:", canonical?.selectionResolvedMeta?.hasTargetJob);
const nc = vm?.candidateAxisPack?.narrativeContext ?? {};
console.log("candidateAxisPack.available:", vm?.candidateAxisPack?.available);
console.log("candidateAxisPack.jobAxis.familyDistance:", vm?.candidateAxisPack?.jobAxis?.familyDistance);
console.log("narrativeContext.targetLevelHints:", nc?.targetLevelHints);
console.log("narrativeContext.familyDistance:", nc?.familyDistance);
