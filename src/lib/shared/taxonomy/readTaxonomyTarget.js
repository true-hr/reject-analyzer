/**
 * src/lib/shared/taxonomy/readTaxonomyTarget.js
 *
 * Phase 1 — Shared Taxonomy Read Layer
 *
 * 계약:
 * - read-only / no-score wrapper.
 * - 기존 resolver(getJobOntologyItemById, getIndustryRegistryItemById,
 *   resolveIndustryRegistryWithCompoundFallback)를 수정 없이 재사용.
 * - score, risk, riskLevel, gate, band, recommendation, CTA, pass/fail,
 *   suitability, transitionDifficulty 출력 금지.
 * - 기존 resolver export 제거 금지.
 * - 기존 fallback 제거 금지.
 */

import { getJobOntologyItemById } from "../../../data/job/jobOntology.index.js";
import { getIndustryRegistryItemById } from "../../../data/industry/industryRegistry.index.js";
import {
  findJobOntologyByUiSelection,
  resolveIndustryRegistryWithCompoundFallback,
} from "../../../data/job/jobLookup.index.js";

// ─── label fallback 우선순위: displayLabel → label → name → rawLabel → id → "미확인" ───

function safeStr(value) {
  if (typeof value === "string") return value.trim();
  return "";
}

export function resolveDisplayLabel(item, rawLabel, id) {
  return (
    safeStr(item?.displayLabel) ||
    safeStr(item?.label) ||
    safeStr(item?.name) ||
    safeStr(rawLabel) ||
    safeStr(id) ||
    "미확인"
  );
}

// ─── Job Taxonomy Read ────────────────────────────────────────────────────────

/**
 * 단일 job id / ui selection 으로 read-only job taxonomy 정보를 반환한다.
 *
 * @param {object} params
 * @param {string} [params.jobId]           canonical job id (예: "JOB_IT_DATA_DIGITAL_DEVOPS_INFRA")
 * @param {string} [params.rawJobLabel]     UI에서 입력한 raw label (fallback용)
 * @param {object} [params.uiSelection]     { majorCategory, subcategory } 형식의 UI selection
 * @returns {{ id, canonicalId, label, displayLabel, aliases, majorCategory, subcategory, source, confidence, warnings }}
 */
export function readJobTaxonomyTarget({ jobId, rawJobLabel, uiSelection } = {}) {
  const safeJobId = safeStr(jobId);

  let item = safeJobId ? getJobOntologyItemById(safeJobId) : null;
  let source = item ? "id_exact" : "not_found";
  const warnings = [];

  // UI selection fallback (id로 못 찾은 경우)
  if (!item && uiSelection?.majorCategory && uiSelection?.subcategory) {
    item = findJobOntologyByUiSelection({
      majorCategory: uiSelection.majorCategory,
      subcategory: uiSelection.subcategory,
    });
    if (item) source = "ui_selection";
  }

  if (!item && safeJobId) {
    warnings.push(`job id "${safeJobId}" not found in ontology`);
  }
  if (!item && !safeJobId && !uiSelection) {
    warnings.push("no jobId or uiSelection provided");
  }

  return {
    id: safeJobId || item?.id || null,
    canonicalId: item?.id ?? null,
    label: item?.label ?? null,
    displayLabel: resolveDisplayLabel(item, rawJobLabel, safeJobId),
    aliases: Array.isArray(item?.aliases) ? [...item.aliases] : [],
    majorCategory: item?.majorCategory ?? null,
    subcategory: item?.subcategory ?? null,
    source,
    confidence: item ? "found" : "not_found",
    warnings,
  };
}

// ─── Industry Taxonomy Read ───────────────────────────────────────────────────

/**
 * 단일 industry id / sector+subSector 으로 read-only industry taxonomy 정보를 반환한다.
 * compound fallback은 resolveIndustryRegistryWithCompoundFallback을 통해 처리된다.
 *
 * @param {object} params
 * @param {string} [params.industryId]       canonical industry id (예: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS")
 * @param {string} [params.rawIndustryLabel] UI에서 입력한 raw label (fallback용)
 * @param {string} [params.sector]           sector key (예: "IT_SOFTWARE_PLATFORM")
 * @param {string} [params.subSector]        subSector key (예: "B2B_SAAS")
 * @returns {{ id, canonicalId, label, displayLabel, sector, subsector, aliases, source, confidence, warnings }}
 */
export function readIndustryTaxonomyTarget({ industryId, rawIndustryLabel, sector, subSector } = {}) {
  const safeIndustryId = safeStr(industryId);

  let item = null;
  let source = "not_found";
  let compoundDebugInfo = null;
  const warnings = [];

  // id 직접 조회 우선
  if (safeIndustryId) {
    item = getIndustryRegistryItemById(safeIndustryId);
    if (item) source = "id_exact";
  }

  // sector/subSector compound fallback (id 미등록 또는 미제공 시)
  if (!item && (sector || subSector || rawIndustryLabel)) {
    const result = resolveIndustryRegistryWithCompoundFallback({
      sector: sector ?? "",
      subSector: subSector ?? "",
      rawLabel: rawIndustryLabel ?? subSector ?? "",
    });
    item = result.item ?? null;
    source = result.source ?? "not_found";
    compoundDebugInfo = result.debugInfo ?? null;
  }

  if (!item && safeIndustryId) {
    warnings.push(`industry id "${safeIndustryId}" not found in registry`);
  }
  if (compoundDebugInfo?.unresolved) {
    warnings.push(`compound resolver could not resolve "${rawIndustryLabel ?? subSector ?? ""}"`);
  }
  if (!item && !safeIndustryId && !sector && !subSector && !rawIndustryLabel) {
    warnings.push("no industryId, sector, subSector, or rawIndustryLabel provided");
  }

  const confidence = !item
    ? "not_found"
    : source === "id_exact"
      ? "high"
      : source === "compound_high_confidence"
        ? "high"
        : "medium";

  return {
    id: safeIndustryId || item?.id || null,
    canonicalId: item?.id ?? null,
    label: item?.label ?? null,
    displayLabel: resolveDisplayLabel(item, rawIndustryLabel, safeIndustryId),
    sector: item?.sector ?? null,
    subsector: item?.subSector ?? null,
    aliases: Array.isArray(item?.aliases) ? [...item.aliases] : [],
    source,
    confidence,
    warnings,
  };
}

// ─── Combined Read ────────────────────────────────────────────────────────────

/**
 * job + industry taxonomy 정보를 함께 반환하는 combined helper.
 *
 * @param {object} params
 * @param {string} [params.jobId]
 * @param {string} [params.industryId]
 * @param {string} [params.rawJobLabel]
 * @param {string} [params.rawIndustryLabel]
 * @param {object} [params.uiSelection]  { majorCategory, subcategory, sector, subSector }
 * @returns {{ job, industry }}
 */
export function readTaxonomyTarget({
  jobId,
  industryId,
  rawJobLabel,
  rawIndustryLabel,
  uiSelection,
} = {}) {
  return {
    job: readJobTaxonomyTarget({
      jobId,
      rawJobLabel,
      uiSelection,
    }),
    industry: readIndustryTaxonomyTarget({
      industryId,
      rawIndustryLabel,
      sector: uiSelection?.sector,
      subSector: uiSelection?.subSector,
    }),
  };
}
