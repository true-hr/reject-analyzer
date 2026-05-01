// src/lib/signals/interpretPmRecord.js
// PM 기록 → 신호 해석 순수 함수
//
// 입력: { text, roleTags?, collaborationTags?, resultTags? }
// 출력: { detectedCoreSignals, possibleWeakSignals, suggestedImprovementActions, interpretationNote, coverageSummary }
//
// 규칙:
// - pure function — 부작용 없음, 전역 상태 변경 없음
// - UI 의존성 없음
// - LLM/API 호출 없음
// - 불투명한 점수 계산 없음 — 모든 판독은 evidenceHints 키워드 매칭 기반
// - 결과는 안정적이고 설명 가능해야 함

import {
  PM_CORE_SIGNALS,
  PM_WEAK_SIGNALS,
  PM_IMPROVEMENT_ACTIONS,
} from "../passmap/pmSignalProfile.js";

// ── text helpers ──────────────────────────────────────────────────────────────

function lower(s) {
  return typeof s === "string" ? s.toLowerCase() : "";
}

function combineText(input) {
  return [
    input.text ?? "",
    ...(Array.isArray(input.roleTags) ? input.roleTags : []),
    ...(Array.isArray(input.collaborationTags) ? input.collaborationTags : []),
    ...(Array.isArray(input.resultTags) ? input.resultTags : []),
  ]
    .map(lower)
    .join(" ");
}

function matchesHint(combined, hint) {
  return combined.includes(lower(hint));
}

function hasDigit(text) {
  return /\d/.test(text);
}

// ── weak signal inference ─────────────────────────────────────────────────────
// conservative: weak signal은 확실한 부재 근거가 있을 때만 포함

function inferWeakSignals(combined, detectedCoreIds) {
  const weak = [];

  // 수치 없음: 숫자나 % 패턴이 전혀 없을 때
  if (!matchesHint(combined, "%") && !hasDigit(combined)) {
    const ws = PM_WEAK_SIGNALS.find((w) => w.id === "WEAK_NO_QUANTITATIVE_RESULT");
    if (ws) weak.push(ws);
  }

  // 협업 맥락 없음: 이해관계자 조율 신호 미판독
  if (!detectedCoreIds.has("CORE_STAKEHOLDER_ALIGNMENT")) {
    const ws = PM_WEAK_SIGNALS.find((w) => w.id === "WEAK_NO_COLLABORATION_CONTEXT");
    if (ws) weak.push(ws);
  }

  // 문제 정의 없음: 문제 구조화 신호 미판독
  if (!detectedCoreIds.has("CORE_PROBLEM_STRUCTURING")) {
    const ws = PM_WEAK_SIGNALS.find((w) => w.id === "WEAK_NO_PROBLEM_DEFINITION");
    if (ws) weak.push(ws);
  }

  // 사용자 언급 없음: 사용자 관점 신호 미판독
  if (!detectedCoreIds.has("CORE_USER_PERSPECTIVE")) {
    const ws = PM_WEAK_SIGNALS.find((w) => w.id === "WEAK_NO_USER_MENTION");
    if (ws) weak.push(ws);
  }

  // 결과 단절: 실행 완결 신호 미판독
  if (!detectedCoreIds.has("CORE_EXECUTION_COMPLETION")) {
    const ws = PM_WEAK_SIGNALS.find((w) => w.id === "WEAK_NO_OUTCOME");
    if (ws) weak.push(ws);
  }

  return weak;
}

// ── improvement action mapping ────────────────────────────────────────────────

const WEAK_TO_ACTION = {
  WEAK_NO_QUANTITATIVE_RESULT: "ACTION_ADD_NUMBER",
  WEAK_UNCLEAR_DECISION_BASIS: "ACTION_ADD_DECISION_BASIS",
  WEAK_NO_COLLABORATION_CONTEXT: "ACTION_ADD_COLLABORATION",
  WEAK_NO_PROBLEM_DEFINITION: "ACTION_ADD_PROBLEM_DEFINITION",
  WEAK_NO_USER_MENTION: "ACTION_CONNECT_USER_IMPACT",
  WEAK_NO_OUTCOME: "ACTION_ADD_OUTCOME",
};

function deriveImprovementActions(weakSignals) {
  const actionIds = new Set(
    weakSignals.map((w) => WEAK_TO_ACTION[w.id]).filter(Boolean)
  );
  // output contract: max 2 improvement actions
  return PM_IMPROVEMENT_ACTIONS.filter((a) => actionIds.has(a.id)).slice(0, 2);
}

// ── main export ───────────────────────────────────────────────────────────────

/**
 * @param {{ text: string, roleTags?: string[], collaborationTags?: string[], resultTags?: string[] }} input
 * @returns {{ detectedCoreSignals, possibleWeakSignals, suggestedImprovementActions, interpretationNote, coverageSummary }}
 */
export function interpretPmRecord(input) {
  if (!input || typeof input.text !== "string" || input.text.trim() === "") {
    return {
      detectedCoreSignals: [],
      possibleWeakSignals: [],
      suggestedImprovementActions: [],
      interpretationNote: "입력 기록이 없습니다.",
      coverageSummary: null,
    };
  }

  const combined = combineText(input);

  // 1. core signal detection via evidenceHints keyword matching
  const detectedCoreSignals = PM_CORE_SIGNALS.filter((sig) =>
    sig.evidenceHints.some((hint) => matchesHint(combined, hint))
  );

  const detectedCoreIds = new Set(detectedCoreSignals.map((s) => s.id));

  // 2. weak signal inference (conservative)
  const possibleWeakSignals = inferWeakSignals(combined, detectedCoreIds);

  // 3. improvement actions from weak signals (max 2)
  const suggestedImprovementActions = deriveImprovementActions(possibleWeakSignals);

  // 4. coverage summary
  const total = PM_CORE_SIGNALS.length;
  const covered = detectedCoreSignals.length;
  const coverageSummary = `PM 핵심 신호 ${total}개 중 ${covered}개 확인됨`;

  // 5. interpretation note
  let interpretationNote;
  if (covered === 0) {
    interpretationNote =
      "기록에서 PM 핵심 신호를 확인하기 어렵습니다. 구체적인 행동과 결과를 추가해주세요.";
  } else if (covered >= 4) {
    interpretationNote = "PM 포지셔닝으로 읽히는 기록입니다.";
  } else {
    interpretationNote =
      "PM 신호 일부 확인됨. 보완 항목을 추가하면 설득력이 올라갑니다.";
  }

  return {
    detectedCoreSignals,
    possibleWeakSignals,
    suggestedImprovementActions,
    interpretationNote,
    coverageSummary,
  };
}
