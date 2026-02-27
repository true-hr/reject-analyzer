// src/lib/hiddenRisk/v11Stable.js
// Hidden Risk Engine — v1.1 Stable Config Spec (SSOT)
// - append-only safe module
// - outputs only: riskCount(0~5), riskLevel(optional), hasGateRisk(optional), confidence(0~100), debug(internal)

const ENGINE_VERSION = "v1.1";
const MAX_COUNT_SHOWN = 5;
const UPDATE_MODE = "commit";
const STRENGTH_MIN = 0;
const STRENGTH_MAX = 3;

// Bucket mapping (v1.1 완충형)
function bucketRiskCount(rawScore) {
    const s = Number(rawScore) || 0;
    if (s <= 24) return 0;
    if (s <= 39) return 1;
    if (s <= 59) return 2;
    if (s <= 79) return 3;
    if (s <= 99) return 4;
    return 5;
}

function riskLevelFromCount(c) {
    const n = Number(c) || 0;
    if (n <= 1) return "LOW";
    if (n <= 3) return "MEDIUM";
    return "HIGH";
}

function clamp(n, a, b) {
    const x = Number(n);
    if (!Number.isFinite(x)) return a;
    if (x < a) return a;
    if (x > b) return b;
    return x;
}

function pick(obj, paths) {
    for (const p of paths) {
        try {
            const parts = String(p).split(".");
            let cur = obj;
            let ok = true;
            for (const k of parts) {
                if (!cur || typeof cur !== "object" || !(k in cur)) {
                    ok = false;
                    break;
                }
                cur = cur[k];
            }
            if (ok && cur !== undefined && cur !== null) return cur;
        } catch { }
    }
    return undefined;
}

function toIntOrNull(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.trunc(n);
}

function toBoolOrNull(v) {
    if (v === true) return true;
    if (v === false) return false;
    if (v === 1 || v === "1" || String(v).toLowerCase() === "true") return true;
    if (v === 0 || v === "0" || String(v).toLowerCase() === "false") return false;
    return null;
}

// "30_40", "30-40", "30~40", "30to40" 같은 문자열에서 중간값(백만원 단위든 천만원 단위든 그냥 숫자 기반) 추출
function parseBandMid(v) {
    if (v == null) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v; // 이미 숫자면 그대로
    const s = String(v).trim();
    if (!s) return null;

    // 숫자 1개만 있으면 그 숫자
    const nums = s.match(/\d+(\.\d+)?/g);
    if (!nums || nums.length === 0) return null;

    const a = Number(nums[0]);
    const b = nums.length >= 2 ? Number(nums[1]) : NaN;
    if (!Number.isFinite(a)) return null;
    if (Number.isFinite(b)) return (a + b) / 2;
    return a;
}

function safePctJump(prevMid, expMid) {
    const p = Number(prevMid);
    const e = Number(expMid);
    if (!Number.isFinite(p) || !Number.isFinite(e)) return null;
    if (p <= 0) return null;
    return ((e - p) / p) * 100;
}

// 0~3 strength 강제
function clampStrength(s) {
    return clamp(Math.round(Number(s) || 0), STRENGTH_MIN, STRENGTH_MAX);
}

// ------- v1.1 rules (5 fixed) -------

function eval_R_STABILITY_GAP(norm) {
    const id = "R_STABILITY_GAP";
    const group = "stability";
    const weight = 6;

    const gap = norm.gap_last5y_months;
    if (gap === null) return { id, group, weight, evaluated: false, strength: 0 };

    let strength = 0;
    if (gap <= 2) strength = 0;
    else if (gap <= 5) strength = 1;
    else if (gap <= 11) strength = 2;
    else strength = 3;

    return { id, group, weight, evaluated: true, strength: clampStrength(strength), meta: { gap_last5y_months: gap } };
}

function eval_R_ROLE_DOMAIN_SHIFT(norm) {
    const id = "R_ROLE_DOMAIN_SHIFT";
    const group = "fit";
    const weight = 7;

    const pr = norm.prev_role_cat;
    const tr = norm.target_role_cat;
    const pi = norm.prev_industry_cat;
    const ti = norm.target_industry_cat;

    // needs 4개 중 하나라도 없으면 not_evaluated
    if (!pr || !tr || !pi || !ti) return { id, group, weight, evaluated: false, strength: 0 };

    const roleShift = String(pr) !== String(tr);
    const indShift = String(pi) !== String(ti);

    let strength = 0;
    if (!roleShift && !indShift) strength = 0;
    else if (!roleShift && indShift) strength = 1;
    else if (roleShift && !indShift) strength = 2;
    else strength = 3;

    return {
        id,
        group,
        weight,
        evaluated: true,
        strength: clampStrength(strength),
        meta: { roleShift, indShift, prev_role_cat: pr, target_role_cat: tr, prev_industry_cat: pi, target_industry_cat: ti },
    };
}

function eval_R_EVIDENCE_QUANT(norm) {
    const id = "R_EVIDENCE_QUANT";
    const group = "evidence";
    const weight = 7;

    const hasOne = norm.quant_impact_has_one;
    if (hasOne === null) return { id, group, weight, evaluated: false, strength: 0 };

    // v1.1 안정형: false → 2 (3 금지)
    const strength = hasOne ? 0 : 2;
    return { id, group, weight, evaluated: true, strength: clampStrength(strength), meta: { quant_impact_has_one: hasOne } };
}

function eval_R_PROCESS_RELIABILITY(norm) {
    const id = "R_PROCESS_RELIABILITY";
    const group = "process";
    const weight = 4;

    const cov = norm.coverage_rate; // 0~100
    const inc = norm.inconsistency_flag_count;

    // 둘 중 하나라도 없으면 not_evaluated
    if (cov === null || inc === null) return { id, group, weight, evaluated: false, strength: 0 };

    // v1.1: strength 3 제거(0~2만)
    // (coverage 높음 & 모순 0) → 0
    // (coverage 중간) → 1
    // (모순 1개 이상 OR coverage 낮음) → 2
    const coverage = clamp(cov, 0, 100);
    const inco = Math.max(0, Number(inc) || 0);

    let strength = 1;
    if (coverage >= 80 && inco === 0) strength = 0;
    else if (inco >= 1 || coverage < 55) strength = 2;
    else strength = 1;

    return { id, group, weight, evaluated: true, strength: clampStrength(strength), meta: { coverage_rate: coverage, inconsistency_flag_count: inco } };
}

function eval_R_GATE_SALARY(norm) {
    const id = "R_GATE_SALARY";
    const group = "gate";
    const weight = 5;

    const prevBand = norm.salary_prev_band;
    const expBand = norm.salary_expect_band;

    if (prevBand == null || expBand == null) return { id, group, weight, evaluated: false, strength: 0 };

    // band가 숫자/문자열 어떤 형태든 mid 추정해서 jump% 계산
    const prevMid = parseBandMid(prevBand);
    const expMid = parseBandMid(expBand);
    const pct = safePctJump(prevMid, expMid);

    if (pct === null) return { id, group, weight, evaluated: false, strength: 0, meta: { salary_prev_band: prevBand, salary_expect_band: expBand } };

    let strength = 0;
    if (pct < 20) strength = 0;
    else if (pct < 30) strength = 1;
    else if (pct < 45) strength = 2;
    else strength = 3;

    return {
        id,
        group,
        weight,
        evaluated: true,
        strength: clampStrength(strength),
        meta: { salary_prev_band: prevBand, salary_expect_band: expBand, jumpPct: pct },
    };
}

// ------- normalization (best-effort mapping) -------
function normalizeInputsV11({ state, structural }) {
    const s = state && typeof state === "object" ? state : {};
    const career = s.career && typeof s.career === "object" ? s.career : {};
    const sc = s.selfCheck && typeof s.selfCheck === "object" ? s.selfCheck : {};
    const st = structural && typeof structural === "object" ? structural : {};

    // gap_last5y_months: 우선 명시 키 → 없으면 기존 career.gapMonths(전체 공백)로 대체(임시)
    const gapRaw =
        pick(s, ["gap_last5y_months", "gapLast5yMonths"]) ??
        pick(career, ["gap_last5y_months", "gapLast5yMonths", "gapMonths", "recentGapMonths"]) ??
        null;

    const gap_last5y_months = gapRaw === null ? null : toIntOrNull(gapRaw);

    // role/industry cats (enum/string)
    const prev_role_cat = pick(s, ["prev_role_cat", "prevRoleCat"]) ?? pick(career, ["prev_role_cat", "prevRoleCat", "prevRole"]) ?? null;
    const target_role_cat = pick(s, ["target_role_cat", "targetRoleCat"]) ?? pick(career, ["target_role_cat", "targetRoleCat", "targetRole"]) ?? null;

    const prev_industry_cat =
        pick(s, ["prev_industry_cat", "prevIndustryCat"]) ?? pick(career, ["prev_industry_cat", "prevIndustryCat", "prevIndustry"]) ?? null;
    const target_industry_cat =
        pick(s, ["target_industry_cat", "targetIndustryCat"]) ?? pick(career, ["target_industry_cat", "targetIndustryCat", "targetIndustry"]) ?? null;

    // quant_impact_has_one: 명시 boolean → 없으면 resumeSignals 기반은 여기서 못 보니까 null 유지
    const q =
        pick(s, ["quant_impact_has_one", "quantImpactHasOne"]) ??
        pick(career, ["quant_impact_has_one", "quantImpactHasOne"]) ??
        pick(sc, ["quant_impact_has_one", "quantImpactHasOne"]) ??
        null;
    const quant_impact_has_one = q === null ? null : toBoolOrNull(q);

    // coverage_rate: 명시값 우선(0~100). 없으면 evaluated ratio로 대체 예정(null로 두고 계산 단계에서 대체)
    const cov =
        pick(s, ["coverage_rate", "coverageRate"]) ??
        pick(st, ["coverage_rate", "coverageRate"]) ??
        pick(st, ["metrics.coverage_rate", "metrics.coverageRate"]) ??
        null;
    const coverage_rate = cov === null ? null : clamp(Number(cov), 0, 100);

    // inconsistency_flag_count: 명시값 우선 → 없으면 structural.flags 길이 사용(프록시)
    const incRaw =
        pick(s, ["inconsistency_flag_count", "inconsistencyFlagCount"]) ??
        pick(st, ["inconsistency_flag_count", "inconsistencyFlagCount"]) ??
        (Array.isArray(st.flags) ? st.flags.length : null);
    const inconsistency_flag_count = incRaw === null ? null : Math.max(0, toIntOrNull(incRaw) ?? 0);

    // salary bands
    const salary_prev_band =
        pick(s, ["salary_prev_band", "salaryPrevBand"]) ??
        pick(career, ["salary_prev_band", "salaryPrevBand"]) ??
        pick(s, ["salaryPrev", "prevSalaryBand"]) ??
        null;

    const salary_expect_band =
        pick(s, ["salary_expect_band", "salaryExpectBand"]) ??
        pick(career, ["salary_expect_band", "salaryExpectBand"]) ??
        pick(s, ["salaryExpect", "expectSalaryBand"]) ??
        null;

    return {
        gap_last5y_months,
        prev_role_cat,
        target_role_cat,
        prev_industry_cat,
        target_industry_cat,
        quant_impact_has_one,
        coverage_rate,
        inconsistency_flag_count,
        salary_prev_band,
        salary_expect_band,
    };
}

// ------- main eval -------
export function evaluateHiddenRiskV11({ state, ai, structural } = {}) {
    const norm = normalizeInputsV11({ state, structural });

    const rules = [
        eval_R_STABILITY_GAP(norm),
        eval_R_ROLE_DOMAIN_SHIFT(norm),
        eval_R_EVIDENCE_QUANT(norm),
        eval_R_PROCESS_RELIABILITY(norm),
        eval_R_GATE_SALARY(norm),
    ];

    const total_rule_count = rules.length;
    const evaluated = rules.filter((r) => r && r.evaluated === true);
    const evaluated_rule_count = evaluated.length;

    // rawScore: evaluated only
    const rawScore = evaluated.reduce((acc, r) => acc + (Number(r.weight) || 0) * (Number(r.strength) || 0), 0);

    const riskCount = bucketRiskCount(rawScore);
    const riskLevel = riskLevelFromCount(riskCount);

    // hasGateRisk: R_GATE_SALARY.strength >= 2 (표시는 UI에서 confidence>=70일 때만)
    const gate = rules.find((r) => r && r.id === "R_GATE_SALARY") || null;
    const hasGateRisk = !!(gate && gate.evaluated && Number(gate.strength) >= 2);

    // coverage_rate: 입력에 명시가 없으면 evaluated ratio 기반으로 대체 (0~100)
    const evalRatio01 = total_rule_count > 0 ? evaluated_rule_count / total_rule_count : 0;
    const coverage_rate = norm.coverage_rate !== null ? clamp(norm.coverage_rate, 0, 100) : clamp(evalRatio01 * 100, 0, 100);

    // inconsistency_penalty: 0~15 (모순 있을 때만)
    const inc = norm.inconsistency_flag_count;
    const inconsistency_penalty = inc === null ? 0 : clamp(inc > 0 ? Math.min(15, 8 + (inc - 1) * 3) : 0, 0, 15);

    // confidence(v1.1): 0.8 coverage + 0.2 evalRatio*100 - penalty
    let confidence =
        0.8 * coverage_rate +
        0.2 * (evalRatio01 * 100) -
        inconsistency_penalty;
    confidence = clamp(Math.round(confidence), 0, 100);

    // ruleStrengthVector (fixed order, ids fixed)
    const ruleStrengthVector = rules.map((r) => ({
        ruleId: r.id,
        evaluated: !!r.evaluated,
        strength: clampStrength(r.strength),
    }));

    return {
        engineVersion: ENGINE_VERSION,
        UPDATE_MODE,
        MAX_COUNT_SHOWN,
        outputsAllowed: ["riskCount", "riskLevel(optional)", "hasGateRisk(optional)", "confidence"],
        riskCount: clamp(riskCount, 0, MAX_COUNT_SHOWN),
        riskLevel,
        hasGateRisk,
        confidence,
        // internal/debug (노출 금지 전제)
        debug: {
            aggregation: "weightedSum_to_bucket",
            missingPolicy: "not_evaluated + confidence_down",
            rawScore,
            bucketedRiskCount: riskCount,
            evaluated_rule_count,
            total_rule_count,
            coverage_rate,
            evalRatio01,
            inconsistency_penalty,
            ruleStrengthVector,
            rules, // 내부 로그/튜닝용 (UI 노출 금지)
        },
    };
}