import {
  buildEvidenceTraceMap,
  calibrateEvidenceConfidence,
  classifyOwnershipSeniority,
} from "../index.js";

const explicitPmInput = {
  roleTitle: "Service planning PM",
  artifact: "Requirements definition and release monitoring note",
  description: [
    "Owned problem definition for checkout friction and wrote the problem statement.",
    "Defined requirements, PRD, and user story details, then made prioritization decisions.",
    "Coordinated developer collaboration and designer collaboration, then handled post-release monitoring of release metrics.",
  ],
};

export const controlledProfileSignalCases = Object.freeze([
  {
    id: "explicit_pm_controlled_profile_signal",
    input: explicitPmInput,
    options: {
      domain: "product_planning_pm",
    },
    expected: {
      strengthSignals: [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ],
      missingSignals: [],
      riskSignalsMax: 0,
    },
  },
  {
    id: "weak_pm_forwarding_controlled",
    input: {
      roleTitle: "Service operations coordinator",
      artifact: "Improvement request list",
      description: [
        "Forwarded the improvement request list and updated status.",
        "Problem definition, prioritization, and policy flow design were not responsible.",
      ],
    },
    options: {
      domain: "product_planning_pm",
    },
    expected: {
      strengthExcludes: ["requirements_definition", "prioritization", "cross_functional_collaboration"],
      contradictedOneOf: ["problem_definition", "prioritization", "cross_functional_collaboration"],
      riskSignalsIncludesOneOf: ["product_ownership_unclear", "weak_ownership_evidence"],
      missingIncludesOneOf: ["requirements_definition", "post_release_monitoring"],
    },
  },
  {
    id: "explicit_data_controlled_profile_signal",
    input: {
      roleTitle: "Data analyst",
      artifact: "Metric definition and dashboard design document",
      description: [
        "Led metric definition and wrote SQL query design for cohort analysis.",
        "Performed root cause analysis on conversion drops, designed dashboard structure, and provided decision support.",
      ],
    },
    options: {
      domain: "data_analysis",
    },
    expected: {
      strengthSignals: [
        "metric_definition",
        "sql_query_design",
        "root_cause_analysis",
        "dashboard_design",
        "decision_support",
      ],
      evidenceConfidence: "explicit",
      missingSignals: [],
    },
  },
  {
    id: "weak_sql_export_controlled",
    input: {
      roleTitle: "Operations data assistant",
      artifact: "SQL export file",
      description: [
        "Executed only fixed SQL and downloaded data.",
        "Metric definition was performed by the data team and dashboard design was not responsible.",
      ],
    },
    options: {
      domain: "data_analysis",
    },
    expected: {
      strengthExcludes: ["metric_definition", "sql_query_design", "dashboard_design"],
      contradictedOneOf: ["metric_definition", "sql_query_design", "dashboard_design"],
      riskSignalsIncludesOneOf: ["data_analysis_overclaim_risk", "weak_data_ownership"],
      missingIncludesOneOf: ["root_cause_analysis", "decision_support"],
    },
  },
  {
    id: "mixed_cx_controlled",
    input: {
      roleTitle: "CX operations specialist",
      artifact: "VOC review memo",
      description: [
        "Reviewed the VOC analysis report but did not write it directly.",
        "Classified inquiry types, while support policy improvement was owned by the leader.",
      ],
    },
    options: {
      domain: "cx_strategy",
    },
    expected: {
      strengthExcludes: ["voc_analysis", "support_policy_improvement"],
      contradictedSignals: ["support_policy_improvement"],
      missingIncludesOneOf: ["customer_journey_diagnosis", "customer_issue_reduction"],
      riskSignalsIncludes: ["weak_cx_ownership_evidence"],
    },
  },
  {
    id: "explicit_sales_controlled",
    input: {
      roleTitle: "Sales proposal manager",
      artifact: "Enterprise proposal strategy and deal follow-up pack",
      description: [
        "Discovered customer pain points and mapped the customer problem to proposal scope.",
        "Owned proposal strategy and led pricing negotiation and scope negotiation.",
        "Tracked contract follow-up through won deal booking and revenue follow-up.",
      ],
    },
    options: {
      domain: "sales",
    },
    expected: {
      roleFamily: "sales",
      strengthSignals: [
        "customer_problem_discovery",
        "proposal_strategy",
        "commercial_negotiation",
        "revenue_ownership",
      ],
    },
  },
  {
    id: "ambiguous_excel_controlled",
    input: {
      roleTitle: "Office assistant",
      artifact: "Excel data organization",
      description: ["Organized spreadsheet files only."],
    },
    options: {
      roleFamily: "unknown_admin_support",
      signals: ["basic_data_organization", "metric_definition"],
    },
    expected: {
      strengthSignalsMax: 0,
      riskSignalsIncludes: ["insufficient_ownership_evidence"],
      missingSignals: ["metric_definition"],
    },
  },
  {
    id: "classification_input_controlled",
    input: (() => {
      const classification = classifyOwnershipSeniority(explicitPmInput);
      const signals = [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ];
      return {
        input: explicitPmInput,
        classification,
        confidence: calibrateEvidenceConfidence(explicitPmInput, {
          roleFamily: "product_planning_pm",
          signals,
        }),
        traceMap: buildEvidenceTraceMap(explicitPmInput, {
          domain: "product_planning_pm",
          signals,
        }),
      };
    })(),
    expected: {
      strengthSignals: [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ],
    },
  },
]);
