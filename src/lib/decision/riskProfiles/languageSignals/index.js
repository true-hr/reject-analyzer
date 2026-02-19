// src/lib/decision/riskProfiles/languageSignals/index.js

import { hedgeLanguageRisk } from "./hedgeLanguageRisk";
import { lowConfidenceLanguageRisk } from "./lowConfidenceLanguageRisk";
import { passiveVoiceRisk } from "./passiveVoiceRisk";
import { weakAssertionRisk } from "./weakAssertionRisk";

// 메인 export (정식 이름)
export const LANGUAGE_SIGNAL_PROFILES = [
  lowConfidenceLanguageRisk,
  weakAssertionRisk,
  passiveVoiceRisk,
  hedgeLanguageRisk,
];

// 혹시 기존 코드에서 잘못된 이름을 쓰고 있을 경우 대비 (안전 호환용)
export const LANGUAGE_SIGNALS_PROFILES = LANGUAGE_SIGNAL_PROFILES;
