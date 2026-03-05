const SHARE_PREFIX = "passmap:share:";
const SHARE_TTL_SEC = 7 * 24 * 60 * 60;
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

function createId() {
  const part = Math.random().toString(36).slice(2, 8);
  const time = Date.now().toString(36).slice(-2);
  return (part + time).slice(0, 8);
}

function memStore() {
  if (!globalThis.__PASSMAP_SHARE_MEM__) {
    globalThis.__PASSMAP_SHARE_MEM__ = new Map();
  }
  return globalThis.__PASSMAP_SHARE_MEM__;
}

async function upstashSet(id, sharePack) {
  const base = String(process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  if (!base || !token) return { ok: false, reason: "NO_UPSTASH_CONFIG" };

  const key = `${SHARE_PREFIX}${id}`;
  const val = JSON.stringify(sharePack || {});
  const url = `${base}/set/${encodeURIComponent(key)}/${encodeURIComponent(val)}?EX=${SHARE_TTL_SEC}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    return { ok: false, reason: "UPSTASH_SET_FAIL", detail: data };
  }
  return { ok: true };
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const sharePack = req?.body?.sharePack;
    if (!sharePack || typeof sharePack !== "object") {
      return res.status(400).json({ ok: false, error: { code: "BAD_REQUEST", message: "sharePack is required" } });
    }

    const id = createId();
    const up = await upstashSet(id, sharePack);
    if (up.ok) {
      return res.status(200).json({ ok: true, id });
    }

    const map = memStore();
    map.set(id, { sharePack, expiresAt: Date.now() + SHARE_TTL_SEC * 1000 });
    return res.status(200).json({
      ok: true,
      id,
      warning: "INMEMORY_FALLBACK_NOT_PERSISTENT",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(err?.message || err) },
    });
  }
}
