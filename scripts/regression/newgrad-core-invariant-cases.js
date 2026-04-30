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
];

export default NEWGRAD_CORE_INVARIANT_CASES;
