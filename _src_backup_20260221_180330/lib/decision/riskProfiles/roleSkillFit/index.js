// src/lib/decision/riskProfiles/roleSkillFit/index.js
// roleSkillFit 洹몃９: JD-?대젰???곹빀???꾩닔?붽굔/?좎궗???ㅼ썙??而ㅻ쾭由ъ?)??紐⑥쓭?덈떎.

import { mustHaveSkillMissingRisk } from "./mustHaveSkillMissingRisk.js";

// ?꾩쭅 誘멸뎄?꾩씠硫?鍮?媛앹껜 import?먯꽌 ?곗?誘濡? ?꾨옒 2媛??뚯씪?먮룄 "理쒖냼 export"瑜??ｋ뒗 寃??덉쟾?⑸땲??
// (?ㅼ쓬 ?④퀎?먯꽌 ?쒓? 諛붾줈 梨꾩썙?쒕┫ ???덉쓬)
import { semanticSimilarityRisk } from "./semanticSimilarityRisk.js";
import { jdKeywordAbsenceRisk } from "./jdKeywordAbsenceRisk.js";

export const ROLE_SKILL_FIT_PROFILES = [
  mustHaveSkillMissingRisk,
  semanticSimilarityRisk,
  jdKeywordAbsenceRisk,
];
