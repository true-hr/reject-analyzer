import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "12mb",
    },
  },
};

function _setCors(req, res) {
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
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
  } catch {}
}

function _normalizeBase64(input) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  const m = raw.match(/^data:[^;]+;base64,(.+)$/i);
  return (m ? m[1] : raw).replace(/\s+/g, "");
}

export default async function handler(req, res) {
  _setCors(req, res);
  console.log("[api/ocr.env]", {
    hasVisionKey: Boolean(process.env.GOOGLE_CLOUD_VISION_API_KEY),
  });

  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed", meta: { warnings: [] } });
  }

  const key = String(process.env.GOOGLE_CLOUD_VISION_API_KEY || "").trim();
  if (!key) {
    return res.status(500).json({
      ok: false,
      error: "OCR_REQUEST_FAILED",
      meta: { warnings: ["Missing GOOGLE_CLOUD_VISION_API_KEY"] },
    });
  }

  const imageBase64 = _normalizeBase64(req?.body?.imageData || req?.body?.imageBase64 || "");
  if (!imageBase64) {
    return res.status(400).json({
      ok: false,
      error: "OCR_REQUEST_FAILED",
      meta: { warnings: ["Missing imageData"] },
    });
  }

  const warnings = [];

  try {
    const mimeType = String(req?.body?.mime || req?.body?.mimeType || "").trim();
    console.log("[api/ocr.request]", {
      hasBase64: typeof imageBase64 === "string" && imageBase64.length > 0,
      imageLen: typeof imageBase64 === "string" ? imageBase64.length : 0,
      mimeType: mimeType || null,
    });
    const visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
            imageContext: { languageHints: ["ko", "en"] },
          },
        ],
      }),
    });
    console.log("[api/ocr.visionResponse]", {
      status: visionRes?.status,
      ok: visionRes?.ok,
    });

    const data = await visionRes.json().catch(() => null);
    if (!visionRes.ok) {
      const text = "";
      const ok = false;
      const error = "OCR_REQUEST_FAILED";
      console.log("[api/ocr.return]", {
        ok,
        textLen: typeof text === "string" ? text.length : 0,
        textPreview: typeof text === "string" ? text.slice(0, 120) : null,
        error: error || null,
      });
      return res.status(400).json({
        ok: false,
        error: "OCR_REQUEST_FAILED",
        meta: { warnings: [String(data?.error?.message || "google_ocr_http_error")] },
      });
    }

    const one = Array.isArray(data?.responses) ? data.responses[0] : null;
    if (one?.error?.message) {
      const text = "";
      const ok = false;
      const error = "OCR_REQUEST_FAILED";
      console.log("[api/ocr.return]", {
        ok,
        textLen: typeof text === "string" ? text.length : 0,
        textPreview: typeof text === "string" ? text.slice(0, 120) : null,
        error: error || null,
      });
      return res.status(400).json({
        ok: false,
        error: "OCR_REQUEST_FAILED",
        meta: { warnings: [String(one.error.message)] },
      });
    }

    const textFromFull = String(one?.fullTextAnnotation?.text || "");
    const textFromLite = String(one?.textAnnotations?.[0]?.description || "");
    const result = one;
    console.log("[api/ocr.raw]", {
      hasFullText: Boolean(result?.fullTextAnnotation?.text),
      fullTextLen: typeof result?.fullTextAnnotation?.text === "string"
        ? result.fullTextAnnotation.text.length
        : 0,
      firstTextLen: typeof result?.textAnnotations?.[0]?.description === "string"
        ? result.textAnnotations[0].description.length
        : 0,
    });
    const text = (textFromFull || textFromLite || "").trim();

    if (!text) {
      const ok = false;
      const error = "OCR_EMPTY_TEXT";
      console.log("[api/ocr.return]", {
        ok,
        textLen: typeof text === "string" ? text.length : 0,
        textPreview: typeof text === "string" ? text.slice(0, 120) : null,
        error: error || null,
      });
      return res.status(200).json({
        ok: false,
        error: "OCR_EMPTY_TEXT",
        meta: { warnings: warnings.concat("Google OCR returned empty text.") },
      });
    }

    if (!textFromFull && textFromLite) {
      warnings.push("Used fallback textAnnotations output.");
    }

    const ok = true;
    const error = null;
    console.log("[api/ocr.return]", {
      ok,
      textLen: typeof text === "string" ? text.length : 0,
      textPreview: typeof text === "string" ? text.slice(0, 120) : null,
      error: error || null,
    });
    return res.status(200).json({
      ok: true,
      text,
      source: "google-ocr",
      meta: { warnings },
    });
  } catch (e) {
    console.log("[api/ocr.catch]", {
      message: e?.message || String(e),
      name: e?.name || null,
    });
    const text = "";
    const ok = false;
    const error = "OCR_REQUEST_FAILED";
    console.log("[api/ocr.return]", {
      ok,
      textLen: typeof text === "string" ? text.length : 0,
      textPreview: typeof text === "string" ? text.slice(0, 120) : null,
      error: error || null,
    });
    return res.status(500).json({
      ok: false,
      error: "OCR_REQUEST_FAILED",
      meta: { warnings: [String(e?.message || e || "google_ocr_request_failed")] },
    });
  }
}
