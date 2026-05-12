export const SUB_VERTICAL_CAPABILITY_MAP = {
  SERVICE_PLANNING: {
    primary: ["job_alignment", "execution_depth", "collaboration_coordination", "structured_delivery"],
    secondary: ["stakeholder_communication", "domain_context", "user_or_customer_understanding", "work_style_signal"],
    byAxis: {
      axis1: {
        primary: ["job_alignment", "structured_delivery"],
        secondary: ["execution_depth"],
      },
      axis2: {
        primary: ["domain_context", "user_or_customer_understanding"],
        secondary: ["stakeholder_communication"],
      },
      axis3: {
        primary: ["execution_depth", "collaboration_coordination"],
        secondary: ["structured_delivery"],
      },
    },
  },
  UX_SERVICE_DESIGN: {
    primary: ["user_or_customer_understanding", "job_alignment", "execution_depth"],
    secondary: ["stakeholder_communication", "collaboration_coordination", "domain_context", "work_style_signal"],
    byAxis: {
      axis1: {
        primary: ["job_alignment", "structured_delivery"],
        secondary: ["execution_depth"],
      },
      axis2: {
        primary: ["domain_context", "user_or_customer_understanding"],
        secondary: ["stakeholder_communication"],
      },
      axis3: {
        primary: ["execution_depth", "structured_delivery"],
        secondary: ["collaboration_coordination"],
      },
    },
  },
  B2B_SALES: {
    primary: ["stakeholder_communication", "domain_context", "execution_depth"],
    secondary: ["job_alignment", "collaboration_coordination", "structured_delivery", "work_style_signal"],
    byAxis: {
      axis1: {
        primary: ["job_alignment", "stakeholder_communication"],
        secondary: ["execution_depth"],
      },
      axis2: {
        primary: ["domain_context", "stakeholder_communication"],
        secondary: ["user_or_customer_understanding"],
      },
      axis3: {
        primary: ["execution_depth", "stakeholder_communication"],
        secondary: ["collaboration_coordination"],
      },
    },
  },
  BRAND_MARKETING: {
    primary: ["user_or_customer_understanding", "domain_context", "execution_depth"],
    secondary: ["stakeholder_communication", "collaboration_coordination", "structured_delivery", "work_style_signal"],
    byAxis: {
      axis1: {
        primary: ["job_alignment", "structured_delivery"],
        secondary: ["execution_depth"],
      },
      axis2: {
        primary: ["domain_context", "user_or_customer_understanding"],
        secondary: ["stakeholder_communication"],
      },
      axis3: {
        primary: ["execution_depth", "structured_delivery"],
        secondary: ["collaboration_coordination"],
      },
    },
  },
  RECRUITING: {
    primary: ["stakeholder_communication", "collaboration_coordination", "structured_delivery"],
    secondary: ["execution_depth", "domain_context", "work_style_signal", "job_alignment"],
    byAxis: {
      axis1: {
        primary: ["job_alignment", "stakeholder_communication"],
        secondary: ["execution_depth"],
      },
      axis2: {
        primary: ["domain_context", "stakeholder_communication"],
        secondary: ["user_or_customer_understanding"],
      },
      axis3: {
        primary: ["execution_depth", "collaboration_coordination"],
        secondary: ["structured_delivery"],
      },
    },
  },
  TECHNICAL_SALES: {
    primary: ["job_alignment", "domain_context", "execution_depth", "stakeholder_communication"],
    secondary: ["structured_delivery", "collaboration_coordination", "user_or_customer_understanding", "work_style_signal"],
    byAxis: {
      axis1: {
        primary: ["job_alignment", "execution_depth"],
        secondary: ["structured_delivery"],
      },
      axis2: {
        primary: ["domain_context", "user_or_customer_understanding"],
        secondary: ["stakeholder_communication"],
      },
      axis3: {
        primary: ["execution_depth", "structured_delivery"],
        secondary: ["collaboration_coordination"],
      },
    },
  },
};

export function getSubVerticalCapabilityProfile(subVertical, axisKey = "") {
  const entry = SUB_VERTICAL_CAPABILITY_MAP[subVertical];
  if (!entry) return { primary: [], secondary: [] };
  if (axisKey && entry.byAxis?.[axisKey]) return entry.byAxis[axisKey];
  return { primary: entry.primary || [], secondary: entry.secondary || [] };
}
