// src/lib/decision/education/educationRequirementEvaluator.js

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function detectMinimumDegree(text) {
  if (!text) return null;

  if (
    text.includes("박사 이상") ||
    text.includes("phd") ||
    text.includes("doctoral")
  ) {
    return "phd";
  }

  if (
    text.includes("석사 이상") ||
    text.includes("석사 필수") ||
    text.includes("master")
  ) {
    return "master";
  }

  if (
    text.includes("학사 이상") ||
    text.includes("대졸 이상") ||
    text.includes("4년제") ||
    text.includes("대학교 졸업") ||
    text.includes("bachelor")
  ) {
    return "bachelor";
  }

  if (
    text.includes("전문대 이상") ||
    text.includes("전문학사") ||
    text.includes("college")
  ) {
    return "college";
  }

  if (
    text.includes("고졸 이상") ||
    text.includes("highschool")
  ) {
    return "highschool";
  }

  return null;
}

function hasMustSignal(text) {
  if (!text) return false;

  return (
    text.includes("필수") ||
    text.includes("이상 필수") ||
    text.includes("필요") ||
    text.includes("자격요건") ||
    text.includes("지원자격") ||
    text.includes("required") ||
    text.includes("must") ||
    text.includes("mandatory")
  );
}

function hasPreferredSignal(text) {
  if (!text) return false;

  return (
    text.includes("우대") ||
    text.includes("선호") ||
    text.includes("prefer") ||
    text.includes("preferred")
  );
}

function hasNoneSignal(text) {
  if (!text) return false;

  return (
    text.includes("학력 무관") ||
    text.includes("전공 무관") ||
    text.includes("무관")
  );
}

function buildResult(requirementType, minimumDegree, evidence) {
  return {
    requirementType: requirementType || "none",
    minimumDegree: minimumDegree || null,
    evidence: evidence || null,
  };
}

const DEGREE_RANK = {
  highschool: 1,
  college: 2,
  bachelor: 3,
  master: 4,
  phd: 5,
};

function normalizeCandidateDegree(value) {
  const v = normalizeText(value);
  if (!v) return null;

  if (v.includes("박사") || v.includes("phd") || v.includes("doctoral")) return "phd";
  if (v.includes("석사") || v.includes("master")) return "master";
  if (v.includes("학사") || v.includes("4년") || v.includes("대졸") || v.includes("bachelor")) return "bachelor";
  if (v.includes("전문") || v.includes("college")) return "college";
  if (v.includes("고졸") || v.includes("highschool")) return "highschool";

  return null;
}

function resolveCandidateDegree(state) {
  const st = state && typeof state === "object" ? state : {};
  const raw =
    st?.educationLevel ??
    st?.education?.highestDegree ??
    st?.profile?.educationLevel ??
    st?.degree ??
    null;
  return normalizeCandidateDegree(raw);
}

function compareDegreeRank(candidateDegree, minimumDegree) {
  const c = DEGREE_RANK[candidateDegree] ?? null;
  const m = DEGREE_RANK[minimumDegree] ?? null;
  if (!c || !m) return null;
  return c - m;
}

export function evaluateEducationRequirement(ctx) {
  const stateObj = ctx?.state && typeof ctx.state === "object" ? ctx.state : {};
  const jdText = normalizeText(
    stateObj?.jd ||
    ctx?.objective?.jdText ||
    ""
  );
  const candidateDegree = resolveCandidateDegree(stateObj);

  if (!jdText) {
    return {
      ...buildResult("none", null, null),
      candidateDegree,
      satisfied: null,
      gateFail: false,
    };
  }

  if (hasNoneSignal(jdText)) {
    return {
      ...buildResult("none", null, "학력/전공 무관"),
      candidateDegree,
      satisfied: null,
      gateFail: false,
    };
  }

  const minimumDegree = detectMinimumDegree(jdText);

  if (!minimumDegree) {
    return {
      ...buildResult("none", null, null),
      candidateDegree,
      satisfied: null,
      gateFail: false,
    };
  }

  let requirementType = "none";
  if (hasMustSignal(jdText)) {
    requirementType = "must";
  } else if (hasPreferredSignal(jdText)) {
    requirementType = "preferred";
  }

  let satisfied = null;
  let gateFail = false;

  if (requirementType === "must") {
    const cmp = compareDegreeRank(candidateDegree, minimumDegree);
    if (cmp === null) {
      satisfied = null;
      gateFail = false;
    } else {
      satisfied = cmp >= 0;
      gateFail = !satisfied;
    }
  }

  return {
    ...buildResult(requirementType, minimumDegree, minimumDegree),
    candidateDegree,
    satisfied,
    gateFail,
  };
}
