// src/lib/decision/riskProfiles/gates/index.js
// gates 그룹: 강한 즉시 탈락 트리거(서류 단계 우선 적용)

import { criticalExperienceGapGate } from "./criticalExperienceGapGate.js";
import { educationGateRisk } from "./educationGateRisk.js";
import { salaryMismatchRisk } from "./salaryMismatchRisk.js";
import { ageGateRisk } from "./ageGateRisk.js";

export const GATE_PROFILES = [
  criticalExperienceGapGate,
  educationGateRisk,
  salaryMismatchRisk,
  ageGateRisk,
];
