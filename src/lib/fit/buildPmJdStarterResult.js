import { PM_CORE_SIGNALS } from "@/lib/passmap/pmSignalProfile.js";

export function buildPmJdStarterResult(jdText, interpretation) {
  const safeText = String(jdText || "").trim();
  if (!safeText) return null;

  const combined = safeText.toLowerCase();
  const jdRequiredSignals = PM_CORE_SIGNALS.filter((signal) =>
    signal.evidenceHints.some((hint) => combined.includes(String(hint).toLowerCase()))
  ).slice(0, 5);

  const detectedCoreSignals = Array.isArray(interpretation?.detectedCoreSignals)
    ? interpretation.detectedCoreSignals
    : [];
  const currentSignalIdSet = new Set(detectedCoreSignals.map((signal) => signal.id));

  const currentSignals = jdRequiredSignals.filter((signal) => currentSignalIdSet.has(signal.id));
  const missingSignals = jdRequiredSignals.filter((signal) => !currentSignalIdSet.has(signal.id));

  const gapSummary =
    jdRequiredSignals.length === 0
      ? "Starter 버전이라 JD에서 PM 신호가 명확히 읽히지 않았습니다. JD 핵심 요구를 조금 더 직접적으로 적어보는 편이 안전합니다."
      : currentSignals.length === 0
        ? "JD에서 읽힌 요구 신호는 있지만, 현재 기록 흐름과 직접 겹치는 신호는 아직 약합니다."
        : missingSignals.length === 0
          ? "현재 기록에서 보이는 신호가 이번 JD 요구와 대체로 맞닿아 있습니다. 다만 정밀 판정이 아니라 starter 비교라는 점은 유지해야 합니다."
          : "일부 신호는 이미 보이지만, JD가 요구하는 나머지 신호는 아직 기록에서 충분히 확인되지 않습니다.";

  const improvementPriorities =
    missingSignals.length > 0
      ? missingSignals
          .slice(0, 2)
          .map((signal) => `${signal.label}가 보이도록 다음 기록을 더 구체화하기`)
      : ["현재 보이는 신호를 주간 자산 문장으로 정리해 JD 비교 근거를 더 선명하게 만들기"];

  return {
    track: "jd",
    jdText: safeText,
    requiredSignals: jdRequiredSignals.map((signal) => signal.label),
    presentSignals: currentSignals.map((signal) => signal.label),
    missingSignals: missingSignals.map((signal) => signal.label),
    gapSummary,
    nextPriority: improvementPriorities,
    helperNote:
      detectedCoreSignals.length === 0
        ? "현재 비교는 저장된 이력 없이, 이 세션에서 가장 최근에 해석한 PM 기록이 있을 때만 함께 읽습니다."
        : "현재 비교는 이 세션에서 방금 해석된 PM 기록 신호를 기준으로 한 starter 결과입니다.",
  };
}
