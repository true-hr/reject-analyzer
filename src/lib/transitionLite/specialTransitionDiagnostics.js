// @MX:NOTE: read-only pure rule layer — source→target 특수 전환 diagnostic.
// @MX:NOTE: score/gate/classification 변경 없음. topRisks append 전용.

function normalizeText(value) {
  return String(value ?? "").toLowerCase().trim();
}

function toTexts(value) {
  if (!value) return [];
  if (typeof value === "string") return [normalizeText(value)];
  if (Array.isArray(value)) return value.flatMap((v) => toTexts(v));
  return [];
}

function collectJobTexts(item) {
  return [
    ...toTexts(item?.label),
    ...toTexts(item?.aliases),
    ...toTexts(item?.id),
    ...toTexts(item?.vertical ?? item?.majorCategory),
    ...toTexts(item?.subVertical ?? item?.subcategory),
  ];
}

function collectIndustryTexts(item) {
  return [
    ...toTexts(item?.label),
    ...toTexts(item?.aliases),
    ...toTexts(item?.id),
    ...toTexts(item?.sector),
    ...toTexts(item?.subSector),
  ];
}

function hasAnyKeyword(texts, keywords) {
  const normKws = keywords.map(normalizeText);
  return normKws.some((kw) => texts.some((t) => t.includes(kw)));
}

// Returns true if item matches spec. No spec = always true.
function matchJob(item, spec) {
  if (!spec) return true;
  if (!item) return false;

  if (spec.subVerticals?.length) {
    const sv = normalizeText(item.subVertical ?? item.subcategory ?? "");
    if (spec.subVerticals.map(normalizeText).includes(sv)) return true;
  }

  if (spec.verticals?.length) {
    const v = normalizeText(item.vertical ?? item.majorCategory ?? "");
    if (spec.verticals.map(normalizeText).includes(v)) return true;
  }

  if (spec.textIncludes?.length) {
    if (hasAnyKeyword(collectJobTexts(item), spec.textIncludes)) return true;
  }

  return false;
}

// Returns true if item matches spec. No spec = always true.
function matchIndustry(item, spec) {
  if (!spec) return true;
  if (!item) return false;

  if (spec.sectors?.length) {
    const s = normalizeText(item.sector ?? "");
    if (spec.sectors.map(normalizeText).includes(s)) return true;
  }

  if (spec.subSectors?.length) {
    const ss = normalizeText(item.subSector ?? "");
    if (spec.subSectors.map(normalizeText).includes(ss)) return true;
  }

  if (spec.textIncludes?.length) {
    if (hasAnyKeyword(collectIndustryTexts(item), spec.textIncludes)) return true;
  }

  return false;
}

function applyRule(rule, ctx) {
  const { currentJobItem, targetJobItem, currentIndustryItem, targetIndustryItem } = ctx;

  const srcJobOk = matchJob(currentJobItem, rule.source?.job ?? null);
  const srcIndOk = matchIndustry(currentIndustryItem, rule.source?.industry ?? null);
  const tgtJobOk = matchJob(targetJobItem, rule.target?.job ?? null);
  const tgtIndOk = matchIndustry(targetIndustryItem, rule.target?.industry ?? null);

  if (!srcJobOk || !srcIndOk || !tgtJobOk || !tgtIndOk) return false;

  // Guard: don't fire if current industry is already in the target regulated sector
  if (rule.guardSrcNotInTargetSector && rule.target?.industry) {
    if (matchIndustry(currentIndustryItem, rule.target.industry)) return false;
  }

  return true;
}

// @MX:ANCHOR: P0 special transition rule definitions — do not add score/gate logic here.
// @MX:REASON: read-only SSOT. Rules are matched against resolved job/industry items from buildTransitionLiteResult.
const RULES = [
  {
    id: "SPECIAL_B2C_CS_TO_B2B_CSM",
    priority: 100,
    severity: "high",
    source: {
      job: { subVerticals: ["CUSTOMER_SUPPORT_CS"] },
    },
    target: {
      job: { subVerticals: ["CUSTOMER_SUCCESS"] },
    },
    title: "고객응대 경험은 도움이 되지만, CSM은 '계정 성과 관리'까지 봅니다",
    body: "고객 상담이나 VOC 대응 경험은 CSM 직무로 연결해서 설명할 수 있습니다. 다만 B2B CSM은 문의를 잘 처리한 경험보다 고객사의 사용률, 재계약, 이탈 방지, 추가 도입까지 관리한 경험을 더 중요하게 봅니다. 이직 서류에서는 \"고객을 응대한 경험\"보다 \"고객사가 계속 쓰도록 만든 경험\"이 드러나면 더 설득력이 높아집니다.",
  },
  {
    id: "SPECIAL_MFG_QA_TO_IT_QA_SQA",
    priority: 90,
    severity: "high",
    source: {
      job: { subVerticals: ["QUALITY_ASSURANCE_QA"] },
    },
    target: {
      job: { subVerticals: ["QA_TEST_AUTOMATION"] },
    },
    title: "QA 경험은 연결되지만, IT QA는 검증 방식이 다릅니다",
    body: "품질관리나 품질보증 경험은 꼼꼼함, 기준 준수, 문제 발견 역량으로 연결해서 설명할 수 있습니다. 다만 IT QA/SQA는 제품 불량을 보는 것보다 소프트웨어 오류를 재현하고, 테스트 케이스를 만들고, 개발 과정에서 이슈를 추적하는 방식이 중요합니다. 지원 직무와 더 직접적으로 연결되려면 테스트 설계, 이슈 관리 도구, 개발팀 협업 경험이 드러나는지 확인해야 합니다.",
  },
  {
    id: "SPECIAL_MFG_QA_TO_REGULATED_QA_RA",
    priority: 80,
    severity: "high",
    source: {
      job: { subVerticals: ["QUALITY_ASSURANCE_QA"] },
      industry: { sectors: ["MANUFACTURING"] },
    },
    target: {
      job: { subVerticals: ["QUALITY_ASSURANCE_QA", "REGULATORY_AFFAIRS"] },
      industry: { sectors: ["HEALTHCARE_PHARMA_BIO"] },
    },
    guardSrcNotInTargetSector: true,
    title: "품질 경험은 강점이지만, 의료·제약 분야는 규제 기준을 따로 봅니다",
    body: "일반 제조업에서의 품질 경험은 의료기기·제약 QA/RA 직무로 연결해서 설명할 수 있습니다. 다만 이 분야는 품질관리 경험 자체뿐 아니라 GMP, ISO13485, 밸리데이션, 인허가 문서, 감사 대응처럼 산업별 규제 기준을 다룬 경험이 중요합니다. 서류에서는 \"품질을 관리했다\"보다 \"규정과 인증 기준에 맞춰 품질을 관리했다\"는 점이 드러나야 더 설득력이 높아집니다.",
  },
  {
    id: "SPECIAL_SALES_OPS_TO_STRATEGY_PLANNING",
    priority: 70,
    severity: "high",
    source: {
      job: { subVerticals: ["SALES_OPERATIONS", "OPERATIONS_MANAGEMENT"] },
    },
    target: {
      job: { subVerticals: ["BUSINESS_PLANNING", "STRATEGY"] },
    },
    title: "운영·실행 경험은 기획으로 연결되지만, 의사결정용 산출물이 중요합니다",
    body: "영업관리나 운영관리 경험은 수치 관리, 실행 조율, 프로세스 개선 경험으로 기획 직무와 연결해서 설명할 수 있습니다. 다만 사업기획이나 전략기획에서는 단순히 운영을 잘한 경험보다 문제를 정의하고, 선택지를 비교하고, 의사결정에 필요한 근거를 정리한 경험을 더 중요하게 봅니다. 서류에서는 실적 관리 자체보다 \"무엇을 판단했고, 어떤 기준으로 방향을 제안했는지\"가 드러나면 더 설득력이 높아집니다.",
  },
  {
    id: "SPECIAL_OPS_TO_MANUFACTURING_SCM_EHS",
    priority: 60,
    severity: "high",
    source: {
      job: { subVerticals: ["OPERATIONS_MANAGEMENT"] },
    },
    target: {
      job: { subVerticals: ["PRODUCTION_MANAGEMENT", "DEMAND_SUPPLY_PLANNING", "ENVIRONMENT_HEALTH_SAFETY"] },
    },
    title: "운영 경험은 연결되지만, 생산·SCM·안전은 현장 맥락을 함께 봅니다",
    body: "일반 운영 경험은 일정 관리, 프로세스 정리, 이슈 대응 역량으로 연결해서 설명할 수 있습니다. 다만 생산관리, SCM, 안전관리 직무는 사무적 운영보다 현장 제약, 납기와 재고, 공급망 조율, 안전 기준을 함께 이해했는지가 중요합니다. 서류에서는 운영을 지원한 경험보다 \"현장 조건을 고려해 일정·품질·리스크를 조율한 경험\"이 드러나면 더 설득력이 높아집니다.",
  },
  {
    id: "SPECIAL_BUSINESS_SUPPORT_TO_ACCOUNTING_TAX",
    priority: 50,
    severity: "high",
    source: {
      job: { subVerticals: ["BUSINESS_SUPPORT"] },
    },
    target: {
      job: { subVerticals: ["ACCOUNTING", "TAX"] },
    },
    title: "숫자·문서 경험은 도움이 되지만, 회계·세무는 기준 적용을 봅니다",
    body: "재무 지원이나 사무 경험은 숫자를 다루고 문서를 정확히 처리한 경험으로 회계·세무 직무와 연결해서 설명할 수 있습니다. 다만 회계·세무에서는 단순 정리 업무보다 전표 처리, 결산, 세법 적용, 신고처럼 기준에 맞게 판단하고 처리한 경험이 중요합니다. 서류에서는 \"숫자 업무를 했다\"보다 \"회계 기준이나 세무 기준에 맞춰 처리했다\"는 점이 드러나면 더 설득력이 높아집니다.",
  },
  // @MX:NOTE: P1 rules — channel/retail sales → solution/B2B sales; performance/CRM marketing → PMM
  {
    id: "SPECIAL_CHANNEL_SALES_TO_SOLUTION_SALES",
    priority: 40,
    severity: "high",
    source: {
      job: { subVerticals: ["PARTNER_CHANNEL_SALES", "B2C_SALES"] },
    },
    target: {
      job: { subVerticals: ["SOLUTION_SALES", "B2B_SALES"] },
    },
    title: "영업 경험은 연결되지만, 솔루션 영업은 판매 방식이 다릅니다",
    body: "유통영업이나 채널영업 경험은 고객을 설득하고 매출을 만든 경험으로 연결해서 설명할 수 있습니다. 다만 SaaS·솔루션 영업은 상품을 판매한 경험보다 고객의 문제를 진단하고, 데모나 제안으로 의사결정자를 설득하고, 장기 계약으로 이어지게 만든 경험을 더 중요하게 봅니다. 서류에서는 \"얼마나 팔았는지\"뿐 아니라 \"고객 문제를 어떻게 파악하고 어떤 제안으로 계약을 만들었는지\"가 드러나면 더 설득력이 높아집니다.",
  },
  {
    id: "SPECIAL_PERFORMANCE_MARKETING_TO_PMM",
    priority: 30,
    severity: "high",
    source: {
      job: { subVerticals: ["PERFORMANCE_MARKETING", "CRM_MARKETING"] },
    },
    target: {
      job: { subVerticals: ["PRODUCT_MARKETING_PMM"] },
    },
    title: "마케팅 경험은 연결되지만, PMM은 제품 메시지와 출시 전략을 봅니다",
    body: "퍼포먼스 마케팅이나 CRM 운영 경험은 고객 반응을 읽고 캠페인을 개선한 경험으로 PMM 직무와 연결해서 설명할 수 있습니다. 다만 PMM은 광고 성과를 관리한 경험보다 제품의 강점을 어떤 고객에게 어떤 메시지로 전달할지 정리하고, 출시와 세일즈 자료까지 연결한 경험을 더 중요하게 봅니다. 서류에서는 \"캠페인을 운영했다\"보다 \"제품의 가치를 어떻게 정의하고 시장에 전달했는지\"가 드러나면 더 설득력이 높아집니다.",
  },
  {
    id: "SPECIAL_DOC_ADMIN_TO_RA",
    priority: 25,
    severity: "high",
    source: {
      job: { subVerticals: ["DOCUMENT_ADMIN_SUPPORT"] },
    },
    target: {
      job: { subVerticals: ["REGULATORY_AFFAIRS"] },
    },
    title: "문서 처리 경험은 연결되지만, RA/인증은 규제 기준 적용을 봅니다",
    body: "문서관리나 사무지원 경험은 절차를 지키고 문서를 정확하게 관리한 경험으로 RA/인증 직무와 연결해서 설명할 수 있습니다. 다만 RA/인증은 단순 문서 처리보다 규제기관 제출 요건, 인증 기준, 허가 경로를 이해하고 적용한 경험을 더 중요하게 봅니다. 서류에서는 \"문서를 처리했다\"보다 \"규정이나 인증 기준에 맞춰 문서를 관리했다\"는 점이 드러나면 더 설득력이 높아집니다.",
  },
];

// @MX:ANCHOR: findSpecialTransitionDiagnostics — called from buildTransitionLiteResult after resolved items are confirmed.
// @MX:REASON: safe entry point; returns [] on any failure; never throws.
export function findSpecialTransitionDiagnostics({
  currentJobItem,
  targetJobItem,
  currentIndustryItem,
  targetIndustryItem,
  classification,
} = {}) {
  if (!currentJobItem || !targetJobItem) return [];
  try {
    const ctx = { currentJobItem, targetJobItem, currentIndustryItem, targetIndustryItem, classification };
    return RULES
      .filter((rule) => applyRule(rule, ctx))
      .sort((a, b) => b.priority - a.priority);
  } catch {
    return [];
  }
}
