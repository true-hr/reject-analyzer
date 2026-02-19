// src/lib/decision/riskProfiles/resumeStructureClarity/index.js

import { contentDensityRisk } from "./contentDensityRisk";
import { buzzwordRatioRisk } from "./buzzwordRatioRisk";
import { vagueResponsibilityRisk } from "./vagueResponsibilityRisk";
import { genericSelfIntroRisk } from "./genericSelfIntroRisk";

export {
  contentDensityRisk,
  buzzwordRatioRisk,
  vagueResponsibilityRisk,
  genericSelfIntroRisk,
};

export const RESUME_STRUCTURE_CLARITY_PROFILES = [
  // priority 높은 것부터 권장 정렬
  vagueResponsibilityRisk,
  contentDensityRisk,
  buzzwordRatioRisk,
  genericSelfIntroRisk,
];
