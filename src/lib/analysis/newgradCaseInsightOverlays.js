const PATTERN_IDS = Object.freeze({
  WEAK_MAJOR_STRONG_RELEVANT_PROJECT: "WEAK_MAJOR_STRONG_RELEVANT_PROJECT",
  CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE: "CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE",
  CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT: "CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT",
  NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA: "NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA",
  NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA: "NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA",
  SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE: "SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE",
});

const PATTERN_REGISTRY = [
  {
    id: PATTERN_IDS.CS_OPERATIONS_TO_SERVICE_PLANNING_NO_PLANNING_OUTPUT,
    appliesTo: ({ normalized }) => {
      const CS_ROLE_KEYWORDS = ["고객상담", "고객응대", "고객서비스", "고객지원", "cs"];
      const hasCSWorkExperience = normalized.canonicalWorkRowsRaw.some(
        (row) => CS_ROLE_KEYWORDS.some(
          (kw) => String(row?.roleFamily ?? "").toLowerCase().includes(kw)
        )
      );
      return (
        normalized.targetJobId === "JOB_BUSINESS_SERVICE_PLANNING"
        && hasCSWorkExperience
        && normalized.projectsRaw.length === 0
      );
    },
    axisOverlays: {
      customerType: {
        explanation: {
          lead: "CS 경험은 고객 이해 측면에서 연결 가능한 배경입니다. 고객 불편과 반복 문의, VOC를 직접 접한 경험은 서비스기획에서 사용자 관점을 파악하는 근거가 될 수 있습니다. 다만 지원서에서는 그 경험을 단순 응대로 정리하기보다, 불편을 어떻게 해석하고 개선 방향으로 연결했는지까지 보여주는 것이 더 효과적입니다.",
          scoreReason: "고객응대·CS 경험은 실제 고객 불편과 VOC를 직접 접했다는 점에서 서비스기획과 연결될 수 있습니다. 다만 현재 입력만으로는 그 경험을 기능 개선, 요구사항 정의, 화면 흐름, 정책 설계 같은 기획 산출물로 바꾼 근거는 아직 제한적으로 보입니다.",
        },
      },
      responsibilityScope: {
        explanation: {
          lead: "서비스기획 직무에서는 고객의 요청을 듣는 것에서 한 단계 더 나아가, 요구사항 정리, 우선순위 판단, 개선안 도출, 기획 산출물로 바꿔본 경험이 중요하게 읽힙니다.",
          scoreReason: "서비스기획 직무에서는 고객 문제를 기능, 화면 흐름, 요구사항 정리, 우선순위 판단, 개선안으로 바꿔본 근거가 중요합니다. 현재는 CS 경험이 기획 산출물로 연결된 근거가 충분히 드러나지 않는 상태입니다.",
        },
      },
    },
  },
  {
    id: PATTERN_IDS.CERT_ONLY_WITHOUT_IMPLEMENTATION_EVIDENCE,
    appliesTo: ({ normalized }) => (
      normalized.certificationsRaw.length > 0
      && normalized.projectsRaw.length === 0
      && normalized.canonicalWorkRowsRaw.length === 0
    ),
    axisOverlays: {
      industryContext: {
        explanation: {
          lead: "입력된 자격증은 보조 근거이자 기초 학습 신호가 될 수 있습니다. 다만 직무 연결성이 충분히 설명되려면 실무 경험이나 결과물이 함께 필요합니다.",
          scoreReason: "ADsP, SQLD 같은 자격증은 학습 의지를 보여주는 신호입니다. 다만 데이터 직무에서는 SQL 활용 사례나 분석 프로젝트 경험, 지표 해석 결과물이 함께 있어야 연결도가 높아집니다. 현재는 결과물 부족한 측면이 있어 도구 인지 수준 이상의 연결을 보여주기 어렵습니다.",
          liftOrLimit: "다음 보완은 자격증을 하나 더 추가하는 것보다, 작은 분석 프로젝트라도 결과물과 판단 과정을 남기는 쪽이 더 효과적입니다. 자격증은 보조 근거로서 의미가 있으며, 실무 경험이나 결과물이 함께 필요합니다.",
          criteria: "ADsP, SQLD처럼 입력된 자격증은 기초 학습 또는 관심 신호를 보여줄 수 있습니다. 다만 실제 분석 프로젝트와 실무 활용 경험 부족이 확인되는 경우, 자격증만으로는 직무 연결 근거로 충분하지 않습니다.",
        },
      },
    },
  },
  {
    id: PATTERN_IDS.NON_MAJOR_WITH_IMPLEMENTATION_PROJECT_FOR_DEV_DATA,
    appliesTo: ({ normalized, _jobFitMajorPrior }) => {
      const DEV_DATA_JOB_PREFIXES = ["JOB_IT_DATA_DIGITAL_"];
      const isDevDataJob = DEV_DATA_JOB_PREFIXES.some(
        (prefix) => String(normalized.targetJobId ?? "").startsWith(prefix)
      );
      return (
        isDevDataJob
        && normalized.projectsRaw.length > 0
        && (_jobFitMajorPrior?.label === "weak" || _jobFitMajorPrior?.label === "mismatch")
      );
    },
    axisOverlays: {
      responsibilityScope: {
        explanation: {
          lead: "구현·분석 프로젝트는 전공보다 더 직접적인 개발·데이터 직무 연결 근거가 될 수 있습니다.",
          scoreReason: "SQL 쿼리 작성, Python 데이터 처리, 분석 리포트 작성 같은 구현·분석 경험은 데이터 직무에서 전공보다 더 직접적인 근거가 될 수 있습니다. 현재 전공 연결성은 제한적이지만, 프로젝트 경험이 직무 연결성의 실질적 근거로 작동할 수 있습니다.",
          liftOrLimit: "직무 연결 근거로 프로젝트 경험을 전공보다 앞에 두세요. SQL 활용 결과나 분석 판단 과정이 드러나는 방식으로 정리하면 채용 관점에서 더 설득력이 높아집니다.",
        },
      },
    },
  },
  {
    id: PATTERN_IDS.NO_EVIDENCE_NON_MAJOR_FOR_DEV_DATA,
    appliesTo: ({ normalized, _jobFitMajorPrior }) => {
      const DEV_DATA_JOB_PREFIXES = ["JOB_IT_DATA_DIGITAL_"];
      const isDevDataJob = DEV_DATA_JOB_PREFIXES.some(
        (prefix) => String(normalized.targetJobId ?? "").startsWith(prefix)
      );
      return (
        isDevDataJob
        && normalized.projectsRaw.length === 0
        && normalized.canonicalWorkRowsRaw.length === 0
        && normalized.certificationsRaw.length === 0
        && (_jobFitMajorPrior?.label === "weak" || _jobFitMajorPrior?.label === "mismatch")
      );
    },
    axisOverlays: {
      responsibilityScope: {
        explanation: {
          lead: "아직 개발·데이터 직무와 연결할 수 있는 경험 근거가 거의 보이지 않습니다.",
          scoreReason: "전공 연결성이 약한 상태에서는 프로젝트, 분석 산출물, 실습 결과처럼 실제로 해본 근거가 있어야 직무 연결성을 설명할 수 있습니다. 현재 입력만으로는 데이터·개발 직무와의 연결 고리가 아직 충분하지 않습니다.",
          criteria: "포트폴리오용 분석 프로젝트, 간단한 서비스 구현, SQL·Python 기반 데이터 처리 결과물처럼 확인 가능한 산출물이 필요합니다. 자격증이라도 하나 취득하거나 작은 실습 결과를 정리해 두면 직무 연결 근거로 활용할 수 있습니다.",
          liftOrLimit: "지금 단계에서는 강점보다 '직무와 직접 연결되는 결과물 1개'를 만드는 것이 우선입니다. SQL 쿼리 분석, Python 시각화, 간단한 앱 기능 구현 중 하나라도 산출물로 남기면 다음 지원에서 전공 연결성의 약점을 실제 경험으로 보완할 수 있습니다.",
        },
      },
    },
  },
  {
    id: PATTERN_IDS.SELF_REPORT_ONLY_WITHOUT_EXPERIENCE_EVIDENCE,
    appliesTo: ({ normalized }) => (
      normalized.projectsRaw.length === 0
      && normalized.canonicalWorkRowsRaw.length === 0
      && normalized.certificationsRaw.length === 0
      && (normalized.strengths.length > 0 || normalized.workStyleNotes.length > 0)
    ),
    axisOverlays: {
      roleCharacter: {
        explanation: {
          lead: "자기보고 강점은 참고 신호가 될 수 있습니다. 그러나 채용 근거로 작동하려면 그 강점이 실제 경험과 결과로 확인되어야 함을 지원서 관점에서 고려하는 것이 좋습니다.",
          scoreReason: "문제해결력, 커뮤니케이션 같은 자기보고 강점은 참고 신호가 될 수 있지만, 현재는 이를 뒷받침하는 실제 경험과 결과 근거가 함께 드러나지 않은 상태입니다. 지원서 관점에서는 이 강점이 어떤 상황에서 어떤 행동과 결과로 이어졌는지를 보여주는 경험이 함께 필요합니다.",
          liftOrLimit: "다음 단계는 강점을 더 많이 적는 것이 아니라, 그 강점이 드러난 프로젝트·활동·결과 사례를 1개라도 만드는 것입니다.",
        },
      },
    },
  },
  {
    id: PATTERN_IDS.WEAK_MAJOR_STRONG_RELEVANT_PROJECT,
    appliesTo: ({ normalized, _jobFitMajorPrior }) => (
      normalized.targetJobId === "JOB_BUSINESS_SERVICE_PLANNING"
      && Boolean(normalized.major)
      && normalized.projectsRaw.length >= 2
      && (_jobFitMajorPrior?.label === "weak" || _jobFitMajorPrior?.label === "mismatch")
    ),
    axisOverlays: {
      jobStructure: {
        explanation: {
          lead: "서비스기획과 전공 직접 연결성은 제한적일 수 있습니다. 전공 연결성은 약할 수 있으나, 프로젝트 경험을 어떻게 해석하느냐에 따라 방향이 달라집니다.",
          scoreReason: "프로젝트 경험은 전공 연결성을 높이는 근거라기보다, 지원 직무와 비슷한 문제를 다뤄본 경험 근거로 해석하는 편이 더 정확합니다.",
        },
      },
      responsibilityScope: {
        explanation: {
          lead: "프로젝트 경험은 서비스기획 근거로 재구성 가능합니다. 사용자 문제정의나 화면 설계, 기능 개선안, 요구사항 정리 등의 경험이 있다면 지원 근거로 활용할 수 있습니다.",
          scoreReason: "특히 사용자 문제정의, 화면 설계, 기능 개선안 등 구체적인 기획 산출물이 경험에 드러날수록 직무 연결성이 강화됩니다.",
          liftOrLimit: "화면 흐름도, 요구사항 정의서, 사용자 시나리오, 기능 개선안처럼 확인 가능한 기획 산출물이 있다면 해당 경험을 지원서 앞쪽에 배치하는 것이 좋습니다. 산출물 이름만 나열하기보다 어떤 사용자 문제를 발견했고, 그것을 어떤 화면·기능·정책 개선안으로 바꿨는지 함께 정리하면 전공 연결성의 약점을 경험 근거로 보완할 수 있습니다.",
        },
      },
    },
  },
];

function mergeAxisOverlays(base = {}, next = {}) {
  const merged = { ...base };
  for (const [axisKey, axisOverlay] of Object.entries(next)) {
    merged[axisKey] = {
      ...(merged[axisKey] || {}),
      ...(axisOverlay || {}),
      explanation: {
        ...((merged[axisKey] || {}).explanation || {}),
        ...((axisOverlay || {}).explanation || {}),
      },
    };
  }
  return merged;
}

export function buildNewgradCaseInsightOverlays(context = {}) {
  const safeContext = context && typeof context === "object" ? context : {};
  const normalized = safeContext.normalized && typeof safeContext.normalized === "object"
    ? safeContext.normalized
    : {};
  const matcherContext = {
    ...safeContext,
    normalized,
  };
  const firedPatternIds = [];
  let axisOverlays = {};

  for (const pattern of PATTERN_REGISTRY) {
    if (!pattern.appliesTo(matcherContext)) continue;
    firedPatternIds.push(pattern.id);
    axisOverlays = mergeAxisOverlays(axisOverlays, pattern.axisOverlays);
  }

  return {
    axisOverlays,
    firedPatternIds,
  };
}

export default buildNewgradCaseInsightOverlays;
