export const controlledWorkRecordsRuntimeWiringCases = Object.freeze([
  {
    id: "default_disabled_no_change",
    workRecords: [
      {
        id: "wr_runtime_default_001",
        recordDate: "2026-06-01",
        source: "work_record",
        title: "Onboarding funnel analysis",
        content: "온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석하고, 개선 우선순위를 정리했다.",
      },
    ],
    options: {},
    expected: {
      controlledStrengthIncludes: [],
      controlledStrengthExcludes: ["problem_definition", "prioritization"],
      controlledRiskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "opt_in_explicit_pm_work_record_strength",
    workRecords: [
      {
        id: "wr_runtime_pm_001",
        recordDate: "2026-06-02",
        source: "work_record",
        title: "Onboarding funnel analysis",
        content: "온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석하고, 개선 우선순위를 정리했다.",
      },
    ],
    options: {
      enableControlledWorkRecordSignals: true,
    },
    expected: {
      controlledStrengthIncludes: ["problem_definition", "prioritization"],
      controlledStrengthExcludes: [],
      controlledRiskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "opt_in_support_only_to_risk",
    workRecords: [
      {
        id: "wr_runtime_pm_002",
        recordDate: "2026-06-03",
        source: "work_record",
        title: "PM request handoff",
        content: "PM이 정한 개선 요청 목록을 노션에 정리하고 개발팀에 전달했다.",
      },
    ],
    options: {
      enableControlledWorkRecordSignals: true,
    },
    expected: {
      controlledStrengthIncludes: [],
      controlledStrengthExcludes: ["requirements_definition", "prioritization"],
      controlledRiskIncludes: ["product_ownership_unclear", "insufficient_ownership_evidence"],
      missingIncludes: ["user_role", "judgment_criteria"],
    },
  },
  {
    id: "opt_in_data_judgment_strength",
    workRecords: [
      {
        id: "wr_runtime_data_001",
        recordDate: "2026-06-04",
        source: "work_record",
        title: "Conversion diagnosis",
        content:
          "전환율 하락 원인을 SQL로 추출한 이벤트 로그와 유입 채널별 지표를 비교해 분석했고, 광고 유입 품질 저하를 원인으로 보고했다.",
      },
    ],
    options: {
      enableControlledWorkRecordSignals: true,
    },
    expected: {
      controlledStrengthIncludes: ["root_cause_analysis", "sql_query_design", "decision_support"],
      controlledStrengthExcludes: [],
      controlledRiskIncludes: [],
      missingIncludes: [],
    },
  },
  {
    id: "opt_in_excel_weak_activity_blocked",
    workRecords: [
      {
        id: "wr_runtime_data_002",
        recordDate: "2026-06-05",
        source: "work_record",
        title: "Monthly sales spreadsheet",
        content: "엑셀로 월별 매출 자료를 정리했다.",
      },
    ],
    options: {
      enableControlledWorkRecordSignals: true,
    },
    expected: {
      controlledStrengthIncludes: [],
      controlledStrengthExcludes: ["data_analysis", "finance_analysis", "strategy"],
      controlledRiskIncludes: ["insufficient_ownership_evidence"],
      missingIncludes: ["work_purpose", "judgment_criteria", "result_or_usage"],
    },
  },
  {
    id: "opt_in_contradicted_work_record_blocked",
    workRecords: [
      {
        id: "wr_runtime_pm_003",
        recordDate: "2026-06-06",
        source: "work_record",
        title: "Requirements meeting participation",
        content: "요구사항 정리 회의에 참여했다. 최종 요구사항 정의와 우선순위 결정은 PO가 담당했다.",
      },
    ],
    options: {
      enableControlledWorkRecordSignals: true,
    },
    expected: {
      controlledStrengthIncludes: [],
      controlledStrengthExcludes: ["requirements_definition", "prioritization"],
      controlledRiskIncludes: ["contradicted_ownership"],
      missingIncludes: ["user_role", "judgment_criteria"],
    },
  },
  {
    id: "opt_in_source_record_id_missing_strength_blocked",
    workRecords: [
      {
        recordDate: "2026-06-07",
        source: "work_record",
        title: "Onboarding funnel analysis without id",
        content: "온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석하고, 개선 우선순위를 정리했다.",
      },
    ],
    options: {
      enableControlledWorkRecordSignals: true,
    },
    expected: {
      controlledStrengthIncludes: [],
      controlledStrengthExcludes: ["problem_definition", "prioritization"],
      controlledRiskIncludes: [],
      missingIncludes: [],
    },
  },
]);
