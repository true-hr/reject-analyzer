import { findNewgradStrengthEntry } from "../../data/transitionLite/newgradStrengthRegistry.js";
import { findNewgradWorkStyleEntry } from "../../data/transitionLite/newgradWorkStyleRegistry.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniqueById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function splitWorkStyleNotes(notes) {
  return toStr(notes)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeNewgradSelfReportTraits(input = {}) {
  const rawStrengthLabels = toArr(input?.strengths).map((item) => toStr(item)).filter(Boolean);
  const rawWorkStyleLabels = splitWorkStyleNotes(input?.workStyleNotes);

  const strengthEntries = uniqueById(rawStrengthLabels.map((label) => findNewgradStrengthEntry(label)).filter(Boolean));
  const workStyleEntries = uniqueById(rawWorkStyleLabels.map((label) => findNewgradWorkStyleEntry(label)).filter(Boolean));

  const normalizedStrengthLabels = strengthEntries.map((entry) => entry.label);
  const normalizedWorkStyleLabels = workStyleEntries.map((entry) => entry.label);
  const canonicalStrengthKeys = strengthEntries.map((entry) => entry.id);
  const canonicalWorkStyleKeys = workStyleEntries.map((entry) => entry.id);
  const interactionEligibleWorkStyleEntries = workStyleEntries.filter((entry) => entry.interactionEligible);
  const axis4SelfReportSignalKeys = uniqueById([
    ...interactionEligibleWorkStyleEntries,
    ...strengthEntries.filter((entry) => entry.explanationEligibleAxes.includes("customerType")),
  ]).map((entry) => entry.id);
  const axis4SelfReportSupportScore = Math.min(2, interactionEligibleWorkStyleEntries.length);

  return {
    rawStrengthLabels,
    rawWorkStyleLabels,
    normalizedStrengthLabels,
    normalizedWorkStyleLabels,
    canonicalStrengthKeys,
    canonicalWorkStyleKeys,
    strengthEntries,
    workStyleEntries,
    interactionEligibleWorkStyleKeys: interactionEligibleWorkStyleEntries.map((entry) => entry.id),
    interactionEligibleWorkStyleLabels: interactionEligibleWorkStyleEntries.map((entry) => entry.label),
    axis4SupportStrengthLabels: strengthEntries
      .filter((entry) => entry.explanationEligibleAxes.includes("customerType"))
      .map((entry) => entry.label),
    axis4SelfReportSignalKeys,
    axis4SelfReportSupportScore,
  };
}

export default normalizeNewgradSelfReportTraits;
