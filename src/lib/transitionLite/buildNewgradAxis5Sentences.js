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
 * - 판정형 문장
 */
export function buildNewgradAxis5Sentences({
  canonicalStrengthKeys = [],
  canonicalWorkStyleKeys = [],
  targetJobLabel = "",
  categoryKey = "",
}) {
  if (!targetJobLabel || !categoryKey) {
    return null;
  }

  const strengthLabels = getStrengthLabels(canonicalStrengthKeys);
  const strengthGroups = getStrengthGroups(canonicalStrengthKeys);
  const workStyleGroups = getWorkStyleGroups(canonicalWorkStyleKeys);

  const categoryLabel = getCategoryLabel(categoryKey);
  const coreActions = getCategoryActions(categoryKey);

  if (!categoryLabel || coreActions.length === 0) {
    return null;
  }

  // 판정 텍스트 생성 (약한 / 일부 보이는 / 비교적 연결되는)
  const fitJudgmentText = determineFitJudgment(
    strengthGroups,
    workStyleGroups
  );

  // 강점 레이블 문자열
  const selectedStrengthLabels = strengthLabels.join(", ");

  // 강점이 없으면 null 반환 (빈 선택)
  if (!selectedStrengthLabels) {
    return null;
  }

  // coreActions 중 처음 3개 선택
  const selectedCoreActions = coreActions.slice(0, 3).join(", ");

  // 강점 그룹별 행동 제안
  const groupSpecificAction = generateGroupSpecificAction(
    strengthGroups,
    categoryLabel
  );

  // 최종 문장 조합
  const sentence = `현재 입력한 강점만 보면 ${targetJobLabel} 직무와의 연결은 아직 ${fitJudgmentText} 편입니다. ${selectedStrengthLabels} 같은 강점은 기본 태도 신호로는 좋지만, ${categoryLabel}에서 중요한 ${selectedCoreActions} 같은 행동까지 직접 보여주지는 못합니다. 이 강점이 더 강하게 읽히려면, 실제 경험 안에서 ${groupSpecificAction}으로 드러난 장면이 있었는지 함께 떠올려보는 것이 좋습니다.`;

  return sentence;
}

/**
 * 강점과 일하는 방식의 조합으로 판정 텍스트 결정
 */
function determineFitJudgment(strengthGroups = [], workStyleGroups = []) {
  const hasStrongSignal = strengthGroups.length >= 2 || workStyleGroups.length >= 1;

  if (hasStrongSignal) {
    return "비교적 연결되는";
  }
  if (strengthGroups.length === 1) {
    return "일부 보이는";
  }
  return "약한";
}

/**
 * 강점 그룹을 기반으로 행동 제안 생성
 */
function generateGroupSpecificAction(
  strengthGroups = [],
  categoryLabel = ""
) {
  if (strengthGroups.length === 0) {
    return "실제 현장 경험";
  }

  const firstGroup = strengthGroups[0];

  const actionMap = {
    ANALYTICAL_PROBLEM_SOLVER: `${categoryLabel}의 데이터 분석과 문제 해결`,
    PRECISION_QUALITY_FOCUSED: `${categoryLabel}의 품질 기준 설정과 일관된 적용`,
    EXECUTION_RESPONSIBILITY: `${categoryLabel}의 목표 설정과 책임 있는 달성`,
    PRIORITIZATION_JUDGMENT: `${categoryLabel}의 우선순위 판단과 의사결정`,
    COMMUNICATION_PERSUASION: `${categoryLabel}의 이해관계자 설득과 의견 조율`,
    EMPATHY_COLLABORATION: `${categoryLabel}에서의 팀 협력과 함께 문제 해결`,
    CREATIVITY_LEARNING_ADAPTABLE: `${categoryLabel}에서의 새로운 시도와 빠른 학습`,
  };

  return actionMap[firstGroup.id] || `${categoryLabel}의 핵심 행동 수행`;
}

export default buildNewgradAxis5Sentences;
