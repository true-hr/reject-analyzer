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
    warnings.push("DOCX 변환 과정에서 일부 서식이 누락될 수 있어요.");
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
  };

  try {
    let text = "";

    if (ext === "txt" || mime.startsWith("text/")) {
      text = _normalizeText(await _readAsText(file));
      meta.confidenceHint = "high";
    } else if (ext === "docx" || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const r = await _extractDocx(file);
      text = r.text;
      meta.warnings.push(...(r.warnings || []));
      meta.confidenceHint = text.length > 500 ? "high" : "medium";
    } else if (ext === "pdf" || mime === "application/pdf") {
      const r = await _extractPdf(file);
      text = r.text;
      meta.warnings.push(...(r.warnings || []));
      meta.pages = r.pages;
      meta.confidenceHint = text.length > 800 ? "medium" : "low";
    } else {
      meta.warnings.push("지원하지 않는 파일 형식이에요. (PDF/DOCX/TXT 권장)");
      return { ok: false, text: "", meta };
    }

    meta.charCount = text.length;

    // Additional warning if too short
    if (meta.charCount > 0 && meta.charCount < 200) {
      meta.warnings.push("추출된 텍스트가 너무 짧아요. 내용이 누락됐을 수 있어요.");
    }

    // 빈 텍스트는 성공으로 처리하지 않음
    if (!text.trim()) {
      meta.warnings.push("파일에서 텍스트를 추출하지 못했어요. 스캔 PDF이거나 내용이 없는 파일일 수 있어요.");
      return { ok: false, text: "", meta };
    }

    return { ok: true, text, meta };
  } catch (e) {
    meta.warnings.push(`파일에서 텍스트를 추출하는 중 오류가 발생했어요. (${String(e?.message || e || "unknown").slice(0, 120)})`);
    meta.error = String(e?.message || e);
    return { ok: false, text: "", meta };
  }
}