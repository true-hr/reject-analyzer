import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.97.0";
import webpush from "npm:web-push@3.6.7";

const REMINDER_KIND = "experience_recall";
const DELIVERY_CHANNEL = "web_push";
const DEFAULT_APP_URL = "https://true-hr.github.io/reject-analyzer/";
const DEFAULT_TIMEZONE = "Asia/Seoul";
const LOOKBACK_WINDOW_MINUTES = 15;
const MAX_RULES_PER_RUN = 1000;

type ReminderRule = {
  id: string;
  user_id: string;
  cadence: "daily" | "weekdays" | "weekly" | "custom_days";
  days_of_week: number[] | null;
  time_local: string;
  timezone: string | null;
  label: string | null;
};

type SubscriptionRow = {
  id: string;
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
};

type DueSlot = {
  localDate: string;
  localDay: number;
  scheduledTime: string;
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function toLocalDateString(utcDate: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(utcDate);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) throw new Error("LOCAL_DATE_FORMAT_FAILED");
  return `${year}-${month}-${day}`;
}

function getLocalHHMM(utcDate: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(utcDate);
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  if (!hour || !minute) throw new Error("LOCAL_TIME_FORMAT_FAILED");
  return `${hour}:${minute}`;
}

function getDayOfLocalDate(localDate: string): number {
  return new Date(`${localDate}T00:00:00Z`).getUTCDay();
}

function getPreviousLocalDate(localDate: string): string {
  const d = new Date(`${localDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function normalizeTimezone(value: string | null): string {
  const candidate = String(value || "").trim() || DEFAULT_TIMEZONE;
  try {
    toLocalDateString(new Date(), candidate);
    return candidate;
  } catch {
    // Fallback is safer than skipping: an invalid timezone should not suppress
    // a user's reminder forever. The anomaly is recorded in result_json.
    return DEFAULT_TIMEZONE;
  }
}

function normalizeHHMM(value: string | null | undefined): string {
  const match = String(value || "").match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "18:00";
}

function hhmmToMinutes(value: string): number {
  const [hh, mm] = normalizeHHMM(value).split(":").map(Number);
  return hh * 60 + mm;
}

function isCadenceDue(rule: ReminderRule, localDay: number): boolean {
  if (rule.cadence === "daily") return true;
  if (rule.cadence === "weekdays") return localDay >= 1 && localDay <= 5;
  const days = Array.isArray(rule.days_of_week) ? rule.days_of_week : [];
  if (rule.cadence === "weekly") return days[0] === localDay;
  if (rule.cadence === "custom_days") return days.includes(localDay);
  return false;
}

function getDueSlot(rule: ReminderRule, now: Date, timezone: string): DueSlot | null {
  const scheduledTime = normalizeHHMM(rule.time_local);
  const scheduledMinutes = hhmmToMinutes(scheduledTime);
  const currentLocalDate = toLocalDateString(now, timezone);
  const currentMinutes = hhmmToMinutes(getLocalHHMM(now, timezone));
  const windowStartMinutes = currentMinutes - LOOKBACK_WINDOW_MINUTES;

  if (windowStartMinutes >= 0) {
    if (scheduledMinutes > windowStartMinutes && scheduledMinutes <= currentMinutes) {
      const localDay = getDayOfLocalDate(currentLocalDate);
      return isCadenceDue(rule, localDay)
        ? { localDate: currentLocalDate, localDay, scheduledTime }
        : null;
    }
    return null;
  }

  if (scheduledMinutes <= currentMinutes) {
    const localDay = getDayOfLocalDate(currentLocalDate);
    return isCadenceDue(rule, localDay)
      ? { localDate: currentLocalDate, localDay, scheduledTime }
      : null;
  }

  const previousDate = getPreviousLocalDate(currentLocalDate);
  const previousWindowStart = 24 * 60 + windowStartMinutes;
  if (scheduledMinutes > previousWindowStart) {
    const localDay = getDayOfLocalDate(previousDate);
    return isCadenceDue(rule, localDay)
      ? { localDate: previousDate, localDay, scheduledTime }
      : null;
  }

  return null;
}

function buildDeeplinkUrl(base: string, recordDate: string): string {
  const url = new URL(base);
  // v1 keeps the existing frontend-compatible push type. App.jsx and mobile
  // intake currently accept weekly_experience_recall/test_experience_recall.
  // Effective query: push=weekly_experience_recall&sourceMode=ai_conversation&recordDate=YYYY-MM-DD.
  url.searchParams.set("push", "weekly_experience_recall");
  url.searchParams.set("sourceMode", "ai_conversation");
  url.searchParams.set("recordDate", recordDate);
  return url.toString();
}

function buildPayload(appUrl: string, rule: ReminderRule, recordDate: string): string {
  const label = String(rule.label || "").trim();
  return JSON.stringify({
    title: "AI 업무기록을 정리해볼까요?",
    body: label
      ? `${label} 알림입니다. 지금 떠오르는 업무 내용을 PASSMAP에 남겨보세요.`
      : "지금 떠오르는 업무 내용을 PASSMAP에 남겨보세요.",
    url: buildDeeplinkUrl(appUrl, recordDate),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const expectedSecret = Deno.env.get("EXPERIENCE_RECALL_REMINDERS_CRON_SECRET")
    || Deno.env.get("WEEKLY_PUSH_CRON_SECRET");
  const secret = req.headers.get("x-reminder-cron-secret");
  if (!expectedSecret) {
    return json(500, { ok: false, error: "CRON_SECRET_NOT_CONFIGURED" });
  }
  if (!secret || secret !== expectedSecret) {
    return json(401, { ok: false, error: "UNAUTHORIZED" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const WEB_PUSH_PUBLIC_KEY = Deno.env.get("WEB_PUSH_PUBLIC_KEY");
  const WEB_PUSH_PRIVATE_KEY = Deno.env.get("WEB_PUSH_PRIVATE_KEY");
  const WEB_PUSH_SUBJECT = Deno.env.get("WEB_PUSH_SUBJECT");
  const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || DEFAULT_APP_URL;
  // Default-safe mode: a deployed/manual-invoked function should not write
  // delivery rows or send push unless live mode is explicitly enabled.
  // Live mode requires DB migration applied, old weekly cron off, and
  // EXPERIENCE_RECALL_REMINDERS_DRY_RUN=false.
  const dryRun = Deno.env.get("EXPERIENCE_RECALL_REMINDERS_DRY_RUN") !== "false";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { ok: false, error: "SUPABASE_ENV_NOT_CONFIGURED" });
  }
  if (!dryRun && (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY || !WEB_PUSH_SUBJECT)) {
    return json(500, { ok: false, error: "WEB_PUSH_ENV_NOT_CONFIGURED" });
  }

  if (!dryRun) {
    webpush.setVapidDetails(WEB_PUSH_SUBJECT!, WEB_PUSH_PUBLIC_KEY!, WEB_PUSH_PRIVATE_KEY!);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const now = new Date();

  const { data: rules, error: rulesError } = await supabase
    .from("reminder_rules")
    .select("id, user_id, cadence, days_of_week, time_local, timezone, label")
    .eq("reminder_kind", REMINDER_KIND)
    .eq("is_enabled", true)
    .is("deleted_at", null)
    .limit(MAX_RULES_PER_RUN);

  if (rulesError) {
    console.error("REMINDER_RULE_LOOKUP_FAILED", { code: rulesError.code });
    return json(500, { ok: false, error: "REMINDER_RULE_LOOKUP_FAILED" });
  }

  const result = {
    ok: true,
    dryRun,
    scanned: rules?.length ?? 0,
    due: 0,
    wouldSendDeliveries: 0,
    wouldSendSubscriptions: 0,
    claimed: 0,
    sentDeliveries: 0,
    partialFailedDeliveries: 0,
    failedDeliveries: 0,
    skippedAlreadyClaimed: 0,
    skippedNotDue: 0,
    skippedNoCompleteSubscription: 0,
  };

  for (const rule of (rules ?? []) as ReminderRule[]) {
    const timezone = normalizeTimezone(rule.timezone);
    const timezoneFallbackUsed = timezone !== String(rule.timezone || "").trim();
    const dueSlot = getDueSlot(rule, now, timezone);

    if (!dueSlot) {
      result.skippedNotDue++;
      continue;
    }

    result.due++;

    // v1 intentionally does not apply the old weekly work_records guard.
    // Multi-rule reminders are user-selected habit reminders; applying the
    // weekly guard to daily/weekdays/custom_days would create unpredictable
    // skips when users intentionally configure multiple reminders.
    if (dryRun) {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", rule.user_id);

      if (subscriptionsError) {
        console.error("DRY_RUN_SUBSCRIPTION_LOOKUP_FAILED", { rule_id: rule.id, code: subscriptionsError.code });
        return json(500, { ok: false, error: "DRY_RUN_SUBSCRIPTION_LOOKUP_FAILED" });
      }

      const completeSubscriptionCount = ((subscriptions ?? []) as SubscriptionRow[])
        .filter((sub) => !!sub.endpoint && !!sub.p256dh && !!sub.auth)
        .length;

      result.wouldSendDeliveries++;
      result.wouldSendSubscriptions += completeSubscriptionCount;
      if (completeSubscriptionCount === 0) result.skippedNoCompleteSubscription++;
      continue;
    }

    const { data: claimedRow, error: claimError } = await supabase
      .from("reminder_rule_deliveries")
      .insert({
        rule_id: rule.id,
        user_id: rule.user_id,
        reminder_kind: REMINDER_KIND,
        delivery_channel: DELIVERY_CHANNEL,
        scheduled_for_local_date: dueSlot.localDate,
        scheduled_for_local_time: dueSlot.scheduledTime,
        timezone,
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
        result.skippedAlreadyClaimed++;
        continue;
      }
      console.error("REMINDER_RULE_CLAIM_FAILED", { rule_id: rule.id, code: claimError.code });
      return json(500, { ok: false, error: "REMINDER_RULE_CLAIM_FAILED" });
    }

    result.claimed++;

    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", rule.user_id);

    if (subscriptionsError) {
      console.error("SUBSCRIPTION_LOOKUP_FAILED", { rule_id: rule.id, code: subscriptionsError.code });
      await supabase
        .from("reminder_rule_deliveries")
        .update({
          status: "failed",
          attempted_count: 0,
          sent_count: 0,
          failed_count: 0,
          result_json: {
            ruleId: rule.id,
            scheduledForLocalDate: dueSlot.localDate,
            scheduledForLocalTime: dueSlot.scheduledTime,
            timezone,
            reason: "SUBSCRIPTION_LOOKUP_FAILED",
            code: subscriptionsError.code,
          },
        })
        .eq("id", claimedRow.id);
      return json(500, { ok: false, error: "SUBSCRIPTION_LOOKUP_FAILED" });
    }

    const completeSubscriptions = ((subscriptions ?? []) as SubscriptionRow[])
      .filter((sub) => !!sub.endpoint && !!sub.p256dh && !!sub.auth);

    const subscriptionResults: Array<Record<string, unknown>> = [];
    const payload = buildPayload(PUBLIC_APP_URL, rule, dueSlot.localDate);
    let sentCount = 0;
    let failedCount = 0;

    if (completeSubscriptions.length === 0) {
      result.skippedNoCompleteSubscription++;
      failedCount = 0;
    }

    for (const sub of completeSubscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint!, keys: { p256dh: sub.p256dh!, auth: sub.auth! } },
          payload,
        );
        sentCount++;
        subscriptionResults.push({ id: sub.id, status: "sent" });
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number; status?: number }).statusCode
          ?? (err as { statusCode?: number; status?: number }).status
          ?? 0;
        const row: Record<string, unknown> = { id: sub.id, status: "failed", statusCode };
        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          row.action = "deleted";
          if (deleteError) {
            row.action = "delete_failed";
            row.deleteErrorCode = deleteError.code;
          }
        }
        failedCount++;
        subscriptionResults.push(row);
      }
    }

    const attemptedCount = sentCount + failedCount;
    const deliveryStatus = sentCount > 0
      ? failedCount > 0 ? "partial_failed" : "sent"
      : "failed";
    const resultJson = {
      ruleId: rule.id,
      scheduledForLocalDate: dueSlot.localDate,
      scheduledForLocalTime: dueSlot.scheduledTime,
      timezone,
      timezoneFallbackUsed,
      ruleLimit: MAX_RULES_PER_RUN,
      attempted: attemptedCount,
      sent: sentCount,
      failed: failedCount,
      ...(completeSubscriptions.length === 0 ? { reason: "NO_COMPLETE_SUBSCRIPTION" } : {}),
      subscriptions: subscriptionResults,
    };

    const { error: updateError } = await supabase
      .from("reminder_rule_deliveries")
      .update({
        status: deliveryStatus,
        attempted_count: attemptedCount,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: sentCount > 0 ? now.toISOString() : null,
        result_json: resultJson,
      })
      .eq("id", claimedRow.id);

    if (updateError) {
      console.error("REMINDER_RULE_DELIVERY_UPDATE_FAILED", {
        rule_id: rule.id,
        delivery_id: claimedRow.id,
        code: updateError.code,
      });
      return json(500, { ok: false, error: "REMINDER_RULE_DELIVERY_UPDATE_FAILED" });
    }

    if (deliveryStatus === "sent") result.sentDeliveries++;
    else if (deliveryStatus === "partial_failed") result.partialFailedDeliveries++;
    else result.failedDeliveries++;
  }

  return json(200, result);
});
