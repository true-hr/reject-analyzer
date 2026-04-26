// src/data/transitionLite/axisExplanationRegistry.js
// Explanation producer for transition-lite axis details.
//
// CONTRACT:
//   Producer generates explanation payload.
//   Consumer (UI) only renders — no score interpretation allowed in UI.
//
// Shape:
//   explanation: {
//     available: boolean,
//     summary: string,
//     positives: string[],
//     gaps: string[],
//     reasons: Array<{ code: string, label: string, direction: "positive" | "negative" | "neutral" }>,
//     detailVersion: string,
//   }

const DETAIL_VERSION = "1.0";

const CERT_FAMILY_DOMAIN_NOTE = {
  SQLD: "데이터/DB 계열",
  ADsP: "데이터/분석 계열",
  빅데이터분석기사: "데이터/AI 계열",
  정보처리기사: "IT/개발 계열",
  "전산세무 2급": "세무/회계 계열",
  "전산회계 1급": "회계/재무 계열",
  FAT: "회계/세무 계열",
  TAT: "세무/회계 계열",
  신용분석사: "금융/신용분석 계열",
  투자자산운용사: "금융 계열",
  AFPK: "금융/자산관리 계열",
  산업안전기사: "안전관리/제조/설비 계열",
  위험물산업기사: "화학/제조/에너지/안전관리 계열",
  일반기계기사: "기계/설비/제조기술 계열",
  품질경영기사: "품질관리/생산관리/제조 운영 계열",
  대기환경기사: "환경안전/제조/공정/연구 계열",
  수질환경기사: "환경안전/제조/공정/연구 계열",
  설비보전기사: "제조/설비/유지보수 계열",
  공조냉동기계기사: "기계/설비/유틸리티 계열",
  전기기사: "전기/설비/제조기술 계열",
};

function buildCertAlignedLabel(certLabels = [], certDirectCount = 0) {
  if (certLabels.length === 1) {
    const name = certLabels[0];
    const domain = CERT_FAMILY_DOMAIN_NOTE[name];
    if (domain) return `${name}은(는) ${domain} 직무 이해도를 보조하는 준비 근거로 반영했습니다.`;
  }
  return `자격증 ${certLabels.join(", ")}${certDirectCount > 1 ? ` 등 ${certDirectCount}건` : ""}이 목표 분야 준비도를 보완하는 근거로 읽혔습니다.`;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeExplanation(summary, positives, gaps, reasons, extra = {}) {
  return {
    available: true,
    summary,
    positives,
    gaps,
    reasons,
    detailVersion: DETAIL_VERSION,
    ...extra,
  };
}

function hasProducerExplanationCoverage(summary, positives = [], gaps = [], extra = {}) {
  if (typeof summary === "string" && summary.trim()) return true;
  if (Array.isArray(positives) && positives.some((item) => String(item || "").trim())) return true;
  if (Array.isArray(gaps) && gaps.some((item) => String(item || "").trim())) return true;
  if (typeof extra?.experienceSupportLine === "string" && extra.experienceSupportLine.trim()) return true;
  if (typeof extra?.selfReportSupportLine === "string" && extra.selfReportSupportLine.trim()) return true;
  if (Array.isArray(extra?.experienceHighlights) && extra.experienceHighlights.some((item) => String(item || "").trim())) return true;
  if (Array.isArray(extra?.selfReportHighlights) && extra.selfReportHighlights.some((item) => String(item || "").trim())) return true;
  if (typeof extra?.lead === "string" && extra.lead.trim()) return true;
  if (typeof extra?.criteria === "string" && extra.criteria.trim()) return true;
  if (typeof extra?.scoreReason === "string" && extra.scoreReason.trim()) return true;
  if (typeof extra?.liftOrLimit === "string" && extra.liftOrLimit.trim()) return true;
  return false;
}

function pickExperienceExplanationExtra(signals) {
  const experienceSupportLine = typeof signals?.experienceSupportLine === "string"
    ? signals.experienceSupportLine.trim()
    : "";
  const experienceReason = typeof signals?.experienceReason === "string"
    ? signals.experienceReason.trim()
    : "";
  const experienceHighlights = Array.isArray(signals?.experienceHighlights)
    ? signals.experienceHighlights.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    ...(experienceSupportLine ? { experienceSupportLine } : {}),
    ...(experienceReason ? { experienceReason } : {}),
    ...(experienceHighlights.length > 0 ? { experienceHighlights } : {}),
  };
}

const NEWGRAD_SLOT_VERSION = "newgrad-4-slot-v1";

const NEWGRAD_CRITERIA_LAYER_A = {
  axis1: "이 축은 전공이 목표 직무의 핵심 역할과 얼마나 직접 연결되는지를 봅니다.",
  axis2: "이 축은 목표 산업의 업무 맥락과 연결되는 evidence가 얼마나 직접적이고 반복적인지를 봅니다.",
  axis3: "이 축은 프로젝트·인턴·대외활동·아르바이트 등 전공 외 경험이 얼마나 폭넓고 결과·지속성을 갖추는지를 봅니다.",
  axis4: "이 축은 누구와 어떤 접점에서 얼마나 직접적으로 상호작용했는지를 봅니다.",
  axis5: "이 축은 strengths/workstyle이 직무 요구와 얼마나 맞고 경험과 얼마나 정합적인지를 봅니다.",
};

const NEWGRAD_CRITERIA_FALLBACK_LAYER_B = {
  axis1: "이번 케이스에서는 전공 연결 단서를 중심으로 봤습니다.",
  axis2: "이번 케이스에서는 산업 맥락이 드러난 경험과 관련 신호를 함께 봤습니다.",
  axis3: "이번 케이스에서는 전공 외 경험 자산의 폭·결과·지속성 단서를 함께 봤습니다.",
  axis4: "이번 케이스에서는 이해관계자 접점과 소통 맥락 단서를 함께 봤습니다.",
  axis5: "이번 케이스에서는 자기보고 강점과 일하는 방식 신호를 함께 봤습니다.",
};

const NEWGRAD_LIMITING_DEFAULTS = {
  axis1: "전공과 직무의 연결을 뒷받침하는 수업·과제·학습 기반 설명이 더 보강되어야 상위 점수로 안정적으로 이어집니다.",
  axis2: "목표 산업과 직접 맞닿는 실무 또는 자격 신호가 더 반복적으로 확인되어야 상위 점수로 이어집니다.",
  axis3: "전공 외 경험의 폭이 넓어지고 결과·지속성이 함께 드러나야 상위 점수로 이어집니다.",
  axis4: "목표 직무에서 중요한 이해관계자와의 직접 소통 근거가 더 분명해져야 상위 점수로 이어집니다.",
  axis5: "자기보고만으로는 한계가 있어, 실제 경험에서 확인되는 observed behavior support가 함께 보여야 합니다.",
};

const NEWGRAD_LIFT_DEFAULTS = {
  axis1: "전공과 직무의 연결을 설명하는 수업·과제·학습 기반이 더 또렷해지면 이 축이 더 올라갈 수 있습니다.",
  axis2: "목표 산업과 직접 연결되는 실무 경험이나 관련 자격 신호가 추가되면 이 축이 더 올라갈 수 있습니다.",
  axis3: "전공 외 경험이 더 다양해지거나, 결과·지속성이 분명한 항목이 추가되면 이 축이 더 올라갈 수 있습니다.",
  axis4: "목표 직무에서 중요한 이해관계자와의 직접 상호작용 경험이 더 분명해지면 이 축이 더 올라갈 수 있습니다.",
  axis5: "직무와 맞는 강점이 실제 경험 사례와 함께 연결되면 이 축이 더 올라갈 수 있습니다.",
};

const NEWGRAD_LIMIT_DEFAULTS = {
  axis1: "현재 구조에서는 전공과 직무를 연결하는 수업·과제·학습 기반 설명이 보강되지 않으면 상위 점수로의 상승에는 한계가 있습니다.",
  axis2: "현재 구조에서는 산업 맥락이 단일 경로에 머물러 있어, 반복적이고 직접적인 산업 근거가 함께 필요합니다.",
  axis3: "현재 구조에서는 경험 폭이 좁거나 결과·지속성 근거가 부족하면 상위 점수로의 상승에는 한계가 있습니다.",
  axis4: "현재 구조에서는 직접적인 이해관계자 접점이 더 분명해지지 않으면 상위 점수로의 상승에는 한계가 있습니다.",
  axis5: "Axis5는 자기보고만으로 상위 점수를 확신하기 어렵고, observed behavior support가 함께 필요합니다.",
};

function toTrimmedTextArray(items, limit = 4) {
  return Array.isArray(items)
    ? items.map((item) => String(item || "").trim()).filter(Boolean).slice(0, limit)
    : [];
}

function normalizeSentence(text, fallback = "") {
  const value = typeof text === "string" ? text.trim() : "";
  return value || fallback;
}

function joinLabels(items = []) {
  const labels = toTrimmedTextArray(items, 3);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]}, ${labels[1]}`;
  return `${labels[0]}, ${labels[1]} 외`;
}

function pickReasonLabel(reasons, direction) {
  const match = Array.isArray(reasons)
    ? reasons.find((reason) => reason?.direction === direction && typeof reason?.label === "string" && reason.label.trim())
    : null;
  return match?.label?.trim() || "";
}

function sanitizeDynamicLabel(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  if (text.includes("[") && text.includes("]")) return "";
  if (text === "null" || text === "undefined") return "";
  return text;
}

function toSafeFirstLabel(items) {
  if (!Array.isArray(items) || items.length === 0) return "";
  return sanitizeDynamicLabel(String(items[0] || ""));
}

const MISSION_TYPE_KO_LABEL = {
  operate: "운영 실행 중심",
  plan: "기획 설계 중심",
  drive_business: "성과·매출 추진 중심",
  analyze: "분석·판단 중심",
  support_business: "업무 지원 중심",
  build_technical: "기술 구현 중심",
  create_design: "창작·디자인 중심",
  control_risk: "리스크 통제 중심",
  select_people: "인재 선발 중심",
  develop_people: "인재 육성 중심",
};

const SUCCESS_METRIC_TYPE_KO_LABEL = {
  speed_volume: "빠르게 처리하는 양적 성과",
  quality_accuracy: "정확하게 완수하는 성과",
  growth_effectiveness: "성과를 키우는 성장 지표",
  revenue_result: "전환·매출 성과",
  stability_compliance: "안정적으로 유지하는 성과",
  strategy_alignment: "전략 방향과의 정합성",
  delivery_completion: "기한 내 납품·완료 성과",
};

const CUSTOMER_MARKET_KO_LABEL = {
  B2B: "기업 고객",
  B2C: "일반 소비자",
  B2G: "공공·기관",
  B2B_B2G_MIXED: "기업·기관 고객",
  B2B_B2C_MIXED: "기업·소비자 혼합",
  B2G_B2C_MIXED: "기관·소비자 혼합",
};

const RESPONSIBILITY_SHIFT_KO_ROLE_LABEL = {
  similar: {
    current: "목표 직무와 비슷한 수준의 역할",
    target: "현재와 비슷한 수준의 역할",
  },
  down_or_narrower: {
    current: "더 넓은 범위의 역할",
    target: "현재보다 좁혀진 역할 범위",
  },
  slightly_up: {
    current: "현재 역할 수준",
    target: "소폭 더 넓은 책임 범위",
  },
  meaningfully_up: {
    current: "현재 역할 수준",
    target: "크게 확장된 책임과 조율 구조",
  },
};

function buildAxis5DynamicSummary(
  band,
  currentMissionType,
  targetMissionType,
  currentSuccessMetricType,
  targetSuccessMetricType,
  missionTypeMatch
) {
  const currentMissionLabel = sanitizeDynamicLabel(MISSION_TYPE_KO_LABEL[currentMissionType]);
  const targetMissionLabel = sanitizeDynamicLabel(MISSION_TYPE_KO_LABEL[targetMissionType]);
  const currentMetricLabel = sanitizeDynamicLabel(SUCCESS_METRIC_TYPE_KO_LABEL[currentSuccessMetricType]);
  const targetMetricLabel = sanitizeDynamicLabel(SUCCESS_METRIC_TYPE_KO_LABEL[targetSuccessMetricType]);

  if (!currentMissionLabel || !targetMissionLabel) return "";

  const currentMetricText = currentMetricLabel || "지금까지 강점이 드러나던 방식";
  const targetMetricText = targetMetricLabel || "목표 직무에서 더 중요하게 보는 성과 방식";

  switch (band) {
    case "very_low":
      return `현재 직무의 업무 스타일은 ${currentMissionLabel} 중심이고, 강점도 ${currentMetricText} 쪽에서 드러나는 편입니다. 목표 직무는 ${targetMissionLabel}과 ${targetMetricText}을 더 중요하게 보는 역할입니다. 즉, 일을 푸는 방식과 성과가 드러나는 방식이 서로 다른 방향에 가깝습니다. 그래서 현재 강점 구조를 그대로 가져가기는 어려워 매우 낮게 평가됐습니다.`;
    case "low":
      return `현재 직무는 ${currentMissionLabel} 중심의 일이고, 목표 직무는 ${targetMissionLabel} 비중이 더 큽니다. 일부 공통점은 있지만, 실제로 강점이 드러나는 방식은 ${currentMetricText}과 ${targetMetricText}처럼 차이가 남아 있습니다. 그래서 일하는 방식이 일부만 이어져 낮게 평가됐습니다.`;
    case "mid":
      return `현재 직무와 목표 직무는 업무 스타일에서 겹치는 부분도 있고 다른 부분도 함께 보입니다. 성과를 내는 방식이나 일의 리듬은 ${currentMetricText}과 ${targetMetricText}처럼 차이가 있습니다. 그래서 완전히 낯선 방향은 아니지만 추가 적응이 필요한 상태로 보여 보통으로 평가됐습니다.`;
    case "mid_high":
      return `현재 직무의 업무 스타일은 ${currentMissionLabel} 중심이고, 강점도 ${currentMetricText}에서 잘 드러납니다. 목표 직무도 비슷한 업무 스타일과 성과 방식을 중요하게 보는 역할입니다. 문제를 푸는 방식, 협업하는 방식, 강점이 살아나는 구조가 꽤 이어져 높게 평가됐습니다.`;
    case "high":
      return `현재 직무의 업무 스타일은 ${currentMissionLabel} 중심이고, 강점이 드러나는 방식도 ${currentMetricText}에 가깝습니다. 목표 직무도 ${targetMissionLabel}과 ${targetMetricText}을 핵심으로 보는 역할입니다. 즉, 일하는 방식과 성과를 내는 방식이 거의 직접적으로 이어집니다. 그래서 지금까지의 업무 스타일과 강점을 목표 직무에서도 그대로 강점으로 설명할 수 있어 매우 높게 평가됐습니다.`;
    default:
      if (missionTypeMatch === true) {
        return `현재 직무의 업무 스타일은 ${currentMissionLabel} 중심이고, 목표 직무도 비슷한 방식으로 성과를 보는 역할입니다. 그래서 일하는 방식이 비교적 자연스럽게 이어지는 편으로 읽힙니다.`;
      }
      return `현재 직무는 ${currentMissionLabel} 중심이고 목표 직무는 ${targetMissionLabel} 비중이 더 큽니다. 그래서 일하는 방식의 차이를 함께 설명할 필요가 있습니다.`;
  }
}

function buildAxis1DynamicSummary(band, currentJobLabel, targetJobLabel) {
  const currentLabel = sanitizeDynamicLabel(currentJobLabel);
  const targetLabel = sanitizeDynamicLabel(targetJobLabel);

  if (!currentLabel || !targetLabel) return "";

  switch (band) {
    case "very_low":
      return `현재 ${currentLabel}과 목표 직무인 ${targetLabel}은 실제로 주로 하게 되는 일이 많이 다르게 읽힙니다. 겹치는 핵심 업무 신호도 거의 없어, 지금 경험을 목표 직무의 대표 업무로 바로 설명하기 어려워 매우 낮게 평가됐습니다.`;
    case "low":
      return `현재 ${currentLabel}과 목표 직무인 ${targetLabel}은 일부 닿는 부분은 있지만, 실제로 핵심이라고 보는 일이 다르게 읽힙니다. 겹치는 포인트는 있어도 목표 직무의 중심 업무를 직접 해온 흐름으로는 제한적으로 보여 낮게 평가됐습니다.`;
    case "mid":
      return `현재 ${currentLabel}과 목표 직무인 ${targetLabel}은 공통 업무도 있지만 차이 나는 핵심 업무도 함께 보입니다. 그래서 연결점은 있으나 완전히 같은 직무 흐름으로 보기는 어려워 보통으로 평가됐습니다.`;
    case "mid_high":
      return `현재 ${currentLabel}과 목표 직무인 ${targetLabel}은 실제로 겹치는 핵심 업무가 여러 개 보입니다. 주로 하게 되는 일의 방향도 꽤 가깝기 때문에 목표 직무와 자연스럽게 연결되는 편으로 읽혀 높게 평가됐습니다.`;
    case "high":
      return `현재 ${currentLabel}과 목표 직무인 ${targetLabel}은 겹치는 핵심 업무가 많고, 실제로 주로 하게 되는 일도 거의 같은 방향으로 읽힙니다. 그래서 지금 경험을 목표 직무의 대표 강점으로 바로 설명할 수 있는 수준이라 매우 높게 평가됐습니다.`;
    default:
      return "";
  }
}

function buildAxis4DynamicSummary(band, currentCustomerMarket, targetCustomerMarket) {
  const currentCustomerLabel = sanitizeDynamicLabel(CUSTOMER_MARKET_KO_LABEL[currentCustomerMarket]);
  const targetCustomerLabel = sanitizeDynamicLabel(CUSTOMER_MARKET_KO_LABEL[targetCustomerMarket]);

  if (!currentCustomerLabel || !targetCustomerLabel) return "";

  switch (band) {
    case "very_low":
      return `현재 직무는 주로 ${currentCustomerLabel}을 상대하는 환경에서 쌓인 경험이고, 목표 직무는 ${targetCustomerLabel}을 중심으로 움직이는 역할입니다. 상대하는 대상이 달라지면서 커뮤니케이션 방식, 설득 방식, 의사결정 구조도 함께 달라집니다. 그래서 고객 유형 차이가 커 바로 이어지기 어렵다고 판단돼 매우 낮게 평가됐습니다.`;
    case "low":
      return `현재 직무 경험 안에도 일부 비슷한 대상은 있을 수 있지만, 중심이 되는 고객은 ${currentCustomerLabel}에 더 가깝고 목표 직무는 ${targetCustomerLabel} 비중이 더 큽니다. 즉, 누구를 상대로 설명하고 조율해왔는지에서 차이가 남아 있습니다. 그래서 사람을 상대하는 맥락이 바로 이어지기 어려워 낮게 평가됐습니다.`;
    case "mid":
      return "현재 직무와 목표 직무는 상대하는 고객 유형이 완전히 다르지는 않습니다. 다만 중심이 되는 고객과 의사결정 구조에는 차이가 있어, 커뮤니케이션 방식을 그대로 옮기기에는 적응이 필요합니다. 그래서 일부 연결은 되지만 완전한 동일 맥락은 아니라고 판단돼 보통으로 평가됐습니다.";
    case "mid_high":
      return `현재 직무도 ${currentCustomerLabel}을 주로 상대해왔고, 목표 직무 역시 비슷한 고객 유형을 다루는 역할입니다. 고객을 이해하고 설명하고 조율하는 방식이 꽤 이어지며, 사람을 상대하는 기본 맥락도 가깝습니다. 그래서 고객 유형 연결성이 높다고 판단돼 높게 평가됐습니다.`;
    case "high":
      return `현재 직무는 ${currentCustomerLabel}을 상대하며 설득하고 조율해온 경험이 중심이고, 목표 직무도 거의 같은 고객 유형을 다룹니다. 상대하는 대상, 커뮤니케이션 방식, 관계 조율 구조가 직접적으로 이어집니다. 그래서 지금까지의 고객 대응 경험을 목표 직무에서도 그대로 활용할 수 있어 매우 높게 평가됐습니다.`;
    default:
      return "";
  }
}

function buildAxis3RebalancedSummary(band, responsibilityShift, currentJobLabel, targetJobLabel) {
  const roleLabels = responsibilityShift ? RESPONSIBILITY_SHIFT_KO_ROLE_LABEL[responsibilityShift] : null;
  const currentRoleLabel = sanitizeDynamicLabel(roleLabels?.current);
  const targetRoleLabel = sanitizeDynamicLabel(roleLabels?.target);
  const currentLabel = sanitizeDynamicLabel(currentJobLabel);
  const targetLabel = sanitizeDynamicLabel(targetJobLabel);

  if (currentLabel && targetLabel && currentRoleLabel && targetRoleLabel) {
    switch (band) {
      case "very_low":
        return `현재 ${currentLabel}에서 맡아온 역할 범위는 ${currentRoleLabel} 수준으로 읽히고, 목표 직무인 ${targetLabel}은 ${targetRoleLabel} 수준의 책임을 요구합니다. 현재 경험에서는 목표 직무 수준의 책임 범위를 직접 맡아본 흐름이 거의 드러나지 않아 매우 낮게 평가됐습니다.`;
      case "low":
        return `현재 ${currentLabel} 경험 안에도 연결될 만한 역할은 일부 보이지만, 전반적인 책임 범위는 아직 ${targetRoleLabel}보다 좁게 읽힙니다. 즉, 일부 업무는 닿아도 어디까지 주도했는지 기준에서는 차이가 남아 있어 낮게 평가됐습니다.`;
      case "mid":
        return `현재 ${currentLabel}에서 맡아온 역할은 목표 직무인 ${targetLabel}과 어느 정도 연결됩니다. 다만 ${currentRoleLabel}와 ${targetRoleLabel} 사이에는 아직 일부 간격이 있어, 연결 가능성은 있으나 추가 증명이 필요한 상태로 보여 보통으로 평가됐습니다.`;
      case "mid_high":
        return `현재 ${currentLabel}에서 맡아온 역할 범위는 목표 직무인 ${targetLabel}이 요구하는 수준과 꽤 잘 맞습니다. 실제로 맡아온 책임 범위도 비슷하게 읽혀, 역할 범위 측면에서는 비교적 자연스럽게 이어지는 편이라 높게 평가됐습니다.`;
      case "high":
        return `현재 ${currentLabel}에서 맡아온 역할 범위와 책임 수준은 목표 직무인 ${targetLabel}과 상당 부분 맞닿아 있습니다. 단순 참여 수준을 넘어 목표 직무와 비슷한 수준의 역할 경험으로 읽히기 때문에 매우 높게 평가됐습니다.`;
      default:
        return "";
    }
  }

  switch (band) {
    case "very_low":
      return "현재 직무에서 맡아온 역할 범위는 목표 직무가 요구하는 책임 수준보다 더 좁게 읽힙니다. 현재 경험에서는 목표 직무 수준의 책임 범위를 직접 맡아본 흐름이 거의 드러나지 않아 매우 낮게 평가됐습니다.";
    case "low":
      return "현재 직무 경험 안에도 연결될 만한 역할은 일부 보이지만, 전반적인 책임 범위는 아직 목표 직무가 요구하는 수준보다 좁게 읽힙니다. 그래서 일부 업무는 닿아도 어디까지 주도했는지 기준에서는 차이가 남아 낮게 평가됐습니다.";
    case "mid":
      return "현재 직무에서 맡아온 역할은 목표 직무와 어느 정도 연결됩니다. 다만 책임 범위와 주도 수준에는 아직 일부 간격이 있어, 추가 증명이 필요한 상태로 보여 보통으로 평가됐습니다.";
    case "mid_high":
      return "현재 직무에서 맡아온 역할 범위는 목표 직무가 요구하는 수준과 꽤 잘 맞습니다. 실제로 맡아온 책임 범위도 비슷하게 읽혀 역할 범위 측면에서는 비교적 자연스럽게 이어지는 편이라 높게 평가됐습니다.";
    case "high":
      return "현재 직무에서 맡아온 역할 범위와 책임 수준은 목표 직무와 상당 부분 맞닿아 있습니다. 단순 참여 수준을 넘어 비슷한 수준의 역할 경험으로 읽히기 때문에 매우 높게 평가됐습니다.";
    default:
      return "";
  }
}

function buildAxis4JobAwareSummary(band, currentCustomerMarket, targetCustomerMarket, currentJobLabel, targetJobLabel) {
  const currentCustomerLabel = sanitizeDynamicLabel(CUSTOMER_MARKET_KO_LABEL[currentCustomerMarket]);
  const targetCustomerLabel = sanitizeDynamicLabel(CUSTOMER_MARKET_KO_LABEL[targetCustomerMarket]);
  const currentLabel = sanitizeDynamicLabel(currentJobLabel);
  const targetLabel = sanitizeDynamicLabel(targetJobLabel);

  if (!currentCustomerLabel || !targetCustomerLabel) return "";

  if (currentLabel && targetLabel) {
    switch (band) {
      case "very_low":
        return `현재 ${currentLabel}은 주로 ${currentCustomerLabel}을 상대하는 환경에서 쌓인 경험이고, 목표 직무인 ${targetLabel}은 ${targetCustomerLabel}을 중심으로 움직이는 역할입니다. 상대하는 대상이 달라지면 커뮤니케이션 방식과 설득 방식도 크게 달라지기 때문에, 고객 유형 차이가 커 매우 낮게 평가됐습니다.`;
      case "low":
        return `현재 ${currentLabel} 경험 안에도 일부 비슷한 대상은 있을 수 있지만, 중심이 되는 고객은 ${currentCustomerLabel}에 더 가깝고 목표 직무는 ${targetCustomerLabel} 비중이 더 큽니다. 즉, 누구를 상대로 설명하고 조율해왔는지에서 차이가 남아 있어 낮게 평가됐습니다.`;
      case "mid":
        return `현재 ${currentLabel}과 목표 직무인 ${targetLabel}은 상대하는 고객 유형이 완전히 다르지는 않습니다. 다만 중심 고객과 의사결정 구조에는 차이가 있어, 커뮤니케이션 방식을 그대로 옮기기에는 적응이 필요해 보통으로 평가됐습니다.`;
      case "mid_high":
        return `현재 ${currentLabel}도 ${currentCustomerLabel}을 주로 상대해왔고, 목표 직무인 ${targetLabel} 역시 비슷한 고객 유형을 다루는 역할입니다. 고객을 이해하고 설명하고 조율하는 방식이 꽤 이어져 높게 평가됐습니다.`;
      case "high":
        return `현재 ${currentLabel}은 ${currentCustomerLabel}을 상대하며 설득하고 조율해온 경험이 중심이고, 목표 직무인 ${targetLabel}도 거의 같은 고객 유형을 다룹니다. 상대하는 대상과 관계 조율 방식이 직접적으로 이어져, 지금까지의 고객 대응 경험을 그대로 활용할 수 있어 매우 높게 평가됐습니다.`;
      default:
        return "";
    }
  }

  switch (band) {
    case "very_low":
      return `현재 직무는 주로 ${currentCustomerLabel}을 상대하는 환경에서 쌓인 경험이고, 목표 직무는 ${targetCustomerLabel}을 중심으로 움직이는 역할입니다. 상대하는 대상이 달라지면 커뮤니케이션 방식과 설득 방식도 크게 달라지기 때문에 매우 낮게 평가됐습니다.`;
    case "low":
      return `현재 직무 경험 안에도 일부 비슷한 대상은 있을 수 있지만, 중심이 되는 고객은 ${currentCustomerLabel}에 더 가깝고 목표 직무는 ${targetCustomerLabel} 비중이 더 큽니다. 그래서 사람을 상대하는 맥락이 바로 이어지기 어려워 낮게 평가됐습니다.`;
    case "mid":
      return "현재 직무와 목표 직무는 상대하는 고객 유형이 완전히 다르지는 않습니다. 다만 중심 고객과 의사결정 구조 차이가 있어, 그대로 옮기기에는 적응이 필요해 보통으로 평가됐습니다.";
    case "mid_high":
      return `현재 직무도 ${currentCustomerLabel}을 주로 상대해왔고, 목표 직무 역시 비슷한 고객 유형을 다루는 역할입니다. 고객을 이해하고 조율하는 방식이 꽤 이어져 높게 평가됐습니다.`;
    case "high":
      return `현재 직무는 ${currentCustomerLabel}을 상대하며 설득하고 조율해온 경험이 중심이고, 목표 직무도 거의 같은 고객 유형을 다룹니다. 상대하는 대상과 관계 조율 방식이 직접적으로 이어져 매우 높게 평가됐습니다.`;
    default:
      return "";
  }
}

function buildAxis2DynamicSummary(band, currentValueChainPosition, targetValueChainPosition, currentCoreContext, targetCoreContext) {
  const currentFlow = toSafeFirstLabel(currentValueChainPosition) || toSafeFirstLabel(currentCoreContext);
  const targetFlow = toSafeFirstLabel(targetValueChainPosition) || toSafeFirstLabel(targetCoreContext);

  if (!currentFlow || !targetFlow) return "";

  switch (band) {
    case "very_low":
      return `현재 경험은 ${currentFlow}에 가까운 산업 맥락에서 쌓였고, 목표 산업은 ${targetFlow}을 더 중요하게 보는 환경입니다. 고객을 이해하는 방식, 시장을 보는 기준, 실제 일의 흐름이 모두 꽤 다르게 읽힙니다. 그래서 현재 산업 경험을 목표 산업에서 바로 통할 경험으로 보기 어려워 매우 낮게 평가됐습니다.`;
    case "low":
      return `현재 경험은 ${currentFlow} 중심의 산업 흐름에서 쌓였고, 목표 산업은 ${targetFlow} 중심에 더 가깝습니다. 일부 공통점은 있어도, 고객과 문제를 다루는 기준이 달라 실제 핵심 업무 맥락 차이가 남아 있습니다. 그래서 직무 자체는 이어질 수 있어도 산업 적응은 바로 되기 어렵다고 판단돼 낮게 평가됐습니다.`;
    case "mid":
      return `현재 경험과 목표 산업은 일부 흐름이 닿아 있지만, 그대로 옮겨가기에는 핵심 업무 맥락 차이도 함께 보입니다. 그래서 산업 전환의 연결점은 있지만 추가 적응이 필요한 상태로 보여 보통으로 평가됐습니다.`;
    case "mid_high":
      return `현재 경험은 ${currentFlow} 중심의 산업 맥락에서 쌓였고, 목표 산업도 비슷한 흐름을 중요하게 봅니다. 고객을 이해하는 방식과 일의 흐름이 꽤 이어지고, 핵심 업무 맥락도 비교적 가깝습니다. 그래서 현재 산업 경험을 목표 산업에도 자연스럽게 연결할 수 있어 높게 평가됐습니다.`;
    case "high":
      return `현재 경험은 ${currentFlow}을 중심으로 쌓였고, 목표 산업도 거의 같은 핵심 업무 흐름을 가집니다. 고객, 시장, 일의 흐름이 직접적으로 이어져 산업이 바뀌어도 설명 방식이 크게 달라지지 않습니다. 그래서 현재 산업 경험을 목표 산업에서도 큰 해석 변경 없이 그대로 강점으로 설명할 수 있어 매우 높게 평가됐습니다.`;
    default:
      return "";
  }
}

function buildAxis3DynamicSummary(band, responsibilityShift) {
  return buildAxis3RebalancedSummary(band, responsibilityShift, null, null);
}

function mapEvidenceTypeToKorean(type) {
  switch (type) {
    case "major": return "전공";
    case "project": return "프로젝트 경험";
    case "internship": return "인턴 경험";
    case "contract": return "실무/계약 경험";
    case "certification": return "자격 신호";
    case "self_report": return "자기보고 신호";
    case "mixed": return "복합 근거";
    default: return "";
  }
}

function collectCriteriaEvidenceLabels(selectionPack) {
  if (!selectionPack || typeof selectionPack !== "object") return [];

  const labels = [];
  const pushLabel = (type) => {
    const mapped = mapEvidenceTypeToKorean(type);
    if (mapped && !labels.includes(mapped)) labels.push(mapped);
  };

  pushLabel(selectionPack.primaryEvidenceType);
  pushLabel(selectionPack.limitingEvidenceType);

  if (Array.isArray(selectionPack.secondaryEvidenceList)) {
    selectionPack.secondaryEvidenceList.forEach((item) => pushLabel(item?.sourceType));
  }

  return labels.slice(0, 2);
}

function buildCriteriaEvidenceFallback(axisKey, signals) {
  switch (axisKey) {
    case "axis1": {
      const labels = [];
      if (signals?.majorPresent) labels.push("전공");
      return labels.slice(0, 2);
    }
    case "axis2": {
      const labels = [];
      if (signals?.contextAligned || signals?.internContextStrength === "strong" || signals?.internshipCount > 0 || signals?.contractCount > 0) labels.push("산업 맥락 경험");
      if (signals?.certificationsAligned || Number(signals?.certificationCount ?? 0) > 0) labels.push("자격 신호");
      if (signals?.majorAligned || signals?.majorPresent) labels.push("전공");
      return labels.slice(0, 2);
    }
    case "axis3": {
      const labels = [];
      if ((signals?.projectOutcomeLevel ?? "none") !== "none") labels.push("결과 경험");
      if ((signals?.experienceDurationLevel ?? "none") === "long") labels.push("지속 경험");
      if (signals?.comboEvidence === true) labels.push("복합 경험");
      return labels.slice(0, 2);
    }
    case "axis4": {
      const labels = [];
      if (toTrimmedTextArray(signals?.stakeholderExperienceLabels).length > 0) labels.push("이해관계자 접점");
      if (signals?.internshipCount > 0 || signals?.partTimeCount > 0) labels.push("실전 소통 경험");
      if (toTrimmedTextArray(signals?.interactionEligibleWorkStyleLabels).length > 0) labels.push("소통 성향 신호");
      return labels.slice(0, 2);
    }
    case "axis5": {
      const labels = [];
      if (toTrimmedTextArray(signals?.matchedStrengthLabels).length > 0 || Number(signals?.strengthsCount ?? 0) > 0) labels.push("강점 신호");
      if (toTrimmedTextArray(signals?.matchedWorkStyleLabels).length > 0 || signals?.workStyleNotesPresent) labels.push("일하는 방식 신호");
      return labels.slice(0, 2);
    }
    default:
      return [];
  }
}

function buildNewgradLead(axisKey, signals, band, selectionPack, legacySummary) {
  const summary = normalizeSentence(legacySummary, "");
  const packSummary = normalizeSentence(selectionPack?.selectionSummary, "");
  const positiveSummary = normalizeSentence(selectionPack?.primaryPositiveEvidence?.summary, "");

  if (summary) return summary;
  if (packSummary) return packSummary;
  if (positiveSummary) return positiveSummary;
  return NEWGRAD_CRITERIA_LAYER_A[axisKey] ?? "";
}

function buildNewgradCriteria(axisKey, signals, selectionPack) {
  const layerA = NEWGRAD_CRITERIA_LAYER_A[axisKey] ?? "이 축은 현재 입력에서 관련 근거를 어떻게 읽을지 봅니다.";
  const evidenceLabels = [
    ...collectCriteriaEvidenceLabels(selectionPack),
    ...buildCriteriaEvidenceFallback(axisKey, signals),
  ]
    .filter((label) => axisKey !== "axis1" || label === "전공")
    .filter((label, index, array) => label && array.indexOf(label) === index)
    .slice(0, 2);

  if (evidenceLabels.length >= 2) {
    return `${layerA} 이번 케이스에서는 ${evidenceLabels[0]}과 ${evidenceLabels[1]}를 함께 봤습니다.`;
  }
  if (evidenceLabels.length === 1) {
    return `${layerA} 이번 케이스에서는 ${evidenceLabels[0]}를 중심 근거로 봤습니다.`;
  }
  return `${layerA} ${NEWGRAD_CRITERIA_FALLBACK_LAYER_B[axisKey] ?? ""}`.trim();
}

function buildNewgradScoreReason(axisKey, signals, band, selectionPack, reasons, summary) {
  const positiveFromPack = normalizeSentence(selectionPack?.primaryPositiveEvidence?.summary, "");
  const limitingFromPack = normalizeSentence(
    selectionPack?.primaryLimitingEvidence?.summary || selectionPack?.primaryLimitingEvidence?.limitingPoint,
    ""
  );

  const positive = positiveFromPack || pickReasonLabel(reasons, "positive") || normalizeSentence(summary, "");

  let limiting = limitingFromPack || pickReasonLabel(reasons, "negative");
  const needsLimitingPair = band === "mid" || band === "mid_high" || band === "low" || band === "very_low";

  if (axisKey === "axis5" && selectionPack?.selfReportOnly === true) {
    limiting = limiting || "자기보고 신호는 있으나 observed behavior support가 없어 보수적으로 읽어야 합니다.";
  }

  if (!limiting && needsLimitingPair) {
    limiting = NEWGRAD_LIMITING_DEFAULTS[axisKey] ?? "상위 점수로 가려면 추가 근거가 더 필요합니다.";
  }

  if (!positive && !limiting) return "";
  if (!positive) return limiting;
  if (!limiting) return positive;

  return `${positive} 다만 ${limiting}`;
}

function buildNewgradLiftOrLimit(axisKey, signals, selectionPack, gaps) {
  const mode = axisKey === "axis5"
    ? "limit"
    : (selectionPack?.assemblyHints?.recommendedLiftOrLimitMode ?? "lift");
  const limitingPoint = normalizeSentence(selectionPack?.primaryLimitingEvidence?.limitingPoint, "");
  const firstGap = Array.isArray(gaps)
    ? gaps.map((item) => String(item || "").trim()).find(Boolean) || ""
    : "";

  if (limitingPoint) return limitingPoint;
  if (firstGap) return firstGap;
  if (mode === "limit") return NEWGRAD_LIMIT_DEFAULTS[axisKey] ?? "현재 구조에서는 추가 근거가 함께 필요합니다.";
  return NEWGRAD_LIFT_DEFAULTS[axisKey] ?? "추가 근거가 더 붙으면 이 축이 올라갈 수 있습니다.";
}

function buildNewgradExplanationSlots(axisKey, signals, band, selectionPack, summary, reasons, gaps) {
  return {
    lead: buildNewgradLead(axisKey, signals, band, selectionPack, summary),
    criteria: buildNewgradCriteria(axisKey, signals, selectionPack),
    scoreReason: buildNewgradScoreReason(axisKey, signals, band, selectionPack, reasons, summary),
    liftOrLimit: buildNewgradLiftOrLimit(axisKey, signals, selectionPack, gaps),
    slotVersion: NEWGRAD_SLOT_VERSION,
  };
}

// ─── Axis 1: jobStructure (직무 구조 연결성) ──────────────────────────────────

const JOB_DISTANCE_REASON = {
  same:     { code: "job_distance_same",     label: "같은 직무 유형 안에서의 이동입니다.",         direction: "positive" },
  adjacent: { code: "job_distance_adjacent", label: "인접 직무 유형으로의 이동입니다.",            direction: "neutral"  },
  cross:    { code: "job_distance_cross",    label: "직무 계열이 다른 영역으로의 이동입니다.",      direction: "negative" },
  far:      { code: "job_distance_far",      label: "직무 유형 간 거리가 멉니다.",                direction: "negative" },
};

const FAMILY_DISTANCE_REASON = {
  same_family:      { code: "family_same",       label: "같은 직무 계열에 속합니다.",           direction: "positive" },
  adjacent_family:  { code: "family_adjacent",   label: "인접 직무 계열입니다.",                direction: "neutral"  },
  bridgeable_family:{ code: "family_bridgeable", label: "연결 가능한 직무 계열입니다.",          direction: "neutral"  },
  distant_family:   { code: "family_distant",    label: "직무 계열이 많이 다릅니다.",            direction: "negative" },
};

const JOB_STRUCTURE_BAND_SUMMARY = {
  high:     "핵심 업무 과업과 직무 구조가 잘 연결됩니다. 별도 전환 설명이 많이 필요하지 않습니다.",
  mid_high: "업무 과업이 꽤 겹칩니다. 연결되는 경험을 중심으로 설명하면 좋습니다.",
  mid:      "기본 연결은 있지만, 어떤 과업이 어떻게 이어지는지 구체적으로 풀어주면 좋습니다.",
  low:      "현재 직무와 목표 직무가 일부 맞닿는 지점은 있지만, 실제 핵심 과업의 무게중심은 다르게 읽힙니다. 그래서 유사 경험이 있어도 동일한 직무 구조로는 제한적으로 평가됐습니다.",
  very_low: "현재 직무와 목표 직무는 핵심적으로 요구하는 과업의 성격이 크게 다릅니다. 현재 경험만으로는 목표 직무의 중심 역할이 직접 이어진다고 보기 어려워 보수적으로 평가됐습니다.",
};

// @MX:NOTE: Round 5 — producer-side bridge context helpers. Read from breakdown.weakUmbrellaBridge.
const BRIDGE_GROUP_LABEL_MAP = {
  commercial_gtm:           "GTM·영업·마케팅",
  product_service_strategy: "제품·서비스 전략",
  business_planning_ops:    "사업기획·운영",
  people_ops:               "사람 운영·HR",
  customer_service_ops:     "고객 서비스·운영",
  finance_planning_control: "재무·계획·통제",
  industrial_operations:    "제조·생산·품질",
  technical_build:          "기술 구현·설계",
  research_advisory:        "리서치·자문",
  supplier_partner_network: "파트너·공급망",
};

function buildAxis1Summary(band, registryBridgeEligible, bridgeFloorApplied, strongOverlap, jobDistance) {
  if (band === "high") return JOB_STRUCTURE_BAND_SUMMARY.high;
  if (band === "mid_high") return JOB_STRUCTURE_BAND_SUMMARY.mid_high;

  if (registryBridgeEligible && bridgeFloorApplied) {
    if (jobDistance === "cross") return "직무명은 다르지만, 실제로는 이어지는 핵심 업무 구조가 있습니다.";
    return "같은 도메인 안에서 초점이 달라지는 전환입니다.";
  }

  return JOB_STRUCTURE_BAND_SUMMARY[band] ?? JOB_STRUCTURE_BAND_SUMMARY.mid;
}

function buildAxis1BridgeContext(registryBridgeEligible, sharedBridgeGroups, sharedCapabilityClusters, bridgeEligibilitySource, jobDistance) {
  if (!registryBridgeEligible || !sharedBridgeGroups?.length) return null;

  const groupLabels = sharedBridgeGroups
    .map((g) => BRIDGE_GROUP_LABEL_MAP[g] ?? g)
    .join(", ");
  const clusterCount = sharedCapabilityClusters?.length ?? 0;

  const isIndustrial = sharedBridgeGroups.includes("industrial_operations");
  const isSupplier   = sharedBridgeGroups.includes("supplier_partner_network");

  if (isIndustrial) {
    return "현장/공정/품질처럼 연결되는 운영 구조는 있으나, 목표 직무의 기준 설계나 검증 책임까지 동일하진 않습니다.";
  }
  if (isSupplier) {
    return "외부 파트너·계정·사업기회 관리 경험은 이어질 수 있지만, 목표 직무의 구조화 수준과 의사결정 범위는 다를 수 있습니다.";
  }

  const sourceTag = bridgeEligibilitySource === "registry" ? "역량 클러스터 분석" : "직무군 분류";
  return `공통 역할군(${groupLabels})이 연결고리입니다. ${sourceTag} 기준으로 ${clusterCount}개 역량 클러스터가 겹칩니다.`;
}

function buildAxis1WhyNotHigher(band, strongOverlap, respOverlap, registryBridgeEligible, clusterCount) {
  if (band === "high" || band === "mid_high") return null;

  if (!registryBridgeEligible) {
    if (strongOverlap === 0 && respOverlap === 0) {
      return "핵심 업무 신호와 책임 영역에서 직접 겹치는 부분이 확인되지 않아, 구조적 연결이 제한됩니다.";
    }
    return "직무 계열 차이로 인해 구조적 연결 범위가 제한됩니다.";
  }

  if (strongOverlap === 0 && respOverlap === 0) {
    return "공통된 역할군/클러스터는 있으나, 목표 직무의 직접 수행 경험까지 갖췄다고 보긴 어렵습니다.";
  }
  if (clusterCount < 3) {
    return "연결되는 역량 클러스터 수가 충분하지 않아 더 높은 점수로 가기는 어렵습니다.";
  }
  return "핵심 언어와 협업 구조는 이어지지만, 더 자주 요구되는 실무 포인트는 다를 수 있습니다.";
}

export function buildJobStructureExplanation(signals, band, breakdown) {
  if (!signals) return { available: false };

  const reasons = [];

  const distReason = JOB_DISTANCE_REASON[signals.jobDistance];
  if (distReason) reasons.push({ ...distReason });

  const famReason = FAMILY_DISTANCE_REASON[signals.familyDistance];
  if (famReason) reasons.push({ ...famReason });

  const strongOverlap = breakdown?.strongSignals?.overlapCount ?? 0;
  const respOverlap = breakdown?.responsibilityHints?.overlapCount ?? 0;

  if (strongOverlap >= 2) {
    reasons.push({ code: "strong_signal_multi", label: "핵심 업무 신호가 여러 개 겹칩니다.", direction: "positive" });
  } else if (strongOverlap === 1) {
    reasons.push({ code: "strong_signal_one", label: "핵심 업무 신호 한 개가 일치합니다.", direction: "positive" });
  } else {
    reasons.push({ code: "strong_signal_none", label: "핵심 업무 신호 겹침이 확인되지 않습니다.", direction: "negative" });
  }

  if (respOverlap >= 2) {
    reasons.push({ code: "resp_hint_multi", label: "책임 영역이 여러 개 겹칩니다.", direction: "positive" });
  } else if (respOverlap === 1) {
    reasons.push({ code: "resp_hint_one", label: "책임 영역이 부분적으로 겹칩니다.", direction: "neutral" });
  }

  if (breakdown?.missionTypeMatch) {
    reasons.push({ code: "mission_match", label: "직무 미션 유형이 일치합니다.", direction: "positive" });
  }
  if (breakdown?.outputTypeMatch) {
    reasons.push({ code: "output_match", label: "아웃풋 유형이 일치합니다.", direction: "positive" });
  }

  // Round 5: registry bridge signals from breakdown.weakUmbrellaBridge
  const wb = breakdown?.weakUmbrellaBridge ?? {};
  const registryBridgeEligible  = wb.registryBridgeEligible  ?? false;
  const sharedBridgeGroups      = wb.sharedBridgeGroups       ?? [];
  const sharedCapabilityClusters= wb.sharedCapabilityClusters ?? [];
  const bridgeEligibilitySource = wb.bridgeEligibilitySource  ?? null;
  const bridgeFloorApplied      = wb.applied                  ?? false;
  const clusterUplift           = breakdown?.registryClusterUplift ?? 0;

  if (registryBridgeEligible) {
    reasons.push({ code: "registry_bridge_eligible", label: "역량 클러스터 분석상 구조적 연결 가능성이 있습니다.", direction: "positive" });
  }
  if (clusterUplift > 0) {
    reasons.push({ code: "cluster_uplift_applied", label: `공통 역량 클러스터(${sharedCapabilityClusters.length}개)가 점수에 반영되었습니다.`, direction: "positive" });
  }

  const positives = reasons.filter((r) => r.direction === "positive").map((r) => r.label);
  const gaps      = reasons.filter((r) => r.direction === "negative").map((r) => r.label);
  const summary        =
    buildAxis1DynamicSummary(band, signals.currentJobLabel, signals.targetJobLabel) ||
    buildAxis1Summary(band, registryBridgeEligible, bridgeFloorApplied, strongOverlap, signals.jobDistance);
  const bridgeContext  = buildAxis1BridgeContext(registryBridgeEligible, sharedBridgeGroups, sharedCapabilityClusters, bridgeEligibilitySource, signals.jobDistance);
  const whyNotHigher   = buildAxis1WhyNotHigher(band, strongOverlap, respOverlap, registryBridgeEligible, sharedCapabilityClusters.length);

  const extra = {
    explanationAvailable:     true,
    explanationSummary:       summary,
    explanationPositives:     positives,
    explanationGaps:          gaps,
    explanationWhyNotHigher:  whyNotHigher ?? undefined,
    explanationEvidenceSource: bridgeEligibilitySource ?? "signal_overlap",
    explanationBridgeContext: bridgeContext ?? undefined,
  };

  return makeExplanation(summary, positives, gaps, reasons, extra);
}

// ─── Axis 2: industryContext (산업 맥락 연결성) ───────────────────────────────

const INDUSTRY_DISTANCE_REASON = {
  same:     { code: "same_industry",     label: "동일 산업에서 경력을 쌓아왔습니다.",     direction: "positive" },
  adjacent: { code: "adjacent_industry", label: "인접 산업에서 경력을 쌓아왔습니다.",     direction: "neutral"  },
  cross:    { code: "cross_industry",    label: "다른 산업 계열에서 경력을 쌓아왔습니다.", direction: "negative" },
};

const VALUE_CHAIN_FIT_REASON = {
  strong_match:  { code: "value_chain_strong",  label: "업무 프로세스 흐름이 높은 수준으로 일치합니다.", direction: "positive" },
  partial_match: { code: "value_chain_partial", label: "업무 프로세스 흐름이 부분적으로 겹칩니다.",     direction: "neutral"  },
  light_match:   { code: "value_chain_light",   label: "업무 프로세스 흐름의 일부 요소만 겹칩니다.",   direction: "neutral"  },
  mismatch:      { code: "value_chain_mismatch",label: "업무 프로세스 흐름이 상당히 다릅니다.",         direction: "negative" },
};

const CORE_CONTEXT_FIT_REASON = {
  strong_match:  { code: "core_context_strong",  label: "핵심 업무 맥락이 높은 수준으로 일치합니다.", direction: "positive" },
  partial_match: { code: "core_context_partial", label: "핵심 업무 맥락이 부분적으로 일치합니다.",    direction: "neutral"  },
  light_match:   { code: "core_context_light",   label: "핵심 업무 맥락의 일부만 공통됩니다.",        direction: "neutral"  },
  mismatch:      { code: "core_context_mismatch",label: "핵심 업무 맥락이 다릅니다.",                 direction: "negative" },
};

const REGULATION_FIT_REASON = {
  same_level: { code: "regulation_same", label: "규제 및 진입 장벽 수준이 동일합니다.", direction: "positive" },
  near_level: { code: "regulation_near", label: "규제 및 진입 장벽 수준이 유사합니다.", direction: "neutral"  },
  far_level:  { code: "regulation_far",  label: "규제 및 진입 장벽 수준이 다릅니다.",   direction: "negative" },
};

const SALES_CYCLE_FIT_REASON = {
  same_cycle: { code: "sales_cycle_same", label: "영업/서비스 사이클 특성이 일치합니다.", direction: "positive" },
  far_cycle:  { code: "sales_cycle_far",  label: "영업/서비스 사이클 특성이 다릅니다.",   direction: "negative" },
};

const INDUSTRY_BAND_SUMMARY = {
  high:     "현재 산업 배경이 지원 산업과 잘 맞아, 경험을 그대로 연결할 수 있습니다.",
  mid_high: "산업 배경이 비슷해 경험을 연결하기 좋습니다.",
  mid:      "산업의 큰 차이는 없지만, 업계 이해를 보여주면 더 설득력이 생깁니다.",
  low:      "현재 산업과 목표 산업은 일하는 방식의 결이 일부 다릅니다. 직무 자체는 이어질 수 있어도, 고객과 문제를 다루는 맥락 차이 때문에 산업 연결성은 낮게 반영됐습니다.",
  very_low: "현재 산업과 목표 산업은 고객 구조와 업무가 작동하는 방식이 크게 다릅니다. 직무 경험이 있더라도 목표 산업의 맥락으로 바로 이어진다고 보기는 어려워 보수적으로 평가됐습니다.",
};

export function buildIndustryContextExplanation(signals, band) {
  if (!signals) return { available: false };

  const reasons = [];

  const distReason = INDUSTRY_DISTANCE_REASON[signals.industryDistance];
  if (distReason) reasons.push({ ...distReason });

  if (signals.sameSubSector) {
    reasons.push({ code: "same_subsector", label: "동일 세부 업종에 해당합니다.", direction: "positive" });
  } else if (signals.sameSector) {
    reasons.push({ code: "same_sector", label: "같은 대분류 업종에 속합니다.", direction: "neutral" });
  }

  const vcReason = VALUE_CHAIN_FIT_REASON[signals.valueChainFit];
  if (vcReason) reasons.push({ ...vcReason });

  const ccReason = CORE_CONTEXT_FIT_REASON[signals.coreContextFit];
  if (ccReason) reasons.push({ ...ccReason });

  const regReason = REGULATION_FIT_REASON[signals.regulationBarrierFit];
  if (regReason && signals.regulationBarrierFit !== "near_level") {
    reasons.push({ ...regReason });
  }

  const scReason = SALES_CYCLE_FIT_REASON[signals.salesCycleFit];
  if (scReason) reasons.push({ ...scReason });

  const positives = reasons.filter((r) => r.direction === "positive").map((r) => r.label);
  const gaps = reasons.filter((r) => r.direction === "negative").map((r) => r.label);
  const dynamicSummary = buildAxis2DynamicSummary(
    band,
    signals.currentValueChainPosition,
    signals.targetValueChainPosition,
    signals.currentCoreContext,
    signals.targetCoreContext
  );
  const summary = dynamicSummary || INDUSTRY_BAND_SUMMARY[band] || INDUSTRY_BAND_SUMMARY.mid;

  return makeExplanation(summary, positives, gaps, reasons);
}

// ─── Axis 3: responsibilityScope (역할 범위 연결성) ── [B: 단일 signal] ────────

const RESPONSIBILITY_SHIFT_SUMMARY = {
  similar:          "현재 역할 범위와 목표 직무의 기대 수준이 비슷합니다.",
  down_or_narrower: "목표 직무의 역할 범위가 현재보다 좁습니다. 집중도는 높아질 수 있습니다.",
  slightly_up:      "역할 범위 수준이 소폭 확장됩니다. 적응 기간이 필요할 수 있습니다.",
  meaningfully_up:  "역할 범위가 크게 확장됩니다. 더 넓은 책임을 다루는 준비가 필요합니다.",
};

export function buildResponsibilityScopeExplanation(signals, band) {
  if (!signals || !signals.responsibilityShift) return { available: false };

  const shift = signals.responsibilityShift;
  const summary =
    buildAxis3RebalancedSummary(band, shift, signals.currentJobLabel, signals.targetJobLabel) ||
    RESPONSIBILITY_SHIFT_SUMMARY[shift] ||
    RESPONSIBILITY_SHIFT_SUMMARY.slightly_up;

  const reasons = [];
  const positives = [];
  const gaps = [];

  if (shift === "similar") {
    reasons.push({ code: "scope_similar", label: "맡아온 의사결정 수준이 목표 직무 기대치와 유사합니다.", direction: "positive" });
    positives.push("맡아온 의사결정 수준이 목표 직무 기대치와 유사합니다.");
  } else if (shift === "down_or_narrower") {
    reasons.push({ code: "scope_down", label: "현재 담당 범위가 더 넓어 역할 축소에 따른 부담이 적습니다.", direction: "positive" });
    positives.push("현재 담당 범위가 더 넓어 역할 축소에 따른 부담이 적습니다.");
  } else if (shift === "slightly_up") {
    reasons.push({ code: "scope_up_slight", label: "의사결정 권한이나 관리 범위가 현재보다 소폭 넓어집니다.", direction: "negative" });
    gaps.push("의사결정 권한이나 관리 범위가 현재보다 소폭 넓어집니다.");
  } else if (shift === "meaningfully_up") {
    reasons.push({ code: "scope_up_big", label: "현재 역할보다 책임 범위와 조율 구조가 크게 확장됩니다.", direction: "negative" });
    gaps.push("현재 역할보다 책임 범위와 조율 구조가 크게 확장됩니다.");
  }

  return makeExplanation(summary, positives, gaps, reasons);
}

// ─── Axis 4: customerType (고객 유형 연결성) ──────────────────────────────────

const CUSTOMER_TYPE_BAND_SUMMARY = {
  very_low: "현재 직무와 목표 직무는 상대하는 고객 유형 차이가 커, 커뮤니케이션과 설득 방식까지 다시 적응해야 할 가능성이 높습니다.",
  high:     "고객 유형을 중심으로 구매 방식과 의사결정 구조까지 함께 봤을 때, 기존 고객 문맥을 새로운 직무에서도 비교적 자연스럽게 이어갈 가능성이 높습니다.",
  mid_high: "고객 유형은 비교적 가깝고, 구매 방식이나 의사결정 구조 일부만 조정하면 연결성을 유지할 수 있는 편입니다.",
  mid:      "고객 유형에는 일부 접점이 있지만, 구매 방식이나 의사결정 구조에서는 차이가 함께 남아 있을 수 있습니다.",
  low:      "고객 유형을 중심으로 봐도 차이가 큰 편이며, 실제로는 구매 방식이나 의사결정 구조도 다시 익혀야 할 가능성이 있습니다.",
};

export function buildCustomerTypeExplanation(signals, band, breakdown) {
  if (!signals) return { available: false };

  const reasons = [];

  const cmScore = breakdown?.customerMarketFit?.score;
  const bmScore = breakdown?.buyingMotionFit?.score;
  const dsScore = breakdown?.decisionStructureFit?.score;

  if (cmScore != null) {
    if (cmScore >= 4) {
      reasons.push({ code: "customer_market_match", label: "고객 시장 유형(B2B/B2C 등)이 일치합니다.", direction: "positive" });
    } else if (cmScore <= 1) {
      reasons.push({ code: "customer_market_mismatch", label: "고객 시장 유형이 달라 새로운 응대 방식이 필요합니다.", direction: "negative" });
    } else {
      reasons.push({ code: "customer_market_partial", label: "고객 시장 유형이 부분적으로 겹칩니다.", direction: "neutral" });
    }
  }

  if (bmScore != null) {
    if (bmScore >= 4) {
      reasons.push({ code: "buying_motion_match", label: "구매 의사결정 방식이 유사합니다.", direction: "positive" });
    } else if (bmScore <= 1) {
      reasons.push({ code: "buying_motion_mismatch", label: "구매 의사결정 방식이 달라 접근법 조정이 필요합니다.", direction: "negative" });
    }
  }

  if (dsScore != null) {
    if (dsScore >= 4) {
      reasons.push({ code: "decision_structure_match", label: "의사결정 구조가 비슷합니다.", direction: "positive" });
    } else if (dsScore <= 1) {
      reasons.push({ code: "decision_structure_diff", label: "의사결정 구조가 다릅니다.", direction: "negative" });
    }
  }

  const positives = reasons.filter((r) => r.direction === "positive").map((r) => r.label);
  const gaps = reasons.filter((r) => r.direction === "negative").map((r) => r.label);
  const summary = buildAxis4JobAwareSummary(
    band,
    signals.currentCustomerMarket,
    signals.targetCustomerMarket,
    signals.currentJobLabel,
    signals.targetJobLabel
  ) || buildAxis4DynamicSummary(
    band,
    signals.currentCustomerMarket,
    signals.targetCustomerMarket
  ) || CUSTOMER_TYPE_BAND_SUMMARY[band] || CUSTOMER_TYPE_BAND_SUMMARY.mid;

  return makeExplanation(summary, positives, gaps, reasons);
}

// ─── Axis 5: roleCharacter (직무 성격 연결성) ─────────────────────────────────

const ROLE_WEIGHT_SHIFT_SUMMARY = {
  similar:                  "일하는 방식과 직무 성격이 잘 맞아 자연스러운 전환이 기대됩니다.",
  operator_to_coordinator:  "실행 중심에서 조율/기획 중심으로 이동합니다. 접근 방식 전환이 필요합니다.",
  coordinator_to_operator:  "기획/조율 중심에서 실행 중심으로 이동합니다. 역할 체감이 달라질 수 있습니다.",
  execution_to_strategy:    "실행 중심에서 전략 기획으로 이동합니다. 업무 성격 차이가 큽니다.",
  strategy_to_execution:    "전략 기획에서 실행 중심으로 이동합니다. 역할 체감이 다를 수 있습니다.",
};

// detail-level auxiliary labels — summary 문장을 재사용하지 않고 이동 방향의 구체적 성격을 기술
const ROLE_WEIGHT_SHIFT_DETAIL = {
  similar:                  "업무 비중(실행/조율/전략)이 목표 직무와 비슷한 방향입니다.",
  operator_to_coordinator:  "실행보다 조율·기획에 비중이 더 높아집니다.",
  coordinator_to_operator:  "기획보다 실제 실행과 운영에 비중이 더 높아집니다.",
  execution_to_strategy:    "단기 실행보다 중장기 방향 설정 역할이 커집니다.",
  strategy_to_execution:    "전략 수립보다 실행과 운영 중심의 업무 비중이 높아집니다.",
};

export function buildRoleCharacterExplanation(signals, band, breakdown) {
  if (!signals && !breakdown) return { available: false };

  const roleWeightShift = breakdown?.baseRoleWeightShift ?? signals?.roleWeightShift;
  if (!roleWeightShift) return { available: false };

  const summary = buildAxis5DynamicSummary(
    band,
    signals?.currentMissionType ?? breakdown?.currentMissionType,
    signals?.targetMissionType ?? breakdown?.targetMissionType,
    signals?.currentSuccessMetricType ?? breakdown?.currentSuccessMetricType,
    signals?.targetSuccessMetricType ?? breakdown?.targetSuccessMetricType,
    breakdown?.missionTypeMatch ?? signals?.missionTypeMatch
  ) || ROLE_WEIGHT_SHIFT_SUMMARY[roleWeightShift] || ROLE_WEIGHT_SHIFT_SUMMARY.similar;

  const reasons = [];

  if (roleWeightShift !== "similar") {
    reasons.push({
      code: "role_weight_shift",
      label: ROLE_WEIGHT_SHIFT_DETAIL[roleWeightShift] ?? "직무 성격 이동 방향이 다릅니다.",
      direction: "negative",
    });
  } else {
    reasons.push({ code: "role_weight_similar", label: ROLE_WEIGHT_SHIFT_DETAIL.similar, direction: "positive" });
  }

  if (breakdown?.missionTypeMatch) {
    reasons.push({ code: "mission_match", label: "업무 미션 유형이 일치합니다.", direction: "positive" });
  } else if (breakdown?.missionTypeMatch === false) {
    reasons.push({ code: "mission_diff", label: "업무 미션 유형이 달라 적응이 필요합니다.", direction: "negative" });
  }

  if (breakdown?.successMetricTypeMatch) {
    reasons.push({ code: "metric_match", label: "성과 측정 방식이 유사합니다.", direction: "positive" });
  }

  if (breakdown?.horizonTypeMatch) {
    reasons.push({ code: "horizon_match", label: "업무 시간 지평(단기/장기)이 맞습니다.", direction: "positive" });
  }

  const positives = reasons.filter((r) => r.direction === "positive").map((r) => r.label);
  const gaps = reasons.filter((r) => r.direction === "negative").map((r) => r.label);

  return makeExplanation(summary, positives, gaps, reasons);
}

// ─── placeholder for axes without explanation yet ──────────────────────────────
export const EXPLANATION_NOT_AVAILABLE = Object.freeze({ available: false });

// ─────────────────────────────────────────────────────────────────────────────
// Newgrad axis explanation builders
// ─────────────────────────────────────────────────────────────────────────────

function toNewgradLabelList(items = [], maxCount = 2) {
  const labels = Array.isArray(items)
    ? [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return labels.join(", ");
  return `${labels[0]}, ${labels[1]} 등`;
}

function dedupeExplanationLines(items = [], maxCount = 3) {
  return [...new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  )].slice(0, maxCount);
}

function buildNewgradJobFitToneSummary(signals, band) {
  const majorPriorLabel = String(signals?.majorPriorLabel || "").trim();

  if ((band === "high" || band === "mid_high") && majorPriorLabel === "direct") {
    return "전공이 목표 직무의 핵심 과업과 비교적 직접적으로 이어지는 편입니다.";
  }
  if (band === "mid" || majorPriorLabel === "adjacent") {
    return "전공은 목표 직무와 인접한 출발점으로 읽히지만, 직접 연결성은 아직 더 보강할 여지가 있습니다.";
  }
  return "이 축은 전공이 목표 직무의 핵심 과업과 얼마나 이어지는지를 보는 축인데, 현재는 그 연결이 아직 보수적으로 읽힐 수 있습니다.";
}

function buildNewgradJobFitPositives(signals) {
  const positives = [];
  const majorPriorLabel = String(signals?.majorPriorLabel || "").trim();
  const majorDisplayLabel = typeof signals?.majorDisplayLabel === "string"
    ? signals.majorDisplayLabel.trim()
    : "";

  if (majorPriorLabel === "direct") {
    positives.push(majorDisplayLabel ? `${majorDisplayLabel} 전공이 목표 직무와 직접 맞닿는 편입니다.` : "전공이 목표 직무와 직접 맞닿는 편입니다.");
  }
  if (signals?.courseworkCount > 0) {
    positives.push("관련 교과목 이수가 전공 기반 연결 설명을 보완하고 있습니다.");
  }
  if (signals?.majorPriorMatchedBy === "override" || signals?.majorPriorMatchedBy === "exception") {
    positives.push("세부 직무 기준을 반영한 전공 연결 보정이 적용되었습니다.");
  }

  return dedupeExplanationLines(positives);
}

function buildNewgradJobFitGaps(signals) {
  const gaps = [];
  const majorPriorLabel = String(signals?.majorPriorLabel || "").trim();

  if (majorPriorLabel !== "direct") {
    gaps.push("전공이 목표 직무와 직접 맞닿는 정도는 아직 제한적으로 읽힐 수 있습니다.");
  }
  if ((signals?.courseworkCount ?? 0) === 0) {
    gaps.push("직무와 연결되는 전공 수업이나 학습 기반 설명이 더 필요할 수 있습니다.");
  } else if (majorPriorLabel === "weak" || majorPriorLabel === "mismatch") {
    gaps.push("전공 과목과 학습 내용을 직무 과업 언어로 더 분명하게 풀어줄 필요가 있습니다.");
  }

  return dedupeExplanationLines(gaps);
}

function buildNewgradDomainInterestToneSummary(signals, band) {
  const hasTypes = (signals?.projectTypeExperienceLabels?.length ?? 0) > 0 || (signals?.internshipTypeExperienceLabels?.length ?? 0) > 0;
  const hasStakeholders = (signals?.stakeholderExperienceLabels?.length ?? 0) > 0;
  const contextStrong = signals?.internContextStrength === "strong" || signals?.contextAligned === true;

  if ((band === "high" || band === "mid_high") && hasTypes && hasStakeholders) {
    return "경험 유형과 이해관계자 구성이 목표 산업의 실제 일 방식과 어느 정도 맞닿아 있는 편입니다.";
  }
  if (band === "mid" || hasTypes || hasStakeholders || contextStrong) {
    return "어떤 유형의 경험을 했고 누구와 접점을 가졌는지가 목표 산업 문맥 적응 가능성을 보여주는 축인데, 현재는 그 연결이 일부 보이는 단계입니다.";
  }
  return "직무 경험은 있어도 산업 문맥과의 연결은 아직 선명하지 않을 수 있습니다.";
}

function buildNewgradDomainInterestPositives(signals) {
  const positives = [];
  const hasTypes = (signals?.projectTypeExperienceLabels?.length ?? 0) > 0 || (signals?.internshipTypeExperienceLabels?.length ?? 0) > 0;
  const hasStakeholders = (signals?.stakeholderExperienceLabels?.length ?? 0) > 0;

  if (hasTypes && hasStakeholders) {
    positives.push("경험의 성격과 접한 이해관계자 구성이 산업 적응 신호로 읽힙니다.");
  }
  if (signals?.internContextStrength === "strong" || signals?.contextAligned === true) {
    positives.push("단순 수행보다 어떤 환경에서 일했는지가 이 축에서는 강점으로 작용합니다.");
  }
  if ((signals?.projectIndustrySupportCount ?? 0) > 0 || signals?.majorAligned === true || signals?.certificationsAligned === true) {
    positives.push("산업 현장에서 마주치는 맥락을 일부 경험해본 점이 플러스입니다.");
  }

  return dedupeExplanationLines(positives);
}

function buildNewgradDomainInterestGaps(signals) {
  const gaps = [];
  const hasTypes = (signals?.projectTypeExperienceLabels?.length ?? 0) > 0 || (signals?.internshipTypeExperienceLabels?.length ?? 0) > 0;
  const hasStakeholders = (signals?.stakeholderExperienceLabels?.length ?? 0) > 0;

  if ((signals?.projectCount ?? 0) > 0 && (signals?.projectIndustrySupportCount ?? 0) === 0) {
    gaps.push("경험 유형은 있어도 목표 산업 문맥과 직접 연결되는 신호는 아직 약할 수 있습니다.");
  }
  if (hasTypes && !hasStakeholders) {
    gaps.push("이해관계자 구성이 제한적이면 산업 적응력이 보수적으로 읽힐 수 있습니다.");
  }
  if ((signals?.internshipCount ?? 0) > 0 && String(signals?.internContextStrength || "none") !== "strong") {
    gaps.push("직무 경험과 산업 경험이 같은 방향으로 쌓이지 않으면 이 축은 덜 선명하게 보일 수 있습니다.");
  } else if (!hasTypes && !hasStakeholders) {
    gaps.push("직무 경험과 산업 경험이 같은 방향으로 쌓이지 않으면 이 축은 덜 선명하게 보일 수 있습니다.");
  }

  return dedupeExplanationLines(gaps);
}

function buildNewgradExecutionDepthToneSummary(signals, band) {
  const strongOutcome = signals?.projectOutcomeLevel === "strong";
  const longDuration = signals?.experienceDurationLevel === "long";
  const comboEvidence = signals?.comboEvidence === true;

  if ((band === "high" || band === "mid_high") && (strongOutcome || longDuration || comboEvidence)) {
    return "단순 참여를 넘어서 결과 수준과 지속 기간이 어느 정도 확보된 편입니다.";
  }
  if (band === "mid" || (signals?.projectCount ?? 0) > 0 || (signals?.internshipCount ?? 0) > 0) {
    return "이 축은 얼마나 깊게 실행해봤는지, 그리고 그 경험이 얼마나 반복되거나 이어졌는지를 함께 봅니다.";
  }
  return "경험 자체는 있지만 실행 깊이나 반복성은 아직 보수적으로 읽힐 수 있습니다.";
}

function buildNewgradExecutionDepthPositives(signals) {
  const positives = [];

  if (signals?.projectOutcomeLevel === "strong") {
    positives.push("결과 수준이 분명한 경험은 이 축에서 좋은 신호가 됩니다.");
  }
  if (signals?.experienceDurationLevel === "long") {
    positives.push("짧은 체험이 아니라 일정 기간 반복한 경험은 실행 깊이를 설득하기 좋습니다.");
  }
  if (signals?.comboEvidence === true || (signals?.projectOutcomeLevel === "strong" && signals?.experienceDurationLevel === "long")) {
    positives.push("성과와 기간이 함께 받쳐주면 이 축은 안정적으로 높아집니다.");
  }

  return dedupeExplanationLines(positives);
}

function buildNewgradExecutionDepthGaps(signals) {
  const gaps = [];
  const totalCount = (signals?.projectCount ?? 0)
    + (signals?.internshipCount ?? 0)
    + (signals?.extracurricularCount ?? 0)
    + (signals?.partTimeCount ?? 0);

  if (totalCount > 0 && signals?.evidenceStrength === "weak") {
    gaps.push("참여 경험은 있어도 끝까지 밀어본 깊이는 아직 약하게 읽힐 수 있습니다.");
  }
  if (
    (signals?.projectCount ?? 0) > 0
    && (signals?.projectOutcomeLevel === "support" || signals?.projectOutcomeLevel === "none")
  ) {
    gaps.push("기간이 짧거나 결과 수준이 낮으면 실행 깊이가 보수적으로 해석될 수 있습니다.");
  } else if (((signals?.internshipCount ?? 0) + (signals?.partTimeCount ?? 0)) > 0 && signals?.experienceDurationLevel !== "long") {
    gaps.push("기간이 짧거나 결과 수준이 낮으면 실행 깊이가 보수적으로 해석될 수 있습니다.");
  }
  if (totalCount > 0 && signals?.comboEvidence !== true && signals?.experienceDurationLevel !== "long") {
    gaps.push("단발성 경험 위주라면 책임 범위가 좁게 보일 수 있습니다.");
  } else if (totalCount === 0) {
    gaps.push("단발성 경험 위주라면 책임 범위가 좁게 보일 수 있습니다.");
  }

  return dedupeExplanationLines(gaps);
}

function buildNewgradInteractionFitToneSummary(signals, band) {
  const targetJobLabel = String(signals?.targetJobLabel || "").trim() || "목표 직무";
  const primaryHitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.primaryLabels, 2);
  const missingLabels = toTrimmedTextArray(signals?.missingImportantStakeholders, 2);
  const strongestIntensity = String(signals?.interactionIntensitySummary?.strongestIntensity || "").trim();

  if (primaryHitLabels.length > 0 && (band === "high" || band === "mid_high")) {
    const actionText = strongestIntensity === "owner" || strongestIntensity === "direct" ? "직접 소통한 경험" : "맞닿은 경험";
    return `${joinLabels(primaryHitLabels)}와 ${actionText}이 확인되어, ${targetJobLabel}에서 중요한 이해관계자 소통 경험이 비교적 강하게 연결됩니다.`;
  }
  if (primaryHitLabels.length > 0) {
    return `${joinLabels(primaryHitLabels)}와의 접점은 확인되지만, ${targetJobLabel} 기준으로는 직접성이나 반복 근거가 더 보강되면 좋습니다.`;
  }
  if (missingLabels.length > 0) {
    return `대인 소통 경험 자체는 보이지만, ${targetJobLabel}에서 중요한 ${joinLabels(missingLabels)}와의 접점 근거는 아직 제한적입니다.`;
  }
  return `${targetJobLabel} 기준으로 중요한 이해관계자와의 소통 근거는 아직 제한적으로 읽힐 수 있습니다.`;
}

function buildNewgradInteractionFitPositives(signals) {
  const positives = [];
  const primaryHitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.primaryLabels, 2);
  const secondaryHitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.secondaryLabels, 2);
  const evidenceSummaryLine = String(signals?.interactionEvidenceSummary?.line || "").trim();

  if (primaryHitLabels.length > 0) {
    positives.push(`${joinLabels(primaryHitLabels)}처럼 이 직무에서 중요한 상대와 맞닿은 경험은 축4에서 강한 신호가 됩니다.`);
  }
  if (secondaryHitLabels.length > 0) {
    positives.push(`${joinLabels(secondaryHitLabels)}와의 협업·조율 경험은 직무 이해관계자 맥락을 보강합니다.`);
  }
  if (evidenceSummaryLine) {
    positives.push(evidenceSummaryLine);
  }

  return dedupeExplanationLines(positives);
}

function buildNewgradInteractionFitGaps(signals) {
  const gaps = [];
  const missingLabels = toTrimmedTextArray(signals?.missingImportantStakeholders, 2);
  const strongestIntensity = String(signals?.interactionIntensitySummary?.strongestIntensity || "").trim();
  const selfReportSupportLevel = String(signals?.selfReportSupportLevel || "").trim();

  if (missingLabels.length > 0) {
    gaps.push(`${joinLabels(missingLabels)}처럼 목표 직무에서 중요한 상대와의 접점 근거가 더 필요합니다.`);
  }
  if (strongestIntensity === "support" || strongestIntensity === "adjacent") {
    gaps.push("참여·보조 수준을 넘어 직접 설명하거나 조율한 경험이 더 드러나면 이 축을 더 강하게 설명할 수 있습니다.");
  }
  if (selfReportSupportLevel !== "none" && (strongestIntensity === "support" || strongestIntensity === "")) {
    gaps.push("자기보고 소통 성향은 참고 신호일 뿐이고, 실제 상호작용 근거가 더 중요하게 반영됩니다.");
  }

  return dedupeExplanationLines(gaps);
}

function buildNewgradJobExperienceReasons(signals) {
  const reasons = [];
  const majorDisplayLabel = typeof signals?.majorDisplayLabel === "string"
    ? signals.majorDisplayLabel.trim()
    : "";

  if (majorDisplayLabel) {
    reasons.push({
      code: "experience_major_label",
      label: `${majorDisplayLabel} 전공 분류를 기준으로 목표 직무와의 연결성을 판단했습니다.`,
      direction: "positive",
    });
  }
  if ((signals?.courseworkCount ?? 0) > 0) {
    reasons.push({
      code: "experience_coursework",
      label: "관련 교과목 이수 여부를 전공 기반 연결을 보완하는 단서로 읽었습니다.",
      direction: "positive",
    });
  }
  return reasons;
}

function buildNewgradIndustryExperienceReasons(signals) {
  const reasons = [];
  const projectTypes = Array.isArray(signals?.projectTypeExperienceLabels) ? signals.projectTypeExperienceLabels : [];
  const internshipTypes = Array.isArray(signals?.internshipTypeExperienceLabels) ? signals.internshipTypeExperienceLabels : [];
  const stakeholders = Array.isArray(signals?.stakeholderExperienceLabels) ? signals.stakeholderExperienceLabels : [];

  if (projectTypes.length > 0) {
    reasons.push({
      code: "experience_project_type",
      label: `프로젝트 유형 ${toNewgradLabelList(projectTypes)}은 어떤 문맥에서 경험했는지 판단하는 근거로 쓰였습니다.`,
      direction: "positive",
    });
  }
  if (internshipTypes.length > 0) {
    reasons.push({
      code: "experience_intern_type",
      label: `인턴계약 경험 유형 ${toNewgradLabelList(internshipTypes)}은 실제 업무 환경의 문맥을 읽는 근거로 쓰였습니다.`,
      direction: "positive",
    });
  }
  if (stakeholders.length > 0) {
    reasons.push({
      code: "experience_stakeholder",
      label: `이해관계자 ${toNewgradLabelList(stakeholders)}는 누구와 직접 접점을 가졌는지 보여주는 근거로 쓰였습니다.`,
      direction: "positive",
    });
  }
  if ((projectTypes.length > 0 || internshipTypes.length > 0) && stakeholders.length > 0) {
    reasons.push({
      code: "experience_industry_combo",
      label: "같은 직무라도 프로젝트 성격과 이해관계자 구성이 다르면 산업 연결성 해석이 달라질 수 있습니다.",
      direction: "positive",
    });
  }
  return reasons;
}

function buildNewgradExecutionExperienceReasons(signals) {
  const reasons = [];
  const outcomes = Array.isArray(signals?.outcomeExperienceLabels) ? signals.outcomeExperienceLabels : [];
  const durations = Array.isArray(signals?.durationExperienceLabels) ? signals.durationExperienceLabels : [];

  if (outcomes.length > 0) {
    reasons.push({
      code: "experience_outcome",
      label: `프로젝트 결과 수준 ${toNewgradLabelList(outcomes)}은 어디까지 실행했는지 판단하는 신호로 쓰였습니다.`,
      direction: "positive",
    });
  }
  if (durations.length > 0) {
    reasons.push({
      code: "experience_duration",
      label: `인턴계약 기간 ${toNewgradLabelList(durations)}은 짧은 체험인지, 일정 기간 반복적으로 맡아본 경험인지 구분하는 데 쓰였습니다.`,
      direction: "positive",
    });
  }
  return reasons;
}

function buildNewgradInteractionExperienceReasons(signals) {
  const reasons = [];
  const hitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.allLabels, 3);
  const primaryHitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.primaryLabels, 2);
  const missingLabels = toTrimmedTextArray(signals?.missingImportantStakeholders, 2);
  const rationale = String(signals?.axis4RelevanceMeta?.rationale || "").trim();

  if (hitLabels.length > 0) {
    reasons.push({
      code: "experience_interaction_stakeholder",
      label: `이해관계자 ${toNewgradLabelList(hitLabels)}는 목표 직무와 맞닿는 상대를 실제로 다뤄본 근거로 쓰였습니다.`,
      direction: "positive",
    });
  }
  if (primaryHitLabels.length > 0) {
    reasons.push({
      code: "experience_interaction_primary_hit",
      label: `${toNewgradLabelList(primaryHitLabels)}는 이 직무에서 특히 중요한 상대라 축4 점수에 더 중요하게 반영됐습니다.`,
      direction: "positive",
    });
  }
  if (missingLabels.length > 0) {
    reasons.push({
      code: "experience_interaction_missing_primary",
      label: `${toNewgradLabelList(missingLabels)}와의 접점 근거는 아직 제한적이어서 축4 상한을 보수적으로 읽었습니다.`,
      direction: "negative",
    });
  }
  if (rationale) {
    reasons.push({
      code: "experience_interaction_job_rationale",
      label: rationale,
      direction: "positive",
    });
  }
  return reasons;
}

// ─── Newgrad Axis 1: jobStructure (전공과 직무의 연결성) ────────────────────────

const NEWGRAD_JOB_FIT_SUMMARY = {
  high:     "전공이 목표 직무의 핵심 과업과 잘 연결됩니다.",
  mid_high: "전공 기반 연결이 비교적 확인됩니다. 어떤 수업과 학습 배경이 이어지는지 연결해주면 더 좋습니다.",
  mid:      "기본 연결 고리는 있습니다. 전공 내용이 직무 과업과 어떻게 이어지는지 중심으로 구체화하면 좋습니다.",
  low:      "전공과 직무의 직접 연결이 약합니다. 연결 가능한 학습 기반이 있다면 더 적극적으로 풀어야 합니다.",
  very_low: "전공과 직무를 연결하는 직접적인 단서가 거의 없습니다. 직무 이해와 전공 기반을 먼저 드러낼 필요가 있습니다.",
};

function buildNewgradJobFitSummary(signals, band) {
  const fallback = NEWGRAD_JOB_FIT_SUMMARY[band] ?? NEWGRAD_JOB_FIT_SUMMARY.mid;
  const majorImpactSummary = typeof signals?.majorImpactSummary === "string"
    ? signals.majorImpactSummary.trim()
    : "";
  const primarySource = String(signals?.primaryEvidenceSource || "").trim();

  if (signals?.countOnlyFallbackUsed) {
    if (band === "mid" || band === "mid_high") {
      return "준비 단서는 일부 있으나, 목표 직무의 과업과 직접 이어지는 역할 근거는 더 필요합니다.";
    }
    if (band === "low" || band === "very_low") {
      return "직무 과업과 직접 연결되는 역할 단서는 아직 제한적입니다.";
    }
  }

  if (band === "high") {
    if (primarySource === "mixed") {
      return "전공 연결성이 분명하게 읽혀 목표 직무로의 방향성이 선명합니다.";
    }
  }

  if (band === "mid_high") {
    if (primarySource === "major") {
      return "전공 기반 연결은 비교적 분명합니다. 이를 수업과 학습 기반과 함께 묶어 설명하면 더 설득력 있습니다.";
    }
  }

  if (band === "mid") {
    if (primarySource === "major" && signals?.majorPriorLabel === "direct") {
      return "전공은 목표 직무의 기본 방향성과 맞닿아 있지만, 어떤 수업과 학습 기반이 이어지는지 더 보강하면 좋습니다.";
    }
    if (primarySource === "major" && signals?.majorPriorLabel === "adjacent") {
      return "전공은 목표 직무와 인접한 출발점으로 읽히지만, 과업 연결 근거는 더 필요합니다.";
    }
  }

  if (!majorImpactSummary) return fallback;
  if (!fallback) return majorImpactSummary;
  if (fallback.includes(majorImpactSummary)) return fallback;
  return `${majorImpactSummary} ${fallback}`.trim();
}

export function buildNewgradJobFitExplanation(signals, band, selectionPack = null) {
  if (!signals) return { available: false };

  const reasons = [...buildNewgradJobExperienceReasons(signals)];
  const majorWeightApplied = String(signals?.majorWeightApplied || "").trim();
  const majorImportanceReason = typeof signals?.majorImportanceReason === "string"
    ? signals.majorImportanceReason.trim()
    : "";

  if (majorWeightApplied === "strong_bonus" || majorWeightApplied === "light_bonus") {
    reasons.push({
      code: "major_dependency_positive",
      label: "이 직무는 전공 적합성을 비교적 중요하게 보는 편이며, 현재 전공 신호가 유리하게 반영되었습니다.",
      direction: "positive",
    });
  } else if (majorWeightApplied === "strong_penalty" || majorWeightApplied === "light_penalty") {
    reasons.push({
      code: "major_dependency_penalty",
      label: "현재 전공 mismatch는 일부 불리하게 작동하고 있어, 전공 안에서 직무 연결 단서를 더 분명히 보여줄 필요가 있습니다.",
      direction: "negative",
    });
  }
  if (majorImportanceReason) {
    reasons.push({
      code: "major_importance_reason",
      label: majorImportanceReason,
      direction: "neutral",
    });
  }

  // ── 전공 ─────────────────────────────────────────────────────────────────────
  if (signals.majorPriorLabel === "direct") {
    reasons.push({ code: "major_direct",   label: "전공이 목표 직무의 기본 방향성과 직접 맞닿아 있습니다.",  direction: "positive" });
  } else if (signals.majorPriorLabel === "adjacent") {
    reasons.push({ code: "major_adjacent", label: "전공이 목표 직무와 인접한 출발점으로 읽혀, 다른 과업 근거가 붙으면 설득력이 커질 수 있습니다.", direction: "positive" });
  } else if (signals.majorPriorLabel === "weak") {
    reasons.push({ code: "major_weak",     label: "전공만으로는 직무 방향성이 약하게 읽혀, 수업이나 역할 경험으로 보완하는 편이 좋습니다.", direction: "negative" });
  } else if (signals.majorPresent) {
    reasons.push({ code: "major_present",  label: "전공만으로는 목표 직무 방향성과 거리가 있어, 다른 과업 근거로 보완할 필요가 있습니다.", direction: "negative" });
  }

  // ── 전공 보정 신호 ────────────────────────────────────────────────────────────
  if (signals.majorPriorResolutionMode === "double_major") {
    reasons.push({
      code: "major_double_selected",
      label: "목표 직무와 더 가까운 전공 기준으로 판단했습니다.",
      direction: "positive",
    });
  } else if (signals.majorPriorResolutionMode === "unknown_major_fallback") {
    reasons.push({
      code: "major_unknown_fallback",
      label: "입력하신 전공은 유사 전공군 기준으로 보수적으로 판단했습니다.",
      direction: "neutral",
    });
  }
  if (signals.majorPriorMatchedBy === "override") {
    reasons.push({
      code: "major_override_applied",
      label: "세부 직군 특성을 반영해 전공 연결성이 보정되었습니다.",
      direction: "positive",
    });
  } else if (signals.majorPriorMatchedBy === "exception") {
    reasons.push({
      code: "major_exception_adjusted",
      label: "세부 직무 특성을 반영해 전공 연결성을 보정했습니다.",
      direction: "positive",
    });
  }

  // ── 교과목 ───────────────────────────────────────────────────────────────────
  if (signals.courseworkCount > 0) {
    reasons.push({ code: "coursework", label: "관련 교과목 이수로 직무 과업과 이어질 기초 단서를 보완하고 있습니다.", direction: "positive" });
  }

  const positives = buildNewgradJobFitPositives(signals);
  const gaps      = buildNewgradJobFitGaps(signals);
  if ((majorWeightApplied === "strong_bonus" || majorWeightApplied === "light_bonus")
    && !positives.includes("이 직무는 전공 적합성을 비교적 중요하게 보는 편이며, 현재 전공 신호가 유리하게 반영되었습니다.")) {
    positives.push("이 직무는 전공 적합성을 비교적 중요하게 보는 편이며, 현재 전공 신호가 유리하게 반영되었습니다.");
  }
  if ((majorWeightApplied === "strong_penalty" || majorWeightApplied === "light_penalty")
    && !gaps.includes("현재 전공 mismatch는 일부 불리하게 작동하고 있어, 전공 안에서 직무 연결 단서를 더 분명히 보여줄 필요가 있습니다.")) {
    gaps.push("현재 전공 mismatch는 일부 불리하게 작동하고 있어, 전공 안에서 직무 연결 단서를 더 분명히 보여줄 필요가 있습니다.");
  }
  const baseSummary = buildNewgradJobFitSummary(signals, band);
  const majorImpactSummary = typeof signals?.majorImpactSummary === "string"
    ? signals.majorImpactSummary.trim()
    : "";
  const finalSummary = majorImpactSummary && !baseSummary.includes(majorImpactSummary)
    ? `${majorImpactSummary} ${baseSummary}`.trim()
    : baseSummary;
  const explanationExtra = {
    ...pickExperienceExplanationExtra(signals),
    ...buildNewgradExplanationSlots("axis1", signals, band, selectionPack, finalSummary, reasons, gaps),
    ...(selectionPack != null ? { selectionPack } : {}),
  };
  if (!hasProducerExplanationCoverage(finalSummary, positives, gaps, explanationExtra)) {
    return { available: false };
  }

  return makeExplanation(finalSummary, positives, gaps, reasons, explanationExtra);
}

// ─── Newgrad Axis 2: industryContext (산업 연관성) ─────────────────────────────

const NEWGRAD_DOMAIN_INTEREST_SUMMARY = {
  high:     "전공, 자격증, 인턴 등 여러 경로에서 산업 이해 신호가 수렴합니다.",
  mid_high: "산업 관련 경험 소스가 충분히 있습니다.",
  mid:      "일부 산업 연관 신호가 있습니다. 어떻게 이 산업을 이해하게 됐는지 설명하면 더 좋습니다.",
  low:      "산업 연관성을 보여주는 신호가 부족합니다. 산업 이해를 드러내는 경험을 정리하면 좋습니다.",
  very_low: "산업 이해를 뒷받침하는 경험이 거의 없습니다.",
};

function buildNewgradDomainInterestSummary(signals, band) {
  const majorAligned = signals?.majorAligned === true;
  const certificationsAligned = signals?.certificationsAligned === true;
  const contextAligned = signals?.contextAligned === true;
  const projectIndustrySupportCount = Number(signals?.projectIndustrySupportCount ?? 0);
  const alignedEvidenceCount = [
    majorAligned,
    certificationsAligned,
    contextAligned,
    projectIndustrySupportCount > 0,
  ].filter(Boolean).length;
  const weakEvidenceCount = [
    signals?.majorPresent && !majorAligned,
    Number(signals?.certificationCount ?? 0) > 0 && !certificationsAligned,
    Number(signals?.projectCount ?? 0) > 0 && projectIndustrySupportCount === 0,
    signals?.internContextStrength === "support",
  ].filter(Boolean).length;

  if (alignedEvidenceCount >= 2) return "여러 경로에서 산업 이해 신호가 확인됩니다.";
  if (alignedEvidenceCount === 1 && weakEvidenceCount === 0) {
    return band === "mid_high" || band === "high"
      ? "산업 연관 신호가 비교적 분명합니다."
      : "산업 연관 신호가 확인됩니다.";
  }
  if (alignedEvidenceCount === 1 || weakEvidenceCount >= 1) {
    return "산업 연관 신호는 일부 있으나, 해당 산업과 직접적으로 연관된다는 보여줄 근거는 더 필요합니다.";
  }
  return NEWGRAD_DOMAIN_INTEREST_SUMMARY[band] ?? NEWGRAD_DOMAIN_INTEREST_SUMMARY.mid;
}

export function buildNewgradDomainInterestExplanation(signals, band, selectionPack = null) {
  if (!signals) return { available: false };

  const majorAligned = signals.majorAligned === true;
  const certificationsAligned = signals.certificationsAligned === true;
  const certificationCount = Number(signals.certificationCount ?? 0);
  const certDirectCount = Number(signals.certDirectCount ?? 0);
  const projectCount = Number(signals.projectCount ?? 0);
  const projectIndustrySupportCount = Number(signals.projectIndustrySupportCount ?? 0);
  const internshipCount = Number(signals.internshipCount ?? 0);
  const contractCount = Number(signals.contractCount ?? 0);
  const internContextStrength = String(signals.internContextStrength || "none");
  const alignedEvidenceCount = [
    majorAligned,
    certificationsAligned,
    signals.contextAligned === true,
    projectIndustrySupportCount > 0,
  ].filter(Boolean).length;
  const upgradedReasons = [...buildNewgradIndustryExperienceReasons(signals)];

  if (majorAligned) {
    upgradedReasons.push({ code: "major_aligned", label: "전공이 목표 산업 이해의 기반으로 작동하고 있습니다.", direction: "positive" });
  } else if (signals.majorPresent) {
    upgradedReasons.push({ code: "major_unaligned", label: "전공 자체보다 다른 경험으로 산업 이해를 보완해 설명할 필요가 있습니다.", direction: "negative" });
  }

  if (certificationsAligned) {
    const certLabels = Array.isArray(signals.certAlignedLabels) ? signals.certAlignedLabels.filter(Boolean) : [];
    upgradedReasons.push({
      code: "cert_direct",
      label: certLabels.length > 0
        ? buildCertAlignedLabel(certLabels, certDirectCount)
        : "관련 자격증이 산업 이해를 보완하는 근거가 됩니다.",
      direction: "positive",
    });
  } else if (certificationCount > 0) {
    const certWeakLabels = Array.isArray(signals.certWeakLabels) ? signals.certWeakLabels.filter(Boolean) : [];
    upgradedReasons.push({
      code: "cert_present",
      label: certWeakLabels.length > 0
        ? `자격증 ${certWeakLabels.join(", ")}은(는) 준비 신호로는 보이지만, 현재 정보만으로는 목표 분야와 직접 연결된다고 보기는 어렵습니다.`
        : "자격증은 있지만, 현재 정보만으로는 산업에 직접적으로 연관된다고 보이지 않습니다.",
      direction: "negative",
    });
  }

  if (signals.certFamilyCapApplied === true) {
    upgradedReasons.push({
      code: "cert_family_cap",
      label: "같은 계열 자격증이 여러 개 있어도 중복 가산은 제한하고, 대표 자격 위주로만 반영했습니다.",
      direction: "negative",
    });
  }

  if (projectIndustrySupportCount > 0) {
    upgradedReasons.push({ code: "project_industry_support", label: "산업 이해를 보여줄 수 있는 프로젝트 경험이 있습니다.", direction: "positive" });
  } else if (projectCount > 0) {
    upgradedReasons.push({ code: "project_present_only", label: "프로젝트 경험은 있지만, 현재 정보만으로는 산업 이해와의 직접 연결이 보이지 않습니다.", direction: "negative" });
  }

  if (internContextStrength === "strong") {
    upgradedReasons.push({ code: "context_strong", label: "인턴이나 실무 경험에서 목표 산업의 실제 맥락을 접한 흔적이 있습니다.", direction: "positive" });
  } else if (internContextStrength === "support") {
    upgradedReasons.push({ code: "context_support", label: "실무 환경을 간접적으로 접한 경험은 있으나, 산업에 직접적인 근거로는 추가 설명이 필요합니다.", direction: "negative" });
  } else if (internshipCount > 0 || contractCount > 0) {
    upgradedReasons.push({ code: "context_none", label: "실무 경험은 있지만, 현재 정보만으로는 산업 맥락과의 직접 연결이 드러나지 않습니다.", direction: "negative" });
  }

  if (alignedEvidenceCount <= 1 && !upgradedReasons.some((reason) => reason.direction === "negative")) {
    if (alignedEvidenceCount === 1) {
      upgradedReasons.push({ code: "need_more_direct_evidence", label: "전공, 프로젝트, 실무 경험 중 다른 경로의 산업 직접 근거를 보완하면 설명이 더 탄탄해집니다.", direction: "negative" });
    } else if (band === "low" || band === "very_low") {
      upgradedReasons.push({ code: "need_industry_evidence", label: "목표 산업과 직접 맞닿는 전공, 자격증, 프로젝트, 실무 근거를 더 보완할 필요가 있습니다.", direction: "negative" });
    }
  }

  const summary = buildNewgradDomainInterestToneSummary(signals, band);
  const positives = buildNewgradDomainInterestPositives(signals);
  const gaps = buildNewgradDomainInterestGaps(signals);
  const explanationExtra = {
    ...pickExperienceExplanationExtra(signals),
    ...buildNewgradExplanationSlots("axis2", signals, band, selectionPack, summary, upgradedReasons, gaps),
    ...(selectionPack != null ? { selectionPack } : {}),
  };
  if (!hasProducerExplanationCoverage(summary, positives, gaps, explanationExtra)) {
    return { available: false };
  }
  return makeExplanation(summary, positives, gaps, upgradedReasons, explanationExtra);

  /* const reasons = [];
  if (signals.majorPresent)             reasons.push({ code: "major_domain",   label: "전공이 산업 이해의 기반이 될 수 있습니다.", direction: "positive" });
  if (signals.certificationCount > 0)   reasons.push({ code: "certs",          label: "관련 자격증이 있습니다.",                  direction: "positive" });
  if (signals.internshipCount > 0)      reasons.push({ code: "intern_domain",  label: "인턴십 경험이 있습니다.",                  direction: "positive" });
  if (signals.projectCount > 0)         reasons.push({ code: "project_domain", label: "산업 관련 프로젝트 경험이 있습니다.",      direction: "positive" });
  if (signals.contractCount > 0)        reasons.push({ code: "contract",       label: "계약/프리랜서 경험이 있습니다.",           direction: "positive" });

  if (signals.certificationCount === 0 && signals.internshipCount === 0 && (band === "low" || band === "very_low")) {
    reasons.push({ code: "no_cert_intern", label: "자격증이나 인턴 경험으로 산업 이해를 뒷받침하기 어렵습니다.", direction: "negative" });
  }

  const positives = reasons.filter((r) => r.direction === "positive").map((r) => r.label);
  const gaps      = reasons.filter((r) => r.direction === "negative").map((r) => r.label);
  if (positives.length === 0 && gaps.length === 0) return { available: false };

  return makeExplanation(NEWGRAD_DOMAIN_INTEREST_SUMMARY[band] ?? NEWGRAD_DOMAIN_INTEREST_SUMMARY.mid, positives, gaps, reasons); */
}

// ─── Newgrad Axis 3: responsibilityScope (유사한 경험이 있는가?) ────────────────

const NEWGRAD_EXECUTION_DEPTH_SUMMARY = {
  high:     "프로젝트, 인턴, 대외활동에서 책임 있는 역할을 맡아본 경험이 쌓여 있습니다.",
  mid_high: "복수의 활동에서 역할을 맡아본 경험이 있습니다.",
  mid:      "관련 활동 경험이 있습니다. 어떤 역할을 맡았고 어떤 결과를 냈는지 구체적으로 드러내면 좋습니다.",
  low:      "경험 범위가 충분하지 않습니다. 책임 있는 역할을 맡아본 경험을 구체적으로 보여주는 게 좋습니다.",
  very_low: "직접 역할을 맡아 수행한 경험이 거의 없습니다.",
};

function buildNewgradExecutionDepthSummary(signals, band) {
  const strength = signals?.evidenceStrength ?? "none";
  const projectOutcomeLevel = signals?.projectOutcomeLevel ?? "none";
  const experienceDurationLevel = signals?.experienceDurationLevel ?? "none";
  const comboEvidence = signals?.comboEvidence === true;
  const totalCount = (signals?.projectCount ?? 0)
    + (signals?.internshipCount ?? 0)
    + (signals?.extracurricularCount ?? 0)
    + (signals?.partTimeCount ?? 0);

  if (totalCount === 0) {
    return NEWGRAD_EXECUTION_DEPTH_SUMMARY[band] ?? NEWGRAD_EXECUTION_DEPTH_SUMMARY.very_low;
  }
  if (strength === "strong" || (comboEvidence && (projectOutcomeLevel === "strong" || experienceDurationLevel === "long"))) {
    return "유사한 과업을 수행한 경험이 비교적 분명하게 확인됩니다.";
  }
  if (projectOutcomeLevel === "support" || experienceDurationLevel === "long" || strength === "mixed" || comboEvidence) {
    return "유사 경험의 접점은 있으나, 깊이나 지속성은 케이스별로 갈립니다.";
  }
  if (band === "low" || band === "very_low" || strength === "weak") {
    return "관련 경험의 단서는 있으나 실제 수행 범위를 보여주는 근거는 아직 약합니다.";
  }
  return NEWGRAD_EXECUTION_DEPTH_SUMMARY[band] ?? NEWGRAD_EXECUTION_DEPTH_SUMMARY.mid;
}

export function buildNewgradExecutionDepthExplanation(signals, band, selectionPack = null) {
  if (!signals) return { available: false };

  const reasons = [...buildNewgradExecutionExperienceReasons(signals)];
  const totalCount = (signals.projectCount ?? 0)
    + (signals.internshipCount ?? 0)
    + (signals.extracurricularCount ?? 0)
    + (signals.partTimeCount ?? 0);
  const projectOutcomeLevel = signals.projectOutcomeLevel ?? "none";
  const experienceDurationLevel = signals.experienceDurationLevel ?? "none";
  const comboEvidence = signals.comboEvidence === true;
  const evidenceStrength = signals.evidenceStrength ?? "none";
  const evidenceGroupCount = signals.evidenceGroupCount ?? 0;

  if (comboEvidence) {
    reasons.push({
      code: "combo_evidence",
      label: "프로젝트와 실무 경험이 함께 있어 유사 경험의 설득력이 더 높아집니다.",
      direction: "positive",
    });
  }
  if (projectOutcomeLevel === "strong") {
    reasons.push({
      code: "project_outcome_strong",
      label: "단순 참여 수준을 넘어 결과물을 만들어본 경험이 확인됩니다.",
      direction: "positive",
    });
  } else if (projectOutcomeLevel === "support") {
    reasons.push({
      code: "project_outcome_support",
      label: "프로젝트 경험이 있어도 결과 수준은 더 선명하게 보여줄 필요가 있습니다.",
      direction: "negative",
    });
  } else if ((signals.projectCount ?? 0) > 0) {
    reasons.push({
      code: "project_outcome_missing",
      label: "프로젝트 경험은 있으나 실제 수행 범위나 결과물 수준은 더 구체화할 필요가 있습니다.",
      direction: "negative",
    });
  }

  if (experienceDurationLevel === "long") {
    reasons.push({
      code: "duration_long",
      label: "짧은 체험 수준을 넘어 일정 기간 반복된 경험이 있습니다.",
      direction: "positive",
    });
  } else if (((signals.internshipCount ?? 0) + (signals.partTimeCount ?? 0)) > 0) {
    reasons.push({
      code: "duration_short",
      label: "관련 경험의 기간이 길게 누적됐는지는 추가 설명이 필요합니다.",
      direction: "negative",
    });
  }

  if (evidenceStrength === "mixed" && evidenceGroupCount >= 2) {
    reasons.push({
      code: "multi_group_mixed",
      label: "여러 활동에서 접점은 보이지만, 깊이는 항목별로 차이가 있습니다.",
      direction: "positive",
    });
  } else if (evidenceStrength === "weak" && totalCount > 0) {
    reasons.push({
      code: "weak_depth",
      label: "관련 경험의 접점은 있지만, 실제 책임 범위는 아직 얕게 읽힐 수 있습니다.",
      direction: "negative",
    });
  }

  if (totalCount === 0) {
    reasons.push({ code: "no_activity", label: "책임을 맡아 수행한 활동 경험이 없습니다.", direction: "negative" });
  } else if ((band === "low" || band === "very_low") && !reasons.some((reason) => reason.direction === "negative")) {
    reasons.push({
      code: "low_depth_gap",
      label: "유사 경험의 단서는 있으나 실제 수행 범위와 지속성을 더 보여줄 필요가 있습니다.",
      direction: "negative",
    });
  }

  const summary = buildNewgradExecutionDepthToneSummary(signals, band);
  const positives = buildNewgradExecutionDepthPositives(signals);
  const gaps = buildNewgradExecutionDepthGaps(signals);
  const explanationExtra = {
    ...pickExperienceExplanationExtra(signals),
    ...buildNewgradExplanationSlots("axis3", signals, band, selectionPack, summary, reasons, gaps),
    ...(selectionPack != null ? { selectionPack } : {}),
  };
  if (!hasProducerExplanationCoverage(summary, positives, gaps, explanationExtra)) {
    return { available: false };
  }
  return makeExplanation(summary, positives, gaps, reasons, explanationExtra);
}

// ─── Newgrad Axis 4: customerType (이해관계자 소통 적합성) ──────────────────────

const NEWGRAD_INTERACTION_FIT_SUMMARY = {
  high:     "직무 핵심 이해관계자와의 직접 소통 경험이 비교적 강하게 확인됩니다.",
  mid_high: "이해관계자 소통 경험이 충분히 있습니다.",
  mid:      "이해관계자 소통 경험이 있습니다. 어떤 상대와 어떻게 맞닿았는지 더 드러나면 좋습니다.",
  low:      "직무 핵심 이해관계자와의 직접 소통 근거는 아직 제한적입니다.",
  very_low: "이해관계자 소통 경험이 거의 없습니다.",
};

export function buildNewgradInteractionFitExplanation(signals, band, selectionPack = null) {
  if (!signals) return { available: false };

  const reasons = [...buildNewgradInteractionExperienceReasons(signals)];
  if (signals.internshipCount >= 1)      reasons.push({ code: "intern_interact",   label: "인턴/계약 환경에서 이해관계자 소통 경험이 있습니다.", direction: "positive" });
  if (signals.partTimeCount >= 1)        reasons.push({ code: "parttime_interact", label: "아르바이트 등 현장 대면 경험이 있습니다.",         direction: "positive" });
  if (signals.extracurricularCount >= 1) reasons.push({ code: "extracurr_collab",  label: "대외활동에서 협업 경험이 있습니다.",              direction: "positive" });
  if (signals.workStyleNotesPresent)     reasons.push({ code: "workstyle_present", label: "소통 방식에 대한 자기 인식이 있습니다.",            direction: "positive" });

  const interactionLabels = Array.isArray(signals.interactionEligibleWorkStyleLabels)
    ? signals.interactionEligibleWorkStyleLabels.filter(Boolean)
    : [];
  const supportStrengthLabels = Array.isArray(signals.axis4SupportStrengthLabels)
    ? signals.axis4SupportStrengthLabels.filter(Boolean)
    : [];
  let selfReportSupportLine = "";

  if (interactionLabels.length > 0) {
    reasons.push({
      code: "interaction_style_aligned",
      label: `입력한 일하는 방식 중 ${interactionLabels.join(", ")}은 이해관계자 접점이 잦은 역할 문맥과 맞닿는 신호로 읽혔습니다.`,
      direction: "positive",
    });
    if (signals.selfReportDirectApplied) {
      selfReportSupportLine = `입력한 일하는 방식 중 ${interactionLabels.join(", ")}은 실제 상호작용 경험과 함께 읽혀 이 축 점수에 직접 반영되었습니다.`;
    } else {
      selfReportSupportLine = `입력한 일하는 방식 중 ${interactionLabels.join(", ")}은 소통 성향을 보강하는 참고 신호로만 반영되었습니다.`;
    }
  }

  if (supportStrengthLabels.length > 0) {
    reasons.push({
      code: "interaction_strength_support",
      label: `입력한 강점 중 ${supportStrengthLabels.join(", ")}은 이해관계자 소통 적합성 해석을 보강하는 참고 신호로 읽혔습니다.`,
      direction: "positive",
    });
  }

  const communicationCertLabels = Array.isArray(signals.communicationCertLabels)
    ? signals.communicationCertLabels.filter(Boolean)
    : [];
  if (communicationCertLabels.length > 0) {
    reasons.push({
      code: "communication_cert_support",
      label: `자격/시험 ${communicationCertLabels.join(", ")}은 이 직무의 대외·고객 소통 성격을 보강하는 약한 참고 신호로만 반영되었습니다.`,
      direction: "positive",
    });
  }

  const totalCount = (signals.internshipCount ?? 0) + (signals.projectCount ?? 0)
    + (signals.extracurricularCount ?? 0) + (signals.partTimeCount ?? 0);
  if (totalCount === 0) {
    reasons.push({ code: "no_interaction", label: "소통·협업 경험을 보여주는 활동이 없습니다.", direction: "negative" });
  }

  const summary = buildNewgradInteractionFitToneSummary(signals, band);
  const positives = buildNewgradInteractionFitPositives(signals);
  const gaps      = buildNewgradInteractionFitGaps(signals);
  const explanationExtra = {
    ...pickExperienceExplanationExtra(signals),
    ...buildNewgradExplanationSlots("axis4", signals, band, selectionPack, summary, reasons, gaps),
    selfReportSupportLine,
    selfReportHighlights: interactionLabels,
    ...(selectionPack != null ? { selectionPack } : {}),
  };
  if (!hasProducerExplanationCoverage(summary, positives, gaps, explanationExtra)) {
    return { available: false };
  }

  return makeExplanation(
    summary,
    positives,
    gaps,
    reasons,
    explanationExtra
  );
}

// ─── Newgrad Axis 5: roleCharacter (강점과 재능) ───────────────────────────────

const NEWGRAD_SOFT_SKILL_SUMMARY = {
  high:     "본인의 강점과 업무 스타일이 직무가 요구하는 방식과 잘 맞습니다.",
  mid_high: "강점과 업무 스타일이 직무와 상당 부분 일치합니다.",
  mid:      "일부 강점이 직무와 연결됩니다. 구체적인 상황에서 어떻게 발휘됐는지 보여주면 좋습니다.",
  low:      "입력된 강점과 직무 요구 스타일 간의 연결이 약합니다.",
  very_low: "강점이나 업무 스타일 정보가 부족해 직무 적합성을 판단하기 어렵습니다.",
};

export function buildNewgradSoftSkillMatchExplanation(signals, band, selectionPack = null) {
  if (!signals) return { available: false };

  const reasons = [];
  if (signals.strengthsCount >= 3)      reasons.push({ code: "strengths_multi", label: "복수의 강점이 입력되어 있습니다.",                    direction: "positive" });
  else if (signals.strengthsCount >= 1) reasons.push({ code: "strengths_one",   label: "강점 정보가 있습니다.",                              direction: "positive" });
  else                                  reasons.push({ code: "no_strengths",     label: "강점 정보가 없어 직무 적합성 판단이 어렵습니다.",    direction: "negative" });

  if (signals.workStyleNotesPresent)    reasons.push({ code: "workstyle",        label: "업무 스타일 정보가 있습니다.",                       direction: "positive" });

  const matchedStrengthLabels = Array.isArray(signals.matchedStrengthLabels)
    ? signals.matchedStrengthLabels.filter(Boolean)
    : [];
  const matchedWorkStyleLabels = Array.isArray(signals.matchedWorkStyleLabels)
    ? signals.matchedWorkStyleLabels.filter(Boolean)
    : [];
  let selfReportSupportLine = "";

  if (matchedStrengthLabels.length > 0) {
    reasons.push({
      code: "strengths_aligned",
      label: `입력한 강점 중 ${matchedStrengthLabels.join(", ")}은 이 직무가 요구하는 역할 성향과 직접 맞닿는 신호로 반영되었습니다.`,
      direction: "positive",
    });
  }
  if (matchedWorkStyleLabels.length > 0) {
    reasons.push({
      code: "workstyle_aligned",
      label: `입력한 일하는 방식 중 ${matchedWorkStyleLabels.join(", ")}은 역할 수행 방식과 연결되는 신호로 반영되었습니다.`,
      direction: "positive",
    });
  }
  if (signals.selfReportAlignedDirectly && (matchedStrengthLabels.length > 0 || matchedWorkStyleLabels.length > 0)) {
    const fragments = [];
    if (matchedStrengthLabels.length > 0) fragments.push(`강점 ${matchedStrengthLabels.join(", ")}`);
    if (matchedWorkStyleLabels.length > 0) fragments.push(`일하는 방식 ${matchedWorkStyleLabels.join(", ")}`);
    selfReportSupportLine = `${fragments.join(" / ")}이(가) 직무 성향 적합성 해석과 점수에 직접 반영되었습니다.`;
  }

  const positives = reasons.filter((r) => r.direction === "positive").map((r) => r.label);
  const gaps      = reasons.filter((r) => r.direction === "negative").map((r) => r.label);

  const summary = NEWGRAD_SOFT_SKILL_SUMMARY[band] ?? NEWGRAD_SOFT_SKILL_SUMMARY.mid;
  const explanationExtra = {
    ...buildNewgradExplanationSlots("axis5", signals, band, selectionPack, summary, reasons, gaps),
    selfReportSupportLine,
    selfReportHighlights: [...matchedStrengthLabels, ...matchedWorkStyleLabels].slice(0, 4),
    ...(selectionPack != null ? { selectionPack } : {}),
  };
  if (!hasProducerExplanationCoverage(summary, positives, gaps, explanationExtra)) {
    return { available: false };
  }

  return makeExplanation(
    summary,
    positives,
    gaps,
    reasons,
    explanationExtra
  );
}
