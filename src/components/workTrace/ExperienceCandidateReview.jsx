// src/components/workTrace/ExperienceCandidateReview.jsx
// Displays AI-extracted experience candidates for user review.
import { useState } from "react";
import { saveAcceptedWorkTraceCandidates } from "@/lib/workTrace/saveWorkTraceCandidates.js";

const REVIEW_STATUS = {
  pending: "pending",
  accepted: "accepted",
  needsEdit: "needsEdit",
  rejected: "rejected",
};

const DIFFERS_OPTIONS = [
  { key: "not_led", label: "내가 주도한 일은 아니에요" },
  { key: "no_result", label: "결과가 없었어요" },
  { key: "better_result", label: "더 중요한 성과가 있어요" },
  { key: "overstatement", label: "표현이 과장됐어요" },
  { key: "manual_edit", label: "직접 수정할게요" },
];

const POTENTIAL_LABEL = {
  high: { text: "이력서 활용 높음", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { text: "활용 가능", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low: { text: "보완 필요", cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

const SOURCE_TYPE_LABEL = {
  kakao: "카카오톡",
  slack: "슬랙",
  meeting_note: "회의록",
  email: "이메일",
  work_report: "업무보고",
  csv: "데이터/표",
  image: "이미지",
  unknown: "업무 자료",
};

function _toArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [String(value)];
}

function CandidateCard({ candidate, status, differReason, onAccept, onReject, onDiffer, onEditConfirm }) {
  const [showDiffers, setShowDiffers] = useState(false);
  const [localEditText, setLocalEditText] = useState(candidate.suggestedResumeBullet || "");
  const pot = POTENTIAL_LABEL[candidate.resumePotential] || POTENTIAL_LABEL.medium;
  const actionsItems = _toArray(candidate.actions);
  const resultItems = _toArray(candidate.result);
  const missingInfoItems = _toArray(candidate.missingInfoQuestions ?? candidate.followUpQuestions);

  return (
    <div className={`rounded-2xl border bg-white shadow-sm ${status === "rejected" ? "opacity-40" : ""}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-900 leading-snug">{candidate.title || "경험 후보"}</div>
            {candidate.role && (
              <div className="mt-0.5 text-[11px] text-slate-500">{candidate.role}</div>
            )}
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${pot.cls}`}>
            {pot.text}
          </span>
        </div>

        {candidate.situation && (
          <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
            <span className="font-medium text-slate-500">상황</span>{" "}
            {candidate.situation}
          </p>
        )}
        {candidate.problem && (
          <p className="mt-1 text-xs leading-relaxed text-slate-700">
            <span className="font-medium text-slate-500">문제</span>{" "}
            {candidate.problem}
          </p>
        )}

        {actionsItems.length > 0 && (
          <div className="mt-2.5">
            <div className="text-[11px] font-medium text-slate-500 mb-1">한 일</div>
            <ul className="space-y-0.5">
              {actionsItems.map((a, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resultItems.length > 0 && (
          <div className="mt-2">
            <div className="text-[11px] font-medium text-slate-500 mb-1">결과</div>
            <ul className="space-y-0.5">
              {resultItems.map((r, i) => (
                <li key={i} className="flex gap-1.5 text-xs text-slate-700">
                  <span className="mt-0.5 shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {candidate.skills?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {candidate.skills.map((s, i) => (
              <span key={i} className="rounded-full border border-violet-100 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                {s}
              </span>
            ))}
          </div>
        )}

        {candidate.suggestedResumeBullet && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[10px] font-medium text-slate-400 mb-1">이력서 문장 예시</div>
            <p className="text-[11px] leading-relaxed text-slate-700 italic">
              {candidate.suggestedResumeBullet}
            </p>
          </div>
        )}

        {missingInfoItems.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
            <div className="text-[10px] font-medium text-amber-700 mb-1">
              아직 결과가 부족해요. 아래 정보가 있으면 더 강한 경험이 됩니다.
            </div>
            <ul className="space-y-0.5">
              {missingInfoItems.map((q, i) => (
                <li key={i} className="text-[11px] text-amber-800">• {q}</li>
              ))}
            </ul>
          </div>
        )}

        {candidate.riskNotes?.length > 0 && (
          <div className="mt-2">
            {candidate.riskNotes.map((r, i) => (
              <p key={i} className="text-[10px] text-slate-400 mt-0.5">
                ⚠ {r}
              </p>
            ))}
          </div>
        )}

        {candidate.evidenceTexts?.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[10px] font-medium text-slate-400 hover:text-slate-600">
              근거 원문 보기
            </summary>
            <ul className="mt-1 space-y-0.5 pl-2">
              {candidate.evidenceTexts.map((e, i) => (
                <li key={i} className="text-[10px] text-slate-400">"{e}"</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {status !== "rejected" && (
        <div className="border-t border-slate-100 px-4 py-3">
          {status === "accepted" ? (
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-semibold text-emerald-600">✓ 내 경험으로 확인</span>
                <p className="mt-0.5 text-[10px] text-slate-400">아래 저장 버튼을 눌러야 최종 저장됩니다.</p>
              </div>
              <button
                type="button"
                onClick={() => onAccept(null)}
                className="text-[10px] text-slate-400 hover:text-slate-600"
              >
                취소
              </button>
            </div>
          ) : status === "needsEdit" && showDiffers ? (
            <div>
              <div className="text-[11px] text-slate-600 mb-2">어떤 부분이 달라요?</div>
              <div className="flex flex-wrap gap-1.5">
                {DIFFERS_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => { onDiffer(opt.key); setShowDiffers(false); }}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:border-violet-300 hover:text-violet-700"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowDiffers(false)}
                className="mt-2 text-[10px] text-slate-400 hover:text-slate-600"
              >
                취소
              </button>
            </div>
          ) : status === "needsEdit" && differReason === "manual_edit" ? (
            <div>
              <div className="text-[11px] text-slate-600 mb-1.5">이력서에 반영할 문장을 직접 수정해 주세요</div>
              <textarea
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
                rows={3}
                value={localEditText}
                onChange={(e) => setLocalEditText(e.target.value)}
                placeholder={candidate.suggestedResumeBullet || "수정할 문장을 입력해 주세요"}
              />
              <p className="mt-1 text-[10px] text-slate-400">수정한 문장은 저장 후 이력서 후보 문장으로 우선 반영됩니다.</p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => { if (localEditText.trim()) onEditConfirm(localEditText.trim()); }}
                  disabled={!localEditText.trim()}
                  className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  수정 확인
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiffers(true)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  다시 선택
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAccept(true)}
                className="flex-1 rounded-xl bg-violet-600 py-2 text-xs font-semibold text-white hover:bg-violet-700"
              >
                내 경험 맞음
              </button>
              <button
                type="button"
                onClick={() => { setShowDiffers(true); onDiffer(null); }}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                조금 다름
              </button>
              <button
                type="button"
                onClick={() => onReject()}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-50"
              >
                삭제
              </button>
            </div>
          )}
        </div>
      )}

      {status === "rejected" && (
        <div className="border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={() => onReject(false)}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            삭제 취소
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExperienceCandidateReview({ result, rawText = "", onBack, onOpenResumeView }) {
  const [statuses, setStatuses] = useState(() =>
    Object.fromEntries((result.candidates || []).map((_, i) => [i, REVIEW_STATUS.pending]))
  );
  const [differReasons, setDifferReasons] = useState({});
  const [userEditedTexts, setUserEditedTexts] = useState({});
  const [saveState, setSaveState] = useState("idle"); // "idle" | "saving" | "saved" | "error" | "auth"
  const [saveMessage, setSaveMessage] = useState("");

  const setStatus = (i, status) => {
    setStatuses((prev) => ({ ...prev, [i]: status }));
  };

  const sourceLabel = SOURCE_TYPE_LABEL[result.sourceType] || "업무 자료";
  const candidates = result.candidates || [];
  const acceptedIndices = Object.entries(statuses)
    .filter(([, s]) => s === REVIEW_STATUS.accepted)
    .map(([i]) => Number(i));
  const accepted = acceptedIndices.length;
  const acceptedCandidates = acceptedIndices.map((i) => {
    const c = candidates[i];
    const editedText = userEditedTexts[i];
    if (editedText) {
      return {
        ...c,
        originalIndex: i,
        userEditedResumeBullet: editedText,
        suggestedResumeBullet: editedText,
      };
    }
    return { ...c, originalIndex: i };
  });

  const handleSave = async () => {
    if (!acceptedCandidates.length) return;
    setSaveState("saving");
    setSaveMessage("");
    const res = await saveAcceptedWorkTraceCandidates({
      rawText,
      analysisResult: result,
      acceptedCandidates,
      differReasons,
    });
    if (res.ok) {
      setSaveState("saved");
      setSaveMessage(`${res.savedCount}개의 경험을 저장했어요. 기록 탭과 이력서 후보 문장에 활용할 수 있습니다.`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("passmap:work-records-changed", {
          detail: { source: "work_trace", savedRecord: res.savedRecord, savedCount: res.savedCount },
        }));
      }
    } else if (res.errorCode === "AUTH_REQUIRED") {
      setSaveState("auth");
      setSaveMessage(res.message);
    } else {
      setSaveState("error");
      setSaveMessage(res.message || "저장 중 오류가 발생했어요.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="text-[11px] text-slate-400 hover:text-slate-700"
            >
              ← 다시 입력
            </button>
            <span className="text-[10px] text-slate-300">|</span>
            <span className="text-[10px] text-slate-400">{sourceLabel} 분석 결과</span>
          </div>
          <h2 className="mt-1.5 text-sm font-bold text-slate-900">
            경험 후보 {candidates.length}개를 찾았어요
          </h2>
          {result.summary && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{result.summary}</p>
          )}
        </div>
        {accepted > 0 && (
          <div className="shrink-0 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            {accepted}개 확인됨
          </div>
        )}
      </div>

      {result.detectedPeriod && (
        <div className="text-[11px] text-slate-500">
          감지된 기간: <span className="font-medium">{result.detectedPeriod}</span>
        </div>
      )}

      {candidates.length === 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm text-slate-500">경험 후보를 찾지 못했어요.</p>
          <p className="mt-1 text-xs text-slate-400">내용을 더 추가하거나 다른 자료를 붙여넣어 주세요.</p>
          <button type="button" onClick={onBack} className="mt-4 text-xs font-medium text-violet-600 hover:underline">
            다시 입력하기
          </button>
        </div>
      )}

      {candidates.map((c, i) => (
        <CandidateCard
          key={i}
          candidate={c}
          status={statuses[i]}
          differReason={differReasons[i] ?? null}
          onAccept={(val) => setStatus(i, val ? REVIEW_STATUS.accepted : REVIEW_STATUS.pending)}
          onReject={(val) => setStatus(i, val === false ? REVIEW_STATUS.pending : REVIEW_STATUS.rejected)}
          onDiffer={(reason) => {
            if (reason) {
              setStatus(i, REVIEW_STATUS.needsEdit);
              setDifferReasons((prev) => ({ ...prev, [i]: reason }));
            } else {
              setStatus(i, REVIEW_STATUS.needsEdit);
            }
          }}
          onEditConfirm={(editedText) => {
            setUserEditedTexts((prev) => ({ ...prev, [i]: editedText }));
            setStatus(i, REVIEW_STATUS.accepted);
            setDifferReasons((prev) => ({ ...prev, [i]: "manual_edit" }));
          }}
        />
      ))}

      {/* 저장 완료 인라인 메시지 */}
      {candidates.length > 0 && saveState === "saved" && (
        <div className="flex flex-col gap-2 pb-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-emerald-700">✓ {saveMessage}</p>
          </div>
          {onOpenResumeView && (
            <button
              type="button"
              onClick={onOpenResumeView}
              className="w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
            >
              이력서 후보 보기
            </button>
          )}
        </div>
      )}

      {/* 저장 CTA — 후보가 있는 동안 항상 표시 */}
      {candidates.length > 0 && saveState !== "saved" && (
        <div className="sticky bottom-16 z-10 -mx-0 rounded-b-2xl border-t border-slate-100 bg-white px-0 pb-2 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          {accepted === 0 ? (
            <button
              type="button"
              disabled
              className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
            >
              저장할 경험을 선택해 주세요
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === "saving"}
                className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saveState === "saving"
                  ? "저장 중…"
                  : `선택한 경험 저장 (${accepted}개)`}
              </button>
              {(saveState === "error" || saveState === "auth") && (
                <p className="mt-1.5 text-center text-[11px] text-amber-700">{saveMessage}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
