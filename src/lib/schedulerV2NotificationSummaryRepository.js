export const SCHEDULER_V2_NOTIFICATION_SUMMARY_RPC = "get_current_person_notification_summary";
export const SCHEDULER_V2_AUTH_IDENTITY_SYNC_RPC = "sync_current_person_auth_identities";
export const SCHEDULER_V2_PERSON_BOOTSTRAP_RPC = "ensure_current_person_auth_identity";

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

export async function syncCurrentPersonAuthIdentities(supabaseClient) {
  if (!supabaseClient || typeof supabaseClient.rpc !== "function") {
    throw new Error("Supabase client with rpc() is required.");
  }

  const { data, error } = await supabaseClient.rpc(SCHEDULER_V2_AUTH_IDENTITY_SYNC_RPC);

  if (error) {
    throw error;
  }

  return data || { providers: [] };
}

export async function ensureCurrentPersonAuthIdentity(supabaseClient) {
  if (!supabaseClient || typeof supabaseClient.rpc !== "function") {
    throw new Error("Supabase client with rpc() is required.");
  }

  const { data, error } = await supabaseClient.rpc(SCHEDULER_V2_PERSON_BOOTSTRAP_RPC);

  if (error) {
    throw error;
  }

  return data || { bootstrap_status: "unknown", providers: [] };
}

export async function fetchSchedulerV2NotificationSummaryWithBootstrap(supabaseClient) {
  const rows = await fetchSchedulerV2NotificationSummary(supabaseClient);

  if (rows.length > 0) {
    return rows;
  }

  await ensureCurrentPersonAuthIdentity(supabaseClient);
  return fetchSchedulerV2NotificationSummary(supabaseClient);
}
