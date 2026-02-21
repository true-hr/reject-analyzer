// src/lib/decision/riskProfiles/gates/index.js
// gates 그룹: 강한 즉시 탈락 트리거(서류 단계 우선 적용)

import { hardMustHaveMissingGate } from "./hardMustHaveMissingGate.js";
import { experienceGapGate } from "./experienceGapGate.js";
import { criticalExperienceGapGate } from "./criticalExperienceGapGate.js";
import { educationGateRisk } from "./educationGateRisk.js";
import { overqualificationRisk } from "./overqualificationRisk.js";
import { salaryMismatchRisk } from "./salaryMismatchRisk.js";
import { ageGateRisk } from "./ageGateRisk.js";

export const GATE_PROFILES = [
  hardMustHaveMissingGate,
  experienceGapGate,
  criticalExperienceGapGate,
  educationGateRisk,
  overqualificationRisk,
  salaryMismatchRisk,
  ageGateRisk,
];
