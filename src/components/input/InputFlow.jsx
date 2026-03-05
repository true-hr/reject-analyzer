import { useState } from "react";
import ModeSelector from "./ModeSelector";
import IndustrySelector from "./IndustrySelector";
import RoleSelector from "./RoleSelector";
import CareerQuestions from "./CareerQuestions";
import JDInput from "./JDInput";
import ResumeInput from "./ResumeInput";

// flowStep: App.jsx의 `step` 변수와 충돌 방지를 위해 별도 네임 사용
const FLOW = {
  MODE:             1,
  INDUSTRY_CURRENT: 2,
  INDUSTRY_TARGET:  3,
  ROLE:             4,
  CAREER:           5,
  JD:               6,
  RESUME:           7,
  ANALYZE:          8,
};

// fast: 1→2→3→4→5→8  /  deep: 1→2→3→4→5→6→7→8
export default function InputFlow({ state, setState, onAnalyze }) {
  const [flowStep, setFlowStep] = useState(FLOW.MODE);
  const [mode, setMode] = useState(null);

  const totalSteps = mode === "deep" ? 7 : 5;
  const progress = Math.round(((flowStep - 1) / totalSteps) * 100);

  const handleMode = (m) => {
    setMode(m);
    setFlowStep(FLOW.INDUSTRY_CURRENT);
  };

  const handleIndustryCurrent = (v) => {
    setState((prev) => ({ ...prev, industryCurrent: v }));
    setFlowStep(FLOW.INDUSTRY_TARGET);
  };

  const handleIndustryTarget = (v) => {
    setState((prev) => ({ ...prev, industryTarget: v }));
    setFlowStep(FLOW.ROLE);
  };

  const handleRole = (v) => {
    setState((prev) => ({ ...prev, role: v }));
    setFlowStep(FLOW.CAREER);
  };

  // CareerQuestions는 onChange로 state를 직접 업데이트하므로, onDone은 단순 이동
  const handleCareerDone = () => {
    setFlowStep(mode === "fast" ? FLOW.ANALYZE : FLOW.JD);
  };

  // JDInput / ResumeInput도 onChange로 직접 업데이트하므로 onDone은 단순 이동
  const handleJDDone = () => {
    setFlowStep(FLOW.RESUME);
  };

  const handleResumeDone = () => {
    setFlowStep(FLOW.ANALYZE);
  };

  return (
    <div className="flex flex-col gap-6 px-1 pb-10">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {flowStep > FLOW.MODE && (
            <button
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setFlowStep((s) => Math.max(s - 1, FLOW.MODE))}
            >
              ←
            </button>
          )}
          <span className="text-xs text-slate-400">
            {flowStep < FLOW.ANALYZE ? `${flowStep} / ${totalSteps}` : ""}
          </span>
        </div>
        {/* 기존 입력 방식으로 링크 제거 (SHOW_LEGACY_JOB_INPUTS = false 정책에 따라 영구 숨김) */}
      </div>

      {/* 진행 바 */}
      {flowStep < FLOW.ANALYZE && (
        <div className="h-1 w-full rounded-full bg-slate-100">
          <div
            className="h-1 rounded-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 단계별 컴포넌트 */}
      {flowStep === FLOW.MODE             && <ModeSelector onSelect={handleMode} />}
      {flowStep === FLOW.INDUSTRY_CURRENT && <IndustrySelector label="현재 재직 중인 산업" onSelect={handleIndustryCurrent} />}
      {flowStep === FLOW.INDUSTRY_TARGET  && <IndustrySelector label="지원하는 산업" onSelect={handleIndustryTarget} />}
      {flowStep === FLOW.ROLE             && <RoleSelector onSelect={handleRole} />}
      {flowStep === FLOW.CAREER           && (
        <CareerQuestions state={state} setState={setState} onDone={handleCareerDone} />
      )}
      {flowStep === FLOW.JD               && (
        <JDInput state={state} setState={setState} onDone={handleJDDone} />
      )}
      {flowStep === FLOW.RESUME           && (
        <ResumeInput state={state} setState={setState} onDone={handleResumeDone} />
      )}

      {/* 최종 분석 단계 */}
      {flowStep === FLOW.ANALYZE && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-xl font-semibold text-slate-900">준비 완료</div>
          <p className="text-sm text-slate-500 text-center">
            입력한 정보를 바탕으로 합격 리스크를 분석합니다.
          </p>
          <button
            className="rounded-full bg-slate-900 px-10 py-3 font-semibold text-white"
            onClick={onAnalyze}
          >
            분석 시작
          </button>
        </div>
      )}
    </div>
  );
}
