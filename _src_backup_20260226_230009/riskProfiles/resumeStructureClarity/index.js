// src/lib/decision/riskProfiles/resumeStructureClarity/index.js

import { contentDensityRisk } from "./contentDensityRisk.js";
import { buzzwordRatioRisk } from "./buzzwordRatioRisk.js";
import { vagueResponsibilityRisk } from "./vagueResponsibilityRisk.js";
import { genericSelfIntroRisk } from "./genericSelfIntroRisk.js";

export {
  contentDensityRisk,
  buzzwordRatioRisk,
  vagueResponsibilityRisk,
  genericSelfIntroRisk,
};

export const RESUME_STRUCTURE_CLARITY_PROFILES = [
  // priority ?믪? 寃껊???沅뚯옣 ?뺣젹
  vagueResponsibilityRisk,
  contentDensityRisk,
  buzzwordRatioRisk,
  genericSelfIntroRisk,
];



