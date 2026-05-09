export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = req.body?.requestId || `jd-decomp-${Date.now()}`;

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { provider: 'openai', model: 'gpt-4o-mini', ms: Date.now() - t0, requestId },
    });
  }

  const {
    jdText,
    compactJdModel,
    parsedJD,
    model = 'gpt-4o-mini',
    temperature = 0.2,
    max_tokens = 2000,
  } = req.body;

  if (!jdText || typeof jdText !== 'string' || jdText.trim().length < 10) {
    return res.status(400).json({
      ok: false,
      data: null,
      error: { code: 'INVALID_JD_TEXT', message: 'jdText must be a non-empty string with at least 10 characters' },
      meta: { provider: 'openai', model, ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: null,
      error: { code: 'MISSING_API_KEY', message: 'OpenAI API key not configured' },
      meta: { provider: 'openai', model, ms: Date.now() - t0, requestId },
    });
  }

  const prompt = buildDecomposerPrompt({ jdText, compactJdModel, parsedJD });

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens,
        messages: [
          {
            role: 'system',
            content: 'You are an expert HR analyst and JD parser. Output only valid JSON matching the schema exactly. No markdown, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => 'Unknown error');
      return res.status(502).json({
        ok: false,
        data: null,
        error: { code: 'OPENAI_ERROR', message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { provider: 'openai', model, ms: Date.now() - t0, requestId },
      });
    }

    const completion = await openaiRes.json();
    const raw = completion.choices?.[0]?.message?.content || '';
    const parsed = safeParseDecomposition(raw);
    const normalized = normalizeDecomposition(parsed, jdText);

    return res.status(200).json({
      ok: true,
      data: normalized,
      error: null,
      meta: {
        provider: 'openai',
        model,
        ms: Date.now() - t0,
        requestId,
        usage: completion.usage || null,
        fallback: normalized.meta?.fallback || false,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      data: buildFallback(),
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Unexpected error' },
      meta: { provider: 'openai', model, ms: Date.now() - t0, requestId, fallback: true },
    });
  }
}

function buildDecomposerPrompt({ jdText, compactJdModel, parsedJD }) {
  const jdModelSection = compactJdModel
    ? `\n\n## Pre-parsed JD Model (structured extraction already done)\n${JSON.stringify(compactJdModel, null, 2)}`
    : '';

  const parsedSection = parsedJD
    ? `\n\n## Additional Parsed JD Fields\n${JSON.stringify(parsedJD, null, 2)}`
    : '';

  return `You are analyzing a Korean or English job description (JD). Decompose every stated and implied requirement into a structured list.

## Job Description (raw text)
${jdText.slice(0, 3000)}${jdModelSection}${parsedSection}

## Output Schema
Return a single JSON object with this exact shape:

{
  "schemaVersion": 1,
  "jdRequirements": [
    {
      "id": "req_001",
      "sourceText": "<exact phrase from JD>",
      "requirementType": "<one of: must|preferred|core_task|hidden_criterion|tool|domain|seniority|scope>",
      "normalizedMeaning": "<plain language explanation of what this requirement means>",
      "importance": "<one of: critical|important|supporting>",
      "expectedEvidence": "<what a candidate must show to satisfy this requirement>",
      "evaluationSignal": "<one of: experience|skill|tool|domain|seniority|ownership|achievement|collaboration|communication|unknown>"
    }
  ],
  "jdProfile": {
    "jobTitle": "<extracted job title or null>",
    "targetRole": "<inferred role family, e.g. 'Product Manager'>",
    "targetSeniority": "<one of: intern|junior|mid|senior|lead|manager|unknown>",
    "roleScope": "<one of: individual|team|cross_functional|organization|unknown>",
    "domainExpectations": ["<industry or domain>"],
    "toolsAndSkills": ["<tool or skill name>"],
    "certificatesOrLicenses": ["<cert or license, empty array if none>"],
    "hiddenEvaluationCriteria": ["<implicit criterion the JD implies but does not state>"]
  },
  "requirementSummary": {
    "criticalRequirements": ["<short label of each critical requirement>"],
    "importantRequirements": ["<short label of each important requirement>"],
    "supportingRequirements": ["<short label of each supporting requirement>"],
    "likelyScreeningFocus": ["<what recruiters will screen hardest on>"],
    "ambiguityNotes": ["<any unclear or contradictory JD statements>"]
  },
  "meta": {
    "source": "jd-requirement-decomposer",
    "version": "p1-b",
    "fallback": false
  }
}

Rules:
- jdRequirements: include all explicit requirements AND infer hidden criteria (culture fit, ownership mindset, etc.)
- requirementType: classify each requirement accurately; use "hidden_criterion" for implicit expectations
- importance: critical = eliminatory, important = strongly preferred, supporting = nice-to-have
- evaluationSignal: choose the primary signal a recruiter uses to assess this requirement
- targetSeniority: infer from years-of-experience mentions, responsibility level, and language cues
- If JD is in Korean, still output all values in Korean where appropriate (sourceText, normalizedMeaning, expectedEvidence)
- Return ONLY the JSON object. No markdown fences, no explanation.`;
}

function safeParseDecomposition(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { }
    }
    return null;
  }
}

const VALID_REQ_TYPES = new Set(['must', 'preferred', 'core_task', 'hidden_criterion', 'tool', 'domain', 'seniority', 'scope']);
const VALID_IMPORTANCE = new Set(['critical', 'important', 'supporting']);
const VALID_SENIORITY = new Set(['intern', 'junior', 'mid', 'senior', 'lead', 'manager', 'unknown']);
const VALID_SCOPE = new Set(['individual', 'team', 'cross_functional', 'organization', 'unknown']);
const VALID_EVAL_SIGNAL = new Set(['experience', 'skill', 'tool', 'domain', 'seniority', 'ownership', 'achievement', 'collaboration', 'communication', 'unknown']);

function normalizeRequirement(req, idx) {
  return {
    id: typeof req?.id === 'string' && req.id ? req.id : `req_${String(idx + 1).padStart(3, '0')}`,
    sourceText: typeof req?.sourceText === 'string' ? req.sourceText : '',
    requirementType: VALID_REQ_TYPES.has(req?.requirementType) ? req.requirementType : 'must',
    normalizedMeaning: typeof req?.normalizedMeaning === 'string' ? req.normalizedMeaning : '',
    importance: VALID_IMPORTANCE.has(req?.importance) ? req.importance : 'supporting',
    expectedEvidence: typeof req?.expectedEvidence === 'string' ? req.expectedEvidence : '',
    evaluationSignal: VALID_EVAL_SIGNAL.has(req?.evaluationSignal) ? req.evaluationSignal : 'unknown',
  };
}

function normalizeDecomposition(parsed, jdText) {
  if (!parsed || typeof parsed !== 'object') return buildFallback();

  const requirements = Array.isArray(parsed.jdRequirements)
    ? parsed.jdRequirements.map((r, i) => normalizeRequirement(r, i))
    : [];

  const profile = parsed.jdProfile || {};
  const summary = parsed.requirementSummary || {};

  return {
    schemaVersion: 1,
    jdRequirements: requirements,
    jdProfile: {
      jobTitle: typeof profile.jobTitle === 'string' ? profile.jobTitle : null,
      targetRole: typeof profile.targetRole === 'string' ? profile.targetRole : null,
      targetSeniority: VALID_SENIORITY.has(profile.targetSeniority) ? profile.targetSeniority : 'unknown',
      roleScope: VALID_SCOPE.has(profile.roleScope) ? profile.roleScope : 'unknown',
      domainExpectations: Array.isArray(profile.domainExpectations) ? profile.domainExpectations.filter(s => typeof s === 'string') : [],
      toolsAndSkills: Array.isArray(profile.toolsAndSkills) ? profile.toolsAndSkills.filter(s => typeof s === 'string') : [],
      certificatesOrLicenses: Array.isArray(profile.certificatesOrLicenses) ? profile.certificatesOrLicenses.filter(s => typeof s === 'string') : [],
      hiddenEvaluationCriteria: Array.isArray(profile.hiddenEvaluationCriteria) ? profile.hiddenEvaluationCriteria.filter(s => typeof s === 'string') : [],
    },
    requirementSummary: {
      criticalRequirements: Array.isArray(summary.criticalRequirements) ? summary.criticalRequirements.filter(s => typeof s === 'string') : [],
      importantRequirements: Array.isArray(summary.importantRequirements) ? summary.importantRequirements.filter(s => typeof s === 'string') : [],
      supportingRequirements: Array.isArray(summary.supportingRequirements) ? summary.supportingRequirements.filter(s => typeof s === 'string') : [],
      likelyScreeningFocus: Array.isArray(summary.likelyScreeningFocus) ? summary.likelyScreeningFocus.filter(s => typeof s === 'string') : [],
      ambiguityNotes: Array.isArray(summary.ambiguityNotes) ? summary.ambiguityNotes.filter(s => typeof s === 'string') : [],
    },
    meta: {
      source: 'jd-requirement-decomposer',
      version: 'p1-b',
      fallback: false,
    },
  };
}

function buildFallback() {
  return {
    schemaVersion: 1,
    jdRequirements: [],
    jdProfile: {
      jobTitle: null,
      targetRole: null,
      targetSeniority: 'unknown',
      roleScope: 'unknown',
      domainExpectations: [],
      toolsAndSkills: [],
      certificatesOrLicenses: [],
      hiddenEvaluationCriteria: [],
    },
    requirementSummary: {
      criticalRequirements: [],
      importantRequirements: [],
      supportingRequirements: [],
      likelyScreeningFocus: [],
      ambiguityNotes: [],
    },
    meta: {
      source: 'jd-requirement-decomposer',
      version: 'p1-b',
      fallback: true,
    },
  };
}
