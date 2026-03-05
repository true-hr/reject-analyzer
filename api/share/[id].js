const SHARE_PREFIX = "passmap:share:";
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://true-hr.github.io",
  "https://reject-analyzer.vercel.app",
];

function setCors(req, res) {
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const ao = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "null";
    res.setHeader("Access-Control-Allow-Origin", ao);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
  } catch { }
}

function memStore() {
  if (!globalThis.__PASSMAP_SHARE_MEM__) {
    globalThis.__PASSMAP_SHARE_MEM__ = new Map();
  }
  return globalThis.__PASSMAP_SHARE_MEM__;
}

async function upstashGet(id) {
  const base = String(process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!base || !token) return { ok: false, reason: "NO_UPSTASH_CONFIG" };

  const key = `${SHARE_PREFIX}${id}`;
  const url = `${base}/get/${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) return { ok: false, reason: "UPSTASH_GET_FAIL", detail: data };
  const raw = data?.result;
  if (!raw) return { ok: false, reason: "NOT_FOUND" };
  try {
    return { ok: true, sharePack: JSON.parse(String(raw)) };
  } catch {
    return { ok: false, reason: "INVALID_PAYLOAD" };
  }
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production";
  // expects UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
  const hasUpstash = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  const debugBase = !isProd
    ? {
      isProd,
      hasUpstash,
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
    }
    : null;
  const withDebug = (payload, extraDebug) =>
    !isProd
      ? { ...payload, debug: { ...debugBase, ...(extraDebug || {}) } }
      : payload;
  if (req.method !== "GET") {
    return res.status(405).json(withDebug({ ok: false, error: "Method Not Allowed" }));
  }
  if (isProd && !hasUpstash) {
    return res.status(503).json(withDebug({
      ok: false,
      error: { code: "UPSTASH_NOT_CONFIGURED", message: "Share storage not configured" },
    }));
  }

  try {
    const idRaw = Array.isArray(req?.query?.id) ? req.query.id[0] : req?.query?.id;
    const id = String(idRaw || "").trim();
    if (!id) {
      return res.status(400).json(withDebug({ ok: false, error: { code: "BAD_REQUEST", message: "id is required" } }));
    }

    if (hasUpstash) {
      const up = await upstashGet(id);
      if (up.ok && up.sharePack) {
        return res.status(200).json(withDebug({
          ok: true,
          sharePack: up.sharePack,
        }, { storage: "upstash" }));
      }
      if (up?.reason === "NOT_FOUND") {
        return res.status(404).json(withDebug({ ok: false, error: { code: "NOT_FOUND", message: "share not found" } }));
      }
      return res.status(502).json(withDebug({
        ok: false,
        error: { code: "UPSTASH_GET_FAIL", message: "Share storage read failed" },
      }));
    }

    const map = memStore();
    const item = map.get(id);
    if (!item?.sharePack) {
      return res.status(404).json(withDebug({ ok: false, error: { code: "NOT_FOUND", message: "share not found" } }));
    }
    if (item?.expiresAt && item.expiresAt < Date.now()) {
      map.delete(id);
      return res.status(404).json(withDebug({ ok: false, error: { code: "EXPIRED", message: "share expired" } }));
    }
    return res.status(200).json(withDebug({
      ok: true,
      sharePack: item.sharePack,
      warning: "INMEMORY_FALLBACK_NOT_PERSISTENT",
    }, { storage: "memory" }));
  } catch (err) {
    return res.status(500).json(withDebug({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(err?.message || err) },
    }));
  }
}
