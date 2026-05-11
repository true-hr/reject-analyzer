// src/lib/decision/requiredConditions/buildRequiredConditionKeys.js
// conditionKey / topicKey builder — cert shadow pilot only.
// Format: conditionKey = <scope>:<conditionType>:<subject>:<constraint...>
//         topicKey     = <conditionType>:<subject>
// See: docs/PASSMAP_REQUIRED_CONDITION_KEY_POLICY.md

function _normalizeSubject(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-\.\/\\]+/g, "_")
    .replace(/[^\p{L}\p{N}_]/gu, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export function buildRequiredConditionKeys({
  scope = "required",
  conditionType = "",
  subject = "",
  constraints = [],
} = {}) {
  const normalizedSubject = _normalizeSubject(subject);

  if (!conditionType || !normalizedSubject) {
    return { conditionKey: "", topicKey: "" };
  }

  const constraintPart = constraints.length > 0 ? ":" + constraints.join(":") : "";
  const conditionKey = `${scope}:${conditionType}:${normalizedSubject}${constraintPart}`;
  const topicKey = `${conditionType}:${normalizedSubject}`;

  return { conditionKey, topicKey };
}
