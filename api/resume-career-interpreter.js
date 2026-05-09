export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = req.body?.requestId || `career-${Date.now()}`;

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }

  const { resumeText, parsedResume = null, targetRole = null, model = 'gpt-4o-mini', temperature = 0.2, max_tokens = 2400 } = req.body || {};

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: buildFallback('INVALID_RESUME_TEXT'),
      error: { code: 'INVALID_RESUME_TEXT', message: 'resumeText must be a non-empty string with at least 10 characters' },
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: buildFallback('NO_API_KEY'),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const prompt = buildCareerInterpreterPrompt(resumeText, parsedResume, targetRole);

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
          { role: 'system', content: '당신은 경력 분석 전문가입니다. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.' },
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
        meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';

    const parsed = safeParseCareerResponse(rawContent);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: {
        source: 'resume-career-interpreter',
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
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }
}

function buildCareerInterpreterPrompt(resumeText, parsedResume, targetRole) {
  const roleHint = targetRole ? `\n참고 지원 직무: ${String(targetRole).slice(0, 100)}` : '';
  const parsedHint = parsedResume && typeof parsedResume === 'object'
    ? `\n구조화된 이력서 참고 데이터:\n${JSON.stringify(parsedResume).slice(0, 1000)}`
    : '';

  return `아래 이력서를 분석하여 경력 항목을 구조화된 JSON으로 반환하세요.${roleHint}

## 분석 원칙
- 반드시 JSON만 반환하고 마크다운 코드블록을 사용하지 않는다.
- 이력서에 없는 회사명, 기간, 성과 수치, 툴을 생성하지 않는다.
- 날짜가 불명확하면 빈 문자열 또는 unknown으로 둔다.
- 기간 계산이 불확실하면 durationMonths는 0으로 두고 ambiguityNotes에 이유를 남긴다.
- 경력 항목은 회사/프로젝트/프리랜서/인턴 등 이력서에 드러난 단위로 나눈다.
- 성과는 achievements에 따로 분리한다. 성과 수치가 있으면 metricText에 원문 그대로 기록한다.
- 최근성(recency)은 현재 재직 중이면 current, 1년 이내 퇴사면 recent, 2-4년이면 past, 5년 이상이면 old로 구분한다.
- evidenceStrength는 이력서 근거가 얼마나 명확한지(기간/회사/역할/성과 구체성)로 판단한다.
- JD와의 적합성 판단은 하지 않는다. 탈락 원인 판단도 하지 않는다.
- targetRole이 있더라도 이번 단계에서는 경력 해석 참고용으로만 사용한다.
- 각 배열은 최대 8개 항목까지만 포함한다.

## 출력 스키마 (이 형식을 엄격히 따를 것)
{
  "schemaVersion": 1,
  "careerEntries": [
    {
      "id": "career_1",
      "company": "",
      "roleTitle": "",
      "employmentType": "full_time|contract|intern|freelance|project|unknown",
      "startDate": "",
      "endDate": "",
      "durationMonths": 0,
      "recency": "current|recent|past|old|unknown",
      "inferredRoleFamily": "",
      "industryDomain": "",
      "responsibilities": [],
      "projects": [],
      "achievements": [
        {
          "text": "",
          "hasMetric": false,
          "metricText": "",
          "impactType": "revenue|cost|efficiency|quality|growth|risk|operation|unknown"
        }
      ],
      "toolsAndSkills": [],
      "evidenceStrength": "strong|moderate|weak",
      "ambiguityNotes": []
    }
  ],
  "careerSummary": {
    "totalMonths": 0,
    "recentRelevantSignals": [],
    "strongestEvidence": [],
    "weakestEvidence": [],
    "missingDateOrEmploymentInfo": []
  },
  "meta": {
    "source": "resume-career-interpreter",
    "version": "p1-a",
    "fallback": false
  }
}

## 이력서 원문
${resumeText.slice(0, 4000)}${parsedHint}

위 스키마를 엄격히 따라 JSON만 반환하세요.`;
}

function safeParseCareerResponse(raw) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(text);
    return normalizeCareerResponse(parsed);
  } catch {
    return buildFallback('JSON_PARSE_FAILED');
  }
}

function normalizeCareerResponse(raw) {
  const arr = (v, limit = 8) => (Array.isArray(v) ? v.slice(0, limit) : []);

  const entries = arr(raw?.careerEntries).map((e, i) => ({
    id: String(e?.id || `career_${i + 1}`),
    company: String(e?.company || ''),
    roleTitle: String(e?.roleTitle || ''),
    employmentType: ['full_time', 'contract', 'intern', 'freelance', 'project', 'unknown'].includes(e?.employmentType)
      ? e.employmentType : 'unknown',
    startDate: String(e?.startDate || ''),
    endDate: String(e?.endDate || ''),
    durationMonths: typeof e?.durationMonths === 'number' ? Math.max(0, e.durationMonths) : 0,
    recency: ['current', 'recent', 'past', 'old', 'unknown'].includes(e?.recency) ? e.recency : 'unknown',
    inferredRoleFamily: String(e?.inferredRoleFamily || ''),
    industryDomain: String(e?.industryDomain || ''),
    responsibilities: arr(e?.responsibilities),
    projects: arr(e?.projects),
    achievements: arr(e?.achievements).map((a) => ({
      text: String(a?.text || ''),
      hasMetric: Boolean(a?.hasMetric),
      metricText: String(a?.metricText || ''),
      impactType: ['revenue', 'cost', 'efficiency', 'quality', 'growth', 'risk', 'operation', 'unknown'].includes(a?.impactType)
        ? a.impactType : 'unknown',
    })),
    toolsAndSkills: arr(e?.toolsAndSkills),
    evidenceStrength: ['strong', 'moderate', 'weak'].includes(e?.evidenceStrength) ? e.evidenceStrength : 'weak',
    ambiguityNotes: arr(e?.ambiguityNotes),
  }));

  const summary = raw?.careerSummary || {};

  return {
    schemaVersion: 1,
    careerEntries: entries,
    careerSummary: {
      totalMonths: typeof summary.totalMonths === 'number' ? Math.max(0, summary.totalMonths) : 0,
      recentRelevantSignals: arr(summary.recentRelevantSignals),
      strongestEvidence: arr(summary.strongestEvidence),
      weakestEvidence: arr(summary.weakestEvidence),
      missingDateOrEmploymentInfo: arr(summary.missingDateOrEmploymentInfo),
    },
    meta: {
      source: 'resume-career-interpreter',
      version: 'p1-a',
      fallback: false,
    },
  };
}

function buildFallback(errorCode) {
  return {
    schemaVersion: 1,
    careerEntries: [],
    careerSummary: {
      totalMonths: 0,
      recentRelevantSignals: [],
      strongestEvidence: [],
      weakestEvidence: [],
      missingDateOrEmploymentInfo: [],
    },
    meta: {
      source: 'resume-career-interpreter',
      version: 'p1-a',
      fallback: true,
      error: String(errorCode || 'UNKNOWN'),
    },
  };
}
