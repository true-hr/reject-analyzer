import { checkAiGate } from "./_security.js";

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
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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

  // Security gate: Bearer auth (logged-in) or anon IP rate limit
  const gate = await checkAiGate(req, "rejection-analysis-ai");
  if (!gate.allow) {
    return res.status(gate.status).json({
      ok: false,
      data: null,
      error: { code: gate.code, message: gate.message },
      meta: { provider: "openai", model: "gpt-4o-mini", ms: Date.now() - t0, requestId },
    });
  }

  // Validate required fields
  const {
    jdText,
    resumeText,
    model = 'gpt-4o-mini',
    temperature = 0.2,
    max_tokens = 2800,
    compositeRiskContext = null,
    structuredSummaryContext = null,
    groundingMode = 'raw',
    recruiterReadContext = null,
    targetRoleInPosting = null,
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
  const prompt = buildRejectionAnalysisPrompt(jdText, resumeText, { compositeRiskContext, structuredSummaryContext, groundingMode, recruiterReadContext, targetRoleInPosting });

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
    const normalized = normalizeAnalysisResponse(parsedData, { jdText, resumeText });

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
function buildRejectionAnalysisPrompt(jdText, resumeText, { compositeRiskContext = null, structuredSummaryContext = null, groundingMode = 'raw', recruiterReadContext = null, targetRoleInPosting = null } = {}) {
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

  const roleScope = String(targetRoleInPosting || '').trim()
    ? `\n\n## 분석 범위 (지원 모집부문)\n이 채용공고에는 여러 모집부문/직무가 함께 포함될 수 있습니다.\n지원자가 지원한 모집부문/직무명은 **"${String(targetRoleInPosting).trim()}"** 입니다.\n\n분석할 때는 JD 전체를 보되, 필수요건·탈락위험·보완방향 판단은 반드시 위 지원 모집부문과 직접 관련된 담당업무, 자격요건, 우대사항을 우선 기준으로 삼으세요.\n다른 모집부문에만 해당하는 담당업무, 자격요건, 우대사항은 mustRequirementGaps, rewriteDirections, missingInfoQuestions에 포함하지 마세요.\n\n공통 자격요건, 공통 근무조건, 공통 전형절차는 참고할 수 있습니다.\n다만 어떤 요건이 선택 모집부문과 직접 관련되는지 불확실하면 단정하지 말고, 공고 내 다른 모집부문 요건일 가능성을 고려해 보수적으로 판단하세요.\n\n지원 모집부문명은 JD 안에서 띄어쓰기나 괄호 표현이 다를 수 있으므로 유사 표현도 함께 고려하세요.\n\n`
    : '';

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
- JD의 자격요건뿐 아니라 주요업무에서 직접 수행을 반복적으로 요구하는 핵심 역량도 mustRequirementGaps 후보로 검토하라.
  - 예: A/B 테스트, 퍼널 분석, 지표 모니터링, 화면설계서·정책정의서·기능명세서 작성, 전환율 개선, 장바구니/결제 흐름 개선, 개발자·디자이너 협업 출시 경험.
  - 단, 주요업무 전체를 gap으로 나열하지 말고, 서류 탈락 판단에 영향이 큰 핵심 수행 역량만 선별하라.
  - mustRequirementGaps는 최대 6개 제한을 유지하라.
  - 주요업무 기반 gap은 "입사 후 하게 될 일"이 아니라, 해당 업무를 수행할 준비도·경험 근거가 이력서에 보이는지를 판단하는 기준으로 사용하라.
- JD 요구사항의 중요도를 다음 4단계로 구분해 severity를 결정하라.
  - 1순위 (critical/high): 자격요건에 명시된 핵심 기술/경험 (예: TypeScript, React, JavaScript, REST API, Git 협업, 컴포넌트 기반 UI 설계)
  - 2순위 (high/medium): 주요업무 중 입사 즉시 수행 준비도가 요구되는 반복 핵심 업무
  - 3순위 (medium 이하): 주요업무 중 입사 후 점진적으로 다룰 운영·품질 개선 업무 (예: 웹 성능 최적화, 크로스 브라우징 이슈 개선, 레거시 코드 리팩토링, 운영 환경 품질 개선)
  - 4순위 (medium/low 또는 제외): 우대사항, 이력서에 의미 있는 근거가 있는 항목
- 신입·주니어 JD에서 "웹 성능 최적화", "크로스 브라우징 이슈 개선", "레거시 코드 리팩토링", "운영 환경 품질 개선" 등은 자격요건에 명시되어 있지 않다면 3순위로 분류하고 severity를 medium 이하로 유지하라. 이 항목들은 자격요건·핵심 기술 gap(TypeScript, React, REST API 등)보다 상위 탈락 리스크로 두지 않는다. 단, JD에서 해당 항목을 자격요건 또는 필수 경험으로 명시했거나 시니어/경력직 포지션에서 반복 핵심 업무로 강하게 요구하면 high 이상이 가능하다.
- **PM/서비스기획 JD 특화 판단 기준**
  - JD가 "요구사항 정의, 기능 정의, 화면설계 중 하나 이상의 산출물" 또는 "PRD, 기능 정의서, 화면설계서, 와이어프레임 중 하나 이상"처럼 복수 산출물 중 하나 이상을 umbrella 형태로 요구할 때, 이를 "정식 PRD 작성 경험" 하나로 좁혀 해석하지 마라.
    - 이력서에 화면설계, Figma 화면 구성, 와이어프레임, 사용자 흐름 정리, 정보 구조 조정, 기능 범위 조율 중 하나 이상이 확인되면 해당 umbrella requirement는 matchLevel을 partial 또는 weak로 처리하라. critical/missing으로 처리하지 마라.
    - 이 경우 riskReason 예시: "정식 PRD 형식의 문서 경험은 제한적이지만, 화면설계/요구사항 정리와 인접한 근거는 이력서에서 확인됩니다."
    - JD가 "정식 PRD 작성 필수" 또는 "PRD 작성 경험 필수"처럼 PRD 단독을 자격요건으로 명시한 경우에만 PRD 단독 gap으로 처리한다.
  - PM/서비스기획 JD의 우대사항에 있는 A/B 테스트, 퍼널 분석, GA4, Amplitude, SQL, 전환율 개선, 그로스 실험, 데이터 분석 도구는 핵심 탈락 리스크 상단에 두지 마라.
    - 우대사항에만 있는 경우 severity는 medium 이하로 유지하라.
    - 이 항목들이 mustRequirementGaps에 포함되더라도 PRD/요구사항 정의/화면설계/협업/백로그 등 core planning gap보다 앞순위에 두지 않는다.
    - 이력서에 해당 경험이 없어도 "결격"이 아니라 "우대 경험은 아직 확인되지 않음" 수준으로 riskReason을 작성하라.
- mustRequirementGaps는 서류탈락 판단에 영향이 가장 큰 항목부터 반환하라.
  - 정렬 우선순위: severity critical → high → medium → low
  - 같은 severity라면 matchLevel missing → weak → partial → unclear → strong 순서
  - 자격요건에 명시되고 이력서에 없거나 약한 항목: critical/high
  - 주요업무에서 직접 수행이 핵심인데 이력서에 근거가 없거나 약한 항목: high/medium
  - 우대사항이거나 이력서에 의미 있는 근거가 있는 항목: medium/low 또는 제외
  - strong 항목은 가능한 한 뒤에 배치하고, 단순 강점 확인용으로 과도하게 많이 넣지 않는다.
- 응답 전체의 우선순위는 "문장 polish"가 아니라 "JD 핵심 탈락 리스크 구조"다. rewriteDirections는 mustRequirementGaps에서 확인된 핵심 gap을 보완하는 하위 실행 제안으로 작성한다.
- **riskReason 작성 규칙**: riskReason은 후보 역량을 단정적으로 평가하지 마라. "수행할 준비가 되어 있지 않음", "실무 활용 가능성이 낮음", "역량이 부족함"처럼 이력서 증거 외 사실을 확정하는 표현을 쓰지 마라. 이력서 문서상 근거를 기준으로만 작성하라. 권장 표현: "이력서에서 관련 경험 근거가 충분히 확인되지 않습니다.", "운영 환경에서 해당 이슈를 다뤄본 경험은 아직 드러나지 않습니다.", "경험이 없다고 단정하기보다, 현재 문서상 근거가 부족하게 읽힙니다."
- **gap metadata 생성 규칙**: 각 gap에 source, requirementType, logic을 반드시 채워라.
  - source: JD 섹션 제목을 기준으로 판단하라.
    - 주요업무/담당업무/Responsibilities → "responsibility"
    - 자격요건/필수요건/Requirements/Qualifications → "qualification"
    - 우대사항/Preferred/Nice to have → "preferred"
    - 공통요건/공통사항 → "common"
    - 섹션이 불명확하거나 혼재 → "unknown"
  - requirementType: 해당 요건의 성격을 판단하라.
    - 직무 핵심 수행에 직접 필요한 기술/경험 → "core"
    - 직접 핵심은 아니지만 인접 경험으로 보완 가능 → "adjacent"
    - 입사 후 점진적으로 다룰 운영/품질 개선 업무 → "operational"
    - 주니어에게는 고급/심화에 가까운 요건 → "advanced"
    - 우대사항 성격이 강한 요건 → "preferred"
    - 불명확함 → "unknown"
  - logic: 요건의 충족 조건을 판단하라.
    - "A, B, C 중 하나 이상", "또는", "혹은", "one of" 형태 → "oneOf"
    - 단일 필수 요건 → "required"
    - 있으면 좋은 선택 요건 → "optional"
    - 불명확함 → "unknown"
  - 우대사항에만 있는 요건: source "preferred", requirementType "preferred" 또는 "advanced"
  - oneOf 요건에서 이력서에 인접 근거가 하나라도 있으면 matchLevel을 missing으로 두지 말고 weak 또는 partial을 검토하라.

### 필수 요건 근거 구체성 (mustRequirementGaps.resumeEvidence)
- resumeEvidence는 이력서의 실제 내용을 인용하거나 가깝게 paraphrase하세요.
- 너무 일반화된 요약("고객 문의 처리 및 문제 해결")보다 더 구체적인 근거가 있으면 그것을 사용하세요.
- 좋은 예:
  - "고객별 사용 현황을 엑셀로 정리하고 월간 리포트 작성"
  - "6개월간 접수된 고객 문의를 기능 오류·사용법 문의·결제 문의·추가 기능 요청으로 분류"
  - "영업팀과 협업하여 기존 고객의 추가 요청사항 정리 및 견적 전달"

### 전환 가능 신호 제약 (transferableSignals)
- **canTransferTo**: 이력서 근거와 직접 인접하거나 동일 역량 범주에 속하는 JD 요구사항에만 연결하라. 2단계 이상의 추론이 필요한 연결은 하지 않는다.
  - 허용: Figma 시안 구현 → 디자이너 협업, UI 구현, 컴포넌트 구현, 화면 구현
  - 금지: Figma 시안 구현 → A/B 테스트, 전환율 실험, 데이터 기반 UX 개선
  - 허용: 고객 문의 정리 → VOC 정리, 사용자 불편사항 파악
  - 금지: 고객 문의 정리 → 데이터 분석, 실험 설계, 전환율 개선 주도
  - canTransferTo가 과하게 넓은 경우, transferableSignals에 넣지 말고 limit이나 missingInfoQuestions에서만 조심스럽게 언급한다.
- **limit**: 해당 근거가 아직 증명하지 못하는 것을 구체적으로 명시하세요.
- "불명확함" 같은 일반적 표현은 피하세요.
- 예: "사용 현황 정리는 확인되지만, 이탈 가능 고객을 선별하거나 리텐션 지표를 직접 관리한 근거는 부족합니다."

### 이력서 개선 제안 (rewriteDirections)
- rewriteDirections는 mustRequirementGaps의 핵심 gap과 연결되는 항목을 우선 제안한다. 단순 문장 polish가 아니라 JD gap을 보완하는 방향으로 작성하라.
- **riskReason**: 현재 문장이 채용담당자에게 약하게 읽히는 구체적 이유를 적어라. 일반적 표현 금지.
- **direction**: 추상적 지시가 아닌 구체적·실행 가능한 방향을 적어라.
  - 나쁜 예: "구체적인 협업 경험을 강조"
  - 좋은 예: '"운영팀과 공유"를 "고객 문제 유형화 → 운영팀 협의 → 개선안 제안" 구조로 바꾸기'
- **safeExample**: 이력서에 있는 사실만 사용해서 예시를 만들어라.
  - 다음 항목은 이력서에 명시적으로 없으면 추가하지 마라: 수치·지표·비율, 소유권·주도·의사결정, churn/retention/upsell/renewal 결과, 분석 깊이나 방법론
  - 단, 기존 사실을 recruiter-readable 구조(상황/문제 → 행동 → 협업/대상 → 활용/결과)로 재배열하는 것은 허용한다. 이 구조 재배열은 새 사실 발명이 아니다.
  - **단순 유의어 교체 금지**: safeExample은 원문을 동의어로만 바꾼 polish가 아니어야 한다. 구조 재배열 없이 단어만 교체된 예시는 품질 기준 미달이다.
  - 좋은 예) 원문: "기존 고객 대상 추가 서비스 제안으로 월 매출 확대에 기여"
    safeExample: "기존 고객 상담 과정에서 확인한 추가 니즈를 바탕으로 관련 서비스 제안을 진행하고, 후속 상담에 활용했습니다."
    → "월 매출 확대" 수치 근거 없으면 claim을 낮춰라: "추가 서비스 제안 및 후속 상담에 활용"
  - 나쁜 예) 원문: "기존 고객 대상 추가 서비스 제안으로 월 매출 확대에 기여"
    safeExample: "기존 고객에게 추가 서비스 제안을 통해 매출 증가에 기여함" → 단순 유의어 교체, 구조 개선 없음
  - 좋은 예) 원문: "고객 미팅 내용을 정리해 운영팀과 공유하고 서비스 개선 의견 전달"
    safeExample: "고객 미팅에서 확인한 문의사항과 요청사항을 정리해 운영팀에 공유하고, 고객별 대응 방향을 조율했습니다."
- **개발자 이력서 safeExample**: 개발자 역할에서는 "문제/요구사항 → 사용 기술 → 구현 내용 → 협업 대상 → 결과/활용" 구조를 우선 사용한다.
  - 좋은 예) 원문: "React 기반 사용자 입력 페이지 개발"
    safeExample: "취업 준비생이 경험을 입력하는 화면에서 React 기반 단계형 입력 페이지를 구현하고, Figma 시안을 기준으로 디자이너와 화면 흐름을 조율했습니다."
  - 좋은 예) 원문: "진단 결과를 보여주는 결과 페이지 UI 구현"
    safeExample: "진단 결과를 카드형 UI로 구성해 핵심 항목이 먼저 보이도록 결과 페이지를 구현하고, 팀 피드백을 반영해 정보 구조를 조정했습니다."
  - 주의) 원문에 REST API 연동이 단순 언급만 있는 경우, safeExample에서 능동적 연동 구현으로 부풀리지 말고 confirmationQuestion으로 구체적 구현 경험 여부를 질문하라.
- **strongerExample**: needsUserConfirmation이 true일 때만 채워라. 실제 이력서에 쓸 수 있는 더 강한 완성 문장으로 작성하라. 없으면 빈 문자열.
- **confirmationQuestion**: needsUserConfirmation이 true이면 사용자에게 물어볼 구체적 질문을 작성하라.
  - 일반적 질문 금지: "경험이 있나요?"
  - 좋은 예: "문의사항을 유형별로 정리했거나 응대 기준 개선으로 이어진 사례가 있나요?"
- 더 강한 표현이 이력서 근거 없이 필요하면 needsUserConfirmation을 true로 설정하세요.
- **사용자 표시 필드 금지값**: strongerExample, safeExample, saferAlternative, confirmationQuestion에 다음 텍스트를 쓰지 마라:
  - "needsUserConfirmation=true", "needsUserConfirmation=false", "true", "false", "N/A", "null", "확인 필요"
  - 더 강한 문장이 없으면 strongerExample은 빈 문자열로 반환하라.

### 과장 위험 표현 주의 (antiOverclaimWarnings)
- risk는 후보가 이력서나 면접에서 쓰면 위험한 실제 표현 또는 주장이어야 합니다.
- "과장 위험", "주의 필요", "불명확함" 같은 일반적 레이블을 risk 값으로 사용하지 마세요.
- 좋은 risk 예시:
  - "고객 이탈률을 개선했습니다"
  - "리뉴얼/업셀을 주도했습니다"
  - "고객 성공 지표를 관리했습니다"
  - "제품 개선 우선순위를 결정했습니다"
- reason은 이력서 근거가 왜 그 주장을 뒷받침하지 못하는지 구체적으로 설명하세요.
- **linkedOriginalEvidence**: 이 과장 표현이 유래한 이력서 원문을 그대로 또는 가깝게 인용하라.
- **saferAlternative**: 같은 문맥과 주제를 유지하면서 낮춰 쓴 안전한 대체 문장을 제시하라. 완전히 다른 주제로 대체하지 마라.
  - 결과/성과 claim을 낮출 때는 프로세스·기여 표현으로 대체하라: "개선에 기여" → "제안 및 후속 상담에 활용"
  - 수치 근거 없는 "개선", "증가", "성과"는 "활용했습니다", "공유했습니다", "조율했습니다" 수준으로 낮춰라
  - 좋은 예) risk: "기존 고객 재계약률 개선에 기여"
    saferAlternative: "기존 고객의 문의사항과 추가 니즈를 정리해 후속 제안과 재계약 상담 자료로 활용했습니다."
  - 나쁜 예) saferAlternative: "기존 고객과의 관계를 유지하는 데 기여함" → 원래 주제(재계약/제안)가 사라짐
- **confirmationQuestion**: 이 표현을 쓰려면 확인해야 할 수치나 근거 질문을 작성하라.

### 면접 질문 (missingInfoQuestions)
- question은 구체적이고 답변 가능한 질문이어야 합니다.
- whyItMatters는 그 답변이 채용담당자의 평가를 어떻게 바꾸는지 설명하세요.
- 일반적인 질문("고객 성공 관리 경험이 있습니까?")보다 구체적인 질문을 선호하세요.
- 예를 들어, AM/CSM 역할에서:
  - renewal/upsell에 어느 수준으로 관여했는지 (주도/협업/지원)
  - churn·retention 지표를 직접 추적·보고한 경험이 있는지
  - 고객 미팅을 독립적으로 준비·운영한 경험이 있는지
  - SaaS 사용 데이터를 분석해 인사이트를 도출한 경험이 있는지

${roleScope}## JD
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
      "requirement": "JD의 자격요건 또는 주요업무에서 직접 수행이 요구되는 핵심 역량",
      "jdEvidence": "JD에서 요구하는 내용",
      "resumeEvidence": "이력서에서 제시된 내용",
      "matchLevel": "missing|weak|partial|strong|unclear",
      "executionLevel": "none|indirect|support|collaboration|direct|unclear",
      "riskReason": "왜 위험한가",
      "severity": "critical|high|medium|low",
      "source": "responsibility|qualification|preferred|common|unknown",
      "requirementType": "core|adjacent|operational|advanced|preferred|unknown",
      "logic": "required|optional|oneOf|unknown"
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
      "direction": "구체적이고 실행 가능한 개선 방향",
      "riskReason": "현재 문장이 채용담당자에게 약하게 읽히는 구체적 이유",
      "safeExample": "이력서에 있는 사실만 사용한 안전한 예시",
      "strongerExample": "추가 사실이 확인되면 실제 이력서에 쓸 수 있는 더 강한 완성 문장. 없으면 빈 문자열.",
      "confirmationQuestion": "더 강한 예시를 쓰기 위해 사용자에게 물어볼 구체적 질문",
      "needsUserConfirmation": true
    }
  ],
  "antiOverclaimWarnings": [
    {
      "risk": "과장으로 읽힐 수 있는 표현 또는 주장",
      "reason": "이 주장이 과장일 수 있는 이유",
      "linkedOriginalEvidence": "이 표현이 유래한 이력서 원문",
      "saferAlternative": "같은 문맥을 유지하면서 낮춰 쓴 안전한 대체 문장",
      "confirmationQuestion": "이 표현을 쓰려면 확인해야 할 수치/근거 질문"
    }
  ]
}

중요: 오직 유효한 JSON만 반환하세요. 마크다운이나 다른 텍스트는 포함하지 마세요.`;
}

// Infer oneOf logic from requirement/jdEvidence text when AI misclassifies
function inferLogicFromRequirementText(requirement, jdEvidence, currentLogic, { jdText = '' } = {}) {
  const logic = String(currentLogic || 'unknown');
  if (logic === 'oneOf') return logic;

  const text = `${requirement || ''}\n${jdEvidence || ''}\n${jdText || ''}`.toLowerCase();

  const hasCoreOneOfPattern =
    /중\s*하나\s*이상/.test(text) ||
    /하나\s*이상의/.test(text) ||
    /하나\s*이상/.test(text) ||
    /\bone\s+of\b/.test(text) ||
    /\bat\s+least\s+one\s+of\b/.test(text);

  if (hasCoreOneOfPattern) return 'oneOf';

  // 리스트 나열 구조(A, B 또는/혹은 C)일 때만 추가 적용
  const hasListOr = /[가-힣a-z]+(?:,\s*[가-힣a-z]+)+\s*(?:또는|혹은)/.test(text);
  return hasListOr ? 'oneOf' : logic;
}

// PM/서비스기획 umbrella requirement 보정
// JD에 "A, B, C 중 하나 이상" 형태 + 이력서에 인접 근거 → logic oneOf, missing→partial, high→medium
function calibratePlanningUmbrellaGap(gap, { jdText = '', resumeText = '' } = {}) {
  const jd = String(jdText || '');
  const resume = String(resumeText || '');
  const requirementText = `${gap.requirement || ''}\n${gap.jdEvidence || ''}`;

  const hasPlanningUmbrella =
    /(요구사항\s*정의|기능\s*정의|화면\s*설계|화면설계|prd|기능\s*정의서|와이어프레임).{0,80}(중\s*하나\s*이상|하나\s*이상|하나\s*이상의)/i.test(jd) ||
    /(prd|기능\s*정의서|화면\s*설계서|와이어프레임).{0,80}(중\s*하나\s*이상|하나\s*이상|one\s+of|at\s+least\s+one\s+of)/i.test(jd);

  const gapLooksPlanningRelated =
    /(디자인\s*툴|figma|피그마|화면\s*설계|화면설계|요구사항|기능\s*정의|와이어프레임|사용자\s*흐름|정보\s*구조|서비스\s*기획|pm|prd|디자인\s*프로젝트|프로젝트\s*수행|산출물|기획\s*산출물|협업)/i.test(requirementText);

  const jdLooksPlanningUmbrellaDomain =
    /(요구사항\s*정의|기능\s*정의|화면\s*설계|화면설계|prd|기능\s*정의서|화면\s*설계서|와이어프레임|사용자\s*흐름|정보\s*구조)/i.test(jd);

  const isPlanningRelated = gapLooksPlanningRelated || (hasPlanningUmbrella && jdLooksPlanningUmbrellaDomain);

  const hasAdjacentResumeEvidence =
    /(figma|피그마|화면\s*구성|화면\s*설계|화면설계|와이어프레임|사용자\s*흐름|정보\s*구조|기능\s*범위|개발자.*조율|조율|요구사항|기능\s*정의)/i.test(resume);

  if (!hasPlanningUmbrella || !isPlanningRelated) return gap;

  const next = { ...gap, logic: 'oneOf' };

  if (hasAdjacentResumeEvidence) {
    if (next.matchLevel === 'missing' || next.matchLevel === 'unclear') {
      next.matchLevel = 'partial';
    }
    if (next.severity === 'critical' || next.severity === 'high') {
      next.severity = 'medium';
    }
  }

  return next;
}

// Normalize AI response to contract
function normalizeAnalysisResponse(raw, { jdText = '', resumeText = '' } = {}) {
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
    mustRequirementGaps = raw.mustRequirementGaps.slice(0, 6).map((gap) => {
      const normalizedGap = {
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
        source: normalize(gap.source, 'enum', ['unknown', 'responsibility', 'qualification', 'preferred', 'common']),
        requirementType: normalize(gap.requirementType, 'enum', ['unknown', 'core', 'adjacent', 'operational', 'advanced', 'preferred']),
        logic: normalize(gap.logic, 'enum', ['unknown', 'required', 'optional', 'oneOf']),
      };
      normalizedGap.logic = inferLogicFromRequirementText(
        normalizedGap.requirement,
        normalizedGap.jdEvidence,
        normalizedGap.logic,
        { jdText },
      );
      return calibratePlanningUmbrellaGap(normalizedGap, { jdText, resumeText });
    });
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

  const SCHEMA_CONTROL_TOKENS = new Set([
    'needsUserConfirmation=true', 'needsUserConfirmation=false',
    'true', 'false', 'n/a', 'null', '확인 필요',
  ]);
  const sanitizeUserText = (val) => {
    const s = normalize(val, 'string', '');
    return SCHEMA_CONTROL_TOKENS.has(s.toLowerCase()) ? '' : s;
  };
  const parseNeedsConfirmation = (val) => {
    if (val === true) return true;
    if (val === false) return false;
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'true') return true;
      if (lower === 'false') return false;
    }
    return false;
  };

  // Normalize rewriteDirections (max 4)
  let rewriteDirections = [];
  if (Array.isArray(raw.rewriteDirections)) {
    rewriteDirections = raw.rewriteDirections.slice(0, 4).map((direction) => ({
      originalEvidence: normalize(direction.originalEvidence, 'string', ''),
      direction: normalize(direction.direction, 'string', ''),
      riskReason: normalize(direction.riskReason, 'string', ''),
      safeExample: sanitizeUserText(direction.safeExample),
      strongerExample: sanitizeUserText(direction.strongerExample),
      confirmationQuestion: sanitizeUserText(direction.confirmationQuestion),
      needsUserConfirmation: parseNeedsConfirmation(direction.needsUserConfirmation),
    }));
  }

  // Normalize antiOverclaimWarnings (max 4)
  let antiOverclaimWarnings = [];
  if (Array.isArray(raw.antiOverclaimWarnings)) {
    antiOverclaimWarnings = raw.antiOverclaimWarnings.slice(0, 4).map((warning) => ({
      risk: normalize(warning.risk, 'string', ''),
      reason: normalize(warning.reason, 'string', ''),
      linkedOriginalEvidence: normalize(warning.linkedOriginalEvidence, 'string', ''),
      saferAlternative: sanitizeUserText(warning.saferAlternative),
      confirmationQuestion: sanitizeUserText(warning.confirmationQuestion),
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
