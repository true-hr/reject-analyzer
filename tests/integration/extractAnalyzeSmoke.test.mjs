/**
 * extractAnalyzeSmoke.test.mjs
 *
 * 목적: extract → analyze 파이프라인 최소 E2E smoke 테스트
 *
 * 구성:
 *   1. PDF fixture → extractTextFromFile.node.js → analyze()
 *   2. DOCX fixture → extractTextFromFile.node.js → analyze()
 *   케이스당 검증:
 *     - extraction ok:true
 *     - analyze 결과 객체 생성 (핵심 필드 존재)
 *     - "완전 빈 분석 결과"가 아님
 *     - 기대 방향성 약한 검증 (keyword match, risk signal 존재)
 *
 * 실행 방법:
 *   node ./tests/integration/extractAnalyzeSmoke.test.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractTextFromFile } from "../../src/lib/extract/extractTextFromFile.node.js";
import { analyze } from "../../src/lib/analyzer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../fixtures/extract");

// ─── 테스트 러너 ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

async function itest(label, fn) {
  try {
    await fn();
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`       ${e.message}`);
    failures.push({ label, reason: e.message });
    failed++;
  }
}

function assertTrue(val, msg) {
  if (!val) throw new Error(msg ?? "조건 실패");
}

function assertExists(val, name) {
  if (val === undefined || val === null) throw new Error(`${name}이(가) null/undefined`);
}

// ─── 공용 analyze state 빌더 ─────────────────────────────────────────────────
// fixture: 홍길동, 백엔드 개발자, Python/FastAPI, PostgreSQL, AWS, 약 5년 경력
// JD: 백엔드 엔지니어 Python, 3년이상, REST API, RDB, SQL

function buildState(jdText, resumeText) {
  return {
    jd: jdText,
    resume: resumeText,
    career: {
      totalYears: 5,
      gapMonths: 1,
      jobChanges: 1,
      lastTenureMonths: 48,
      leadershipLevel: "ic",
    },
  };
}

// ─── 통합 검증 헬퍼 ──────────────────────────────────────────────────────────

function assertAnalysisShape(result, label) {
  assertExists(result, `analyze() 반환값 [${label}]`);
  assertTrue(typeof result === "object", `analyze() 반환값이 객체가 아닙니다 [${label}]`);

  // 핵심 필드 존재 확인
  assertExists(result.keywordSignals, "keywordSignals");
  assertExists(result.careerSignals, "careerSignals");
  assertExists(result.hypotheses, "hypotheses");

  // "완전 빈 분석 결과" 방지
  assertTrue(
    Array.isArray(result.hypotheses),
    "hypotheses가 배열이 아닙니다"
  );
}

function assertKeywordDirection(result, label) {
  const ks = result.keywordSignals;
  assertExists(ks, `keywordSignals [${label}]`);
  // matchScore가 0보다 커야 함 (Python/FastAPI 등 키워드 매치 기대)
  assertTrue(
    typeof ks.matchScore === "number",
    `keywordSignals.matchScore가 숫자가 아닙니다 [${label}]`
  );
  assertTrue(
    ks.matchScore > 0,
    `keywordSignals.matchScore가 0입니다 — 키워드 매치가 전혀 없습니다 [${label}] (score=${ks.matchScore})`
  );
}

function assertRiskSignalExists(result, label) {
  const dp = result.decisionPack;
  if (!dp) return; // decisionPack 없으면 skip (optional 필드)
  if (!Array.isArray(dp.riskResults)) return;
  // riskResults가 있으면 각 항목에 id / layer 필드가 있어야 함
  for (const r of dp.riskResults.slice(0, 3)) {
    assertTrue(
      typeof r.id === "string" || typeof r.id === "number",
      `riskResults 항목에 id가 없습니다 [${label}]`
    );
    assertTrue(
      r.layer === "gate" || r.layer === "risk" || typeof r.layer === "string",
      `riskResults 항목에 layer가 없습니다 [${label}]`
    );
  }
}

// ─── 케이스 정의 ─────────────────────────────────────────────────────────────

const CASES = [
  {
    label: "PDF fixture → analyze (이력서+JD 매칭)",
    jdFile: "jd_sample_01.pdf",
    resumeFile: "resume_sample_01.pdf",
    tag: "pdf",
  },
  {
    label: "DOCX fixture → analyze (이력서+JD 매칭)",
    jdFile: "jd_sample_01.docx",
    resumeFile: "resume_sample_01.docx",
    tag: "docx",
  },
  {
    label: "PDF(JD) + DOCX(resume) 크로스 조합",
    jdFile: "jd_sample_01.pdf",
    resumeFile: "resume_sample_01.docx",
    tag: "cross-pdf-jd+docx-resume",
  },
  {
    label: "DOCX(JD) + PDF(resume) 크로스 조합",
    jdFile: "jd_sample_01.docx",
    resumeFile: "resume_sample_01.pdf",
    tag: "cross-docx-jd+pdf-resume",
  },
];

// ─── 실행 ─────────────────────────────────────────────────────────────────────

console.log("\n── extract → analyze E2E smoke test ─────────────────────────\n");

for (const c of CASES) {
  await itest(c.label, async () => {
    // 1. extraction
    const jdResult = await extractTextFromFile(
      path.join(FIXTURE_DIR, c.jdFile),
      "jd"
    );
    assertTrue(
      jdResult.ok === true,
      `JD extraction 실패: ${jdResult.error} | ${jdResult.message}`
    );

    const resumeResult = await extractTextFromFile(
      path.join(FIXTURE_DIR, c.resumeFile),
      "resume"
    );
    assertTrue(
      resumeResult.ok === true,
      `Resume extraction 실패: ${resumeResult.error} | ${resumeResult.message}`
    );

    // 2. analyze
    const state = buildState(jdResult.text, resumeResult.text);
    let analysis;
    try {
      analysis = analyze(state);
    } catch (e) {
      throw new Error(`analyze() 예외 발생: ${e.message}`);
    }

    // 3. shape 검증
    assertAnalysisShape(analysis, c.tag);

    // 4. 키워드 방향성 검증 (Python/FastAPI 등 매칭 기대)
    assertKeywordDirection(analysis, c.tag);

    // 5. risk signal 구조 검증 (있으면)
    assertRiskSignalExists(analysis, c.tag);
  });
}

// ─── 방향성 추가 검증 — DOCX 케이스 상세 ─────────────────────────────────────

await itest("DOCX analyze: Python 키워드 매칭 확인", async () => {
  const jdResult = await extractTextFromFile(
    path.join(FIXTURE_DIR, "jd_sample_01.docx"), "jd"
  );
  const resumeResult = await extractTextFromFile(
    path.join(FIXTURE_DIR, "resume_sample_01.docx"), "resume"
  );
  assertTrue(jdResult.ok && resumeResult.ok, "extraction 실패");

  const analysis = analyze(buildState(jdResult.text, resumeResult.text));
  const ks = analysis.keywordSignals;

  // Python이 JD 키워드로 추출되거나 매칭되어야 함
  const jdKws = (ks.jdKeywords || []).map((k) => String(k).toLowerCase());
  const matchedKws = (ks.matchedKeywords || []).map((k) => String(k).toLowerCase());
  const hasPython =
    jdKws.some((k) => k.includes("python")) ||
    matchedKws.some((k) => k.includes("python"));
  assertTrue(hasPython, `Python 키워드가 jdKeywords 또는 matchedKeywords에 없습니다 (jd: ${JSON.stringify(jdKws.slice(0, 10))})`);
});

await itest("DOCX analyze: careerSignals 구조 확인", async () => {
  const jdResult = await extractTextFromFile(
    path.join(FIXTURE_DIR, "jd_sample_01.docx"), "jd"
  );
  const resumeResult = await extractTextFromFile(
    path.join(FIXTURE_DIR, "resume_sample_01.docx"), "resume"
  );
  assertTrue(jdResult.ok && resumeResult.ok, "extraction 실패");

  const analysis = analyze(buildState(jdResult.text, resumeResult.text));
  const cs = analysis.careerSignals;

  assertExists(cs, "careerSignals");
  assertTrue(
    typeof cs.careerRiskScore === "number" || typeof cs.experienceLevelScore === "number",
    `careerSignals에 score 필드가 없습니다: ${JSON.stringify(Object.keys(cs))}`
  );
  // 5년 경력 vs 3년 필수 → experienceGap >= 0 기대
  if (typeof cs.experienceGap === "number") {
    assertTrue(
      cs.experienceGap >= 0,
      `경력 5년 vs JD 3년 기준 experienceGap이 음수입니다: ${cs.experienceGap}`
    );
  }
});

// ─── 결과 출력 ─────────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed} passed / ${failed} failed\n`);

if (failures.length > 0) {
  console.error("실패 목록:");
  for (const f of failures) {
    console.error(`  ✗ ${f.label}`);
    console.error(`    이유: ${f.reason}`);
  }
  console.log();
}

if (failed > 0) {
  console.error("[FAIL] extractAnalyze smoke 테스트 실패\n");
  process.exit(1);
} else {
  console.log("[PASS] 모든 extractAnalyze smoke 테스트 통과\n");
}
