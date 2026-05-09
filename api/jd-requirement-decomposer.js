export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = req.body?.requestId || `jd-decomp-${Date.now()}`;

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }

  const {
    jdText,
    compactJdModel = null,
    parsedJD = null,
    model = 'gpt-4o-mini',
    temperature = 0.2,
    max_tokens = 2000,
  } = req.body || {};

  if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: buildFallback('INVALID_JD_TEXT'),
      error: { code: 'INVALID_JD_TEXT', message: 'jdText must be a non-empty string with at least 10 characters' },
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: buildFallback('NO_API_KEY'),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const prompt = buildDecomposerPrompt(jdText, compactJdModel, parsedJD);

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
          { role: 'system', content: '당신은 채용 공고 분석 전문가입니다. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.' },
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
        meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';

    const parsed = safeParseDecomposerResponse(rawContent);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: {
        source: 'jd-requirement-decomposer',
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
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }
}

function buildDecomposerPrompt(jdText, compactJdModel, parsedJD) {
  const compactHint = compactJdModel && typeof compactJdModel === 'object'
    ? `\n구조화된 JD 참고 데이터:\n${JSON.stringify(compactJdModel).slice(0, 800)}`
    : '';
  const parsedHint = parsedJD && typeof parsedJD === 'object'
    ? `\n파싱된 JD 데이터:\n${JSON.stringify(parsedJD).slice(0, 600)}`
    : '';

  return `아래 채용 공고를 분석하여 요구사항을 구조화된 JSON으로 반환하세요.

## 분석 원칙
- 반드시 JSON만 반환하고 마크다운 코드블록을 사용하지 않는다.
- JD에 없는 내용을 생성하거나 추측하지 않는다.
- jdRequirements: 명시적 요구사항과 JD 문구에 근거한 숨겨진 기준을 포함한다.
- requirementType: "hidden_criterion"은 실제 JD 문구에서 암시되는 경우에만 사용한다. 문화적 가정이나 성격 추론에 사용하지 않는다.
- hidden_criterion은 반드시 sourceText에 근거 JD 문구를 포함해야 한다. JD 근거 없이 문화 적합성이나 성격 특성을 만들어내지 않는다.
- 각 배열은 최대 10개 항목까지만 포함한다.
- seniority: 공고에서 명확히 파악 가능한 경우에만 junior/mid/senior/lead/executive를 사용하고, 불명확하면 "unknown"으로 둔다.

## 출력 스키마 (이 형식을 엄격히 따를 것)
{
  "schemaVersion": 1,
  "jdRequirements": [
    {
      "id": "req_1",
      "requirementType": "must|preferred|bonus|hidden_criterion",
      "importance": "critical|important|supporting",
      "category": "technical|domain|soft_skill|experience|education|certification|language|other",
      "text": "",
      "sourceText": "",
      "evaluationSignal": "resume_evidence|interview_signal|portfolio_check|unknown",
      "seniority": "junior|mid|senior|lead|executive|unknown",
      "scope": "individual|team|org|unknown"
    }
  ],
  "jdProfile": {
    "seniority": "junior|mid|senior|lead|executive|unknown",
    "teamSize": "",
    "reportingLine": "",
    "industryDomain": "",
    "techStack": [],
    "roleFamily": "",
    "locationConstraint": "",
    "workType": "onsite|remote|hybrid|unknown"
  },
  "requirementSummary": {
    "mustCount": 0,
    "preferredCount": 0,
    "bonusCount": 0,
    "hiddenCriterionCount": 0,
    "topCriticalRequirements": [],
    "keyTechKeywords": [],
    "keyDomainKeywords": []
  },
  "meta": {
    "source": "jd-requirement-decomposer",
    "version": "p1-b",
    "fallback": false
  }
}

## 채용 공고 원문
${jdText.slice(0, 4000)}${compactHint}${parsedHint}

위 스키마를 엄격히 따라 JSON만 반환하세요.`;
}

const VALID_REQ_TYPES = new Set(['must', 'preferred', 'bonus', 'hidden_criterion']);
const VALID_IMPORTANCE = new Set(['critical', 'important', 'supporting']);
const VALID_CATEGORY = new Set(['technical', 'domain', 'soft_skill', 'experience', 'education', 'certification', 'language', 'other']);
const VALID_EVAL_SIGNAL = new Set(['resume_evidence', 'interview_signal', 'portfolio_check', 'unknown']);
const VALID_SENIORITY = new Set(['junior', 'mid', 'senior', 'lead', 'executive', 'unknown']);
const VALID_SCOPE = new Set(['individual', 'team', 'org', 'unknown']);
const VALID_WORK_TYPE = new Set(['onsite', 'remote', 'hybrid', 'unknown']);

function safeParseDecomposerResponse(raw) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(text);
    return normalizeDecomposerResponse(parsed);
  } catch {
    return buildFallback('JSON_PARSE_FAILED');
  }
}

function normalizeDecomposerResponse(raw) {
  const arr = (v, limit = 10) => (Array.isArray(v) ? v.slice(0, limit) : []);

  const requirements = arr(raw?.jdRequirements).map((req, i) => ({
    id: String(req?.id || `req_${i + 1}`),
    requirementType: VALID_REQ_TYPES.has(req?.requirementType) ? req.requirementType : 'hidden_criterion',
    importance: VALID_IMPORTANCE.has(req?.importance) ? req.importance : 'supporting',
    category: VALID_CATEGORY.has(req?.category) ? req.category : 'other',
    text: String(req?.text || ''),
    sourceText: String(req?.sourceText || ''),
    evaluationSignal: VALID_EVAL_SIGNAL.has(req?.evaluationSignal) ? req.evaluationSignal : 'unknown',
    seniority: VALID_SENIORITY.has(req?.seniority) ? req.seniority : 'unknown',
    scope: VALID_SCOPE.has(req?.scope) ? req.scope : 'unknown',
  }));

  const profile = raw?.jdProfile || {};

  return {
    schemaVersion: 1,
    jdRequirements: requirements,
    jdProfile: {
      seniority: VALID_SENIORITY.has(profile?.seniority) ? profile.seniority : 'unknown',
      teamSize: String(profile?.teamSize || ''),
      reportingLine: String(profile?.reportingLine || ''),
      industryDomain: String(profile?.industryDomain || ''),
      techStack: arr(profile?.techStack),
      roleFamily: String(profile?.roleFamily || ''),
      locationConstraint: String(profile?.locationConstraint || ''),
      workType: VALID_WORK_TYPE.has(profile?.workType) ? profile.workType : 'unknown',
    },
    requirementSummary: {
      mustCount: typeof raw?.requirementSummary?.mustCount === 'number' ? raw.requirementSummary.mustCount : requirements.filter(r => r.requirementType === 'must').length,
      preferredCount: typeof raw?.requirementSummary?.preferredCount === 'number' ? raw.requirementSummary.preferredCount : requirements.filter(r => r.requirementType === 'preferred').length,
      bonusCount: typeof raw?.requirementSummary?.bonusCount === 'number' ? raw.requirementSummary.bonusCount : requirements.filter(r => r.requirementType === 'bonus').length,
      hiddenCriterionCount: typeof raw?.requirementSummary?.hiddenCriterionCount === 'number' ? raw.requirementSummary.hiddenCriterionCount : requirements.filter(r => r.requirementType === 'hidden_criterion').length,
      topCriticalRequirements: arr(raw?.requirementSummary?.topCriticalRequirements),
      keyTechKeywords: arr(raw?.requirementSummary?.keyTechKeywords),
      keyDomainKeywords: arr(raw?.requirementSummary?.keyDomainKeywords),
    },
    meta: {
      source: 'jd-requirement-decomposer',
      version: 'p1-b',
      fallback: false,
    },
  };
}

function buildFallback(errorCode) {
  return {
    schemaVersion: 1,
    jdRequirements: [],
    jdProfile: {
      seniority: 'unknown',
      teamSize: '',
      reportingLine: '',
      industryDomain: '',
      techStack: [],
      roleFamily: '',
      locationConstraint: '',
      workType: 'unknown',
    },
    requirementSummary: {
      mustCount: 0,
      preferredCount: 0,
      bonusCount: 0,
      hiddenCriterionCount: 0,
      topCriticalRequirements: [],
      keyTechKeywords: [],
      keyDomainKeywords: [],
    },
    meta: {
      source: 'jd-requirement-decomposer',
      version: 'p1-b',
      fallback: true,
      error: String(errorCode || 'UNKNOWN'),
    },
  };
}
