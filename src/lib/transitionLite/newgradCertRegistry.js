function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeToken(value) {
  return toStr(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

function getTargetJobMajor(targetJobId = "") {
  const id = toStr(targetJobId).toUpperCase();
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

const NEWGRAD_CERT_REGISTRY = [
  {
    canonicalId: "cert:computer_specialist_lv1",
    displayLabel: "컴퓨터활용능력 1급",
    aliases: ["컴퓨터활용능력 1급", "컴활 1급", "컴활1급"],
    family: "office_productivity",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "office_productivity",
    explanationVisibility: "limited",
    notes: "사무 기본기 신호지만 산업/분야 이해도 점수로 과대가산하지 않는다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:cat_lv1",
    displayLabel: "전산회계 1급",
    aliases: ["전산회계 1급", "전산회계1급"],
    family: "accounting_tax",
    scoreClass: "domain_adjacent",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "accounting_tax",
    explanationVisibility: "full",
    notes: "회계/재무 계열 목표 role에서만 제한 반영한다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:korean_history_proficiency",
    displayLabel: "한국사능력검정",
    aliases: ["한국사능력검정", "한국사능력검정시험", "한능검"],
    family: "general_knowledge",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "general_knowledge",
    explanationVisibility: "limited",
    notes: "공공 준비도 설명 정도만 가능하며 점수에는 반영하지 않는다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:gtq",
    displayLabel: "GTQ",
    aliases: ["GTQ", "GTQ 1급", "GTQ 2급", "GTQ 3급"],
    family: "design_tools",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "design_tools",
    explanationVisibility: "full",
    notes: "디자인 툴 준비도 신호이며 산업 점수로는 사용하지 않는다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:adsp",
    displayLabel: "ADsP",
    aliases: ["ADsP", "ADSP", "데이터분석 준전문가"],
    family: "data_analysis",
    scoreClass: "domain_adjacent",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "data_analysis",
    explanationVisibility: "full",
    notes: "데이터/분석 계열 role에서만 제한적 보조 신호다.",
    axis2: { allowedTargetJobMajors: ["IT_DATA_DIGITAL", "ENGINEERING_DEVELOPMENT", "RESEARCH_PROFESSIONAL", "MARKETING"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:toeic_speaking",
    displayLabel: "토익스피킹",
    aliases: ["토익스피킹", "TOEIC Speaking"],
    family: "spoken_language",
    scoreClass: "communication_support",
    allowedAxes: ["axis4"],
    disallowedAxes: ["axis1", "axis2", "axis3", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "spoken_language",
    explanationVisibility: "full",
    notes: "글로벌/대외/고객 상대 role에서만 약한 보조 신호다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: {
      enabled: true,
      allowedTargetJobMajors: ["SALES", "CUSTOMER_OPERATIONS"],
      targetJobLabelKeywords: ["해외", "글로벌", "대외", "고객", "파트너", "영업"],
      weight: "weak",
    },
  },
  {
    canonicalId: "cert:opic",
    displayLabel: "오픽",
    aliases: ["오픽", "OPIc", "OPIC"],
    family: "spoken_language",
    scoreClass: "communication_support",
    allowedAxes: ["axis4"],
    disallowedAxes: ["axis1", "axis2", "axis3", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "spoken_language",
    explanationVisibility: "full",
    notes: "글로벌/대외/고객 상대 role에서만 약한 보조 신호다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: {
      enabled: true,
      allowedTargetJobMajors: ["SALES", "CUSTOMER_OPERATIONS"],
      targetJobLabelKeywords: ["해외", "글로벌", "대외", "고객", "파트너", "영업"],
      weight: "weak",
    },
  },
  {
    canonicalId: "cert:ga4",
    displayLabel: "GA4",
    aliases: ["GA4", "Google Analytics 4", "구글 애널리틱스 4"],
    family: "marketing_analytics",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "marketing_analytics",
    explanationVisibility: "limited",
    notes: "이번 라운드에서는 exact title 분해 전 explanation only로 제한한다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:tax_accounting_lv2",
    displayLabel: "전산세무 2급",
    aliases: ["전산세무 2급", "전산세무2급"],
    family: "accounting_tax",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "accounting_tax",
    explanationVisibility: "full",
    notes: "세무/회계 role 한정 저강도 보조 신호다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "medium" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:fat",
    displayLabel: "FAT",
    aliases: ["FAT", "FAT 1급", "FAT1급", "FAT 2급", "FAT2급"],
    family: "accounting_tax",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "accounting_tax",
    explanationVisibility: "full",
    notes: "회계/세무 family cap을 적용한다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:tact",
    displayLabel: "TAT",
    aliases: ["TAT", "TAT 1급", "TAT1급", "TAT 2급", "TAT2급"],
    family: "accounting_tax",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "accounting_tax",
    explanationVisibility: "full",
    notes: "회계/세무 family cap을 적용한다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:engineer_information_processing",
    displayLabel: "정보처리기사",
    aliases: ["정보처리기사"],
    family: "it_foundation",
    scoreClass: "domain_adjacent",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "it_foundation",
    explanationVisibility: "full",
    notes: "IT/개발 role에서만 field preparation 보조 신호다.",
    axis2: { allowedTargetJobMajors: ["IT_DATA_DIGITAL", "ENGINEERING_DEVELOPMENT"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:sqld",
    displayLabel: "SQLD",
    aliases: ["SQLD", "SQL 개발자"],
    family: "data_analysis",
    scoreClass: "domain_adjacent",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "data_analysis",
    explanationVisibility: "full",
    notes: "데이터/백엔드/DB 연관 role에서만 제한 반영한다.",
    axis2: { allowedTargetJobMajors: ["IT_DATA_DIGITAL", "ENGINEERING_DEVELOPMENT", "RESEARCH_PROFESSIONAL"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:aca",
    displayLabel: "ACA",
    aliases: ["ACA", "Adobe Certified Associate"],
    family: "design_tools",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "design_tools",
    explanationVisibility: "full",
    notes: "디자인 툴 준비도이며 점수는 부여하지 않는다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:web_design_craftsman",
    displayLabel: "웹디자인기능사",
    aliases: ["웹디자인기능사"],
    family: "design_web",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "design_web",
    explanationVisibility: "full",
    notes: "웹디자인 role 한정 설명 신호로만 사용한다.",
    axis2: { allowedTargetJobMajors: ["DESIGN"], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:engineer_bigdata_analysis",
    displayLabel: "빅데이터분석기사",
    aliases: ["빅데이터분석기사"],
    family: "data_analysis",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "data_analysis",
    explanationVisibility: "full",
    notes: "데이터/AI role 한정 저강도 보조 신호다.",
    axis2: { allowedTargetJobMajors: ["IT_DATA_DIGITAL", "RESEARCH_PROFESSIONAL"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:python_generic_placeholder",
    displayLabel: "Python 기반 자격증",
    aliases: ["Python 기반 자격증", "파이썬 자격증", "파이썬 기반 자격증"],
    family: "python_generic",
    scoreClass: "exclude_from_score",
    allowedAxes: [],
    disallowedAxes: ["axis1", "axis2", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "python_generic",
    explanationVisibility: "hidden",
    notes: "broad bucket 금지. exact title registry 전까지 점수/설명에서 제외한다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:credit_analyst_kr",
    displayLabel: "신용분석사",
    aliases: ["신용분석사"],
    family: "finance_industry",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "finance_industry",
    explanationVisibility: "full",
    notes: "금융/신용분석 성격 role에서만 반영한다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "medium" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:investment_asset_manager_kr",
    displayLabel: "투자자산운용사",
    aliases: ["투자자산운용사"],
    family: "finance_industry",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "finance_industry",
    explanationVisibility: "full",
    notes: "금융 role에서만 반영한다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "medium" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:afpk",
    displayLabel: "AFPK",
    aliases: ["AFPK"],
    family: "finance_industry",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "finance_industry",
    explanationVisibility: "full",
    notes: "금융 role 한정 저강도~중간 보조 신호다.",
    axis2: { allowedTargetJobMajors: ["FINANCE_ACCOUNTING"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:cfa_level_1",
    displayLabel: "CFA Level 1",
    aliases: ["CFA Level 1", "CFA 1", "CFA1"],
    family: "finance_industry",
    scoreClass: "explanation_only",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: false,
    duplicateCapGroup: "finance_industry",
    explanationVisibility: "limited",
    notes: "신입 cert-only 과대가산 위험으로 이번 라운드에서는 설명만 허용한다.",
    axis2: { allowedTargetJobMajors: [], weight: "none" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:industrial_safety_engineer",
    displayLabel: "산업안전기사",
    aliases: ["산업안전기사"],
    family: "safety_ehs",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "safety_ehs",
    explanationVisibility: "visible",
    notes: "안전관리·제조·설비 계열 목표에서 현장 안전과 안전관리 체계 이해도를 보조하는 준비 근거.",
    axis2: { allowedTargetJobMajors: ["MANUFACTURING_QUALITY_PRODUCTION", "ENGINEERING_DEVELOPMENT"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:hazardous_materials_industrial_engineer",
    displayLabel: "위험물산업기사",
    aliases: ["위험물산업기사", "위험물 산업기사"],
    family: "chemical_safety",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "chemical_safety",
    explanationVisibility: "visible",
    notes: "화학·제조·에너지·안전관리 계열 목표에서 위험물 취급과 현장 규정 이해도를 보조하는 준비 근거.",
    axis2: { allowedTargetJobMajors: ["MANUFACTURING_QUALITY_PRODUCTION", "ENGINEERING_DEVELOPMENT", "RESEARCH_PROFESSIONAL"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:general_machinery_engineer",
    displayLabel: "일반기계기사",
    aliases: ["일반기계기사"],
    family: "mechanical_engineering",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "mechanical_engineering",
    explanationVisibility: "visible",
    notes: "기계·설비·제조기술 계열 목표에서 기계공학 기반의 분야 준비도를 보조하는 근거.",
    axis2: { allowedTargetJobMajors: ["ENGINEERING_DEVELOPMENT", "MANUFACTURING_QUALITY_PRODUCTION"], weight: "low" },
    axis4: { enabled: false },
  },
  {
    canonicalId: "cert:quality_management_engineer",
    displayLabel: "품질경영기사",
    aliases: ["품질경영기사"],
    family: "quality_management",
    scoreClass: "domain_specific",
    allowedAxes: ["axis2"],
    disallowedAxes: ["axis1", "axis3", "axis4", "axis5"],
    roleGatingRequired: true,
    duplicateCapGroup: "quality_management",
    explanationVisibility: "visible",
    notes: "품질관리·생산관리·제조 운영 계열 목표에서 품질 체계와 공정 관리 이해도를 보조하는 준비 근거.",
    axis2: { allowedTargetJobMajors: ["MANUFACTURING_QUALITY_PRODUCTION"], weight: "low" },
    axis4: { enabled: false },
  },
];

const REGISTRY_BY_ID = new Map(NEWGRAD_CERT_REGISTRY.map((item) => [item.canonicalId, item]));
const REGISTRY_BY_TOKEN = new Map();

for (const entry of NEWGRAD_CERT_REGISTRY) {
  for (const tokenSource of [entry.displayLabel, ...(entry.aliases || [])]) {
    const token = normalizeToken(tokenSource);
    if (!token) continue;
    REGISTRY_BY_TOKEN.set(token, entry);
  }
}

function matchKeyword(text = "", keywords = []) {
  const lower = toStr(text).toLowerCase();
  return keywords.some((keyword) => lower.includes(String(keyword).toLowerCase()));
}

export function getNewgradCertRegistryEntryById(canonicalId = "") {
  return REGISTRY_BY_ID.get(toStr(canonicalId)) || null;
}

export function getNewgradCertRegistryEntryByLabel(rawLabel = "") {
  return REGISTRY_BY_TOKEN.get(normalizeToken(rawLabel)) || null;
}

export function evaluateNewgradCertForTarget(entryOrId, targetJobId = "", targetJobLabel = "") {
  const entry = typeof entryOrId === "string"
    ? getNewgradCertRegistryEntryById(entryOrId)
    : entryOrId;
  if (!entry) {
    return {
      axis2Eligible: false,
      axis2Weight: "none",
      axis2Reason: "registry_missing",
      axis4Eligible: false,
      axis4Weight: "none",
      axis4Reason: "registry_missing",
    };
  }

  const targetMajor = getTargetJobMajor(targetJobId);
  const allowedAxis2Majors = Array.isArray(entry?.axis2?.allowedTargetJobMajors) ? entry.axis2.allowedTargetJobMajors : [];
  const axis2AllowedByMajor = allowedAxis2Majors.length === 0 || allowedAxis2Majors.includes(targetMajor);
  const axis2Eligible =
    entry.allowedAxes.includes("axis2")
    && entry.scoreClass !== "explanation_only"
    && entry.scoreClass !== "exclude_from_score"
    && axis2AllowedByMajor;

  const allowedAxis4Majors = Array.isArray(entry?.axis4?.allowedTargetJobMajors) ? entry.axis4.allowedTargetJobMajors : [];
  const axis4Keywords = Array.isArray(entry?.axis4?.targetJobLabelKeywords) ? entry.axis4.targetJobLabelKeywords : [];
  const axis4Eligible =
    entry.allowedAxes.includes("axis4")
    && entry.scoreClass === "communication_support"
    && (
      allowedAxis4Majors.includes(targetMajor)
      || matchKeyword(targetJobLabel, axis4Keywords)
    );

  return {
    axis2Eligible,
    axis2Weight: axis2Eligible ? toStr(entry?.axis2?.weight) || "low" : "none",
    axis2Reason: axis2Eligible ? "registry_axis2_allowed" : axis2AllowedByMajor ? "registry_score_blocked" : "target_job_gated",
    axis4Eligible,
    axis4Weight: axis4Eligible ? toStr(entry?.axis4?.weight) || "weak" : "none",
    axis4Reason: axis4Eligible ? "registry_axis4_allowed" : "target_job_gated",
  };
}
