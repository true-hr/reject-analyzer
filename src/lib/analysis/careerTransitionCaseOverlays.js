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
