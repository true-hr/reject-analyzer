import { createStableResumeId } from "./resumeProfileModel.js";

function clean(value) {
  return String(value || "").trim() || null;
}

export function buildTargetResumeVersion({
  fit,
  targetRole,
  targetIndustry,
  targetCompany,
  exportFormat = "markdown",
} = {}) {
  const matches = Array.isArray(fit?.bulletMatches) ? fit.bulletMatches : [];
  const keepOrPromote = matches.filter((item) => item.recommendation === "keep" || item.recommendation === "promote");
  const promoted = matches
    .filter((item) => item.recommendation === "promote")
    .sort((a, b) => b.score - a.score || String(a.bulletId).localeCompare(String(b.bulletId)));
  const hidden = matches.filter((item) => item.recommendation === "deprioritize");
  const createdAt = new Date().toISOString();
  const jdKeywords = Array.isArray(fit?.jdKeywords) ? fit.jdKeywords : [];

  return {
    id: createStableResumeId("target_version", [targetRole, targetCompany, jdKeywords.join("|")]),
    targetRole: clean(targetRole),
    targetIndustry: clean(targetIndustry),
    targetCompany: clean(targetCompany),
    createdAt,
    source: "jd_tailoring",
    jdKeywords,
    selectedBulletIds: keepOrPromote.map((item) => item.bulletId).filter(Boolean),
    promotedBulletIds: promoted.map((item) => item.bulletId).filter(Boolean),
    hiddenBulletIds: hidden.map((item) => item.bulletId).filter(Boolean),
    gaps: Array.isArray(fit?.gaps) ? fit.gaps : [],
    exportFormat,
  };
}

export default buildTargetResumeVersion;
