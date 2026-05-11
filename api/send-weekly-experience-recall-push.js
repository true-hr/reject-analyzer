import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const REMINDER_TYPE = "weekly_experience_recall";
const DELIVERY_CHANNEL = "web_push";
const DEFAULT_APP_URL = "https://true-hr.github.io/reject-analyzer/";

// ---------------------------------------------------------------------------
// Timezone / week helpers (pure functions, no external deps)
// ---------------------------------------------------------------------------

function toLocalDateString(utcDate, timezone) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, dateStyle: "short" }).format(utcDate);
}

function getLocalDayOfWeek(utcDate, timezone) {
  const local = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(utcDate);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(local);
}

function getLocalHHMM(utcDate, timezone) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: timezone, timeStyle: "short" }).format(utcDate).slice(0, 5);
}

function getMondayOfLocalWeek(localDateStr) {
  const d = new Date(localDateStr + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

function getSundayOfLocalWeek(mondayStr) {
  const d = new Date(mondayStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const secret = req.headers["x-reminder-cron-secret"];
  if (!secret || secret !== process.env.WEEKLY_PUSH_CRON_SECRET) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    WEB_PUSH_PUBLIC_KEY,
    WEB_PUSH_PRIVATE_KEY,
    WEB_PUSH_SUBJECT,
    PUBLIC_APP_URL,
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ ok: false, error: "Supabase env not configured" });
  }
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY || !WEB_PUSH_SUBJECT) {
    return res.status(500).json({ ok: false, error: "Web Push VAPID env not configured" });
  }

  webpush.setVapidDetails(WEB_PUSH_SUBJECT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const now = new Date();
  const appUrl = PUBLIC_APP_URL || DEFAULT_APP_URL;

  const payload = JSON.stringify({
    title: "이번 주 경험을 남겨둘 시간이에요",
    body: "이번 주에 한 일, 다음 연봉 협상 때 쓸 근거가 됩니다. 잊기 전에 1분만 남겨두세요.",
    url: appUrl,
  });

  // 1. Load all enabled reminder preferences
  const { data: prefs, error: prefErr } = await supabase
    .from("reminder_preferences")
    .select("user_id, preferred_day_of_week, preferred_time_local, timezone")
    .eq("reminder_type", REMINDER_TYPE)
    .eq("is_enabled", true);

  if (prefErr) {
    return res.status(500).json({ ok: false, error: prefErr.message });
  }

  const result = {
    ok: true,
    scanned: prefs?.length ?? 0,
    eligible: 0,
    sentUsers: 0,
    skippedAlreadySent: 0,
    skippedWithWeeklyRecord: 0,
    skippedNoSubscription: 0,
    failedUsers: 0,
  };

  for (const pref of prefs ?? []) {
    const { user_id, preferred_day_of_week, preferred_time_local, timezone } = pref;
    const tz = timezone || "Asia/Seoul";

    const localDay = getLocalDayOfWeek(now, tz);
    const localHHMM = getLocalHHMM(now, tz);
    const localDateStr = toLocalDateString(now, tz);
    const weekStart = getMondayOfLocalWeek(localDateStr);
    const weekEnd = getSundayOfLocalWeek(weekStart);

    // Day and time gate
    if (localDay !== preferred_day_of_week) continue;
    if (localHHMM < (preferred_time_local || "18:00").slice(0, 5)) continue;

    // Duplicate delivery guard
    const { data: existingDelivery } = await supabase
      .from("reminder_deliveries")
      .select("id")
      .eq("user_id", user_id)
      .eq("reminder_type", REMINDER_TYPE)
      .eq("delivery_channel", DELIVERY_CHANNEL)
      .eq("week_start_local", weekStart)
      .eq("status", "sent")
      .maybeSingle();

    if (existingDelivery) {
      result.skippedAlreadySent++;
      continue;
    }

    // Weekly record guard — skip if user already has a record this week
    const { data: weeklyRecords } = await supabase
      .from("work_records")
      .select("id")
      .eq("user_id", user_id)
      .eq("work_type", "weekly")
      .gte("record_date", weekStart)
      .lte("record_date", weekEnd)
      .limit(1);

    if (weeklyRecords && weeklyRecords.length > 0) {
      result.skippedWithWeeklyRecord++;
      continue;
    }

    // Load subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (!subscriptions || subscriptions.length === 0) {
      result.skippedNoSubscription++;
      continue;
    }

    result.eligible++;

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sentCount++;
      } catch (err) {
        const statusCode = err.statusCode ?? err.status ?? 0;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
        failedCount++;
      }
    }

    const deliveryStatus = sentCount > 0 ? "sent" : "failed";

    try {
      await supabase.from("reminder_deliveries").upsert(
        {
          user_id,
          reminder_type: REMINDER_TYPE,
          delivery_channel: DELIVERY_CHANNEL,
          week_start_local: weekStart,
          status: deliveryStatus,
          attempted_count: sentCount + failedCount,
          sent_count: sentCount,
          failed_count: failedCount,
          sent_at: sentCount > 0 ? now.toISOString() : null,
          result_json: { sentCount, failedCount },
        },
        { onConflict: "user_id,reminder_type,delivery_channel,week_start_local", ignoreDuplicates: true }
      );
    } catch (_) {
      // unique constraint collision means already delivered — safe to skip
    }

    if (deliveryStatus === "sent") result.sentUsers++;
    else result.failedUsers++;
  }

  return res.status(200).json(result);
}
