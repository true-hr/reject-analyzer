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

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { source: 'p1-analysis', ms: Date.now() - t0 },
    });
  }

  // Security gate: Bearer auth (logged-in) or anon IP rate limit (route-level: all actions share quota)
  const gate = await checkAiGate(req, "p1-analysis");
  if (!gate.allow) {
    return res.status(gate.status).json({
      ok: false,
      data: null,
      error: { code: gate.code, message: gate.message },
      meta: { source: "p1-analysis", ms: Date.now() - t0 },
    });
  }

  const body = req.body || {};
  const action = String(body.action || '').trim();

  if (action === 'career') return handleCareer(req, res, body, t0);
  if (action === 'jd') return handleJd(req, res, body, t0);
  if (action === 'rolefit') return handleRolefit(req, res, body, t0);
  if (action === 'newgrad-review') return handleNewgradAiReview(req, res, body, t0);
  if (action === 'newgrad-job-industry-bridge') return handleNewgradJobIndustryBridge(req, res, body, t0);
  if (action === 'career-fit-ai') return handleCareerFitAi(req, res, body, t0);

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

// ─── P1-D: career-fit-ai evidence map ────────────────────────────────────────

async function handleCareerFitAi(req, res, body, t0) {
  const requestId = body?.requestId || `cfa-${Date.now()}`;
  const baseMeta = { provider: "openai", model: "gpt-4o-mini", ms: 0, requestId };

  function jsonErr(status, code, message) {
    return res.status(status).json({ ok: false, data: null, error: { code, message }, meta: { ...baseMeta, ms: Date.now() - t0 } });
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
  } = body;

  if (!currentJobLabel || !targetJobLabel) {
    return jsonErr(400, "MISSING_JOB_LABELS", "currentJobLabel and targetJobLabel are required");
  }

  const prompt = _cfaBuildPrompt({
    currentJobLabel: String(currentJobLabel).trim(),
    targetJobLabel: String(targetJobLabel).trim(),
    currentIndustryLabel: String(currentIndustryLabel).trim(),
    targetIndustryLabel: String(targetIndustryLabel).trim(),
    reportContext,
  });

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) return jsonErr(503, "OPENAI_NOT_CONFIGURED", "OpenAI API key not configured");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openaiApiKey}` },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a career transition preparation assistant. You explain transition checkpoints using only selected job/industry labels and deterministic report context. Do not claim that you analyzed candidate-specific experience. Do not invent personal career history, companies, achievements, or metrics. Do not change scores. Do not predict hiring outcomes. Never write abstract advice such as '설명해야 합니다', '강조해야 합니다', or '증명해야 합니다' — instead provide concrete resume language, interview question examples, or rephrase examples. Respond only with valid Korean JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text().catch(() => "");
      console.error(`[${requestId}] OpenAI error ${openaiRes.status}:`, errBody.slice(0, 300));
      return jsonErr(502, "OPENAI_REQUEST_FAILED", "OpenAI API returned an error");
    }

    const openaiData = await openaiRes.json().catch(() => null);
    const aiContent = openaiData?.choices?.[0]?.message?.content;
    if (!aiContent) return jsonErr(502, "EMPTY_AI_RESPONSE", "AI returned empty response");

    let parsedData;
    try {
      parsedData = JSON.parse(aiContent);
    } catch {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try { parsedData = JSON.parse(jsonMatch[1]); } catch { parsedData = null; }
      }
    }

    if (!parsedData || typeof parsedData !== "object") return jsonErr(502, "AI_JSON_PARSE_FAILED", "AI response was not valid JSON");

    return res.status(200).json({ ok: true, empty: false, data: _cfaNormalize(parsedData), meta: { ...baseMeta, ms: Date.now() - t0 } });
  } catch (err) {
    console.error(`[${requestId}] career-fit-ai error:`, err?.message);
    return jsonErr(500, "INTERNAL_SERVER_ERROR", "An error occurred during analysis");
  }
}

function _cfaBuildPrompt({ currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel, reportContext }) {
  const contextBlock = _cfaContextBlock(reportContext);
  return `당신은 경력 전환 준비 코치입니다. ${currentJobLabel}(현재)에서 ${targetJobLabel}(목표)로 전환하려는 사람이 이력서와 면접에서 구체적으로 무엇을 준비해야 하는지, 구조화된 JSON으로 설명해 주세요.

## 핵심 지침
- 특정 후보자의 경험을 분석했다고 주장하지 마세요.
- 존재하지 않는 개인 경력, 회사명, 성과 수치를 만들지 마세요.
- 합격/불합격 가능성을 단정하지 마세요.
- 점수를 부여하거나 등급을 판단하지 마세요.
- 이 직무/산업 조합에 일반적으로 해당되는 준비 포인트를 설명하세요.
- 한국어로 작성하세요.

## 출력 품질 기준 (반드시 준수)
- "설명해야 합니다", "강조해야 합니다", "증명해야 합니다" 같은 추상적 당위 서술 금지
- "협업 능력", "커뮤니케이션" 같은 단어 나열 금지 — 이력서/면접에서 실제로 쓸 수 있는 구체적 표현으로 작성하세요
- resumeSignal에는 이력서에 실제로 쓸 수 있는 문구 예시를 포함하세요 (예: "~프로젝트에서 ~한 결과 ~를 달성")
- howToPrepare에는 면접 전 구체적으로 준비할 수 있는 행동을 쓰세요 (예: 포트폴리오 항목, 답변 키워드)
- interviewQuestions는 실제 면접에서 나올 법한 구체적 질문 문장으로 작성하세요
- rephraseExamples에는 현재 직무 용어를 목표 직무 언어로 바꾸는 실제 표현 예시를 쓰세요

## 전환 정보
- 현재 직무: ${currentJobLabel}
- 목표 직무: ${targetJobLabel}
- 현재 산업: ${currentIndustryLabel || "미입력"}
- 목표 산업: ${targetIndustryLabel || "미입력"}
${contextBlock}

## 출력 JSON 스키마 (이 스키마를 반드시 따르세요)
{
  "summary": "이 전환의 핵심 특성을 한 문장으로 (합격 예측 금지)",
  "transitionInterpretation": "이 직무/산업 조합의 전환이 채용 시장에서 어떻게 읽히는지 (2~3문장, 구체적 맥락 포함)",
  "bridgeableExperienceTypes": [
    {
      "label": "연결 가능한 경험 유형 제목",
      "whyItMatters": "목표 직무에서 이 경험이 중요한 이유 (구체적 맥락 포함)",
      "resumeSignal": "이력서에 실제로 쓸 수 있는 문구 예시 (예: '~기획에서 ~한 결과 ~를 개선')"
    }
  ],
  "missingProofPoints": [
    {
      "proofPoint": "목표 직무에서 면접관이 확인하려는 증거 포인트",
      "whyItMatters": "왜 이 직무/산업에서 특히 중요한지",
      "howToPrepare": "면접 전 구체적으로 준비할 수 있는 행동 (포트폴리오 항목, 답변 키워드 등)"
    }
  ],
  "industryJobContext": {
    "summary": "목표 산업에서 목표 직무가 어떻게 읽히는지 (일반적 맥락)",
    "stakeholders": ["목표 산업 기준 주요 이해관계자/협력사 유형 (구체적 명칭)"],
    "decisionCriteria": ["목표 직무 합류 시 실제로 적용되는 의사결정 기준"],
    "riskContext": ["이 전환 조합에서 실제로 발생하는 리스크 맥락"]
  },
  "resumeFocus": {
    "emphasize": ["이력서에서 강조해야 할 경험 유형 (구체적 항목명)"],
    "deemphasize": ["덜 강조해도 되는 항목 (구체적 이유 포함)"],
    "rewriteDirection": ["이력서 항목을 목표 직무 언어로 재작성하는 구체적 방향"]
  },
  "rephraseExamples": [
    {
      "original": "현재 직무에서 흔히 쓰는 표현",
      "reframed": "목표 직무 채용 언어로 바꾼 표현",
      "why": "왜 이 표현이 목표 직무 채용자에게 더 잘 읽히는지"
    }
  ],
  "interviewQuestions": ["이 전환에서 면접관이 물어볼 가능성 높은 구체적 질문 문장 (3~5개)"],
  "cautionNotes": ["이 전환 조합에서 이력서나 면접에서 피해야 할 구체적 표현이나 주장"]
}`;
}

function _cfaContextBlock(reportContext) {
  if (!reportContext || typeof reportContext !== "object") return "";
  const parts = [];

  const topRisks = Array.isArray(reportContext.topRisks) ? reportContext.topRisks.filter(Boolean) : [];
  if (topRisks.length > 0) {
    parts.push("\n## 결정론적 분석 결과 참고 (점수/등급 재판단 금지)");
    parts.push("아래는 구조 기반 엔진이 식별한 전환 리스크입니다. 점수를 재평가하지 마세요. 일반적 준비 포인트를 설명할 때 참고하세요.");
    topRisks.slice(0, 3).forEach((r) => { if (r.title) parts.push(`- [리스크] ${r.title}`); });
  }

  const axisScores = Array.isArray(reportContext.axisScores) ? reportContext.axisScores.filter(Boolean) : [];
  if (axisScores.length > 0) {
    parts.push("\n## 5축 구조 점수 (변경 금지, 참고만)");
    axisScores.slice(0, 5).forEach((a) => { if (a.label && a.band) parts.push(`- ${a.label}: ${a.band}`); });
  }

  const targetJobContext = reportContext.targetJobContext;
  if (targetJobContext && typeof targetJobContext === "object") {
    const lines = [];
    if (typeof targetJobContext.body === "string" && targetJobContext.body.trim()) {
      lines.push(`설명: ${targetJobContext.body.trim().slice(0, 200)}`);
    }
    if (Array.isArray(targetJobContext.bullets) && targetJobContext.bullets.length > 0) {
      targetJobContext.bullets.slice(0, 4).forEach((b) => { if (typeof b === "string" && b.trim()) lines.push(`- ${b.trim()}`); });
    }
    if (lines.length > 0) {
      parts.push("\n## 목표 직무 컨텍스트");
      parts.push(...lines);
    }
  }

  const industryContext = reportContext.industryContext;
  if (industryContext && typeof industryContext === "object") {
    const lines = [];
    if (typeof industryContext.summaryTemplate === "string" && industryContext.summaryTemplate.trim()) {
      lines.push(`요약: ${industryContext.summaryTemplate.trim().slice(0, 200)}`);
    }
    if (Array.isArray(industryContext.evaluationCriteria) && industryContext.evaluationCriteria.length > 0) {
      industryContext.evaluationCriteria.slice(0, 3).forEach((c) => { if (typeof c === "string" && c.trim()) lines.push(`- ${c.trim()}`); });
    }
    if (lines.length > 0) {
      parts.push("\n## 목표 산업 컨텍스트");
      parts.push(...lines);
    }
  }

  return parts.join("\n");
}

function _cfaSafeArr(v) {
  return Array.isArray(v) ? v.filter((x) => x && typeof x === "object") : [];
}

function _cfaSafeStrArr(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim()) : [];
}

function _cfaNormalize(raw) {
  return {
    summary: typeof raw.summary === "string" ? raw.summary.trim() : "",
    transitionInterpretation: typeof raw.transitionInterpretation === "string" ? raw.transitionInterpretation.trim() : "",
    bridgeableExperienceTypes: _cfaSafeArr(raw.bridgeableExperienceTypes).map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      whyItMatters: typeof item.whyItMatters === "string" ? item.whyItMatters.trim() : "",
      resumeSignal: typeof item.resumeSignal === "string" ? item.resumeSignal.trim() : "",
    })),
    missingProofPoints: _cfaSafeArr(raw.missingProofPoints).map((item) => ({
      proofPoint: typeof item.proofPoint === "string" ? item.proofPoint.trim() : "",
      whyItMatters: typeof item.whyItMatters === "string" ? item.whyItMatters.trim() : "",
      howToPrepare: typeof item.howToPrepare === "string" ? item.howToPrepare.trim() : "",
    })),
    industryJobContext: raw.industryJobContext && typeof raw.industryJobContext === "object"
      ? {
          summary: typeof raw.industryJobContext.summary === "string" ? raw.industryJobContext.summary.trim() : "",
          stakeholders: _cfaSafeStrArr(raw.industryJobContext.stakeholders),
          decisionCriteria: _cfaSafeStrArr(raw.industryJobContext.decisionCriteria),
          riskContext: _cfaSafeStrArr(raw.industryJobContext.riskContext),
        }
      : { summary: "", stakeholders: [], decisionCriteria: [], riskContext: [] },
    resumeFocus: raw.resumeFocus && typeof raw.resumeFocus === "object"
      ? {
          emphasize: _cfaSafeStrArr(raw.resumeFocus.emphasize),
          deemphasize: _cfaSafeStrArr(raw.resumeFocus.deemphasize),
          rewriteDirection: _cfaSafeStrArr(raw.resumeFocus.rewriteDirection),
        }
      : { emphasize: [], deemphasize: [], rewriteDirection: [] },
    rephraseExamples: _cfaSafeArr(raw.rephraseExamples).map((item) => ({
      original: typeof item.original === "string" ? item.original.trim() : "",
      reframed: typeof item.reframed === "string" ? item.reframed.trim() : "",
      why: typeof item.why === "string" ? item.why.trim() : "",
    })).filter((item) => item.original && item.reframed),
    interviewQuestions: _cfaSafeStrArr(raw.interviewQuestions),
    cautionNotes: _cfaSafeStrArr(raw.cautionNotes),
  };
}

// ─── P1-E: newgrad-report-ai-review ─────────────────────────────────────────

async function handleNewgradAiReview(req, res, body, t0) {
  const requestId = body?.requestId || `ngr-${Date.now()}`;
  const endpoint = "p1-analysis/newgrad-review";

  const payload = body?.payload || body;
  const gc = payload?.guardContext;

  const isInvalid =
    !payload ||
    typeof payload !== "object" ||
    payload.version !== "newgrad_report_ai_review_payload_v1" ||
    payload.status !== "ready" ||
    !payload.target ||
    typeof payload.target !== "object" ||
    (!payload.target.jobId && !payload.target.jobLabel) ||
    !payload.axisSummary ||
    typeof payload.axisSummary !== "object" ||
    payload.axisSummary?.jobStructure?.guard !== "major_to_job_only" ||
    !gc ||
    gc.noScoreChange !== true ||
    gc.noBandChange !== true ||
    gc.noExperienceGeneration !== true ||
    gc.noAdmissionConclusion !== true ||
    gc.axis1MajorToJobOnly !== true ||
    !payload.currentDraft ||
    typeof payload.currentDraft !== "object";

  if (isInvalid) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: "payload must be a valid newgrad_report_ai_review_payload_v1 with status=ready and all guardContext flags true",
      },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: null,
      error: { code: "NO_API_KEY", message: "OpenAI API key not configured" },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  const model = "gpt-4o-mini";
  const temperature = 0.2;
  const max_tokens = 2800;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: _buildNgrSystemPrompt() },
          { role: "user", content: _buildNgrUserPrompt(payload) },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      return res.status(502).json({
        ok: false,
        data: null,
        error: { code: "OPENAI_ERROR", message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const aiContent = openaiJson?.choices?.[0]?.message?.content ?? "";

    if (!aiContent) {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { code: "EMPTY_AI_RESPONSE", message: "AI returned empty response" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      const m = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (m) {
        try { parsed = JSON.parse(m[1]); } catch {
          return res.status(500).json({
            ok: false, data: null,
            error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
            meta: { endpoint, model, ms: Date.now() - t0, requestId },
          });
        }
      } else {
        return res.status(500).json({
          ok: false, data: null,
          error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
          meta: { endpoint, model, ms: Date.now() - t0, requestId },
        });
      }
    }

    const raw = parsed?.reviewResult ?? parsed;
    if (!raw || typeof raw !== "object") {
      return res.status(500).json({
        ok: false, data: null,
        error: { code: "AI_MISSING_REVIEW_RESULT", message: "AI response missing reviewResult" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    const reviewResult = _sanitizeNgrReview(raw);

    return res.status(200).json({
      ok: true,
      data: { reviewResult },
      error: null,
      meta: {
        endpoint,
        model,
        version: "newgrad_report_ai_review_v1",
        ms: Date.now() - t0,
        requestId,
      },
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({
        ok: false, data: null,
        error: { code: "OPENAI_TIMEOUT", message: "OpenAI request timed out after 55 seconds" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }
    console.error(`[${requestId}] newgrad-review error:`, err.message);
    return res.status(500).json({
      ok: false, data: null,
      error: { code: "INTERNAL_ERROR", message: String(err?.message || "Internal server error") },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }
}

function _buildNgrSystemPrompt() {
  return `당신은 한국 신입 취업 지원서 분석 리포트를 검토하는 AI 리뷰어입니다.

## 절대 규칙 (HARD CONSTRAINTS)

- 응답은 반드시 한국어로 작성한다.
- 응답은 반드시 유효한 JSON만 반환한다. 마크다운, 설명 텍스트 금지.
- 점수(score, displayScore)를 변경하거나 언급하지 않는다.
- 밴드(band)를 변경하거나 재판단하지 않는다.
- 이력서에 없는 경험을 생성하거나 추정하지 않는다.
- 합격/불합격 또는 채용 확률을 언급하지 않는다.

## 축별 해석 규칙

### Axis1 — jobStructure (guard: major_to_job_only)
- 전공과 목표 직무 핵심 과업의 연결만 설명한다.
- 프로젝트, 인턴십, 자격증, 강점, 업무 스타일을 Axis1 코멘트의 근거로 사용하지 않는다.

### Axis2 — industryContext (guard: industry_understanding)
- 산업 도메인 이해도 신호만 평가한다.

### Axis3 — responsibilityScope (guard: experience_depth)
- 실행 깊이와 책임 수준 신호만 평가한다.

### Axis4 — customerType (guard: stakeholder_interaction)
- 이해관계자 소통 및 고객 유형 인식만 평가한다.

### Axis5 — roleCharacter (guard: self_report_strengths)
- 자기보고 강점과 업무 스타일만 평가하며, 보수적으로 해석한다.

## 사용자 입력 해석 원칙

사용자가 UI에서 입력한 프로젝트, 인턴십, 자격증, 강점, 업무스타일은 무시하지 않는다. 다만 입력값별 사용 축을 엄격히 분리한다.

- 전공명, 전공 과목, 학습 기반은 Axis1 jobStructure에서 전공-직무 연결을 설명하는 데 사용할 수 있다.
- 프로젝트, 인턴십, 성과, 툴, 산출물은 Axis3 responsibilityScope 또는 preparationHints에서 사용한다.
- 목표 산업과 직접 연결되는 프로젝트/인턴십 키워드는 Axis2 industryContext 보완에 사용할 수 있다.
- 단, 산업 관련 프로젝트/인턴십 키워드도 Axis1 jobStructure의 전공-직무 연결을 보완하거나 재평가하는 근거로 사용하면 안 된다.
- 자격증은 직무 준비 신호 또는 preparationHints에서만 사용하고, Axis1 보완 근거로 사용하지 않는다.
- 강점과 업무스타일은 Axis5 roleCharacter 또는 preparationHints에서만 보수적으로 사용한다.
- overallRead에서 여러 입력값을 종합적으로 언급할 수는 있지만, 축별 판단 기준을 섞지 않는다.

## overallRead 작성 규칙

overallRead는 종합 요약이지만 Axis1 guard가 그대로 적용된다.

- 전공-직무 연결 강약을 서술할 때 프로젝트, 인턴십, 자격증, 강점, 산업 경험으로 보완하거나 재평가하지 않는다.
- "전공은 약하지만 인턴 경험이 좋아서", "전공 연관도는 낮지만 프로젝트로 보완된다" 같은 교차 축 보정 표현은 절대 금지한다.
- 전공에 대한 판단은 전공명/전공 과목/학습 기반과 목표 직무 핵심 과업의 직접 연결만 근거로 한다.
- 프로젝트, 인턴, 성과, 툴, 산출물을 overallRead에서 언급해야 한다면 전공-직무 연결 보완 근거가 아니라 Axis3 responsibilityScope, Axis2 industryContext, Axis5 roleCharacter 또는 preparationHints 관점으로 분리해 다룬다.

## 출력 스키마

정확히 아래 구조의 JSON을 반환한다:

{
  "reviewResult": {
    "overallRead": "",
    "axisComments": {
      "jobStructure": { "comment": "" },
      "industryContext": { "comment": "" },
      "responsibilityScope": { "comment": "" },
      "customerType": { "comment": "" },
      "roleCharacter": { "comment": "" }
    },
    "jobIndustryContextFixes": [
      { "sectionKey": "", "problem": "", "suggestedRewrite": "" }
    ],
    "preparationHints": [
      { "area": "", "hint": "" }
    ],
    "guardsApplied": [
      "no_score_change",
      "no_band_change",
      "no_experience_generation",
      "axis1_major_to_job_only"
    ]
  }
}`;
}

function _buildNgrUserPrompt(payload) {
  return `아래 신입 지원서 분석 페이로드를 검토하고 리뷰 결과를 반환하세요.

PAYLOAD:
${JSON.stringify(payload)}

지시사항:
1. overallRead: 리크루터 관점에서 이 지원자를 어떻게 읽는지 종합 요약 (400자 이내)
   - 전공-직무 연결을 서술할 때 프로젝트/인턴/자격증/강점으로 보완하거나 재평가하지 말 것
   - "전공은 약하지만 경험이 좋아서…" 식 교차 축 보정 표현 금지
2. axisComments: 각 축별 코멘트 — 각 축의 guard 규칙을 엄격히 따를 것
   - jobStructure: 전공과 직무 연결만, 프로젝트/인턴/자격증/강점/업무스타일 근거 절대 금지
   - industryContext: 목표 산업과 직접 연결되는 프로젝트/인턴/자격증 키워드는 산업 맥락 보완 관점에서만 활용 가능
   - responsibilityScope: 프로젝트/인턴/성과/툴/산출물 입력을 경험 연결성 관점에서 활용
   - roleCharacter: 강점/업무스타일 입력을 보수적으로 활용
3. jobIndustryContextFixes: Axis2(industryContext) 및 직무×산업 맥락 언어 보완만 대상 (최대 5개)
   - Axis1(jobStructure) 전공-직무 연결 문구를 프로젝트/인턴/자격증/강점으로 보완하는 suggestedRewrite 금지
   - sectionKey가 jobStructure이거나 전공-직무 연결 문장인 경우, 경험 추가 제안 생성 금지
   - 경험/인턴/프로젝트를 다룰 필요가 있으면 preparationHints 또는 axisComments.responsibilityScope로 분리
4. preparationHints: 가장 약한 축과 guardContext를 바탕으로 실행 가능한 준비 힌트 최대 2개
5. guardsApplied: 적용한 guard 키 목록`;
}

function _ngrTrunc(val, max) {
  if (typeof val !== "string") return "";
  return val.length > max ? val.slice(0, max) + "…" : val;
}

const _NGR_AXIS_KEYS = ["jobStructure", "industryContext", "responsibilityScope", "customerType", "roleCharacter"];
const _NGR_DEFAULT_GUARDS = ["no_score_change", "no_band_change", "no_experience_generation", "axis1_major_to_job_only"];

async function handleNewgradJobIndustryBridge(req, res, body, t0) {
  const requestId = body?.requestId || `njib-${Date.now()}`;
  const endpoint = "p1-analysis/newgrad-job-industry-bridge";
  const payload = body?.payload || body;
  const guardContext = payload?.guardContext || {};

  const isInvalid =
    !payload ||
    typeof payload !== "object" ||
    payload.version !== "newgrad_job_industry_bridge_payload_v1" ||
    payload.status !== "ready" ||
    !payload.target ||
    typeof payload.target !== "object" ||
    (!payload.target.jobId && !payload.target.jobLabel) ||
    (!payload.target.industryId && !payload.target.industryLabel) ||
    !payload.axisTargets?.industryContext ||
    guardContext.noScoreChange !== true ||
    guardContext.noBandChange !== true ||
    guardContext.noExperienceGeneration !== true ||
    guardContext.noAdmissionConclusion !== true ||
    guardContext.axis1MajorToJobOnly !== true ||
    guardContext.noUiAutoApply !== true;

  if (isInvalid) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: {
        code: "INVALID_PAYLOAD",
        message: "payload must be ready newgrad_job_industry_bridge_payload_v1 with target, industryContext, and all guard flags true",
      },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: null,
      error: { code: "NO_API_KEY", message: "OpenAI API key not configured" },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }

  const model = "gpt-4o-mini";
  const temperature = 0.2;
  const max_tokens = 2800;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: _buildNjibSystemPrompt() },
          { role: "user", content: _buildNjibUserPrompt(payload) },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => "");
      return res.status(502).json({
        ok: false,
        data: null,
        error: { code: "OPENAI_ERROR", message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const aiContent = openaiJson?.choices?.[0]?.message?.content ?? "";
    let parsed = null;
    try {
      parsed = JSON.parse(aiContent);
    } catch {
      const match = aiContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try { parsed = JSON.parse(match[1]); } catch {}
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return res.status(500).json({
        ok: false,
        data: null,
        error: { code: "AI_JSON_PARSE_FAILED", message: "AI response was not valid JSON" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }

    return res.status(200).json({
      ok: true,
      data: { bridgeResult: _sanitizeNjibResult(parsed) },
      error: null,
      meta: { endpoint, model, version: "newgrad_job_industry_bridge_v1", ms: Date.now() - t0, requestId },
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({
        ok: false,
        data: null,
        error: { code: "OPENAI_TIMEOUT", message: "OpenAI request timed out after 55 seconds" },
        meta: { endpoint, model, ms: Date.now() - t0, requestId },
      });
    }
    console.error(`[${requestId}] newgrad-job-industry-bridge error:`, err.message);
    return res.status(500).json({
      ok: false,
      data: null,
      error: { code: "INTERNAL_ERROR", message: String(err?.message || "Internal server error") },
      meta: { endpoint, ms: Date.now() - t0, requestId },
    });
  }
}

function _buildNjibSystemPrompt() {
  return `You analyze Korean newgrad job x industry bridge context.
Return valid JSON only. Write all string values in Korean.
Do not mention or change scores, displayScore, bands, admission, pass/fail, hiring chance, or hiring probability.
Do not generate or assume experiences that are not present in the payload.
Do not adjust Axis1/jobStructure/major-to-job interpretation.
Every output must be about the target job x target industry intersection.
For missing experience, use evidence-safe phrasing such as "드러나지 않는다", "보완하면 좋다", or "설명할 수 있다".

## CRITICAL RULES

### 1. currentSignals: treat inputSummary as existing evidence
- inputSummary.projectRoleLabels, internshipRoleLabels, certificationLabels, strengthLabels contain experiences the candidate ALREADY has.
- Each item in those arrays IS a current signal. Interpret it in the context of the target job x target industry and list it in currentSignals.
- Do NOT list any item from inputSummary as a missingSignal.
- Do NOT write "경험이 드러나지 않는다" for any experience that appears in inputSummary.
- If an experience appears in inputSummary, it is a current signal. Do not list it as missing.

### 2. industryVariablesForJob: minimum 3, job x industry specific
- industryVariablesForJob MUST NOT be an empty array. Provide at least 3 entries.
- Each entry must be a variable specific to the intersection of the target job AND target industry.
- Do NOT list general competencies, general job skills, or industry-generic concepts.
- Correct examples:
  - 데이터분석 x 금융: 리스크 지표, 신용/거래 데이터, 규제·컴플라이언스, 상품/고객 세분화, 포트폴리오/수익성 지표
  - 콘텐츠마케팅 x 보험: 보험료율, 보장 구조, 손해율, 모집/판매 규제, 설계사/대리점 채널
  - 영업관리 x 제약: HCP 접점 규제, 처방/비처방 채널, 지역/계정 세분화, 제품 허가·적응증

### 3. roleInIndustry: explain function in value chain, not a job title
- roleInIndustry MUST NOT be a standalone job title such as "데이터 분석가" or "콘텐츠마케팅 담당자".
- Write 1-2 sentences explaining what function this job performs within this industry's value chain.
- Answer the question: 이 직무는 이 산업에서 고객/제품/규제/운영/수익 구조 중 무엇을 연결하는가?
- Example: "데이터 분석가는 금융 산업에서 신용·거래 데이터를 분석하여 리스크 지표와 포트폴리오 수익성을 측정하고, 상품 설계 및 고객 세분화 의사결정을 지원한다."

### 4. goodNextExperiences and whatIfSuggestions: do not re-recommend existing experiences
- goodNextExperiences and whatIfSuggestions MUST NOT recommend acquiring an experience that is already present in inputSummary.
- If an experience already exists in inputSummary, instead suggest how to deepen or reframe it using: 산업 변수 보강, 성과 측정 추가, 이해관계자 맥락 추가, 산업별 근거 재구성.
- Wrong: "제약 회사 인턴 경험을 쌓으세요" when pharma intern is already in inputSummary.
- Correct: "제약 영업 인턴 경험을 HCP 접점 규제, 제품 적응증, 계정 세분화 기준으로 재정리하세요."

### 5. whatIfSuggestions: provide 2-3 items
- whatIfSuggestions MUST contain 2 or 3 items. Do NOT return only 1 item.
- Each suggestion must cover one of: 기존 경험 재구성, 산업 변수 보강, 검증/성과 지표 추가.

### 6. qualityFlags.tooGeneric: based on analysis specificity, not user experience level
Do NOT mark tooGeneric=true because the user has little experience. tooGeneric reflects whether the bridge analysis itself is specific to the target job x target industry intersection.

Set tooGeneric=true only when:
- roleInIndustry is a generic job description or industry overview with no job x industry intersection
- industryVariablesForJob contains only general competencies or general job skills unrelated to this industry
- nextEvidencePrompt gives advice like "관련 경험을 쌓으세요" with no mention of industry-specific variables or job context

Set tooGeneric=false when ALL of the following hold:
- industryVariablesForJob has 3+ entries that name actual variables at the job x industry intersection
- roleInIndustry explains what function the job performs within this industry's value chain (not just the job title)
- nextEvidencePrompt references at least one industry-specific variable or work context from this role

Examples of tooGeneric=false:
- 데이터분석 x 금융: industryVariables ["거래 데이터 분석", "리스크 관리 지표", "금융 상품 성과 평가"] + roleInIndustry mentioning 신용·거래 데이터 → false
- 콘텐츠마케팅 x 보험: industryVariables ["보험료율", "보장 구조", "손해율"] + role explaining 고객 이해 콘텐츠 → false
- 영업관리 x 제약: industryVariables ["HCP 접점 규제", "제품 허가·적응증", "의약품 유통 경로"] + role explaining HCP 채널 운영 → false

Return this JSON shape:
{
  "bridge": {
    "roleInIndustry": "",
    "industryVariablesForJob": [],
    "currentSignals": [],
    "missingSignals": [],
    "goodNextExperiences": []
  },
  "axisRewrites": {
    "industryContext": {
      "backgroundGuidance": "",
      "workContextGuidance": "",
      "repeatabilityGuidance": "",
      "weakEvidenceGuidance": "",
      "nextEvidencePrompt": ""
    },
    "responsibilityScope": {
      "experienceTypeGuidance": "",
      "evidenceDepthGuidance": "",
      "missingExperienceGuidance": ""
    }
  },
  "whatIfSuggestions": [
    {
      "title": "",
      "body": "",
      "expectedAxisLift": []
    }
  ],
  "qualityFlags": {
    "usedJobIndustryContext": true,
    "avoidedScoreChange": true,
    "avoidedExperienceGeneration": true,
    "tooGeneric": false
  }
}`;
}

function _buildNjibUserPrompt(payload) {
  return `Analyze this newgrad job x industry bridge payload and return only JSON.

Target job: ${payload?.target?.jobLabel || payload?.target?.jobId || ""}
Target industry: ${payload?.target?.industryLabel || payload?.target?.industryId || ""}

PAYLOAD:
${JSON.stringify(payload)}

Create bridge, axisRewrites, whatIfSuggestions, and qualityFlags.
expectedAxisLift may only include industryContext, responsibilityScope, customerType, roleCharacter.
Set qualityFlags.tooGeneric=false if industryVariablesForJob has 3+ job x industry specific entries and roleInIndustry explains the function in this industry's value chain. Set tooGeneric=true only if the analysis lacks job x industry intersection specificity.`;
}

const _NJIB_ALLOWED_AXIS_LIFT = new Set(["industryContext", "responsibilityScope", "customerType", "roleCharacter"]);

function _njibTrunc(value, max) {
  if (typeof value !== "string") return "";
  return value.length > max ? `${value.slice(0, max).trimEnd()}...` : value;
}

function _njibStringArray(values, maxItems, maxLength) {
  return (Array.isArray(values) ? values : [])
    .slice(0, maxItems)
    .map((value) => _njibTrunc(String(value || ""), maxLength))
    .filter(Boolean);
}

function _sanitizeNjibResult(raw) {
  const bridge = raw?.bridge || {};
  const industryContext = raw?.axisRewrites?.industryContext || {};
  const responsibilityScope = raw?.axisRewrites?.responsibilityScope || {};
  const qualityFlags = raw?.qualityFlags || {};
  const sanitizedRoleInIndustry = _njibTrunc(typeof bridge.roleInIndustry === "string" ? bridge.roleInIndustry : "", 200);
  const sanitizedIndustryVariables = _njibStringArray(bridge.industryVariablesForJob, 5, 60);
  return {
    bridge: {
      roleInIndustry: sanitizedRoleInIndustry,
      industryVariablesForJob: sanitizedIndustryVariables,
      currentSignals: _njibStringArray(bridge.currentSignals, 5, 100),
      missingSignals: _njibStringArray(bridge.missingSignals, 5, 100),
      goodNextExperiences: _njibStringArray(bridge.goodNextExperiences, 3, 100),
    },
    axisRewrites: {
      industryContext: {
        backgroundGuidance: _njibTrunc(industryContext.backgroundGuidance, 220),
        workContextGuidance: _njibTrunc(industryContext.workContextGuidance, 220),
        repeatabilityGuidance: _njibTrunc(industryContext.repeatabilityGuidance, 220),
        weakEvidenceGuidance: _njibTrunc(industryContext.weakEvidenceGuidance, 220),
        nextEvidencePrompt: _njibTrunc(industryContext.nextEvidencePrompt, 180),
      },
      responsibilityScope: {
        experienceTypeGuidance: _njibTrunc(responsibilityScope.experienceTypeGuidance, 180),
        evidenceDepthGuidance: _njibTrunc(responsibilityScope.evidenceDepthGuidance, 180),
        missingExperienceGuidance: _njibTrunc(responsibilityScope.missingExperienceGuidance, 180),
      },
    },
    whatIfSuggestions: (Array.isArray(raw?.whatIfSuggestions) ? raw.whatIfSuggestions : []).slice(0, 3).map((item) => ({
      title: _njibTrunc(typeof item?.title === "string" ? item.title : "", 80),
      body: _njibTrunc(typeof item?.body === "string" ? item.body : "", 180),
      expectedAxisLift: (Array.isArray(item?.expectedAxisLift) ? item.expectedAxisLift : [])
        .filter((axisKey) => _NJIB_ALLOWED_AXIS_LIFT.has(axisKey)),
    })),
    qualityFlags: {
      usedJobIndustryContext: qualityFlags.usedJobIndustryContext === true,
      avoidedScoreChange: qualityFlags.avoidedScoreChange !== false,
      avoidedExperienceGeneration: qualityFlags.avoidedExperienceGeneration !== false,
      tooGeneric: qualityFlags.tooGeneric === false ? false : true,
      missingIndustryVariables: sanitizedIndustryVariables.length === 0,
      weakRoleInIndustry: sanitizedRoleInIndustry.length < 30,
    },
  };
}

function _sanitizeNgrReview(raw) {
  const overallRead = _ngrTrunc(typeof raw.overallRead === "string" ? raw.overallRead : "", 400);

  const rawAc = raw.axisComments;
  const axisComments = {};
  for (const key of _NGR_AXIS_KEYS) {
    const entry = rawAc && typeof rawAc === "object" ? rawAc[key] : null;
    axisComments[key] = {
      comment: _ngrTrunc(entry && typeof entry.comment === "string" ? entry.comment : "", 220),
    };
  }

  const rawFixes = Array.isArray(raw.jobIndustryContextFixes) ? raw.jobIndustryContextFixes : [];
  const jobIndustryContextFixes = rawFixes.slice(0, 5).map((item) => ({
    sectionKey: typeof item?.sectionKey === "string" ? item.sectionKey : "",
    problem: _ngrTrunc(typeof item?.problem === "string" ? item.problem : "", 180),
    suggestedRewrite: _ngrTrunc(typeof item?.suggestedRewrite === "string" ? item.suggestedRewrite : "", 220),
  }));

  const rawHints = Array.isArray(raw.preparationHints) ? raw.preparationHints : [];
  const preparationHints = rawHints.slice(0, 2).map((item) => ({
    area: typeof item?.area === "string" ? item.area : "",
    hint: _ngrTrunc(typeof item?.hint === "string" ? item.hint : "", 180),
  }));

  const rawGuards = raw.guardsApplied;
  const guardsApplied = Array.isArray(rawGuards) && rawGuards.length > 0
    ? rawGuards.slice(0, 10).filter((g) => typeof g === "string")
    : _NGR_DEFAULT_GUARDS;

  return { overallRead, axisComments, jobIndustryContextFixes, preparationHints, guardsApplied };
}
