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



// [PATCH] pickNonEmpty helper (append-only)
// - salaryExpected가 """" 같은 빈 문자열일 때 salaryTarget을 정상 선택하도록
function pickNonEmpty(...vals) {
  for (const v of vals) {
    if (v !== null && v !== undefined && String(v).trim() !== "") return v;
  }
  return null;
}
function _extractSalaries(ctx) {
  const state = _getState(ctx);

  // 여러 형태를 최대한 흡수
  const curRaw =
    state?.salaryCurrent ??
    state?.currentSalary ??
    state?.salary?.current ??
    state?.salary?.cur ??
    state?.salary_now ??
    null;

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
    // === FILE: src/lib/decision/riskProfiles/gates/salaryMismatchRisk.js
    // === FUNCTION: explain: (ctx) => { ... }

    // (A) INSERT BLOCK
    // ANCHOR: 바로 아래 줄 다음에 삽입하세요.
    // const diffTxt =
    //   m.ok && isFinite(m.diff) ? `${m.diff}만원` : "-";

    // ------------------------------
    // [PATCH] contextual explain (industry/role/size/leadership) - append-only
    // - App.jsx 선택값(v 코드)을 1순위로 사용
    //   industry: tech/finance/commerce/manufacturing/healthcare/public/media/hr/unknown
    //   role: pm/product/data/dev/design/marketing/sales/ops/hr/finance/unknown
    // - objective 텍스트는 fallback(보조)로만 사용
    // ------------------------------
    const leadershipLv = Number(ctx?.state?.leadershipLevel ?? 0);

    // 1) UI 선택값(v 코드) 우선
    const roleKeyRaw = safeStr(
      ctx?.state?.roleTarget ??
      ctx?.state?.targetRole ??
      ctx?.state?.role ??
      ""
    ).trim();

    const industryKeyRaw = safeStr(
      ctx?.state?.industryTarget ??
      ctx?.state?.targetIndustry ??
      ctx?.state?.industryCurrent ??
      ctx?.state?.currentIndustry ??
      ""
    ).trim();

    // 2) objective fallback(텍스트 가능)
    const roleObjTxt = safeStr(
      ctx?.objective?.roleInference?.familyRole ??
      ctx?.objective?.roleInference?.fineRole ??
      ctx?.objective?.role ??
      ""
    ).trim();

    const resumeIndustryTxt = safeStr(
      ctx?.objective?.resumeIndustry ?? ctx?.state?.resumeIndustry ?? ""
    ).trim();

    const jdIndustryTxt = safeStr(
      ctx?.objective?.jdIndustry ?? ctx?.state?.jdIndustry ?? ""
    ).trim();

    const candSize = safeStr(
      ctx?.objective?.candidateSize ??
      ctx?.state?.candidateSize ??
      ctx?.state?.companySizeCandidate ??
      ctx?.state?.detectedCompanySizeCandidate ??
      ""
    ).trim();

    const targetSize = safeStr(
      ctx?.objective?.targetSize ??
      ctx?.state?.targetSize ??
      ctx?.state?.companySizeTarget ??
      ctx?.state?.detectedCompanySizeTarget ??
      ""
    ).trim();

    const _lc = (s) => safeStr(s).toLowerCase();

    const _normRoleKey = (v0, txt0) => {
      const v = _lc(v0);
      if (["pm", "product", "data", "dev", "design", "marketing", "sales", "ops", "hr", "finance", "unknown"].includes(v)) return v;

      const t = _lc(txt0 || v0);
      if (!t) return "unknown";
      if (/(pm|po|product manager|프로덕트|기획)/i.test(t)) return "pm";
      if (/(product|기획|전략)/i.test(t)) return "product";
      if (/(data|ml|ai|ds|분석|사이언스|데이터)/i.test(t)) return "data";
      if (/(dev|engineer|개발|software|backend|frontend|fullstack)/i.test(t)) return "dev";
      if (/(design|디자인|ux|ui)/i.test(t)) return "design";
      if (/(marketing|마케팅|growth|그로스)/i.test(t)) return "marketing";
      if (/(sales|영업|bd|account|ae|am)/i.test(t)) return "sales";
      if (/(ops|운영|cs|customer|고객|support|scm|procurement|구매|물류|logistics|supply)/i.test(t)) return "ops";
      if (/(hr|recruit|채용|인사)/i.test(t)) return "hr";
      if (/(finance|회계|재무|ir|fpa)/i.test(t)) return "finance";
      return "unknown";
    };

    const _normIndustryKey = (v0, txt0) => {
      const v = _lc(v0);
      if (["tech", "finance", "commerce", "manufacturing", "healthcare", "public", "media", "hr", "unknown"].includes(v)) return v;

      const t = _lc(txt0 || v0);
      if (!t) return "unknown";
      if (/(saas|it|tech|software|플랫폼|모바일)/i.test(t)) return "tech";
      if (/(finance|bank|보험|증권|금융)/i.test(t)) return "finance";
      if (/(commerce|e-?commerce|리테일|유통|커머스)/i.test(t)) return "commerce";
      if (/(manufact|factory|제조|생산|반도체|자동차)/i.test(t)) return "manufacturing";
      if (/(health|bio|pharma|병원|헬스케어|바이오)/i.test(t)) return "healthcare";
      if (/(public|gov|공공|교육|지자체)/i.test(t)) return "public";
      if (/(media|content|게임|엔터|광고)/i.test(t)) return "media";
      if (/(hr|recruit|인사)/i.test(t)) return "hr";
      return "unknown";
    };

    const roleKey = _normRoleKey(roleKeyRaw, roleObjTxt);
    const industryKey = _normIndustryKey(industryKeyRaw, `${resumeIndustryTxt} ${jdIndustryTxt}`);

    // ops 세부분기(설명 문장만): 구매/SCM/물류/CS 등
    const roleDetailTxt = _lc(`${roleObjTxt} ${ctx?.state?.role || ""} ${ctx?.state?.jd || ""} ${ctx?.state?.jdText || ""}`);
    const isOpsProcurementSCM = roleKey === "ops" && /(scm|procurement|구매|물류|logistics|supply)/i.test(roleDetailTxt);
    const isOpsCS = roleKey === "ops" && /(cs|customer|고객|상담|voc|support)/i.test(roleDetailTxt);

    // 추가 문장 배열(반드시 return에 병합)
    const __why2 = [];
    const __signals2 = [];
    const __action2 = [];
    const __counter2 = [];

    // 분기 기준 signals(디버그 겸)
    __signals2.push(`산업(선택/추론): ${industryKey}${industryKeyRaw && _lc(industryKeyRaw) !== industryKey ? ` (raw:${industryKeyRaw})` : ""}`);
    __signals2.push(`직무(선택/추론): ${roleKey}${roleKeyRaw && _lc(roleKeyRaw) !== roleKey ? ` (raw:${roleKeyRaw})` : ""}`);
    if (candSize || targetSize) __signals2.push(`회사규모: ${candSize || "-"} → ${targetSize || "-"}`);
    if (leadershipLv > 0) __signals2.push(`리더십 레벨: ${leadershipLv}`);

    // 점프 강도
    const ratioN = m.ok && isFinite(m.ratio) ? m.ratio : null;
    const diffN = m.ok && isFinite(m.diff) ? m.diff : null;
    const jumpBig = (ratioN != null && ratioN >= 1.6) || (diffN != null && diffN >= 3000);

    // 산업/규모 분기
    if (industryKey === "finance" || industryKey === "manufacturing" || _lc(targetSize).includes("large") || _lc(targetSize).includes("대기업")) {
      __why2.push("금융/제조/대기업은 연봉 밴드·직급 테이블·내부 형평 기준이 상대적으로 경직해서, 기대치가 높으면 협의 전 단계에서 ‘조건 미스매치’로 빠르게 컷될 수 있습니다.");
      __action2.push("해당 업계/규모의 ‘레벨-밴드’ 기준을 먼저 맞추고, 레벨 근거(스코프/책임/성과)를 수치로 제시해 주세요.");
    }

    // 직무 분기
    if (isOpsProcurementSCM) {
      __why2.push("구매/SCM/물류 성격의 ops는 비용·원가·조직 내 비교가 민감해서, 기대연봉 급점프가 ‘내부 형평 이슈’로 해석되기 쉽습니다.");
      __action2.push("성과를 원가절감/리드타임/재고/납기 같은 지표로 환산해 ‘왜 레벨업인지’를 증명해 주세요.");
    } else if (isOpsCS) {
      __why2.push("CS/고객지원 성격의 ops는 보상 밴드가 명확한 편이라, 높은 기대치는 ‘역할 대비 과요구’로 해석될 수 있습니다.");
      __action2.push("VOC/응대량/해결률/재발률/자동화 기여 같은 수치로 ‘레벨 상향 근거’를 준비해 주세요.");
    }

    if (roleKey === "sales") {
      __why2.push("영업은 고정급/인센(OTE) 구조가 달라서, 기대 보상이 ‘고정급 기준’인지 ‘총보상(OTE) 기준’인지 불명확하면 컷 사유가 되기 쉽습니다.");
      __action2.push("기대보상을 ‘고정급 + 인센(OTE)’로 분해하고, 최근 실적(쿼터 대비 달성률/매출/마진)을 같이 제시해 주세요.");
    }

    if (roleKey === "dev" || roleKey === "data") {
      __counter2.push("개발/데이터는 희소 스킬·대체불가 성과가 명확하면 예외가 생기기도 하지만, 근거(지표/임팩트/리딩 범위)가 없으면 동일하게 컷될 수 있습니다.");
      __action2.push("희소성(핵심기술/난이도/리딩)과 성과 임팩트(매출/비용/속도/품질)를 3~5개 bullet로 압축해 준비해 주세요.");
    }

    // 리더십 낮은데 급점프
    if (leadershipLv > 0 && leadershipLv < 3 && jumpBig) {
      __why2.push("리더십/조직 운영 근거가 낮은 상태에서 연봉만 크게 점프하면, ‘책임/스코프 증가 근거가 부족’하다고 해석돼 초기 필터에서 불리할 수 있습니다.");
      __action2.push("의사결정 범위/예산/인력/대외협상/프로젝트 규모 등 ‘책임 증가’를 구체 항목으로 제시해 주세요.");
    }


    // (B) MERGE INTO RETURN ARRAYS
    // ANCHOR: 아래 return { ... } 안에서 why/signals/action/counter 배열 끝에 spread로 병합 추가

    // ✅ replace these blocks only (append-only):
    // why: [ ... ]  -> add ...(__why2)
    // signals: [ ... ] -> add ...(__signals2)
    // action: [ ... ] -> add ...(__action2)
    // counter: [ ... ] -> add ...(__counter2)

    // 예시(당신 현재 코드에 그대로 적용):
    // why: [
    //   "....",
    //   "....",
    //   ...(__why2.length ? __why2 : []),
    // ],
    // signals: [
    //   `현재 연봉(추정): ${curTxt}`,
    //   `희망 연봉(추정): ${expTxt}`,
    //   `상승률(희망/현재): ${ratioTxt}`,
    //   `차이(희망-현재): ${diffTxt}`,
    //   ...(__signals2.length ? __signals2 : []),
    // ],
    // action: [
    //   "...",
    //   "...",
    //   "...",
    //   ...(__action2.length ? __action2 : []),
    // ],
    // counter: [
    //   "...",
    //   "...",
    //   ...(__counter2.length ? __counter2 : []),
    // ],
    return {
      title: "연봉 기대치가 과도하면 서류에서 컷될 수 있음",
      why: [
        "회사 입장에서는 '조정 불가능한 조건'이 보이면 면접/협상 리소스를 아끼는 방향으로 움직입니다.",
        "특히 현재 연봉 대비 기대 연봉이 크게 뛰면, 내부 밴드/직급 테이블과 충돌로 조기 탈락할 수 있습니다.",
        "연봉 조건이 밴드 밖으로 인식되면, 역량과 무관하게 ‘조건 미스매치 후보’로 분류되어 서류 단계에서 우선순위가 밀릴 수 있습니다.",
        ...(__why2 && __why2.length ? __why2 : []),
      ],
      signals: [
        `현재 연봉(추정): ${curTxt}`,
        `희망 연봉(추정): ${expTxt}`,
        `상승률(희망/현재): ${ratioTxt}`,
        `차이(희망-현재): ${diffTxt}`,
        ...(__signals2 && __signals2.length ? __signals2 : []),
      ],
      action: [
        "희망 연봉을 '직급/레벨 근거'와 같이 제시(역할 범위/책임/리더십/성과 크기).",
        "가능하면 '협의 가능' 범위를 숫자로 좁혀서 표현(예: 6,500~7,000).",
        "지원 직무의 시장 밴드(동일 레벨/동일 산업) 근거를 같이 제시.",
        ...(__action2 && __action2.length ? __action2 : []),
      ],
      counter: [
        "정말로 레벨 업(책임/조직 규모/의사결정권한)이 명확하면 높은 연봉도 정당화됩니다.",
        "핵심 스킬 희소성이 높거나(초고난도, 즉시전력), 채용이 매우 급한 포지션이면 예외가 생깁니다.",
        ...(__counter2 && __counter2.length ? __counter2 : []),
      ],
    };
  },
};
