import { analyzeCareerTimeline } from "./analyzeCareerTimeline.js";
import { normalizeCareerProfile } from "./careerProfileModel.js";
import { extractCareerSignalsFromResumeProfile } from "./extractCareerSignalsFromResumeProfile.js";

export function buildCareerProfileFromResumeProfile(resumeProfile, options = {}) {
  const analysis = analyzeCareerTimeline(resumeProfile?.experiences ?? [], options);
  const signalResult = extractCareerSignalsFromResumeProfile(resumeProfile, analysis);

  return normalizeCareerProfile({
    timeline: analysis.timeline,
    summary: analysis.summary,
    signals: {
      roleFamilies: signalResult.roleFamilies,
      industryDomains: signalResult.industryDomains,
      strengthSignals: signalResult.strengthSignals,
      riskSignals: signalResult.riskSignals,
      skillSignals: signalResult.skillSignals,
      toolSignals: signalResult.toolSignals,
    },
    meta: {
      source: "resume_profile",
      resumeProfileSchemaVersion: resumeProfile?.schemaVersion ?? null,
      currentMonth: analysis.meta.currentMonth,
      signalSummary: signalResult.summary,
      warnings: analysis.meta.warnings,
    },
  });
}
