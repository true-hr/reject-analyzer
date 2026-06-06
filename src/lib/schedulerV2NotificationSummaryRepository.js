export const SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC = "get_current_person_notification_summary";

export async function fetchSchedulerV2NotificationSummary(supabaseClient) {
  if (!supabaseClient || typeof supabaseClient.rpc !== "function") {
    throw new Error("Supabase client with rpc() is required.");
  }

  const { data, error } = await supabaseClient.rpc(SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC);

  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data : [];
}
