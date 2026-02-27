/**
 * salaryDownshiftRisk (NON-GATE)
 * - "현 연봉 대비 기대/지원 연봉이 과도하게 낮은" 케이스에서
 *   면접관 시점의 의심(이탈/동기불명/오버퀄) 신호를 설명 레이어로 제공
 * - 점수/게이트 경로는 건드리지 않음 (riskProfile only)
 */

function safeStr(v) {
  try { return (v ?? "").toString(); }
  catch { return ""; }
}

// 숫자 파싱 (만원 단위)
// - "5,000", "5000만원", "5천", "1억", "1.2억" 등 방어적 처리
// - 반환 단위: 만원 숫자 (예: 5000 => 5000만원, 1억 => 10000만원)
function parseSalaryToManwon(v) {
  const s0 = safeStr(v).trim();
  if (!s0) return null;

  const s = s0.replace(/\s+/g, "");

  // "1억", "1.2억"
  const eokMatch = s.match(/^(\d+(?:\.\d+)?)억$/);
  if (eokMatch) {
    const n = Number(eokMatch[1]);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 10000);
  }

  // "5천", "5천만원"
  const cheonMatch = s.match(/^(\d+(?:\.\d+)?)천(만원)?$/);
  if (cheonMatch) {
    const n = Number(cheonMatch[1]);
    if (!Number.isFinite(n)) return null;
    return Math.round(n * 1000);
  }

  // 숫자만 / "만원" / 콤마 포함
  const cleaned = s.replace(/만원/g, "").replace(/,/g, "");
  const numMatch = cleaned.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }

  return null;
}

function _extractSalaries(ctx) {
  const st = ctx?.state || {};
  const curRaw = st?.salaryCurrent;
  const expRaw = (safeStr(st?.salaryExpected).trim() ? st?.salaryExpected : st?.salaryTarget); // expected가 비면 target 사용
  const cur = parseSalaryToManwon(curRaw);
  const exp = parseSalaryToManwon(expRaw);
  return { cur, exp, curRaw, expRaw };
}

function _calcDownshift({ cur, exp }) {
  if (!Number.isFinite(cur) || !Number.isFinite(exp)) return { ok: false, ratio: null, diff: null };
  if (cur <= 0) return { ok: false, ratio: null, diff: null };
  const ratio = exp / cur;
  const diff = exp - cur; // 음수면 하향
  return { ok: true, ratio, diff };
}

export const salaryDownshiftRisk = {
  id: "salaryDownshiftRisk",
  title: "현 연봉 대비 기대 연봉이 낮으면 이탈/동기/오버퀄 의심이 생길 수 있음",
  layer: "risk",
  group: "compensation",
  priority: 55,
  // NON-GATE: 보수적 트리거
  // - cur/exp 둘 다 유효
  // - exp < cur (하향)
  // - ratio <= 0.75 (25% 이상 하향) OR diff <= -2000 (-2000만원 이상 하향)
  when: (ctx) => {
    const { cur, exp } = _extractSalaries(ctx);
    const m = _calcDownshift({ cur, exp });
    if (!m.ok) return false;
    if (!(m.diff < 0)) return false;

    if (m.ratio <= 0.75) return true;
    if (m.diff <= -2000) return true;

    return false;
  },

  // NON-GATE score: "경계 신호" 수준(리포트 강화용)
  score: (ctx) => {
    const { cur, exp } = _extractSalaries(ctx);
    const m = _calcDownshift({ cur, exp });
    if (!m.ok) return 0;

    // 기본 70 (경계)
    let s = 70;

    // 극단 하향이면 조금 상향
    if (m.ratio <= 0.65) s += 5;
    if (m.diff <= -4000) s += 5;

    // 0~100 clamp
    if (s < 0) s = 0;
    if (s > 100) s = 100;
    return s;
  },

  explain: (ctx) => {
    const { cur, exp } = _extractSalaries(ctx);
    const m = _calcDownshift({ cur, exp });

    const curTxt = Number.isFinite(cur) ? `${cur}만원` : safeStr(ctx?.state?.salaryCurrent || "-");
    const expTxt = Number.isFinite(exp) ? `${exp}만원` : safeStr(ctx?.state?.salaryExpected ?? ctx?.state?.salaryTarget ?? "-");

    const ratioTxt = m.ok && Number.isFinite(m.ratio) ? `${Math.round(m.ratio * 100)}%` : "-";
    const diffTxt = m.ok && Number.isFinite(m.diff) ? `${m.diff}만원` : "-";

    const why = [
      "면접관은 왜 더 낮게도 괜찮은지가 불명확하면 이탈 가능성(더 좋은 오퍼 시 이동)부터 의심합니다.",
      "연봉 하향 지원은 오버퀄/레벨 미스매치로 인해 팀 내 협업역할 기대치조직 운영 부담이 생길 수 있다고 봅니다.",
      "동기가 애매하면 급한 사정 또는 단기 브릿지로 해석돼 초기 단계에서 보수적으로 판단될 수 있습니다.",
    ];

    const signals = [
      `현재 연봉(추정): ${curTxt}`,
      `희망/기대 연봉(추정): ${expTxt}`,
      `희망/현재 비율: ${ratioTxt}`,
      `차이(희망-현재): ${diffTxt}`,
    ];

    const action = [
      "연봉을 낮춰도 괜찮은 핵심 이유를 한 문장으로 고정하세요(역할/성장/환경/거점/라이프 이벤트 등).",
      "하한선과 협의 범위를 명확히 제시해 이탈/재협상 리스크를 줄이세요(예: OOO 이상이면 2~3년 유지 가능).",
      "오버퀄 우려를 줄이기 위해 기대 역할(플레이어/리더 여부), 초반 3~6개월 성과 목표를 구체화하세요.",
    ];

    const counter = [
      "직무 전환/산업 전환/총보상 구조 변화(고정급인센/RSU 등)처럼 합리적 이유와 근거가 있으면 오히려 긍정 신호가 됩니다.",
      "연봉보다 역할 범위/제품/팀/성장이 우선이라는 기준이 일관되고, 실제 커리어 스토리와 맞으면 의심이 크게 줄어듭니다.",
    ];

    return { title: "현 연봉 대비 기대 연봉 하향 지원 시 의심 신호", why, signals, action, counter };
  },
};

export default salaryDownshiftRisk;
