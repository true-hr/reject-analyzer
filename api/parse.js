export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const { task, kind, text } = req.body || {};

  if (
    task !== "SCHEMA_PARSE" ||
    !["jd", "resume"].includes(kind) ||
    !text?.trim()
  ) {
    return res.status(400).json({
      ok: false,
      error: { code: "BAD_REQUEST", message: "task/kind/text is required" },
    });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      ok: false,
      error: { code: "NO_API_KEY", message: "Missing GEMINI_API_KEY" },
    });
  }

  try {
    const prompt = `Extract structured JSON from this ${kind}:\n\n${text}`;

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(400).json({
        ok: false,
        error: { code: "MODEL_ERROR", message: data },
      });
    }

    const raw =
      data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";

    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s === -1 || e === -1) {
      return res.status(400).json({
        ok: false,
        error: { code: "INVALID_JSON" },
      });
    }

    const parsed = JSON.parse(raw.slice(s, e + 1));

    return res.status(200).json({
      ok: true,
      parsed,
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(err) },
    });
  }
}