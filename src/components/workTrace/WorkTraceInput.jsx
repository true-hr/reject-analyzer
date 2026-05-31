// src/components/workTrace/WorkTraceInput.jsx
// Main input UI for work trace paste/upload → AI experience extraction.
import { useCallback, useEffect, useRef, useState } from "react";
import { extractTextFromFile } from "@/lib/extract/extractTextFromFile.js";
import { extractExperienceCandidates } from "@/lib/workTrace/extractExperienceCandidates.js";
import ExperienceCandidateReview from "./ExperienceCandidateReview.jsx";

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/png,image/jpeg,image/webp";

const AI_CONVERSATION_SAMPLE_TEXT = [
  "이번 주에는 CS 문의를 유형별로 분류하고 FAQ 문구를 정리했습니다.",
  "반복 질문 답변 시간을 줄이기 위해 상담팀과 공유했고, 다음 주에는 배송 지연 문의까지 같은 방식으로 정리하기로 했습니다.",
].join("\n");

// ─── Pending review preservation (survives login redirect) ─────────────────
// Restores an in-progress analysis result that was preserved before a login
// round-trip. sessionStorage only, TTL-bound — never persisted long-term.
const PENDING_REVIEW_KEY = "PASSMAP_PENDING_WORK_TRACE_REVIEW";
const PENDING_REVIEW_TTL_MS = 60 * 60 * 1000; // 1 hour

function clearPendingWorkTraceReview() {
  try { sessionStorage.removeItem(PENDING_REVIEW_KEY); } catch (_) {}
}

function loadPendingWorkTraceReview() {
  let parsed;
  try {
    const raw = sessionStorage.getItem(PENDING_REVIEW_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch (_) {
    return null;
  }
  if (!parsed || parsed.version !== 1 || typeof parsed.savedAt !== "number") {
    clearPendingWorkTraceReview();
    return null;
  }
  if (Date.now() - parsed.savedAt > PENDING_REVIEW_TTL_MS) {
    clearPendingWorkTraceReview();
    return null;
  }
  return parsed;
}

// ─── External intake (e.g. browser extension selection) ───────────────────
// Receives a payload that an external tool wrote into sessionStorage so the
// AI conversation tab can auto-populate without a copy/paste step. Strict
// validation + 1h TTL. The key is consumed (removed) on successful restore.
const EXTERNAL_INTAKE_KEY = "PASSMAP_EXTERNAL_INTAKE";
const EXTERNAL_INTAKE_TTL_MS = 60 * 60 * 1000; // 1 hour
const EXTERNAL_INTAKE_MIN_RAW_TEXT_LENGTH = 30;
const VALID_EXTERNAL_INTAKE_SOURCE_MODES = new Set(["work_trace", "ai_conversation"]);
const VALID_EXTERNAL_INTAKE_IMPORT_METHODS = new Set([
  "manual_paste_or_txt",
  "browser_extension_selection",
]);
const VALID_EXTERNAL_INTAKE_SOURCE_PLATFORMS = new Set([
  "manual",
  "chatgpt",
  "claude",
  "gemini",
  "browser_extension",
]);
const DEFAULT_IMPORT_METHOD = "manual_paste_or_txt";
const DEFAULT_SOURCE_PLATFORM = "manual";
const EXTERNAL_INTAKE_CHIP_LABEL = "브라우저 선택 텍스트";

function clearExternalIntake() {
  try { sessionStorage.removeItem(EXTERNAL_INTAKE_KEY); } catch (_) {}
}

function loadExternalIntake() {
  let parsed;
  try {
    const raw = sessionStorage.getItem(EXTERNAL_INTAKE_KEY);
    if (!raw) return null;
    parsed = JSON.parse(raw);
  } catch (_) {
    return null;
  }
  if (!parsed || parsed.version !== 1 || typeof parsed.savedAt !== "number") {
    clearExternalIntake();
    return null;
  }
  if (Date.now() - parsed.savedAt > EXTERNAL_INTAKE_TTL_MS) {
    clearExternalIntake();
    return null;
  }
  if (typeof parsed.rawText !== "string" || parsed.rawText.trim().length < EXTERNAL_INTAKE_MIN_RAW_TEXT_LENGTH) {
    clearExternalIntake();
    return null;
  }
  if (!VALID_EXTERNAL_INTAKE_SOURCE_MODES.has(parsed.sourceMode)) {
    clearExternalIntake();
    return null;
  }
  if (!VALID_EXTERNAL_INTAKE_IMPORT_METHODS.has(parsed.importMethod)) {
    clearExternalIntake();
    return null;
  }
  const sourcePlatform = typeof parsed.sourcePlatform === "string"
    ? parsed.sourcePlatform.trim().toLowerCase()
    : DEFAULT_SOURCE_PLATFORM;
  parsed.sourcePlatform = VALID_EXTERNAL_INTAKE_SOURCE_PLATFORMS.has(sourcePlatform)
    ? sourcePlatform
    : "browser_extension";
  return parsed;
}

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

export default function WorkTraceInput({ className = "", careerRoleLabel = "", jobId = "", onOpenResumeView = null, onOpenLogin = null, onOpenAssetMap = null, onFlowStepChange = null, layout = "compact", initialRecordDate = null, sourceMode = "work_trace" }) {
  const isWeb = layout === "web";
  const mode = sourceMode === "ai_conversation" ? "ai_conversation" : "work_trace";
  const isAiMode = mode === "ai_conversation";
  const [rawText, setRawText] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [extractState, setExtractState] = useState(null); // null | "loading" | "done" | "error"
  const [extractError, setExtractError] = useState(null);
  const [candidates, setCandidates] = useState(null);
  const [fileExtracting, setFileExtracting] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [pendingReviewState, setPendingReviewState] = useState(null);
  const [sourceImportMethod, setSourceImportMethod] = useState(DEFAULT_IMPORT_METHOD);
  const [sourcePlatform, setSourcePlatform] = useState(DEFAULT_SOURCE_PLATFORM);
  const [privacyReviewRequired, setPrivacyReviewRequired] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const fileInputRef = useRef(null);
  const abortRef = useRef(null);

  // Restore an in-progress review preserved before a login redirect (mount only).
  // Pending review takes priority over external intake; external intake is only
  // consumed when no pending review applies to the current tab.
  useEffect(() => {
    const pending = loadPendingWorkTraceReview();
    if (pending && pending.sourceMode === mode) {
      const restoredResult = pending.result;
      if (restoredResult && Array.isArray(restoredResult.candidates)
        && pending.rawText && typeof pending.rawText === "string") {
        setRawText(pending.rawText);
        setCandidates(restoredResult);
        setExtractState("done");
        setPendingReviewState({
          statuses: pending.statuses ?? null,
          differReasons: pending.differReasons ?? null,
          userEditedTexts: pending.userEditedTexts ?? null,
        });
        setSourcePlatform(pending.result?.sourcePlatform || DEFAULT_SOURCE_PLATFORM);
        return;
      }
    }
    // No applicable pending review — try external intake (e.g. browser extension).
    const intake = loadExternalIntake();
    if (!intake) return;
    if (intake.sourceMode !== mode) return; // wait for the tab that matches
    setRawText(intake.rawText);
    setSourceImportMethod(intake.importMethod);
    setSourcePlatform(intake.sourcePlatform || "browser_extension");
    setPrivacyReviewRequired(intake.privacyReviewRequired === true);
    setAttachedFiles([{
      name: EXTERNAL_INTAKE_CHIP_LABEL,
      charCount: intake.rawText.length,
    }]);
    clearExternalIntake();
    // extractState stays null so the user reviews and presses the run button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
    setPendingReviewState(null);

    const result = await extractExperienceCandidates({ rawText, signal: ctrl.signal, careerRoleLabel, jobId, sourceMode: mode });

    if (ctrl.signal.aborted) return;

    if (result.ok) {
      setCandidates({
        ...result,
        sourcePlatform: isAiMode ? sourcePlatform : DEFAULT_SOURCE_PLATFORM,
      });
      setExtractState("done");
    } else {
      setExtractError(result.message || "경험 분석 중 오류가 발생했어요.");
      setExtractState("error");
    }
  }, [rawText, careerRoleLabel, jobId, mode, isAiMode, sourcePlatform]);

  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setRawText("");
    setAttachedFiles([]);
    setExtractState(null);
    setExtractError(null);
    setCandidates(null);
    setFileError(null);
    setPendingReviewState(null);
    setSourceImportMethod(DEFAULT_IMPORT_METHOD);
    setSourcePlatform(DEFAULT_SOURCE_PLATFORM);
    setPrivacyReviewRequired(false);
    setSampleOpen(false);
    clearPendingWorkTraceReview();
  }, []);

  const isLoading = extractState === "loading";
  const canExtract = rawText.trim().length >= 30 && !isLoading;
  const buttonLabel = isAiMode ? "경험 초안 만들기" : isWeb ? "AI로 경험 정리하기" : "AI로 경험 찾아보기";
  const loadingLabel = isAiMode ? "경험 초안 만드는 중…" : "경험 찾는 중…";

  const currentFlowStep = extractState === "done" && candidates ? "review" : "input";
  useEffect(() => {
    if (typeof onFlowStepChange === "function") onFlowStepChange(currentFlowStep);
  }, [currentFlowStep, onFlowStepChange]);

  if (extractState === "done" && candidates) {
    return (
      <ExperienceCandidateReview
        result={candidates}
        rawText={rawText}
        onBack={handleReset}
        onOpenResumeView={onOpenResumeView}
        onOpenLogin={onOpenLogin}
        onOpenAssetMap={onOpenAssetMap}
        layout={layout}
        initialRecordDate={initialRecordDate}
        sourceMode={mode}
        sourceImportMethod={sourceImportMethod}
        initialReviewState={pendingReviewState}
      />
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {!isAiMode && (
        <div>
          <h2 className="text-base font-bold text-slate-900">자료 그대로 붙여넣기</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            정리하지 말고 그대로 붙여넣으세요. 카톡, 슬랙, 회의록, 업무보고, 메일, 캡처 이미지까지 PASSMAP이 이력서에 쓸 기록 초안을 찾아드립니다.
          </p>
        </div>
      )}

      {isAiMode && privacyReviewRequired && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          브라우저 확장으로 가져온 선택 텍스트입니다. 개인정보, 회사 기밀, 고객정보, 토큰, 원문 전체가 포함되지 않았는지 확인한 뒤 분석을 시작하세요.
        </p>
      )}

      <textarea
        className={`w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200 disabled:opacity-60 ${isWeb ? "min-h-[300px]" : "min-h-[140px]"}`}
        placeholder={isAiMode
          ? "예: 오늘 한 일 회고, 프로젝트 고민, 면접 답변 정리 대화를 붙여넣어 주세요."
          : "오늘 한 일, 카톡/슬랙 대화, 회의록, 업무보고 내용을 그대로 붙여넣어 주세요."}
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={isLoading}
      />

      {isAiMode && sampleOpen && (
        <pre className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          {AI_CONVERSATION_SAMPLE_TEXT}
        </pre>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {isAiMode && (
          <button
            type="button"
            onClick={() => setSampleOpen((value) => !value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {sampleOpen ? "예시 닫기" : "예시 보기"}
          </button>
        )}

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

      {isAiMode && (
        <p className="text-[11px] leading-relaxed text-slate-400">
          이름, 회사 기밀, 개인정보는 지우고 붙여넣어 주세요. 입력한 내용은 외부에 공개되지 않습니다.
        </p>
      )}

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
              {loadingLabel}
            </span>
          ) : (
            buttonLabel
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
