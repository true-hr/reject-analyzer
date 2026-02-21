// src/lib/decision/riskProfiles/ownershipLeadership/index.js
// ownershipLeadership 洹몃９: ?ㅻ꼫??/ ?섏궗寃곗젙沅?/ 諛쒖쓽(initiative) ?좏샇 愿??由ъ뒪??紐⑥쓬

import { ownershipRatioRisk } from "./ownershipRatioRisk.js";
import { decisionSignalRisk } from "./decisionSignalRisk.js";
import { initiationSignalRisk } from "./initiationSignalRisk.js";

export const OWNERSHIP_LEADERSHIP_PROFILES = [
  ownershipRatioRisk,
  decisionSignalRisk,
  initiationSignalRisk,
];
