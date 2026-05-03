/**
 * Job-specific Axis1 detail reading actions
 *
 * 직무별 세부 행동 언어로 generic한 detail reading을 방지합니다.
 * 각 직무(subVertical)별로 foundationActions, missingActions, nextEvidenceActions를 정의합니다.
 *
 * 역할: buildNewgradAxis1CanonicalReading에서 job-specific detail reading 생성 시 활용
 * 설계 참고: docs/product/newgrad-axis1-detail-reading-contract.md
 */

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeSubVertical(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "_");
}

const JOB_SPECIFIC_AXIS1_ACTIONS = Object.freeze({
  BACKEND_DEVELOPMENT: Object.freeze({
    foundationActions: [
      "서버 로직 구현",
      "데이터베이스 활용",
      "API 설계",
      "오류 수정",
    ],
    missingActions: [
      "실제 서비스 환경에서 서버 구조를 설계했는지",
      "데이터 흐름을 안정적으로 다뤘는지",
      "기능 간 통신 구조를 구현했는지",
    ],
    nextEvidenceActions: [
      "서버 로직 구현",
      "데이터베이스 활용",
      "API 설계",
      "오류 수정",
    ],
  }),

  FRONTEND_DEVELOPMENT: Object.freeze({
    foundationActions: [
      "화면 구조 구현",
      "사용자 흐름 반영",
      "컴포넌트 설계",
      "인터랙션 오류 수정",
    ],
    missingActions: [
      "화면을 실제 동작하는 구조로 구현했는지",
      "사용자 흐름에 맞게 상태와 이벤트를 다뤘는지",
      "UI 오류를 수정했는지",
    ],
    nextEvidenceActions: [
      "화면 컴포넌트 구현",
      "사용자 입력 처리",
      "페이지 흐름 설계",
      "반응형 화면 수정",
    ],
  }),

  DATA_ANALYSIS: Object.freeze({
    foundationActions: [
      "데이터 정리",
      "지표 해석",
      "패턴 비교",
      "분석 결과 설명",
    ],
    missingActions: [
      "실제 데이터를 정리했는지",
      "지표를 비교해 의미를 해석했는지",
      "분석 결과를 의사결정 기준으로 설명했는지",
    ],
    nextEvidenceActions: [
      "데이터 전처리",
      "지표 비교",
      "시각화",
      "분석 결과 요약",
    ],
  }),

  AI_ML_ENGINEERING: Object.freeze({
    foundationActions: [
      "데이터 전처리",
      "모델 학습",
      "성능 평가",
      "예측 결과 해석",
    ],
    missingActions: [
      "학습 데이터를 구성했는지",
      "모델 성능을 비교했는지",
      "예측 결과의 한계를 해석했는지",
    ],
    nextEvidenceActions: [
      "모델 학습 실험",
      "성능 지표 비교",
      "데이터 전처리",
      "예측 결과 분석",
    ],
  }),
});

const NORMALIZED_SUBVERTICAL_TO_ID = Object.freeze(
  Object.entries(JOB_SPECIFIC_AXIS1_ACTIONS).reduce((acc, [subVerticalId]) => {
    const normalizedKey = normalizeSubVertical(subVerticalId);
    if (normalizedKey) acc[normalizedKey] = subVerticalId;
    return acc;
  }, {})
);

export function getJobSpecificAxis1Actions(targetJobIdOrSubVertical = "") {
  if (!targetJobIdOrSubVertical) return null;

  // subVertical 추출: JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT → BACKEND_DEVELOPMENT
  const candidateKey = toStr(targetJobIdOrSubVertical);
  const isJobId = candidateKey.startsWith("JOB_");

  let subVertical = candidateKey;
  if (isJobId) {
    // JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT → BACKEND_DEVELOPMENT 추출
    const parts = candidateKey.split("_");
    if (parts.length > 3) {
      subVertical = parts.slice(4).join("_");
    }
  }

  const normalizedKey = normalizeSubVertical(subVertical);
  const actionsId = NORMALIZED_SUBVERTICAL_TO_ID[normalizedKey];

  if (actionsId) {
    return {
      subVertical: actionsId,
      ...JOB_SPECIFIC_AXIS1_ACTIONS[actionsId],
    };
  }

  return null;
}

export function hasJobSpecificAxis1Actions(targetJobIdOrSubVertical = "") {
  return getJobSpecificAxis1Actions(targetJobIdOrSubVertical) !== null;
}

export default {
  JOB_SPECIFIC_AXIS1_ACTIONS,
  getJobSpecificAxis1Actions,
  hasJobSpecificAxis1Actions,
};
