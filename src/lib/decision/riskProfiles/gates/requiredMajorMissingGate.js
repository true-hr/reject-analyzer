// src/lib/decision/riskProfiles/gates/requiredMajorMissingGate.js
// GATE__REQUIRED_MAJOR_MISSING gate

function _safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function _trimStr(v) {
  try { return (v ?? "").toString().trim(); }
  catch { return ""; }
}

function _safeSimilarity(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function _directMatch(candidateCluster, requiredClusters) {
  const cand = _trimStr(candidateCluster).toLowerCase();
  if (!cand) return false;
  return _safeArr(requiredClusters).some(
    (r) => _trimStr(r).toLowerCase() === cand
  );
}

export const requiredMajorMissingGate = {
  id: "GATE__REQUIRED_MAJOR_MISSING",
  group: "gates",
  layer: "gate",
  priority: 94,
  severityBase: 5,
  tags: ["gate", "major", "required"],

  when: (ctx) => {
    const major = ctx?.requiredGateSignals?.major;
    if (!major || typeof major !== "object") return false;

    const explicitRequired = Boolean(major.explicitRequired);
    const requiredClusters = _safeArr(major.requiredClusters);
    const candidateMajor = _trimStr(major.candidateMajor);
    const candidateCluster = _trimStr(major.candidateCluster);
    const similarity = _safeSimilarity(major.similarity);

    if (!explicitRequired) return false;
    if (requiredClusters.length === 0) return false;
    if (!candidateMajor) return false;
    if (!candidateCluster) return false;
    if (_directMatch(candidateCluster, requiredClusters)) return false;
    if (similarity === null) return false;
    if (similarity > 0.15) return false;

    return true;
  },

  score: (ctx) => {
    const major = ctx?.requiredGateSignals?.major;
    if (!major || typeof major !== "object") return 0;
    const similarity = _safeSimilarity(major.similarity);
    if (similarity === null) return 0;

    if (similarity <= 0.05) return 0.96;
    if (similarity <= 0.15) return 0.90;
    return 0;
  },

  explain: (ctx) => {
    const major = ctx?.requiredGateSignals?.major;
    if (!major || typeof major !== "object") return null;

    const requiredClusters = _safeArr(major.requiredClusters);
    const candidateMajor = _trimStr(major.candidateMajor);
    const candidateCluster = _trimStr(major.candidateCluster);
    const similarity = _safeSimilarity(major.similarity);

    return {
      title: "필수 전공 조건 미충족 가능성",
      why: [
        "JD가 특정 전공 계열을 필수 조건으로 요구하는 경우, 직무역량 평가 전에 기본 자격요건에서 먼저 걸릴 수 있습니다.",
        "후보자 전공과 JD가 요구하는 전공 계열의 연결성이 낮게 읽힙니다.",
      ],
      action: [
        "지원 전 JD의 전공 조건이 '필수'인지 '우대'인지 다시 확인하세요.",
        "전공 요건을 대체할 수 있는 자격증, 실무 프로젝트, 관련 교육 이수가 있다면 이력서 상단에 명확히 제시하세요.",
        "대체 근거가 없다면 전공 필수 조건이 없는 유사 직무나 기업을 우선 검토하세요.",
      ],
      counter: [
        "전공 조건이 우대사항에 가깝거나, 실무 경험·자격증으로 대체 가능하다고 명시된 경우 gate 강도는 낮아질 수 있습니다.",
        "채용 공고가 전환형·포텐셜 채용이면 전공 불일치가 즉시 탈락 사유가 아닐 수 있습니다.",
      ],
      signals: [
        `JD 필수 전공군: ${requiredClusters.join(", ")}`,
        `후보자 전공: ${candidateMajor || "(미입력)"}`,
        `후보자 전공군: ${candidateCluster || "(미탐지)"}`,
        `전공 유사도: ${similarity !== null ? Math.round(similarity * 100) : "?"}`,
      ],
    };
  },

  suppressIf: [],
};
