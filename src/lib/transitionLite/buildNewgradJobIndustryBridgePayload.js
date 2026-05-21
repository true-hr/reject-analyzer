/**
 * Pure builder: deterministic VM to AI job-industry bridge payload contract.
 * No network calls, no AI calls, no side effects.
 */

import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import { getIndustryArchetype } from "../../data/transitionLite/industryArchetypeRegistry.js";
import { getNewgradAxis2JobIndustrySpecialization } from "../../data/transitionLite/newgradAxis2JobIndustrySpecializationRegistry.js";
import { classifyNewgradJobIndustryIntersection } from "./classifyNewgradJobIndustryIntersection.js";

const VERSION = "newgrad_job_industry_bridge_payload_v1";
const MAX_TEXT = 160;
const MAX_LABEL_COUNT = 3;
const MAX_ROW_COUNT = 3;
const MAX_GAP_COUNT = 3;
const MAX_SIGNAL_COUNT = 5;

// Maps ontology taxonomy keys to AI analysis role lens keys.
// These are distinct namespaces: taxonomy keys reflect ontology classification,
// role lens keys identify which AI analysis template to apply.
// A single taxonomy group (e.g. IT_PLANNING) can span multiple job families;
// the lens key names the dominant analytical frame for that group.
const _TAXONOMY_TO_ROLE_LENS_MAP = Object.freeze({
  IT_PLANNING: "SERVICE_PLANNING",     // IT기획 group → 서비스기획 UX/flow/info-design lens
  PRODUCT_MANAGEMENT: "PRODUCT_MANAGEMENT",
  DATA_ANALYSIS: "DATA_ANALYSIS",
  CONTENT_MARKETING: "CONTENT_MARKETING",
});

const _JOB_ROLE_LENS = Object.freeze({
  SERVICE_PLANNING: Object.freeze({
    roleFocusAreas: [
      "사용자 흐름 설계",
      "정보 구조화",
      "요구사항 정의",
      "전환/이탈 지점 분석",
      "정책·제약을 UX로 풀어내는 능력",
      "고객 반응을 서비스 개선 가설로 전환",
    ],
    roleEvidenceExpectations: [
      "사용자 행동 데이터를 흐름·이탈·전환 기준으로 분석한 경험",
      "화면·기능 기획 또는 요구사항 정의서 작성 경험",
      "산업별 정책·제약 조건을 UX 설계에 반영한 경험",
    ],
    roleTranslationRule:
      "산업 archetype 기준이 특정 운영 영역(예: 여신·리스크, 생산 공정, 유통 운영)에 집중되어 있더라도, 서비스기획 직무의 보완포인트는 해당 산업 서비스의 화면·흐름·정보 구조를 설계한 경험 기준으로 작성한다. 예) 금융 archetype의 신용도·금리·연체 기준 → 금융 서비스 화면에서 사용자가 상품 조건과 위험을 오해 없이 이해하고 안전하게 행동하도록 돕는 정보 구조·리스크 고지·신뢰 형성 기준으로 변환한다.",
  }),
  PRODUCT_MANAGEMENT: Object.freeze({
    roleFocusAreas: [
      "제품 전략 및 로드맵 기획",
      "사용자 요구사항 정의",
      "지표 설계 및 성과 검증",
      "이해관계자 요구 조율",
    ],
    roleEvidenceExpectations: [
      "제품 기능 기획 및 우선순위 결정 경험",
      "사용자 인터뷰 또는 데이터 기반 가설 수립 경험",
      "출시 또는 기능 개선 사이클 참여 경험",
    ],
    roleTranslationRule:
      "산업 archetype 기준이 산업별 운영 지식에 집중되어 있더라도, 제품기획/PM 직무의 보완포인트는 사용자 문제를 정의하고 제품으로 해결하는 역할 기준으로 작성한다.",
  }),
  DATA_ANALYSIS: Object.freeze({
    roleFocusAreas: [
      "데이터 기반 가설 수립",
      "지표 정의 및 측정",
      "분석 결과의 의사결정 연결",
      "산업별 핵심 데이터 구조 이해",
    ],
    roleEvidenceExpectations: [
      "SQL·통계·시각화 도구를 활용한 분석 경험",
      "가설 → 검증 → 인사이트 도출 사이클 경험",
      "분석 결과를 팀·조직 의사결정에 연결한 경험",
    ],
    roleTranslationRule:
      "산업 archetype 기준이 산업별 운영 지식에 집중되어 있더라도, 데이터분석 직무의 보완포인트는 데이터를 통해 산업 내 패턴·이상·기회를 발견하는 역할 기준으로 작성한다.",
  }),
  CONTENT_MARKETING: Object.freeze({
    roleFocusAreas: [
      "타겟 독자 설정 및 콘텐츠 기획",
      "콘텐츠 성과 측정 및 개선",
      "채널별 콘텐츠 전략 최적화",
      "산업별 신뢰·정보 기준 반영",
    ],
    roleEvidenceExpectations: [
      "콘텐츠 기획 및 제작 경험",
      "성과 지표(조회·전환·이탈) 기반 개선 경험",
      "산업별 규제·신뢰 기준에 맞는 콘텐츠 설계 경험",
    ],
    roleTranslationRule:
      "산업 archetype 기준이 산업별 운영 지식에 집중되어 있더라도, 콘텐츠마케팅 직무의 보완포인트는 해당 산업 고객이 정보를 신뢰하고 행동을 결정하는 과정에서 콘텐츠의 역할 기준으로 작성한다.",
  }),
});

function resolveRoleLensKey(target) {
  const candidates = [
    String(target?.jobSubVertical || "").trim().toUpperCase(),
    String(target?.jobCategoryKey || "").trim().toUpperCase(),
  ].filter(Boolean);
  for (const candidate of candidates) {
    const lensKey = _TAXONOMY_TO_ROLE_LENS_MAP[candidate];
    if (lensKey && _JOB_ROLE_LENS[lensKey]) return lensKey;
  }
  return null;
}

function buildTargetRoleLens(target) {
  const roleLensKey = resolveRoleLensKey(target);
  const lens = roleLensKey ? _JOB_ROLE_LENS[roleLensKey] : null;
  if (!lens) return null;
  return {
    sourceJobKey: String(target?.jobSubVertical || target?.jobCategoryKey || "").trim().toUpperCase(),
    roleLensKey,
    targetJobLabel: toStr(target?.jobLabel),
    roleFocusAreas: lens.roleFocusAreas,
    roleEvidenceExpectations: lens.roleEvidenceExpectations,
    roleTranslationRule: lens.roleTranslationRule,
    rewriteEnforcement: {
      mustApplyRoleLens: true,
      rawIndustryCopyPolicy: "forbidden_as_core_evidence",
      missingEvidenceLabelMustReflect: ["roleFocusAreas", "roleEvidenceExpectations"],
    },
  };
}

function toStr(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

function toArr(value) {
  return Array.isArray(value) ? value : [];
}

function truncateText(value, max = MAX_TEXT) {
  const s = toStr(value);
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "...";
}

function firstLabels(value, max = MAX_LABEL_COUNT) {
  return toArr(value)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      return toStr(
        item.label ||
          item.normalizedRoleLabel ||
          item.roleLabel ||
          item.normalizedTypeLabel ||
          item.displayLabel ||
          item.title ||
          item.name ||
          ""
      );
    })
    .filter(Boolean)
    .slice(0, max);
}

function extractInputSummary(resultVm, sourceInput) {
  const vi = resultVm?.validatedInput || {};
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};
  const profile = vi.selfReportProfile || {};

  return {
    major: toStr(vi.major || si.major),
    projectRoleLabels: firstLabels(vi.normalizedProjects || si.projects),
    internshipRoleLabels: firstLabels(vi.normalizedInternships || si.internships),
    certificationLabels: firstLabels(vi.certifications || si.certifications),
    strengthLabels: firstLabels(profile.normalizedStrengthLabels || si.strengths),
    workStyleLabels: firstLabels(profile.normalizedWorkStyleLabels || si.workStyleLabels),
  };
}

function resolveTarget(resultVm, sourceInput) {
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};
  const jobId = toStr(resultVm?.axisPack?.meta?.targetJobId || si.targetJobId);
  const jobLabel = toStr(resultVm?.targetJobDisplayLabel || si.targetJobLabel);
  const industryId = toStr(si.targetIndustryId);
  const industryLabel = toStr(resultVm?.targetIndustryDisplayLabel || si.targetIndustryLabel);

  let jobCategoryKey = "";
  let jobSubVertical = "";
  if (jobId) {
    const jobItem = getJobOntologyItemById(jobId);
    jobCategoryKey = toStr(jobItem?.majorCategory || jobItem?.categoryKey || jobItem?.majorKey);
    jobSubVertical = toStr(jobItem?.subVertical || jobItem?.subcategory);
  }

  let industryArchetypeKey = "";
  if (industryLabel) {
    const archetype = getIndustryArchetype(industryLabel);
    industryArchetypeKey = toStr(archetype?.id);
  }

  return {
    jobId,
    jobLabel,
    jobCategoryKey,
    jobSubVertical,
    industryId,
    industryLabel,
    industryArchetypeKey,
  };
}

const _ROW_REWRITE_GUIDANCE = Object.freeze({
  major_cert_industry_relevance: Object.freeze({
    rawIndustryCopyPolicy: "forbidden",
    rewritePriority: "targetRoleLens",
    instruction: "limitText와 missingEvidenceLabels는 산업 공통 참고자료다. targetRoleLens 기준으로 재작성하라.",
    rowRole: "전공·자격·배경 지식이 목표 산업×직무에서 어떻게 읽히는지만 다룬다. 직무 수행 경험 부족은 언급하지 않는다.",
    forbiddenPatterns: ["서비스기획 경험", "데이터분석 경험", "고객 요구 분석 경험", "프로젝트 관리 경험", "직무 관련 경험"],
    guidance: "전공·교육·자격이 목표 산업의 핵심 개념(예: 커머스→고객·시장·상품 구조, 금융→금융상품 이해·정보 비대칭·소비자보호, 제조→공정·품질·생산성 지표)을 이해하는 배경이 되는지 쓴다.",
  }),
  context_industry_grounding: Object.freeze({
    rawIndustryCopyPolicy: "forbidden",
    rewritePriority: "targetRoleLens",
    instruction: "limitText와 missingEvidenceLabels는 산업 공통 참고자료다. targetRoleLens 기준으로 재작성하라.",
    rowRole: "실제 업무환경·산업 내 서비스 흐름·분석 대상·사용자 행동 맥락을 다룬다. 서비스기획이면 화면·흐름·정보 구조·전환/이탈·신청/동의/상담/구매 여정을 다룬다. 데이터분석이면 실제 데이터 대상·지표·분석-의사결정 연결을 다룬다.",
    forbiddenPatterns: [],
    guidance: "인턴·프로젝트 경험이 산업의 실제 업무 맥락(커머스→상품 탐색·구매 전환·고객 행동 흐름, 금융→상품 비교·신청·동의·리스크 고지, 제조→공정 데이터·불량률·수율·생산성 지표)과 어떻게 연결되는지 쓴다.",
  }),
  industry_exposure_repeatability: Object.freeze({
    rawIndustryCopyPolicy: "forbidden",
    rewritePriority: "targetRoleLens",
    instruction: "limitText와 missingEvidenceLabels는 산업 공통 참고자료다. targetRoleLens 기준으로 재작성하라.",
    rowRole: "산업 관련 경험이 한 번의 활동인지, 여러 접점으로 반복·지속됐는지를 다룬다. 반드시 반복성·지속성·여러 접점·누적 관찰 중 하나를 포함한다.",
    forbiddenPatterns: [],
    guidance: "경험의 반복성·누적성에 집중한다. 커머스→여러 캠페인/고객 반응을 반복 관찰하며 구매 여정 개선으로 연결, 금융→금융 정보/조건/위험 설명을 여러 접점에서 반복적으로 다룸, 제조→지표를 한 번 정리한 것이 아니라 반복 추적·개선 사이클로 다룸.",
  }),
});

function _buildRowRewriteGuidance(rowKey) {
  return _ROW_REWRITE_GUIDANCE[rowKey] || Object.freeze({
    rawIndustryCopyPolicy: "forbidden",
    rewritePriority: "targetRoleLens",
    instruction: "limitText와 missingEvidenceLabels는 산업 공통 참고자료다. targetRoleLens 기준으로 재작성하라.",
    rowRole: "",
    forbiddenPatterns: [],
    guidance: "",
  });
}

function extractIndustryContextAxis(axis) {
  if (!axis || typeof axis !== "object") return null;
  const rows = toArr(axis.comparisonBlock?.rows)
    .slice(0, MAX_ROW_COUNT)
    .map((row) => ({
      rowKey: toStr(row?.rowKey),
      label: toStr(row?.label || row?.itemLabel),
      itemLabel: toStr(row?.itemLabel || row?.label),
      verdictText: truncateText(row?.verdictText),
      evidenceText: truncateText(row?.evidenceText),
      limitText: truncateText(row?.limitText),
      actionHint: truncateText(row?.actionHint, 100),
      confidence: row?.confidence ?? null,
      currentValue: truncateText(row?.currentValue, 80),
      positiveEvidenceLabels: toArr(row?.positiveEvidenceLabels).slice(0, 2).map((v) => truncateText(v, 100)),
      missingEvidenceLabels: toArr(row?.missingEvidenceLabels).slice(0, 2).map((v) => truncateText(v, 100)),
      rowRewriteGuidance: _buildRowRewriteGuidance(toStr(row?.rowKey)),
    }));

  return {
    axisKey: "industryContext",
    axisLabel: toStr(axis.label),
    band: toStr(axis.band),
    displayScore: axis.displayScore ?? null,
    currentRows: rows,
  };
}

function extractResponsibilityScopeAxis(axis, resultVm) {
  if (!axis || typeof axis !== "object") return null;
  const explanation = axis.explanation || {};
  const topRepairSignal = toArr(resultVm?.topRepairSignals).find(
    (signal) => signal?.axisKey === "responsibilityScope"
  );

  return {
    axisKey: "responsibilityScope",
    axisLabel: toStr(axis.label),
    band: toStr(axis.band),
    displayScore: axis.displayScore ?? null,
    currentSummary: truncateText(explanation.summary || explanation.body),
    whyThisAxisMatters: truncateText(explanation.whyThisAxisMatters || explanation.lead),
    gaps: toArr(explanation.gaps).slice(0, MAX_GAP_COUNT).map((gap) => truncateText(gap)),
    topRepairSignal: topRepairSignal
      ? {
          axisKey: toStr(topRepairSignal.axisKey),
          axisLabel: toStr(topRepairSignal.axisLabel),
          band: toStr(topRepairSignal.band),
          title: truncateText(topRepairSignal.title, 80),
          body: truncateText(topRepairSignal.body),
        }
      : null,
  };
}

function extractWeakOrMissingSignals(axisTargets) {
  const rowSignals = toArr(axisTargets?.industryContext?.currentRows)
    .flatMap((row) => [row.limitText, row.evidenceText])
    .map((text) => truncateText(text, 100))
    .filter(Boolean);
  const gapSignals = toArr(axisTargets?.responsibilityScope?.gaps)
    .map((text) => truncateText(text, 100))
    .filter(Boolean);
  return [...new Set([...rowSignals, ...gapSignals])].slice(0, MAX_SIGNAL_COUNT);
}

function buildDeterministicBridge(target, axisTargets) {
  let existingSpecializationFound = false;
  let specializationSource = "";

  if (target.industryArchetypeKey && target.jobSubVertical) {
    const spec = getNewgradAxis2JobIndustrySpecialization(
      target.industryArchetypeKey,
      target.jobSubVertical
    );
    existingSpecializationFound = Boolean(spec);
    specializationSource = existingSpecializationFound ? "axis2_job_industry_specialization" : "";
  }

  const intersectionProfile = classifyNewgradJobIndustryIntersection({
    archetypeId: target.industryArchetypeKey,
    targetJobSubVertical: target.jobSubVertical,
    specializationFound: existingSpecializationFound,
  });

  return {
    existingSpecializationFound,
    specializationSource,
    intersectionLevel: intersectionProfile.level,
    intersectionReasonCode: intersectionProfile.reasonCode,
    intersectionConfidence: intersectionProfile.confidence,
    isNaturalFit: intersectionProfile.isNaturalFit,
    shouldUseNeutralFallback: intersectionProfile.shouldUseNeutralFallback,
    shouldShowAiBridgeResult: intersectionProfile.shouldShowAiBridgeResult,
    shouldRequestAiBridge: intersectionProfile.shouldRequestAiBridge,
    roleInIndustry: "",
    industryVariablesForJob: [],
    importantEvidenceTypes: [],
    weakOrMissingSignals: extractWeakOrMissingSignals(axisTargets),
    goodNextExperiences: [],
  };
}

export function buildNewgradJobIndustryBridgePayload(resultVm, sourceInput = {}) {
  if (!resultVm || typeof resultVm !== "object") {
    return { version: VERSION, status: "skipped", skipReason: "missing_result_vm" };
  }

  const axes = resultVm?.axisPack?.axes;
  if (!axes || typeof axes !== "object") {
    return { version: VERSION, status: "skipped", skipReason: "missing_axes" };
  }

  const target = resolveTarget(resultVm, sourceInput);
  if (!(target.jobId || target.jobLabel) || !(target.industryId || target.industryLabel)) {
    return { version: VERSION, status: "skipped", skipReason: "missing_target_context" };
  }

  const industryContext = extractIndustryContextAxis(axes.industryContext);
  if (!industryContext) {
    return { version: VERSION, status: "skipped", skipReason: "missing_industry_context_axis" };
  }

  const axisTargets = {
    industryContext,
    responsibilityScope: extractResponsibilityScopeAxis(axes.responsibilityScope, resultVm),
  };

  const deterministicBridge = buildDeterministicBridge(target, axisTargets);

  if (deterministicBridge.shouldRequestAiBridge === false) {
    return {
      version: VERSION,
      status: "skipped",
      skipReason: "intersection_no_bridge_required",
      target,
      deterministicBridge,
    };
  }

  return {
    version: VERSION,
    status: "ready",
    skipReason: "",
    target,
    inputSummary: extractInputSummary(resultVm, sourceInput),
    axisTargets,
    deterministicBridge,
    targetRoleLens: buildTargetRoleLens(target),
    guardContext: {
      noScoreChange: true,
      noBandChange: true,
      noExperienceGeneration: true,
      noAdmissionConclusion: true,
      axis1MajorToJobOnly: true,
      noUiAutoApply: true,
    },
  };
}
