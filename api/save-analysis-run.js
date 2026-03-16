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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { input, run } = req.body || {};
    const inputSafe = __jsonObject(input);
    const runSafe = __jsonObject(run);

    const inputRowData = {
      user_id: __s(inputSafe?.userId) || null,
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
        user_id: __s(runSafe?.userId) || inputRowData.user_id,
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
