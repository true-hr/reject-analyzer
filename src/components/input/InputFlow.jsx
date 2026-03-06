import { useState, useRef } from "react";
import ModeSelector from "./ModeSelector";
import IndustrySelector from "./IndustrySelector";
import RoleSelector from "./RoleSelector";
import CareerQuestions from "./CareerQuestions";
import JDInput from "./JDInput";
import ResumeInput from "./ResumeInput";
import { extractTextFromFile } from "../../lib/extract/extractTextFromFile.js";

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
export default function InputFlow({ state, setState, onAnalyze, onGoDoc, onExtract }) {
  const [flowStep, setFlowStep] = useState(FLOW.MODE);
  const [mode, setMode] = useState(null);
  // append-only: 첨부 상태 표시용
  const [attachedFileName, setAttachedFileName] = useState(null);
  const fileInputRef = useRef(null);

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

  // append-only: JD 첨부 상태
  const [jdAttachedFileName, setJdAttachedFileName] = useState(null);
  const jdFileInputRef = useRef(null);

  // append-only: 버튼형 첨부 핸들러 (resume)
  const handleAttachFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const res = await extractTextFromFile(file, "resume");
    if (res.ok && res.text?.trim() && typeof onExtract === "function") {
      onExtract("resume", res.text, res.meta);
      setAttachedFileName(file.name);
    } else if (!res.ok) {
      setAttachedFileName(null);
    }
    if (e.target) e.target.value = "";
  };

  // append-only: 버튼형 첨부 핸들러 (jd)
  const handleAttachJDFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const res = await extractTextFromFile(file, "jd");
    if (res.ok && res.text?.trim() && typeof onExtract === "function") {
      onExtract("jd", res.text, res.meta);
      setJdAttachedFileName(file.name);
    } else if (!res.ok) {
      setJdAttachedFileName(null);
    }
    if (e.target) e.target.value = "";
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
        <div className="flex flex-col gap-4">
          <JDInput state={state} setState={setState} onDone={handleJDDone} />
          {/* append-only: JD 버튼형 첨부 UI */}
          <div className="flex flex-col gap-2">
            <input
              ref={jdFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleAttachJDFile}
            />
            <button
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => jdFileInputRef.current?.click()}
            >
              {jdAttachedFileName ? "다시 첨부" : "📎 첨부하기"}
            </button>
            {jdAttachedFileName && (
              <span className="text-xs text-slate-500 truncate">{jdAttachedFileName} · 첨부 완료</span>
            )}
          </div>
        </div>
      )}
      {flowStep === FLOW.RESUME           && (
        <div className="flex flex-col gap-4">
          <ResumeInput state={state} setState={setState} onDone={handleResumeDone} />
          {/* append-only: 버튼형 첨부 UI */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleAttachFile}
            />
            <button
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {attachedFileName ? "다시 첨부" : "📎 첨부하기"}
            </button>
            {attachedFileName && (
              <span className="text-xs text-slate-500 truncate">{attachedFileName} · 첨부 완료</span>
            )}
          </div>
        </div>
      )}

      {/* 최종 분석 단계 — CTA 2개로 분기 */}
      {flowStep === FLOW.ANALYZE && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-xl font-semibold text-slate-900">준비 완료</div>
          <p className="text-sm text-slate-500 text-center">
            입력한 정보를 바탕으로 합격 리스크를 분석합니다.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {mode === "deep" && typeof onGoDoc === "function" && (
              <button
                className="rounded-full border border-slate-900 px-8 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                onClick={onGoDoc}
              >
                자가진단하고 더 상세하게 진단
              </button>
            )}
            <button
              className="rounded-full bg-slate-900 px-10 py-3 font-semibold text-white"
              onClick={onAnalyze}
            >
              바로 분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
