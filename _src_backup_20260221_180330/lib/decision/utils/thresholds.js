// FINAL PATCHED FILE: src/lib/decision/utils/thresholds.js

// decision thresholds (append-only)
// - ?꾩옱???꾩쟾??鍮꾩뼱?덈뜕 ?뚯씪?대?濡?"源⑥?吏 ?딅뒗 理쒖냼 怨꾩빟"留??쒓났?⑸땲??
// - ?ㅻⅨ 紐⑤뱢??import ?섎뜑?쇰룄 ?고????먮윭媛 ?섏? ?딅룄濡?
//   (1) ?レ옄 ?꾧퀎媛??곸닔
//   (2) ?덈꺼 ?먯젙 ?좏떥
//   (3) 湲곕낯 export
// 瑜??④퍡 ?쒓났?⑸땲??
//
// 二쇱쓽: ?꾩쭅 ?뚮퉬泥?import/?ъ슜)媛 ?녿떎怨??섏뀲?쇰?濡?
// ?뱀젙 ?꾨찓??猷??뚯궗 洹쒕え/吏곷Т蹂? 媛숈? 異붿륫 濡쒖쭅? ?ｌ? ?딆뒿?덈떎.

export const THRESHOLDS_V1 = {
  // 0~1 score 湲곗?
  low: 0.33,
  mid: 0.66,
};

// append-only alias (?ν썑 踰꾩쟾 ???鍮?
export const DEFAULT_THRESHOLDS = THRESHOLDS_V1;

/**
 * 0~1 ?먯닔瑜?low/mid/high濡?蹂??
 * @param {number} score01
 * @param {{low:number, mid:number}} [t]
 * @returns {"low"|"mid"|"high"}
 */
export function scoreToLevel(score01, t = THRESHOLDS_V1) {
  const n = Number(score01);
  const x = Number.isFinite(n) ? n : 0;

  if (x < t.low) return "low";
  if (x < t.mid) return "mid";
  return "high";
}

/**
 * ?덈꺼???쒖떆 ?쇰꺼(?쒓?)濡?蹂??(UI?먯꽌 諛붾줈 ?곌린??
 * @param {"low"|"mid"|"high"} level
 * @returns {"??쓬"|"蹂댄넻"|"?믪쓬"}
 */
export function levelToKorean(level) {
  if (level === "low") return "??쓬";
  if (level === "high") return "?믪쓬";
  return "蹂댄넻";
}

// append-only default export
export default THRESHOLDS_V1;
