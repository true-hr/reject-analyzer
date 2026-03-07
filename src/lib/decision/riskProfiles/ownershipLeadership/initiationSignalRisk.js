// src/lib/decision/riskProfiles/ownershipLeadership/initiationSignalRisk.js
// 프로젝트 주도/Initiation 신호 부족 리스크
// - structuralPatterns의 NO_PROJECT_INITIATION_PATTERN 플래그를 profile로 승격

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

// PATCH(A): context-based impact (append-only)
function _clamp(x, min, max) {
  const n = safeNum(x, null);
  if (n === null) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

function _getCtxState(ctx) {
  const c = isObj(ctx) ? ctx : {};
  const st = isObj(c.state) ? c.state : (isObj(c.ctxState) ? c.ctxState : null);
  return isObj(st) ? st : {};
}

function _normSizeCode(v) {
  const s = safeStr(v).trim().toLowerCase();
  if (!s) return "unknown";
  if (s === "startup") return "startup";
  if (s === "smb" || s === "small" || s === "smallbiz") return "smb";
  if (s === "mid" || s === "midmarket") return "mid";
  if (s === "large" || s === "enterprise") return "large";
  if (s === "public" || s === "gov" || s === "government") return "public";
  return "unknown";
}

function _normJobFamily(v) {
  const s = safeStr(v).trim().toLowerCase();
  if (!s) return "unknown";

  // rough v1 buckets
  if (s.includes("strategy") || s.includes("biz") || s.includes("business") || s.includes("기획") || s.includes("전략")) return "strategy";
  if (s.includes("product") || s.includes("pm") || s.includes("po")) return "product";
  if (s.includes("sales") || s.includes("영업")) return "sales";
  if (s.includes("data") || s.includes("analytics") || s.includes("분석")) return "data";
  if (s.includes("engineer") || s.includes("dev") || s.includes("개발")) return "engineering";
  if (s.includes("finance") || s.includes("hr") || s.includes("인사") || s.includes("재무")) return "finance/hr";
  if (s.includes("ops") || s.includes("operation") || s.includes("support") || s.includes("운영") || s.includes("지원")) return "ops/support";

  return "unknown";
}

function _normLeadershipLevel(v) {
  const s = safeStr(v).trim().toUpperCase();
  if (!s) return "IC";
  if (s.includes("LEAD") || s.includes("MGR") || s.includes("MANAGER") || s.includes("HEAD")) return "LEAD";
  return "IC";
}

function _mapImportanceToLevel(w) {
  const n = safeNum(w, 1.0);
  if (n >= 1.15) return "높음";
  if (n <= 0.84) return "낮음";
  return "중간";
}

function _computeInitiationImportance(ctx) {
  const st = _getCtxState(ctx);

  const size = _normSizeCode(st.companySizeCode || st.companySize || st.targetCompanySizeCode || st.targetCompanySize);
  const job = _normJobFamily(st.jobFamily || st.roleFamily || st.jobGroup || st.jobType || st.targetJobFamily);
  const lvl = _normLeadershipLevel(st?.career?.leadershipLevel || st.level || st.roleLevel);

  const sizeW =
    size === "startup" ? 0.25 :
      size === "smb" ? 0.15 :
        size === "mid" ? 0 :
          size === "large" ? -0.2 :
            size === "public" ? -0.35 :
              0;

  const jobW =
    job === "strategy" ? 0.3 :
      job === "product" ? 0.25 :
        job === "sales" ? 0.2 :
          job === "data" ? 0.1 :
            job === "engineering" ? 0 :
              job === "finance/hr" ? -0.05 :
                job === "ops/support" ? -0.3 :
                  0;

  const lvlW = lvl === "LEAD" ? 0.1 : 0;

  let w = 1.0 + sizeW + jobW + lvlW;
  w = _clamp(w, 0.5, 1.3);

  const level = _mapImportanceToLevel(w);

  const reasons = [
    `companySize: ${size}`,
    `jobFamily: ${job}`,
    `level: ${lvl === "LEAD" ? "LEAD/MANAGER" : "IC"}`
  ];

  return { weight: w, level, reasons };
}
// ✅ export 이름 반드시 initiationSignalRisk 여야 함
export const initiationSignalRisk = {

  id: "OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL",

  group: "ownershipLeadership",

  layer: "hireability",

  priority: 92,

  severityBase: 4,

  tags: ["ownership", "initiation", "leadership"],


  when: (ctx) => {
    // ownershipExpected=false인 직무에서는 발화하지 않음
    if (ctx?.competencyExpectation?.ownershipExpected !== true) return false;
    if (typeof ctx?.__hasRisk === "function" && ctx.__hasRisk("RISK__OWNERSHIP_LEADERSHIP_GAP")) {
      return false;
    }

    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_PROJECT_INITIATION_PATTERN");

    if (flag) return true;

    // fallback: initiationHits metric 기반
    const hits =
      Array.isArray(metrics.projectInitiationHits)
        ? metrics.projectInitiationHits
        : null;

    if (!hits) return false;

    return hits.length === 0;
  },


  score: (ctx) => {

    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "NO_PROJECT_INITIATION_PATTERN");

    if (flag && Number.isFinite(flag.score))
      return _clamp01(flag.score);

    const hits =
      Array.isArray(metrics.projectInitiationHits)
        ? metrics.projectInitiationHits
        : null;

    if (!hits || hits.length === 0)
      return 0.85;

    if (hits.length === 1)
      return 0.55;

    return 0.15;
  },


  explain: (ctx) => {

    const { flags, metrics } = _getStructural(ctx);

    const flag =
      _findFlag(flags, "NO_PROJECT_INITIATION_PATTERN");

    const detail =
      isObj(flag?.detail)
        ? flag.detail
        : {};

    const hits =
      _uniq(
        detail.hits ||
        metrics.projectInitiationHits ||
        []
      );

    const why = [

      "이력서에서 '내가 시작한 프로젝트' 또는 '내가 주도적으로 만든 변화' 신호가 거의 보이지 않습니다.",

      "채용자는 단순 수행자보다 문제를 정의하고 시작할 수 있는 사람을 선호합니다.",

    ];

    if (hits.length)
      why.push(
        `감지된 initiation 신호(일부): ${hits.slice(0, 10).join(", ")}`
      );


    const fix = [

      "각 프로젝트마다 '누가 시작했는가'를 명확히 쓰세요.",

      "예: '요청을 받아 진행' 대신 → '문제 발견 후 개선 프로젝트 시작'",

      "내가 initiative를 가진 부분을 최소 1개 이상 명시하세요.",

    ];


    const notes = [];

    notes.push(
      `projectInitiationHits: ${hits.length}`
    );

    if (hits.length)
      notes.push(
        `hits(sample): ${hits.slice(0, 10).join(", ")}`
      );


    const evidenceKeys =
      ["projectInitiationHits"];
    const __imp = _computeInitiationImportance(ctx);

    const title =
      flag?.title
        ? `프로젝트 Initiation 리스크: ${safeStr(flag.title)}`
        : "프로젝트 시작/주도 신호 부족 리스크";


    return {

      title,

      why,

      fix,

      evidenceKeys,

      notes,
      importanceWeight: __imp.weight,
      impactLevel: __imp.level,
      impactReasons: __imp.reasons,
    };
  },


  suppressIf: [],

};
