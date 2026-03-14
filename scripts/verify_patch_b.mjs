/**
 * [강산.md] hireabilityScore cap 패치 검증 (수정 A+B 반영)
 * 실행: node ./scripts/verify_patch_b.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../src/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.resolve(__dirname, "../tests/fixtures");
const rd = (rel) => { const p = path.resolve(FIX, rel); return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : ""; };

function calcBefore(scores) {
  if (!scores) return null;
  const W = { responsibility:0.22,ownership:0.18,decisionExposure:0.16,industryFit:0.14,businessModelFit:0.10,executionFit:0.08,companySizeFit:0.00,signalStrength:0.06 };
  const n55 = x => { const n=Number(x); return Number.isFinite(n)?Math.max(0,Math.min(100,Math.round(n))):55; };
  const S = {
    responsibility: scores.responsibilityLevelFitScore??35,
    ownership: scores.ownershipLevelScore,
    decisionExposure: scores.decisionExposureScore,
    industryFit: scores.industryFitScore,
    businessModelFit: scores.businessModelFitScore,
    executionFit: scores.executionCoordinationFitScore,
    companySizeFit: scores.companySizeFitScore,
    signalStrength: scores.signalStrengthScore??0,
  };
  let sumW=0, out=0;
  for (const [k,w] of Object.entries(W)) { sumW+=w; out+=w*n55(S[k]); }
  return Math.max(0,Math.min(100,Math.round(out/(sumW||1))));
}

const CASES = [
  { id:"sql-match",       state:{jd:rd("match/jd_sql_match.txt"),       resume:rd("match/resume_sql_match.txt")} },
  { id:"strategy-match",  state:{jd:rd("match/jd_strategy_match.txt"),  resume:rd("match/resume_strategy_match.txt")} },
  { id:"b2b-match",       state:{jd:rd("match/jd_b2b_marketing_match.txt"), resume:rd("match/resume_b2b_marketing_match.txt")} },
  { id:"sql-mismatch",    state:{jd:rd("mismatch/jd_sql_required.txt"),  resume:rd("mismatch/resume_data_reporting.txt")} },
  { id:"role-mismatch",   state:{jd:rd("mismatch/jd_strategy_planning.txt"), resume:rd("mismatch/resume_strategy_sourcing.txt")} },
  { id:"domain-mismatch", state:{jd:rd("mismatch/jd_b2b_saas_marketing.txt"), resume:rd("mismatch/resume_retail_promotion.txt")} },
];

console.log("\n=== [강산.md] cap 수정 A+B 검증 ===\n");

const results = [];
for (const c of CASES) {
  const r = analyze(c.state, null);
  const scores = r?.hireability?.scores ?? null;
  const after  = r?.hireability?.final?.hireabilityScore ?? null;
  const caps   = r?.hireability?.final?.capsApplied ?? [];
  const capVal = r?.hireability?.final?.capValue ?? null;
  const before = calcBefore(scores);
  const delta  = after!=null&&before!=null ? after-before : null;
  const simVM  = r?.simulationViewModel ?? r?.reportPack?.simulationViewModel ?? null;
  const pmId   = simVM?.passmapType?.id ?? null;
  const ms     = r?.keywordSignals?.matchScore;
  const rolePath = caps.find(c=>c.rule==="B_role_mismatch")?.path
                || r?.hireability?.final?.rolePathUsed
                || "none";

  results.push({
    case: c.id,
    beforeHireability: before,
    afterHireability: after,
    delta: delta!=null?(delta>=0?`+${delta}`:`${delta}`):"?",
    matchScore: ms!=null?Math.round(ms*100)+"%":"?",
    capsApplied: caps.map(c=>c.rule.replace(/^[A-D]_/,"")).join("+") || "none",
    selectedCap: capVal??"none",
    rolePathUsed: rolePath,
    simVM: simVM?"✓":"✗",
    passmapType: pmId??(simVM?"?(no id)":"✗"),
  });
}

// 표 출력
const cols = ["case","beforeHireability","afterHireability","delta","matchScore","capsApplied","selectedCap","rolePathUsed","simVM","passmapType"];
const W    = [16,6,5,6,10,26,11,10,5,11];
const pad  = (s,n) => String(s??"").padEnd(n);
console.log(cols.map((h,i)=>pad(h,W[i])).join(" | "));
console.log(cols.map((_,i)=>"-".repeat(W[i])).join("-+-"));
for (const r of results) console.log(cols.map((k,i)=>pad(r[k],W[i])).join(" | "));

// 집계
const mR  = results.filter(r=>!r.case.includes("mismatch"));
const mmR = results.filter(r=> r.case.includes("mismatch"));
const avg = (arr,k) => arr.reduce((s,r)=>s+(Number(r[k])||0),0)/(arr.length||1);
const mAfter=avg(mR,"afterHireability"), mmAfter=avg(mmR,"afterHireability");
const mBefore=avg(mR,"beforeHireability"), mmBefore=avg(mmR,"beforeHireability");

console.log(`\n집계:`);
console.log(`  match    before=${mBefore.toFixed(1)}  after=${mAfter.toFixed(1)}  delta=${(mAfter-mBefore).toFixed(1)}`);
console.log(`  mismatch before=${mmBefore.toFixed(1)}  after=${mmAfter.toFixed(1)}  delta=${(mmAfter-mmBefore).toFixed(1)}`);
console.log(`  delta 분리 (match−mismatch):  before=${(mBefore-mmBefore).toFixed(1)}  after=${(mAfter-mmAfter).toFixed(1)}`);

// 성공 기준
const matchDrop = mAfter - mBefore;
const deltaAfter = mAfter - mmAfter;
const roleMismatchFired = results.find(r=>r.case==="role-mismatch")?.capsApplied.includes("role_mismatch");
const strategyNoSeniority = !results.find(r=>r.case==="strategy-match")?.capsApplied.includes("seniority");
const b2bNoSeniority      = !results.find(r=>r.case==="b2b-match")?.capsApplied.includes("seniority");

console.log(`\n성공 기준:`);
console.log(`  role-mismatch [B] 발화       → ${roleMismatchFired?"✓ PASS":"✗ FAIL"}`);
console.log(`  strategy-match [D] 오발화 제거 → ${strategyNoSeniority?"✓ PASS":"✗ FAIL"}`);
console.log(`  b2b-match [D] 오발화 제거      → ${b2bNoSeniority?"✓ PASS":"✗ FAIL"}`);
console.log(`  match 하락폭 ≤ 1 (${matchDrop.toFixed(1)})        → ${matchDrop >= -1 ?"✓ PASS":"✗ FAIL"}`);
console.log(`  delta ≥ 2.0 (${deltaAfter.toFixed(1)})            → ${deltaAfter>=2.0?"✓ PASS":"✗ FAIL"}`);
console.log(`  simVM 전부 ✓                   → ${results.every(r=>r.simVM==="✓")?"✓ PASS":"✗ FAIL"}`);
console.log(`  passmapType 전부 존재           → ${results.every(r=>r.passmapType&&r.passmapType!=="✗")?"✓ PASS":"✗ FAIL"}`);
