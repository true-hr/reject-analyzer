// src/lib/decision/riskProfiles/index.js
// 전체 risk profile 통합

import { ROLE_SKILL_FIT_PROFILES } from "./roleSkillFit/index.js";
import { TIMELINE_PROFILES } from "./timeline/index.js";
import { OWNERSHIP_LEADERSHIP_PROFILES } from "./ownershipLeadership/index.js";
import { IMPACT_EVIDENCE_PROFILES } from "./impactEvidence/index.js";
import { COMPANY_INDUSTRY_CONTEXT_PROFILES } from "./companyIndustryContext/index.js";
import { RESUME_STRUCTURE_CLARITY_PROFILES } from "./resumeStructureClarity/index.js";
import { LANGUAGE_SIGNAL_PROFILES } from "./languageSignals/index.js";
import { GATE_PROFILES } from "./gates/index.js";

// 가장 먼저 gates 적용
export const ALL_GATE_PROFILES = [
  ...GATE_PROFILES,
];

// 일반 risk profiles
export const ALL_RISK_PROFILES = [
  ...ROLE_SKILL_FIT_PROFILES,
  ...TIMELINE_PROFILES,
  ...OWNERSHIP_LEADERSHIP_PROFILES,
  ...IMPACT_EVIDENCE_PROFILES,
  ...COMPANY_INDUSTRY_CONTEXT_PROFILES,
  ...RESUME_STRUCTURE_CLARITY_PROFILES,
  ...LANGUAGE_SIGNAL_PROFILES,
];

// 전체 통합 (gate 포함)
export const ALL_PROFILES = [
  ...ALL_GATE_PROFILES,
  ...ALL_RISK_PROFILES,
];
