// src/lib/decision/riskProfiles/roleSkillFit/mustHaveSkillMissingRisk.js
// JD must-have(?꾩닔) 而ㅻ쾭由ъ? ??쓬 由ъ뒪??
// - structuralPatterns??MUST_HAVE_SKILL_MISSING ?뚮옒洹몃? decision 由ъ뒪???꾨줈?꾨줈 ?밴꺽
// - crash-safe: ctx ?뺥깭媛 ?щ씪??理쒕????덉쟾?섍쾶 ?숈옉

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

function _uniq(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = safeStr(x).trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export const mustHaveSkillMissingRisk = {
  id: "ROLE_SKILL__MUST_HAVE_MISSING",
  group: "roleSkillFit",
  layer: "hireability",
  priority: 95,
  severityBase: 5,
  tags: ["roleSkillFit", "mustHave", "jdCoverage"],

  // ?몃━嫄? structuralPatterns媛 MUST_HAVE_SKILL_MISSING??李띿뿀????
  // (?먮뒗 metrics ??requiredSkills媛 ?덇퀬 requiredCoverage媛 ??쓣 ?뚢뷀뵆?섍렇 ?녿뜑?쇰룄 蹂댁“ ?몃━嫄?
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "MUST_HAVE_SKILL_MISSING");
    if (flag) return true;

    // 蹂댁“ ?몃━嫄??ㅽ깘 諛⑹? ?꾪빐 議곌굔 ?꾧꺽)
    const req = Array.isArray(metrics.requiredSkills) ? metrics.requiredSkills : null;
    const cov = safeNum(metrics.requiredCoverage, null);
    if (!req || req.length === 0) return false;
    if (cov == null) return false;

    // structuralPatterns 湲곕낯媛믪씠 0.5(THRESH.REQUIRED_COVERAGE_LOW) :contentReference[oaicite:2]{index=2}
    return cov < 0.5;
  },

  // score: 0~1
  // - 援ъ“ ?뚮옒洹몄쓽 score瑜??곗꽑 ?ъ슜(?대? coverage 湲곕컲?쇰줈 怨꾩궛?섏뼱 ?덉쓬) :contentReference[oaicite:3]{index=3}
  // - ?뚮옒洹멸? ?놁쑝硫?coverage濡?蹂댁닔?곸쑝濡?怨꾩궛
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "MUST_HAVE_SKILL_MISSING");

    if (flag && Number.isFinite(flag.score)) {
      return _clamp01(flag.score);
    }

    const cov = safeNum(metrics.requiredCoverage, null);
    if (cov == null) return 0;

    // cov媛 0.5 ?꾨옒濡??대젮媛덉닔濡?0.7~1??媛源뚯썙吏寃?(蹂댁닔??
    // ?? cov=0.5 -> 0.7, cov=0.25 -> 0.9, cov=0 -> 1.0
    const s = 0.7 + (0.5 - cov) * 0.6;
    return _clamp01(s);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "MUST_HAVE_SKILL_MISSING");

    // structuralPatterns??detail??requiredSkills/covered/missing/coverage/threshold瑜??ｌ쓬 :contentReference[oaicite:4]{index=4}
    const detail = isObj(flag?.detail) ? flag.detail : {};
    const requiredSkills = _uniq(detail.requiredSkills || metrics.requiredSkills || []);
    const covered = _uniq(detail.covered || metrics.requiredCovered || []);
    const missing = _uniq(detail.missing || []);
    const coverage = safeNum(detail.coverage ?? metrics.requiredCoverage, null);
    const threshold = safeNum(detail.threshold, 0.5);

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    // ?쒖떆?? missing???덈Т 湲몃㈃ 12媛쒓퉴吏留?
    const missingShort = missing.slice(0, 12);
    const coveredShort = covered.slice(0, 12);

    const why = [];
    if (coverage != null) {
      const pct = Math.round(coverage * 100);
      why.push(`JD ?꾩닔(Required/Must)濡?異붿젙???ㅼ썙???鍮??대젰???ы듃?대━??諛섏쁺瑜좎씠 ??뒿?덈떎. (而ㅻ쾭由ъ? ${pct}%)`);
    } else {
      why.push("JD???꾩닔(Required/Must)濡?異붿젙???ㅼ썙?쒓? ?대젰???ы듃?대━?ㅼ뿉 異⑸텇??諛섏쁺?섏? ?딆븯?듬땲??");
    }

    if (missingShort.length) {
      why.push(`?꾨씫 ?꾨낫(?쇰?): ${missingShort.join(", ")}`);
    } else if (requiredSkills.length && coveredShort.length) {
      why.push(`諛섏쁺???ㅼ썙???쇰?): ${coveredShort.join(", ")}`);
    } else if (requiredSkills.length) {
      why.push(`JD ?꾩닔 ?ㅼ썙???쇰?): ${requiredSkills.slice(0, 12).join(", ")}`);
    }

    const fix = [
      "JD???섑븘??Required/?먭꺽?붽굔???쇱씤??洹몃?濡?蹂듭궗?? 媛???ぉ留덈떎 ?섎궡媛 ?덈뜕 ??寃곌낵/?꾧뎄?숇? 1以꾩뵫 遺숈뿬??利앷굅瑜?留뚮뱶?몄슂.",
      "?⑥닚 ?섏뿴???꾨땲?? ?꾨줈?앺듃/寃쏀뿕 bullet ?덉뿉 ?대떦 ?ㅼ썙?쒕? ?섑뻾??????깃낵??臾몄옣?쇰줈 ?먯뿰?ㅻ읇寃??쎌엯?섏꽭??",
      "?뺣쭚 寃쏀뿕???녿떎硫? (1) ?좎궗 寃쏀뿕?쇰줈 ?泥?媛?ν븳吏, (2) 2~4二???怨쇱젣/?ъ씠?쒗봽濡쒖젥?몃줈 利앸튃 媛?ν븳吏, (3) 吏???먯껜瑜?蹂대쪟?좎? 3媛덈옒濡??먮떒?섏꽭??",
    ];

    const notes = [];
    if (requiredSkills.length) notes.push(`?꾩닔 ?ㅼ썙???꾨낫 ?? ${requiredSkills.length}`);
    if (covered.length) notes.push(`諛섏쁺???ㅼ썙???? ${covered.length}`);
    if (missing.length) notes.push(`?꾨씫 ?ㅼ썙???? ${missing.length}`);
    if (coverage != null) notes.push(`而ㅻ쾭由ъ?: ${Math.round(coverage * 100)}% (湲곗? ${Math.round(threshold * 100)}%)`);

    // UI?먯꽌 metrics ?ㅻ줈??李띿쓣 ???덇쾶
    const evidenceKeys = ["requiredSkills", "requiredCovered", "requiredCoverage", "requiredLines"];

    return {
      title: "JD ?꾩닔 ?ㅽ궗/?붽굔 ?꾨씫 由ъ뒪??,
      why,
      fix,
      evidenceKeys,
      notes: evidence.length ? [...notes, ...evidence] : (notes.length ? notes : undefined),
    };
  },

  suppressIf: [],
};
