export default async function handler(req, res) {
  const t0 = Date.now();

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { source: 'p1-analysis', ms: Date.now() - t0 },
    });
  }

  const body = req.body || {};
  const action = String(body.action || '').trim();

  if (action === 'career') return handleCareer(req, res, body, t0);
  if (action === 'jd') return handleJd(req, res, body, t0);
  if (action === 'rolefit') return handleRolefit(req, res, body, t0);

  return res.status(400).json({ ok: false, error: 'invalid_action' });
}

// ─── P1-A: resume-career-interpreter ────────────────────────────────────────

async function handleCareer(req, res, body, t0) {
  const requestId = body?.requestId || `career-${Date.now()}`;
  const { resumeText, parsedResume = null, targetRole = null, model = 'gpt-4o-mini', temperature = 0.2, max_tokens = 2400 } = body;

  if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: careerFallback('INVALID_RESUME_TEXT'),
      error: { code: 'INVALID_RESUME_TEXT', message: 'resumeText must be a non-empty string with at least 10 characters' },
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: careerFallback('NO_API_KEY'),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const currentDate = new Date().toISOString().slice(0, 10);
    const prompt = buildCareerPrompt(resumeText, parsedResume, targetRole, currentDate);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, temperature, max_tokens,
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
        data: careerFallback(`OPENAI_${openaiRes.status}`),
        error: { code: 'OPENAI_ERROR', message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';
    const parsed = safeParseCareer(rawContent);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: { source: 'resume-career-interpreter', model: openaiJson?.model || model, ms: Date.now() - t0, requestId, usage: openaiJson?.usage ?? null },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      data: careerFallback(String(err?.message || 'INTERNAL_ERROR')),
      error: { code: 'INTERNAL_ERROR', message: String(err?.message || 'Internal server error') },
      meta: { source: 'resume-career-interpreter', ms: Date.now() - t0, requestId },
    });
  }
}

function buildCareerPrompt(resumeText, parsedResume, targetRole, currentDate) {
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
- 현재 날짜 기준: ${currentDate}
- recency는 현재 날짜 기준으로 판단한다: 현재 재직 중이면 current, 현재 날짜 기준 1년 이내 종료 경력은 recent, 현재 날짜 기준 2~4년 전 종료 경력은 past, 현재 날짜 기준 5년 이상 지난 경력은 old로 구분한다.
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

function safeParseCareer(raw) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return normalizeCareer(JSON.parse(text));
  } catch {
    return careerFallback('JSON_PARSE_FAILED');
  }
}

function normalizeCareer(raw) {
  const arr = (v, limit = 8) => (Array.isArray(v) ? v.slice(0, limit) : []);
  const entries = arr(raw?.careerEntries).map((e, i) => ({
    id: String(e?.id || `career_${i + 1}`),
    company: String(e?.company || ''),
    roleTitle: String(e?.roleTitle || ''),
    employmentType: ['full_time', 'contract', 'intern', 'freelance', 'project', 'unknown'].includes(e?.employmentType) ? e.employmentType : 'unknown',
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
      impactType: ['revenue', 'cost', 'efficiency', 'quality', 'growth', 'risk', 'operation', 'unknown'].includes(a?.impactType) ? a.impactType : 'unknown',
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
    meta: { source: 'resume-career-interpreter', version: 'p1-a', fallback: false },
  };
}

function careerFallback(errorCode) {
  return {
    schemaVersion: 1,
    careerEntries: [],
    careerSummary: { totalMonths: 0, recentRelevantSignals: [], strongestEvidence: [], weakestEvidence: [], missingDateOrEmploymentInfo: [] },
    meta: { source: 'resume-career-interpreter', version: 'p1-a', fallback: true, error: String(errorCode || 'UNKNOWN') },
  };
}

// ─── P1-B: jd-requirement-decomposer ────────────────────────────────────────

async function handleJd(req, res, body, t0) {
  const requestId = body?.requestId || `jd-decomp-${Date.now()}`;
  const { jdText, compactJdModel = null, parsedJD = null, model = 'gpt-4o-mini', temperature = 0.2, max_tokens = 2000 } = body;

  if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: jdFallback('INVALID_JD_TEXT'),
      error: { code: 'INVALID_JD_TEXT', message: 'jdText must be a non-empty string with at least 10 characters' },
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: jdFallback('NO_API_KEY'),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const prompt = buildJdPrompt(jdText, compactJdModel, parsedJD);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, temperature, max_tokens,
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
        data: jdFallback(`OPENAI_${openaiRes.status}`),
        error: { code: 'OPENAI_ERROR', message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';
    const parsed = safeParseJd(rawContent);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: { source: 'jd-requirement-decomposer', model: openaiJson?.model || model, ms: Date.now() - t0, requestId, usage: openaiJson?.usage ?? null },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      data: jdFallback(String(err?.message || 'INTERNAL_ERROR')),
      error: { code: 'INTERNAL_ERROR', message: String(err?.message || 'Internal server error') },
      meta: { source: 'jd-requirement-decomposer', ms: Date.now() - t0, requestId },
    });
  }
}

function buildJdPrompt(jdText, compactJdModel, parsedJD) {
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

const JD_REQ_TYPES = new Set(['must', 'preferred', 'bonus', 'hidden_criterion']);
const JD_IMPORTANCE = new Set(['critical', 'important', 'supporting']);
const JD_CATEGORY = new Set(['technical', 'domain', 'soft_skill', 'experience', 'education', 'certification', 'language', 'other']);
const JD_EVAL_SIGNAL = new Set(['resume_evidence', 'interview_signal', 'portfolio_check', 'unknown']);
const JD_SENIORITY = new Set(['junior', 'mid', 'senior', 'lead', 'executive', 'unknown']);
const JD_SCOPE = new Set(['individual', 'team', 'org', 'unknown']);
const JD_WORK_TYPE = new Set(['onsite', 'remote', 'hybrid', 'unknown']);

function safeParseJd(raw) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return normalizeJd(JSON.parse(text));
  } catch {
    return jdFallback('JSON_PARSE_FAILED');
  }
}

function normalizeJd(raw) {
  const arr = (v, limit = 10) => (Array.isArray(v) ? v.slice(0, limit) : []);
  const requirements = arr(raw?.jdRequirements).map((req, i) => ({
    id: String(req?.id || `req_${i + 1}`),
    requirementType: JD_REQ_TYPES.has(req?.requirementType) ? req.requirementType : 'hidden_criterion',
    importance: JD_IMPORTANCE.has(req?.importance) ? req.importance : 'supporting',
    category: JD_CATEGORY.has(req?.category) ? req.category : 'other',
    text: String(req?.text || ''),
    sourceText: String(req?.sourceText || ''),
    evaluationSignal: JD_EVAL_SIGNAL.has(req?.evaluationSignal) ? req.evaluationSignal : 'unknown',
    seniority: JD_SENIORITY.has(req?.seniority) ? req.seniority : 'unknown',
    scope: JD_SCOPE.has(req?.scope) ? req.scope : 'unknown',
  }));

  const profile = raw?.jdProfile || {};
  return {
    schemaVersion: 1,
    jdRequirements: requirements,
    jdProfile: {
      seniority: JD_SENIORITY.has(profile?.seniority) ? profile.seniority : 'unknown',
      teamSize: String(profile?.teamSize || ''),
      reportingLine: String(profile?.reportingLine || ''),
      industryDomain: String(profile?.industryDomain || ''),
      techStack: arr(profile?.techStack),
      roleFamily: String(profile?.roleFamily || ''),
      locationConstraint: String(profile?.locationConstraint || ''),
      workType: JD_WORK_TYPE.has(profile?.workType) ? profile.workType : 'unknown',
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
    meta: { source: 'jd-requirement-decomposer', version: 'p1-b', fallback: false },
  };
}

function jdFallback(errorCode) {
  return {
    schemaVersion: 1,
    jdRequirements: [],
    jdProfile: { seniority: 'unknown', teamSize: '', reportingLine: '', industryDomain: '', techStack: [], roleFamily: '', locationConstraint: '', workType: 'unknown' },
    requirementSummary: { mustCount: 0, preferredCount: 0, bonusCount: 0, hiddenCriterionCount: 0, topCriticalRequirements: [], keyTechKeywords: [], keyDomainKeywords: [] },
    meta: { source: 'jd-requirement-decomposer', version: 'p1-b', fallback: true, error: String(errorCode || 'UNKNOWN') },
  };
}

// ─── P1-C: role-fit-career-matcher ──────────────────────────────────────────

async function handleRolefit(req, res, body, t0) {
  const requestId = body?.requestId || `role-fit-${Date.now()}`;
  const {
    resumeCareerInterpretation = null,
    jdRequirementDecomposition = null,
    targetRole = null,
    targetRoleMajorCategory = null,
    targetRoleSubcategory = null,
    model = 'gpt-4o-mini',
    temperature = 0.2,
    max_tokens = 2500,
  } = body;

  if (!resumeCareerInterpretation || typeof resumeCareerInterpretation !== 'object') {
    return res.status(400).json({
      ok: false,
      data: roleFitFallback('MISSING_CAREER_INTERPRETATION', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'MISSING_CAREER_INTERPRETATION', message: 'resumeCareerInterpretation is required' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  if (!jdRequirementDecomposition || typeof jdRequirementDecomposition !== 'object') {
    return res.status(400).json({
      ok: false,
      data: roleFitFallback('MISSING_JD_DECOMPOSITION', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'MISSING_JD_DECOMPOSITION', message: 'jdRequirementDecomposition is required' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
    return res.status(400).json({
      ok: false,
      data: roleFitFallback('MISSING_TARGET_ROLE', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'MISSING_TARGET_ROLE', message: 'targetRole is required' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: roleFitFallback('NO_API_KEY', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const prompt = buildRoleFitPrompt(resumeCareerInterpretation, jdRequirementDecomposition, targetRole, targetRoleMajorCategory, targetRoleSubcategory);

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model, temperature, max_tokens,
        messages: [
          { role: 'system', content: '당신은 채용 전문가로서 경력 적합성을 분석합니다. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        data: roleFitFallback(`OPENAI_${openaiRes.status}`, targetRole, targetRoleMajorCategory, targetRoleSubcategory),
        error: { code: 'OPENAI_ERROR', message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';
    const parsed = safeParseRoleFit(rawContent, targetRole, targetRoleMajorCategory, targetRoleSubcategory);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: { source: 'role-fit-career-matcher', model: openaiJson?.model || model, ms: Date.now() - t0, requestId, usage: openaiJson?.usage ?? null },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      data: roleFitFallback(String(err?.message || 'INTERNAL_ERROR'), targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'INTERNAL_ERROR', message: String(err?.message || 'Internal server error') },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }
}

function buildRoleFitPrompt(resumeCareerInterpretation, jdRequirementDecomposition, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  const roleDesc = [
    targetRole,
    targetRoleMajorCategory ? `(대분류: ${targetRoleMajorCategory})` : '',
    targetRoleSubcategory ? `(소분류: ${targetRoleSubcategory})` : '',
  ].filter(Boolean).join(' ');

  const entries = Array.isArray(resumeCareerInterpretation?.careerEntries)
    ? resumeCareerInterpretation.careerEntries.slice(0, 8) : [];

  const compactEntries = entries.map((e) => ({
    id: e.id, company: e.company || '', roleTitle: e.roleTitle || '',
    employmentType: e.employmentType || 'unknown', durationMonths: e.durationMonths || 0,
    recency: e.recency || 'unknown', inferredRoleFamily: e.inferredRoleFamily || '',
    industryDomain: e.industryDomain || '',
    responsibilities: (e.responsibilities || []).slice(0, 5),
    achievements: (e.achievements || []).slice(0, 3).map((a) => ({
      text: a.text || '', hasMetric: a.hasMetric || false, metricText: a.metricText || '',
    })),
    evidenceStrength: e.evidenceStrength || 'weak',
  }));

  const requirements = Array.isArray(jdRequirementDecomposition?.jdRequirements)
    ? jdRequirementDecomposition.jdRequirements.slice(0, 10) : [];

  const compactRequirements = requirements.map((r) => ({
    id: r.id, requirementType: r.requirementType || 'unknown',
    importance: r.importance || 'supporting', category: r.category || 'other', text: r.text || '',
  }));

  const jdProfile = jdRequirementDecomposition?.jdProfile || {};
  const summary = resumeCareerInterpretation?.careerSummary || {};

  return `아래 이력서 경력 해석(P1-A)과 JD 요구사항 분해(P1-B)를 바탕으로, 지원 직무(${roleDesc})에 대한 경력 적합도를 분석하세요.

## 분석 원칙
- 반드시 JSON만 반환하고 마크다운 코드블록을 사용하지 않는다.
- P1-A/P1-B에 없는 경력, 회사명, 성과, JD 요구조건을 만들지 않는다.
- 각 판단은 careerEntry.id와 jdRequirement.id를 근거로 연결한다.
- "총 경력"과 "지원 직무에서 인정 가능한 유효 경력"을 구분한다.
- 고용형태, 최근성, 성과 강도, 직무 관련성, 역할 범위를 함께 고려한다.
- 직무가 다르더라도 핵심업무가 유사하면 similar 또는 transferable로 인정할 수 있다.
- 단순 키워드가 같아도 실제 역할 범위가 다르면 direct로 과대평가하지 않는다.
- 성과가 약하거나 수치가 없으면 gapTypes에 weak_achievement를 포함한다.
- JD 핵심업무를 이력서 언어로 직접 설명하지 못하면 wrong_language를 포함한다.
- effectiveMonths는 반드시 careerEntry.durationMonths를 초과하지 않는다.
- 정보가 부족하면 unknown 또는 evidence_ambiguous를 사용한다.
- 탈락 원인 최종 판정은 하지 않는다.

## 지원 직무
${roleDesc}
JD 직급: ${jdProfile.seniority || 'unknown'}
JD 역할 계열: ${jdProfile.roleFamily || ''}
JD 산업: ${jdProfile.industryDomain || ''}

## 이력서 경력 항목 (P1-A)
총 경력월: ${summary.totalMonths || 0}개월
${JSON.stringify(compactEntries).slice(0, 2500)}

## JD 요구사항 (P1-B)
${JSON.stringify(compactRequirements).slice(0, 1500)}

## 출력 스키마 (이 형식을 엄격히 따를 것)
{
  "schemaVersion": 1,
  "targetRole": {
    "label": "${targetRole}",
    "majorCategory": "${targetRoleMajorCategory || ''}",
    "subcategory": "${targetRoleSubcategory || ''}"
  },
  "careerFitMatches": [
    {
      "careerEntryId": "career_1",
      "careerLabel": "회사명 / 직무명",
      "durationMonths": 0,
      "effectiveMonths": 0,
      "fitType": "direct|similar|transferable|weak|none|unknown",
      "applicability": "high|medium|low|none|unknown",
      "matchedRequirementIds": [],
      "matchedRequirementTexts": [],
      "evidenceUsed": [],
      "gapTypes": [],
      "reason": "",
      "caution": ""
    }
  ],
  "effectiveCareerSummary": {
    "totalCareerMonths": 0,
    "roleRelevantMonths": 0,
    "stronglyRelevantMonths": 0,
    "partiallyRelevantMonths": 0,
    "weakOrUnrelatedMonths": 0
  },
  "riskHints": [
    {
      "risk": "",
      "riskLevel": "high|medium|low",
      "basis": "career_relevance|seniority|domain|achievement|scope|language_gap|employment_type|recency"
    }
  ],
  "meta": {
    "source": "role-fit-career-matcher",
    "version": "p1-c",
    "fallback": false
  }
}

위 스키마를 엄격히 따라 JSON만 반환하세요.`;
}

const RF_FIT_TYPES = new Set(['direct', 'similar', 'transferable', 'weak', 'none', 'unknown']);
const RF_APPLICABILITY = new Set(['high', 'medium', 'low', 'none', 'unknown']);
const RF_RISK_LEVELS = new Set(['high', 'medium', 'low']);
const RF_GAP_TYPES = new Set([
  'missing_core_task', 'weak_achievement', 'wrong_language', 'insufficient_scope',
  'domain_gap', 'seniority_gap', 'employment_type_risk', 'recency_gap', 'evidence_ambiguous',
]);
const RF_BASIS = new Set([
  'career_relevance', 'seniority', 'domain', 'achievement', 'scope',
  'language_gap', 'employment_type', 'recency',
]);

function safeParseRoleFit(raw, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  try {
    return normalizeRoleFit(JSON.parse(text), targetRole, targetRoleMajorCategory, targetRoleSubcategory);
  } catch {
    return roleFitFallback('JSON_PARSE_FAILED', targetRole, targetRoleMajorCategory, targetRoleSubcategory);
  }
}

function normalizeRoleFit(raw, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  const arr = (v, limit = 10) => (Array.isArray(v) ? v.slice(0, limit) : []);
  const safeStr = (v) => String(v || '');
  const safeNum = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);

  const matches = arr(raw?.careerFitMatches).map((m) => {
    const durationMonths = safeNum(m?.durationMonths);
    const effectiveMonths = Math.min(safeNum(m?.effectiveMonths), durationMonths);
    return {
      careerEntryId: safeStr(m?.careerEntryId),
      careerLabel: safeStr(m?.careerLabel),
      durationMonths,
      effectiveMonths,
      fitType: RF_FIT_TYPES.has(m?.fitType) ? m.fitType : 'unknown',
      applicability: RF_APPLICABILITY.has(m?.applicability) ? m.applicability : 'unknown',
      matchedRequirementIds: arr(m?.matchedRequirementIds, 10).map(safeStr),
      matchedRequirementTexts: arr(m?.matchedRequirementTexts, 10).map(safeStr),
      evidenceUsed: arr(m?.evidenceUsed, 10).map(safeStr),
      gapTypes: arr(m?.gapTypes, 10).map(safeStr).filter((g) => RF_GAP_TYPES.has(g)),
      reason: safeStr(m?.reason),
      caution: safeStr(m?.caution),
    };
  });

  const totalCareerMonths = matches.reduce((s, m) => s + m.durationMonths, 0);
  const roleRelevantMonths = matches.reduce((s, m) => s + m.effectiveMonths, 0);
  const summaryRaw = raw?.effectiveCareerSummary || {};

  const riskHints = arr(raw?.riskHints, 8).map((r) => ({
    risk: safeStr(r?.risk),
    riskLevel: RF_RISK_LEVELS.has(r?.riskLevel) ? r.riskLevel : 'low',
    basis: RF_BASIS.has(r?.basis) ? r.basis : 'career_relevance',
  }));

  return {
    schemaVersion: 1,
    targetRole: {
      label: safeStr(raw?.targetRole?.label || targetRole),
      majorCategory: safeStr(raw?.targetRole?.majorCategory || targetRoleMajorCategory),
      subcategory: safeStr(raw?.targetRole?.subcategory || targetRoleSubcategory),
    },
    careerFitMatches: matches,
    effectiveCareerSummary: {
      totalCareerMonths: safeNum(summaryRaw.totalCareerMonths) || totalCareerMonths,
      roleRelevantMonths: safeNum(summaryRaw.roleRelevantMonths) || roleRelevantMonths,
      stronglyRelevantMonths: safeNum(summaryRaw.stronglyRelevantMonths),
      partiallyRelevantMonths: safeNum(summaryRaw.partiallyRelevantMonths),
      weakOrUnrelatedMonths: safeNum(summaryRaw.weakOrUnrelatedMonths),
    },
    riskHints,
    meta: { source: 'role-fit-career-matcher', version: 'p1-c', fallback: false },
  };
}

function roleFitFallback(errorCode, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  return {
    schemaVersion: 1,
    targetRole: {
      label: String(targetRole || ''),
      majorCategory: String(targetRoleMajorCategory || ''),
      subcategory: String(targetRoleSubcategory || ''),
    },
    careerFitMatches: [],
    effectiveCareerSummary: { totalCareerMonths: 0, roleRelevantMonths: 0, stronglyRelevantMonths: 0, partiallyRelevantMonths: 0, weakOrUnrelatedMonths: 0 },
    riskHints: [],
    meta: { source: 'role-fit-career-matcher', version: 'p1-c', fallback: true, error: String(errorCode || 'UNKNOWN') },
  };
}
