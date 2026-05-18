import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const ANON_DAILY_LIMIT = 30;
const RATE_LIMIT_TTL_SEC = 86400;

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __getBearerToken(req) {
  const auth = __s(req?.headers?.authorization || req?.headers?.Authorization);
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return __s(match?.[1]) || "";
}

function __getSupabaseAuth() {
  const url = __s(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceKey = __s(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function __getClientIp(req) {
  const xff = __s(req?.headers?.["x-forwarded-for"]);
  if (xff) return xff.split(",")[0].trim();
  const xri = __s(req?.headers?.["x-real-ip"]);
  if (xri) return xri;
  return __s(req?.socket?.remoteAddress) || "unknown";
}

function __hashIp(ip) {
  return createHash("sha256").update(ip || "unknown").digest("hex").slice(0, 16);
}

function __upstashConfig() {
  const base = __s(process.env.UPSTASH_REDIS_REST_URL).replace(/\/$/, "");
  const token = __s(process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!base || !token) return null;
  return { base, token };
}

async function __upstashPost(cfg, ...args) {
  const path = args.map(encodeURIComponent).join("/");
  const resp = await fetch(`${cfg.base}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}` },
  });
  const data = await resp.json().catch(() => null);
  return data?.result ?? null;
}

async function __incrWithTtl(cfg, key) {
  const count = await __upstashPost(cfg, "incr", key);
  if (count === 1) {
    await __upstashPost(cfg, "expire", key, String(RATE_LIMIT_TTL_SEC));
  }
  return typeof count === "number" ? count : 1;
}

function __todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Security gate for AI endpoints.
 * - Bearer present + valid → allow (authenticated)
 * - Bearer present + invalid → 401
 * - No Bearer, Redis configured, under limit → allow (anonymous)
 * - No Bearer, Redis configured, over limit → 429
 * - No Bearer, Redis not configured → 503
 */
export async function checkAiGate(req, routeKey) {
  const token = __getBearerToken(req);

  if (token) {
    const supabase = __getSupabaseAuth();
    if (!supabase) {
      return { allow: false, status: 503, code: "SUPABASE_NOT_CONFIGURED", message: "Auth service not configured" };
    }
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user?.id) user = data.user;
    } catch {
      // fall through to 401
    }
    if (!user) {
      return { allow: false, status: 401, code: "INVALID_BEARER", message: "Invalid or expired token" };
    }
    return { allow: true, mode: "authenticated" };
  }

  // Anonymous path — requires Redis for rate limiting
  const cfg = __upstashConfig();
  if (!cfg) {
    return {
      allow: false,
      status: 503,
      code: "ANON_RATE_LIMIT_NOT_CONFIGURED",
      message: "비로그인 분석 체험을 일시적으로 사용할 수 없습니다. 로그인 후 이용해 주세요.",
    };
  }

  const ip = __getClientIp(req);
  const ipHash = __hashIp(ip);
  const key = `ai_rl:${routeKey}:${__todayUtc()}:${ipHash}`;

  let count;
  try {
    count = await __incrWithTtl(cfg, key);
  } catch {
    return {
      allow: false,
      status: 503,
      code: "ANON_RATE_LIMIT_UNAVAILABLE",
      message: "비로그인 분석 체험을 일시적으로 사용할 수 없습니다. 로그인 후 이용해 주세요.",
    };
  }

  if (count > ANON_DAILY_LIMIT) {
    return {
      allow: false,
      status: 429,
      code: "RATE_LIMITED",
      message: "비로그인 분석 체험 횟수를 초과했습니다. 로그인 후 다시 시도해 주세요.",
    };
  }

  return { allow: true, mode: "anonymous" };
}
