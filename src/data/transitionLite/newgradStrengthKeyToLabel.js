/**
 * Strength input key → User-facing Korean label 매핑
 *
 * 역할: 내부 canonical key를 사용자에게 보여줄 자연어 표현으로 변환
 */

export const STRENGTH_KEY_TO_LABEL = {
  analytical_thinking: "분석력",
  attention_to_detail: "꼼꼼함",
  execution_speed: "빠른 실행",
  ownership: "책임감",
  communication: "소통",
  persuasion: "설득",
  empathy: "공감",
  problem_solving: "문제해결",
  creativity: "창의",
  collaboration_orientation: "협업",
  initiative: "주도성",
  learning_agility: "학습력",
  prioritization: "우선순위",
  adaptability: "적응력",
  diligence: "성실함",
};

export function getStrengthLabel(strengthKey) {
  return STRENGTH_KEY_TO_LABEL[strengthKey] || null;
}

export function getStrengthLabels(strengthKeys = []) {
  return strengthKeys
    .map((key) => STRENGTH_KEY_TO_LABEL[key])
    .filter(Boolean);
}

export default {
  STRENGTH_KEY_TO_LABEL,
  getStrengthLabel,
  getStrengthLabels,
};
