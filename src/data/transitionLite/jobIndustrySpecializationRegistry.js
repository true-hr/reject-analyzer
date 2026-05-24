function toStr(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toArr(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function collectSearchText(item) {
  if (!item) return "";
  const parts = [
    item.id,
    item.subcategory,
    item.subVertical,
    item.subSector,
    item.vertical,
    item.majorCategory,
    item.sector,
    item.label,
    item.name,
    item.title,
    item.code,
  ];
  return parts.map(toStr).join(" ").toLowerCase();
}

function includesAny(haystack, needles) {
  if (!haystack) return false;
  const lower = String(haystack).toLowerCase();
  return toArr(needles).some((needle) => {
    const token = toStr(needle).toLowerCase().trim();
    if (!token) return false;
    return lower.includes(token);
  });
}

const NON_TECH_JOB_KEYWORDS = Object.freeze([
  "marketing",
  "digital_marketing",
  "product_planning",
  "merchandising",
  "sales",
  "scm",
  "purchasing",
  "retail",
  "commerce",
  "brand",
  "content",
  "마케팅",
  "상품기획",
  "영업",
  "SCM",
  "구매",
  "유통",
  "커머스",
  "브랜드",
]);

const AUTOMATION_CONTROL_JOB_KEYWORDS = Object.freeze([
  "automation_control",
  "자동제어",
  "설비제어",
  "PLC",
  "시퀀스",
  "제어",
]);

const ELECTRONICS_APPLIANCES_INDUSTRY_KEYWORDS = Object.freeze([
  "electronics_appliances",
  "electronics",
  "appliance",
  "전기전자",
  "가전",
]);

const MANUFACTURING_TECH_JOB_KEYWORDS = Object.freeze([
  "automation_control",
  "production_engineering",
  "process_engineering",
  "equipment_maintenance",
  "quality_control",
  "quality_assurance",
  "electrical_design",
  "circuit_design",
  "mechanical_design",
  "manufacturing_quality_production",
  "engineering_development",
  "설비",
  "자동제어",
  "생산기술",
  "공정기술",
  "설비관리",
  "품질",
  "회로",
  "전장",
  "기구",
]);

const PRECISE_AUTOMATION_ELECTRONICS = Object.freeze({
  key: "automation_control__electronics_appliances",
  summary:
    "전기전자 / 가전 제조 환경에서 설비제어 / 자동제어 직무는 완제품 판매 채널보다 생산설비가 안정적으로 동작하도록 PLC, 시퀀스 로직, 제어반, 센서·액추에이터 인터페이스, 시운전 조건을 맞추는 역할로 읽힙니다.",
  priorityBullets: Object.freeze([
    "PLC와 시퀀스 로직을 기준으로 장비가 의도한 순서와 조건대로 동작하는지 설명할 수 있어야 합니다.",
    "제어반, 배선, 센서·액추에이터 인터페이스처럼 전장/전기설계 경험과 설비제어가 만나는 지점을 앞으로 당겨야 합니다.",
    "시운전, 장비 트러블슈팅, 생산라인 안정화 경험이 있다면 전기전자 / 가전 제조 현장의 설비제어 문맥으로 강하게 연결됩니다.",
    "단순 전기설계 산출물보다 실제 장비 동작 조건, 이상 상황 대응, 제어 로직 수정 경험이 드러나는지가 핵심입니다.",
  ]),
  suppressTerms: Object.freeze([
    "SKU",
    "판촉",
    "유통 채널",
    "리테일 채널",
    "재고 회전",
    "재고 안정성",
    "출시 정합성",
    "마케팅이나 기획",
    "마케팅",
    "상품기획",
    "신제품 런칭",
    "반품률",
  ]),
  customerStructure: Object.freeze({
    short: "설비·제어 운영 현장 중심",
    long: "생산설비, 자동화라인, 장비 운영 부서, 설비 협력사가 함께 맞물리는 현장 중심 구조입니다.",
  }),
});

const MANUFACTURING_TECH_FALLBACK = Object.freeze({
  key: "manufacturing_technical_role__manufacturing",
  summary:
    "제조업에서 이 직무는 유통·채널보다 생산설비, 공정 조건, 장비 안정성, 품질·수율, 라인 운영과 더 직접적으로 연결됩니다.",
  priorityBullets: Object.freeze([
    "생산설비와 공정 조건을 이해하고 실제 라인 운영 문제로 연결해 설명할 수 있어야 합니다.",
    "장비 안정성, 품질·수율, 시운전·트러블슈팅 경험은 제조업 기술직 전환에서 중요한 근거가 됩니다.",
    "기존 경험은 상품이나 채널 성과보다 설비·공정·품질 판단 기준으로 다시 정리하는 편이 좋습니다.",
  ]),
  suppressTerms: Object.freeze([
    "SKU",
    "판촉",
    "유통 채널",
    "리테일 채널",
    "재고 회전",
    "마케팅이나 기획",
    "마케팅",
    "상품기획",
  ]),
  customerStructure: Object.freeze({
    short: "생산·운영 현장 중심",
    long: "생산라인, 설비 운영 조직, 품질·공정 담당자, 협력 장비사가 함께 맞물리는 현장 중심 구조입니다.",
  }),
});

function isNonTechCommercialJob(jobText) {
  return includesAny(jobText, NON_TECH_JOB_KEYWORDS);
}

function isAutomationControlJob(jobText) {
  return includesAny(jobText, AUTOMATION_CONTROL_JOB_KEYWORDS);
}

function isElectronicsAppliancesIndustry(industryText, industrySectorText) {
  if (includesAny(industryText, ELECTRONICS_APPLIANCES_INDUSTRY_KEYWORDS)) return true;
  return includesAny(industrySectorText, ELECTRONICS_APPLIANCES_INDUSTRY_KEYWORDS);
}

function isManufacturingSector(industryItem) {
  const sector = toStr(industryItem?.sector).toUpperCase().trim();
  if (sector === "MANUFACTURING") return true;
  const text = collectSearchText(industryItem);
  return /\bmanufacturing\b/.test(text) || text.includes("제조");
}

function isManufacturingTechJob(jobText) {
  return includesAny(jobText, MANUFACTURING_TECH_JOB_KEYWORDS);
}

export function getJobIndustrySpecialization(options = {}) {
  const targetJobItem = options?.targetJobItem || null;
  const targetIndustryItem = options?.targetIndustryItem || null;
  if (!targetJobItem || !targetIndustryItem) return null;

  const jobText = collectSearchText(targetJobItem);
  const industryText = collectSearchText(targetIndustryItem);
  const industrySectorText = toStr(targetIndustryItem?.sector).toLowerCase();

  if (!jobText || !industryText) return null;

  if (isNonTechCommercialJob(jobText)) return null;

  if (
    isAutomationControlJob(jobText) &&
    isElectronicsAppliancesIndustry(industryText, industrySectorText)
  ) {
    return PRECISE_AUTOMATION_ELECTRONICS;
  }

  if (isManufacturingSector(targetIndustryItem) && isManufacturingTechJob(jobText)) {
    return MANUFACTURING_TECH_FALLBACK;
  }

  return null;
}
