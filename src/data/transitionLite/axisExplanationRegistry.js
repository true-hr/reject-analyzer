// src/data/transitionLite/axisExplanationRegistry.js
// Explanation producer for transition-lite axis details.
import { getCategoryActions, getCategoryLabel } from "./newgradJobCategoryCoreActions.js";
import { resolveMajorCanonicalActions } from "./newgradMajorCanonicalActionsRegistry.js";
import { getJobSpecificAxis1Actions } from "./newgradJobSpecificAxis1ActionsRegistry.js";
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
  전기공사기사: "전기/설비/시공 계열",
  건설안전기사: "건설/안전관리/현장관리 계열",
  "소방설비기사(기계분야)": "소방/설비/시설관리 계열",
  "소방설비기사(전기분야)": "소방/설비/시설관리 계열",
  기계설계기사: "기계설계/제조기술 계열",
  자동화설비산업기사: "자동화/설비/제조기술 계열",
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

const NEWGRAD_AXIS1_BAND_PHRASE = {
  direct: "비교적 분명한",
  adjacent: "일부 보이는",
  weak: "아직 약한",
  mismatch: "약한",
  none: "약한",
};

const AXIS1_ACTION_FAMILY_RULES = [
  { family: "analyze", keywords: ["분석", "진단", "해석", "관찰", "리서치"] },
  { family: "define", keywords: ["정의", "정리", "기준", "가설", "요구사항", "문서"] },
  { family: "plan", keywords: ["설계", "기획", "계획", "우선순위", "방향", "전략"] },
  { family: "build", keywords: ["구현", "제작", "개발", "코드", "프로토타입", "구축"] },
  { family: "operate", keywords: ["운영", "관리", "모니터링", "가동", "마감"] },
  { family: "quality", keywords: ["검토", "검증", "검수", "대조", "불량", "품질"] },
  { family: "coordinate", keywords: ["조율", "협상", "설득", "전달", "협력", "영입", "코칭"] },
  { family: "user", keywords: ["사용자", "고객", "니즈", "반응", "문의", "민원", "피드백"] },
  { family: "data", keywords: ["데이터", "통계", "수치", "지표", "알고리즘"] },
  { family: "content", keywords: ["콘텐츠", "메시지", "소재", "브랜드", "시각", "화면"] },
  { family: "research", keywords: ["연구", "실험", "규정", "정책", "법규", "자문"] },
];

const AXIS1_RELATED_PRIORITY = [
  "analyze",
  "define",
  "plan",
  "data",
  "user",
  "content",
  "research",
  "quality",
  "build",
  "operate",
  "coordinate",
];

const AXIS1_MISSING_PRIORITY = [
  "operate",
  "coordinate",
  "quality",
  "build",
  "plan",
  "user",
  "analyze",
  "define",
  "data",
  "content",
  "research",
];

function inferAxis1ActionFamilies(text = "") {
  const safeText = String(text || "").trim();
  const families = new Set();
  if (!safeText) return families;

  for (const rule of AXIS1_ACTION_FAMILY_RULES) {
    if (rule.keywords.some((keyword) => safeText.includes(keyword))) {
      families.add(rule.family);
    }
  }
  return families;
}

function inferAxis1ActionKeywords(text = "") {
  const safeText = String(text || "").trim();
  const keywords = new Set();
  if (!safeText) return keywords;

  for (const rule of AXIS1_ACTION_FAMILY_RULES) {
    for (const keyword of rule.keywords) {
      if (safeText.includes(keyword)) keywords.add(keyword);
    }
  }
  return keywords;
}

function getAxis1ActionPriority(action = "", priorityList = []) {
  const families = [...inferAxis1ActionFamilies(action)];
  if (families.length === 0) return priorityList.length + 1;
  const indexes = families
    .map((family) => priorityList.indexOf(family))
    .filter((index) => index >= 0);
  return indexes.length > 0 ? Math.min(...indexes) : priorityList.length;
}

function scoreAxis1ActionRelation(jobAction = "", majorAction = "") {
  const jobFamilies = inferAxis1ActionFamilies(jobAction);
  const majorFamilies = inferAxis1ActionFamilies(majorAction);
  const familyOverlap = [...jobFamilies].filter((family) => majorFamilies.has(family)).length;
  const jobKeywords = inferAxis1ActionKeywords(jobAction);
  const majorKeywords = inferAxis1ActionKeywords(majorAction);
  const keywordOverlap = [...jobKeywords].filter((keyword) => majorKeywords.has(keyword)).length;
  return familyOverlap * 3 + keywordOverlap;
}

function dedupeAxis1Actions(actions = []) {
  const result = [];
  const seen = new Set();
  for (const action of actions) {
    const safeAction = String(action || "").trim();
    if (!safeAction || seen.has(safeAction)) continue;
    seen.add(safeAction);
    result.push(safeAction);
  }
  return result;
}

function joinAxis1Labels(items = [], maxCount = 2) {
  const safeItems = dedupeAxis1Actions(items).slice(0, maxCount);
  if (safeItems.length === 0) return "";
  if (safeItems.length === 1) return safeItems[0];
  return safeItems.join(", ");
}

function pickAxis1RelatedJobActions(categoryActions = [], majorActions = []) {
  const safeCategoryActions = dedupeAxis1Actions(categoryActions);
  if (safeCategoryActions.length === 0) return [];

  const scored = safeCategoryActions.map((jobAction) => ({
    action: jobAction,
    score: Math.max(0, ...majorActions.map((majorAction) => scoreAxis1ActionRelation(jobAction, majorAction)), 0),
    priority: getAxis1ActionPriority(jobAction, AXIS1_RELATED_PRIORITY),
  }));

  const overlapMatches = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.priority - b.priority || a.action.localeCompare(b.action, "ko"));

  if (overlapMatches.length > 0) {
    return overlapMatches.slice(0, 2).map((item) => item.action);
  }

  return [...safeCategoryActions]
    .sort((a, b) => getAxis1ActionPriority(a, AXIS1_RELATED_PRIORITY) - getAxis1ActionPriority(b, AXIS1_RELATED_PRIORITY))
    .slice(0, Math.min(2, safeCategoryActions.length));
}

function pickAxis1MissingJobActions(categoryActions = [], relatedActions = []) {
  const relatedSet = new Set(dedupeAxis1Actions(relatedActions));
  const remaining = dedupeAxis1Actions(categoryActions).filter((action) => !relatedSet.has(action));

  if (remaining.length > 0) {
    return [...remaining]
      .sort((a, b) => getAxis1ActionPriority(a, AXIS1_MISSING_PRIORITY) - getAxis1ActionPriority(b, AXIS1_MISSING_PRIORITY))
      .slice(0, Math.min(2, remaining.length));
  }

  const safeCategoryActions = dedupeAxis1Actions(categoryActions);
  return safeCategoryActions.slice(0, Math.min(1, safeCategoryActions.length));
}

function buildAxis1FollowUpQuestion(learningBasis = [], majorActions = [], missingActions = []) {
  const learningBasisText = joinAxis1Labels(learningBasis, 2);
  const majorActionText = joinAxis1Labels(majorActions, 2) || "전공에서 익힌 분석·정리 방식";
  const missingActionText = joinAxis1Labels(missingActions, 2) || "직무에서 바로 쓰는 실행 판단";

  if (learningBasisText) {
    return `${learningBasisText}에서 ${majorActionText}를 어떤 방식으로 다뤘고 ${missingActionText}와 이어지는 과제나 산출물이 있었는지`;
  }

  return `전공 수업이나 프로젝트 안에서 ${majorActionText}를 어떤 방식으로 다뤘고 ${missingActionText}와 이어지는 과제나 산출물이 있었는지`;
}

// Role-specific Axis1 reading profiles for key job categories
// @MX:NOTE: Profiles enable job-specific language for detail card output
const AXIS1_ROLE_READING_PROFILES = {
  // Backend Development
  JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT: {
    jobCoreActions: ["시스템 구현", "데이터 처리", "로직 설계"],
    majorRelatedActions: ["시스템 구현", "데이터 처리", "로직 설계"],
    missingActions: [
      "실제 서비스 환경에서 서버 구조를 설계했는지",
      "데이터 흐름을 다뤘는지",
      "기능을 안정적으로 구현했는지",
    ],
    followUpActions: ["서버 로직 구현", "데이터베이스 활용", "API 설계", "오류 수정"],
  },
  // Service Planning / Product Planning
  JOB_BUSINESS_SERVICE_PLANNING: {
    jobCoreActions: ["요구사항 정리", "기능 흐름 설계", "우선순위 판단"],
    majorRelatedActions: ["요구사항 정리", "기능 흐름 설계", "우선순위 판단"],
    missingActions: [
      "사용자 문제를 기능 요구사항으로 바꿨는지",
      "화면·정책·운영 흐름을 정리했는지",
      "이해관계자와 기준을 맞췄는지",
    ],
    followUpActions: ["사용자 불편을 정리한 장면", "기능 흐름이나 화면 구조를 설계한 장면", "개선안을 문서로 정리한 장면"],
  },
  // Performance Marketing
  JOB_MARKETING_PERFORMANCE_MARKETING: {
    jobCoreActions: ["고객 반응 분석", "콘텐츠와 메시지 개선", "채널 운영"],
    majorRelatedActions: ["고객 반응 분석", "콘텐츠와 메시지 개선", "채널 운영"],
    missingActions: [
      "광고 성과 지표를 해석했는지",
      "고객 반응을 보고 메시지를 바꿨는지",
      "채널별 실험을 반복했는지",
    ],
    followUpActions: ["콘텐츠 반응을 비교한 장면", "메시지를 바꿔본 장면", "조회·클릭·전환 데이터를 확인한 장면"],
  },
  // Accounting / Finance
  JOB_FINANCE_ACCOUNTING_ACCOUNTING: {
    jobCoreActions: ["거래 분류 및 분개", "재무제표 항목 정리", "숫자 오류 검증"],
    majorRelatedActions: ["거래 분류 및 분개", "재무제표 항목 정리", "숫자 오류 검증"],
    missingActions: [
      "실제 회계 시스템에서 증빙을 검토했는지",
      "결산 흐름을 처리했는지",
      "숫자 오류를 찾아 수정했는지",
    ],
    followUpActions: ["분개/결산 연습", "재무제표 분석 및 해석", "회계 시스템 또는 ERP 사용", "세무 신고 또는 회계 실습"],
  },
  // Frontend Development
  JOB_IT_DATA_DIGITAL_FRONTEND_DEVELOPMENT: {
    jobCoreActions: ["화면 구조 구현", "사용자 상호작용", "브라우저 최적화"],
    majorRelatedActions: ["화면 구조 구현", "사용자 상호작용", "브라우저 최적화"],
    missingActions: [
      "실제 서비스 화면을 구현했는지",
      "사용자 반응에 기반해 UI를 개선했는지",
      "다양한 브라우저·디바이스에서 동작하는지",
    ],
    followUpActions: ["HTML/CSS/JavaScript로 화면 구현", "컴포넌트 설계 및 재사용", "반응형 UI 개발", "브라우저 호환성 테스트"],
  },
  // Data Analysis
  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
    jobCoreActions: ["데이터 정리", "패턴 분석", "인사이트 도출"],
    majorRelatedActions: ["데이터 정리", "패턴 분석", "인사이트 도출"],
    missingActions: [
      "비즈니스 문제를 분석했는지",
      "데이터 품질 문제를 다뤘는지",
      "분석 결과를 의사결정에 연결했는지",
    ],
    followUpActions: ["SQL 또는 Python으로 데이터 전처리", "통계 분석 실습", "데이터 시각화 및 보고", "실제 의사결정 영향 추적"],
  },
  // Data Engineering
  JOB_IT_DATA_DIGITAL_DATA_ENGINEERING: {
    jobCoreActions: ["데이터 흐름 설계", "파이프라인 개발", "안정적 데이터 처리"],
    majorRelatedActions: ["데이터 흐름 설계", "파이프라인 개발", "안정적 데이터 처리"],
    missingActions: [
      "운영 환경에서 파이프라인을 설계했는지",
      "데이터 품질 및 성능을 모니터링했는지",
      "장애 상황에 대응했는지",
    ],
    followUpActions: ["ETL/데이터 파이프라인 구축", "데이터베이스 설계 및 운영", "대용량 데이터 처리 경험", "클라우드 환경 인프라 이해"],
  },
  // Business Planning
  JOB_BUSINESS_BUSINESS_PLANNING: {
    jobCoreActions: ["문제 정의", "전략 수립", "실행 우선순위 판단"],
    majorRelatedActions: ["문제 정의", "전략 수립", "실행 우선순위 판단"],
    missingActions: [
      "시장·재무 데이터를 근거로 사업 판단을 했는지",
      "부서 간 조율 및 실행 경험이 있는지",
      "성과를 추적하고 개선했는지",
    ],
    followUpActions: ["사업 계획서 작성 및 수정", "재무 모델링 및 ROI 분석", "경쟁사 및 시장 분석", "이해관계자 협의 및 설득"],
  },
  // Quality Control
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL: {
    jobCoreActions: ["기준과 편차 확인", "공정·제품 문제 원인 분석", "재발 방지 방안 설계"],
    majorRelatedActions: ["기준과 편차 확인", "공정·제품 문제 원인 분석", "재발 방지 방안 설계"],
    missingActions: [
      "실제 현장에서 불량을 검사·분류했는지",
      "공정 개선을 주도했는지",
      "고객 불량 대응 경험이 있는지",
    ],
    followUpActions: ["검사 기준 및 품질 지표 학습", "통계적 품질관리(SQC) 실습", "불량 원인 분석 방법론", "현장 개선 프로젝트 추진"],
  },
  // Content Marketing
  JOB_MARKETING_CONTENT_MARKETING: {
    jobCoreActions: ["콘텐츠 주제 기획", "메시지 구조화", "독자·고객 반응 이해"],
    majorRelatedActions: ["콘텐츠 주제 기획", "메시지 구조화", "독자·고객 반응 이해"],
    missingActions: [
      "실제 콘텐츠를 발행했는지",
      "반응 데이터를 보고 개선했는지",
      "브랜드·고객 맥락에 맞춰 메시지를 조정했는지",
    ],
    followUpActions: ["콘텐츠 기획안 작성", "카드뉴스·영상·블로그 제작", "조회·클릭·전환 지표 해석", "타깃별 메시지 수정 경험"],
  },
  // Brand Marketing
  JOB_MARKETING_BRAND_MARKETING: {
    jobCoreActions: ["브랜드 포지셔닝 이해", "고객 인식과 메시지 관리", "캠페인 콘셉트 기획"],
    majorRelatedActions: ["브랜드 포지셔닝 이해", "고객 인식과 메시지 관리", "캠페인 콘셉트 기획"],
    missingActions: [
      "실제 브랜드 캠페인을 운영했는지",
      "고객 인식 변화를 측정했는지",
      "매출·성과와 연결했는지",
    ],
    followUpActions: ["브랜드 분석 과제", "캠페인 기획안", "경쟁사 포지셔닝 비교", "소비자 조사 및 메시지 테스트"],
  },
  // Marketing Research
  JOB_MARKETING_MARKETING_RESEARCH: {
    jobCoreActions: ["조사 설계", "고객·시장 데이터 수집", "응답·행동 패턴 분석"],
    majorRelatedActions: ["조사 설계", "고객·시장 데이터 수집", "응답·행동 패턴 분석"],
    missingActions: [
      "실제 조사 설계·표본 관리를 했는지",
      "데이터 품질 점검을 했는지",
      "분석 결과를 마케팅 의사결정으로 연결했는지",
    ],
    followUpActions: ["설문 설계 및 표본 추출", "인터뷰·FGI 진행", "통계 분석 실습", "리서치 보고서 및 세그먼트 도출"],
  },
  // HR Planning
  JOB_HR_ORGANIZATION_HR_PLANNING: {
    jobCoreActions: ["조직과 사람 이슈 구조화", "인사 제도·운영 기준 이해", "직무·역량 기준 정리"],
    majorRelatedActions: ["조직과 사람 이슈 구조화", "인사 제도·운영 기준 이해", "직무·역량 기준 정리"],
    missingActions: [
      "실제 채용·평가·보상·조직문화 제도를 운영했는지",
      "구성원과 현업을 조율했는지",
      "제도 실행 과정의 커뮤니케이션을 주도했는지",
    ],
    followUpActions: ["조직행동론·산업심리 학습", "채용 기준 및 직무기술서 정리", "교육·훈련 설계", "조직문화 개선 과제 경험"],
  },
  // Production Engineering
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING: {
    jobCoreActions: ["공정 흐름 이해", "설비·생산 조건 파악", "생산성·품질·안정성 개선"],
    majorRelatedActions: ["공정 흐름 이해", "설비·생산 조건 파악", "생산성·품질·안정성 개선"],
    missingActions: [
      "실제 현장 설비를 다뤄봤는지",
      "공정 조건을 개선했는지",
      "생산 이슈를 해결했는지",
    ],
    followUpActions: ["공정 설계 및 시뮬레이션", "설비·제어 실습", "생산성 개선 프로젝트", "품질·불량 분석 및 현장 실습"],
  },
  // Product Management
  JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT: {
    jobCoreActions: ["사용자 문제 파악", "요구사항 정리", "기능 우선순위 판단"],
    majorRelatedActions: ["사용자 문제 파악", "요구사항 정리", "기능 우선순위 판단"],
    missingActions: [
      "실제 제품 요구사항을 정의한 경험",
      "개발/디자인 협업 흐름을 조율한 경험",
      "사용자 피드백이나 데이터를 바탕으로 개선안을 낸 경험",
    ],
    followUpActions: ["서비스 기획서 작성", "사용자 시나리오/유저 플로우 정리", "기능 우선순위표 작성", "제품 지표 분석"],
  },
  // Data Science
  JOB_IT_DATA_DIGITAL_DATA_SCIENCE: {
    jobCoreActions: ["데이터로 문제 정의", "통계·모델링 기반 분석", "예측/분류 모델 실험"],
    majorRelatedActions: ["데이터로 문제 정의", "통계·모델링 기반 분석", "예측/분류 모델 실험"],
    missingActions: [
      "실제 데이터를 수집/정제한 경험",
      "모델을 설계·검증한 경험",
      "분석 결과를 비즈니스 문제와 연결한 경험",
    ],
    followUpActions: ["통계/머신러닝 과제", "데이터 전처리", "예측 모델 실험 및 검증", "분석 결과 리포트 작성"],
  },
  // QA / Test Automation
  JOB_IT_DATA_DIGITAL_QA_TEST_AUTOMATION: {
    jobCoreActions: ["기능 요구사항을 테스트 조건으로 변환", "오류 가능성을 기준으로 테스트 설계", "반복 검증 자동화"],
    majorRelatedActions: ["기능 요구사항을 테스트 조건으로 변환", "오류 가능성을 기준으로 테스트 설계"],
    missingActions: [
      "실제 테스트 케이스를 작성한 경험",
      "버그를 재현하고 기록한 경험",
      "자동화 스크립트나 테스트 도구를 사용한 경험",
    ],
    followUpActions: ["테스트 케이스 작성", "버그 리포트 작성", "자동화 테스트 스크립트 작성", "회귀 테스트 경험"],
  },
  // Mobile Development
  JOB_IT_DATA_DIGITAL_MOBILE_DEVELOPMENT: {
    jobCoreActions: ["모바일 화면과 기능 흐름 구현", "기기/OS 환경 차이 고려", "앱 상태와 데이터 흐름 관리"],
    majorRelatedActions: ["모바일 화면과 기능 흐름 구현", "기기/OS 환경 차이 고려"],
    missingActions: [
      "실제 앱 화면이나 기능을 구현한 경험",
      "API 연동 경험",
      "기기별 동작 차이를 점검한 경험",
    ],
    followUpActions: ["모바일 앱 프로젝트", "iOS/Android 화면 구현", "API 연동", "앱 오류 수정 및 테스트"],
  },
  // Digital Marketing
  JOB_MARKETING_DIGITAL_MARKETING: {
    jobCoreActions: ["온라인 채널별 고객 접점 이해", "캠페인 목표와 메시지 설계", "유입/전환 지표 확인"],
    majorRelatedActions: ["온라인 채널별 고객 접점 이해", "캠페인 목표와 메시지 설계"],
    missingActions: [
      "실제 캠페인을 운영한 경험",
      "채널별 성과 데이터를 본 경험",
      "광고/콘텐츠/랜딩 흐름을 설계한 경험",
    ],
    followUpActions: ["디지털 캠페인 기획", "GA4/광고관리자 지표 분석", "콘텐츠-랜딩-전환 흐름 설계", "채널별 성과 비교"],
  },
  // UI Design
  JOB_DESIGN_UI_DESIGN: {
    jobCoreActions: ["화면 구조와 정보 위계를 정리", "버튼·입력창·메뉴 같은 인터페이스 요소 설계", "사용자가 이해하기 쉬운 시각적 흐름 구성"],
    majorRelatedActions: ["화면 구조와 정보 위계를 정리", "버튼·입력창·메뉴 같은 인터페이스 요소 설계", "사용자가 이해하기 쉬운 시각적 흐름 구성"],
    missingActions: [
      "실제 서비스 화면을 설계한 경험",
      "디자인 시스템이나 컴포넌트 규칙을 적용한 경험",
      "사용성 기준으로 화면을 개선한 경험",
    ],
    followUpActions: ["모바일/웹 화면 리디자인", "와이어프레임 또는 화면 설계", "디자인 시스템 구성", "Figma 프로토타입 제작"],
  },
  // UX Design
  JOB_DESIGN_UX_DESIGN: {
    jobCoreActions: ["사용자의 문제와 행동 흐름을 파악", "서비스 이용 여정과 주요 접점을 정리", "사용성 문제를 발견하고 개선 방향 설계"],
    majorRelatedActions: ["사용자의 문제와 행동 흐름을 파악", "서비스 이용 여정과 주요 접점을 정리"],
    missingActions: [
      "실제 사용자를 관찰하거나 인터뷰한 경험",
      "사용자 여정이나 페르소나를 정리한 경험",
      "사용성 테스트를 수행한 경험",
    ],
    followUpActions: ["사용자 인터뷰", "고객 여정지도 작성", "페르소나/사용 시나리오 정리", "사용성 테스트"],
  },
  // CRM Marketing
  JOB_MARKETING_CRM_MARKETING: {
    jobCoreActions: ["고객 데이터를 기준으로 고객군을 분류", "재방문·재구매·전환 흐름을 분석", "고객 상태에 맞는 메시지와 캠페인 설계"],
    majorRelatedActions: ["고객 데이터를 기준으로 고객군을 분류", "재방문·재구매·전환 흐름을 분석"],
    missingActions: [
      "실제 고객 데이터를 나눠본 경험",
      "리텐션/재구매/전환 지표를 본 경험",
      "CRM 툴이나 캠페인 자동화 도구를 다뤄본 경험",
    ],
    followUpActions: ["고객 세그먼트 분석", "리텐션/재구매 지표 분석", "CRM 캠페인 기획", "메시지 A/B 테스트"],
  },
  // B2B Sales
  JOB_SALES_B2B_SALES: {
    jobCoreActions: ["기업 고객의 문제와 구매 기준을 파악", "의사결정자와 이해관계자를 구분", "제품/서비스 가치를 고객 상황에 맞게 제안"],
    majorRelatedActions: ["기업 고객의 문제와 구매 기준을 파악", "제품/서비스 가치를 고객 상황에 맞게 제안"],
    missingActions: [
      "실제 고객 니즈를 파악한 경험",
      "제안서나 영업 자료를 만든 경험",
      "가격/계약/조건 협상 흐름을 경험한 경험",
    ],
    followUpActions: ["기업 고객 분석", "제안서 작성", "고객 미팅/상담 경험", "제품 가치 제안 정리"],
  },
  // SCM / Supply Chain Management
  JOB_PROCUREMENT_SCM_SCM: {
    jobCoreActions: ["수요와 공급 흐름을 구조화", "재고·납기·조달 일정을 관리", "생산/구매/물류 간 운영 흐름을 조율"],
    majorRelatedActions: ["수요와 공급 흐름을 구조화", "재고·납기·조달 일정을 관리"],
    missingActions: [
      "실제 수요/재고 데이터를 다뤄본 경험",
      "납기나 조달 일정을 관리한 경험",
      "생산·구매·물류 흐름을 연결해본 경험",
    ],
    followUpActions: ["수요예측 과제", "재고/납기 분석", "구매·물류 프로세스 정리", "생산계획 또는 운영관리 과제"],
  },
  // FP&A / Financial Planning & Analysis
  JOB_FINANCE_ACCOUNTING_FP_AND_A: {
    jobCoreActions: ["사업 실적과 비용 구조를 숫자로 해석하는 일", "예산, 매출, 손익, 현금흐름 등 재무 지표를 비교하는 일", "경영 의사결정에 필요한 분석 자료를 정리하는 일", "사업부별 실적 차이나 계획 대비 차이를 설명하는 일"],
    majorRelatedActions: ["경영학·회계학·경제학·통계학 전공은 재무제표, 원가, 예산, 수익성, 데이터 해석의 기초와 연결될 수 있습니다.", "산업공학·데이터 관련 전공은 수치 기반 분석, 모델링, 운영 지표 해석과 연결될 수 있습니다.", "수학·통계 계열은 지표를 구조화하고 변동 원인을 분석하는 사고와 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 사업부 데이터를 다뤘는지까지는 확인되지 않습니다.",
      "예산 수립, 실적 분석, 리포팅 자동화, 경영진 보고 경험은 별도 근거가 필요합니다.",
      "숫자를 해석하는 수준을 넘어 사업 의사결정으로 연결해본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 재무제표 분석, 손익 계산, 예산 계획, 비용 구조 분석을 해본 장면", "엑셀, SQL, BI 도구 등으로 지표를 정리하거나 비교한 경험", "특정 산업이나 사업모델의 매출·비용 구조를 분석한 경험"],
  },
  // Tax / Taxation
  JOB_FINANCE_ACCOUNTING_TAX: {
    jobCoreActions: ["세법과 회계 기준을 바탕으로 과세 항목을 검토하는 일", "부가세, 법인세, 원천세 등 신고 자료를 정리하는 일", "증빙, 거래 내역, 비용 처리의 적정성을 확인하는 일", "세무 리스크나 신고 오류 가능성을 점검하는 일"],
    majorRelatedActions: ["세무학·회계학 전공은 세법, 재무회계, 원가회계, 세무 신고 구조와 직접 연결될 수 있습니다.", "경영학 전공도 회계 원리, 기업 거래 구조, 재무제표 이해를 통해 세무 직무의 기초와 연결될 수 있습니다.", "법학 전공은 법 조문 해석과 규정 적용 사고 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 신고서 작성이나 세무 조정 경험까지 확인되지는 않습니다.",
      "세무 프로그램 사용, 증빙 검토, 신고 일정 관리 경험은 별도 근거가 필요합니다.",
      "세법을 실제 거래 사례에 적용해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["전공 수업에서 법인세, 소득세, 부가가치세, 세무회계 과제를 수행한 장면", "재무제표와 세무 신고 항목을 연결해본 과제나 실습", "세무사무소, 회계팀, 재무팀 인턴 경험"],
  },
  // CX Planning / Customer Experience Planning
  JOB_CUSTOMER_OPERATIONS_CX_PLANNING: {
    jobCoreActions: ["고객 여정과 불편 지점을 구조화하는 일", "고객 문의, VOC, 이용 데이터에서 반복 문제를 찾는 일", "고객 경험 개선을 위해 프로세스나 정책을 설계하는 일", "서비스 운영팀, 제품팀, 마케팅팀과 개선 과제를 조율하는 일"],
    majorRelatedActions: ["경영학·서비스경영·산업공학 전공은 프로세스 개선, 고객 여정, 운영 효율화 사고와 연결될 수 있습니다.", "심리학·소비자학 전공은 고객 행동, 만족도, 니즈 해석과 연결될 수 있습니다.", "데이터·통계 관련 전공은 VOC나 고객 행동 데이터를 분석하는 기초와 연결될 수 있습니다.", "디자인·UX 관련 전공은 사용자 경험 흐름과 문제 정의 관점에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 고객 문제를 발견하고 개선안으로 연결했는지는 확인되지 않습니다.",
      "VOC 분석, 고객 인터뷰, 여정지도 작성, 운영 정책 개선 경험은 별도 근거가 필요합니다.",
      "여러 부서와 협업해 개선안을 실행한 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 고객 여정, 서비스 프로세스, 만족도 조사, VOC 분석을 다룬 장면이 있는지 떠올려보세요.", "고객 불편을 발견하고 원인을 분류한 뒤 개선안이나 운영 정책으로 연결해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "고객 응대, 서비스 운영, 리서치, 사용자 인터뷰처럼 실제 고객 문제를 관찰한 경험도 연결성을 보완할 수 있습니다.", "CX기획은 전공만으로 직접 연결이 강하게 증명되기보다는, 고객 문제를 구조화하고 개선안으로 바꿔본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Customer Support / CS Operations
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: {
    jobCoreActions: ["고객 문의와 불만을 정확히 파악하는 일", "제품·서비스 정책을 기준으로 안내하는 일", "반복 문의나 문제 유형을 정리하는 일", "고객 응대 과정에서 감정 조율과 문제 해결을 함께 수행하는 일"],
    majorRelatedActions: ["소비자학·심리학·서비스경영 전공은 고객 이해, 상담, 서비스 품질 관리와 연결될 수 있습니다.", "경영학 전공은 고객 관리, 운영 프로세스, 서비스 정책 이해와 일부 연결될 수 있습니다.", "커뮤니케이션·언어 관련 전공은 고객 설명, 문의 응대, 메시지 전달 측면에서 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 고객 응대 역량이나 클레임 처리 경험이 확인되지는 않습니다.",
      "상담 스크립트 작성, 문의 분류, 고객 감정 조율, 문제 해결 경험은 별도 근거가 필요합니다.",
      "서비스 정책을 실제 고객 상황에 적용해본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["고객 응대 아르바이트, 상담 경험, 동아리 운영, 행사 안내 경험 등 실제 사람을 응대한 장면", "반복 문의를 정리하거나 안내 문구를 개선한 경험", "CS 직무는 전공보다 실제 응대 장면과 문제 해결 경험이 중요"],
  },
  // Recruiting / Recruitment
  JOB_HR_ORGANIZATION_RECRUITING: {
    jobCoreActions: ["직무 요구사항을 이해하고 채용 기준으로 정리하는 일", "지원자 이력과 직무 적합성을 비교하는 일", "채용 공고, 서류 검토, 면접 운영 흐름을 관리하는 일", "후보자와 현업 부서 사이에서 커뮤니케이션을 조율하는 일"],
    majorRelatedActions: ["경영학·인사조직 관련 전공은 조직 운영, 인사관리, 직무 분석의 기초와 연결될 수 있습니다.", "심리학 전공은 사람의 특성, 평가, 조직 적응 이해 측면에서 일부 연결될 수 있습니다.", "교육학·사회학 전공은 사람의 성장, 조직 내 역할, 집단 행동 이해와 연결될 수 있습니다.", "커뮤니케이션 관련 전공은 후보자 응대와 현업 조율 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 채용 운영이나 후보자 평가 경험이 확인되지는 않습니다.",
      "채용 공고 작성, 서류 스크리닝, 면접 일정 조율, 현업 커뮤니케이션 경험은 별도 근거가 필요합니다.",
      "직무별 평가 기준을 세워본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 직무 분석, 조직행동, 인사관리, 평가 기준 설계를 다룬 장면", "동아리·학생회·팀 프로젝트에서 사람을 선발하거나 역할을 배정한 경험", "채용 직무는 전공 연결성과 함께 사람을 평가·조율한 실제 경험이 중요"],
  },
  // Learning & Development / OD
  JOB_HR_ORGANIZATION_LEARNING_OD: {
    jobCoreActions: ["구성원의 역량 개발 니즈를 파악하는 일", "교육 프로그램이나 온보딩 과정을 설계하는 일", "조직문화, 협업 방식, 성장 체계를 개선하는 일", "교육 효과나 조직 변화 결과를 점검하는 일"],
    majorRelatedActions: ["교육학 전공은 학습 설계, 교육 평가, 교수설계와 직접 연결될 수 있습니다.", "경영학·인사조직 전공은 조직 운영, 인재개발, 조직행동 이해와 연결될 수 있습니다.", "심리학 전공은 동기, 학습, 행동 변화, 조직 적응 이해와 일부 연결될 수 있습니다.", "커뮤니케이션 전공은 교육 콘텐츠 전달과 조직 내 메시지 설계 측면에서 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 교육 프로그램을 설계하거나 운영한 경험까지 확인되지는 않습니다.",
      "교육 니즈 분석, 커리큘럼 설계, 강의 운영, 조직문화 개선 프로젝트 경험은 별도 근거가 필요합니다.",
      "교육 효과를 지표로 점검해본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업에서 교수설계, 교육평가, 조직행동, 인재개발을 다룬 장면", "멘토링, 튜터링, 온보딩, 워크숍 운영 경험", "단순히 교육에 관심이 있다는 표현보다, 누군가의 학습이나 변화를 설계한 장면이 더 중요"],
  },
  // HRBP / HR Business Partner
  JOB_HR_ORGANIZATION_HRBP: {
    jobCoreActions: ["사업부의 인력 이슈와 조직 문제를 파악하는 일", "현업 리더와 채용, 평가, 보상, 조직 운영 이슈를 조율하는 일", "인사 제도를 사업 목표와 연결해 해석하는 일", "구성원 경험과 조직 성과 사이의 균형을 맞추는 일"],
    majorRelatedActions: ["경영학·인사조직 전공은 조직 운영, 인사관리, 성과관리, 조직행동과 연결될 수 있습니다.", "심리학·사회학 전공은 개인과 조직의 행동, 동기, 관계 구조 이해와 일부 연결될 수 있습니다.", "산업공학·데이터 관련 전공은 인력 지표, 조직 운영 데이터, 프로세스 개선 측면에서 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 현업 리더와 인사 이슈를 조율한 경험은 확인되지 않습니다.",
      "평가·보상·조직개편·인력계획 같은 복합 이슈를 다뤄본 경험은 별도 근거가 필요합니다.",
      "사업 이해와 사람 이슈를 함께 해석한 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 조직행동, 인사관리, 성과관리, 조직 설계를 다룬 장면", "팀 갈등 조율, 역할 재배치, 운영 규칙 설계 경험", "HRBP는 신입에게 다소 넓은 직무이므로, 전공 연결성보다 조직 문제를 구조적으로 본 경험이 중요"],
  },
  // MD / Merchandising
  JOB_BUSINESS_MERCHANDISING: {
    jobCoreActions: ["고객 수요와 시장 흐름을 바탕으로 상품을 기획하는 일", "가격, 마진, 재고, 판매 데이터를 함께 고려하는 일", "협력사, 브랜드, 유통 채널과 상품 운영을 조율하는 일", "판매 성과를 보고 다음 상품 전략에 반영하는 일"],
    majorRelatedActions: ["경영학·마케팅 전공은 상품 전략, 소비자 이해, 가격, 유통, 판매 분석과 연결될 수 있습니다.", "소비자학 전공은 고객 니즈와 구매 행동 이해 측면에서 연결될 수 있습니다.", "패션·식품·디자인 등 특정 상품군 관련 전공은 해당 카테고리의 소재, 트렌드, 제품 이해와 연결될 수 있습니다.", "통계·데이터 관련 전공은 판매 데이터와 수요 흐름 분석 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 상품을 소싱하거나 매출·재고를 운영한 경험은 확인되지 않습니다.",
      "협력사 커뮤니케이션, 판매 데이터 분석, 가격·마진 판단 경험은 별도 근거가 필요합니다.",
      "특정 카테고리에 대한 시장 감각과 상품 선택 기준은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 특정 상품군을 정하고 고객 수요, 가격대, 경쟁 상품, 판매 채널을 비교해본 장면이 있는지 떠올려보세요.", "가격 책정, 마진 계산, 재고 소진, 판매량 예측처럼 상품을 숫자로 판단해본 과제나 경험이 있다면 연결성을 더 구체화할 수 있습니다.", "쇼핑몰 운영, 제품 판매, 브랜드 분석, 카테고리 리서치 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "MD 직무는 전공보다 상품군 이해와 숫자 기반 판매 판단 경험이 함께 중요하게 보일 수 있습니다."],
  },
  // Procurement / Purchasing
  JOB_PROCUREMENT_SCM_PROCUREMENT: {
    jobCoreActions: ["필요한 자재나 서비스를 적정 조건으로 확보하는 일", "공급업체, 단가, 납기, 품질 조건을 비교하는 일", "발주, 계약, 비용 절감, 리스크 관리를 수행하는 일", "내부 수요 부서와 외부 협력사 사이에서 조건을 조율하는 일"],
    majorRelatedActions: ["경영학·무역학 전공은 구매, 계약, 협상, 공급업체 관리와 연결될 수 있습니다.", "산업공학 전공은 공급망, 원가, 프로세스 개선, 운영 최적화와 연결될 수 있습니다.", "기계·전기·화학 등 공학 전공은 특정 자재나 부품의 기술 사양을 이해하는 데 연결될 수 있습니다.", "물류·SCM 전공은 조달 흐름과 공급망 운영 이해와 직접 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 견적 비교, 발주, 협상, 계약 경험이 확인되지는 않습니다.",
      "공급업체 커뮤니케이션, 단가 비교, 납기 관리, 구매 시스템 사용 경험은 별도 근거가 필요합니다.",
      "비용과 품질, 납기 사이의 trade-off를 판단해본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 공급망, 원가관리, 구매관리, 무역 실무, 계약 조건을 다룬 장면", "업체 비교, 가격 조사, 예산 내 구매 결정, 행사 물품 조달 경험", "제조·유통·서비스 중 어떤 산업의 구매인지에 따라 강조 근거가 달라질 수 있습니다."],
  },
  // Logistics / Supply Chain Operations
  JOB_PROCUREMENT_SCM_LOGISTICS: {
    jobCoreActions: ["상품이나 자재의 이동, 보관, 배송 흐름을 관리하는 일", "재고, 입출고, 운송, 납기 지표를 확인하는 일", "물류비와 서비스 품질 사이의 균형을 조정하는 일", "창고, 운송사, 내부 운영 부서와 흐름을 맞추는 일"],
    majorRelatedActions: ["물류·SCM 전공은 운송, 보관, 재고, 공급망 흐름과 직접 연결될 수 있습니다.", "산업공학 전공은 프로세스 개선, 운영 최적화, 병목 분석과 연결될 수 있습니다.", "경영학 전공은 운영관리, 유통, 비용 관리 측면에서 일부 연결될 수 있습니다.", "데이터·통계 관련 전공은 물류 지표 분석과 수요·재고 흐름 해석에 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 물류 현장이나 시스템 운영 경험이 확인되지는 않습니다.",
      "입출고 관리, 재고 정확도 개선, 배송 이슈 대응, 물류비 분석 경험은 별도 근거가 필요합니다.",
      "현장 운영과 데이터 분석을 함께 다뤄본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 물류관리, 생산운영관리, 공급망관리, 재고관리, 프로세스 개선을 다룬 장면", "물류센터, 유통, 운영 아르바이트나 현장 경험", "물류 직무는 전공 연결성뿐 아니라 실제 흐름을 관찰하거나 개선해본 경험이 중요"],
  },
};

function getAxis1RoleReadingProfile(targetJobId) {
  const normalizedId = String(targetJobId || "").toUpperCase().trim();
  if (AXIS1_ROLE_READING_PROFILES[normalizedId]) {
    return AXIS1_ROLE_READING_PROFILES[normalizedId];
  }
  return null;
}

function buildAxis1ReasonText(majorLabel, targetJobLabel, majorRelatedActions, missingActions, majorPriorLabel) {
  const majorActionsStr = majorRelatedActions.filter(Boolean).slice(0, 3).join(", ");
  const missingActionsStr = missingActions.filter(Boolean).slice(0, 3).join(", ");

  if (majorPriorLabel === "weak" || majorPriorLabel === "mismatch") {
    // Conservative template for weak/mismatch fit
    return `${majorLabel} 전공은 ${targetJobLabel}에서 중요한 ${majorActionsStr} 같은 행동과 직접 이어지는 전공 기반은 아직 약한 편입니다. 현재 입력만으로는 ${missingActionsStr}까지는 직접 드러나지 않습니다.`;
  }

  // Standard template for direct/adjacent fit
  return `${majorLabel} 전공은 ${targetJobLabel}에서 중요한 ${majorActionsStr} 같은 기초 행동과는 연결될 수 있습니다. 다만 현재 입력만으로는 ${missingActionsStr}까지는 직접 드러나지 않습니다.`;
}

function buildAxis1FollowUpText(majorLabel, learningBasis, followUpActions, majorPriorLabel) {
  const followUpStr = followUpActions.filter(Boolean).slice(0, 4).join(", ");
  const learningBasisStr = learningBasis.filter(Boolean).slice(0, 2).join(", ");

  if (majorPriorLabel === "weak" || majorPriorLabel === "mismatch") {
    // For weak/mismatch, point to non-major sources
    return `이 연결을 더 강하게 보려면, 전공 외 프로젝트나 학습 경험 안에서 ${followUpStr} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;
  }

  // For direct/adjacent, emphasize coursework and projects
  return `이 연결을 더 강하게 보려면, 전공 수업이나 프로젝트 안에서 ${followUpStr} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;
}

export function buildNewgradAxis1CanonicalReading(input = {}) {
  const targetJobLabel = sanitizeDynamicLabel(input?.targetJobLabel) || "선택한 목표 직무";
  const majorLabel = sanitizeDynamicLabel(input?.majorDisplayLabel) || "현재 입력한 전공";
  const majorPriorLabel = String(input?.majorPriorLabel || "").trim() || "mismatch";
  const bandPhrase = NEWGRAD_AXIS1_BAND_PHRASE[majorPriorLabel] || NEWGRAD_AXIS1_BAND_PHRASE.mismatch;
  const targetJobCategory = String(input?.targetJobCategory || "").trim();
  const targetJobId = String(input?.targetJobId || "").trim();
  const categoryLabel = sanitizeDynamicLabel(input?.categoryLabel) || getCategoryLabel(targetJobCategory) || "이 직무군";

  // Job-specific actions override (Batch 1-A: IT/DATA direct jobs)
  const jobSpecificActions = getJobSpecificAxis1Actions(targetJobId);
  const shouldUseJobSpecificText = Boolean(jobSpecificActions?.preferJobSpecificText);
  const effectiveFoundationActions = jobSpecificActions?.foundationActions ||
    toTrimmedTextArray(
      Array.isArray(input?.categoryActions) ? input.categoryActions : getCategoryActions(targetJobCategory),
      6
    );

  const categoryActions = effectiveFoundationActions;
  const majorCanonicalActions = input?.majorCanonicalActions || resolveMajorCanonicalActions(input?.majorKey, majorLabel);
  const majorActions = toTrimmedTextArray(majorCanonicalActions?.canonicalActions, 4);
  const learningBasis = toTrimmedTextArray(majorCanonicalActions?.learningBasis, 3);
  const relatedJobActions = pickAxis1RelatedJobActions(effectiveFoundationActions, majorActions);

  // Use job-specific missingActions if available, otherwise compute from category
  const missingActions = jobSpecificActions?.missingActions
    ? toTrimmedTextArray(jobSpecificActions.missingActions, 3)
    : pickAxis1MissingJobActions(effectiveFoundationActions, relatedJobActions);
  const jobCoreActions = dedupeAxis1Actions([
    ...relatedJobActions,
    ...missingActions,
    ...categoryActions,
  ]).slice(0, 3);

  // Check for role-specific profile
  const roleProfile = getAxis1RoleReadingProfile(targetJobId);
  const majorRelatedActionsForDisplay = roleProfile ? roleProfile.majorRelatedActions : relatedJobActions;
  const missingActionsForDisplay = roleProfile ? roleProfile.missingActions : missingActions;
  const followUpActionsForDisplay = roleProfile ? roleProfile.followUpActions : majorActions;

  // Build role-specific reason text
  const scoreReason = shouldUseJobSpecificText
    ? `${majorLabel} 전공은 ${targetJobLabel}에서 중요한 ${joinAxis1Labels(jobSpecificActions.foundationActions, 3)} 같은 기초 행동과는 연결될 수 있습니다. 다만 현재 입력만으로는 ${joinAxis1Labels(jobSpecificActions.missingActions, 3)}까지는 직접 드러나지 않습니다.`
    : roleProfile
    ? buildAxis1ReasonText(majorLabel, targetJobLabel, majorRelatedActionsForDisplay, missingActionsForDisplay, majorPriorLabel)
    : jobSpecificActions
    ? `${majorLabel} 전공은 ${targetJobLabel}에서 중요한 ${joinAxis1Labels(jobSpecificActions.foundationActions, 3)} 같은 기초 행동과는 연결될 수 있습니다. 다만 현재 입력만으로는 ${joinAxis1Labels(jobSpecificActions.missingActions, 3)}까지는 직접 드러나지 않습니다.`
    : `${majorLabel} 전공은 ${categoryLabel}에서 중요한 ${joinAxis1Labels(jobCoreActions, 3)} 중 ${joinAxis1Labels(relatedJobActions, 2)}와는 연결될 수 있지만, 현재 입력만으로는 ${joinAxis1Labels(missingActions, 2)}까지 직접 드러나지는 않습니다.`;

  // Build role-specific follow-up text
  const liftOrLimit = shouldUseJobSpecificText
    ? `이 연결을 더 강하게 보려면, ${joinAxis1Labels(jobSpecificActions.nextEvidenceActions, 4)} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`
    : roleProfile
    ? buildAxis1FollowUpText(majorLabel, learningBasis, followUpActionsForDisplay, majorPriorLabel)
    : jobSpecificActions
    ? `이 연결을 더 강하게 보려면, ${joinAxis1Labels(jobSpecificActions.nextEvidenceActions, 4)} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`
    : `이 연결을 더 강하게 보려면, ${buildAxis1FollowUpQuestion(learningBasis, majorActions, missingActions)} 함께 떠올려보는 것이 좋습니다.`;

  return {
    lead: `현재 입력한 전공만 보면 ${targetJobLabel} 직무와의 연결은 ${bandPhrase} 편입니다.`,
    scoreReason,
    liftOrLimit,
    detailReadingMeta: {
      majorCanonicalLabel: majorCanonicalActions?.label || majorLabel,
      targetJobCategory,
      targetSubcategory: sanitizeDynamicLabel(input?.targetSubcategory) || "",
      jobCoreActions: jobSpecificActions ? jobSpecificActions.foundationActions : jobCoreActions,
      majorRelatedActions: relatedJobActions,
      missingActions: jobSpecificActions ? jobSpecificActions.missingActions : missingActions,
      learningBasis,
      jobSpecificActionsUsed: Boolean(jobSpecificActions || roleProfile),
      ...(jobSpecificActions ? {
        targetJobId: input?.targetJobId,
        targetJobLabel,
        jobSpecificFoundationActions: jobSpecificActions.foundationActions,
        jobSpecificMissingActions: jobSpecificActions.missingActions,
        jobSpecificNextEvidenceActions: jobSpecificActions.nextEvidenceActions,
      } : {}),
    },
  };
}

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
  const axis1CanonicalReading = buildNewgradAxis1CanonicalReading({
    majorDisplayLabel: signals.majorDisplayLabel,
    majorKey: signals.majorCanonicalKey,
    targetJobId: signals.targetJobId,
    targetJobLabel: signals.targetJobLabel,
    targetJobCategory: signals.targetJobCategory,
    targetSubcategory: signals.targetSubcategory,
    majorPriorLabel: signals.majorPriorLabel,
    categoryLabel: getCategoryLabel(signals.targetJobCategory),
    categoryActions: getCategoryActions(signals.targetJobCategory),
    majorCanonicalActions: resolveMajorCanonicalActions(signals.majorCanonicalKey, signals.majorDisplayLabel),
  });
  const explanationExtra = {
    ...pickExperienceExplanationExtra(signals),
    ...buildNewgradExplanationSlots("axis1", signals, band, selectionPack, finalSummary, reasons, gaps),
    ...axis1CanonicalReading,
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
