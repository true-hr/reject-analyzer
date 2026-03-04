// src/lib/decision/index.js
// NOTE: decision ?덉씠???뷀듃由?
// - structuralPatterns 寃곌낵 + riskProfiles 寃곌낵瑜?紐⑥븘 decisionPack ?앹꽦

import { ALL_PROFILES } from "./riskProfiles/index.js";
import { computeStructuralDecisionPressure, mergeDecisionPressures } from "./decisionPressure.js";
import { SIMPLE_RISK_PROFILES } from "./simpleRiskProfiles";
import { evaluateHiddenRiskV11 } from "../hiddenRisk/v11Stable";
// ==============================
// [PATCH] Gate normalization + gate->pressure boost (append-only)
// ==============================
function __num_safe(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function __clamp(v, lo, hi) {
  const n = __num_safe(v, lo);
  if (n < lo) return lo;
  if (n > hi) return hi;
  return n;
}
function __t(v) {
  return v == null ? "" : String(v);
}
function __normalizeGateId(id) {
  const s = __t(id);
  if (!s) return "";
  if (s.startsWith("GATE__")) return s;
  // 기존 혼재 케이스 흡수(최소)
  if (s === "ageGateRisk") return "GATE__AGE";
  // 필요시 여기 계속 append-only로 매핑 추가
  return s;
}
function __normalizeRiskItem(r) {
  const o = r && typeof r === "object" ? r : {};
  const id = __t(o.id);
  const group = __t(o.group);
  const layer = __t(o.layer);

  const isGate =
    layer === "gate" ||
    group === "gate" ||
    group === "gates" ||
    id.startsWith("GATE__") ||
    id === "ageGateRisk";

  if (!isGate) return o;

  const nid = __normalizeGateId(id);
  // ------------------------------
  // [PATCH] gate priority auto-derive from score (append-only)
  // - priority가 0/비어있으면 score 기반으로 0~100 산정
  // - 기존에 priority를 명시한 gate(예: 97/98/99)는 그대로 유지
  // ------------------------------
  const __rawPriority = __clamp(o.priority, 0, 100);

  // score가 0~1 또는 0~100 혼재 가능성 흡수
  const __rawScoreNum = __num_safe(o.score, 0);
  const __score01 =
    __rawScoreNum <= 1 ? __clamp(__rawScoreNum, 0, 1) : __clamp(__rawScoreNum / 100, 0, 1);
  const __derivedPriority = Math.round(__score01 * 100);

  // priority가 사실상 0이면(또는 비정상) score로 보정
  const __gatePriorityFinal =
    __rawPriority > 0 ? __rawPriority : __derivedPriority;
  // gate 스펙 강제(엔진 메타는 gate로 정직하게 유지)
  return {
    ...o,
    id: nid || id,
    group: "gates",
    layer: "gate",
    priority: __gatePriorityFinal,
    severityTier: __t(o.severityTier) || (__gatePriorityFinal >= 85 ? "S" : "A"),
    gateTriggered: true,
  };
}
function __normalizeRiskResults(list) {
  const arr = Array.isArray(list) ? list : [];
  const normalized = arr.map((o) => {
    const n = __normalizeRiskItem(o);
    try {
      const om = o && o.meta && typeof o.meta === "object" ? o.meta : null;
      if (om && n && typeof n === "object") {
        const nm = n.meta && typeof n.meta === "object" ? n.meta : null;
        if (!nm) return { ...n, meta: om };
        // ✅ merge: 원본(meta) 보존 + normalize(meta)도 유지 (normalize meta 우선)
        return { ...n, meta: { ...om, ...nm } };
      }
    } catch { }
    return n;
  });
  // [PATCH] ensure title exists for UI/report (append-only)
  // [PATCH] ensure title + explain arrays exist for UI/report (append-only)
  return normalized.map((r) => {
    if (!r) return r;

    let next = r;

    // (1) title 보정
    if (!__t(next.title)) {
      const et = __t(next?.explain?.title);
      const idt = __t(next?.id);
      if (et) next = { ...next, title: et };
      else if (idt) next = { ...next, title: idt };
    }

    // (2) explain 배열 보정 (UI 크래시 방지)
    const ex = next?.explain;
    const exIsObj = !!ex && typeof ex === "object" && !Array.isArray(ex);

    const needExplainFix =
      !exIsObj ||
      !Array.isArray(ex?.why) ||
      !Array.isArray(ex?.signals) ||
      !Array.isArray(ex?.action) ||
      !Array.isArray(ex?.counter);

    if (needExplainFix) {
      const safeEx = exIsObj ? ex : {};
      next = {
        ...next,
        explain: {
          ...safeEx,
          why: Array.isArray(safeEx.why) ? safeEx.why : [],
          signals: Array.isArray(safeEx.signals) ? safeEx.signals : [],
          action: Array.isArray(safeEx.action) ? safeEx.action : [],
          counter: Array.isArray(safeEx.counter) ? safeEx.counter : [],
        },
      };
    }

    return next;
  });
}
/* =========================
   [PART-1] helper (top-level, append-only)
   - 표시용 priority만 소폭 보정
   - gate(layer==="gate")는 절대 건드리지 않음
   - selfCheck 신/구 스키마 모두 지원
   - NOTE: 기존에 __computeGatePressureBoost 내부에 중첩 정의된 동일 함수가 있으나,
           호출 스코프 문제로 실행이 안 될 수 있어 top-level로 보강(append-only)
========================= */
function __applySelfCheckPriorityAdjustForUI(riskResults, selfCheck) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  const sc = selfCheck || {};

  // 신스키마: selfCheck.doc.axes.{logic,roleFit,evidence,expression,consistency,tailoring}
  const docAxes = (sc && sc.doc && sc.doc.axes && typeof sc.doc.axes === "object") ? sc.doc.axes : null;

  // 구스키마 fallback: coreFit/roleClarity/proofStrength/storyConsistency/cultureFit
  function getAxis(key, fallbackKey) {
    const v1 = docAxes ? docAxes[key] : undefined;
    const v2 = fallbackKey ? sc[fallbackKey] : undefined;
    const n = Number(v1 ?? v2);
    return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3;
  }

  const ax_logic = getAxis("logic", "storyConsistency");          // 기본 논리 (fallback: storyConsistency)
  const ax_role = getAxis("roleFit", "roleClarity");             // 직무 적합 (fallback: roleClarity)
  const ax_ev = getAxis("evidence", "proofStrength");            // 증거 강도 (fallback: proofStrength)
  const ax_expr = getAxis("expression", null);                   // 표현력 (fallback 없음)
  const ax_cons = getAxis("consistency", "storyConsistency");    // 스토리 일관 (fallback: storyConsistency)
  const ax_tail = getAxis("tailoring", "cultureFit");            // 맞춤도 (fallback: cultureFit)



  function deltaByAxis(axisV, wLow = 8, wHigh = -3) {
    if (axisV <= 2) return wLow;
    if (axisV >= 4) return wHigh;
    return 0;
  }

  function safeStr(v) {
    try { return String(v || ""); } catch { return ""; }
  }

  function clampPriority(p) {
    const n = Number(p);
    const v = Number.isFinite(n) ? n : 0;
    return Math.max(0, Math.min(100, v));
  }

  return arr.map((r) => {
    if (!r || typeof r !== "object") return r;

    // ✅ gate는 절대 손대지 않음
    if (safeStr(r.layer).toLowerCase() === "gate") return r;

    const id = safeStr(r.id).toUpperCase();
    let d = 0;

    // 증거 강도 낮으면: 정량/성과/검증 계열을 위로
    if (ax_ev <= 2) {
      if (id.includes("METRIC") || id.includes("QUANT") || id.includes("NUMBER") || id.includes("IMPACT")) {
        d += deltaByAxis(ax_ev, 10, -3);
      }
    }

    // 기본 논리/일관성 낮으면: 커리어 논리/스토리 계열을 위로
    if (ax_logic <= 2 || ax_cons <= 2) {
      if (id.includes("CAREER") || id.includes("LOGIC") || id.includes("STORY") || id.includes("CONSIST")) {
        d += Math.max(deltaByAxis(ax_logic, 7, -2), deltaByAxis(ax_cons, 7, -2));
      }
    }

    // 직무 적합 낮으면: 역할/스킬/JD 핏 + DOMAIN/SHIFT 계열을 위로
    if (ax_role <= 2) {
      if (
        id.includes("ROLE") ||
        id.includes("FIT") ||
        id.includes("SKILL") ||
        id.includes("JD") ||
        id.includes("DOMAIN") ||
        id.includes("SHIFT")
      ) {
        d += deltaByAxis(ax_role, 7, -2);
      }
    }

    // 표현력 낮으면: 문서/구조/가독성 계열을 위로
    if (ax_expr <= 2) {
      if (id.includes("WRIT") || id.includes("CLAR") || id.includes("STRUCT") || id.includes("READ")) {
        d += deltaByAxis(ax_expr, 6, -2);
      }
    }

    // 맞춤도 낮으면: 회사/문화/테일러링 계열을 위로
    if (ax_tail <= 2) {
      if (id.includes("TAILOR") || id.includes("COMPANY") || id.includes("CULTURE") || id.includes("ORG")) {
        d += deltaByAxis(ax_tail, 6, -2);
      }
    }

    if (!d) return r;

    return {
      ...r,
      priority: clampPriority((r.priority ?? 0) + d),
      meta: { ...(r.meta || {}), __selfCheckBoost: d },
    };
  });
}

// gate priority 기반 pressure boost (상한 포함)
function __computeGatePressureBoost(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  let maxP = 0;
  for (const r of arr) {
    if (!r) continue;
    if (__t(r.layer) !== "gate") continue;
    const p = __clamp(r.priority, 0, 100);
    if (p > maxP) maxP = p;
  }
  /* =========================
     [PART-1] helper 추가 (append-only)
     - 표시용 priority만 소폭 보정
     - gate(layer==="gate")는 절대 건드리지 않음
     - selfCheck 신/구 스키마 모두 지원
  ========================= */
  function __applySelfCheckPriorityAdjustForUI(riskResults, selfCheck) {
    const arr = Array.isArray(riskResults) ? riskResults : [];
    const sc = selfCheck || {};

    // 신스키마: selfCheck.doc.axes.{logic,roleFit,evidence,expression,consistency,tailoring}
    const docAxes = (sc && sc.doc && sc.doc.axes && typeof sc.doc.axes === "object") ? sc.doc.axes : null;

    // 구스키마 fallback: coreFit/roleClarity/proofStrength/storyConsistency/cultureFit
    function getAxis(key, fallbackKey) {
      const v1 = docAxes ? docAxes[key] : undefined;
      const v2 = fallbackKey ? sc[fallbackKey] : undefined;
      const n = Number(v1 ?? v2);
      return Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 3;
    }

    const ax_logic = getAxis("logic", "storyConsistency");          // 기본 논리 (fallback: storyConsistency)
    const ax_role = getAxis("roleFit", "roleClarity");             // 직무 적합 (fallback: roleClarity)
    const ax_ev = getAxis("evidence", "proofStrength");          // 증거 강도 (fallback: proofStrength)
    const ax_expr = getAxis("expression", null);                   // 표현력 (fallback 없음)
    const ax_cons = getAxis("consistency", "storyConsistency");    // 스토리 일관 (fallback: storyConsistency)
    const ax_tail = getAxis("tailoring", "cultureFit");            // 맞춤도 (fallback: cultureFit)

    function deltaByAxis(axisV, wLow = 8, wHigh = -3) {
      if (axisV <= 2) return wLow;
      if (axisV >= 4) return wHigh;
      return 0;
    }

    function safeStr(v) {
      try { return String(v || ""); } catch { return ""; }
    }

    function clampPriority(p) {
      const n = Number(p);
      const v = Number.isFinite(n) ? n : 0;
      return Math.max(0, Math.min(100, v));
    }

    return arr.map((r) => {
      if (!r || typeof r !== "object") return r;

      // ✅ gate는 절대 손대지 않음
      if (safeStr(r.layer).toLowerCase() === "gate") return r;

      const id = safeStr(r.id).toUpperCase();

      let d = 0;

      // 증거 강도 낮으면: 정량/성과/검증 계열을 위로
      if (ax_ev <= 2) {
        if (id.includes("METRIC") || id.includes("QUANT") || id.includes("NUMBER") || id.includes("IMPACT")) {
          d += deltaByAxis(ax_ev, 10, -3);
        }
      }

      // 기본 논리/일관성 낮으면: 커리어 논리/스토리 계열을 위로
      if (ax_logic <= 2 || ax_cons <= 2) {
        if (id.includes("CAREER") || id.includes("LOGIC") || id.includes("STORY") || id.includes("CONSIST")) {
          d += Math.max(deltaByAxis(ax_logic, 7, -2), deltaByAxis(ax_cons, 7, -2));
        }
      }

      // 직무 적합 낮으면: 역할/스킬/JD 핏 계열을 위로
      if (ax_role <= 2) {
        if (
          id.includes("ROLE") ||
          id.includes("FIT") ||
          id.includes("SKILL") ||
          id.includes("JD") ||
          id.includes("DOMAIN") ||
          id.includes("SHIFT")
        ) {
          d += deltaByAxis(ax_role, 7, -2);
        }
      }

      // 표현력 낮으면: 문서/구조/가독성 계열을 위로
      if (ax_expr <= 2) {
        if (id.includes("WRIT") || id.includes("CLAR") || id.includes("STRUCT") || id.includes("READ")) {
          d += deltaByAxis(ax_expr, 6, -2);
        }
      }

      // 맞춤도 낮으면: 회사/문화/테일러링 계열을 위로
      if (ax_tail <= 2) {
        if (id.includes("TAILOR") || id.includes("COMPANY") || id.includes("CULTURE") || id.includes("ORG")) {
          d += deltaByAxis(ax_tail, 6, -2);
        }
      }

      if (!d) return r;

      return {
        ...r,
        priority: clampPriority((r.priority ?? 0) + d),
        // meta는 append-only로 남겨도 되고, 싫으면 아래 줄 삭제해도 OK
        meta: { ...(r.meta || {}), __selfCheckBoost: d },
      };
    });
  }

  // 단계형(현실적인 급락 반영)
  let boost = 0;
  if (maxP >= 95) boost = 0.35;
  else if (maxP >= 85) boost = 0.25;
  else if (maxP >= 70) boost = 0.15;
  else if (maxP >= 60) boost = 0.08;
  else if (maxP >= 50) boost = 0.04;

  // 안전 상한
  return __clamp(boost, 0, 0.35);
}

function evalRiskProfiles({ state, ai, structural } = {}) {
  const structuralFlags = structural?.flags || structural?.structuralFlags || [];
  const metrics = structural?.metrics || {};

  const ctx = {
    state,
    ai,
    structural,
    flags: structuralFlags,
    metrics,
  };
  // ✅ PATCH: use picked state for actual profile evaluation too (append-only)
  // - mode 선택뿐 아니라 when/score/explain도 같은 state 기준으로 동작하게 보정
  const __pickedStateForEval = (function () {
    return (
      state ||
      ctx?.base?.state ||
      ctx?.objective?.state ||
      ctx?.reportPack?.state ||
      ctx?.reportPack?.base?.state ||
      ctx?.input?.state ||
      {}
    );
  })();

  // ctx.state를 picked로 교체(append-only). 기존 state 참조는 __rawState로 보존.
  ctx.__rawState = state;
  ctx.state = __pickedStateForEval;
  // ✅ PATCH: robust state/mode pick (append-only, safe)
  const __pickState = (ctx) => {
    return (
      ctx?.state ||
      ctx?.base?.state ||
      ctx?.objective?.state ||
      ctx?.reportPack?.state ||
      ctx?.reportPack?.base?.state ||
      ctx?.input?.state ||
      {}
    );
  };

  const __pickMode = (state) => {
    const m =
      state?.mode ||
      state?.analysisMode ||
      state?.detailLevel ||
      state?.reportMode ||
      // ✅ PATCH: common UI keys (append-only)
      state?.inputMode ||
      state?.entryMode ||
      state?.viewMode ||
      state?.uiMode ||
      state?.detailMode ||
      state?.reportLevel ||
      "";

    return String(m).trim().toLowerCase();
  };

  const statePicked = __pickState(ctx);
  const mode = __pickMode(statePicked);

  // ✅ PATCH: fallback when ALL_RISK_PROFILES is not defined (append-only, crash-safe)
  // ✅ P1: Seniority(연차) under-min -> real gate profile (append-only)
  // - 핵심: careerSignals.requiredYears.min + careerSignals.experienceGap(음수면 부족)를 gate로 승격
  // - simple 모드에서도 gate는 평가되게 "extra gate profiles"를 항상 concat
  const riskProfilesBase =
    mode === "simple"
      ? SIMPLE_RISK_PROFILES
      : (typeof ALL_RISK_PROFILES !== "undefined" && Array.isArray(ALL_RISK_PROFILES))
        ? ALL_RISK_PROFILES
        : ALL_PROFILES;

  const __EXTRA_GATE_PROFILES = [
    {
      id: "SENIORITY__UNDER_MIN_YEARS",
      group: "gates",
      layer: "gate",
      // priority는 gate normalize에서 score 기반 보정이 들어가므로,
      // 여기서는 0으로 두고 score로 승격시키는 방식(append-only, 안전)
      priority: 0,

      when: (ctx) => {
        try {
          const cs = ctx?.state?.careerSignals;
          const minY = Number(cs?.requiredYears?.min);
          if (!Number.isFinite(minY) || minY <= 0) return false;

          // experienceGap: 음수면 "부족" (현재 로그: -3)
          const gap = Number(cs?.experienceGap);
          if (Number.isFinite(gap) && gap < 0) return true;

          return false;
        } catch {
          return false;
        }
      },

      score: (ctx) => {
        try {
          const cs = ctx?.state?.careerSignals;
          const gap = Number(cs?.experienceGap);

          // gap 단위가 "개월"일 가능성이 높음(-3 = 3개월 부족)
          const g = Number.isFinite(gap) ? gap : 0;

          // 부족이 커질수록 강도↑ (0.70~1.00)
          const abs = Math.abs(g);
          if (abs >= 12) return 1.0;
          if (abs >= 6) return 0.9;
          if (abs >= 3) return 0.8;
          return 0.7;
        } catch {
          return 0.8;
        }
      },

      explain: (ctx) => {
        try {
          const cs = ctx?.state?.careerSignals;
          const minY = cs?.requiredYears?.min ?? null;
          const gap = cs?.experienceGap ?? null;

          const gapNum = Number(gap);
          const abs = Number.isFinite(gapNum) ? Math.abs(gapNum) : null;

          const gapText =
            abs === null
              ? "연차가 JD 최소요건에 못 미칠 수 있습니다."
              : `JD 최소 연차 대비 약 ${abs}${abs <= 24 ? "개월" : ""} 부족 신호가 감지됐습니다.`;

          return {
            title: "연차 최소요건 미달(게이트)",
            why: [
              "연차는 서류/면접 진입에서 1순위로 컷이 걸리는 경우가 많습니다.",
              "특히 ‘n년 이상’이 필수로 명시된 JD는 경계 구간에서 보수적으로 판단되는 편입니다.",
              gapText,
            ].filter(Boolean),
            // UI/디버그용 부가정보(append-only)
            requiredYears: { min: minY ?? null },
            experienceGap: gap ?? null,
          };
        } catch {
          return {
            title: "연차 최소요건 미달(게이트)",
            why: ["연차는 JD 최소요건 미달 시 상한이 강하게 깎일 수 있는 게이트 신호입니다."],
          };
        }
      },
    },
    {
      id: "TOOL__MUST_HAVE_MISSING_V1",
      group: "gates",
      layer: "gate",
      priority: 0,

      when: (ctx) => {
        try {
          const __norm = (s) => (s == null ? "" : String(s)).toLowerCase();
          const __pickText = (...arr) => {
            for (const v of arr) { if (typeof v === "string" && v.trim()) return v; }
            return "";
          };

          // v1: 최소 allowlist + alias (AI 추론 X, 동의어/표기만 허용)
          const __toolAllow = ["sap", "oracle", "salesforce", "excel", "power bi", "powerbi", "sql", "python", "aws", "gcp", "azure"];
          const __toolAliases = {
            sap: ["sap", "s/4", "s4", "s/4hana", "hana"],
            oracle: ["oracle", "oracle erp"],
            salesforce: ["salesforce", "sf", "sfdc"],
            excel: ["excel", "엑셀"],
            "power bi": ["power bi", "powerbi", "pbi"],
            powerbi: ["powerbi", "power bi", "pbi"],
            sql: ["sql"],
            python: ["python", "파이썬"],
            aws: ["aws", "amazon web services"],
            gcp: ["gcp", "google cloud"],
            azure: ["azure", "ms azure"],
          };
          const __hasAny = (text, arr) => {
            const t = __norm(text);
            if (!t) return false;
            for (const k of arr) {
              const kk = __norm(k);
              if (kk && t.includes(kk)) return true;
            }
            return false;
          };

          const __jdT = __pickText(
            ctx?.jdText,
            ctx?.state?.jdText,
            ctx?.state?.analysis?.jdText,
            ctx?.state?.parsedJD?.rawText,
            ctx?.state?.parsedJd?.rawText,
            ctx?.state?.input?.jdText
          );
          const __resT = __pickText(
            ctx?.resumeText,
            ctx?.state?.resumeText,
            ctx?.state?.analysis?.resumeText,
            ctx?.state?.parsedResume?.rawText,
            ctx?.state?.input?.resumeText
          );

          const t = __norm(__jdT);
          if (!t) return false;

          const lines = t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
          const mustLines = lines.filter((ln) => /(필수|required|must|mandatory)/i.test(ln));
          if (mustLines.length === 0) return false;

          const found = new Set();
          for (const ln of mustLines) {
            for (const tool of __toolAllow) {
              const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
              if (__hasAny(ln, aliases)) found.add(tool);
            }
          }
          const __mustTools = Array.from(found);
          if (__mustTools.length === 0) return false;

          const __missing = __mustTools.filter((tool) => {
            const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
            return !__hasAny(__resT, aliases);
          });

          // 완화형 정책: 2개 이상 누락이면 gate
          const __shouldGate = __missing.length >= 2;

          // ✅ append-only: 표준 프로브(전역) 저장 → decisionScore.meta로 주입용
          try {
            globalThis.__PASSMAP_TOOL_MUST_PROBE__ = {
              at: Date.now(),
              mustTools: __mustTools,
              missingTools: __missing,
              presentTools: __mustTools.filter((t) => !__missing.includes(t)),
              missingCount: __missing.length,
              shouldGate: __shouldGate,
              policy: "explicit_must_lines_only__missing_ge_2",
            };
          } catch { }
          // ✅ append-only: decisionScore.meta.toolMustProbe로 올릴 표준 메타 저장
          try {
            __toolMustProbe = {
              at: Date.now(),
              mustTools: __mustTools,
              missingTools: __missing,
              presentTools: __mustTools.filter((t) => !__missing.includes(t)),
              missingCount: __missing.length,
              shouldGate: __shouldGate,
              policy: "explicit_must_lines_only__missing_ge_2",
            };
          } catch { }
          return __shouldGate;
        } catch {
          return false;
        }
      },

      // score / evidence / explain은 gate normalize/주입 단계에서 쓰일 수 있으니 고정 값으로 둠
      score: 0.85,

      evidence: (ctx) => {
        try {
          const __norm = (s) => (s == null ? "" : String(s)).toLowerCase();
          const __pickText = (...arr) => {
            for (const v of arr) { if (typeof v === "string" && v.trim()) return v; }
            return "";
          };
          const __toolAllow = ["sap", "oracle", "salesforce", "excel", "power bi", "powerbi", "sql", "python", "aws", "gcp", "azure"];
          const __toolAliases = {
            sap: ["sap", "s/4", "s4", "s/4hana", "hana"],
            oracle: ["oracle", "oracle erp"],
            salesforce: ["salesforce", "sf", "sfdc"],
            excel: ["excel", "엑셀"],
            "power bi": ["power bi", "powerbi", "pbi"],
            powerbi: ["powerbi", "power bi", "pbi"],
            sql: ["sql"],
            python: ["python", "파이썬"],
            aws: ["aws", "amazon web services"],
            gcp: ["gcp", "google cloud"],
            azure: ["azure", "ms azure"],
          };
          const __hasAny = (text, arr) => {
            const t = __norm(text);
            if (!t) return false;
            for (const k of arr) {
              const kk = __norm(k);
              if (kk && t.includes(kk)) return true;
            }
            return false;
          };

          const __jdT = __pickText(
            ctx?.jdText,
            ctx?.state?.jdText,
            ctx?.state?.analysis?.jdText,
            ctx?.state?.parsedJD?.rawText,
            ctx?.state?.parsedJd?.rawText,
            ctx?.state?.input?.jdText
          );
          const __resT = __pickText(
            ctx?.resumeText,
            ctx?.state?.resumeText,
            ctx?.state?.analysis?.resumeText,
            ctx?.state?.parsedResume?.rawText,
            ctx?.state?.input?.resumeText
          );

          const lines = __norm(__jdT).split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
          const mustLines = lines.filter((ln) => /(필수|required|must|mandatory)/i.test(ln));

          const found = new Set();
          for (const ln of mustLines) {
            for (const tool of __toolAllow) {
              const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
              if (__hasAny(ln, aliases)) found.add(tool);
            }
          }
          const mustTools = Array.from(found);
          const missingTools = mustTools.filter((tool) => {
            const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
            return !__hasAny(__resT, aliases);
          });
          const presentTools = mustTools.filter((tool) => !missingTools.includes(tool));

          return {
            mustTools,
            presentTools,
            missingTools,
            missingCount: missingTools.length,
            policy: "explicit_must_lines_only__missing_ge_2",
          };
        } catch {
          return null;
        }
      },

      explain: (ctx) => {
        try {
          const ev = (typeof ctx?.evidence === "function") ? ctx.evidence(ctx) : null;
          const mustN = Array.isArray(ev?.mustTools) ? ev.mustTools.length : 0;
          const missN = typeof ev?.missingCount === "number" ? ev.missingCount : 0;
          return {
            title: "필수 툴 요건 미충족(게이트)",
            why: [
              `JD 필수 문맥에서 툴 ${mustN}개 감지`,
              `이력서에서 미표기 ${missN}개 → 게이트`,
            ],
            signals: [],
          };
        } catch {
          return { title: "필수 툴 요건 미충족(게이트)", why: [], signals: [] };
        }
      },
    },
  ];

  const riskProfiles = Array.isArray(riskProfilesBase)
    ? riskProfilesBase.concat(__EXTRA_GATE_PROFILES)
    : __EXTRA_GATE_PROFILES;
  const out = [];


  for (const p of riskProfiles) {
    try {
      if (!p || typeof p.when !== "function") continue;
      if (!p.when(ctx)) continue;
      const score = typeof p.score === "function" ? p.score(ctx) : 0;
      const explain = typeof p.explain === "function" ? p.explain(ctx) : null;
      // [PATCH] keep new "context importance" fields (append-only)
      // - A단계: 점수/정렬 영향 없이 설명용 필드만 top-level로 전달
      const __impactLevel = explain && typeof explain === "object" ? explain.impactLevel : undefined;
      const __importanceWeight = explain && typeof explain === "object" ? explain.importanceWeight : undefined;
      const __impactReasons = explain && typeof explain === "object" ? explain.impactReasons : undefined;
      const dynamicPriority =
        typeof p.layer === "string" && p.layer === "gate"
          ? Math.round((score ?? 0) * 100)
          : p.priority;

      out.push({
        id: p.id,
        group: p.group,
        layer: p.layer,
        priority: dynamicPriority,
        score,
        explain,
        // [PATCH] top-level mirrors (append-only)
        impactLevel: __impactLevel,
        importanceWeight: __importanceWeight,
        impactReasons: __impactReasons,
      });
    } catch {
      // crash-safe: 媛쒕퀎 profile ?ㅽ뙣??臾댁떆
    }
  }

  // priority ?곗꽑, score 蹂댁“ ?뺣젹
  out.sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (b.score ?? 0) - (a.score ?? 0)
  );


  return out;
}

// 湲곗〈 ?⑥닔 PATCHED (append-only)
export function buildDecisionPack({ state, ai, structural, hiddenRisk = null, careerSignals = null } = {}) {
  // 1) structural pressure
  const structuralFlags = structural?.flags || [];
  const structuralPressure = computeStructuralDecisionPressure(structuralFlags);

  // 2) domain-specific risk profiles (?꾩옱???뚯씪/紐⑤뱢 ?곌껐???놁쑝誘濡?null 怨좎젙)
  const timeline = null;
  const educationGate = null;
  const overqualified = null;
  const domainShift = null;

  // 3) riskProfiles ?쒖뒪???ㅽ뻾
  let riskResults = [];
  try {
    riskResults = evalRiskProfiles({ state, ai, structural });
  } catch {
    riskResults = [];
  }
  // [PATCH] normalize gates & ids (append-only)


  riskResults = __normalizeRiskResults(riskResults);

  // ✅ PATCH: robust mode + ctx + never-empty (append-only, crash-safe)
  // - buildDecisionPack 스코프에서 mode/ctx가 undefined로 터지는 문제 방지
  // - state가 비어 riskResults가 0개인 경우에도 안내 카드 1장 제공
  const __modeLocal = String(
    state?.mode ||
    state?.analysisMode ||
    state?.detailLevel ||
    state?.reportMode ||
    // ✅ PATCH: common UI keys (append-only)
    state?.inputMode ||
    state?.entryMode ||
    state?.viewMode ||
    ""
  )
    .trim()
    .toLowerCase();

  const __ctxLocal = { state: state || {}, ai, structural };
  // ✅ PATCH (crash-safe): legacy ctx alias for downstream code
  const ctx = __ctxLocal;
  // ✅ PATCH: infer "simple" when JD/Resume are missing (append-only)
  // ✅ PATCH: robust JD/Resume presence check based on extracted text length (append-only)
  const __extractText = (v) => {
    if (v == null) return "";

    // string
    if (typeof v === "string") return v;

    // array: join strings / stringify primitives
    if (Array.isArray(v)) {
      return v
        .map((x) => (typeof x === "string" ? x : x == null ? "" : String(x)))
        .join("\n");
    }

    // object: try common text-ish keys
    if (typeof v === "object") {
      const c =
        v.text ??
        v.value ??
        v.content ??
        v.raw ??
        v.jdText ??
        v.resumeText ??
        v.cvText ??
        v.input ??
        v.body ??
        "";
      if (typeof c === "string") return c;

      // if nested arrays/strings exist, best-effort
      if (Array.isArray(c)) return __extractText(c);
      return "";
    }

    // primitive
    return String(v);
  };

  const __isMeaningfulDocText = (v) => {
    const t = __extractText(v).trim();
    if (!t) return false;

    const low = t.toLowerCase();
    if (low === "undefined" || low === "null") return false;
    if (t === "미입력" || t === "선택" || t === "없음") return false;

    // ✅ 핵심: 아주 짧은 텍스트(placeholder 수준)는 "없음"으로 처리
    // (JD/이력서는 보통 수십~수백자. 20자 미만이면 분석 재료로 부족)
    return t.length >= 20;
  };

  const __jdCandidate =
    state?.jd ??
    state?.jdText ??
    state?.jobDescription ??
    state?.jobDesc ??
    state?.jdRaw ??
    state?.jdInput;

  const __resumeCandidate =
    state?.resume ??
    state?.resumeText ??
    state?.cv ??
    state?.cvText ??
    state?.resumeRaw ??
    state?.resumeInput;

  const __hasJD = __isMeaningfulDocText(__jdCandidate);
  const __hasResume = __isMeaningfulDocText(__resumeCandidate);

  const __isSimpleInferred = !__hasJD && !__hasResume;
  // ✅ PATCH (append-only): riskFeed (full profiles) for UI expansion
  // - riskResults는 기존 정책 유지(단순 모드에서는 SIMPLE_* 중심)
  // - riskFeed는 "detail 프로필 경로"로 한 번 더 평가해서 전체 리스크를 보관 (UI/노트/확장용)
  // - 스코어/게이트/decisionPressure에는 무영향 (read-only output)
  let riskFeed = null;
  try {
    const __stateForFeed = { ...(state || {}) };
    // ✅ PATCH (append-only): ensure canonical doc fields exist for FULL profiles (riskFeed only)
    // - many profiles read ctx.state.jd / ctx.state.resume
    // - but UI may store as jdText/resumeText/jobDescription/etc
    try {
      const __jd0 = __isMeaningfulDocText(__stateForFeed.jd)
        ? __stateForFeed.jd
        : (__jdCandidate ?? "");
      const __cv0 = __isMeaningfulDocText(__stateForFeed.resume)
        ? __stateForFeed.resume
        : (__resumeCandidate ?? "");

      // canonical
      if (!__isMeaningfulDocText(__stateForFeed.jd) && __isMeaningfulDocText(__jd0)) {
        __stateForFeed.jd = __jd0;
      }
      if (!__isMeaningfulDocText(__stateForFeed.resume) && __isMeaningfulDocText(__cv0)) {
        __stateForFeed.resume = __cv0;
      }

      // common aliases (harmless; keeps other code paths stable)
      if (!__isMeaningfulDocText(__stateForFeed.jdText) && __isMeaningfulDocText(__jd0)) {
        __stateForFeed.jdText = __jd0;
      }
      if (!__isMeaningfulDocText(__stateForFeed.jobDescription) && __isMeaningfulDocText(__jd0)) {
        __stateForFeed.jobDescription = __jd0;
      }
      if (!__isMeaningfulDocText(__stateForFeed.resumeText) && __isMeaningfulDocText(__cv0)) {
        __stateForFeed.resumeText = __cv0;
      }
      if (!__isMeaningfulDocText(__stateForFeed.cvText) && __isMeaningfulDocText(__cv0)) {
        __stateForFeed.cvText = __cv0;
      }
    } catch { }
    // detail 경로로 올려서 evalRiskProfiles가 ALL_* 프로필 경로를 타게 함
    __stateForFeed.mode = "detail";
    __stateForFeed.analysisMode = __stateForFeed.analysisMode || "detail";
    __stateForFeed.detailLevel = __stateForFeed.detailLevel || "detail";
    __stateForFeed.reportMode = __stateForFeed.reportMode || "detail";

    let __feedEval = [];
    try {
      __feedEval = evalRiskProfiles({ state: __stateForFeed, ai, structural });
    } catch {
      __feedEval = [];
    }

    // normalize(필드/정렬/게이트 표준화)만 적용
    riskFeed = __normalizeRiskResults(__feedEval);
  } catch {
    riskFeed = null;
  }
  const __shouldInjectGuide = Array.isArray(riskResults) && riskResults.length === 0;

  if (__shouldInjectGuide) {
    const base = SIMPLE_RISK_PROFILES.find((p) => p?.id === "SIMPLE__BASELINE_GUIDE");
    if (base && typeof base.explain === "function") {
      const ex = base.explain(__ctxLocal);
      riskResults.push({
        id: base.id,
        group: base.group,
        layer: base.layer,
        priority: base.priority,
        score: 0.35,
        explain: ex,
        title: ex?.title,
      });
    }
  }
  // ✅ PATCH: in simple mode, ensure up to 3 "simple" cards (append-only, crash-safe)
  // - 현재 simple에서 1개만 나와 UX가 빈약해지는 문제 보완
  // - gate는 별도 섹션(또는 append)로 붙일 수 있으므로, 여기서는 "non-gate" simple 카드만 채움
  try {
    const __isSimpleMode = __modeLocal === "simple" || __isSimpleInferred;

    if (__isSimpleMode && Array.isArray(riskResults)) {
      const __isGate = (r) => String(r?.layer || "").toLowerCase() === "gate";
      const __nonGate = riskResults.filter((r) => !__isGate(r));

      // 이미 3개 이상이면 건드리지 않음
      if (__nonGate.length < 3) {
        const __seen = new Set(riskResults.map((r) => String(r?.id || "")));

        // SIMPLE_RISK_PROFILES에서 후보를 가져와서 최대 3개까지 채움
        // - BASELINE_GUIDE는 riskResults=0일 때만 넣는 정책을 유지(여기선 제외)
        const __candidates = Array.isArray(SIMPLE_RISK_PROFILES)
          ? SIMPLE_RISK_PROFILES.filter((p) => p && p.id && p.id !== "SIMPLE__BASELINE_GUIDE")
          : [];

        for (const p of __candidates) {
          if (__nonGate.length >= 3) break;

          const __id = String(p?.id || "");
          if (!__id || __seen.has(__id)) continue;

          if (typeof p?.explain !== "function") continue;

          let ex = null;
          try {
            ex = p.explain(__ctxLocal);
          } catch {
            ex = null;
          }

          // explain이 비어도 카드가 깨지지 않게 안전 필드만 채움
          const __card = {
            id: __id,
            group: p?.group,
            layer: p?.layer,
            priority: p?.priority,
            // score는 없을 수도 있으니, normalize/정렬이 동작하도록 보수적으로 기본값
            score: typeof p?.score === "number" ? p.score : 0.45,
            explain: ex,
            title: ex?.title,
          };

          riskResults.push(__card);
          __seen.add(__id);
          __nonGate.push(__card);
        }

        // normalize 재적용(정렬/필드 보정)
        riskResults = __normalizeRiskResults(riskResults);

        // 최종적으로 simple 모드에서는 non-gate는 최대 3개만 유지 (gate는 유지)
        const __gates = riskResults.filter((r) => __isGate(r));
        const __nonGateSorted = riskResults.filter((r) => !__isGate(r)).slice(0, 3);
        riskResults = __normalizeRiskResults([...__gates, ...__nonGateSorted]);
      }
    }
  } catch {
    // ignore (never crash)
  }
  // ✅ PATCH: in simple mode, append "gate" layer results from full profiles (append-only, crash-safe)
  // - simple 모드에서 SIMPLE_* 카드만 남고 gate(나이/연봉/전환/필수요건 등)가 사라지는 문제 보완
  // - analyze()는 1회 유지. decisionPack 생성 시점에 gate만 추가 평가해서 riskResults에 합침
  try {
    const __isSimpleMode = __modeLocal === "simple" || __isSimpleInferred;

    // 이미 gate가 하나라도 있으면 중복 계산 방지
    const __hasGateAlready =
      Array.isArray(riskResults) &&
      riskResults.some((r) => String(r?.layer || "").toLowerCase() === "gate");

    if (__isSimpleMode && !__hasGateAlready) {
      const __stateForGate = { ...(state || {}) };

      // gate 계산은 "풀 프로필" 경로를 타도록 mode만 detail로 올림(입력/룰은 그대로)
      __stateForGate.mode = "detail";
      __stateForGate.analysisMode = __stateForGate.analysisMode || "detail";
      __stateForGate.detailLevel = __stateForGate.detailLevel || "detail";
      __stateForGate.reportMode = __stateForGate.reportMode || "detail";

      let __gateEval = [];
      try {
        __gateEval = evalRiskProfiles({ state: __stateForGate, ai, structural });
      } catch {
        __gateEval = [];
      }

      const __gateOnly = Array.isArray(__gateEval)
        ? __gateEval.filter((r) => String(r?.layer || "").toLowerCase() === "gate")
        : [];

      if (__gateOnly.length && Array.isArray(riskResults)) {
        // id 기준 중복 제거 후 append
        const __seen = new Set(riskResults.map((r) => String(r?.id || "")));
        for (const g of __gateOnly) {
          const __id = String(g?.id || "");
          if (!__id) continue;
          if (__seen.has(__id)) continue;
          __seen.add(__id);
          riskResults.push(g);
        }

        // normalize 재적용(정렬/필드 보정)
        riskResults = __normalizeRiskResults(riskResults);
      }
    }
  } catch {
    // ignore (never crash)
  }
  // [PATCH][P1-1] careerSignals shape guard (append-only)
  function __looksLikeCareerSignals(x) {
    if (!x || typeof x !== "object") return false;
    // requiredYears.min 또는 experienceGap 둘 중 하나라도 있으면 유효로 취급
    const hasMin =
      x.requiredYears && typeof x.requiredYears === "object" && x.requiredYears.min != null;
    const hasGap = x.experienceGap != null;
    return !!(hasMin || hasGap);
  }
  // ✅ P1 (append-only): Seniority(연차) under-min -> inject as real gate into riskResults
  // - riskProfiles 경로에서 gate가 안 합쳐지는 케이스가 있어, buildDecisionPack에서 직접 주입
  // - state.careerSignals.requiredYears.min + state.careerSignals.experienceGap(음수면 부족) 사용
  try {
    const cs =
      __looksLikeCareerSignals(careerSignals) ? careerSignals :
        __looksLikeCareerSignals(state?.careerSignals) ? state.careerSignals :
          __looksLikeCareerSignals(state?.analysis?.careerSignals) ? state.analysis.careerSignals :
            null;

    const minY = Number(cs?.requiredYears?.min);
    const gap = Number(cs?.experienceGap); // 음수면 부족 (현재 로그: -3)

    const hasMin = Number.isFinite(minY) && minY > 0;
    const isUnder = Number.isFinite(gap) && gap < 0;
    // ✅ append-only: TOOL must gate v1 helpers (no AI inference)
    const __pickText = (...arr) => {
      for (const v of arr) {
        if (typeof v === "string" && v.trim()) return v;
      }
      return "";
    };

    const __toolAllow = [
      // v1: 최소 침습 allowlist (원하면 추후 확장)
      "sap",
      "oracle",
      "salesforce",
      "excel",
      "power bi",
      "powerbi",
      "sql",
      "python",
      "aws",
      "gcp",
      "azure",
    ];

    const __toolAliases = {
      sap: ["sap", "s/4", "s4", "s/4hana", "hana"],
      oracle: ["oracle", "oracle erp"],
      salesforce: ["salesforce", "sf", "sfdc"],
      excel: ["excel", "엑셀"],
      "power bi": ["power bi", "powerbi", "pbi"],
      powerbi: ["powerbi", "power bi", "pbi"],
      sql: ["sql"],
      python: ["python", "파이썬"],
      aws: ["aws", "amazon web services"],
      gcp: ["gcp", "google cloud"],
      azure: ["azure", "ms azure"],
    };
    // ✅ append-only: TOOL must gate v1 (명시 기반, 완화형)
    // - JD에서 "필수/required/must" 문맥으로 명시된 툴만 must로 추출
    // - 이력서에 명시 없으면 missing
    // - missing 2개 이상일 때만 gate 트리거 (극단 방지)
    try {
      const __ctx = (typeof ctx !== "undefined" && ctx) ? ctx : { state };

      try { globalThis.__DBG_TOOLGATE_ENTER__ = { at: Date.now() }; } catch { }

      const __jdT = __pickText(
        __ctx?.jdText,
        __ctx?.state?.jdText,
        __ctx?.state?.analysis?.jdText,
        __ctx?.state?.parsedJD?.rawText,
        __ctx?.state?.parsedJd?.rawText,
        __ctx?.state?.input?.jdText
      );
      const __resT = __pickText(
        __ctx?.resumeText,
        __ctx?.state?.resumeText,
        __ctx?.state?.analysis?.resumeText,
        __ctx?.state?.parsedResume?.rawText,
        __ctx?.state?.input?.resumeText
      );

      const __mustTools = __extractMustToolsFromJD(__jdT);
      if (Array.isArray(__mustTools) && __mustTools.length > 0) {
        const __present = __mustTools.filter((tool) => __hasToolInResume(__resT, tool));
        const __missing = __mustTools.filter((tool) => !__hasToolInResume(__resT, tool));

        const __shouldGate = __missing.length >= 2;

        const __already =
          Array.isArray(riskResults) &&
          riskResults.some((r) => String(r?.id || "") === "TOOL__MUST_HAVE_MISSING_V1");

        if (__shouldGate && !__already) {
          const __sc = __missing.length >= 3 ? 1.0 : 0.85;

          riskResults.push({
            id: "TOOL__MUST_HAVE_MISSING_V1",
            group: "gates",
            layer: "gate",
            priority: 0,
            score: __sc,

            evidence: {
              mustTools: __mustTools,
              presentTools: __present,
              missingTools: __missing,
              missingCount: __missing.length,
              policy: "explicit_must_lines_only__missing_ge_2",
            },

            explain: {
              title: "필수 툴 요건 미충족(게이트)",
              why: [
                `JD 필수 문맥에서 툴 ${__mustTools.length}개 감지`,
                `이력서에서 미표기 ${__missing.length}개 → 게이트`,
              ],
              signals: [],
            },
          });
        }
      }

    } catch { }
    const __norm = (s) => (s == null ? "" : String(s)).toLowerCase();
    const __hasAny = (text, arr) => {
      const t = __norm(text);
      if (!t) return false;
      for (const k of arr) {
        const kk = __norm(k);
        if (kk && t.includes(kk)) return true;
      }
      return false;
    };

    // JD에서 "필수/required/must" 문맥으로 명시된 툴만 추출
    const __extractMustToolsFromJD = (jdText) => {
      const t = __norm(jdText);
      if (!t) return [];
      const lines = t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

      const mustLines = lines.filter((ln) => {
        // must 문맥(완화형): "필수/required/must" 포함 라인만 스캔
        return /(필수|required|must|mandatory)/i.test(ln);
      });

      const found = new Set();
      for (const ln of mustLines) {
        for (const tool of __toolAllow) {
          const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
          if (__hasAny(ln, aliases)) found.add(tool);
        }
      }

      return Array.from(found);
    };

    const __hasToolInResume = (resumeText, tool) => {
      const t = __norm(resumeText);
      if (!t) return false;
      const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
      return __hasAny(t, aliases);
    };
    if (hasMin && isUnder) {
      const abs = Math.abs(gap);

      // gap 단위는 "개월"일 가능성이 높음(-3 = 3개월 부족)
      const sc = abs >= 12 ? 1.0 : abs >= 6 ? 0.9 : abs >= 3 ? 0.8 : 0.7;

      const already =
        Array.isArray(riskResults) &&
        riskResults.some((r) => String(r?.id || "") === "SENIORITY__UNDER_MIN_YEARS");

      if (!already) {
        riskResults.push({
          id: "SENIORITY__UNDER_MIN_YEARS",
          group: "gates",
          layer: "gate",
          priority: 0, // gate normalize에서 score 기반 우선순위로 보정됨(append-only)
          score: sc,

          // ✅ PATCH (append-only): top-level evidence (콘솔 ev: undefined 해결)
          evidence: (() => {
            try {
              const __minY = Number(minY);
              const __gapY = Number(cs?.experienceGap);
              const __absMonths = abs; // 기존 코드에서 계산된 abs(개월)
              const __resumeY = (() => {
                // cs.experienceGap(gap)는 "개월"로 들어오는 전제(-3 = 3개월 부족)
                const __gapM = Number(cs?.experienceGap);
                if (!Number.isFinite(__minY) || !Number.isFinite(__gapM)) return null;

                // years -> months로 바꾼 뒤 gap(개월)을 합산해서 다시 years로 환산
                const __resumeMonths = (__minY * 12) + __gapM;
                const __years = __resumeMonths / 12;

                // 과도한 소수 방지(표시용): 2자리 고정
                return Math.round(__years * 100) / 100;
              })();

              return {
                jdMinYears: Number.isFinite(__minY) ? __minY : null,
                resumeYears: Number.isFinite(__resumeY) ? __resumeY : null,
                gapYears: Number.isFinite(__gapY) ? __gapY : null,
                gapMonthsSigned: Number.isFinite(__gapY) ? __gapY : null,
                gapYearsSigned: Number.isFinite(__gapY) ? (Math.round((__gapY / 12) * 100) / 100) : null,
                gapMonthsAbs: Number.isFinite(Number(__absMonths)) ? Number(__absMonths) : null,
              };
            } catch {
              return null;
            }
          })(),

          explain: {
            title: "연차 최소요건 미달(게이트)",
            why: [
              "연차는 서류/면접 진입에서 1순위로 컷이 걸리는 경우가 많습니다.",
              "특히 ‘n년 이상’이 필수로 명시된 JD는 경계 구간에서 보수적으로 판단되는 편입니다.",
              `JD 최소 연차 대비 약 ${abs}개월 부족 신호가 감지됐습니다.`,
            ],
            requiredYears: { min: minY, max: cs?.requiredYears?.max ?? null },
            experienceGap: cs?.experienceGap ?? null,
          },
        });
      }
    }
  } catch {
    // ignore (never crash)
  }
  // [PATCH] gate -> decisionPressure boost (append-only)
  const gateBoostValue = __computeGatePressureBoost(riskResults);
  // [PATCH][P1-1] Inject real seniority gate from careerSignals (append-only)
  // NOTE: Deprecated. Real injection runs earlier using buildDecisionPack param careerSignals.
  // Intentionally no-op to avoid silent failures.
  try { } catch { }


  // ✅ PATCH: selfCheck 기반 "표시용" priority 보정 (append-only, non-gate only)
  try {
    riskResults = __applySelfCheckPriorityAdjustForUI(riskResults, state?.selfCheck);
    riskResults = __normalizeRiskResults(riskResults);
    // ✅ Hidden Risk Engine v1.1 (append-only): stable config result for UX count/proxy
    // - NOTE: does NOT replace riskResults/rejectProbability. Parallel output only.
    let hiddenRisk = null;
    try {
      hiddenRisk = evaluateHiddenRiskV11({ state, ai, structural });
    } catch {
      hiddenRisk = null;
    }
  } catch {
    // ignore (never crash)
  }
  const gateBoost =
    gateBoostValue > 0
      ? {
        id: "PRESSURE__GATE_BOOST",
        title: "Gate 신호로 인한 면접 진입 확률 급락",
        score: gateBoostValue,
        weight: 1,
        meta: { source: "gates", maxAppliedBoost: gateBoostValue },
      }
      : null;
  // gateBoost/merged 적용 여부 확인
  const merged = mergeDecisionPressures(
    [structuralPressure, gateBoost, timeline, educationGate, overqualified, domainShift].filter(Boolean),
    { topN: 12 }
  );
  // ------------------------------
  // [PATCH][P0] gate -> score cap (append-only)
  // - 목적: Gate를 "리스크 설명"이 아니라 "점수 상한"으로 분리
  // - AI 추가 없음: 기존에 주입된 ai.semanticMatches.matchRate(0~1)를 기반 점수로 사용
  // - 기존 merged/pressure/riskResults 로직은 건드리지 않음
  // ------------------------------
  const __num01 = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    if (n <= 1) return Math.max(0, Math.min(1, n));
    return Math.max(0, Math.min(1, n / 100));
  };

  // base fit proxy: semantic matchRate (0~1)
  // ✅ PATCH (append-only): also consider state.analysis.ai as matchRate source
  const __aiFromState =
    (state && state.analysis && state.analysis.ai && typeof state.analysis.ai === "object")
      ? state.analysis.ai
      : (ctx && ctx.state && ctx.state.analysis && ctx.state.analysis.ai && typeof ctx.state.analysis.ai === "object")
        ? ctx.state.analysis.ai
        : null;
  const __match01 =
    __num01(ai?.semanticMatches?.matchRate) ??
    __num01(ai?.semanticMatches?.jdResume?.avg) ??
    __num01(ai?.semanticMeta?.avgSimilarity) ??
    __num01(__aiFromState?.semanticMatches?.matchRate) ??
    __num01(__aiFromState?.semanticMatches?.jdResume?.avg) ??
    // ✅ fallback(append-only): DBG_ACTIVE에 최신 ai meta가 붙는 흐름 대비
    __num01(globalThis?.__DBG_ACTIVE__?.ai?.semanticMatches?.matchRate) ??
    __num01(globalThis?.__DBG_ACTIVE__?.ai?.semanticMatches?.jdResume?.avg) ??
    __num01(globalThis?.__DBG_ACTIVE__?.ai?.semanticMeta?.avgSimilarity) ??

    null;

  // gate cap 산출 (priority 0~100 기준)
  // gate는 riskResults 우선, 없으면 riskFeed에서도 탐색 (append-only)
  // gate는 riskResults 우선, 없으면 riskFeed에서도 탐색 (append-only)
  // ✅ 추가: gate가 아예 없으면 "필수요건 누락" 계열(hireability)을 가상 gate로 취급해 cap 적용
  const __gateArr = (() => {
    const rr = Array.isArray(riskResults) ? riskResults : [];
    const rf = Array.isArray(riskFeed) ? riskFeed : [];

    const isGate = (r) => String(r?.layer || "").toLowerCase() === "gate";

    const gatesFromRR = rr.filter(isGate);
    if (gatesFromRR.length > 0) return gatesFromRR;

    const gatesFromRF = rf.filter(isGate);
    if (gatesFromRF.length > 0) return gatesFromRF;

    // ---- 가상 gate 후보: MUST_HAVE_MISSING / REQUIRED_MISSING / CRITICAL_MISSING ----
    const pool = rr.concat(rf);

    const isPseudoGate = (r) => {
      const id = String(r?.id || "").toUpperCase();
      if (!id) return false;
      if (id.includes("MUST_HAVE_MISSING")) return true;
      if (id.includes("REQUIRED") && id.includes("MISSING")) return true;
      if (id.includes("CRITICAL") && id.includes("MISSING")) return true;
      if (id.includes("MUST") && id.includes("MISSING")) return true;
      return false;
    };

    const pseudo = pool.filter(isPseudoGate);
    if (pseudo.length === 0) return [];

    // cap 계산만을 위한 "가상 gate 형태"로 래핑 (riskResults 자체는 건드리지 않음)
    return pseudo.map((r) => ({
      ...r,
      layer: "gate",
      gateTriggered: true,
      id: `PSEUDO_GATE__${String(r?.id || "UNKNOWN")}`,
      // priority가 문자열일 수도 있으니 숫자로 흡수
      priority: (() => {
        const raw = r?.priority;
        const n = (typeof raw === "number") ? raw : Number(raw);
        return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
      })(),
    }));
  })();

  const __pickGateP = (g) => {
    // priority 우선 (숫자/문자열 숫자 모두 흡수)
    const pNum = (() => {
      const raw = g?.priority;
      const n = (typeof raw === "number") ? raw : Number(raw);
      return Number.isFinite(n) ? n : null;
    })();
    if (pNum !== null) return Math.max(0, Math.min(100, pNum));

    // fallback: score(0~1 or 0~100) 흡수
    const s01 = __num01(g?.score);
    return (typeof s01 === "number") ? Math.round(s01 * 100) : 0;
  };

  let __maxGateP = 0;
  let __maxGateId = "";
  for (const g of __gateArr) {
    const p = __pickGateP(g);
    if (p >= __maxGateP) {
      __maxGateP = p;
      __maxGateId = String(g?.id || "");
    }
  }

  // 단계형 cap (현실적인 급락 반영)
  // - 강한 gate일수록 상한이 크게 깎임
  const __baseCapByP = (() => {
    if (__maxGateP >= 95) return 45;
    if (__maxGateP >= 85) return 60;
    if (__maxGateP >= 75) return 70;
    if (__maxGateP >= 65) return 85;
    return null; // gate가 약하면 cap 미적용
  })();
  // ✅ append-only: Gray Zone 결과를 decisionScore.meta에 남기기 위한 저장소
  let __grayZoneMeta = null;
  // ✅ append-only: TOOL must probe (missing==1 경고용 메타)
  let __toolMustProbe = null;
  // id 기반 보정 (연차/필수툴 계열을 더 강하게)
  const __capFinal = (() => {
    if (__baseCapByP === null) return null;

    const id = String(__maxGateId || "").toUpperCase();
    try { globalThis.__DBG_CAPFLOW__ = { at: Date.now(), where: "__capFinal_enter", id, maxGateP: __maxGateP, baseCap: __baseCapByP }; } catch { }
    try { globalThis.__DBG_CAPFLOW_HIT__ = (globalThis.__DBG_CAPFLOW_HIT__ || 0) + 1; } catch { }
    // ✅ PATCH (append-only): hard override for seniority under-min
    // - 연차 부족(하드 게이트)은 체감상 60이 너무 높아서, v1에서는 단순 고정
    // ✅ PATCH: Gray Zone relief for SENIORITY under-min (cap override)
    // - 기본: cap 50
    // - Gray Zone(<=4개월)에서 조건 충족 시 60/65로 완화
    if (id === "SENIORITY__UNDER_MIN_YEARS") {
      try {
        const __rr = Array.isArray(riskResults) ? riskResults : [];
        const __g = __rr.find((r) => String(r?.id || "").toUpperCase() === "SENIORITY__UNDER_MIN_YEARS");
        const __ev = (__g && __g.evidence && typeof __g.evidence === "object") ? __g.evidence : null;
        const __gapM = (__ev && Number.isFinite(Number(__ev.gapMonthsAbs))) ? Number(__ev.gapMonthsAbs) : null;
        // default cap
        let __cap = 50;

        // Gray Zone only (<=4 months)
        if (Number.isFinite(__gapM) && __gapM <= 4) {
          let __hits = 0;
          const __reasons = [];

          // helpers (local-only, no external deps)
          const __safeStr = (v) => (v == null ? "" : String(v));
          const __norm = (s) => __safeStr(s).toLowerCase();
          const __hasAny = (s, arr) => {
            const t = __norm(s);
            if (!t) return false;
            for (const a of arr) {
              const q = __norm(a);
              if (q && t.includes(q)) return true;
            }
            return false;
          };

          // documents (explicit)
          const __jd = __safeStr(state?.jd || state?.jdText || state?.jobDescription || "");
          const __resume =
            __safeStr(
              state?.resumeMergedText ??
              state?.mergedResumeText ??
              ai?.mergedResumeText ??
              ai?.resumeMergedText ??
              state?.resume ??
              ""
            );

          // pool for explicit must-missing detection
          const __pool = []
            .concat(Array.isArray(riskResults) ? riskResults : [])
            .filter(Boolean);

          // (1) Must Fit strong (explicit must-missing signal must NOT exist)
          // - 원칙: "명시적으로 must 누락"이 감지된 게 없을 때만 strong 인정
          const __hasExplicitMustMissing = __pool.some((r) => {
            const id0 = __norm(r?.id || "");
            const title0 = __norm(r?.title || r?.explain?.title || "");
            return (
              (id0.includes("must") && (id0.includes("missing") || id0.includes("lack"))) ||
              (id0.includes("required") && (id0.includes("missing") || id0.includes("lack"))) ||
              id0.includes("critical_missing") ||
              title0.includes("필수") && (title0.includes("누락") || title0.includes("부족"))
            );
          });
          if (!__hasExplicitMustMissing) { __hits++; __reasons.push("mustFitStrong_proxy"); }

          // (2) Domain Fit strong (explicit overlap between JD & resume on domain/role keywords)
          // - 추론 금지: 텍스트에 "같이" 등장하는지로만 체크
          const __domainKeywords = [
            // role / function
            "구매", "조달", "소싱", "전략소싱", "원가", "협상", "rfq", "rfx", "vendor", "supplier",
            "사업기획", "전략기획", "product", "pm", "서비스기획", "데이터", "analytics", "crm", "erp",
            // industry-ish
            "반도체", "자동차", "커머스", "제조", "물류", "금융", "바이오", "헬스케어"
          ];
          let __domainOverlap = 0;
          for (const k of __domainKeywords) {
            if (__hasAny(__jd, [k]) && __hasAny(__resume, [k])) __domainOverlap++;
          }
          if (__domainOverlap >= 2) { __hits++; __reasons.push("domainFitStrong_proxy"); }

          // (3) Impact evidence (explicit quant patterns in resume)
          // - 숫자/성과/지표 패턴이 "이력서 텍스트"에 실제로 있을 때만 인정
          const __hasQuant =
            /(\b\d+(\.\d+)?\s*%|\b\d{1,3}(,\d{3})+\b|\b\d+\s*(명|건|회|개|억|천만|만원|원|달러|USD|KRW)\b|KPI|OKR|전환율|매출|비용절감|리드타임|효율)/i
              .test(__resume);
          if (__hasQuant) { __hits++; __reasons.push("impactEvidence_regex"); }

          // (4) Core task match (explicit token overlap ratio)
          // - JD 토큰(명시)을 뽑고 resume에 "실제로 포함"되면 카운트
          const __tokenize = (s) => {
            const out = [];
            const t = __safeStr(s);
            // 한글 2글자 이상 / 영문 3글자 이상
            const m1 = t.match(/[가-힣]{2,}/g) || [];
            const m2 = t.match(/[A-Za-z]{3,}/g) || [];
            for (const x of m1.concat(m2)) out.push(__norm(x));
            return out;
          };
          const __stop = new Set([
            "및", "등", "관련", "업무", "담당", "경험", "가능", "우대", "필수", "기타", "수행",
            "the", "and", "for", "with", "from", "this", "that"
          ]);
          const __jdTokensRaw = __tokenize(__jd).filter((x) => x && !__stop.has(x));
          const __resumeTextN = __norm(__resume);

          // JD 상위 토큰 30개만(너무 넓으면 오탐 증가)
          const __freq = new Map();
          for (const t of __jdTokensRaw) __freq.set(t, (__freq.get(t) || 0) + 1);
          const __jdTop = Array.from(__freq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30)
            .map(([t]) => t);

          let __taskHit = 0;
          for (const t of __jdTop) {
            if (t.length >= 2 && __resumeTextN.includes(t)) __taskHit++;
          }
          const __taskRatio = __jdTop.length ? (__taskHit / __jdTop.length) : 0;
          if (__jdTop.length >= 10 && __taskRatio >= 0.18) { __hits++; __reasons.push("taskMatch_proxy"); }

          // (5) JD flexible signal (explicit text patterns only)
          if (__jd && /(\b2\s*[-~]\s*4\s*년\b|\b2\s*[-~]\s*3\s*년\b|주니어|미들|성장|잠재력|경력\s*2\s*[-~]\s*4\s*년)/i.test(__jd)) {
            __hits++; __reasons.push("jdFlexible");
          }

          if (__hits >= 3) __cap = 65;
          else if (__hits >= 2) __cap = 60;
          // ✅ append-only: decisionScore.meta.grayZone 표준 경로로 남김
          try {
            // 아래 __gz / hits / reasons / gapMonthsAbs / cap 값들은
            // 현재 Gray Zone 블록에서 이미 계산된 값(또는 동일 의미 변수)로 연결하세요.
            __grayZoneMeta = {
              gateId: "SENIORITY__UNDER_MIN_YEARS",
              gapMonthsAbs: typeof gapMonthsAbs === "number" ? gapMonthsAbs : null,
              hits: typeof hits === "number" ? hits : null,
              reasons: Array.isArray(reasons) ? reasons : [],
              cap: typeof cap === "number" ? cap : null,
              at: Date.now(),
            };
          } catch { }
          // ✅ debug snapshot (global)
        }

        return __cap;
      } catch (e) {
        try {
          globalThis.__DBG_GRAYZONE_ERR__ = {
            at: Date.now(),
            message: String(e?.message || e || "grayzone_error"),
            stack: String(e?.stack || ""),
            // 최소 컨텍스트
            id,
            riskResultsType: typeof riskResults,
            riskResultsIsArray: Array.isArray(riskResults),
            hasStructural: !!structural,
            hasAi: !!ai,
            hasState: !!state,
          };
        } catch { }
        return 50;
      }
    }
    // 연차/경력 계열: 한 단계 더 강하게
    if (id.includes("SENIOR") || id.includes("YEAR") || id.includes("TENURE")) {
      if (__baseCapByP === 85) return 70;
      if (__baseCapByP === 70) return 60;
      if (__baseCapByP === 60) return 45;
      return __baseCapByP;
    }

    // 툴/스킬 필수 계열: cap을 65/55 쪽으로 제한
    if (id.includes("TOOL") || id.includes("SKILL") || id.includes("TECH")) {
      return Math.min(__baseCapByP, __maxGateP >= 85 ? 55 : 65);
    }

    return __baseCapByP;
  })();

  // raw score (0~100): matchRate 기반으로 분산 + 안전 기본값
  // - matchRate 없으면 61로 "회귀"하지 않게, 보수적으로 55로 둠
  const __rawScore = (() => {
    // 1) matchRate가 있으면 그걸 최우선 (40~95)
    if (typeof __match01 === "number") {
      const n = 40 + (__match01 * 55);
      return Math.round(Math.max(0, Math.min(100, n)));
    }

    // 2) matchRate가 없으면 merged.total 기반으로 분산 (AI 추가 없음)
    // - merged.total이 클수록(압력↑) 점수↓
    const total =
      (typeof merged?.total === "number" && Number.isFinite(merged.total)) ? merged.total : null;

    if (typeof total === "number") {
      // 경험상 total이 0~8 사이로 흔함 → 88~40 정도로 퍼지게
      const n = 88 - (total * 6);
      return Math.round(Math.max(0, Math.min(100, n)));
    }

    // 3) 최후 fallback (하지만 이제 웬만하면 여기 안 옴)
    return 55;
  })();

  const __cappedScore =
    typeof __capFinal === "number"
      ? Math.min(__rawScore, Math.max(0, Math.min(100, __capFinal)))
      : __rawScore;

  const decisionScore = {
    raw: __rawScore,
    capped: __cappedScore,
    cap: (typeof __capFinal === "number") ? __capFinal : null,
    capReason:
      (typeof __capFinal === "number")
        ? `gate_cap:${__capFinal} (maxGateP:${__maxGateP}, gateId:${__maxGateId || "unknown"})`
        : "",
    meta: {
      matchRate01: (typeof __match01 === "number") ? __match01 : null,
      gateCount: __gateArr.length,
      maxGateP: __maxGateP,
      maxGateId: __maxGateId || null,
      grayZone: __grayZoneMeta,
      toolMustProbe: (() => { try { return globalThis.__PASSMAP_TOOL_MUST_PROBE__ || null; } catch { return null; } })(),
    },
  };

// ✅ append-only: Layer2(Must) — MUST__TOOL__MISSING_1 (missing==1 & no gate)
try {
  const __probe =
    (__toolMustProbe && typeof __toolMustProbe === "object" ? __toolMustProbe : null) ||
    (() => { try { return globalThis.__PASSMAP_TOOL_MUST_PROBE__ || null; } catch { return null; } })();

  const __missingCount = Number(__probe?.missingCount);
  const __shouldGate = !!__probe?.shouldGate;

  const __isMust =
    Number.isFinite(__missingCount) &&
    __missingCount === 1 &&
    __shouldGate === false;

  if (__isMust) {
    const __rr = Array.isArray(riskResults) ? riskResults : [];
    const __exists = __rr.some((r) => String(r?.id || "") === "MUST__TOOL__MISSING_1");
    if (!__exists) {
      const __missingTools = Array.isArray(__probe?.missingTools) ? __probe.missingTools : [];
      const __mustTools = Array.isArray(__probe?.mustTools) ? __probe.mustTools : [];
      const __tool = String(__missingTools?.[0] || __mustTools?.[0] || "").trim();

      __rr.push({
        id: "MUST__TOOL__MISSING_1",
        group: "musts",
        layer: "must",
        priority: 60,
        score: 0.35,
        evidence: {
          missingCount: __missingCount,
          missingTools: __missingTools,
          mustTools: __mustTools,
          policy: String(__probe?.policy || "tool_must_probe_v1"),
        },
        explain: {
          title: "필수 툴 1개 미표기",
          why: [
            __tool
              ? `JD에서 ${__tool}이(가) 필수로 보이는데 이력서에서 명시가 안 보여요.`
              : "JD에서 필수로 보이는 툴 1개가 이력서에서 명시가 안 보여요.",
            "게이트는 아니지만 서류 해석에서 불리하게 작용할 수 있어요.",
          ],
          action: [
            __tool
              ? `스킬/업무툴/프로젝트 도구 중 최소 1곳에 ‘${__tool}’를 동일 표기로 추가하세요.`
              : "스킬/업무툴/프로젝트 도구 중 최소 1곳에 해당 툴을 동일 표기로 추가하세요.",
          ],
        },
        meta: { source: "toolMustProbe_v1", at: Date.now() },
      });

      // riskResults가 방어용 로컬로 바뀌었을 가능성을 고려해 재할당(안전)
      riskResults = __rr;
    }
  }
} catch { }

// ✅ append-only: Layer2(Must) — MUST__SKILL__MISSING (explicit must/req lines only)
try {
  const __rr = Array.isArray(riskResults) ? riskResults : null;
  if (__rr) {
    const __exists = __rr.some((r) => String(r?.id || "") === "MUST__SKILL__MISSING");
    if (!__exists) {
      const __pickText = (...arr) => {
        for (const v of arr) { if (typeof v === "string" && v.trim()) return v; }
        return "";
      };

      const __jdText = __pickText(
        ctx?.jdText, ctx?.jd, ctx?.jobDescription, ctx?.jobDesc, ctx?.rawJdText,
        ctx?.input?.jdText, ctx?.state?.jdText, ctx?.state?.jd, ctx?.state?.jobDescription
      );

      const __resumeText = __pickText(
        ctx?.resumeText, ctx?.resume, ctx?.cv, ctx?.rawResumeText,
        ctx?.input?.resumeText, ctx?.state?.resumeText, ctx?.state?.resume, ctx?.state?.cv
      );

      const __jt = String(__jdText || "");
      const __rt = String(__resumeText || "");
      if (__jt.trim() && __rt.trim()) {
        const __rtL = __rt.toLowerCase();

        // 1) JD에서 "필수/자격요건/required/must/mandatory" 계열 라인만 추출
        const __lines = __jt.split(/\r?\n/).map((s) => String(s || "").trim()).filter(Boolean);
        const __mustLines = __lines.filter((ln) => {
          const l = ln.toLowerCase();
          return (
            l.includes("must") ||
            l.includes("required") ||
            l.includes("mandatory") ||
            ln.includes("필수") ||
            ln.includes("자격요건") ||
            ln.includes("요구") ||
            ln.includes("필요")
          );
        });

        // 2) 보수적 키워드 추출: 너무 짧거나 흔한 단어는 제외, 기호로 구분된 토큰 위주
        const __stop = new Set([
          "및","등","수","이상","이하","관련","업무","경험","우대","가능","필수","자격요건","요구","필요",
          "must","required","mandatory","preferred","nice","to","have"
        ]);

        const __cand = new Set();
        for (const ln of __mustLines) {
          // 쉼표/슬래시/중점/괄호/세미콜론 기준으로 토큰화
          const parts = ln
            .replace(/[•·]/g, " ")
            .replace(/[()\[\]{}]/g, " ")
            .split(/[,/;|]|(?:\s{2,})/g)
            .map((x) => String(x || "").trim())
            .filter(Boolean);

          for (const p of parts) {
            // 영어/숫자/한글 혼합 토큰 중 길이 2~30만
            const t = p.replace(/\s+/g, " ").trim();
            if (t.length < 2 || t.length > 30) continue;

            const tL = t.toLowerCase();
            if (__stop.has(tL)) continue;

            // 너무 일반적인 문장(“경력 3년 이상” 등)은 제외
            if (/\d+\s*년/.test(t) || /\d+\s*개월/.test(t) || /year|years|month|months/i.test(t)) continue;
            if (/(경력|연차|학력|전공|학사|석사|박사|졸업)/.test(t)) continue;

            // 영어 단일 단어는 길이 3 이상만
            if (/^[a-zA-Z]+$/.test(t) && t.length < 3) continue;

            __cand.add(t);
          }
        }

        // 3) 이력서에 명시되지 않은 항목만 missing으로 간주(대소문자 무시)
        const __missing = [];
        const __present = [];
        for (const kw of Array.from(__cand)) {
          const k = String(kw || "").trim();
          if (!k) continue;
          const kL = k.toLowerCase();

          // 보수: 너무 흔한 단어류/형용사류는 제외
          if (/(우수|원활|능숙|가능|보유|지식|이해|역량|커뮤니케이션|협업)/.test(k)) continue;

          if (__rtL.includes(kL)) __present.push(k);
          else __missing.push(k);
        }

        // 너무 많이 뽑히면 오탐 가능성이 높으니 상한(보수)
        const __missingTop = __missing.slice(0, 3);

        if (__missingTop.length >= 1) {
          __rr.push({
            id: "MUST__SKILL__MISSING",
            group: "musts",
            layer: "must",
            priority: 58,
            score: 0.28,
            evidence: {
              source: "explicit_must_lines_only",
              missingCount: __missingTop.length,
              missingSkills: __missingTop,
              presentSample: __present.slice(0, 3),
              mustLineSample: __mustLines.slice(0, 3),
            },
            explain: {
              title: "필수 역량/스킬 근거 부족",
              why: [
                "JD의 ‘필수/자격요건’에 있는 핵심 역량이 이력서에서 바로 확인되지 않아요.",
                "게이트는 아니지만 서류 단계에서 불리하게 해석될 수 있어요.",
              ],
              action: [
                "스킬 섹션/프로젝트 경험/업무 기술에 해당 키워드를 ‘동일 표기’로 명시하고, 근거(성과/역할)를 1줄이라도 붙이세요.",
              ],
            },
            meta: { source: "must_skill_v1", at: Date.now() },
          });
        }
      }
    }
  }
} catch { }

// ✅ append-only: Layer2(Must) — MUST__CERT__MISSING (explicit cert patterns only)
try {
  const __rr = Array.isArray(riskResults) ? riskResults : null;
  if (__rr) {
    const __exists = __rr.some((r) => String(r?.id || "") === "MUST__CERT__MISSING");
    if (!__exists) {
      const __pickText = (...arr) => {
        for (const v of arr) { if (typeof v === "string" && v.trim()) return v; }
        return "";
      };

      const __jdText = __pickText(
        ctx?.jdText, ctx?.jd, ctx?.jobDescription, ctx?.jobDesc, ctx?.rawJdText,
        ctx?.input?.jdText, ctx?.state?.jdText, ctx?.state?.jd, ctx?.state?.jobDescription
      );

      const __resumeText = __pickText(
        ctx?.resumeText, ctx?.resume, ctx?.cv, ctx?.rawResumeText,
        ctx?.input?.resumeText, ctx?.state?.resumeText, ctx?.state?.resume, ctx?.state?.cv
      );

      const __jt = String(__jdText || "");
      const __rt = String(__resumeText || "");
      if (__jt.trim() && __rt.trim()) {
        const __jtL = __jt.toLowerCase();
        const __rtL = __rt.toLowerCase();

        // 보수적: 자격증/인증 패턴은 "명칭이 명확한 것"만
        const __certPatterns = [
          { id: "PMP", re: /\bPMP\b/i },
          { id: "CFA", re: /\bCFA\b/i },
          { id: "CPA", re: /\bCPA\b/i },
          { id: "SQLD", re: /\bSQLD\b/i },
          { id: "ADsP", re: /\bADsP\b/i },
          { id: "ADP", re: /\bADP\b/i },
          { id: "CPSM", re: /\bCPSM\b/i },
          { id: "CPIM", re: /\bCPIM\b/i },
          { id: "CIPS", re: /\bCIPS\b/i },
          { id: "AWS", re: /\bAWS\b/i },
          { id: "GCP", re: /\bGCP\b/i },
          { id: "AZURE", re: /\bAZURE\b/i },
          { id: "정보처리기사", re: /정보처리기사/ },
          { id: "빅데이터분석기사", re: /빅데이터\s*분석\s*기사|빅데이터분석기사/ },
        ];

        // JD에 "필수/자격/required/must" 같은 문맥이 있을 때만 동작(보수)
        const __hasMustContext =
          __jtL.includes("required") ||
          __jtL.includes("must") ||
          __jt.includes("필수") ||
          __jt.includes("자격") ||
          __jt.includes("요구");

        if (__hasMustContext) {
          const __need = [];
          for (const p of __certPatterns) {
            try {
              if (p.re.test(__jt)) __need.push(p.id);
            } catch { }
          }

          // Resume에 동일 표기가 없는 것만 missing으로
          const __missing = __need.filter((c) => !__rtL.includes(String(c || "").toLowerCase()));

          if (__missing.length >= 1) {
            __rr.push({
              id: "MUST__CERT__MISSING",
              group: "musts",
              layer: "must",
              priority: 57,
              score: 0.26,
              evidence: {
                source: "explicit_cert_patterns_only",
                missingCount: __missing.length,
                missingCerts: __missing.slice(0, 3),
                requiredInJd: __need.slice(0, 6),
              },
              explain: {
                title: "필수 자격/인증 미표기",
                why: [
                  "JD에서 필수로 보이는 자격/인증이 이력서에서 바로 확인되지 않아요.",
                  "게이트는 아니지만 서류 해석에서 불리해질 수 있어요.",
                ],
                action: [
                  "자격/인증 섹션에 동일 명칭으로 명시하고, 취득(또는 예정) 여부를 한 줄로 분명히 적으세요.",
                ],
              },
              meta: { source: "must_cert_v1", at: Date.now() },
            });
          }
        }
      }
    }
  }
} catch { }

  // rejectProbability (append-only): score가 낮을수록 reject 확률↑
  const rejectProbability = {
    p: Math.max(0, Math.min(1, 1 - (__cappedScore / 100))),
    confidence:
      (typeof __match01 === "number")
        ? 0.75
        : 0.45,
    basis: {
      scoreCapped: __cappedScore,
      hasMatchRate: (typeof __match01 === "number"),
      hasGateCap: (typeof __capFinal === "number"),
    },
  };
  return {
    decisionPressure: merged,
    decisionComponents: {
      structural: structuralPressure,
      timeline,
      educationGate,
      overqualified,
      domainShift,
    },
    hiddenRisk,
    riskResults,
    decisionScore,
    rejectProbability,
    riskFeed,
    structural,

  };
}