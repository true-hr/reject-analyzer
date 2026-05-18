import { supabase } from "./supabaseClient.js";

const TABLE = "user_career_settings";

const KNOWN_FIELDS = [
  "audienceType",
  "currentJobMajor",
  "currentJobSub",
  "currentIndustryMajor",
  "currentIndustrySub",
  "targetJobMajor",
  "targetJobSub",
  "targetIndustryMajor",
  "targetIndustrySub",
];

function _normalizeSettings(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out = {};
  for (const key of KNOWN_FIELDS) {
    out[key] = typeof raw[key] === "string" ? raw[key] : "";
  }
  return out;
}

export async function getCareerBaseline() {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function upsertCareerBaseline({ existingRecord, userId, settings }) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const normalizedSettings = _normalizeSettings(settings);

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ settings: normalizedSettings })
      .eq("id", existingRecord.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, settings: normalizedSettings })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
