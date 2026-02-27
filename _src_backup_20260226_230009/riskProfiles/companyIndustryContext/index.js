// src/lib/decision/riskProfiles/companyIndustryContext/index.js
// companyIndustryContext 그룹: 회사/산업/도메인 맥락 적합성(벤더/도메인 전환/회사 구체성/역할 구체성 등)

import { vendorSignalRisk } from "./vendorSignalRisk.js";
import { companySpecificityRisk } from "./companySpecificityRisk.js";
import { roleSpecificityRisk } from "./roleSpecificityRisk.js";
import { domainShiftRisk } from "./domainShiftRisk.js";

export const COMPANY_INDUSTRY_CONTEXT_PROFILES = [
  vendorSignalRisk,
  companySpecificityRisk,
  roleSpecificityRisk,
  domainShiftRisk,
];
