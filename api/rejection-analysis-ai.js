export default async function handler(req, res) {
  const t0 = Date.now();

  // ✅ CORS
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

  if (req.method === 'OPTIONS') {
    return res.status(200).end('');
  }

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
  const {
    jdText,
    resumeText,
    model = 'gpt-4o-mini',
    temperature = 0.2,
    max_tokens = 1800,
    compositeRiskContext = null,
    structuredSummaryContext = null,
    groundingMode = 'raw',
    recruiterReadContext = null,
  } = req.body;

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
  const prompt = buildRejectionAnalysisPrompt(jdText, resumeText, { compositeRiskContext, structuredSummaryContext, groundingMode, recruiterReadContext });

  try {
    // Call OpenAI directly
    const openaiResult = await callOpenAIChatCompletionDirect({
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

// ── 확정된 진단 결과를 프롬프트 텍스트로 변환 ──────────────────────────────────
function _buildGroundingSection(compositeRiskContext, structuredSummaryContext, recruiterReadContext = null) {
  if (!compositeRiskContext) return '';

  const parts = [];
  parts.push('\n## 확정된 탈락 위험 진단 결과 (설명 기반 제공)');
  parts.push('아래는 규칙 기반 엔진이 확정한 탈락 위험 진단 결과입니다.');
  parts.push('이 결과를 다시 판단하거나 등급을 바꾸지 않는다. 이 결과를 사용자가 이해할 수 있도록 설명하는 역할이다.\n');

  const s = compositeRiskContext.summary;
  if (s) {
    parts.push(`전반적 위험 수준: ${s.overallBand} (${s.overallLabel})`);
    if (s.overallReason) parts.push(`사유: ${s.overallReason}`);
  }

  const topRisks = Array.isArray(compositeRiskContext.topRisks) ? compositeRiskContext.topRisks : [];
  if (topRisks.length > 0) {
    parts.push('\n### 상위 탈락 위험 항목:');
    for (const r of topRisks) {
      parts.push(`\n[심각도: ${r.severity}] ${r.title} (key: ${r.key})`);
      if (r.summaryText) parts.push(`요약: ${r.summaryText}`);
      if (r.detailText)  parts.push(`상세: ${r.detailText}`);
      const ev = Array.isArray(r.evidence) ? r.evidence : [];
      if (ev.length > 0) parts.push(`근거:\n${ev.map(e => '- ' + e).join('\n')}`);
    }
  }

  if (structuredSummaryContext) {
    const c  = structuredSummaryContext.careerSummary         ?? structuredSummaryContext.career  ?? null;
    const jd = structuredSummaryContext.jdProfile             ?? structuredSummaryContext.jd      ?? null;
    const rf = structuredSummaryContext.roleFit ?? {
      effectiveCareerSummary: structuredSummaryContext.effectiveCareerSummary ?? null,
      riskHints:              structuredSummaryContext.riskHints              ?? [],
    };
    const hasContent = c || jd || rf.effectiveCareerSummary || rf.riskHints?.length;
    if (hasContent) {
      parts.push('\n### 구조화된 배경 정보:');
      if (c) {
        if (c.totalMonths)                         parts.push(`총 경력: ${c.totalMonths}개월`);
        if (c.strongestEvidence?.length)           parts.push(`강한 근거: ${c.strongestEvidence.slice(0, 3).join(', ')}`);
        if (c.weakestEvidence?.length)             parts.push(`약한 근거: ${c.weakestEvidence.slice(0, 3).join(', ')}`);
        if (c.missingDateOrEmploymentInfo?.length) parts.push(`날짜·재직 정보 불완전: ${c.missingDateOrEmploymentInfo.slice(0, 3).join(', ')}`);
      }
      if (jd) {
        if (jd.seniority && jd.seniority !== 'unknown') parts.push(`JD 시니어리티: ${jd.seniority}`);
        if (jd.topCriticalRequirements?.length)    parts.push(`핵심 필수요건: ${jd.topCriticalRequirements.slice(0, 5).join(', ')}`);
        if (jd.keyTechKeywords?.length)            parts.push(`JD 핵심 기술 키워드: ${jd.keyTechKeywords.slice(0, 5).join(', ')}`);
        if (jd.keyDomainKeywords?.length)          parts.push(`JD 도메인 키워드: ${jd.keyDomainKeywords.slice(0, 5).join(', ')}`);
      }
      if (rf) {
        const ecs = rf.effectiveCareerSummary;
        if (ecs) parts.push(`역할 적합 경력: 총 ${ecs.totalCareerMonths ?? 0}개월 중 역할 관련 ${ecs.roleRelevantMonths ?? 0}개월`);
        if (rf.riskHints?.length) {
          parts.push(`직무 적합도 위험 신호:\n${rf.riskHints.slice(0, 3).map(h => `- [${h.riskLevel}] ${h.risk}`).join('\n')}`);
        }
      }
    }
  }

  // Recruiter-read context — only when at least one context block is available
  if (
    recruiterReadContext &&
    typeof recruiterReadContext === 'object' &&
    (recruiterReadContext.provenance?.jobContextAvailable || recruiterReadContext.provenance?.industryContextAvailable)
  ) {
    parts.push('\n### 직무·산업 recruiter-read 맥락:');

    if (recruiterReadContext.provenance?.jobContextAvailable && recruiterReadContext.job) {
      const j = recruiterReadContext.job;
      if (j.label)             parts.push(`직무: ${j.label}`);
      if (j.missionType)       parts.push(`직무 미션 유형: ${j.missionType}`);
      if (j.outputType)        parts.push(`산출물 유형: ${j.outputType}`);
      if (j.successMetricType) parts.push(`성과 기준 유형: ${j.successMetricType}`);
      if (j.majorDependency?.tier) {
        const tierStr = j.majorDependency.reason
          ? `${j.majorDependency.tier} — ${j.majorDependency.reason}`
          : j.majorDependency.tier;
        parts.push(`전공 의존도: ${tierStr}`);
      }
      const stakeholders = Array.isArray(j.primaryStakeholders) ? j.primaryStakeholders.filter(Boolean).slice(0, 5) : [];
      if (stakeholders.length) parts.push(`주요 이해관계자: ${stakeholders.join(', ')}`);
      if (j.stakeholderRationale) parts.push(`이해관계자 맥락: ${j.stakeholderRationale}`);
    }

    if (recruiterReadContext.provenance?.industryContextAvailable && recruiterReadContext.industry) {
      const ind = recruiterReadContext.industry;
      if (ind.label) parts.push(`산업: ${ind.label}`);
      const coreCtx = Array.isArray(ind.coreContext) ? ind.coreContext.filter(Boolean).slice(0, 6) : [];
      if (coreCtx.length) parts.push(`산업 핵심 맥락:\n${coreCtx.map(c => '- ' + c).join('\n')}`);
      const wcExamples = Array.isArray(ind.workContextEvidenceExamples) ? ind.workContextEvidenceExamples.filter(Boolean).slice(0, 5) : [];
      if (wcExamples.length) parts.push(`실제 업무 맥락 증거 예시:\n${wcExamples.map(e => '- ' + e).join('\n')}`);
      const prepSuggestions = Array.isArray(ind.interviewPrepSuggestions) ? ind.interviewPrepSuggestions.filter(Boolean).slice(0, 3) : [];
      if (prepSuggestions.length) parts.push(`확인 질문 참고:\n${prepSuggestions.map(s => '- ' + s).join('\n')}`);
    }
  }

  return parts.join('\n');
}

// Build the AI prompt with JSON schema instruction
function buildRejectionAnalysisPrompt(jdText, resumeText, { compositeRiskContext = null, structuredSummaryContext = null, groundingMode = 'raw', recruiterReadContext = null } = {}) {
  const isGrounded = groundingMode === 'grounded' && compositeRiskContext != null;
  const groundingSection = isGrounded ? _buildGroundingSection(compositeRiskContext, structuredSummaryContext, recruiterReadContext) : '';

  const roleInstruction = isGrounded
    ? '당신은 채용 전문가입니다. 아래에 제공된 확정된 탈락 위험 진단 결과를 바탕으로 사용자에게 이해 가능한 설명을 제공해야 합니다. 진단 결과를 재판단하거나 등급을 바꾸지 마세요.'
    : '당신은 경력 채용담당자입니다. 다음 JD와 이력서를 분석하여 채용담당자 관점의 서류심사 의견을 제시해 주세요.';

  const groundedInstructions = isGrounded ? `
### 설명 지침 (grounded 모드)
- mustRequirementGaps[]는 위 탈락 위험 진단 결과의 상위 항목을 기반으로 채워라. 독립적으로 재판단하지 마라. 새로운 리스크를 추가하거나 등급을 바꾸지 마라.
- overallRiskLevel은 위 전반적 위험 수준(overallBand)에 정확히 맞춰라: high_risk→critical, warning→high, caution→medium, pass→low.
- 각 topRisk가 왜 채용담당자 관점에서 서류 탈락 위험으로 읽힐 수 있는지 설명하라. 단, 새로운 리스크를 추가하거나 등급을 바꾸지 마라.
- 각 리스크에 대해 다음 중 어느 유형인지 구분해서 설명하라:
  1. 경험 자체가 없음 (missing experience)
  2. 경험은 있으나 증거 표현이 약함 (weak evidence)
  3. JD 언어와 이력서 언어가 불일치함 (language mismatch)
  4. 총 경력 대비 역할 관련 유효 경력이 짧음 (effective career shorter)
  5. 날짜/재직 정보 모호성 (date/employment ambiguity)
- 이력서에 없는 경험을 발명하지 마라.
- rewriteDirections는 이력서에 실제로 있는 사실만 사용한 구체적 개선 방향을 제시하라.
### recruiter-read 맥락 사용 제한:
- 위 직무·산업 맥락은 결정론적 레지스트리/온톨로지 데이터이다.
- 이 맥락으로 개선할 수 있는 항목: targetCandidateProfile, recruiterInterpretation, identityGapSummary, missingInfoQuestions.
- 이 맥락으로 직접 생성하거나 강화하면 안 되는 항목: mustRequirementGaps, transferableSignals, rewriteDirections, antiOverclaimWarnings, resumeReadProfile.
- 이 맥락을 근거로 이력서에 없는 증거를 발명하지 마라.
- industry.interviewPrepSuggestions는 질문 방향 참고용으로만 사용하고 그대로 복사하지 마라.
- 이 맥락이 soft 정보라도 mustRequirementGaps의 hard gate 판단에 사용하지 마라.
` : '';

  return `${roleInstruction}${groundingSection}

## 분석 지시사항${groundedInstructions}

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

### 필수 요건 근거 구체성 (mustRequirementGaps.resumeEvidence)
- resumeEvidence는 이력서의 실제 내용을 인용하거나 가깝게 paraphrase하세요.
- 너무 일반화된 요약("고객 문의 처리 및 문제 해결")보다 더 구체적인 근거가 있으면 그것을 사용하세요.
- 좋은 예:
  - "고객별 사용 현황을 엑셀로 정리하고 월간 리포트 작성"
  - "6개월간 접수된 고객 문의를 기능 오류·사용법 문의·결제 문의·추가 기능 요청으로 분류"
  - "영업팀과 협업하여 기존 고객의 추가 요청사항 정리 및 견적 전달"

### 전환 가능 신호 제약 (transferableSignals.limit)
- limit은 해당 근거가 아직 증명하지 못하는 것을 구체적으로 명시하세요.
- "불명확함" 같은 일반적 표현은 피하세요.
- 예: "사용 현황 정리는 확인되지만, 이탈 가능 고객을 선별하거나 리텐션 지표를 직접 관리한 근거는 부족합니다."

### 이력서 개선 제안 (rewriteDirections)
- **이력서에 있는 사실만 사용해서** safeExample을 제시하세요.
- safeExample에 다음 항목은 이력서에 명시적으로 없으면 추가하지 마세요:
  - 수치, 지표, 비율
  - 소유권·주도·의사결정 역할
  - churn/retention/upsell/renewal 결과
  - 분석 깊이나 방법론
- 보수적인 표현을 선호하세요: "정리했습니다", "공유했습니다", "연결했습니다", "개선했습니다"
- 더 강한 표현이 이력서 근거 없이 필요하면 needsUserConfirmation을 true로 설정하세요.

### 과장 위험 표현 주의 (antiOverclaimWarnings)
- risk는 후보가 이력서나 면접에서 쓰면 위험한 실제 표현 또는 주장이어야 합니다.
- "과장 위험", "주의 필요", "불명확함" 같은 일반적 레이블을 risk 값으로 사용하지 마세요.
- 좋은 risk 예시:
  - "고객 이탈률을 개선했습니다"
  - "리뉴얼/업셀을 주도했습니다"
  - "고객 성공 지표를 관리했습니다"
  - "제품 개선 우선순위를 결정했습니다"
- reason은 이력서 근거가 왜 그 주장을 뒷받침하지 못하는지 구체적으로 설명하세요.

### 면접 질문 (missingInfoQuestions)
- question은 구체적이고 답변 가능한 질문이어야 합니다.
- whyItMatters는 그 답변이 채용담당자의 평가를 어떻게 바꾸는지 설명하세요.
- 일반적인 질문("고객 성공 관리 경험이 있습니까?")보다 구체적인 질문을 선호하세요.
- 예를 들어, AM/CSM 역할에서:
  - renewal/upsell에 어느 수준으로 관여했는지 (주도/협업/지원)
  - churn·retention 지표를 직접 추적·보고한 경험이 있는지
  - 고객 미팅을 독립적으로 준비·운영한 경험이 있는지
  - SaaS 사용 데이터를 분석해 인사이트를 도출한 경험이 있는지

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
      "risk": "고객 이탈률을 개선했습니다",
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

// Call OpenAI API directly
async function callOpenAIChatCompletionDirect({
  messages,
  model,
  temperature,
  max_tokens,
  response_format,
  requestId,
  t0,
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: {
        code: 'OPENAI_API_KEY_MISSING',
        message: 'OPENAI_API_KEY is not configured',
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages,
        model,
        temperature,
        max_tokens,
        response_format,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      return {
        ok: false,
        error: {
          code: 'OPENAI_API_ERROR',
          message: errorData.error?.message || `OpenAI API returned ${response.status}`,
        },
      };
    }

    const result = await response.json();

    // Return in expected format: { ok: true, data: {...} }
    return {
      ok: true,
      data: result,
    };
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
        code: 'OPENAI_REQUEST_FAILED',
        message: error.message || 'Failed to call OpenAI API',
      },
    };
  }
}
