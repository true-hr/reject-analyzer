/**
 * src/lib/shared/taxonomy/buildTaxonomyContextPack.js
 *
 * Phase 3A — Shared Read-Only Taxonomy Context Pack
 *
 * 계약:
 * - read-only / no-score wrapper.
 * - buildJobContext / buildIndustryContext를 제거하지 않음.
 * - 기존 adapter를 대체하지 않고, pack builder로만 추가.
 * - score, risk, riskLevel, gate, band, recommendation, CTA, pass/fail,
 *   suitability, transitionDifficulty, rejectionReason 출력 금지.
 */

import { buildJobContext } from "../../adapters/buildJobContext.js";
import { buildIndustryContext } from "../../adapters/buildIndustryContext.js";

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toStr(value) {
  return value && typeof value === "string" ? value.trim() : null;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function deriveRoleSummary(jobCtx) {
  const families = toArr(jobCtx?.families);
  const primaryFamily = families.length > 0 && families[0] && typeof families[0] === "object"
    ? families[0]
    : null;
  return toStr(primaryFamily?.summaryTemplate) ?? null;
}

function deriveValueChain(industryItem) {
  return toArr(industryItem?.valueChainPosition);
}

// ─── buildTaxonomyContextPack ─────────────────────────────────────────────────

/**
 * 직무/산업 분류 설명 보조용 read-only context pack.
 *
 * 입력:
 * @param {object}  params
 * @param {object}  [params.jobItem]           raw job ontology item (buildJobContext 동일 입력)
 * @param {object}  [params.industryItem]      raw industry registry item (buildIndustryContext 동일 입력)
 * @param {string}  [params.rawJobLabel]       optional raw job label (fallback)
 * @param {string}  [params.rawIndustryLabel]  optional raw industry label (fallback)
 * @param {string}  [params.source]            optional source metadata string
 *
 * 출력: { jobContext, industryContext, meta }
 * 금지 출력: score, rawScore, risk, riskLevel, gate, band, pass/fail,
 *            transitionDifficulty, recommendation, CTA, suitability, rejectionReason
 */
export function buildTaxonomyContextPack({
  jobItem = null,
  industryItem = null,
  rawJobLabel = null,
  rawIndustryLabel = null,
  source = null,
} = {}) {
  const jobCtx = buildJobContext(jobItem);
  const industryCtx = buildIndustryContext(industryItem);

  const jobWarnings = [];
  const industryWarnings = [];
  const metaWarnings = [];

  if (!jobCtx.available) {
    jobWarnings.push("job taxonomy not resolved");
    metaWarnings.push("job context not available");
  }
  if (!industryCtx.available) {
    industryWarnings.push("industry taxonomy not resolved");
    metaWarnings.push("industry context not available");
  }

  return {
    jobContext: {
      id: jobCtx.id,
      canonicalId: jobCtx.id,
      label: jobCtx.label,
      displayLabel: jobCtx.displayLabel,
      roleSummary: deriveRoleSummary(jobCtx),
      majorCategory: jobCtx.majorCategory,
      subcategory: jobCtx.subcategory,
      aliases: jobCtx.aliases,
      warnings: jobWarnings,
    },
    industryContext: {
      id: industryCtx.id,
      canonicalId: industryCtx.id,
      label: industryCtx.label,
      displayLabel: industryCtx.displayLabel,
      sector: industryCtx.sector,
      subsector: industryCtx.subSector,
      valueChain: deriveValueChain(industryItem),
      customerContext: industryCtx.customerMarket,
      purchaseContext: industryCtx.buyingMotion,
      aliases: industryCtx.aliases,
      warnings: industryWarnings,
    },
    meta: {
      source: source ?? null,
      confidence: {
        job: jobCtx.available ? "found" : "not_found",
        industry: industryCtx.available ? "found" : "not_found",
      },
      warnings: metaWarnings,
    },
  };
}
