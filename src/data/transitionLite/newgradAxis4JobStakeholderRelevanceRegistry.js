import { resolveNewgradStakeholderDisplayLabel } from "./newgradStakeholderTaxonomyRegistry.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function uniqueKeys(items = []) {
  return [...new Set((Array.isArray(items) ? items : []).map((item) => toStr(item)).filter(Boolean))];
}

const DEFAULT_RELEVANCE = Object.freeze({
  primary: Object.freeze(["customer_user", "cross_function_partner", "manager_reviewer"]),
  secondary: Object.freeze(["internal_team", "external_partner_vendor", "field_practitioner_operator"]),
  tertiary: Object.freeze(["community_audience", "candidate_applicant", "learner_participant", "public_citizen", "executive_decision_maker"]),
  rationale: "대부분의 신입 직무는 외부 상대뿐 아니라 내부 협업 상대와의 직접 소통 경험을 함께 봅니다.",
});

export const NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE = Object.freeze({
  JOB_BUSINESS_SERVICE_PLANNING: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "서비스기획은 사용자 이해와 함께 개발·디자인·운영 등 타직무 협업 상대와의 조율 경험이 중요하다.",
  },
  JOB_MARKETING_CONTENT_MARKETING: {
    primary: ["customer_user", "external_partner_vendor", "community_audience"],
    secondary: ["cross_function_partner", "manager_reviewer"],
    tertiary: ["internal_team"],
    rationale: "콘텐츠 마케팅은 사용자 반응, 외부 제작·운영 파트너, 캠페인 실행 협업 상대와의 소통이 중요하다.",
  },
  JOB_MARKETING_PERFORMANCE_MARKETING: {
    primary: ["customer_user", "external_partner_vendor", "manager_reviewer"],
    secondary: ["cross_function_partner", "community_audience"],
    tertiary: ["internal_team"],
    rationale: "퍼포먼스 마케팅은 고객·사용자 데이터 해석과 매체·대행사·내부 의사결정자 커뮤니케이션이 중요하다.",
    stakeholderRoles: {
      customer_user: {
        label: "고객/사용자",
        role: "제품 반응, 구매 이유, 메시지 수용성을 파악해야 하는 상대",
        communicationContext: "선택 신호, 구매 데이터, 시장 피드백을 기반으로 제품/메시지 방향을 논의하는 접점",
      },
      external_partner_vendor: {
        label: "매체사/대행사",
        role: "캠페인 실행, 매체비 최적화, 기술 연계를 담당하는 협력사",
        communicationContext: "성과 목표, 매체 선택, 예산 배분, 크리에이티브 기준을 맞추는 접점",
      },
      manager_reviewer: {
        label: "관리자/의사결정자",
        role: "마케팅 성과와 예산 책임을 가진 상위 리더십",
        communicationContext: "주간/월간 성과, ROI 분석, 전략 방향 수정을 보고하고 검토받는 접점",
      },
      cross_function_partner: {
        label: "제품/기획/영업팀",
        role: "제품 강점, 출시 일정, 고객 접점 정보를 공유하는 내부 협업자",
        communicationContext: "제품 포지셔닝, 런칭 일정, 세일즈 피드백을 반영해 메시지를 조율하는 접점",
      },
    },
  },
  JOB_MARKETING_BRAND_MARKETING: {
    primary: ["customer_user", "external_partner_vendor", "community_audience"],
    secondary: ["cross_function_partner", "manager_reviewer"],
    tertiary: ["internal_team"],
    rationale: "브랜드 마케팅은 소비자 반응과 외부 파트너, 내부 협업 상대와의 메시지 조율이 중요하다.",
  },
  JOB_MARKETING_PRODUCT_MARKETING_PMM: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["external_partner_vendor"],
    tertiary: ["internal_team"],
    rationale: "상품마케팅은 제품의 시장 포지셔닝과 메시지 개발, 출시 전략과 세일즈 현장 연결 경험이 중요하다.",
    stakeholderRoles: {
      customer_user: {
        label: "고객/사용자",
        role: "제품 반응, 구매 이유, 사용 맥락, 메시지 수용성을 이해해야 하는 상대",
        communicationContext: "고객 반응과 시장 피드백을 바탕으로 제품의 가치 제안과 메시지 방향을 점검하는 접점"
      },
      cross_function_partner: {
        label: "제품/기획 협업자",
        role: "제품 강점, 기능, 출시 맥락, 우선순위를 함께 맞추는 내부 협업자",
        communicationContext: "제품의 핵심 가치와 타깃 고객을 이해하고, 시장에 전달할 기준을 조율하는 접점"
      },
      manager_reviewer: {
        label: "의사결정자/리뷰어",
        role: "출시 방향, 포지셔닝, 메시지 우선순위를 검토하는 상대",
        communicationContext: "제품을 어떤 시장과 고객에게 어떻게 설명할지 논리와 근거를 맞추는 접점"
      },
      external_partner_vendor: {
        label: "세일즈/고객 접점 조직",
        role: "판매 현장, 고객 문의, 도입 장벽, 경쟁 반응을 전달받는 상대",
        communicationContext: "현장에서 반복되는 고객 질문과 반응을 제품 메시지와 영업 자료에 반영하는 접점"
      }
    }
  },
  JOB_SALES_B2B_SALES: {
    primary: ["customer_user", "executive_decision_maker", "external_partner_vendor"],
    secondary: ["manager_reviewer", "field_practitioner_operator"],
    tertiary: ["internal_team"],
    rationale: "영업은 고객사 실무자와 의사결정자, 외부 파트너와의 직접 접점이 중요하다.",
  },
  JOB_HR_ORGANIZATION_RECRUITING: {
    primary: ["candidate_applicant", "manager_reviewer", "internal_team"],
    secondary: ["external_partner_vendor", "cross_function_partner"],
    tertiary: ["customer_user"],
    rationale: "채용은 지원자와 현업 담당자, 내부 조직과의 조율 경험이 핵심이다.",
  },
  JOB_PROCUREMENT_SCM_PURCHASING: {
    primary: ["external_partner_vendor", "cross_function_partner", "manager_reviewer"],
    secondary: ["field_practitioner_operator", "internal_team"],
    tertiary: ["customer_user"],
    rationale: "구매는 협력사 및 내부 현업과의 조율, 조건 협의, 커뮤니케이션이 중요하다.",
  },
  JOB_PROCUREMENT_SCM_SCM: {
    primary: ["cross_function_partner", "external_partner_vendor", "field_practitioner_operator"],
    secondary: ["internal_team", "manager_reviewer"],
    tertiary: ["customer_user"],
    rationale: "SCM은 공급망 파트너와 내부 운영 부서 간 조율이 중요하다.",
  },
  JOB_PROCUREMENT_SCM_LOGISTICS: {
    primary: ["cross_function_partner", "external_partner_vendor", "field_practitioner_operator"],
    secondary: ["internal_team", "manager_reviewer"],
    tertiary: ["customer_user"],
    rationale: "물류는 운송·협력사와 내부 운영 조율이 중요하다.",
  },
  JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "CS는 고객 응대뿐 아니라 내부 escalation 및 해결 조율이 중요하다.",
  },
  JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING: {
    primary: ["cross_function_partner", "internal_team", "manager_reviewer"],
    secondary: ["field_practitioner_operator", "customer_user"],
    tertiary: ["external_partner_vendor"],
    rationale: "운영기획은 내부 협업과 운영 조율이 핵심이다.",
  },
  JOB_BUSINESS_OPERATIONS_MANAGEMENT: {
    primary: ["cross_function_partner", "internal_team", "manager_reviewer"],
    secondary: ["field_practitioner_operator", "customer_user"],
    tertiary: ["external_partner_vendor"],
    rationale: "사업운영은 현업 부서와의 반복 조율과 운영 흐름을 맞추는 소통이 중요하다.",
  },
  JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
    primary: ["cross_function_partner", "manager_reviewer", "internal_team"],
    secondary: ["customer_user", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "데이터 분석은 내부 이해관계자의 요구 정리와 해석 전달이 중요하다.",
    stakeholderRoles: {
      cross_function_partner: {
        label: "현업/기획/마케팅팀",
        role: "분석 요청의 배경과 비즈니스 문제를 가진 상대",
        communicationContext: "분석 요청 배경을 이해하고, 분석 결과를 실무 액션으로 연결하는 접점",
      },
      manager_reviewer: {
        label: "관리자/의사결정자",
        role: "분석 결과의 의사결정 영향도를 판단해야 하는 리더십",
        communicationContext: "분석 결과의 신뢰성, 한계, 의사결정 함의를 설명하고 검토받는 접점",
      },
      internal_team: {
        label: "데이터/개발팀",
        role: "데이터 정의, 수집, 품질 기준을 함께 유지하는 협업자",
        communicationContext: "데이터 정의, 수집 방식, 정확성 검증, 분석 인프라를 맞추는 접점",
      },
      customer_user: {
        label: "외부 고객/사용자",
        role: "분석 결과가 반영될 최종 사용자",
        communicationContext: "사용자 행동, 반응, 피드백 데이터를 기반으로 사용 맥락을 이해하는 접점",
      },
    },
  },
  JOB_IT_DATA_DIGITAL_BACKEND_DEVELOPMENT: {
    primary: ["cross_function_partner", "manager_reviewer", "internal_team"],
    secondary: ["field_practitioner_operator"],
    tertiary: ["customer_user", "external_partner_vendor"],
    rationale: "백엔드 개발은 고객 직접 응대보다 내부 협업과 요구사항 조율 경험이 더 중요하다.",
  },
  JOB_DESIGN_UX_DESIGN: {
    primary: ["customer_user", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "field_practitioner_operator"],
    tertiary: ["external_partner_vendor"],
    rationale: "UX 디자인은 사용자 이해와 개발·기획 협업이 중요하다.",
  },
  JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT: {
    primary: ["cross_function_partner", "manager_reviewer", "field_practitioner_operator"],
    secondary: ["internal_team"],
    tertiary: ["customer_user", "external_partner_vendor"],
    rationale: "R&D는 내부 연구 협업과 검토·보고·실험 조율 경험이 중요하다.",
  },
  JOB_EDUCATION_COUNSELING_COACHING_LEARNING_DESIGN: {
    primary: ["learner_participant", "manager_reviewer", "internal_team"],
    secondary: ["community_audience", "cross_function_partner"],
    tertiary: ["customer_user"],
    rationale: "교육기획은 학습자와 내부 운영·검토자, 프로그램 참여자와의 소통이 중요하다.",
  },
  JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS: {
    primary: ["public_citizen", "cross_function_partner", "manager_reviewer"],
    secondary: ["community_audience", "internal_team"],
    tertiary: ["customer_user", "external_partner_vendor"],
    rationale: "공공 프로그램 운영은 시민·참여자와 내부 협업, 공공 맥락 조율이 중요하다.",
  },
  JOB_FINANCE_ACCOUNTING_ACCOUNTING: {
    primary: ["internal_team", "manager_reviewer", "external_partner_vendor"],
    secondary: ["cross_function_partner"],
    tertiary: ["customer_user"],
    rationale: "회계/재무는 정확한 자료 관리와 내부 부서 및 외부 감사자와의 기준 맞추기가 중요하다.",
    stakeholderRoles: {
      internal_team: {
        label: "내부 부서",
        role: "비용, 매출, 예산, 증빙 자료가 필요한 사업 담당자",
        communicationContext: "거래 기록, 증빙 요청, 예산 집행 내역, 정산 정보를 정확히 맞추는 접점",
      },
      manager_reviewer: {
        label: "관리자/경영진",
        role: "재정 상황의 의사결정 영향도를 판단해야 하는 리더십",
        communicationContext: "월별/분기별 재정 보고, 리스크 분석, 의사결정 필요 정보를 설명하는 접점",
      },
      external_partner_vendor: {
        label: "세무/감사/금융 기관",
        role: "회계 기준과 규제 준수를 검토하는 외부 전문가",
        communicationContext: "회계 기준 준수, 세무 신고 자료, 감사 증빙, 컴플라이언스를 맞추는 접점",
      },
      cross_function_partner: {
        label: "영업/구매/운영팀",
        role: "거래, 비용, 정산 정보의 정확성이 중요한 협업자",
        communicationContext: "인보이스, 거래 조건, 비용 분류, 대금 정산 기준을 정확히 조율하는 접점",
      },
    },
  },
  JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT: {
    primary: ["field_practitioner_operator", "cross_function_partner", "manager_reviewer"],
    secondary: ["internal_team", "external_partner_vendor"],
    tertiary: ["customer_user"],
    rationale: "생산관리는 현장 운영, 타직무 조율, 협력사 관리를 통해 목표 달성을 주도하는 역할이 중요하다.",
    stakeholderRoles: {
      field_practitioner_operator: {
        label: "생산 현장",
        role: "일일 생산 일정, 물량, 설비 상황을 관리하는 운영 담당자",
        communicationContext: "생산 계획, 자재 공급, 공정 흐름, 품질 문제를 즉시 대응하는 접점",
      },
      cross_function_partner: {
        label: "품질/자재/구매팀",
        role: "불량 이슈, 자재 수급, 납기를 함께 해결하는 협업자",
        communicationContext: "불량 원인 분석, 자재 부족 대응, 납기 조정, 공정 개선을 함께 추진하는 접점",
      },
      manager_reviewer: {
        label: "관리자/생산 리더",
        role: "생산 목표 달성, KPI 관리의 책임을 가진 상위 리더십",
        communicationContext: "주간/월간 생산 현황, 병목 분석, 목표 달성 전략을 보고하는 접점",
      },
      external_partner_vendor: {
        label: "협력사/외주사",
        role: "외주 제품의 납기, 품질, 가격을 담당하는 협력 파트너",
        communicationContext: "납기 일정, 품질 기준, 수량 변동, 문제 대응을 맞추는 접점",
      },
    },
  },
  JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: {
    primary: ["cross_function_partner", "field_practitioner_operator", "manager_reviewer"],
    secondary: ["internal_team", "external_partner_vendor"],
    tertiary: ["customer_user"],
    rationale: "품질보증/QA는 품질 기준 수립, 검증 결과 분석, 협업자와의 기준 조율이 중요하다.",
    stakeholderRoles: {
      cross_function_partner: {
        label: "생산/개발팀",
        role: "제품 설계, 공정, 생산 과정에서 품질 기준을 함께 정의하는 협업자",
        communicationContext: "품질 기준 정의, 검증 방법, 불량 기준, 승인 프로세스를 맞추는 접점",
      },
      field_practitioner_operator: {
        label: "생산 현장",
        role: "제품 생산 과정에서 품질을 유지해야 하는 운영 담당자",
        communicationContext: "검사 방법, 불량 분류, 재작업 기준, 현장 개선을 함께 확인하는 접점",
      },
      manager_reviewer: {
        label: "관리자/품질 리더",
        role: "품질 목표 달성, 품질 시스템 운영의 책임을 가진 리더십",
        communicationContext: "월별 품질 보고, 불량률 추세, 개선 활동 진행률을 보고하는 접점",
      },
      external_partner_vendor: {
        label: "공급사/고객",
        role: "외부 납품 부품의 품질 또는 최종 고객의 품질 요구사항을 갖는 상대",
        communicationContext: "입수 검사 기준, 공급사 품질 관리, 고객 품질 이슈를 함께 해결하는 접점",
      },
    },
  },
});

export function getAxis4StakeholderRelevanceByJobId(targetJobId) {
  const normalizedJobId = toStr(targetJobId);
  const entry = NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE[normalizedJobId] || DEFAULT_RELEVANCE;
  const primary = uniqueKeys(entry.primary);
  const secondary = uniqueKeys(entry.secondary).filter((key) => !primary.includes(key));
  const tertiary = uniqueKeys(entry.tertiary).filter((key) => !primary.includes(key) && !secondary.includes(key));

  return {
    jobId: normalizedJobId,
    primary,
    secondary,
    tertiary,
    rationale: toStr(entry.rationale || DEFAULT_RELEVANCE.rationale),
    primaryLabels: primary.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    secondaryLabels: secondary.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
    tertiaryLabels: tertiary.map((key) => resolveNewgradStakeholderDisplayLabel(key)),
  };
}

export function getDefaultAxis4StakeholderRelevance() {
  return getAxis4StakeholderRelevanceByJobId("");
}
