// src/lib/decision/riskProfiles/companyIndustryContext/index.js
// companyIndustryContext 洹몃９: ?뚯궗/?곗뾽/?꾨찓??留λ씫 ?곹빀??踰ㅻ뜑/?꾨찓???꾪솚/?뚯궗 援ъ껜????븷 援ъ껜????

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
