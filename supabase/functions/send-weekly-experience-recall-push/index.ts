import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.97.0";
import webpush from "npm:web-push@3.6.7";

const REMINDER_TYPE = "weekly_experience_recall";
const DELIVERY_CHANNEL = "web_push";
const DEFAULT_APP_URL = "https://true-hr.github.io/reject-analyzer/";

// ---------------------------------------------------------------------------
// Timezone / week helpers
// ---------------------------------------------------------------------------

function toLocalDateString(utcDate: Date, timezone: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, dateStyle: "short" }).format(utcDate);
}

function getLocalDayOfWeek(utcDate: Date, timezone: string): number {
  const local = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(utcDate);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(local);
}

function getLocalHHMM(utcDate: Date, timezone: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, timeStyle: "short" }).format(utcDate).slice(0, 5);
}

function getMondayOfLocalWeek(localDateStr: string): string {
  const d = new Date(localDateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSundayOfLocalWeek(mondayStr: string): string {
  const d = new Date(mondayStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function _buildDeeplinkUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" });
  }

  const secret = req.headers.get("x-reminder-cron-secret");
  if (!secret || secret !== Deno.env.get("WEEKLY_PUSH_CRON_SECRET")) {
    return json(401, { ok: false, error: "Unauthorized" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const WEB_PUSH_PUBLIC_KEY = Deno.env.get("WEB_PUSH_PUBLIC_KEY");
  const WEB_PUSH_PRIVATE_KEY = Deno.env.get("WEB_PUSH_PRIVATE_KEY");
  const WEB_PUSH_SUBJECT = Deno.env.get("WEB_PUSH_SUBJECT");
  const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { ok: false, error: "Supabase env not configured" });
  }
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY || !WEB_PUSH_SUBJECT) {
    return json(500, { ok: false, error: "Web Push VAPID env not configured" });
  }

  webpush.setVapidDetails(WEB_PUSH_SUBJECT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const appUrl = PUBLIC_APP_URL || DEFAULT_APP_URL;

  // 1. Load all enabled reminder preferences
  const { data: prefs, error: prefErr } = await supabase
    .from("reminder_preferences")
    .select("user_id, preferred_day_of_week, preferred_time_local, timezone")
    .eq("reminder_type", REMINDER_TYPE)
    .eq("is_enabled", true);

  if (prefErr) {
    console.error("PREFERENCE_LOOKUP_FAILED", { code: prefErr.code });
    return json(500, { ok: false, error: "PREFERENCE_LOOKUP_FAILED" });
  }

  const result = {
    ok: true,
    scanned: prefs?.length ?? 0,
    eligible: 0,
    sentUsers: 0,
    skippedAlreadyClaimed: 0,
    skippedWithWeeklyRecord: 0,
    skippedNoSubscription: 0,
    failedUsers: 0,
  };

  for (const pref of prefs ?? []) {
    const { user_id, preferred_day_of_week, preferred_time_local, timezone } = pref;
    const tz: string = timezone || "Asia/Seoul";

    const localDay = getLocalDayOfWeek(now, tz);
    const localHHMM = getLocalHHMM(now, tz);
    const localDateStr = toLocalDateString(now, tz);
    const weekStart = getMondayOfLocalWeek(localDateStr);
    const weekEnd = getSundayOfLocalWeek(weekStart);

    const payload = JSON.stringify({
      title: "이번 주 AI 업무기록을 정리해볼까요?",
      body: "ChatGPT·Claude와 함께한 업무 내용을 패스맵에 남겨보세요.",
      url: _buildDeeplinkUrl(appUrl, {
        push: "weekly_experience_recall",
        sourceMode: "ai_conversation",
        recordDate: localDateStr,
      }),
    });

    // Day and time gate
    if (localDay !== preferred_day_of_week) continue;
    if (localHHMM < (preferred_time_local || "18:00").slice(0, 5)) continue;

    // Weekly record guard — skip if user already has a record this week
    const { data: weeklyRecords, error: weeklyRecordError } = await supabase
      .from("work_records")
      .select("id")
      .eq("user_id", user_id)
      .eq("work_type", "weekly")
      .gte("record_date", weekStart)
      .lte("record_date", weekEnd)
      .limit(1);

    if (weeklyRecordError) {
      console.error("WEEKLY_RECORD_LOOKUP_FAILED", { user_id, weekStart, code: weeklyRecordError.code });
      return json(500, { ok: false, error: "WEEKLY_RECORD_LOOKUP_FAILED" });
    }

    if (weeklyRecords && weeklyRecords.length > 0) {
      result.skippedWithWeeklyRecord++;
      continue;
    }

    // Load subscriptions
    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (subscriptionError) {
      console.error("SUBSCRIPTION_LOOKUP_FAILED", { user_id, code: subscriptionError.code });
      return json(500, { ok: false, error: "SUBSCRIPTION_LOOKUP_FAILED" });
    }

    if (!subscriptions || subscriptions.length === 0) {
      result.skippedNoSubscription++;
      continue;
    }

    // Claim slot atomically before sending.
    // Any concurrent invocation hitting the same unique key will conflict and skip.
    // A previously failed attempt also holds the slot — at-most-once per week.
    const { data: claimedRow, error: claimError } = await supabase
      .from("reminder_deliveries")
      .insert({
        user_id,
        reminder_type: REMINDER_TYPE,
        delivery_channel: DELIVERY_CHANNEL,
        week_start_local: weekStart,
        status: "processing",
        attempted_count: 0,
        sent_count: 0,
        failed_count: 0,
        sent_at: null,
        result_json: {},
      })
      .select("id")
      .single();

    if (claimError) {
      if (claimError.code === "23505") {
        // Unique conflict: slot already claimed or processed this week
        result.skippedAlreadyClaimed++;
        continue;
      }
      // Non-unique DB error — halt the run
      console.error("CLAIM_INSERT_FAILED", { user_id, weekStart, code: claimError.code });
      return json(500, { ok: false, error: "CLAIM_INSERT_FAILED" });
    }

    const claimedId = claimedRow.id;
    result.eligible++;

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        sentCount++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number; status?: number }).statusCode
          ?? (err as { statusCode?: number; status?: number }).status
          ?? 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        failedCount++;
      }
    }

    const deliveryStatus = sentCount > 0 ? "sent" : "failed";

    const { error: updateError } = await supabase
      .from("reminder_deliveries")
      .update({
        status: deliveryStatus,
        attempted_count: sentCount + failedCount,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: sentCount > 0 ? now.toISOString() : null,
        result_json: { sentCount, failedCount },
      })
      .eq("id", claimedId);

    if (updateError) {
      console.error("DELIVERY_UPDATE_FAILED", { user_id, claimedId, code: updateError.code });
      return json(500, { ok: false, error: "DELIVERY_UPDATE_FAILED" });
    }

    if (deliveryStatus === "sent") result.sentUsers++;
    else result.failedUsers++;
  }

  return json(200, result);
});
