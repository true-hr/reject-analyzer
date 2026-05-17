// src/lib/workTrace/extractExperienceCandidates.js
// Calls /api/openai-proxy to extract career experience candidates from raw work trace text.

const SOURCE_TYPES = new Set([
  "kakao", "slack", "meeting_note", "email",
  "work_report", "csv", "image", "unknown",
]);

const RESUME_POTENTIALS = new Set(["high", "medium", "low"]);
const CONFIDENCE_LEVELS = new Set(["high", "medium", "low"]);

// Placeholder values the AI sometimes returns instead of null
const _EMPTY_SENTINELS = new Set(["null", "none", "n/a", "없음", "해당 없음", "-", "해당없음"]);

function _normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => item?.toString().trim()).filter(Boolean);
  }
  if (value == null) return [];
  const text = value.toString().trim();
  if (!text || _EMPTY_SENTINELS.has(text.toLowerCase())) return [];
  return [text];
}

function _getApiBase() {
  const base = (
    import.meta.env.VITE_PARSE_API_BASE ||
    import.meta.env.VITE_AI_PROXY_URL ||
    import.meta.env.VITE_API_BASE ||
    ""
  ).toString().trim().replace(/\/$/, "");
  return base;
}

function _buildPrompt(rawText, context = {}) {
  const { careerRoleLabel = "", jobId = "" } = context;
  const contextLine = careerRoleLabel
    ? `사용자의 현재/희망 직무: ${careerRoleLabel}${jobId ? ` (직무 ID: ${jobId})` : ""}`
    : "직무 맥락: 미제공 (직무 맥락 불충분 — 가능한 범위에서 연결 후보를 제시하세요)";

  return `당신은 한국 인사 담당자이자 커리어 코치입니다.
아래 업무 기록을 읽고, 이력서·면접 소재로 전환할 수 있는 경력 경험 후보를 추출해 주세요.

[사용자 맥락]
${contextLine}
분석 목적: 이 업무 기록을 위 직무의 이력서·면접 소재로 활용하기 위한 경험 후보 추출

[업무 기록]
${rawText}

[출력 규칙]
1. 자료 유형(sourceType)을 판단하세요: kakao, slack, meeting_note, email, work_report, csv, image, unknown 중 하나
2. 감지된 기간(detectedPeriod)을 ISO 8601 범위 또는 null로 표기하세요
3. 전체 요약(summary)을 2~3문장으로 작성하세요
4. 경험 후보(experienceCandidates)를 1~5개 추출하세요
5. 각 후보마다:
   - title: 경험 제목 (20자 이내)
   - role: 이 경험에서 사용자의 추정 역할 (원문에서 발화·지시·결정이 드러나면 명시, 불분명하면 "역할 불명확")
   - situation: 상황/배경 (STAR 구조)
   - task: 맡은 역할/과제
   - actions: 구체적 행동 목록 (배열). 팀 전체 행동과 사용자 개인 기여를 구분하세요. 원문에 없으면 추측하지 마세요.
   - result: 결과 또는 수치 목록 (문자열 배열). 원문에 없으면 빈 배열 []. 없는 성과·수치를 만들지 마세요.
   - resumePotential: high / medium / low — 위 직무 이력서에 활용 가능한지를 기준으로 판단하세요
   - confidenceLevel: high / medium / low
   - skills: 이 경험에서 드러나는 역량·스킬 배열 (예: ["문제 정의", "서비스 기획", "데이터 분석"])
   - job_tags: 이 경험이 연결될 수 있는 직무 태그 배열 (예: ["서비스기획", "PM", "HR"])
   - industry_tags: 관련 산업 태그 배열 (예: ["HR Tech", "핀테크", "이커머스"])
   - suggestedResumeBullet: 위 직무 이력서에 바로 쓸 수 있는 1문장 초안. 원문 근거가 부족하면 null.
   - missingInfoQuestions: 결과나 수치가 없으면 보완 질문 1~2개 (문자열 배열), 있으면 빈 배열 []
   - riskNotes: 과장 위험·불확실성 경고 배열 (예: "결과 수치 원문 미확인"). 없으면 빈 배열 []
   - evidenceTexts: 원문에서 근거가 된 문장들 (문자열 배열)
6. 과장 금지. 원문에 없는 내용은 추가하지 마세요.
7. 사용자가 주도했다고 단정하지 마세요. 단, 원문에서 사용자의 발화·지시·결정이 드러나면 role 필드에 "사용자 역할 추정: ..."으로 명시하세요.
8. result, missingInfoQuestions, riskNotes, skills, job_tags, industry_tags, evidenceTexts, actions는 반드시 배열로 반환하세요.

[출력 형식] 반드시 순수 JSON만 출력하세요.
{
  "sourceType": "...",
  "detectedPeriod": "...",
  "summary": "...",
  "experienceCandidates": [
    {
      "title": "...",
      "role": "...",
      "situation": "...",
      "task": "...",
      "actions": ["..."],
      "result": [],
      "resumePotential": "high|medium|low",
      "confidenceLevel": "high|medium|low",
      "skills": ["..."],
      "job_tags": ["..."],
      "industry_tags": ["..."],
      "suggestedResumeBullet": "...",
      "missingInfoQuestions": ["..."],
      "riskNotes": ["..."],
      "evidenceTexts": ["..."]
    }
  ]
}`;
}

function _normalizeCandidate(c) {
  const missingInfoQuestions = _normalizeStringArray(
    c.missingInfoQuestions ?? c.followUpQuestions ?? c.missingInfo ?? []
  );

  return {
    title: c.title?.toString().trim() || "경험 후보",
    role: c.role?.toString().trim() || null,
    situation: c.situation?.toString().trim() || "",
    task: c.task?.toString().trim() || "",
    actions: _normalizeStringArray(c.actions ?? c.action ?? []),
    result: _normalizeStringArray(c.result ?? []),
    resumePotential: RESUME_POTENTIALS.has(c.resumePotential) ? c.resumePotential : "medium",
    confidenceLevel: CONFIDENCE_LEVELS.has(c.confidenceLevel) ? c.confidenceLevel : "medium",
    missingInfoQuestions,
    followUpQuestions: missingInfoQuestions, // alias for backward compat
    evidenceTexts: _normalizeStringArray(c.evidenceTexts ?? []),
    skills: _normalizeStringArray(c.skills ?? []),
    job_tags: _normalizeStringArray(c.job_tags ?? c.jobTags ?? []),
    industry_tags: _normalizeStringArray(c.industry_tags ?? c.industryTags ?? []),
    suggestedResumeBullet: c.suggestedResumeBullet?.toString().trim() || null,
    riskNotes: _normalizeStringArray(c.riskNotes ?? []),
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
export async function extractExperienceCandidates({ rawText, signal, careerRoleLabel = "", jobId = "" } = {}) {
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
  const prompt = _buildPrompt(rawText.trim(), { careerRoleLabel, jobId });

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
