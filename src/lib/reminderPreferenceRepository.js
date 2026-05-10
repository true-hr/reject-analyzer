import { supabase } from "./supabaseClient.js";

const TABLE = "reminder_preferences";

export const WEEKLY_EXPERIENCE_RECALL_REMINDER_TYPE = "weekly_experience_recall";

export function getDefaultWeeklyExperienceRecallPreference() {
  return {
    reminder_type: WEEKLY_EXPERIENCE_RECALL_REMINDER_TYPE,
    is_enabled: false,
    preferred_day_of_week: 5,
    preferred_time_local: "18:00",
    timezone: (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) || "Asia/Seoul",
    channel: "email",
  };
}

function _normalizeIsEnabled(value) {
  return value === true;
}

function _normalizeDayOfWeek(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 6 ? n : 5;
}

function _normalizeTimeLocal(value) {
  const s = String(value || "").trim();
  return s || "18:00";
}

function _normalizeTimezone(value) {
  const s = String(value || "").trim();
  return s || "Asia/Seoul";
}

function _normalizeChannel(value) {
  return value === "email" ? "email" : "email";
}

export async function getReminderPreference(reminderType) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("reminder_type", reminderType)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function upsertReminderPreference({
  existingRecord,
  userId,
  reminderType,
  isEnabled,
  preferredDayOfWeek,
  preferredTimeLocal,
  timezone,
  channel,
}) {
  if (!supabase) throw new Error("Supabase client is not configured.");

  const payload = {
    reminder_type: reminderType ?? WEEKLY_EXPERIENCE_RECALL_REMINDER_TYPE,
    is_enabled: _normalizeIsEnabled(isEnabled),
    preferred_day_of_week: _normalizeDayOfWeek(preferredDayOfWeek),
    preferred_time_local: _normalizeTimeLocal(preferredTimeLocal),
    timezone: _normalizeTimezone(timezone),
    channel: _normalizeChannel(channel),
  };

  if (existingRecord?.id) {
    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", existingRecord.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, ...payload })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
