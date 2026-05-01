export const ROW_CAPABILITY_RATIONALE_MAP = {
  major_job_relevance: {
    axisKey: "axis1",
    primaryCapabilityId: "job_alignment",
    secondaryCapabilityIds: [],
    shortWhy: "전공 배경은 직무 과업과의 기초 연결 근거를 보여줍니다.",
  },
  project_job_relevance: {
    axisKey: "axis1",
    primaryCapabilityId: "job_alignment",
    secondaryCapabilityIds: ["execution_depth"],
    shortWhy: "프로젝트 경험은 직무 과업에 실제 적용해본 연결 근거를 보여줍니다.",
  },
  internship_job_relevance: {
    axisKey: "axis1",
    primaryCapabilityId: "job_alignment",
    secondaryCapabilityIds: ["execution_depth"],
    shortWhy: "인턴 경험은 현업 접점과의 직접 연결 근거를 보여줍니다.",
  },
  major_cert_industry_relevance: {
    axisKey: "axis2",
    primaryCapabilityId: "domain_context",
    secondaryCapabilityIds: [],
    shortWhy: "전공과 자격 배경은 목표 산업 이해의 기초 근거를 보여줍니다.",
  },
  context_industry_grounding: {
    axisKey: "axis2",
    primaryCapabilityId: "domain_context",
    secondaryCapabilityIds: ["user_or_customer_understanding", "stakeholder_communication"],
    shortWhy: "프로젝트나 활동 맥락은 산업 문맥을 실제로 접했는지 보여줍니다.",
  },
  industry_exposure_repeatability: {
    axisKey: "axis2",
    primaryCapabilityId: "domain_context",
    secondaryCapabilityIds: ["stakeholder_communication"],
    shortWhy: "유사 산업 노출의 반복 여부는 도메인 이해의 지속성을 보여줍니다.",
  },
  outcome_level: {
    axisKey: "axis3",
    primaryCapabilityId: "execution_depth",
    secondaryCapabilityIds: ["structured_delivery"],
    shortWhy: "결과 수준은 실제로 어디까지 실행해냈는지 보여줍니다.",
  },
  duration_continuity: {
    axisKey: "axis3",
    primaryCapabilityId: "execution_depth",
    secondaryCapabilityIds: [],
    shortWhy: "지속성은 일회성이 아닌 실행 깊이를 보여줍니다.",
  },
  combo_experience: {
    axisKey: "axis3",
    primaryCapabilityId: "execution_depth",
    secondaryCapabilityIds: ["collaboration_coordination"],
    shortWhy: "경험 조합 여부는 다양한 상황에서 실무를 이어본 깊이를 보여줍니다.",
  },
  stakeholder_exposure_level: {
    axisKey: "axis4",
    primaryCapabilityId: "stakeholder_communication",
    secondaryCapabilityIds: ["collaboration_coordination"],
    shortWhy: "누구를 상대했는지는 이해관계자 소통 경험의 범위를 보여줍니다.",
  },
  direct_interaction_experience: {
    axisKey: "axis4",
    primaryCapabilityId: "stakeholder_communication",
    secondaryCapabilityIds: ["structured_delivery"],
    shortWhy: "직접 설명·응대한 근거는 실제 소통 수행 여부를 보여줍니다.",
  },
  strength_role_relevance: {
    axisKey: "axis5",
    primaryCapabilityId: "work_style_signal",
    secondaryCapabilityIds: ["job_alignment"],
    shortWhy: "강점 선택은 어떤 방식으로 기여하려는지 보여주는 참고 신호입니다.",
  },
  workstyle_role_relevance: {
    axisKey: "axis5",
    primaryCapabilityId: "work_style_signal",
    secondaryCapabilityIds: ["collaboration_coordination"],
    shortWhy: "업무 스타일 응답은 협업과 몰입 방식의 경향을 보여주는 참고 신호입니다.",
  },
};

export function getRowCapabilityRationale(rowKey) {
  return ROW_CAPABILITY_RATIONALE_MAP[String(rowKey || "").trim()] || null;
}
