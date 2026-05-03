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

  // Batch 1-B: 기획·마케팅·HR 계열

  SERVICE_PLANNING: Object.freeze({
    foundationActions: [
      "사용자 문제 구조화",
      "요구사항 정리",
      "기능 우선순위 판단",
      "서비스 흐름 설계",
    ],
    missingActions: [
      "실제 사용자 문제를 정의했는지",
      "기능 요구사항을 구조화했는지",
      "화면이나 서비스 흐름을 설계했는지",
    ],
    nextEvidenceActions: [
      "사용자 문제 정의",
      "요구사항 정리",
      "화면 흐름 설계",
      "기능 개선안 작성",
    ],
    preferJobSpecificText: true,
  }),

  PRODUCT_MANAGEMENT: Object.freeze({
    foundationActions: [
      "제품 문제 정의",
      "우선순위 판단",
      "지표 기반 의사결정",
      "이해관계자 요구 조율",
    ],
    missingActions: [
      "제품 목표를 기준으로 문제를 정의했는지",
      "지표나 사용자 반응을 보고 우선순위를 판단했는지",
      "여러 이해관계자의 요구를 조율했는지",
    ],
    nextEvidenceActions: [
      "제품 문제 정의",
      "기능 우선순위 판단",
      "지표 변화 해석",
      "이해관계자 요구 정리",
    ],
    preferJobSpecificText: true,
  }),

  PERFORMANCE_MARKETING: Object.freeze({
    foundationActions: [
      "고객 반응 해석",
      "캠페인 지표 비교",
      "메시지 개선",
      "전환 흐름 분석",
    ],
    missingActions: [
      "실제 광고 지표를 분석했는지",
      "소재별 성과를 비교했는지",
      "전환 개선을 위한 실험을 해봤는지",
    ],
    nextEvidenceActions: [
      "광고 지표 분석",
      "소재별 성과 비교",
      "전환율 변화 해석",
      "캠페인 개선안 작성",
    ],
    preferJobSpecificText: true,
  }),

  CONTENT_MARKETING: Object.freeze({
    foundationActions: [
      "고객 관심사 해석",
      "콘텐츠 주제 기획",
      "메시지 구조화",
      "반응 데이터 확인",
    ],
    missingActions: [
      "고객 관심사를 바탕으로 콘텐츠 주제를 잡았는지",
      "메시지를 목적에 맞게 구조화했는지",
      "조회수나 반응 데이터를 보고 개선했는지",
    ],
    nextEvidenceActions: [
      "콘텐츠 주제 기획",
      "메시지 구조 작성",
      "반응 데이터 확인",
      "콘텐츠 개선안 작성",
    ],
    preferJobSpecificText: true,
  }),

  BRAND_MARKETING: Object.freeze({
    foundationActions: [
      "브랜드 메시지 설계",
      "고객 인식 해석",
      "캠페인 방향 설정",
      "시장 포지션 비교",
    ],
    missingActions: [
      "브랜드 메시지를 구체화했는지",
      "고객 인식이나 시장 반응을 해석했는지",
      "캠페인 방향을 잡아본 적이 있는지",
    ],
    nextEvidenceActions: [
      "브랜드 메시지 정리",
      "고객 인식 조사",
      "경쟁 브랜드 비교",
      "캠페인 방향 제안",
    ],
    preferJobSpecificText: true,
  }),

  PRODUCT_MARKETING_PMM: Object.freeze({
    foundationActions: [
      "시장 구조와 경쟁 환경 이해",
      "고객 세그먼트와 니즈 파악",
      "제품 메시지와 포지셔닝 설계",
      "출시 전략 및 GTM 계획",
    ],
    missingActions: [
      "실제 시장 조사와 경쟁사 분석을 통해 포지셔닝 기준을 잡았는지",
      "고객 세그먼트별로 메시지를 달리 설계하고 검증했는지",
      "출시 후 매출, 전환율, 성과 지표를 분석하고 개선했는지",
    ],
    nextEvidenceActions: [
      "시장 조사 및 경쟁사 분석",
      "고객 세그먼트 구분",
      "제품 메시지 작성",
      "출시 캠페인 및 GTM 기획",
    ],
    preferJobSpecificText: true,
  }),

  RECRUITING: Object.freeze({
    foundationActions: [
      "인재 요건 정리",
      "후보자 정보 비교",
      "조직 요구 파악",
      "커뮤니케이션 조율",
    ],
    missingActions: [
      "직무별 인재 요건을 정리했는지",
      "후보자 정보를 기준에 맞게 비교했는지",
      "현업 요구를 이해하고 조율했는지",
    ],
    nextEvidenceActions: [
      "직무 요건 정리",
      "후보자 비교 기준 작성",
      "인터뷰 질문 설계",
      "현업 요구사항 정리",
    ],
    preferJobSpecificText: true,
  }),

  LEARNING_OD: Object.freeze({
    foundationActions: [
      "교육 요구 파악",
      "학습 목표 정리",
      "프로그램 구조화",
      "참여 반응 확인",
    ],
    missingActions: [
      "구성원의 교육 요구를 파악했는지",
      "학습 목표를 기준으로 프로그램을 구성했는지",
      "교육 후 반응이나 변화를 확인했는지",
    ],
    nextEvidenceActions: [
      "교육 요구 조사",
      "학습 목표 작성",
      "교육 프로그램 구성",
      "참여자 반응 정리",
    ],
    preferJobSpecificText: true,
  }),

  HR_OPS: Object.freeze({
    foundationActions: [
      "조직 이슈 파악",
      "제도 기준 정리",
      "구성원 커뮤니케이션",
      "운영 절차 개선",
    ],
    missingActions: [
      "조직 이슈를 기준에 맞게 정리했는지",
      "인사 제도나 운영 절차를 이해했는지",
      "구성원과의 커뮤니케이션을 조율했는지",
    ],
    nextEvidenceActions: [
      "조직 이슈 정리",
      "제도 운영 기준 파악",
      "구성원 문의 대응",
      "운영 프로세스 개선안 작성",
    ],
    preferJobSpecificText: true,
  }),

  // Batch 1-C: 회계·세무·재무·SCM·생산·품질 계열

  ACCOUNTING: Object.freeze({
    foundationActions: [
      "거래 구조 이해",
      "회계 기준 적용",
      "재무 자료 정리",
      "계정과목 판단",
    ],
    missingActions: [
      "실제 거래를 분개했는지",
      "계정과목을 판단했는지",
      "재무제표 흐름을 검토했는지",
    ],
    nextEvidenceActions: [
      "분개 처리",
      "재무제표 작성",
      "계정과목 판단",
      "회계 기준 적용",
    ],
    preferJobSpecificText: true,
  }),

  TAX: Object.freeze({
    foundationActions: [
      "세법 기준 이해",
      "과세 요건 판단",
      "신고 자료 정리",
      "세무 리스크 확인",
    ],
    missingActions: [
      "세법 기준에 따라 과세 여부를 판단했는지",
      "신고 자료를 정리했는지",
      "거래별 세무 이슈를 검토했는지",
    ],
    nextEvidenceActions: [
      "세법 조항 해석",
      "부가세/법인세 자료 정리",
      "신고서 항목 검토",
      "세무 이슈 비교",
    ],
    preferJobSpecificText: true,
  }),

  FINANCE: Object.freeze({
    foundationActions: [
      "자금 흐름 이해",
      "재무 지표 해석",
      "투자 판단 기준 정리",
      "비용 구조 분석",
    ],
    missingActions: [
      "현금흐름을 기준으로 재무 상태를 해석했는지",
      "투자나 비용 판단 기준을 정리했는지",
      "재무 지표의 변화를 비교했는지",
    ],
    nextEvidenceActions: [
      "현금흐름표 해석",
      "재무비율 비교",
      "투자안 분석",
      "비용 구조 정리",
    ],
    preferJobSpecificText: true,
  }),

  FP_AND_A: Object.freeze({
    foundationActions: [
      "사업 지표 해석",
      "예산 흐름 분석",
      "실적 차이 비교",
      "의사결정 자료 정리",
    ],
    missingActions: [
      "예산과 실적의 차이를 비교했는지",
      "사업 지표를 기준으로 원인을 해석했는지",
      "의사결정용 분석 자료를 정리했는지",
    ],
    nextEvidenceActions: [
      "예산 대비 실적 분석",
      "매출/비용 지표 비교",
      "원인 분석 자료 작성",
      "경영 보고서 구조화",
    ],
    preferJobSpecificText: true,
  }),

  PROCUREMENT: Object.freeze({
    foundationActions: [
      "구매 조건 비교",
      "공급사 정보 정리",
      "원가 구조 이해",
      "계약 기준 검토",
    ],
    missingActions: [
      "공급사별 조건을 비교했는지",
      "가격과 품질, 납기 기준을 함께 검토했는지",
      "구매 의사결정 기준을 정리했는지",
    ],
    nextEvidenceActions: [
      "공급사 비교표 작성",
      "견적 조건 비교",
      "원가 요소 정리",
      "계약 조건 검토",
    ],
    preferJobSpecificText: true,
  }),

  SCM: Object.freeze({
    foundationActions: [
      "수요와 공급 흐름 이해",
      "재고 흐름 분석",
      "물류 과정 정리",
      "운영 병목 파악",
    ],
    missingActions: [
      "수요와 공급의 흐름을 비교했는지",
      "재고나 물류 데이터를 정리했는지",
      "운영 과정의 병목을 파악했는지",
    ],
    nextEvidenceActions: [
      "재고 흐름 분석",
      "물류 프로세스 정리",
      "수요 예측 비교",
      "운영 병목 개선안 작성",
    ],
    preferJobSpecificText: true,
  }),

  PRODUCTION_MANAGEMENT: Object.freeze({
    foundationActions: [
      "생산 계획 이해",
      "공정 흐름 정리",
      "일정과 물량 조율",
      "운영 효율 확인",
    ],
    missingActions: [
      "생산 일정과 물량을 기준으로 계획을 세웠는지",
      "공정 흐름을 단계별로 정리했는지",
      "생산 과정의 지연이나 병목을 확인했는지",
    ],
    nextEvidenceActions: [
      "생산 계획표 작성",
      "공정 흐름 분석",
      "작업 일정 조율",
      "병목 원인 정리",
    ],
    preferJobSpecificText: true,
  }),

  QUALITY_ASSURANCE_QA: Object.freeze({
    foundationActions: [
      "품질 기준 이해",
      "불량 원인 분석",
      "검사 항목 정리",
      "개선 조치 확인",
    ],
    missingActions: [
      "품질 기준에 따라 문제를 분류했는지",
      "불량 원인을 비교했는지",
      "검사 결과를 바탕으로 개선 조치를 정리했는지",
    ],
    nextEvidenceActions: [
      "품질 검사 기준 정리",
      "불량 유형 분석",
      "원인별 개선안 작성",
      "검사 결과 보고서 작성",
    ],
    preferJobSpecificText: true,
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
  //                   JOB_BUSINESS_SERVICE_PLANNING → SERVICE_PLANNING
  //                   JOB_MARKETING_CONTENT_MARKETING → CONTENT_MARKETING
  //                   JOB_HR_ORGANIZATION_RECRUITING → RECRUITING
  const candidateKey = toStr(targetJobIdOrSubVertical);
  const isJobId = candidateKey.startsWith("JOB_");

  let subVertical = candidateKey;
  if (isJobId) {
    const parts = candidateKey.split("_");
    // For IT_DATA_DIGITAL jobs: JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT (6+ parts) → parts.slice(4)
    // For HR_ORGANIZATION jobs: JOB_HR_ORGANIZATION_RECRUITING (4 parts) → parts.slice(3)
    // For FINANCE_ACCOUNTING jobs: JOB_FINANCE_ACCOUNTING_ACCOUNTING (4 parts) → parts.slice(3)
    // For PROCUREMENT_SCM jobs: JOB_PROCUREMENT_SCM_PROCUREMENT (4 parts) → parts.slice(3)
    // For MANUFACTURING_QUALITY_PRODUCTION jobs: JOB_MANUFACTURING_QUALITY_PRODUCTION_QA (5 parts) → parts.slice(4)
    // For other jobs: JOB_BUSINESS_SERVICE_PLANNING (4 parts) → parts.slice(2)
    if (parts[1] === "IT" && parts[2] === "DATA" && parts[3] === "DIGITAL") {
      // IT/DATA category: skip JOB, IT, DATA, DIGITAL
      if (parts.length > 4) {
        subVertical = parts.slice(4).join("_");
      }
    } else if (parts[1] === "HR" && parts[2] === "ORGANIZATION") {
      // HR_ORGANIZATION category: skip JOB, HR, ORGANIZATION
      if (parts.length > 3) {
        subVertical = parts.slice(3).join("_");
      }
    } else if (parts[1] === "FINANCE" && parts[2] === "ACCOUNTING") {
      // FINANCE_ACCOUNTING category: skip JOB, FINANCE, ACCOUNTING
      if (parts.length > 3) {
        subVertical = parts.slice(3).join("_");
      }
    } else if (parts[1] === "PROCUREMENT" && parts[2] === "SCM") {
      // PROCUREMENT_SCM category: skip JOB, PROCUREMENT, SCM
      if (parts.length > 3) {
        subVertical = parts.slice(3).join("_");
      }
    } else if (parts[1] === "MANUFACTURING" && parts[2] === "QUALITY" && parts[3] === "PRODUCTION") {
      // MANUFACTURING_QUALITY_PRODUCTION category: skip JOB, MANUFACTURING, QUALITY, PRODUCTION
      if (parts.length > 4) {
        subVertical = parts.slice(4).join("_");
      }
    } else {
      // Other categories: skip JOB and category name
      if (parts.length > 2) {
        subVertical = parts.slice(2).join("_");
      }
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
