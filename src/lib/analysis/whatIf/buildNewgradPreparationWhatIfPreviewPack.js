// @MX:ANCHOR: [AUTO] Newgrad preparation what-if preview pack builder
// @MX:REASON: Entry point consumed by buildNewgradTransitionLiteResult and NewgradWhatIfPreparationSection

export const AXIS_SHORT_LABELS = {
  jobStructure: "직무 연결",
  industryContext: "산업 이해도",
  responsibilityScope: "경험 연결",
  customerType: "소통 적합성",
  roleCharacter: "강점과 재능",
};

export const AXIS_KEYS = [
  "jobStructure",
  "industryContext",
  "responsibilityScope",
  "customerType",
  "roleCharacter",
];

export const PREPARATION_ACTIONS = [
  {
    id: "internship_experience",
    label: "목표 직무 관련 인턴 경험 추가",
    subtitle: "희망 직무와 직접 닿는 실무 경험 확보",
    impactLabel: "+0.7",
    impactDelta: 0.7,
    defaultSelected: true,
    tone: "indigo",
    axisImpacts: {
      responsibilityScope: 0.35,
      jobStructure: 0.25,
      customerType: 0.10,
    },
  },
  {
    id: "industry_project",
    label: "산업 관련 프로젝트 수행",
    subtitle: "지원 산업 주제 경험",
    impactLabel: "+0.5",
    impactDelta: 0.5,
    defaultSelected: true,
    tone: "emerald",
    axisImpacts: {
      industryContext: 0.25,
      responsibilityScope: 0.15,
      jobStructure: 0.10,
    },
  },
  {
    id: "english_score",
    label: "영어 점수 향상",
    subtitle: "TOEIC/OPIc 등 어학 보완",
    impactLabel: "+0.4",
    impactDelta: 0.4,
    defaultSelected: true,
    tone: "rose",
    axisImpacts: {
      customerType: 0.25,
      roleCharacter: 0.15,
    },
  },
  {
    id: "job_certificate",
    label: "직무 관련 자격증 취득",
    subtitle: "직무 기초지식 보완",
    impactLabel: "+0.2",
    impactDelta: 0.2,
    defaultSelected: false,
    tone: "amber",
    axisImpacts: {
      jobStructure: 0.10,
      industryContext: 0.10,
    },
  },
  {
    id: "contest_hackathon",
    label: "공모전/해커톤 참여",
    subtitle: "문제 해결 및 협업 경험",
    impactLabel: "+0.2",
    impactDelta: 0.2,
    defaultSelected: false,
    tone: "sky",
    axisImpacts: {
      responsibilityScope: 0.10,
      roleCharacter: 0.05,
      customerType: 0.05,
    },
  },
];

function bandToScore5(band, displayScore) {
  if (band === "high") return 5;
  if (band === "mid_high") return 4;
  if (band === "mid") return 3;
  if (band === "low") return 2;
  if (band === "very_low") return 1;
  const ds = Number.isFinite(displayScore) ? displayScore : 20;
  return Math.max(1, Math.min(5, Math.round(1 + (ds - 20) / 20)));
}

// Category-level default selection and display order per job major category.
const JOB_CATEGORY_PRIORITY_MAP = Object.freeze({
  FINANCE_ACCOUNTING: {
    defaultSelected: ["internship_experience", "job_certificate"],
    order: ["job_certificate", "internship_experience", "industry_project", "english_score", "contest_hackathon"],
  },
  IT_DATA_DIGITAL: {
    defaultSelected: ["internship_experience", "job_certificate"],
    order: ["internship_experience", "job_certificate", "industry_project", "contest_hackathon", "english_score"],
  },
  MARKETING: {
    defaultSelected: ["internship_experience", "industry_project", "contest_hackathon"],
    order: ["industry_project", "contest_hackathon", "internship_experience", "job_certificate", "english_score"],
  },
  SALES: {
    defaultSelected: ["internship_experience", "industry_project", "english_score"],
    order: ["internship_experience", "english_score", "industry_project", "contest_hackathon", "job_certificate"],
  },
  MANUFACTURING_QUALITY_PRODUCTION: {
    defaultSelected: ["internship_experience", "industry_project"],
    order: ["internship_experience", "industry_project", "job_certificate", "contest_hackathon", "english_score"],
  },
  RESEARCH_PROFESSIONAL: {
    defaultSelected: ["internship_experience", "industry_project"],
    order: ["internship_experience", "industry_project", "job_certificate", "english_score", "contest_hackathon"],
  },
  BUSINESS: {
    defaultSelected: ["internship_experience", "industry_project", "english_score"],
    order: ["internship_experience", "industry_project", "english_score", "contest_hackathon", "job_certificate"],
  },
});

// Job-level overrides for cases where category-level defaults are too coarse.
// subtitleOverrides는 선택적으로 특정 액션의 subtitle을 신입 케이스 톤으로 보정한다.
const JOB_PRIORITY_OVERRIDE_MAP = Object.freeze({
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL: {
    defaultSelected: ["internship_experience", "job_certificate"],
    order: ["job_certificate", "internship_experience", "industry_project", "contest_hackathon", "english_score"],
  },
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: {
    defaultSelected: ["internship_experience", "job_certificate"],
    order: ["job_certificate", "internship_experience", "industry_project", "contest_hackathon", "english_score"],
  },
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT: {
    defaultSelected: ["internship_experience", "industry_project"],
    order: ["internship_experience", "industry_project", "job_certificate", "contest_hackathon", "english_score"],
  },
  JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS: {
    defaultSelected: ["internship_experience", "job_certificate"],
    order: ["job_certificate", "internship_experience", "industry_project", "english_score", "contest_hackathon"],
  },
  JOB_BUSINESS_SERVICE_PLANNING: {
    defaultSelected: ["internship_experience", "industry_project"],
    order: ["industry_project", "internship_experience", "contest_hackathon", "job_certificate", "english_score"],
  },
  // 해외영업 신입에게는 어학·산업 자료 조사·영문 작성 샘플이 우선이며,
  // 경력자 KPI(전환율/재구매/계약 건수/고객 만족도)는 표면에 노출하지 않는다.
  JOB_SALES_OVERSEAS_SALES: {
    defaultSelected: ["english_score", "industry_project", "internship_experience"],
    order: ["english_score", "industry_project", "internship_experience", "contest_hackathon", "job_certificate"],
    subtitleOverrides: {
      english_score: "영문 메일·제안서·견적서 작성 샘플 만들기",
      industry_project: "지원 산업 제품 1개를 정해 해외 고객 제안서 형태로 정리하기",
      internship_experience: "해외 시장·고객 자료 조사 및 제품 사양서·영문 자료 요약 경험",
      job_certificate: "인코텀즈·견적·납기·결제·물류·통관 기초 흐름 학습",
      contest_hackathon: "해외 시장 진출 시뮬레이션·국제 비즈니스 공모전 참여",
    },
  },
  // 기술영업·솔루션영업 신입도 산업 제품 이해와 인턴 우선, 자격은 후순위로 완화.
  JOB_SALES_TECHNICAL_SALES: {
    defaultSelected: ["industry_project", "internship_experience", "english_score"],
    order: ["industry_project", "internship_experience", "english_score", "contest_hackathon", "job_certificate"],
    subtitleOverrides: {
      industry_project: "지원 산업 제품 1개를 정해 기술 사양·고객 적합성 자료 정리",
      internship_experience: "기술 제품 영업·기술 지원 인턴 또는 현장 동행 경험",
    },
  },
  JOB_SALES_SOLUTION_SALES: {
    defaultSelected: ["industry_project", "internship_experience", "english_score"],
    order: ["industry_project", "internship_experience", "english_score", "contest_hackathon", "job_certificate"],
    subtitleOverrides: {
      industry_project: "지원 산업 고객 문제 1개를 정해 솔루션 제안서 형태로 정리",
      internship_experience: "B2B 영업·기획 인턴 또는 사업 제안 보조 경험",
    },
  },
  // B2B 영업 신입도 산업·고객 자료 조사가 KPI 톤보다 우선.
  JOB_SALES_B2B_SALES: {
    defaultSelected: ["industry_project", "internship_experience", "english_score"],
    order: ["industry_project", "internship_experience", "english_score", "contest_hackathon", "job_certificate"],
    subtitleOverrides: {
      industry_project: "지원 산업 기업 고객 1개를 정해 구매 의사결정 흐름 정리",
      internship_experience: "기업 고객 응대·영업 보조·전시회 운영 등 B2B 접점 경험",
    },
  },
});

const _FALLBACK_PRIORITY = Object.freeze({
  defaultSelected: ["internship_experience", "industry_project", "english_score"],
  order: ["internship_experience", "industry_project", "english_score", "job_certificate", "contest_hackathon"],
});

function _resolveJobMajorCategoryLocal(targetJobId) {
  const id = String(targetJobId || "").toUpperCase().trim();
  if (!id) return "";
  const body = id.startsWith("JOB_") ? id.slice(4) : id;
  const knownMajors = [
    "CUSTOMER_OPERATIONS", "HR_ORGANIZATION", "FINANCE_ACCOUNTING",
    "PROCUREMENT_SCM", "MANUFACTURING_QUALITY_PRODUCTION", "ENGINEERING_DEVELOPMENT",
    "IT_DATA_DIGITAL", "RESEARCH_PROFESSIONAL", "EDUCATION_COUNSELING_COACHING",
    "PUBLIC_ADMINISTRATION_SUPPORT", "BUSINESS", "SALES", "MARKETING", "DESIGN",
  ];
  for (const major of knownMajors) {
    if (body === major || body.startsWith(major + "_")) return major;
  }
  return "";
}

function _resolveJobPriorityConfig(targetJobId) {
  const upperJobId = String(targetJobId || "").toUpperCase().trim();
  if (upperJobId && JOB_PRIORITY_OVERRIDE_MAP[upperJobId]) {
    return JOB_PRIORITY_OVERRIDE_MAP[upperJobId];
  }
  const major = _resolveJobMajorCategoryLocal(targetJobId);
  return JOB_CATEGORY_PRIORITY_MAP[major] ?? _FALLBACK_PRIORITY;
}

export function buildNewgradPreparationWhatIfPreviewPack({ axisPack, targetJobId = "" }) {
  const axes = axisPack?.axes ?? {};
  const currentAxisScores = {};
  for (const key of AXIS_KEYS) {
    const axis = axes[key];
    currentAxisScores[key] = axis ? bandToScore5(axis.band, axis.displayScore) : 3;
  }

  const config = _resolveJobPriorityConfig(targetJobId);
  const selectedSet = new Set(config.defaultSelected);
  const orderIndex = Object.fromEntries(config.order.map((id, i) => [id, i]));
  const subtitleOverrides = config.subtitleOverrides && typeof config.subtitleOverrides === "object"
    ? config.subtitleOverrides
    : null;

  const actions = PREPARATION_ACTIONS
    .map((a) => {
      const overrideSubtitle = subtitleOverrides && typeof subtitleOverrides[a.id] === "string"
        ? subtitleOverrides[a.id]
        : null;
      return {
        ...a,
        defaultSelected: selectedSet.has(a.id),
        subtitle: overrideSubtitle || a.subtitle,
      };
    })
    .sort((a, b) => (orderIndex[a.id] ?? 99) - (orderIndex[b.id] ?? 99));

  return {
    actions,
    axisShortLabels: AXIS_SHORT_LABELS,
    axisKeys: AXIS_KEYS,
    currentAxisScores,
  };
}

export function computeNewgradPreparationWhatIfPreview({ selectedActionIds, pack }) {
  const { actions, axisKeys, currentAxisScores } = pack;
  const selectedSet = new Set(Array.isArray(selectedActionIds) ? selectedActionIds : []);
  const selectedActions = actions.filter((a) => selectedSet.has(a.id));

  const afterScores = { ...currentAxisScores };
  let totalDelta = 0;

  for (const action of selectedActions) {
    totalDelta += action.impactDelta;
    for (const [axisKey, impact] of Object.entries(action.axisImpacts)) {
      afterScores[axisKey] = Math.min(5, (afterScores[axisKey] ?? 3) + impact);
    }
  }

  const beforeAvg =
    axisKeys.reduce((sum, k) => sum + (currentAxisScores[k] ?? 3), 0) / axisKeys.length;
  const afterAvg = Math.min(5, beforeAvg + totalDelta);
  const delta = afterAvg - beforeAvg;

  const perAxis = {};
  for (const key of axisKeys) {
    perAxis[key] = {
      before: currentAxisScores[key] ?? 3,
      after: afterScores[key] ?? 3,
      delta: (afterScores[key] ?? 3) - (currentAxisScores[key] ?? 3),
    };
  }

  return { beforeAvg, afterAvg, delta, perAxis };
}
