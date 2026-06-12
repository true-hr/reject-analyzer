function safeText(value) {
  return String(value || "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasMeaningfulJsonList(value) {
  return asArray(value).some((item) => {
    if (typeof item === "string") return safeText(item).length >= 8;
    if (item && typeof item === "object") {
      return Object.values(item).some((entry) => safeText(entry).length >= 8);
    }
    return false;
  });
}

function hasCardEvidence(card) {
  const evidence = card?.experience_evidence || card?.experienceEvidence;
  return asArray(evidence).some((item) => safeText(item?.evidence_text || item?.evidenceText || item).length >= 8);
}

function getCardDetailScore(card) {
  if (!card || typeof card !== "object") return 0;
  let score = 0;
  if (safeText(card.situation).length >= 8) score += 1;
  if (safeText(card.task).length >= 8) score += 1;
  if (hasMeaningfulJsonList(card.actions)) score += 1;
  if (hasMeaningfulJsonList(card.result)) score += 1;
  if (safeText(card.suggested_resume_bullet).length >= 20 || safeText(card.suggestedResumeBullet).length >= 20) score += 1;
  if (hasCardEvidence(card)) score += 1;
  return score;
}

function getRecordDetailScore(record) {
  if (!record || typeof record !== "object") return 0;
  const raw = record.rawPayload && typeof record.rawPayload === "object" ? record.rawPayload : {};
  const longText = [
    record.description,
    record.summary,
    record.result,
    record.task,
    record.reflectedSentence,
    raw.projectActions,
    raw.projectResult,
    raw.reflectedSentence,
    raw.resumeSentence,
  ].map(safeText);

  let score = 0;
  if (longText.some((text) => text.length >= 40)) score += 1;
  if (safeText(record.result || raw.projectResult).length >= 12) score += 1;
  if (safeText(record.task || raw.projectActions).length >= 12) score += 1;
  if (longText.some((text) => /\d/.test(text))) score += 1;
  if (safeText(record.reflectedSentence || raw.reflectedSentence || raw.resumeSentence).length >= 20) score += 1;
  return score;
}

export function getRecordDetailStatus(record, cards = []) {
  const cardScore = asArray(cards).reduce((sum, card) => sum + getCardDetailScore(card), 0);
  if (cardScore >= 3) return "detailed";

  const recordScore = getRecordDetailScore(record);
  if (recordScore >= 3) return "detailed";

  if (!record) return "none";
  return "keyword";
}

export function getDateRecordStatus(records = [], cardsByRecordId = {}) {
  const safeRecords = asArray(records).filter(Boolean);
  if (safeRecords.length === 0) return "none";
  return safeRecords.some((record) => {
    const cards = cardsByRecordId?.[String(record.id || "")] || [];
    return getRecordDetailStatus(record, cards) === "detailed";
  })
    ? "detailed"
    : "keyword";
}

export function getDateStatusLabel(status) {
  if (status === "detailed") return "면접/이력서로 발전 가능";
  if (status === "keyword") return "보완하면 더 좋아요";
  return "기록 전";
}

export function getDateStatusClassName(status) {
  if (status === "detailed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "keyword") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-500";
}
