function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function __eligible(item) {
  if (!item || item.status === "unavailable") return false;
  if (!__text(item.why)) return false;
  if (item.status === "ready") return true;
  return item.status === "partial" && item.sourceFamily !== "fallback" && (__arr(item.proofFor).length > 0 || __arr(item.proofMissing).length > 0);
}

const TITLE_MAP = {
  interviewReadRisk: "면접 초반 검증 포인트",
  targetRoleFit: "목표 역할 직접성",
  industryContinuity: "도메인 연결 맥락",
  evidenceDensity: "근거 밀도",
  transitionReadiness: "전환 준비도",
};

const FAMILY_MAP = {
  interviewReadRisk: "interview_read_risk",
  targetRoleFit: "target_role_fit",
  industryContinuity: "industry_continuity",
  evidenceDensity: "evidence_density",
  transitionReadiness: "transition_readiness",
};

export function buildTopRisksFromJudgments({ judgmentPack = null } = {}) {
  const ranking = Array.isArray(judgmentPack?.ranking?.topRisks) ? judgmentPack.ranking.topRisks : [];
  const items = judgmentPack?.items && typeof judgmentPack.items === "object" ? judgmentPack.items : {};
  const selected = ranking
    .map((key) => items[key] || null)
    .filter(__eligible)
    .slice(0, 3)
    .map((item, index) => ({
      id: `judgment-${item.key}`,
      title: TITLE_MAP[item.key] || item.key,
      description: item.why,
      sourceFamily: "judgment_pack",
      sourceKeys: [`judgmentPack.items.${item.key}`],
      evidence: __arr(item.proofFor).slice(0, 2),
      rank: index + 1,
      riskFamily: FAMILY_MAP[item.key] || item.key,
    }));

  if (selected.length === 0) {
    return {
      status: "unavailable",
      items: [],
      sourceFamily: "fallback",
      sourceKeys: [],
      sparseReason: "no_judgment_top_risks",
    };
  }

  return {
    status: selected.length >= 2 ? "ready" : "partial",
    items: selected,
    sourceFamily: "judgment_pack",
    sourceKeys: selected.flatMap((item) => item.sourceKeys || []),
    sparseReason: selected.length < 3 ? "judgment_top_risks_partial" : null,
  };
}
