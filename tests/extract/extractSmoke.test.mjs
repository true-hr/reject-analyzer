/**
 * extractSmoke.test.mjs
 *
 * 목적: extractTextFromFile()의 smoke 테스트
 *
 * 구성:
 *   1. Mock 기반 shape 검증 — 브라우저 의존성 없이 반환값 contract 검증
 *   2. Real txt fixture — nodeTextExtract 어댑터로 실제 파일 읽기/추출 검증 (regression)
 *   3. Real file tests via extractTextFromFile.node.js — Node 구현 직접 호출
 *      3-a. TXT — 4개 fixture real call
 *      3-b. PDF — fixture 없음 → TODO (UNSUPPORTED_FORMAT 아닌 경로 존재 확인)
 *      3-c. DOCX — fixture 없음 → TODO (UNSUPPORTED_FORMAT 아닌 경로 존재 확인)
 *
 * 실행 방법:
 *   node ./tests/extract/extractSmoke.test.mjs
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateExtractionResult } from "./extractContract.test.mjs";
import { extractTextFromTxtFile } from "./helpers/nodeTextExtract.mjs";
import { extractTextFromFile } from "../../src/lib/extract/extractTextFromFile.node.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.resolve(__dirname, "../fixtures/extract");

// ─── Mock 헬퍼 ────────────────────────────────────────────────────────────────

function makeMockResult({ ok, text, error, meta = {} }) {
  return { ok, text: text ?? "", error: error ?? null, meta };
}

// ─── 테스트 러너 ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function smokeAssert(label, fn) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result.then(() => {
        console.log(`  ✓  ${label}`);
        passed++;
      }).catch((e) => {
        console.error(`  ✗  ${label}`);
        console.error(`       ${e.message}`);
        failures.push({ label, reason: e.message, failureType: e.failureType || null });
        failed++;
      });
    }
    console.log(`  ✓  ${label}`);
    passed++;
  } catch (e) {
    console.error(`  ✗  ${label}`);
    console.error(`       ${e.message}`);
    failures.push({ label, reason: e.message, failureType: e.failureType || null });
    failed++;
  }
  return Promise.resolve();
}

function assertEqual(a, b, msg) {
  if (a !== b) throw Object.assign(new Error(msg ?? `기대: ${b}, 실제: ${a}`), {});
}

function assertTrue(val, msg) {
  if (!val) throw new Error(msg ?? "조건 실패");
}

function assertContains(text, mustContain, msg) {
  if (!String(text || "").includes(mustContain)) {
    throw new Error(msg ?? `텍스트에 "${mustContain}"가 포함되어 있지 않습니다.`);
  }
}

// ─── 1. Mock 기반 shape 검증 ─────────────────────────────────────────────────

const mockTests = [];

mockTests.push(smokeAssert("resume 정상 추출 시뮬레이션 — contract 통과", () => {
  const result = makeMockResult({
    ok: true,
    text: "홍길동 | 서울 | 010-0000-0000\n백엔드 개발 5년 경력. Python, Node.js 실무 사용. 주요 프로젝트: 결제 시스템 리팩토링으로 API 응답 속도 40% 개선.",
  });
  const v = validateExtractionResult(result);
  assertTrue(v.pass, `contract 실패: ${v.message}`);
  assertEqual(v.failureType, null);
}));

mockTests.push(smokeAssert("JD 정상 추출 시뮬레이션 — contract 통과", () => {
  const result = makeMockResult({
    ok: true,
    text: "[채용공고] 백엔드 엔지니어 채용\n필수: Python 3년 이상, REST API 설계 경험\n우대: AWS 운영 경험, 대용량 데이터 처리 경험",
  });
  const v = validateExtractionResult(result);
  assertTrue(v.pass, `contract 실패: ${v.message}`);
}));

mockTests.push(smokeAssert("PDF 추출 실패 시뮬레이션 — ok:false는 정상 처리", () => {
  const result = makeMockResult({ ok: false, text: "", error: "PDF_EXTRACT_FAILED" });
  const v = validateExtractionResult(result);
  assertTrue(v.pass, "ok:false는 contract 위반이 아닙니다");
  assertEqual(v.failureType, null);
}));

mockTests.push(smokeAssert("OCR silent failure 시뮬레이션 — ok:true + 빈 text 탐지", () => {
  const result = makeMockResult({ ok: true, text: "" });
  const v = validateExtractionResult(result);
  assertTrue(!v.pass, "silent failure를 잡지 못했습니다");
  assertEqual(v.failureType, "SILENT_FAIL_EMPTY");
}));

mockTests.push(smokeAssert("이미지 OCR 짧은 결과 시뮬레이션 — ok:true + 짧은 text 탐지", () => {
  const result = makeMockResult({ ok: true, text: "이름: 홍길동" });
  const v = validateExtractionResult(result);
  assertTrue(!v.pass, "짧은 text를 잡지 못했습니다");
  assertEqual(v.failureType, "SILENT_FAIL_SHORT");
}));

// ─── 2. Real txt fixture — nodeTextExtract 어댑터 (regression) ───────────────

const realTests = [];

const FIXTURES = [
  {
    file: "resume_sample_01.txt",
    kind: "resume",
    mustContain: ["홍길동", "Python"],
    label: "resume_sample_01.txt — 이력서 txt real call",
  },
  {
    file: "resume_sample_02.txt",
    kind: "resume",
    mustContain: ["김민지", "마케팅"],
    label: "resume_sample_02.txt — 이력서 txt real call",
  },
  {
    file: "jd_sample_01.txt",
    kind: "jd",
    mustContain: ["채용공고", "자격 요건"],
    label: "jd_sample_01.txt — JD txt real call",
  },
  {
    file: "jd_sample_02.txt",
    kind: "jd",
    mustContain: ["채용공고", "주요 업무"],
    label: "jd_sample_02.txt — JD txt real call",
  },
];

for (const fixture of FIXTURES) {
  const filePath = path.join(FIXTURE_DIR, fixture.file);
  realTests.push(smokeAssert(fixture.label, async () => {
    const result = await extractTextFromTxtFile(filePath, fixture.kind);

    assertTrue(result.ok === true, `ok가 true가 아닙니다: ${result.error || result.message}`);
    assertTrue(typeof result.text === "string" && result.text.trim().length > 0, "text가 비어 있습니다");

    for (const keyword of fixture.mustContain) {
      assertContains(result.text, keyword, `"${keyword}" 키워드가 추출 결과에 없습니다`);
    }

    const v = validateExtractionResult(result);
    assertTrue(v.pass, `contract 검증 실패: ${v.message} (failureType: ${v.failureType})`);

    assertTrue(result.meta && typeof result.meta === "object", "meta가 없습니다");
    assertEqual(result.meta.ext, "txt", "meta.ext가 txt가 아닙니다");
    assertTrue(result.meta.charCount > 0, "meta.charCount가 0입니다");
    assertEqual(result.meta.confidenceHint, "high", "txt 추출은 confidenceHint가 high여야 합니다");
  }));
}

// ─── 3. extractTextFromFile.node.js 직접 호출 ────────────────────────────────

const nodeTests = [];

console.log("\n── 3-a. TXT real call via extractTextFromFile.node.js");

for (const fixture of FIXTURES) {
  const filePath = path.join(FIXTURE_DIR, fixture.file);
  nodeTests.push(smokeAssert(`[node] ${fixture.label}`, async () => {
    const result = await extractTextFromFile(filePath, fixture.kind);

    assertTrue(result.ok === true, `ok가 true가 아닙니다: ${result.error || result.message}`);
    assertTrue(typeof result.text === "string" && result.text.trim().length > 0, "text가 비어 있습니다");

    for (const keyword of fixture.mustContain) {
      assertContains(result.text, keyword, `"${keyword}" 키워드가 추출 결과에 없습니다`);
    }

    const v = validateExtractionResult(result);
    assertTrue(v.pass, `contract 검증 실패: ${v.message} (failureType: ${v.failureType})`);

    assertTrue(result.meta && typeof result.meta === "object", "meta가 없습니다");
    assertEqual(result.meta.ext, "txt");
    assertEqual(result.meta.extractBranch, "txt");
    assertTrue(result.meta.charCount > 0, "meta.charCount가 0입니다");
    assertEqual(result.meta.confidenceHint, "high");
  }));
}

// ── 3-b. PDF real call ────────────────────────────────────────────────────────

console.log("\n── 3-b. PDF real call via extractTextFromFile.node.js");

const PDF_FIXTURES = [
  {
    file: "resume_sample_01.pdf",
    kind: "resume",
    mustContain: ["홍길동", "Python"],
    label: "resume_sample_01.pdf — 이력서 PDF real call",
  },
  {
    file: "jd_sample_01.pdf",
    kind: "jd",
    mustContain: ["채용공고", "자격 요건"],
    label: "jd_sample_01.pdf — JD PDF real call",
  },
];

for (const fixture of PDF_FIXTURES) {
  const filePath = path.join(FIXTURE_DIR, fixture.file);
  nodeTests.push(smokeAssert(`[node] ${fixture.label}`, async () => {
    const result = await extractTextFromFile(filePath, fixture.kind);
    assertTrue(result.ok === true, `PDF 추출 실패: ${result.error} | branch: ${result.meta?.extractBranch} | msg: ${result.message}`);
    assertTrue(typeof result.text === "string" && result.text.trim().length > 0, "text가 비어 있습니다");
    assertTrue(result.meta.extractBranch === "pdf", `extractBranch가 pdf가 아닙니다: ${result.meta.extractBranch}`);
    for (const keyword of fixture.mustContain) {
      assertContains(result.text, keyword, `"${keyword}" 키워드가 추출 결과에 없습니다`);
    }
    const v = validateExtractionResult(result);
    assertTrue(v.pass, `contract 검증 실패: ${v.message} (failureType: ${v.failureType})`);
  }));
}

// ── 3-c. DOCX real call ───────────────────────────────────────────────────────

console.log("\n── 3-c. DOCX real call via extractTextFromFile.node.js");

const DOCX_FIXTURES = [
  {
    file: "resume_sample_01.docx",
    kind: "resume",
    mustContain: ["홍길동", "Python"],
    label: "resume_sample_01.docx — 이력서 DOCX real call",
  },
  {
    file: "jd_sample_01.docx",
    kind: "jd",
    mustContain: ["채용공고", "자격 요건"],
    label: "jd_sample_01.docx — JD DOCX real call",
  },
];

for (const fixture of DOCX_FIXTURES) {
  const filePath = path.join(FIXTURE_DIR, fixture.file);
  nodeTests.push(smokeAssert(`[node] ${fixture.label}`, async () => {
    const result = await extractTextFromFile(filePath, fixture.kind);
    assertTrue(result.ok === true, `DOCX 추출 실패: ${result.error} | branch: ${result.meta?.extractBranch} | msg: ${result.message}`);
    assertTrue(typeof result.text === "string" && result.text.trim().length > 0, "text가 비어 있습니다");
    assertTrue(result.meta.extractBranch === "docx", `extractBranch가 docx가 아닙니다: ${result.meta.extractBranch}`);
    for (const keyword of fixture.mustContain) {
      assertContains(result.text, keyword, `"${keyword}" 키워드가 추출 결과에 없습니다`);
    }
    const v = validateExtractionResult(result);
    assertTrue(v.pass, `contract 검증 실패: ${v.message} (failureType: ${v.failureType})`);
  }));
}

// ── 3-d. 지원하지 않는 포맷 → UNSUPPORTED_FORMAT ─────────────────────────────
nodeTests.push(smokeAssert("[node] unsupported format → UNSUPPORTED_FORMAT", async () => {
  // 파일이 없어도 ext 판단이 먼저이므로 type-detect 단계에서 실패해야 함
  const result = await extractTextFromFile(
    path.join(FIXTURE_DIR, "not_a_file.pptx"),
    "resume"
  );
  assertEqual(result.ok, false, "unsupported 포맷은 ok:false여야 합니다");
  assertEqual(result.error, "UNSUPPORTED_FORMAT", `error code 불일치: ${result.error}`);
  assertEqual(result.meta.extractBranch, "unsupported");
}));

// ─── 모든 비동기 테스트 완료 후 결과 출력 ─────────────────────────────────────

await Promise.all([...mockTests, ...realTests, ...nodeTests]);

console.log(`\n결과: ${passed} passed / ${failed} failed\n`);

if (failures.length > 0) {
  console.error("실패 목록:");
  for (const f of failures) {
    console.error(`  ✗ ${f.label}`);
    console.error(`    이유: ${f.reason}`);
    if (f.failureType) console.error(`    failureType: ${f.failureType}`);
  }
  console.log();
}

if (failed > 0) {
  console.error("[FAIL] extractSmoke 테스트 실패\n");
  process.exit(1);
} else {
  console.log("[PASS] 모든 smoke 테스트 통과\n");
}
