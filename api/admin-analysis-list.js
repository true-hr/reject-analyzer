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

function __jsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function __numOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function __topRisk1(topRisksJson) {
  const first = __jsonArray(topRisksJson)[0] || null;
  if (!first || typeof first !== "object") return "-";
  return __s(first.title) || __s(first.id) || "-";
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
    const q = __s(req?.query?.q);
    const candidateType = __s(req?.query?.candidateType);
    const rawLimit = Number(req?.query?.limit);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(50, rawLimit)) : 20;

    let query = supabase
      .from("analysis_runs")
      .select(`
        id,
        input_id,
        created_at,
        engine_version,
        score,
        candidate_type,
        top_risks_json,
        analysis_inputs (
          id,
          company_name,
          target_role,
          industry
        )
      `)
      .order("created_at", { ascending: false });

    if (candidateType) {
      query = query.eq("candidate_type", candidateType);
    }
    if (q) {
      query = query.or(`company_name.ilike.%${q}%,target_role.ilike.%${q}%`, {
        foreignTable: "analysis_inputs",
      });
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      return res.status(500).json({
        ok: false,
        error: { code: "LIST_FETCH_FAILED", message: String(error.message || "list_fetch_failed") },
      });
    }

    const items = (Array.isArray(data) ? data : []).map((row) => {
      const input = Array.isArray(row?.analysis_inputs) ? row.analysis_inputs[0] : row?.analysis_inputs;
      return {
        runId: __s(row?.id),
        inputId: __s(row?.input_id || input?.id),
        createdAt: __s(row?.created_at),
        companyName: __s(input?.company_name) || "-",
        targetRole: __s(input?.target_role) || "-",
        industry: __s(input?.industry) || "-",
        score: __numOrNull(row?.score),
        candidateType: __s(row?.candidate_type) || "-",
        topRisk1: __topRisk1(row?.top_risks_json),
        engineVersion: __s(row?.engine_version) || "-",
      };
    });

    return res.status(200).json({
      ok: true,
      items,
      candidateTypes: Array.from(new Set(items.map((item) => __s(item.candidateType)).filter(Boolean).filter((v) => v !== "-"))),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(err?.message || err) },
    });
  }
}
