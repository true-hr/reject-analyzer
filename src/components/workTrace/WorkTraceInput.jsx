// src/components/workTrace/WorkTraceInput.jsx
// Main input UI for work trace paste/upload → AI experience extraction.
import { useCallback, useRef, useState } from "react";
import { extractTextFromFile } from "@/lib/extract/extractTextFromFile.js";
import { extractExperienceCandidates } from "@/lib/workTrace/extractExperienceCandidates.js";
import ExperienceCandidateReview from "./ExperienceCandidateReview.jsx";

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp";

function FileChip({ name, charCount, onRemove }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600">
      <span className="max-w-[160px] truncate font-medium">{name}</span>
      {typeof charCount === "number" && (
        <span className="text-slate-400">({charCount.toLocaleString()}자)</span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 text-slate-400 hover:text-slate-700"
          aria-label="파일 제거"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function WorkTraceInput({ className = "", careerRoleLabel = "", jobId = "", onOpenResumeView = null, onOpenLogin = null, layout = "compact" }) {
  const isWeb = layout === "web";
  const [rawText, setRawText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [extractState, setExtractState] = useState(null); // null | "loading" | "done" | "error"
  const [extractError, setExtractError] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [fileExtracting, setFileExtracting] = useState(false);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  const handleFileChange = useCallback(async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    try { e.target.value = ""; } catch {}

    setFileExtracting(true);
    setFileError(null);
    try {
      const res = await extractTextFromFile(file, "work_trace");
      if (res.ok && res.text) {
        setRawText((prev) => {
          const sep = prev.trim() ? "\n\n" : "";
          return prev + sep + res.text;
        });
        setAttachedFiles((prev) => [
          ...prev,
          {
            name: res.meta?.name || file.name,
            charCount: res.meta?.charCount ?? res.text.length,
          },
        ]);
      } else {
        const warn = Array.isArray(res.meta?.warnings) && res.meta.warnings.length
          ? res.meta.warnings[0]
          : null;
        setFileError(
          warn || "파일에서 텍스트를 읽지 못했어요. 스캔 파일이거나 이미지 품질이 낮을 수 있습니다."
        );
      }
    } catch {
      setFileError("파일 처리 중 오류가 발생했어요.");
    } finally {
      setFileExtracting(false);
    }
  }, []);

  const handleExtract = useCallback(async () => {
    if (!rawText.trim()) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setExtractState("loading");
    setExtractError(null);
    setCandidates(null);

    const result = await extractExperienceCandidates({ rawText, signal: ctrl.signal, careerRoleLabel, jobId });

    if (ctrl.signal.aborted) return;

    if (result.ok) {
      setCandidates(result);
      setExtractState("done");
    } else {
      setExtractError(result.message || "경험 분석 중 오류가 발생했어요.");
      setExtractState("error");
    }
  }, [rawText]);

  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setRawText("");
    setAttachedFiles([]);
    setExtractState(null);
    setExtractError(null);
    setCandidates(null);
    setFileError(null);
  }, []);

  const isLoading = extractState === "loading";
  const canExtract = rawText.trim().length >= 30 && !isLoading;

  if (extractState === "done" && candidates) {
    return (
      <ExperienceCandidateReview
        result={candidates}
        rawText={rawText}
        onBack={handleReset}
        onOpenResumeView={onOpenResumeView}
        onOpenLogin={onOpenLogin}
        layout={layout}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div>
        <h2 className="text-base font-bold text-slate-900">자료 그대로 붙여넣기</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          정리하지 말고 그대로 붙여넣으세요.
          카톡, 슬랙, 회의록, 업무보고, 메일, 캡처 이미지까지{" "}
          PASSMAP이 경험 후보와 이력서 문장 소재를 찾아드립니다.
        </p>
      </div>

      <textarea
        className={`w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200 disabled:opacity-60 ${isWeb ? "min-h-[280px]" : "min-h-[140px]"}`}
        placeholder="오늘 한 일, 카톡/슬랙 대화, 회의록, 업무보고 내용을 그대로 붙여넣어 주세요."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={isLoading}
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 ${fileExtracting || isLoading ? "pointer-events-none opacity-50" : ""}`}>
          {fileExtracting ? (
            <span className="animate-pulse">읽는 중…</span>
          ) : (
            <>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              파일·이미지 첨부
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            disabled={fileExtracting || isLoading}
          />
        </label>

        {attachedFiles.map((f, i) => (
          <FileChip
            key={i}
            name={f.name}
            charCount={f.charCount}
            onRemove={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
          />
        ))}
      </div>

      {fileError && (
        <p className="text-[11px] text-amber-700">
          {fileError}
        </p>
      )}

      {rawText.trim().length > 0 && rawText.trim().length < 30 && (
        <p className="text-[11px] text-slate-400">
          조금 더 입력하면 분석을 시작할 수 있어요. (현재 {rawText.trim().length}자 / 최소 30자)
        </p>
      )}

      {extractState === "error" && extractError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          {extractError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleExtract}
          disabled={!canExtract}
          className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              경험 찾는 중…
            </span>
          ) : (
            isWeb ? "AI로 경험 정리하기" : "AI로 경험 찾아보기"
          )}
        </button>

        {(rawText || extractState) && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            초기화
          </button>
        )}
      </div>
    </div>
  );
}
