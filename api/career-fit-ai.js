import { checkAiGate } from "./_security.js";

const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "https://true-hr.github.io",
  "https://reject-analyzer.vercel.app",
]);

function setCorsHeaders(req, res) {
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const ao = ALLOWED_ORIGINS.has(origin) ? origin : "https://true-hr.github.io";
    res.setHeader("Access-Control-Allow-Origin", ao);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  } catch {}
}

function jsonError(res, status, code, message, meta) {
  return res.status(status).json({ ok: false, data: null, error: { code, message }, meta });
}

// @MX:ANCHOR: [AUTO] POST /api/career-fit-ai — entry point for career fit AI evidence map
// @MX:REASON: Called from useCareerFitAiEvidence hook; must remain non-destructive to existing report
export default async function handler(req, res) {
  const t0 = Date.now();
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") return res.status(200).end("");

  const requestId = req.body?.requestId || `cfa-${Date.now()}`;
  const baseMeta = { provider: "openai", model: "gpt-4o-mini", ms: 0, requestId };

  if (req.method !== "POST") {
    return jsonError(res, 405, "METHOD_NOT_ALLOWED", "Only POST is supported", {
      ...baseMeta,
      ms: Date.now() - t0,
    });
  }

  const gate = await checkAiGate(req, "career-fit-ai");
  if (!gate.allow) {
    return jsonError(res, gate.status, gate.code, gate.message, {
      ...baseMeta,
      ms: Date.now() - t0,
    });
  }

  const {
    currentJobLabel = "",
    targetJobLabel = "",
    currentIndustryLabel = "",
    targetIndustryLabel = "",
    candidateExperienceText = "",
    reportContext = null,
    model = "gpt-4o-mini",
    temperature = 0.25,
    max_tokens = 2800,
  } = req.body ?? {};

  const expText = String(candidateExperienceText || "").trim();

  // Skip AI call if experience text is missing or too short
  if (!expText || expText.length < 30) {
    return res.status(200).json({
      ok: true,
      empty: true,
      data: null,
      reason: "NO_CANDIDATE_EXPERIENCE_TEXT",
      meta: { ...baseMeta, ms: Date.now() - t0 },
    });
  }

  if (!currentJobLabel || !targetJobLabel) {
    return jsonError(res, 400, "MISSING_JOB_LABELS", "currentJobLabel and targetJobLabel are required", {
      ...baseMeta,
      ms: Date.now() - t0,
    });
  }

  const prompt = buildCareerFitEvidencePrompt({
    currentJobLabel: String(currentJobLabel).trim(),
    targetJobLabel: String(targetJobLabel).trim(),
    currentIndustryLabel: String(currentIndustryLabel).trim(),
    targetIndustryLabel: String(targetIndustryLabel).trim(),
    candidateExperienceText: expText,
    reportContext,
  });

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return jsonError(res, 503, "OPENAI_NOT_CONFIGURED", "OpenAI API key not configured", {
        ...baseMeta,
        ms: Date.now() - t0,
      });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a career transition analyst. Your job is to read candidate experience text and extract structured evidence about job fit. Respond only with valid JSON. Do not invent experiences. Do not make score judgments. Do not predict hiring outcomes.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text().catch(() => "");
      console.error(`[${requestId}] OpenAI error ${openaiRes.status}:`, errBody.slice(0, 300));
      return jsonError(res, 502, "OPENAI_REQUEST_FAILED", "OpenAI API returned an error", {
        ...baseMeta,
        ms: Date.now() - t0,
      });
    }

    const openaiData = await openaiRes.json().catch(() => null);
    const aiContent = openaiData?.choices?.[0]?.message?.content;

    if (!aiContent) {
      return jsonError(res, 502, "EMPTY_AI_RESPONSE", "AI returned empty response", {
        ...baseMeta,
        ms: Date.now() - t0,
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
          parsedData = null;
        }
      }
    }

    if (!parsedData || typeof parsedData !== "object") {
      return jsonError(res, 502, "AI_JSON_PARSE_FAILED", "AI response was not valid JSON", {
        ...baseMeta,
        ms: Date.now() - t0,
      });
    }

    const normalized = normalizeEvidenceMap(parsedData);

    return res.status(200).json({
      ok: true,
      empty: false,
      data: normalized,
      meta: { ...baseMeta, ms: Date.now() - t0 },
    });
  } catch (err) {
    console.error(`[${requestId}] career-fit-ai error:`, err?.message);
    return jsonError(res, 500, "INTERNAL_SERVER_ERROR", "An error occurred during analysis", {
      ...baseMeta,
      ms: Date.now() - t0,
    });
  }
}

function buildCareerFitEvidencePrompt({
  currentJobLabel,
  targetJobLabel,
  currentIndustryLabel,
  targetIndustryLabel,
  candidateExperienceText,
  reportContext,
}) {
  const contextBlock = buildReportContextBlock(reportContext);

  return `당신은 경력 전환 분석 전문가입니다. 아래 후보자의 경험 텍스트를 읽고, ${currentJobLabel}(현재)에서 ${targetJobLabel}(목표)로의 전환에서 어떤 경험이 근거가 되는지, 어떤 부분이 부족해 보이는지를 구조화된 JSON으로 정리해 주세요.

## 핵심 지침
- 경험 텍스트에 실제로 있는 내용만 사용하세요. 없는 내용을 만들지 마세요.
- 합격/불합격 가능성을 단정하지 마세요.
- 점수를 부여하거나 등급을 판단하지 마세요.
- "입력에서 확인되지 않음"과 "전환 가능성이 있음"을 구분하세요.
- 한국어로 작성하세요.

## 전환 정보
- 현재 직무: ${currentJobLabel}
- 목표 직무: ${targetJobLabel}
- 현재 산업: ${currentIndustryLabel || "미입력"}
- 목표 산업: ${targetIndustryLabel || "미입력"}
${contextBlock}

## 후보자 경험 텍스트
${candidateExperienceText}

## 출력 JSON 스키마 (이 스키마를 반드시 따르세요)
{
  "summary": "한 문장 요약 (경험 기반 전환 특성만, 합격 예측 금지)",
  "directFitEvidence": [
    {
      "label": "직접 연결 근거 제목",
      "evidence": "입력에서 확인된 실제 경험 (없으면 빈 배열)",
      "targetMeaning": "목표 직무에서 어떻게 읽힐 수 있는지"
    }
  ],
  "transferableEvidence": [
    {
      "fromExperience": "기존 경험",
      "toTargetJob": "목표 직무 언어로 재표현",
      "strength": "low | medium | high",
      "reason": "연결 근거"
    }
  ],
  "missingEvidence": [
    {
      "missing": "부족해 보이는 근거",
      "whyItMatters": "목표 직무에서 중요한 이유",
      "howToSupplement": "보완 방향 (이력서에 있는 사실 기반으로만)"
    }
  ],
  "industryJobContext": {
    "summary": "목표 산업에서 목표 직무가 어떻게 읽히는지 (일반적 맥락)",
    "likelySuppliersOrStakeholders": ["목표 산업 기준 주요 이해관계자/협력사 유형"],
    "decisionCriteria": ["목표 직무 의사결정 기준"],
    "riskContext": ["전환 시 주의해야 할 산업·직무 맥락 리스크"]
  },
  "riskSignals": [
    {
      "risk": "리스크 내용",
      "reason": "왜 그렇게 보이는지 (경험 텍스트 기반)",
      "fixDirection": "보완 방향"
    }
  ],
  "resumeRewriteFocus": {
    "emphasize": ["이력서에서 강조할 경험 유형 (실제 있는 내용만)"],
    "deemphasize": ["덜 강조해도 되는 항목"],
    "rewriteDirection": ["구체적 재작성 방향"]
  },
  "interviewQuestions": ["이 전환에서 면접관이 물어볼 가능성 높은 질문 (3~5개)"]
}`;
}

function buildReportContextBlock(reportContext) {
  if (!reportContext || typeof reportContext !== "object") return "";

  const parts = [];

  const topRisks = Array.isArray(reportContext.topRisks) ? reportContext.topRisks.filter(Boolean) : [];
  if (topRisks.length > 0) {
    parts.push("\n## 결정론적 분석 결과 참고 (점수/등급 재판단 금지)");
    parts.push("아래는 구조 기반 엔진이 식별한 전환 리스크입니다. 이를 재평가하지 마세요. 후보자 경험이 이 리스크에 어떻게 연결되는지 설명하는 용도로만 참고하세요.");
    topRisks.slice(0, 3).forEach((r) => {
      if (r.title) parts.push(`- [리스크] ${r.title}`);
    });
  }

  const axisScores = Array.isArray(reportContext.axisScores) ? reportContext.axisScores.filter(Boolean) : [];
  if (axisScores.length > 0) {
    parts.push("\n## 5축 구조 점수 (변경 금지, 참고만)");
    axisScores.slice(0, 5).forEach((a) => {
      if (a.label && a.band) parts.push(`- ${a.label}: ${a.band}`);
    });
  }

  return parts.join("\n");
}

function safeArr(v) {
  return Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];
}

function safeStrArr(v) {
  return Array.isArray(v)
    ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim())
    : [];
}

function normalizeEvidenceMap(raw) {
  return {
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    directFitEvidence: safeArr(raw.directFitEvidence).map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      evidence: typeof item.evidence === "string" ? item.evidence.trim() : "",
      targetMeaning: typeof item.targetMeaning === "string" ? item.targetMeaning.trim() : "",
    })),
    transferableEvidence: safeArr(raw.transferableEvidence).map((item) => ({
      fromExperience: typeof item.fromExperience === "string" ? item.fromExperience.trim() : "",
      toTargetJob: typeof item.toTargetJob === "string" ? item.toTargetJob.trim() : "",
      strength: ["low", "medium", "high"].includes(item.strength) ? item.strength : "medium",
      reason: typeof item.reason === "string" ? item.reason.trim() : "",
    })),
    missingEvidence: safeArr(raw.missingEvidence).map((item) => ({
      missing: typeof item.missing === "string" ? item.missing.trim() : "",
      whyItMatters: typeof item.whyItMatters === "string" ? item.whyItMatters.trim() : "",
      howToSupplement: typeof item.howToSupplement === "string" ? item.howToSupplement.trim() : "",
    })),
    industryJobContext:
      raw.industryJobContext && typeof raw.industryJobContext === "object"
        ? {
            summary: typeof raw.industryJobContext.summary === "string" ? raw.industryJobContext.summary.trim() : "",
            likelySuppliersOrStakeholders: safeStrArr(raw.industryJobContext.likelySuppliersOrStakeholders),
            decisionCriteria: safeStrArr(raw.industryJobContext.decisionCriteria),
            riskContext: safeStrArr(raw.industryJobContext.riskContext),
          }
        : { summary: "", likelySuppliersOrStakeholders: [], decisionCriteria: [], riskContext: [] },
    riskSignals: safeArr(raw.riskSignals).map((item) => ({
      risk: typeof item.risk === "string" ? item.risk.trim() : "",
      reason: typeof item.reason === "string" ? item.reason.trim() : "",
      fixDirection: typeof item.fixDirection === "string" ? item.fixDirection.trim() : "",
    })),
    resumeRewriteFocus:
      raw.resumeRewriteFocus && typeof raw.resumeRewriteFocus === "object"
        ? {
            emphasize: safeStrArr(raw.resumeRewriteFocus.emphasize),
            deemphasize: safeStrArr(raw.resumeRewriteFocus.deemphasize),
            rewriteDirection: safeStrArr(raw.resumeRewriteFocus.rewriteDirection),
          }
        : { emphasize: [], deemphasize: [], rewriteDirection: [] },
    interviewQuestions: safeStrArr(raw.interviewQuestions),
  };
}
