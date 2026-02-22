export const domainShiftRisk = {
  id: "domainShiftRisk",
  group: "domain",
  layer: "document",
  priority: 40,

  //  ENABLED: Domain(Industry)/Role mismatch risk
  // Q1 YES: 산업 mismatch만으로도 트리거 (roleTarget 비어도)
  // Q2 YES: score 0~0.7, industry 0.35 + role 0.25 합산(캡)
  // 안정성:
  // - unknown/empty 제외
  // - objective(resumeIndustry/jdIndustry)는 둘 다 유효할 때만 사용
  // - roleTarget 우선, 없으면 objective.roleInference fallback
  // - score < 0.1 은 트리거/점수 0 처리 (노이즈 컷)

  when: (ctx) => {
    const s = (v) => (v ?? "").toString().trim();
    const lower = (v) => s(v).toLowerCase();

    const state = ctx?.state || {};
    const obj = ctx?.objective || {};

    const isKnown = (v) => {
      const x = lower(v);
      return !!x && x !== "unknown" && x !== "n/a" && x !== "na";
    };

    // 1) Industry: prefer state, fallback objective only if BOTH known
    const stIndCur = s(state?.industryCurrent || state?.currentIndustry);
    const stIndTgt = s(state?.industryTarget || state?.targetIndustry);

    const obIndCur = s(obj?.resumeIndustry);
    const obIndTgt = s(obj?.jdIndustry);

    const indCur = isKnown(stIndCur) ? stIndCur : (isKnown(obIndCur) && isKnown(obIndTgt) ? obIndCur : "");
    const indTgt = isKnown(stIndTgt) ? stIndTgt : (isKnown(obIndCur) && isKnown(obIndTgt) ? obIndTgt : "");

    const industryMismatch =
      isKnown(indCur) && isKnown(indTgt) && lower(indCur) !== lower(indTgt);

    // 2) Role: prefer roleTarget, fallback objective roleInference
    const roleCur = s(state?.currentRole || state?.roleCurrent || state?.role || obj?.role);

    const roleTgtPrimary = s(state?.roleTarget || state?.targetRole);
    const ri = obj?.roleInference || {};
    const roleTgtFallback = s(ri?.familyRole || ri?.fineRole);

    const roleTgt = isKnown(roleTgtPrimary) ? roleTgtPrimary : (isKnown(roleTgtFallback) ? roleTgtFallback : "");

    const roleMismatch =
      isKnown(roleCur) && isKnown(roleTgt) && lower(roleCur) !== lower(roleTgt);

    let sc = 0;
    if (industryMismatch) sc += 0.35;
    if (roleMismatch) sc += 0.25;
    if (sc > 0.7) sc = 0.7;

    return sc >= 0.1;
  },

  score: (ctx) => {
    const s = (v) => (v ?? "").toString().trim();
    const lower = (v) => s(v).toLowerCase();

    const state = ctx?.state || {};
    const obj = ctx?.objective || {};

    const isKnown = (v) => {
      const x = lower(v);
      return !!x && x !== "unknown" && x !== "n/a" && x !== "na";
    };

    const stIndCur = s(state?.industryCurrent || state?.currentIndustry);
    const stIndTgt = s(state?.industryTarget || state?.targetIndustry);

    const obIndCur = s(obj?.resumeIndustry);
    const obIndTgt = s(obj?.jdIndustry);

    const indCur = isKnown(stIndCur) ? stIndCur : (isKnown(obIndCur) && isKnown(obIndTgt) ? obIndCur : "");
    const indTgt = isKnown(stIndTgt) ? stIndTgt : (isKnown(obIndCur) && isKnown(obIndTgt) ? obIndTgt : "");

    const industryMismatch =
      isKnown(indCur) && isKnown(indTgt) && lower(indCur) !== lower(indTgt);

    const roleCur = s(state?.currentRole || state?.roleCurrent || state?.role || obj?.role);

    const roleTgtPrimary = s(state?.roleTarget || state?.targetRole);
    const ri = obj?.roleInference || {};
    const roleTgtFallback = s(ri?.familyRole || ri?.fineRole);
    const roleTgt = isKnown(roleTgtPrimary) ? roleTgtPrimary : (isKnown(roleTgtFallback) ? roleTgtFallback : "");

    const roleMismatch =
      isKnown(roleCur) && isKnown(roleTgt) && lower(roleCur) !== lower(roleTgt);

    let sc = 0;
    if (industryMismatch) sc += 0.35;
    if (roleMismatch) sc += 0.25;
    if (sc > 0.7) sc = 0.7;

    if (sc < 0.1) return 0;
    return sc;
  },

  explain: (ctx) => {
    const s = (v) => (v ?? "").toString().trim();
    const lower = (v) => s(v).toLowerCase();

    const state = ctx?.state || {};
    const obj = ctx?.objective || {};

    const isKnown = (v) => {
      const x = lower(v);
      return !!x && x !== "unknown" && x !== "n/a" && x !== "na";
    };

    const stIndCur = s(state?.industryCurrent || state?.currentIndustry);
    const stIndTgt = s(state?.industryTarget || state?.targetIndustry);

    const obIndCur = s(obj?.resumeIndustry);
    const obIndTgt = s(obj?.jdIndustry);

    const indCur = isKnown(stIndCur) ? stIndCur : (isKnown(obIndCur) && isKnown(obIndTgt) ? obIndCur : "");
    const indTgt = isKnown(stIndTgt) ? stIndTgt : (isKnown(obIndCur) && isKnown(obIndTgt) ? obIndTgt : "");

    const industryMismatch =
      isKnown(indCur) && isKnown(indTgt) && lower(indCur) !== lower(indTgt);

    const roleCur = s(state?.currentRole || state?.roleCurrent || state?.role || obj?.role);

    const roleTgtPrimary = s(state?.roleTarget || state?.targetRole);
    const ri = obj?.roleInference || {};
    const roleTgtFallback = s(ri?.familyRole || ri?.fineRole);
    const roleTgt = isKnown(roleTgtPrimary) ? roleTgtPrimary : (isKnown(roleTgtFallback) ? roleTgtFallback : "");

    const roleMismatch =
      isKnown(roleCur) && isKnown(roleTgt) && lower(roleCur) !== lower(roleTgt);

    let sc = 0;
    if (industryMismatch) sc += 0.35;
    if (roleMismatch) sc += 0.25;
    if (sc > 0.7) sc = 0.7;

    if (sc < 0.1) return null;

    const why = [];
    const signals = [];
    const action = [];
    const counter = [];

    if (industryMismatch) {
      why.push(
        `현재 산업(${indCur})과 지원 산업(${indTgt})의 맥락이 달라 도메인 전환 리스크로 해석될 수 있습니다. ` +
        `다만 산업명이 다르다는 사실 자체가 곧바로 결론을 의미하진 않고, 실제로 아래 ‘구조 차이’가 얼마나 큰지에 따라 리스크 강도는 달라질 수 있습니다.`
      );

      // 1) 고객 구조 차이
      why.push(
        "구조 차이(고객): 고객군과 수익/관계 모델이 바뀌면, 설득 포인트와 성과 정의가 달라질 수 있습니다. " +
        "(B2B/B2C, 구독·LTV 중심 vs 단발 구매, 구매 의사결정 구조(의사결정자/승인 라인) 등)"
      );

      // 2) 문제 해결 구조 차이
      why.push(
        "구조 차이(문제 해결): 일이 ‘운영 최적화’ 중심인지 ‘제품/성장’ 중심인지, 실험 문화가 얼마나 강한지, 규제/컴플라이언스 환경이 어떤지에 따라 " +
        "필요한 근거와 실행 방식이 달라질 수 있습니다."
      );

      // 3) 의사결정 문화 차이
      why.push(
        "구조 차이(의사결정): 안정·리스크 최소화 중심인지, 실험·학습 중심인지에 따라 의사결정 속도/자율성/책임 범위가 달라질 수 있습니다. " +
        "(속도, 자율성, 권한 위임 정도 등)"
      );

      signals.push(`산업 전환: ${indCur} → ${indTgt}`);
      signals.push("구조 차이 프레임: 고객 구조 / 문제 해결 구조 / 의사결정 문화");

      // 다음 액션(요구사항 5): 구조 차이 해소 근거 + transferable 구조적 역량 2~3개
      action.push(
        "‘구조 차이’를 어떻게 해소했는지 근거를 제시하세요: " +
        "예) 구매 의사결정 구조에서의 설득/조율 경험, 규제·보안·품질 같은 제약 조건 하에서의 실행 경험, 실험/개선 사이클(가설→실험→지표) 운영 경험."
      );

      action.push(
        "transferable 구조적 역량 2~3개를 명시하세요(문장으로 고정): " +
        "① 지표/성과 정의 및 측정 체계 설계(무엇을 성과로 볼지), " +
        "② 이해관계자 조율 및 의사결정 구조 설계(누가 무엇을 결정하는지), " +
        "③ 프로세스/운영 최적화 또는 실험/제품 개선 루프 구축."
      );

      action.push(
        "가능하면 수치/산출물로 연결하세요: 지표 변화(%, 절대값), 비용/시간 절감, 리드타임 단축, 전환율/리텐션 개선, " +
        "정책/프로세스 문서·리포트·실험 설계서 같은 산출물 제시가 있으면 설득력이 크게 올라갑니다."
      );

      // 반례/예외(요구사항 6)
      counter.push(
        "스타트업/신사업 환경에서는 산업 교차 경험이 오히려 강점이 될 수 있습니다. " +
        "새 문제를 빠르게 구조화하고, 부족한 맥락을 학습·정리해 실행으로 옮기는 역량이 높게 평가되기도 합니다."
      );

      counter.push(
        "또한 이 신호의 영향은 ‘근거 제시’에 따라 크게 줄어들 수 있습니다. " +
        "면접/포트폴리오에서 수치(지표 변화)와 산출물(문서/리포트/실험 설계/프로세스 개선)을 제시하면, 전환 리스크 해석이 약화될 수 있습니다."
      );
    }

    if (roleMismatch) {
      why.push(`현재 직무군(${roleCur})과 목표 직무군(${roleTgt})이 달라 직무 전환 리스크로 해석될 수 있습니다.`);
      signals.push(`직무 불일치: ${roleCur}  ${roleTgt}`);
      action.push("직무 전환 동기(왜 지금/왜 이 역할)를 한 문장으로 고정하고, 그걸 뒷받침하는 증거(지표/산출물)를 붙이세요.");
      counter.push("전환 직무의 핵심 스킬/툴/산출물을 이미 수행한 흔적이 있으면 리스크가 줄어듭니다.");
    }

    return {
      title: "도메인/직무 전환 리스크",
      why,
      signals,
      action,
      counter,
      meta: {
        industryCurrent: indCur || "",
        industryTarget: indTgt || "",
        roleCurrent: roleCur || "",
        roleTarget: roleTgt || "",
        industryMismatch,
        roleMismatch,
        score: sc,
      },
    };
  },
};
