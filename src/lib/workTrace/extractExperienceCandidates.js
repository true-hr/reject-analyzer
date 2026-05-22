// src/lib/workTrace/extractExperienceCandidates.js
// Calls /api/openai-proxy to extract career experience candidates from raw work trace text.

const SOURCE_TYPES = new Set([
  "kakao", "slack", "meeting_note", "email",
  "work_report", "csv", "image", "ai_conversation", "unknown",
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
  const { careerRoleLabel = "", jobId = "", sourceMode = "work_trace" } = context;
  const contextLine = careerRoleLabel
    ? `사용자의 현재/희망 직무: ${careerRoleLabel}${jobId ? ` (직무 ID: ${jobId})` : ""}`
    : "직무 맥락: 미제공 (직무 맥락 불충분 — 가능한 범위에서 연결 후보를 제시하세요)";

  const aiConversationRules = sourceMode === "ai_conversation"
    ? `
[AI 대화 분석 규칙]
- user 발화는 사용자 경험 후보가 될 수 있습니다.
- assistant 발화는 AI의 제안일 뿐, 그 자체로 사용자 경험이 아닙니다.
- 사용자가 실제로 했다고 말한 일만 경험 후보로 추출하세요.
- AI가 제안한 아이디어, 전략, 예시 문장은 경험으로 저장하지 마세요.
- AI가 작성해준 면접 답변/이력서 문장은 실제 경험 근거가 있을 때만 후보로 사용하세요.
- "주도했다", "성공시켰다", "개선했다" 같은 표현은 원문 근거가 없으면 쓰지 마세요.
- 결과 수치가 없으면 만들지 마세요.
- 논의만 한 것과 실제 실행한 것을 구분하세요.
- 근거가 약하면 riskNotes에 과장 위험을 남기세요.
- 민감정보·사적 내용·회사 기밀은 경험 카드에서 제외하세요.
- 일반 조언만 있는 대화는 경험 후보가 없는 것이 정상입니다.

[AI 대화 모드 경험 후보 생성 최소 조건]
- 경험 후보를 만들려면, user 발화 안에 사용자가 실제로 한 행동·결정·실행·산출물·협업·결과 중 최소 하나가 원문 근거(evidenceTexts로 인용 가능한 문장)로 존재해야 합니다.
- 단순 질문, 방법 문의, 고민 상담, 조언 요청, 감사 인사만 있는 대화는 경험 후보를 만들지 말고 experienceCandidates를 빈 배열 []로 반환하세요.
- AI(assistant)가 제안한 "해야 할 일" 목록은, 사용자가 그것을 실제로 실행했다고 명시적으로 말하지 않는 한 사용자 경험으로 간주하지 마세요.
- 사용자가 "했다 / 바꿨다 / 정했다 / 만들었다 / 실행했다 / 조율했다 / 분석했다 / 개선했다 / 적용했다"처럼 실제로 한 행동을 말하지 않았다면 경험 후보를 만들지 마세요.
- "이직 준비", "면접 준비", "커리어 고민", "조언 요청" 같은 추상적 상태·의도만으로는 경험 후보를 만들지 마세요. 이는 실제 경험이 아니라 질문/상담입니다.
- 이 모드에서는 [출력 규칙] 4번의 "1~5개" 개수 범위와 무관하게, 위 최소 조건을 만족하는 경험만 추출하세요. 조건을 만족하는 경험이 하나도 없으면 experienceCandidates를 빈 배열 []로 반환하는 것이 정상이며 올바른 결과입니다.
- 억지로 카드 수를 채우지 마세요. 일반 조언 대화에서 experienceCandidates가 []인 것은 실패가 아니라 기대된 정상 결과입니다.
`
    : "";

  return `당신은 한국 인사 담당자이자 커리어 코치입니다.
아래 업무 기록을 읽고, 이력서·면접 소재로 전환할 수 있는 경력 경험 후보를 추출해 주세요.

[사용자 맥락]
${contextLine}
분석 목적: 이 업무 기록을 위 직무의 이력서·면접 소재로 활용하기 위한 경험 후보 추출

[업무 기록]
${rawText}
${aiConversationRules}
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
   - result: 결과 또는 변화 목록 (문자열 배열). 원문에 없는 성과·수치를 새로 만들지 마세요. 단, 원문에 아래 유형의 표현이 있으면 반드시 추출하세요: 수치 개선(예: "0.78에서 0.83 개선"), 완료 결과(예: "8건 수정 완료"), 변화/감소/증가(예: "재문의가 줄었다", "이해 속도가 빨라졌다"), 부분 성과(예: "클릭률이 일부 개선"), 아직 부족한 결과(예: "추가 검증이 필요"), 정성 변화(예: "기준이 통일됐다"). 이런 표현이 전혀 없을 때만 빈 배열 [].
   - resumePotential: high / medium / low — 위 직무 이력서에 활용 가능한지를 기준으로 판단하세요
   - confidenceLevel: high / medium / low
   - skills: 이 경험에서 드러나는 역량·스킬 배열 (예: ["문제 정의", "서비스 기획", "데이터 분석"])
   - job_tags: 이 경험이 연결될 수 있는 직무 태그 배열 (예: ["서비스기획", "PM", "HR"])
   - industry_tags: 관련 산업 태그 배열. 원문에서 산업 맥락이 명확한 경우만 넣으세요 (예: 금융/핀테크, HR Tech, 커머스, 교육 등). 산업이 불분명하거나 일반적인 기업이면 빈 배열 []. "이커머스", "일반 기업", "기타", "비즈니스" 같은 모호한 값은 사용 금지.
   - suggestedResumeBullet: 위 직무 이력서에 바로 쓸 수 있는 1문장 초안. 원문 근거가 부족하면 null.
   - missingInfoQuestions: 결과나 수치가 없으면 보완 질문 1~2개 (문자열 배열), 있으면 빈 배열 []
   - collaboration: 이 경험에서 함께 일하거나 조율한 대상·팀·이해관계자 목록 (문자열 배열). 단순 이름 나열 대신 "대상 + 맥락/조율 내용" 형태로 쓰세요 (예: ["민수와 릴리즈 범위 및 결제 일정 조율", "지연과 마케팅 랜딩 문구 변경 필요성 논의", "개발팀·마케팅팀에 변경 범위 공유"]). 대화형 입력에서는 화자 이름, 상대방, 언급된 팀, 공유/논의 맥락을 포함하세요. "나"는 협업 대상이 아니므로 포함하지 마세요. 협업 정보가 없으면 [].
   - riskNotes: 과장 위험·불확실성 경고 배열 (예: "결과 수치 원문 미확인"). 없으면 빈 배열 []
   - evidenceTexts: 원문에서 근거가 된 문장들 (문자열 배열)
6. 과장 금지. 원문에 없는 내용은 추가하지 마세요.
7. 사용자가 주도했다고 단정하지 마세요. 단, 원문에서 사용자의 발화·지시·결정이 드러나면 role 필드에 "사용자 역할 추정: ..."으로 명시하세요.
8. result, missingInfoQuestions, riskNotes, skills, job_tags, industry_tags, evidenceTexts, actions, collaboration은 반드시 배열로 반환하세요.

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
      "result": ["원문에 결과성 표현이 있으면 여기에 추출", "없으면 빈 배열"],
      "resumePotential": "high|medium|low",
      "confidenceLevel": "high|medium|low",
      "collaboration": ["대상 + 맥락 형태로, 없으면 빈 배열"],
      "skills": ["..."],
      "job_tags": ["..."],
      "industry_tags": [],
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
    collaboration: _normalizeStringArray(c.collaboration ?? c.collaborators ?? []).slice(0, 8),
    evidenceTexts: _normalizeStringArray(c.evidenceTexts ?? []),
    skills: _normalizeStringArray(c.skills ?? []),
    job_tags: _normalizeStringArray(c.job_tags ?? c.jobTags ?? []),
    industry_tags: _normalizeStringArray(c.industry_tags ?? c.industryTags ?? []),
    suggestedResumeBullet: c.suggestedResumeBullet?.toString().trim() || null,
    riskNotes: _normalizeStringArray(c.riskNotes ?? []),
  };
}

function _normalizeResponse(parsed, sourceMode = "work_trace") {
  const sourceType = sourceMode === "ai_conversation"
    ? "ai_conversation"
    : (SOURCE_TYPES.has(parsed.sourceType) ? parsed.sourceType : "unknown");
  const detectedPeriod =
    parsed.detectedPeriod != null ? String(parsed.detectedPeriod).trim() || null : null;
  const summary = parsed.summary?.toString().trim() || "";
  const raw = Array.isArray(parsed.experienceCandidates) ? parsed.experienceCandidates : [];
  const candidates = raw.slice(0, 5).map(_normalizeCandidate);
  return { sourceType, detectedPeriod, summary, candidates };
}

// --- AI conversation mode: deterministic generic-advice filter ---
// Applies ONLY when sourceMode === "ai_conversation". Removes candidates built
// from generic AI advice rather than the user's own actions. Never touches
// work_trace mode.

const _USER_SPEAKER_LABEL = /^\s*(사용자|user|나|me|human)\s*[:：]/i;
const _AI_SPEAKER_LABEL = /^\s*(ai|assistant|chatgpt|gemini|claude|gpt|봇|bot)\s*[:：]/i;

// Korean past-tense action verbs signalling the user actually did something.
const _USER_ACTION_SIGNALS_KO = [
  "했다", "했어", "했어요", "했습니다", "했고", "했는데", "했으며", "했지만",
  "진행했", "수행했", "실행했", "처리했", "추진했",
  "만들었", "만들어", "제작했", "작성했", "구축했", "개발했",
  "바꿨", "바꿔", "변경했", "수정했", "개선했", "개선됐", "보완했", "적용했", "반영했",
  "정했", "결정했", "판단했", "전환했", "잡았",
  "분석했", "분류했", "정리했", "수집했", "모았", "모아",
  "조율했", "협의했", "공유했", "설계했", "기획했",
  "추가했", "도입했", "운영했", "관리했",
  "줄였", "높였", "늘렸", "감소했", "증가했",
  "고민했",
];

// English first-person action signals.
const _USER_ACTION_SIGNALS_EN = [
  "i did", "i built", "i created", "i made", "i wrote", "i changed",
  "i decided", "i analyzed", "i implemented", "i coordinated", "i improved",
  "i designed", "i organized", "i managed", "i developed", "i fixed",
  "we built", "we created", "we changed", "we decided", "we implemented",
];

// Candidate titles that describe generic advice rather than a real experience.
const _GENERIC_ADVICE_TITLE_PATTERNS = [
  "이직준비조언", "면접준비조언", "커리어조언", "커리어상담", "커리어고민",
  "조언요청", "방법안내", "준비방법", "해야할일",
  "방법제안", "방법설명", "방법추천", "이력서정리방법", "jd분석방법", "면접준비방법",
];

// Action phrasings that describe "AI suggested a method" rather than user action.
const _ADVICE_ACTION_PATTERNS = [
  "방법제안", "방법안내", "방법설명", "방법추천", "준비방법",
  "방법을제안", "방법을안내", "방법을설명", "하라고제안", "하라고안내",
];

// Extract only the user's utterances from a conversation transcript.
// Falls back to the whole rawText when speaker labels cannot be parsed.
function _extractUserUtteranceText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";
  const userLines = [];
  let speaker = null; // "user" | "ai" | null
  for (const line of rawText.split(/\r?\n/)) {
    if (_USER_SPEAKER_LABEL.test(line)) {
      speaker = "user";
      userLines.push(line.replace(_USER_SPEAKER_LABEL, "").trim());
    } else if (_AI_SPEAKER_LABEL.test(line)) {
      speaker = "ai";
    } else if (speaker === "user") {
      userLines.push(line.trim());
    }
  }
  const joined = userLines.filter(Boolean).join("\n").trim();
  return joined.length >= 2 ? joined : rawText;
}

// True when the user text contains a real action/decision/result signal.
function _hasUserExperienceActionSignal(userText) {
  if (!userText || typeof userText !== "string") return false;
  if (_USER_ACTION_SIGNALS_KO.some((s) => userText.includes(s))) return true;
  const lower = userText.toLowerCase();
  return _USER_ACTION_SIGNALS_EN.some((s) => lower.includes(s));
}

// True when a candidate is clearly generic AI advice (not a real experience).
function _isGenericAdviceOnlyCandidate(candidate) {
  const compact = (value) => (value ?? "").toString().replace(/\s+/g, "").toLowerCase();
  const title = compact(candidate?.title);
  if (_GENERIC_ADVICE_TITLE_PATTERNS.some((p) => title.includes(p))) return true;
  const actions = Array.isArray(candidate?.actions) ? candidate.actions : [];
  if (actions.length > 0) {
    const allAdvice = actions.every((a) => {
      const na = compact(a);
      return _ADVICE_ACTION_PATTERNS.some((p) => na.includes(p));
    });
    if (allAdvice) return true;
  }
  return false;
}

// Filter candidates for ai_conversation mode only.
// - No user action signal at all -> generic advice conversation -> return [].
// - Action signal present -> drop clearly generic-advice candidates only.
function _filterAiConversationCandidates(candidates, rawText) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  const userText = _extractUserUtteranceText(rawText);
  if (!_hasUserExperienceActionSignal(userText)) return [];
  return candidates.filter((c) => !_isGenericAdviceOnlyCandidate(c));
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
export async function extractExperienceCandidates({ rawText, signal, careerRoleLabel = "", jobId = "", sourceMode = "work_trace" } = {}) {
  if (!rawText || typeof rawText !== "string" || rawText.trim().length < 30) {
    return {
      ok: false,
      errorCode: "RAW_TEXT_TOO_SHORT",
      message: "내용이 너무 짧아요. 조금 더 입력해 주세요.",
    };
  }

  const mode = sourceMode === "ai_conversation" ? "ai_conversation" : "work_trace";
  const base = _getApiBase();
  const requestId = `work-trace-${Date.now()}`;
  const t0 = Date.now();
  const prompt = _buildPrompt(rawText.trim(), { careerRoleLabel, jobId, sourceMode: mode });

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

  const { sourceType, detectedPeriod, summary, candidates } = _normalizeResponse(parsed, mode);

  // ai_conversation mode only: drop candidates built from generic AI advice.
  // work_trace mode keeps the original normalize/return flow unchanged.
  const finalCandidates = mode === "ai_conversation"
    ? _filterAiConversationCandidates(candidates, rawText.trim())
    : candidates;

  return {
    ok: true,
    sourceType,
    sourceMode: mode,
    detectedPeriod,
    summary,
    candidates: finalCandidates,
  };
}
