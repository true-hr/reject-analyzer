// JD 입력 (deep 모드 전용) — SSOT: state.jd 직접 바인딩 (로컬 useState 없음)
export default function JDInput({ state, setState, onDone }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">채용공고(JD)를 붙여넣으세요</div>
      <p className="text-sm text-slate-500">JD가 있으면 도메인 매칭 리스크까지 분석할 수 있어요.</p>
      <textarea
        className="min-h-[180px] resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
        placeholder="채용공고 내용을 붙여넣으세요..."
        value={state?.jd || ""}
        onChange={(e) => setState((prev) => ({ ...prev, jd: e.target.value }))}
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
          다음
        </button>
      </div>
    </div>
  );
}
