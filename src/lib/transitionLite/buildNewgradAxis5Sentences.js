import {
  getStrengthGroups,
  getWorkStyleGroups,
  STRENGTH_GROUPS,
  WORKSTYLE_GROUPS,
} from "../../data/transitionLite/newgradAxis5InputGroups.js";
import { getCategoryLabel, getCategoryActions } from "../../data/transitionLite/newgradJobCategoryCoreActions.js";
import { getStrengthLabels } from "../../data/transitionLite/newgradStrengthKeyToLabel.js";

/**
 * 판정형 Axis5 문장 생성
 *
 * 입력:
 * - canonicalStrengthKeys: ['analytical_thinking', 'problem_solving', ...]
 * - canonicalWorkStyleKeys: ['context_first', 'evidence_based_judgment', ...]
 * - targetJobLabel: '디지털마케팅' or '서비스기획' 또는 타겟 직무명
 * - categoryKey: 'MARKETING', 'BUSINESS' 등 14개 대분류 key
 *
 * 반환:
 * - 판정형 문장 또는 fallback 문장
 */
export function buildNewgradAxis5Sentences({
  canonicalStrengthKeys = [],
  canonicalWorkStyleKeys = [],
  targetJobLabel = "",
  categoryKey = "",
}) {
  // Fallback: 입력 부족
  if (!targetJobLabel) {
    return generateFallbackSentence(null, canonicalStrengthKeys.length > 0);
  }

  if (!categoryKey) {
    return generateFallbackSentence(targetJobLabel, canonicalStrengthKeys.length > 0);
  }

  const strengthLabels = getStrengthLabels(canonicalStrengthKeys);
  const strengthGroups = getStrengthGroups(canonicalStrengthKeys);
  const workStyleGroups = getWorkStyleGroups(canonicalWorkStyleKeys);

  const categoryLabel = getCategoryLabel(categoryKey);
  const coreActions = getCategoryActions(categoryKey);

  if (!categoryLabel || coreActions.length === 0) {
    return generateFallbackSentence(targetJobLabel, canonicalStrengthKeys.length > 0);
  }

  // 강점이 없으면 fallback
  const selectedStrengthLabels = strengthLabels.join(", ");
  if (!selectedStrengthLabels) {
    return generateFallbackSentence(targetJobLabel, false);
  }

  // 판정 텍스트 생성
  const { fitJudgmentText, firstSentencePhrase } = determineFitJudgment(
    strengthGroups,
    workStyleGroups
  );

  // coreActions 중 처음 3개 선택
  const selectedCoreActions = coreActions.slice(0, 3).join(", ");

  // 강점 그룹별 행동 제안
  const groupSpecificAction = generateGroupSpecificAction(
    strengthGroups,
    categoryLabel,
    categoryKey
  );

  // 최종 문장 조합 (첫 문장 분기)
  const firstSentence = `현재 입력한 강점만 보면 ${targetJobLabel} 직무와의 연결은 ${firstSentencePhrase}`;
  const secondSentence = `${selectedStrengthLabels} 같은 강점은 기본 태도 신호로는 좋지만, ${categoryLabel}에서 중요한 ${selectedCoreActions} 같은 행동까지 직접 보여주지는 못합니다.`;
  const thirdSentence = `이 강점이 더 강하게 읽히려면, 실제 경험 안에서 ${groupSpecificAction}으로 드러난 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;

  return `${firstSentence} ${secondSentence} ${thirdSentence}`;
}

/**
 * 강점과 일하는 방식의 조합으로 판정 텍스트 결정
 */
function determineFitJudgment(strengthGroups = [], workStyleGroups = []) {
  const hasStrongSignal = strengthGroups.length >= 3 || (strengthGroups.length >= 2 && workStyleGroups.length >= 1);

  if (hasStrongSignal) {
    return {
      fitJudgmentText: "비교적 보이는",
      firstSentencePhrase: "비교적 보이는 편입니다.",
    };
  }
  if (strengthGroups.length === 1) {
    return {
      fitJudgmentText: "일부 보이는",
      firstSentencePhrase: "일부 보이는 편입니다.",
    };
  }
  return {
    fitJudgmentText: "약한",
    firstSentencePhrase: "아직 약한 편입니다.",
  };
}

/**
 * 강점 그룹 + 카테고리별 맞춤 행동 제안 생성
 */
function generateGroupSpecificAction(
  strengthGroups = [],
  categoryLabel = "",
  categoryKey = ""
) {
  if (strengthGroups.length === 0) {
    return "실제 경험과 행동";
  }

  const firstGroup = strengthGroups[0];
  const groupId = firstGroup.id;

  // Category + Group 조합별 맞춤 action
  const categoryGroupMap = {
    MARKETING_EXECUTION_RESPONSIBILITY: "고객 반응을 확인하고 콘텐츠나 메시지를 개선한 행동",
    MARKETING_PRECISION_QUALITY_FOCUSED: "콘텐츠 일정, 소재명, 캠페인 지표, 채널 운영 기준을 빠뜨리지 않고 관리한 행동",
    MARKETING_ANALYTICAL_PROBLEM_SOLVER: "고객 반응을 분석해 캠페인 방향을 조정한 행동",
    MARKETING_CREATIVITY_LEARNING_ADAPTABLE: "새로운 채널과 소재를 시도하고 개선한 행동",

    BUSINESS_ANALYTICAL_PROBLEM_SOLVER: "문제를 정의하고 요구사항이나 실행 기준으로 정리한 행동",
    BUSINESS_PRIORITIZATION_JUDGMENT: "실행 순서와 우선순위를 판단한 행동",
    BUSINESS_EXECUTION_RESPONSIBILITY: "계획을 세우고 끝까지 실행에 책임을 진 행동",

    FINANCE_ACCOUNTING_PRECISION_QUALITY_FOCUSED: "계정, 증빙, 금액, 기간을 기준에 맞게 확인한 행동",
    FINANCE_ACCOUNTING_EVIDENCE_BASED: "숫자나 자료를 근거에 맞게 확인하고 오류를 바로잡은 행동",
    FINANCE_ACCOUNTING_ANALYTICAL_PROBLEM_SOLVER: "재무 데이터에서 문제를 찾아내고 원인을 분석한 행동",

    SALES_ANALYTICAL_PROBLEM_SOLVER: "고객 반응과 니즈를 나누어 보고 제안 방향을 조정한 행동",
    SALES_COMMUNICATION_PERSUASION: "고객에게 제안 포인트를 설명하고 반응에 맞춰 설득 방식을 바꾼 행동",
    SALES_EXECUTION_RESPONSIBILITY: "고객 응대나 제안 후속 조치를 끝까지 챙긴 행동",
    SALES_EMPATHY_COLLABORATION: "고객 입장이나 내부 협업 부서의 요구를 함께 조율한 행동",

    IT_DATA_DIGITAL_ANALYTICAL_PROBLEM_SOLVER: "데이터나 사용 흐름을 보고 문제 원인을 나누어 파악한 행동",
    IT_DATA_DIGITAL_PRECISION_QUALITY_FOCUSED: "수치, 조건, 오류 가능성을 확인하며 결과의 신뢰도를 점검한 행동",
    IT_DATA_DIGITAL_PRIORITIZATION_JUDGMENT: "지표나 영향도를 기준으로 먼저 해결할 문제를 정한 행동",
    IT_DATA_DIGITAL_CREATIVITY_LEARNING_ADAPTABLE: "새로운 도구나 방식을 익혀 문제 해결에 적용한 행동",

    HR_ORGANIZATION_COMMUNICATION_PERSUASION: "구성원이나 지원자에게 기준과 절차를 설명하고 이해를 조율한 행동",
    HR_ORGANIZATION_EMPATHY_COLLABORATION: "사람마다 다른 상황과 요구를 듣고 조율한 행동",
    HR_ORGANIZATION_EXECUTION_RESPONSIBILITY: "일정, 안내, 후속 조치를 빠뜨리지 않고 운영한 행동",
    HR_ORGANIZATION_PRIORITIZATION_JUDGMENT: "채용, 교육, 운영 우선순위를 판단한 행동",

    CUSTOMER_OPERATIONS_EMPATHY_COLLABORATION: "고객의 불편이나 요청을 듣고 필요한 조치를 연결한 행동",
    CUSTOMER_OPERATIONS_PRECISION_QUALITY_FOCUSED: "문의, 주문, 처리 상태를 기준에 맞게 확인한 행동",
    CUSTOMER_OPERATIONS_EXECUTION_RESPONSIBILITY: "고객 응대나 운영 후속 처리를 끝까지 챙긴 행동",
    CUSTOMER_OPERATIONS_ANALYTICAL_PROBLEM_SOLVER: "반복되는 문의나 오류를 묶어 원인을 파악한 행동",
  };

  const key = `${categoryKey}_${groupId}`;
  if (categoryGroupMap[key]) {
    return categoryGroupMap[key];
  }

  // Fallback: Group별 기본 action
  const actionMap = {
    ANALYTICAL_PROBLEM_SOLVER: `${categoryLabel}에서 데이터를 분석하고 문제를 찾아낸 행동`,
    PRECISION_QUALITY_FOCUSED: `${categoryLabel}에서 기준을 정하고 일관되게 관리한 행동`,
    EXECUTION_RESPONSIBILITY: `${categoryLabel}에서 목표를 정하고 책임 있게 추진한 행동`,
    PRIORITIZATION_JUDGMENT: `${categoryLabel}에서 우선순위를 판단하고 결정한 행동`,
    COMMUNICATION_PERSUASION: `${categoryLabel}에서 이해관계자를 설득하고 조율한 행동`,
    EMPATHY_COLLABORATION: `${categoryLabel}에서 함께 협력하고 문제를 해결한 행동`,
    CREATIVITY_LEARNING_ADAPTABLE: `${categoryLabel}에서 새로운 시도를 하고 배운 행동`,
  };

  return actionMap[groupId] || `${categoryLabel}에서 직접 보여준 행동`;
}

/**
 * categoryKey 미존재 또는 기타 오류 시 fallback 문장
 */
function generateFallbackSentence(targetJobLabel = "", hasStrengths = false) {
  if (!targetJobLabel) {
    return "현재 입력한 정보만으로는 직무와의 연결을 판단하기 어렵습니다. 목표 직무와 강점을 명확하게 입력하면 더 정확한 분석이 가능합니다.";
  }

  if (!hasStrengths) {
    return `${targetJobLabel} 직무와의 연결을 판단하려면 선택한 강점이 필요합니다. 자신의 강점을 입력하면 더 구체적인 조언을 받을 수 있습니다.`;
  }

  return `현재 입력한 강점만으로는 ${targetJobLabel} 직무와의 연결을 충분히 판단하기 어렵습니다. 선택한 강점이 실제 경험에서 어떻게 드러났는지 구체적으로 보여주면 더 정확한 분석이 가능합니다.`;
}

export default buildNewgradAxis5Sentences;
