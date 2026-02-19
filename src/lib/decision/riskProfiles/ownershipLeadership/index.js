// src/lib/decision/riskProfiles/ownershipLeadership/index.js
// ownershipLeadership 그룹: 오너십 / 의사결정권 / 발의(initiative) 신호 관련 리스크 모음

import { ownershipRatioRisk } from "./ownershipRatioRisk.js";
import { decisionSignalRisk } from "./decisionSignalRisk.js";
import { initiationSignalRisk } from "./initiationSignalRisk.js";

export const OWNERSHIP_LEADERSHIP_PROFILES = [
  ownershipRatioRisk,
  decisionSignalRisk,
  initiationSignalRisk,
];
