import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { evaluateSchedulerDryRun, parseBody, type RequestInput } from "./contract.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function readRequest(req: Request): Promise<{ input?: RequestInput; response?: Response }> {
  try {
    return { input: parseBody(await req.json()) };
  } catch {
    return {
      response: json(400, {
        ok: false,
        error: "INVALID_JSON",
        providerCalls: 0,
        messagesSent: 0,
        ledgerWrites: 0,
      }),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method === "GET") {
    return json(200, {
      ok: true,
      function: "send-experience-recall-reminders-v2",
      mode: "mock_fixture_dry_run_only",
      allowedModes: ["dry_run", "inspect_only"],
      liveMode: "rejected",
      providerCalls: 0,
      messagesSent: 0,
      ledgerWrites: 0,
    });
  }

  if (req.method !== "POST") {
    return json(405, {
      ok: false,
      error: "METHOD_NOT_ALLOWED",
      providerCalls: 0,
      messagesSent: 0,
      ledgerWrites: 0,
    });
  }

  const parsed = await readRequest(req);
  if (parsed.response) return parsed.response;

  const result = evaluateSchedulerDryRun(parsed.input ?? {});
  return json(result.status, result.body);
});
