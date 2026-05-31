const ALLOWED_SIGNAL_TYPES = new Set([
  "role_family_hint",
  "industry_domain_hint",
  "strength_hint",
  "risk_hint",
  "skill_hint",
  "tool_hint",
]);

function safeString(value) {
  return String(value ?? "").trim();
}

function safeNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function safeSource(source) {
  const input = source && typeof source === "object" && !Array.isArray(source) ? source : {};
  return {
    type: safeString(input.type),
    refId: safeString(input.refId),
    field: safeString(input.field),
  };
}

function normalizeLabel(value) {
  return safeString(value).normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

function compactIdPart(value) {
  return normalizeLabel(value).replace(/[^a-z0-9가-힣_-]+/gi, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function dedupeKey(signal) {
  return [
    signal.type,
    normalizeLabel(signal.label),
    signal.source.refId,
    signal.evidenceText,
  ].join("::");
}

export function createCareerSignal(input = {}) {
  const type = ALLOWED_SIGNAL_TYPES.has(input.type) ? input.type : "strength_hint";
  const label = normalizeLabel(input.label);
  const source = safeSource(input.source);
  const evidenceText = safeString(input.evidenceText);

  return {
    id: safeString(input.id) || [
      compactIdPart(type),
      compactIdPart(label),
      compactIdPart(source.refId),
      compactIdPart(source.field),
    ].join(":"),
    type,
    label,
    source,
    evidenceText,
    confidence: Math.max(0, Math.min(1, safeNumber(input.confidence, 0.75))),
    weight: Math.max(0, safeNumber(input.weight, 0.8)),
  };
}

export function normalizeCareerSignals(signals = []) {
  const seen = new Set();
  const out = [];

  for (const rawSignal of Array.isArray(signals) ? signals : []) {
    const signal = createCareerSignal(rawSignal);
    if (!signal.label) continue;
    const key = dedupeKey(signal);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }

  return out;
}
