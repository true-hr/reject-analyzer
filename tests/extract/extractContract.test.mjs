/**
 * extractContract.test.mjs
 *
 * 목적: extractTextFromFile()의 반환값 contract를 검증합니다.
 *
 * 핵심 문제:
 *   ok: true  이면서  text가 빈 문자열이거나 너무 짧은 "silent failure" 케이스를 잡습니다.
 *   이 케이스는 호출 성공처럼 보이지만 실제로는 분석에 쓸 데이터가 없어 다운스트림 에러를 만듭니다.
 *
 * 실행 방법:
 *   node ./tests/extract/extractContract.test.mjs
 *   또는
 *   npm run test:extract
 *
 * NOTE: extractTextFromFile은 브라우저 전용(FileReader, pdfjs-dist + Vite URL import)이므로
 *       여기서는 반환 결과 shape를 직접 생성하여 validator 로직을 테스트합니다.
 */

// ─── contract 검증 함수 ────────────────────────────────────────────────────────
// 이 함수가 "success contract 문제"를 잡는 핵심입니다.

const MIN_TEXT_LENGTH = 30; // 이 길이 미만이면 실질적으로 빈 결과로 간주

/**
 * @param {unknown} result - extractTextFromFile()의 반환값
 * @returns {{ pass: boolean, failureType: string | null, message: string }}
 */
function validateExtractionResult(result) {
  // 1. 반환 자체가 없거나 객체가 아닌 경우
  if (!result || typeof result !== "object") {
    return {
      pass: false,
      failureType: "CONTRACT_BROKEN",
      message: "반환값이 객체가 아닙니다.",
    };
  }

  // 2. ok 필드가 없는 경우
  if (!("ok" in result)) {
    return {
      pass: false,
      failureType: "CONTRACT_BROKEN",
      message: "반환값에 'ok' 필드가 없습니다.",
    };
  }

  // 3. text 필드가 없는 경우
  if (!("text" in result)) {
    return {
      pass: false,
      failureType: "CONTRACT_BROKEN",
      message: "반환값에 'text' 필드가 없습니다.",
    };
  }

  // 4. ok:false → 명시적 실패 (정상 처리됨, contract 위반 아님)
  if (result.ok === false) {
    return {
      pass: true,
      failureType: null,
      message: "ok:false — 명시적 실패 (정상 처리).",
    };
  }

  // 5. ok:true 이하 — "silent failure" 구간
  const text = result.text;

  if (typeof text !== "string") {
    return {
      pass: false,
      failureType: "SILENT_FAIL_EMPTY",
      message: `ok:true이지만 text가 string이 아닙니다 (typeof: ${typeof text}).`,
    };
  }

  if (text.trim().length === 0) {
    return {
      pass: false,
      failureType: "SILENT_FAIL_EMPTY",
      message: "ok:true이지만 text가 빈 문자열입니다.",
    };
  }

  if (text.trim().length < MIN_TEXT_LENGTH) {
    return {
      pass: false,
      failureType: "SILENT_FAIL_SHORT",
      message: `ok:true이지만 text 길이(${text.trim().length})가 최소 기준(${MIN_TEXT_LENGTH})보다 짧습니다.`,
    };
  }

  return { pass: true, failureType: null, message: "ok" };
}

// ─── 테스트 러너 ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, result, expected) {
  const validation = validateExtractionResult(result);
  const actualPass = validation.pass;
  const match = actualPass === expected.pass &&
    (expected.failureType === undefined || validation.failureType === expected.failureType);

  if (match) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}`);
    console.error(`       기대: pass=${expected.pass}, failureType=${expected.failureType ?? "*"}`);
    console.error(`       실제: pass=${actualPass}, failureType=${validation.failureType}`);
    console.error(`       메시지: ${validation.message}`);
    failed++;
  }
}

// ─── 테스트 케이스 ────────────────────────────────────────────────────────────

console.log("\n[extractContract] contract 검증 테스트\n");

// ── 정상 케이스 ──────────────────────────────────────────────────────────────
console.log("── 정상 케이스");

assert(
  "ok:true, 충분한 text → PASS",
  { ok: true, text: "홍길동은 5년간 마케팅 매니저로 근무하며 캠페인 ROI 30% 향상을 달성했습니다.", meta: {} },
  { pass: true, failureType: null }
);

assert(
  "ok:false, text 없음 → 명시적 실패로 PASS",
  { ok: false, text: "", error: "PDF_EXTRACT_FAILED", meta: {} },
  { pass: true, failureType: null }
);

assert(
  "ok:false, error 있음 → 명시적 실패로 PASS",
  { ok: false, text: "", error: "OCR_EMPTY_TEXT", message: "Image OCR returned empty text", meta: {} },
  { pass: true, failureType: null }
);

// ── Silent Failure: EMPTY ─────────────────────────────────────────────────────
console.log("\n── Silent Failure: EMPTY");

assert(
  "ok:true, text:'' → SILENT_FAIL_EMPTY",
  { ok: true, text: "", meta: {} },
  { pass: false, failureType: "SILENT_FAIL_EMPTY" }
);

assert(
  "ok:true, text:'   ' (공백만) → SILENT_FAIL_EMPTY",
  { ok: true, text: "   ", meta: {} },
  { pass: false, failureType: "SILENT_FAIL_EMPTY" }
);

assert(
  "ok:true, text:null → SILENT_FAIL_EMPTY",
  { ok: true, text: null, meta: {} },
  { pass: false, failureType: "SILENT_FAIL_EMPTY" }
);

assert(
  "ok:true, text:undefined → SILENT_FAIL_EMPTY",
  { ok: true, text: undefined, meta: {} },
  { pass: false, failureType: "SILENT_FAIL_EMPTY" }
);

// ── Silent Failure: SHORT ─────────────────────────────────────────────────────
console.log("\n── Silent Failure: SHORT");

assert(
  `ok:true, text 길이 5 (< ${MIN_TEXT_LENGTH}) → SILENT_FAIL_SHORT`,
  { ok: true, text: "hello", meta: {} },
  { pass: false, failureType: "SILENT_FAIL_SHORT" }
);

assert(
  `ok:true, text 길이 10 (< ${MIN_TEXT_LENGTH}) → SILENT_FAIL_SHORT`,
  { ok: true, text: "짧은 텍스트", meta: {} },
  { pass: false, failureType: "SILENT_FAIL_SHORT" }
);

// ── CONTRACT_BROKEN ───────────────────────────────────────────────────────────
console.log("\n── CONTRACT_BROKEN");

assert(
  "null 반환 → CONTRACT_BROKEN",
  null,
  { pass: false, failureType: "CONTRACT_BROKEN" }
);

assert(
  "undefined 반환 → CONTRACT_BROKEN",
  undefined,
  { pass: false, failureType: "CONTRACT_BROKEN" }
);

assert(
  "'ok' 필드 없음 → CONTRACT_BROKEN",
  { text: "some text" },
  { pass: false, failureType: "CONTRACT_BROKEN" }
);

assert(
  "'text' 필드 없음 → CONTRACT_BROKEN",
  { ok: true },
  { pass: false, failureType: "CONTRACT_BROKEN" }
);

assert(
  "빈 객체 → CONTRACT_BROKEN",
  {},
  { pass: false, failureType: "CONTRACT_BROKEN" }
);

// ─── 결과 출력 ────────────────────────────────────────────────────────────────

console.log(`\n결과: ${passed} passed / ${failed} failed\n`);

if (failed > 0) {
  console.error("[FAIL] extractContract 테스트 실패\n");
  process.exit(1);
} else {
  console.log("[PASS] 모든 contract 테스트 통과\n");
}

export { validateExtractionResult, MIN_TEXT_LENGTH };
