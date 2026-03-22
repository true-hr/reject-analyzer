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

// careerSignals
console.log("=== careerSignals ===");
const cs = r?.careerSignals ?? null;
if (cs) {
  console.log("keys:", Object.keys(cs));
  Object.entries(cs).forEach(([k, v]) => {
    if (v && typeof v === "object") console.log(` ${k}:`, JSON.stringify(v).slice(0, 100));
    else if (v !== null && v !== undefined) console.log(` ${k}:`, v);
  });
} else {
  console.log("careerSignals: null");
}

// evidenceFit meta
console.log("\n=== evidenceFit.meta ===");
const ef = r?.evidenceFit?.meta ?? null;
if (ef) console.log(JSON.stringify(ef).slice(0, 300));
else console.log("null");

// What does buildInterpretationPack assembly get as input for careerAccumulation?
const ip = r?.interactionPack;
const iip = ip?.interpretationPack;
console.log("\n=== interpretationInput (passed to buildInterpretationPack) ===");
const ii = ip?.interpretationInput ?? null;
if (ii) {
  console.log("keys:", Object.keys(ii));
  // Look for careerAccumulation relevant input
  const caInput = ii?.careerAccumulation ?? ii?.career ?? null;
  console.log("careerAccumulation input:", caInput ? JSON.stringify(caInput).slice(0,200) : "null");
} else {
  console.log("interpretationInput: null");
}

// What does buildCareerAccumulationAssembly receive?
// Reconstruct: it gets interpretationPack, interpretationInput, interactionDecision
// Check what interpretationPack.sections.careerAccumulation.slots has
const caSection = iip?.sections?.careerAccumulation;
console.log("\n=== careerAccumulation section FULL ===");
console.log(JSON.stringify(caSection, null, 2)?.slice(0, 600));

// Check: are there any relevant signals in careerSignals that SHOULD be in careerAccumulation?
console.log("\n=== careerSignals.relevantForCareerAccumulation ===");
const majorSignals = r?.majorSignals ?? null;
if (majorSignals) {
  console.log("majorSignals keys:", Object.keys(majorSignals));
  const continuityRelated = Object.entries(majorSignals).filter(([k]) =>
    /continuity|accumulation|career|tenure|gap|change/i.test(k)
  );
  continuityRelated.slice(0, 5).forEach(([k, v]) => console.log(` ${k}:`, JSON.stringify(v).slice(0,80)));
}

// riskLayer careerAccumulation related
const rl = r?.riskLayer ?? null;
const caRisks = (rl?.riskResults ?? []).filter(r => /career|accumul|continuity/i.test(JSON.stringify(r).toLowerCase()));
console.log("\n=== riskLayer risks related to career/continuity ===");
console.log("count:", caRisks.length);
caRisks.slice(0,3).forEach((rx, i) => console.log(` [${i}] id=${rx?.id || rx?.code}, label=${rx?.label?.slice(0,50)}`));
