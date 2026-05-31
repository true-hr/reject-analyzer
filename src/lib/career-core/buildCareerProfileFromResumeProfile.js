import { analyzeCareerTimeline } from "./analyzeCareerTimeline.js";
import { normalizeCareerProfile } from "./careerProfileModel.js";

export function buildCareerProfileFromResumeProfile(resumeProfile, options = {}) {
  const analysis = analyzeCareerTimeline(resumeProfile?.experiences ?? [], options);

  return normalizeCareerProfile({
    timeline: analysis.timeline,
    summary: analysis.summary,
    signals: {
      roleFamilies: [],
      industryDomains: [],
      strengthSignals: [],
      riskSignals: [],
    },
    meta: {
      source: "resume_profile",
      resumeProfileSchemaVersion: resumeProfile?.schemaVersion ?? null,
      currentMonth: analysis.meta.currentMonth,
      warnings: analysis.meta.warnings,
    },
  });
}
