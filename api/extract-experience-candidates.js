// api/extract-experience-candidates.js
// POST /api/extract-experience-candidates
// Extracts career experience candidates from raw work trace text.
// Pattern: api/openai-proxy.js + api/rejection-analysis-ai.js

const RAW_TEXT_MAX_CHARS = 8000;
const RAW_TEXT_MIN_CHARS = 30;

function _setCors(req, res) {
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
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  } catch {}
}

function _normalizeCandidate(raw) {
  const RESUME_POTENTIAL_ALLOWED = new Set(["high", "medium", "low"]);
  const CONFIDENCE_ALLOWED = new Set(["high", "medium", "low"]);

  const asStr = (v) => (typeof v === "string" ? v.trim() : "");
  const asArr = (v) => (Array.isArray(v) ? v.filter((s) => typeof s === "string").map((s) => s.trim()) : []);

  const rp = asStr(raw?.resumePotential).toLowerCase();
  const cl = asStr(raw?.confidenceLevel).toLowerCase();

  return {
    title: asStr(raw?.title),
    role: asStr(raw?.role),
    situation: asStr(raw?.situation),
    problem: asStr(raw?.problem),
    actions: asArr(raw?.actions),
    result: asArr(raw?.result),
    collaboration: asArr(raw?.collaboration),
    skills: asArr(raw?.skills),
    resumePotential: RESUME_POTENTIAL_ALLOWED.has(rp) ? rp : "medium",
    confidenceLevel: CONFIDENCE_ALLOWED.has(cl) ? cl : "low",
    missingInfoQuestions: asArr(raw?.missingInfoQuestions),
    riskNotes: asArr(raw?.riskNotes),
    evidenceTexts: asArr(raw?.evidenceTexts),
    suggestedResumeBullet: asStr(raw?.suggestedResumeBullet),
  };
}

function _normalizeResponse(raw) {
  const SOURCE_TYPES = new Set(["kakao", "slack", "meeting_note", "email", "work_report", "csv", "image", "unknown"]);
  const asStr = (v) => (typeof v === "string" ? v.trim() : "");

  const st = asStr(raw?.sourceType).toLowerCase();
  const candidates = Array.isArray(raw?.experienceCandidates)
    ? raw.experienceCandidates.slice(0, 5).map(_normalizeCandidate)
    : [];

  return {
    sourceType: SOURCE_TYPES.has(st) ? st : "unknown",
    detectedPeriod: asStr(raw?.detectedPeriod) || null,
    summary: asStr(raw?.summary),
    experienceCandidates: candidates,
  };
}

function _buildPrompt(rawText) {
  const truncated = rawText.length > RAW_TEXT_MAX_CHARS
    ? rawText.slice(0, RAW_TEXT_MAX_CHARS)
    : rawText;

  return `너는 업무 기록을 이력서/면접에서 활용 가능한 경험 단위로 변환하는 HR 커리어 분석가다.

입력 자료는 카톡, 슬랙, 회의록, 메일, 업무보고, CSV, 이미지 OCR 결과 등일 수 있다.

목표:
1. 자료 유형을 판단한다. (kakao|slack|meeting_note|email|work_report|csv|image|unknown 중 하나)
2. 경력으로 활용 가능한 경험 후보를 1~5개 찾는다.
3. 각 경험을 STAR 구조에 가깝게 정리한다.
4. 과장 가능한 표현은 피한다.
5. 결과나 수치가 부족하면 missingInfoQuestions에 보완 질문을 만든다.
6. suggestedResumeBullet에는 이력서에 바로 쓸 수 있는 문장을 넣되, 근거가 없는 성과는 넣지 않는다.
7. 판단 근거가 되는 원문 표현을 evidenceTexts에 넣는다.

주의:
- 자료에 없는 성과를 만들어내지 마라.
- 사용자가 주도했다고 단정하지 마라. role 필드에 "담당" 또는 "참여" 정도로 표현하라.
- 대화 속 발화자와 사용자의 역할을 구분하라.
- 결과가 없으면 result 배열을 비우거나 "결과 확인 필요"로 표시하라.
- 단순 요약이 아니라 경력 활용 가능성을 판단하라.
- 개인정보나 민감정보는 불필요하게 재노출하지 마라.

아래 자료를 분석해 다음 JSON만 반환하라. 마크다운이나 추가 텍스트 없이 JSON만.

{
  "sourceType": "kakao|slack|meeting_note|email|work_report|csv|image|unknown",
  "detectedPeriod": "string|null",
  "summary": "string",
  "experienceCandidates": [
    {
      "title": "string",
      "role": "string",
      "situation": "string",
      "problem": "string",
      "actions": ["string"],
      "result": ["string"],
      "collaboration": ["string"],
      "skills": ["string"],
      "resumePotential": "high|medium|low",
      "confidenceLevel": "high|medium|low",
      "missingInfoQuestions": ["string"],
      "riskNotes": ["string"],
      "evidenceTexts": ["string"],
      "suggestedResumeBullet": "string"
    }
  ]
}

--- 분석 대상 자료 ---
${truncated}`;
}

export default async function handler(req, res) {
  const t0 = Date.now();
  _setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  const requestId = `wt-${Date.now()}`;

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "POST만 허용됩니다." },
      requestId,
      ms: Date.now() - t0,
    });
  }

  const rawText = req.body?.rawText;

  if (!rawText || typeof rawText !== "string") {
    return res.status(400).json({
      ok: false,
      error: { code: "INVALID_RAW_TEXT", message: "rawText가 필요합니다." },
      requestId,
      ms: Date.now() - t0,
    });
  }

  const trimmed = rawText.trim();
  if (trimmed.length < RAW_TEXT_MIN_CHARS) {
    return res.status(400).json({
      ok: false,
      error: { code: "RAW_TEXT_TOO_SHORT", message: `내용이 너무 짧아요. ${RAW_TEXT_MIN_CHARS}자 이상 입력해 주세요.` },
      requestId,
      ms: Date.now() - t0,
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: { code: "API_KEY_MISSING", message: "AI 분석 서비스가 준비되지 않았습니다." },
      requestId,
      ms: Date.now() - t0,
    });
  }

  const prompt = _buildPrompt(trimmed);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a Korean HR career analyst. Always respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 2500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!openaiRes.ok) {
      const errData = await openaiRes.json().catch(() => null);
      return res.status(500).json({
        ok: false,
        error: {
          code: "OPENAI_API_ERROR",
          message: errData?.error?.message || `OpenAI API 오류 (${openaiRes.status})`,
        },
        requestId,
        ms: Date.now() - t0,
      });
    }

    const openaiData = await openaiRes.json();
    const aiContent = openaiData?.choices?.[0]?.message?.content;

    if (!aiContent) {
      return res.status(500).json({
        ok: false,
        error: { code: "EMPTY_AI_RESPONSE", message: "AI 응답이 비어 있습니다." },
        requestId,
        ms: Date.now() - t0,
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1]);
        } catch {
          return res.status(500).json({
            ok: false,
            error: { code: "AI_JSON_PARSE_FAILED", message: "AI 응답을 파싱하지 못했습니다." },
            requestId,
            ms: Date.now() - t0,
          });
        }
      } else {
        return res.status(500).json({
          ok: false,
          error: { code: "AI_JSON_PARSE_FAILED", message: "AI 응답을 파싱하지 못했습니다." },
          requestId,
          ms: Date.now() - t0,
        });
      }
    }

    const normalized = _normalizeResponse(parsed);

    return res.status(200).json({
      ok: true,
      data: normalized,
      requestId,
      ms: Date.now() - t0,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      return res.status(504).json({
        ok: false,
        error: { code: "OPENAI_TIMEOUT", message: "AI 분석 시간이 초과됐어요. 다시 시도해 주세요." },
        requestId,
        ms: Date.now() - t0,
      });
    }
    console.error(`[${requestId}] extract-experience-candidates error:`, err?.message || err);
    return res.status(500).json({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "경험 분석 중 오류가 발생했어요." },
      requestId,
      ms: Date.now() - t0,
    });
  }
}
