// src/lib/decision/index.js
// NOTE: decision ?덉씠???뷀듃由?
// - structuralPatterns 寃곌낵 + riskProfiles 寃곌낵瑜?紐⑥븘 decisionPack ?앹꽦

import { ALL_PROFILES } from "./riskProfiles/index.js";
import { computeStructuralDecisionPressure, mergeDecisionPressures } from "./decisionPressure.js";
import { SIMPLE_RISK_PROFILES } from "./simpleRiskProfiles";
import { evaluateHiddenRiskV11 } from "../hiddenRisk/v11Stable";
import { buildRiskInteractions } from "./interactions/buildRiskInteractions.js";
import { inferRoleFamily, getRoleDistance } from "../ontology/jobOntology.js";
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
const SALARY_GATE_INFLUENCE_POLICY = {
  pressureMax: 0.15,
  capFloor: 72,
  onlyWhenSalaryIsTopGate: true,
};
function __isSalaryGate(r) {
  return __t(r?.id).toUpperCase() === "GATE__SALARY_MISMATCH";
}
function __isHardStructuralGateForSalaryPolicy(r) {
  const id = __t(r?.id).toUpperCase();
  return (
    id === "GATE__AGE" ||
    id === "GATE__EDUCATION_GATE_FAIL" ||
    id === "GATE__CRITICAL_EXPERIENCE_GAP" ||
    id === "GATE__DOMAIN_MISMATCH__JOB_FAMILY"
  );
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
  let maxSalaryP = 0;
  let maxNonSalaryP = 0;
  let hasHardStructuralGate = false;
  for (const r of arr) {
    if (!r) continue;
    if (__t(r.layer) !== "gate") continue;
    const p = __clamp(r.priority, 0, 100);
    if (p > maxP) maxP = p;
    if (__isSalaryGate(r)) {
      if (p > maxSalaryP) maxSalaryP = p;
    } else {
      if (p > maxNonSalaryP) maxNonSalaryP = p;
      if (__isHardStructuralGateForSalaryPolicy(r)) hasHardStructuralGate = true;
    }
  }
  // 단계형(현실적인 급락 반영)
  let boost = 0;
  if (maxP >= 95) boost = 0.35;
  else if (maxP >= 85) boost = 0.25;
  else if (maxP >= 70) boost = 0.15;
  else if (maxP >= 60) boost = 0.08;
  else if (maxP >= 50) boost = 0.04;

  // ✅ PATCH (append-only): salary gate influence clamp on secondary channel (pressure)
  // - salary gate가 top/dominant이고 hard structural gate가 없을 때만 완화
  const __salaryTop = maxSalaryP > 0 && maxSalaryP >= maxP;
  const __salaryDominant = maxSalaryP > 0 && maxSalaryP >= (maxNonSalaryP + 10);
  const __applySalaryClamp =
    !hasHardStructuralGate &&
    (
      SALARY_GATE_INFLUENCE_POLICY.onlyWhenSalaryIsTopGate
        ? (__salaryTop || __salaryDominant)
        : maxSalaryP > 0
    );
  if (__applySalaryClamp) {
    boost = Math.min(boost, SALARY_GATE_INFLUENCE_POLICY.pressureMax);
  }

  // 안전 상한
  return __clamp(boost, 0, 0.35);
}

function evalRiskProfiles({ state, ai, structural, evidenceFit = null, competencyExpectation = null } = {}) {
  const structuralFlags = structural?.flags || structural?.structuralFlags || [];
  const metrics = structural?.metrics || {};

  const ctx = {
    state,
    ai,
    structural,
    flags: structuralFlags,
    metrics,
    competencyExpectation:
      competencyExpectation && typeof competencyExpectation === "object"
        ? competencyExpectation
        : null,
    // [PATCH] Explanation Bridge v1 — explain 함수에서 evidenceFit 직접 접근 가능하게 (append-only)
    evidenceFit: (evidenceFit && typeof evidenceFit === "object") ? evidenceFit : null,
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
          // [FIX] "powerbi"를 제거하고 "power bi"로 통합 — aliases로 powerbi/PBI 표기 처리
          const __toolAllow = ["sap", "oracle", "salesforce", "excel", "power bi", "sql", "python", "aws", "gcp", "azure"];
          const __toolAliases = {
            sap: ["sap", "s/4", "s4", "s/4hana", "hana"],
            oracle: ["oracle", "oracle erp"],
            salesforce: ["salesforce", "sf", "sfdc"],
            excel: ["excel", "엑셀"],
            "power bi": ["power bi", "powerbi", "pbi"],
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
          // [FIX] "powerbi" 제거 — "power bi"로 통합 (aliases로 powerbi/PBI 처리)
          const __toolAllow = ["sap", "oracle", "salesforce", "excel", "power bi", "sql", "python", "aws", "gcp", "azure"];
          const __toolAliases = {
            sap: ["sap", "s/4", "s4", "s/4hana", "hana"],
            oracle: ["oracle", "oracle erp"],
            salesforce: ["salesforce", "sf", "sfdc"],
            excel: ["excel", "엑셀"],
            "power bi": ["power bi", "powerbi", "pbi"],
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
  const __hasRisk = (id) =>
    Array.isArray(out) && out.some((r) => String(r?.id || "") === String(id || ""));
  ctx.__hasRisk = __hasRisk;
  const __excludeMismatchByCanonicalRule = Boolean(
    ctx?.state?.canonical?.rules?.excludeCurrentTargetMismatch
  );

  const __shouldSkipByCanonicalRule = (profile) => {
    if (!__excludeMismatchByCanonicalRule) return false;
    const pid = String(profile?.id || "");
    return (
      pid === "domainShiftRisk" ||
      pid === "RISK__COMPANY_SIZE_JUMP" ||
      pid === "HIGH_RISK__COMPANY_SIZE_JUMP_COMPOSITE" ||
      pid === "GATE__SALARY_MISMATCH" ||
      pid === "salaryDownshiftRisk"
    );
  };

  // ✅ PATCH (append-only): profile evidence -> risk explain bridge normalizer
  // - 허용 입력: array | string | object
  // - score/gate/priority/정렬 무영향 (설명 필드만 보강)
  const __normalizeProfileEvidenceBridge = (raw) => {
    const __toList = (v) => {
      if (Array.isArray(v)) {
        return v
          .map((x) => (x == null ? "" : String(x)).trim())
          .filter(Boolean);
      }
      if (typeof v === "string") {
        const s = v.trim();
        return s ? [s] : [];
      }
      return [];
    };
    const __toTitle = (v) => {
      if (typeof v !== "string") return "";
      const s = v.trim();
      return s || "";
    };

    if (Array.isArray(raw)) {
      return {
        title: "",
        evidence: __toList(raw),
        signals: [],
        jdEvidence: [],
        resumeEvidence: [],
        notes: [],
        evidenceKeys: [],
        why: [],
        action: [],
        counter: [],
      };
    }

    if (typeof raw === "string") {
      return {
        title: "",
        evidence: __toList(raw),
        signals: [],
        jdEvidence: [],
        resumeEvidence: [],
        notes: [],
        evidenceKeys: [],
        why: [],
        action: [],
        counter: [],
      };
    }

    if (raw && typeof raw === "object") {
      const o = raw;
      const __knownKeys = new Set([
        "title", "evidence", "items", "signals", "jdEvidence", "resumeEvidence",
        "notes", "evidenceKeys", "why", "action", "actions", "counter",
        "counterExamples", "counterexamples", "counterExample", "counterexample", "fix",
      ]);
      const __kvEvidence = [];
      const __jdHints = [];
      const __resumeHints = [];
      for (const [k, v] of Object.entries(o)) {
        if (__knownKeys.has(k)) continue;
        if (v == null) continue;
        if (Array.isArray(v) || typeof v === "object") continue;
        const s = String(v).trim();
        if (!s) continue;
        const kv = `${k}=${s}`;
        __kvEvidence.push(kv);
        const kl = String(k).toLowerCase();
        if (kl.startsWith("jd") || kl.includes("required") || kl.includes("target")) {
          __jdHints.push(kv);
        }
        if (kl.startsWith("resume") || kl.includes("current") || kl.includes("candidate")) {
          __resumeHints.push(kv);
        }
      }
      const __evidence = __toList(o.evidence ?? o.items);
      const __jdEvidence = __toList(o.jdEvidence);
      const __resumeEvidence = __toList(o.resumeEvidence);
      return {
        title: __toTitle(o.title),
        evidence: __evidence.length ? __evidence : __kvEvidence,
        signals: __toList(o.signals),
        jdEvidence: __jdEvidence.length ? __jdEvidence : __jdHints,
        resumeEvidence: __resumeEvidence.length ? __resumeEvidence : __resumeHints,
        notes: __toList(o.notes),
        evidenceKeys: __toList(o.evidenceKeys),
        why: __toList(o.why),
        action: __toList(o.action ?? o.actions ?? o.fix),
        counter: __toList(o.counter ?? o.counterExamples ?? o.counterexamples ?? o.counterExample ?? o.counterexample),
      };
    }

    return {
      title: "",
      evidence: [],
      signals: [],
      jdEvidence: [],
      resumeEvidence: [],
      notes: [],
      evidenceKeys: [],
      why: [],
      action: [],
      counter: [],
    };
  };

  const __mergeExplainWithEvidenceBridge = (explain, normalizedEvidence) => {
    const ex = explain && typeof explain === "object" && !Array.isArray(explain) ? explain : {};
    const ev = normalizedEvidence && typeof normalizedEvidence === "object" ? normalizedEvidence : {};

    const __pickArr = (a, b) => {
      const aa = Array.isArray(a) ? a : [];
      if (aa.length > 0) return aa;
      const bb = Array.isArray(b) ? b : [];
      return bb.length > 0 ? bb : aa;
    };
    const __pickTitle = (a, b) => {
      const aa = typeof a === "string" ? a.trim() : "";
      if (aa) return aa;
      const bb = typeof b === "string" ? b.trim() : "";
      return bb || aa;
    };

    return {
      ...ex,
      title: __pickTitle(ex?.title, ev?.title),
      why: __pickArr(ex?.why, ev?.why),
      action: __pickArr(ex?.action, ev?.action),
      counter: __pickArr(ex?.counter, ev?.counter),
      signals: __pickArr(ex?.signals, ev?.signals),
      evidence: __pickArr(ex?.evidence, ev?.evidence),
      jdEvidence: __pickArr(ex?.jdEvidence, ev?.jdEvidence),
      resumeEvidence: __pickArr(ex?.resumeEvidence, ev?.resumeEvidence),
      notes: __pickArr(ex?.notes, ev?.notes),
      evidenceKeys: __pickArr(ex?.evidenceKeys, ev?.evidenceKeys),
    };
  };

  const RISK_INTERVIEW_RULES = {
    TITLE_SENIORITY_MISMATCH: {
      oneLiner: "JD 요구 연차 대비 경력 수준이 경계선에 있어 서류 단계에서 보수적으로 해석될 가능성이 있습니다.",
      question: "이 포지션이 요구하는 수준의 책임 범위나 의사결정을 실제로 맡아본 경험이 있다면, 가장 난도가 높았던 사례에서 본인이 어떤 판단을 했고 그 결과가 어떻게 이어졌는지 설명해 주실 수 있을까요?"
    },

    ROLE_SKILL_MISSING: {
      oneLiner: "JD 핵심 역량 일부가 이력서에서 명확히 확인되지 않아 직무 적합성 판단에 추가 검토가 필요할 수 있습니다.",
      question: "JD에서 중요하게 보는 역량이나 도구를 실제 업무에서 사용해 성과로 연결한 경험이 있다면, 어떤 상황에서 무엇을 직접 했고 그 결과가 어떻게 나왔는지 구체적으로 설명해 주실 수 있을까요?"
    },

    DOMAIN_SHIFT: {
      oneLiner: "이전 경험 도메인과 지원 포지션 도메인 간 차이가 있어 온보딩 리스크 관점에서 검토될 가능성이 있습니다.",
      question: "기존 경험과 다른 도메인으로 보일 수 있는데도 빠르게 적응할 수 있다고 판단한 근거가 무엇인지, 유사한 문제를 이전 경험에서 어떻게 해결했고 그것이 이 역할에 어떻게 전이될 수 있는지 설명해 주실 수 있을까요?"
    },

    OWNERSHIP_GAP: {
      oneLiner: "프로젝트 참여 경험은 확인되지만 주도적 책임 범위가 명확하지 않을 수 있습니다.",
      question: "이 경험이 단순 참여가 아니라 본인이 주도적으로 끌고 간 일이라고 판단할 수 있으려면, 어디까지를 본인이 직접 결정했고 어떤 결과에 책임졌는지 구체적으로 설명해 주실 수 있을까요?"
    },

    LANGUAGE_SIGNAL: {
      oneLiner: "성과와 역할 서술이 다소 일반적이어서 실제 기여 범위 확인이 필요할 수 있습니다.",
      question: "이력서 표현만으로는 기여도가 다소 추상적으로 읽히는데, 본인이 실제로 어떤 행동을 했고 그 결과 무엇이 달라졌는지 수치나 비교 가능한 기준으로 설명해 주실 수 있을까요?"
    },

    TIMELINE_INCONSISTENCY: {
      oneLiner: "경력 기간이나 역할 전환 흐름이 추가 확인이 필요할 수 있습니다.",
      question: "경력 흐름상 추가 확인이 필요한 구간이 보이는데, 해당 시기의 이동이나 공백, 혹은 짧은 재직이 어떤 맥락에서 발생했고 그 결정이 이후 커리어에 어떤 영향을 줬는지 설명해 주실 수 있을까요?"
    }
  };

  // append-only: InterviewQuestion v2 — followUp 질문 상수 (family별 1개)
  const FOLLOWUP_QUESTION_RULES = {
    TITLE_SENIORITY_MISMATCH:
      "그 사례에서 본인이 직접 내린 가장 중요한 의사결정은 무엇이었고, 그 판단이 결과에 어떤 영향을 줬는지 설명해 주실 수 있을까요?",
    ROLE_SKILL_MISSING:
      "그 경험에서 본인이 실제로 수행한 핵심 작업과, 그 작업이 결과에 어떻게 기여했는지 조금 더 구체적으로 설명해 주실 수 있을까요?",
    DOMAIN_SHIFT:
      "그 경험에서 사용했던 접근 방식이나 문제 해결 방법이 이 포지션의 문제와 어떻게 연결될 수 있는지 설명해 주실 수 있을까요?",
    OWNERSHIP_GAP:
      "그 프로젝트에서 본인이 직접 결정하거나 책임졌던 부분은 어디까지였고, 그 결정이 결과에 어떤 영향을 줬나요?",
    LANGUAGE_SIGNAL:
      "그 결과를 만들기 위해 실제로 어떤 행동을 했고, 이전 상태와 비교했을 때 무엇이 달라졌는지 설명해 주실 수 있을까요?",
    TIMELINE_INCONSISTENCY:
      "그 시기의 선택이나 이동이 이후 커리어 방향에 어떤 영향을 줬는지 설명해 주실 수 있을까요?",
  };

  const LAYER_QUESTION_RULES = {
    GATE:
      "이 포지션에서 요구하는 핵심 경험과 비교했을 때, 본인의 경험이 충분하다고 판단한 근거는 무엇인가요?",
    RISK:
      "이 경험에서 본인이 직접 해결한 가장 중요한 문제는 무엇이었고, 그 과정에서 어떤 의사결정을 했는지 설명해 주실 수 있을까요?",
    SIGNAL:
      "이 경험에서 본인의 실제 기여와 결과를 조금 더 구체적으로 설명해 주실 수 있을까요?",
    IX:
      "이 경험에서 가장 어려웠던 의사결정 상황과 그때 어떤 판단 기준으로 결정을 내렸는지 설명해 주실 수 있을까요?",
  };

  const GROUP_QUESTION_RULES = {
    ROLE_SKILL:
      "이 포지션에서 가장 중요한 역량이 무엇이라고 생각하시고, 그 역량을 실제로 사용했던 경험을 설명해 주실 수 있을까요?",
    DOMAIN:
      "이 포지션의 도메인 문제를 해결하기 위해 기존 경험을 어떻게 활용할 수 있다고 생각하시나요?",
    LANGUAGE:
      "이 경험에서 본인이 실제로 만든 결과와 그 결과가 조직에 어떤 영향을 줬는지 설명해 주실 수 있을까요?",
    TIMELINE:
      "이 시기의 커리어 이동이나 변화가 어떤 이유에서 발생했는지 설명해 주실 수 있을까요?",
    EXECUTION:
      "실행 과정에서 본인이 직접 책임지고 끝까지 가져간 업무가 무엇이었는지 설명해 주실 수 있을까요?",
    OWNERSHIP:
      "이 경험에서 본인이 주도적으로 결정하거나 책임졌던 범위를 구체적으로 설명해 주실 수 있을까요?",
  };

  const __resolveInterviewRuleKey = (rawRiskId) => {
    const raw = String(rawRiskId || "").trim();
    const up = raw.toUpperCase();

    if (!up) return "";

    // exact known keys
    if (RISK_INTERVIEW_RULES[up]) return up;

    // must-have / role-skill missing family
    if (
      up.includes("ROLE_SKILL__MUST_HAVE_MISSING") ||
      up.includes("MUST_HAVE_MISSING") ||
      up.includes("TOOL__MUST_HAVE_MISSING") ||
      up.includes("MUST__SKILL__MISSING") ||
      up.includes("MUST__TOOL__MISSING") ||
      up.includes("ROLE_SKILL__JD_KEYWORD_ABSENCE") ||
      up.includes("ROLE_SKILL__LOW_SEMANTIC_SIMILARITY")
    ) {
      return "ROLE_SKILL_MISSING";
    }

    // domain shift family
    if (
      up.includes("DOMAINSHIFT") ||
      up.includes("DOMAIN_SHIFT") ||
      up.includes("DOMAINSHIFTRISK") ||
      up.includes("DOMAIN__MISMATCH__JOB_FAMILY") ||
      up.includes("DOMAIN__WEAK__KEYWORD_SPARSE") ||
      up.includes("DOMAIN__EDUCATION_CONTEXT")
    ) {
      return "DOMAIN_SHIFT";
    }

    // ownership gap family
    if (
      up.includes("OWNERSHIP") ||
      up.includes("LEADERSHIP_GAP") ||
      up.includes("ROLE_OWNERSHIP") ||
      up.includes("LEADERSHIP__MISSING")
    ) {
      return "OWNERSHIP_GAP";
    }

    // language / weak evidence family
    if (
      up.includes("LANGUAGE") ||
      up.includes("WEAK_EVIDENCE") ||
      up.includes("LOW_CONTENT_DENSITY") ||
      up.includes("LOW_ROLE_SPECIFICITY") ||
      up.includes("LOW_CONFIDENCE_LANGUAGE_RISK") ||
      up.includes("WEAK_ASSERTION_RISK") ||
      up.includes("PASSIVE_VOICE_OVERUSE_RISK") ||
      up.includes("HEDGE_LANGUAGE_RISK") ||
      up.includes("IMPACT__NO_QUANTIFIED_IMPACT") ||
      up.includes("IMPACT__LOW_IMPACT_VERBS") ||
      up.includes("IMPACT__PROCESS_ONLY") ||
      up.includes("RISK__EXECUTION_IMPACT_GAP") ||
      up.includes("IX__EXECUTION_GAP_X_IMPACT_GAP")
    ) {
      return "LANGUAGE_SIGNAL";
    }

    // title/seniority mismatch family
    if (
      up.includes("SENIORITY__UNDER_MIN_YEARS") ||
      up.includes("RISK__ROLE_LEVEL_MISMATCH") ||
      up.includes("TITLE_SENIORITY_MISMATCH") ||
      up.includes("AGE_SENIORITY_GAP") ||
      up.includes("GATE__CRITICAL_EXPERIENCE_GAP") ||
      up.includes("IX__ROLE_LEVEL_X_COMPANY_JUMP") ||
      up.includes("IX__EXP_GAP_X_EXECUTION_GAP")
    ) {
      return "TITLE_SENIORITY_MISMATCH";
    }

    // timeline inconsistency family
    if (
      up.includes("TIMELINE") ||
      up.includes("INCONSISTENCY") ||
      up.includes("JOB_HOPPING_DENSITY") ||
      up.includes("IX__EXP_GAP_X_JOB_HOPPING")
    ) {
      return "TIMELINE_INCONSISTENCY";
    }

    // keep known id as-is (fallback to generic in builder if no rule)
    return up;
  };

  const __buildInterviewerNote = (explainObj, normalizedEvidence, ctxLite = {}) => {
    const ex = explainObj && typeof explainObj === "object" ? explainObj : {};
    const ev = normalizedEvidence && typeof normalizedEvidence === "object" ? normalizedEvidence : {};

    const __toCleanList = (arr) =>
      (Array.isArray(arr) ? arr : [])
        .map((x) => String(x || "").trim())
        .filter(Boolean);

    const why = __toCleanList(ex?.why);
    const evidence = __toCleanList(ex?.evidence);
    const signals = __toCleanList(ex?.signals);
    const notes = __toCleanList(ex?.notes);

    const concerns = why.slice(0, 2);

    const evidenceLine = (() => {
      const __isUsableEvidence = (s) => {
        const t = String(s || "").trim();
        if (!t) return false;
        if (t.length > 120) return false;
        if (/^(리스크|분석|설명|노트|메모|가능성|검토|판단)/.test(t)) return false;
        return true;
      };
      const __pickFirst = (arr) => {
        for (const x of arr) {
          const t = String(x || "").trim();
          if (__isUsableEvidence(t)) return t;
        }
        return "";
      };
      // evidence 우선, 없으면 signals/notes fallback
      let line = __pickFirst(evidence);
      if (!line) line = __pickFirst(signals);
      if (!line) line = __pickFirst(notes);
      if (!line) {
        const evFallback = __toCleanList(ev?.evidence);
        const sgFallback = __toCleanList(ev?.signals);
        const ntFallback = __toCleanList(ev?.notes);
        line = __pickFirst(evFallback) || __pickFirst(sgFallback) || __pickFirst(ntFallback) || "";
      }
      if (!line) return "";
      return line.length > 90 ? `${line.slice(0, 89)}…` : line;
    })();

    const riskIdRaw = String(ctxLite?.id || "");
    const riskKey = __resolveInterviewRuleKey(riskIdRaw);
    const rule = RISK_INTERVIEW_RULES[riskKey] || null;

    // Debug snapshot (optional): remove if no longer needed.
    try {
      globalThis.__PASSMAP_IV_RULE_LAST__ = {
        rawRiskId: riskIdRaw,
        canonicalKey: riskKey,
        ruleHit: !!rule,
        at: Date.now(),
      };
    } catch { }

    if (rule) {
      return {
        oneLiner: rule.oneLiner,
        concerns,
        evidenceLine
      };
    }

    const layer = String(ctxLite?.layer || "").toLowerCase();
    const group = String(ctxLite?.group || "").toLowerCase();

    const oneLiner = (() => {
      if (layer === "gate") {
        return "필수 조건 충족 여부가 불명확해 보수적 스크리닝으로 판단될 가능성이 있습니다.";
      }
      if (group.includes("role") || group.includes("skill")) {
        return "직무 즉시전력성 관점에서 핵심 요건 정합성에 의문이 생길 수 있습니다.";
      }
      if (group.includes("language") || group.includes("timeline")) {
        return "서술 신뢰도/경력 연속성 검토가 추가로 필요하다고 판단될 가능성이 있습니다.";
      }
      return "핵심 근거 밀도가 낮아 면접관이 보수적으로 해석할 가능성이 있습니다.";
    })();

    return {
      oneLiner,
      concerns,
      evidenceLine,
    };
  };

  // PASSMAP Interview Question v1 → v2 (append-only: followUp 추가)
  function __buildInterviewQuestionV1(ctx) {
    const family = ctx?.canonicalKey || null;
    const layer = String(ctx?.layer || "").trim().toUpperCase();
    const group = String(ctx?.group || "").trim().toUpperCase();

    const GENERIC_FALLBACK =
      "이 경험에서 본인이 직접 해결한 문제와 그 결과를 구체적으로 설명해 주실 수 있을까요?";

    const FOLLOWUP_FALLBACK =
      "그 상황에서 본인이 직접 한 행동과 그로 인해 달라진 결과를 조금 더 구체적으로 설명해 주실 수 있을까요?";

    const __toResult = (primary, canonicalKey, ruleHit, source) => ({
      primary,
      canonicalKey: canonicalKey || null,
      ruleHit: Boolean(ruleHit),
      version: "v1",
      source,
    });

    let result;

    if (family) {
      const familyRule = RISK_INTERVIEW_RULES?.[family];
      if (familyRule?.question) {
        result = __toResult(
          familyRule.question,
          family,
          true,
          "canonical_family_rule"
        );
      }
    }

    if (!result && layer && LAYER_QUESTION_RULES[layer]) {
      result = __toResult(
        LAYER_QUESTION_RULES[layer],
        family,
        false,
        "layer_fallback"
      );
    }

    if (!result && group && GROUP_QUESTION_RULES[group]) {
      result = __toResult(
        GROUP_QUESTION_RULES[group],
        family,
        false,
        "group_fallback"
      );
    }

    if (!result) {
      result = __toResult(
        GENERIC_FALLBACK,
        family,
        false,
        "generic_fallback"
      );
    }

    // append-only: v2 — followUp 추가 (family hit 시 전용 followUp, 없으면 fallback)
    const followUp =
      (family && FOLLOWUP_QUESTION_RULES[family])
        ? FOLLOWUP_QUESTION_RULES[family]
        : FOLLOWUP_FALLBACK;

    return {
      ...result,
      followUp,
      version: "v2",
    };
  }

  for (const p of riskProfiles) {
    try {
      if (!p || typeof p.when !== "function") continue;
      if (__shouldSkipByCanonicalRule(p)) continue;
      if (!p.when(ctx)) continue;
      const score = typeof p.score === "function" ? p.score(ctx) : 0;
      const explain = typeof p.explain === "function" ? p.explain(ctx) : null;
      const rawEvidence = typeof p.evidence === "function" ? p.evidence(ctx) : null;
      const normalizedEvidence = __normalizeProfileEvidenceBridge(rawEvidence);
      const explainMerged = __mergeExplainWithEvidenceBridge(explain, normalizedEvidence);
      // [PATCH] keep new "context importance" fields (append-only)
      // - A단계: 점수/정렬 영향 없이 설명용 필드만 top-level로 전달
      const __impactLevel = explainMerged && typeof explainMerged === "object" ? explainMerged.impactLevel : undefined;
      const __importanceWeight = explainMerged && typeof explainMerged === "object" ? explainMerged.importanceWeight : undefined;
      const __impactReasons = explainMerged && typeof explainMerged === "object" ? explainMerged.impactReasons : undefined;
      const dynamicPriority =
        typeof p.layer === "string" && p.layer === "gate"
          ? Math.round((score ?? 0) * 100)
          : p.priority;

      const __evidenceTopLevel = (() => {
        if (rawEvidence == null) return undefined;
        if (rawEvidence && typeof rawEvidence === "object" && !Array.isArray(rawEvidence)) {
          return rawEvidence;
        }
        const out = {};
        if (Array.isArray(normalizedEvidence?.evidence) && normalizedEvidence.evidence.length) out.evidence = normalizedEvidence.evidence;
        if (Array.isArray(normalizedEvidence?.signals) && normalizedEvidence.signals.length) out.signals = normalizedEvidence.signals;
        if (Array.isArray(normalizedEvidence?.jdEvidence) && normalizedEvidence.jdEvidence.length) out.jdEvidence = normalizedEvidence.jdEvidence;
        if (Array.isArray(normalizedEvidence?.resumeEvidence) && normalizedEvidence.resumeEvidence.length) out.resumeEvidence = normalizedEvidence.resumeEvidence;
        if (Array.isArray(normalizedEvidence?.notes) && normalizedEvidence.notes.length) out.notes = normalizedEvidence.notes;
        if (Array.isArray(normalizedEvidence?.evidenceKeys) && normalizedEvidence.evidenceKeys.length) out.evidenceKeys = normalizedEvidence.evidenceKeys;
        return Object.keys(out).length ? out : undefined;
      })();

      const __interviewerNote = __buildInterviewerNote(
        explainMerged,
        normalizedEvidence,
        { id: p.id, layer: p.layer, group: p.group }
      );
      const explainOut = {
        ...explainMerged,
        interviewerNote: __interviewerNote,
      };

      // PASSMAP Interview Question v1
      try {
        const rawRiskRow = p;
        const rawRiskId = String(rawRiskRow.id || "");
        const canonicalKey = __resolveInterviewRuleKey(rawRiskId);

        explainOut.interviewQuestion = __buildInterviewQuestionV1({
          canonicalKey,
          rawRiskId,
          layer: rawRiskRow.layer || null,
          group: rawRiskRow.group || null,
        });
      } catch (e) {
        explainOut.interviewQuestion = {
          primary:
            "이 경험에서 본인의 역할과 실제 기여가 무엇이었는지 구체적으로 설명해 주실 수 있을까요?",
          canonicalKey: null,
          ruleHit: false,
          version: "v1",
          source: "generic_fallback",
        };
      }

      out.push({
        id: p.id,
        group: p.group,
        layer: p.layer,
        priority: dynamicPriority,
        score,
        explain: explainOut,
        evidence: __evidenceTopLevel,
        // [PATCH] top-level mirrors (append-only)
        impactLevel: __impactLevel,
        importanceWeight: __importanceWeight,
        impactReasons: __impactReasons,
      });
    } catch {
      // crash-safe: 媛쒕퀎 profile ?ㅽ뙣??臾댁떆
    }
  }

  // [CONTRACT] 정렬 기준: priority 단독. score를 tiebreaker로 쓰는 것은 계약 위반이므로 제거.
  out.sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );


  return out;
}

// 湲곗〈 ?⑥닔 PATCHED (append-only)
export function buildDecisionPack({ state, ai, structural, hiddenRisk = null, careerSignals = null, evidenceFit = null, roleDistance = null, competencyExpectation = null } = {}) {
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
    riskResults = evalRiskProfiles({ state, ai, structural, evidenceFit, competencyExpectation });
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
      __feedEval = evalRiskProfiles({ state: __stateForFeed, ai, structural, evidenceFit, competencyExpectation });
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
        __gateEval = evalRiskProfiles({ state: __stateForGate, ai, structural, evidenceFit, competencyExpectation });
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

    // [FIX] "powerbi" 제거 — "power bi"로 통합 (aliases로 powerbi/PBI 처리)
    const __toolAllow = [
      // v1: 최소 침습 allowlist (원하면 추후 확장)
      "sap",
      "oracle",
      "salesforce",
      "excel",
      "power bi",
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
    function __norm(s) {
      return (s == null ? "" : String(s)).toLowerCase();
    }
    function __hasAny(text, arr) {
      const t = __norm(text);
      if (!t) return false;
      for (const k of arr) {
        const kk = __norm(k);
        if (kk && t.includes(kk)) return true;
      }
      return false;
    }

    // JD에서 "필수/required/must" 문맥으로 명시된 툴만 추출
    function __extractMustToolsFromJD(jdText) {
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
    }

    function __hasToolInResume(resumeText, tool) {
      const t = __norm(resumeText);
      if (!t) return false;
      const aliases = Array.isArray(__toolAliases[tool]) ? __toolAliases[tool] : [tool];
      return __hasAny(t, aliases);
    }
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
        // ✅ append-only: bridge careerSignals -> SENIORITY evidence (for grayZone + test runner)
        try {
          const cs = careerSignals && typeof careerSignals === "object" ? careerSignals : null;
          if (cs && Array.isArray(riskResults)) {
            const g = riskResults.find(r => String(r?.id || "") === "SENIORITY__UNDER_MIN_YEARS");
            if (g) {
              if (!g.evidence || typeof g.evidence !== "object") g.evidence = {};
              if (typeof g.evidence.gapMonthsAbs === "undefined" && typeof cs.gapMonthsAbs !== "undefined") g.evidence.gapMonthsAbs = cs.gapMonthsAbs;
              if (typeof g.evidence.jdMinYears === "undefined" && cs.requiredYears && typeof cs.requiredYears.min !== "undefined") g.evidence.jdMinYears = cs.requiredYears.min;
              if (typeof g.evidence.resumeYears === "undefined" && typeof cs.resumeYears !== "undefined") g.evidence.resumeYears = cs.resumeYears;
            }
          }
        } catch { }
      }
    }
  } catch {
    // ignore (never crash)
  }
  // [PATCH] gate -> decisionPressure boost (append-only)
  // gateBoostValue/gateBoost/merged — domain gate 주입 이후로 이동 (CASE-4 pressure bug fix 참조)
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
  // gateBoost/merged — domain gate 주입 이후 선언됨 (아래 PATCH 참조)
  const __evidenceFit =
    (evidenceFit && typeof evidenceFit === "object" ? evidenceFit : null) ||
    (state?.analysis?.evidenceFit && typeof state.analysis.evidenceFit === "object" ? state.analysis.evidenceFit : null) ||
    (state?.evidenceFit && typeof state.evidenceFit === "object" ? state.evidenceFit : null) ||
    null;
  const evidencePenalty = Number(__evidenceFit?.penalty || 0);
  const __evidencePenaltySafe = Number.isFinite(evidencePenalty) ? Math.max(0, evidencePenalty) : 0;
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

  // ✅ PATCH (append-only): GATE__DOMAIN_MISMATCH__JOB_FAMILY — cap 계산 직전
  try {
    // schema JSON 여부 판별 (musthave/preferred/skills/timeline 등 구조 키가 많으면 schema로 간주)
    const __isSchemaJson = (s) => {
      if (typeof s !== "string") return false;
      if (!s.startsWith("{")) return false;
      const schemaKeys = [
        '"musthave"', '"preferred"', '"skills"', '"timeline"',
        '"jobtitle"', '"summary"', '"achieve"', '"core"',
        '"coretasks"', '"domainkeywords"', '"tools"',
      ];
      let hits = 0;
      for (const key of schemaKeys) { if (s.includes(key)) hits++; }
      return hits >= 2;
    };
    const __ptG = (...av) => {
      const labels = [
        "state.__parsedJD", "state.jdText", "state.jd", "state.jobDescription",
        "ctx.state.__parsedJD", "ctx.state.jdText", "ctx.state.jd",
        "state.__parsedResume", "state.resumeText", "state.resume", "state.cv",
        "ctx.state.__parsedResume", "ctx.state.resumeText", "ctx.state.resume",
      ];
      for (let _i = 0; _i < av.length; _i++) {
        const v = av[_i];
        const label = labels[_i] || ("arg" + _i);
        if (typeof v === "string" && v.trim() && !__isSchemaJson(v)) {
          return v;
        }
        if (v && typeof v === "object" && !Array.isArray(v)) {
          const ck = [
            ["text", v.text], ["raw", v.raw], ["value", v.value],
            ["content", v.content], ["jdText", v.jdText], ["resumeText", v.resumeText],
            ["original", v.original], ["source", v.source], ["jd", v.jd],
            ["resume", v.resume], ["originalText", v.originalText],
            ["textContent", v.textContent], ["plainText", v.plainText],
            ["fullText", v.fullText], ["body", v.body],
            ["input", v.input], ["sourceText", v.sourceText],
          ];
          for (const [key, c] of ck) {
            if (typeof c === "string" && c.trim() && !__isSchemaJson(c)) {
              return c;
            }
          }
          // fallback: Object.values join (schema가 아닌 string 값만)
          try {
            const vals = Object.values(v)
              .filter(x => typeof x === "string" && x.trim() && !__isSchemaJson(x));
            const joined = vals.join(" ");
            if (joined.length >= 120) {
              return joined.slice(0, 4000);
            }
          } catch {}
          // last resort: stringify (schema가 아닌 경우만)
          try {
            const s = JSON.stringify(v);
            if (s && s.length > 2 && !__isSchemaJson(s)) {
              return s.slice(0, 4000);
            }
          } catch {}
        }
      }
      return "";
    };
    const __jTG = __ptG(
      state?.__parsedJD,
      state?.jdText,
      state?.jdRaw,
      state?.jdTextRaw,
      state?.jdOriginal,
      state?.jdSource,
      state?.jd,
      state?.jd?.raw,
      state?.jd?.text,
      state?.jd?.content,
      state?.jd?.originalText,
      state?.input?.jd,
      state?.input?.jdText,
      state?.jobDescription,
      ctx?.state?.__parsedJD,
      ctx?.state?.jdText,
      ctx?.state?.jdRaw,
      ctx?.state?.jd,
      ctx?.state?.jd?.raw,
      ctx?.state?.jd?.text,
      ctx?.state?.jd?.content,
      ctx?.state?.input?.jd,
    ).toLowerCase();
    const __rTG = __ptG(
      state?.__parsedResume,
      state?.resumeText,
      state?.resume,
      state?.cv,
      ctx?.state?.__parsedResume,
      ctx?.state?.resumeText,
      ctx?.state?.resume,
    ).toLowerCase();
    if (__jTG.trim() && __rTG.trim()) {
      const __FAM = [
        {
          id: "sales",
          kw: [
            "sales", "account", "bd", "pipeline",
            "crm", "quota", "closing", "lead",
            "영업", "세일즈", "수주", "매출",
            "리드", "파이프라인", "딜", "고객",
          ],
        },
        {
          id: "procurement",
          kw: [
            "procurement", "purchasing", "sourcing",
            "구매", "조달", "소싱", "발주", "입찰", "원가",
          ],
        },
        {
          id: "marketing",
          kw: [
            "marketing", "brand", "campaign", "seo", "sem",
            "브랜딩", "캠페인", "퍼포먼스", "그로스",
          ],
        },
        {
          id: "finance",
          kw: [
            "finance", "fp&a", "accounting", "audit",
            "자금", "회계", "결산", "재무", "손익",
          ],
        },
        {
          id: "hr",
          kw: [
            "hr", "recruit", "talent", "compensation", "payroll",
            "채용", "인사", "평가", "보상",
          ],
        },
        {
          id: "data",
          kw: [
            "data", "sql", "bi", "analytics", "python",
            "데이터", "분석", "대시보드",
          ],
        },
        {
          id: "dev",
          kw: [
            "backend", "frontend", "api", "cloud", "aws", "react",
            "개발", "백엔드", "서버",
          ],
        },
        {
          id: "pm",
          kw: [
            "product manager", "prd", "roadmap", "requirement",
            "제품", "프로덕트", "로드맵", "기획",
          ],
        },
        {
          id: "ops",
          kw: [
            "operation", "ops", "logistics", "inventory", "wms",
            "운영", "물류", "재고",
          ],
        },
      ];
      const __sfam = (txt) => {
        const sc = {};
        for (const f of __FAM) {
          let c = 0;
          for (const k of f.kw) { if (txt.includes(String(k).toLowerCase())) c++; }
          sc[f.id] = c;
        }
        const pairs = Object.entries(sc).sort((a, b) => b[1] - a[1]);
        const top = pairs[0] || ["unknown", 0];
        const sec = pairs[1] || ["unknown", 0];
        const tc = Number(top[1]);
        const sc2 = Number(sec[1]);
        return {
          topId: top[0],
          topCount: tc,
          secondCount: sc2,
          scores: sc,
          confident: tc >= 3 && (tc - sc2) >= 2,
        };
      };
      const __jdF = __sfam(__jTG);
      const __rsF = __sfam(__rTG);
      const __kwInRs = Number(__rsF.scores?.[__jdF.topId] ?? 0);
      const __hasGate = Array.isArray(riskResults) &&
        riskResults.some(
          r => String(r?.id || "") === "GATE__DOMAIN_MISMATCH__JOB_FAMILY"
        );
      // [append-only] Role Ontology v1 — tier-based gate control
      const __EVIDENCE_RANK = { none: 0, weak: 1, mixed: 2, good: 3, strong: 4 };
      const __rdTier    = (roleDistance && typeof roleDistance === "object") ? String(roleDistance.tier || "unknown") : "unknown";
      const __rdEvRank  = __EVIDENCE_RANK[__evidenceFit?.level] ?? 0;
      // same / adjacent / transferable → keyword count gate 억제
      const __suppressDomainGate = __rdTier === "same" || __rdTier === "adjacent" || __rdTier === "transferable";
      // distant + 근거 없음(none/weak) → hard_mismatch 승격: 강제 gate
      const __forceDomainGate    = __rdTier === "distant" && __rdEvRank <= 1
        && roleDistance?.from !== "UNKNOWN" && roleDistance?.to !== "UNKNOWN";
      if (!__hasGate && !__suppressDomainGate && (__forceDomainGate || (__jdF.confident && __kwInRs <= 1))) {
        const __ts = Date.now();
        const __why0 =
          "JD 직무군('" + __jdF.topId +
          "')의 핵심 키워드가 이력서에서 " + __kwInRs + "개만 감지됩니다.";
        const __why1 = "서류 단계에서 직무 적합도 게이트를 통과하기 어렵습니다.";
        const __sig0 =
          "JD 패밀리: " + __jdF.topId +
          " (키워드 " + __jdF.topCount + "개 확인)";
        const __sig1 = "이력서에서 JD 패밀리 키워드: " + __kwInRs + "개";
        const __act0 =
          "지원 직무와 경험 접점을 이력서에 명시적으로 구성하거나, 이 JD는 재검토가 필요합니다.";
        riskResults.push({
          id: "GATE__DOMAIN_MISMATCH__JOB_FAMILY",
          group: "gates",
          layer: "gate",
          gateTriggered: true,
          priority: 97,
          score: 0.97,
          title: "도메인/직무군 완전 불일치 (게이트)",
          explain: {
            title: "도메인/직무군 완전 불일치 (게이트)",
            why: [__why0, __why1],
            signals: [__sig0, __sig1],
            action: [__act0],
            counter: [],
          },
          evidence: {
            jdFamily: __jdF.topId,
            jdFamilyKwCount: __jdF.topCount,
            resumeJdFamilyKwCount: __kwInRs,
            resumeTopFamily: __rsF.topId,
            resumeTopFamilyCount: __rsF.topCount,
          },
          meta: { source: "gate_domain_mismatch_v1", at: __ts },
        });
      }
    }
  } catch {}

  // ✅ PATCH (append-only): CASE-4 pressure channel bug fix
  // __computeGatePressureBoost를 GATE__DOMAIN_MISMATCH__JOB_FAMILY push(위 try 블록) 이후로 이동.
  // 이유: 기존 line ~1282 호출 시점에는 domain gate가 riskResults에 없어서
  //       hasHardStructuralGate=false로 오판, salary clamp가 잘못 발동됨.
  //       CASE-1/2/3/5는 domain gate 주입 여부와 무관하므로 동작 불변.
  const gateBoostValue = __computeGatePressureBoost(riskResults);
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
    const __requiredCoverage = (() => {
      const n0 = Number(
        structural?.metrics?.requiredCoverage ??
        state?.analysis?.structural?.metrics?.requiredCoverage ??
        state?.structural?.metrics?.requiredCoverage
      );
      return Number.isFinite(n0) ? n0 : null;
    })();

    const isPseudoGate = (r) => {
      const id = String(r?.id || "").toUpperCase();
      if (!id) return false;

      // PATCH: ROLE_SKILL__MUST_HAVE_MISSING 계열은 requiredCoverage 경계 구간 완화
      // - coverage가 숫자이며 0.40 이상이면 pseudo gate 승격하지 않음
      // - coverage를 읽을 수 없거나 숫자가 아니면 기존 동작 유지
      if (id.includes("ROLE_SKILL__MUST_HAVE_MISSING")) {
        if (__requiredCoverage !== null && __requiredCoverage >= 0.4) return false;
      }

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
    if (__maxGateP >= 97) return 28; // ✅ PATCH: 직무군 완전 불일치 게이트 cap (append-only)
    if (__maxGateP >= 95) return 52;
    if (__maxGateP >= 85) return 64;
    if (__maxGateP >= 75) return 74;
    if (__maxGateP >= 65) return 86;
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
        let __cap = 56;

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
              gapMonthsAbs: Number.isFinite(__gapM) ? __gapM : null,
              hits: Number.isFinite(__hits) ? __hits : null,
              reasons: Array.isArray(__reasons) ? __reasons : [],
              cap: Number.isFinite(__cap) ? __cap : null,
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
        return 56;
      }
    }
    // ✅ PATCH (append-only): pseudo must-have gate 완화 (ID 한정)
    if (id === "PSEUDO_GATE__ROLE_SKILL__MUST_HAVE_MISSING") {
      return Math.max(__baseCapByP, 62);
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
  // ✅ PATCH (append-only): salary gate secondary channel clamp (cap floor)
  // - salary gate가 top/dominant이고 hard structural gate가 없을 때만 완화
  const __capFinalAfterSalaryPolicy = (() => {
    if (typeof __capFinal !== "number") return __capFinal;
    if (!Array.isArray(__gateArr) || __gateArr.length === 0) return __capFinal;

    let maxSalaryP = 0;
    let maxNonSalaryP = 0;
    let hasHardStructuralGate = false;
    for (const g of __gateArr) {
      const p = __pickGateP(g);
      if (__isSalaryGate(g)) {
        if (p > maxSalaryP) maxSalaryP = p;
      } else {
        if (p > maxNonSalaryP) maxNonSalaryP = p;
        if (__isHardStructuralGateForSalaryPolicy(g)) hasHardStructuralGate = true;
      }
    }

    const salaryTop = maxSalaryP > 0 && maxSalaryP >= __maxGateP;
    const salaryDominant = maxSalaryP > 0 && maxSalaryP >= (maxNonSalaryP + 10);
    const applySalaryCapFloor =
      !hasHardStructuralGate &&
      (
        SALARY_GATE_INFLUENCE_POLICY.onlyWhenSalaryIsTopGate
          ? (salaryTop || salaryDominant)
          : maxSalaryP > 0
      );

    if (!applySalaryCapFloor) return __capFinal;
    return Math.max(__capFinal, SALARY_GATE_INFLUENCE_POLICY.capFloor);
  })();

  // raw score (0~100): matchRate 기반으로 분산 + 안전 기본값
  // - matchRate 없으면 61로 "회귀"하지 않게, 보수적으로 55로 둠
  const __rawScore = (() => {
    // 1) matchRate가 있으면 그걸 최우선 (piecewise, 34~92)
    if (typeof __match01 === "number") {
      let n;

      if (__match01 <= 0.25) {
        n = 34 + (__match01 * 64);
      } else if (__match01 <= 0.5) {
        n = 50 + ((__match01 - 0.25) * 52);
      } else if (__match01 <= 0.75) {
        n = 63 + ((__match01 - 0.5) * 72);
      } else {
        n = 81 + ((__match01 - 0.75) * 44);
      }

      return Math.round(Math.max(0, Math.min(100, n)));
    }

    // 2) matchRate가 없으면 merged.total 기반으로 분산 (AI 추가 없음)
    // - merged.total이 클수록(압력↑) 점수↓
    const total =
      (typeof merged?.total === "number" && Number.isFinite(merged.total)) ? merged.total : null;

    if (typeof total === "number") {
      let n;

      if (total <= 1.5) {
        n = 92 - (total * 8);
      } else if (total <= 3) {
        n = 80 - ((total - 1.5) * 8);
      } else if (total <= 5) {
        n = 68 - ((total - 3) * 11);
      } else {
        n = 46 - ((total - 5) * 8);
      }

      return Math.round(Math.max(20, Math.min(92, n)));
    }

    // 3) 최후 fallback (하지만 이제 웬만하면 여기 안 옴)
    return 50;
  })();
  // [append-only] PASSMAP P0-3: role ontology source normalization (short-first)
  const __pickRoleText = (...arr) => {
    for (const v of arr) {
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };
  const __pickRoleTextWithSource = (shortCandidates = [], longCandidates = []) => {
    const shortText = __pickRoleText(...shortCandidates);
    if (shortText) return { text: shortText, sourceType: "short" };
    const longText = __pickRoleText(...longCandidates);
    if (longText) return { text: longText, sourceType: "long" };
    return { text: "", sourceType: "none" };
  };
  const __parsedJDObj =
    (state?.__parsedJD && typeof state.__parsedJD === "object")
      ? state.__parsedJD
      : (state?.parsedJD && typeof state.parsedJD === "object")
        ? state.parsedJD
        : null;
  const __parsedResumeObj =
    (state?.__parsedResume && typeof state.__parsedResume === "object")
      ? state.__parsedResume
      : (state?.parsedResume && typeof state.parsedResume === "object")
        ? state.parsedResume
        : null;
  const __jdRolePick = __pickRoleTextWithSource(
    [
      state?.targetRole,
      state?.roleTarget,
      state?.role,
      __parsedJDObj?.role,
      __parsedJDObj?.title,
      __parsedJDObj?.jobTitle,
      state?.jdTitle,
      state?.jobTitle,
    ],
    [
      state?.jdText,
      state?.jd,
    ]
  );
  const __resumeRolePick = __pickRoleTextWithSource(
    [
      state?.currentRole,
      state?.roleCurrent,
      state?.resumeRole,
      __parsedResumeObj?.role,
      __parsedResumeObj?.title,
      __parsedResumeObj?.jobTitle,
      state?.resumeTitle,
    ],
    [
      state?.resumeText,
      state?.resume,
    ]
  );
  const __jdRoleText = __jdRolePick.text;
  const __resumeRoleText = __resumeRolePick.text;
  const __jdRoleSourceType = __jdRolePick.sourceType;
  const __resumeRoleSourceType = __resumeRolePick.sourceType;
  const __jdRoleFamily = inferRoleFamily(__jdRoleText);
  const __resumeRoleFamily = inferRoleFamily(__resumeRoleText);
  const __roleDistanceValue = getRoleDistance(__jdRoleFamily, __resumeRoleFamily);
  const __roleDistancePenaltyByDistanceFull = { 0: 0, 1: 5, 2: 12, 3: 25 };
  const __roleDistancePenaltyByDistanceReduced = { 0: 0, 1: 2, 2: 6, 3: 12 };
  const __hasBothRoleSources =
    __jdRoleSourceType !== "none" && __resumeRoleSourceType !== "none";
  const __isHighConfidenceRoleDistance =
    __jdRoleSourceType === "short" && __resumeRoleSourceType === "short";
  const __roleDistancePenaltyMode =
    !__hasBothRoleSources
      ? "off"
      : (__isHighConfidenceRoleDistance ? "full" : "reduced");
  const __roleDistanceConfidence =
    !__hasBothRoleSources
      ? "none"
      : (__isHighConfidenceRoleDistance ? "high" : "low");
  const __roleDistancePenalty =
    __roleDistancePenaltyMode === "off"
      ? 0
      : (__roleDistancePenaltyMode === "reduced"
        ? (__roleDistancePenaltyByDistanceReduced[__roleDistanceValue] ?? 12)
        : (__roleDistancePenaltyByDistanceFull[__roleDistanceValue] ?? 25));
  const __isKnownRoleSide = (family, sourceType) => {
    const fam = String(family || "UNKNOWN").toUpperCase();
    const src = String(sourceType || "none").toLowerCase();
    // known 판정은 family 우선 + sourceType none이면 unknown 쪽으로 강화
    if (src === "none") return false;
    return fam !== "UNKNOWN";
  };
  const __jdRoleKnown = __isKnownRoleSide(__jdRoleFamily, __jdRoleSourceType);
  const __resumeRoleKnown = __isKnownRoleSide(__resumeRoleFamily, __resumeRoleSourceType);
  const __roleKnownState =
    __jdRoleKnown
      ? (__resumeRoleKnown ? "known-known" : "known-unknown")
      : (__resumeRoleKnown ? "unknown-known" : "unknown-unknown");
  const __roleUncertaintyPenaltyByKnownState = {
    "known-known": 0,
    "known-unknown": 6,
    "unknown-known": 6,
    "unknown-unknown": 0,
  };
  const __bothRoleSourcesNone =
    __jdRoleSourceType === "none" && __resumeRoleSourceType === "none";
  const __roleUncertaintyPenalty =
    __bothRoleSourcesNone
      ? 0
      : (__roleUncertaintyPenaltyByKnownState[__roleKnownState] ?? 0);
  // UNKNOWN/none policy (append-only):
  // - known-known => distance only
  // - known-unknown => uncertainty only
  // - unknown-known => uncertainty only
  // - unknown-unknown => off
  const __roleOntologyStatus =
    __roleKnownState === "known-known"
      ? "active"
      : ((__roleKnownState === "unknown-unknown" || __bothRoleSourcesNone) ? "off" : "uncertain");
  const __roleOntologyReason = (() => {
    const jf = String(__jdRoleFamily || "UNKNOWN").toUpperCase();
    const rf = String(__resumeRoleFamily || "UNKNOWN").toUpperCase();
    if (__roleKnownState === "known-known") return "jd_family_known_resume_family_known";
    if (__roleKnownState === "known-unknown") return "jd_family_known_resume_family_unknown";
    if (__roleKnownState === "unknown-known") return "jd_family_unknown_resume_family_known";
    if (__bothRoleSourcesNone) return "both_role_sources_none";
    if (jf === "UNKNOWN" && rf === "UNKNOWN") return "jd_family_unknown_resume_family_unknown";
    return "role_ontology_state_unknown";
  })();

  const __rawScoreAfterEvidencePenalty = Math.max(
    0,
    Math.min(100, __rawScore - __evidencePenaltySafe - __roleDistancePenalty - __roleUncertaintyPenalty)
  );

  const __cappedScore =
    typeof __capFinalAfterSalaryPolicy === "number"
      ? Math.min(__rawScoreAfterEvidencePenalty, Math.max(0, Math.min(100, __capFinalAfterSalaryPolicy)))
      : __rawScoreAfterEvidencePenalty;

  const decisionScore = {
    raw: __rawScore,
    capped: __cappedScore,
    cap: (typeof __capFinalAfterSalaryPolicy === "number") ? __capFinalAfterSalaryPolicy : null,
    capReason:
      (typeof __capFinalAfterSalaryPolicy === "number")
        ? `gate_cap:${__capFinalAfterSalaryPolicy} (maxGateP:${__maxGateP}, gateId:${__maxGateId || "unknown"})`
        : "",
    meta: {
      matchRate01: (typeof __match01 === "number") ? __match01 : null,
      gateCount: __gateArr.length,
      maxGateP: __maxGateP,
      maxGateId: __maxGateId || null,
      evidencePenalty: __evidencePenaltySafe,
      roleDistancePenalty: __roleDistancePenalty,
      jdRoleSourceType: __jdRoleSourceType,
      resumeRoleSourceType: __resumeRoleSourceType,
      roleDistanceConfidence: __roleDistanceConfidence,
      roleDistancePenaltyMode: __roleDistancePenaltyMode,
      roleKnownState: __roleKnownState,
      roleUncertaintyPenalty: __roleUncertaintyPenalty,
      roleOntologyStatus: __roleOntologyStatus,
      roleOntologyReason: __roleOntologyReason,
      jdRoleFamily: __jdRoleFamily,
      resumeRoleFamily: __resumeRoleFamily,
      roleDistance: __roleDistanceValue,
      evidenceFitLevel: __evidenceFit?.level || null,
      evidenceFitOverallScore: Number.isFinite(Number(__evidenceFit?.overallScore))
        ? Number(__evidenceFit?.overallScore)
        : null,
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
            "및", "등", "수", "이상", "이하", "관련", "업무", "경험", "우대", "가능", "필수", "자격요건", "요구", "필요",
            "must", "required", "mandatory", "preferred", "nice", "to", "have"
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

  // ✅ append-only: Layer3(Domain) v1 — DOMAIN__MISMATCH__JOB_FAMILY / DOMAIN__WEAK__KEYWORD_SPARSE
  try {
    const __rr = Array.isArray(riskResults) ? riskResults : null;
    if (__rr) {
      const __has = (id) => __rr.some((r) => String(r?.id || "") === id);

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

        // v1 job-family dictionary (보수적/확장 가능)
        const __FAMILIES = [
          { id: "procurement", kw: ["procurement", "purchasing", "sourcing", "rfq", "rfx", "rfi", "vendor", "supplier", "spend", "tender", "contract", "srM", "srM", "구매", "소싱", "조달", "입찰", "협력사", "발주", "원가", "단가", "협상", "계약"] },
          { id: "sales", kw: ["sales", "account", "bd", "business development", "pipeline", "crm", "quota", "closing", "lead", "prospecting", "영업", "세일즈", "고객", "수주", "매출", "리드", "파이프라인", "딜"] },
          { id: "marketing", kw: ["marketing", "brand", "campaign", "performance marketing", "growth", "seo", "sem", "paid", "콘텐츠", "브랜딩", "캠페인", "퍼포먼스", "그로스", "seo", "sem"] },
          { id: "finance", kw: ["finance", "fp&a", "accounting", "audit", "ifrs", "gaap", "closing", "p&l", "balance sheet", "자금", "회계", "결산", "재무", "손익", "원가회계"] },
          { id: "hr", kw: ["hr", "recruit", "talent", "people", "compensation", "c&b", "payroll", "od", "조직문화", "채용", "인사", "평가", "보상", "급여", "노무"] },
          { id: "data", kw: ["data", "sql", "bi", "analytics", "dashboard", "etl", "warehouse", "ml", "ai", "python", "tableau", "power bi", "데이터", "분석", "대시보드", "etl", "머신러닝", "ai", "파이썬"] },
          { id: "dev", kw: ["backend", "frontend", "fullstack", "api", "server", "cloud", "aws", "gcp", "azure", "kubernetes", "docker", "react", "node", "java", "spring", "개발", "백엔드", "프론트", "서버", "클라우드"] },
          { id: "pm", kw: ["product manager", "pm", "prd", "roadmap", "discovery", "requirement", "user story", "wireframe", "a/b", "제품", "프로덕트", "로드맵", "요구사항", "기획", "실험"] },
          { id: "ops", kw: ["operation", "ops", "process", "sop", "logistics", "inventory", "wms", "tms", "fulfillment", "운영", "프로세스", "물류", "재고", "wms", "풀필먼트"] },
        ];

        const __scoreFamily = (textL) => {
          const scores = {};
          for (const f of __FAMILIES) {
            let c = 0;
            for (const k of f.kw) {
              const kk = String(k || "").toLowerCase();
              if (!kk) continue;
              if (textL.includes(kk)) c += 1;
            }
            scores[f.id] = c;
          }
          // top2
          const pairs = Object.entries(scores).sort((a, b) => b[1] - a[1]);
          const top = pairs[0] || ["unknown", 0];
          const second = pairs[1] || ["unknown", 0];
          const topId = top[0];
          const topCount = Number(top[1] || 0);
          const secondCount = Number(second[1] || 0);
          // "confident" 기준(보수): topCount>=3 && topCount-secondCount>=2
          const confident = topCount >= 3 && (topCount - secondCount) >= 2;
          return { topId, topCount, secondId: second[0], secondCount, confident, scores };
        };

        const __jdFam = __scoreFamily(__jtL);
        const __rsFam = __scoreFamily(__rtL);

        // Rule 1) DOMAIN__MISMATCH__JOB_FAMILY
        if (!__has("DOMAIN__MISMATCH__JOB_FAMILY")) {
          const __mismatch =
            __jdFam.confident &&
            __rsFam.confident &&
            __jdFam.topId &&
            __rsFam.topId &&
            __jdFam.topId !== __rsFam.topId;

          if (__mismatch) {
            __rr.push({
              id: "DOMAIN__MISMATCH__JOB_FAMILY",
              group: "domain",
              layer: "domain",
              priority: 52,
              score: 0.42,
              evidence: {
                jdFamily: __jdFam.topId,
                resumeFamily: __rsFam.topId,
                jdTopCount: __jdFam.topCount,
                resumeTopCount: __rsFam.topCount,
              },
              explain: {
                title: "도메인/직무 방향 불일치",
                why: [
                  `JD는 '${__jdFam.topId}' 성격이 강한데, 이력서는 '${__rsFam.topId}' 쪽 근거가 더 강하게 잡혀요.`,
                  "서류에서 ‘왜 이 직무/도메인인가’ 질문이 강하게 들어올 수 있어요.",
                ],
                action: [
                  "이력서 상단 요약/핵심 프로젝트 1~2개를 JD 도메인 키워드에 맞춰 재배치하고, 동일 키워드로 근거 문장을 추가하세요.",
                ],
              },
              meta: { source: "domain_family_v1", at: Date.now(), confident: true },
            });
          }
        }

        // Rule 2) DOMAIN__WEAK__KEYWORD_SPARSE
        if (!__has("DOMAIN__WEAK__KEYWORD_SPARSE")) {
          // JD 상위 패밀리의 키워드 중, 이력서에 등장하는 수가 너무 적으면 "약함"
          const __fam = __FAMILIES.find((f) => f.id === __jdFam.topId) || null;
          if (__jdFam.confident && __fam) {
            const __famKws = Array.isArray(__fam.kw) ? __fam.kw : [];
            const __hits = [];
            for (const k of __famKws) {
              const kk = String(k || "").toLowerCase();
              if (!kk) continue;
              if (__jtL.includes(kk) && __rtL.includes(kk)) __hits.push(k);
            }

            // 보수 기준: JD 패밀리 확신인데, 교집합 키워드가 0~1개면 약함
            if (__hits.length <= 1) {
              __rr.push({
                id: "DOMAIN__WEAK__KEYWORD_SPARSE",
                group: "domain",
                layer: "domain",
                priority: 50,
                score: 0.32,
                evidence: {
                  jdFamily: __jdFam.topId,
                  overlapCount: __hits.length,
                  overlapSample: __hits.slice(0, 5),
                },
                explain: {
                  title: "도메인 근거(키워드) 희박",
                  why: [
                    "JD의 핵심 키워드가 이력서 문장에 충분히 연결되지 않아요.",
                    "경험이 있어도 ‘관련성’이 약하게 읽힐 수 있어요.",
                  ],
                  action: [
                    "프로젝트/업무 bullet에 JD 키워드(동일 표기)를 2~3개만 ‘근거와 함께’ 추가하세요. (툴/업무/성과를 한 문장에 묶기)",
                  ],
                },
                meta: { source: "domain_keyword_v1", at: Date.now() },
              });
            }
          }
        }
      }
    }
  } catch { }

  // ✅ append-only: Layer 4 (exp) + Layer 5 (preferred) v1
  try {
    // guard
    if (!Array.isArray(riskResults)) throw new Error("riskResults_not_array");

    const __jd = String(
      (typeof jdText !== "undefined" && jdText) ? jdText :
        (typeof state !== "undefined" && state && state.jdText) ? state.jdText :
          (typeof state !== "undefined" && state && state.analysis && state.analysis.jdText) ? state.analysis.jdText :
            (typeof decisionPack !== "undefined" && decisionPack && decisionPack.jdText) ? decisionPack.jdText :
              ""
    );

    const __rs = String(
      (typeof resumeText !== "undefined" && resumeText) ? resumeText :
        (typeof state !== "undefined" && state && state.resumeText) ? state.resumeText :
          (typeof state !== "undefined" && state && state.analysis && state.analysis.resumeText) ? state.analysis.resumeText :
            (typeof decisionPack !== "undefined" && decisionPack && decisionPack.resumeText) ? decisionPack.resumeText :
              ""
    );

    // -------------------------
    // helpers (local, no external deps)
    // -------------------------
    const __countHits = (text, regs) => {
      const t = String(text || "");
      let n = 0;
      for (const r of regs) {
        try {
          const m = t.match(r);
          if (m && m.length) n += m.length;
        } catch { }
      }
      return n;
    };

    const __uniq = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).filter(Boolean)));

    const __hasAny = (text, regs) => __countHits(text, regs) > 0;

    const __push = (r) => {
      // minimal shape (engine already tolerates partial fields)
      riskResults.push(r);
    };

    // -------------------------
    // Contract risks (append-only)
    // - non-gate risk signals
    // - priority intent:
    //   domain(50+) > seniority risk(48/46) > exp(39+)
    // -------------------------
    const __toNum = (v, d = NaN) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : d;
    };
    const __normText = (v) => String(v ?? "").trim().toLowerCase();
    const __levelToIndex = (v) => {
      const s = __normText(v);
      if (!s) return NaN;

      // numeric level (L3, level 4, lv5 ...)
      const m = s.match(/(?:^|[^a-z])(l|lv|level)\s*([0-9]{1,2})(?:$|[^a-z0-9])/i) || s.match(/^([0-9]{1,2})$/);
      if (m) {
        const n = Number(m[2] ?? m[1]);
        if (Number.isFinite(n)) return n;
      }

      // common Korean title ladder
      const rank = [
        "인턴",
        "사원",
        "주임",
        "대리",
        "과장",
        "차장",
        "부장",
        "이사",
        "상무",
        "전무",
        "부사장",
        "사장",
        "ceo",
      ];
      const idx = rank.findIndex((k) => s.includes(k));
      return idx >= 0 ? idx + 1 : NaN;
    };
    const __scoreBySeverity = (sev) => {
      const x = String(sev || "").toLowerCase();
      if (x === "strong") return 0.34;
      if (x === "medium") return 0.26;
      if (x === "weak") return 0.18;
      return 0;
    };
    const __hasRisk = (id) => Array.isArray(riskResults) && riskResults.some((r) => String(r?.id || "") === String(id || ""));

    // (A) TITLE_SENIORITY_MISMATCH (layer: seniority risk)
    try {
      if (!__hasRisk("TITLE_SENIORITY_MISMATCH") && !__hasRisk("RISK__ROLE_LEVEL_MISMATCH")) {
        const __cur = state?.levelCurrent;
        const __tgt = state?.levelTarget;
        const __curIdx = __levelToIndex(__cur);
        const __tgtIdx = __levelToIndex(__tgt);

        if (Number.isFinite(__curIdx) && Number.isFinite(__tgtIdx)) {
          const __levelGap = __tgtIdx - __curIdx;
          let __severity = "normal";
          if (__levelGap >= 2) __severity = "strong";
          else if (__levelGap === 1) __severity = "weak";

          if (__severity !== "normal") {
            __push({
              id: "TITLE_SENIORITY_MISMATCH",
              group: "seniority",
              layer: "seniority risk",
              priority: 48,
              score: __scoreBySeverity(__severity),
              severity: __severity,
              isGate: false,
              signalType: "risk_signal",
              evidence: {
                levelCurrent: __cur ?? null,
                levelTarget: __tgt ?? null,
                currentLevelIndex: __curIdx,
                targetLevelIndex: __tgtIdx,
                levelGap: __levelGap,
              },
              explain: {
                title: "직급 점프 정합성 리스크",
                why: __severity === "strong"
                  ? ["현재 직급 대비 목표 직급 점프 폭이 커, 역할 준비도에 대한 보수적 판단이 발생할 수 있습니다."]
                  : ["현재 직급 대비 목표 직급이 한 단계 높아, 역할 범위 확장에 대한 검증 질문이 나올 수 있습니다."],
                signals: [`levelGap=${__levelGap}`],
                action: ["현재 역할 대비 확장된 책임 범위를 수행한 사례를 먼저 제시하세요."],
                counter: [],
              },
            });
          }
        }
      }
    } catch { }

    // (B) AGE_SENIORITY_GAP (layer: seniority risk)
    try {
      if (!__hasRisk("AGE_SENIORITY_GAP")) {
        const __age = __toNum(state?.age, NaN);
        const __careerYearsFromCareer = __toNum(state?.career?.totalYears, NaN);
        const __careerYears = Number.isFinite(__careerYearsFromCareer)
          ? __careerYearsFromCareer
          : __toNum(state?.careerYears, NaN);

        if (Number.isFinite(__age) && Number.isFinite(__careerYears)) {
          const __expectedMaxAge = (() => {
            if (__careerYears <= 0) return 29;
            if (__careerYears <= 3) return 31;
            if (__careerYears <= 7) return 35;
            if (__careerYears <= 12) return 40;
            if (__careerYears <= 18) return 45;
            return Number.POSITIVE_INFINITY;
          })();
          const __deviation = Number.isFinite(__expectedMaxAge)
            ? (__age - __expectedMaxAge)
            : 0;

          let __severity = "normal";
          if (__deviation >= 10) __severity = "strong";
          else if (__deviation >= 6) __severity = "medium";
          else if (__deviation >= 3) __severity = "weak";

          if (__severity !== "normal") {
            __push({
              id: "AGE_SENIORITY_GAP",
              group: "seniority",
              layer: "seniority risk",
              priority: 46,
              score: __scoreBySeverity(__severity),
              severity: __severity,
              isGate: false,
              signalType: "risk_signal",
              evidence: {
                age: __age,
                careerYears: __careerYears,
                expectedMaxAge: Number.isFinite(__expectedMaxAge) ? __expectedMaxAge : null,
                deviation: __deviation,
              },
              explain: {
                title: "연차-연령 정합성 리스크",
                why: __severity === "strong"
                  ? ["연차 대비 연령 괴리가 큰 편으로 판단될 수 있어, 경력 공백/전환 사유에 대한 강한 검증 질문이 나올 수 있습니다."]
                  : __severity === "medium"
                    ? ["연차 대비 연령 괴리가 있어, 연차 공백과 역할 전환 맥락을 확인하려는 질문이 나올 수 있습니다."]
                    : ["연차 대비 연령 괴리가 다소 보여, 성장 경로와 전환 맥락에 대한 확인 질문이 나올 수 있습니다."],
                signals: [`expectedMaxAge=${Number.isFinite(__expectedMaxAge) ? __expectedMaxAge : "open"}`, `deviation=${__deviation}`],
                action: ["공백/전환 구간의 학습·성과 연결 근거를 먼저 제시하세요."],
                counter: [],
              },
            });
          }
        }
      }
    } catch { }

    // (C) JOB_HOPPING_DENSITY (layer: exp, exp 상단)
    try {
      if (!__hasRisk("JOB_HOPPING_DENSITY")) {
        const __jobChanges = __toNum(state?.career?.jobChanges, NaN);
        const __careerYears = __toNum(state?.career?.totalYears, NaN);

        if (Number.isFinite(__jobChanges) && Number.isFinite(__careerYears) && __careerYears > 0) {
          const __density = __jobChanges / __careerYears;
          let __severity = "normal";
          if (__density > 0.4) __severity = "strong";
          else if (__density > 0.25) __severity = "weak";

          if (__severity !== "normal") {
            __push({
              id: "JOB_HOPPING_DENSITY",
              group: "experience",
              layer: "exp",
              priority: 39,
              score: __scoreBySeverity(__severity),
              severity: __severity,
              isGate: false,
              signalType: "risk_signal",
              evidence: {
                jobChanges: __jobChanges,
                careerYears: __careerYears,
                density: __density,
              },
              explain: {
                title: "이직 밀도 리스크",
                why: __severity === "strong"
                  ? ["짧은 기간 내 이직 밀도가 높아 안정성 리스크로 해석될 수 있습니다."]
                  : ["이직 빈도가 다소 높은 편으로 보여, 이동 사유와 성과 연속성 설명이 중요합니다."],
                signals: [`density=${__density.toFixed(3)}`],
                action: ["이동 사유를 성과/역할 확장 흐름으로 연결해 설명하세요."],
                counter: [],
              },
            });
          }
        }
      }
    } catch { }

    // ============================================================
    // Layer 4 — Experience Fit (v1) 2 rules (no cap/gate impact)
    // ============================================================
    // (1) EXP__SCOPE__TOO_SHALLOW: 성과/수치/스코프 근거가 "희박"한 경우만 보수적으로
    const __impactRegs = [
      /\b(kpi|okr|roi|gmv|arr|mrr|cagr)\b/gi,
      /\b(revenue|sales|profit|margin|cost|saving|savings|growth)\b/gi,
      /\b(achiev|deliver|improv|reduc|increas|decreas|optimi)\w*\b/gi,
      /(\d+(\.\d+)?\s?%)/g,
      /(\d{1,3}(,\d{3})+|\d+)\s?(원|만원|억원|천만원|백만원|m|bn|k)\b/gi,
      /\b(성과|매출|이익|마진|비용|절감|개선|증가|감소|최적화|달성|기여)\b/g,
    ];
    const __scopeRegs = [
      /\b(end[-\s]?to[-\s]?end|e2e)\b/gi,
      /\b(own|owner|ownership|lead|leading|led|manage|managed)\w*\b/gi,
      /\b(project|program|portfolio|initiative)\b/gi,
      /\b(주도|리드|총괄|오너십|PM|PO|담당|책임)\b/g,
    ];

    const __impactHits = __countHits(__rs, __impactRegs);
    const __scopeHits = __countHits(__rs, __scopeRegs);

    // 보수 조건: impact + scope 둘 다 약하면만 shallow로 본다
    // - impactHits <= 1 AND scopeHits == 0
    if (__impactHits <= 1 && __scopeHits === 0 && !__hasRisk("RISK__EXECUTION_IMPACT_GAP")) {
      __push({
        id: "EXP__SCOPE__TOO_SHALLOW",
        group: "experience",
        layer: "exp",
        priority: 35,
        score: 0.28,
        evidence: {
          impactHits: __impactHits,
          scopeHits: __scopeHits,
          policy: "impactHits<=1 && scopeHits==0 => shallow",
        },
        explain: {
          title: "경력 근거(성과/스코프) 희박",
          why: [
            "이력서에서 수치/성과(KPI·%·금액) 근거가 거의 안 보이거나",
            "프로젝트 스코프(End-to-End/오너십/리딩) 단서가 부족해요.",
          ],
          tips: [
            "업무 1~2개만이라도 ‘무엇을-얼마나-어떻게’(수치)로 재작성",
            "본인 역할(주도/협업/결정권) 1줄 명시",
          ],
        },
      });
    }

    // (2) EXP__LEADERSHIP__MISSING: 리딩/주도 신호가 0인 경우만
    const __leadRegs = [
      /\b(lead|leading|led|owner|ownership|own|manage|managed|mentor)\w*\b/gi,
      /\b(pm|po|tech lead|team lead)\b/gi,
      /\b(주도|리드|총괄|오너십|책임|의사결정|조율|코칭|멘토)\b/g,
    ];
    const __leadHits = __countHits(__rs, __leadRegs);

    // 보수 조건: 리딩 히트 0 + ownershipExpected인 케이스만
    if (__leadHits === 0 && !__hasRisk("RISK__OWNERSHIP_LEADERSHIP_GAP") && ctx?.competencyExpectation?.ownershipExpected === true) {
      __push({
        id: "EXP__LEADERSHIP__MISSING",
        group: "experience",
        layer: "exp",
        priority: 30,
        score: 0.22,
        evidence: {
          leadershipHits: __leadHits,
          policy: "leadershipHits==0 => missing",
        },
        explain: {
          title: "주도/리딩(오너십) 신호 부족",
          why: [
            "협업/실행은 보여도 ‘내가 주도했다’는 문장이 거의 안 보여요.",
          ],
          tips: [
            "각 경험 bullet 1개는 ‘내가 주도한 결정/조율/추진’으로 작성",
            "‘누구와/무엇을/어떤 기준으로’ 해결했는지 1줄 추가",
          ],
        },
      });
    }

    // ============================================================
    // Layer 5 — Preferred (v1) 2 rules (긍정 요인, low score)
    // ============================================================
    // (1) PREF__TOOL__MATCH: JD에 등장하고 이력서에도 명시된 툴이 있으면 가점성 신호로 기록
    const __toolLex = [
      "sap", "excel", "powerbi", "tableau", "sql", "python", "r",
      "jira", "confluence", "notion", "slack",
      "aws", "gcp", "azure",
      "looker", "ga4", "bigquery",
    ];

    const __toolHits = [];
    for (const t of __toolLex) {
      const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\b`, "i");
      if (re.test(__jd) && re.test(__rs)) __toolHits.push(t.toLowerCase());
    }

    const __matchedTools = __uniq(__toolHits);
    if (__matchedTools.length > 0) {
      __push({
        id: "PREF__TOOL__MATCH",
        group: "preferred",
        layer: "preferred",
        priority: 18,
        score: 0.20,
        evidence: {
          matchedTools: __matchedTools,
          policy: "jd_has_tool && resume_has_tool => preferred_tool_match",
        },
        explain: {
          title: "우대 툴 매칭",
          why: [
            `JD에 나온 툴 중 이력서에 명시된 항목이 있어요: ${__matchedTools.slice(0, 6).join(", ")}${__matchedTools.length > 6 ? " ..." : ""}`,
          ],
          tips: [
            "툴 사용 근거(어떤 업무에서/어떤 기능을/어떤 결과로) 1줄만 덧붙이면 더 좋아요.",
          ],
        },
      });
    }

    // (2) PREF__DOMAIN__MATCH: 도메인 키워드 교집합이 '충분히' 있을 때만(보수적으로) 기록
    // - 이미 DOMAIN__WEAK__KEYWORD_SPARSE가 뜨는 케이스는 보통 제외될 확률이 높음
    const __domainKwRegs = [
      /\b(procurement|sourcing|vendor|rfq|rfx|po|contract|negotiation)\b/gi,
      /\b(strategy|planning|biz\s?plan|business\s?planning|market|pricing)\b/gi,
      /\b(finance|fp&a|budget|forecast|p&l)\b/gi,
      /\b(product|growth|retention|conversion|funnel)\b/gi,
      /\b(구매|소싱|협상|계약|발주|원가|절감|전략|기획|예산|손익|매출|전환)\b/g,
    ];

    const __jdDomHits = __countHits(__jd, __domainKwRegs);
    const __rsDomHits = __countHits(__rs, __domainKwRegs);

    // 보수 조건: JD/Resume 각각 최소 2회 이상 단서가 있어야 "match 가능성"으로 기록
    if (__jdDomHits >= 2 && __rsDomHits >= 2) {
      __push({
        id: "PREF__DOMAIN__MATCH",
        group: "preferred",
        layer: "preferred",
        priority: 16,
        score: 0.18,
        evidence: {
          jdDomainHits: __jdDomHits,
          resumeDomainHits: __rsDomHits,
          policy: "jdDomHits>=2 && resumeDomHits>=2 => preferred_domain_match",
        },
        explain: {
          title: "우대 도메인 정합 단서",
          why: [
            "JD/이력서 양쪽에서 같은 도메인 계열 키워드 단서가 반복돼요.",
          ],
          tips: [
            "도메인 키워드는 ‘업무 맥락+결과’랑 같이 붙이면 오탐이 줄어요.",
          ],
        },
      });
    }

    // optional: 표준 메타에 간단 카운트 기록 (운영용, 유지 가능)
    try {
      const __meta = (decisionScore && decisionScore.meta && typeof decisionScore.meta === "object") ? decisionScore.meta : null;
      if (__meta) {
        __meta.expV1 = { impactHits: __impactHits, scopeHits: __scopeHits, leadershipHits: __leadHits, at: Date.now() };
        __meta.preferredV1 = { matchedTools: __matchedTools, jdDomainHits: __jdDomHits, resumeDomainHits: __rsDomHits, at: Date.now() };
      }
    } catch { }
  } catch { /* silent */ }
  // ✅ append-only end: Layer 4 (exp) + Layer 5 (preferred) v1


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
  // [PATCH] Risk Interaction Layer v1 — explain-only / append-only
  // score / gate / cap / pressure / riskResults / riskFeed 에 무영향
  const interactions = buildRiskInteractions({
    riskResults,
    riskFeed,
    mode: __modeLocal,
  });

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
    interactions,

  };
}
