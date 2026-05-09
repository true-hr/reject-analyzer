export default async function handler(req, res) {
  const t0 = Date.now();
  const requestId = req.body?.requestId || `role-fit-${Date.now()}`;

  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      data: null,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Only POST is supported' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  const {
    resumeCareerInterpretation = null,
    jdRequirementDecomposition = null,
    targetRole = null,
    targetRoleMajorCategory = null,
    targetRoleSubcategory = null,
    model = 'gpt-4o-mini',
    temperature = 0.2,
    max_tokens = 2500,
  } = req.body || {};

  if (!resumeCareerInterpretation || typeof resumeCareerInterpretation !== 'object') {
    return res.status(400).json({
      ok: false,
      data: buildFallback('MISSING_CAREER_INTERPRETATION', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'MISSING_CAREER_INTERPRETATION', message: 'resumeCareerInterpretation is required' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  if (!jdRequirementDecomposition || typeof jdRequirementDecomposition !== 'object') {
    return res.status(400).json({
      ok: false,
      data: buildFallback('MISSING_JD_DECOMPOSITION', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'MISSING_JD_DECOMPOSITION', message: 'jdRequirementDecomposition is required' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
    return res.status(400).json({
      ok: false,
      data: buildFallback('MISSING_TARGET_ROLE', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'MISSING_TARGET_ROLE', message: 'targetRole is required' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      data: buildFallback('NO_API_KEY', targetRole, targetRoleMajorCategory, targetRoleSubcategory),
      error: { code: 'NO_API_KEY', message: 'OpenAI API key not configured' },
      meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
    });
  }

  try {
    const prompt = buildRoleFitPrompt(resumeCareerInterpretation, jdRequirementDecomposition, targetRole, targetRoleMajorCategory, targetRoleSubcategory);

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
          {
            role: 'system',
            content: '당신은 채용 전문가로서 경력 적합성을 분석합니다. 반드시 유효한 JSON만 반환하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        data: buildFallback(`OPENAI_${openaiRes.status}`, targetRole, targetRoleMajorCategory, targetRoleSubcategory),
        error: { code: 'OPENAI_ERROR', message: `OpenAI returned ${openaiRes.status}: ${errText.slice(0, 200)}` },
        meta: { source: 'role-fit-career-matcher', ms: Date.now() - t0, requestId },
      });
    }

    const openaiJson = await openaiRes.json();
    const rawContent = openaiJson?.choices?.[0]?.message?.content ?? '';

    const parsed = safeParseRoleFitResponse(rawContent, targetRole, targetRoleMajorCategory, targetRoleSubcategory);

    return res.status(200).json({
      ok: true,
      data: parsed,
      error: null,
      meta: {
        source: 'role-fit-career-matcher',
        model: openaiJson?.model || model,
        ms: Date.now() - t0,
        requestId,
        usage: openaiJson?.usage ?? null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      data: buildFallback(String(err?.message || 'INTERNAL_ERROR'), targetRole, targetRoleMajorCategory, targetRoleSubcategory),
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
    ? resumeCareerInterpretation.careerEntries.slice(0, 8)
    : [];

  const compactEntries = entries.map((e) => ({
    id: e.id,
    company: e.company || '',
    roleTitle: e.roleTitle || '',
    employmentType: e.employmentType || 'unknown',
    durationMonths: e.durationMonths || 0,
    recency: e.recency || 'unknown',
    inferredRoleFamily: e.inferredRoleFamily || '',
    industryDomain: e.industryDomain || '',
    responsibilities: (e.responsibilities || []).slice(0, 5),
    achievements: (e.achievements || []).slice(0, 3).map((a) => ({
      text: a.text || '',
      hasMetric: a.hasMetric || false,
      metricText: a.metricText || '',
    })),
    evidenceStrength: e.evidenceStrength || 'weak',
  }));

  const requirements = Array.isArray(jdRequirementDecomposition?.jdRequirements)
    ? jdRequirementDecomposition.jdRequirements.slice(0, 10)
    : [];

  const compactRequirements = requirements.map((r) => ({
    id: r.id,
    requirementType: r.requirementType || 'unknown',
    importance: r.importance || 'supporting',
    category: r.category || 'other',
    text: r.text || '',
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

function safeParseRoleFitResponse(raw, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  let text = typeof raw === 'string' ? raw.trim() : '';
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(text);
    return normalizeRoleFitResponse(parsed, targetRole, targetRoleMajorCategory, targetRoleSubcategory);
  } catch {
    return buildFallback('JSON_PARSE_FAILED', targetRole, targetRoleMajorCategory, targetRoleSubcategory);
  }
}

const VALID_FIT_TYPES = new Set(['direct', 'similar', 'transferable', 'weak', 'none', 'unknown']);
const VALID_APPLICABILITY = new Set(['high', 'medium', 'low', 'none', 'unknown']);
const VALID_RISK_LEVELS = new Set(['high', 'medium', 'low']);
const VALID_GAP_TYPES = new Set([
  'missing_core_task', 'weak_achievement', 'wrong_language', 'insufficient_scope',
  'domain_gap', 'seniority_gap', 'employment_type_risk', 'recency_gap', 'evidence_ambiguous',
]);
const VALID_BASIS = new Set([
  'career_relevance', 'seniority', 'domain', 'achievement', 'scope',
  'language_gap', 'employment_type', 'recency',
]);

function normalizeRoleFitResponse(raw, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  const arr = (v, limit = 10) => (Array.isArray(v) ? v.slice(0, limit) : []);
  const safeStr = (v) => String(v || '');
  const safeNum = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0);

  const matches = arr(raw?.careerFitMatches).map((m) => {
    const durationMonths = safeNum(m?.durationMonths);
    const effectiveMonthsRaw = safeNum(m?.effectiveMonths);
    const effectiveMonths = Math.min(effectiveMonthsRaw, durationMonths);

    return {
      careerEntryId: safeStr(m?.careerEntryId),
      careerLabel: safeStr(m?.careerLabel),
      durationMonths,
      effectiveMonths,
      fitType: VALID_FIT_TYPES.has(m?.fitType) ? m.fitType : 'unknown',
      applicability: VALID_APPLICABILITY.has(m?.applicability) ? m.applicability : 'unknown',
      matchedRequirementIds: arr(m?.matchedRequirementIds, 10).map(safeStr),
      matchedRequirementTexts: arr(m?.matchedRequirementTexts, 10).map(safeStr),
      evidenceUsed: arr(m?.evidenceUsed, 10).map(safeStr),
      gapTypes: arr(m?.gapTypes, 10).map(safeStr).filter((g) => VALID_GAP_TYPES.has(g)),
      reason: safeStr(m?.reason),
      caution: safeStr(m?.caution),
    };
  });

  const totalCareerMonths = matches.reduce((s, m) => s + m.durationMonths, 0);
  const roleRelevantMonths = matches.reduce((s, m) => s + m.effectiveMonths, 0);

  const summaryRaw = raw?.effectiveCareerSummary || {};
  const effectiveCareerSummary = {
    totalCareerMonths: safeNum(summaryRaw.totalCareerMonths) || totalCareerMonths,
    roleRelevantMonths: safeNum(summaryRaw.roleRelevantMonths) || roleRelevantMonths,
    stronglyRelevantMonths: safeNum(summaryRaw.stronglyRelevantMonths),
    partiallyRelevantMonths: safeNum(summaryRaw.partiallyRelevantMonths),
    weakOrUnrelatedMonths: safeNum(summaryRaw.weakOrUnrelatedMonths),
  };

  const riskHints = arr(raw?.riskHints, 8).map((r) => ({
    risk: safeStr(r?.risk),
    riskLevel: VALID_RISK_LEVELS.has(r?.riskLevel) ? r.riskLevel : 'low',
    basis: VALID_BASIS.has(r?.basis) ? r.basis : 'career_relevance',
  }));

  return {
    schemaVersion: 1,
    targetRole: {
      label: safeStr(raw?.targetRole?.label || targetRole),
      majorCategory: safeStr(raw?.targetRole?.majorCategory || targetRoleMajorCategory),
      subcategory: safeStr(raw?.targetRole?.subcategory || targetRoleSubcategory),
    },
    careerFitMatches: matches,
    effectiveCareerSummary,
    riskHints,
    meta: {
      source: 'role-fit-career-matcher',
      version: 'p1-c',
      fallback: false,
    },
  };
}

function buildFallback(errorCode, targetRole, targetRoleMajorCategory, targetRoleSubcategory) {
  return {
    schemaVersion: 1,
    targetRole: {
      label: String(targetRole || ''),
      majorCategory: String(targetRoleMajorCategory || ''),
      subcategory: String(targetRoleSubcategory || ''),
    },
    careerFitMatches: [],
    effectiveCareerSummary: {
      totalCareerMonths: 0,
      roleRelevantMonths: 0,
      stronglyRelevantMonths: 0,
      partiallyRelevantMonths: 0,
      weakOrUnrelatedMonths: 0,
    },
    riskHints: [],
    meta: {
      source: 'role-fit-career-matcher',
      version: 'p1-c',
      fallback: true,
      error: String(errorCode || 'UNKNOWN'),
    },
  };
}
