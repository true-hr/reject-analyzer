// src/lib/analysis/careerTransitionCaseOverlays.js
// Career mode transition overlay engine.
// Profile data is in careerTransitionCaseProfiles.js.
//
// Injects source-job-specific explanation slots into axisPack.axes.{key}.explanation
// without modifying scores, bands, or structural signals.
//
// Trigger: sourceJobIds.includes(currentJobId) && targetJobIds.includes(targetJobId)
// Mode: career mode only (buildTransitionLiteResult.js — requires currentJobId).

import { CAREER_TRANSITION_CASE_PROFILES } from "./careerTransitionCaseProfiles.js";

export { CAREER_TRANSITION_PROFILE_IDS } from "./careerTransitionCaseProfiles.js";

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

  for (const profile of CAREER_TRANSITION_CASE_PROFILES) {
    if (profile.status !== "IMPLEMENTED") continue;
    if (!profile.sourceJobIds.includes(currentJobId)) continue;
    if (!profile.targetJobIds.includes(targetJobId)) continue;
    firedProfileIds.push(profile.id);
    for (const [axisKey, slotOverlay] of Object.entries(profile.overlays ?? {})) {
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
