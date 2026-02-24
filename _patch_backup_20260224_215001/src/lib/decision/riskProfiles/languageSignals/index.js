// src/lib/decision/riskProfiles/languageSignals/index.js

import { hedgeLanguageRisk } from "./hedgeLanguageRisk.js";
import { lowConfidenceLanguageRisk } from "./lowConfidenceLanguageRisk.js";
import { passiveVoiceRisk } from "./passiveVoiceRisk.js";
import { weakAssertionRisk } from "./weakAssertionRisk.js";

// 硫붿씤 export (?뺤떇 ?대쫫)
export const LANGUAGE_SIGNAL_PROFILES = [
  lowConfidenceLanguageRisk,
  weakAssertionRisk,
  passiveVoiceRisk,
  hedgeLanguageRisk,
];

// ?뱀떆 湲곗〈 肄붾뱶?먯꽌 ?섎せ???대쫫???곌퀬 ?덉쓣 寃쎌슦 ?鍮?(?덉쟾 ?명솚??
export const LANGUAGE_SIGNALS_PROFILES = LANGUAGE_SIGNAL_PROFILES;

