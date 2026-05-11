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

// Job major categories where english score is not a primary preparation signal
const _ENGLISH_LOW_PRIORITY_MAJORS = new Set([
  "MARKETING",
  "IT_DATA_DIGITAL",
  "ENGINEERING_DEVELOPMENT",
  "DESIGN",
  "HR_ORGANIZATION",
  "EDUCATION_COUNSELING_COACHING",
  "MANUFACTURING_QUALITY_PRODUCTION",
]);

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

export function buildNewgradPreparationWhatIfPreviewPack({ axisPack, targetJobId = "" }) {
  const axes = axisPack?.axes ?? {};
  const currentAxisScores = {};
  for (const key of AXIS_KEYS) {
    const axis = axes[key];
    currentAxisScores[key] = axis ? bandToScore5(axis.band, axis.displayScore) : 3;
  }

  const jobMajor = _resolveJobMajorCategoryLocal(targetJobId);
  const englishDefault = !_ENGLISH_LOW_PRIORITY_MAJORS.has(jobMajor);
  const actions = PREPARATION_ACTIONS.map((a) =>
    a.id === "english_score" ? { ...a, defaultSelected: englishDefault } : a
  );

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
