/**
 * Pure builder: deterministic VM → AI reviewer payload contract.
 * No network calls, no AI calls, no side effects.
 */

const VERSION = "newgrad_report_ai_review_payload_v1";
const MAX_PAYLOAD_TEXT = 120;
const MAX_AXIS_READ_ITEMS = 5;
const MAX_GOAL_ROWS = 6;
const MAX_WHATIF_ITEMS = 3;
const MAX_REPAIR_SIGNALS = 3;
const MAX_LABEL_COUNT = 3;

function toStr(v) {
  if (v == null) return "";
  if (typeof v === "string") return v;
  return String(v);
}

function toArr(v) {
  return Array.isArray(v) ? v : [];
}

function truncateText(value, max = MAX_PAYLOAD_TEXT) {
  const s = toStr(value);
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}

function firstLabels(arr, max = MAX_LABEL_COUNT) {
  return toArr(arr)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return toStr(
          item.label || item.normalizedRoleLabel || item.roleLabel ||
          item.normalizedTypeLabel || item.displayLabel || item.title || ""
        ).trim();
      }
      return "";
    })
    .filter(Boolean)
    .slice(0, max);
}

function extractAxisSummary(axes) {
  const AXIS_KEYS = [
    "jobStructure",
    "industryContext",
    "responsibilityScope",
    "customerType",
    "roleCharacter",
  ];
  const result = {};
  for (const key of AXIS_KEYS) {
    const axis = axes[key];
    if (!axis || typeof axis !== "object") {
      result[key] = { label: "", band: "", displayScore: null };
    } else {
      result[key] = {
        label: toStr(axis.label),
        band: toStr(axis.band),
        displayScore: axis.displayScore != null ? axis.displayScore : null,
      };
    }
  }
  // Axis1-specific guard fields
  result.jobStructure.guard = "major_to_job_only";
  result.jobStructure.allowedInterpretation = "전공과 목표 직무 핵심 과업의 연결만 설명";
  result.industryContext.guard = "industry_understanding";
  result.responsibilityScope.guard = "experience_depth";
  result.customerType.guard = "stakeholder_interaction";
  result.roleCharacter.guard = "self_report_strengths";
  return result;
}

function extractAxisReadSummaryItems(axisReadSummary) {
  const items = toArr(axisReadSummary?.items);
  return items.slice(0, MAX_AXIS_READ_ITEMS).map((item) => ({
    axisKey: toStr(item?.axisKey),
    axisLabel: toStr(item?.axisLabel),
    band: toStr(item?.band),
    summary: truncateText(item?.summary),
  }));
}

function extractGoalComparisonRows(newgradGoalComparisonTable) {
  const rows = toArr(newgradGoalComparisonTable?.rows);
  return rows.slice(0, MAX_GOAL_ROWS).map((row) => ({
    rowKey: toStr(row?.rowKey),
    itemLabel: toStr(row?.itemLabel),
    jobLinkage: truncateText(row?.jobLinkage),
    industryLinkage: truncateText(row?.industryLinkage),
  }));
}

function extractWhatIfItems(whatIfPreparationPack) {
  const previews = toArr(whatIfPreparationPack?.previews);
  return previews.slice(0, MAX_WHATIF_ITEMS).map((item) => ({
    label: truncateText(item?.label, 60),
    subtitle: truncateText(item?.subtitle, 80),
  }));
}

function extractTopRepairSignals(topRepairSignals) {
  return toArr(topRepairSignals).slice(0, MAX_REPAIR_SIGNALS).map((sig) => ({
    axisKey: toStr(sig?.axisKey),
    axisLabel: toStr(sig?.axisLabel),
    band: toStr(sig?.band),
    title: truncateText(sig?.title, 60),
    body: truncateText(sig?.body),
  }));
}

function extractInputSummary(resultVm, sourceInput) {
  const vi = resultVm?.validatedInput || {};
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};

  const major = toStr(vi.major || si.major);

  const projectRoleLabels = firstLabels(
    vi.normalizedProjects || si.projects || [],
    MAX_LABEL_COUNT
  );
  const internshipRoleLabels = firstLabels(
    vi.normalizedInternships || si.internships || [],
    MAX_LABEL_COUNT
  );
  const certificationLabels = firstLabels(
    vi.certifications || si.certifications || [],
    MAX_LABEL_COUNT
  );
  const strengthLabels = firstLabels(
    vi.selfReportProfile?.normalizedStrengthLabels || si.strengths || [],
    MAX_LABEL_COUNT
  );
  const workStyleLabels = firstLabels(
    vi.selfReportProfile?.normalizedWorkStyleLabels || [],
    MAX_LABEL_COUNT
  );

  return {
    major,
    projectRoleLabels,
    internshipRoleLabels,
    certificationLabels,
    strengthLabels,
    workStyleLabels,
  };
}

function extractTarget(resultVm, sourceInput) {
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};
  return {
    jobId: toStr(resultVm?.axisPack?.meta?.targetJobId || si.targetJobId || ""),
    jobLabel: toStr(resultVm?.targetJobDisplayLabel || si.targetJobLabel || ""),
    industryId: toStr(si.targetIndustryId || ""),
    industryLabel: toStr(resultVm?.targetIndustryDisplayLabel || si.targetIndustryLabel || ""),
  };
}

/**
 * Build a minimal, deterministic payload for AI reviewer review.
 * Pure function — no network calls, no side effects.
 *
 * @param {object} resultVm - Output of buildNewgradTransitionLiteResult
 * @param {object} sourceInput - Original validated input (for fallback context)
 * @returns {object} AI review payload
 */
export function buildNewgradReportAiReviewPayload(resultVm, sourceInput = {}) {
  // ── skip conditions ──────────────────────────────────────────────────────────
  if (!resultVm || typeof resultVm !== "object") {
    return { version: VERSION, status: "skipped", skipReason: "missing_result_vm" };
  }
  if (!resultVm.axisPack?.axes) {
    return { version: VERSION, status: "skipped", skipReason: "missing_axes" };
  }
  const si = sourceInput && typeof sourceInput === "object" ? sourceInput : {};
  const hasJob = Boolean(resultVm.targetJobDisplayLabel || si.targetJobId || si.targetJobLabel);
  const hasIndustry = Boolean(resultVm.targetIndustryDisplayLabel || si.targetIndustryId || si.targetIndustryLabel);
  if (!hasJob && !hasIndustry) {
    return { version: VERSION, status: "skipped", skipReason: "missing_target_context" };
  }

  // ── build payload ────────────────────────────────────────────────────────────
  const target = extractTarget(resultVm, si);
  const inputSummary = extractInputSummary(resultVm, si);
  const axisSummary = extractAxisSummary(resultVm.axisPack.axes);

  const axisReadSummaryItems = extractAxisReadSummaryItems(resultVm.axisReadSummary);
  const goalComparisonRows = extractGoalComparisonRows(resultVm.newgradGoalComparisonTable);
  const whatIfPreparationItems = extractWhatIfItems(resultVm.whatIfPreparationPack);
  const topRepairSignals = extractTopRepairSignals(resultVm.topRepairSignals);

  return {
    version: VERSION,
    status: "ready",
    skipReason: "",
    target,
    inputSummary,
    axisSummary,
    currentDraft: {
      axisReadSummaryItems,
      goalComparisonRows,
      whatIfPreparationItems,
      topRepairSignals,
    },
    guardContext: {
      noScoreChange: true,
      noBandChange: true,
      noExperienceGeneration: true,
      noAdmissionConclusion: true,
      axis1MajorToJobOnly: true,
    },
  };
}
