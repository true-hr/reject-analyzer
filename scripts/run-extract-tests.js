/**
 * run-extract-tests.js
 *
 * extraction 관련 테스트만 실행하는 runner입니다.
 * 기존 testEngine.js와 충돌하지 않는 독립 실행형 스크립트입니다.
 *
 * 실행 방법:
 *   node ./scripts/run-extract-tests.js
 *   또는
 *   npm run test:extract
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const TEST_FILES = [
  "tests/extract/extractContract.test.mjs",
  "tests/extract/extractSmoke.test.mjs",
  "tests/integration/extractAnalyzeSmoke.test.mjs",
  "tests/integration/mismatchSmoke.test.mjs",
  "tests/integration/domainMismatchSmoke.test.mjs",
  "tests/integration/hireabilityDistributionSmoke.test.mjs",
];

let allPassed = true;

// 실패 항목 수집 — failureType / reason 포함
const failureSummary = [];

// 포맷별 통과/실패 집계
// 라벨에 "[node]" + 포맷 키워드가 포함된 경우만 집계
const formatStats = {
  txt:  { passed: 0, failed: 0 },
  pdf:  { passed: 0, failed: 0 },
  docx: { passed: 0, failed: 0 },
};

// "  ✓  <label>" 줄 파싱
const RE_PASS_LABEL  = /^\s+✓\s+(.+)$/;
// "  ✗  <label>" 줄 파싱
const RE_FAIL_LABEL  = /^\s+✗\s+(.+)$/;
// "       <reason>" (indent 7+ spaces after ✗ label)
const RE_FAIL_REASON = /^\s{7,}(.+)$/;
// "    failureType: <type>"
const RE_FAIL_TYPE   = /failureType:\s*(\S+)/;

function _detectFormat(label) {
  const l = label.toLowerCase();
  if (l.includes(".pdf") || l.includes("pdf")) return "pdf";
  if (l.includes(".docx") || l.includes("docx")) return "docx";
  if (l.includes(".txt") || l.includes("txt")) return "txt";
  return null;
}

function parseOutput(output, sourceFile) {
  const lines = output.split("\n");
  let i = 0;
  while (i < lines.length) {
    // 통과 항목 집계
    const passMatch = RE_PASS_LABEL.exec(lines[i]);
    if (passMatch) {
      const fmt = _detectFormat(passMatch[1]);
      if (fmt && formatStats[fmt]) formatStats[fmt].passed += 1;
      i++;
      continue;
    }

    // 실패 항목 집계 + 수집
    const labelMatch = RE_FAIL_LABEL.exec(lines[i]);
    if (labelMatch) {
      const label = labelMatch[1].trim();
      let reason = null;
      let failureType = null;

      let j = i + 1;
      while (j < lines.length && j < i + 4) {
        const reasonMatch = RE_FAIL_REASON.exec(lines[j]);
        const typeMatch   = RE_FAIL_TYPE.exec(lines[j]);
        if (typeMatch)   failureType = typeMatch[1];
        else if (reasonMatch && !reason) reason = reasonMatch[1].trim();
        j++;
      }
      failureSummary.push({ sourceFile, label, reason, failureType });

      const fmt = _detectFormat(label);
      if (fmt && formatStats[fmt]) formatStats[fmt].failed += 1;
    }
    i++;
  }
}

console.log("=".repeat(60));
console.log(" PASSMAP Extraction Test Runner");
console.log("=".repeat(60));
console.log();

for (const testFile of TEST_FILES) {
  const fullPath = path.join(root, testFile);
  console.log(`▶ ${testFile}`);
  console.log("-".repeat(60));

  const result = spawnSync("node", [fullPath], {
    stdio: ["inherit", "pipe", "pipe"],
    cwd: root,
    encoding: "utf8",
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  const combined = (result.stdout || "") + (result.stderr || "");
  parseOutput(combined, testFile);

  if (result.status !== 0) {
    allPassed = false;
    console.error(`[FAIL] ${testFile} — exit code ${result.status}`);
  }

  console.log();
}

// ─── 포맷별 결과 요약 ─────────────────────────────────────────────────────────
console.log("─── 포맷별 결과 (node 직접 호출 기준) ───────────────────────");
const fmtRows = [
  ["txt",  formatStats.txt.passed,  formatStats.txt.failed],
  ["pdf",  formatStats.pdf.passed,  formatStats.pdf.failed],
  ["docx", formatStats.docx.passed, formatStats.docx.failed],
];
console.log("  포맷    pass  fail  상태");
for (const [fmt, p, f] of fmtRows) {
  const status = f === 0 ? "✓" : "✗";
  console.log(`  ${fmt.padEnd(6)}  ${String(p).padStart(3)}   ${String(f).padStart(3)}   ${status}`);
}
console.log();

// ─── 최종 요약 ────────────────────────────────────────────────────────────────
console.log("=".repeat(60));
if (allPassed) {
  console.log(" 모든 extraction 테스트 통과");
  console.log("=".repeat(60));
  process.exit(0);
} else {
  console.error(" extraction 테스트 실패");
  console.log("=".repeat(60));

  if (failureSummary.length > 0) {
    console.error("\n─── 실패 상세 ───────────────────────────────────────────");
    for (const f of failureSummary) {
      console.error(`  파일 : ${f.sourceFile}`);
      console.error(`  케이스: ${f.label}`);
      if (f.reason)      console.error(`  이유  : ${f.reason}`);
      if (f.failureType) console.error(`  타입  : ${f.failureType}`);
      console.error();
    }
  }

  process.exit(1);
}
