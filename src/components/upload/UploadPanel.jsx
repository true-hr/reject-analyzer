// src/components/upload/UploadPanel.jsx
import React, { useCallback, useMemo, useState } from "react";
import { extractTextFromFile } from "../../lib/extract/extractTextFromFile.js";
import { attachResumeImportMetadata } from "../../lib/resume/buildResumeImportMetadata.js";
import ResumeImportQualityCard from "../resume/ResumeImportQualityCard.jsx";
import SaraminImportMetadataNotice from "../resume/SaraminImportMetadataNotice.jsx";

const SUPPORTED_FILE_LABEL = "PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP";
const SUPPORTED_FILE_ACCEPT = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp";
const FILE_EXTRACT_RETRY_MESSAGE = "파일에서 텍스트를 추출하지 못했어요. DOCX/TXT로 다시 업로드하거나 파일 내용을 복사해 붙여넣어 주세요.";

function _short(s, n) {
  const t = String(s || "");
  if (t.length <= n) return t;
  return t.slice(0, n) + "...";
}

function buildExceptionMeta(kind, file, error) {
  return {
    kind,
    name: file?.name || "",
    ok: false,
    error: "FILE_EXTRACT_EXCEPTION",
    message: FILE_EXTRACT_RETRY_MESSAGE,
    rawMessage: String(error?.message || error || "File text extraction failed."),
    warnings: [
      FILE_EXTRACT_RETRY_MESSAGE,
      String(error?.message || error || "File text extraction failed."),
    ],
    extractionQuality: {
      score: 0,
      level: "failed",
      statusLabel: "다시 업로드 권장",
      summary: "파일을 읽는 중 오류가 발생했습니다.",
      warnings: [FILE_EXTRACT_RETRY_MESSAGE],
      detectedIssues: [{
        code: "file_extract_exception",
        severity: "critical",
        message: "파일 추출 중 예외가 발생했습니다.",
        suggestion: "DOCX/TXT로 다시 업로드하거나 내용을 직접 붙여넣어 주세요.",
      }],
    },
    sectionSummary: { detected: [], missing: [], counts: {} },
    layoutHints: {},
  };
}

function DropZone({
  title,
  hint,
  kind,
  onExtract,
}) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null);

  const accept = useMemo(() => SUPPORTED_FILE_ACCEPT, []);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setBusy(true);
      const writeImportDebugSnapshot = (status, text, meta) => {
        try {
          if (typeof window === "undefined") return;
          window.__PASSMAP_RESUME_IMPORT_STATE__ = {
            status,
            kind,
            fileName: meta?.name || file?.name || null,
            error: meta?.error || null,
            message: meta?.message || null,
            warnings: Array.isArray(meta?.warnings) ? meta.warnings : [],
            extractionQuality: meta?.extractionQuality || null,
            resumeImportMetadata: meta?.resumeImportMetadata || null,
            sectionSummary: meta?.sectionSummary || null,
            layoutHints: meta?.layoutHints || null,
            charCount: Number(meta?.charCount || String(text || "").length || 0),
            preview: String(text || "").slice(0, 240),
            updatedAt: Date.now(),
          };
        } catch { }
      };
      try {
        const res = await extractTextFromFile(file, kind);
        const preview = _short(res.text, 900);
        const baseMeta = {
          ...(res.meta || {}),
          ok: !!res.ok,
          error: res.error || res.meta?.error || null,
          message: res.ok ? (res.message || res.meta?.message || null) : FILE_EXTRACT_RETRY_MESSAGE,
          rawMessage: res.ok ? null : (res.message || res.meta?.message || null),
          warnings: res.ok
            ? (Array.isArray(res.meta?.warnings) ? res.meta.warnings : [])
            : Array.from(new Set([
                FILE_EXTRACT_RETRY_MESSAGE,
                res.message || res.meta?.message || null,
                ...((Array.isArray(res.meta?.warnings) ? res.meta.warnings : []).filter(Boolean)),
              ].filter(Boolean))),
        };
        const meta = res.ok
          ? attachResumeImportMetadata(baseMeta, res.text, { kind })
          : baseMeta;
        setLast({ ok: res.ok, meta, textPreview: preview, fullText: res.text });
        writeImportDebugSnapshot(res.ok ? "success" : "failure", res.ok ? res.text : "", meta);
        if (typeof onExtract === "function" && (res.ok || onExtract.length >= 3)) {
          onExtract(kind, res.ok ? res.text : "", meta);
        }
      } catch (e) {
        const meta = buildExceptionMeta(kind, file, e);
        setLast({ ok: false, meta, textPreview: "", fullText: "" });
        writeImportDebugSnapshot("failure", "", meta);
        if (typeof onExtract === "function" && onExtract.length >= 3) {
          onExtract(kind, "", meta);
        }
      } finally {
        setBusy(false);
      }
    },
    [kind, onExtract]
  );

  const onDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0] || null;
      await handleFile(file);
    },
    [handleFile]
  );

  const onPick = useCallback(
    async (e) => {
      const file = e.target?.files?.[0] || null;
      await handleFile(file);
      try { e.target.value = ""; } catch { }
    },
    [handleFile]
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-600">{hint}</div>
          </div>
          <div className="text-[11px] text-slate-500">
            {busy ? "추출 중..." : last?.ok ? "추출 완료" : last ? "확인 필요" : "대기"}
          </div>
        </div>

        <div
          className={[
            "mt-3 rounded-2xl border border-dashed px-4 py-4",
            "bg-slate-50/60 border-slate-300/70",
            busy ? "opacity-70 pointer-events-none" : "hover:bg-slate-50",
          ].join(" ")}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={onDrop}
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-700">
              <span className="font-semibold">드래그 앤 드롭</span> 또는 파일을 선택하세요. ({SUPPORTED_FILE_LABEL})
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                파일 선택
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  onChange={onPick}
                />
              </label>

              {last?.meta?.name ? (
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium">{_short(last.meta.name, 32)}</span>
                  {typeof last.meta.charCount === "number" ? (
                    <span className="ml-2 text-slate-500">({last.meta.charCount.toLocaleString()} chars)</span>
                  ) : null}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">예: JD.pdf / Resume.docx / resume.png</div>
              )}
            </div>

            <ResumeImportQualityCard meta={last?.meta} />
            <SaraminImportMetadataNotice meta={last?.meta} />

            {Array.isArray(last?.meta?.warnings) && last.meta.warnings.length ? (
              <div className="mt-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900/80">
                <div className="font-semibold">주의</div>
                <ul className="mt-1 list-disc pl-4">
                  {last.meta.warnings.slice(0, 3).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
                <div className="mt-1 text-amber-900/70">
                  추출이 불안정하면 <span className="font-semibold">DOCX/TXT로 다시 업로드</span>하거나 미리보기에서 누락된 내용을 확인해 주세요.
                </div>
              </div>
            ) : null}

            {last?.textPreview ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-700">
                  추출 텍스트 미리보기
                </summary>
                <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {last.textPreview}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadPanel({ onExtract }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DropZone
        title="JD 파일 첨부"
        hint="파일을 올리면 텍스트를 자동 추출해 입력창에 채웁니다."
        kind="jd"
        onExtract={onExtract}
      />
      <DropZone
        title="이력서 파일 첨부"
        hint={`${SUPPORTED_FILE_LABEL}를 지원합니다. 스캔 PDF와 이미지는 OCR 상태에 따라 다시 업로드가 필요할 수 있습니다.`}
        kind="resume"
        onExtract={onExtract}
      />
    </div>
  );
}
