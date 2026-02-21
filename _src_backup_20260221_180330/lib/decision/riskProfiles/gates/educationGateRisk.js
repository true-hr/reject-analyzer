// src/lib/decision/riskProfiles/gates/educationGateRisk.js
// EDUCATION_GATE_FAIL gate

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeStr(v) {
  try { return (v ?? "").toString(); }
  catch { return ""; }
}

function _getStructural(ctx) {

  const structural =
    isObj(ctx?.structural)
      ? ctx.structural
      : null;

  return {

    flags:
      structural?.flags ||
      ctx?.flags ||
      [],

    metrics:
      structural?.metrics ||
      ctx?.metrics ||
      {},

  };
}

function _findFlag(flags, id) {

  if (!Array.isArray(flags))
    return null;

  for (const f of flags) {

    if (!f) continue;

    if (safeStr(f.id) === id)
      return f;
  }

  return null;
}


export const educationGateRisk = {

  id: "GATE__EDUCATION_GATE_FAIL",

  group: "gates",

  layer: "gate",

  priority: 98,

  severityBase: 5,

  tags: ["gate", "education"],


  when: (ctx) => {

    const { flags, metrics } =
      _getStructural(ctx);

    const flag =
      _findFlag(flags, "EDUCATION_GATE_FAIL");

    if (flag)
      return true;

    return !!metrics.educationGateFail;
  },


  score: () => 0.95,


  explain: () => ({

    title: "?숇젰 Gate 議곌굔 誘몄땐議?,

    why: [

      "?대떦 ?ъ??섏? ?숇젰 Gate媛 ?곸슜?섎뒗 吏곷Т??媛?μ꽦???믪뒿?덈떎.",

      "??寃쎌슦 ?쒕쪟 寃???댁쟾 ?④퀎?먯꽌 ?꾪꽣留곷맆 ???덉뒿?덈떎.",

    ],

    fix: [

      "?숇젰 議곌굔???녿뒗 湲곗뾽 ?먮뒗 吏곷Т濡??꾨왂 ?섏젙",

      "寃쎈젰 湲곕컲 吏곷Т濡?吏??諛⑺뼢 ?꾪솚",

      "?ы듃?대━??以묒떖 梨꾩슜 ?뚯궗濡??寃?蹂寃?,

    ],

    evidenceKeys: [],

    notes: [],

  }),

  suppressIf: [],

};
