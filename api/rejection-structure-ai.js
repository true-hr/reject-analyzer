export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = req.body?.requestId || `struct-${Date.now()}`;

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { source: 'rejection-structure-ai', ms: Date.now() - t0, requestId },
    });
  }

  const { jdText, resumeText, model = 'gpt-4o-mini', temperature = 0.2, max_tokens = 2400 } = req.body || {};

  if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: buildFallback('INVALID_JD_TEXT'),
      error: { code: 'INVALID_JD_TEXT', message: 'jdText must be a non-empty string with at least 10 characters' },
      meta: { source: 'rejection-structure-ai', ms: Date.now() - t0, requestId },
    });
  }

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: buildFallback('INVALID_RESUME_TEXT'),
      error: { code: 'INVALID_RESUME_TEXT', message: 'resumeText must be a non-empty string with at least 10 characters' },
      meta: { source: 'rejection-structure-ai', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: buildFallback('NO_API_KEY'),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'rejection-structure-ai', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const prompt = buildStructurePrompt(jdText, resumeText);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages: [
          { role: 'system', content: '당신은 채용 전문가입니다. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        data: buildFallback(`OPENAI_${openaiRes.status}`),
        error: { code: 'OPENAI_ERROR', message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { source: 'rejection-structure-ai', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';

    const parsed = safeParseStructure(rawContent);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: {
        source: 'rejection-structure-ai',
        model: openaiJson?.model || model,
        ms: Date.now() - t0,
        requestId,
        usage: openaiJson?.usage ?? null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      data: buildFallback(String(err?.message || 'INTERNAL_ERROR')),
      error: { code: 'INTERNAL_ERROR', message: String(err?.message || 'Internal server error') },
      meta: { source: 'rejection-structure-ai', ms: Date.now() - t0, requestId },
    });
  }
}

function buildStructurePrompt(jdText, resumeText) {
  return `아래 JD와 이력서를 분석하여 구조화된 JSON을 반환하세요.

## 분석 원칙
- 반드시 JSON만 반환하고 마크다운 코드블록을 사용하지 않는다.
- JD에 없는 필수요건을 임의로 추가하지 않는다.
- 이력서에 없는 성과/수치/회사명/툴을 만들지 않는다.
- "경험이 없음"과 "관련 경험은 있으나 표현이 약함"을 반드시 구분한다.
- "키워드가 없음"과 "의미상 유사한 경험은 있음"을 반드시 구분한다.
- JD 요구사항은 must/core_task/preferred/tool/domain/seniority/scope 중 하나로 분류한다.
- 이력서 근거는 direct/semantic/indirect/missing 중 하나로 분류한다.
- 각 배열은 최대 8개 항목까지만 포함한다.
- confidence 필드는 포함하지 않는다.

## 출력 스키마 (이 형식을 엄격히 따를 것)
{
  "schemaVersion": 1,
  "interpretedRequirements": [
    {
      "id": "req-1",
      "sourceText": "JD에서 원문 발췌",
      "normalizedMeaning": "표준화된 의미",
      "category": "must",
      "importance": "critical",
      "expectedEvidence": "이력서에서 기대되는 근거 형태"
    }
  ],
  "functionalEquivalents": [
    {
      "jdRequirement": "JD 요구사항",
      "resumeEvidence": "이력서 근거 원문",
      "equivalenceType": "direct",
      "strength": "strong",
      "reason": "판단 근거"
    }
  ],
  "implicitImpactStatements": [
    {
      "resumeText": "이력서 원문",
      "interpretedImpact": "해석된 임팩트",
      "hasMetric": false,
      "metricText": "",
      "strength": "moderate"
    }
  ],
  "semanticKeywordMatches": [
    {
      "jdKeyword": "JD 키워드",
      "resumeExpression": "이력서 표현",
      "matchType": "exact",
      "reason": "매칭 판단 근거"
    }
  ],
  "gapExplanationQuality": [
    {
      "gapOrTransition": "공백/전환 내용",
      "hasExplanation": false,
      "quality": "missing",
      "reason": "판단 근거"
    }
  ],
  "summary": {
    "strongestMatches": ["가장 강한 매칭 포인트 최대 3개"],
    "weakestMatches": ["가장 약한 매칭 포인트 최대 3개"],
    "likelyRisks": [
      {
        "risk": "주요 리스크",
        "riskLevel": "high",
        "basis": "must"
      }
    ]
  },
  "meta": {
    "source": "rejection-structure-ai",
    "version": "p1",
    "fallback": false
  }
}

## JD
${jdText.slice(0, 3000)}

## 이력서
${resumeText.slice(0, 3000)}

위 스키마를 엄격히 따라 JSON만 반환하세요.`;
}

function safeParseStructure(raw) {
  let text = typeof raw === 'string' ? raw.trim() : '';

  // strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(text);
    return normalizeStructureResponse(parsed);
  } catch {
    return buildFallback('JSON_PARSE_FAILED');
  }
}

function normalizeStructureResponse(raw) {
  const arr = (v) => (Array.isArray(v) ? v.slice(0, 8) : []);

  return {
    schemaVersion: 1,
    interpretedRequirements: arr(raw?.interpretedRequirements),
    functionalEquivalents: arr(raw?.functionalEquivalents),
    implicitImpactStatements: arr(raw?.implicitImpactStatements),
    semanticKeywordMatches: arr(raw?.semanticKeywordMatches),
    gapExplanationQuality: arr(raw?.gapExplanationQuality),
    summary: {
      strongestMatches: arr(raw?.summary?.strongestMatches),
      weakestMatches: arr(raw?.summary?.weakestMatches),
      likelyRisks: arr(raw?.summary?.likelyRisks),
    },
    meta: {
      source: 'rejection-structure-ai',
      version: 'p1',
      fallback: false,
    },
  };
}

function buildFallback(errorCode) {
  return {
    schemaVersion: 1,
    interpretedRequirements: [],
    functionalEquivalents: [],
    implicitImpactStatements: [],
    semanticKeywordMatches: [],
    gapExplanationQuality: [],
    summary: {
      strongestMatches: [],
      weakestMatches: [],
      likelyRisks: [],
    },
    meta: {
      source: 'rejection-structure-ai',
      version: 'p1',
      fallback: true,
      error: String(errorCode || 'UNKNOWN'),
    },
  };
}
