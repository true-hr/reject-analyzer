// src/lib/decision/riskProfiles/gates/requiredCertMissingGate.js
// GATE__REQUIRED_CERT_MISSING gate

function _safeArr(v) {
  return Array.isArray(v) ? v : [];
}

export const requiredCertMissingGate = {
  id: "GATE__REQUIRED_CERT_MISSING",
  group: "gates",
  layer: "gate",
  priority: 96,
  severityBase: 5,
  tags: ["gate", "certification", "required"],

  when: (ctx) => {
    const certs = ctx?.requiredGateSignals?.certifications;
    if (!certs || typeof certs !== "object") return false;
    const required = _safeArr(certs.required);
    const missing = _safeArr(certs.missing);
    if (required.length === 0) return false;
    if (missing.length === 0) return false;
    const missingSet = new Set(missing);
    return required.some((r) => missingSet.has(r));
  },

  score: (ctx) => {
    const certs = ctx?.requiredGateSignals?.certifications;
    if (!certs || typeof certs !== "object") return 0;
    const required = _safeArr(certs.required);
    const missing = _safeArr(certs.missing);
    if (required.length === 0 || missing.length === 0) return 0;
    const missingSet = new Set(missing);
    if (!required.some((r) => missingSet.has(r))) return 0;
    return 0.96;
  },

  explain: (ctx) => {
    const certs = ctx?.requiredGateSignals?.certifications;
    if (!certs || typeof certs !== "object") return null;
    const required = _safeArr(certs.required);
    const matched = _safeArr(certs.matched);
    const missing = _safeArr(certs.missing);
    const missingSet = new Set(missing);
    const missingRequired = required.filter((r) => missingSet.has(r));

    return {
      title: "필수 자격증 미보유 가능성",
      why: [
        "JD가 특정 자격증을 필수 조건으로 요구하고 있습니다.",
        "이력서에서 해당 자격증 보유 근거가 감지되지 않았습니다.",
        "필수 자격증이 확인되지 않으면 직무역량 평가 전 서류 단계에서 먼저 걸릴 수 있습니다.",
      ],
      action: [
        "실제 보유 중이라면 이력서 상단 또는 자격증 섹션에 정확한 자격증명을 명시하세요.",
        "아직 미보유라면 지원 가능 여부를 공고 조건과 대조해 먼저 확인하세요.",
        "동등 자격이나 실무 경력으로 대체 가능한지 JD 원문을 재확인하세요.",
      ],
      counter: [
        "JD 문구가 사실상 우대 수준이거나 동등 자격·실무 경력으로 대체를 허용하는 경우 gate 강도는 낮아질 수 있습니다.",
        "이력서에 자격증명이 약어·별칭으로 기재된 경우 탐지가 누락될 수 있으며, 이 경우 실제 미보유와 구별되지 않습니다.",
      ],
      signals: [
        `JD 필수 자격증: ${required.length ? required.join(", ") : "(없음)"}`,
        `이력서 감지 자격증: ${matched.length ? matched.join(", ") : "(없음)"}`,
        `미확인 필수 자격증: ${missingRequired.length ? missingRequired.join(", ") : "(없음)"}`,
      ],
    };
  },

  // declarative intent — suppressIf is not yet consumed by the engine
  suppressIf: ["ROLE_CERTIFICATION__MISSING"],
};
