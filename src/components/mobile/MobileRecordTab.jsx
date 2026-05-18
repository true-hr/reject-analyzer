import { useState } from "react";
import PmMvpView from "../mvp/PmMvpView.jsx";
import MobileWeekStrip from "./MobileWeekStrip.jsx";
import WorkTraceInput from "../workTrace/WorkTraceInput.jsx";

export default function MobileRecordTab({
  currentCareerRoleLabel,
  currentJobId,
  onRecordSubmit,
  onOpenLogin,
  onOpenResumeView,
  onOpenAnalysis,
}) {
  const [traceOpen, setTraceOpen] = useState(false);

  return (
    <div className="flex flex-col pb-24 pt-4">
      <div className="mb-3 px-4">
        <h2 className="text-lg font-bold text-slate-900">기록</h2>
        <p className="mt-0.5 text-xs text-slate-500">오늘 한 일을 짧게 기록하면 이력서 문장으로 이어집니다.</p>
      </div>

      {/* 업무 흔적 넣기 — 접힘 영역 */}
      <div className="mx-4 mb-4 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setTraceOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <div>
            <span className="text-sm font-semibold text-slate-900">업무 흔적 넣기</span>
            <span className="ml-2 rounded-full border border-violet-100 bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-600">
              NEW
            </span>
          </div>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${traceOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {traceOpen && (
          <div className="border-t border-violet-50 px-4 pb-4 pt-3">
            <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
              정리하지 말고 카톡·슬랙·회의록·이미지를 그대로 넣으면 PASSMAP이 경력 경험을 찾아드립니다.
            </p>
            <WorkTraceInput
                careerRoleLabel={currentCareerRoleLabel}
                jobId={currentJobId}
                onOpenResumeView={onOpenResumeView}
              />
          </div>
        )}
      </div>

      <MobileWeekStrip />
      <PmMvpView
        mode="update"
        entryView="weekly"
        currentCareerRoleLabel={currentCareerRoleLabel ?? ""}
        currentJobId={currentJobId ?? ""}
        onRecordSubmit={onRecordSubmit ?? null}
        onOpenLogin={onOpenLogin ?? null}
        onOpenResumeView={onOpenResumeView ?? null}
        onOpenAnalysis={onOpenAnalysis ?? null}
        collapseStructuredSections={true}
      />
    </div>
  );
}
