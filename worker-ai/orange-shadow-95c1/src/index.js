export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    const __path = url.pathname;

    if (__path !== "/api/enhance" && __path !== "/api/parse") {
      return new Response("Not Found", { status: 404, headers: corsHeaders() });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(),
      });
    }

    try {
      const body = await request.json();
      // ✅ NEW: schema-only parse endpoint (/api/parse)
      // - JSON-only
      // - validate 실패/JSON parse 실패 => ok:false
      // - /api/enhance 기존 호환 유지
      if (url.pathname === "/api/parse") {
        const t0 = Date.now();
        const requestId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());

        const task = (body?.task || "").toString();
        const kind = (body?.kind || "").toString(); // "jd" | "resume"
        const text = (body?.text || "").toString().slice(0, 12000);

        if (task !== "SCHEMA_PARSE" || (kind !== "jd" && kind !== "resume") || !text.trim()) {
          return json({
            ok: false,
            error: { code: "BAD_REQUEST", message: "task/kind/text is required" },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        const prompt = buildSchemaPrompt({ kind, text });

        const resp = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": env.GEMINI_API_KEY,
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1 },
            }),
          }
        );

        if (!resp.ok) {
          const errText = await resp.text();
          return json({
            ok: false,
            error: { code: "MODEL_ERROR", message: errText.slice(0, 300) },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        const data = await resp.json();
        const raw =
          data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

        const extracted = extractJsonObject(raw);
        if (!extracted) {
          return json({
            ok: false,
            error: { code: "INVALID_JSON", message: "No JSON object found in model output" },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        let parsed;
        try {
          parsed = JSON.parse(extracted);
        } catch (e) {
          return json({
            ok: false,
            error: { code: "INVALID_JSON", message: String(e).slice(0, 160) },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        const v = validateSchema(kind, parsed);
        if (!v.ok) {
          return json({
            ok: false,
            error: { code: "INVALID_SCHEMA", message: v.reason },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        return json({
          ok: true,
          parsed,
          meta: { requestId, ms: Date.now() - t0 },
        });
      }
      const jd = (body.jd || "").toString().slice(0, 12000);
      const resume = (body.resume || "").toString().slice(0, 12000);

      const prompt = `
너는 채용 JD와 이력서를 비교해 규칙 기반 분석기의 정확도를 보조하는 JSON만 출력해야 한다.
설명 금지. JSON 외 텍스트 절대 금지.

출력 형식:
{
  "jdMustHave": string[],
  "jdNiceToHave": string[],
  "resumeSkillTags": string[],
  "confidenceDeltaByHypothesis": {
    "fit-mismatch": number,
    "weak-proof": number,
    "unclear-positioning": number,
    "gap-risk": number,
    "knockout-missing": number
  }
}

제약:
- 모든 문자열은 소문자
- confidenceDeltaByHypothesis 값은 -0.15 ~ +0.15 범위

[JD]
${jd}

[RESUME]
${resume}
`.trim();

      const resp = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        return json({ ok: false, error: errText.slice(0, 300) });
      }

      const data = await resp.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");

      let parsed = {};
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        } catch {
          parsed = {};
        }
      }

      return json({ ok: true, ai: parsed });

    } catch (e) {
      return json({ ok: false, error: String(e).slice(0, 200) });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
// ------------------------------
// ✅ helpers for /api/parse
// ------------------------------
function extractJsonObject(text) {
  if (!text) return null;
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  return text.slice(s, e + 1);
}

function buildSchemaPrompt({ kind, text }) {
  // JSON-only 강제 (코드블록/설명 금지)
  if (kind === "jd") {
    return `
You MUST output JSON ONLY. No markdown, no explanations, no code fences.
Return a single JSON object with this exact shape:

{
  "jobTitle": string | null,
  "mustHave": string[],
  "preferred": string[],
  "coreTasks": string[],
  "tools": string[],
  "constraints": string[],
  "domainKeywords": string[]
}

Rules:
- Arrays must contain short noun phrases (2~8 words), not full sentences.
- No placeholder like "unknown", "N/A". If truly missing, use empty array or null.
- Do not include advice text.

[JD TEXT]
${text}
    `.trim();
  }

  // resume
  return `
You MUST output JSON ONLY. No markdown, no explanations, no code fences.
Return a single JSON object with this exact shape:

{
  "summary": string | null,
  "timeline": string[],
  "skills": string[],
  "achievements": string[],
  "projects": string[]
}

Rules:
- Arrays must contain short items (bullet-style), not long guidance sentences.
- No placeholder like "unknown", "N/A". If truly missing, use empty array or null.
- Do not include advice text.

[RESUME TEXT]
${text}
  `.trim();
}

function validateSchema(kind, obj) {
  const isArr = (v) => Array.isArray(v);
  const isStr = (v) => typeof v === "string";
  const cleanItem = (s) => (isStr(s) ? s.trim() : "");

  const hasBadPlaceholder = (s) => {
    const t = cleanItem(s).toLowerCase();
    return t === "unknown" || t === "n/a" || t === "na" || t === "none";
  };

  if (!obj || typeof obj !== "object") {
    return { ok: false, reason: "not an object" };
  }

  if (kind === "jd") {
    const mustHave = obj.mustHave;
    const preferred = obj.preferred;
    const coreTasks = obj.coreTasks;
    const tools = obj.tools;
    const constraints = obj.constraints;
    const domainKeywords = obj.domainKeywords;

    const buckets = [mustHave, preferred, coreTasks, tools, constraints, domainKeywords];

    // 최소 조건: 배열 형태 2개 이상 + 전체 항목 3개 이상
    const arrCount = buckets.filter(isArr).length;
    const itemCount = buckets
      .filter(isArr)
      .reduce((acc, a) => acc + a.filter((x) => cleanItem(x).length >= 2 && !hasBadPlaceholder(x)).length, 0);

    if (arrCount < 2 || itemCount < 3) {
      return { ok: false, reason: "too empty (need >=2 arrays and >=3 total items)" };
    }

    // 템플릿/가이드 문장 혼입 방지(완전 방어는 아니고 최소)
    const jt = obj.jobTitle;
    if (jt != null && isStr(jt)) {
      const t = jt.trim();
      if (t.length >= 40) return { ok: false, reason: "jobTitle looks like a sentence" };
      if (hasBadPlaceholder(t)) return { ok: false, reason: "jobTitle placeholder" };
    }

    return { ok: true };
  }

  // resume
  const timeline = obj.timeline;
  const skills = obj.skills;
  const achievements = obj.achievements;
  const projects = obj.projects;

  const buckets = [timeline, skills, achievements, projects];
  const arrCount = buckets.filter(isArr).length;
  const itemCount = buckets
    .filter(isArr)
    .reduce((acc, a) => acc + a.filter((x) => cleanItem(x).length >= 2 && !hasBadPlaceholder(x)).length, 0);

  if (arrCount < 2 || itemCount < 3) {
    return { ok: false, reason: "too empty (need >=2 arrays and >=3 total items)" };
  }

  return { ok: true };
}