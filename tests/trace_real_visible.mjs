// Phase 11-8 real visible trace — Node.js simulation of SimulatorLayout variable computation
// Mimics the exact same variable resolution logic as SimulatorLayout.jsx
// Run: node tests/trace_real_visible.mjs
import { analyze } from "../src/lib/analyzer.js";

// ── Same pickText logic as SimulatorLayout ──
function pickText(...values) {
  for (const v of values) {
    const t = String(v || "").trim();
    if (t) return t;
  }
  return "";
}

// ── Mirrors __top3RiskCards build logic in SimulatorLayout (lines 164-269) ──
function buildTop3RiskCards(vm) {
  const vmTop3Cards =
    Array.isArray(vm?.top3) && vm.top3.length ? vm.top3
    : Array.isArray(vm?.risks) && vm.risks.length ? vm.risks.slice(0, 3)
    : [];

  const explainSource = [
    ...(Array.isArray(vm?.explanationPack?.topSignals) ? vm.explanationPack.topSignals : []),
    ...(Array.isArray(vm?.top3) ? vm.top3 : []),
    ...(Array.isArray(vm?.signals) ? vm.signals : []),
  ];
  const explainLookup = explainSource.reduce((acc, item) => {
    const id = String(item?.id || item?.__id || item?.code || "").trim();
    if (id && !acc[id]) acc[id] = item;
    return acc;
  }, {});

  return vmTop3Cards.slice(0, 3).map((risk) => {
    const explain = explainLookup[String(risk?.id || risk?.__id || risk?.code || "").trim()] || {};
    const narrative = (risk?.narrative && typeof risk.narrative === "object") ? risk.narrative
      : (explain?.narrative && typeof explain.narrative === "object" ? explain.narrative : null);

    const interviewerView = pickText(
      risk?.displaySummary, risk?.explanationHint, explain?.explanationHint,
      risk?.jdGapHint, explain?.jdGapHint,
      risk?.actionHint, explain?.actionHint,
      risk?.note, explain?.note,
      risk?.interviewerView, explain?.interviewerView,
      narrative?.interviewerView
    );
    const title = pickText(risk?.displayTitle, risk?.title, explain?.title, risk?.label, explain?.label, risk?.name, explain?.name);

    return {
      __id: pickText(risk?.id, risk?.__id, risk?.code, explain?.id, explain?.__id, explain?.code),
      title,
      interviewerView,
      explanationHint: pickText(risk?.explanationHint, explain?.explanationHint),
      note: pickText(risk?.actionHint, explain?.actionHint, risk?.jdGapHint, explain?.jdGapHint, risk?.note, explain?.note, narrative?.interviewPrepHint, interviewerView),
      userReason: pickText(risk?.displaySummary, risk?.summary, risk?.explanationHint, explain?.explanationHint, risk?.userReason, explain?.userReason, risk?.note, explain?.note, narrative?.userExplanation, interviewerView),
    };
  });
}

// ── Mirrors __displayCareerSummaryText resolution (SimulatorLayout lines 716-769) ──
function resolveCareerDisplay(vm) {
  const careerInterpretation = vm?.careerInterpretation ?? null;
  const currentFlow = (careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object")
    ? careerInterpretation.currentFlow : null;

  const hrTransitionFlowSummary = vm?.explanationMode === "hr_transition_reinforcement"
    ? String(vm?.hrTransitionSummary || "").trim() : "";
  const careerStoryBlock = String(vm?.careerInterpretation?.generator?.blocks?.careerStory || "").trim();
  const flowSummaryText = (
    String(currentFlow?.summary || "").trim() ||
    hrTransitionFlowSummary ||
    careerStoryBlock ||
    String(currentFlow?.bridgeSummary || "").trim() ||
    String(currentFlow?.jdConflictSummary || "").trim() ||
    (Array.isArray(currentFlow?.breakpoints) && currentFlow.breakpoints.length > 0
      ? String(currentFlow.breakpoints[0] || "").trim() : "")
  );

  const reportPack = vm?.reportPack ?? null;
  const reportCareerSection = reportPack?.sections?.careerAccumulation ?? null;
  const careerSurfacePolicy = reportCareerSection?.surfacePolicy ?? null;
  const careerPlacement = reportPack?.presentation?.sectionPlacement?.careerAccumulation ?? null;

  function readSectionSummaryText(section) {
    if (!section) return null;
    if (typeof section.summaryText !== "string") return null;
    const t = section.summaryText.trim();
    return t.length > 0 ? t : null;
  }
  function canUseReportSurface(section, policy, placement, slotKey) {
    if (!section || !policy || !placement) return false;
    if (policy.mode !== "report_first") return false;
    if (!policy.reportSummaryEligible) return false;
    if (placement.visibleNow !== true) return false;
    if (placement.slotKey !== slotKey) return false;
    return readSectionSummaryText(section) !== null;
  }

  const preferredCareerSummaryText = canUseReportSurface(reportCareerSection, careerSurfacePolicy, careerPlacement, "careerSummary")
    ? readSectionSummaryText(reportCareerSection) : null;
  const displayCareerSummaryText = preferredCareerSummaryText ?? flowSummaryText;

  return {
    displayCareerSummaryText,
    preferredCareerSummaryText,
    flowSummaryText,
    currentFlowSummary: String(currentFlow?.summary || "").trim() || null,
    careerStoryBlock: careerStoryBlock || null,
    // gate details
    surfacePolicyMode: careerSurfacePolicy?.mode || null,
    reportSummaryEligible: careerSurfacePolicy?.reportSummaryEligible ?? null,
    visibleNow: careerPlacement?.visibleNow ?? null,
    slotKey: careerPlacement?.slotKey || null,
    reportCareerSummaryText: reportCareerSection?.summaryText || null,
    summarySource: reportCareerSection?.summarySource || null,
    renderMode: reportCareerSection?.renderMode || null,
  };
}

// ── Mirrors __displayRiskSummaryText resolution (SimulatorLayout lines 794-833) ──
function resolveRiskDisplay(vm, top3RiskCards) {
  const reportPack = vm?.reportPack ?? null;
  const reportRiskSection = reportPack?.sections?.riskSummary ?? null;
  const riskSurfacePolicy = reportRiskSection?.surfacePolicy ?? null;
  const riskPlacement = reportPack?.presentation?.sectionPlacement?.riskSummary ?? null;

  function readSectionSummaryText(section) {
    if (!section) return null;
    if (typeof section.summaryText !== "string") return null;
    const t = section.summaryText.trim();
    return t.length > 0 ? t : null;
  }
  function canUseReportSurface(section, policy, placement, slotKey) {
    if (!section || !policy || !placement) return false;
    if (policy.mode !== "report_first") return false;
    if (!policy.reportSummaryEligible) return false;
    if (placement.visibleNow !== true) return false;
    if (placement.slotKey !== slotKey) return false;
    return readSectionSummaryText(section) !== null;
  }

  const preferredRiskSummaryText = canUseReportSurface(reportRiskSection, riskSurfacePolicy, riskPlacement, "riskSummary")
    ? readSectionSummaryText(reportRiskSection) : null;

  const riskTop1Card = top3RiskCards?.[0] || null;
  const riskNarrativeMsg = String(riskTop1Card?.interviewerView || "").trim() || null;
  const riskRawLegacyMsg = String(riskTop1Card?.note || riskTop1Card?.userReason || "").trim() || null;

  // narrativeContextMsg (Phase 11-3)
  const axPackRaw = vm?.candidateAxisPack ?? null;
  const narrativeCtx = axPackRaw?.narrativeContext ?? null;
  let narrativeContextMsg = null;
  if (narrativeCtx) {
    const dist = narrativeCtx.familyDistance ?? "unclear_family";
    const friction = Array.isArray(narrativeCtx.boundaryFrictionSignals) ? narrativeCtx.boundaryFrictionSignals : [];
    const distLabel = {
      same_family: "같은 직무군 내 이동 구조",
      adjacent_family: "인접 직무군 간 전환 구조",
      bridgeable_family: "같은 카테고리 내 기능 전환 구조",
      distant_family: "직무 카테고리 간 이동 구조",
    }[dist] || null;
    const frictionMap = {
      ownership_gap: "ownership 범위 증명", domain_gap: "도메인 연결 근거",
      evidence_thin: "직접 경험 근거", level_gap: "경력 수준 차이 설명",
      function_overlap: "기능 공통점 기반 JD 연결", transferable_execution: "실행 연속성 기반 ownership 연결",
      tool_overlap: "도구 공통점 기반 역할 연결",
    };
    const frictionParts = friction.slice(0, 2).map(f => frictionMap[f]).filter(Boolean);
    if (distLabel || frictionParts.length) {
      const fn = frictionParts.length > 0 ? `${frictionParts.join(", ")} 보강이 핵심 검토 포인트입니다.` : "";
      narrativeContextMsg = [distLabel ? `${distLabel}으로 읽힙니다.` : "", fn].filter(Boolean).join(" ").trim() || null;
    }
  }

  const displayRiskSummaryText = preferredRiskSummaryText || riskNarrativeMsg || riskRawLegacyMsg || narrativeContextMsg || null;

  return {
    displayRiskSummaryText,
    preferredRiskSummaryText,
    riskNarrativeMsg,
    riskRawLegacyMsg,
    narrativeContextMsg,
    reportRiskSummaryText: reportRiskSection?.summaryText || null,
    riskSummaryEligible: riskSurfacePolicy?.reportSummaryEligible ?? null,
    riskSurfacePolicyMode: riskSurfacePolicy?.mode || null,
  };
}

// ── Mirrors __cardExplanationHint composition (SimulatorLayout lines 1976-1980) ──
function resolveRiskCard1Display(top3RiskCards, vm) {
  const rc1 = top3RiskCards?.[0] || null;
  if (!rc1) return { finalDisplayed: "(no card)", winningSource: "none" };

  function firstSentence(s) {
    return String(s || "").trim().split(/(?<=[.!?。])\s+/)[0]?.trim() || "";
  }

  const cardS1 = firstSentence(rc1?.interviewerView || rc1?.narrative?.interviewerView || rc1?.risk?.interviewerView || "");

  // __cardS2Raw: first of per-card evidence, shared evidence
  const rawCard = rc1;
  const rawEv = (rawCard?.evidence && typeof rawCard.evidence === "object") ? rawCard.evidence : {};
  const explainEv = {}; // lookup already applied in buildTop3RiskCards
  const perCardResumeEv = String((Array.isArray(rawEv.resume) ? rawEv.resume[0] : "") || "").trim();
  const perCardJdEv = String((Array.isArray(rawEv.jd) ? rawEv.jd[0] : "") || "").trim();
  const sharedResumeEv = String(vm?.interpretationMaterial?.resumeEvidenceRaw?.[0] || "").trim();
  const sharedJdEv = String(vm?.interpretationMaterial?.jdEvidenceRaw?.[0] || "").trim();
  const cardS2Raw = [perCardResumeEv, perCardJdEv, sharedResumeEv, sharedJdEv].find(s => s && s !== cardS1) || "";
  const cardS2 = firstSentence(cardS2Raw);

  const cardExplanationHint = [cardS1, cardS2].filter(Boolean).join(" ") || String(rc1?.explanationHint || "").trim();

  return {
    finalDisplayed: cardExplanationHint || String(rc1?.title || "").trim() || "(empty)",
    displayVarName: "__cardExplanationHint (idx=0)",
    compositionFormula: "__cardExplanationHint = [__cardS1, __cardS2].filter(Boolean).join(' ') || rc1.explanationHint",
    cardS1,
    cardS2,
    cardExplanationHint,
    winningSource: cardS1 ? "interviewerView first-sentence" : (String(rc1?.explanationHint || "").trim() ? "explanationHint" : "none"),
    rawInterviewerView: String(rc1?.interviewerView || "").trim() || null,
    rawExplanationHint: String(rc1?.explanationHint || "").trim() || null,
    rawNote: String(rc1?.note || "").trim() || null,
    rawTitle: String(rc1?.title || "").trim() || null,
    id: rc1?.__id || null,
  };
}

function buildTrace(label, state) {
  const r = analyze(state, null);
  const vm = r?.reportPack?.simulationViewModel ?? {};

  const top3RiskCards = buildTop3RiskCards(vm);
  const career = resolveCareerDisplay(vm);
  const risk = resolveRiskDisplay(vm, top3RiskCards);
  const riskCard1 = resolveRiskCard1Display(top3RiskCards, vm);

  return {
    _label: label,
    routeInfo: {
      path: "(node simulation — no browser path)",
      isOpenSampleReport: Boolean(vm?.meta?.isOpenSampleReport),
      vmSource: vm?.meta?.source || "(no vm.meta.source)",
      sampleInput: label,
    },
    sampleSource: vm?.meta?.sampleId || "(no sampleId — direct state input)",
    reportIdentity: {
      reportPackVersion: vm?.reportPack?.meta?.version || null,
      sourceMode: vm?.reportPack?.meta?.sourceMode || null,
      hasInterpretationPack: vm?.reportPack?.meta?.hasInterpretationPack ?? null,
      careerSectionStatus: vm?.reportPack?.sections?.careerAccumulation?.status || null,
      careerSummarySource: career.summarySource,
      careerRenderMode: career.renderMode,
    },
    career: {
      finalDisplayed: career.displayCareerSummaryText || "(empty)",
      displayVarName: "__displayCareerSummaryText",
      winningSource: career.preferredCareerSummaryText
        ? "canonical (reportPack.careerAccumulation.summaryText)"
        : (career.flowSummaryText ? "legacy (__flowSummaryText)" : "none"),
      losingCandidates: {
        preferredCareerSummaryText: career.preferredCareerSummaryText || null,
        flowSummaryText: career.flowSummaryText || null,
        currentFlowSummary: career.currentFlowSummary || null,
        careerStoryBlock: career.careerStoryBlock || null,
      },
      rawCandidates: {
        reportCareerSummaryText: career.reportCareerSummaryText || null,
        reportSummaryEligible: career.reportSummaryEligible,
        surfacePolicyMode: career.surfacePolicyMode,
        visibleNow: career.visibleNow,
        slotKey: career.slotKey,
        summarySource: career.summarySource,
        renderMode: career.renderMode,
        canUseReportSurface: career.preferredCareerSummaryText !== null,
      },
    },
    summaryBox: {
      finalDisplayed: risk.displayRiskSummaryText || "(not shown)",
      displayVarName: "__displayRiskSummaryText",
      winningSource: risk.preferredRiskSummaryText
        ? "canonical (reportPack.riskSummary.summaryText)"
        : (risk.riskNarrativeMsg ? "riskNarrativeMsg (top1.interviewerView)"
          : (risk.riskRawLegacyMsg ? "rawLegacyMsg"
            : (risk.narrativeContextMsg ? "narrativeContextMsg (axis)" : "none"))),
      losingCandidates: {
        preferredRiskSummaryText: risk.preferredRiskSummaryText || null,
        riskNarrativeMsg: risk.riskNarrativeMsg || null,
        riskRawLegacyMsg: risk.riskRawLegacyMsg || null,
        narrativeContextMsg: risk.narrativeContextMsg || null,
      },
      rawCandidates: {
        reportRiskSummaryText: risk.reportRiskSummaryText || null,
        reportRiskSummaryEligible: risk.riskSummaryEligible,
        riskSurfacePolicyMode: risk.riskSurfacePolicyMode,
      },
    },
    riskCard1: {
      finalDisplayed: riskCard1.finalDisplayed,
      displayVarName: riskCard1.displayVarName,
      compositionFormula: riskCard1.compositionFormula,
      winningSource: riskCard1.winningSource,
      losingCandidates: {
        rawInterviewerView: riskCard1.rawInterviewerView,
        cardS1: riskCard1.cardS1,
        cardS2: riskCard1.cardS2,
        rawExplanationHint: riskCard1.rawExplanationHint,
        rawNote: riskCard1.rawNote,
      },
      rawCandidates: {
        id: riskCard1.id,
        rawTitle: riskCard1.rawTitle,
      },
    },
  };
}

// SAMPLE_STATE — exact copy from App.jsx (what user sees on 샘플 리포트 보기)
const SAMPLE_STATE = {
  company: "영풍정밀", role: "기획팀 (6년차)", stage: "서류", applyDate: "",
  career: { totalYears: 6, gapMonths: 0, jobChanges: 2, lastTenureMonths: 18 },
  jd:
    "주요업무: 연간 사업계획/예산 수립, KPI 관리, 손익(P/L) 분석, 시장/경쟁사 리서치, 경영진 보고자료 작성\n" +
    "자격요건(필수): 제조업 또는 B2B 산업재 사업기획/전략기획 경력 5년+, Excel 고급(피벗/함수), 데이터 기반 의사결정, 유관부서 협업\n" +
    "우대사항: ERP/원가/공급망(SCM) 이해, 프로젝트 리딩 경험, 영어 커뮤니케이션",
  resume:
    "경력요약: B2B 제조업 유관 부서에서 기획/운영 6년. 연간 KPI 대시보드 운영 및 개선, 신규 프로젝트 기획 지원 경험 보유.\n" +
    "핵심경험: (1) 월간 KPI 리포트 자동화(Excel)로 보고 리드타임 단축. (2) 제품군별 판매 데이터 정리 및 인사이트 공유로 현업 의사결정 지원.\n" +
    "강점: 데이터 정리/분석 기반 커뮤니케이션, 유관부서 협업, 문서화/보고 역량.\n" +
    "보완: P/L 직접 운영 경험은 제한적이며, 제조 원가/SCM 도메인 경험은 일부 학습 수준.",
  portfolio: "성과물: KPI 리포트 템플릿(샘플), 회의록/보고서 목차 예시, 데이터 정리 방식 문서화",
  interviewNotes: "",
  selfCheck: { coreFit: 3, proofStrength: 3, roleClarity: 3, storyConsistency: 3, riskSignals: 3 },
  // defaultState fields (empty)
  roleTarget: "", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "", roleCurrent: "", roleCurrentSub: "",
  roleTargetSub: "", currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
};

const traceSample = buildTrace("SAMPLE_STATE (실제 샘플 리포트 보기 경로)", SAMPLE_STATE);
console.log(JSON.stringify(traceSample, null, 2));
