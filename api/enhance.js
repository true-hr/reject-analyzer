export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({
      ok: false,
      error: { code: "NO_API_KEY", message: "Missing GEMINI_API_KEY" }
    });
  }

  try {
    const { jd, resume } = req.body;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `JD:\n${jd}\n\nResume:\n${resume}` }] }
          ]
        })
      }
    );

    const data = await response.json();

    return res.status(200).json({
      ok: true,
      ai: data
    });

  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e.message
    });
  }
}