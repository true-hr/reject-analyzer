// src/lib/decision/riskProfiles/roleSkillFit/index.js
// roleSkillFit 그룹: JD-이력서 적합성(필수요건/유사도/키워드 커버리지)을 모읍니다.

import { mustHaveSkillMissingRisk } from "./mustHaveSkillMissingRisk.js";

// 아직 미구현이면 빈 객체 import에서 터지므로, 아래 2개 파일에도 "최소 export"를 넣는 게 안전합니다.
// (다음 단계에서 제가 바로 채워드릴 수 있음)
import { semanticSimilarityRisk } from "./semanticSimilarityRisk.js";
import { jdKeywordAbsenceRisk } from "./jdKeywordAbsenceRisk.js";

export const ROLE_SKILL_FIT_PROFILES = [
  mustHaveSkillMissingRisk,
  semanticSimilarityRisk,
  jdKeywordAbsenceRisk,
];
