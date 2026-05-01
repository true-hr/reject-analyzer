// src/lib/analysis/axisEvidence/axisSignalResolvers.js
// Pilot axis signal resolvers — 5 groups, 18 axes
//
// These are semantic mappings from canonical input fields to axis evidence.
// InputSignals in B-grade assets are descriptive Korean strings, not machine keys.
// Mapping is by axis semantic intent, not by inputSignals string matching.
//
// Canonical field access pattern:
//   canonical.role.current     → { value, status, sourceKey }
//   canonical.industry.current → { value, status, sourceKey }
//   canonical.companySize.*    → { value, status, sourceKey }
//   canonical.salary.*         → { value, status, sourceKey }
//   canonical.career.*         → raw object (totalYears, gapMonths, jobChanges, lastTenureMonths, leadershipLevel)

// ─── helpers ─────────────────────────────────────────────────────────────────

function __cField(canonical, domain, key) {
  return canonical?.[domain]?.[key] ?? null;
}

function __known(field) {
  return field?.status === "known" && Boolean(field?.value);
}

function __status(field) {
  return field?.status ?? "empty";
}

function __salaryNum(val) {
  if (!val) return null;
  const n = Number(String(val).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function __career(canonical, key) {
  const v = canonical?.career?.[key];
  return v != null ? v : null;
}

function __evBase(entry) {
  return {
    axisId:          entry.id,
    categoryId:      entry.categoryId,
    subcategoryId:   entry.subcategoryId,
    rawInputs:       [],
    resolvedSignals: [],
    missingSignals:  [],
    comparison:      { hasComparablePair: false, relation: null, summaryKey: null, delta: null },
    sourceRefs:      [],
    notes:           [],
  };
}

function __finalStatus(resolvedCount, totalRequired, hasNa) {
  if (hasNa)                           return "not_applicable";
  if (resolvedCount === 0)             return "missing";
  if (resolvedCount < totalRequired)   return "partial";
  return "resolved";
}

function __confidence(resolvedCount, totalRequired) {
  if (totalRequired === 0) return 0;
  return +(resolvedCount / totalRequired).toFixed(2);
}

// generic fallback for unregistered axes
function __resolveGeneric(canonical, asset, entry) {
  const ev = __evBase(entry);
  ev.status     = "missing";
  ev.confidence = 0;
  ev.notes.push("no_pilot_resolver_registered");
  return ev;
}

// ─── shared builder ───────────────────────────────────────────────────────────

function __resolveFromFields(canonical, entry, canonicalFields, careerFields) {
  const ev = __evBase(entry);
  let resolvedCount = 0;
  let hasNa = false;

  for (const { key, domain, subkey, label } of canonicalFields) {
    const field = __cField(canonical, domain, subkey);
    const st    = __status(field);
    ev.rawInputs.push({ key, value: field?.value ?? null, status: st, sourceKey: field?.sourceKey ?? null });
    ev.sourceRefs.push({ key, sourceKey: field?.sourceKey ?? domain });
    if (st === "na") { hasNa = true; continue; }
    if (__known(field)) {
      ev.resolvedSignals.push({ key, value: field.value, label });
      resolvedCount++;
    } else {
      ev.missingSignals.push({ key, label, reason: `status:${st}` });
    }
  }

  for (const { key, label } of (careerFields ?? [])) {
    const val = __career(canonical, key);
    const st  = val != null ? "known" : "empty";
    ev.rawInputs.push({ key, value: val, status: st, sourceKey: `career.${key}` });
    ev.sourceRefs.push({ key, sourceKey: `career.${key}` });
    if (val != null) {
      ev.resolvedSignals.push({ key, value: val, label });
      resolvedCount++;
    } else {
      ev.missingSignals.push({ key, label, reason: "not_in_career" });
    }
  }

  const total = canonicalFields.length + (careerFields?.length ?? 0);
  ev.status     = __finalStatus(resolvedCount, total, hasNa);
  ev.confidence = __confidence(resolvedCount, total);
  return ev;
}

// ─── GROUP 1: COMPENSATION ───────────────────────────────────────────────────

function resolveCurrentCompensationLevel(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [
      { key: "salaryCurrent", domain: "salary", subkey: "current", label: "현재 고정 연봉" },
      { key: "roleCurrent",   domain: "role",   subkey: "current", label: "현재 직무/역할" },
    ],
    [{ key: "totalYears", label: "총 경력 연수" }]
  );
}

function resolveTargetSalaryJumpIntensity(canonical, asset, entry) {
  const ev = __resolveFromFields(canonical, entry, [
    { key: "salaryCurrent", domain: "salary", subkey: "current", label: "현재 연봉" },
    { key: "salaryTarget",  domain: "salary", subkey: "target",  label: "목표 연봉" },
  ]);
  const curField = __cField(canonical, "salary", "current");
  const tgtField = __cField(canonical, "salary", "target");
  if (__known(curField) && __known(tgtField)) {
    const cur = __salaryNum(curField.value);
    const tgt = __salaryNum(tgtField.value);
    if (cur && tgt) {
      const delta = +((tgt - cur) / cur).toFixed(3);
      ev.comparison = {
        hasComparablePair: true,
        relation:   delta > 0 ? "jump" : delta < 0 ? "drop" : "flat",
        summaryKey: Math.abs(delta) >= 0.3 ? "steep_jump" : Math.abs(delta) >= 0.15 ? "moderate_jump" : "flat_or_minor",
        delta,
      };
    }
  }
  return ev;
}

function resolveCompMarketValuePosition(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [
      { key: "salaryCurrent", domain: "salary", subkey: "current", label: "현재 연봉" },
      { key: "roleCurrent",   domain: "role",   subkey: "current", label: "현재 직무" },
      { key: "roleTarget",    domain: "role",   subkey: "target",  label: "목표 직무" },
    ],
    [{ key: "totalYears", label: "총 경력 연수" }]
  );
}

function resolveSalaryGrowthLogicFit(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [
      { key: "salaryCurrent", domain: "salary", subkey: "current", label: "현재 연봉" },
      { key: "salaryTarget",  domain: "salary", subkey: "target",  label: "목표 연봉" },
    ],
    [
      { key: "jobChanges", label: "이직 횟수" },
      { key: "totalYears", label: "총 경력 연수" },
    ]
  );
}

function resolveCompensationExpectedRoleLevel(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry, [
    { key: "salaryTarget", domain: "salary", subkey: "target", label: "목표 연봉" },
    { key: "roleTarget",   domain: "role",   subkey: "target", label: "목표 직무" },
  ]);
}

// ─── GROUP 2: ROLE LEVEL (level_position_fit) ─────────────────────────────────

function resolveLevelYearsExpectationFit(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [{ key: "roleTarget", domain: "role", subkey: "target", label: "목표 직무" }],
    [{ key: "totalYears", label: "총 경력 연수" }]
  );
}

function resolveRoleScopeFit(canonical, asset, entry) {
  const ev = __resolveFromFields(canonical, entry, [
    { key: "roleCurrent", domain: "role", subkey: "current", label: "현재 직무" },
    { key: "roleTarget",  domain: "role", subkey: "target",  label: "목표 직무" },
  ]);
  const curField = __cField(canonical, "role", "current");
  const tgtField = __cField(canonical, "role", "target");
  if (__known(curField) && __known(tgtField)) {
    ev.comparison = {
      hasComparablePair: true,
      relation:   curField.value === tgtField.value ? "same" : "different",
      summaryKey: "role_pair",
      delta:      null,
    };
  }
  return ev;
}

function resolveResponsibilityDepthFit(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [
      { key: "roleCurrent", domain: "role", subkey: "current", label: "현재 직무" },
      { key: "roleTarget",  domain: "role", subkey: "target",  label: "목표 직무" },
    ],
    [{ key: "totalYears", label: "총 경력 연수" }]
  );
}

function resolveDecisionDistanceFit(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [
      { key: "roleCurrent", domain: "role", subkey: "current", label: "현재 직무" },
      { key: "roleTarget",  domain: "role", subkey: "target",  label: "목표 직무" },
    ],
    [{ key: "leadershipLevel", label: "리더십 수준" }]
  );
}

function resolveLevelSeniorityEstimationFit(canonical, asset, entry) {
  return __resolveFromFields(canonical, entry,
    [
      { key: "roleCurrent", domain: "role", subkey: "current", label: "현재 직무" },
      { key: "roleTarget",  domain: "role", subkey: "target",  label: "목표 직무" },
    ],
    [{ key: "totalYears", label: "총 경력 연수" }]
  );
}

// ─── GROUP 3: INDUSTRY TRANSITION ────────────────────────────────────────────

function resolveIndustryTransition(canonical, asset, entry) {
  const ev = __resolveFromFields(canonical, entry, [
    { key: "industryCurrent", domain: "industry", subkey: "current", label: "현재 산업" },
    { key: "industryTarget",  domain: "industry", subkey: "target",  label: "목표 산업" },
  ]);
  const curField = __cField(canonical, "industry", "current");
  const tgtField = __cField(canonical, "industry", "target");
  if (__known(curField) && __known(tgtField)) {
    const sameIndustry = curField.value === tgtField.value;
    ev.comparison = {
      hasComparablePair: true,
      relation:   sameIndustry ? "same" : "different",
      summaryKey: sameIndustry ? "industry_stay" : "industry_transition",
      delta:      null,
    };
  }
  return ev;
}

// ─── GROUP 4: ORG SCALE ──────────────────────────────────────────────────────

function resolveOrgScale(canonical, asset, entry) {
  const ev = __resolveFromFields(canonical, entry, [
    { key: "companySizeCurrent", domain: "companySize", subkey: "current", label: "현재 기업 규모" },
    { key: "companySizeTarget",  domain: "companySize", subkey: "target",  label: "목표 기업 규모" },
  ]);
  const curField = __cField(canonical, "companySize", "current");
  const tgtField = __cField(canonical, "companySize", "target");
  if (__known(curField) && __known(tgtField)) {
    ev.comparison = {
      hasComparablePair: true,
      relation:   curField.value === tgtField.value ? "same" : "different",
      summaryKey: "size_pair",
      delta:      null,
    };
  }
  return ev;
}

// ─── GROUP 5: MANAGEMENT SCOPE ───────────────────────────────────────────────

function resolveLeadershipScope(canonical, asset, entry) {
  const leadershipLevel = __career(canonical, "leadershipLevel");
  const roleCurrent     = __cField(canonical, "role", "current");
  const roleTarget      = __cField(canonical, "role", "target");

  const fields = [
    { key: "leadershipLevel", value: leadershipLevel, status: leadershipLevel != null ? "known" : "empty", sourceKey: "career.leadershipLevel" },
    { key: "roleCurrent",     value: roleCurrent?.value ?? null, status: __status(roleCurrent), sourceKey: roleCurrent?.sourceKey ?? null },
    { key: "roleTarget",      value: roleTarget?.value  ?? null, status: __status(roleTarget),  sourceKey: roleTarget?.sourceKey  ?? null },
  ];

  const ev = __evBase(entry);
  let resolvedCount = 0;
  let hasNa = false;

  for (const { key, value, status, sourceKey } of fields) {
    ev.rawInputs.push({ key, value, status, sourceKey });
    ev.sourceRefs.push({ key, sourceKey: sourceKey ?? key });
    if (status === "na") { hasNa = true; continue; }
    if (status === "known" && value != null) {
      ev.resolvedSignals.push({ key, value, label: key });
      resolvedCount++;
    } else {
      ev.missingSignals.push({ key, label: key, reason: `status:${status}` });
    }
  }

  ev.status     = __finalStatus(resolvedCount, fields.length, hasNa);
  ev.confidence = __confidence(resolvedCount, fields.length);
  return ev;
}

// ─── RESOLVER DISPATCH MAP ───────────────────────────────────────────────────
// @MX:ANCHOR: [AUTO] Primary pilot resolver registry; extend here to activate new axes
// @MX:REASON: all axis signal resolution routes through this map; fan_in grows with each registered axis

const __RESOLVERS = {
  // GROUP 1: compensation
  INPUT_CURRENT_COMPENSATION_LEVEL:       resolveCurrentCompensationLevel,
  INPUT_TARGET_SALARY_JUMP_INTENSITY:     resolveTargetSalaryJumpIntensity,
  INPUT_COMP_MARKET_VALUE_POSITION:       resolveCompMarketValuePosition,
  INPUT_SALARY_GROWTH_LOGIC_FIT:          resolveSalaryGrowthLogicFit,
  INPUT_COMPENSATION_EXPECTED_ROLE_LEVEL: resolveCompensationExpectedRoleLevel,
  // GROUP 2: role level
  INPUT_LEVEL_YEARS_EXPECTATION_FIT:      resolveLevelYearsExpectationFit,
  INPUT_ROLE_SCOPE_FIT:                   resolveRoleScopeFit,
  INPUT_RESPONSIBILITY_DEPTH_FIT:         resolveResponsibilityDepthFit,
  INPUT_DECISION_DISTANCE_FIT:            resolveDecisionDistanceFit,
  INPUT_LEVEL_SENIORITY_ESTIMATION_FIT:   resolveLevelSeniorityEstimationFit,
  // GROUP 3: industry transition
  INPUT_INDUSTRY_TRANSITION:              resolveIndustryTransition,
  // GROUP 4: org scale
  INPUT_COMPANY_SIZE_TRANSITIONALITY:     resolveOrgScale,
  INPUT_COMPANY_SIZE_MISMATCH_RISK:       resolveOrgScale,
  // GROUP 5: management scope
  INPUT_LEADERSHIP_EXPERIENCE_FIT:              resolveLeadershipScope,
  INPUT_LEADERSHIP_OVER_OR_UNDER_SIGNAL:        resolveLeadershipScope,
  INPUT_LEADERSHIP_EXPERIENCE_OFFSET_POTENTIAL: resolveLeadershipScope,
};

/**
 * resolveAxisSignals
 * @param {string} axisId
 * @param {object|null} canonical  — canonicalInput.canonical
 * @param {object} asset           — full asset from getAxisAssetById
 * @param {object} entry           — registry entry
 * @returns {object}               — axisEvidence
 */
export function resolveAxisSignals(axisId, canonical, asset, entry) {
  const resolver = __RESOLVERS[axisId];
  if (!resolver) return __resolveGeneric(canonical, asset, entry);
  return resolver(canonical, asset, entry);
}
