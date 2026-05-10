import { supabase } from "./supabaseClient.js";

const TABLE = "resume_profiles";
const DEFAULT_PROFILE_NAME = "기본 이력서";

function _safeString(value) {
  return String(value || "").trim();
}

function _safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function _safeEducation(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      school: _safeString(item?.school),
      major: _safeString(item?.major),
      startDate: _safeString(item?.startDate),
      endDate: _safeString(item?.endDate),
      description: _safeString(item?.description),
    }))
    .filter(
      (item) => item.school || item.major || item.startDate || item.endDate || item.description
    );
}

function _safeBullets(value) {
  if (!Array.isArray(value)) return [];
  return value.map((b) => String(b || "").trim()).filter(Boolean);
}

function _safeExperience(item) {
  return {
    company: _safeString(item?.company),
    role: _safeString(item?.role),
    startDate: _safeString(item?.startDate),
    endDate: _safeString(item?.endDate),
    description: _safeString(item?.description),
    bullets: _safeBullets(item?.bullets),
  };
}

function _safeExperiences(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(_safeExperience)
    .filter(
      (item) =>
        item.company || item.role || item.startDate || item.endDate || item.description || item.bullets.length
    );
}

function _safeSkills(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|\r/)
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

function _safeSummary(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n\r?\n|\r\r/)
      .map((para) => para.trim())
      .filter(Boolean);
  }
  return [];
}

export async function getLatestDefaultResumeProfile() {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("profile_name", DEFAULT_PROFILE_NAME)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function saveDefaultResumeProfile({ existingRecord, userId, profile, education }) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const normalizedProfile = {
    name: _safeString(profile?.name),
    phone: _safeString(profile?.phone),
    email: _safeString(profile?.email),
    location: _safeString(profile?.location),
    portfolioUrl: _safeString(profile?.portfolioUrl),
  };
  const normalizedEducation = _safeEducation(education);
  const existingRawPayload = _safeObject(existingRecord?.raw_payload);
  const nextRawPayload = {
    ...existingRawPayload,
    profile: normalizedProfile,
    education: normalizedEducation,
  };

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ raw_payload: nextRawPayload, updated_at: new Date().toISOString() })
      .eq("id", existingRecord.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, profile_name: DEFAULT_PROFILE_NAME, raw_payload: nextRawPayload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveDefaultResumeExperiences({ existingRecord, userId, experiences }) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const normalizedExperiences = _safeExperiences(experiences);
  const existingRawPayload = _safeObject(existingRecord?.raw_payload);
  const nextRawPayload = {
    ...existingRawPayload,
    experiences: normalizedExperiences,
  };

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ raw_payload: nextRawPayload, updated_at: new Date().toISOString() })
      .eq("id", existingRecord.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, profile_name: DEFAULT_PROFILE_NAME, raw_payload: nextRawPayload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveDefaultResumeSkills({ existingRecord, userId, skills }) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const normalizedSkills = _safeSkills(skills);
  const existingRawPayload = _safeObject(existingRecord?.raw_payload);
  const nextRawPayload = {
    ...existingRawPayload,
    skills: normalizedSkills,
  };

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ raw_payload: nextRawPayload, updated_at: new Date().toISOString() })
      .eq("id", existingRecord.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, profile_name: DEFAULT_PROFILE_NAME, raw_payload: nextRawPayload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveDefaultResumeSummary({ existingRecord, userId, summary }) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const normalizedSummary = _safeSummary(summary);
  const existingRawPayload = _safeObject(existingRecord?.raw_payload);
  const nextRawPayload = {
    ...existingRawPayload,
    summary: normalizedSummary,
  };

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ raw_payload: nextRawPayload, updated_at: new Date().toISOString() })
      .eq("id", existingRecord.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, profile_name: DEFAULT_PROFILE_NAME, raw_payload: nextRawPayload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
