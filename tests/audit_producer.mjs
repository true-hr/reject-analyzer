import { analyze } from "../src/lib/analyzer.js";

const FULL_STATE = {
  company: "영풍정밀", role: "기획팀 (6년차)", roleTarget: "",
  roleKscoMajor: "unknown", roleKscoOfficeSub: "", stage: "서류", applyDate: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "",
  jd: "주요업무: 연간 사업계획/예산 수립, KPI 관리, 손익(P/L) 분석\n자격요건(필수): 제조업 B2B 사업기획/전략기획 경력 5년+",
  resume: "경력요약: B2B 제조업 기획/운영 6년. 연간 KPI 운영, P/L 분석.\n강점: 데이터 기반 의사결정.\n보완: P/L 직접 운영 제한적.",
  portfolio: "", interviewNotes: "",
  career: { totalYears: 6, gapMonths: 0, jobChanges: 2, lastTenureMonths: 18 },
  selfCheck: { coreFit: 3, proofStrength: 3, roleClarity: 3, storyConsistency: 3, riskSignals: 3, cultureFit: 3 },
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "", roleCurrent: "", roleCurrentSub: "",
  roleTargetSub: "", currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
};

const r = analyze(FULL_STATE, null);
const ip = r?.interactionPack;

console.log("=== interactionPack top-level keys ===");
console.log(Object.keys(ip ?? {}));

// careerAccumulation section
const ca = ip?.interpretationPack?.sections?.careerAccumulation;
console.log("\n=== careerAccumulation section ===");
console.log("status:", ca?.status);
console.log("slots:", JSON.stringify({
  relatedCareerSignals: (ca?.slots?.relatedCareerSignals ?? []).length,
  continuitySignals: (ca?.slots?.continuitySignals ?? []).length,
  consistencySignals: (ca?.slots?.consistencySignals ?? []).length,
  transitionReadinessSignals: (ca?.slots?.transitionReadinessSignals ?? []).length,
}));

// candidateAxisPack from interactionPack (what axPack was)
const axPack = ip?.axes?.candidateAxisPack ?? r?.candidateAxisPack ?? null;
console.log("\n=== candidateAxisPack ===");
console.log("available:", axPack?.available);
console.log("jobAxis.available:", axPack?.jobAxis?.available);
console.log("jobAxis.sameFamily:", axPack?.jobAxis?.sameFamily);
console.log("jobAxis.familyDistance:", axPack?.jobAxis?.familyDistance);
console.log("industryAxis.available:", axPack?.industryAxis?.available);

// interactionDecision
const iDec = ip?.interactionDecision ?? null;
console.log("\n=== interactionDecision ===");
if (iDec) {
  console.log("keys:", Object.keys(iDec));
  console.log("supportDrivers:", JSON.stringify(iDec?.supportDrivers ?? null).slice(0,100));
  console.log("riskDrivers:", JSON.stringify(iDec?.riskDrivers ?? null).slice(0,100));
  console.log("conflicts:", JSON.stringify(iDec?.conflicts ?? null).slice(0,100));
} else {
  console.log("iDec: null");
}

// selectionResolvedDiagnostics
const selDiag = ip?.selectionResolvedDiagnostics ?? ip?.interpretationInput?.selectionResolvedDiagnostics ?? null;
console.log("\n=== selectionResolvedDiagnostics ===");
console.log(selDiag ? JSON.stringify(selDiag).slice(0,200) : "null");

// What axPack is actually available inside interactionPack
console.log("\n=== ip.axes (what buildInteractionPack receives as axes) ===");
console.log(JSON.stringify(ip?.axes ?? null, null, 2)?.slice(0, 400));
