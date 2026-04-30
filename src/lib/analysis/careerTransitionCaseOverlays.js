// src/lib/analysis/careerTransitionCaseOverlays.js
// Career mode transition case overlay registry.
//
// Injects source-job-specific explanation slots (lead, scoreReason, liftOrLimit, criteria)
// into axisPack.axes.{key}.explanation without modifying scores, bands, or structural signals.
//
// Trigger: currentJobId + targetJobId direct matching (not classifyTransition).
// Mode: career mode only (buildTransitionLiteResult.js — requires currentJobId).
//
// Pattern contract:
//   - appliesTo({ currentJobId, targetJobId }) → boolean
//   - overlays: { [axisKey]: { lead?, scoreReason?, liftOrLimit?, criteria? } }

// ─── Source / Target Job Sets ────────────────────────────────────────────────

const CUSTOMER_SUPPORT_JOB_IDS = new Set([
  "JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS",
]);

const SERVICE_PLANNING_JOB_IDS = new Set([
  "JOB_BUSINESS_SERVICE_PLANNING",
]);

const FINANCE_ACCOUNTING_JOB_IDS = new Set([
  "JOB_FINANCE_ACCOUNTING_ACCOUNTING",
  "JOB_FINANCE_ACCOUNTING_FP_AND_A",
]);

const DATA_ANALYSIS_JOB_IDS = new Set([
  "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
]);

const PERFORMANCE_MARKETING_JOB_IDS = new Set([
  "JOB_MARKETING_PERFORMANCE_MARKETING",
]);

// ─── Profile Registry ────────────────────────────────────────────────────────

const CAREER_TRANSITION_PROFILES = {
  CUSTOMER_SUPPORT_TO_SERVICE_PLANNING: {
    id: "CUSTOMER_SUPPORT_TO_SERVICE_PLANNING",
    appliesTo({ currentJobId, targetJobId }) {
      return (
        CUSTOMER_SUPPORT_JOB_IDS.has(currentJobId) &&
        SERVICE_PLANNING_JOB_IDS.has(targetJobId)
      );
    },
    overlays: {
      jobStructure: {
        lead: "고객 응대 경험은 서비스기획과 연결될 수 있습니다. 고객 불편과 반복 문의를 직접 봤다는 점은 문제를 발견하는 감각의 근거가 됩니다.",
        scoreReason: "다만 서비스기획에서는 고객 문제를 단순히 이해하는 것을 넘어, 요구사항·개선안·화면 흐름처럼 제품으로 바꾸는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 VOC 분석표, 개선안, 기능정의서, 화면흐름도, 우선순위 판단 근거입니다.",
      },
      responsibilityScope: {
        lead: "CS 경험을 기획 직무 근거로 살리려면, 응대 경험을 VOC 분석이나 개선안으로 정리한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 반복 문의 3~5개를 묶어 문제 원인, 개선 아이디어, 기능 우선순위, 간단한 화면 흐름으로 정리한 산출물 1개를 만드는 것입니다.",
      },
    },
  },

  PERFORMANCE_MARKETING_TO_SERVICE_PLANNING: {
    id: "PERFORMANCE_MARKETING_TO_SERVICE_PLANNING",
    appliesTo({ currentJobId, targetJobId }) {
      return (
        PERFORMANCE_MARKETING_JOB_IDS.has(currentJobId) &&
        SERVICE_PLANNING_JOB_IDS.has(targetJobId)
      );
    },
    overlays: {
      jobStructure: {
        lead: "마케팅 경험은 서비스기획과 바로 같은 일은 아니지만, 고객 행동 데이터와 전환 흐름을 해석했다는 점에서 문제 발견과 개선 가설 수립으로 연결될 수 있습니다.",
        scoreReason: "다만 서비스기획에서는 캠페인 성과를 보는 것을 넘어, 그 인사이트를 제품 요구사항·기능 우선순위·화면 흐름으로 바꾸는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 퍼널 분석, 전환율 변화, A/B 테스트 결과, 고객 세그먼트 분석, 기능 개선안, PRD 또는 화면 흐름 산출물입니다.",
      },
      responsibilityScope: {
        lead: "마케팅 경험을 기획 직무 근거로 살리려면, 성과 지표를 제품 개선 가설이나 기능 제안으로 전환한 흔적이 필요합니다.",
        liftOrLimit: "다음 보완은 캠페인 성과 1개를 골라 문제 지표, 사용자 행동 해석, 기능 개선 아이디어, 우선순위 판단 근거까지 정리한 산출물을 만드는 것입니다.",
      },
    },
  },

  FINANCE_ACCOUNTING_TO_DATA_ANALYSIS: {
    id: "FINANCE_ACCOUNTING_TO_DATA_ANALYSIS",
    appliesTo({ currentJobId, targetJobId }) {
      return (
        FINANCE_ACCOUNTING_JOB_IDS.has(currentJobId) &&
        DATA_ANALYSIS_JOB_IDS.has(targetJobId)
      );
    },
    overlays: {
      jobStructure: {
        lead: "회계·재무 경험은 데이터분석과 바로 같은 일은 아니지만, 숫자와 지표를 해석해 의사결정 자료로 정리했다는 점에서 연결될 수 있습니다.",
        scoreReason: "다만 데이터분석 직무에서는 숫자를 읽는 감각을 넘어, 데이터를 직접 추출·가공하고 분석 결과를 재현 가능한 형태로 남기는 과정이 중요합니다.",
        criteria: "확인 가능한 근거는 SQL 쿼리, Python 분석, 재무 데이터 대시보드, 분석 리포트, 반복 보고 자동화 산출물입니다.",
      },
      industryContext: {
        lead: "금융·재무 데이터를 다뤄본 경험은 데이터의 정확성, 기준값, 지표 해석을 이해하는 데 도움이 됩니다.",
        liftOrLimit: "다음 보완은 재무 지표 하나를 정해 원천 데이터 정리, 계산 기준, 해석 결과, 시각화 화면까지 연결한 작은 분석 산출물을 만드는 것입니다.",
      },
    },
  },
};

// ─── Exports ────────────────────────────────────────────────────────────────

export const CAREER_TRANSITION_PROFILE_IDS = Object.keys(CAREER_TRANSITION_PROFILES);

// ─── Helpers ────────────────────────────────────────────────────────────────

function mergeExplanationOverlay(existing, overlay) {
  if (!overlay || typeof overlay !== "object") return existing;
  if (!existing || typeof existing !== "object") return existing;
  const merged = { ...existing };
  for (const slot of ["lead", "scoreReason", "liftOrLimit", "criteria"]) {
    if (typeof overlay[slot] === "string" && overlay[slot].trim()) {
      merged[slot] = overlay[slot].trim();
    }
  }
  return merged;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function buildCareerTransitionCaseOverlays(axisPack, input) {
  if (!axisPack || !axisPack.axes) return { axisPack, firedProfileIds: [] };
  const { currentJobId, targetJobId } = input ?? {};
  if (!currentJobId || !targetJobId) return { axisPack, firedProfileIds: [] };

  const firedProfileIds = [];
  const axes = { ...axisPack.axes };

  for (const profile of Object.values(CAREER_TRANSITION_PROFILES)) {
    if (!profile.appliesTo({ currentJobId, targetJobId })) continue;
    firedProfileIds.push(profile.id);
    for (const [axisKey, slotOverlay] of Object.entries(profile.overlays)) {
      if (!axes[axisKey]) continue;
      axes[axisKey] = {
        ...axes[axisKey],
        explanation: mergeExplanationOverlay(axes[axisKey].explanation ?? {}, slotOverlay),
      };
    }
  }

  return {
    axisPack: { ...axisPack, axes },
    firedProfileIds,
  };
}
