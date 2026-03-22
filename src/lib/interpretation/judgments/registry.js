import { JUDGMENT_TYPES } from "./judgmentTypes.js";
import { buildTargetRoleFit } from "./role/buildTargetRoleFit.js";
import { buildIndustryContinuity } from "./role/buildIndustryContinuity.js";
import { buildLevelPositionFit } from "./role/buildLevelPositionFit.js";
import { buildEvidenceDensity } from "./evidence/buildEvidenceDensity.js";
import { buildOwnershipDepth } from "./evidence/buildOwnershipDepth.js";
import { buildAchievementProof } from "./evidence/buildAchievementProof.js";
import { buildToolProof } from "./evidence/buildToolProof.js";
import { buildTransitionReadiness } from "./transition/buildTransitionReadiness.js";
import { buildInterviewReadRisk } from "./interview/buildInterviewReadRisk.js";

export const JUDGMENT_REGISTRY = [
  { key: JUDGMENT_TYPES.TARGET_ROLE_FIT, build: buildTargetRoleFit },
  { key: JUDGMENT_TYPES.INDUSTRY_CONTINUITY, build: buildIndustryContinuity },
  { key: JUDGMENT_TYPES.LEVEL_POSITION_FIT, build: buildLevelPositionFit },
  { key: JUDGMENT_TYPES.EVIDENCE_DENSITY, build: buildEvidenceDensity },
  { key: JUDGMENT_TYPES.OWNERSHIP_DEPTH, build: buildOwnershipDepth },
  { key: JUDGMENT_TYPES.ACHIEVEMENT_PROOF, build: buildAchievementProof },
  { key: JUDGMENT_TYPES.TOOL_PROOF, build: buildToolProof },
  { key: JUDGMENT_TYPES.TRANSITION_READINESS, build: buildTransitionReadiness },
  { key: JUDGMENT_TYPES.INTERVIEW_READ_RISK, build: buildInterviewReadRisk },
];

