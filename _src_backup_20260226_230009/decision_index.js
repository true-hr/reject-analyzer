// src/lib/decision/index.js
// NOTE: decision ?덉씠???뷀듃由?
// - structuralPatterns 寃곌낵 + riskProfiles 寃곌낵瑜?紐⑥븘 decisionPack ?앹꽦

import { ALL_PROFILES } from "./riskProfiles/index.js";
import { computeStructuralDecisionPressure, mergeDecisionPressures } from "./decisionPressure.js";
import { SIMPLE_RISK_PROFILES } from "./simpleRiskProfiles";
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
  const normalized = arr.map(__normalizeRiskItem);

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
  const riskProfiles =
    mode === "simple"
      ? SIMPLE_RISK_PROFILES
      : (typeof ALL_RISK_PROFILES !== "undefined" && Array.isArray(ALL_RISK_PROFILES))
        ? ALL_RISK_PROFILES
        : ALL_PROFILES;
  const out = [];

  // [TMP_DEBUG] remove after verification
  let __tmp_total = 0;
  let __tmp_whenPass = 0;
  let __tmp_pushed = 0;
  let __tmp_caught = 0;

  for (const p of riskProfiles) {
    try {
      if (!p || typeof p.when !== "function") continue;
      __tmp_total++;
      if (!p.when(ctx)) continue;
      __tmp_whenPass++;
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
      __tmp_pushed++;
    } catch {
      __tmp_caught++;
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
export function buildDecisionPack({ state, ai, structural } = {}) {
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
  // [PATCH] gate -> decisionPressure boost (append-only)
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
  // TEMP DEBUG (삭제 필요): gateBoost/merged 적용 여부 확인
  const merged = mergeDecisionPressures(
    [structuralPressure, gateBoost, timeline, educationGate, overqualified, domainShift].filter(Boolean),
    { topN: 12 }
  );

  return {
    decisionPressure: merged,
    decisionComponents: {
      structural: structuralPressure,
      timeline,
      educationGate,
      overqualified,
      domainShift,
    },
    riskResults,
    structural,

  };
}



