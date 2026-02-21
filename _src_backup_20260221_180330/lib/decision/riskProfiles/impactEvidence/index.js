// src/lib/decision/riskProfiles/impactEvidence/index.js
// impactEvidence 洹몃９: ?깃낵/?꾪뙥???뺣웾吏?? ?깃낵?숈궗, 寃곌낵 以묒떖 ?쒖닠 ??
// structuralPatterns 湲곕컲 3? impact 由ъ뒪?щ? 紐⑤몢 ?ы븿

import { quantifiedImpactRisk } from "./quantifiedImpactRisk.js";
import { impactVerbRisk } from "./impactVerbRisk.js";
import { processOnlyRisk } from "./processOnlyRisk.js";

export const IMPACT_EVIDENCE_PROFILES = [
  quantifiedImpactRisk,
  impactVerbRisk,
  processOnlyRisk,
];
