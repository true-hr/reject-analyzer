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
      req,
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

### 증거 기반 판단 (증거도 구분)
- 이력서에 **없는 정보를 만들지 마세요**.
- 불명확한 부분은 "불명확함" 또는 빈 값으로 표시하세요.
- 수치나 도구는 이력서에 없으면 추가하지 마세요.
- **matchLevel은 실제 증거에 맞춰 구분**하세요:
  - "missing": 이력서에 관련된 **어떤 증거도 없을 때**만 사용
  - "weak": 약간의 관련 증거가 있지만 깊이/범위/소유권이 부족할 때
  - "partial": 의미 있는 관련 증거가 있지만 JD 요구사항의 일부만 만족할 때
  - "strong": 이력서 증거가 JD 요구사항을 만족할 때

### 실행 수준 구분 (특히 CS/AM 역할에서)
- 고객 inquiries 처리 ≠ retention/churn 지표 관리
- 월간 사용 리포트 작성 ≠ SaaS 사용 데이터 분석 및 인사이트 도출
- 판매팀 협업 ≠ renewal/upsell 소유권
- executionLevel을 정확히 구분하세요:
  - "none": 관련 증거 없음
  - "indirect": 부분적 관련, 보조 역할
  - "support": 기술적 지원/보조 역할
  - "collaboration": 팀과 함께 수행, 공동 책임
  - "direct": 직접 소유권/리드
  - (optional) "metric": 지표 소유권/책임

### 채용담당자 관점 (recruiterInterpretation)
- 이력서에서 **확인되는 강점**을 먼저 명시하세요.
- **불명확한 부분**을 구체적으로 지적하세요. ("경험이 부족함"처럼 일반화하지 마세요)
- **어떤 증거가 있으면 후보를 다르게 평가할 수 있는지** 제시하세요.
- 예: "A는 확인되지만, renewal/upsell 소유권이나 churn 관리 경험은 명확하지 않습니다. 이 부분이 확인되면 평가가 올라갈 것 같습니다."

### 필수 요건 분석
- 직무 정체성, JD 필수요건 gap, 직접/협업/보조 수행 수준을 구분하세요.
- 총 경력과 직무별 경력을 구분하세요.

### 이력서 개선 제안 (rewriteDirections)
- **이력서에 있는 사실만 사용해서** 안전한 예시를 제시하세요.
- 메트릭이나 소유권을 발명하지 마세요.
- 기존 증거를 더 구체적으로 표현하는 방향만 제시하세요.

### 면접 질문 (missingInfoQuestions)
- 가장 중요한 불확실성을 목표로 하세요.
- 예를 들어, AM/CSM 역할에서:
  - renewal/upsell 참여 여부
  - churn/retention/customer success 지표 관리 경험
  - 고객 미팅 소유권 수준
  - SaaS 사용 데이터 분석 깊이
  - product feedback prioritization 역할
- 일반적인 질문("고객 성공 관리 경험이 있습니까?")보다 구체적인 질문을 선호하세요.

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
  req,
}) {
  // ✅ PATCH (fix): derive same-origin proxy URL from request headers when env var is missing
  let proxyUrl = process.env.VERCEL_OPENAI_PROXY_URL;
  if (!proxyUrl && req && req.headers) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    if (host) {
      proxyUrl = `${protocol}://${host}/api/openai-proxy`;
    }
  }
  // ✅ PATCH (fallback): use localhost only for local dev (should have env var in production)
  if (!proxyUrl) {
    proxyUrl = 'http://localhost:3000/api/openai-proxy';
  }

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
