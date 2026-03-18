// 이력서 입력 (deep 모드 전용) — SSOT: state.resume 직접 바인딩 (로컬 useState 없음)
export default function ResumeInput({ state, setState, onDone }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">이력서를 붙여넣으세요</div>
      <p className="text-sm text-slate-500">이력서가 있으면 서류 매칭 리스크를 더 정확히 진단해요.</p>
      <textarea
        className="min-h-[180px] resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
        placeholder={`예시
ABC SaaS (2020-현재)
Enterprise Sales Manager

- B2B SaaS 분야의 대기업 영업 담당
- 연간 매출 30억 규모 파이프라인 관리
- 신규 고객 25개사 확보 (총 매출 +40% 성장)
- CRM(Salesforce) 기반 영업 데이터 관리

이전 경력
XYZ Tech (2017-2020)
Sales Executive

- IT 분야 B2B 영업
- 제조 대기업 고객 신규 계약 체결`}
        value={state?.resume || ""}
        onChange={(e) => setState((prev) => ({ ...prev, resume: e.target.value }))}
      />
      <div>
        <button
          className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={onDone}
        >
          분석 준비 완료
        </button>
      </div>
    </div>
  );
}
