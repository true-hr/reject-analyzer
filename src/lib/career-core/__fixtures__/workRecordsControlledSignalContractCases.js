const requiredSourceFields = Object.freeze(["sourceText", "sourceRecordId", "recordDate"]);

export const workRecordsControlledSignalContractCases = Object.freeze([
  {
    id: "workrecord_explicit_pm_ownership",
    workRecords: [
      {
        id: "wr_pm_001",
        recordDate: "2026-06-01",
        source: "ai_inbox",
        title: "Onboarding drop-off analysis",
        content: "온보딩 이탈 원인을 퍼널 데이터와 고객 문의를 기준으로 분석하고, 개선 우선순위를 정리했다.",
        tags: ["product", "analysis"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "explicit_judgment", "explicit_ownership"],
      eligibleStrengthSignals: ["problem_definition", "prioritization"],
      forbiddenStrengthSignals: [],
      riskSignals: [],
      missingIncludes: [],
      clarificationQuestions: [],
      requiredSourceFields,
    },
  },
  {
    id: "workrecord_pm_support_only",
    workRecords: [
      {
        id: "wr_pm_002",
        recordDate: "2026-06-02",
        source: "work_record",
        title: "PM request handoff",
        content: "PM이 정한 개선 요청 목록을 노션에 정리하고 개발팀에 전달했다.",
        tags: ["product", "documentation"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "inferred_weak_activity"],
      eligibleStrengthSignals: [],
      forbiddenStrengthSignals: ["requirements_definition", "prioritization"],
      riskSignals: ["product_ownership_unclear"],
      missingIncludes: ["user_role", "judgment_criteria"],
      clarificationQuestions: [
        "이 개선 요청 목록에서 본인이 직접 정의하거나 결정한 범위는 무엇인가?",
        "개발팀에 전달하기 전 우선순위나 판단 기준을 본인이 설정했는가?",
      ],
      requiredSourceFields: [],
    },
  },
  {
    id: "workrecord_data_explicit_judgment",
    workRecords: [
      {
        id: "wr_data_001",
        recordDate: "2026-06-03",
        source: "ai_inbox",
        title: "Conversion drop diagnosis",
        content:
          "전환율 하락 원인을 SQL로 추출한 이벤트 로그와 유입 채널별 지표를 비교해 분석했고, 광고 유입 품질 저하를 원인으로 보고했다.",
        tags: ["data", "analysis"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "explicit_judgment"],
      eligibleStrengthSignals: ["root_cause_analysis", "sql_query_design", "decision_support"],
      forbiddenStrengthSignals: [],
      riskSignals: [],
      missingIncludes: [],
      clarificationQuestions: [],
      requiredSourceFields,
    },
  },
  {
    id: "workrecord_excel_weak_activity",
    workRecords: [
      {
        id: "wr_data_002",
        recordDate: "2026-06-04",
        source: "work_record",
        title: "Monthly sales spreadsheet",
        content: "엑셀로 월별 매출 자료를 정리했다.",
        tags: ["excel", "sales"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "inferred_weak_activity"],
      eligibleStrengthSignals: [],
      forbiddenStrengthSignals: ["data_analysis", "finance_analysis", "strategy"],
      riskSignals: ["insufficient_ownership_evidence"],
      missingIncludes: ["work_purpose", "judgment_criteria", "result_or_usage"],
      clarificationQuestions: [
        "월별 매출 자료를 어떤 목적과 기준으로 정리했는가?",
        "자료 정리 과정에서 본인이 분석하거나 판단한 항목은 무엇인가?",
        "정리한 자료가 어떤 의사결정이나 후속 행동에 활용되었는가?",
      ],
      requiredSourceFields: [],
    },
  },
  {
    id: "workrecord_meeting_attendance_only",
    workRecords: [
      {
        id: "wr_coord_001",
        recordDate: "2026-06-05",
        source: "work_record",
        title: "Team meeting note",
        content: "개발팀과 디자인팀 회의에 참석하고 회의 내용을 정리했다.",
        tags: ["meeting", "documentation"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "inferred_weak_activity"],
      eligibleStrengthSignals: [],
      forbiddenStrengthSignals: ["cross_functional_collaboration"],
      riskSignals: ["ownership_unclear"],
      missingIncludes: ["user_role", "next_action"],
      clarificationQuestions: [
        "회의에서 본인이 조율하거나 결정한 쟁점은 무엇인가?",
        "회의 정리 이후 본인이 맡은 후속 행동은 무엇인가?",
      ],
      requiredSourceFields,
    },
  },
  {
    id: "workrecord_contradicted_ownership",
    workRecords: [
      {
        id: "wr_pm_003",
        recordDate: "2026-06-06",
        source: "ai_inbox",
        title: "Requirements meeting participation",
        content: "요구사항 정리 회의에 참여했다. 최종 요구사항 정의와 우선순위 결정은 PO가 담당했다.",
        tags: ["product", "requirements"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "contradicted_ownership"],
      eligibleStrengthSignals: [],
      forbiddenStrengthSignals: ["requirements_definition", "prioritization"],
      riskSignals: ["contradicted_ownership"],
      missingIncludes: ["user_role", "judgment_criteria"],
      clarificationQuestions: [
        "회의 참여 중 본인이 직접 정리하거나 결정한 요구사항 범위는 무엇인가?",
        "PO가 결정한 항목과 별도로 본인이 판단한 기준이 있었는가?",
      ],
      requiredSourceFields: [],
    },
  },
  {
    id: "workrecord_explicit_impact",
    workRecords: [
      {
        id: "wr_cs_001",
        recordDate: "2026-06-07",
        source: "work_record",
        title: "FAQ structure improvement",
        content: "고객 문의 유형을 재분류하고 FAQ 구조를 개편해 반복 문의를 줄였다.",
        tags: ["customer", "process"],
      },
    ],
    expected: {
      evidenceLevels: ["explicit_work_action", "explicit_ownership", "explicit_impact"],
      eligibleStrengthSignals: ["customer_issue_analysis", "process_improvement"],
      forbiddenStrengthSignals: [],
      riskSignals: [],
      missingIncludes: [],
      clarificationQuestions: [],
      requiredSourceFields,
    },
  },
  {
    id: "workrecord_missing_context",
    workRecords: [
      {
        id: "wr_context_001",
        recordDate: "2026-06-08",
        source: "work_record",
        title: "Report note",
        content: "리포트 정리 완료.",
        tags: ["report"],
      },
    ],
    expected: {
      evidenceLevels: ["missing_context"],
      eligibleStrengthSignals: [],
      forbiddenStrengthSignals: ["data_analysis", "decision_support", "ownership"],
      riskSignals: ["missing_context"],
      missingIncludes: ["work_purpose", "user_role", "judgment_criteria", "result_or_usage", "impact_metric", "next_action"],
      clarificationQuestions: [
        "어떤 리포트를 어떤 목적을 위해 정리했는가?",
        "리포트 정리에서 본인이 맡은 역할은 무엇인가?",
        "정리 기준이나 판단 기준은 무엇이었는가?",
        "정리한 리포트가 어디에 활용되었는가?",
        "성과나 변화가 있었다면 어떤 수치로 확인되는가?",
        "리포트 정리 이후 다음 행동은 무엇이었는가?",
      ],
      requiredSourceFields: [],
    },
  },
]);
