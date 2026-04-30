/**
 * newgrad-core-invariant-cases.js
 *
 * PASSMAP 신입 분석 P0 핵심 invariant 케이스 fixture 후보.
 * 이 파일은 데이터 정의만 한다. runner/assertion 연결은 별도 라운드에서 수행한다.
 *
 * Input shape: buildNewgradTransitionLiteResult(payload) 기준
 *   - targetJobId: string (required)
 *   - targetIndustryId: string (required)
 *   - major: string
 *   - projects: [{ type, role, outcomeLevel, stakeholderType, summary }]
 *   - internships: [{ type, roleFamily, stakeholderType, duration, summary }]
 *   - certifications: [{ category, subcategory, label }]
 *   - strengths: string[]
 *   - workStyleNotes: string
 *   - extracurriculars: string[]
 *   - domainInterestEvidence: string[]
 *
 * Axis key → label mapping:
 *   jobStructure        = Axis1 (전공-직무 연결성)
 *   industryContext     = Axis2 (산업 이해도)
 *   responsibilityScope = Axis3 (경험 연결성)
 *   customerType        = Axis4 (고객 커뮤니케이션)
 *   roleCharacter       = Axis5 (강점과 재능)
 *
 * expected 필드는 숫자 고정 없이 invariant 조건만 기술한다.
 * forbidden 필드는 결과에 있으면 안 되는 표현/판단을 기술한다.
 * uiInsightExpected 필드는 UI-visible explanation 검증 계약을 기술한다.
 *   (UI Path Investigation: docs/PASSMAP_NEWGRAD_UI_INSIGHT_PATH_INVESTIGATION.md)
 *
 *   - targetLayer: "UI_VISIBLE_AXIS_EXPLANATION" — axis explanation 슬롯을 통한 유저 노출 경로
 *   - preferredVisibleSlot: "axisExplanation" — axisPack.axes.{axisKey}.explanation.*
 *   - visibleSurfaces[]: 실제 렌더되는 surfacePath + role + shouldMention + shouldNotMention
 *       role "primaryBody"        → explanation.lead (hasSlots=true 시 항상 노출)
 *       role "secondaryBody"      → explanation.scoreReason (hasSlots=true 시 항상 노출)
 *       role "expandableCriteria" → explanation.criteria ("상세보기" 클릭 필요)
 *       role "expandableLiftOrLimit" → explanation.liftOrLimit ("상세보기" 클릭 필요)
 *   - minimumVisibleSlotRule: hasSlots=true 보장 조건 (lead/criteria/scoreReason/liftOrLimit 중 2개+)
 *   - toneRules: 문체 규칙
 *   - userFriendlySummary: 실제 UI에 가까운 1~3문장 예시
 *
 * DEAD/BLOCKED 필드 (visible target으로 사용 금지):
 *   - vm.whyThisRead: JSX 렌더 없음 (dead field)
 *   - vm.topRepairSignals: shouldRenderNewgradRepairSignalsSection=false 하드코딩으로 차단
 *   - vm.heroSummary / vm.inputEvidenceRead / vm.axisReadSummary: 모두 dead
 *
 * INVENTORY 문서: docs/PASSMAP_NEWGRAD_TEST_INVENTORY.md
 * 상태: FIXTURED (입력 데이터 준비 완료 / UI-visible explanation runner 연결 전)
 */

// ─── Axis key constants ──────────────────────────────────────────────────────

export const AXIS_JOB_STRUCTURE        = "jobStructure";        // Axis1
export const AXIS_INDUSTRY_CONTEXT     = "industryContext";     // Axis2
export const AXIS_RESPONSIBILITY_SCOPE = "responsibilityScope"; // Axis3
export const AXIS_CUSTOMER_TYPE        = "customerType";        // Axis4
export const AXIS_ROLE_CHARACTER       = "roleCharacter";       // Axis5

export const BAND_VERY_LOW  = "very_low";
export const BAND_LOW       = "low";
export const BAND_MEDIUM    = "medium";
export const BAND_HIGH      = "high";
export const BAND_VERY_HIGH = "very_high";

// ─── Fixture cases ────────────────────────────────────────────────────────────

export const NEWGRAD_CORE_INVARIANT_CASES = [

  // ─── NG-INVARIANT-AXIS1-001 ──────────────────────────────────────────────
  // 비전공 + 서비스기획 관련 프로젝트 강함 → Axis1 과상승 방지
  //
  // 검증 목적: 직무 관련 프로젝트 경험이 있어도 전공 연결성이 없으면
  //   jobStructure(Axis1)이 high/very_high로 과상승해서는 안 됨.
  //   경험 기여는 responsibilityScope(Axis3)에서 반영되어야 함.
  {
    caseId: "NG-INVARIANT-AXIS1-001",
    category: "Invariant",
    caseName: "프로젝트 경험 → Axis1 과상승 방지",
    priority: "P0",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "",
      projects: [
        {
          type: "팀프로젝트",
          role: "기획",
          outcomeLevel: "발표",
          stakeholderType: "customer_user",
          summary: "앱 사용자 인터뷰를 기반으로 불편 지점을 정리하고 개선 화면을 설계해 팀 내 발표",
        },
        {
          type: "캡스톤디자인",
          role: "기획",
          outcomeLevel: "시연",
          stakeholderType: "cross_function_partner",
          summary: "서비스 기획 흐름 작성, 화면 흐름도 및 와이어프레임 제작 후 시연",
        },
      ],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      // Axis1(jobStructure)은 전공 없음이므로 high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // Axis3(responsibilityScope)은 프로젝트 경험으로 very_low 이어선 안 됨
      axis3BandForbidden: [BAND_VERY_LOW],
      // 엔진이 정상 동작해야 함 (axisPack 반환 필수)
      axisPackRequired: true,
    },

    forbidden: [
      "전공 적합도가 높다",
      "전공 연결성이 우수하다",
      "전공 기반 역량이 검증됐다",
    ],

    notes: [
      "비전공자의 프로젝트 강함은 Axis3 경험 연결성에서 반영해야 함",
      "Axis1은 전공/학위 근거 없이는 medium 이하를 유지해야 함",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.lead",
          role: "primaryBody",
          // Round C-9B: scoring invariant fixture — keep shouldNotMention as quality gate; no positive UI phrasing is required here.
          shouldMention: [],
          shouldNotMention: [
            "전공 적합도가 높다",
            "전공과 직무가 직접적으로 잘 맞는다",
            "프로젝트 경험만으로 전공 연결성이 충분하다",
          ],
        },
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [],
          shouldNotMention: [
            "전공 적합도가 높다",
            "전공과 직무가 직접적으로 잘 맞는다",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "Axis1 같은 내부 축 이름을 그대로 쓰지 말 것",
        "유저에게 '틀렸다'는 느낌보다 '구분해서 봐야 한다'는 톤으로 설명",
        "단정 대신 보수적 해석 유지",
      ],
      userFriendlySummary: "프로젝트 경험은 분명 도움이 됩니다. 다만 이 경험은 전공 적합도보다는 '직무와 비슷한 일을 해본 경험' 쪽 근거로 보는 게 더 정확합니다.",
    },
  },

  // ─── NG-INVARIANT-AXIS3-001 ──────────────────────────────────────────────
  // 비전공자의 관련 경험 → Axis3에 반영됨
  //
  // 검증 목적: 전공이 없어도 직무 관련 인턴 + 프로젝트 경험이 명확하면
  //   responsibilityScope(Axis3)가 적절히 상승해야 함 (very_low 금지).
  {
    caseId: "NG-INVARIANT-AXIS3-001",
    category: "Invariant",
    caseName: "비전공자 관련 경험 → Axis3 반영",
    priority: "P0",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "",
      projects: [
        {
          type: "팀프로젝트",
          role: "기획",
          outcomeLevel: "발표",
          stakeholderType: "customer_user",
          summary: "사용자 페르소나 작성, 화면 흐름 정의, 요구사항 정리 후 기획서 작성",
        },
      ],
      internships: [
        {
          type: "인턴",
          roleFamily: "기획",
          stakeholderType: "customer_user",
          duration: "3개월",
          summary: "서비스 운영 보조 및 사용자 피드백 정리, 기능 개선 제안서 작성",
        },
      ],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      // Axis3은 경험이 명확하므로 very_low 금지
      axis3BandForbidden: [BAND_VERY_LOW],
      // Axis1은 전공 없으므로 high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      axisPackRequired: true,
    },

    forbidden: [
      "직무 관련 경험이 전혀 없습니다",
      "실무 경험이 확인되지 않습니다",
    ],

    notes: [
      "인턴 + 프로젝트 조합은 Axis3 기여의 주요 근거",
      "전공 불이익이 Axis3까지 전파되어선 안 됨",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.lead",
          role: "primaryBody",
          // Round C-9B: scoring invariant fixture — keep shouldNotMention as quality gate; no positive UI phrasing is required here.
          shouldMention: [],
          shouldNotMention: [
            "전공 리스크가 전부다",
            "경험이 있어도 의미 없다",
            "비전공이므로 적합하지 않다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [],
          shouldNotMention: [
            "비전공이므로 적합하지 않다",
            "경험이 있어도 의미 없다",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "비전공을 낙인처럼 표현하지 말 것",
        "연결 가능한 경험을 구체적으로 살려주는 톤",
        "가능성과 검증된 적합성을 구분",
      ],
      userFriendlySummary: "전공만 보면 직접 연결성은 약할 수 있습니다. 대신 실제로 비슷한 문제를 다뤄본 경험이 있다면, 이 부분은 지원 직무와 연결해서 설명할 수 있습니다.",
    },
  },

  // ─── NG-INVARIANT-CERT-001 ──────────────────────────────────────────────
  // 자격증 단독 → 전체 적합도 과상승 방지
  //
  // 검증 목적: ADsP, SQLD 자격증이 있고 전공/경험이 없을 때
  //   자격증 기여가 Axis2 보조 수준에 머물고 전체 종합 판단이
  //   "충분히 적합" 수준으로 과상승하지 않아야 함.
  {
    caseId: "NG-INVARIANT-CERT-001",
    category: "Invariant",
    caseName: "자격증 단독 → 전체 적합도 과상승 방지",
    priority: "P0",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
      major: "",
      projects: [],
      internships: [],
      certifications: [
        { category: "IT", subcategory: "데이터", label: "ADsP" },
        { category: "IT", subcategory: "데이터베이스", label: "SQLD" },
      ],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      // Axis1(jobStructure)은 전공 없으므로 high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // Axis3(responsibilityScope)은 경험 없으므로 high/very_high 금지
      axis3BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // topRepairSignals에 경험 보강 포인트가 있어야 함 (자격증만으론 부족함 신호)
      topRepairSignalsExpected: true,
      axisPackRequired: true,
      // Round C-1: 자격증만·구현 경험 부재 pattern 발화 계약
      expectedPatternIds: ["CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE"],
    },

    forbidden: [
      "자격증만으로 직무 적합도가 높다",
      "데이터분석 실무 역량이 검증됐다",
      "ADsP, SQLD 보유로 충분히 적합하다",
      "자격증으로 전문성이 입증됐다",
    ],

    notes: [
      "ADsP/SQLD는 데이터 관심/기초 지식을 보여주는 보조 신호",
      "자격증 단독으로 Axis1/Axis3 상승은 설계 위반",
      "topRepairSignals에 실무 경험 부재 보강 포인트가 있어야 정상",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "industryContext",
          surfacePath: "axisPack.axes.industryContext.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "자격증은 보조 근거",
            "실무 경험이나 결과물이 함께 필요",
          ],
          shouldNotMention: [
            "자격증만으로 데이터분석 적합도가 높다",
            "데이터분석 실무 역량이 검증됐다",
            "자격증이 핵심 합격 근거다",
          ],
        },
        {
          axisKey: "industryContext",
          surfacePath: "axisPack.axes.industryContext.explanation.criteria",
          role: "expandableCriteria",
          shouldMention: [
            "ADsP",
            "SQLD",
            "기초 학습 또는 관심 신호",
            "실제 분석 프로젝트",
            "실무 활용 경험 부족",
          ],
          shouldNotMention: [
            "자격증만으로 데이터분석 적합도가 높다",
          ],
        },
        {
          // Round D-1 P3: CERT_ONLY liftOrLimit 중복 제거 후 계약 고정
          axisKey: "industryContext",
          surfacePath: "axisPack.axes.industryContext.explanation.liftOrLimit",
          role: "expandableLiftOrLimit",
          shouldMention: [
            "자격증을 하나 더 추가하는 것보다",
            "배운 내용을 적용한",
            "작은 프로젝트나 실습 결과물",
          ],
          shouldNotMention: [
            "자격증은 보조 근거로서 의미가 있으며, 실무 경험이나 결과물이 함께 필요합니다",
            "자격증만으로 데이터분석 적합도가 높다",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "자격증을 무의미하다고 폄하하지 말 것",
        "보조 근거와 핵심 근거를 구분",
        "다음 보완 행동이 보이게 설명",
      ],
      userFriendlySummary: "자격증은 준비 의지를 보여주는 보조 근거가 될 수 있습니다. 다만 실제 분석 경험이나 결과물이 없다면, 자격증만으로 직무 적합도가 높다고 보기는 어렵습니다.",
    },
  },

  // ─── NG-INVARIANT-SELF-001 ──────────────────────────────────────────────
  // 자기보고만 강할 때 Axis5 외 축 과상승 방지
  //
  // 검증 목적: strengths + workStyleNotes 텍스트만 강하고 전공/경험/자격증이 없을 때
  //   roleCharacter(Axis5)는 기여가 가능하지만 jobStructure(Axis1),
  //   responsibilityScope(Axis3)이 high/very_high로 과상승해서는 안 됨.
  {
    caseId: "NG-INVARIANT-SELF-001",
    category: "Invariant",
    caseName: "자기보고 강함 → Axis5 외 축 과상승 방지",
    priority: "P0",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [
        "문제해결력이 강점입니다",
        "팀 내 커뮤니케이션을 주도합니다",
        "사용자 관점에서 생각하는 것을 좋아합니다",
        "꼼꼼하게 분석하는 편입니다",
      ],
      workStyleNotes: "저는 데이터를 기반으로 판단하고 팀원과 적극적으로 소통하며 문제를 해결합니다. 서비스 기획에서 사용자 경험을 최우선으로 생각합니다.",
    },

    expected: {
      // Axis1/Axis3은 전공/경험 없으므로 high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      axis3BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // Axis5는 자기보고 기여가 가능하므로 very_low이면 이상
      axis5BandForbidden: [],
      axisPackRequired: true,
      // Round C-5B: 자기보고 전용 경험 없음 pattern 발화 계약
      expectedPatternIds: ["SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE"],
    },

    forbidden: [
      "강점 기술을 통해 직무 역량이 충분히 확인됩니다",
      "문제해결력으로 서비스기획 적합도가 높습니다",
      "자기 표현만으로 전공 적합도를 인정합니다",
      "커뮤니케이션 강점으로 실무 경험을 대체합니다",
    ],

    notes: [
      "강점/일하는 방식은 Axis5 기여에 한정되어야 함",
      "자기보고 텍스트가 Axis1(전공)/Axis3(경험)을 대신할 수 없음",
      "topRepairSignals에 전공 또는 경험 보강 포인트가 나와야 정상",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "roleCharacter",
          surfacePath: "axisPack.axes.roleCharacter.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "자기보고 강점은 참고 신호",
            "실제 경험과 결과로 확인되어야 함",
          ],
          shouldNotMention: [
            "강점이 있다고 했으므로 직무 적합도가 높다",
            "자기소개만으로 역량이 검증됐다",
            "경험 근거 없이 높은 적합 판단",
          ],
        },
        {
          axisKey: "roleCharacter",
          surfacePath: "axisPack.axes.roleCharacter.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "문제해결력",
            "커뮤니케이션",
            "자기보고",
            "실제 경험",
            "결과 근거",
          ],
          shouldNotMention: [
            "자기소개만으로 역량이 검증됐다",
          ],
        },
        {
          // Round D-1 P2: SELF_REPORT liftOrLimit actionable guidance 계약 고정
          axisKey: "roleCharacter",
          surfacePath: "axisPack.axes.roleCharacter.explanation.liftOrLimit",
          role: "expandableLiftOrLimit",
          shouldMention: [
            "강점을 더 많이 적는 것이 아니라",
            "프로젝트·활동·결과 사례",
            "1개라도 만드는 것",
          ],
          shouldNotMention: [
            "자격증은 학습 신호로 볼 수 있지만",
            "개발·데이터 직무와 연결할 수 있는 경험 근거",
            "구현·분석 프로젝트는 전공보다 더 직접적인",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "유저의 자기인식을 부정하지 말 것",
        "'좋은 출발점이지만 증거가 필요하다'는 톤",
        "지원서 관점에서 설명",
      ],
      userFriendlySummary: "스스로 강점이라고 느끼는 부분은 방향을 잡는 데 도움이 됩니다. 다만 지원서에서는 그 강점이 실제 경험이나 결과로 드러나야 더 설득력 있게 평가됩니다.",
    },
  },

  // ─── NG-JOB-SERVICE-001 ──────────────────────────────────────────────────
  // 비전공 + 서비스기획 + 프로젝트 강함
  //
  // 검증 목적: 전공 직접 연결성은 약하지만, 사용자 문제 정의/화면 설계/
  //   개선안 작성 등 직무 관련 경험이 명확할 때 Axis3에서 연결 가능해야 함.
  //   전공 불이익이 전체 종합 판단을 "매우 부적합"으로 끌어내리지 않아야 함.
  {
    caseId: "NG-JOB-SERVICE-001",
    category: "Job",
    caseName: "비전공 + 서비스기획 + 프로젝트 강함",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "사회학",
      projects: [
        {
          type: "팀프로젝트",
          role: "기획",
          outcomeLevel: "발표",
          stakeholderType: "customer_user",
          summary: "배달 앱 사용자 페르소나 3개 작성, 핵심 불편 기능 도출, 개선 화면 기획서 작성",
        },
        {
          type: "해커톤",
          role: "기획",
          outcomeLevel: "수상",
          stakeholderType: "cross_function_partner",
          summary: "24시간 해커톤에서 서비스 기획 리드, 사용자 시나리오와 와이어프레임 작성 후 발표",
        },
      ],
      internships: [
        {
          type: "인턴",
          roleFamily: "기획",
          stakeholderType: "customer_user",
          duration: "2개월",
          summary: "앱 서비스 운영 보조, 사용자 피드백 분류 및 기능 개선 의견 정리",
        },
      ],
      certifications: [],
      strengths: ["사용자 관점에서 생각합니다", "기획 산출물 작성을 잘 합니다"],
      workStyleNotes: "서비스의 사용자 경험을 항상 먼저 생각하고, 팀원들과 적극적으로 소통하며 기획합니다.",
    },

    expected: {
      // Axis3(responsibilityScope)은 프로젝트+인턴 경험으로 low 이하 금지
      axis3BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      // Axis1은 사회학 전공으로 직접 연결성 약함 → high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      axisPackRequired: true,
      // Round B: pattern 발화 계약 — axisPack.meta.caseInsightOverlays.firedPatternIds에 포함되어야 함
      expectedPatternIds: ["WEAK_MAJOR_STRONG_RELEVANT_PROJECT"],
    },

    forbidden: [
      "전공 기반 역량이 우수합니다",
      "서비스기획에 충분히 적합합니다",
      "직무 관련 경험이 전혀 없습니다",
    ],

    notes: [
      "사회학 전공은 서비스기획 Axis1에 간접 연결은 가능하나 직접 전공은 아님",
      "프로젝트 2개 + 인턴 1개 조합은 Axis3 medium 이상을 기대할 수 있는 입력",
      "해커톤 수상은 outcomeLevel 기여 가능",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "전공 연결성은 약할 수 있음",
            "서비스기획과 전공 직접 연결성은 제한적",
          ],
          shouldNotMention: [
            "서비스기획에 이미 충분히 적합하다",
            "전공 적합도가 높다",
            "프로젝트가 있으니 리스크가 없다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "프로젝트 경험은 서비스기획 근거로 재구성 가능",
            "사용자 문제정의",
            "화면 설계",
            "기능 개선안",
            "요구사항 정리",
          ],
          shouldNotMention: [
            "직무 관련 경험이 전혀 없습니다",
            "서비스기획에 이미 충분히 적합하다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "사용자 문제정의",
            "화면 설계",
            "기능 개선안",
          ],
          shouldNotMention: [
            "프로젝트가 있으니 리스크가 없다",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "지나치게 부정적으로 몰지 말 것",
        "연결 가능한 경험을 구체적으로 보여줄 것",
        "'충분히 적합' 같은 과잉 확신 금지",
      ],
      userFriendlySummary: "전공만 보면 서비스기획과 직접 연결성이 강하다고 보기는 어렵습니다. 대신 사용자 문제를 찾고, 기능이나 화면을 설계하고, 개선안을 정리한 경험이 있다면 서비스기획 지원 근거로 충분히 재구성할 수 있습니다.",
    },
  },

  // ─── NG-JOB-DATA-001 ─────────────────────────────────────────────────────
  // 비전공 + 데이터분석 + ADsP/SQLD만 있음
  //
  // 검증 목적: 자격증은 보조 근거이며 실제 분석 프로젝트/SQL 활용/
  //   지표 개선 경험이 없으면 강한 적합 판단이 나오지 않아야 함.
  {
    caseId: "NG-JOB-DATA-001",
    category: "Job",
    caseName: "비전공 + 데이터분석 + ADsP/SQLD만 있음",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
      major: "경영학",
      projects: [],
      internships: [],
      certifications: [
        { category: "IT", subcategory: "데이터", label: "ADsP" },
        { category: "IT", subcategory: "데이터베이스", label: "SQLD" },
      ],
      strengths: ["꼼꼼합니다", "분석하는 것을 좋아합니다"],
      workStyleNotes: "데이터를 기반으로 의사결정하는 환경에서 일하고 싶습니다.",
    },

    expected: {
      // Axis1: 경영학이 데이터분석과 연결성 약함 → high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // Axis3: 실무 경험 없음 → high/very_high 금지
      axis3BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // 자격증 기여로 industryContext(Axis2) 또는 보조 기여는 허용
      axisPackRequired: true,
      // 경험 부재 보강 포인트가 topRepairSignals에 있어야 함
      topRepairSignalsExpected: true,
      // Round C-1: 자격증만·구현 경험 부재 pattern 발화 계약
      expectedPatternIds: ["CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE"],
    },

    forbidden: [
      "데이터분석 실무 역량이 검증됐다",
      "ADsP, SQLD 보유로 충분히 적합하다",
      "자격증만으로 데이터 분석 전문성이 입증됐다",
    ],

    notes: [
      "ADsP/SQLD는 데이터 기초 관심의 보조 신호 — 실무 프로젝트 없이 Axis3 high 불가",
      "경영학 전공은 데이터분석 Axis1에 간접 연결은 가능하나 직접 전공 아님",
      "topRepairSignals에 분석 프로젝트 또는 SQL 실습 경험 보강 포인트 필요",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "industryContext",
          surfacePath: "axisPack.axes.industryContext.explanation.lead",
          role: "primaryBody",
          // Round C-8B: Type C alignment — CERT_ONLY generic pattern이 보장하는 문구 기준으로 재정렬
          // 기존: "ADsP/SQLD는 준비 신호", "실제 데이터 활용 경험이 필요" (pattern 범위 초과)
          shouldMention: [
            "보조 근거",
            "기초 학습 신호",
            "실무 경험이나 결과물이 함께 필요",
          ],
          shouldNotMention: [
            "데이터분석 실무 역량이 검증됐다",
            "자격증만으로 데이터 직무 적합도가 높다",
            "비전공 리스크가 완전히 해소됐다",
          ],
        },
        {
          axisKey: "industryContext",
          surfacePath: "axisPack.axes.industryContext.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "ADsP",
            "SQLD",
            "SQL 활용",
            "분석 프로젝트",
            "지표 해석",
            "결과물 부족",
          ],
          shouldNotMention: [
            "자격증만으로 데이터 직무 적합도가 높다",
          ],
        },
        // Round C-8B: responsibilityScope.lead surface 제거 (Option A)
        // CERT_ONLY pattern은 responsibilityScope를 책임지지 않으며,
        // generic engine의 actual text는 DATA 직무 맥락 없는 경험 깊이 평가 텍스트임.
        // industryContext (lead + criteria + scoreReason) 3개 surface로 CERT_ONLY 계약 검증 충분.
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "자격증을 낮춰 말하지 말 것",
        "채용 관점에서 추가 증거가 필요하다고 설명",
        "다음 보완 방향이 보이게 작성",
      ],
      userFriendlySummary: "ADsP나 SQLD는 데이터 직무에 관심을 갖고 준비했다는 신호가 될 수 있습니다. 다만 채용 관점에서는 실제 데이터를 다뤄본 경험, SQL을 활용한 분석 경험, 분석 결과를 해석해본 경험이 함께 있어야 더 강한 근거가 됩니다.",
    },
  },

  // ─── NG-TRANS-CS-SERVICE-001 ─────────────────────────────────────────────
  // CS(고객상담) 경험 → 서비스기획 지원 전환
  //
  // 검증 목적: 고객 이해/VOC/불편사항 파악은 서비스기획 Axis4에 연결 가능하지만,
  //   요구사항 정의/기획 산출물/우선순위 판단 경험은 별도 확인이 필요함.
  //   CS 경험이 Axis3(경험 연결성)을 과도하게 상승시켜선 안 됨.
  {
    caseId: "NG-TRANS-CS-SERVICE-001",
    category: "Transition",
    caseName: "CS 경험 → 서비스기획 전환",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "경영학",
      projects: [],
      internships: [
        {
          type: "인턴",
          roleFamily: "고객상담",
          stakeholderType: "customer_user",
          duration: "6개월",
          summary: "앱 서비스 고객 문의 응대, 불만 케이스 분류 및 VOC 리포트 작성, CS 담당자 업무 보조",
        },
      ],
      certifications: [],
      strengths: ["고객의 불편을 빠르게 파악합니다", "커뮤니케이션이 강합니다"],
      workStyleNotes: "사용자 관점에서 문제를 발견하고 개선하는 서비스기획으로 전환하고 싶습니다.",
    },

    expected: {
      // Axis4(customerType)는 CS 경험으로 기여 가능 → very_low 금지
      axis4BandForbidden: [BAND_VERY_LOW],
      // Axis3(responsibilityScope)은 CS 경험이 기획 직무와 직접 연결이 아님 → high/very_high 금지
      axis3BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // Axis1은 경영학이 서비스기획과 약한 연결 → high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      axisPackRequired: true,
      // Round C-2: CS/운영 → 서비스기획 전환 pattern 발화 계약
      expectedPatternIds: ["CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT"],
    },

    forbidden: [
      "CS 경험으로 서비스기획에 충분히 적합하다",
      "고객상담 경험이 기획 실무 역량을 대체한다",
      "서비스기획 직무에 바로 투입 가능하다",
    ],

    notes: [
      "CS 경험 → VOC 이해 → Axis4 기여는 정당한 연결",
      "하지만 기획 산출물(화면 흐름도, 요구사항 정의서 등)이 없으면 Axis3 high 불가",
      "전환 케이스로서 보강 포인트(기획 프로젝트, 산출물 경험)가 topRepairSignals에 나와야 함",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "customerType",
          surfacePath: "axisPack.axes.customerType.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "CS 경험은 고객 이해 측면에서 연결 가능",
            "고객 불편",
            "VOC",
          ],
          shouldNotMention: [
            "CS 경험만으로 서비스기획 역량이 충분하다",
            "고객 응대 경험이 곧 서비스기획 경험이다",
            "기획 역량이 검증됐다",
          ],
        },
        {
          axisKey: "customerType",
          surfacePath: "axisPack.axes.customerType.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "고객 불편",
            "VOC",
          ],
          shouldNotMention: [
            "기획 역량이 검증됐다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "요구사항 정리",
            "우선순위 판단",
            "개선안",
            "기획 산출물",
          ],
          shouldNotMention: [
            "CS 경험만으로 서비스기획 역량이 충분하다",
            "기획 역량이 검증됐다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "요구사항 정리",
            "우선순위 판단",
            "기획 산출물",
          ],
          shouldNotMention: [
            "고객 응대 경험이 곧 서비스기획 경험이다",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "CS 경험을 낮게 보지 말 것",
        "연결 지점과 부족 지점을 함께 설명",
        "유저가 어떤 경험을 더 강조해야 하는지 보이게 작성",
      ],
      userFriendlySummary: "CS 경험은 고객의 불편을 직접 들었다는 점에서 서비스기획과 연결될 수 있습니다. 다만 서비스기획에서는 그 불편을 요구사항으로 정리하고, 우선순위를 정하고, 실제 개선안이나 기획 산출물로 만든 경험까지 보여주는 것이 중요합니다.",
    },
  },

  // ─── NG-JOB-DEV-002 ──────────────────────────────────────────────────────
  // 비직무 계열 전공 + 데이터분석 + 구현 프로젝트 있음
  //
  // 검증 목적: 전공 연결성이 약해도 SQL/Python/분석 구현 프로젝트가 있으면
  //   NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA 패턴이 발화하여
  //   responsibilityScope에서 프로젝트 경험의 직무 연결 가치를 설명해야 함.
  {
    caseId: "NG-JOB-DEV-002",
    category: "Job",
    caseName: "비전공 + 데이터분석 + 구현 프로젝트 있음",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
      major: "사회학",
      projects: [
        {
          type: "개인프로젝트",
          role: "분석",
          outcomeLevel: "GitHub",
          stakeholderType: "self_growth",
          summary: "공공데이터를 활용해 Python으로 데이터 전처리 후 지역별 분포를 시각화하고 GitHub에 분석 리포트 공개",
        },
        {
          type: "팀프로젝트",
          role: "분석",
          outcomeLevel: "발표",
          stakeholderType: "cross_function_partner",
          summary: "MySQL로 앱 로그 데이터를 집계해 주요 이탈 지점 도출, SQL 쿼리 결과를 팀 내 발표자료로 정리",
        },
      ],
      internships: [],
      certifications: [],
      strengths: ["데이터를 보고 패턴을 찾는 것을 좋아합니다", "꼼꼼하게 기록합니다"],
      workStyleNotes: "사실 기반으로 판단하고, 분석 결과를 팀과 공유하는 것을 중요하게 생각합니다.",
    },

    expected: {
      // Axis1: 사회학이 데이터분석 직접 연결성 약함 → high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // Axis3: 구현 프로젝트 있음 → very_low 금지
      axis3BandForbidden: [BAND_VERY_LOW],
      axisPackRequired: true,
      // Round C-3: 비전공 + 구현 프로젝트 pattern 발화 계약
      expectedPatternIds: ["NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA"],
    },

    forbidden: [
      "전공 기반 데이터 역량이 검증됐다",
      "사회학 전공이 데이터분석과 잘 맞는다",
      "프로젝트 경험만으로 데이터 실무 역량이 충분하다",
    ],

    notes: [
      "사회학 전공은 데이터분석 직접 연결성 약함 — Axis1 high/very_high 금지",
      "Python + SQL 구현 프로젝트는 Axis3 근거로 작동해야 함",
      "NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA 패턴이 responsibilityScope.lead/scoreReason/liftOrLimit를 보충 (D-1 P1에서 lead 추가)",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          // Round D-1 P1b: NON_MAJOR lead 계약 고정
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "구현·분석 프로젝트는 전공보다 더 직접적인 개발·데이터 직무 연결 근거",
          ],
          shouldNotMention: [
            "전공 기반 역량이 검증됐다",
            "프로젝트만으로 데이터 실무 역량이 충분하다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "SQL",
            "Python",
            "프로젝트 경험",
            "전공보다 더 직접적인 근거",
          ],
          shouldNotMention: [
            "전공 기반 역량이 검증됐다",
            "프로젝트만으로 데이터 실무 역량이 충분하다",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.liftOrLimit",
          role: "expandableLiftOrLimit",
          shouldMention: [
            "프로젝트 경험을 전공보다 앞에",
            "SQL 활용",
            "분석 판단 과정",
          ],
          shouldNotMention: [
            "전공을 강조하세요",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "프로젝트 경험의 가치를 명확히 드러낼 것",
        "전공 약점을 낮추지 말고, 경험 근거로 대체 가능함을 보여줄 것",
        "'충분하다'는 과잉 확신 금지",
      ],
      userFriendlySummary: "사회학 전공이 데이터분석과 직접 연결되지 않을 수 있지만, SQL 집계와 Python 시각화 프로젝트는 데이터 직무에서 전공보다 더 직접적인 근거가 됩니다. 이 경험을 앞세워 분석 판단 과정이 드러나도록 정리하는 것이 더 설득력이 있습니다.",
    },
  },

  // ─── NG-BOUNDARY-MAJOR-001 ──────────────────────────────────────────────
  // 경영학 전공 + 서비스기획 + 관련 프로젝트 있음 → WEAK_MAJOR 오발화 방지
  //
  // 검증 목적: 경영학은 서비스기획 직무에서 major prior가 "direct"(score=3)로
  //   분류되므로, WEAK_MAJOR_STRONG_RELEVANT_PROJECT 패턴이 발화하지 않아야 함.
  //   "전공 연결성 제한적" 계열 문구가 경영학 유저에게 노출되지 않음을 계약으로 고정.
  //   Round E-0 조사에서 확인: resolveNewgradAxis1MajorPrior("경영학", JOB_BUSINESS_SERVICE_PLANNING)
  //   → base=3(BUSINESS_ADMIN→BUSINESS:3), boost=0, final=3, label="direct"
  //   → appliesTo 조건(_jobFitMajorPrior.label==="weak"||"mismatch") 불충족 → 미발화 확정.
  {
    caseId: "NG-BOUNDARY-MAJOR-001",
    category: "Invariant",
    caseName: "경영학 전공 + 서비스기획 → WEAK_MAJOR 오발화 방지",
    priority: "P0",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "경영학",
      projects: [
        {
          type: "팀프로젝트",
          role: "기획",
          outcomeLevel: "발표",
          stakeholderType: "customer_user",
          summary: "서비스 기획 프로세스 실습, 사용자 요구사항 정리 및 화면 흐름 설계 후 팀 내 발표",
        },
        {
          type: "해커톤",
          role: "기획",
          outcomeLevel: "참여",
          stakeholderType: "cross_function_partner",
          summary: "앱 서비스 개선 아이디어 기획, 사용자 시나리오 작성 후 발표",
        },
      ],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      // 경영학 major prior = direct → Axis1 very_low 금지
      axis1BandForbidden: [BAND_VERY_LOW],
      // 프로젝트 2개 → Axis3 very_low 금지
      axis3BandForbidden: [BAND_VERY_LOW],
      axisPackRequired: true,
      // 이 케이스는 특정 pattern 발화 요구가 아닌 오발화 방지 boundary fixture.
      // WEAK_MAJOR_STRONG_RELEVANT_PROJECT는 major prior=weak/mismatch 시에만 발화.
      // 경영학은 direct(3)이므로 발화 조건 불충족 → expectedPatternIds 생략.
    },

    forbidden: [
      "서비스기획과 전공 직접 연결성은 제한적",
      "전공 연결성은 약할 수 있으나",
      "전공 연결성이 충분하지 않습니다",
    ],

    notes: [
      "경영학 major prior for BUSINESS category = direct(3) — WEAK_MAJOR 발화 조건 불충족",
      "이 fixture는 pattern 발화 요구가 아닌 오발화 방지 boundary 고정 목적",
      "shouldNotMention으로 WEAK_MAJOR 문구 오노출을 간접 검증",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.lead",
          role: "primaryBody",
          shouldMention: [],
          shouldNotMention: [
            "서비스기획과 전공 직접 연결성은 제한적",
            "전공 연결성은 약할 수 있으나",
            "전공 연결성이 충분하지 않습니다",
            "전공 연결성 제한적",
          ],
        },
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [],
          shouldNotMention: [
            "서비스기획과 전공 직접 연결성은 제한적",
            "전공 연결성은 약할 수 있으나",
            "전공 연결성 제한적",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "경영학 + 서비스기획 조합에 전공 연결성 제한 표현 금지",
        "경영학은 서비스기획과 직접 연결 가능한 전공 배경으로 취급",
      ],
      userFriendlySummary: "경영학 전공은 서비스기획과 직접 연결 가능한 배경이므로, 전공 연결성이 약하다는 메시지가 노출되어서는 안 됩니다.",
    },
  },

  // ─── NG-BOUNDARY-MAJOR-003 ──────────────────────────────────────────────
  // 경제학 전공 + 서비스기획 + 관련 프로젝트 있음 → WEAK_MAJOR 오발화 방지
  //
  // 검증 목적: 경제학은 서비스기획 직무에서 major prior가 "adjacent"(score=2)로
  //   분류되므로, WEAK_MAJOR_STRONG_RELEVANT_PROJECT 패턴이 발화하지 않아야 함.
  //   WEAK_MAJOR는 label==="weak" || label==="mismatch"일 때만 발화한다.
  //   경제학 → BUSINESS: base=2, exceptionAdjustment=0 → final=2, label="adjacent".
  //   "전공 연결성 제한적" 계열 문구가 경제학 유저에게 노출되지 않음을 계약으로 고정.
  //   Round E-2 조사에서 확인: resolveNewgradAxis1MajorPrior("경제학", JOB_BUSINESS_SERVICE_PLANNING)
  //     → ECONOMICS BUSINESS base=2, SALES exceptionAdjustment=0 for BUSINESS → final=2, label="adjacent"
  {
    caseId: "NG-BOUNDARY-MAJOR-003",
    category: "Invariant",
    caseName: "경제학 전공 + 서비스기획 → WEAK_MAJOR 오발화 방지",
    priority: "P0",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "경제학",
      projects: [
        {
          type: "팀프로젝트",
          role: "기획",
          outcomeLevel: "발표",
          stakeholderType: "customer_user",
          summary: "시장 분석 기반 서비스 개선 아이디어 정리, 경쟁 서비스 비교 분석 후 기능 개선 방향 도출",
        },
        {
          type: "해커톤",
          role: "기획",
          outcomeLevel: "참여",
          stakeholderType: "cross_function_partner",
          summary: "앱 서비스 경쟁사 분석 및 기능 개선안 작성, 사용자 시나리오 기반 발표 진행",
        },
      ],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      // 경제학 major prior = adjacent(2) → Axis1 very_low 금지
      axis1BandForbidden: [BAND_VERY_LOW],
      axis3BandForbidden: [BAND_VERY_LOW],
      // WEAK_MAJOR_STRONG_RELEVANT_PROJECT는 major prior=weak/mismatch 시에만 발화.
      // 경제학은 adjacent(2)이므로 발화 조건 불충족 → expectedPatternIds 생략.
    },

    forbidden: [
      "서비스기획과 전공 직접 연결성은 제한적",
      "전공 연결성은 약할 수 있으나",
      "전공 연결성이 충분하지 않습니다",
      "전공 연결성 제한적",
    ],

    notes: [
      "경제학 major prior for BUSINESS category = adjacent(2) — WEAK_MAJOR 발화 조건 불충족",
      "이 fixture는 pattern 발화 요구가 아닌 오발화 방지 boundary 고정 목적",
      "shouldNotMention으로 WEAK_MAJOR 문구 오노출을 간접 검증",
      "E-1(경영학 direct)과 대칭: adjacent boundary도 WEAK_MAJOR 발화 조건 아님을 계약으로 고정",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.lead",
          role: "primaryBody",
          shouldMention: [],
          shouldNotMention: [
            "서비스기획과 전공 직접 연결성은 제한적",
            "전공 연결성은 약할 수 있으나",
            "전공 연결성이 충분하지 않습니다",
            "전공 연결성 제한적",
          ],
        },
        {
          axisKey: "jobStructure",
          surfacePath: "axisPack.axes.jobStructure.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [],
          shouldNotMention: [
            "서비스기획과 전공 직접 연결성은 제한적",
            "전공 연결성은 약할 수 있으나",
            "전공 연결성 제한적",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "경제학 + 서비스기획 조합에 전공 연결성 제한 표현 금지",
        "경제학은 서비스기획과 인접 연결 가능한 전공 배경으로 취급",
      ],
      userFriendlySummary: "경제학 전공은 서비스기획과 인접 연결 가능한 배경이므로, 전공 연결성이 약하다는 WEAK_MAJOR 계열 메시지가 노출되어서는 안 됩니다.",
    },
  },

  // ─── NG-COVERAGE-DEV-001 ─────────────────────────────────────────────────
  // 사회학 전공 + 데이터분석 + 프로젝트/실무/자격증 전무 → NO_EVIDENCE 발화
  //
  // 검증 목적: 개발/데이터 직무 희망 + 비전공(weak prior) + 아무 경험도 없을 때
  //   NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA가 responsibilityScope에 발화하여
  //   "직무와 연결되는 결과물을 먼저 만들어야 한다"는 guidance가 UI에 도달하는지 검증.
  //   Round E-3 coverage gap 조사에서 확인: 이 케이스는 기존 5개 pattern 모두 미발화.
  //   기존 NG-JOB-DATA-001(certs 있음), NG-JOB-DEV-002(projects 있음)와 비중복.
  {
    caseId: "NG-COVERAGE-DEV-001",
    category: "Coverage",
    caseName: "비전공 + 데이터분석 + 프로젝트/실무/자격증 전무",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
      major: "사회학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      // 사회학 IT_DATA_DIGITAL prior = weak(1) → Axis1 high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // 경험 전무 → Axis3 very_high/high 금지
      axis3BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA 발화 계약
      expectedPatternIds: ["NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA"],
    },

    forbidden: [
      "자격증은 학습 신호로 볼 수 있지만",
      "구현 프로젝트는 전공보다 더 직접적인 근거",
      "서비스기획과 전공 직접 연결성은 제한적",
    ],

    notes: [
      "사회학 IT_DATA_DIGITAL prior = weak(1) — NON_MAJOR 미발화(projects=0), CERT_ONLY 미발화(certs=0)",
      "strengths/workStyleNotes 없음 → SELF_REPORT도 미발화",
      "NO_EVIDENCE 패턴이 responsibilityScope.lead+scoreReason+criteria+liftOrLimit(4슬롯) 제공",
      "이 fixture는 완전 무경험 비전공 데이터직무 희망자의 coverage gap을 고정하는 목적",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "개발·데이터 직무와 연결할 수 있는 경험 근거",
          ],
          shouldNotMention: [
            "자격증은 학습 신호로 볼 수 있지만",
            "구현 프로젝트는 전공보다 더 직접적인 근거",
            "서비스기획과 전공 직접 연결성은 제한적",
          ],
        },
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.scoreReason",
          role: "secondaryBody",
          shouldMention: [
            "프로젝트, 분석 산출물, 실습 결과",
            "직무 연결성을 설명할 수 있습니다",
          ],
          shouldNotMention: [
            "자격증은 학습 신호로 볼 수 있지만",
            "구현 프로젝트는 전공보다 더 직접적인 근거",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "비전공/약한 전공 연결의 개발·데이터 희망자에게 완전 무경험 상태의 보완 우선순위를 안내",
        "전공 약함을 반복하기보다 프로젝트/분석 산출물/실습 결과물의 필요성을 설명",
        "자격증 보유자나 프로젝트 보유자용 문구가 섞이면 안 됨",
      ],
      userFriendlySummary: "개발·데이터 직무를 희망하지만 전공 연결성과 경험 근거가 모두 약한 사용자는, 먼저 확인 가능한 프로젝트나 분석 산출물을 만들어야 한다는 안내를 받아야 합니다.",
    },
  },

  // ─── NG-COVERAGE-DEV-002 ─────────────────────────────────────────────────
  // 사회학 전공 + 데이터분석 + 프로젝트/실무/자격증 없음 + 자기보고 강점 있음
  // → NO_EVIDENCE + SELF_REPORT co-fire 검증
  //
  // 검증 목적: NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA(responsibilityScope)와
  //   SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE(roleCharacter)가 동시에 발화할 때
  //   서로 다른 axis에 안전하게 도달하고 slot conflict가 없음을 계약으로 고정.
  //   NG-COVERAGE-DEV-001과의 차이: strengths가 있어 SELF_REPORT도 함께 발화.
  {
    caseId: "NG-COVERAGE-DEV-002",
    category: "Coverage",
    caseName: "비전공 + 데이터분석 + 무경험 + 자기보고 강점 → co-fire",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
      major: "사회학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: ["꼼꼼합니다", "분석적으로 생각하는 편입니다", "문제 해결에 흥미가 있습니다"],
      workStyleNotes: "자료를 구조화해서 문제를 파악하는 편입니다.",
    },

    expected: {
      axisPackRequired: true,
      // 사회학 IT_DATA_DIGITAL prior = weak(1) → Axis1 high/very_high 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // 경험 전무 → Axis3 high/very_high 금지
      axis3BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      // NO_EVIDENCE(responsibilityScope) + SELF_REPORT(roleCharacter) co-fire 계약
      expectedPatternIds: [
        "NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA",
        "SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE",
      ],
    },

    forbidden: [
      "자격증은 학습 신호로 볼 수 있지만",
      "구현 프로젝트는 전공보다 더 직접적인 근거",
      "서비스기획과 전공 직접 연결성은 제한적",
    ],

    notes: [
      "사회학 IT_DATA_DIGITAL prior = weak(1) — NO_EVIDENCE 발화 조건 충족",
      "strengths 3개 + workStyleNotes → SELF_REPORT 발화 조건 충족",
      "NO_EVIDENCE → responsibilityScope 축, SELF_REPORT → roleCharacter 축 → slot conflict 없음",
      "NG-COVERAGE-DEV-001(strengths 없음, NO_EVIDENCE만 발화)과 대칭 케이스",
    ],

    uiInsightExpected: {
      targetLayer: "UI_VISIBLE_AXIS_EXPLANATION",
      preferredVisibleSlot: "axisExplanation",
      visibleSurfaces: [
        {
          axisKey: "responsibilityScope",
          surfacePath: "axisPack.axes.responsibilityScope.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "개발·데이터 직무와 연결할 수 있는 경험 근거",
          ],
          shouldNotMention: [
            "자격증은 학습 신호로 볼 수 있지만",
            "구현 프로젝트는 전공보다 더 직접적인 근거",
            "서비스기획과 전공 직접 연결성은 제한적",
          ],
        },
        {
          axisKey: "roleCharacter",
          surfacePath: "axisPack.axes.roleCharacter.explanation.lead",
          role: "primaryBody",
          shouldMention: [
            "자기보고 강점은 참고 신호",
            "채용 근거로 작동하려면",
          ],
          shouldNotMention: [
            "자격증은 학습 신호로 볼 수 있지만",
            "구현 프로젝트는 전공보다 더 직접적인 근거",
          ],
        },
      ],
      minimumVisibleSlotRule: {
        requiredFilledCount: 2,
        candidateFields: ["lead", "criteria", "scoreReason", "liftOrLimit"],
        reason: "TransitionLiteResult requires at least two explanation slots for hasSlots=true",
      },
      toneRules: [
        "개발·데이터 무경험 사용자에게 responsibilityScope에서는 결과물 필요성을 안내",
        "자기보고 강점이 있어도 roleCharacter에서는 실제 경험 근거 필요성을 안내",
        "자격증 보유자나 프로젝트 보유자용 문구가 섞이면 안 됨",
        "두 pattern은 서로 다른 axis에 발화해야 하며 같은 slot을 덮어쓰면 안 됨",
      ],
      userFriendlySummary: "개발·데이터 직무를 희망하지만 경험 근거가 없는 사용자가 강점만 입력한 경우, 강점 자체는 참고하되 직무 연결을 위해 확인 가능한 프로젝트나 분석 산출물이 필요하다는 안내가 함께 보여야 합니다.",
    },
  },

  // ─── NG-MAJOR-MATH-001 ────────────────────────────────────────────────────
  // 수학/통계 전공 + 데이터분석 직무 → IT_DATA_DIGITAL base=3 (direct)
  // 검증 목적: MATH_STATISTICS 전공이 데이터분석 직무에 대해 unknown_major_fallback보다
  //   명확히 높은 axis1 점수를 내야 하며, 전공 연결성이 "direct"로 판정되어야 함.
  {
    caseId: "NG-MAJOR-MATH-001",
    category: "MajorCoverage",
    caseName: "수학/통계 전공 + 데이터분석 → Axis1 상승 검증",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_AI_DATA_CLOUD",
      major: "수학 / 통계",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      // MATH_STATISTICS IT_DATA_DIGITAL base=3 → direct → axis1 high 이상
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      // major prior label이 direct여야 함
      majorPriorLabelExpected: "direct",
      // unknown_major_fallback(base=1) 대비 axis1 상승 필수
      axis1BandForbiddenVsUnknown: true,
    },

    notes: [
      "MATH_STATISTICS IT_DATA_DIGITAL prior = direct(3) — base만으로 axis1 high 이상",
      "unknown_major_fallback(base=1) 대비 2단계 이상 상승 기대",
      "경험 없음 → Axis3 기여 없음, axis1 단독으로 검증",
    ],
  },

  // ─── NG-MAJOR-MATH-002 ────────────────────────────────────────────────────
  // 수학/통계 전공 + 재무분석(FP&A) 직무 → FINANCE_ACCOUNTING base=2 + override FP_AND_A=1 → final=3
  // 검증 목적: override 경로가 작동하여 adjacent(2)→direct(3)로 보정되어야 함.
  {
    caseId: "NG-MAJOR-MATH-002",
    category: "MajorCoverage",
    caseName: "수학/통계 전공 + FP&A 직무 → override 경로 검증",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_FINANCE_ACCOUNTING_FP_AND_A",
      targetIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
      major: "수학 / 통계",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      // base=2 + override FP_AND_A=1 → final=3 → direct → axis1 high 이상 허용
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      // axis1이 5점 고정되어서는 안 됨 (경험 없음 → dependency 보정 제한)
      axis1BandForbidden5Only: false,
    },

    notes: [
      "MATH_STATISTICS FINANCE_ACCOUNTING base=2, override FP_AND_A=1 → final=3(direct)",
      "경험 근거 없음 → axis1이 very_high 고정될 이유 없음, high 또는 very_high 허용",
      "axis1 band very_low/low는 override 경로 미작동 신호 — 버그로 판정",
    ],
  },

  // ─── NG-MAJOR-MATH-003 ────────────────────────────────────────────────────
  // 수학/통계 전공 + 영업(B2B) 직무 → SALES base=0 (mismatch) → axis1 과상승 금지
  // 검증 목적: MATH_STATISTICS가 모든 직무에 direct로 과잉 반응하지 않아야 함.
  {
    caseId: "NG-MAJOR-MATH-003",
    category: "MajorCoverage",
    caseName: "수학/통계 전공 + 영업직무 → Axis1 과상승 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_SALES_B2B_SALES",
      targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR",
      major: "수학 / 통계",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      // MATH_STATISTICS SALES base=0 → mismatch → axis1 과상승 금지
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
    },

    notes: [
      "MATH_STATISTICS SALES prior = mismatch(0) — axis1 high/very_high 발화는 버그",
      "전공 추가 후 기존 체계와 정합성 유지 확인용 케이스",
      "경험 없음 → axis1이 낮게 나와야 정상",
    ],
  },

  // ─── NG-MAJOR-LAW-001 ────────────────────────────────────────────────────
  // 법학 전공 + 법무 직무 → RESEARCH_PROFESSIONAL base=3, override LEGAL=1 → final=3(direct)
  // 검증 목적: LAW 전공이 법무 직무에 대해 very_low/low 금지, direct 판정
  {
    caseId: "NG-MAJOR-LAW-001",
    category: "MajorCoverage",
    caseName: "법학 전공 + 법무 직무 → Axis1 상승 검증",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_LEGAL",
      targetIndustryId: "IND_FINANCE_INSURANCE_FINTECH_BANKING_LENDING",
      major: "법학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "LAW RESEARCH_PROFESSIONAL base=3, override LEGAL=1 → final=3(direct)",
      "법무는 법학 전공의 가장 직접적인 직무 — axis1 very_low/low는 버그",
      "경험 없음 → axis3 기여 없음, axis1 단독 검증",
    ],
  },

  // ─── NG-MAJOR-LAW-002 ────────────────────────────────────────────────────
  // 법학 전공 + 특허/지식재산 직무 → RESEARCH_PROFESSIONAL base=3, override PATENT_IP=1 → final=3
  // 검증 목적: 법학 전공이 특허 직무에 대해 very_low/low 금지
  {
    caseId: "NG-MAJOR-LAW-002",
    category: "MajorCoverage",
    caseName: "법학 전공 + 특허/지식재산 직무 → Axis1 과소평가 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_PATENT_INTELLECTUAL_PROPERTY",
      targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR",
      major: "법학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "LAW RESEARCH_PROFESSIONAL base=3, override PATENT_INTELLECTUAL_PROPERTY=1 → final=3(direct)",
      "법학 전공은 특허법·IP 분야와 직접 연결 — axis1 과소평가는 버그",
      "기술 전공 필요성이 완전히 사라지는 문구는 지양 — IP는 이공계와 공유 직무",
    ],
  },

  // ─── NG-MAJOR-LAW-003 ────────────────────────────────────────────────────
  // 법학 전공 + 백엔드개발 직무 → IT_DATA_DIGITAL base=0 → axis1 과상승 금지
  // 검증 목적: LAW 전공이 무관 IT 직무에 direct/very_high로 과잉 반응하지 않아야 함
  {
    caseId: "NG-MAJOR-LAW-003",
    category: "MajorCoverage",
    caseName: "법학 전공 + 백엔드개발 직무 → Axis1 과상승 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
      major: "법학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
    },

    notes: [
      "LAW IT_DATA_DIGITAL base=0 → axis1 high/very_high 발화는 버그",
      "법학 전공이 개발 직무에 과잉 반응하지 않아야 함 — 전공 추가 후 체계 정합성 확인",
      "경험 없음 → axis1이 낮게 나와야 정상",
    ],
  },

  // ─── NG-MAJOR-BIO-001 ────────────────────────────────────────────────────
  // 생명과학/바이오 전공 + 기술연구 직무 → RESEARCH_PROFESSIONAL base=3, override=1 → direct
  // 검증 목적: BIO 전공이 기술연구 직무에 대해 very_low/low 금지, direct 판정
  {
    caseId: "NG-MAJOR-BIO-001",
    category: "MajorCoverage",
    caseName: "생명과학/바이오 전공 + 기술연구 직무 → Axis1 최소 medium 이상, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH",
      targetIndustryId: "IND_MANUFACTURING_BIOMEDICAL_PHARMACEUTICAL",
      major: "생명과학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "BIO_LIFE_SCIENCE RESEARCH_PROFESSIONAL base=3, override TECHNICAL_RESEARCH=1 → final=3(direct)",
      "기술연구는 생명과학 전공의 핵심 직무 — very_low/low 금지, direct 판정",
    ],
  },

  // ─── NG-MAJOR-BIO-002 ────────────────────────────────────────────────────
  // 생명과학/바이오 전공 + 규제대응/RA 직무 → RESEARCH_PROFESSIONAL base=3, override=1
  // 검증 목적: BIO는 RA에 연결되지만 PHARMACY 대비 보조/인접 성격 유지
  {
    caseId: "NG-MAJOR-BIO-002",
    category: "MajorCoverage",
    caseName: "생명과학/바이오 전공 + 규제대응/RA 직무 → Axis1 very_low/low 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
      targetIndustryId: "IND_MANUFACTURING_BIOMEDICAL_PHARMACEUTICAL",
      major: "바이오공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "BIO_LIFE_SCIENCE RESEARCH_PROFESSIONAL base=3, override REGULATORY_AFFAIRS=1 → final=3",
      "BIO는 RA에 연결 가능하지만 PHARMACY 추가 후 상대 비교로 보조 성격 확인 필요",
      "이번 라운드는 BIO 단독 기준 — very_low/low 금지만 검증",
    ],
  },

  // ─── NG-MAJOR-BIO-003 ────────────────────────────────────────────────────
  // 생명과학/바이오 전공 + B2B영업 직무 → SALES base=0 → axis1 과상승 금지
  // 검증 목적: BIO 전공이 무관 직무에 direct/very_high로 과잉 반응하지 않아야 함
  {
    caseId: "NG-MAJOR-BIO-003",
    category: "MajorCoverage",
    caseName: "생명과학/바이오 전공 + B2B영업 직무 → Axis1 과상승 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_SALES_B2B_SALES",
      targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
      major: "생명공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
    },

    notes: [
      "BIO_LIFE_SCIENCE SALES base=0 → axis1 high/very_high 발화는 버그",
      "생명과학 전공이 B2B영업 직무에 과잉 반응하지 않아야 함 — 전공 추가 후 체계 정합성 확인",
      "경험 없음 → axis1이 낮게 나와야 정상",
    ],
  },

  // ─── NG-MAJOR-BIO-004 ────────────────────────────────────────────────────
  // 생명과학/바이오 전공 + 법무 직무 → RESEARCH_PROFESSIONAL base=2, override 없음 → direct 금지
  // 검증 목적: BIO가 법무 직무에 강한 전공 연결로 오인되지 않아야 함
  {
    caseId: "NG-MAJOR-BIO-004",
    category: "MajorCoverage",
    caseName: "생명과학/바이오 전공 + 법무 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_LEGAL",
      targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_LEGAL_ACCOUNTING_TAX",
      major: "생명과학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "BIO_LIFE_SCIENCE RESEARCH_PROFESSIONAL base=2, LEGAL override 없음 → final=2(adjacent)",
      "법무는 법학 전공(LAW)의 핵심 직무 — BIO가 direct로 오인되면 안 됨",
      "base 3→2 hardening + LEGAL override 미등록으로 adjacent 수준 유지",
    ],
  },

  // ─── NG-MAJOR-BIO-005 ────────────────────────────────────────────────────
  // 생명과학/바이오 전공 + 정책연구 직무 → RESEARCH_PROFESSIONAL base=2, override 없음 → direct 금지
  // 검증 목적: BIO가 연구·전문직 전체에 과대 연결되지 않아야 함
  {
    caseId: "NG-MAJOR-BIO-005",
    category: "MajorCoverage",
    caseName: "생명과학/바이오 전공 + 정책연구 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_POLICY_RESEARCH",
      targetIndustryId: "IND_PUBLIC_ADMINISTRATION_CENTRAL_GOVERNMENT",
      major: "바이오",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "BIO_LIFE_SCIENCE RESEARCH_PROFESSIONAL base=2, POLICY_RESEARCH override 없음 → final=2(adjacent)",
      "정책연구는 행정/정책 전공(PUBLIC_POLICY)과 연결 — BIO가 과대 direct로 오인되면 안 됨",
      "RESEARCH_PROFESSIONAL base 2 hardening으로 법무/정책연구/컨설팅 과대 연결 방지",
    ],
  },

  // ─── NG-MAJOR-PHARMACY-001 ───────────────────────────────────────────────
  // 약학 전공 + 규제대응/RA 직무 → RESEARCH_PROFESSIONAL base=2, override REGULATORY_AFFAIRS=1 → direct
  // 검증 목적: PHARMACY→RA는 BIO→RA(adjacent)보다 강해야 함 — direct 판정
  {
    caseId: "NG-MAJOR-PHARMACY-001",
    category: "MajorCoverage",
    caseName: "약학 전공 + 규제대응/RA 직무 → Axis1 최소 medium 이상, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
      targetIndustryId: "IND_MANUFACTURING_BIOMEDICAL_PHARMACEUTICAL",
      major: "약학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "PHARMACY RESEARCH_PROFESSIONAL base=2, override REGULATORY_AFFAIRS=1 → final=3(direct)",
      "BIO→RA는 override 없어 final=2(adjacent) — PHARMACY가 RA에 더 직접적임을 검증",
      "인허가·규제대응은 약학 전공의 핵심 직무 연결",
    ],
  },

  // ─── NG-MAJOR-PHARMACY-002 ────────────────────────────────────��──────────
  // 임상약학 전공 + QA 직무 → MANUFACTURING base=2, override QUALITY_ASSURANCE_QA=1 → direct
  {
    caseId: "NG-MAJOR-PHARMACY-002",
    category: "MajorCoverage",
    caseName: "임상약학 전공 + 품질보증(QA) 직무 → Axis1 very_low/low 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA",
      targetIndustryId: "IND_MANUFACTURING_BIOMEDICAL_PHARMACEUTICAL",
      major: "임상약학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "PHARMACY MANUFACTURING_QUALITY_PRODUCTION base=2, override QUALITY_ASSURANCE_QA=1 → final=3(direct)",
      "제약 QA는 약학 전공의 핵심 직무 — very_low/low 금지",
    ],
  },

  // ─── NG-MAJOR-PHARMACY-003 ───────────────────────────��───────────────────
  // 약학 전공 + 전문심사/평가 직무 → RESEARCH_PROFESSIONAL base=2, override EXPERT_REVIEW_EVALUATION=1 → direct
  {
    caseId: "NG-MAJOR-PHARMACY-003",
    category: "MajorCoverage",
    caseName: "약학 전공 + 전문심사/평가 직무 → Axis1 very_low/low 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_EXPERT_REVIEW_EVALUATION",
      targetIndustryId: "IND_PUBLIC_ADMINISTRATION_CENTRAL_GOVERNMENT",
      major: "약학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "PHARMACY RESEARCH_PROFESSIONAL base=2, override EXPERT_REVIEW_EVALUATION=1 → final=3(direct)",
      "전문심사/평가는 약학 전공이 강하게 연결되는 세부 직무",
    ],
  },

  // ─── NG-MAJOR-PHARMACY-004 ──────────────────────────────────��────────────
  // 약학 전공 + 법무 직무 → RESEARCH_PROFESSIONAL base=2, override 없음 → direct 금지
  // 검증 목적: PHARMACY가 연구·전문직 전체에 과대 연결되지 않아야 함
  {
    caseId: "NG-MAJOR-PHARMACY-004",
    category: "MajorCoverage",
    caseName: "약학 전공 + 법무 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_LEGAL",
      targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_LEGAL_ACCOUNTING_TAX",
      major: "약학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "PHARMACY RESEARCH_PROFESSIONAL base=2, LEGAL override 없음 → final=2(adjacent)",
      "법무는 법학 전공(LAW)의 핵심 직무 — 약학 전공이 direct로 오인되면 안 됨",
      "RESEARCH_PROFESSIONAL base=2 설계로 법무/정책연구/컨설팅 과대 연결 방지",
    ],
  },

  // ─── NG-MAJOR-CHEM-001 ───────────────────────────────────────────────────
  // 화학공학 전공 + 공정기술 직무 → MANUFACTURING base=2, override PROCESS_ENGINEERING=1 → direct
  {
    caseId: "NG-MAJOR-CHEM-001",
    category: "MajorCoverage",
    caseName: "화학공학 전공 + 공정기술 직무 → Axis1 very_low/low 금지, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "화학공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "CHEMISTRY MANUFACTURING_QUALITY_PRODUCTION base=2, override PROCESS_ENGINEERING=1 → final=3(direct)",
      "공정기술은 화학공학 전공의 핵심 직무 — very_low/low 금지, direct 판정",
    ],
  },

  // ─── NG-MAJOR-CHEM-002 ───────────────────────────────────────────────────
  // 화학 전공 + 품질관리(QC) 직무 → MANUFACTURING base=2, override QUALITY_CONTROL=1 → direct
  {
    caseId: "NG-MAJOR-CHEM-002",
    category: "MajorCoverage",
    caseName: "화학 전공 + 품질관리(QC) 직무 → Axis1 very_low/low 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "응용화학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "CHEMISTRY MANUFACTURING_QUALITY_PRODUCTION base=2, override QUALITY_CONTROL=1 → final=3(direct)",
      "품질관리는 화학/화공 전공의 핵심 연결 직무 — very_low/low 금지",
    ],
  },

  // ─── NG-MAJOR-CHEM-003 ───────────────────────────────────────────────────
  // 화학공학 전공 + 연구개발(R&D) 직무 → ENGINEERING_DEVELOPMENT base=2, override R&D=1 → direct
  {
    caseId: "NG-MAJOR-CHEM-003",
    category: "MajorCoverage",
    caseName: "화학공학 전공 + 연구개발(R&D) 직무 → Axis1 very_low/low 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "화학공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "CHEMISTRY ENGINEERING_DEVELOPMENT base=2, override RESEARCH_AND_DEVELOPMENT=1 → final=3(direct)",
      "연구개발은 화학공학 전공의 핵심 직무 연결 — very_low/low 금지",
    ],
  },

  // ─── NG-MAJOR-CHEM-004 ───────────────────────────────────────────────────
  // 화학 전공 + 규제대응/RA 직무 → RESEARCH_PROFESSIONAL base=2, override 없음 → direct 금지
  // 검증 목적: CHEMISTRY→RA는 PHARMACY보다 약해야 함
  {
    caseId: "NG-MAJOR-CHEM-004",
    category: "MajorCoverage",
    caseName: "화학 전공 + 규제대응/RA 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "화학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "CHEMISTRY RESEARCH_PROFESSIONAL base=2, REGULATORY_AFFAIRS override 없음 → final=2(adjacent)",
      "PHARMACY→RA는 direct — CHEMISTRY→RA는 adjacent로 차별화",
      "RESEARCH_PROFESSIONAL base=2로 법무/정책연구/컨설팅/RA 과대 연결 방지",
    ],
  },

  // ─── NG-MAJOR-ENV-001 ────────────────────────────────────────────────────
  // 환경공학 전공 + 안전환경(EHS) 직무 → MANUFACTURING base=2, override EHS=1 → direct
  {
    caseId: "NG-MAJOR-ENV-001",
    category: "MajorCoverage",
    caseName: "환경공학 전공 + 안전환경(EHS) 직무 → Axis1 very_low/low 금지, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "환경공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "ENVIRONMENT_SAFETY MANUFACTURING_QUALITY_PRODUCTION base=2, override ENVIRONMENT_HEALTH_SAFETY=1 → final=3(direct)",
      "안전환경은 환경/안전공학 전공의 핵심 직무 — very_low/low 금지, direct 판정",
    ],
  },

  // ─── NG-MAJOR-ENV-002 ────────────────────────────────────────────────────
  // 산업안전 전공 + 설비관리/유지보수 직무 → MANUFACTURING base=2, override EQUIPMENT_MAINTENANCE=1 → direct
  {
    caseId: "NG-MAJOR-ENV-002",
    category: "MajorCoverage",
    caseName: "산업안전 전공 + 설비관리/유지보수 직무 → Axis1 very_low/low 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "산업안전",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
    },

    notes: [
      "ENVIRONMENT_SAFETY MANUFACTURING_QUALITY_PRODUCTION base=2, override EQUIPMENT_MAINTENANCE=1 → final=3(direct)",
      "설비관리는 안전공학 전공의 보조 연결 직무 — very_low/low 금지",
    ],
  },

  // ─── NG-MAJOR-ENV-003 ────────────────────────────────────────────────────
  // 환경공학 전공 + 규제대응/RA 직무 → RESEARCH_PROFESSIONAL base=1, override RA=1 → adjacent
  // 검증 목적: ENVIRONMENT→RA는 PHARMACY(direct)보다 약해야 함
  {
    caseId: "NG-MAJOR-ENV-003",
    category: "MajorCoverage",
    caseName: "환경공학 전공 + 규제대응/RA 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "환경공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ENVIRONMENT_SAFETY RESEARCH_PROFESSIONAL base=1, override REGULATORY_AFFAIRS=1 → final=2(adjacent)",
      "PHARMACY→RA는 direct — ENVIRONMENT→RA는 adjacent로 차별화",
      "환경규제 맥락 연결은 인정하되 PHARMACY 수준의 직접 연결로 오인되면 안 됨",
    ],
  },

  // ─── NG-MAJOR-ENV-004 ────────────────────────────────────────────────────
  // 환경과학 전공 + 법무 직무 → RESEARCH_PROFESSIONAL base=1, override 없음 → weak
  // 검증 목적: ENVIRONMENT_SAFETY가 연구전문직 전체에 과대 연결되지 않아야 함
  {
    caseId: "NG-MAJOR-ENV-004",
    category: "MajorCoverage",
    caseName: "환경과학 전공 + 법무 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_LEGAL",
      targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_LEGAL_ACCOUNTING_TAX",
      major: "환경과학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ENVIRONMENT_SAFETY RESEARCH_PROFESSIONAL base=1, LEGAL override 없음 → final=1(weak)",
      "법무는 법학 전공(LAW)의 핵심 직무 — 환경/안전 전공이 direct로 오인되면 안 됨",
      "RESEARCH_PROFESSIONAL base=1로 법무/정책연구/컨설팅 과대 연결 방지",
    ],
  },

  // ─── NG-MAJOR-ENV-005 ────────────────────────────────────────────────────
  // 환경공학 전공 + 공정기술 직무 → MANUFACTURING base=2, override 없음 → adjacent
  // 검증 목적: ENVIRONMENT→공정기술은 CHEMISTRY(direct)보다 약해야 함
  {
    caseId: "NG-MAJOR-ENV-005",
    category: "MajorCoverage",
    caseName: "환경공학 전공 + 공정기술 직무 → Axis1 direct 금지, medium 수준 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING",
      targetIndustryId: "IND_MANUFACTURING_CHEMICAL_PETROCHEMICAL",
      major: "환경공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW, BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ENVIRONMENT_SAFETY MANUFACTURING_QUALITY_PRODUCTION base=2, PROCESS_ENGINEERING override 없음 → final=2(adjacent)",
      "CHEMISTRY→공정기술은 direct — ENVIRONMENT→공정기술은 adjacent로 차별화",
      "환경공학의 공정 이해는 인정하되 화학공학 수준의 직접 연결로 오인되면 안 됨",
    ],
  },

  // ─── NG-MAJOR-ARCH-001 ───────────────────────────────────────────────────
  // 건축공학 전공 + 공공사업운영 직무 → PUBLIC_ADMINISTRATION_SUPPORT base=2, override 없음 → adjacent
  // 검증 목적: ARCHITECTURE→공공사업은 adjacent 이상이면 충분, 공공행정 전체 direct는 금지
  {
    caseId: "NG-MAJOR-ARCH-001",
    category: "MajorCoverage",
    caseName: "건축공학 전공 + 공공사업운영 직무 → Axis1 very_low/low 금지, direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS",
      targetIndustryId: "IND_PUBLIC_ADMINISTRATION_CENTRAL_GOVERNMENT",
      major: "건축공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ARCHITECTURE_CIVIL PUBLIC_ADMINISTRATION_SUPPORT base=2, PUBLIC_PROGRAM_OPERATIONS override 없음 → final=2(adjacent)",
      "공공 인프라/건설 사업 맥락 연결은 인정하되 공공행정 전체 direct로 오인되면 안 됨",
    ],
  },

  // ─── NG-MAJOR-ARCH-002 ───────────────────────────────────────────────────
  // 토목공학 전공 + 프로젝트관리 직무 → BUSINESS base=1, override PROJECT_MANAGEMENT=1 → adjacent
  // 검증 목적: ARCHITECTURE→PM은 adjacent, 일반 PM 전체 direct는 금지
  {
    caseId: "NG-MAJOR-ARCH-002",
    category: "MajorCoverage",
    caseName: "토목공학 전공 + 프로젝트관리 직무 → Axis1 medium 수준, direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_BUSINESS_PROJECT_MANAGEMENT",
      targetIndustryId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_CONSTRUCTION_GENERAL_CONTRACTOR",
      major: "토목공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW, BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ARCHITECTURE_CIVIL BUSINESS base=1, override PROJECT_MANAGEMENT=1 → final=2(adjacent)",
      "건설 PM 맥락 연결은 인정하되 일반 사업기획 전체 direct로 오인되면 안 됨",
    ],
  },

  // ─── NG-MAJOR-ARCH-003 ───────────────────────────────────────────────────
  // 건축학 전공 + 협력사/조달 직무 → PROCUREMENT_SCM base=1, override SUPPLIER_VENDOR_MANAGEMENT=1 → adjacent
  // 검증 목적: ARCHITECTURE→조달/협력사는 adjacent, high/very_high 금지
  {
    caseId: "NG-MAJOR-ARCH-003",
    category: "MajorCoverage",
    caseName: "건축학 전공 + 협력사관리 직무 → Axis1 medium 수준, direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_PROCUREMENT_SCM_SUPPLIER_VENDOR_MANAGEMENT",
      targetIndustryId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_PLANT_AND_INFRA_EPC",
      major: "건축학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW, BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ARCHITECTURE_CIVIL PROCUREMENT_SCM base=1, override SUPPLIER_VENDOR_MANAGEMENT=1 → final=2(adjacent)",
      "건설 협력사/자재 조달 맥락 연결은 인정하되 조달 전체 direct로 오인되면 안 됨",
    ],
  },

  // ─── NG-MAJOR-ARCH-004 ───────────────────────────────────────────────────
  // 건축공학 전공 + 규제대응/RA 직무 → RESEARCH_PROFESSIONAL base=1, override 없음 → weak
  // 검증 목적: ARCHITECTURE→RA/법무/연구전문직 전체 과대 연결 금지
  {
    caseId: "NG-MAJOR-ARCH-004",
    category: "MajorCoverage",
    caseName: "건축공학 전공 + 규제대응/RA 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
      targetIndustryId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_CONSTRUCTION_GENERAL_CONTRACTOR",
      major: "건축공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ARCHITECTURE_CIVIL RESEARCH_PROFESSIONAL base=1, REGULATORY_AFFAIRS override 없음 → final=1(weak)",
      "RA는 PHARMACY/ENVIRONMENT 전공의 직무 연결 — 건축/토목 전공이 과대 연결되면 안 됨",
      "RESEARCH_PROFESSIONAL base=1로 연구전문직 전체 과대 연결 방지",
    ],
  },

  // ─── NG-MAJOR-ARCH-005 ───────────────────────────────────────────────────
  // 토목공학 전공 + 안전환경(EHS) 직무 → MANUFACTURING base=1, override 없음 → weak
  // 검증 목적: EHS는 ENVIRONMENT_SAFETY 전공의 핵심 직무 — ARCHITECTURE에서 direct로 보이면 안 됨
  {
    caseId: "NG-MAJOR-ARCH-005",
    category: "MajorCoverage",
    caseName: "토목공학 전공 + 안전환경(EHS) 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY",
      targetIndustryId: "IND_CONSTRUCTION_REAL_ESTATE_INFRA_PLANT_AND_INFRA_EPC",
      major: "토목공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "ARCHITECTURE_CIVIL MANUFACTURING_QUALITY_PRODUCTION base=1, EHS override 없음 → final=1(weak)",
      "안전환경은 ENVIRONMENT_SAFETY 전공의 핵심 직무 — 토목공학이 direct로 오인되면 안 됨",
    ],
  },

  // ─── NG-MAJOR-MATERIALS-001 ───────────────────────────────────────────────
  // 신소재공학 전공 + R&D 직무 → ENGINEERING_DEVELOPMENT base=2, override RESEARCH_AND_DEVELOPMENT=1 → direct
  {
    caseId: "NG-MAJOR-MATERIALS-001",
    category: "MajorCoverage",
    caseName: "신소재공학 전공 + 연구개발(R&D) 직무 → Axis1 very_low/low 금지, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT",
      targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR",
      major: "신소재공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "MATERIALS_SCIENCE ENGINEERING_DEVELOPMENT base=2, override RESEARCH_AND_DEVELOPMENT=1 → final=3(direct)",
      "소재/신소재 전공은 R&D 직무의 핵심 연결 — very_low/low 금지, direct 기대",
    ],
  },

  // ─── NG-MAJOR-MATERIALS-002 ───────────────────────────────────────────────
  // 재료공학 전공 + 기술연구 직무 → RESEARCH_PROFESSIONAL base=2, override TECHNICAL_RESEARCH=1 → direct
  {
    caseId: "NG-MAJOR-MATERIALS-002",
    category: "MajorCoverage",
    caseName: "재료공학 전공 + 기술연구 직무 → Axis1 very_low/low 금지, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH",
      targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR",
      major: "재료공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "MATERIALS_SCIENCE RESEARCH_PROFESSIONAL base=2, override TECHNICAL_RESEARCH=1 → final=3(direct)",
      "재료공학 전공의 기술연구 직무 연결은 핵심 — very_low/low 금지, direct 기대",
    ],
  },

  // ─── NG-MAJOR-MATERIALS-003 ───────────────────────────────────────────────
  // 세라믹공학 전공 + 품질관리(QC) 직무 → MANUFACTURING base=2, override QUALITY_CONTROL=1 → direct
  {
    caseId: "NG-MAJOR-MATERIALS-003",
    category: "MajorCoverage",
    caseName: "세라믹공학 전공 + 품질관리(QC) 직무 → Axis1 very_low/low 금지, direct 기대",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
      targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR",
      major: "세라믹공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_VERY_LOW, BAND_LOW],
      majorPriorLabelExpected: "direct",
    },

    notes: [
      "MATERIALS_SCIENCE MANUFACTURING_QUALITY_PRODUCTION base=2, override QUALITY_CONTROL=1 → final=3(direct)",
      "세라믹/소재 전공의 QC 직무 연결은 핵심 — very_low/low 금지, direct 기대",
    ],
  },

  // ─── NG-MAJOR-MATERIALS-004 ───────────────────────────────────────────────
  // 신소재공학 전공 + 규제대응/RA 직무 → RESEARCH_PROFESSIONAL base=2, override 없음 → direct 금지
  // 검증 목적: MATERIALS→RA는 PHARMACY보다 약해야 함 (adjacent까지만 허용)
  {
    caseId: "NG-MAJOR-MATERIALS-004",
    category: "MajorCoverage",
    caseName: "신소재공학 전공 + 규제대응/RA 직무 → Axis1 과상승 및 direct 금지",
    priority: "P1",
    status: "FIXTURED",

    input: {
      targetJobId: "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS",
      targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_SEMICONDUCTOR",
      major: "신소재공학",
      projects: [],
      internships: [],
      certifications: [],
      strengths: [],
      workStyleNotes: "",
    },

    expected: {
      axisPackRequired: true,
      axis1BandForbidden: [BAND_HIGH, BAND_VERY_HIGH],
      majorPriorLabelForbidden: "direct",
    },

    notes: [
      "MATERIALS_SCIENCE RESEARCH_PROFESSIONAL base=2, REGULATORY_AFFAIRS override 없음 → final=2(adjacent)",
      "PHARMACY→RA는 direct — MATERIALS→RA는 adjacent로 차별화",
      "소재공학이 RA/법무/정책연구 등 연구전문직 전체에 과대 연결되면 안 됨",
    ],
  },
];

export default NEWGRAD_CORE_INVARIANT_CASES;
