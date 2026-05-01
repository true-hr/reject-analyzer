import PmMvpView from "../mvp/PmMvpView.jsx";

function EmptyState({ onNavigateRecord }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">아직 이력서에 반영할 기록이 없습니다</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          기록 탭에서 업무를 먼저 남겨보세요.<br />
          기록한 내용을 바탕으로 이력서 문장이 만들어집니다.
        </p>
      </div>
      {typeof onNavigateRecord === "function" && (
        <button
          type="button"
          onClick={onNavigateRecord}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition-opacity active:opacity-70"
        >
          기록 탭으로 이동
        </button>
      )}
    </div>
  );
}

export default function MobileResumeTab({
  externalLastInput,
  currentCareerRoleLabel,
  currentJobId,
  onOpenLogin,
  onNavigateRecord,
  onNavigateAnalysis,
}) {
  return (
    <div className="flex flex-col pb-24 pt-4">
      <div className="mb-3 px-4">
        <h2 className="text-lg font-bold text-slate-900">이력서</h2>
        <p className="mt-0.5 text-xs text-slate-500">기록 기반 경험 자산을 확인하세요.</p>
      </div>

      {externalLastInput == null ? (
        <EmptyState onNavigateRecord={onNavigateRecord} />
      ) : (
        <PmMvpView
          mode="preview"
          entryView="result"
          currentCareerRoleLabel={currentCareerRoleLabel ?? ""}
          currentJobId={currentJobId ?? ""}
          externalLastInput={externalLastInput}
          onOpenLogin={onOpenLogin ?? null}
          onOpenUpdateView={onNavigateRecord ?? null}
          onOpenAnalysis={onNavigateAnalysis ?? null}
        />
      )}
    </div>
  );
}
