// src/lib/decision/riskProfiles/gates/hardMustHaveMissingGate.js

export const hardMustHaveMissingGate = {
  id: "GATE__HARD_MUST_HAVE_MISSING",
  group: "gates",
  layer: "gate",
  priority: 99,
  severityBase: 5,
  tags: ["gate", "mustHave"],

  when: () => false,
  score: () => 0.95,

  explain: () => ({
    title: "?꾩닔 ?붽굔 誘몄땐議?,
    why: [
      "JD??紐낆떆???꾩닔 ?붽굔(Must-have) 以??쇰?媛 ?대젰??寃쏀뿕?먯꽌 ?뺤씤?섏? ?딆뒿?덈떎."
    ],
    fix: [
      "?꾩닔 ?붽굔???대떦?섎뒗 援ъ껜???щ?/?깃낵瑜??대젰?쒖뿉 紐낇솗??湲곗옱",
      "?꾩닔 ?붽굔?????곹빀???ъ??섏쑝濡??꾨왂 議곗젙"
    ],
    evidenceKeys: [],
    notes: [],
  }),

  suppressIf: [],
};
