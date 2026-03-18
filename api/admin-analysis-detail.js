import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://true-hr.github.io",
  "https://reject-analyzer.vercel.app",
];

function setCors(req, res) {
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "null";
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
    res.setHeader("Access-Control-Max-Age", "86400");
  } catch { }
}

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __getSupabaseAdmin() {
  const url = __s(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = __s(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function __isAuthorized(req) {
  const expected = __s(process.env.ADMIN_ANALYSIS_TOKEN);
  const received = __s(req?.headers?.["x-admin-token"]);
  if (!expected) return false;
  return received === expected;
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" } });
  }

  if (!__isAuthorized(req)) {
    return res.status(403).json({
      ok: false,
      error: { code: "FORBIDDEN", message: "Forbidden" },
    });
  }

  const supabase = __getSupabaseAdmin();
  if (!supabase) {
    return res.status(503).json({
      ok: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
    });
  }

  try {
    const runId = __s(req?.query?.runId);
    if (!runId) {
      return res.status(400).json({
        ok: false,
        error: { code: "BAD_REQUEST", message: "runId is required" },
      });
    }

    const { data, error } = await supabase
      .from("analysis_runs")
      .select(`
        *,
        analysis_inputs (*)
      `)
      .eq("id", runId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        ok: false,
        error: { code: "DETAIL_NOT_FOUND", message: String(error?.message || "detail_not_found") },
      });
    }

    const input = Array.isArray(data?.analysis_inputs) ? data.analysis_inputs[0] : data?.analysis_inputs;
    const run = { ...data };
    delete run.analysis_inputs;

    return res.status(200).json({
      ok: true,
      input: input || null,
      run,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(err?.message || err) },
    });
  }
}
