// JD 입력 (deep 모드 전용) — SSOT: state.jd 직접 바인딩 (로컬 useState 없음)
export default function JDInput({ state, setState, onDone }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-lg font-semibold text-slate-900">채용공고(JD)를 붙여넣으세요</div>
      <p className="text-sm text-slate-500">JD가 있으면 더 정확하게 분석할 수 있어요.</p>
      <textarea
        className="min-h-[180px] resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
        placeholder={`예시
주요 업무
- SaaS 제품의 B2B 영업 전략 수립 및 실행
- 대기업 고객 대상 신규 영업 및 기존 고객 관리
- CRM(Salesforce) 기반 파이프라인 관리
- 마케팅/제품과 협업하여 고객 요구사항 반영

자격 요건
- B2B SaaS 영업 경력 5년 이상
- Enterprise 고객 대상 영업 경험
- CRM(Salesforce, Hubspot 등) 사용 경험

우대
- SaaS 스타트업 근무 경험
- 데이터 기반 영업 성과 관리 경험`}
        value={state?.jd || ""}
        onChange={(e) => setState((prev) => ({ ...prev, jd: e.target.value }))}
      />
      <div>
        <button
          className="w-full rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={onDone}
        >
          다음
        </button>
      </div>
    </div>
  );
}
