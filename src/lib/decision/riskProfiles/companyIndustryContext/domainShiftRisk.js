// ── ontology 기반 직무 거리 판정 ────────────────────────────
import { roleDistance } from "../../../roleDistance.js";

// ROOT_CATEGORY_MAP: canonical role → PASSMAP UI root category
// (roleDistance.js와 동기화 유지)
const _ROOT_CAT = {
  "전략기획": "기타", "사업기획": "기타", "경영 컨설팅": "기타",
  "서비스 기획": "프로덕트 기획", "UX 기획": "프로덕트 기획",
  "프로덕트 매니저": "PM / PO",
  "퍼포먼스 마케팅": "마케팅", "브랜드 마케팅": "마케팅", "그로스 마케팅": "마케팅",
  "콘텐츠 마케팅": "마케팅", "CRM 마케팅": "마케팅",
  "B2B 영업": "영업 / BD", "B2C 영업": "영업 / BD", "BD": "영업 / BD", "해외영업": "영업 / BD",
  "HR 채용": "HR", "HRD": "HR", "HRBP": "HR", "조직문화": "HR",
  "데이터 분석": "데이터", "BI 분석": "데이터", "데이터 엔지니어": "데이터",
  "데이터 사이언티스트": "데이터", "그로스 애널리스트": "데이터",
  "FP&A": "재무 / 회계", "회계": "재무 / 회계", "세무": "재무 / 회계", "재무 기획": "재무 / 회계",
  "Customer Success": "운영 / CS", "고객 지원": "운영 / CS",
  "운영 관리": "운영 / CS", "구매": "운영 / CS", "SCM": "운영 / CS",
  "UX 디자인": "디자인", "UI 디자인": "디자인", "프로덕트 디자인": "디자인",
};

/**
 * ontology 기반 직무 전환 리스크 계산 (내부 헬퍼)
 * - alias normalization → roleDistance → root category 비교 → domainShiftType 판정
 * @returns {{ roleMismatch, roleScore, domainShiftType, canonicalA, canonicalB,
 *             currentRootCategory, targetRootCategory, distance, ontologyMatchSource }}
 */
function _computeRoleShift(roleCur, roleTgt) {
  const { canonicalA, canonicalB, distance } = roleDistance(roleCur, roleTgt);

  const currentRootCategory = _ROOT_CAT[canonicalA] ?? null;
  const targetRootCategory  = _ROOT_CAT[canonicalB] ?? null;
  const sameCategory = !!currentRootCategory && currentRootCategory === targetRootCategory;

  let domainShiftType, roleMismatch, roleScore;

  if (distance <= 2) {
    domainShiftType = "NONE";
    roleMismatch    = false;
    roleScore       = 0;
  } else if (distance === 3) {
    domainShiftType = "FUNCTION_SHIFT";
    roleMismatch    = true;
    roleScore       = 0.12;
  } else {
    // distance > 3 (Infinity 포함)
    domainShiftType = sameCategory ? "DOMAIN_SHIFT" : "HARD_DOMAIN_MISMATCH";
    roleMismatch    = true;
    roleScore       = sameCategory ? 0.20 : 0.25;
  }

  const ontologyMatchSource =
    canonicalA && canonicalB ? "ontology_graph"
    : canonicalA || canonicalB ? "ontology_partial"
    : "fallback_exact";

  return {
    roleMismatch, roleScore, domainShiftType,
    canonicalA, canonicalB,
    currentRootCategory, targetRootCategory,
    distance,
    ontologyMatchSource,
  };
}

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

    // 2) Role: ontology 기반 거리 판정 (exact string compare 대체)
    const roleCur = s(state?.currentRole || state?.roleCurrent || obj?.role);

    const roleTgtPrimary = s(state?.roleTarget || state?.targetRole || state?.role);
    const ri = obj?.roleInference || {};
    const roleTgtFallback = s(ri?.familyRole || ri?.fineRole);

    const roleTgt = isKnown(roleTgtPrimary) ? roleTgtPrimary : (isKnown(roleTgtFallback) ? roleTgtFallback : "");

    const { roleMismatch, roleScore } =
      isKnown(roleCur) && isKnown(roleTgt)
        ? _computeRoleShift(roleCur, roleTgt)
        : { roleMismatch: false, roleScore: 0 };

    let sc = 0;
    if (industryMismatch) sc += 0.35;
    if (roleMismatch) sc += roleScore;
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

    const roleCur = s(state?.currentRole || state?.roleCurrent || obj?.role);

    const roleTgtPrimary = s(state?.roleTarget || state?.targetRole || state?.role);
    const ri = obj?.roleInference || {};
    const roleTgtFallback = s(ri?.familyRole || ri?.fineRole);
    const roleTgt = isKnown(roleTgtPrimary) ? roleTgtPrimary : (isKnown(roleTgtFallback) ? roleTgtFallback : "");

    // ontology 기반 거리 판정 (exact string compare 대체)
    const { roleMismatch, roleScore } =
      isKnown(roleCur) && isKnown(roleTgt)
        ? _computeRoleShift(roleCur, roleTgt)
        : { roleMismatch: false, roleScore: 0 };

    let sc = 0;
    if (industryMismatch) sc += 0.35;
    if (roleMismatch) sc += roleScore;
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

    const roleCur = s(state?.currentRole || state?.roleCurrent || obj?.role);

    const roleTgtPrimary = s(state?.roleTarget || state?.targetRole || state?.role);
    const ri = obj?.roleInference || {};
    const roleTgtFallback = s(ri?.familyRole || ri?.fineRole);
    const roleTgt = isKnown(roleTgtPrimary) ? roleTgtPrimary : (isKnown(roleTgtFallback) ? roleTgtFallback : "");

    // ontology 기반 거리 판정 (exact string compare 대체)
    const roleShift =
      isKnown(roleCur) && isKnown(roleTgt)
        ? _computeRoleShift(roleCur, roleTgt)
        : { roleMismatch: false, roleScore: 0, domainShiftType: "NONE",
            canonicalA: null, canonicalB: null,
            currentRootCategory: null, targetRootCategory: null,
            distance: Infinity, ontologyMatchSource: "fallback_exact" };

    const { roleMismatch, roleScore, domainShiftType,
            canonicalA, canonicalB,
            currentRootCategory, targetRootCategory,
            distance, ontologyMatchSource } = roleShift;

    let sc = 0;
    if (industryMismatch) sc += 0.35;
    if (roleMismatch) sc += roleScore;
    if (sc > 0.7) sc = 0.7;

    if (sc < 0.1) return null;

    const why = [];
    const signals = [];
    const action = [];
    const counter = [];

    // ✅ PATCH (append-only): why[] 빈 값 방어 — 빈 괄호 출력 방지
    const __indCurLabel = indCur || "현재 산업";
    const __indTgtLabel = indTgt || "지원 산업";

    if (industryMismatch) {
      why.push(
        `현재 산업(${__indCurLabel})과 지원 산업(${__indTgtLabel})의 맥락이 달라 도메인 전환 리스크로 해석될 수 있습니다. ` +
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
      const displayCur = canonicalA || roleCur || "현재 직무";
      const displayTgt = canonicalB || roleTgt || "목표 직무";

      if (domainShiftType === "FUNCTION_SHIFT") {
        // 인접 직무 간 기능 전환: 관련성 있으나 핵심 기능 차이 존재
        why.push(
          `현재 직무(${displayCur})와 목표 직무(${displayTgt})는 서로 연결된 직무군이지만, ` +
          `핵심 기능·KPI·주요 협업 구조가 달라 전환 검증이 필요합니다. ` +
          `관련성이 있는 만큼 전환 자체보다 '목표 직무의 핵심 산출물 경험'이 있는지가 평가 포인트가 됩니다.`
        );
        signals.push(`직무 기능 전환: ${displayCur} → ${displayTgt}`);
        action.push(
          `두 직무에서 겹치는 역량(공통 툴·프로세스·협업 구조)을 이력서에 명시적으로 드러내고, ` +
          `목표 직무의 핵심 산출물(보고서, 의사결정 문서, 실험 결과 등)을 이미 수행한 경험이 있다면 직접 연결하세요.`
        );
        counter.push(
          `인접 직무 간 전환은 산업 전환보다 일반적으로 리스크가 낮습니다. ` +
          `현 직무에서 목표 직무의 역할을 일부 담당한 경험이 있으면 리스크가 크게 줄어듭니다.`
        );
      } else if (domainShiftType === "DOMAIN_SHIFT") {
        // 같은 직군 내 전환: 카테고리 동일하나 실무 결 차이 있음
        why.push(
          `현재 직무(${displayCur})와 목표 직무(${displayTgt})는 같은 직군 내에 있지만, ` +
          `실무 결·책임 범위·성과 평가 기준이 달라 전환 난도가 있습니다. ` +
          `직군 레이블이 같더라도 실제 필요 역량과 기대 산출물이 다를 수 있습니다.`
        );
        signals.push(`직군 내 직무 전환: ${displayCur} → ${displayTgt}`);
        action.push(
          `목표 직무에서 요구하는 핵심 역량을 이미 경험했는지 명확히 해야 합니다. ` +
          `관련 프로젝트·산출물·지표 개선 사례를 중심으로 이력서를 구성하고, ` +
          `목표 직무와 직접 연결되는 경험을 전면에 배치하세요.`
        );
        counter.push(
          `같은 직군 내 전환은 학습 곡선이 짧을 수 있습니다. ` +
          `목표 직무와 관련된 경험을 이미 보유하고 있다면, 해당 경험을 적극적으로 드러내 리스크 인식을 낮출 수 있습니다.`
        );
      } else {
        // HARD_DOMAIN_MISMATCH 또는 fallback: 직무 기능·직군 모두 이질적
        why.push(
          `현재 직무(${displayCur})와 목표 직무(${displayTgt})는 직무 기능과 상위 직군 모두 다릅니다. ` +
          `이 수준의 전환은 즉시 합격 가능성이 낮고, 강한 브릿지 경험이 없으면 서류 단계에서 필터될 가능성이 높습니다.`
        );
        signals.push(`직무 도메인 불일치: ${displayCur} → ${displayTgt}`);
        action.push(
          `전환 동기(왜 지금/왜 이 직무)를 한 문장으로 명확히 하고, ` +
          `목표 직군에서 실질적으로 기여한 경험(프로젝트/교육/사이드 경험 등)을 반드시 제시해야 합니다. ` +
          `브릿지 경험이 없으면 지원 자체를 재검토하는 것이 현실적입니다.`
        );
        counter.push(
          `목표 직군에서의 실제 교차 경험(전직·사이드 프로젝트·프리랜서 등)이나 ` +
          `관련 자격·수료 이력이 있으면 리스크를 일부 상쇄할 수 있습니다.`
        );
      }
    }

    // domainShiftType에 따라 title 분기 (roleMismatch가 없으면 industry 기반 고정)
    const resolvedTitle = roleMismatch
      ? (domainShiftType === "FUNCTION_SHIFT" ? "직무 기능 전환 리스크"
        : domainShiftType === "DOMAIN_SHIFT" ? "직무 전환 리스크 (동일 직군 내)"
        : domainShiftType === "HARD_DOMAIN_MISMATCH" ? "직무 도메인 불일치 리스크"
        : "도메인/직무 전환 리스크")
      : "도메인/산업 전환 리스크";

    return {
      title: resolvedTitle,
      why,
      signals,
      action,
      counter,
      meta: {
        // 기존 필드 (backward compatible 유지)
        industryCurrent: indCur || "",
        industryTarget: indTgt || "",
        roleCurrent: roleCur || "",
        roleTarget: roleTgt || "",
        industryMismatch,
        roleMismatch,
        score: sc,
        // ontology 기반 append-only 메타 필드
        currentCanonicalRole: canonicalA,
        targetCanonicalRole: canonicalB,
        currentRootCategory,
        targetRootCategory,
        roleDistance: distance,
        domainShiftType,
        ontologyMatchSource,
      },
    };
  },
};
