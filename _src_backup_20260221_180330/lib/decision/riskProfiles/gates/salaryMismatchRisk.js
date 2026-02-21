// src/lib/decision/riskProfiles/gates/salaryMismatchRisk.js
// SALARY_MISMATCH gate
// - 기대연봉이 현재연봉 대비 과도하게 높을 때(협상/매칭 단계 이전에 컷되는 케이스) 강한 리스크 신호로 처리

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeStr(v) {
  try { return (v ?? "").toString(); }
  catch { return ""; }
}

// 숫자 파싱: "5,000", "5000만원", "5천", "1억", "1.2억" 등 방어적 처리
// 반환 단위: "만원" 기준 숫자 (예: 5000 => 5000만원, 1억 => 10000만원)
function parseSalaryToManwon(v) {
  const s0 = safeStr(v).trim();
  if (!s0) return null;

  const s = s0.replace(/\s+/g, "");
// src/lib/decision/riskProfiles/gates/salaryMismatchRisk.js

function parseSalaryToManwon(v) {
  const s0 = safeStr(v).trim();
  if (!s0) return null;

  const s = s0.replace(/\s+/g, "");

  // [PATCH] handle ranges like "6,500~7,000", "6500-7000", "1.2억~1.4억" (append-only)
  // - range면 보수적으로 "최댓값"을 사용해서 gate 누락을 막음
  try {
    if (/[~\-–—]/.test(s)) {
      const eoks = Array.from(s.matchAll(/(\d+(?:\.\d+)?)억/g))
        .map((m) => Number(m[1]))
        .filter((n) => Number.isFinite(n));
      if (eoks.length) return Math.round(Math.max(...eoks) * 10000);

      const cheons = Array.from(s.matchAll(/(\d+(?:\.\d+)?)천/g))
        .map((m) => Number(m[1]))
        .filter((n) => Number.isFinite(n));
      if (cheons.length) return Math.round(Math.max(...cheons) * 1000);

      // "6,500~7,000" 같이 단위 없는 범위
      const nums = Array.from(s.matchAll(/(\d+(?:\.\d+)?)/g))
        .map((m) => Number(String(m[1]).replace(/,/g, "")))
        .filter((n) => Number.isFinite(n));
      if (nums.length) {
        const numMax = Math.max(...nums);
        if (numMax >= 1000000) return Math.round(numMax / 10000);
        return Math.round(numMax);
      }
    }
  } catch {
    // ignore
  }

  // "1억", "1.2억" 처리
  const eokMatch = s.match(/^(\d+(?:\.\d+)?)억/);
  if (eokMatch) {
    const n = Number(eokMatch[1]);
    if (!isFinite(n)) return null;
    return Math.round(n * 10000); // 1억 = 10000만원
  }

  // "5천", "5천만원"
  const cheonMatch = s.match(/^(\d+(?:\.\d+)?)천/);
  if (cheonMatch) {
    const n = Number(cheonMatch[1]);
    if (!isFinite(n)) return null;
    return Math.round(n * 1000); // 1천 = 1000만원
  }

  // 일반 숫자(콤마 제거)
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (!isFinite(num)) return null;

  if (num >= 1000000) {
    return Math.round(num / 10000);
  }

  return Math.round(num);
}
  // "1억", "1.2억" 처리
  const eokMatch = s.match(/^(\d+(?:\.\d+)?)억/);
  if (eokMatch) {
    const n = Number(eokMatch[1]);
    if (!isFinite(n)) return null;
    return Math.round(n * 10000); // 1억 = 10000만원
  }

  // "5천", "5천만원"
  const cheonMatch = s.match(/^(\d+(?:\.\d+)?)천/);
  if (cheonMatch) {
    const n = Number(cheonMatch[1]);
    if (!isFinite(n)) return null;
    return Math.round(n * 1000); // 1천 = 1000만원
  }

  // 일반 숫자(콤마 제거)
  const num = Number(s.replace(/[^0-9.]/g, ""));
  if (!isFinite(num)) return null;

  // 어떤 입력은 "원" 단위로 들어올 수도 있어서 과도하게 큰 값 보정(보수적으로)
  // 50,000,000 같은 게 들어오면 5천만원으로 해석 가능성이 큼 → 1/10000
  if (num >= 1000000) {
    return Math.round(num / 10000);
  }

  // 기본은 "만원" 단위로 가정
  return Math.round(num);
}

function _getState(ctx) {
  const st = isObj(ctx?.state) ? ctx.state : null;
  return st || {};
}

function _extractSalaries(ctx) {
  const state = _getState(ctx);

  // 여러 형태를 최대한 흡수
  function pickNonEmpty(...vals) {
    for (const v of vals) {
      if (v !== null && v !== undefined && String(v).trim() !== "") {
        return v;
      }
    }
    return null;
  }

  const curRaw = pickNonEmpty(
    state?.salaryCurrent,
    state?.currentSalary,
    state?.salary?.current,
    state?.salary?.cur,
    state?.salary_now
  );

  const expRaw = pickNonEmpty(
    state?.salaryExpected,
    state?.salaryTarget,
    state?.expectedSalary,
    state?.salary?.expected,
    state?.salary?.exp,
    state?.salary_target
  );

  const cur = parseSalaryToManwon(curRaw);
  const exp = parseSalaryToManwon(expRaw);

  return { cur, exp, curRaw, expRaw };
}

function _calcMismatch({ cur, exp } = {}) {
  if (!isFinite(cur) || !isFinite(exp) || cur <= 0 || exp <= 0) {
    return { ok: false, ratio: null, diff: null };
  }
  const ratio = exp / cur;
  const diff = exp - cur; // 만원 단위
  return { ok: true, ratio, diff };
}

export const salaryMismatchRisk = {
  id: "GATE__SALARY_MISMATCH",
  group: "gates",
  layer: "gate",

  // gate 중에서도 강하게(education/age와 동일급) 잡되, 절대값은 약간 낮춤
  priority: 97,
  severityBase: 4,

  tags: ["gate", "salary"],

  when: (ctx) => {
    const { cur, exp } = _extractSalaries(ctx);
    const m = _calcMismatch({ cur, exp });
    if (!m.ok) return false;

    // 보수적 기준:
    // - 기대연봉이 현재연봉 대비 35% 이상 ↑  (ratio >= 1.35)
    //   또는
    // - 절대 차이가 2000만원 이상 ↑ (diff >= 2000만원 = 2000 만원)
    // 둘 중 하나면 gate로 처리
    if (m.ratio >= 1.35) return true;
    if (m.diff >= 2000) return true;

    return false;
  },

  score: (ctx) => {
    const { cur, exp } = _extractSalaries(ctx);
    const m = _calcMismatch({ cur, exp });
    if (!m.ok) return 0;

    let base = 0;

    if (m.ratio >= 1.35) base = 0.80;
    if (m.ratio >= 1.6) base = 0.92;
    if (m.ratio >= 2.0) base = 0.99;

    if (m.diff >= 2000) base = Math.max(base, 0.85);
    if (m.diff >= 4000) base = Math.max(base, 0.97);

    // 🔥 리더십 완화 로직
    const leadership = Number(ctx?.state?.leadershipLevel ?? 0);
    if (leadership >= 3) {
      base *= 0.85;
    }

    return Math.min(1, base);
  },

  explain: (ctx) => {
    const { cur, exp, curRaw, expRaw } = _extractSalaries(ctx);
    const m = _calcMismatch({ cur, exp });

    const curTxt = cur != null ? `${cur}만원` : (safeStr(curRaw) || "-");
    const expTxt = exp != null ? `${exp}만원` : (safeStr(expRaw) || "-");

    const ratioTxt =
      m.ok && isFinite(m.ratio) ? `${Math.round(m.ratio * 100)}%` : "-";
    const diffTxt =
      m.ok && isFinite(m.diff) ? `${m.diff}만원` : "-";

    return {
      title: "연봉 기대치가 과도하면 서류에서 컷될 수 있음",
      why: [
        "회사 입장에서는 '조정 불가능한 조건'이 보이면 면접/협상 리소스를 아끼는 방향으로 움직입니다.",
        "특히 현재 연봉 대비 기대 연봉이 크게 뛰면, 내부 밴드/직급 테이블과 충돌로 조기 탈락할 수 있습니다.",
      ],
      signals: [
        `현재 연봉(추정): ${curTxt}`,
        `희망 연봉(추정): ${expTxt}`,
        `상승률(희망/현재): ${ratioTxt}`,
        `차이(희망-현재): ${diffTxt}`,
      ],
      action: [
        "희망 연봉을 '직급/레벨 근거'와 같이 제시(역할 범위/책임/리더십/성과 크기).",
        "가능하면 '협의 가능' 범위를 숫자로 좁혀서 표현(예: 6,500~7,000).",
        "지원 직무의 시장 밴드(동일 레벨/동일 산업) 근거를 같이 제시.",
      ],
      counter: [
        "정말로 레벨 업(책임/조직 규모/의사결정권한)이 명확하면 높은 연봉도 정당화됩니다.",
        "핵심 스킬 희소성이 높거나(초고난도, 즉시전력), 채용이 매우 급한 포지션이면 예외가 생깁니다.",
      ],
    };
  },
};


