import { checkAiGate } from "./_security.js";

export default async function handler(req, res) {
  const t0 = Date.now();

  // CORS
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const allow = new Set([
      "http://localhost:5173",
      "https://true-hr.github.io",
      "https://reject-analyzer.vercel.app",
    ]);
    const ao = allow.has(origin) ? origin : "https://true-hr.github.io";
    res.setHeader("Access-Control-Allow-Origin", ao);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  } catch {}

  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  const requestId = req.body?.requestId || `ngr-${Date.now()}`;
  const endpoint = "newgrad-report-ai-review";

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported" },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  const gate = await checkAiGate(req, endpoint);
  if (!gate.allow) {
    return res.status(gate.status).json({
      ok: false,
      data: null,
      error: { code: gate.code, message: gate.message },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  // Extract payload — accept body.payload wrapper or raw body
  const payload = req.body?.payload || req.body;

  // Validate against PR #383 contract
  const gc = payload?.guardContext;
  const isInvalid =
    !payload ||
    typeof payload !== "object" ||
    payload.version !== "newgrad_report_ai_review_payload_v1" ||
    payload.status !== "ready" ||
    !payload.target ||
    typeof payload.target !== "object" ||
    (!payload.target.jobId && !payload.target.jobLabel) ||
    !payload.axisSummary ||
    typeof payload.axisSummary !== "object" ||
    payload.axisSummary?.jobStructure?.guard !== "major_to_job_only" ||
    !gc ||
    gc.noScoreChange !== true ||
    gc.noBandChange !== true ||
    gc.noExperienceGeneration !== true ||
    gc.noAdmissionConclusion !== true ||
    gc.axis1MajorToJobOnly !== true ||
    !payload.currentDraft ||
    typeof payload.currentDraft !== "object";

  if (isInvalid) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: "payload must be a valid newgrad_report_ai_review_payload_v1 with status=ready and all guardContext flags true",
      },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  const model = "gpt-4o-mini";
  const temperature = 0.2;
  const max_tokens = 2800;

  try {
    const openaiResult = await callOpenAIChatCompletionDirect({
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(payload) },
      ],
      model,
      temperature,
      max_tokens,
      response_format: { type: "json_object" },
      requestId,
      t0,
    });

    if (!openaiResult.ok) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: {
          code: openaiResult.error?.code || "OPENAI_REQUEST_FAILED",
          message: openaiResult.error?.message || "OpenAI API request failed",
        },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    const aiContent = openaiResult.data?.choices?.[0]?.message?.content;
    if (!aiContent) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { code: "EMPTY_AI_RESPONSE", message: "AI returned empty response" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      const m = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (m) {
        try { parsed = JSON.parse(m[1]); } catch {
          return res.status(500).json({
            ok: false, data: null,
            error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
            meta: { endpoint, model, ms: Date.now() - t0, requestId },
          });
        }
      } else {
        return res.status(500).json({
          ok: false, data: null,
          error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
          meta: { endpoint, model, ms: Date.now() - t0, requestId },
        });
      }
    }

    const raw = parsed?.reviewResult ?? parsed;
    if (!raw || typeof raw !== "object") {
      return res.status(500).json({
        ok: false, data: null,
        error: { code: "AI_MISSING_REVIEW_RESULT", message: "AI response missing reviewResult" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    const reviewResult = sanitizeReviewResult(raw);

    return res.status(200).json({
      ok: true,
      data: { reviewResult },
      error: null,
      meta: {
        endpoint,
        model,
        version: "newgrad_report_ai_review_v1",
        ms: Date.now() - t0,
        requestId,
      },
    });
  } catch (err) {
    console.error(`[${requestId}] newgrad-report-ai-review error:`, err.message);
    return res.status(500).json({
      ok: false, data: null,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An error occurred during review" },
      meta: { endpoint, model, ms: Date.now() - t0, requestId },
    });
  }
}

function buildSystemPrompt() {
  return `당신은 한국 신입 취업 지원서 분석 리포트를 검토하는 AI 리뷰어입니다.

## 절대 규칙 (HARD CONSTRAINTS)

- 응답은 반드시 한국어로 작성한다.
- 응답은 반드시 유효한 JSON만 반환한다. 마크다운, 설명 텍스트 금지.
- 점수(score, displayScore)를 변경하거나 언급하지 않는다.
- 밴드(band)를 변경하거나 재판단하지 않는다.
- 이력서에 없는 경험을 생성하거나 추정하지 않는다.
- 합격/불합격 또는 채용 확률을 언급하지 않는다.

## 축별 해석 규칙

### Axis1 — jobStructure (guard: major_to_job_only)
- 전공과 목표 직무 핵심 과업의 연결만 설명한다.
- 프로젝트, 인턴십, 자격증, 강점, 업무 스타일을 Axis1 코멘트의 근거로 사용하지 않는다.

### Axis2 — industryContext (guard: industry_understanding)
- 산업 도메인 이해도 신호만 평가한다.

### Axis3 — responsibilityScope (guard: experience_depth)
- 실행 깊이와 책임 수준 신호만 평가한다.

### Axis4 — customerType (guard: stakeholder_interaction)
- 이해관계자 소통 및 고객 유형 인식만 평가한다.

### Axis5 — roleCharacter (guard: self_report_strengths)
- 자기보고 강점과 업무 스타일만 평가하며, 보수적으로 해석한다.

## 출력 스키마

정확히 아래 구조의 JSON을 반환한다:

{
  "reviewResult": {
    "overallRead": "",
    "axisComments": {
      "jobStructure": { "comment": "" },
      "industryContext": { "comment": "" },
      "responsibilityScope": { "comment": "" },
      "customerType": { "comment": "" },
      "roleCharacter": { "comment": "" }
    },
    "jobIndustryContextFixes": [
      { "sectionKey": "", "problem": "", "suggestedRewrite": "" }
    ],
    "preparationHints": [
      { "area": "", "hint": "" }
    ],
    "guardsApplied": [
      "no_score_change",
      "no_band_change",
      "no_experience_generation",
      "axis1_major_to_job_only"
    ]
  }
}`;
}

function buildUserPrompt(payload) {
  return `아래 신입 지원서 분석 페이로드를 검토하고 리뷰 결과를 반환하세요.

PAYLOAD:
${JSON.stringify(payload)}

지시사항:
1. overallRead: 리크루터 관점에서 이 지원자를 어떻게 읽는지 종합 요약 (400자 이내)
2. axisComments: 각 축별 코멘트 — 각 축의 guard 규칙을 엄격히 따를 것
   - jobStructure: 전공과 직무 연결만, 프로젝트/인턴 근거 절대 금지
3. jobIndustryContextFixes: currentDraft에서 직무/산업 맥락 언어가 약하거나 부정확한 부분 최대 5개
4. preparationHints: 가장 약한 축과 guardContext를 바탕으로 실행 가능한 준비 힌트 최대 2개
5. guardsApplied: 적용한 guard 키 목록`;
}

function trunc(val, max) {
  if (typeof val !== "string") return "";
  return val.length > max ? val.slice(0, max) + "…" : val;
}

const DEFAULT_GUARDS = [
  "no_score_change",
  "no_band_change",
  "no_experience_generation",
  "axis1_major_to_job_only",
];

const AXIS_KEYS = [
  "jobStructure",
  "industryContext",
  "responsibilityScope",
  "customerType",
  "roleCharacter",
];

function sanitizeReviewResult(raw) {
  // overallRead
  const overallRead = trunc(typeof raw.overallRead === "string" ? raw.overallRead : "", 400);

  // axisComments — must be object with named axis keys
  const rawAc = raw.axisComments;
  const axisComments = {};
  for (const key of AXIS_KEYS) {
    const entry = rawAc && typeof rawAc === "object" ? rawAc[key] : null;
    axisComments[key] = {
      comment: trunc(entry && typeof entry.comment === "string" ? entry.comment : "", 220),
    };
  }

  // jobIndustryContextFixes — array, max 5, fields: sectionKey, problem, suggestedRewrite
  const rawFixes = Array.isArray(raw.jobIndustryContextFixes) ? raw.jobIndustryContextFixes : [];
  const jobIndustryContextFixes = rawFixes.slice(0, 5).map((item) => ({
    sectionKey: typeof item?.sectionKey === "string" ? item.sectionKey : "",
    problem: trunc(typeof item?.problem === "string" ? item.problem : "", 180),
    suggestedRewrite: trunc(typeof item?.suggestedRewrite === "string" ? item.suggestedRewrite : "", 220),
  }));

  // preparationHints — array, max 2, fields: area, hint
  const rawHints = Array.isArray(raw.preparationHints) ? raw.preparationHints : [];
  const preparationHints = rawHints.slice(0, 2).map((item) => ({
    area: typeof item?.area === "string" ? item.area : "",
    hint: trunc(typeof item?.hint === "string" ? item.hint : "", 180),
  }));

  // guardsApplied — array of strings, fallback to defaults
  const rawGuards = raw.guardsApplied;
  const guardsApplied = Array.isArray(rawGuards) && rawGuards.length > 0
    ? rawGuards.slice(0, 10).filter((g) => typeof g === "string")
    : DEFAULT_GUARDS;

  return { overallRead, axisComments, jobIndustryContextFixes, preparationHints, guardsApplied };
}

async function callOpenAIChatCompletionDirect({ messages, model, temperature, max_tokens, response_format, requestId, t0 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: { code: "OPENAI_API_KEY_MISSING", message: "OPENAI_API_KEY is not configured" },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ messages, model, temperature, max_tokens, response_format }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      return {
        ok: false,
        error: { code: "OPENAI_API_ERROR", message: errData.error?.message || `OpenAI API returned ${response.status}` },
      };
    }

    return { ok: true, data: await response.json() };
  } catch (err) {
    if (err.name === "AbortError") {
      return { ok: false, error: { code: "OPENAI_TIMEOUT", message: "OpenAI request timed out after 55 seconds" } };
    }
    return { ok: false, error: { code: "OPENAI_REQUEST_FAILED", message: err.message || "Failed to call OpenAI API" } };
  }
}
