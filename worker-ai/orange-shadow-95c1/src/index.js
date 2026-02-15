export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/api/enhance") {
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
