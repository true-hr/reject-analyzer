// Phase 11-8: Runtime re-verification after careerAccumulation producer unlock
// Tests 3 samples: A (prev failing), B (boundary), C (risk-heavy)
import { analyze } from "../src/lib/analyzer.js";

function probe(label, state) {
  const r = analyze(state, null);
  const ip = r?.interactionPack;
  const ss = ip?.interpretationPack?.sectionSentences ?? {};
  const vm = r?.reportPack?.simulationViewModel;
  const rpCA = vm?.reportPack?.sections?.careerAccumulation ?? null;
  const rpRisk = vm?.reportPack?.sections?.riskSummary ?? null;
  const cf = vm?.careerInterpretation?.currentFlow ?? null;
  const caSection = ip?.interpretationPack?.sections?.careerAccumulation ?? null;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SAMPLE ${label}`);
  console.log("=".repeat(60));

  // --- Surface A: career flow ---
  console.log("\n[Surface A: career flow]");
  console.log("  careerAccumulation.status     :", caSection?.status);
  console.log("  sectionSentences.generationMode:", ss?.careerAccumulation?.generationMode);
  console.log("  sectionSentences.shortSummary  :", ss?.careerAccumulation?.shortSummary ?? "(null)");
  console.log("  rpCA.summaryText               :", rpCA?.summaryText ?? "(null)");
  console.log("  rpCA.renderMode                :", rpCA?.renderMode);
  console.log("  rpCA.summarySource             :", rpCA?.summarySource ?? "(sentenceDrafts-path)");
  console.log("  rpCA.reportSummaryEligible     :", rpCA?.surfacePolicy?.reportSummaryEligible);
  console.log("  currentFlow.summary            :", String(cf?.summary || "").slice(0, 80) || "(null)");
  // Simulate __preferredCareerSummaryText:
  // eligible = reportSummaryEligible && visibleNow && slotKey=careerSummary
  const __preferred = rpCA?.surfacePolicy?.reportSummaryEligible ? rpCA?.summaryText : null;
  const __cfSummary = String(cf?.summary || "").trim();
  const __display = __preferred ?? (__cfSummary || null);
  console.log("  → winning source               :", __preferred ? "canonical (reportPack)" : "legacy (currentFlow)");
  console.log("  → displayed text               :", String(__display || "").slice(0, 100) || "(empty)");
  const isGeneric = /하나의 중심축으로 읽기 어렵|중심 커리어 방향|정보가 제한|단정하기 어렵/.test(__display ?? "");
  console.log("  → quality judgment             :", __preferred ? (isGeneric ? "weak (still generic)" : "acceptable+") : "weak (legacy fallback)");

  // --- Surface B: core summary (sentenceDrafts) ---
  console.log("\n[Surface B: core summary]");
  const ssDrafts = rpCA?.sentenceDrafts ?? [];
  const firstEnabled = ssDrafts.find(d => d?.enabled && d?.textSeed);
  console.log("  sentenceDrafts[enabled].textSeed:", firstEnabled?.textSeed ?? "(none)");

  // --- Surface C: risk summary regression ---
  console.log("\n[Surface C: risk summary (regression)]");
  console.log("  rpRisk.renderMode              :", rpRisk?.renderMode);
  console.log("  rpRisk.summaryText             :", String(rpRisk?.summaryText || "").slice(0, 80) || "(null)");
  console.log("  rpRisk.reportSummaryEligible   :", rpRisk?.surfacePolicy?.reportSummaryEligible);
  const riskText = rpRisk?.summaryText ?? null;
  const riskIsCareerLeak = /중심축|커리어 흐름|career flow/i.test(riskText ?? "");
  console.log("  → regression (career text leak):", riskIsCareerLeak ? "YES ⚠️" : "no");
}

// Sample A: previously failing (영풍정밀, roleKscoMajor=unknown, strong experience match)
probe("A (prev failing — 영풍정밀 기획팀 6yr)", {
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
});

// Sample B: boundary — short career, partial experience match, ambiguous fit
probe("B (boundary — 스타트업 마케팅→기획 3yr, partial match)", {
  company: "테크스타트업", role: "사업기획", roleTarget: "",
  roleKscoMajor: "unknown", roleKscoOfficeSub: "", stage: "서류", applyDate: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "",
  jd: "주요업무: 신규 서비스 기획, 시장조사, 파트너십 개발\n자격요건(필수): 사업기획 또는 마케팅 경력 3년+",
  resume: "경력요약: 스타트업 마케팅/기획 3년. 신규 서비스 런칭 2회.\n강점: 빠른 실행력.\n약점: B2B 경험 없음.",
  portfolio: "", interviewNotes: "",
  career: { totalYears: 3, gapMonths: 2, jobChanges: 2, lastTenureMonths: 14 },
  selfCheck: { coreFit: 2, proofStrength: 2, roleClarity: 2, storyConsistency: 3, riskSignals: 3, cultureFit: 3 },
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "", roleCurrent: "", roleCurrentSub: "",
  roleTargetSub: "", currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
});

// Sample C: risk-heavy — career gap, frequent job changes, low experience match
probe("C (risk-heavy — 잦은 이직, 공백, 경험 미달)", {
  company: "대기업", role: "인사팀 팀장", roleTarget: "",
  roleKscoMajor: "unknown", roleKscoOfficeSub: "", stage: "서류", applyDate: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "",
  jd: "주요업무: HR 전략 수립, 조직개발, 채용 총괄\n자격요건(필수): HR 경력 8년+, 팀장 경험 필수",
  resume: "경력요약: 영업/마케팅/HR 등 다양한 직무 경험 5년.\n강점: 넓은 시야.\n약점: HR 전문성 부족.",
  portfolio: "", interviewNotes: "",
  career: { totalYears: 5, gapMonths: 12, jobChanges: 5, lastTenureMonths: 8 },
  selfCheck: { coreFit: 1, proofStrength: 1, roleClarity: 2, storyConsistency: 1, riskSignals: 1, cultureFit: 2 },
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "", roleCurrent: "", roleCurrentSub: "",
  roleTargetSub: "", currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
});
