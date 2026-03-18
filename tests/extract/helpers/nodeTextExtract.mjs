/**
 * nodeTextExtract.mjs
 *
 * Node.js 전용 txt 추출 어댑터.
 * extractTextFromFile()의 txt 분기와 동일한 로직 + 동일한 반환 shape를 구현합니다.
 *
 * 목적:
 *   extractTextFromFile은 브라우저 전용(FileReader + pdfjs-dist?url Vite import)이라
 *   Node.js에서 import 자체가 불가합니다.
 *   이 파일은 txt 포맷에 한해 Node 환경에서 "real call" 경로를 열기 위한 최소 어댑터입니다.
 *
 * 차단 지점 문서화:
 *   - extractTextFromFile.js line 11:
 *       import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
 *     → Vite 전용 URL import. Node.js ESM loader가 처리 불가 → 모듈 전체 import 실패
 *   - extractTextFromFile.js line 28-35: _readAsText() → new FileReader() → 브라우저 전용
 *
 * PDF/DOCX를 Node.js에서 열려면:
 *   - pdfjs-dist의 Node 전용 빌드(pdfjs-dist/legacy/build/pdf.js)로 교체 필요
 *   - extractTextFromFile.js에서 FileReader 분기를 fs.readFile로 교체하는 Node 브랜치 추가 필요
 *   - 또는 extract 레이어를 browser/node 브랜치로 분리 (extractTextFromFile.browser.js / .node.js)
 */

import fs from "node:fs/promises";
import path from "node:path";

/** extractTextFromFile의 _normalizeText와 동일한 로직 */
function _normalizeText(t) {
  if (!t) return "";
  return String(t)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/**
 * txt 파일 경로를 받아 extractTextFromFile과 동일한 shape로 반환합니다.
 *
 * @param {string} filePath  - 절대 또는 상대 경로
 * @param {"resume" | "jd"} kind
 * @returns {Promise<{ ok: boolean, text: string, source: string, meta: object }>}
 */
export async function extractTextFromTxtFile(filePath, kind = "resume") {
  const name = path.basename(filePath);
  const meta = {
    kind: kind || null,
    name,
    mime: "text/plain",
    ext: "txt",
    charCount: 0,
    warnings: [],
    confidenceHint: "unknown",
    extractBranch: "txt",
    failureStage: null,
    textSource: "local",
    transportOk: undefined,
    failureReason: null,
    failureMessage: null,
  };

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const text = _normalizeText(raw);

    if (!text) {
      meta.failureStage = "normalize";
      meta.failureReason = "empty after normalize";
      return {
        ok: false,
        text: "",
        error: "TXT_EXTRACT_FAILED",
        message: "Failed to extract text from text file: content is empty after normalization",
        meta,
      };
    }

    meta.charCount = text.length;
    meta.confidenceHint = "high";
    return { ok: true, text, source: "local", meta };

  } catch (e) {
    meta.failureStage = "local-extract";
    meta.failureReason = e.message;
    return {
      ok: false,
      text: "",
      error: "TXT_EXTRACT_FAILED",
      message: `Failed to extract text from text file: ${e.message}`,
      meta,
    };
  }
}
