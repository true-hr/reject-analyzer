function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __isGeneric(value) {
  const text = __text(value);
  if (!text) return true;
  return [
    /추가 확인/,
    /판단이 필요/,
    /가능성이 있습니다$/,
    /읽힐 수 있습니다$/,
  ].some((re) => re.test(text));
}

export function buildHeadlineFromJudgments({ judgmentPack = null } = {}) {
  const ranking = Array.isArray(judgmentPack?.ranking?.headline) ? judgmentPack.ranking.headline : [];
  const items = judgmentPack?.items && typeof judgmentPack.items === "object" ? judgmentPack.items : {};
  const winner = ranking
    .map((key) => items[key] || null)
    .find((item) => item && item.status === "ready" && __text(item.why) && !__isGeneric(item.why));

  if (!winner) {
    return {
      status: "unavailable",
      text: null,
      sourceFamily: "fallback",
      sourceKeys: [],
      sparseReason: "no_judgment_headline_owner",
    };
  }

  return {
    status: "ready",
    text: winner.why,
    sourceFamily: "judgment_pack",
    sourceKeys: [`judgmentPack.items.${winner.key}`],
    sparseReason: null,
  };
}

