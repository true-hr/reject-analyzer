import { CAREER_SIGNAL_KEYWORD_CATALOG, CAREER_SIGNAL_RISK_LABELS } from "./careerSignalKeywords.js";
import { createCareerSignal, normalizeCareerSignals } from "./careerSignalModel.js";

function safeString(value) {
  return String(value ?? "").trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value.filter((item) => item != null && safeString(item) !== "") : [];
}

function normalizeText(value) {
  return safeString(value).normalize("NFKC").toLowerCase();
}

function includesKeyword(text, keyword) {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedText || !normalizedKeyword) return false;
  return normalizedText.includes(normalizedKeyword);
}

function getExperienceId(experience, index) {
  return safeString(experience?.id) || `experience-${index + 1}`;
}

function getExperienceTitle(experience) {
  return safeString(experience?.title || experience?.role || experience?.position);
}

function getExperienceCompany(experience) {
  return safeString(experience?.company || experience?.organization || experience?.employer);
}

function getBulletText(bullet) {
  return safeString(typeof bullet === "string" ? bullet : bullet?.text || bullet?.content || bullet?.description);
}

function getBulletId(bullet, fallback) {
  return safeString(typeof bullet === "object" ? bullet?.id : "") || fallback;
}

function getBulletEvidenceType(bullet) {
  return safeString(typeof bullet === "object" ? bullet?.evidenceType : "");
}

function addKeywordSignals({ out, catalog, signalType, text, source, weight }) {
  if (!text) return;
  for (const item of catalog) {
    if (!item.keywords.some((keyword) => includesKeyword(text, keyword))) continue;
    out.push(createCareerSignal({
      type: signalType,
      label: item.label,
      source,
      evidenceText: text,
      confidence: 0.75,
      weight,
    }));
  }
}

function collectProfileKeywordText(profile) {
  return [
    profile?.headline?.targetTitle,
    profile?.headline?.summary,
    ...(Array.isArray(profile?.headline?.keywords) ? profile.headline.keywords : []),
    profile?.summary,
  ].map(safeString).filter(Boolean);
}

function collectSkillEntries(skills) {
  if (Array.isArray(skills)) {
    return skills.map((value) => ({ value, bucket: "skills" }));
  }
  if (!skills || typeof skills !== "object") return [];
  return Object.entries(skills).flatMap(([bucket, values]) =>
    safeArray(values).map((value) => ({ value, bucket }))
  );
}

function addRiskSignal(out, label, source, evidenceText, weight = 1) {
  out.push(createCareerSignal({
    type: "risk_hint",
    label,
    source,
    evidenceText,
    confidence: 0.9,
    weight,
  }));
}

function groupSignals(signals) {
  return {
    roleFamilies: signals.filter((signal) => signal.type === "role_family_hint"),
    industryDomains: signals.filter((signal) => signal.type === "industry_domain_hint"),
    strengthSignals: signals.filter((signal) => signal.type === "strength_hint"),
    riskSignals: signals.filter((signal) => signal.type === "risk_hint"),
    skillSignals: signals.filter((signal) => signal.type === "skill_hint"),
    toolSignals: signals.filter((signal) => signal.type === "tool_hint"),
  };
}

function buildSummary(grouped) {
  return {
    roleFamilyHintCount: grouped.roleFamilies.length,
    industryDomainHintCount: grouped.industryDomains.length,
    strengthHintCount: grouped.strengthSignals.length,
    riskHintCount: grouped.riskSignals.length,
    skillHintCount: grouped.skillSignals.length,
    toolHintCount: grouped.toolSignals.length,
    totalSignalCount: Object.values(grouped).reduce((sum, items) => sum + items.length, 0),
  };
}

export function extractCareerSignalsFromResumeProfile(resumeProfile, careerTimelineResult = null) {
  const rawSignals = [];
  const experiences = safeArray(resumeProfile?.experiences);

  collectProfileKeywordText(resumeProfile).forEach((text, index) => {
    const source = { type: "profile", refId: "headline", field: `headline.${index}` };
    addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.roleFamilies, signalType: "role_family_hint", text, source, weight: 0.6 });
    addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.industryDomains, signalType: "industry_domain_hint", text, source, weight: 0.6 });
    addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.strengths, signalType: "strength_hint", text, source, weight: 0.6 });
  });

  experiences.forEach((experience, experienceIndex) => {
    const experienceId = getExperienceId(experience, experienceIndex);
    const title = getExperienceTitle(experience);
    const company = getExperienceCompany(experience);
    const bullets = safeArray(experience?.bullets);
    const hasExplicitBulletsField = Object.prototype.hasOwnProperty.call(Object(experience), "bullets");

    [
      { field: "title", text: title, weight: 1.0 },
      { field: "company", text: company, weight: 0.6 },
    ].forEach(({ field, text, weight }) => {
      const source = { type: "experience", refId: experienceId, field };
      addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.roleFamilies, signalType: "role_family_hint", text, source, weight });
      addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.industryDomains, signalType: "industry_domain_hint", text, source, weight });
      addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.strengths, signalType: "strength_hint", text, source, weight });
    });

    if (hasExplicitBulletsField && bullets.length === 0) {
      addRiskSignal(
        rawSignals,
        CAREER_SIGNAL_RISK_LABELS.missingExperienceEvidence,
        { type: "experience", refId: experienceId, field: "bullets" },
        "No experience bullets found",
        0.8
      );
    }

    bullets.forEach((bullet, bulletIndex) => {
      const bulletId = getBulletId(bullet, `${experienceId}:bullet-${bulletIndex + 1}`);
      const text = getBulletText(bullet);
      const source = { type: "bullet", refId: bulletId, field: "text" };
      addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.roleFamilies, signalType: "role_family_hint", text, source, weight: 0.8 });
      addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.industryDomains, signalType: "industry_domain_hint", text, source, weight: 0.8 });
      addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.strengths, signalType: "strength_hint", text, source, weight: 0.8 });

      const evidenceType = normalizeText(getBulletEvidenceType(bullet));
      if (evidenceType === "weak" || evidenceType === "unknown") {
        addRiskSignal(
          rawSignals,
          CAREER_SIGNAL_RISK_LABELS.weakEvidence,
          { type: "bullet", refId: bulletId, field: "evidenceType" },
          text || evidenceType,
          0.9
        );
      }
    });
  });

  collectSkillEntries(resumeProfile?.skills).forEach(({ value, bucket }) => {
    const text = safeString(value);
    const isTool = bucket === "tools" || bucket === "tool";
    rawSignals.push(createCareerSignal({
      type: isTool ? "tool_hint" : "skill_hint",
      label: text,
      source: { type: "profile", refId: "skills", field: bucket },
      evidenceText: text,
      confidence: 0.75,
      weight: 0.7,
    }));
    addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.roleFamilies, signalType: "role_family_hint", text, source: { type: "profile", refId: "skills", field: bucket }, weight: 0.7 });
    addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.industryDomains, signalType: "industry_domain_hint", text, source: { type: "profile", refId: "skills", field: bucket }, weight: 0.7 });
    addKeywordSignals({ out: rawSignals, catalog: CAREER_SIGNAL_KEYWORD_CATALOG.strengths, signalType: "strength_hint", text, source: { type: "profile", refId: "skills", field: bucket }, weight: 0.7 });
  });

  safeArray(careerTimelineResult?.timeline).forEach((row) => {
    if (row?.isShortTenure || row?.durationMonths <= 6) {
      addRiskSignal(
        rawSignals,
        CAREER_SIGNAL_RISK_LABELS.shortTenure,
        { type: "timeline", refId: safeString(row?.id), field: "durationMonths" },
        `${safeString(row?.durationMonths)} months`
      );
    }
    if (safeArray(row?.warnings).length > 0) {
      addRiskSignal(
        rawSignals,
        CAREER_SIGNAL_RISK_LABELS.timelineDateIssue,
        { type: "timeline", refId: safeString(row?.id), field: "warnings" },
        safeArray(row?.warnings).join(", ")
      );
    }
  });

  const normalized = normalizeCareerSignals(rawSignals);
  const grouped = groupSignals(normalized);
  return {
    ...grouped,
    summary: buildSummary(grouped),
  };
}
