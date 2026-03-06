// 경력 정보 입력 — SSOT: state.career 직접 바인딩 (로컬 useState 없음)
export default function CareerQuestions({ state, setState, onDone }) {
  const career = state?.career || {};

  const setCareerField = (key, v) => {
    setState((prev) => ({
      ...prev,
      career: { ...(prev.career || {}), [key]: Number(v) || 0 },
    }));
  };

  // append-only: leadershipLevel / educationLevel은 string 필드
  const setCareerStr = (key, v) => {
    setState((prev) => ({
      ...prev,
      career: { ...(prev.career || {}), [key]: v },
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="text-lg font-semibold text-slate-900">경력 정보를 알려주세요</div>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">총 경력 <span className="text-slate-400 font-normal">(년)</span></span>
          <input
            type="number" min="0" max="50"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            value={career.totalYears ?? 0}
            onChange={(e) => setCareerField("totalYears", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">공백기 <span className="text-slate-400 font-normal">(개월, 없으면 0)</span></span>
          <input
            type="number" min="0" max="240"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            value={career.gapMonths ?? 0}
            onChange={(e) => setCareerField("gapMonths", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">이직 횟수 <span className="text-slate-400 font-normal">(현 직장 제외)</span></span>
          <input
            type="number" min="0" max="30"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            value={career.jobChanges ?? 0}
            onChange={(e) => setCareerField("jobChanges", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">마지막 재직기간 <span className="text-slate-400 font-normal">(개월)</span></span>
          <input
            type="number" min="0" max="600"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
            value={career.lastTenureMonths ?? 0}
            onChange={(e) => setCareerField("lastTenureMonths", e.target.value)}
          />
        </label>

        {/* append-only: 리더 경험 / 최종 학력 */}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">리더 경험</span>
          <select
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
            value={career.leadershipLevel ?? "individual"}
            onChange={(e) => setCareerStr("leadershipLevel", e.target.value)}
          >
            <option value="individual">실무자</option>
            <option value="manager">팀장·파트장</option>
            <option value="executive">임원급</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">최종 학력</span>
          <select
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
            value={career.educationLevel ?? "bachelor"}
            onChange={(e) => setCareerStr("educationLevel", e.target.value)}
          >
            <option value="highschool">고졸</option>
            <option value="college">전문대</option>
            <option value="bachelor">학사</option>
            <option value="master">석사</option>
            <option value="phd">박사</option>
          </select>
        </label>
      </div>
      <button
        className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
        onClick={onDone}
      >
        다음
      </button>
    </div>
  );
}
