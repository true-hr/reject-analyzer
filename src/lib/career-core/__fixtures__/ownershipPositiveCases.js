export const ownershipPositiveCases = Object.freeze([
  {
    id: "positive_01_sales_proposal_strategy_owner",
    title: "Sales proposal strategy owner",
    resumeInput: {
      roleTitle: "Sales proposal manager",
      artifact: "Enterprise proposal strategy and deal follow-up pack",
      description: [
        "Discovered customer pain points through client discovery calls and mapped the customer problem to the proposal scope.",
        "Owned the proposal strategy for the solution proposal, including deal strategy, implementation scope, and executive follow-up.",
        "Led pricing negotiation and scope negotiation with the client, then tracked contract follow-up through won deal booking.",
      ],
      context: {
        decisionAuthority: "lead",
        reviewStructure: "sales_director_review",
      },
    },
    expected: {
      roleFamily: "sales",
      ownershipLevel: "lead",
      judgmentLevel: "high",
      seniorityLevelOneOf: ["senior_practitioner", "mid_to_senior_practitioner"],
      domainDepth: "proposal_strategy_and_revenue_ownership",
      confidence: "high",
      strengthSignalsIncludes: [
        "customer_problem_discovery",
        "proposal_strategy",
        "commercial_negotiation",
        "revenue_ownership",
      ],
      shouldNotInferExcludes: ["sales_lead"],
    },
  },
  {
    id: "positive_02_growth_marketing_campaign_owner",
    title: "Growth marketing campaign owner",
    resumeInput: {
      roleTitle: "Growth marketing specialist",
      artifact: "Paid campaign experiment report",
      description: [
        "Set the campaign hypothesis for acquisition experiments and designed the creative A/B test plan.",
        "Analyzed CPA, conversion rate, and other performance metric analysis results by channel.",
        "Adjusted budget allocation and targeting adjustment based on the test result, then followed up on conversion impact.",
      ],
      context: {
        decisionAuthority: "recommend_and_follow_up",
        reviewStructure: "marketing_lead_review",
      },
    },
    expected: {
      roleFamily: "growth_marketing",
      ownershipLevel: "recommend_and_follow_up",
      judgmentLevel: "medium_high",
      seniorityLevel: "mid_practitioner",
      domainDepth: "campaign_experiment_and_performance_optimization",
      strengthSignalsIncludes: [
        "campaign_hypothesis",
        "creative_ab_testing",
        "performance_metric_analysis",
        "budget_optimization",
      ],
      shouldNotInferExcludes: ["growth_strategy"],
    },
  },
  {
    id: "positive_03_cx_voc_improvement_owner",
    title: "CX/VOC improvement owner",
    resumeInput: {
      roleTitle: "CX operations specialist",
      artifact: "VOC journey improvement report",
      description: [
        "Performed VOC analysis and voice of customer clustering to identify repeat complaint themes.",
        "Diagnosed the customer journey problem across onboarding touchpoints and defined the response guide gaps.",
        "Improved the support policy and agent guide, then tracked repeat inquiry reduction and complaint reduction after rollout.",
      ],
      context: {
        decisionAuthority: "recommend_and_follow_up",
        reviewStructure: "cx_lead_review",
      },
    },
    expected: {
      roleFamilyOneOf: ["cx_strategy", "customer_experience_operations"],
      ownershipLevel: "recommend_and_follow_up",
      judgmentLevel: "medium_high",
      seniorityLevel: "mid_practitioner",
      strengthSignalsIncludes: [
        "voc_analysis",
        "customer_journey_diagnosis",
        "support_policy_improvement",
        "customer_issue_reduction",
      ],
    },
  },
  {
    id: "positive_04_data_metric_dashboard_analyst",
    title: "Data metric/dashboard analyst",
    resumeInput: {
      roleTitle: "Data analyst",
      artifact: "Metric definition and diagnostic dashboard",
      description: [
        "Led metric definition for activation and retention KPIs with stakeholders.",
        "Wrote SQL query design for cohort tables and performed root cause analysis on conversion drops.",
        "Designed dashboard structure for weekly decision support and supported management decision reviews.",
      ],
      context: {
        decisionAuthority: "recommend",
        reviewStructure: "data_lead_review",
      },
    },
    expected: {
      roleFamily: "data_analysis",
      ownershipLevel: "recommend",
      judgmentLevel: "medium_high",
      seniorityLevel: "analyst_or_mid",
      domainDepth: "metric_definition_and_diagnostic_analysis",
      strengthSignalsIncludes: [
        "metric_definition",
        "sql_query_design",
        "root_cause_analysis",
        "dashboard_design",
        "decision_support",
      ],
    },
  },
  {
    id: "positive_05_pm_service_planning_requirements_owner",
    title: "PM/service planning requirements owner",
    resumeInput: {
      roleTitle: "Service planning PM",
      artifact: "Requirements definition and release monitoring note",
      description: [
        "Owned problem definition for checkout friction and wrote the problem statement from customer and operation data.",
        "Defined requirements, PRD, and user story details, then made prioritization and priority trade-off decisions.",
        "Coordinated cross-functional developer collaboration and designer collaboration, then handled post-release monitoring of release metrics.",
      ],
      context: {
        decisionAuthority: "lead",
        reviewStructure: "product_lead_review",
      },
    },
    expected: {
      roleFamilyOneOf: ["product_planning_pm", "service_planning"],
      ownershipLevelOneOf: ["lead", "recommend_and_follow_up"],
      judgmentLevelOneOf: ["high", "medium_high"],
      seniorityLevel: "mid_practitioner",
      domainDepth: "requirements_definition_and_product_iteration",
      strengthSignalsIncludes: [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ],
    },
  },
]);
