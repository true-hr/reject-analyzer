function pickTopSignalLabels(interpretation, limit = 3) {
  const detectedCoreSignals = Array.isArray(interpretation?.detectedCoreSignals)
    ? interpretation.detectedCoreSignals
    : [];

  return detectedCoreSignals.slice(0, limit).map((signal) => signal.label);
}

function pickWeakSignalLabels(interpretation, limit = 3) {
  const possibleWeakSignals = Array.isArray(interpretation?.possibleWeakSignals)
    ? interpretation.possibleWeakSignals
    : [];

  return possibleWeakSignals.slice(0, limit).map((signal) => signal.label);
}

function buildTodayAssetCandidateLine(input, topSignals) {
  const text = String(input?.text || "").trim();
  if (!text) return "";

  if (!Array.isArray(topSignals) || topSignals.length === 0) {
    return `${text} 경험을 이번 주 묶음 후보로 정리할 수 있습니다.`;
  }

  return `${text} 경험에서 ${topSignals.slice(0, 2).join(", ")} 흐름이 읽힙니다.`;
}

function buildWeeklyResumeLine(input, topSignals) {
  const text = String(input?.text || "").trim();
  if (!text) return "";

  if (!Array.isArray(topSignals) || topSignals.length === 0) {
    return `${text} 활동을 주간 자산 문장으로 정리할 여지가 있습니다.`;
  }

  return `${text}를 통해 ${topSignals.slice(0, 2).join(" 및 ")} 역량이 반복적으로 드러났습니다.`;
}

function buildTodayTrackResult(input, interpretation) {
  const topSignals = pickTopSignalLabels(interpretation, 3);

  return {
    track: "today",
    interpretation,
    input,
    summary:
      interpretation?.interpretationNote ||
      "이번 주 기록을 PM 관점에서 가볍게 읽은 결과입니다.",
    visibleSignals: topSignals,
    weakSignals: pickWeakSignalLabels(interpretation, 3),
    assetLine: buildTodayAssetCandidateLine(input, topSignals),
    handoffDecision:
      topSignals.length >= 2
        ? "이번 주 묶음으로 넘길 만한 기록입니다."
        : "이번 주 기록으로 남기되, 비슷한 기록이 더 쌓이면 주간 묶음으로 넘기는 편이 좋습니다.",
  };
}

function buildWeeklyTrackResult(input, interpretation) {
  const topSignals = pickTopSignalLabels(interpretation, 3);

  return {
    track: "weekly",
    interpretation,
    input,
    summary:
      interpretation?.interpretationNote ||
      "이번 주 활동을 PM 관점에서 다시 묶어 읽는 실험 결과입니다.",
    visibleSignals: topSignals,
    weakSignals: pickWeakSignalLabels(interpretation, 3),
    resumeLine: buildWeeklyResumeLine(input, topSignals),
    strengthSummary:
      topSignals.length > 0
        ? topSignals
        : ["이번 주에는 더 구체적인 활동 묶음이 필요합니다."],
    assetMemo:
      topSignals.length > 0
        ? `${topSignals[0]} 중심으로 기존 자산 문장을 강화할 수 있습니다.`
        : "주간 묶음이 조금 더 쌓이면 자산 반영 메모를 붙이기 쉽습니다.",
    readinessChange:
      topSignals.length >= 2
        ? "이번 주 신호 변화는 JD readiness 비교에 반영할 수 있는 수준입니다."
        : "이번 주 신호는 보이지만 readiness 변화로 단정하기에는 아직 얇습니다.",
  };
}

export function buildPmMvpTrackResult(track, input, interpretation) {
  if (track === "weekly") {
    return buildWeeklyTrackResult(input, interpretation);
  }

  return buildTodayTrackResult(input, interpretation);
}
