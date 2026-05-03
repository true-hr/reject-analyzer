// src/data/transitionLite/axisExplanationRegistry.js
// Explanation producer for transition-lite axis details.
import { getCategoryActions, getCategoryLabel } from "./newgradJobCategoryCoreActions.js";
import { resolveMajorCanonicalActions } from "./newgradMajorCanonicalActionsRegistry.js";
import { getJobSpecificAxis1Actions } from "./newgradJobSpecificAxis1ActionsRegistry.js";
import { resolveNewgradMajorCourseProfile, getNewgradJobCourses } from "./newgradMajorCourseRegistry.js";
import { resolveNewgradMajorBridgeProfile, getNewgradAppealingCourses } from "./newgradMajorBridgeRegistry.js";
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
    const actionText = strongestIntensity === "owner" || strongestIntensity === "direct" ? "상호작용 가능성" : "맞닿을 가능성";
    return `선택한 경험에서 ${joinLabels(primaryHitLabels)}와의 ${actionText} 신호가 있어, ${targetJobLabel}에 필요한 이해관계자 소통을 보수적으로 긍정 평가할 수 있습니다.`;
  }
  if (primaryHitLabels.length > 0) {
    return `${joinLabels(primaryHitLabels)}와의 접점은 확인되지만, ${targetJobLabel} 기준으로는 직접성이나 반복 근거가 더 보강되면 좋습니다.`;
  }
  if (missingLabels.length > 0) {
    return `대인 소통 경험 자체는 보이지만, ${targetJobLabel}에서 중요한 ${joinLabels(missingLabels)}와의 접점 근거는 아직 제한적입니다.`;
  }
  return `${targetJobLabel} 기준으로 중요한 이해관계자와의 소통 근거는 아직 제한적으로 읽힐 수 있습니다.`;
}

function formatAxis4CommunicationContext(context) {
  const text = String(context || "").trim();
  if (!text) return "";
  return text.replace(/하는 접점$/, "하는 부분");
}

function buildAxis4StakeholderRoleHint(signals) {
  const jobRelevantHit = signals?.jobRelevantStakeholdersHit;
  const relevanceMeta = signals?.axis4RelevanceMeta;
  const targetJobLabel = String(signals?.targetJobLabel || "").trim() || "목표 직무";

  if (!relevanceMeta?.stakeholderRoles) return "";

  const stakeholderRoles = relevanceMeta.stakeholderRoles;
  const primaryHitKeys = Array.isArray(jobRelevantHit?.primaryKeys) ? jobRelevantHit.primaryKeys : [];
  const secondaryHitKeys = Array.isArray(jobRelevantHit?.secondaryKeys) ? jobRelevantHit.secondaryKeys : [];

  let hitKey = "";
  let isPrimaryHit = false;
  if (primaryHitKeys.length > 0) {
    hitKey = String(primaryHitKeys[0] || "").trim();
    isPrimaryHit = true;
  } else if (secondaryHitKeys.length > 0) {
    hitKey = String(secondaryHitKeys[0] || "").trim();
    isPrimaryHit = false;
  }

  if (!hitKey || !stakeholderRoles[hitKey]) return "";

  const role = stakeholderRoles[hitKey];
  const label = String(role.label || "").trim();
  const communicationContext = String(role.communicationContext || "").trim();

  if (!label || !communicationContext) return "";

  const formattedContext = formatAxis4CommunicationContext(communicationContext);
  const firstSentence = `${targetJobLabel}에서는 ${label}와 맞닿아 ${formattedContext}이 중요합니다.`;
  const closingSentence = buildAxis4RoleHintClosing(hitKey, isPrimaryHit);

  if (!closingSentence) return firstSentence;
  return `${firstSentence} ${closingSentence}`;
}

function buildAxis4RoleHintClosing(roleKey, isPrimaryHit) {
  const internalRoles = ["internal_team", "cross_function_partner", "manager_reviewer"];
  const externalRoles = ["field_practitioner_operator", "external_partner_vendor", "customer_user"];

  const isInternalRole = internalRoles.includes(roleKey);
  const isExternalRole = externalRoles.includes(roleKey);

  if (isPrimaryHit) {
    if (isInternalRole) {
      return "지원서에서는 이 상대에게 무엇을 설명했고, 어떤 기준을 맞췄는지 드러내면 더 설득력 있게 보완됩니다.";
    }
    if (isExternalRole) {
      return "지원서에서는 이 상대의 요구나 반응을 어떻게 파악했고, 어떤 방식으로 대응했는지 구체화하면 좋습니다.";
    }
    return "현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다.";
  }

  if (isInternalRole) {
    return "다만 핵심 소통 장면으로 보려면, 지원서에서 이 상대와 어떤 기준을 맞췄는지 더 구체화하는 것이 좋습니다.";
  }
  if (isExternalRole) {
    return "다만 핵심 상호작용으로 보려면, 상대의 요구를 어떻게 파악했고 어떻게 대응했는지 구체화하면 좋습니다.";
  }
  return "다만 핵심 소통 장면으로 보려면, 자기소개서에서 이 상대와 어떤 기준을 맞췄는지 더 구체화하는 것이 좋습니다.";
}

function buildNewgradInteractionFitPositives(signals) {
  const positives = [];
  const primaryHitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.primaryLabels, 2);
  const secondaryHitLabels = toTrimmedTextArray(signals?.jobRelevantStakeholdersHit?.secondaryLabels, 2);
  const evidenceSummaryLine = String(signals?.interactionEvidenceSummary?.line || "").trim();

  if (primaryHitLabels.length > 0) {
    positives.push(`${joinLabels(primaryHitLabels)}처럼 이 직무에서 중요한 상대와 맞닭을 가능성은 축4에서 긍정적인 참고 신호로 읽힙니다.`);
  }
  if (secondaryHitLabels.length > 0) {
    positives.push(`${joinLabels(secondaryHitLabels)}와의 협업·조율 경험은 직무 이해관계자 맥락을 보강합니다.`);
  }

  const stakeholderRoleHint = buildAxis4StakeholderRoleHint(signals);
  if (stakeholderRoleHint) {
    positives.push(stakeholderRoleHint);
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
    gaps.push("참여·보조 수준의 선택을 넘어, 실제로 설명하거나 조율한 장면을 자기소개서에서 구체화하면 이 축을 더 설득력 있게 보완할 수 있습니다.");
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
  // Business Strategy
  JOB_BUSINESS_STRATEGY: {
    jobCoreActions: ["시장, 경쟁사, 고객, 사업모델을 분석해 방향성을 정리하는 일", "매출, 비용, 성장성, 수익성 지표를 바탕으로 사업 기회를 판단하는 일", "신규 사업, 진출 전략, 포트폴리오 조정 같은 의사결정 자료를 만드는 일", "경영진이나 사업부가 판단할 수 있도록 전략적 선택지를 구조화하는 일"],
    majorRelatedActions: ["경영학 전공은 경영전략, 마케팅, 재무, 조직, 사업모델 이해와 연결될 수 있습니다.", "경제학 전공은 시장 구조, 산업 변화, 수요·공급, 거시 환경 해석과 연결될 수 있습니다.", "산업공학 전공은 프로세스, 운영 효율, 최적화, 데이터 기반 의사결정과 연결될 수 있습니다.", "통계·데이터 관련 전공은 시장 데이터와 사업 지표를 분석하는 기초와 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 사업 전략을 수립하거나 의사결정에 참여한 경험은 확인되지 않습니다.",
      "시장 조사, 경쟁사 분석, 사업성 검토, 경영진 보고 자료 작성 경험은 별도 근거가 필요합니다.",
      "숫자 분석을 실제 전략 제안으로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 특정 기업, 산업, 시장을 분석하고 성장 전략을 제안해본 장면이 있는지 떠올려보세요.", "매출 구조, 비용 구조, 경쟁사 포지션, 고객군 차이를 비교해본 과제나 리서치가 있다면 연결성을 더 구체화할 수 있습니다.", "단순 조사보다 \"그래서 어떤 선택을 해야 하는가\"까지 제안한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "전략기획은 전공만으로 직접 수행력이 증명되기보다는, 분석 결과를 사업적 선택지로 구조화해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Business Support / Admin
  JOB_BUSINESS_BUSINESS_SUPPORT: {
    jobCoreActions: ["조직 운영에 필요한 행정, 자산, 계약, 비용, 문서 흐름을 관리하는 일", "내부 구성원이 원활히 일할 수 있도록 제도, 프로세스, 지원 체계를 정리하는 일", "예산, 구매, 시설, 비품, 문서, 일정 등 운영 요소를 빠짐없이 챙기는 일", "여러 부서의 요청을 조율하고 회사 운영 리스크를 줄이는 일"],
    majorRelatedActions: ["경영학 전공은 조직 운영, 회계 기초, 관리 프로세스, 경영지원 업무 이해와 연결될 수 있습니다.", "행정학 전공은 제도, 규정, 문서, 공공·조직 운영 체계 이해와 연결될 수 있습니다.", "회계·세무 관련 전공은 비용, 증빙, 정산, 예산 관리의 기초와 연결될 수 있습니다.", "법학 전공은 계약, 규정, 문서 검토, 컴플라이언스 이해 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 회사 운영 업무를 맡아본 경험은 확인되지 않습니다.",
      "비용 정산, 계약 관리, 자산 관리, 내부 요청 처리, 운영 프로세스 개선 경험은 별도 근거가 필요합니다.",
      "다양한 부서의 요청을 우선순위화하고 조율해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["학생회, 동아리, 팀 프로젝트에서 예산, 일정, 물품, 장소, 문서, 공지 등을 관리한 장면이 있는지 떠올려보세요.", "비용 정산, 행사 운영, 계약서·신청서·기안서 작성처럼 조직 운영을 뒷받침한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 보조가 아니라 누락을 줄이거나 업무 흐름을 정리한 경험이 있다면 연결성을 더 구체화할 수 있습니다.", "경영지원·총무는 전공 연결성보다 꼼꼼한 운영 경험과 내부 이해관계자 조율 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Legal / Research
  JOB_RESEARCH_PROFESSIONAL_LEGAL: {
    jobCoreActions: ["계약서, 약관, 정책, 법적 문서를 검토하는 일", "사업 운영 과정에서 발생할 수 있는 법적 리스크를 확인하는 일", "관련 법령, 규정, 판례, 가이드라인을 조사하고 적용 가능성을 정리하는 일", "현업 부서가 의사결정할 수 있도록 법적 쟁점을 쉽게 설명하는 일"],
    majorRelatedActions: ["법학 전공은 법령 해석, 계약, 민사·상사 법률, 규정 적용 사고와 직접 연결될 수 있습니다.", "행정학 전공은 제도, 규제, 공공 정책, 절차적 판단 이해와 일부 연결될 수 있습니다.", "경영학 전공은 기업 운영, 계약, 거래 구조, 리스크 관리 이해 측면에서 일부 연결될 수 있습니다.", "지식재산·콘텐츠·기술 관련 전공은 특정 산업의 권리, 저작권, 규제 이해와 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 계약서를 검토하거나 사업 리스크를 판단한 경험은 확인되지 않습니다.",
      "법률 리서치, 계약 조항 검토, 약관 비교, 컴플라이언스 점검 경험은 별도 근거가 필요합니다.",
      "법적 쟁점을 현업이 이해할 수 있는 언어로 풀어본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 과제에서 계약서, 약관, 판례, 법령, 규제 사례를 분석한 장면이 있는지 떠올려보세요.", "특정 서비스나 기업 활동에서 발생할 수 있는 법적 리스크를 정리해본 경험이 있다면 연결성을 더 구체화할 수 있습니다.", "단순 법 조문 암기보다 \"이 상황에 어떤 조항이 왜 문제가 되는가\"를 설명해본 경험이 Axis3에서 보강 근거가 됩니다.", "법무는 전공 연결성이 강할 수 있지만, 실제 사업 상황에 법적 판단을 적용해본 장면은 별도로 확인되어야 합니다."],
  },
  // General Sales
  JOB_SALES_GENERAL_SALES: {
    jobCoreActions: ["고객의 니즈와 구매 가능성을 파악하는 일", "제품이나 서비스의 가치를 고객 상황에 맞게 설명하는 일", "상담, 제안, 견적, 조건 협의, 계약 전환 과정을 관리하는 일", "고객 관계를 유지하고 반복 구매나 추가 기회를 만드는 일"],
    majorRelatedActions: ["경영학·마케팅 전공은 고객 이해, 판매 전략, 시장 분석, 제품 가치 전달과 연결될 수 있습니다.", "커뮤니케이션 전공은 설득, 메시지 구성, 대화 흐름 관리와 연결될 수 있습니다.", "심리학·소비자학 전공은 고객 행동, 구매 동기, 니즈 파악 측면에서 일부 연결될 수 있습니다.", "특정 산업 관련 전공은 해당 제품이나 서비스의 기술·상품 이해 측면에서 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 고객을 설득하거나 계약을 만든 경험은 확인되지 않습니다.",
      "고객 상담, 제안서 작성, 견적 협의, 클로징, 관계 관리 경험은 별도 근거가 필요합니다.",
      "거절 상황을 다루거나 고객별 메시지를 바꿔본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 제품·서비스를 정하고 고객군, 판매 포인트, 제안 메시지를 설계해본 장면이 있는지 떠올려보세요.", "아르바이트, 대외활동, 동아리, 행사 운영에서 사람을 설득하거나 참여를 이끌어낸 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "고객의 반응에 따라 설명 방식이나 제안 조건을 바꿔본 경험이 있다면 연결성을 더 구체화할 수 있습니다.", "영업은 전공만으로 직접 연결이 강하게 증명되기보다는, 실제 사람을 설득하고 관계를 만든 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Sales Operations
  JOB_SALES_SALES_OPERATIONS: {
    jobCoreActions: ["영업 목표, 파이프라인, 전환율, 매출 지표를 정리하는 일", "영업팀이 일관되게 움직일 수 있도록 프로세스와 도구를 관리하는 일", "고객·계약·견적·성과 데이터를 기반으로 병목을 찾는 일", "영업 전략과 현장 실행 사이의 운영 체계를 정비하는 일"],
    majorRelatedActions: ["경영학 전공은 영업관리, 성과관리, 조직 운영, 매출 구조 이해와 연결될 수 있습니다.", "통계·데이터 관련 전공은 전환율, 매출, 고객 데이터 분석의 기초와 연결될 수 있습니다.", "산업공학 전공은 프로세스 개선, 운영 효율화, 병목 분석과 연결될 수 있습니다.", "마케팅 전공은 퍼널, 고객 세그먼트, 캠페인 성과와 영업 흐름을 연결해 이해하는 데 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 영업 데이터를 운영하거나 CRM을 관리한 경험은 확인되지 않습니다.",
      "파이프라인 관리, 리포트 작성, 세일즈툴 운영, 영업 프로세스 개선 경험은 별도 근거가 필요합니다.",
      "숫자 지표를 보고 영업 행동 개선안으로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 매출 목표, 고객 전환율, 영업 퍼널, 성과 지표를 분석해본 장면이 있는지 떠올려보세요.", "엑셀, 스프레드시트, CRM, BI 도구로 데이터를 정리하거나 진행 상황을 관리한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 데이터 정리보다 \"어디서 병목이 생겼고 무엇을 바꿔야 하는가\"를 제안한 경험이 더 중요합니다.", "세일즈 옵스는 전공 연결성뿐 아니라, 영업 현장을 숫자와 프로세스로 정리해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Overseas Sales
  JOB_SALES_OVERSEAS_SALES: {
    jobCoreActions: ["해외 고객, 바이어, 파트너와 제품·조건·일정을 조율하는 일", "국가별 시장, 가격, 규제, 유통 조건을 파악하는 일", "견적, 계약, 납기, 물류, 결제 조건을 관리하는 일", "언어와 문화 차이를 고려해 커뮤니케이션을 조정하는 일"],
    majorRelatedActions: ["무역학·국제통상 전공은 수출입, 계약, 결제, 물류, 통관 흐름과 직접 연결될 수 있습니다.", "경영학·마케팅 전공은 해외 시장 분석, 고객 이해, 판매 전략과 연결될 수 있습니다.", "어문계열 전공은 해외 고객과의 커뮤니케이션, 문서 작성, 문화 이해 측면에서 일부 연결될 수 있습니다.", "산업·제품 관련 전공은 특정 제품의 기술 사양이나 산업 구조 이해와 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 해외 바이어와 협상하거나 수출입 실무를 처리한 경험은 확인되지 않습니다.",
      "영문 메일, 견적서, 인보이스, 납기 조율, 물류·통관 이슈 대응 경험은 별도 근거가 필요합니다.",
      "국가별 시장 차이를 실제 제안이나 판매 전략으로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 해외 시장 진출, 수출입 절차, 국제 계약, 국가별 시장 비교를 다룬 장면이 있는지 떠올려보세요.", "영어·외국어 메일 작성, 해외 자료 조사, 외국인 고객 응대, 글로벌 팀 협업 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 어학 능력보다 제품, 가격, 납기, 계약 조건을 함께 이해한 경험이 더 중요하게 읽힙니다.", "해외영업은 전공 연결성뿐 아니라, 언어·시장·거래 조건을 함께 조율해본 경험이 있을 때 더 설득력 있게 보입니다."],
  },
  // PR / Communications
  JOB_MARKETING_PR_COMMUNICATIONS: {
    jobCoreActions: ["기업, 브랜드, 제품의 메시지를 외부 이해관계자에게 전달하는 일", "보도자료, 인터뷰, 콘텐츠, 캠페인 메시지를 기획하는 일", "언론, 고객, 커뮤니티, 내부 조직과 커뮤니케이션 흐름을 관리하는 일", "이슈 상황에서 평판 리스크와 메시지 일관성을 점검하는 일"],
    majorRelatedActions: ["커뮤니케이션·언론정보 전공은 메시지 기획, 미디어 이해, PR 이론과 직접 연결될 수 있습니다.", "경영학·마케팅 전공은 브랜드, 시장, 고객, 기업 전략과 메시지를 연결하는 데 도움이 될 수 있습니다.", "국문학·어문계열 전공은 문장 구성, 표현, 스토리텔링, 콘텐츠 작성 측면에서 일부 연결될 수 있습니다.", "사회학·정치외교학 전공은 여론, 사회 이슈, 이해관계자 구조를 해석하는 데 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 보도자료를 작성하거나 언론 대응을 해본 경험은 확인되지 않습니다.",
      "메시지 기획, 콘텐츠 작성, 이슈 대응, 미디어 리스트 관리, 캠페인 운영 경험은 별도 근거가 필요합니다.",
      "복잡한 이슈를 대중이 이해할 수 있는 문장으로 바꿔본 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 브랜드 메시지, 보도자료, 캠페인 기획, 사회 이슈 분석을 다룬 장면이 있는지 떠올려보세요.", "기사 작성, 카드뉴스, 발표자료, SNS 콘텐츠처럼 특정 대상에게 메시지를 전달한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 글쓰기보다 \"누구에게 어떤 인식을 만들기 위한 메시지였는가\"를 설명할 수 있으면 연결성이 더 강해집니다.", "PR·커뮤니케이션은 전공만으로 충분하기보다, 메시지를 대상과 상황에 맞게 조정해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Service Operations
  JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS: {
    jobCoreActions: ["서비스가 안정적으로 제공되도록 운영 흐름을 관리하는 일", "고객 문의, 주문, 예약, 처리 상태, 오류 상황을 확인하는 일", "반복 문제를 줄이기 위해 운영 정책이나 프로세스를 정리하는 일", "고객, 내부팀, 외부 파트너 사이에서 실행 이슈를 조율하는 일"],
    majorRelatedActions: ["경영학·서비스경영 전공은 서비스 운영, 프로세스, 고객 관리, 운영 효율화와 연결될 수 있습니다.", "산업공학 전공은 운영 프로세스 개선, 병목 분석, 품질 관리와 연결될 수 있습니다.", "소비자학·심리학 전공은 고객 행동, 불편, 만족도 이해 측면에서 일부 연결될 수 있습니다.", "데이터·통계 관련 전공은 운영 지표와 반복 이슈 분석 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 서비스 운영 상황을 처리한 경험은 확인되지 않습니다.",
      "주문·예약·문의·오류 처리, 운영 매뉴얼 작성, 파트너 조율 경험은 별도 근거가 필요합니다.",
      "운영 중 발생한 문제를 프로세스 개선으로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 서비스 프로세스, 고객 여정, 운영 정책, 품질 개선을 다룬 장면이 있는지 떠올려보세요.", "행사 운영, 플랫폼 운영, 예약·주문 관리, 고객 응대, 파트너 조율 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "반복되는 문의나 오류를 정리하고 안내 문구나 운영 방식을 바꿔본 경험이 있으면 연결성이 더 구체화됩니다.", "서비스운영은 전공 연결성뿐 아니라, 실제 서비스 흐름을 관찰하고 문제를 줄여본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Content Design
  JOB_DESIGN_CONTENT_DESIGN: {
    jobCoreActions: ["메시지나 정보를 시각적으로 이해하기 쉽게 구성하는 일", "카드뉴스, 배너, 상세페이지, SNS 콘텐츠 등 목적에 맞는 디자인을 제작하는 일", "브랜드 톤, 레이아웃, 이미지, 타이포그래피를 조합해 전달력을 높이는 일", "마케팅·콘텐츠·브랜드 목표에 맞게 시각 결과물을 조정하는 일"],
    majorRelatedActions: ["시각디자인·디자인 전공은 레이아웃, 색채, 타이포그래피, 시각 커뮤니케이션과 직접 연결될 수 있습니다.", "미디어·콘텐츠 관련 전공은 메시지 구성, 콘텐츠 포맷, 사용자 반응 이해와 연결될 수 있습니다.", "광고홍보·마케팅 전공은 콘텐츠 목적, 브랜드 메시지, 고객 반응을 이해하는 데 일부 연결될 수 있습니다.", "영상·사진·디지털미디어 전공은 이미지와 화면 구성, 디지털 콘텐츠 제작 측면에서 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 브랜드나 마케팅 목표에 맞춰 콘텐츠를 제작한 경험은 확인되지 않습니다.",
      "포트폴리오, 실무형 디자인 툴 사용, 콘텐츠 성과 분석, 피드백 반영 경험은 별도 근거가 필요합니다.",
      "메시지를 시각 결과물로 바꾸고 반응을 개선해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 카드뉴스, 배너, 상세페이지, SNS 콘텐츠, 브랜드 그래픽을 만든 장면이 있는지 떠올려보세요.", "같은 메시지를 여러 레이아웃으로 바꿔보거나, 대상 고객에 맞게 디자인 톤을 조정한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순히 예쁜 결과물보다 \"무엇을 전달하기 위해 어떤 시각 선택을 했는가\"를 설명할 수 있으면 연결성이 더 강해집니다.", "콘텐츠디자인은 전공 연결성이 강할 수 있지만, 실제 목적·대상·성과를 고려한 제작 경험은 별도로 확인되어야 합니다."],
  },
  // Operation Planning
  JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING: {
    jobCoreActions: ["운영 목표와 현장 실행 사이의 프로세스를 설계하는 일", "반복 업무, 병목, 예외 상황을 파악해 개선안을 만드는 일", "운영 지표, 처리량, 오류율, 리드타임 등을 확인하는 일", "고객운영, 서비스운영, 내부팀이 같은 기준으로 움직이도록 정책과 절차를 정리하는 일"],
    majorRelatedActions: ["경영학·서비스경영 전공은 운영관리, 서비스 프로세스, 고객 관리, 조직 운영과 연결될 수 있습니다.", "산업공학 전공은 프로세스 개선, 병목 분석, 최적화, 품질 관리와 직접 연결될 수 있습니다.", "데이터·통계 관련 전공은 운영 지표 분석과 문제 원인 파악에 연결될 수 있습니다.", "행정학 전공은 절차, 규정, 정책, 운영 체계 설계 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 운영 프로세스를 설계하거나 개선한 경험은 확인되지 않습니다.",
      "매뉴얼 작성, 운영 정책 설계, 지표 관리, 부서 간 조율 경험은 별도 근거가 필요합니다.",
      "현장의 반복 문제를 구조화하고 개선안으로 실행해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 업무 흐름, 서비스 프로세스, 운영 정책, 병목 개선을 다룬 장면이 있는지 떠올려보세요.", "팀 프로젝트나 조직 활동에서 역할 분담, 진행 절차, 체크리스트, 운영 규칙을 만든 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순히 운영을 도운 것보다 \"어떤 문제를 줄이기 위해 절차를 어떻게 바꿨는가\"를 설명할 수 있으면 연결성이 더 강해집니다.", "운영기획은 전공만으로 직접 수행력이 증명되기보다는, 반복 문제를 구조화하고 실행 기준으로 바꿔본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // IT Planning
  JOB_IT_DATA_DIGITAL_IT_PLANNING: {
    jobCoreActions: ["IT 투자, 인프라 계획, 기술 선택을 사업 목표와 연결하는 일", "향후 시스템 아키텍처, 도입 시스템, 마이그레이션 로드맵을 설계하는 일", "현업 부서의 IT 요청을 정리하고 기술적 실현 가능성을 판단하는 일", "기술 트렌드, 레거시 시스템, 운영 효율을 고려해 중장기 IT 전략을 제시하는 일"],
    majorRelatedActions: ["컴퓨터공학 전공은 시스템 아키텍처, 데이터베이스, 네트워크 설계의 기초와 연결될 수 있습니다.", "정보시스템 전공은 IT 거버넌스, 프로젝트 관리, 사업-IT 정렬과 직접 연결될 수 있습니다.", "경영학·산업공학 전공은 사업 전략, 운영 프로세스, 효율화 관점에서 IT 기획을 이해하는 데 도움이 될 수 있습니다.", "데이터·분석 관련 전공은 시스템 성능 지표와 기술 투자 대비 효과 분석에 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 회사의 IT 아키텍처를 제안하거나 기술 선택을 주도한 경험은 확인되지 않습니다.",
      "시스템 평가, 기술 검토, 마이그레이션 계획, 현업 협의 경험은 별도 근거가 필요합니다.",
      "시스템 도입 후 현장 문제를 해결하거나 프로세스 개선으로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 정보시스템 선택, 데이터베이스 설계, 마이그레이션 계획, 기술 평가를 다룬 장면이 있는지 떠올려보세요.", "인턴십, 프로젝트에서 시스템 도입을 지원하거나 기술 선택에 참여한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 기술 조사보다 \"사업 목표를 위해 어떤 기술을 선택해야 하는가\"를 판단해본 경험이 더 중요합니다.", "IT기획은 전공만으로 충분하기보다, 시스템·기술과 실제 사업 문제를 함께 이해한 경험이 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Security
  JOB_IT_DATA_DIGITAL_SECURITY: {
    jobCoreActions: ["시스템, 네트워크, 애플리케이션의 보안 위협을 파악하는 일", "침입, 데이터 유출, 악성코드, 권한 오용 등의 보안 사고를 예방하고 대응하는 일", "접근 제어, 암호화, 백업, 규정 준수 같은 보안 정책과 기준을 설계하는 일", "보안 취약점을 점검하고, 직원 교육이나 감시 시스템으로 위험을 줄이는 일"],
    majorRelatedActions: ["컴퓨터공학·정보보안 전공은 암호화, 네트워크 보안, 악성코드 분석, 침입탐지와 직접 연결될 수 있습니다.", "사이버보안 관련 전공은 보안 아키텍처, 위협 분석, 방어 기술 이해와 연결될 수 있습니다.", "정보시스템 전공은 IT 거버넌스, 규정 준수, 감사 관점의 보안 정책 설계와 연결될 수 있습니다.", "수학·암호학 관련 전공은 암호화 원리와 보안 알고리즘의 기초와 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 보안 사고를 탐지하거나 대응한 경험은 확인되지 않습니다.",
      "시스템 점검, 취약점 진단, 침입 분석, 보안 정책 구현 경험은 별도 근거가 필요합니다.",
      "실무에서 발생한 보안 위협을 상황에 맞게 판단하고 처리해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 네트워크 보안, 암호화, 침입탐지, 보안 정책, 취약점 분석을 다룬 장면이 있는지 떠올려보세요.", "보안 인증(CISSP, CEH 등)이나 경진대회, 실습 환경에서 보안 문제를 진단하고 대응해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 보안 개념 학습보다 실제 시스템 공격을 분석하거나 방어 기법을 적용해본 경험이 더 중요합니다.", "보안은 전공 연결성이 강할 수 있지만, 신속한 탐지·대응과 위협 상황 판단 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // DevOps / Infrastructure
  JOB_IT_DATA_DIGITAL_DEVOPS_INFRA: {
    jobCoreActions: ["서버, 네트워크, 데이터베이스, 스토리지 같은 인프라를 구축하고 유지하는 일", "애플리케이션 배포, 업데이트, 모니터링, 장애 복구 프로세스를 자동화하는 일", "클라우드 리소스, 비용, 성능을 최적화하는 일", "개발팀과 운영팀 사이에서 릴리스, 배포, 모니터링을 조율하는 일"],
    majorRelatedActions: ["컴퓨터공학 전공은 네트워크, 운영체제, 데이터베이스, 시스템 설계의 기초와 연결될 수 있습니다.", "클라우드 관련 전공은 AWS, Azure, GCP 아키텍처와 인프라 구성 이해와 연결될 수 있습니다.", "산업공학 전공은 배포 파이프라인 최적화, 자동화, 병목 제거와 연결될 수 있습니다.", "데이터 관련 전공은 대규모 데이터 처리 인프라와 성능 모니터링 이해에 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 프로덕션 인프라를 관리하거나 배포 자동화를 구현한 경험은 확인되지 않습니다.",
      "클라우드 서비스 구성, 컨테이너 오케스트레이션, CI/CD 파이프라인 구축, 성능 튜닝 경험은 별도 근거가 필요합니다.",
      "장애 상황에서 신속하게 문제를 진단하고 복구해본 실무 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 클라우드 인프라, 컨테이너, 배포 자동화, 모니터링, 성능 최적화를 다룬 장면이 있는지 떠올려보세요.", "개인 프로젝트나 인턴십에서 클라우드 환경을 구성하거나 배포 스크립트를 작성한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 클라우드 사용보다 리소스 최적화, 자동화 개선, 비용 절감을 구체화한 경험이 더 중요합니다.", "DevOps는 전공 연결성뿐 아니라, 개발·배포·운영의 전체 흐름을 자동화하고 개선해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // IT Operations / Systems Management / DBA
  JOB_IT_DATA_DIGITAL_IT_OPERATIONS_SYSTEMS_MANAGEMENT: {
    jobCoreActions: ["데이터베이스, 서버, 네트워크의 일상적인 운영과 유지보수를 관리하는 일", "시스템 성능을 모니터링하고 병목을 개선하는 일", "데이터 백업, 복구, 데이터 일관성 관리를 담당하는 일", "사용자 계정, 권한, 접근 로그를 관리하고 보안 점검을 수행하는 일"],
    majorRelatedActions: ["컴퓨터공학 전공은 운영체제, 데이터베이스, 네트워크 운영의 기초와 직접 연결될 수 있습니다.", "데이터베이스 관련 전공은 데이터베이스 튜닝, 인덱싱, 쿼리 최적화와 직접 연결될 수 있습니다.", "시스템관리 또는 정보시스템 전공은 사용자 관리, 보안 정책, 운영 자동화와 연결될 수 있습니다.", "수학·통계 관련 전공은 성능 분석, 용량 계획, 리소스 최적화와 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 프로덕션 데이터베이스나 서버 환경을 안정적으로 운영한 경험은 확인되지 않습니다.",
      "성능 튜닝, 장애 진단, 백업·복구, 용량 계획, 보안 패치 적용 경험은 별도 근거가 필요합니다.",
      "예기치 않은 시스템 장애를 빠르게 파악하고 복구해본 실무 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 데이터베이스 설계, 성능 분석, 백업 전략, 사용자 권한 관리를 다룬 장면이 있는지 떠올려보세요.", "인턴십이나 개인 프로젝트에서 데이터베이스를 직접 운영하거나 성능 문제를 해결한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 설치·설정보다 \"장기 운영을 위해 어떤 정책과 절차를 만들었는가\"를 설명할 수 있으면 연결성이 더 강해집니다.", "IT운영·DBA는 전공만으로 충분하기보다, 24/7 안정성을 위한 운영 경험과 문제 해결 능력이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Research and Development
  JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT: {
    jobCoreActions: ["기술 과제를 정의하고 해결책을 탐색하는 일", "새로운 제품, 기술, 공정의 가능성을 실험으로 검증하는 일", "기초 이론, 선행 기술, 시장 요구를 조합해 기술 혁신을 추진하는 일", "연구 결과를 문서로 정리하고, 실제 제조·개발 단계로 이관하는 일"],
    majorRelatedActions: ["공학 관련 전공(전자, 기계, 화학, 소재 등)은 해당 분야의 원리, 설계, 제조 이론과 직접 연결될 수 있습니다.", "물리학·화학 전공은 재료 특성, 화학 반응, 성질 분석의 기초와 연결될 수 있습니다.", "수학·통계 전공은 모델링, 데이터 분석, 최적화 계산과 연결될 수 있습니다.", "컴퓨터과학 전공은 시뮬레이션, 분석 도구, 설계 소프트웨어 활용과 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 신기술을 개발했거나 제품화한 경험은 확인되지 않습니다.",
      "실험 설계, 프로토타입 제작, 성능 검증, 기술 리포트 작성 경험은 별도 근거가 필요합니다.",
      "기초 연구를 실제 제품 개발로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 새로운 기술을 탐색하고, 가설을 세우고, 실험으로 검증한 장면이 있는지 떠올려보세요.", "대학원 연구, 산학협력, 학회 논문 발표, 특허 출원 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 학습보다 \"어떤 문제를 해결하기 위해 어떤 기술을 시도했고 결과가 어땠는가\"를 설명할 수 있으면 연결성이 더 강해집니다.", "R&D는 전공 연결성이 강할 수 있지만, 실제 기술 문제를 정의하고 실험으로 증명해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Technical Support / Field Engineering
  JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING: {
    jobCoreActions: ["고객 현장에서 제품 설치, 트러블슈팅, 성능 최적화를 지원하는 일", "제품 기술 사양, 사용 방법, 유지보수 절차를 고객에게 교육하는 일", "현장 문제를 분석하고 개발팀과 협의해 개선안을 제안하는 일", "설치 후 운영 안정성을 확인하고, 문제 발생 시 빠른 복구를 지원하는 일"],
    majorRelatedActions: ["공학 관련 전공(전자, 기계, 화학, 소재 등)은 해당 제품의 기술 원리와 직접 연결될 수 있습니다.", "기술 커뮤니케이션 또는 기술문서 관련 전공은 복잡한 기술을 이해하기 쉽게 설명하는 데 도움이 될 수 있습니다.", "정보시스템·컴퓨터공학 전공은 IT 제품 지원, 원격 진단, 시스템 연동 문제 해결과 연결될 수 있습니다.", "경영학·마케팅 전공은 고객 요구 이해, 관계 유지, 신뢰 구축 측면에서 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 고객 현장에서 기술 문제를 신속하게 해결한 경험은 확인되지 않습니다.",
      "설치 지원, 트러블슈팅, 성능 진단, 고객 교육, 원인 분석 경험은 별도 근거가 필요합니다.",
      "고객 문제를 제품 개선 아이디어로 연결해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 제품을 설치·테스트하고, 고객 입장에서 사용 경험을 분석한 장면이 있는지 떠올려보세요.", "인턴십, 아르바이트, 자발적 활동에서 기술 지원을 해봤거나 고객 피드백을 수집한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 설명서 읽음보다 실제 현장 상황을 토대로 \"이 고객은 왜 이 부분을 어려워하는가\"를 파악해본 경험이 더 중요합니다.", "기술지원·필드엔지니어는 기술 이해뿐 아니라, 고객 상황을 수용하고 빠른 대응 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Backoffice Operations
  JOB_CUSTOMER_OPERATIONS_BACKOFFICE_OPERATIONS: {
    jobCoreActions: ["주문, 송장, 배송, 결제, 반품 같은 고객 거래 정보를 기록하고 관리하는 일", "결제 검증, 배송지 확인, 인보이스 생성, 정산 같은 거래 프로세스를 처리하는 일", "반복 오류나 예외 상황을 파악해 운영 절차를 개선하는 일", "고객, 판매팀, 물류팀, 회계팀과 정보를 공유하고 조율하는 일"],
    majorRelatedActions: ["경영학·서비스경영 전공은 거래 프로세스, 고객정보관리, 운영 효율화와 연결될 수 있습니다.", "회계·세무 관련 전공은 거래 기록, 정산, 세금 계산, 감시의 기초와 연결될 수 있습니다.", "행정학 전공은 문서관리, 절차 정의, 규정 준수 측면에서 일부 연결될 수 있습니다.", "데이터·통계 관련 전공은 거래 데이터 분석과 이상 탐지에 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 거래 백오피스 업무를 반복적으로 처리한 경험은 확인되지 않습니다.",
      "주문 처리, 결제 검증, 배송 연동, 정산, 반품 처리 경험은 별도 근거가 필요합니다.",
      "운영 오류를 줄이기 위해 절차나 체크리스트를 개선해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 주문·배송·결제·정산 같은 전자상거래 프로세스를 설계하거나 운영한 장면이 있는지 떠올려보세요.", "아르바이트나 인턴십에서 고객 거래 데이터를 입력·검증·정산한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "반복되는 오류를 정리하고 처리 규칙이나 체크 단계를 만든 경험이 있으면 연결성이 더 구체화됩니다.", "백오피스운영은 꼼꼼한 정확성뿐 아니라, 거래 흐름을 전체적으로 이해하고 예외를 처리해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Production Management
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT: {
    jobCoreActions: ["생산 계획, 일정, 자재, 인력을 조율해 목표 물량과 기한을 달성하는 일", "생산 라인의 효율, 품질, 안전을 모니터링하는 일", "생산 병목, 설비 고장, 불량률을 줄이기 위해 현장을 개선하는 일", "영업, 영업관리, 영재, 품질팀과 생산 상황을 공유하고 조율하는 일"],
    majorRelatedActions: ["산업공학 전공은 생산 계획, 공정 최적화, 병목 제거, 효율 개선과 직접 연결될 수 있습니다.", "경영학·생산관리 전공은 수급 관리, 일정 계획, 조직 조율, 성과관리와 연결될 수 있습니다.", "기계공학·제조 관련 전공은 설비, 공정, 제조 원리 이해와 연결될 수 있습니다.", "데이터·통계 관련 전공은 생산 지표 분석, 불량 원인 파악, 성능 추적과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 생산 현장을 관리하거나 일정·리소스를 조율한 경험은 확인되지 않습니다.",
      "생산 계획 수립, 병목 해소, 불량 대응, 팀 조율, 성과 보고 경험은 별도 근거가 필요합니다.",
      "예기치 않은 생산 상황(설비 고장, 품질 문제, 납기 압박)을 신속하게 판단하고 대응해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 생산 계획, 공정 설계, 병목 분석, 효율 개선을 다룬 장면이 있는지 떠올려보세요.", "인턴십, 아르바이트, 현장 실습에서 생산 현장을 관찰하거나 일정 관리를 지원한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 학습보다 \"실제 현장에서 어떤 병목이 있었고 어떻게 개선했는가\"를 설명할 수 있으면 연결성이 더 강해집니다.", "생산관리는 이론뿐 아니라, 생산 현장의 물리적 제약과 인력 조율을 함께 경험해본 것이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Quality Assurance / QA
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: {
    jobCoreActions: ["제품의 품질 기준을 정의하고, 생산 과정과 최종 제품을 검사·검증하는 일", "불량을 분류하고 원인을 분석해 재발을 방지하는 일", "품질 기준 준수 여부를 기록하고 리포트해 개선을 추진하는 일", "공급사, 생산팀, 고객과 품질 이슈를 협의하고 해결하는 일"],
    majorRelatedActions: ["산업공학 전공은 품질관리, 통계 검사, 불량 분석, 개선 기법과 직접 연결될 수 있습니다.", "경영학·품질경영 전공은 품질 정책, 표준 관리, 지속적 개선과 연결될 수 있습니다.", "공학 관련 전공(기계, 전자, 화학 등)은 제품 사양, 성능 기준, 테스트 방법의 기초와 연결될 수 있습니다.", "수학·통계 전공은 샘플 크기 결정, 불량율 분석, 통계 신뢰성과 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 제품 검사를 수행하거나 품질 기준을 적용한 경험은 확인되지 않습니다.",
      "검사 계획 수립, 불량 분류·분석, 개선안 제시, 감시 리포트 작성 경험은 별도 근거가 필요합니다.",
      "같은 불량이 반복되지 않도록 원인을 파악하고 예방책을 실행해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 품질 기준 설정, 검사 방법 설계, 불량 분석, 통계적 제어를 다룬 장면이 있는지 떠올려보세요.", "인턴십, 현장 실습, 자격증 시험(품질관리사 등)을 통해 실제 검사나 분석을 경험한 시간이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 기준 암기보다 \"이 제품이 이 불량을 보이는 이유가 무엇인가\"를 추론하고 데이터로 증명해본 경험이 더 중요합니다.", "QA는 기술만이 아니라, 품질 문제를 끝까지 추적하고 개선으로 연결하는 실행 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Process Engineering
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING: {
    jobCoreActions: ["신제품 생산을 위한 공정(기계 설정, 작업 절차, 품질 기준)을 설계하는 일", "생산 기술 선택, 설비 구성, 자동화 수준을 판단하는 일", "기존 공정의 비효율(품질 불안, 비용 높음, 수율 낮음)을 개선하는 일", "공정 기술을 작업자가 수행할 수 있도록 매뉴얼을 작성하고 교육하는 일"],
    majorRelatedActions: ["산업공학 전공은 공정 최적화, 레이아웃 설계, 자동화, 비용 분석과 직접 연결될 수 있습니다.", "기계공학·제조 관련 전공은 생산 기술, 설비 선택, 공정 원리와 직접 연결될 수 있습니다.", "재료공학·화학공학 전공은 제조 조건(온도, 압력, 화학약품)의 영향 이해와 연결될 수 있습니다.", "경영학·품질경영 전공은 비용 절감, 수율 개선, 운영 효율화와 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 생산 공정을 설계하거나 설비를 구성한 경험은 확인되지 않습니다.",
      "신제품 공정 기획, 시험 생산, 설비 선택, 공정 개선, 작업 표준화 경험은 별도 근거가 필요합니다.",
      "설계한 공정이 실제로 안정적으로 작동하고 품질·비용 목표를 달성해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 신제품 공정 설계, 공정 모니터링, 공정 개선, 설비 선택을 다룬 장면이 있는지 떠올려보세요.", "현장 실습, 인턴십, 제조업 경험에서 공정 문제를 직접 해결하거나 개선 방안을 제안해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 이해보다 \"왜 이 공정은 이 속도로 진행되는가\", \"불량률을 줄이려면 어떤 조건을 바꿔야 하는가\"를 실험으로 증명해본 경험이 더 중요합니다.", "공정기술은 전공만으로 충분하기보다, 설계한 공정을 실제 생산에 적용하고 개선해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Mechanical Design
  JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN: {
    jobCoreActions: ["제품 또는 부품의 형태, 치수, 재질을 설계하는 일", "강도, 내구성, 제조 가능성을 검토하는 일", "설계 사양을 도면과 문서로 정리하는 일", "시제품 제작과 성능 테스트를 통해 설계를 검증하는 일"],
    majorRelatedActions: ["기계공학 전공은 역학, 재료, 설계 원리와 직접 연결될 수 있습니다.", "자동차, 항공, 기계, 에너지 관련 전공은 해당 분야의 제품 설계 이론과 연결될 수 있습니다.", "수학, 물리 전공은 구조 계산, 시뮬레이션 기초와 연결될 수 있습니다.", "컴퓨터공학 전공은 CAD, 설계 도구, 디지털 시뮬레이션과 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 제품 설계를 주도하거나 완성한 경험은 확인되지 않습니다.",
      "도면 작성, 공차 설정, 재료 선정, 강도 검증, 제조 검토 경험은 별도 근거가 필요합니다.",
      "설계한 제품이 실제로 제조되고 성능을 발휘해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 제품 설계, CAD 도면 작성, 성능 분석, 재료 선정을 다룬 장면이 있는지 떠올려보세요.", "현장 실습, 인턴십에서 제품 설계 과정을 관찰하거나 부분 설계를 지원한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 이해보다 \"이 부품이 이 크기인 이유\", \"이 재료를 선택한 이유\"를 설명할 수 있으면 연결성이 더 강해집니다.", "기구설계는 전공 이론뿐 아니라, 설계한 제품을 실제로 제조하고 성능을 검증해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Electrical Design
  JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN: {
    jobCoreActions: ["전자 회로, 배선, 전력 분배를 설계하는 일", "전압, 전류, 내열성, 안전성을 검토하는 일", "회로도와 배선도를 작성하고 전기 사양을 정리하는 일", "시제품 제작과 전기 성능 테스트를 통해 설계를 검증하는 일"],
    majorRelatedActions: ["전자공학 전공은 회로 설계, 신호 처리, 전자 부품과 직접 연결될 수 있습니다.", "전기공학 전공은 전력, 배전, 전기 안전과 직접 연결될 수 있습니다.", "물리 전공은 전자기학, 반도체 원리의 기초와 연결될 수 있습니다.", "컴퓨터공학 전공은 회로 설계 도구, 시뮬레이션 소프트웨어와 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 전기·전자 회로를 설계하거나 완성한 경험은 확인되지 않습니다.",
      "회로도 작성, 부품 선정, 성능 계산, 안전성 검증, 배선 설계 경험은 별도 근거가 필요합니다.",
      "설계한 회로가 실제로 제작되고 정상 작동을 확인해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 회로 설계, 회로도 작성, PCB 설계, 회로 시뮬레이션을 다룬 장면이 있는지 떠올려보세요.", "현장 실습, 인턴십에서 회로 설계 과정을 지원하거나 시제품을 테스트한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 계산보다 \"이 부품을 선택한 이유\", \"이 전압으로 설정한 이유\"를 설명할 수 있으면 연결성이 더 강해집니다.", "전기·전장설계는 이론뿐 아니라, 설계한 회로를 실제로 구현하고 성능을 검증해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Equipment Maintenance
  JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE: {
    jobCoreActions: ["설비의 정상 작동 상태를 확인하고 유지보수 일정을 관리하는 일", "설비 고장을 진단하고 부품을 교체하거나 수리하는 일", "설비 메뉴얼을 숙지하고 작업자에게 올바른 사용법을 교육하는 일", "설비 가동 시간, 고장 빈도, 정비 비용을 기록하고 개선 방안을 제안하는 일"],
    majorRelatedActions: ["기계공학 관련 전공은 설비 원리, 부품 특성, 유지보수 개념과 직접 연결될 수 있습니다.", "전자공학·전기공학 전공은 전기·전자 설비의 문제 진단과 연결될 수 있습니다.", "산업공학 전공은 설비 관리, 예방 정비 계획, 비용 효율성과 연결될 수 있습니다.", "제조 관련 전공은 생산 설비의 안정성, 가동률 향상과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 설비를 분해·조립하거나 고장을 진단해본 경험은 확인되지 않습니다.",
      "정기점검, 고장 수리, 부품 교체, 설비 기록 관리, 유지보수 계획 수립 경험은 별도 근거가 필요합니다.",
      "설비 고장 시 빠르게 원인을 파악하고 복구해본 실무 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 실습에서 설비 구조, 작동 원리, 점검 절차, 정기 정비 계획을 다룬 장면이 있는지 떠올려보세요.", "현장 실습, 인턴십, 제조업 경험에서 설비 정비를 직접 지원하거나 고장을 해결한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 이해보다 \"이 부품이 이 주기로 교체되는 이유\", \"이 고장 신호는 어떤 부품 문제를 의미하는가\"를 경험으로 이해해본 경험이 더 중요합니다.", "설비관리는 매뉴얼 숙지뿐 아니라, 실제 설비 고장을 접하고 빠르게 대응해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Automation Control
  JOB_MANUFACTURING_QUALITY_PRODUCTION_AUTOMATION_CONTROL: {
    jobCoreActions: ["설비의 자동화 수준을 판단하고 자동화 시스템을 설계하는 일", "제어 로직, PLC 프로그래밍, 센서·액추에이터 연결을 구현하는 일", "자동화 설비의 작동을 테스트하고 미세 조정(튜닝)을 하는 일", "자동화로 생산 효율, 품질, 안전을 개선하는 효과를 측정하고 최적화하는 일"],
    majorRelatedActions: ["자동화공학·제어공학 전공은 제어 시스템, PLC 원리, 피드백 제어와 직접 연결될 수 있습니다.", "전자공학·전기공학 전공은 센서 신호, 전기 제어, 모터 제어와 연결될 수 있습니다.", "기계공학 관련 전공은 설비의 기계적 특성과 제어의 상호작용을 이해하는 데 도움이 될 수 있습니다.", "컴퓨터공학 전공은 자동화 소프트웨어, PLC 프로그래밍, 시뮬레이션과 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 자동화 시스템을 설계하거나 프로그래밍한 경험은 확인되지 않습니다.",
      "제어 로직 설계, PLC 프로그래밍, 센서 연결, 시스템 통합, 성능 테스트 경험은 별도 근거가 필요합니다.",
      "자동화로 인한 효율 개선을 실제로 측정하고 시스템을 최적화해본 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 제어 시스템 설계, PLC 프로그래밍, 센서·액추에이터 활용, 자동화 시뮬레이션을 다룬 장면이 있는지 떠올려보세요.", "현장 실습, 인턴십에서 자동화 설비를 관찰하거나 제어 프로그래밍을 지원한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 이해보다 \"왜 이 설비는 이 신호에 이렇게 반응하는가\", \"효율을 더 높이려면 어떤 매개변수를 조정해야 하는가\"를 경험으로 이해해본 경험이 더 중요합니다.", "자동화제어는 이론뿐 아니라, 실제 설비에 제어 시스템을 적용하고 성능을 개선해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Manufacturing Innovation
  JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION: {
    jobCoreActions: ["생산 현장의 반복 문제, 비효율, 낭비를 식별하는 일", "문제의 근본 원인을 분석하고 개선 방안을 도출하는 일", "개선 방안을 시범 적용하고 효과를 검증하는 일", "성공한 개선 사항을 표준화하고 지속적으로 모니터링하는 일"],
    majorRelatedActions: ["산업공학 전공은 공정 개선, 린 생산, 6시그마 방법론과 직접 연결될 수 있습니다.", "경영학·품질경영 전공은 지속적 개선, 변화 관리, 성과 측정과 연결될 수 있습니다.", "기계공학·제조 관련 전공은 생산 기술 개선, 설비 최적화와 연결될 수 있습니다.", "데이터·통계 전공은 문제 분석, 성과 측정, 개선 효과 검증과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 생산 현장의 문제를 해결하거나 개선을 주도해본 경험은 확인되지 않습니다.",
      "문제 정의, 원인 분석, 개선안 설계, 시범 적용, 효과 측정 경험은 별도 근거가 필요합니다.",
      "자신이 제안한 개선안이 실제로 실행되고 비용 절감·효율 향상을 가져온 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 공정 문제 분석, 개선 기법(린, 6시그마) 실습, 효과 측정을 다룬 장면이 있는지 떠올려보세요.", "현장 실습, 인턴십, 제조업 경험에서 현장 문제를 관찰하고 개선안을 제안한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 문제 인식보다 \"이 문제는 어디서 비롯된 것이고, 어떻게 해결할 것인가\"를 데이터와 분석으로 입증해본 경험이 더 중요합니다.", "제조혁신은 이론뿐 아니라, 자신의 개선안이 현장에서 실행되고 실제 효과를 보여줄 수 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Market and Industry Research
  JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH: {
    jobCoreActions: ["시장 규모, 성장률, 경쟁 구도를 파악하는 일", "산업 트렌드, 기술 변화, 고객 니즈 변화를 추적하는 일", "경쟁사 전략, 제품, 강점·약점을 분석하는 일", "조사 결과를 보고서로 정리하고 비즈니스 의사결정에 활용하도록 제시하는 일"],
    majorRelatedActions: ["경제학 전공은 시장 구조, 경쟁 분석, 수요·공급, 가격 전략의 기초와 직접 연결될 수 있습니다.", "경영학·마케팅 전공은 시장 분석, 산업 전략, 소비자 행동 이해와 연결될 수 있습니다.", "통계·데이터분석 전공은 시장 데이터 수집, 추세 분석, 예측 모델링과 연결될 수 있습니다.", "산업공학 전공은 산업 구조, 공급망, 비용 분석과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 시장 조사를 설계하거나 수행한 경험은 확인되지 않습니다.",
      "데이터 수집, 경쟁사 분석, 트렌드 해석, 시장 보고서 작성, 인사이트 도출 경험은 별도 근거가 필요합니다.",
      "자신의 시장 분석이 실제 비즈니스 결정(신제품 출시, 시장 진입, 전략 수정)에 영향을 미친 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 시장 분석, 경쟁사 연구, 산업 트렌드 조사, 소비자 데이터 분석을 다룬 장면이 있는지 떠올려보세요.", "인턴십, 사업 계획 경진대회, 창업 경험에서 실제 시장을 조사하고 분석보고서를 작성해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 정보 수집보다 \"이 시장은 어디로 향하고 있고, 어떤 기회와 위험이 있는가\"를 데이터로 입증해본 경험이 더 중요합니다.", "시장·산업연구는 이론뿐 아니라, 실제 시장을 파악하고 그 분석이 비즈니스 의사결정으로 이어진 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Technical Sales
  JOB_SALES_TECHNICAL_SALES: {
    jobCoreActions: ["고객이 기술 문제를 이해하고 해결책을 찾도록 기술을 설명하는 일", "고객의 기술 요구사항을 파악하고 제품·솔루션의 적합성을 판단하는 일", "기술 검증, 설치 지원, 성능 테스트를 통해 고객 신뢰를 구축하는 일", "계약 후 기술 지원, 트러블슈팅, 성과 확인을 통해 고객 만족과 추가 판매로 이어지도록 하는 일"],
    majorRelatedActions: ["공학 관련 전공(전자, 기계, 화학, IT 등)은 제품의 기술 원리와 직접 연결될 수 있습니다.", "경영학·마케팅 전공은 고객 요구 파악, 솔루션 제시, 관계 관리와 연결될 수 있습니다.", "커뮤니케이션·언어 전공은 복잡한 기술을 이해하기 쉽게 설명하는 능력과 연결될 수 있습니다.", "경제학·재무 전공은 고객의 비용-편익 분석, ROI 계산, 가격 협상과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 고객을 대면해 기술을 설명하거나 신뢰를 구축한 경험은 확인되지 않습니다.",
      "고객 요구 분석, 기술 설명 및 설득, 성능 검증, 계약 지원, 사후 관리 경험은 별도 근거가 필요합니다.",
      "자신의 기술 설명으로 고객 의사결정이 이루어지거나 추가 판매로 이어진 실제 성과 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 기술 문서 작성, 제품 설명 자료 개발, 고객 니즈 분석, 솔루션 제시를 다룬 장면이 있는지 떠올려보세요.", "인턴십, 아르바이트, 자원봉사에서 고객을 상대해 제품이나 서비스를 설명하거나 기술 지원을 한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 제품 설명보다 \"고객이 왜 이 기술이 필요한지 이해하고, 비용 대비 효과를 인정하도록\" 설득해본 경험이 더 중요합니다.", "기술영업은 기술 이해뿐 아니라, 고객의 입장에서 문제를 파악하고 솔루션을 제시해 신뢰와 판매로 이어진 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Solution Sales
  JOB_SALES_SOLUTION_SALES: {
    jobCoreActions: ["고객의 비즈니스 문제와 요구사항을 깊이 있게 파악하는 일", "고객의 상황에 맞춘 솔루션(제품, 서비스, 구성, 가격)을 설계하는 일", "솔루션의 가치(ROI, 효율성, 리스크 감소)를 고객에게 설득력 있게 제시하는 일", "계약 체결 후 구현 지원, 성과 추적, 고객 만족도 관리를 통해 장기적 관계를 유지하는 일"],
    majorRelatedActions: ["경영학·경제학 전공은 고객 비즈니스 이해, 비용-편익 분석, 전략적 사고와 직접 연결될 수 있습니다.", "마케팅 전공은 고객 세그먼트 분석, 가치 제시, 관계 관리와 연결될 수 있습니다.", "공학 관련 전공은 솔루션의 기술적 구성과 구현 가능성 평가와 연결될 수 있습니다.", "커뮤니케이션·협상 역량 관련 전공은 고객 설득, 이해관계자 조율과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 고객의 비즈니스를 이해하고 맞춤형 솔루션을 설계해본 경험은 확인되지 않습니다.",
      "고객 요구사항 분석, 솔루션 제안서 작성, ROI 계산, 고객 설득, 계약 지원, 구현 관리 경험은 별도 근거가 필요합니다.",
      "자신이 제안한 솔루션이 고객의 문제를 실제로 해결하고 만족도와 추가 판매로 이어진 실제 성과 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 고객 분석, 사업 계획, 솔루션 설계, 가치 제시 자료 개발을 다룬 장면이 있는지 떠올려보세요.", "인턴십, 영업 경험, 창업/사업 경진대회에서 고객의 문제를 파악하고 해결책을 제안해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 상품 판매보다 \"고객의 진정한 문제를 파악하고, 맞춤형 솔루션을 설계해 가치를 입증\"해본 경험이 더 중요합니다.", "솔루션영업은 제품 이해뿐 아니라, 고객의 비즈니스 맥락을 파악하고 전략적으로 솔루션을 제시해 구현까지 이어진 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Product Marketing (PMM)
  JOB_MARKETING_PRODUCT_MARKETING_PMM: {
    jobCoreActions: ["시장 구조와 경쟁 환경을 이해하고 고객 세그먼트를 정의하는 일", "제품의 메시지와 포지셔닝을 시장·고객·경쟁 상황에 맞게 설계하는 일", "제품 출시 전략, GTM(Go-To-Market) 계획, 가격 책정, 고객 세그먼트별 메시지를 수립하는 일", "출시 후 고객 반응, 시장 성과(매출, 점유율, 만족도), 경쟁사 동향을 모니터링하고 포지셔닝을 개선하는 일"],
    majorRelatedActions: ["경제학 전공은 시장 구조, 경쟁, 수요·공급, 가격 결정, 소비자 선택의 기초와 직접 연결될 수 있습니다.", "마케팅·경영학 전공은 고객 세그먼트, 포지셔닝, 메시지 설계, 브랜드 전략과 연결될 수 있습니다.", "통계·데이터분석 전공은 시장 데이터 해석, 성과 지표 분석, 의사결정 근거 마련과 연결될 수 있습니다.", "심리학·사회학 전공은 소비자 행동, 의사결정 동인, 메시지 영향과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 제품의 시장 위치를 파악하거나 GTM 전략을 수립한 경험은 확인되지 않습니다.",
      "시장 조사, 경쟁사 분석, 고객 세그먼트 정의, 포지셔닝 기준 설정, 메시지 설계 및 검증, 가격 책정 경험은 별도 근거가 필요합니다.",
      "자신이 설계한 포지셔닝과 메시지가 실제 고객 반응으로 입증되고, 출시 성과(매출, 인지도, 만족도)가 달성된 장면은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 시장 조사, 경쟁사 분석, 고객 세그먼트 분석, 포지셔닝 설계, 마케팅 계획 수립을 다룬 장면이 있는지 떠올려보세요.", "인턴십, 창업 경험, 사업 경진대회에서 실제 제품의 시장 진입 전략을 수립하거나 메시지 검증을 해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 학습보다 \"이 제품의 핵심 고객은 누구이고, 왜 우리 제품을 선택해야 하는가\"를 시장 데이터와 고객 반응으로 입증해본 경험이 더 중요합니다.", "PMM은 시장 이해만이 아니라, 설계한 포지셔닝과 메시지가 실제 고객 행동과 시장 성과로 이어진 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Regulatory Affairs
  JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS: {
    jobCoreActions: ["제품의 규제 요구사항과 인증 기준을 파악하고 정리하는 일", "제품이 규제 요구사항을 충족하도록 기술·임상·안전 데이터를 준비하는 일", "인증·허가 신청 서류를 작성하고 규제 기관과 소통하는 일", "인증 획득 후 규제 변화를 모니터링하고 지속적인 컴플라이언스를 관리하는 일"],
    majorRelatedActions: ["화학공학·제약·바이오 관련 전공은 제품의 기술·물질적 특성과 안전성 기초와 직접 연결될 수 있습니다.", "의학·보건 관련 전공은 의료기기·제약의 임상적 안전성, 유효성과 연결될 수 있습니다.", "법학·정책학 전공은 규제 제도, 법적 요구사항, 행정 절차와 연결될 수 있습니다.", "경영학·품질경영 전공은 규제 대응 전략, 컴플라이언스 관리, 리스크 평가와 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 제품의 규제 요구사항을 파악하거나 인증 신청을 진행한 경험은 확인되지 않습니다.",
      "규제 기준 조사, 안전성 데이터 준비, 신청 서류 작성, 규제 기관 대응, 인증 획득 경험은 별도 근거가 필요합니다.",
      "자신이 준비한 인증이 실제로 획득되고, 획득 후 규제 변화에 대응해본 실제 운영 경험은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 제품 규제 기준 조사, 안전성 평가, 인증 요구사항 분석, 준수 계획 수립을 다룬 장면이 있는지 떠올려보세요.", "인턴십, 현장 실습에서 규제 대응 과정을 지원하거나 인증 관련 문서 작업을 경험해본 시간이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 규제 학습보다 \"이 제품의 규제 리스크는 무엇이고, 어떻게 증명해야 하는가\"를 실제 데이터와 절차로 경험해본 경험이 더 중요합니다.", "규제대응·RA는 법규 이해만이 아니라, 실제 제품의 인증을 획득하고 지속적인 컴플라이언스를 관리해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Backend Development (Software Engineering)
  JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT: {
    jobCoreActions: ["서버 아키텍처와 데이터 흐름 설계", "백엔드 로직 구현 및 문제 디버깅", "데이터베이스와 API를 통한 정보 관리"],
    majorRelatedActions: ["컴퓨터공학·소프트웨어공학 전공은 알고리즘, 자료구조, 시스템 설계 기초와 직접 연결될 수 있습니다.", "수학·통계 전공은 알고리즘 효율성, 데이터 구조 최적화와 연결될 수 있습니다.", "전기공학·임베디드 관련 전공은 하드웨어-소프트웨어 인터페이스, 성능 제약과 일부 연결될 수 있습니다.", "물리학·과학 전공은 문제 분석, 논리적 설계, 실험적 검증과 일부 연결될 수 있습니다."],
    missingActions: [
      "실제 운영 환경에서 서버 아키텍처를 설계하고 구현해본 경험은 확인되지 않습니다.",
      "성능 최적화, 보안 강화, 대규모 데이터 처리, 장애 대응, 요구사항 분석 및 구현 경험은 별도 근거가 필요합니다.",
      "자신이 구현한 백엔드 시스템이 안정적으로 운영되고 기대했던 성능을 달성한 실제 증거는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 데이터베이스 설계, API 개발, 백엔드 구현을 다룬 장면이 있는지 떠올려보세요.", "인턴십이나 프로젝트에서 실제 서버를 운영해본 경험, 버그를 찾아 수정한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 코딩 과제보다 \"이 시스템은 왜 이렇게 설계했고, 어떻게 안정성을 보장했는가\"를 설명할 수 있는 구체적인 경험이 더 중요합니다.", "백엔드 개발은 기술 이해만이 아니라, 실제 프로덕션 환경에서 시스템을 운영하고 문제를 해결해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Business Development (BD)
  JOB_BUSINESS_BUSINESS_DEVELOPMENT: {
    jobCoreActions: ["시장 기회를 발굴하고 분석하는 일", "전략적 파트너십과 거래를 구축하는 일", "신규 비즈니스 기회를 평가하고 실행 계획을 수립하는 일"],
    majorRelatedActions: ["경영학·경제학 전공은 시장 분석, 경쟁 구도, 사업성 평가, 전략적 사고와 직접 연결될 수 있습니다.", "금융학·투자 관련 전공은 거래 평가, 가치 산정, 재무 타당성 검토와 연결될 수 있습니다.", "산업공학·통계 전공은 시장 데이터 분석, 사업성 모델링과 연결될 수 있습니다.", "커뮤니케이션·협상 능력 관련 전공은 파트너 관계 구축, 계약 협상과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 시장 기회를 발굴하거나 신규 비즈니스 계획을 수립한 경험은 확인되지 않습니다.",
      "시장 조사, 경쟁사 분석, 파트너 발굴, 사업성 평가, 거래 협상, 계약 체결 경험은 별도 근거가 필요합니다.",
      "자신이 제안한 비즈니스 기회가 실제로 실행되고 매출 증대 또는 새로운 시장 진출로 이어진 성과 증거는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 시장 조사, 경쟁 분석, 사업 계획 수립, 파트너십 모델 설계를 다룬 장면이 있는지 떠올려보세요.", "인턴십이나 창업 경험에서 실제 시장 기회를 분석하거나 거래를 협상해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 학습보다 \"이 시장의 기회는 무엇이고, 우리는 왜 이 파트너와 거래해야 하는가\"를 데이터와 실제 논의로 입증해본 경험이 더 중요합니다.", "BD는 시장 분석만이 아니라, 실제 기회를 발굴하고 거래를 성사시킨 결과가 사업 성과로 입증될 때 더 설득력 있게 읽힙니다."],
  },
  // Project Management (PM)
  JOB_BUSINESS_PROJECT_MANAGEMENT: {
    jobCoreActions: ["프로젝트 목표 정의 및 계획 수립", "일정, 리소스, 예산 관리를 통한 실행 감독", "이해관계자 간 조율과 리스크 관리"],
    majorRelatedActions: ["경영학·조직론 전공은 조직 관리, 리더십, 전략적 계획과 직접 연결될 수 있습니다.", "산업공학 전공은 프로세스 최적화, 자원 배분, 일정 계획과 연결될 수 있습니다.", "수학·통계 전공은 일정 계획, 리스크 분석, 데이터 기반 의사결정과 연결될 수 있습니다.", "커뮤니케이션·리더십 역량은 팀 관리, 이해관계자 소통과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 프로젝트를 기획하고 리딩한 경험은 확인되지 않습니다.",
      "프로젝트 계획 수립, 일정 관리, 예산 통제, 위험 요소 대응, 팀 조율, 이해관계자 관리 경험은 별도 근거가 필요합니다.",
      "자신이 관리한 프로젝트가 정해진 일정, 예산, 품질 목표를 달성한 실제 성과와 그 과정에서 해결한 문제들은 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 프로젝트 계획 수립, 일정 관리, 팀 조율, 리스크 관리를 다룬 경험이 있는지 떠올려보세요.", "인턴십이나 동아리에서 실제 프로젝트를 리딩하거나 부분 담당한 경험, 문제를 해결한 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 계획 수립보다 \"이 프로젝트의 리스크는 무엇이었고, 어떻게 문제를 해결했으며, 최종 결과는 무엇인가\"를 구체적으로 설명할 수 있는 경험이 더 중요합니다.", "PM은 계획 수립만이 아니라, 실제 프로젝트를 실행하고 변수에 대응해 성공적으로 완료한 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Key Account Management (KAM)
  JOB_SALES_KEY_ACCOUNT_MANAGEMENT: {
    jobCoreActions: ["주요 고객의 비즈니스를 깊이 있게 이해하는 일", "고객의 장기적 성공을 위한 맞춤형 솔루션 제시", "고객과의 신뢰 관계를 구축하고 지속적인 매출 성장을 달성하는 일"],
    majorRelatedActions: ["경영학·경제학 전공은 고객의 비즈니스 이해, 시장 분석, 가치 창출 방식과 직접 연결될 수 있습니다.", "마케팅 전공은 고객 세그먼트 분석, 고객 니즈 파악, 가치 제시와 연결될 수 있습니다.", "심리학·사회학 전공은 고객 관계 구축, 신뢰 형성, 의사결정 동인 이해와 일부 연결될 수 있습니다.", "리더십·커뮤니케이션 역량은 관계 관리, 협상, 이해관계자 조율과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 고객의 비즈니스를 분석하고 장기 전략을 수립한 경험은 확인되지 않습니다.",
      "주요 고객 발굴, 고객 비즈니스 분석, 맞춤형 솔루션 제안, 관계 구축, 지속적인 성장 달성 경험은 별도 근거가 필요합니다.",
      "자신이 담당한 고객의 매출이 증대되고 고객 만족도가 향상되며 추가 비즈니스로 이어진 실제 성과는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 고객 분석, 비즈니스 모델 이해, 고객 전략 수립, 가치 제시 방안 개발을 다룬 장면이 있는지 떠올려보세요.", "인턴십이나 영업 경험에서 실제 주요 고객을 담당하거나 고객 방문을 경험해본 시간이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 상품 설명보다 \"이 고객의 진정한 니즈는 무엇이고, 어떻게 우리 솔루션이 도움이 되는가\"를 고객 입장에서 설득한 경험이 더 중요합니다.", "KAM은 관계 관리만이 아니라, 고객의 비즈니스 성공에 기여하고 그로 인한 매출 증대가 함께 입증될 때 더 설득력 있게 읽힙니다."],
  },
  // HR Operations
  JOB_HR_ORGANIZATION_HR_OPS: {
    jobCoreActions: ["채용 계획 수립 및 모집 프로세스 운영", "급여, 복리후생, 퇴직금 등 인사 관리 시스템 운영", "HR 정책 이행 및 규정 준수 관리"],
    majorRelatedActions: ["경영학·조직론 전공은 조직 구조, 인사 전략, 조직 문화와 직접 연결될 수 있습니다.", "노무관리·노동법 관련 전공은 근로기준법, 복리후생, 퇴직금 등 법적 요구사항과 연결될 수 있습니다.", "심리학·사회학 전공은 팀 역학, 조직 행동, 인적 요소와 일부 연결될 수 있습니다.", "통계·데이터 분석 전공은 인사 데이터 분석, 인원 계획, 이직률 분석과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 채용 프로세스를 진행하거나 급여 시스템을 관리한 경험은 확인되지 않습니다.",
      "채용공고 작성, 지원자 심사, 면접 진행, 채용 의사결정, 급여 계산, HR 시스템 운영, 규정 준수 경험은 별도 근거가 필요합니다.",
      "자신이 운영한 채용이 기대한 인재를 확보했고, 급여·복리후생 시스템이 정상 운영되었으며, 법적 문제없이 관리된 실제 증거는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 채용 전략, 인사정책 설계, 보상 시스템, HR 데이터 분석을 다룬 경험이 있는지 떠올려보세요.", "HR 인턴십이나 현장 실습에서 실제 채용을 지원하거나 급여 관리 작업에 참여해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 학습보다 \"이 채용공고는 어떻게 작성했고, 지원자 심사는 어떻게 진행했으며, 최종 입사자가 기대를 충족했는가\"를 구체적으로 설명할 수 있는 경험이 더 중요합니다.", "HR Ops는 정책 이해만이 아니라, 실제 채용과 인사 관리 운영 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Operations Management
  JOB_BUSINESS_OPERATIONS_MANAGEMENT: {
    jobCoreActions: ["프로세스 효율화를 통한 비용 절감 및 품질 개선", "운영 계획 수립 및 실행 관리", "성과 지표 모니터링 및 개선 방안 제시"],
    majorRelatedActions: ["경영학·산업공학 전공은 프로세스 최적화, 품질 관리, 비용 통제와 직접 연결될 수 있습니다.", "통계·데이터 분석 전공은 운영 데이터 분석, 성과 지표 추적, 개선 효과 측정과 연결될 수 있습니다.", "시스템 사고 관련 전공은 복잡한 프로세스 이해, 상호 연관성 분석과 일부 연결될 수 있습니다.", "리더십·조직론 전공은 팀 관리, 조직 변화 관리, 협력적 개선과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 운영 프로세스를 분석하거나 개선 프로젝트를 리딩한 경험은 확인되지 않습니다.",
      "프로세스 분석, 병목 지점 파악, 개선안 설계, 개선 구현, 효율성 측정, 비용 절감 달성 경험은 별도 근거가 필요합니다.",
      "자신이 제안한 개선 사항이 실제로 구현되고 운영 효율이 높아졌으며 비용 절감이나 품질 향상으로 입증된 실제 성과는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 프로세스 분석, 효율화 방안 설계, 운영 최적화, 품질 관리를 다룬 경험이 있는지 떠올려보세요.", "인턴십이나 현장 실습에서 실제 운영 프로세스를 개선해본 경험, 효율성 향상을 측정해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 학습보다 \"이 프로세스의 문제점은 무엇이었고, 어떻게 개선했으며, 결과적으로 얼마나 개선되었는가\"를 데이터로 설명할 수 있는 경험이 더 중요합니다.", "Ops Mgmt는 이론 이해만이 아니라, 실제 프로세스 개선을 주도하고 성과를 달성해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Financial Planning & Analysis (FPA)
  JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING: {
    jobCoreActions: ["재무 계획 및 예산 수립", "실제 성과와 계획을 비교 분석", "재무 인사이트 기반 의사결정 지원"],
    majorRelatedActions: ["회계학·재무학 전공은 재무제표 해석, 재무 지표 분석, 예산 관리와 직접 연결될 수 있습니다.", "경제학 전공은 거시 경제 흐름, 시장 분석, 경제적 의사결정과 연결될 수 있습니다.", "통계·수학 전공은 재무 모델링, 데이터 분석, 예측 분석과 연결될 수 있습니다.", "경영학 전공은 전략적 재무 관리, 자본 배분, 성과 관리와 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 재무 계획을 수립하거나 성과를 분석한 경험은 확인되지 않습니다.",
      "예산 수립, 재무 모델링, 성과 분석, 편차 분석, 재무 보고, 의사결정 지원 경험은 별도 근거가 필요합니다.",
      "자신이 수립한 예산이 실제와 일치했는지, 분석한 인사이트가 의사결정에 반영되었는지, 예측이 얼마나 정확했는지를 입증하는 실제 증거는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 재무 분석, 예산 계획, 재무 모델링, 성과 분석을 다룬 경험이 있는지 떠올려보세요.", "인턴십이나 재무 관련 업무에서 실제 예산을 작성하거나 성과를 분석해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 숫자 정리보다 \"이 부서의 예산은 왜 이렇게 책정했고, 실제 성과와 어떻게 달랐으며, 무엇을 배웠는가\"를 설명할 수 있는 경험이 더 중요합니다.", "FPA는 회계 지식만이 아니라, 재무 데이터로부터 의사결정에 필요한 인사이트를 도출해본 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Customer Success Manager
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS: {
    jobCoreActions: ["고객의 성공 목표를 정의하고 달성 계획 수립", "고객 만족도 관리 및 이탈 위험 조기 발견", "고객 피드백 수집 및 제품·서비스 개선에 반영"],
    majorRelatedActions: ["경영학·경제학 전공은 고객 가치, 고객 생애주기, 장기 수익성과 직접 연결될 수 있습니다.", "마케팅 전공은 고객 세그먼트, 고객 경험, 관계 관리와 연결될 수 있습니다.", "심리학·사회학 전공은 고객 행동, 만족도 동인, 관계 형성과 일부 연결될 수 있습니다.", "커뮤니케이션 역량은 고객 소통, 문제 해결, 의견 수렴과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 고객의 성공을 정의하고 관리한 경험은 확인되지 않습니다.",
      "고객 온보딩, 성공 계획 수립, 만족도 모니터링, 위험 신호 감지, 문제 해결, 고객 유지 경험은 별도 근거가 필요합니다.",
      "자신이 담당한 고객이 설정한 성공 목표를 달성했고, 고객 만족도가 높으며, 추가 거래나 갱신으로 이어진 실제 성과는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 고객 경험 설계, 고객 여정 분석, 만족도 전략, 관계 관리를 다룬 경험이 있는지 떠올려보세요.", "인턴십이나 고객 서비스 경험에서 실제 고객을 담당하고 문제를 해결해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 고객 응대보다 \"이 고객의 목표는 무엇이었고, 어떻게 지원했으며, 최종적으로 목표를 달성했는가\"를 고객의 성공으로 입증할 수 있는 경험이 더 중요합니다.", "CSM은 고객 대응만이 아니라, 고객의 장기적 성공을 추구하고 그 결과가 고객 만족도와 매출 유지로 입증될 때 더 설득력 있게 읽힙니다."],
  },
  // Consulting
  JOB_RESEARCH_PROFESSIONAL_CONSULTING: {
    jobCoreActions: ["클라이언트의 비즈니스 문제를 분석하는 일", "문제 해결을 위한 전략과 액션플랜 수립", "컨설팅 결과의 구현을 지원하고 성과를 측정하는 일"],
    majorRelatedActions: ["경영학·경제학 전공은 비즈니스 분석, 전략 수립, 산업 이해와 직접 연결될 수 있습니다.", "통계·데이터 분석 전공은 문제 분석, 데이터 기반 의사결정, 성과 측정과 연결될 수 있습니다.", "산업공학 전공은 프로세스 최적화, 효율성 분석, 변화 관리와 연결될 수 있습니다.", "커뮤니케이션·프레젠테이션 역량은 클라이언트 소통, 아이디어 제시, 설득과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 비즈니스 문제를 분석하고 해결책을 제시한 경험은 확인되지 않습니다.",
      "현황 분석, 문제 정의, 전략 개발, 액션플랜 수립, 구현 지원, 성과 측정 경험은 별도 근거가 필요합니다.",
      "자신이 제시한 컨설팅 권장사항이 실제로 구현되었고 클라이언트의 성과 향상으로 입증된 실제 결과는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 캡스톤 프로젝트에서 기업 분석, 전략 수립, 문제 해결 방안 개발, 행동 계획 작성을 다룬 경험이 있는지 떠올려보세요.", "인턴십이나 프로젝트에서 실제 기업이나 조직의 문제를 분석해본 경험, 개선안을 제시해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 이론 분석보다 \"이 기업의 진정한 문제는 무엇이었고, 어떻게 분석했으며, 제시한 해결책이 실제로 작동했는가\"를 사례로 설명할 수 있는 경험이 더 중요합니다.", "컨설팅은 문제 분석만이 아니라, 실제 클라이언트와 함께 솔루션을 구현하고 성과를 달성한 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Partner/Channel Sales
  JOB_SALES_PARTNER_CHANNEL_SALES: {
    jobCoreActions: ["파트너사 개발 및 채널 확대", "파트너사 역량 강화를 위한 교육 및 지원", "파트너사를 통한 매출 창출 및 성과 관리"],
    majorRelatedActions: ["경영학·영업 관련 전공은 비즈니스 모델, 채널 전략, 관계 관리와 직접 연결될 수 있습니다.", "마케팅 전공은 파트너 세그먼트 분석, 가치 제시, 인센티브 설계와 연결될 수 있습니다.", "경제학 전공은 거래 구조, 상호이익 분석, 시장 기회와 일부 연결될 수 있습니다.", "커뮤니케이션·리더십 역량은 파트너 관계 구축, 협력 촉진과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 파트너사를 발굴하거나 채널을 활성화한 경험은 확인되지 않습니다.",
      "파트너 모집, 계약 협상, 교육 지원, 성과 관리, 채널 활성화, 함께 매출 달성 경험은 별도 근거가 필요합니다.",
      "자신이 개발한 파트너사가 기대한 수준의 매출을 달성했고, 파트너 만족도가 높으며 지속적인 거래로 이어진 실제 증거는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 채널 전략, 파트너 모델 설계, 관계 관리 방안, 성과 관리 체계를 다룬 경험이 있는지 떠올려보세요.", "영업 또는 파트너 관리 인턴십에서 실제 파트너를 담당해본 경험, 파트너와 거래를 협상해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 관계 유지보다 \"이 파트너의 강점은 무엇이고, 어떻게 지원했으며, 함께 매출을 달성했는가\"를 파트너와의 성과로 입증할 수 있는 경험이 더 중요합니다.", "파트너채널영업은 관계 관리만이 아니라, 파트너의 성장과 함께 매출을 창출한 상호 성공의 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // Proposal Sales
  JOB_SALES_PROPOSAL_SALES: {
    jobCoreActions: ["입찰 기회 분석 및 고객 요구사항 파악", "경쟁력 있는 제안서 작성 및 제시", "협상을 통한 계약 체결 및 수주 달성"],
    majorRelatedActions: ["경영학·영업 관련 전공은 고객 분석, 경쟁 전략, 가치 제시와 직접 연결될 수 있습니다.", "기술 관련 전공은 기술 요구사항 이해, 솔루션 가능성 평가, 기술적 타당성 검토와 연결될 수 있습니다.", "커뮤니케이션·작문 역량은 설득력 있는 제안서 작성, 프레젠테이션 구성과 연결될 수 있습니다.", "프로젝트 관리 역량은 제안 프로세스 관리, 다부처 협력과 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 입찰에 참여하거나 제안서를 작성한 경험은 확인되지 않습니다.",
      "입찰 분석, 제안서 개발, 기술 검토, 가격 책정, 고객 프레젠테이션, 협상, 계약 체결 경험은 별도 근거가 필요합니다.",
      "자신이 참여한 입찰이 실제로 수주되었고, 제안한 솔루션이 계약으로 이어져 매출을 달성한 실제 증거는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 고객 요구사항 분석, 제안서 작성, 기술 솔루션 검토, 가격 산정을 다룬 경험이 있는지 떠올려보세요.", "영업 또는 비즈니스 인턴십에서 실제 제안서 작성을 지원해본 경험, 고객 프레젠테이션에 참여해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 문서 작성보다 \"이 고객의 요구사항은 무엇이었고, 어떻게 솔루션을 설계했으며, 최종적으로 계약을 체결했는가\"를 수주 성과로 입증할 수 있는 경험이 더 중요합니다.", "제안영업은 제안서 작성만이 아니라, 고객의 요구를 이해하고 설득력 있는 제안으로 계약을 획득한 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
  },
  // E-Commerce Operations
  JOB_CUSTOMER_OPERATIONS_ECOMMERCE_OPERATIONS: {
    jobCoreActions: ["온라인 판매 채널 운영 및 고객 경험 최적화", "상품 정보 관리 및 유통 프로세스 운영", "판매 성과 모니터링 및 개선안 도출"],
    majorRelatedActions: ["경영학·마케팅 전공은 온라인 판매 전략, 고객 경험, 채널 관리와 직접 연결될 수 있습니다.", "데이터 분석 전공은 판매 데이터 분석, 고객 행동 분석, 성과 측정과 연결될 수 있습니다.", "정보기술 전공은 전자상거래 시스템, 데이터 관리, 디지털 인프라와 연결될 수 있습니다.", "커뮤니케이션·마케팅 역량은 고객 소통, 콘텐츠 관리, 홍보와 일부 연결될 수 있습니다."],
    missingActions: [
      "전공만으로 실제 온라인 판매 채널을 운영하거나 최적화한 경험은 확인되지 않습니다.",
      "채널 운영, 상품 관리, 고객 경험 개선, 판매 증대 방안 실행, 성과 분석, 개선 추진 경험은 별도 근거가 필요합니다.",
      "자신이 운영한 채널의 판매가 증대되었고, 고객 만족도가 높아졌으며, 운영 효율이 개선된 실제 성과는 추가 확인이 필요합니다.",
    ],
    followUpActions: ["수업이나 프로젝트에서 온라인 판매 전략, 고객 경험 설계, 운영 프로세스, 판매 분석을 다룬 경험이 있는지 떠올려보세요.", "전자상거래 인턴십이나 온라인 판매 경험에서 실제 채널을 운영해본 경험, 판매 개선을 시도해본 경험이 있다면 Axis3에서 보강 근거가 됩니다.", "단순 판매 기록보다 \"이 채널의 문제점은 무엇이었고, 어떻게 개선했으며, 결과적으로 판매가 어떻게 증대되었는가\"를 데이터와 성과로 설명할 수 있는 경험이 더 중요합니다.", "E-Commerce Ops는 시스템 운영만이 아니라, 판매를 증대하고 고객 경험을 개선한 실제 운영 경험이 함께 있을 때 더 설득력 있게 읽힙니다."],
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

  // Economics → PMM bridge detection and specialized text
  const majorKey = String(input?.majorKey || "").trim();
  const isEconomicsToPMM = (majorKey === "ECONOMICS" || majorKey === "경제학") && targetJobId.includes("PRODUCT_MARKETING_PMM");

  // Registry-based bridge lookup for other major-job combinations
  const registryBridge = !isEconomicsToPMM ? resolveNewgradMajorBridgeProfile(majorKey, targetJobId) : null;

  // Build role-specific reason text
  let scoreReason;
  if (isEconomicsToPMM) {
    // Economics-specific bridge to PMM
    scoreReason = `${majorLabel}은 시장을 숫자와 구조로 읽는 전공입니다. 수요, 가격, 경쟁, 소비자 선택을 분석하는 훈련은 ${targetJobLabel}에서 시장 기회와 고객 세그먼트, 가격/포지션 판단을 이해하는 데 일부 연결됩니다.\n\n${targetJobLabel}은 제품을 시장·고객·경쟁 상황에 맞게 포지셔닝하고, 어떤 고객에게 어떤 메시지와 가격/포지션으로 전달할지 판단하는 직무입니다.\n\n따라서 ${majorLabel} 전공을 통해 수요, 가격, 경쟁, 소비자 선택을 구조적으로 분석하는 훈련을 해왔고, 이를 바탕으로 제품이 어떤 고객에게, 어떤 메시지와 가격/포지션으로 전달되어야 하는지 판단하는 ${targetJobLabel} 직무에 관심을 갖게 되었다고 연결할 수 있습니다.`;
  } else if (registryBridge) {
    // Registry-based bridge for other major-job combinations
    const { majorDefinition, jobConnection, careerBridge } = registryBridge;
    scoreReason = `${majorDefinition} ${jobConnection}${careerBridge ? `\n\n${careerBridge}` : ""}`;
  } else if (shouldUseJobSpecificText) {
    scoreReason = `${majorLabel} 전공은 ${targetJobLabel}에서 중요한 ${joinAxis1Labels(jobSpecificActions.foundationActions, 3)} 같은 기초 행동과는 연결될 수 있습니다. 다만 현재 입력만으로는 ${joinAxis1Labels(jobSpecificActions.missingActions, 3)}까지는 직접 드러나지 않습니다.`;
  } else if (roleProfile) {
    scoreReason = buildAxis1ReasonText(majorLabel, targetJobLabel, majorRelatedActionsForDisplay, missingActionsForDisplay, majorPriorLabel);
  } else if (jobSpecificActions) {
    scoreReason = `${majorLabel} 전공은 ${targetJobLabel}에서 중요한 ${joinAxis1Labels(jobSpecificActions.foundationActions, 3)} 같은 기초 행동과는 연결될 수 있습니다. 다만 현재 입력만으로는 ${joinAxis1Labels(jobSpecificActions.missingActions, 3)}까지는 직접 드러나지 않습니다.`;
  } else {
    scoreReason = `${majorLabel} 전공은 ${categoryLabel}에서 중요한 ${joinAxis1Labels(jobCoreActions, 3)} 중 ${joinAxis1Labels(relatedJobActions, 2)}와는 연결될 수 있지만, 현재 입력만으로는 ${joinAxis1Labels(missingActions, 2)}까지 직접 드러나지는 않습니다.`;
  }

  // Build role-specific follow-up text
  let liftOrLimit;
  if (isEconomicsToPMM) {
    // Economics-specific appealing courses and evidence actions
    liftOrLimit = `어필할 수 있는 전공 과목은 미시경제학, 산업조직론, 계량경제학/통계학, 행동경제학, 국제경제학입니다. 이 연결을 더 강하게 보려면, ${joinAxis1Labels(jobSpecificActions.nextEvidenceActions, 4)} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;
  } else if (registryBridge && registryBridge.appealingCourses && registryBridge.appealingCourses.length > 0) {
    // Registry-based appealing courses for other major-job combinations
    const appealingCourses = registryBridge.appealingCourses;
    const coursesText = appealingCourses.join(", ");
    const evidenceText = registryBridge.evidencePrompts && registryBridge.evidencePrompts.length > 0
      ? `이 연결을 더 강하게 보려면, ${joinAxis1Labels(registryBridge.evidencePrompts, 4)} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`
      : `이 연결을 더 강하게 보려면, 해당 과목에서 배운 개념을 실제 ${targetJobLabel} 사례에 어떻게 적용할 수 있는지 함께 떠올려보는 것이 좋습니다.`;
    liftOrLimit = `어필할 수 있는 전공 과목은 ${coursesText}입니다. ${evidenceText}`;
  } else if (shouldUseJobSpecificText) {
    liftOrLimit = `이 연결을 더 강하게 보려면, ${joinAxis1Labels(jobSpecificActions.nextEvidenceActions, 4)} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;
  } else if (roleProfile) {
    liftOrLimit = buildAxis1FollowUpText(majorLabel, learningBasis, followUpActionsForDisplay, majorPriorLabel);
  } else if (jobSpecificActions) {
    liftOrLimit = `이 연결을 더 강하게 보려면, ${joinAxis1Labels(jobSpecificActions.nextEvidenceActions, 4)} 같은 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;
  } else {
    liftOrLimit = `이 연결을 더 강하게 보려면, ${buildAxis1FollowUpQuestion(learningBasis, majorActions, missingActions)} 함께 떠올려보는 것이 좋습니다.`;
  }

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

const NEWGRAD_AXIS2_INDUSTRY_GUIDES = {
  IND_IT_SOFTWARE_PLATFORM_B2B_SAAS: {
    label: "B2B SaaS",
    structure: "B2B SaaS 산업은 개인 사용자가 아니라 기업 고객이 반복적으로 사용하는 소프트웨어를 구독·계약 형태로 제공하는 구조입니다. 제품 기능 자체뿐 아니라 도입, 온보딩, 사용 지속, 보안·권한 관리, 고객사의 업무 프로세스와의 연결이 중요합니다.",
    strongMajorFit: "현재 입력만 보면 B2B SaaS 산업과의 기초 연결은 비교적 분명한 편입니다. 컴퓨터공학 전공은 이 산업에서 중요한 서비스 구조, 데이터 처리, 기능 구현, 시스템 안정성 같은 기술 기반 이해와 연결될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 B2B SaaS 산업 자체를 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 단순히 소프트웨어를 만든다는 점보다, 기업 고객이 어떤 업무 문제를 해결하기 위해 비용을 지불하고 계속 사용하는지가 중요합니다.",
    gap: "다만 현재 입력만으로는 기업 고객의 도입 과정, 구독 수익 구조, 사용자 활성화, 리텐션, 보안·권한 같은 SaaS 운영 맥락까지 직접 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 프로젝트나 수업 안에서 사용자 계정 관리, 관리자 기능, 과금·구독 구조, B2B 업무 흐름, API 연동, 서비스 운영 지표를 고민했던 장면이 있었는지 함께 떠올려보는 것이 좋습니다.",
  },
  IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ECOMMERCE_PLATFORM_MARKETPLACE_OPERATOR: {
    label: "이커머스 플랫폼 / 오픈마켓 운영사",
    structure: "커머스·유통 산업은 상품을 보유하거나 중개하고, 고객이 탐색·비교·구매·배송·반품을 거치는 흐름을 관리하는 구조입니다. 특히 플랫폼형 커머스에서는 구매자뿐 아니라 판매자, 상품 노출, 재고·물류, 정산, 리뷰와 같은 운영 요소가 함께 중요합니다.",
    strongMajorFit: "현재 입력만 보면 커머스 산업과의 기본 연결은 어느 정도 있습니다. 경영학 전공은 고객, 상품, 가격, 매출, 운영 효율 같은 비즈니스 기초를 이해하는 데 도움이 될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 커머스 산업을 구체적으로 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 단순한 판매보다 고객이 어떤 경로로 상품을 발견하고 구매하며, 판매자와 물류·정산 구조가 어떻게 맞물리는지가 중요합니다.",
    gap: "다만 현재 입력만으로는 상품 탐색, 전환율, 객단가, 재구매, 판매자 운영, 물류·배송, 반품 같은 커머스 특유의 흐름을 직접 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 온라인 쇼핑몰·마켓플레이스·브랜드몰을 분석하거나, 구매 여정, 상품 구성, 프로모션, 판매 데이터, 물류/CS 이슈를 다뤄본 장면이 있었는지 함께 떠올려보는 것이 좋습니다.",
  },
  IND_FINANCE_INSURANCE_FINTECH_FINTECH: {
    label: "핀테크",
    structure: "금융·핀테크 산업은 돈의 이동, 결제, 대출, 투자, 보험, 자산관리처럼 신뢰와 규제가 중요한 거래를 디지털 서비스로 제공하는 구조입니다. 고객 편의성뿐 아니라 보안, 인증, 리스크 관리, 규제 준수, 수수료·이자·운용 수익 같은 구조를 함께 이해해야 합니다.",
    strongMajorFit: "현재 입력만 보면 금융·핀테크 산업과의 기초 연결은 어느 정도 있습니다. 경제학 전공은 금융 시장, 의사결정, 비용과 수익, 리스크를 이해하는 데 도움이 될 수 있고, FP&A·경영분석 직무와도 일부 연결됩니다.",
    weakMajorFit: "현재 입력만 보면 금융·핀테크 산업 자체를 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 단순히 돈을 다룬다는 점보다, 고객의 거래를 안전하고 규제에 맞게 처리하면서 수익과 리스크를 관리하는 구조가 중요합니다.",
    gap: "다만 현재 입력만으로는 결제·대출·투자·보험 같은 세부 서비스 구조, 인증·보안, 규제, 리스크 관리, 수수료/이자 수익 모델을 직접 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 금융 서비스의 수익 구조, 고객 거래 흐름, 규제 이슈, 리스크 지표, 핀테크 서비스의 사용 경험이나 분석 경험을 떠올려보는 것이 좋습니다.",
  },
  IND_MANUFACTURING_AUTOMOTIVE_MOBILITY: {
    label: "자동차 / 모빌리티",
    structure: "제조·자동차/모빌리티 산업은 제품을 기획하고 부품을 조달해 생산·품질·출하·AS까지 이어지는 긴 운영 흐름을 관리하는 구조입니다. 원가, 생산성, 납기, 품질, 안전, 공급망 안정성이 산업 이해의 핵심입니다.",
    strongMajorFit: "현재 입력만 보면 제조·생산 산업과의 연결은 비교적 분명한 편입니다. 산업공학 전공은 공정, 생산성, 품질, 최적화, 공급망 같은 제조 운영의 기초와 연결될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 제조·생산 산업을 구체적으로 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 제품을 만든다는 점뿐 아니라, 어떤 공정과 자원으로 안정적인 품질과 납기를 맞추는지가 중요합니다.",
    gap: "다만 현재 입력만으로는 실제 생산라인, 공정 개선, 품질 이슈, 원가·납기 관리, 부품 공급망, 현장 데이터 분석을 다뤄봤는지는 직접 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 수업이나 프로젝트 안에서 공정 분석, 생산계획, 품질관리, 원가 절감, 병목 개선, SCM, 제조 데이터 활용을 다룬 장면이 있었는지 함께 떠올려보는 것이 좋습니다.",
  },
  IND_MEDIA_CONTENT_EDUCATION_CONTENT_ENTERTAINMENT: {
    label: "콘텐츠 / 엔터테인먼트",
    structure: "콘텐츠·미디어 산업은 콘텐츠를 기획·제작·유통하고, 시청자·구독자·팬덤·광고주 또는 플랫폼을 통해 수익을 만드는 구조입니다. IP, 포맷, 채널, 조회·체류·구독 지표, 광고·협찬·라이선스 수익이 함께 작동합니다.",
    strongMajorFit: "현재 입력만 보면 콘텐츠·미디어 산업과의 기본 연결은 어느 정도 있습니다. 신문방송학 전공은 미디어 채널, 콘텐츠 포맷, 수용자 이해, 메시지 구성 같은 기초 이해와 연결될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 콘텐츠·미디어 산업을 구체적으로 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 좋은 콘텐츠를 만드는 것뿐 아니라, 어떤 채널에서 누구에게 도달하고 어떤 방식으로 수익화되는지가 중요합니다.",
    gap: "다만 현재 입력만으로는 콘텐츠 기획·제작 과정, 플랫폼별 유통 방식, 조회·전환·구독 지표, 광고/협찬/라이선스 수익 구조, 팬덤 운영을 직접 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 콘텐츠를 직접 기획·제작·운영했거나 채널 성과, 타깃 반응, 광고·협찬 구조, IP 확장 가능성을 분석했던 장면이 있었는지 함께 떠올려보는 것이 좋습니다.",
  },
  IND_MEDIA_CONTENT_EDUCATION_EDTECH: {
    label: "에듀테크",
    structure: "교육·에듀테크 산업은 학습자가 지식을 습득하고 성과를 내도록 콘텐츠, 커리큘럼, 플랫폼, 피드백, 평가를 설계하는 구조입니다. 학습 지속률, 완강률, 성취도, 재구매, 기관/개인 고객의 구매 의사결정이 중요합니다.",
    strongMajorFit: "현재 입력만 보면 교육·에듀테크 산업과의 기초 연결은 비교적 분명한 편입니다. 교육학 전공은 학습자 이해, 교육과정, 교수설계, 평가 방식 같은 산업의 기본 작동 원리와 연결될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 교육·에듀테크 산업을 구체적으로 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 교육 콘텐츠 자체뿐 아니라 학습자가 왜 시작하고, 어떻게 지속하며, 어떤 성과를 얻는지가 중요합니다.",
    gap: "다만 현재 입력만으로는 온라인 학습 플랫폼, 콘텐츠 운영, 학습 데이터, 완강률·재수강률, 교육 상품의 구매 구조, B2B/B2C 교육 판매 흐름을 직접 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 수업 설계, 교육 콘텐츠 제작, 학습자 피드백, 교육 플랫폼 분석, 학습 성과 지표, HRD/교육 운영 경험을 다룬 장면이 있었는지 함께 떠올려보는 것이 좋습니다.",
  },
  IND_HEALTHCARE_PHARMA_BIO_HOSPITAL_MEDICAL_SERVICES: {
    label: "병원 / 의료서비스",
    structure: "헬스케어·의료서비스 산업은 환자 진료, 검사, 치료, 관리, 보험·수가, 의료진 운영, 병원 시스템이 맞물려 돌아가는 구조입니다. 고객은 환자이지만, 실제 운영에서는 의료진, 보호자, 보험/제도, 병원 행정이 함께 영향을 줍니다.",
    strongMajorFit: "현재 입력만 보면 헬스케어·의료서비스 산업과의 연결은 비교적 분명한 편입니다. 간호학이나 생명과학 계열 전공은 환자, 질환, 의료 현장, 생명과학 지식 같은 기초 이해와 연결될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 헬스케어 산업을 구체적으로 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 의료 지식뿐 아니라 환자 경험, 의료진 업무 흐름, 병원 운영, 보험/제도 구조가 함께 중요합니다.",
    gap: "다만 현재 입력만으로는 병원 운영, 진료 프로세스, 환자 여정, 의료 데이터, 보험·수가, 의료진 협업 구조를 직접 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 병원 실습, 의료 현장 관찰, 환자 경험 개선, 의료 데이터 분석, 병원 행정/운영, 헬스케어 서비스 사용 경험을 구체적으로 떠올려보는 것이 좋습니다.",
  },
  IND_PUBLIC_ASSOCIATION_NONPROFIT_PUBLIC_INSTITUTION: {
    label: "공공기관",
    structure: "공공·비영리 산업은 개인 고객의 구매보다 시민, 수혜자, 기관, 정책 대상자의 문제를 해결하는 구조입니다. 예산, 법·제도, 이해관계자, 공공성, 민원, 성과지표, 행정 절차가 산업 이해의 핵심입니다.",
    strongMajorFit: "현재 입력만 보면 공공기관 산업과의 기초 연결은 어느 정도 있습니다. 행정학 전공은 정책, 제도, 예산, 공공문제 해결, 행정 절차에 대한 기본 이해와 연결될 수 있습니다.",
    weakMajorFit: "현재 입력만 보면 공공·비영리 산업을 구체적으로 이해했다는 근거는 아직 제한적입니다. 이 산업에서는 매출보다 공공성, 예산 집행, 정책 대상자, 이해관계자 조정, 절차적 정당성이 중요합니다.",
    gap: "다만 현재 입력만으로는 실제 정책/사업 운영, 예산 관리, 민원 대응, 기관 간 협업, 공공 프로젝트 성과관리, 법·제도 기반 의사결정을 다뤄봤는지는 드러나지 않습니다.",
    lift: "이 연결을 더 강하게 보려면, 공공기관 인턴, 정책 분석, 행정 프로젝트, 사회문제 해결 활동, 예산/제도/성과지표를 다룬 경험이 있었는지 함께 떠올려보는 것이 좋습니다.",
  },
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

  // Get industry guide for Batch 2-A industries
  const targetIndustryId = String(signals.targetIndustryId || "");
  const industryGuide = NEWGRAD_AXIS2_INDUSTRY_GUIDES[targetIndustryId] || null;

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

  // Build summary with industry guide
  let summary = buildNewgradDomainInterestToneSummary(signals, band);
  if (industryGuide) {
    if (majorAligned) {
      summary = industryGuide.strongMajorFit;
    } else {
      summary = industryGuide.weakMajorFit;
    }
  }

  // Build positives with industry structure
  let positives = buildNewgradDomainInterestPositives(signals);
  if (industryGuide && industryGuide.structure) {
    positives = [industryGuide.structure, ...positives].slice(0, 3);
  }

  // Build gaps with industry gap
  let gaps = buildNewgradDomainInterestGaps(signals);
  if (industryGuide && industryGuide.gap) {
    gaps = [industryGuide.gap, ...gaps].slice(0, 3);
  }

  const explanationExtra = {
    ...pickExperienceExplanationExtra(signals),
    ...buildNewgradExplanationSlots("axis2", signals, band, selectionPack, summary, upgradedReasons, gaps),
    ...(industryGuide && industryGuide.lift ? { liftOrLimit: industryGuide.lift } : {}),
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
