export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = req.body?.requestId || `ai-${Date.now()}`;

  // POST only
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST is supported',
      },
      meta: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        ms: Date.now() - t0,
        requestId,
      },
    });
  }

  // Validate required fields
  const { jdText, resumeText, model = 'gpt-4o-mini', temperature = 0.2, max_tokens = 1800 } = req.body;

  if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: {
        code: 'INVALID_JD_TEXT',
        message: 'jdText must be a non-empty string with at least 10 characters',
      },
      meta: {
        provider: 'openai',
        model,
        ms: Date.now() - t0,
        requestId,
      },
    });
  }

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: {
        code: 'INVALID_RESUME_TEXT',
        message: 'resumeText must be a non-empty string with at least 10 characters',
      },
      meta: {
        provider: 'openai',
        model,
        ms: Date.now() - t0,
        requestId,
      },
    });
  }

  // Build the prompt
  const prompt = buildRejectionAnalysisPrompt(jdText, resumeText);

  try {
    // Call OpenAI via proxy
    const openaiResult = await callVercelOpenAIProxy({
      endpoint: 'chat.completions',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR recruiter analyzing job fit. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model,
      temperature,
      max_tokens,
      response_format: { type: 'json_object' },
      requestId,
      t0,
    });

    if (!openaiResult.ok) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: {
          code: openaiResult.error?.code || 'OPENAI_REQUEST_FAILED',
          message: openaiResult.error?.message || 'OpenAI API request failed',
        },
        meta: {
          provider: 'openai',
          model,
          ms: Date.now() - t0,
          requestId,
        },
      });
    }

    // Extract and parse AI response
    const aiContent = openaiResult.data?.choices?.[0]?.message?.content;
    if (!aiContent) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: {
          code: 'EMPTY_AI_RESPONSE',
          message: 'AI returned empty response',
        },
        meta: {
          provider: 'openai',
          model,
          ms: Date.now() - t0,
          requestId,
        },
      });
    }

    let parsedData;
    try {
      // Try direct parse first
      parsedData = JSON.parse(aiContent);
    } catch (e) {
      // Try extracting JSON from code fence
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          parsedData = JSON.parse(jsonMatch[1]);
        } catch (e2) {
          return res.status(500).json({
            ok: false,
            data: null,
            error: {
              code: 'AI_JSON_PARSE_FAILED',
              message: 'AI response was not valid JSON',
            },
            meta: {
              provider: 'openai',
              model,
              ms: Date.now() - t0,
              requestId,
            },
          });
        }
      } else {
        return res.status(500).json({
          ok: false,
          data: null,
          error: {
            code: 'AI_JSON_PARSE_FAILED',
            message: 'AI response was not valid JSON',
          },
          meta: {
            provider: 'openai',
            model,
            ms: Date.now() - t0,
            requestId,
          },
        });
      }
    }

    // Normalize response to contract
    const normalized = normalizeAnalysisResponse(parsedData);

    return res.status(200).json({
      ok: true,
      data: normalized,
      meta: {
        provider: 'openai',
        model,
        ms: Date.now() - t0,
        requestId,
      },
    });
  } catch (error) {
    console.error(`[${requestId}] Rejection analysis AI error:`, error.message);

    return res.status(500).json({
      ok: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during analysis',
      },
      meta: {
        provider: 'openai',
        model,
        ms: Date.now() - t0,
        requestId,
      },
    });
  }
}

// Build the AI prompt with JSON schema instruction
function buildRejectionAnalysisPrompt(jdText, resumeText) {
  return `당신은 경력 채용담당자입니다. 다음 JD와 이력서를 분석하여 채용담당자 관점의 서류심사 의견을 제시해 주세요.

## 분석 지시사항
- 이력서에 없는 정보를 만들지 마세요.
- 불명확한 부분은 "불명확함" 또는 빈 값으로 표시하세요.
- 수치나 도구는 이력서에 없으면 추가하지 마세요.
- 직무 정체성, JD 필수요건 gap, 직접/협업/보조 수행 수준을 구분하세요.
- 총 경력과 직무별 경력을 구분하세요.
- 안전한 수정 제안만 제시하세요.

## JD
${jdText}

## 이력서
${resumeText}

## 응답 JSON 스키마
다음 정확한 구조의 JSON을 반환하세요:

{
  "targetCandidateProfile": "JD가 원하는 이상적 후보상 (역할, 경험, 성숙도)",
  "resumeReadProfile": "이력서에서 읽히는 후보상",
  "recruiterInterpretation": "채용담당자가 보는 후보 평가 (경력 매칭도, 직무 이해도, 성장 가능성)",
  "identityGapSummary": "직무 정체성 gap 요약",
  "overallRiskLevel": "critical|high|medium|low|unclear",
  "mustRequirementGaps": [
    {
      "requirement": "JD의 필수요건",
      "jdEvidence": "JD에서 요구하는 내용",
      "resumeEvidence": "이력서에서 제시된 내용",
      "matchLevel": "missing|weak|partial|strong|unclear",
      "executionLevel": "none|indirect|support|collaboration|direct|unclear",
      "riskReason": "왜 위험한가",
      "severity": "critical|high|medium|low"
    }
  ],
  "transferableSignals": [
    {
      "resumeEvidence": "이력서의 구체적 내용",
      "canTransferTo": "JD의 어떤 요구사항에 도움이 될 수 있는가",
      "limit": "제약사항 또는 신중할 점"
    }
  ],
  "missingInfoQuestions": [
    {
      "question": "채용담당자가 이력서 면접에서 물어야 할 질문",
      "whyItMatters": "이 질문이 중요한 이유",
      "priority": "high|medium|low"
    }
  ],
  "rewriteDirections": [
    {
      "originalEvidence": "이력서의 현재 내용",
      "direction": "개선 방향",
      "safeExample": "이력서에 있는 사실만 사용한 안전한 예시",
      "needsUserConfirmation": "true면 후보가 검증 필요"
    }
  ],
  "antiOverclaimWarnings": [
    {
      "risk": "과장 위험",
      "reason": "이 주장이 과장일 수 있는 이유"
    }
  ]
}

중요: 오직 유효한 JSON만 반환하세요. 마크다운이나 다른 텍스트는 포함하지 마세요.`;
}

// Normalize AI response to contract
function normalizeAnalysisResponse(raw) {
  const normalize = (val, type, defaultVal = null) => {
    if (val === null || val === undefined) {
      return defaultVal;
    }

    if (type === 'string') {
      const str = String(val).trim();
      // Trim very long strings to ~1000 chars
      return str.length > 1000 ? str.substring(0, 1000) + '...' : str;
    }

    if (type === 'enum') {
      return Array.isArray(defaultVal) && defaultVal.includes(val) ? val : defaultVal[0];
    }

    if (type === 'array') {
      return Array.isArray(val) ? val : [];
    }

    return defaultVal;
  };

  // Top-level fields
  const targetCandidateProfile = normalize(raw.targetCandidateProfile, 'string', '');
  const resumeReadProfile = normalize(raw.resumeReadProfile, 'string', '');
  const recruiterInterpretation = normalize(raw.recruiterInterpretation, 'string', '');
  const identityGapSummary = normalize(raw.identityGapSummary, 'string', '');
  const overallRiskLevel = normalize(
    raw.overallRiskLevel,
    'enum',
    ['critical', 'high', 'medium', 'low', 'unclear'],
  );

  // Normalize mustRequirementGaps (max 6)
  let mustRequirementGaps = [];
  if (Array.isArray(raw.mustRequirementGaps)) {
    mustRequirementGaps = raw.mustRequirementGaps.slice(0, 6).map((gap) => ({
      requirement: normalize(gap.requirement, 'string', ''),
      jdEvidence: normalize(gap.jdEvidence, 'string', ''),
      resumeEvidence: normalize(gap.resumeEvidence, 'string', ''),
      matchLevel: normalize(gap.matchLevel, 'enum', ['missing', 'weak', 'partial', 'strong', 'unclear']),
      executionLevel: normalize(
        gap.executionLevel,
        'enum',
        ['none', 'indirect', 'support', 'collaboration', 'direct', 'unclear'],
      ),
      riskReason: normalize(gap.riskReason, 'string', ''),
      severity: normalize(gap.severity, 'enum', ['critical', 'high', 'medium', 'low']),
    }));
  }

  // Normalize transferableSignals (max 4)
  let transferableSignals = [];
  if (Array.isArray(raw.transferableSignals)) {
    transferableSignals = raw.transferableSignals.slice(0, 4).map((signal) => ({
      resumeEvidence: normalize(signal.resumeEvidence, 'string', ''),
      canTransferTo: normalize(signal.canTransferTo, 'string', ''),
      limit: normalize(signal.limit, 'string', ''),
    }));
  }

  // Normalize missingInfoQuestions (max 5)
  let missingInfoQuestions = [];
  if (Array.isArray(raw.missingInfoQuestions)) {
    missingInfoQuestions = raw.missingInfoQuestions.slice(0, 5).map((question) => ({
      question: normalize(question.question, 'string', ''),
      whyItMatters: normalize(question.whyItMatters, 'string', ''),
      priority: normalize(question.priority, 'enum', ['high', 'medium', 'low']),
    }));
  }

  // Normalize rewriteDirections (max 4)
  let rewriteDirections = [];
  if (Array.isArray(raw.rewriteDirections)) {
    rewriteDirections = raw.rewriteDirections.slice(0, 4).map((direction) => ({
      originalEvidence: normalize(direction.originalEvidence, 'string', ''),
      direction: normalize(direction.direction, 'string', ''),
      safeExample: normalize(direction.safeExample, 'string', ''),
      needsUserConfirmation: Boolean(direction.needsUserConfirmation),
    }));
  }

  // Normalize antiOverclaimWarnings (max 4)
  let antiOverclaimWarnings = [];
  if (Array.isArray(raw.antiOverclaimWarnings)) {
    antiOverclaimWarnings = raw.antiOverclaimWarnings.slice(0, 4).map((warning) => ({
      risk: normalize(warning.risk, 'string', ''),
      reason: normalize(warning.reason, 'string', ''),
    }));
  }

  return {
    targetCandidateProfile,
    resumeReadProfile,
    recruiterInterpretation,
    identityGapSummary,
    overallRiskLevel,
    mustRequirementGaps,
    transferableSignals,
    missingInfoQuestions,
    rewriteDirections,
    antiOverclaimWarnings,
  };
}

// Call OpenAI via Vercel proxy
async function callVercelOpenAIProxy({
  endpoint,
  messages,
  model,
  temperature,
  max_tokens,
  response_format,
  requestId,
  t0,
}) {
  const proxyUrl = process.env.VERCEL_OPENAI_PROXY_URL || 'http://localhost:3000/api/openai-proxy';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        messages,
        model,
        temperature,
        max_tokens,
        response_format,
        requestId,
        t0,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        error: {
          code: 'PROXY_REQUEST_FAILED',
          message: `Proxy returned ${response.status}: ${errorText}`,
        },
      };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'OPENAI_TIMEOUT',
          message: 'OpenAI request timed out after 55 seconds',
        },
      };
    }

    return {
      ok: false,
      error: {
        code: 'PROXY_CALL_FAILED',
        message: error.message,
      },
    };
  }
}
