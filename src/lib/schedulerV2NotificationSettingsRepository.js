export const SCHEDULER_V2_NOTIFICATION_SETTINGS_WRITE_RPC = "upsert_current_person_reminder_rule";

function normalizeChannels(channels) {
  if (!Array.isArray(channels) || channels.length === 0) {
    return [{ channel: "web_push", priority: 1, is_enabled: true }];
  }

  return channels
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      channel: String(item.channel || "web_push"),
      priority: Number.isFinite(Number(item.priority)) ? Number(item.priority) : index + 1,
      is_enabled: item.is_enabled !== false,
      fallback_to_channel: item.fallback_to_channel || null,
    }));
}

export function buildSchedulerV2ReminderRulePayload(reminderDraft = {}) {
  const day = Number(reminderDraft.preferred_day_of_week);
  const daysOfWeek = Number.isInteger(day) && day >= 0 && day <= 6 ? [day] : [];
  const timezone =
    reminderDraft.timezone ||
    (typeof Intl !== "undefined" && Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    "Asia/Seoul";

  return {
    p_reminder_kind: "experience_recall",
    p_cadence: "weekly",
    p_days_of_week: daysOfWeek,
    p_time_local: String(reminderDraft.preferred_time_local || "18:00").slice(0, 5),
    p_timezone: timezone,
    p_is_enabled: reminderDraft.is_enabled !== false,
    p_channels: normalizeChannels(reminderDraft.channels),
  };
}

export async function saveSchedulerV2ReminderRule(supabaseClient, payload) {
  if (!supabaseClient || typeof supabaseClient.rpc !== "function") {
    throw new Error("Supabase client with rpc() is required.");
  }

  const { data, error } = await supabaseClient.rpc(
    SCHEDULER_V2_NOTIFICATION_SETTINGS_WRITE_RPC,
    payload
  );

  if (error) {
    throw error;
  }

  return data;
}
