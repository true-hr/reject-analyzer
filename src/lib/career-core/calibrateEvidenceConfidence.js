function safeString(value) {
  return String(value ?? "").trim();
}

function asTextList(value) {
  if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
  const single = safeString(value);
  return single ? [single] : [];
}

function buildText(input = {}) {
  const evidence = input.evidence ?? {};
  if (safeString(evidence.rawText)) return safeString(evidence.rawText);
  return [
    input.roleTitle ?? evidence.roleTitle,
    input.artifact ?? evidence.artifact,
    ...asTextList(input.description ?? evidence.description),
  ]
    .map(safeString)
    .filter(Boolean)
    .join("\n");
}

function includesAny(text, patterns = []) {
  return patterns.some((pattern) => pattern.test(text));
}

function lineList(text) {
  return safeString(text).split(/\r?\n/).map(safeString).filter(Boolean);
}

const CONTRADICTION_PATTERNS = [
  /not\s+(responsible|performed|owned|involved)/i,
  /only\s+(executed|downloaded|forwarded|uploaded|organized)/i,
  /담당하지\s*않음|수행하지\s*않음|작성하지\s*않음|개선하지\s*않음|결정하지\s*않음/,
  /실행만\s*함|다운로드만\s*함|전달만\s*함|업로드만\s*함|정리만\s*함/,
  /데이터팀이\s*수행|PM이\s*담당|리더가\s*담당|상위자가\s*결정/,
];

const WEAK_ADMIN_PATTERNS = [
  /excel|spreadsheet|sheet/i,
  /엑셀\s*자료\s*정리|자료\s*정리|파일\s*정리/,
];

const SIGNAL_DEFINITIONS = {
  customer_problem_discovery: {
    explicit: [/customer\s+(problem|pain|need|discovery)|client\s+(problem|pain|need)|고객\s*문제\s*파악|요구사항\s*직접\s*파악|고객\s*요구사항\s*파악/i],
    weak: [/고객사?\s*제안서|client\s+proposal/i],
  },
  proposal_strategy: {
    explicit: [/proposal\s+strategy|solution\s+proposal|deal\s+strategy|제안\s*전략\s*구성|제안\s*전략/i],
    weak: [/제안서\s*(파일\s*)?정리|proposal\s+(file\s*)?formatting/i],
    contradicted: [/전략.*담당하지\s*않음|proposal\s+strategy.*not\s+responsible/i],
  },
  commercial_negotiation: {
    explicit: [/pricing\s+negotiation|scope\s+negotiation|commercial\s+negotiation|가격\s*협상|도입\s*범위\s*협상|범위\s*협상/i],
    weak: [/가격표\s*붙여넣기|price\s+table\s+copy/i],
    contradicted: [/협상.*담당하지\s*않음|negotiation.*not\s+responsible/i],
  },
  revenue_ownership: {
    explicit: [/contract\s+follow[-\s]?up|won\s+deal|booking|계약\s*전환|수주\s*기여|수주\s*후속|의사결정자\s*미팅\s*주도/i],
    weak: [/수주\s*현황\s*정리|deal\s+status\s+update/i],
    contradicted: [/수주.*담당하지\s*않음|계약.*담당하지\s*않음|revenue.*not\s+responsible/i],
  },
  campaign_hypothesis: {
    explicit: [/campaign\s+hypothesis|growth\s+hypothesis|캠페인\s*가설\s*수립|캠페인\s*가설/i],
    weak: [/SNS\s*업로드|콘텐츠\s*업로드|content\s+upload/i],
    contradicted: [/전략.*담당하지\s*않음|실험.*담당하지\s*않음|campaign.*not\s+responsible/i],
  },
  creative_ab_testing: {
    explicit: [/a\/b\s+test|ab\s+test|creative\s+test|소재\s*A\/B\s*테스트|소재\s*AB\s*테스트/i],
    weak: [/좋아요\s*수\s*기록|like\s+count/i],
    contradicted: [/실험.*담당하지\s*않음|A\/B.*담당하지\s*않음/i],
  },
  performance_metric_analysis: {
    explicit: [/CPA|conversion\s+rate|ROAS|performance\s+metric|전환율\s*분석|ROAS\s*분석|CPA\s*분석|성과\s*분석/i],
    weak: [/조회수\s*기록|좋아요\s*수\s*기록|view\s+count/i],
  },
  budget_optimization: {
    explicit: [/budget\s+(optimization|allocation)|targeting\s+adjustment|예산\s*배분|예산\s*조정|타겟\s*세그먼트|타겟팅\s*조정|고성과\s*소재\s*중심\s*개선/i],
    weak: [/예산\s*집행\s*내역\s*정리|budget\s+status/i],
    contradicted: [/예산.*담당하지\s*않음|budget.*not\s+responsible/i],
  },
  voc_analysis: {
    explicit: [/VOC\s*분석|voice\s+of\s+customer|고객\s*문의\s*유형\s*분석|voc\s+analysis/i],
    strong: [/고객\s*문의\s*유형.*분석|문의\s*유형.*분류/i],
    weak: [/고객\s*문의\s*배정|문의\s*배정|ticket\s+routing/i],
    contradicted: [/VOC\s*분석.*담당하지\s*않음|VOC\s*분석.*직접\s*작성하지\s*않음/i],
  },
  customer_journey_diagnosis: {
    explicit: [/customer\s+journey|고객\s*여정\s*문제\s*정의|고객\s*여정\s*진단|접점\s*문제\s*정의/i],
    weak: [/처리\s*상태\s*업데이트|status\s+update/i],
  },
  support_policy_improvement: {
    explicit: [/support\s+policy|response\s+guide|상담\s*정책\s*개선|응대\s*가이드\s*개선|상담\s*가이드\s*개선/i],
    weak: [/응대\s*템플릿\s*정리|guide\s+formatting/i],
    contradicted: [/상담\s*정책.*리더가\s*담당|정책\s*설계.*담당하지\s*않음|policy.*not\s+responsible/i],
  },
  customer_issue_reduction: {
    explicit: [/repeat\s+inquiry\s+reduction|tracked\s+reduction|반복\s*문의\s*감소|처리\s*시간\s*개선|개선\s*후\s*지표\s*추적/i],
    strong: [/반복\s*문의\s*감소.*추적|처리\s*시간.*개선/i],
  },
  metric_definition: {
    explicit: [/metric\s+definition|KPI\s*definition|지표\s*정의|리텐션\s*KPI|KPI\s*정의/i],
    weak: [/데이터\s*다운로드|data\s+download/i],
    contradicted: [/지표\s*정의.*데이터팀이\s*수행|metric\s+definition.*not\s+responsible/i],
  },
  sql_query_design: {
    explicit: [/wrote\s+sql|authored\s+sql|sql\s+(query\s+)?design|SQL\s*쿼리(를)?\s*직접\s*작성|SQL\s*직접\s*작성/i],
    weak: [/정해진\s*SQL\s*실행|SQL\s*실행|sql\s+export/i],
    contradicted: [/정해진\s*SQL.*실행만\s*함|SQL.*실행만\s*함|sql.*executed\s+only/i],
  },
  root_cause_analysis: {
    explicit: [/root\s+cause|cause\s+analysis|원인\s*분석|전환율\s*하락\s*원인|진단\s*분석/i],
    strong: [/전환율\s*하락\s*원인.*분석|conversion\s+drop.*analysis/i],
  },
  dashboard_design: {
    explicit: [/dashboard\s+design|designed\s+dashboard|대시보드\s*설계|대시보드\s*구조\s*설계/i],
    strong: [/대시보드.*주간\s*의사결정|dashboard.*decision/i],
    contradicted: [/대시보드\s*설계.*담당하지\s*않음/i],
  },
  decision_support: {
    explicit: [/decision\s+support|management\s+decision|의사결정\s*지원|의사결정\s*회의\s*지원/i],
    strong: [/주간\s*의사결정\s*회의에\s*제공|provided.*decision/i],
  },
  problem_definition: {
    explicit: [/problem\s+definition|problem\s+statement|문제\s*정의/i],
    weak: [/개선\s*요청\s*목록|request\s+list/i],
    contradicted: [/문제\s*정의.*담당하지\s*않음/i],
  },
  requirements_definition: {
    explicit: [/requirements\s+definition|defined\s+requirements|PRD|user\s+story|요구사항\s*정의|PRD\s*작성|사용자\s*스토리/i],
    weak: [/요구사항\s*전달|request\s+forwarding/i],
  },
  prioritization: {
    explicit: [/prioritization|priority\s+decision|우선순위\s*결정|우선순위\s*조정/i],
    weak: [/처리\s*상태\s*업데이트|status\s+update/i],
    contradicted: [/우선순위.*PM이\s*담당|우선순위.*담당하지\s*않음/i],
  },
  cross_functional_collaboration: {
    explicit: [/cross[-\s]?functional|developer\s+collaboration|designer\s+collaboration|개발\/디자인\s*협업|개발\s*협업|디자인\s*협업|정책\/플로우\s*설계/i],
    weak: [/개발팀에\s*전달|forwarded\s+to\s+dev/i],
    contradicted: [/정책\/플로우\s*설계.*담당하지\s*않음|정책\s*설계.*PM이\s*담당/i],
  },
  post_release_monitoring: {
    explicit: [/post[-\s]?release\s+monitoring|release\s+metric|배포\s*후\s*지표\s*모니터링|배포\s*후\s*모니터링|출시\s*후\s*지표\s*추적/i],
    weak: [/처리\s*완료\s*표시|done\s+status/i],
  },
  basic_data_organization: {
    weak: WEAK_ADMIN_PATTERNS,
  },
};

const DOMAIN_SIGNALS = {
  sales: ["customer_problem_discovery", "proposal_strategy", "commercial_negotiation", "revenue_ownership"],
  growth_marketing: ["campaign_hypothesis", "creative_ab_testing", "performance_metric_analysis", "budget_optimization"],
  cx_strategy: ["voc_analysis", "customer_journey_diagnosis", "support_policy_improvement", "customer_issue_reduction"],
  customer_experience_operations: ["voc_analysis", "customer_journey_diagnosis", "support_policy_improvement", "customer_issue_reduction"],
  data_analysis: ["metric_definition", "sql_query_design", "root_cause_analysis", "dashboard_design", "decision_support"],
  product_planning_pm: ["problem_definition", "requirements_definition", "prioritization", "cross_functional_collaboration", "post_release_monitoring"],
  service_planning: ["problem_definition", "requirements_definition", "prioritization", "cross_functional_collaboration", "post_release_monitoring"],
};

function signalMatches(text, signalName) {
  const signal = SIGNAL_DEFINITIONS[signalName] ?? {};
  return includesAny(text, [
    ...(signal.explicit ?? []),
    ...(signal.strong ?? []),
    ...(signal.weak ?? []),
    ...(signal.contradicted ?? []),
  ]);
}

function inferSignals(input, text) {
  if (Array.isArray(input.signals) && input.signals.length) return input.signals;
  if (input.domain && DOMAIN_SIGNALS[input.domain]) return DOMAIN_SIGNALS[input.domain];
  if (input.roleFamily && DOMAIN_SIGNALS[input.roleFamily]) return DOMAIN_SIGNALS[input.roleFamily];
  if (input.evidence?.roleFamily && DOMAIN_SIGNALS[input.evidence.roleFamily]) {
    return DOMAIN_SIGNALS[input.evidence.roleFamily];
  }
  if (Array.isArray(input.strengthSignals) && input.strengthSignals.length) {
    return input.strengthSignals.filter((signal) => SIGNAL_DEFINITIONS[signal]);
  }

  const scores = Object.entries(DOMAIN_SIGNALS).map(([domain, signals]) => ({
    domain,
    score: signals.filter((signal) => signalMatches(text, signal)).length,
  }));
  const best = scores.sort((a, b) => b.score - a.score)[0];
  if (best?.score > 0) return DOMAIN_SIGNALS[best.domain];
  if (includesAny(text, WEAK_ADMIN_PATTERNS)) return ["basic_data_organization"];
  return [];
}

function hasContradictionForSignal(lines, signalName) {
  const signal = SIGNAL_DEFINITIONS[signalName] ?? {};
  if (lines.some((line) => includesAny(line, signal.contradicted ?? []))) return true;
  return lines.some((line) => {
    const hasSignalText = includesAny(line, [
      ...(signal.explicit ?? []),
      ...(signal.strong ?? []),
      ...(signal.weak ?? []),
    ]);
    return hasSignalText && includesAny(line, CONTRADICTION_PATTERNS);
  });
}

function confidenceForSignal(lines, signalName) {
  const signal = SIGNAL_DEFINITIONS[signalName] ?? {};
  if (hasContradictionForSignal(lines, signalName)) return "contradicted";
  if (lines.some((line) => includesAny(line, signal.explicit ?? []))) return "explicit";
  if (lines.some((line) => includesAny(line, signal.strong ?? []))) return "inferred_strong";
  if (lines.some((line) => includesAny(line, signal.weak ?? []))) return "inferred_weak";
  return "absent";
}

function overallConfidence(levels) {
  if (levels.includes("contradicted")) return "contradicted";
  if (levels.length > 0 && levels.every((level) => level === "explicit")) return "explicit";
  const strongCount = levels.filter((level) => level === "explicit" || level === "inferred_strong").length;
  if (strongCount >= 2) return "inferred_strong";
  if (levels.includes("explicit") || levels.includes("inferred_strong") || levels.includes("inferred_weak")) {
    return "inferred_weak";
  }
  return "absent";
}

export function calibrateEvidenceConfidence(inputOrClassification = {}, options = {}) {
  const input = { ...inputOrClassification, ...options };
  const text = buildText(inputOrClassification);
  const lines = lineList(text);
  const signalNames = inferSignals(input, text);
  const evidenceConfidenceBySignal = {};

  for (const signalName of signalNames) {
    evidenceConfidenceBySignal[signalName] = confidenceForSignal(lines, signalName);
  }

  const levels = Object.values(evidenceConfidenceBySignal);
  const positiveEvidenceCount = levels.filter((level) => level === "explicit" || level === "inferred_strong").length;
  const weakEvidenceCount = levels.filter((level) => level === "inferred_weak").length;
  const contradictedEvidenceCount = levels.filter((level) => level === "contradicted").length;
  const absentEvidenceCount = levels.filter((level) => level === "absent").length;
  const overallEvidenceConfidence = overallConfidence(levels);
  const shouldDowngrade = contradictedEvidenceCount > 0 || overallEvidenceConfidence === "inferred_weak";
  const shouldAskClarification = shouldDowngrade || overallEvidenceConfidence === "absent" || absentEvidenceCount > positiveEvidenceCount;
  const confidenceWarnings = [];

  if (contradictedEvidenceCount > 0) confidenceWarnings.push("contradicted_evidence_present");
  if (weakEvidenceCount > 0) confidenceWarnings.push("weak_evidence_present");
  if (absentEvidenceCount > 0) confidenceWarnings.push("absent_evidence_present");

  return {
    overallEvidenceConfidence,
    evidenceConfidenceBySignal,
    positiveEvidenceCount,
    weakEvidenceCount,
    contradictedEvidenceCount,
    absentEvidenceCount,
    confidenceWarnings,
    shouldDowngrade,
    shouldAskClarification,
    appliedToCareerProfile: false,
  };
}
