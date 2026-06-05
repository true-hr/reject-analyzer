const trace = (signal, sourceText, sourceIndex = 0, extra = {}) => ({
  sourceText,
  sourceField: "bullets.text",
  sourceIndex,
  reasonCode: `regression_${signal}`,
  ...extra,
});

const classification = (roleFamily, ownershipLevel = "lead", judgmentLevel = "high") => ({
  roleFamily,
  ownershipLevel,
  judgmentLevel,
});

const controlledOptions = ({
  roleFamily,
  signals,
  confidenceBySignal,
  tracesBySignal,
  missingSignals = [],
  contradictedSignals = [],
  ownershipLevel = "lead",
  judgmentLevel = "high",
}) => ({
  roleFamily,
  signals,
  classification: classification(roleFamily, ownershipLevel, judgmentLevel),
  confidence: {
    evidenceConfidenceBySignal: confidenceBySignal,
  },
  traceMap: {
    tracesBySignal,
    missingSignals,
    contradictedSignals,
  },
});

export const resumeProfileControlledRuntimeRegressionCases = Object.freeze([
  {
    id: "realistic_pm_explicit_opt_in",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "Realistic PM Explicit",
      headline: {
        targetTitle: "Product Manager",
        summary: "Service planning and product operations experience for a B2B platform.",
      },
      experiences: [
        {
          id: "pm-explicit-01",
          company: "Career Platform Co.",
          title: "Service Planning Manager",
          startDate: "2021-03",
          endDate: "2025-02",
          bullets: [
            { text: "Defined onboarding drop-off problems using funnel data and customer interviews.", evidenceType: "strong" },
            { text: "Wrote requirements and user stories for a company admin workflow redesign.", evidenceType: "strong" },
            { text: "Prioritized release scope with engineering and design based on impact and dependency.", evidenceType: "strong" },
            { text: "Monitored activation rate and support tickets after launch to adjust the roadmap.", evidenceType: "metric" },
          ],
        },
      ],
    },
    controlledOwnershipSignalOptions: controlledOptions({
      roleFamily: "product_planning_pm",
      signals: [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ],
      confidenceBySignal: {
        problem_definition: "explicit",
        requirements_definition: "explicit",
        prioritization: "inferred_strong",
        cross_functional_collaboration: "explicit",
        post_release_monitoring: "explicit",
      },
      tracesBySignal: {
        problem_definition: [trace("problem_definition", "Defined onboarding drop-off problems using funnel data and customer interviews.")],
        requirements_definition: [trace("requirements_definition", "Wrote requirements and user stories for a company admin workflow redesign.", 1)],
        prioritization: [trace("prioritization", "Prioritized release scope with engineering and design based on impact and dependency.", 2)],
        cross_functional_collaboration: [trace("cross_functional_collaboration", "Prioritized release scope with engineering and design based on impact and dependency.", 2)],
        post_release_monitoring: [trace("post_release_monitoring", "Monitored activation rate and support tickets after launch to adjust the roadmap.", 3)],
      },
    }),
    expected: {
      strengthIncludes: [
        "problem_definition",
        "requirements_definition",
        "prioritization",
        "cross_functional_collaboration",
        "post_release_monitoring",
      ],
      riskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "realistic_pm_weak_support_only",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "Realistic PM Support",
      headline: {
        targetTitle: "Product Operations Assistant",
        summary: "Supported PM meetings and product issue tracking.",
      },
      experiences: [
        {
          id: "pm-support-01",
          company: "App Service Co.",
          title: "Product Operations Assistant",
          startDate: "2022-05",
          endDate: "2024-04",
          bullets: [
            { text: "Forwarded improvement request lists from CS to the PM team.", evidenceType: "weak" },
            { text: "Organized meeting notes and shared priorities decided by the PM.", evidenceType: "weak" },
            { text: "Updated ticket status after each sprint planning meeting.", evidenceType: "weak" },
          ],
        },
      ],
    },
    controlledOwnershipSignalOptions: controlledOptions({
      roleFamily: "product_planning_pm",
      signals: ["requirements_definition", "prioritization", "post_release_monitoring"],
      confidenceBySignal: {
        requirements_definition: "absent",
        prioritization: "inferred_weak",
        post_release_monitoring: "absent",
      },
      tracesBySignal: {
        requirements_definition: [],
        prioritization: [trace("prioritization", "Organized meeting notes and shared priorities decided by the PM.", 1)],
        post_release_monitoring: [],
      },
      missingSignals: ["requirements_definition", "post_release_monitoring"],
      ownershipLevel: "assist",
      judgmentLevel: "low",
    }),
    expected: {
      strengthExcludes: ["requirements_definition", "prioritization", "post_release_monitoring"],
      riskIncludes: ["product_ownership_unclear"],
      missingIncludes: ["requirements_definition", "post_release_monitoring"],
    },
  },
  {
    id: "realistic_data_explicit_opt_in",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "Realistic Data Explicit",
      headline: {
        targetTitle: "Data Analyst",
        summary: "Data analysis experience across metrics, SQL, dashboards, and decision support.",
      },
      experiences: [
        {
          id: "data-explicit-01",
          company: "Commerce Analytics Co.",
          title: "Data Analyst",
          startDate: "2020-01",
          endDate: "2024-12",
          bullets: [
            { text: "Defined retention and repurchase metrics with the growth team.", evidenceType: "strong" },
            { text: "Wrote SQL queries to segment cohorts and calculate weekly conversion.", evidenceType: "strong" },
            { text: "Analyzed churn root causes and designed an executive dashboard.", evidenceType: "strong" },
            { text: "Presented analysis that changed promotion budget allocation.", evidenceType: "metric" },
          ],
        },
      ],
    },
    controlledOwnershipSignalOptions: controlledOptions({
      roleFamily: "data_analysis",
      signals: ["metric_definition", "sql_query_design", "root_cause_analysis", "dashboard_design", "decision_support"],
      confidenceBySignal: {
        metric_definition: "explicit",
        sql_query_design: "explicit",
        root_cause_analysis: "explicit",
        dashboard_design: "inferred_strong",
        decision_support: "explicit",
      },
      tracesBySignal: {
        metric_definition: [trace("metric_definition", "Defined retention and repurchase metrics with the growth team.")],
        sql_query_design: [trace("sql_query_design", "Wrote SQL queries to segment cohorts and calculate weekly conversion.", 1)],
        root_cause_analysis: [trace("root_cause_analysis", "Analyzed churn root causes and designed an executive dashboard.", 2)],
        dashboard_design: [trace("dashboard_design", "Analyzed churn root causes and designed an executive dashboard.", 2)],
        decision_support: [trace("decision_support", "Presented analysis that changed promotion budget allocation.", 3)],
      },
    }),
    expected: {
      strengthIncludes: ["metric_definition", "sql_query_design", "root_cause_analysis", "dashboard_design", "decision_support"],
      riskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "realistic_sql_execution_weak",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "Realistic SQL Weak",
      headline: {
        targetTitle: "Operations Data Support",
        summary: "Executed fixed SQL and prepared recurring downloads for business teams.",
      },
      experiences: [
        {
          id: "sql-weak-01",
          company: "Marketplace Co.",
          title: "Operations Data Support",
          startDate: "2022-01",
          endDate: "2023-12",
          bullets: [
            { text: "Ran pre-written SQL and downloaded order data each morning.", evidenceType: "weak" },
            { text: "Metric definitions were performed by the data team.", evidenceType: "weak" },
            { text: "Did not own dashboard design; updated exported tables only.", evidenceType: "weak" },
          ],
        },
      ],
    },
    controlledOwnershipSignalOptions: controlledOptions({
      roleFamily: "data_analysis",
      signals: ["metric_definition", "sql_query_design", "dashboard_design", "decision_support"],
      confidenceBySignal: {
        metric_definition: "contradicted",
        sql_query_design: "inferred_weak",
        dashboard_design: "contradicted",
        decision_support: "absent",
      },
      tracesBySignal: {
        metric_definition: [trace("metric_definition", "Metric definitions were performed by the data team.", 1, { isContradicted: true })],
        sql_query_design: [trace("sql_query_design", "Ran pre-written SQL and downloaded order data each morning.")],
        dashboard_design: [trace("dashboard_design", "Did not own dashboard design; updated exported tables only.", 2, { isContradicted: true })],
        decision_support: [],
      },
      missingSignals: ["decision_support"],
      contradictedSignals: ["metric_definition", "dashboard_design"],
      ownershipLevel: "assist",
      judgmentLevel: "low",
    }),
    expected: {
      strengthExcludes: ["metric_definition", "sql_query_design", "dashboard_design", "decision_support"],
      riskIncludes: ["data_analysis_overclaim_risk", "metric_definition", "dashboard_design"],
      missingIncludes: ["decision_support"],
    },
  },
  {
    id: "realistic_excel_ambiguous",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "Realistic Excel Ambiguous",
      headline: {
        targetTitle: "Sales Admin",
        summary: "Organized monthly sales files and entered values into fixed templates.",
      },
      experiences: [
        {
          id: "excel-ambiguous-01",
          company: "Retail Distributor",
          title: "Sales Admin",
          startDate: "2021-06",
          endDate: "2024-06",
          bullets: [
            { text: "Collected monthly Excel files from branches and combined them into one workbook.", evidenceType: "weak" },
            { text: "Entered sales values into a fixed reporting template.", evidenceType: "weak" },
            { text: "Shared the completed file with the finance manager.", evidenceType: "weak" },
          ],
        },
      ],
    },
    controlledOwnershipSignalOptions: controlledOptions({
      roleFamily: "unknown_admin_support",
      signals: ["problem_definition"],
      confidenceBySignal: {
        problem_definition: "absent",
      },
      tracesBySignal: {
        problem_definition: [],
      },
      missingSignals: ["problem_definition"],
      ownershipLevel: "assist",
      judgmentLevel: "low",
    }),
    expected: {
      strengthExcludes: ["finance_analysis", "data_analysis", "strategy", "problem_definition"],
      riskIncludes: ["insufficient_ownership_evidence"],
      missingIncludes: ["problem_definition"],
    },
  },
  {
    id: "realistic_contradicted_ownership",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      candidateLabel: "Realistic Contradicted Ownership",
      headline: {
        targetTitle: "Product Coordinator",
        summary: "Participated in requirement grooming but did not own final decisions.",
      },
      experiences: [
        {
          id: "contradicted-ownership-01",
          company: "SaaS Product Co.",
          title: "Product Coordinator",
          startDate: "2022-02",
          endDate: "2024-02",
          bullets: [
            { text: "Participated in requirement cleanup and issue summary meetings.", evidenceType: "weak" },
            { text: "Final requirement definition and prioritization were owned by the PO.", evidenceType: "weak" },
            { text: "Prepared meeting notes and handoff documents for engineering.", evidenceType: "weak" },
          ],
        },
      ],
    },
    controlledOwnershipSignalOptions: controlledOptions({
      roleFamily: "product_planning_pm",
      signals: ["requirements_definition", "prioritization", "cross_functional_collaboration"],
      confidenceBySignal: {
        requirements_definition: "contradicted",
        prioritization: "contradicted",
        cross_functional_collaboration: "inferred_weak",
      },
      tracesBySignal: {
        requirements_definition: [trace("requirements_definition", "Final requirement definition and prioritization were owned by the PO.", 1, { isContradicted: true })],
        prioritization: [trace("prioritization", "Final requirement definition and prioritization were owned by the PO.", 1, { isContradicted: true })],
        cross_functional_collaboration: [trace("cross_functional_collaboration", "Prepared meeting notes and handoff documents for engineering.", 2)],
      },
      contradictedSignals: ["requirements_definition", "prioritization"],
      missingSignals: ["requirements_definition", "prioritization"],
      ownershipLevel: "assist",
      judgmentLevel: "low",
    }),
    expected: {
      strengthExcludes: ["requirements_definition", "prioritization", "cross_functional_collaboration"],
      riskIncludes: ["product_ownership_unclear", "requirements_definition", "prioritization"],
      missingIncludes: [],
    },
  },
]);
