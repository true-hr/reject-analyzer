// src/lib/analysis/axisInterpretation/copyHelpers.js
//
// Minimal copy materialization helpers.
// All text sourced from axis asset stateModel fields — no arbitrary NLG.
//
// Allowed:
//   - headline from stateModel[key].label
//   - summary from stateModel[key].meaning
//   - shortReason from stateModel[key].reportHint (first sentence)
//   - detailedReason from stateModel[key].reportHint (full)
//   - actionGuides from missingSignals
//   - interviewProbes from stateModel[key].reportHint + evidenceGuide (first item)
//
// Not allowed:
//   - free-form NLG beyond what assets provide
//   - generic filler for unknown axes

/**
 * Finds stateModel entry by key.
 * @param {object} asset
 * @param {string|null} stateKey
 * @returns {object|null}
 */
function __findStateEntry(asset, stateKey) {
  if (!stateKey || !Array.isArray(asset?.stateModel)) return null;
  return asset.stateModel.find((s) => s.key === stateKey) ?? null;
}

/**
 * First sentence of a Korean string (up to first period/줄바꿈).
 */
function __firstSentence(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  const idx = trimmed.search(/[.。\n]/);
  if (idx > 0) return trimmed.slice(0, idx + 1).trim();
  return trimmed.length > 120 ? trimmed.slice(0, 120) + "…" : trimmed;
}

/**
 * buildHeadline
 * Returns the stateModel entry label, or axis label as fallback.
 *
 * @param {object} asset
 * @param {string|null} resolvedStateKey
 * @returns {string|null}
 */
export function buildHeadline(asset, resolvedStateKey) {
  const entry = __findStateEntry(asset, resolvedStateKey);
  if (entry?.label) return entry.label;
  if (asset?.label) return asset.label;
  return null;
}

/**
 * buildSummary
 * Returns the stateModel entry meaning (1–2 sentences).
 *
 * @param {object} asset
 * @param {string|null} resolvedStateKey
 * @returns {string|null}
 */
export function buildSummary(asset, resolvedStateKey) {
  const entry = __findStateEntry(asset, resolvedStateKey);
  if (entry?.meaning) return __firstSentence(entry.meaning);
  return null;
}

/**
 * buildShortReason
 * Returns first sentence of stateModel[key].reportHint.
 *
 * @param {object} asset
 * @param {string|null} resolvedStateKey
 * @returns {string|null}
 */
export function buildShortReason(asset, resolvedStateKey) {
  const entry = __findStateEntry(asset, resolvedStateKey);
  if (entry?.reportHint) return __firstSentence(entry.reportHint);
  return null;
}

/**
 * buildDetailedReason
 * Returns full stateModel[key].reportHint.
 *
 * @param {object} asset
 * @param {string|null} resolvedStateKey
 * @returns {string|null}
 */
export function buildDetailedReason(asset, resolvedStateKey) {
  const entry = __findStateEntry(asset, resolvedStateKey);
  return entry?.reportHint ?? null;
}

/**
 * buildActionGuides
 * Maps missingSignals to minimal action prompts.
 * Uses asset.summaryTemplate[*] or generic label-based prompts.
 *
 * @param {Array} missingSignals  — from axisEvidence.missingSignals
 * @param {object} asset
 * @returns {string[]}
 */
export function buildActionGuides(missingSignals, asset) {
  if (!Array.isArray(missingSignals) || missingSignals.length === 0) return [];
  const template = Array.isArray(asset?.summaryTemplate) ? asset.summaryTemplate[0] : null;
  return missingSignals.slice(0, 3).map((sig) => {
    if (template) return template;
    return sig?.label ? `${sig.label} 정보를 보완해 주세요.` : "추가 정보를 제공해 주세요.";
  }).filter(Boolean);
}

/**
 * buildInterviewProbes
 * Returns 1–2 probes from asset.examplePhrases or asset.evidenceGuide.
 *
 * @param {object} asset
 * @param {string|null} resolvedStateKey
 * @returns {string[]}
 */
export function buildInterviewProbes(asset, resolvedStateKey) {
  const result = [];
  const phrases = Array.isArray(asset?.examplePhrases) ? asset.examplePhrases : [];
  const guide   = Array.isArray(asset?.evidenceGuide)  ? asset.evidenceGuide  : [];

  if (phrases[0]) result.push(phrases[0]);
  if (result.length < 2 && guide[0]) result.push(guide[0]);

  return result.slice(0, 2);
}
