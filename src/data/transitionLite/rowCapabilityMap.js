export const DETAILED_READ_ROW_CAPABILITY_MAP = {
  major_job_relevance: {
    axisKey: "axis1",
    primaryCapability: "job_alignment",
    secondaryCapabilities: [],
  },
  project_job_relevance: {
    axisKey: "axis1",
    primaryCapability: "job_alignment",
    secondaryCapabilities: ["execution_depth", "structured_delivery"],
  },
  internship_job_relevance: {
    axisKey: "axis1",
    primaryCapability: "job_alignment",
    secondaryCapabilities: ["execution_depth", "structured_delivery"],
  },
  major_cert_industry_relevance: {
    axisKey: "axis2",
    primaryCapability: "domain_context",
    secondaryCapabilities: [],
  },
  context_industry_grounding: {
    axisKey: "axis2",
    primaryCapability: "domain_context",
    secondaryCapabilities: ["user_or_customer_understanding", "stakeholder_communication"],
  },
  industry_exposure_repeatability: {
    axisKey: "axis2",
    primaryCapability: "domain_context",
    secondaryCapabilities: ["stakeholder_communication"],
  },
  outcome_level: {
    axisKey: "axis3",
    primaryCapability: "execution_depth",
    secondaryCapabilities: ["structured_delivery"],
  },
  duration_continuity: {
    axisKey: "axis3",
    primaryCapability: "execution_depth",
    secondaryCapabilities: [],
  },
  combo_experience: {
    axisKey: "axis3",
    primaryCapability: "execution_depth",
    secondaryCapabilities: ["collaboration_coordination"],
  },
  stakeholder_exposure_level: {
    axisKey: "axis4",
    primaryCapability: "stakeholder_communication",
    secondaryCapabilities: ["collaboration_coordination"],
  },
  direct_interaction_experience: {
    axisKey: "axis4",
    primaryCapability: "stakeholder_communication",
    secondaryCapabilities: ["structured_delivery"],
  },
  strength_role_relevance: {
    axisKey: "axis5",
    primaryCapability: "work_style_signal",
    secondaryCapabilities: ["job_alignment"],
  },
  workstyle_role_relevance: {
    axisKey: "axis5",
    primaryCapability: "work_style_signal",
    secondaryCapabilities: ["collaboration_coordination"],
  },
};

export function getRowCapabilityMeta(rowKey) {
  return DETAILED_READ_ROW_CAPABILITY_MAP[rowKey] || null;
}
