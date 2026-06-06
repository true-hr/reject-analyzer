import { detectSaraminResumeText } from "./detectSaraminResumeText.js";
import { buildSaraminResumeProfileCandidate } from "./buildSaraminResumeProfileCandidate.js";

const MIN_SARAMIN_TEXT_LENGTH = 120;

function normalizeText(text) {
  return String(text || "").replace(/\r\n?/g, "\n").trim();
}

export function buildResumeImportMetadata(text, options = {}) {
  const rawText = normalizeText(text);
  const kind = String(options.kind || "resume");

  if (kind !== "resume" || rawText.length < MIN_SARAMIN_TEXT_LENGTH) {
    return null;
  }

  const detection = detectSaraminResumeText(rawText);
  if (
    detection.sourcePlatform !== "saramin" ||
    detection.textExtractable !== true ||
    detection.ocrRequired === true
  ) {
    return null;
  }

  const candidate = buildSaraminResumeProfileCandidate(rawText, detection);

  return {
    sourcePlatform: "saramin",
    sourceDocumentRole: detection.sourceDocumentRole,
    textExtractable: true,
    ocrRequired: false,
    detectionConfidence: detection.confidence,
    detectedSections: detection.detectedSections,
    importWarnings: candidate.importWarnings,
    resumeProfileCandidate: candidate.resumeProfileCandidate,
    evidenceBankCandidate: candidate.evidenceBankCandidate,
    reviewRequired: true,
  };
}

export function attachResumeImportMetadata(meta = {}, text = "", options = {}) {
  const resumeImportMetadata = buildResumeImportMetadata(text, options);
  if (!resumeImportMetadata) return meta || {};
  return {
    ...(meta || {}),
    resumeImportMetadata,
  };
}

export default buildResumeImportMetadata;
