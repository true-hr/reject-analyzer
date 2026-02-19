// src/lib/decision/riskProfiles/timeline/timelineRisk.js
// timelineRisk: structuralPatterns의 Category A(타임라인) flags를 "리스크 프로필"로 해석합니다.
// ✅ crash-safe: ctx 구조가 달라도 최대한 안전하게 동작하도록 방어적으로 작성

function safeNum(v, fallback = null) {
  return Number.isFinite(v) ? v : fallback;
}

function safeStr(v, fallback = "") {
  try {
    const s = (v ?? "").toString();
    return s;
  } catch {
    return fallback;
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * ctx에서 structuralPatterns 결과를 최대한 안전하게 꺼냅니다.
 * 지원 형태(둘 다 커버):
 * 1) ctx.structural = { flags: [], metrics: {}, summary: {} }   (권장)
 * 2) ctx.flags/ctx.metrics 같은 낱개 필드
 */
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

  const summary =
    (structural && isObj(structural.summary) ? structural.summary : null) ||
    (isObj(c.summary) ? c.summary : {}) ||
    {};

  return { flags, metrics, summary };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;
  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _maxScore01(...vals) {
  let m = 0;
  for (const v of vals) {
    const n = safeNum(v, null);
    if (n == null) continue;
    if (n > m) m = n;
  }
  // 0~1 범위로만 강제(여기서는 clamp 없이 안전하게)
  if (m < 0) return 0;
  if (m > 1) return 1;
  return m;
}

function _severityRank(sev) {
  const s = safeStr(sev).toLowerCase();
  if (s === "critical") return 4;
  if (s === "high") return 3;
  if (s === "mid") return 2;
  if (s === "low") return 1;
  return 0;
}

function _pickTopEvidence(flagObj, max = 3) {
  const arr = flagObj && Array.isArray(flagObj.evidence) ? flagObj.evidence : [];
  return arr.filter(Boolean).slice(0, max);
}

export const timelineRisk = {
  id: "TIMELINE_INSTABILITY_RISK",
  group: "timeline",
  layer: "hireability",
  priority: 85,
  severityBase: 4,
  tags: ["timeline", "careerTrajectory"],

  // 트리거: structuralPatterns의 타임라인 플래그 중 하나라도 있으면 발동
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    // careerHistory 없으면 structuralPatterns 자체가 타임라인 감지를 스킵하는 설계라서
    // 여기서도 굳이 강제 발동하지 않음(오탐 방지)
    const has = !!metrics.hasCareerHistory;
    if (!has) return false;

    const f1 = _findFlag(flags, "HIGH_SWITCH_PATTERN");
    const f2 = _findFlag(flags, "EXTREME_JOB_HOPPING_PATTERN");
    const f3 = _findFlag(flags, "FREQUENT_INDUSTRY_SWITCH_PATTERN");
    return !!(f1 || f2 || f3);
  },

  // score: 0~1
  // - 구조패턴 플래그 score가 이미 0~1로 들어오므로 이를 최대값/가중으로 조합
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const highSwitch = _findFlag(flags, "HIGH_SWITCH_PATTERN");
    const extremeHop = _findFlag(flags, "EXTREME_JOB_HOPPING_PATTERN");
    const indSwitch = _findFlag(flags, "FREQUENT_INDUSTRY_SWITCH_PATTERN");

    // base: 플래그 점수 기반
    const s1 = safeNum(highSwitch?.score, 0);
    const s2 = safeNum(extremeHop?.score, 0);
    const s3 = safeNum(indSwitch?.score, 0);

    // extreme hopping은 해석상 강도가 더 크니 약간 가중
    const boosted = _maxScore01(s1, s2 * 1.1, s3);

    // avgTenureMonths가 매우 낮으면(예: 12 미만) 추가로 조금 올림 (지표는 computeStructuralMetrics에 존재)
    const avg = safeNum(metrics.avgTenureMonths, null);
    let bump = 0;
    if (avg != null) {
      if (avg < 12) bump += 0.12;
      else if (avg < 18) bump += 0.06;
    }

    const out = boosted + bump;
    if (out < 0) return 0;
    if (out > 1) return 1;
    return out;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const highSwitch = _findFlag(flags, "HIGH_SWITCH_PATTERN");
    const extremeHop = _findFlag(flags, "EXTREME_JOB_HOPPING_PATTERN");
    const indSwitch = _findFlag(flags, "FREQUENT_INDUSTRY_SWITCH_PATTERN");

    const avg = safeNum(metrics.avgTenureMonths, null);
    const sw = safeNum(metrics.industrySwitches, null);
    const ex = isObj(metrics.extremeJobHopping) ? metrics.extremeJobHopping : null;

    // 가장 강한 플래그를 “대표 근거”로 선정
    const candidates = [highSwitch, extremeHop, indSwitch].filter(Boolean);
    candidates.sort((a, b) => {
      const ra = _severityRank(a.severity);
      const rb = _severityRank(b.severity);
      if (rb !== ra) return rb - ra;
      const sa = safeNum(a.score, 0);
      const sb = safeNum(b.score, 0);
      return sb - sa;
    });

    const top = candidates[0] || null;

    const why = [];
    if (highSwitch) {
      why.push("평균 재직기간이 짧게 나타납니다(조기 이탈/적응 실패로 해석될 수 있음).");
    }
    if (extremeHop) {
      why.push("최근 경력에서 1년 미만 재직이 반복됩니다(‘버티지 못함’ 시그널로 읽힐 가능성).");
    }
    if (indSwitch) {
      why.push("산업 변경이 잦습니다(도메인 축적/재현성에 대한 의심이 생길 수 있음).");
    }

    // 숫자 근거 문장(가능하면)
    const notes = [];
    if (avg != null) notes.push(`평균 재직기간(월): ${Math.round(avg * 10) / 10}`);
    if (ex && Number.isFinite(ex.shortCount) && Number.isFinite(ex.considered)) {
      notes.push(`최근 ${ex.considered}개 중 1년 미만: ${ex.shortCount}개`);
    }
    if (sw != null) notes.push(`산업 변경 횟수(추정): ${sw}`);

    const fix = [
      "이직 사유를 ‘환경’이 아니라 ‘역할/성과 관점’으로 2문장 구조로 정리하세요. (문제→내가 한 일→성과/배운 점)",
      "최근 1~2개 경력은 ‘왜 남을 이유가 없었는지’보다 ‘왜 떠나도 성과가 남는지(결과물/지표)’를 먼저 제시하세요.",
      "산업 전환이 있다면 ‘이전 도메인에서 쌓은 역량이 다음 도메인에서 그대로 재현되는 근거(툴/프로세스/지표)’를 3개로 고정하세요.",
    ];

    // evidenceKeys는 structural.metrics 기반으로 UI에서 찍기 쉽게
    const evidenceKeys = [
      "avgTenureMonths",
      "extremeJobHopping",
      "industrySwitches",
      "hasCareerHistory",
    ];

    // flag.evidence는 타임라인 패턴에서는 빈 배열이라(설계상) 대신 notes에 수치 근거를 넣음
    // 그래도 혹시 evidence가 있으면 같이 보여주기
    const extraEvidence = top ? _pickTopEvidence(top, 3) : [];

    const title = top?.title
      ? `커리어 타임라인 리스크: ${safeStr(top.title)}`
      : "커리어 타임라인 리스크";

    const mergedNotes = [...notes];
    for (const e of extraEvidence) mergedNotes.push(e);

    return {
      title,
      why: why.length ? why : ["커리어 타임라인에서 안정성 신호가 약하게 감지됩니다."],
      fix,
      evidenceKeys,
      notes: mergedNotes.length ? mergedNotes : undefined,
    };
  },

  // suppressIf는 일단 비워두는 게 안전(초기엔 숨김 규칙 때문에 “안 보이는” 문제가 생길 수 있음)
  suppressIf: [],
};
