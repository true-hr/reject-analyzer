/**
 * 14개 대분류 coreActions 매핑
 *
 * 역할: 14개 대분류별 핵심 행동을 정의하고, targetJobId 해석 시 활용
 * 설계 참고: docs/product/newgrad-category-core-actions-design.md
 */

export const JOB_CATEGORIES = {
  BUSINESS: {
    id: "BUSINESS",
    label: "경영·비즈니스",
    coreActions: [
      "시장·산업·경쟁 분석",
      "사업 방향·로드맵 설정",
      "연간/분기 목표 수립 및 조율",
      "사업 성과 모니터링 및 수정",
      "신사업 기회 발굴·타당성 검토",
      "이해관계자(사업부/임원) 의견 조율",
    ],
  },
  SALES: {
    id: "SALES",
    label: "영업",
    coreActions: [
      "목표 고객 식별 및 신뢰 구축",
      "고객 상황에 맞게 가치 설명 및 설득",
      "제안·계약 구조 협상",
      "긴 판매 주기 관리 및 미팅 진행",
      "고객 피드백 수집 및 전달",
      "판매 목표 달성 추진",
    ],
  },
  MARKETING: {
    id: "MARKETING",
    label: "마케팅",
    coreActions: [
      "고객 반응·시장 인사이트 분석",
      "마케팅 메시지·전략 수립",
      "캠페인 목표와 운영안 설계",
      "채널별 콘텐츠·매체 운영 및 집행",
      "성과 지표 추적 및 최적화",
      "크리에이티브·운영팀과 조율",
    ],
  },
  CUSTOMER_OPERATIONS: {
    id: "CUSTOMER_OPERATIONS",
    label: "고객·운영",
    coreActions: [
      "고객 문의·이슈 빠르게 해결",
      "고객 만족도 및 문제 패턴 분석",
      "고객 경험·여정 설계",
      "운영 프로세스 정의 및 품질 관리",
      "채널별 대응 운영 및 조율",
      "고객 피드백 수집 및 상품팀 전달",
    ],
  },
  HR_ORGANIZATION: {
    id: "HR_ORGANIZATION",
    label: "인사·조직",
    coreActions: [
      "채용 계획 수립 및 인재 영입",
      "인력 수급 계획 및 전략과 연동",
      "보상·복리 체계 설계 및 관리",
      "조직 구조·문화 개선 기획",
      "임직원 교육 니즈 파악 및 학습 기획",
      "관리자 지원 및 변화 관리",
    ],
  },
  FINANCE_ACCOUNTING: {
    id: "FINANCE_ACCOUNTING",
    label: "재무·회계",
    coreActions: [
      "재무 데이터 정확하게 기록·보고",
      "자금 흐름 및 예산 추적·관리",
      "사업 성과를 재무 지표로 분석",
      "회계·세법 기준 준수",
      "중기 재무 계획 수립",
      "내부 통제·감시",
    ],
  },
  PROCUREMENT_SCM: {
    id: "PROCUREMENT_SCM",
    label: "구매·조달·SCM",
    coreActions: [
      "공급업체 발굴·평가·협상",
      "구매 예산·실적 관리 및 비용 절감",
      "공급망 수급 밸런스 및 리스크 관리",
      "수요·재고 계획 수립",
      "조달·물류 프로세스 표준화 및 개선",
      "공급업체 성과 모니터링",
    ],
  },
  MANUFACTURING_QUALITY_PRODUCTION: {
    id: "MANUFACTURING_QUALITY_PRODUCTION",
    label: "생산·품질·제조",
    coreActions: [
      "생산 일정·라인 가동 관리",
      "생산 원가·효율 추적 및 개선",
      "제품 불량 감지·분석·개선",
      "공정 표준·품질 기준 수립",
      "생산 문제 대응 및 재발 방지",
      "공정 개선 과제 기획·추진",
    ],
  },
  ENGINEERING_DEVELOPMENT: {
    id: "ENGINEERING_DEVELOPMENT",
    label: "엔지니어링·개발",
    coreActions: [
      "고객·사용자 요구 분석 및 사양 정의",
      "기술·표준에 맞게 설계 수행",
      "시제품 제작·테스트·개선 반복",
      "설계 검토·검증 프로세스 진행",
      "설계·개발 결과물 문서화",
      "부처 간 기술 이슈 조율",
    ],
  },
  IT_DATA_DIGITAL: {
    id: "IT_DATA_DIGITAL",
    label: "IT·데이터·디지털",
    coreActions: [
      "요구사항 분석 및 기술 사양 정의",
      "코드 설계·구현·리뷰·배포",
      "버그·성능 문제 진단·해결",
      "데이터 수집·정리·분석",
      "시스템 인프라·운영 체계 구축",
      "기술 스택 선택 및 도구 통합",
    ],
  },
  DESIGN: {
    id: "DESIGN",
    label: "디자인",
    coreActions: [
      "사용자 니즈 분석 및 디자인 방향 수립",
      "와이어프레임·프로토타입 제작 및 반복 개선",
      "브랜드·시각 아이덴티티 표현",
      "디자인 시스템·패턴 정의 및 유지",
      "사용자 테스트·피드백 수집 및 반영",
      "개발·마케팅 팀과 디자인 조율",
    ],
  },
  RESEARCH_PROFESSIONAL: {
    id: "RESEARCH_PROFESSIONAL",
    label: "연구·전문직",
    coreActions: [
      "연구 주제 설정 및 가설 수립",
      "데이터 수집·분석·해석",
      "연구 결과 학술적 형식으로 작성",
      "산업 문제 분석 및 솔루션 제시",
      "법률·규제 이슈 분석·자문",
      "동료 검토·학술 리뷰 수행",
    ],
  },
  EDUCATION_COUNSELING_COACHING: {
    id: "EDUCATION_COUNSELING_COACHING",
    label: "교육·상담·코칭",
    coreActions: [
      "학습자 니즈 진단",
      "교육 목표·커리큘럼 설계",
      "강의·세션 진행 및 상호작용 관리",
      "학습 성과 평가 및 피드백",
      "개인 상담·진로 코칭",
      "학습 자료·도구 개발",
    ],
  },
  PUBLIC_ADMINISTRATION_SUPPORT: {
    id: "PUBLIC_ADMINISTRATION_SUPPORT",
    label: "공공·행정·지원",
    coreActions: [
      "정책 목표 및 실행 계획 수립",
      "법규·규제 해석 및 준수 체계 구축",
      "조직 운영 및 의사결정 프로세스 관리",
      "이해관계자·민원인 소통 및 관계 관리",
      "보고·공시 체계 운영",
      "조직 간 조율 및 협력",
    ],
  },
};

export function getCategoryByCategoryKey(categoryKey) {
  if (!categoryKey) return null;
  return JOB_CATEGORIES[categoryKey] || null;
}

export function getCategoryLabel(categoryKey) {
  const category = getCategoryByCategoryKey(categoryKey);
  return category ? category.label : null;
}

export function getCategoryActions(categoryKey) {
  const category = getCategoryByCategoryKey(categoryKey);
  return category ? category.coreActions : [];
}

export default {
  JOB_CATEGORIES,
  getCategoryByCategoryKey,
  getCategoryLabel,
  getCategoryActions,
};
