// src/lib/decision/riskProfiles/impactEvidence/quantifiedImpactRisk.js
// ?뺣웾 ?깃낵(?レ옄) 遺議?由ъ뒪??
// - structuralPatterns??NO_QUANTIFIED_IMPACT ?뚮옒洹몃? riskProfile濡??밴꺽 :contentReference[oaicite:3]{index=3}
// - metrics.numbersCount 湲곕컲 :contentReference[oaicite:4]{index=4}
// - THRESH.MIN_NUMBERS_COUNT 湲곕낯 1 :contentReference[oaicite:5]{index=5}

function safeNum(v, fallback = null) {
  return Number.isFinite(v) ? v : fallback;
}

function safeStr(v, fallback = "") {
  try {
    return (v ?? "").toString();
  } catch {
    return fallback;
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function _getStructural(ctx) {
  const c = isObj(ctx) ? ctx : {};
  const structural = isObj(c.structural) ? c.structural : null;

  const flags =
    (structural && Array.isArray(structural.flags) ? structural.flags : null) ||
    (Array.isArray(c.flags) ? c.flags : null) ||
    [];

  const metrics =
    (structural && isObj(structural.metrics) ? structural.metrics : null) ||
    (isObj(c.metrics) ? c.metrics : {}) ||
    {};

  return { flags, metrics };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;
  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _clamp01(x) {
  const n = safeNum(x, 0);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export const quantifiedImpactRisk = {
  id: "IMPACT__NO_QUANTIFIED_IMPACT",
  group: "impactEvidence",
  layer: "hireability",
  priority: 90,
  severityBase: 5,
  tags: ["impactEvidence", "quantified", "numbers"],

  // ?몃━嫄?
  // 1) structuralPatterns ?뚮옒洹멸? ?덉쑝硫?true
  // 2) ?뚮옒洹멸? ?놁뼱??metrics濡??ы쁽 (numbersCount < minNumbersCount)
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_QUANTIFIED_IMPACT");
    if (flag) return true;

    const n = safeNum(metrics.numbersCount, null);
    if (n == null) return false;

    const min = safeNum(metrics.minNumbersCount, null) ?? 1; // THRESH.MIN_NUMBERS_COUNT 湲곕낯 :contentReference[oaicite:6]{index=6}
    return n < min;
  },

  // score: 0~1
  // - structuralPatterns?????⑦꽩??score=0.8濡?怨좎젙 :contentReference[oaicite:7]{index=7}
  // - flag.score媛 ?덉쑝硫?洹몃?濡?
  // - ?놁쑝硫?numbersCount媛 0?쇱닔濡??믨쾶
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_QUANTIFIED_IMPACT");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const n = safeNum(metrics.numbersCount, null);
    if (n == null) return 0;

    // 媛???뷀븳 耳?댁뒪:
    // n=0 -> 0.85, n=1 -> 0.35 (?대? 理쒖냼 異⑹”?대?濡?蹂댄넻 when=false寃좎?留??덉쟾 泥섎━), n>=2 -> 0.2
    if (n <= 0) return 0.85;
    if (n === 1) return 0.35;
    return 0.2;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "NO_QUANTIFIED_IMPACT");

    const detail = isObj(flag?.detail) ? flag.detail : {};

    const n =
      safeNum(detail.numbersCount, null) ??
      safeNum(metrics.numbersCount, null) ??
      0;

    const min =
      safeNum(detail.minNumbersCount, null) ??
      safeNum(metrics.minNumbersCount, null) ??
      1;

    const why = [
      "?깃낵媛 ?섏옒?덈떎/?덈떎?숇줈留??쏀엳怨? 梨꾩슜?먭? ?먮떒?????덈뒗 ?レ옄 洹쇨굅(%, 湲덉븸, 洹쒕え, ?쒓컙, 嫄댁닔)媛 嫄곗쓽 ?놁뒿?덈떎.",
      "?쒕쪟?먯꽌???섏꽦怨쇱쓽 ?ш린?숇낫???섏꽦怨쇨? ?ㅼ젣濡??덉뿀?붿??숇? ?レ옄濡?鍮좊Ⅴ寃??먮퀎?섎뒗 寃쏀뼢??媛뺥빐?? ?뺣웾 洹쇨굅媛 ?놁쑝硫?遺덈━?⑸땲??",
    ];

    const fix = [
      "媛??꾨줈?앺듃/?낅Т bullet留덈떎 ?レ옄 1媛쒕쭔 媛뺤젣濡?遺숈씠?몄슂. (?? ?꾪솚??留ㅼ텧/鍮꾩슜/泥섎━?쒓컙/遺덈웾瑜?由щ뱶???CS嫄댁닔 ??",
      "?レ옄媛 諛붾줈 ?놁쑝硫??쁁efore?묨fter???뺥깭濡쒕씪??留뚮뱶?몄슂. (?? 3?쇄넂1?? ??10嫄닳넂30嫄? ?ㅻ쪟 5%??%)",
      "?뺥솗???섏튂媛 誘쇨컧?섎㈃ 踰붿쐞/?곷?媛믩룄 媛?ν빀?덈떎. (?? ?섏빟 20% 媛쒖꽑?? ?섏썡 ?섏떗 嫄닳? ?섏뿰媛??섏뼲 洹쒕え??",
    ];

    const notes = [];
    notes.push(`numbersCount: ${n}`);
    notes.push(`minNumbersCount: ${min}`);
    if (flag?.title) notes.push(`patternTitle: ${safeStr(flag.title)}`);

    const evidenceKeys = ["numbersCount"];

    const title = flag?.title
      ? `?뺣웾 ?깃낵 由ъ뒪?? ${safeStr(flag.title)}`
      : "?뺣웾 ?깃낵(?レ옄) 遺議?由ъ뒪??;

    return {
      title,
      why,
      fix,
      evidenceKeys,
      notes,
    };
  },

  suppressIf: [],
};
