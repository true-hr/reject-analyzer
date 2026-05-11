// src/lib/decision/requiredConditions/resolveRequiredConditions.js
// Baseline required condition resolver — cert shadow pilot (Phase 0).
// Generates rule-only shadow resolutions for required certifications.
// Does NOT change existing gate read-paths or user-facing output.
// See: docs/PASSMAP_REQUIRED_CONDITION_GATE_MIGRATION_POLICY.md

import { buildRequiredConditionKeys } from "./buildRequiredConditionKeys.js";

export function resolveRequiredConditions({
  requiredGateSignals = null,
  requiredConditionInterpretations = [],
} = {}) {
  const resolutions = [];

  if (!requiredGateSignals || typeof requiredGateSignals !== "object") {
    return resolutions;
  }

  const certs = requiredGateSignals.certifications;
  if (!certs || typeof certs !== "object") {
    return resolutions;
  }

  const required = Array.isArray(certs.required) ? certs.required : [];
  if (required.length === 0) {
    return resolutions;
  }

  const matched = Array.isArray(certs.matched) ? certs.matched : [];
  const missing = Array.isArray(certs.missing) ? certs.missing : [];

  const matchedSet = new Set(matched);
  const missingSet = new Set(missing);
  const seen = new Set();

  for (const certLabel of required) {
    const label = String(certLabel || "").trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);

    const { conditionKey, topicKey } = buildRequiredConditionKeys({
      scope: "required",
      conditionType: "certification",
      subject: label,
      constraints: ["exists"],
    });

    let ruleStatus;
    let outputLayer;
    let ruleReason;

    if (missingSet.has(label)) {
      ruleStatus = "unsatisfied";
      outputLayer = "gate";
      ruleReason = "required cert not found in resume";
    } else if (matchedSet.has(label)) {
      ruleStatus = "satisfied";
      outputLayer = "none";
      ruleReason = "required cert found in resume";
    } else {
      ruleStatus = "unknown";
      outputLayer = "none";
      ruleReason = "cert not present in matched or missing arrays";
    }

    resolutions.push({
      conditionKey,
      topicKey,
      conditionType: "certification",
      requirement: {
        rawText: label,
        normalizedText: conditionKey ? conditionKey.split(":")[2] : "",
        explicitness: "explicit_required",
        sourceQuote: "",
      },
      ruleAssessment: {
        status: ruleStatus,
        authority: "decisive",
        reason: ruleReason,
      },
      aiAssessment: null,
      finalAssessment: {
        status: ruleStatus,
        outputLayer,
        dominantSource: "rule",
        reason: ruleReason,
      },
      suppression: {
        suppressesConditionKeys: [],
        mayOverlapTopicKeys: [],
      },
    });
  }

  return resolutions;
}
