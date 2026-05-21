// src/components/workTrace/WebWorkTraceRecordPage.jsx
// Web-only 2-column wrapper for the work trace experience recording flow.
// Step 1/2: free-form input → AI extraction (WorkTraceInput)
// Step 2/2: candidate review (ExperienceCandidateReview, handled inside WorkTraceInput)
// Manual fallback: collapsed PmMvpView for structured input

import { useState } from "react";
import WorkTraceInput from "./WorkTraceInput.jsx";
import PmMvpView from "../mvp/PmMvpView.jsx";

const GUIDE_QUESTIONS = [
  { q: "무엇을 목표로 했나요?", hint: "팀/개인 목표, 해결하려던 문제" },
  { q: "어떤 일을 했나요?", hint: "구체적인 행동, 작업, 결정" },
  { q: "누구와 협업했나요?", hint: "관련 팀, 이해관계자, 외부 파트너" },
  { q: "어떤 성과가 있었나요?", hint: "수치, 변화, 완료된 결과물" },
  { q: "무엇을 배웠나요?", hint: "인사이트, 다음에 다르게 할 것" },
];

const INPUT_TYPE_CHIPS = [
  "복사/붙여넣기",
  "슬랙/카톡",
  "회의록/메모",
  "주간보고",
];

export default function WebWorkTraceRecordPage({
  currentCareerRoleLabel = "",
  currentJobId = "",
  onRecordSubmit = null,
  onOpenLogin = null,
  onOpenResumeView = null,
  onOpenAnalysis = null,
  onOpenAssetMap = null,
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const [flowStep, setFlowStep] = useState("input");

  return (
    <div className="w-full min-w-0 space-y-8">
      {/* Step pill + heading */}
      <div>
        <span className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-[12px] font-semibold text-white">
          경험 기록하기 1/2
        </span>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
          이번 주에 한 일을 편하게 적어주세요
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          문장으로 써도 되고, 회의록·슬랙/카톡 대화·업무 메모를 그대로 붙여넣어도 괜찮아요.
        </p>
      </div>

      {/* Main 2-column grid — collapses to single column during candidate review */}
      <div className={flowStep === "review" ? "block" : "grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(260px,380px)]"}>
        {/* Left: input area */}
        <div className="min-w-0 space-y-4">
          {/* Input type chips */}
          <div className="flex flex-wrap gap-2">
            {INPUT_TYPE_CHIPS.map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600"
              >
                {label}
              </span>
            ))}
          </div>

          {/* WorkTraceInput with web layout */}
          <WorkTraceInput
            layout="web"
            careerRoleLabel={currentCareerRoleLabel}
            jobId={currentJobId}
            onOpenResumeView={onOpenResumeView}
            onOpenLogin={onOpenLogin}
            onOpenAssetMap={onOpenAssetMap}
            onFlowStepChange={setFlowStep}
          />

          {/* Security note */}
          <p className="text-[11px] text-slate-400">
            입력하신 내용은 안전하게 보호되며, 외부에 공유되지 않습니다.
          </p>
        </div>

        {/* Right: guide card — visible only during input step */}
        <div className={`min-w-0 ${flowStep === "review" ? "hidden" : "hidden lg:block"}`}>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sticky top-4">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              이렇게 쓰면 좋아요
            </div>
            <p className="mb-4 text-xs text-slate-500">
              아래 질문을 생각하면서 자유롭게 적으세요. 형식은 관계없습니다.
            </p>
            <ul className="space-y-4">
              {GUIDE_QUESTIONS.map(({ q, hint }, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{q}</div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{hint}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Manual fallback — collapsed by default */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setManualOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left"
        >
          <div>
            <span className="text-sm font-semibold text-slate-700">직접 항목으로 입력하기</span>
            <span className="ml-2 text-xs text-slate-400">수동 기록 / 프로젝트</span>
          </div>
          <svg
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${manualOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {manualOpen && (
          <div className="border-t border-slate-100 px-2 pb-4 pt-2">
            <PmMvpView
              entryView="weekly"
              mode="update"
              currentCareerRoleLabel={currentCareerRoleLabel}
              currentJobId={currentJobId}
              onRecordSubmit={onRecordSubmit}
              onOpenLogin={onOpenLogin}
              onOpenResumeView={onOpenResumeView}
              onOpenAnalysis={onOpenAnalysis}
            />
          </div>
        )}
      </div>
    </div>
  );
}
