// 이력서 입력 (deep 모드 전용) — SSOT: state.resume 직접 바인딩 (로컬 useState 없음)
export default function ResumeInput({ state, setState, onDone }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">이력서를 붙여넣으세요</div>
      <p className="text-sm text-slate-500">이력서가 있으면 서류 매칭 리스크를 더 정확히 진단해요.</p>
      <textarea
        className="min-h-[180px] resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        placeholder="이력서 내용을 붙여넣으세요..."
        value={state?.resume || ""}
        onChange={(e) => setState((prev) => ({ ...prev, resume: e.target.value }))}
      />
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700"
          onClick={onDone}
        >
          건너뛰기
        </button>
        <button
          className="flex-1 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={onDone}
        >
          분석 준비 완료
        </button>
      </div>
    </div>
  );
}
