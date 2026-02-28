// src/lib/parse/parseWithAI.js
// P1: AI schema extraction (JD/Resume) with strict JSON output.
// - This module does NOT call a specific API by itself.
// - App.jsx should pass an async `callAi({ prompt, kind })` function.
// - Output is normalized + safe-fallback.

function _safeJsonParse(s) {
  const t = String(s || "").trim();
  if (!t) return null;

  // Try direct JSON
  try {
    return JSON.parse(t);
  } catch {}

  // Try extract first {...} block
  const m = t.match(/\{[\s\S]*\}$/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }

  return null;
}

function _arr(x) {
  return Array.isArray(x) ? x : [];
}

function _cleanList(list) {
  const seen = new Set();
  const out = [];
  _arr(list).forEach((v) => {
    const t = String(v || "").trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(t);
  });
  return out;
}

export function emptyParsed(kind) {
  if (kind === "jd") {
    return {
      jobTitle: null,
      mustHave: [],
      preferred: [],
      coreTasks: [],
      tools: [],
      constraints: [],
      domainKeywords: [],
    };
  }
  return {
    summary: null,
    timeline: [],
    skills: [],
    achievements: [],
    projects: [],
    gaps: [],
    transitionNarrative: [],
  };
}

function buildPrompt(kind, text) {
  const base = `
너는 HR 분석 시스템의 "정보 추출기"다.
아래 텍스트에서 필요한 정보만 뽑아서 "반드시 JSON 하나"로만 출력해라.
설명/문장/마크다운/코드블록 금지. JSON 외 문자는 절대 출력하지 마라.

규칙:
- 항목은 원문 기반으로 짧게 (한 줄 문장/키워드)
- 추측 금지. 없으면 빈 배열/ null
- 중복 제거
- 최대 길이 과다한 문장은 적당히 요약(핵심 키워드 유지)
`;

  if (kind === "jd") {
    return (
      base +
      `
스키마:
{
  "jobTitle": string|null,
  "mustHave": string[],
  "preferred": string[],
  "coreTasks": string[],
  "tools": string[],
  "constraints": string[],
  "domainKeywords": string[]
}

텍스트:
"""${text}"""
`.trim()
    );
  }

  return (
    base +
    `
스키마:
{
  "summary": string|null,
  "timeline": [{"company": string|null, "role": string|null, "start": string|null, "end": string|null, "bullets": string[]}],
  "skills": string[],
  "achievements": string[],
  "projects": string[],
  "gaps": string[],
  "transitionNarrative": string[]
}

텍스트:
"""${text}"""
`.trim()
  );
}

export async function parseWithAI({ kind, text, callAi }) {
  const k = kind === "jd" ? "jd" : "resume";
  const raw = String(text || "").trim();

  const meta = {
    ok: false,
    kind: k,
    warnings: [],
    rawJsonText: null,
  };

  if (!raw) {
    meta.warnings.push("입력 텍스트가 비어 있어요.");
    return { parsed: emptyParsed(k), meta };
  }

  if (typeof callAi !== "function") {
    meta.warnings.push("AI 호출 함수(callAi)가 연결되지 않았어요.");
    return { parsed: emptyParsed(k), meta };
  }

  const prompt = buildPrompt(k, raw.slice(0, 12000)); // safety cap

  let aiText = "";
  try {
    aiText = await callAi({ prompt, kind: k });
  } catch (e) {
    meta.warnings.push("AI 추출 요청이 실패했어요.");
    meta.error = String(e?.message || e);
    return { parsed: emptyParsed(k), meta };
  }

  meta.rawJsonText = aiText;

  const obj = _safeJsonParse(aiText);
  if (!obj || typeof obj !== "object") {
    meta.warnings.push("AI가 JSON으로 응답하지 않았어요. (정정 UI는 빈 값으로 표시)");
    return { parsed: emptyParsed(k), meta };
  }

  // Normalize
  let parsed;
  if (k === "jd") {
    parsed = {
      jobTitle: obj.jobTitle ? String(obj.jobTitle).trim() : null,
      mustHave: _cleanList(obj.mustHave),
      preferred: _cleanList(obj.preferred),
      coreTasks: _cleanList(obj.coreTasks),
      tools: _cleanList(obj.tools),
      constraints: _cleanList(obj.constraints),
      domainKeywords: _cleanList(obj.domainKeywords),
    };
  } else {
    parsed = {
      summary: obj.summary ? String(obj.summary).trim() : null,
      timeline: _arr(obj.timeline).slice(0, 12).map((t) => ({
        company: t?.company ? String(t.company).trim() : null,
        role: t?.role ? String(t.role).trim() : null,
        start: t?.start ? String(t.start).trim() : null,
        end: t?.end ? String(t.end).trim() : null,
        bullets: _cleanList(t?.bullets).slice(0, 8),
      })),
      skills: _cleanList(obj.skills),
      achievements: _cleanList(obj.achievements),
      projects: _cleanList(obj.projects),
      gaps: _cleanList(obj.gaps),
      transitionNarrative: _cleanList(obj.transitionNarrative),
    };
  }

  meta.ok = true;
  return { parsed, meta };
}