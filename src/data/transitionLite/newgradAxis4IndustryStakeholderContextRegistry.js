// Axis4 Industry-Specific Stakeholder Context Registry
// Purpose: Provide conservative, industry-specific stakeholder communication context for Axis4 evaluation
// Note: This registry is Axis4-only (interaction fit). Do NOT mix with Axis2 (industry understanding).

export const AXIS4_INDUSTRY_STAKEHOLDER_CONTEXT = Object.freeze({
  banking_financial_services: {
    label: "금융 / 은행",
    stakeholderSummary:
      "금융기관 내에서는 리스크·규제·상품·운영 관련 조직이 모두 수직적 의사결정 구조를 가지므로, 각 조직과의 기준 맞춤이 업무 핵심입니다.",
    byJob: {
      JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
        primaryStakeholders: [
          "리스크·규제팀",
          "상품개발팀",
          "운영팀",
          "의사결정자",
        ],
        communicationFocus: [
          "규제 지표 정확성",
          "상품별 리스크 해석",
          "운영 효율성 신호",
        ],
        conservativeReading:
          "금융에서는 데이터분석이 규제 준수와 상품 혁신을 함께 지원해야 하므로, 선택형 입력 경험만으로 이 수준의 조율 깊이를 단정하기 어렵습니다.",
        applicationPrompt:
          "지원서에서는 어떤 리스크 지표를 누구의 기준에 맞춰 해석했고, 그것이 어떤 의사결정으로 이어졌는지 구체화하면 좋습니다.",
      },
      JOB_FINANCE_ACCOUNTING_ACCOUNTING: {
        primaryStakeholders: ["감사팀", "재무팀", "운영팀", "경영진"],
        communicationFocus: [
          "거래 기록 정확성",
          "규제 보고 기준",
          "예산 집행 명확성",
        ],
        conservativeReading:
          "금융기관의 회계는 국제회계기준(IFRS)과 감시규정을 동시에 충족해야 하므로, 기준 맞춤의 깊이가 일반 산업과 다릅니다.",
        applicationPrompt:
          "원가 계산, 증빙 요청, 외부 감사 대응 같은 구체적 경험이 있다면 설명해주시기 바랍니다.",
      },
    },
  },

  saas_it_service: {
    label: "IT / SaaS / 소프트웨어",
    stakeholderSummary:
      "SaaS 기업에서는 고객·개발·제품·영업이 빠르게 상호작용하므로, 부서 간 의사결정 속도와 정확성이 중요합니다.",
    byJob: {
      JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
        primaryStakeholders: ["제품팀", "영업팀", "개발팀", "고객"],
        communicationFocus: [
          "사용자 행동 해석",
          "제품 개선 신호",
          "영업 성과 분석",
        ],
        conservativeReading:
          "IT/SaaS에서 데이터분석은 고객 만족도, 제품 성장, 영업 효율을 동시에 봐야 하므로, 선택형 경험만으로 실제 역할을 단정할 수 없습니다.",
        applicationPrompt:
          "기술 제품 프로젝트, 사용자 행동 데이터 분석, 또는 개발팀과의 협업 경험을 구체화하면 좋습니다.",
      },
      JOB_MARKETING_PRODUCT_MARKETING_PMM: {
        primaryStakeholders: [
          "개발팀",
          "제품팀",
          "영업팀",
          "고객",
        ],
        communicationFocus: [
          "기술 강점 이해",
          "고객 요구 해석",
          "경쟁사 대비 포지셔닝",
        ],
        conservativeReading:
          "SaaS 제품마케팅은 기술 이해도와 시장 감각을 동시에 요구하므로, 기술 배경 없이 선택값만으로는 적합성을 판단하기 어렵습니다.",
        applicationPrompt:
          "스타트업 제품팀 경험, 기술 제품의 메시지 개발, 또는 개발자와의 직접 협업 사례를 구체화해주시기 바랍니다.",
      },
      JOB_MARKETING_PERFORMANCE_MARKETING: {
        primaryStakeholders: [
          "고객",
          "매체파트너",
          "제품팀",
          "의사결정자",
        ],
        communicationFocus: [
          "고객 획득 신호",
          "매체별 성과",
          "ROI 분석",
        ],
        conservativeReading:
          "IT/SaaS의 퍼포먼스마케팅은 기술 제품의 복잡성을 고객에게 간단히 설명하면서도 정확한 성과를 보고해야 합니다.",
        applicationPrompt:
          "B2C 플랫폼이나 SaaS 제품의 광고 성과 분석, 또는 고객 데이터 기반 마케팅 경험이 있다면 설명해주시기 바랍니다.",
      },
    },
  },

  manufacturing_auto: {
    label: "제조업 (자동차 / 기계)",
    stakeholderSummary:
      "제조 현장에서는 생산·품질·자재·협력사가 동시에 움직이므로, 한 가지 결정이 여러 부서의 즉시 대응을 요구합니다.",
    byJob: {
      JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT: {
        primaryStakeholders: [
          "품질팀",
          "자재팀",
          "현장작업자",
          "협력사",
        ],
        communicationFocus: [
          "생산 계획 기준",
          "자재 공급 신호",
          "품질 문제 대응",
        ],
        conservativeReading:
          "제조 현장은 계획 대비 즉각적 대응이 필수이므로, 선택형 경험만으로는 실제 현장감을 판단할 수 없습니다.",
        applicationPrompt:
          "생산 현장 방문, 자재 관리 개선, 품질 이슈 대응 협력 같은 구체적 경험을 설명해주시기 바랍니다.",
      },
      JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: {
        primaryStakeholders: [
          "생산팀",
          "개발팀",
          "규제담당",
          "협력사",
        ],
        communicationFocus: [
          "품질 기준 정의",
          "검증 방법 논의",
          "불량 기준 조율",
        ],
        conservativeReading:
          "제조업 QA는 단순 검증을 넘어 규제 기준과 생산 현장의 가능성을 함께 고려해야 합니다.",
        applicationPrompt:
          "공정 표준화, 검증 절차 개선, 또는 협력사 품질 관리 경험이 있다면 구체화해주시기 바랍니다.",
      },
    },
  },

  bio_healthcare: {
    label: "바이오 / 헬스케어",
    stakeholderSummary:
      "헬스케어/제약 산업은 임상 데이터·규제·생산 기준이 모두 높으므로, 각 조직과의 기준 맞춤이 안전성과 직결됩니다.",
    byJob: {
      JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA: {
        primaryStakeholders: [
          "임상팀",
          "규제팀",
          "R&D팀",
          "생산팀",
        ],
        communicationFocus: [
          "임상 데이터 기준",
          "GMP 프로세스",
          "규제 준수 확인",
        ],
        conservativeReading:
          "바이오/헬스케어 QA는 일반 제조업보다 엄격한 규정과 임상 기준을 동시에 적용하므로, 선택형 경험만으로는 적합성을 평가할 수 없습니다.",
        applicationPrompt:
          "의약품·의료기기 규정 이해, GMP 프로세스 관찰, 또는 임상 데이터 검증 경험을 구체화하면 좋습니다.",
      },
      JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
        primaryStakeholders: [
          "임상팀",
          "규제팀",
          "R&D팀",
          "의사결정자",
        ],
        communicationFocus: [
          "임상 데이터 해석",
          "규제 보고 기준",
          "안전성 신호",
        ],
        conservativeReading:
          "헬스케어에서 데이터분석은 단순 효율성을 넘어 환자 안전과 규제 준수를 보장해야 합니다.",
        applicationPrompt:
          "임상 데이터 분석, 규제 문서 작성 지원, 또는 의료기기 프로젝트 참여 경험이 있다면 설명해주시기 바랍니다.",
      },
    },
  },

  ecommerce_retail: {
    label: "유통 / 커머스 / 소비재",
    stakeholderSummary:
      "온라인 커머스에서는 고객·플랫폼·물류·마케팅이 동시에 움직이므로, 고객 신호의 빠른 해석이 경쟁력입니다.",
    byJob: {
      JOB_IT_DATA_DIGITAL_DATA_ANALYSIS: {
        primaryStakeholders: [
          "고객",
          "마케팅팀",
          "상품팀",
          "물류팀",
        ],
        communicationFocus: [
          "고객 행동 분석",
          "판매 성과 신호",
          "재고 최적화",
        ],
        conservativeReading:
          "커머스 분석은 고객 만족도, 판매 성과, 운영 효율을 동시에 봐야 하므로, 선택형 경험만으로 실제 역량을 판단하기 어렵습니다.",
        applicationPrompt:
          "온라인 플랫폼 데이터 분석, 고객 행동 기반 상품 최적화, 또는 물류 효율성 개선 경험을 구체화하면 좋습니다.",
      },
      JOB_MARKETING_PERFORMANCE_MARKETING: {
        primaryStakeholders: [
          "고객",
          "매체파트너",
          "상품팀",
          "의사결정자",
        ],
        communicationFocus: [
          "고객 획득 비용",
          "매체 성과 분석",
          "ROI 최적화",
        ],
        conservativeReading:
          "커머스 마케팅은 광고 성과를 빠르게 해석하면서도 고객 생애가치(LTV)를 함께 봐야 합니다.",
        applicationPrompt:
          "온라인 커머스 광고 성과 분석, 고객 데이터 기반 마케팅 최적화, 또는 물류 파트너와의 협업 경험을 설명해주시기 바랍니다.",
      },
      JOB_MARKETING_PRODUCT_MARKETING_PMM: {
        primaryStakeholders: [
          "고객",
          "상품팀",
          "마케팅팀",
          "운영팀",
        ],
        communicationFocus: [
          "상품 포지셔닝",
          "고객 니즈 해석",
          "경쟁사 대비",
        ],
        conservativeReading:
          "커머스 환경에서는 고객 신호가 빠르게 변하므로, 지속적인 상품 재포지셔닝이 필요합니다.",
        applicationPrompt:
          "브랜드·상품 포지셔닝 경험, 고객 데이터 기반 메시지 개발, 또는 물류·운영팀과의 협업 사례를 구체화해주시기 바랍니다.",
      },
    },
  },
});

// Helper function to retrieve industry-specific stakeholder context
// Returns null if industry or job not found (safe for optional read path)
export function getAxis4IndustryStakeholderContext(industryId, jobId) {
  // Both industryId and jobId must be provided
  if (!industryId || !jobId) {
    return null;
  }

  const industryCtx = AXIS4_INDUSTRY_STAKEHOLDER_CONTEXT[industryId];
  if (!industryCtx) {
    return null;
  }

  // Look for specific job context within the industry
  const jobCtx = industryCtx.byJob?.[jobId];
  if (jobCtx) {
    return jobCtx;
  }

  // No matching job context; return null (fallback to job-only logic in axisExplanationRegistry)
  return null;
}
