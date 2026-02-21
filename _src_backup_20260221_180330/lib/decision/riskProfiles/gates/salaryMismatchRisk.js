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
    // ------------------------------
    // [PATCH] enrich context signals for explanation (append-only)
    // - 점수 로직은 건드리지 않고, "왜 컷인지" 근거 문장만 강화
    // ------------------------------
    const leadershipLv = Number(ctx?.state?.leadershipLevel ?? 0);

    // 회사 규모/산업 전환 신호(있으면만 표시)
    const candSize =
      safeStr(
        ctx?.state?.candidateSize ??
        ctx?.state?.companySizeCandidate ??
        ctx?.state?.detectedCompanySizeCandidate ??
        ctx?.objective?.candidateSize ??
        ""
      ).trim();

    const targetSize =
      safeStr(
        ctx?.state?.targetSize ??
        ctx?.state?.companySizeTarget ??
        ctx?.state?.detectedCompanySizeTarget ??
        ctx?.objective?.targetSize ??
        ""
      ).trim();

    const resumeIndustry =
      safeStr(
        ctx?.objective?.resumeIndustry ??
        ctx?.state?.resumeIndustry ??
        ctx?.state?.detectedIndustry ??
        ""
      ).trim();

    const jdIndustry =
      safeStr(
        ctx?.objective?.jdIndustry ??
        ctx?.state?.jdIndustry ??
        ctx?.state?.detectedIndustryTarget ??
        ""
      ).trim();

    const hasSizeSignal = !!(candSize || targetSize);
    const hasIndustrySignal = !!(resumeIndustry || jdIndustry);

    const ratioN = m.ok && isFinite(m.ratio) ? m.ratio : null;
    const diffN = m.ok && isFinite(m.diff) ? m.diff : null;

    // "면접관이 바로 거는 의심" 표현용 문장(조건부로만 추가)
    const __extraWhy = [];
    if (ratioN != null && ratioN >= 2.0) {
      __extraWhy.push("희망 연봉이 현재 대비 2배 이상이면, 다수 기업에서 '밴드 밖'으로 분류되어 서류 단계에서 바로 제외될 수 있습니다.");
    } else if (ratioN != null && ratioN >= 1.6) {
      __extraWhy.push("희망 연봉이 현재 대비 60%+ 상승이면, 내부 직급/레벨 상향(책임 확대) 근거가 없을 때 조기 컷 가능성이 커집니다.");
    } else if (ratioN != null && ratioN >= 1.35) {
      __extraWhy.push("희망 연봉이 현재 대비 35%+ 상승이면, 회사는 먼저 '조정 가능성'을 의심하고 리스크가 낮은 후보로 이동할 수 있습니다.");
    }
    if (diffN != null && diffN >= 4000) {
      __extraWhy.push("절대 차이가 4,000만원+이면, 같은 직무라도 레벨/조직 스코프가 크게 달라야 성립하는 케이스로 보일 수 있습니다.");
    } else if (diffN != null && diffN >= 2000) {
      __extraWhy.push("절대 차이가 2,000만원+이면, 협상 단계 전에 '조건 미스매치'로 분류될 수 있습니다.");
    }
    if (leadershipLv > 0 && leadershipLv < 3) {
      __extraWhy.push("리더십/조직 운영 근거가 낮은데 연봉만 크게 점프하면, '역량 대비 과요구'로 해석될 수 있습니다.");
    }
    if (hasSizeSignal && candSize && targetSize && candSize !== targetSize) {
      __extraWhy.push("회사 규모가 바뀌는 이동에서는 보상 체계(밴드)가 달라 '같은 직무라도 연봉 구조가 다르다'는 설명이 없으면 컷 신호가 강해집니다.");
    }
    if (hasIndustrySignal && resumeIndustry && jdIndustry && resumeIndustry !== jdIndustry) {
      __extraWhy.push("산업 전환이 동반되면, 회사는 '러닝커브 리스크'까지 같이 보며 보상 상향 요구를 더 보수적으로 판단할 수 있습니다.");
    }

    const __extraSignals = [];
    const __why2 = [];
    const __action2 = [];
    const __counter2 = [];
    const __signals2 = [];
    if (leadershipLv > 0) __extraSignals.push(`리더십 레벨: ${leadershipLv}`);
    if (hasSizeSignal) __extraSignals.push(`회사 규모(후보/타깃): ${candSize || "-"} → ${targetSize || "-"}`);
    if (hasIndustrySignal) __extraSignals.push(`산업(후보/타깃): ${resumeIndustry || "-"} → ${jdIndustry || "-"}`);
    // ✅ PATCH: contextual explain branches (append-only)
    // - 산업/직무/회사규모/리더십 맥락을 why/action/counter/signals에 "추가 문장"으로만 덧붙임
    // - when/score에는 영향 없음
    try {
      const __st = {
        ...((ctx && ctx.state && typeof ctx.state === "object") ? ctx.state : {}),
        ...((ctx && ctx.objective && typeof ctx.objective === "object") ? ctx.objective : {}),
      };
      // ---- safe getters (local-only) ----
      const __s = (v) => {
        try { return (v ?? "").toString().trim(); } catch { return ""; }
      };
      const __pick = (obj, keys) => {
        for (const k of keys) {
          if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
            const v = obj[k];
            const s = __s(v);
            if (s) return s;
          }
        }
        return "";
      };
      const __norm = (s) => __s(s).toLowerCase();

      // ---- extract signals (best-effort, append-only) ----
      const __industry = __pick(__st, [
        "industryTarget", "industry", "targetIndustry", "detectedIndustry", "jdIndustry", "companyIndustry"
      ]);
      const __role = __pick(__st, [
        "roleTarget", "role", "targetRole", "jobRole", "jobFamily", "function", "jobFunction"
      ]);

      // 회사규모 (코드/라벨 어떤 형태든 문자열로 받아서 키워드 매칭)
      const __sizeCur = __pick(__st, [
        "companySizeCurrent", "companySizeCur", "curCompanySize", "sizeCurrent", "companySize"
      ]);
      const __sizeTgt = __pick(__st, [
        "companySizeTarget", "companySizeTgt", "targetCompanySize", "sizeTarget"
      ]);

      // 리더십/직급
      const __lead = __pick(__st, ["leadershipLevel", "leadership", "level", "seniorityLevel"]);

      // mismatch 수치 (기존 explain에서 이미 m/ratio/diff를 만들었다면 그걸 우선 사용)
      // - 아래는 "없는 경우에만" 재계산/보조 추출용
      let __ratio = null;
      let __diff = null;
      try {
        if (typeof m === "object" && m) {
          if (typeof m.ratio === "number") __ratio = m.ratio;
          if (typeof m.diff === "number") __diff = m.diff;
        }
      } catch { }
      // ratio/diff가 없으면, explain 내부에 이미 cur/exp가 있을 가능성을 고려해 재계산 시도(실패해도 무해)
      try {
        if ((__ratio === null || __diff === null) && typeof _calcMismatch === "function") {
          // cur/exp 변수가 explain 스코프에 존재할 수도 있어서 직접 참조(ReferenceError는 try로 방어)
          const __cur = (typeof cur !== "undefined") ? cur : null;
          const __exp = (typeof exp !== "undefined") ? exp : null;
          const __m2 = _calcMismatch({ cur: __cur, exp: __exp });
          if (__m2 && __m2.ok) {
            if (__ratio === null && typeof __m2.ratio === "number") __ratio = __m2.ratio;
            if (__diff === null && typeof __m2.diff === "number") __diff = __m2.diff;
          }
        }
      } catch { }


      // signals에 "맥락"도 같이 노출(있을 때만)
      if (__industry) __signals2.push(`산업/업종 힌트: ${__industry}`);
      if (__role) __signals2.push(`직무/역할 힌트: ${__role}`);
      if (__lead) __signals2.push(`직급/리더십 힌트: ${__lead}`);
      if (__sizeCur || __sizeTgt) __signals2.push(`회사규모 이동 힌트: ${__sizeCur || "?"} → ${__sizeTgt || "?"}`);

      const __ind = __norm(__industry);
      const __rl = __norm(__role);
      const __szCur = __norm(__sizeCur);
      const __szTgt = __norm(__sizeTgt);
      const __lv = __norm(__lead);

      const __isLargeTgt =
        __szTgt.includes("large") || __szTgt.includes("대기업") || __szTgt.includes("enterprise");
      const __isStartupCur =
        __szCur.includes("startup") || __szCur.includes("스타트업") || __szCur.includes("small") || __szCur.includes("smb");

      const __isFinance =
        __ind.includes("finance") || __ind.includes("금융") || __ind.includes("bank") || __ind.includes("은행") ||
        __ind.includes("증권") || __ind.includes("보험");

      const __isManufacturing =
        __ind.includes("manufact") || __ind.includes("제조") || __ind.includes("automotive") || __ind.includes("자동차") ||
        __ind.includes("semiconductor") || __ind.includes("반도체") || __ind.includes("bio") || __ind.includes("바이오");

      const __isProcurementSCM =
        __rl.includes("procurement") || __rl.includes("구매") || __rl.includes("scm") || __rl.includes("supply") ||
        __rl.includes("물류") || __rl.includes("logistics") || __rl.includes("운영") || __rl.includes("ops");

      const __isSales =
        __rl.includes("sales") || __rl.includes("영업") || __rl.includes("account") || __rl.includes("bd");

      const __isDevData =
        __rl.includes("developer") || __rl.includes("개발") || __rl.includes("software") || __rl.includes("engineer") ||
        __rl.includes("data") || __rl.includes("데이터") || __rl.includes("ai") || __rl.includes("ml");

      const __isLead =
        __lv.includes("lead") || __lv.includes("리드") || __lv.includes("manager") || __lv.includes("매니저") ||
        __lv.includes("head") || __lv.includes("director") || __lv.includes("임원");

      // ---- branch messages (additive only) ----
      // 1) 대기업/금융/제조: 밴드/형평/승인 체계가 경직한 편
      if (__isLargeTgt || __isFinance || __isManufacturing) {
        __why2.push(
          "대기업/금융/제조 계열은 연봉 밴드·직급 테이블·내부 형평(동일레벨/동일직무) 기준이 상대적으로 경직해서, 기대치가 높으면 ‘협의 불가’로 빠르게 컷될 수 있습니다."
        );
        __action2.push(
          "해당 조직의 ‘레벨-연봉 밴드’에 맞춰 기대 범위를 제시하고, 왜 그 레벨에 해당하는지(스코프/책임/성과)를 수치로 정리해 주세요."
        );
      }

      // 2) 구매/SCM/운영: 내부 형평·원가·조직 내 비교가 더 민감한 편
      if (__isProcurementSCM) {
        __why2.push(
          "구매/SCM/운영은 비용·원가·조직 내 비교가 민감해서, 기대연봉 급점프는 ‘내부 형평 이슈’로 해석돼 협상 이전 단계에서 걸릴 수 있습니다."
        );
        __action2.push(
          "성과를 ‘원가절감/리드타임/재고/납기/협력사 관리’처럼 비용·효율 지표로 환산해서 레벨업 근거로 제시해 주세요."
        );
      }

      // 3) 영업: OTE/인센 분리 여부가 핵심
      if (__isSales) {
        __why2.push(
          "영업 직군은 고정급/인센(OTE) 구조가 달라서, ‘연봉’ 기대치가 고정급 기준인지 총보상(OTE) 기준인지가 불명확하면 컷 사유가 되기 쉽습니다."
        );
        __action2.push(
          "기대보상을 ‘고정급 + 인센(OTE)’로 분해해 제시하고, 최근 1~2년 실적(쿼터 대비 달성률/매출/마진)을 함께 붙여 주세요."
        );
      }

      // 4) 개발/데이터: 희소성/대체불가면 예외 가능(단, 증거 필요)
      if (__isDevData) {
        __counter2.push(
          "개발/데이터는 희소 스킬·대체불가 성과가 명확하면 밴드 예외가 나기도 하지만, 그 경우에도 ‘근거(지표/임팩트/레퍼런스)’가 없으면 동일하게 컷될 수 있습니다."
        );
        __action2.push(
          "희소성 근거(핵심기술/난이도/리딩 범위)와 성과 임팩트(매출/비용/속도/품질)를 3~5개 bullet로 압축해 준비해 주세요."
        );
      }

      // 5) 리더십 낮은데 급점프: 책임/스코프 근거 부족으로 보일 수 있음
      // (ratio/diff가 있을 때만 보수적으로 추가)
      if (!__isLead) {
        const __jumpRatio = (typeof __ratio === "number") ? __ratio : null;
        const __jumpDiff = (typeof __diff === "number") ? __diff : null;
        const __jumpBig = (__jumpRatio !== null && __jumpRatio >= 1.6) || (__jumpDiff !== null && __jumpDiff >= 3000);
        if (__jumpBig) {
          __why2.push(
            "리더십/직급 신호가 낮은 상태에서 기대연봉이 크게 점프하면, ‘책임/스코프 증가 근거가 부족’하다고 해석돼 초기 필터에서 불리할 수 있습니다."
          );
          __action2.push(
            "‘지금 레벨에서 다음 레벨로 넘어갈 만한 책임 증가’(예: 의사결정 범위/예산/인력/대외협상/프로젝트 규모)를 구체적으로 제시해 주세요."
          );
        }
      }

      // 6) 회사규모 이동(스타트업→대기업 등): 밴드 리셋/정렬 이슈
      if (__isStartupCur && __isLargeTgt) {
        __why2.push(
          "스타트업 → 대기업 이동은 보상 체계가 달라서, 기존 연봉(또는 기대치)이 ‘밴드 리셋/정렬’ 대상이 되기 쉽습니다. 이 경우 기대치가 높으면 협의 진입 전에 탈락할 수 있습니다."
        );
        __action2.push(
          "대기업 기준으로 ‘동일 레벨 시장가’ 범위를 먼저 맞추고, 예외가 가능하다면 그 예외 근거(희소성/리딩/정량성과)를 한 줄로 정의해 주세요."
        );
      }

      // ---- merge into existing arrays (append-only) ----
      // 아래 변수명(why/signals/action/counter)이 explain에서 실제로 쓰는 이름과 다르면,
      // return 객체 쪽에서 ...( __why2 ) 형태로만 합쳐 주세요.

    } catch {
      // no-op (append-only safety)
    }
    return {
      title: "연봉 기대치가 과도하면 서류에서 컷될 수 있음",
      why: [
        "회사 입장에서는 '조정 불가능한 조건'이 보이면 면접/협상 리소스를 아끼는 방향으로 움직입니다.",
        "특히 현재 연봉 대비 기대 연봉이 크게 뛰면, 내부 밴드/직급 테이블과 충돌로 조기 탈락할 수 있습니다.",
        ...(__extraWhy.length ? __extraWhy : []),
        ...(__why2.length ? __why2 : []),
      ],
      signals: [
        `현재 연봉(추정): ${curTxt}`,
        `희망 연봉(추정): ${expTxt}`,
        `상승률(희망/현재): ${ratioTxt}`,
        `차이(희망-현재): ${diffTxt}`,
        ...(__extraSignals.length ? __extraSignals : []),
        ...(__signals2.length ? __signals2 : []),
      ],
      action: [
        "희망 연봉을 '직급/레벨 근거'와 같이 제시(역할 범위/책임/리더십/성과 크기).",
        "가능하면 '협의 가능' 범위를 숫자로 좁혀서 표현(예: 6,500~7,000).",
        "지원 직무의 시장 밴드(동일 레벨/동일 산업) 근거를 같이 제시.",
        ...(__action2.length ? __action2 : []),
      ],
      counter: [
        "정말로 레벨 업(책임/조직 규모/의사결정권한)이 명확하면 높은 연봉도 정당화됩니다.",
        "핵심 스킬 희소성이 높거나(초고난도, 즉시전력), 채용이 매우 급한 포지션이면 예외가 생깁니다.",
        ...(__counter2.length ? __counter2 : []),
      ],
    };
  },
};


