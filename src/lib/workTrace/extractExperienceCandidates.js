// src/lib/workTrace/extractExperienceCandidates.js
// Calls /api/openai-proxy to extract career experience candidates from raw work trace text.

const SOURCE_TYPES = new Set([
  "kakao", "slack", "meeting_note", "email",
  "work_report", "csv", "image", "unknown",
]);

const RESUME_POTENTIALS = new Set(["high", "medium", "low"]);
const CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);

function _getApiBase() {
  const base = (
    import.meta.env.VITE_PARSE_API_BASE ||
    import.meta.env.VITE_AI_PROXY_URL ||
    import.meta.env.VITE_API_BASE ||
    ""
  ).toString().trim().replace(/\/$/, "");
  return base;
}

function _buildPrompt(rawText) {
  return `당신은 한국 인사 담당자이자 커리어 코치입니다.
아래 업무 기록을 읽고, 이력서에 쓸 수 있는 경력 경험 후보를 추출해 주세요.

[업무 기록]
${rawText}

[출력 규칙]
1. 자료 유형(sourceType)을 판단하세요: kakao, slack, meeting_note, email, work_report, csv, image, unknown 중 하나
2. 감지된 기간(detectedPeriod)을 ISO 8601 범위 또는 null로 표기하세요
3. 전체 요약(summary)을 2~3문장으로 작성하세요
4. 경험 후보(experienceCandidates)를 1~5개 추출하세요
5. 각 후보마다:
   - title: 경험 제목 (20자 이내)
   - situation: 상황/배경 (STAR 구조)
   - task: 맡은 역할/과제
   - action: 구체적 행동 (사용자가 직접 했다고 단정하지 마세요)
   - result: 결과 또는 수치. 없으면 null
   - resumePotential: high / medium / low
   - confidenceLevel: high / medium / low
   - followUpQuestions: 결과나 수치가 없으면 보완 질문 1~2개, 있으면 빈 배열
   - evidenceTexts: 원문에서 근거가 된 문장들 (배열)
6. 과장 금지. 원문에 없는 내용은 추가하지 마세요.
7. 사용자가 주도했다고 단정하지 마세요.

[출력 형식] 반드시 순수 JSON만 출력하세요.
{
  "sourceType": "...",
  "detectedPeriod": "...",
  "summary": "...",
  "experienceCandidates": [
    {
      "title": "...",
      "situation": "...",
      "task": "...",
      "action": "...",
      "result": "..." ,
      "resumePotential": "high|medium|low",
      "confidenceLevel": "high|medium|low",
      "followUpQuestions": [],
      "evidenceTexts": []
    }
  ]
}`;
}

function _normalizeCandidate(c) {
  return {
    title: c.title?.toString().trim() || "경험 후보",
    situation: c.situation?.toString().trim() || "",
    task: c.task?.toString().trim() || "",
    action: c.action?.toString().trim() || "",
    result: c.result != null ? c.result.toString().trim() || null : null,
    resumePotential: RESUME_POTENTIALS.has(c.resumePotential) ? c.resumePotential : "medium",
    confidenceLevel: CONFIDENCE_LEVELS.has(c.confidenceLevel) ? c.confidenceLevel : "medium",
    followUpQuestions: Array.isArray(c.followUpQuestions)
      ? c.followUpQuestions.map((q) => q.toString().trim()).filter(Boolean)
      : [],
    evidenceTexts: Array.isArray(c.evidenceTexts)
      ? c.evidenceTexts.map((t) => t.toString().trim()).filter(Boolean)
      : [],
  };
}

function _normalizeResponse(parsed) {
  const sourceType = SOURCE_TYPES.has(parsed.sourceType) ? parsed.sourceType : "unknown";
  const detectedPeriod =
    parsed.detectedPeriod != null ? String(parsed.detectedPeriod).trim() || null : null;
  const summary = parsed.summary?.toString().trim() || "";
  const raw = Array.isArray(parsed.experienceCandidates) ? parsed.experienceCandidates : [];
  const candidates = raw.slice(0, 5).map(_normalizeCandidate);
  return { sourceType, detectedPeriod, summary, candidates };
}

/**
 * Extract career experience candidates from raw work trace text.
 *
 * @param {{ rawText: string, signal?: AbortSignal }} params
 * @returns {Promise<{
 *   ok: boolean,
 *   sourceType?: string,
 *   detectedPeriod?: string|null,
 *   summary?: string,
 *   candidates?: object[],
 *   errorCode?: string,
 *   message?: string,
 * }>}
 */
export async function extractExperienceCandidates({ rawText, signal } = {}) {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length < 30) {
    return {
      ok: false,
      errorCode: "RAW_TEXT_TOO_SHORT",
      message: "내용이 너무 짧아요. 조금 더 입력해 주세요.",
    };
  }

  const base = _getApiBase();
  const requestId = `work-trace-${Date.now()}`;
  const t0 = Date.now();
  const prompt = _buildPrompt(rawText.trim());

  let res;
  try {
    res = await fetch(`${base}/api/openai-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        t0,
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 2500,
        messages: [
          {
            role: "system",
            content: "You are a Korean HR career analyst. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      ...(signal ? { signal } : {}),
    });
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: false, errorCode: "ABORTED", message: "요청이 취소됐어요." };
    }
    return {
      ok: false,
      errorCode: "NETWORK_ERROR",
      message: "서버에 연결하지 못했어요. 네트워크를 확인해 주세요.",
    };
  }

  let responseBody;
  try {
    responseBody = await res.json();
  } catch {
    return { ok: false, errorCode: "PARSE_ERROR", message: "서버 응답을 읽지 못했어요." };
  }

  if (!res.ok || !responseBody?.ok) {
    return {
      ok: false,
      errorCode: `HTTP_${res.status}`,
      message: responseBody?.error || "경험 분석 중 오류가 발생했어요.",
    };
  }

  const content = responseBody.data?.choices?.[0]?.message?.content;
  if (!content) {
    return { ok: false, errorCode: "EMPTY_RESPONSE", message: "AI 응답이 비어 있어요." };
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { ok: false, errorCode: "JSON_PARSE_ERROR", message: "AI 응답을 파싱하지 못했어요." };
  }

  const { sourceType, detectedPeriod, summary, candidates } = _normalizeResponse(parsed);

  return { ok: true, sourceType, detectedPeriod, summary, candidates };
}
