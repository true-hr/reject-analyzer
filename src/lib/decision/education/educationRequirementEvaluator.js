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
    text.includes("지원자격")
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

export function evaluateEducationRequirement(ctx) {
  const jdText = normalizeText(
    ctx?.state?.jd ||
    ctx?.objective?.jdText ||
    ""
  );

  if (!jdText) {
    return buildResult("none", null, null);
  }

  if (hasNoneSignal(jdText)) {
    return buildResult("none", null, "학력/전공 무관");
  }

  const minimumDegree = detectMinimumDegree(jdText);

  if (!minimumDegree) {
    return buildResult("none", null, null);
  }

  if (hasMustSignal(jdText)) {
    return buildResult("must", minimumDegree, minimumDegree);
  }

  if (hasPreferredSignal(jdText)) {
    return buildResult("preferred", minimumDegree, minimumDegree);
  }

  return buildResult("none", minimumDegree, minimumDegree);
}
