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

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: "METHOD_NOT_ALLOWED", message: "Only POST is supported" },
      meta: { endpoint: "newgrad-report-ai-review", model: "gpt-4o-mini", ms: Date.now() - t0, requestId },
    });
  }

  const gate = await checkAiGate(req, "newgrad-report-ai-review");
  if (!gate.allow) {
    return res.status(gate.status).json({
      ok: false,
      data: null,
      error: { code: gate.code, message: gate.message },
      meta: { endpoint: "newgrad-report-ai-review", model: "gpt-4o-mini", ms: Date.now() - t0, requestId },
    });
  }

  const payload = req.body?.payload || req.body;

  const isInvalidPayload =
    !payload ||
    typeof payload !== "object" ||
    payload.version !== "newgrad_report_ai_review_payload_v1" ||
    payload.status !== "ok" ||
    !payload.target?.job ||
    !payload.axisSummary ||
    !payload.currentDraft;

  if (isInvalidPayload) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: { code: "INVALID_PAYLOAD", message: "payload must be a valid newgrad_report_ai_review_payload_v1 object" },
      meta: { endpoint: "newgrad-report-ai-review" },
    });
  }

  const model = "gpt-4o-mini";
  const temperature = 0.2;
  const max_tokens = 2800;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(payload);

  try {
    const openaiResult = await callOpenAIChatCompletionDirect({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
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
        error: { code: openaiResult.error?.code || "OPENAI_REQUEST_FAILED", message: openaiResult.error?.message || "OpenAI API request failed" },
        meta: { endpoint: "newgrad-report-ai-review", model, ms: Date.now() - t0, requestId },
      });
    }

    const aiContent = openaiResult.data?.choices?.[0]?.message?.content;
    if (!aiContent) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { code: "EMPTY_AI_RESPONSE", message: "AI returned empty response" },
        meta: { endpoint: "newgrad-report-ai-review", model, ms: Date.now() - t0, requestId },
      });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(aiContent);
    } catch {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[1]);
        } catch {
          return res.status(500).json({
            ok: false,
            data: null,
            error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
            meta: { endpoint: "newgrad-report-ai-review", model, ms: Date.now() - t0, requestId },
          });
        }
      } else {
        return res.status(500).json({
          ok: false,
          data: null,
          error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
          meta: { endpoint: "newgrad-report-ai-review", model, ms: Date.now() - t0, requestId },
        });
      }
    }

    const reviewResult = sanitizeReviewResult(parsedData?.reviewResult ?? parsedData);

    return res.status(200).json({
      ok: true,
      data: { reviewResult },
      error: null,
      meta: {
        endpoint: "newgrad-report-ai-review",
        model,
        version: "newgrad_report_ai_review_v1",
        ms: Date.now() - t0,
        requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Newgrad report AI review error:`, error.message);

    return res.status(500).json({
      ok: false,
      data: null,
      error: { code: "INTERNAL_SERVER_ERROR", message: "An error occurred during review" },
      meta: { endpoint: "newgrad-report-ai-review", model, ms: Date.now() - t0, requestId },
    });
  }
}

function buildSystemPrompt() {
  return `You are an AI reviewer for Korean newgrad (신입) job application analysis reports.

Your task is to review a structured payload containing axis-based analysis of a job applicant and provide calibration feedback on the report text.

## Axis Guard Rules

These guards are HARD constraints. Violation invalidates your response.

### jobStructure axis — GUARD: major_to_job_only
- You MUST only comment on the connection between the applicant's major/coursework and the target job's core tasks.
- Do NOT mention project experience, internship experience, or extracurricular activities in axisComments for the jobStructure axis.
- allowedInterpretation: "전공과 목표 직무 핵심 과업의 연결만 설명"

### industryContext axis
- Comment only on industry domain understanding signals.
- Do not invent domain signals not present in the payload.

### responsibilityScope axis
- Comment only on ownership and execution depth signals.
- Do not conflate collaboration with direct ownership.

### customerType axis
- Comment only on stakeholder awareness and communication signals.

### roleCharacter axis
- Comment only on job-role fit and work style alignment signals.

## Output Contract

Respond ONLY with valid JSON matching this schema:
{
  "reviewResult": {
    "overallRead": "string — concise overall recruiter read of this applicant (max 400 chars)",
    "axisComments": [
      {
        "axisKey": "jobStructure|industryContext|responsibilityScope|customerType|roleCharacter",
        "comment": "string — calibration comment for this axis (max 220 chars)",
        "signal": "strong|moderate|weak|missing"
      }
    ],
    "jobIndustryContextFixes": [
      {
        "targetField": "string — which field in the report needs fixing",
        "issue": "string — what is wrong or misleading",
        "suggestedRewrite": "string — suggested replacement text (max 220 chars)"
      }
    ],
    "preparationHints": [
      {
        "hint": "string — actionable preparation hint for the applicant (max 180 chars)"
      }
    ],
    "guardsApplied": ["string — list of guard keys that were enforced, e.g. major_to_job_only"]
  }
}

Do not return more than 5 axisComments, 5 jobIndustryContextFixes, or 2 preparationHints.
Respond ONLY with valid JSON. No markdown, no prose outside the JSON object.`;
}

function buildUserPrompt(payload) {
  return `Review the following newgrad application analysis payload and return calibration feedback.

PAYLOAD:
${JSON.stringify(payload)}

Instructions:
1. overallRead: Summarize how a recruiter would read this applicant based on the axis scores and draft text.
2. axisComments: For each axis present in axisSummary, provide a calibration comment. Enforce the jobStructure guard strictly — major/coursework only, no project/internship.
3. jobIndustryContextFixes: Identify up to 5 places in currentDraft where job/industry context language is weak or incorrect. Suggest a concise rewrite.
4. preparationHints: Provide at most 2 actionable preparation hints based on the weakest axes and guardContext flags.
5. guardsApplied: List every guard key you enforced during your review.`;
}

function truncate(val, max) {
  if (typeof val !== "string") return "";
  return val.length > max ? val.substring(0, max) + "..." : val;
}

function sanitizeReviewResult(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      overallRead: "",
      axisComments: [],
      jobIndustryContextFixes: [],
      preparationHints: [],
      guardsApplied: [],
    };
  }

  const VALID_SIGNALS = new Set(["strong", "moderate", "weak", "missing"]);

  const overallRead = truncate(typeof raw.overallRead === "string" ? raw.overallRead : "", 400);

  const axisComments = Array.isArray(raw.axisComments)
    ? raw.axisComments.slice(0, 5).map((item) => ({
        axisKey: typeof item?.axisKey === "string" ? item.axisKey : "",
        comment: truncate(typeof item?.comment === "string" ? item.comment : "", 220),
        signal: VALID_SIGNALS.has(item?.signal) ? item.signal : "missing",
      }))
    : [];

  const jobIndustryContextFixes = Array.isArray(raw.jobIndustryContextFixes)
    ? raw.jobIndustryContextFixes.slice(0, 5).map((item) => ({
        targetField: typeof item?.targetField === "string" ? item.targetField : "",
        issue: typeof item?.issue === "string" ? item.issue : "",
        suggestedRewrite: truncate(typeof item?.suggestedRewrite === "string" ? item.suggestedRewrite : "", 220),
      }))
    : [];

  const preparationHints = Array.isArray(raw.preparationHints)
    ? raw.preparationHints.slice(0, 2).map((item) => ({
        hint: truncate(typeof item?.hint === "string" ? item.hint : "", 180),
      }))
    : [];

  const guardsApplied = Array.isArray(raw.guardsApplied)
    ? raw.guardsApplied.slice(0, 10).filter((g) => typeof g === "string")
    : [];

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
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));
      return {
        ok: false,
        error: { code: "OPENAI_API_ERROR", message: errorData.error?.message || `OpenAI API returned ${response.status}` },
      };
    }

    const result = await response.json();
    return { ok: true, data: result };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        ok: false,
        error: { code: "OPENAI_TIMEOUT", message: "OpenAI request timed out after 55 seconds" },
      };
    }
    return {
      ok: false,
      error: { code: "OPENAI_REQUEST_FAILED", message: error.message || "Failed to call OpenAI API" },
    };
  }
}
