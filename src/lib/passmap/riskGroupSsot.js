// ─────────────────────────────────────────────────────────────────────────────
// PASSMAP 리스크 그룹 SSOT  (append-only — 기존 엔진 key 변경 금지)
//
// 역할:
//   1. 엔진 key → G01~G11 그룹 id 매핑
//   2. 그룹별 사용자 노출용 이름 + 상세보기 modal copy 정의
//   3. modal 연결 헬퍼 함수 제공
//
// 금지:
//   - 엔진 key 이름 변경 금지
//   - 리스크 점수/순위/판정 로직 변경 금지
//   - 기존 Top3 선정 규칙 변경 금지
// ─────────────────────────────────────────────────────────────────────────────

// ── 1. 그룹 SSOT 정의 ────────────────────────────────────────────────────────
// modal 필드 매핑:
//   title            → __detail.title
//   [headline, summary] → __detail.mind
//   [why]            → __detail.reasons
//   interviewQuestions  → __detail.questions
//   actions          → __detail.fixes

export const RISK_GROUP_SSOT = {
  G01: {
    id: "G01",
    name: "전형 진입 조건 게이트",
    title: "전형 진입 조건 게이트",
    headline: "지원 직무의 기본 전형 조건을 충족하지 못했을 가능성",
    summary: "이 이력서는 직무와의 세부 적합도를 보기 전에, 채용 공고에서 요구하는 최소 조건을 충족하는지부터 확인이 필요한 상태로 읽힐 수 있습니다.",
    why: "면접관은 서류를 볼 때 먼저 이 사람이 기본 조건을 충족하는가를 확인합니다. 필수 경험, 학력 조건, 특정 도메인 적합성이 맞지 않으면 직무 적합도 판단 이전에 전형 조건 자체를 의심하게 됩니다.",
    interviewQuestions: [
      "이 직무와 직접적으로 연결되는 경험이 있나요?",
      "해당 분야에서 실제로 수행한 프로젝트가 있나요?",
    ],
    actions: [
      "JD에서 요구하는 핵심 경험을 명확히 연결",
      "유사 경험이라도 직무 연결성을 설명",
      "지원 직무와 직접적으로 관련된 프로젝트 강조",
    ],
  },

  G02: {
    id: "G02",
    name: "연령·보상 조건 정합성 게이트",
    title: "연령·보상 조건 정합성 게이트",
    headline: "경력 수준과 연봉 기대치가 채용 포지션과 맞지 않을 가능성",
    summary: "이 이력서는 지원자의 경력 수준, 연령대, 또는 보상 기대가 해당 채용 포지션의 구조와 맞지 않을 가능성이 보일 수 있습니다.",
    why: "채용은 능력뿐 아니라 조직 구조와의 균형도 함께 봅니다. 경력 대비 너무 낮은 포지션 지원, 연봉 기대와 예산 간 격차, 직급 수준 불일치가 보이면 채용 리스크로 인식될 수 있습니다.",
    interviewQuestions: [
      "왜 이 직무 수준의 포지션에 지원했나요?",
      "연봉 기대 수준은 어느 정도인가요?",
    ],
    actions: [
      "지원 포지션과 경력 레벨의 연결 설명",
      "커리어 방향 전환 이유 명확화",
      "연봉 기대와 직무 목표의 정합성 설명",
    ],
  },

  G03: {
    id: "G03",
    name: "JD 핵심 역량 커버리지 리스크",
    title: "JD 핵심 역량 커버리지 리스크",
    headline: "채용 공고에서 요구하는 핵심 역량이 충분히 확인되지 않음",
    summary: "이 이력서는 지원 직무에서 중요하게 보는 핵심 기술·역량·도구 경험이 명확히 드러나지 않을 수 있습니다.",
    why: "면접관은 JD에서 요구한 역량을 기준으로 이력서를 빠르게 체크합니다. 필수 스킬, 핵심 업무 경험, 특정 도구 경험이 이력서에서 확인되지 않으면 핵심 역량 커버리지가 부족하다고 판단할 수 있습니다.",
    interviewQuestions: [
      "이 직무에서 사용하는 도구를 실제로 사용해 본 경험이 있나요?",
      "JD에 있는 핵심 업무를 직접 수행해 본 경험이 있나요?",
    ],
    actions: [
      "JD 핵심 키워드와 직접 연결되는 경험 추가",
      "사용한 도구 및 기술 스택 명확히 표시",
      "프로젝트에서 맡은 역할 구체화",
    ],
  },

  G04: {
    id: "G04",
    name: "직무·도메인 전이 적합도 리스크",
    title: "직무·도메인 전이 적합도 리스크",
    headline: "현재 경력이 지원 직무와 직접적으로 연결되지 않아 보일 수 있음",
    summary: "이 이력서는 지원자의 경력이 지원 직무와 다른 도메인에서 형성된 것처럼 보일 수 있습니다.",
    why: "직무나 산업이 바뀌는 경우 면접관은 기존 경험이 새로운 역할과 어떻게 연결되는지 봅니다. 그 연결이 이력서에서 보이지 않으면 직무 전환 리스크로 읽힐 수 있습니다.",
    interviewQuestions: [
      "이전 경험이 이 직무와 어떻게 연결되나요?",
      "이 분야로 전환하려는 이유는 무엇인가요?",
    ],
    actions: [
      "기존 경험과 새 직무 간 연결 구조 설명",
      "유사 프로젝트 경험 강조",
      "직무 관련 학습 및 준비 활동 표시",
    ],
  },

  G05: {
    id: "G05",
    name: "경력 안정성 리스크",
    title: "경력 안정성 리스크",
    headline: "경력 흐름의 안정성에 대한 추가 확인이 필요할 수 있음",
    summary: "이 이력서는 경력 이동 패턴이나 재직 기간 때문에 장기 근속 가능성에 대한 질문이 생길 수 있습니다.",
    why: "짧은 재직 기간 반복, 산업 간 잦은 이동, 설명되지 않은 공백이 보이면 면접관은 경력 안정성을 확인하려고 합니다.",
    interviewQuestions: [
      "이전 회사에서 퇴사한 이유는 무엇인가요?",
      "경력 이동이 잦은 이유가 있나요?",
    ],
    actions: [
      "이직 이유의 맥락 설명",
      "경력 이동의 커리어 방향성 제시",
      "주요 프로젝트 중심으로 경력 구조 재정리",
    ],
  },

  G06: {
    id: "G06",
    name: "연차·직급 정합성 리스크",
    title: "연차·직급 정합성 리스크",
    headline: "경력 연차와 직무 수준의 균형이 애매하게 보일 수 있음",
    summary: "이 이력서는 연차 대비 직무 수준이나 직책이 채용 포지션과 완전히 맞지 않는 것처럼 보일 수 있습니다.",
    why: "면접관은 연차 숫자보다 실제로 어떤 수준의 책임과 역할을 맡아왔는지를 봅니다. 직함, 책임 범위, 리딩 경험이 목표 포지션과 어긋나 보이면 실제 역할 수준을 다시 확인하려고 합니다.",
    interviewQuestions: [
      "실제로 팀에서 맡았던 책임 범위는 어디까지였나요?",
      "팀 리딩 경험이 있나요?",
    ],
    actions: [
      "연차보다 실제 책임 범위를 중심으로 서술",
      "리딩 또는 의사결정 경험이 있다면 분리 표기",
      "목표 포지션과 맞닿는 수준의 업무를 전면 배치",
    ],
  },

  G07: {
    id: "G07",
    name: "성과·임팩트 입증 리스크",
    title: "성과·임팩트 입증 리스크",
    headline: "업무 경험은 보이지만 실제 성과 영향이 충분히 드러나지 않음",
    summary: "이 이력서는 어떤 일을 했는지는 보이지만 그 결과가 조직에 어떤 영향을 줬는지는 명확하지 않을 수 있습니다.",
    why: "면접관은 업무 수행 자체보다 결과를 봅니다. 과정 설명은 있는데 수치, 변화, 결과, 범위가 부족하면 실제 성과를 만든 사람인지 다시 확인하려고 합니다.",
    interviewQuestions: [
      "해당 프로젝트의 결과는 어땠나요?",
      "본인이 만든 성과는 무엇인가요?",
    ],
    actions: [
      "결과를 수치·비율·규모로 표현",
      "과정 설명 뒤에 반드시 결과 한 줄 추가",
      "본인 기여와 팀 성과를 분리해서 서술",
    ],
  },

  G08: {
    id: "G08",
    name: "주도성·오너십 입증 리스크",
    title: "주도성·오너십 입증 리스크",
    headline: "프로젝트에서 본인의 주도 역할이 충분히 보이지 않을 수 있음",
    summary: "이 이력서는 프로젝트 경험이 있더라도 지원자가 직접 주도한 역할이 명확히 드러나지 않을 수 있습니다.",
    why: "면접관은 누가 결정했고, 누가 시작했고, 누가 책임졌는지를 봅니다. 참여·지원 중심 표현이 많으면 주도성과 오너십을 다시 확인하려고 합니다.",
    interviewQuestions: [
      "해당 프로젝트에서 본인의 역할은 무엇이었나요?",
      "의사결정에 참여한 경험이 있나요?",
    ],
    actions: [
      "직접 결정하거나 제안한 장면을 명시",
      "책임 범위와 최종 소유 범위를 구분해 작성",
      "시작·발의·조율·리딩 경험을 별도 문장으로 노출",
    ],
  },

  G09: {
    id: "G09",
    name: "이력서 정보 밀도/구체성 리스크",
    title: "이력서 정보 밀도/구체성 리스크",
    headline: "검증 가능한 역할·성과 근거가 부족해 보일 수 있음",
    summary: "이 이력서는 문장 자체는 있지만 면접관이 실제 역량을 판단할 수 있는 구체적 정보가 부족할 수 있습니다.",
    why: "글자 수가 적어서가 아니라, 역할·행동·결과·맥락 중 판단에 필요한 정보가 빠져 있으면 이력서만으로는 지원자를 평가하기 어렵게 됩니다.",
    interviewQuestions: [
      "실제로 어떤 역할을 맡았나요?",
      "결과적으로 어떤 성과가 있었나요?",
    ],
    actions: [
      "역할 / 행동 / 결과 / 수치 중 빠진 요소를 보강",
      "추상 표현 대신 실제 수행 장면으로 치환",
      "한 문장 안에 판단 근거가 남도록 재작성",
    ],
  },

  G10: {
    id: "G10",
    name: "언어 자신감·표현 신호 리스크",
    title: "언어 자신감·표현 신호 리스크",
    headline: "자기 성과에 대한 표현이 지나치게 조심스럽게 보일 수 있음",
    summary: "이 이력서는 성과가 있어도 표현 방식 때문에 자신감이 부족해 보일 수 있습니다.",
    why: "면접관은 표현의 톤에서도 신호를 읽습니다. 완곡한 표현, 다짐형 표현, 수동형 문장이 반복되면 자기 경험에 대한 확신이 약하게 느껴질 수 있습니다.",
    interviewQuestions: [
      "이 경험에서 본인이 가장 자신 있게 말할 수 있는 성과는 무엇인가요?",
      "본인이 주도했다고 볼 수 있는 근거는 무엇인가요?",
    ],
    actions: [
      "완곡 표현을 사실형 문장으로 교체",
      "다짐보다 이미 수행한 행동과 결과 중심으로 서술",
      "자신 있는 성과 문장을 상단에 배치",
    ],
  },

  G11: {
    id: "G11",
    name: "기업·역할 맥락 정합성 리스크",
    title: "기업·역할 맥락 정합성 리스크",
    headline: "지원 회사와 역할에 대한 이해도가 충분히 드러나지 않을 수 있음",
    summary: "이 이력서는 특정 회사나 역할을 겨냥했다기보다 일반적인 이력서처럼 보일 수 있습니다.",
    why: "면접관은 우리 회사 환경, 조직 규모, 역할 특수성에 맞는 경험 구조가 있는지를 봅니다. 회사 맥락과 역할 맥락이 약하면 맞춤 지원이 아닌 것처럼 보일 수 있습니다.",
    interviewQuestions: [
      "우리 회사 환경에서 바로 적용할 수 있는 경험이 있나요?",
      "이 역할의 특수성을 어떻게 이해하고 있나요?",
    ],
    actions: [
      "지원 회사와 닮은 환경 경험을 전면 배치",
      "역할 특수성과 맞닿는 업무를 강조",
      "범용 이력서가 아닌 지원 맞춤형 표현 추가",
    ],
  },
};

// ── 2. 엔진 key → 그룹 id 매핑 ───────────────────────────────────────────────
// append-only: 새 key가 추가되면 아래에만 추가하세요.

export const ENGINE_KEY_TO_GROUP_ID = {
  // G01 — 전형 진입 조건 게이트
  GATE__CRITICAL_EXPERIENCE_GAP:       "G01",
  GATE__DOMAIN_MISMATCH__JOB_FAMILY:   "G01",
  GATE__EDUCATION_GATE_FAIL:           "G01",
  GATE__MUST_HAVE_SKILL:               "G01",

  // G02 — 연령·보상 조건 정합성 게이트
  GATE__AGE:                           "G02",
  AGE_SENIORITY_GAP:                   "G02",
  GATE__SALARY_MISMATCH:               "G02",
  SALARYDOWNSHIFT_RISK:                "G02",

  // G03 — JD 핵심 역량 커버리지 리스크
  ROLE_SKILL__MUST_HAVE_MISSING:       "G03",
  TASK__CORE_COVERAGE_LOW:             "G03",
  MUST__CERT__MISSING:                 "G03",
  TOOL_MISSING:                        "G03",

  // G04 — 직무·도메인 전이 적합도 리스크
  DOMAIN__MISMATCH__JOB_FAMILY:        "G04",
  DOMAIN__WEAK__KEYWORD_SPARSE:        "G04",
  ROLE_SKILL__LOW_SEMANTIC_SIMILARITY: "G04",
  ROLE_SKILL__JD_KEYWORD_ABSENCE:      "G04",

  // G05 — 경력 안정성 리스크
  HIGH_SWITCH_PATTERN:                 "G05",
  EXTREME_JOB_HOPPING_PATTERN:         "G05",
  FREQUENT_INDUSTRY_SWITCH_PATTERN:    "G05",
  TIMELINE_INSTABILITY_RISK:           "G05",
  RISK__TIMELINE_MISMATCH:             "G05",
  RISK__JOB_HOPPING:                   "G05",

  // G06 — 연차·직급 정합성 리스크
  RISK__ROLE_LEVEL_MISMATCH:           "G06",
  TITLE_SENIORITY_MISMATCH:            "G06",
  SENIORITY__UNDER_MIN_YEARS:          "G06",

  // G07 — 성과·임팩트 입증 리스크
  NO_QUANTIFIED_IMPACT:                "G07",
  LOW_IMPACT_VERB_PATTERN:             "G07",
  PROCESS_ONLY_PATTERN:                "G07",
  RISK__EXECUTION_IMPACT_GAP:          "G07",
  EXP__SCOPE__TOO_SHALLOW:             "G07",

  // G08 — 주도성·오너십 입증 리스크
  LOW_OWNERSHIP_VERB_RATIO:            "G08",
  NO_DECISION_AUTHORITY_PATTERN:       "G08",
  NO_PROJECT_INITIATION_PATTERN:       "G08",
  RISK__OWNERSHIP_LEADERSHIP_GAP:      "G08",
  EXP__LEADERSHIP__MISSING:            "G08",
  SOLO_ONLY_PATTERN:                   "G08",

  // G09 — 이력서 정보 밀도/구체성 리스크
  LOW_CONTENT_DENSITY_PATTERN:         "G09",
  HIGH_BUZZWORD_RATIO:                 "G09",
  VAGUE_RESPONSIBILITY_PATTERN:        "G09",
  GENERIC_SELF_DESCRIPTION_PATTERN:    "G09",
  TASK__EVIDENCE_TOO_WEAK:             "G09",
  EVIDENCE_THIN:                       "G09",

  // G10 — 언어 자신감·표현 신호 리스크
  HEDGE_LANGUAGE_DOMINANCE:            "G10",
  LOW_CONFIDENCE_LANGUAGE_PATTERN:     "G10",

  // G11 — 기업·역할 맥락 정합성 리스크
  RISK__COMPANY_SIZE_JUMP:             "G11",
  LOW_COMPANY_SPECIFICITY_PATTERN:     "G11",
  LOW_ROLE_SPECIFICITY_PATTERN:        "G11",
  VENDOR_LOCK_PATTERN:                 "G11",
};

// ── 3. 헬퍼 함수 ─────────────────────────────────────────────────────────────

/**
 * 엔진 key로 그룹 메타(name만)를 반환합니다.
 * 매핑이 없으면 null을 반환합니다.
 *
 * @param {string} engineKey
 * @returns {{ id: string, name: string } | null}
 */
export function getGroupByKey(engineKey) {
  const key = String(engineKey || "").trim();
  const groupId = ENGINE_KEY_TO_GROUP_ID[key];
  if (!groupId) return null;
  return RISK_GROUP_SSOT[groupId] || null;
}

/**
 * 엔진 key로 modal에서 사용할 그룹 상세 데이터를 반환합니다.
 * 매핑이 없으면 null을 반환합니다.
 *
 * 반환 형태는 SimulatorLayout.__detail 필드와 1:1 대응:
 *   title     → __detail.title 오버라이드용
 *   mind      → __detail.mind  ([headline, summary])
 *   reasons   → __detail.reasons ([why])
 *   questions → __detail.questions (interviewQuestions 배열)
 *   fixes     → __detail.fixes (actions 배열)
 *
 * @param {string} engineKey
 * @returns {{ title: string, mind: string[], reasons: string[], questions: string[], fixes: string[] } | null}
 */
export function getGroupDetailByKey(engineKey) {
  const key = String(engineKey || "").trim();
  const groupId = ENGINE_KEY_TO_GROUP_ID[key];
  if (!groupId) return null;
  const g = RISK_GROUP_SSOT[groupId];
  if (!g) return null;

  return {
    title:     g.title     || g.name || "",
    mind:      [g.headline, g.summary].filter(Boolean),
    reasons:   g.why       ? [g.why] : [],
    questions: Array.isArray(g.interviewQuestions) ? g.interviewQuestions : [],
    fixes:     Array.isArray(g.actions)            ? g.actions            : [],
  };
}
