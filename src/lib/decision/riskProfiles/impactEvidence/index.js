// src/lib/decision/riskProfiles/impactEvidence/index.js
// impactEvidence 그룹: 성과/임팩트(정량지표, 성과동사, 결과 중심 서술 등)
// structuralPatterns 기반 3대 impact 리스크를 모두 포함

import { quantifiedImpactRisk } from "./quantifiedImpactRisk.js";
import { impactVerbRisk } from "./impactVerbRisk.js";
import { processOnlyRisk } from "./processOnlyRisk.js";

export const IMPACT_EVIDENCE_PROFILES = [
  quantifiedImpactRisk,
  impactVerbRisk,
  processOnlyRisk,
];
