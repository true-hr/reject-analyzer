// src/lib/decision/riskProfiles/gates/index.js
// gates 그룹: 강한 탈락 트리거(하드 게이트)
// - 특정 조건에서 다른 risk보다 우선 적용될 수 있음

import { hardMustHaveMissingGate } from "./hardMustHaveMissingGate.js";
import { experienceGapGate } from "./experienceGapGate.js";

export const GATE_PROFILES = [
  hardMustHaveMissingGate,
  experienceGapGate,
];
