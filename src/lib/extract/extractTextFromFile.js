// src/lib/extract/extractTextFromFile.js
// P0: Browser-only text extraction for TXT/DOCX/PDF
// - DOCX: mammoth
// - PDF: pdfjs-dist
// - TXT: FileReader
//
// Return shape:
// { ok, text, meta: { kind, mime, ext, charCount, warnings: [], confidenceHint } }

import * as pdfjs from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";

function _ext(name) {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

function _normalizeText(t) {
  if (!t) return "";
  // Minimal cleanup: collapse huge blank lines but keep structure
  return String(t)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

async function _readAsText(file) {
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(fr.error || new Error("FileReader error"));
    fr.onload = () => resolve(String(fr.result || ""));
    fr.readAsText(file);
  });
}

async function _readAsArrayBuffer(file) {
  return await file.arrayBuffer();
}

async function _extractDocx(file) {
  const ab = await _readAsArrayBuffer(file);
  const mammoth = (await import("mammoth")).default || (await import("mammoth"));
  // mammoth returns { value, messages }
  const res = await mammoth.extractRawText({ arrayBuffer: ab });
  const text = _normalizeText(res?.value || "");
  const warnings = [];
  if (Array.isArray(res?.messages) && res.messages.length) {
    warnings.push("DOCX 변환 과정에서 일부 서식이 유실되었을 수 있어요.");
  }
  return { text, warnings };
}

async function _extractPdf(file) {
  const ab = await _readAsArrayBuffer(file);

  if (pdfjs?.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  }

  const loadingTask = pdfjs.getDocument({ data: ab });
  const pdf = await loadingTask.promise;

  let fullText = "";
  const warnings = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = (content?.items || [])
      .map((it) => (typeof it?.str === "string" ? it.str : ""))
      .filter(Boolean);

    // Preserve some spacing
    const pageText = strings.join(" ");
    fullText += pageText + "\n\n";
  }

  const text = _normalizeText(fullText);

  // Heuristic: scanned PDF suspicion
  const charCount = text.length;
  const pages = pdf.numPages || 0;
  if (pages >= 2 && charCount < 350) {
    warnings.push("PDF에서 텍스트가 거의 추출되지 않았어요. 스캔(이미지) PDF일 수 있어요.");
  }

  return { text, warnings, pages };
}

function _isImageFile(ext, mime) {
  const e = String(ext || "").toLowerCase();
  const m = String(mime || "").toLowerCase();
  if (e === "png" || e === "jpg" || e === "jpeg" || e === "webp") return true;
  if (m === "image/png" || m === "image/jpeg" || m === "image/webp") return true;
  return false;
}

const __PASSMAP_EXTRACT_DEBUG_KEY = "__PASSMAP_EXTRACT_DEBUG__";
const __PASSMAP_EXTRACT_SUMMARY_KEY = "__PASSMAP_EXTRACT_SUMMARY__";
const __PASSMAP_EXTRACT_DEBUG_MAX = 20;

function __buildExtractDebugSummary(items) {
  const list = Array.isArray(items) ? items : [];
  const summary = {
    total: list.length,
    successCount: 0,
    failCount: 0,
    byErrorCode: {},
    byAttemptedType: {},
    byKind: {},
  };
  for (const item of list) {
    const ok = Boolean(item?.ok);
    const errorCode = String(item?.error || "NONE");
    const attempted = String(item?.attemptedType || "unknown");
    const kind = String(item?.kind || "unknown");
    if (ok) summary.successCount += 1;
    else summary.failCount += 1;
    summary.byErrorCode[errorCode] = (summary.byErrorCode[errorCode] || 0) + 1;
    summary.byAttemptedType[attempted] = (summary.byAttemptedType[attempted] || 0) + 1;
    summary.byKind[kind] = (summary.byKind[kind] || 0) + 1;
  }
  return summary;
}

function __pushExtractDebugSnapshot(entry) {
  if (typeof window === "undefined") return;
  try {
    const prev = Array.isArray(window[__PASSMAP_EXTRACT_DEBUG_KEY])
      ? window[__PASSMAP_EXTRACT_DEBUG_KEY]
      : [];
    const next = [...prev, entry];
    if (next.length > __PASSMAP_EXTRACT_DEBUG_MAX) {
      next.splice(0, next.length - __PASSMAP_EXTRACT_DEBUG_MAX);
    }
    window[__PASSMAP_EXTRACT_DEBUG_KEY] = next;
    window[__PASSMAP_EXTRACT_SUMMARY_KEY] = __buildExtractDebugSummary(next);
  } catch {
    // noop
  }
}

async function _extractImageByOCR(file) {
  const __base =
    (import.meta?.env?.VITE_PARSE_API_BASE || import.meta?.env?.VITE_AI_PROXY_URL || import.meta?.env?.VITE_API_BASE || "")
      .toString()
      .trim()
      .replace(/\/$/, "");
  const __isProd = Boolean(import.meta?.env?.PROD);
  const __hasAbsoluteBase = /^https?:\/\//i.test(__base);
  const isLocalDev =
    Boolean(import.meta?.env?.DEV) &&
    typeof window !== "undefined" &&
    (window.location?.hostname === "localhost" || window.location?.hostname === "127.0.0.1");
  const isRelativeBase = !__base || __base.startsWith("/");
  if (__isProd && !__hasAbsoluteBase) {
    return {
      ok: false,
      error: "OCR_ENDPOINT_UNREACHABLE",
      ocrErrorCode: "OCR_BASE_URL_INVALID",
      transportOk: false,
      text: "",
      warnings: [
        "OCR API base is missing/relative in production. Set absolute VITE_PARSE_API_BASE."
      ],
    };
  }
  const endpoint =
    (isLocalDev && isRelativeBase)
      ? "http://localhost:3000/api/ocr"
      : (__base ? __base : "") + "/api/ocr";

  let imageData = "";
  try {
    const ab = await file.arrayBuffer();
    const bytes = new Uint8Array(ab);
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    const b64 = btoa(binary);
    const mime = String(file?.type || "image/png").trim() || "image/png";
    imageData = `data:${mime};base64,${b64}`;
  } catch (e) {
    return {
      ok: false,
      error: "OCR_REQUEST_FAILED",
      ocrErrorCode: "OCR_IMAGE_ENCODE_FAILED",
      text: "",
      warnings: [String(e?.message || e || "image_base64_encode_failed")],
    };
  }

  let data = null;
  let transportOk;
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageData,
        mime: String(file?.type || ""),
        filename: String(file?.name || ""),
      }),
    });
    const response = resp;
    transportOk = Boolean(response?.ok);
    console.log("[OCR.fetch.response]", {
      status: response?.status,
      ok: response?.ok,
      url: response?.url || "/api/ocr",
    });
    data = await resp.json().catch(() => null);
    console.log("[OCR.fetch.body]", {
      ok: data?.ok,
      textLen: typeof data?.text === "string" ? data.text.length : null,
      textPreview: typeof data?.text === "string" ? data.text.slice(0, 120) : null,
      error: data?.error || null,
      meta: data?.meta || null,
    });
    if (!resp.ok) {
      return {
        ok: false,
        error: "OCR_REQUEST_FAILED",
        ocrErrorCode: typeof data?.error === "string" ? data.error : `OCR_HTTP_${resp.status}`,
        transportOk,
        text: "",
        warnings: [],
      };
    }
    if (!data) {
      return {
        ok: false,
        error: "OCR_REQUEST_FAILED",
        ocrErrorCode: "OCR_RESPONSE_INVALID",
        transportOk,
        text: "",
        warnings: [],
      };
    }
  } catch (e) {
    const em = String(e?.message || e || "").toLowerCase();
    const isNetworkLike =
      e instanceof TypeError ||
      em.includes("failed to fetch") ||
      em.includes("networkerror") ||
      em.includes("load failed");
    return {
      ok: false,
      error: isNetworkLike ? "OCR_ENDPOINT_UNREACHABLE" : "OCR_REQUEST_FAILED",
      ocrErrorCode: isNetworkLike ? "OCR_NETWORK_ERROR" : "OCR_FETCH_EXCEPTION",
      transportOk: false,
      text: "",
      warnings: [String(e?.message || e || "google_ocr_request_failed")],
    };
  }

  const warnings = Array.isArray(data?.meta?.warnings) ? data.meta.warnings.filter(Boolean) : [];
  if (!data?.ok) {
    const upstreamCode = typeof data?.error === "string" ? data.error : "";
    const isEmptyCode = upstreamCode === "OCR_EMPTY_TEXT";
    return {
      ok: false,
      error: isEmptyCode ? "OCR_EMPTY_TEXT" : "OCR_REQUEST_FAILED",
      ocrErrorCode: upstreamCode || "OCR_PROVIDER_REJECTED",
      transportOk: true,
      text: "",
      warnings,
    };
  }

  const text = _normalizeText(String(data?.text || ""));
  if (!text.trim()) {
    return {
      ok: false,
      error: "OCR_EMPTY_TEXT",
      ocrErrorCode: "OCR_EMPTY_TEXT",
      transportOk: true,
      text: "",
      warnings: warnings.length ? warnings : ["Google OCR returned empty text."],
    };
  }

  return { ok: true, text, source: "google-ocr", warnings, transportOk: true };
}

export async function extractTextFromFile(file, kind /* "jd" | "resume" */) {
  const name = file?.name || "file";
  const ext = _ext(name);
  const mime = file?.type || "";

  const meta = {
    kind: kind || null,
    name,
    mime,
    ext,
    charCount: 0,
    warnings: [],
    confidenceHint: "unknown",
    extractBranch: "unsupported",
    failureStage: null,
    textSource: "local",
    transportOk: undefined,
  };
  let source = "local";
  let attemptedType = "unknown";
  let failureStage = "type-detect";
  const __errorCodeByType = {
    txt: "TXT_EXTRACT_FAILED",
    docx: "DOCX_EXTRACT_FAILED",
    pdf: "PDF_EXTRACT_FAILED",
    ocr: "OCR_REQUEST_FAILED",
    unknown: "FILE_READ_FAILED",
  };
  const __errorMessageByCode = {
    OCR_ENDPOINT_UNREACHABLE: "Failed to connect OCR server",
    OCR_REQUEST_FAILED: "OCR request failed",
    OCR_EMPTY_TEXT: "Image OCR returned empty text",
    PDF_EXTRACT_FAILED: "Failed to extract text from PDF",
    DOCX_EXTRACT_FAILED: "Failed to extract text from DOCX",
    TXT_EXTRACT_FAILED: "Failed to extract text from text file",
    UNSUPPORTED_FILE_TYPE: "Unsupported file type",
    FILE_READ_FAILED: "Failed to read file",
  };
  const __makeFailureResult = (errorCode, message) => ({
    ok: false,
    text: "",
    error: errorCode,
    message: message || __errorMessageByCode[errorCode] || __errorMessageByCode.FILE_READ_FAILED,
    meta,
  });
  const __logExtractResult = (result) => {
    console.log("[extractTextFromFile.result]", {
      ok: result?.ok,
      textLen: result?.text?.length,
      preview: result?.text?.slice(0, 120)
    });
    console.log("[OCR->extract]", {
      ok: result?.ok,
      textLen: typeof result?.text === "string" ? result.text.length : null,
      textPreview: typeof result?.text === "string" ? result.text.slice(0, 120) : null,
      meta: result?.meta || null,
    });
    __pushExtractDebugSnapshot({
      ts: Date.now(),
      kind: kind || null,
      fileName: name,
      ext,
      mime,
      attemptedType,
      ok: Boolean(result?.ok),
      error: result?.error || null,
      message: result?.message || null,
      charCount: Number(result?.meta?.charCount || result?.text?.length || 0),
      warnings: Array.isArray(result?.meta?.warnings) ? result.meta.warnings : [],
      source: result?.source || source || "local",
      extractBranch: result?.meta?.extractBranch || meta.extractBranch || "unsupported",
      failureStage: result?.meta?.failureStage || null,
      textSource: result?.meta?.textSource || "local",
      transportOk: typeof result?.meta?.transportOk === "boolean" ? result.meta.transportOk : null,
    });
  };

  try {
    let text = "";

    if (ext === "txt" || mime.startsWith("text/")) {
      attemptedType = "txt";
      meta.extractBranch = "txt";
      failureStage = "local-extract";
      const raw = await _readAsText(file);
      failureStage = "normalize";
      text = _normalizeText(raw);
      meta.confidenceHint = "high";
    } else if (ext === "docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      attemptedType = "docx";
      meta.extractBranch = "docx";
      failureStage = "local-extract";
      const r = await _extractDocx(file);
      text = r.text;
      meta.warnings.push(...(r.warnings || []));
      meta.confidenceHint = text.length > 500 ? "high" : "medium";
    } else if (ext === "pdf" || mime === "application/pdf") {
      attemptedType = "pdf";
      meta.extractBranch = "pdf";
      failureStage = "local-extract";
      const r = await _extractPdf(file);
      text = r.text;
      meta.warnings.push(...(r.warnings || []));
      meta.pages = r.pages;
      meta.confidenceHint = text.length > 800 ? "medium" : "low";
    } else if (_isImageFile(ext, mime)) {
      attemptedType = "ocr";
      meta.extractBranch = "image-ocr";
      failureStage = "ocr-fetch";
      const r = await _extractImageByOCR(file);
      if (typeof r?.transportOk === "boolean") meta.transportOk = r.transportOk;
      if (r?.ocrErrorCode) meta.ocrErrorCode = r.ocrErrorCode;
      if (!r?.ok) {
        meta.warnings.push(...(r?.warnings || []));
        meta.failureStage = failureStage;
        meta.textSource = "ocr";
        const result = __makeFailureResult(
          r?.error || "OCR_REQUEST_FAILED",
          r?.error === "OCR_EMPTY_TEXT"
            ? __errorMessageByCode.OCR_EMPTY_TEXT
            : (r?.error === "OCR_ENDPOINT_UNREACHABLE"
              ? __errorMessageByCode.OCR_ENDPOINT_UNREACHABLE
              : __errorMessageByCode.OCR_REQUEST_FAILED)
        );
        __logExtractResult(result);
        return result;
      }
      meta.warnings.push(...(r?.warnings || []));
      failureStage = "normalize";
      text = _normalizeText(r.text || "");
      source = "ocr";
      meta.textSource = "ocr";
      meta.confidenceHint = text.length > 200 ? "medium" : "low";
    } else {
      meta.extractBranch = "unsupported";
      failureStage = "type-detect";
      meta.warnings.push("Unsupported file format. Supported: PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP.");
      meta.failureStage = failureStage;
      const result = __makeFailureResult("UNSUPPORTED_FILE_TYPE", __errorMessageByCode.UNSUPPORTED_FILE_TYPE);
      __logExtractResult(result);
      return result;
    }

    meta.charCount = text.length;

    // Additional warning if too short
    if (meta.charCount > 0 && meta.charCount < 200) {
      meta.warnings.push("추출된 텍스트가 너무 짧아요. 내용 누락 여부를 확인해 주세요.");
    }

    // 鍮??띿뒪?몃뒗 ?깃났?쇰줈 泥섎━?섏? ?딆쓬
    if (!text.trim()) {
      failureStage = "empty-text";
      meta.failureStage = failureStage;
      meta.warnings.push("파일에서 텍스트를 추출하지 못했어요. 스캔 PDF이거나 내용이 없는 파일일 수 있어요.");
      const emptyErrorCode =
        source === "ocr"
          ? "OCR_EMPTY_TEXT"
          : (__errorCodeByType[attemptedType] || "FILE_READ_FAILED");
      const result = __makeFailureResult(emptyErrorCode, __errorMessageByCode[emptyErrorCode]);
      __logExtractResult(result);
      return result;
    }

    if (source === "ocr") {
      meta.failureStage = null;
      const result = { ok: true, text, source: "ocr", meta };
      __logExtractResult(result);
      return result;
    }
    meta.failureStage = null;
    const result = { ok: true, text, meta };
    __logExtractResult(result);
    return result;
  } catch (e) {
    meta.failureStage = failureStage || (attemptedType === "ocr" ? "ocr-fetch" : "local-extract");
    meta.textSource = source === "ocr" ? "ocr" : meta.textSource;
    meta.warnings.push(`파일에서 텍스트를 추출하는 중 오류가 발생했어요. (${String(e?.message || e || "unknown").slice(0, 120)})`);
    meta.error = String(e?.message || e);
    const code =
      source === "ocr"
        ? "OCR_REQUEST_FAILED"
        : (__errorCodeByType[attemptedType] || "FILE_READ_FAILED");
    const result = __makeFailureResult(code, __errorMessageByCode[code]);
    __logExtractResult(result);
    return result;
  }
}

