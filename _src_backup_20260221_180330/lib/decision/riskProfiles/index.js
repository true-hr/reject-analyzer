// src/lib/decision/riskProfiles/index.js
// ?꾩껜 risk profile ?듯빀

import { ROLE_SKILL_FIT_PROFILES } from "./roleSkillFit/index.js";
import { TIMELINE_PROFILES } from "./timeline/index.js";
import { OWNERSHIP_LEADERSHIP_PROFILES } from "./ownershipLeadership/index.js";
import { IMPACT_EVIDENCE_PROFILES } from "./impactEvidence/index.js";
import { COMPANY_INDUSTRY_CONTEXT_PROFILES } from "./companyIndustryContext/index.js";
import { RESUME_STRUCTURE_CLARITY_PROFILES } from "./resumeStructureClarity/index.js";
import { LANGUAGE_SIGNAL_PROFILES } from "./languageSignals/index.js";
import { GATE_PROFILES } from "./gates/index.js";

// 媛??癒쇱? gates ?곸슜
export const ALL_GATE_PROFILES = [
  ...GATE_PROFILES,
];

// ?쇰컲 risk profiles
export const ALL_RISK_PROFILES = [
  ...ROLE_SKILL_FIT_PROFILES,
  ...TIMELINE_PROFILES,
  ...OWNERSHIP_LEADERSHIP_PROFILES,
  ...IMPACT_EVIDENCE_PROFILES,
  ...COMPANY_INDUSTRY_CONTEXT_PROFILES,
  ...RESUME_STRUCTURE_CLARITY_PROFILES,
  ...LANGUAGE_SIGNAL_PROFILES,
];

// ?꾩껜 ?듯빀 (gate ?ы븿)
export const ALL_PROFILES = [
  ...ALL_GATE_PROFILES,
  ...ALL_RISK_PROFILES,
];
