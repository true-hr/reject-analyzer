// 서류탈락 원인 분석의 단계별 진행 상태를 analysis 객체로부터 derive 한다.
// App.jsx 의 setAnalysis 체인을 손대지 않고도 UI 에서 단계 진행을 보여줄 수 있도록
// 순수 derive 함수로 분리했다.

export const REJECTION_ANALYSIS_STEPS = Object.freeze([
  { key: "base", label: "기본 분석", description: "JD와 이력서를 대조해 필수요건과 핵심 리스크를 확인합니다." },
  { key: "career", label: "경력 해석", description: "이력서의 경력·성과·기간 정보를 구조화합니다." },
  { key: "rolefit", label: "직무 연결", description: "경력과 목표 직무의 연결 정도를 확인합니다." },
  { key: "ai", label: "AI 심화 해석", description: "채용담당자 관점에서 보완 방향을 정리합니다." },
]);

function hasMeaningfulCompositeRisk(pa) {
  if (!pa || typeof pa !== "object") return false;
  const composite = pa.compositeRisk;
  if (!composite || typeof composite !== "object") return false;
  if (composite.summary && typeof composite.summary === "object") return true;
  if (Array.isArray(composite.topRisks) && composite.topRisks.length > 0) return true;
  return false;
}

function hasMeaningfulCareer(pa) {
  if (!pa || typeof pa !== "object") return false;
  const career = pa.resumeCareerInterpretation;
  return Boolean(career && typeof career === "object");
}

function hasMeaningfulRoleFit(pa) {
  if (!pa || typeof pa !== "object") return false;
  const rolefit = pa.roleFitCareerMatch;
  return Boolean(rolefit && typeof rolefit === "object");
}

export function deriveRejectionAnalysisProgress(analysis) {
  const pa = analysis && typeof analysis === "object" ? analysis.preciseAnalysis : null;

  const baseDone = hasMeaningfulCompositeRisk(pa);
  const careerDone = hasMeaningfulCareer(pa);
  const rolefitDone = hasMeaningfulRoleFit(pa);

  const aiMeta = pa && pa.aiMeta ? pa.aiMeta : null;
  const aiDeep = pa && pa.aiDeepAnalysis ? pa.aiDeepAnalysis : null;
  const aiNotStarted = aiMeta == null;
  const aiPending = aiMeta != null && aiMeta.ok === undefined;
  const aiSuccess = aiMeta != null && aiMeta.ok === true && Boolean(aiDeep);
  const aiFailed = aiMeta != null && (aiMeta.ok === false || (aiMeta.ok === true && !aiDeep));

  const completedStepKeys = [];
  if (baseDone) completedStepKeys.push("base");
  if (careerDone) completedStepKeys.push("career");
  if (rolefitDone) completedStepKeys.push("rolefit");
  if (aiSuccess) completedStepKeys.push("ai");

  let failedStepKey = null;
  if (aiFailed) failedStepKey = "ai";

  let activeStepKey = null;
  if (failedStepKey) {
    activeStepKey = null;
  } else if (!baseDone) {
    activeStepKey = "base";
  } else if (!careerDone) {
    activeStepKey = "career";
  } else if (!rolefitDone) {
    activeStepKey = "rolefit";
  } else if (aiPending || aiNotStarted) {
    activeStepKey = "ai";
  } else {
    activeStepKey = null;
  }

  const allDone = completedStepKeys.length === REJECTION_ANALYSIS_STEPS.length;
  const status = failedStepKey
    ? "error"
    : allDone
      ? "done"
      : activeStepKey
        ? "in_progress"
        : "idle";

  return {
    steps: REJECTION_ANALYSIS_STEPS,
    completedStepKeys,
    activeStepKey,
    failedStepKey,
    aiPending,
    aiFailed,
    aiSuccess,
    aiNotStarted,
    status,
  };
}
