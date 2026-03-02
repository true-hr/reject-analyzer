export default async function handler(req, res) {
  // ✅ CORS (먼저!)
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const allow = new Set([
      "http://localhost:5173",
      "https://true-hr.github.io",
    ]);

    const ao = allow.has(origin) ? origin : "https://true-hr.github.io";

    res.setHeader("Access-Control-Allow-Origin", ao);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  } catch {}

  // ✅ Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      ok: false,
      error: { code: "NO_API_KEY", message: "Missing GEMINI_API_KEY" },
    });
  }

  try {
    const { jd, resume } = req.body || {};
    const __jd = (jd ?? "").toString();
    const __resume = (resume ?? "").toString();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: `JD:\n${__jd}\n\nResume:\n${__resume}` }] },
          ],
          generationConfig: { temperature: 0.2 },
        }),
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(400).json({
        ok: false,
        error: { code: "MODEL_ERROR", message: data },
      });
    }

    return res.status(200).json({
      ok: true,
      ai: data,
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(e?.message || e) },
    });
  }
}