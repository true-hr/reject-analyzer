import { supabase } from "./supabaseClient.js";

const TABLE = "push_subscriptions";

export async function loadPushSubscription(endpoint) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("endpoint", endpoint)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertPushSubscription({ userId, endpoint, p256dh, auth, expirationTime, userAgent }) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        expiration_time: expirationTime ?? null,
        user_agent: userAgent ?? null,
        last_seen_at: now,
      },
      { onConflict: "endpoint" }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePushSubscription(endpoint) {
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}
