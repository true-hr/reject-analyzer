import { roleDistance } from "../../roleDistance.js";

const COMPANY_SIZE_LEVEL = {
  unknown: 0,
  startup: 1,
  small_mid: 2,
  mid_large: 3,
  large: 4,
  public: 4,
};

const ROLE_DISTANCE_THRESHOLD = 3;

function toStr(v) {
  return (v ?? "").toString().trim();
}

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function clamp01(v) {
  if (!Number.isFinite(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function normalizeCompanySize(v) {
  const s = toStr(v).toLowerCase();
  if (!s) return "unknown";

  if (s === "startup" || s.includes("스타트업")) return "startup";
  if (
    s === "small_mid" ||
    s.includes("중소") ||
    s.includes("강소")
  ) return "small_mid";
  if (s === "mid_large" || s.includes("중견")) return "mid_large";
  if (s === "large" || s.includes("대기업")) return "large";
  if (s === "public" || s.includes("공공") || s.includes("기관")) return "public";
  if (s === "unknown") return "unknown";
  return "unknown";
}

function normalizeLeadershipLevel(v) {
  const s = toStr(v).toLowerCase();
  if (!s) return "";
  if (s === "individual" || s === "ic") return "individual";
  if (
    s === "team_lead" ||
    s === "lead" ||
    s === "manager" ||
    s === "mgr" ||
    s === "head"
  ) return "manager";
  if (s === "executive" || s === "director" || s === "vp" || s === "c-level") return "executive";
  return "";
}

function normalizeTargetRoleDemandLevel(state) {
  const explicit = toStr(state?.targetRoleLevel || state?.roleTargetLevel || state?.levelTarget).toLowerCase();
  if (explicit) {
    if (/(executive|director|vp|head|임원|디렉터)/i.test(explicit)) return "manager_plus";
    if (/(manager|mgr|lead|team_lead|팀장|파트장|리드)/i.test(explicit)) return "manager_plus";
    if (/(individual|ic|실무자)/i.test(explicit)) return "individual";
  }

  const roleText = toStr(state?.roleTarget || state?.targetRole || state?.role);
  if (/(manager|mgr|lead|head|director|vp|팀장|파트장|리드|매니저|임원)/i.test(roleText)) {
    return "manager_plus";
  }

  return "individual";
}

function hasLargeOrgEvidence(state, ai) {
  const text = [
    state?.resumeText,
    state?.resume,
    state?.resumeMergedText,
    state?.mergedResumeText,
    state?.jdText,
    state?.jd,
    ai?.summary,
    ai?.reasoning,
  ]
    .map((v) => toStr(v).toLowerCase())
    .filter(Boolean)
    .join("\n");

  if (!text) return false;

  const keywords = [
    "cross-functional",
    "stakeholder",
    "reporting",
    "enterprise",
    "multi-team",
    "coordination",
  ];

  return keywords.some((kw) => text.includes(kw));
}

function computeCompanySizeJump(ctx) {
  const state = ctx?.state || {};
  const ai = ctx?.ai || {};

  const currentSizeRaw =
    state?.companySize ??
    state?.companySizeCandidate ??
    state?.detectedCompanySizeCandidate ??
    "unknown";
  const targetSizeRaw =
    state?.companySizeTarget ??
    state?.targetCompanySize ??
    state?.detectedCompanySizeTarget ??
    "unknown";

  const currentSize = normalizeCompanySize(currentSizeRaw);
  const targetSize = normalizeCompanySize(targetSizeRaw);

  const currentLevel = COMPANY_SIZE_LEVEL[currentSize] ?? 0;
  const targetLevel = COMPANY_SIZE_LEVEL[targetSize] ?? 0;
  const sizeGap = targetLevel - currentLevel;

  if (sizeGap < 2) {
    return {
      triggered: false,
      score: 0,
      severity: "none",
      reasons: [],
      sizeGap,
      currentSize,
      targetSize,
      currentLevel,
      targetLevel,
      roleDistanceValue: null,
      totalYears: toNum(state?.career?.totalYears ?? state?.totalYears, 0),
      roleTransition: false,
      roleMatch: false,
      leadershipGap: false,
      largeOrgEvidence: false,
    };
  }

  const roleCurrent = toStr(state?.currentRole || state?.roleCurrent || ai?.role || "");
  const roleTarget = toStr(
    state?.roleTarget ||
      state?.targetRole ||
      state?.role ||
      ai?.roleInference?.fineRole ||
      ai?.roleInference?.familyRole ||
      ""
  );

  const rd = roleDistance(roleCurrent, roleTarget);
  const roleDistanceValue = Number.isFinite(rd?.distance) ? rd.distance : Infinity;

  const roleTransition = roleDistanceValue >= ROLE_DISTANCE_THRESHOLD;
  const roleMatch = roleDistanceValue === 0;

  const totalYears = toNum(state?.career?.totalYears ?? state?.totalYears, 0);
  const leadershipLevel = normalizeLeadershipLevel(state?.career?.leadershipLevel ?? state?.leadershipLevel);
  const targetRoleDemand = normalizeTargetRoleDemandLevel(state);
  const leadershipGap = targetRoleDemand === "manager_plus" && leadershipLevel === "individual";

  const largeOrgEvidence = hasLargeOrgEvidence(state, ai);

  let score = 0;

  if (sizeGap === 2) score += 2;
  if (sizeGap >= 3) score += 3;

  if (roleTransition) score += 2;

  if (totalYears < 3) score += 2;
  else if (totalYears < 5) score += 1;

  if (leadershipGap) score += 2;

  if (roleMatch) score -= 2;
  if (totalYears >= 5) score -= 1;
  if (totalYears >= 7) score -= 1;

  if (leadershipLevel === "manager" || leadershipLevel === "executive") score -= 1;

  if (largeOrgEvidence) score -= 2;

  const reasons = [];
  reasons.push("size_gap_large");
  if (roleTransition) reasons.push("role_transition");
  if (totalYears < 5) reasons.push("low_experience");
  if (leadershipGap) reasons.push("leadership_gap");

  let severity = "none";
  if (score >= 4) severity = "high";
  else if (score >= 2) severity = "medium";

  return {
    triggered: severity !== "none",
    score,
    severity,
    reasons,
    sizeGap,
    currentSize,
    targetSize,
    currentLevel,
    targetLevel,
    roleDistanceValue,
    totalYears,
    roleTransition,
    roleMatch,
    leadershipGap,
    largeOrgEvidence,
  };
}

function buildExplain(calc) {
  const why = [];
  why.push("현재보다 규모가 큰 조직으로 이동하는 케이스입니다.");
  why.push("채용 과정에서는 실무 능력보다 대규모 협업 구조와 보고 체계에 바로 적응할 수 있는지를 확인할 가능성이 높습니다.");

  if (calc.roleTransition) {
    why.push("기업 규모 상향과 직무 전환이 동시에 있는 케이스입니다. 채용 담당자 입장에서는 직무 적합성과 조직 적응력을 동시에 검증해야 하므로 허들이 더 높게 설정될 수 있습니다.");
  }

  if (calc.totalYears < 5) {
    why.push("큰 조직으로 이동하기에는 경력 축적 기간이 충분하지 않다고 판단될 가능성이 있습니다.");
  }

  if (calc.targetSize === "public") {
    why.push("공공기관·공기업은 규모 외에도 평가 체계, 의사결정 속도, 보고 문화가 민간 기업과 다릅니다. 조직 규모 적응 외에 조직 문화 차이에 대한 적응 역량을 별도로 제시하는 것이 유효합니다.");
  }

  const signals = [
    `company_size: ${calc.currentSize} -> ${calc.targetSize} (gap=${calc.sizeGap})`,
    `years: ${calc.totalYears}`,
    `score: ${calc.score}`,
  ];

  if (Number.isFinite(calc.roleDistanceValue)) {
    signals.push(`role_distance: ${calc.roleDistanceValue}`);
  }

  const action = [
    "대규모 협업 경험(부서 간 조율, 보고 라인 운영, 의사결정 문서화)을 사례 중심으로 제시하세요.",
    "조직 프로세스 적응 속도를 입증할 수 있는 온보딩/표준화/협업 지표를 준비하세요.",
  ];

  const counter = [];
  if (calc.largeOrgEvidence) {
    counter.push("cross-functional/stakeholder/reporting/enterprise/multi-team/coordination 증거가 있어 리스크가 완화됩니다.");
  }
  if (calc.roleMatch) {
    counter.push("직무 연속성이 확인되어 순수 직무 전환 리스크는 낮습니다.");
  }

  return {
    title: "기업규모 상향 점프 리스크",
    why,
    signals,
    action,
    counter,
    reasons: calc.reasons,
    impactLevel: calc.severity === "high" ? "high" : "medium",
    importanceWeight: calc.severity === "high" ? 0.9 : 0.7,
    impactReasons: calc.reasons,
  };
}

const companySizeJumpRisk = {
  id: "RISK__COMPANY_SIZE_JUMP",
  title: "기업규모 상향 이동에 따른 조직 적응 리스크",
  group: "domain",
  layer: "domain",
  priority: 51,
  when: (ctx) => computeCompanySizeJump(ctx).severity === "medium",
  score: (ctx) => {
    const c = computeCompanySizeJump(ctx);
    if (c.severity !== "medium") return 0;
    return clamp01(0.48 + c.score * 0.08);
  },
  explain: (ctx) => buildExplain(computeCompanySizeJump(ctx)),
};

const companySizeJumpHighRisk = {
  id: "HIGH_RISK__COMPANY_SIZE_JUMP_COMPOSITE",
  title: "기업규모 상향 + 복합 전환 고위험",
  group: "domain",
  layer: "domain",
  priority: 54,
  when: (ctx) => computeCompanySizeJump(ctx).severity === "high",
  score: (ctx) => {
    const c = computeCompanySizeJump(ctx);
    if (c.severity !== "high") return 0;
    return clamp01(0.72 + (c.score - 4) * 0.06);
  },
  explain: (ctx) => buildExplain(computeCompanySizeJump(ctx)),
};

export const COMPANY_SIZE_JUMP_PROFILES = [
  companySizeJumpRisk,
  companySizeJumpHighRisk,
];

export default companySizeJumpRisk;
