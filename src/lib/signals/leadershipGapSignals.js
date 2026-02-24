// src/lib/signals/leadershipGapSignals.js
// Leadership/Ownership "gap" signals (append-only, pure functions)
// 목적: JD가 요구하는 리드/오너십 레벨 vs 이력서에 드러난 레벨을 비교해 gap 신호를 만든다.
// - decisionScore / riskProfiles에 직접 연결하지 않음 (reportPack.internalSignals 용)
// - 입력 추가 없이 jd/resume 텍스트에서만 추출

function safeStr(x) {
  return typeof x === "string" ? x : x == null ? "" : String(x);
}

function lower(x) {
  return safeStr(x).toLowerCase();
}

function normalizeWhitespace(s) {
  return safeStr(s).replace(/\s+/g, " ").trim();
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const x of arr || []) {
    const k = safeStr(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

// 숫자/단위가 있는지(정량 성과/규모의 간단한 proxy)
function hasQuantSignal(text) {
  const t = safeStr(text);
  // %, 숫자+단위(억/만원/명/건/배/개월/년/주), KPI/OKR 같은 토큰
  return (
    /%/.test(t) ||
    /\b\d+(\.\d+)?\s*(억|천만|만원|원|명|건|배|개월|년|주)\b/.test(t) ||
    /\b(kpi|okr|metric|metrics)\b/i.test(t)
  );
}

// 키워드 hit 수집 (한국어 포함이라 단순 include 기반)
function countHits(textLower, phrases) {
  const hits = [];
  for (const p of phrases || []) {
    const pl = lower(p);
    if (!pl) continue;
    if (textLower.includes(pl)) hits.push(p);
  }
  return hits;
}

// MVP 사전(레벨을 직접 암시하는 것 위주)
const JD_STRONG = [
  "프로젝트 리드",
  "팀 리드",
  "리드",
  "lead",
  "leading",
  "오너십",
  "ownership",
  "책임",
  "의사결정",
  "decision",
  "전략",
  "strategy",
  "총괄",
  "end-to-end",
  "e2e",
  "a to z",
  "stakeholder",
  "cross-functional",
  "조율",
  "조정",
  "매니저",
  "manager",
  "조직",
];

const JD_MEDIUM = [
  "설계",
  "design",
  "개선",
  "improve",
  "고도화",
  "최적화",
  "optimize",
  "자동화",
  "automation",
  "표준화",
  "pipeline",
  "아키텍처",
  "architecture",
  "운영 개선",
];

const JD_WEAK = ["지원", "보조", "assist", "support", "서포트", "참여"];

const RES_STRONG = [
  "주도",
  "리드",
  "총괄",
  "오너십",
  "책임",
  "의사결정",
  "결정",
  "end-to-end",
  "e2e",
  "a to z",
  "런칭",
  "launch",
  "전략",
  "stakeholder",
  "cross-functional",
  "리딩",
  "단독",
  "owner",
];

const RES_MEDIUM = [
  "설계",
  "개선",
  "고도화",
  "최적화",
  "자동화",
  "표준화",
  "구축",
  "정의",
  "운영",
  "프로세스",
  "poc",
  "프로토타입",
];

const RES_WEAK = ["지원", "보조", "참여", "서포트", "assist", "support"];

// level 스케일: 0(낮음) ~ 3(높음)
function levelFromCounts({ strongN, mediumN, weakN, hasQuant }) {
  let lvl = 0;

  if (strongN >= 4) lvl = 3;
  else if (strongN >= 2) lvl = 2;
  else if (strongN >= 1 || mediumN >= 4) lvl = 1;
  else if (mediumN >= 1) lvl = 1;
  else lvl = 0;

  // weak가 많으면 상한 제한(참여/보조 반복이면 리드 설득력 낮음)
  if (weakN >= 6) lvl = Math.min(lvl, 1);
  else if (weakN >= 3) lvl = Math.min(lvl, 2);

  // 정량 근거가 0이면 “리드” 과대평가 방지
  if (!hasQuant && lvl >= 2) lvl = lvl - 1;

  if (lvl < 0) lvl = 0;
  if (lvl > 3) lvl = 3;

  return lvl;
}

function buildSignalsForText(text, dict) {
  const raw = normalizeWhitespace(text);
  const t = lower(raw);

  const strongHits = countHits(t, dict.strong);
  const mediumHits = countHits(t, dict.medium);
  const weakHits = countHits(t, dict.weak);

  const strongN = strongHits.length;
  const mediumN = mediumHits.length;
  const weakN = weakHits.length;

  const quant = hasQuantSignal(raw);
  const level = levelFromCounts({ strongN, mediumN, weakN, hasQuant: quant });

  // 근거는 너무 길어지지 않게 top 일부만
  const hits = uniq([
    ...strongHits.slice(0, 6),
    ...mediumHits.slice(0, 4),
    ...weakHits.slice(0, 4),
  ]);

  return {
    level,
    counts: { strong: strongN, medium: mediumN, weak: weakN },
    hasQuant: quant,
    hits,
  };
}

function buildNotes({ jdSig, resSig }) {
  const notes = [];

  if (jdSig.level >= 2 && resSig.level <= 1) {
    notes.push("JD는 리드/오너십 요구가 강한데, 이력서 근거 신호가 약할 수 있습니다.");
  } else if (jdSig.level <= 1 && resSig.level >= 2) {
    notes.push("이력서에 리드/오너십 신호가 상대적으로 강합니다.");
  }

  if (!resSig.hasQuant && resSig.level >= 1) {
    notes.push("이력서에 정량 근거(%, 규모, 기간)가 거의 없어 설득력이 약해질 수 있습니다.");
  }

  if (resSig.counts.weak >= 3) {
    notes.push("‘참여/지원’ 성격 표현이 반복되면 리드 역할로 해석되기 어려울 수 있습니다.");
  }

  return notes.slice(0, 3);
}

// ✅ 외부에서 호출할 메인 함수
export function buildLeadershipGapSignals({ jdText, resumeText }) {
  const jdSig = buildSignalsForText(jdText, {
    strong: JD_STRONG,
    medium: JD_MEDIUM,
    weak: JD_WEAK,
  });

  const resSig = buildSignalsForText(resumeText, {
    strong: RES_STRONG,
    medium: RES_MEDIUM,
    weak: RES_WEAK,
  });

  const gap = jdSig.level - resSig.level;

  return {
    jdLevel: jdSig.level,
    resumeLevel: resSig.level,
    gap,
    jdSignals: {
      strong: jdSig.counts.strong,
      medium: jdSig.counts.medium,
      weak: jdSig.counts.weak,
      hasQuant: jdSig.hasQuant,
      hits: jdSig.hits,
    },
    resumeSignals: {
      strong: resSig.counts.strong,
      medium: resSig.counts.medium,
      weak: resSig.counts.weak,
      hasQuant: resSig.hasQuant,
      hits: resSig.hits,
    },
    notes: buildNotes({ jdSig, resSig }),
  };
}