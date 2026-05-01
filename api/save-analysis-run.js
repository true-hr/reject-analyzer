import { createClient } from "@supabase/supabase-js";

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __jsonObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function __jsonArray(value) {
  return Array.isArray(value) ? value : [];
}

function __numOrNull(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function __getBearerToken(req) {
  const raw =
    req?.headers?.authorization ??
    req?.headers?.Authorization ??
    "";
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parts = __s(value).split(/\s+/);
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== "bearer") return null;
  return __s(parts[1]) || null;
}

function __authRequired(res, message = "Authorization Bearer token required") {
  return res.status(401).json({
    ok: false,
    error: {
      code: "AUTH_REQUIRED",
      message,
    },
  });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = __getBearerToken(req);
    if (!accessToken) {
      return __authRequired(res);
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    const verifiedUser = authData?.user ?? null;
    const verifiedUserId = __s(verifiedUser?.id);
    if (authError || !verifiedUserId) {
      return __authRequired(res, "Invalid or expired Authorization token");
    }

    const { input, run } = req.body || {};
    const inputSafe = __jsonObject(input);
    const runSafe = __jsonObject(run);

    const inputRowData = {
      user_id: verifiedUserId,
      jd_text: __s(inputSafe?.jdText) || "",
      resume_text: __s(inputSafe?.resumeText) || "",
      company_name: __s(inputSafe?.companyName) || null,
      target_role: __s(inputSafe?.targetRole) || null,
      industry: __s(inputSafe?.industry) || null,
      stage: __s(inputSafe?.stage) || null,
      meta_json: __jsonObject(inputSafe?.metaJson),
    };

    const { data: inputRow, error: inputError } = await supabase
      .from("analysis_inputs")
      .insert(inputRowData)
      .select()
      .single();

    if (inputError) throw inputError;

    const { data: runRow, error: runError } = await supabase
      .from("analysis_runs")
      .insert({
        input_id: inputRow.id,
        user_id: verifiedUserId,
        engine_version: __s(runSafe?.engineVersion),
        status: __s(runSafe?.status) || "success",
        score: __numOrNull(runSafe?.score),
        candidate_type: __s(runSafe?.candidateType) || null,
        top_risks_json: __jsonArray(runSafe?.topRisks),
        result_json: __jsonObject(runSafe?.resultJson),
      })
      .select()
      .single();

    if (runError) throw runError;

    return res.status(200).json({
      ok: true,
      inputId: inputRow.id,
      runId: runRow.id,
    });
  } catch (err) {
    console.error("save-analysis-run error", err);
    return res.status(500).json({
      ok: false,
      error: String(err?.message || err || "save failed"),
    });
  }
}
