import { getSession } from "../auth.js";

const ENGINE_VERSION = "PASSMAP_2026_03_16_input-log-v1";

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __pickText(...values) {
  for (const value of values) {
    const text = __s(value);
    if (text) return text;
  }
  return "";
}

function __jsonObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function __jsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function __numOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

async function __resolveUserId(authSnapshot) {
  const __authUser = __jsonObject(authSnapshot?.user, null);
  if (__authUser?.id) return __s(__authUser.id) || null;
  if (__authUser?.email) return __s(__authUser.email) || null;

  try {
    const session = await getSession();
    const user = __jsonObject(session?.user, null);
    if (user?.id) return __s(user.id) || null;
    if (user?.email) return __s(user.email) || null;
  } catch { }

  return null;
}

function __buildTopRisks(simVM, riskResults) {
  const __simTop3 = __jsonArray(simVM?.top3);
  if (__simTop3.length > 0) {
    return __simTop3.slice(0, 3).map((item) => ({
      id: __s(item?.id || item?.riskId),
      title: __s(item?.title || item?.headline),
      explanationHint: __s(item?.explanationHint),
      relatedAxis: __s(item?.relatedAxis),
      score: __numOrNull(item?.score),
    }));
  }

  return __jsonArray(riskResults).slice(0, 3).map((risk) => ({
    id: __s(risk?.id),
    title: __s(risk?.title),
    summary: __s(risk?.summary || risk?.interviewerView),
    score: __numOrNull(risk?.score),
    priority: __numOrNull(risk?.priority),
  }));
}

function __buildPayload({ state, analysis, source, analysisKey, userId }) {
  const __state = __jsonObject(state);
  const __analysis = __jsonObject(analysis);
  const __reportPack = __jsonObject(__analysis?.reportPack);
  const __simVM = __jsonObject(__reportPack?.simulationViewModel || __analysis?.simulationViewModel, null);
  const __riskResults = __jsonArray(__analysis?.decisionPack?.riskResults);

  const jdText = __pickText(__state?.jd, __state?.jdText, __state?.jobDescription, __state?.jdRaw);
  const resumeText = __pickText(__state?.resume, __state?.resumeText, __state?.resumeRaw, __state?.cvText);
  const companyName = __pickText(__state?.companyTarget, __state?.company, __state?.companyCurrent);
  const targetRole = __pickText(__state?.roleTarget, __state?.targetRole, __state?.role);
  const industry = __pickText(
    __state?.industryTarget,
    __state?.targetIndustry,
    __state?.industry,
    __state?.industryCurrent,
    __state?.currentIndustry
  );
  const stage = __pickText(__state?.stage);
  const candidateType = __pickText(__simVM?.candidateType, __analysis?.candidateType, __analysis?.decisionPack?.passmapType?.id);
  const score = __numOrNull(__simVM?.score ?? __analysis?.score);
  const topRisks = __buildTopRisks(__simVM, __riskResults);

  return {
    input: {
      userId,
      jdText,
      resumeText,
      companyName,
      targetRole,
      industry,
      stage,
      metaJson: {
        source: __pickText(source) || null,
        analysisKey: __pickText(analysisKey) || null,
        companyCurrent: __pickText(__state?.companyCurrent) || null,
        roleCurrent: __pickText(__state?.roleCurrent, __state?.currentRole) || null,
        industryCurrent: __pickText(__state?.industryCurrent, __state?.currentIndustry) || null,
        companySizeCandidate: __pickText(__state?.companySizeCandidate) || null,
        companySizeTarget: __pickText(__state?.companySizeTarget) || null,
        applyDate: __pickText(__state?.applyDate) || null,
        hasPortfolio: !!__pickText(__state?.portfolio),
        jdLength: jdText.length,
        resumeLength: resumeText.length,
      },
    },
    run: {
      userId,
      engineVersion: ENGINE_VERSION,
      status: "success",
      score,
      candidateType: candidateType || null,
      topRisks,
      resultJson: {
        simulationViewModel: __simVM || null,
        riskResults: __riskResults,
      },
    },
  };
}

export async function saveAnalysisRun({ state, analysis, source = "direct", analysisKey = null, authSnapshot = null } = {}) {
  const userId = await __resolveUserId(authSnapshot);
  const payload = __buildPayload({ state, analysis, source, analysisKey, userId });
  const base = __s(import.meta.env.VITE_API_BASE);
  const url = base ? `${base.replace(/\/$/, "")}/api/save-analysis-run` : "/api/save-analysis-run";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.error?.message || data?.error || "save_analysis_run_failed");
  }

  return data;
}
