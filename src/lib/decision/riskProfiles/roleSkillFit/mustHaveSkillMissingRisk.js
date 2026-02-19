// src/lib/decision/riskProfiles/roleSkillFit/mustHaveSkillMissingRisk.js
// JD must-have(필수) 커버리지 낮음 리스크
// - structuralPatterns의 MUST_HAVE_SKILL_MISSING 플래그를 decision 리스크 프로필로 승격
// - crash-safe: ctx 형태가 달라도 최대한 안전하게 동작

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

  // 트리거: structuralPatterns가 MUST_HAVE_SKILL_MISSING을 찍었을 때
  // (또는 metrics 상 requiredSkills가 있고 requiredCoverage가 낮을 때—플래그 없더라도 보조 트리거)
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "MUST_HAVE_SKILL_MISSING");
    if (flag) return true;

    // 보조 트리거(오탐 방지 위해 조건 엄격)
    const req = Array.isArray(metrics.requiredSkills) ? metrics.requiredSkills : null;
    const cov = safeNum(metrics.requiredCoverage, null);
    if (!req || req.length === 0) return false;
    if (cov == null) return false;

    // structuralPatterns 기본값이 0.5(THRESH.REQUIRED_COVERAGE_LOW) :contentReference[oaicite:2]{index=2}
    return cov < 0.5;
  },

  // score: 0~1
  // - 구조 플래그의 score를 우선 사용(이미 coverage 기반으로 계산되어 있음) :contentReference[oaicite:3]{index=3}
  // - 플래그가 없으면 coverage로 보수적으로 계산
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "MUST_HAVE_SKILL_MISSING");

    if (flag && Number.isFinite(flag.score)) {
      return _clamp01(flag.score);
    }

    const cov = safeNum(metrics.requiredCoverage, null);
    if (cov == null) return 0;

    // cov가 0.5 아래로 내려갈수록 0.7~1에 가까워지게 (보수적)
    // 예: cov=0.5 -> 0.7, cov=0.25 -> 0.9, cov=0 -> 1.0
    const s = 0.7 + (0.5 - cov) * 0.6;
    return _clamp01(s);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "MUST_HAVE_SKILL_MISSING");

    // structuralPatterns는 detail에 requiredSkills/covered/missing/coverage/threshold를 넣음 :contentReference[oaicite:4]{index=4}
    const detail = isObj(flag?.detail) ? flag.detail : {};
    const requiredSkills = _uniq(detail.requiredSkills || metrics.requiredSkills || []);
    const covered = _uniq(detail.covered || metrics.requiredCovered || []);
    const missing = _uniq(detail.missing || []);
    const coverage = safeNum(detail.coverage ?? metrics.requiredCoverage, null);
    const threshold = safeNum(detail.threshold, 0.5);

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    // 표시용: missing이 너무 길면 12개까지만
    const missingShort = missing.slice(0, 12);
    const coveredShort = covered.slice(0, 12);

    const why = [];
    if (coverage != null) {
      const pct = Math.round(coverage * 100);
      why.push(`JD 필수(Required/Must)로 추정된 키워드 대비 이력서/포트폴리오 반영률이 낮습니다. (커버리지 ${pct}%)`);
    } else {
      why.push("JD의 필수(Required/Must)로 추정된 키워드가 이력서/포트폴리오에 충분히 반영되지 않았습니다.");
    }

    if (missingShort.length) {
      why.push(`누락 후보(일부): ${missingShort.join(", ")}`);
    } else if (requiredSkills.length && coveredShort.length) {
      why.push(`반영된 키워드(일부): ${coveredShort.join(", ")}`);
    } else if (requiredSkills.length) {
      why.push(`JD 필수 키워드(일부): ${requiredSkills.slice(0, 12).join(", ")}`);
    }

    const fix = [
      "JD의 ‘필수/Required/자격요건’ 라인을 그대로 복사해, 각 항목마다 ‘내가 했던 일/결과/도구’를 1줄씩 붙여서 증거를 만드세요.",
      "단순 나열이 아니라, 프로젝트/경험 bullet 안에 해당 키워드를 ‘행동+대상+성과’ 문장으로 자연스럽게 삽입하세요.",
      "정말 경험이 없다면: (1) 유사 경험으로 대체 가능한지, (2) 2~4주 내 과제/사이드프로젝트로 증빙 가능한지, (3) 지원 자체를 보류할지 3갈래로 판단하세요.",
    ];

    const notes = [];
    if (requiredSkills.length) notes.push(`필수 키워드 후보 수: ${requiredSkills.length}`);
    if (covered.length) notes.push(`반영된 키워드 수: ${covered.length}`);
    if (missing.length) notes.push(`누락 키워드 수: ${missing.length}`);
    if (coverage != null) notes.push(`커버리지: ${Math.round(coverage * 100)}% (기준 ${Math.round(threshold * 100)}%)`);

    // UI에서 metrics 키로도 찍을 수 있게
    const evidenceKeys = ["requiredSkills", "requiredCovered", "requiredCoverage", "requiredLines"];

    return {
      title: "JD 필수 스킬/요건 누락 리스크",
      why,
      fix,
      evidenceKeys,
      notes: evidence.length ? [...notes, ...evidence] : (notes.length ? notes : undefined),
    };
  },

  suppressIf: [],
};
