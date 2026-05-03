export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "API key not configured" });
  }

  const {
    endpoint,
    messages,
    prompt,
    model,
    temperature,
    max_tokens,
    requestId,
    t0,
  } = req.body;

  const resolvedModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
  let resolvedMessages = messages;

  if (!resolvedMessages && prompt) {
    resolvedMessages = [{ role: "user", content: prompt }];
  }

  if (!resolvedMessages) {
    return res.status(400).json({
      ok: false,
      error: "Either messages or prompt is required",
      requestId,
      ms: t0 ? Date.now() - t0 : 0,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: resolvedMessages,
        response_format: { type: "json_object" },
        temperature: temperature || 0.1,
        max_tokens: max_tokens || 2048,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error: data?.error?.message || "OpenAI API error",
        requestId,
        ms: t0 ? Date.now() - t0 : 0,
      });
    }

    return res.status(200).json({
      ok: true,
      data,
      requestId,
      ms: t0 ? Date.now() - t0 : 0,
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: error?.message || "Proxy request failed",
      requestId,
      ms: t0 ? Date.now() - t0 : 0,
    });
  }
}
