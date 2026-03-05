// 분석 모드 선택 (fast / deep)
export default function ModeSelector({ onSelect }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">분석 방식을 선택하세요</div>
      <p className="text-sm text-slate-500">입력 가능한 정보에 맞는 방식을 고르세요.</p>
      <div className="flex flex-col gap-3">
        <button
          className="rounded-2xl border-2 border-slate-200 p-4 text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
          onClick={() => onSelect("fast")}
        >
          <div className="font-semibold text-slate-900">빠른 분석</div>
          <div className="mt-1 text-sm text-slate-500">기본 정보(산업·직무·경력)만으로 빠르게 진단합니다.</div>
        </button>
        <button
          className="rounded-2xl border-2 border-slate-200 p-4 text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
          onClick={() => onSelect("deep")}
        >
          <div className="font-semibold text-slate-900">정밀 분석 <span className="text-xs font-normal text-slate-400">JD + 이력서</span></div>
          <div className="mt-1 text-sm text-slate-500">JD와 이력서를 함께 입력해 매칭 리스크까지 분석합니다.</div>
        </button>
      </div>
    </div>
  );
}
