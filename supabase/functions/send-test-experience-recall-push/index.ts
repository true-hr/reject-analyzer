import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.97.0";
import webpush from "npm:web-push@3.6.7";

const DEFAULT_APP_URL = "https://true-hr.github.io/reject-analyzer/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getBearerToken(req: Request): string {
  const value = req.headers.get("authorization") || "";
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function toSeoulDateString(utcDate: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
  }).format(utcDate);
}

function buildDeeplinkUrl(base: string, recordDate: string): string {
  const url = new URL(base);
  url.searchParams.set("push", "test_experience_recall");
  url.searchParams.set("sourceMode", "ai_conversation");
  url.searchParams.set("recordDate", recordDate);
  return url.toString();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const WEB_PUSH_PUBLIC_KEY = Deno.env.get("WEB_PUSH_PUBLIC_KEY");
  const WEB_PUSH_PRIVATE_KEY = Deno.env.get("WEB_PUSH_PRIVATE_KEY");
  const WEB_PUSH_SUBJECT = Deno.env.get("WEB_PUSH_SUBJECT");
  const PUBLIC_APP_URL = Deno.env.get("PUBLIC_APP_URL") || DEFAULT_APP_URL;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(500, { ok: false, error: "SUPABASE_ENV_NOT_CONFIGURED" });
  }
  if (!WEB_PUSH_PUBLIC_KEY || !WEB_PUSH_PRIVATE_KEY || !WEB_PUSH_SUBJECT) {
    return json(500, { ok: false, error: "WEB_PUSH_ENV_NOT_CONFIGURED" });
  }

  const token = getBearerToken(req);
  if (!token) {
    return json(401, { ok: false, error: "AUTH_REQUIRED" });
  }

  let endpoint = "";
  try {
    const body = await req.json();
    endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
  } catch {
    return json(400, { ok: false, error: "INVALID_JSON" });
  }

  if (!endpoint) {
    return json(400, { ok: false, error: "ENDPOINT_REQUIRED" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) {
    return json(401, { ok: false, error: "INVALID_AUTH_USER" });
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user.id)
    .eq("endpoint", endpoint)
    .maybeSingle();

  if (subscriptionError) {
    console.error("TEST_PUSH_SUBSCRIPTION_LOOKUP_FAILED", { code: subscriptionError.code });
    return json(500, { ok: false, error: "SUBSCRIPTION_LOOKUP_FAILED" });
  }

  if (!subscription) {
    return json(404, { ok: false, error: "SUBSCRIPTION_NOT_FOUND" });
  }

  if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
    return json(409, { ok: false, error: "SUBSCRIPTION_INCOMPLETE" });
  }

  const recordDate = toSeoulDateString(new Date());
  const payload = JSON.stringify({
    title: "PASSMAP 테스트 알림",
    body: "알림을 클릭하면 AI 업무기록 화면으로 이동합니다.",
    url: buildDeeplinkUrl(PUBLIC_APP_URL, recordDate),
  });

  webpush.setVapidDetails(WEB_PUSH_SUBJECT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      payload,
    );
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number; status?: number }).statusCode
      ?? (err as { statusCode?: number; status?: number }).status
      ?? 0;
    console.error("TEST_PUSH_SEND_FAILED", { statusCode });
    return json(502, { ok: false, error: "PUSH_SEND_FAILED", statusCode });
  }

  return json(200, { ok: true, sent: 1, recordDate });
});
