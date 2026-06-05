function safeString(value) {
  return String(value ?? "").trim();
}

function asTextList(value) {
  if (Array.isArray(value)) return value.map(safeString).filter(Boolean);
  const single = safeString(value);
  return single ? [single] : [];
}

function sourceEntries(input = {}) {
  const entries = [];
  const pushEntry = (sourceField, sourceText, sourceIndex = null, sourceSection = sourceField) => {
    const text = safeString(sourceText);
    if (text) entries.push({ sourceField, sourceText: text, sourceIndex, sourceSection });
  };

  pushEntry("roleTitle", input.roleTitle, null, "roleTitle");
  pushEntry("artifact", input.artifact, null, "artifact");
  asTextList(input.description).forEach((item, index) => {
    pushEntry("description", item, index, "description");
  });

  const context = input.context ?? {};
  for (const [key, value] of Object.entries(context)) {
    pushEntry(`context.${key}`, value, null, "context");
  }

  return entries;
}

function includesAny(text, patterns = []) {
  return patterns.some(({ pattern }) => pattern.test(text));
}

const CONTRADICTION_PATTERNS = [
  /not\s+(responsible|performed|owned|involved|written)/i,
  /only\s+(executed|downloaded|forwarded|uploaded|organized)/i,
  /담당하지\s*않음|수행하지\s*않음|작성하지\s*않음|개선하지\s*않음|결정하지\s*않음/,
  /직접\s*작성하지\s*않음|실행만\s*함|다운로드만\s*함|전달만\s*함|업로드만\s*함|정리만\s*함/,
  /데이터팀이\s*수행|PM이\s*담당|리더가\s*담당|상위자가\s*결정/,
];

const TRACE_DEFINITIONS = {
  requirements_definition: {
    explicit: [/requirements\s+definition|defined\s+requirements|PRD|user\s+story|요구사항\s*정의|PRD\s*작성|사용자\s*스토리/i],
    weak: [/요구사항\s*전달|request\s+forwarding/i],
  },
  prioritization: {
    explicit: [/prioritization|priority\s+decision|우선순위\s*결정|우선순위\s*조정/i],
    weak: [/처리\s*상태\s*업데이트|status\s+update/i],
    contradicted: [/우선순위.*PM이\s*담당|우선순위.*담당하지\s*않음/i],
  },
  post_release_monitoring: {
    explicit: [/post[-\s]?release\s+monitoring|release\s+metric|배포\s*후\s*지표\s*모니터링|배포\s*후\s*모니터링|출시\s*후\s*지표\s*추적/i],
    weak: [/처리\s*완료\s*표시|done\s+status/i],
  },
  problem_definition: {
    explicit: [/problem\s+definition|problem\s+statement|문제\s*정의/i],
    weak: [/개선\s*요청\s*목록|request\s+list/i],
    contradicted: [/문제\s*정의.*담당하지\s*않음/i],
  },
  cross_functional_collaboration: {
    explicit: [/cross[-\s]?functional|developer\s+collaboration|designer\s+collaboration|개발\/디자인\s*협업|개발\s*협업|디자인\s*협업|정책\/플로우\s*설계/i],
    weak: [/개발팀에\s*전달|forwarded\s+to\s+dev/i],
    contradicted: [/정책\/플로우\s*설계.*담당하지\s*않음|정책\s*설계.*PM이\s*담당/i],
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
  },
  dashboard_design: {
    explicit: [/dashboard\s+design|designed\s+dashboard|대시보드\s*설계|대시보드\s*구조\s*설계/i],
    contradicted: [/대시보드\s*설계.*담당하지\s*않음/i],
  },
  decision_support: {
    explicit: [/decision\s+support|management\s+decision|의사결정\s*지원|의사결정\s*회의\s*지원/i],
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
  customer_problem_discovery: {
    explicit: [/customer\s+(problem|pain|need|discovery)|client\s+(problem|pain|need)|고객\s*문제\s*파악|요구사항\s*직접\s*파악|고객\s*요구사항\s*파악/i],
    weak: [/고객사?\s*제안서|client\s+proposal/i],
  },
  voc_analysis: {
    explicit: [/VOC\s*분석|voice\s+of\s+customer|고객\s*문의\s*유형\s*분석|voc\s+analysis/i],
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
  },
  basic_data_organization: {
    weak: [/excel|spreadsheet|sheet|엑셀\s*자료\s*정리|자료\s*정리|파일\s*정리/i],
  },
  decision_authority: {
    explicit: [/^lead$|^recommend$|^recommend_and_follow_up$/i],
  },
};

const DOMAIN_SIGNALS = {
  sales: ["customer_problem_discovery", "proposal_strategy", "commercial_negotiation", "revenue_ownership"],
  cx_strategy: ["voc_analysis", "customer_journey_diagnosis", "support_policy_improvement", "customer_issue_reduction"],
  data_analysis: ["metric_definition", "sql_query_design", "root_cause_analysis", "dashboard_design", "decision_support"],
  product_planning_pm: ["problem_definition", "requirements_definition", "prioritization", "cross_functional_collaboration", "post_release_monitoring"],
};

function patternEntries(signal, level) {
  return (TRACE_DEFINITIONS[signal]?.[level] ?? []).map((pattern) => ({ pattern, level }));
}

function findMatches(entry, signal, level) {
  return patternEntries(signal, level)
    .map(({ pattern }) => {
      const match = entry.sourceText.match(pattern);
      if (!match) return null;
      return {
        matchedPattern: match[0],
        evidenceLevel: level === "weak" ? "inferred_weak" : level,
        confidence: level === "weak" ? "inferred_weak" : level,
        reasonCode: `${level}_${signal}`,
      };
    })
    .filter(Boolean);
}

function hasGeneralContradiction(entry, signal) {
  const definition = TRACE_DEFINITIONS[signal] ?? {};
  const signalPatterns = [
    ...(definition.explicit ?? []),
    ...(definition.weak ?? []),
  ].map((pattern) => ({ pattern }));
  return includesAny(entry.sourceText, signalPatterns) && includesAny(entry.sourceText, CONTRADICTION_PATTERNS.map((pattern) => ({ pattern })));
}

function signalsFor(input = {}, options = {}) {
  if (Array.isArray(options.signals) && options.signals.length) return options.signals;
  if (options.domain && DOMAIN_SIGNALS[options.domain]) return DOMAIN_SIGNALS[options.domain];
  if (input.roleFamily && DOMAIN_SIGNALS[input.roleFamily]) return DOMAIN_SIGNALS[input.roleFamily];
  return [];
}

function makeTrace(signal, entry, match, isContradicted) {
  const evidenceLevel = isContradicted ? "contradicted" : match.evidenceLevel;
  const confidence = isContradicted ? "contradicted" : match.confidence;
  return {
    signal,
    evidenceLevel,
    confidence,
    sourceText: entry.sourceText,
    sourceSection: entry.sourceSection,
    sourceField: entry.sourceField,
    sourceIndex: entry.sourceIndex,
    matchedPattern: match.matchedPattern,
    reasonCode: isContradicted ? `contradicted_${signal}` : match.reasonCode,
    isContradicted,
  };
}

export function buildEvidenceTraceMap(input = {}, options = {}) {
  const tracesBySignal = {};
  const missingSignals = [];
  const contradictedSignals = [];
  const traceWarnings = [];
  const entries = sourceEntries(input);
  const requestedSignals = signalsFor(input, options);

  for (const signal of requestedSignals) {
    const traces = [];
    for (const entry of entries) {
      const contradictedMatches = findMatches(entry, signal, "contradicted");
      for (const match of contradictedMatches) {
        traces.push(makeTrace(signal, entry, match, true));
      }

      const explicitMatches = findMatches(entry, signal, "explicit");
      for (const match of explicitMatches) {
        traces.push(makeTrace(signal, entry, match, hasGeneralContradiction(entry, signal)));
      }

      const weakMatches = findMatches(entry, signal, "weak");
      for (const match of weakMatches) {
        traces.push(makeTrace(signal, entry, match, hasGeneralContradiction(entry, signal)));
      }
    }

    if (traces.length > 0) {
      tracesBySignal[signal] = traces;
      if (traces.some((trace) => trace.isContradicted)) contradictedSignals.push(signal);
    } else {
      missingSignals.push(signal);
    }
  }

  for (const [signal, traces] of Object.entries(tracesBySignal)) {
    if (traces.some((trace) => !trace.sourceText)) traceWarnings.push(`missing_source_text:${signal}`);
  }

  return {
    tracesBySignal,
    missingSignals,
    contradictedSignals: [...new Set(contradictedSignals)],
    traceWarnings,
    appliedToCareerProfile: false,
  };
}
