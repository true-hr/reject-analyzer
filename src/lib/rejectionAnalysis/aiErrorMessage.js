// AI 심화 해석 실패 시 사용자에게 보여줄 메시지 매핑.
// 원칙: 사용자를 탓하지 않고, "기본 분석은 볼 수 있다"를 명확히 전한다.
// 기술적 errorCode는 화면에 직접 노출하지 않고, requestId만 작은 글씨로 표시한다.

const DEFAULT_MESSAGE = {
  title: "AI 심화 해석을 불러오지 못했습니다",
  body: "기본 분석 결과는 아래에서 확인할 수 있습니다.",
};

const AI_ERROR_MESSAGE_MAP = Object.freeze({
  TIMEOUT: {
    title: "AI 심화 해석이 예상보다 오래 걸려 중단됐습니다",
    body: "기본 분석 결과는 정상적으로 확인할 수 있습니다.",
  },
  OPENAI_TIMEOUT: {
    title: "AI 심화 해석이 예상보다 오래 걸려 중단됐습니다",
    body: "기본 분석 결과는 정상적으로 확인할 수 있습니다.",
  },
  RATE_LIMITED: {
    title: "오늘 사용 가능한 AI 심화 분석 횟수를 초과했습니다",
    body: "기본 분석 결과는 계속 확인할 수 있습니다.",
  },
  ANON_DAILY_LIMIT_EXCEEDED: {
    title: "오늘 사용 가능한 AI 심화 분석 횟수를 초과했습니다",
    body: "기본 분석 결과는 계속 확인할 수 있습니다.",
  },
  USER_DAILY_LIMIT_EXCEEDED: {
    title: "오늘 사용 가능한 AI 심화 분석 횟수를 초과했습니다",
    body: "기본 분석 결과는 계속 확인할 수 있습니다.",
  },
  ANON_RATE_LIMIT_NOT_CONFIGURED: {
    title: "비로그인 AI 심화 분석이 일시적으로 비활성화돼 있습니다",
    body: "기본 분석 결과는 확인할 수 있습니다.",
  },
  NO_PROXY_URL: {
    title: "AI 심화 분석 연결 설정이 아직 완료되지 않았습니다",
    body: "기본 분석 결과는 확인할 수 있습니다.",
  },
  OPENAI_API_KEY_MISSING: {
    title: "AI 심화 분석 서버 설정이 누락돼 추가 해석을 불러오지 못했습니다",
    body: "기본 분석 결과는 확인할 수 있습니다.",
  },
  NO_API_KEY: {
    title: "AI 심화 분석 서버 설정이 누락돼 추가 해석을 불러오지 못했습니다",
    body: "기본 분석 결과는 확인할 수 있습니다.",
  },
  API_ERROR: {
    title: "AI 심화 분석 서버 응답이 불안정했습니다",
    body: "기본 분석 결과는 확인할 수 있습니다.",
  },
  FETCH_FAILED: {
    title: "네트워크 문제로 AI 심화 분석을 불러오지 못했습니다",
    body: "잠시 후 다시 시도해 주세요. 기본 분석 결과는 확인할 수 있습니다.",
  },
  INTERNAL_ERROR: {
    title: "AI 심화 분석 중 알 수 없는 오류가 발생했습니다",
    body: "기본 분석 결과는 확인할 수 있습니다.",
  },
  AI_JSON_PARSE_FAILED: {
    title: "AI 해석 결과 처리 중 문제가 발생했습니다",
    body: "기본 분석 결과를 참고해 주세요.",
  },
  JSON_PARSE_FAILED: {
    title: "AI 해석 결과 처리 중 문제가 발생했습니다",
    body: "기본 분석 결과를 참고해 주세요.",
  },
  MISSING_INPUT: {
    title: "AI 심화 분석에 필요한 정보가 부족했습니다",
    body: "JD와 이력서 내용을 확인한 뒤 다시 시도해 주세요.",
  },
});

export function getAiErrorUserMessage(errorCode) {
  const key = typeof errorCode === "string" ? errorCode.trim() : "";
  if (!key) return { ...DEFAULT_MESSAGE };
  return AI_ERROR_MESSAGE_MAP[key] ? { ...AI_ERROR_MESSAGE_MAP[key] } : { ...DEFAULT_MESSAGE };
}
