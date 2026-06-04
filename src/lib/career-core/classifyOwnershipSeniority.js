function safeString(value) {
  return String(value ?? "").trim();
}

function asTextList(value) {
  if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
  const single = safeString(value);
  return single ? [single] : [];
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function buildText(input = {}) {
  return [
    input.roleTitle,
    input.artifact,
    ...asTextList(input.description),
  ]
    .map(safeString)
    .filter(Boolean)
    .join("\n");
}

export function extractOwnershipEvidence(input = {}) {
  const text = buildText(input);
  const context = input.context ?? {};

  return {
    artifact: safeString(input.artifact),
    roleTitle: safeString(input.roleTitle),
    description: asTextList(input.description),
    decisionAuthority: safeString(context.decisionAuthority) || "unknown",
    reviewStructure: safeString(context.reviewStructure) || "unknown",
    accountingJudgment: safeString(context.accountingJudgment) || "unknown",
    actionEvidence: {
      dataEntry: includesAny(text, [/입력|취합|정리|보관|폴더|누락\s*자료|증빙\s*파일/]),
      reconciliation: includesAny(text, [/대사|원장|보조명세|계정별|조정\s*전표|월마감|결산/]),
      analysis: includesAny(text, [/분석|차이|변동|민감도|시나리오|예측|비중\s*변화|이탈\s*지점/]),
      recommendation: includesAny(text, [/제안|개선안|우선순위|논의|제공|비교/]),
      stakeholderExplanation: includesAny(text, [/대표|경영진|외부\s*회계법인|재무\s*영향|설명|회의/]),
      followUp: includesAny(text, [/추적|후속|모니터링|배포\s*후|재요청|확인/]),
    },
  };
}

function classifyArtifactType(evidence) {
  const artifact = `${evidence.artifact} ${evidence.description.join(" ")}`.toLowerCase();
  if (/엑셀|excel|spreadsheet|sheet|모델|리포트/.test(artifact)) return "spreadsheet";
  return "unknown";
}

function classifyRoleFamily(evidence) {
  const text = `${evidence.roleTitle}\n${evidence.artifact}\n${evidence.description.join("\n")}`;

  if (includesAny(text, [/월마감|결산|계정별|원장|보조명세|조정\s*전표|감사\s*대응|회계법인/])) {
    return "accounting_finance";
  }
  if (includesAny(text, [/매출\s*예측|민감도|시나리오|예산\s*배분|영업\s*목표|경영진/])) {
    return "finance_analysis";
  }
  if (includesAny(text, [/근태|급여|연차|초과근무|노무사무소/])) {
    return "hr_operations";
  }
  if (includesAny(text, [/가입\s*단계|퍼널|이탈\s*지점|온보딩|제품팀|후속\s*실험|전환율/])) {
    return "product_operations";
  }
  if (includesAny(text, [/세금계산서|영수증|거래처|매입\/매출|증빙/])) {
    return "accounting_admin";
  }
  if (includesAny(text, [/엑셀|자료\s*정리|표\s*형태/])) {
    return "unknown_admin_support";
  }
  return "unknown_admin_support";
}

function ownershipFromEvidence(evidence, roleFamily) {
  if (evidence.decisionAuthority === "lead") return "lead";
  if (evidence.decisionAuthority === "recommend_and_follow_up") return "recommend_and_follow_up";
  if (evidence.decisionAuthority === "recommend") return "recommend";
  if (evidence.decisionAuthority === "support") return "support";
  if (evidence.decisionAuthority === "none") return "support";
  if (roleFamily === "accounting_finance" && evidence.actionEvidence.reconciliation) return "lead";
  return "unknown";
}

function judgmentFromEvidence(evidence, roleFamily, ownershipLevel) {
  if (roleFamily === "unknown_admin_support") return "unknown";
  if (roleFamily === "accounting_admin") return "low";
  if (roleFamily === "accounting_finance") return "high";
  if (roleFamily === "finance_analysis") return "medium_high";
  if (roleFamily === "product_operations") return "medium_high";
  if (roleFamily === "hr_operations") return "medium_low";
  if (ownershipLevel === "lead") return "high";
  if (ownershipLevel === "recommend" || ownershipLevel === "recommend_and_follow_up") return "medium_high";
  if (ownershipLevel === "support") return "medium_low";
  return "unknown";
}

function seniorityFrom(roleFamily, ownershipLevel, judgmentLevel) {
  if (roleFamily === "unknown_admin_support") return "unknown";
  if (roleFamily === "accounting_admin") return "junior_support";
  if (roleFamily === "accounting_finance" && ownershipLevel === "lead" && judgmentLevel === "high") {
    return "senior_practitioner";
  }
  if (roleFamily === "finance_analysis") return "analyst_or_mid";
  if (roleFamily === "hr_operations") return "junior_or_mid_support";
  if (roleFamily === "product_operations") return "mid_practitioner";
  return ownershipLevel === "support" ? "junior_or_mid_support" : "mid_practitioner";
}

function domainDepthFor(roleFamily) {
  return {
    accounting_admin: "basic_transaction_organization",
    accounting_finance: "monthly_close_and_account_reconciliation",
    finance_analysis: "forecasting_and_scenario_analysis",
    hr_operations: "payroll_input_operations",
    product_operations: "funnel_diagnosis_and_product_ops",
    unknown_admin_support: "insufficient_evidence",
  }[roleFamily] ?? "insufficient_evidence";
}

function confidenceFor(roleFamily) {
  return {
    accounting_admin: "medium_high",
    accounting_finance: "high",
    finance_analysis: "high",
    hr_operations: "medium_high",
    product_operations: "high",
    unknown_admin_support: "low",
  }[roleFamily] ?? "low";
}

function signalsFor(roleFamily) {
  const signals = {
    accounting_admin: {
      strengthSignals: ["document_organization", "transaction_data_entry", "evidence_file_management"],
      riskSignals: ["limited_ownership_evidence", "judgment_scope_unclear"],
      shouldNotInfer: [
        "senior_accounting_judgment",
        "financial_analysis",
        "closing_ownership",
        "audit_response_lead",
      ],
    },
    accounting_finance: {
      strengthSignals: [
        "account_reconciliation",
        "closing_review",
        "variance_analysis",
        "audit_evidence_preparation",
        "financial_issue_explanation",
      ],
      riskSignals: [],
      shouldNotInfer: ["simple_admin_support", "data_entry_only"],
    },
    finance_analysis: {
      strengthSignals: [
        "forecast_modeling",
        "scenario_analysis",
        "business_assumption_structuring",
        "executive_decision_support",
      ],
      riskSignals: ["actual_pnl_ownership_unclear"],
      shouldNotInfer: ["accounting_close_ownership", "payroll_operation"],
    },
    hr_operations: {
      strengthSignals: [
        "payroll_input_preparation",
        "attendance_data_checking",
        "cross_department_follow_up",
        "data_quality_check",
      ],
      riskSignals: ["policy_judgment_scope_unclear"],
      shouldNotInfer: [
        "accounting_finance",
        "senior_payroll_policy_owner",
        "labor_law_judgment_owner",
      ],
    },
    product_operations: {
      strengthSignals: [
        "funnel_analysis",
        "customer_dropoff_diagnosis",
        "product_improvement_recommendation",
        "post_release_monitoring",
        "cross_functional_collaboration",
      ],
      riskSignals: ["experiment_design_depth_unclear"],
      shouldNotInfer: ["accounting_finance", "data_scientist"],
    },
    unknown_admin_support: {
      strengthSignals: ["spreadsheet_usage", "basic_data_organization"],
      riskSignals: ["insufficient_ownership_evidence", "domain_context_missing", "seniority_unclear"],
      shouldNotInfer: [
        "accounting_finance",
        "finance_analysis",
        "product_operations",
        "senior_ownership",
        "domain_expertise",
      ],
    },
  };
  return signals[roleFamily] ?? signals.unknown_admin_support;
}

function explanationBoundaryFor(roleFamily) {
  return {
    accounting_admin: "엑셀 산출물이 있더라도 정해진 양식 입력과 증빙 정리 중심이면 시니어 회계 판단으로 과대평가하지 않는다.",
    accounting_finance: "같은 엑셀이라도 계정 대사, 조정 판단, 감사 대응, 재무 영향 설명 근거가 있으면 시니어 회계 실무로 본다.",
    finance_analysis: "엑셀 사용이 회계처리인지 재무분석인지 구분해야 하며, 예측/민감도/시나리오 근거가 있으면 FP&A 성격으로 본다.",
    hr_operations: "근태/급여 기초자료 엑셀은 회계 결산이 아니라 HR 운영 신호로 분류한다.",
    product_operations: "엑셀 리포트가 제품/운영 개선 의사결정에 연결되면 단순 사무가 아니라 서비스 운영/제품 운영 신호로 본다.",
    unknown_admin_support: "엑셀을 사용했다는 말만으로 회계, 재무분석, 운영기획, 시니어 역량을 추론하면 안 된다.",
  }[roleFamily] ?? "근거가 부족하면 직무 깊이와 소유권을 단정하지 않는다.";
}

function evidenceLevelFor(roleFamily) {
  return roleFamily === "unknown_admin_support" ? "inferred_weak" : "explicit";
}

export function classifyOwnershipSeniority(input = {}) {
  const evidence = extractOwnershipEvidence(input);
  const artifactType = classifyArtifactType(evidence);
  const roleFamily = classifyRoleFamily(evidence);
  const ownershipLevel = ownershipFromEvidence(evidence, roleFamily);
  const judgmentLevel = judgmentFromEvidence(evidence, roleFamily, ownershipLevel);
  const seniorityLevel = seniorityFrom(roleFamily, ownershipLevel, judgmentLevel);
  const signalSet = signalsFor(roleFamily);

  return {
    artifactType,
    roleFamily,
    seniorityLevel,
    ownershipLevel,
    judgmentLevel,
    domainDepth: domainDepthFor(roleFamily),
    evidenceLevel: evidenceLevelFor(roleFamily),
    shouldNotInfer: signalSet.shouldNotInfer,
    strengthSignals: signalSet.strengthSignals,
    riskSignals: signalSet.riskSignals,
    explanationBoundary: explanationBoundaryFor(roleFamily),
    confidence: confidenceFor(roleFamily),
    evidence,
    appliedToCareerProfile: false,
  };
}
