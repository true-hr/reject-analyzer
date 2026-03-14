/**
 * 안정화 라운드 — 확장 fixture 검증
 * 기존 6개 + 추가 3개 (role 유사/비유사 케이스 포함)
 * 실행: node ./scripts/verify_extended.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyze } from "../src/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.resolve(__dirname, "../tests/fixtures");
const rd = (rel) => {
  const p = path.resolve(FIX, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8").trim() : "";
};

const CASES = [
  // 기존 6개
  { id: "sql-match",         group: "match",    state: { jd: rd("match/jd_sql_match.txt"),               resume: rd("match/resume_sql_match.txt") } },
  { id: "strategy-match",    group: "match",    state: { jd: rd("match/jd_strategy_match.txt"),          resume: rd("match/resume_strategy_match.txt") } },
  { id: "b2b-match",         group: "match",    state: { jd: rd("match/jd_b2b_marketing_match.txt"),     resume: rd("match/resume_b2b_marketing_match.txt") } },
  { id: "sql-mismatch",      group: "mismatch", state: { jd: rd("mismatch/jd_sql_required.txt"),         resume: rd("mismatch/resume_data_reporting.txt") } },
  { id: "role-mismatch",     group: "mismatch", state: { jd: rd("mismatch/jd_strategy_planning.txt"),    resume: rd("mismatch/resume_strategy_sourcing.txt") } },
  { id: "domain-mismatch",   group: "mismatch", state: { jd: rd("mismatch/jd_b2b_saas_marketing.txt"),   resume: rd("mismatch/resume_retail_promotion.txt") } },
  // 추가 케이스
  { id: "content-mkt-match", group: "match",    state: { jd: rd("match/jd_content_marketing_match.txt"), resume: rd("match/resume_content_marketing_match.txt") } },
  { id: "seniority-mismatch",group: "mismatch", state: { jd: rd("mismatch/jd_seniority_lead.txt"),       resume: rd("mismatch/resume_seniority_support.txt") } },
  { id: "fin-sales-mismatch",group: "mismatch", state: { jd: rd("mismatch/jd_finance_planning.txt"),     resume: rd("mismatch/resume_sales_account.txt") } },
];

console.log("\n=== 안정화 라운드 — 확장 검증 (9케이스) ===\n");

const results = [];
for (const c of CASES) {
  const r = analyze(c.state, null);
  const scores  = r?.hireability?.scores ?? null;
  const after   = r?.hireability?.final?.hireabilityScore ?? null;
  const caps    = r?.hireability?.final?.capsApplied ?? [];
  const capVal  = r?.hireability?.final?.capValue ?? null;
  const simVM   = r?.simulationViewModel ?? r?.reportPack?.simulationViewModel ?? null;
  const pmId    = simVM?.passmapType?.id ?? null;
  const ms      = r?.keywordSignals?.matchScore;
  const rolePath = caps.find(cap => cap.rule === "B_role_mismatch")?.path
                 || r?.hireability?.final?.rolePathUsed
                 || "none";

  results.push({
    case:        c.id,
    group:       c.group,
    score:       after ?? "?",
    matchScore:  ms != null ? Math.round(ms * 100) + "%" : "?",
    capsApplied: caps.map(cap => cap.rule.replace(/^[A-D]_/, "")).join("+") || "none",
    selectedCap: capVal ?? "none",
    rolePathUsed: rolePath,
    simVM:       simVM ? "✓" : "✗",
    passmapType: pmId ?? (simVM ? "?(no id)" : "✗"),
  });
}

// 표 출력
const cols = ["case", "group", "score", "matchScore", "capsApplied", "selectedCap", "rolePathUsed", "simVM", "passmapType"];
const W    = [20, 8, 6, 10, 26, 11, 12, 5, 11];
const pad  = (s, n) => String(s ?? "").padEnd(n);
console.log(cols.map((h, i) => pad(h, W[i])).join(" | "));
console.log(cols.map((_, i) => "-".repeat(W[i])).join("-+-"));
for (const r of results) console.log(cols.map((k, i) => pad(r[k], W[i])).join(" | "));

// 그룹 집계
const mR  = results.filter(r => r.group === "match");
const mmR = results.filter(r => r.group === "mismatch");
const avg = (arr) => arr.reduce((s, r) => s + (Number(r.score) || 0), 0) / (arr.length || 1);
const mAvg = avg(mR), mmAvg = avg(mmR);

console.log(`\n그룹 집계:`);
console.log(`  match    (${mR.length}건) avg=${mAvg.toFixed(1)}`);
console.log(`  mismatch (${mmR.length}건) avg=${mmAvg.toFixed(1)}`);
console.log(`  delta    (match − mismatch) = ${(mAvg - mmAvg).toFixed(1)}`);

// 안정성 체크
const allSimVM      = results.every(r => r.simVM === "✓");
const allPassmap    = results.every(r => r.passmapType && r.passmapType !== "✗");
const noMatchCap    = mR.every(r => r.selectedCap === "none" || Number(r.selectedCap) >= 44);
const roleMismatch  = results.find(r => r.case === "role-mismatch")?.capsApplied.includes("role_mismatch");
const finSales      = results.find(r => r.case === "fin-sales-mismatch")?.capsApplied.includes("role_mismatch");
const contentMatch  = !results.find(r => r.case === "content-mkt-match")?.capsApplied.includes("role_mismatch");
const seniorityFire = results.find(r => r.case === "seniority-mismatch")?.capsApplied !== "none";
const deltaOk       = (mAvg - mmAvg) >= 1.5;

console.log(`\n안정성 체크:`);
console.log(`  simVM 전체 정상                         → ${allSimVM     ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  passmapType 전체 존재                   → ${allPassmap   ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  match 케이스 강한 cap 미발화(≤44만 허용) → ${noMatchCap   ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  role-mismatch [B] 발화                  → ${roleMismatch ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  fin-sales-mismatch [B] 발화             → ${finSales     ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  content-mkt-match [B] 미발화            → ${contentMatch ? "✓ PASS" : "✗ FAIL"}`);
console.log(`  seniority-mismatch cap 발화             → ${seniorityFire? "✓ PASS" : "✗ FAIL"}`);
console.log(`  delta ≥ 1.5 (${(mAvg - mmAvg).toFixed(1)})                       → ${deltaOk      ? "✓ PASS" : "✗ FAIL"}`);
