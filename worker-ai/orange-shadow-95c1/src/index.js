export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    const __path = url.pathname;

    const ALLOWED_PATHS = [
      "/api/enhance",
      "/api/parse",
      "/api/resume-generate",
      "/api/resume-import-ai",
      "/api/notion/auth-url",
      "/api/notion/callback",
      "/api/notion/status",
      "/api/notion/sources",
      "/api/notion/source-schema",
      "/api/notion/preview",
      "/api/notion/commit",
      "/api/calendar/google/connect/start",
      "/api/calendar/google/oauth/callback",
      "/api/calendar/google/create-passmap-calendar",
      "/api/calendar/google/sync-record",
      "/api/calendar/google/update-record-event",
      "/api/calendar/google/delete-record-event",
      "/api/calendar/google/disconnect",
      "/api/calendar/google/retry-failed-records",
    ];
    if (!ALLOWED_PATHS.includes(__path)) {
      return new Response("Not Found", { status: 404, headers: corsHeaders() });
    }

    // Callback is a GET redirect from Notion — must dispatch before the POST guard
    if (__path === "/api/notion/callback") {
      return handleNotionCallback(request, env);
    }

    // Google Calendar OAuth callback — GET redirect from Google, before POST guard
    if (__path === "/api/calendar/google/oauth/callback") {
      return handleGoogleCalendarCallback(request, env);
    }

    // Status / sources / source-schema are GET endpoints — dispatch before the POST guard
    if (__path === "/api/notion/status") {
      return handleNotionStatus(request, env);
    }
    if (__path === "/api/notion/sources") {
      return handleNotionSources(request, env);
    }
    if (__path === "/api/notion/source-schema") {
      return handleNotionSourceSchema(request, env);
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: corsHeaders(),
      });
    }

    // Notion OAuth endpoints — handled before request.json() since they need no body
    if (__path === "/api/notion/auth-url") {
      return handleNotionAuthUrl(request, env);
    }

    // Google Calendar connect/start — handled before request.json() (no body needed)
    if (__path === "/api/calendar/google/connect/start") {
      return handleGoogleCalendarConnectStart(request, env);
    }

    // Google Calendar create-passmap-calendar — handled before request.json() (no body needed)
    if (__path === "/api/calendar/google/create-passmap-calendar") {
      return handleGoogleCalendarCreatePassmapCalendar(request, env);
    }

    // CAL-8G-1: Google Calendar disconnect — DB-only, no body needed
    if (__path === "/api/calendar/google/disconnect") {
      return handleGoogleCalendarDisconnect(request, env);
    }

    // CAL-8H-1: retry failed records — Worker queries failed rows server-side, no body needed
    if (__path === "/api/calendar/google/retry-failed-records") {
      return handleGoogleCalendarRetryFailedRecords(request, env);
    }

    try {
      const body = await request.json();
      if (__path === "/api/notion/preview") {
        return handleNotionPreview(request, env, body);
      }
      if (__path === "/api/notion/commit") {
        return handleNotionCommit(request, env, body);
      }
      // Google Calendar sync-record — insert a single work_record as a Calendar event
      if (__path === "/api/calendar/google/sync-record") {
        return handleGoogleCalendarSyncRecord(request, env, body);
      }
      // Google Calendar update-record-event — patch an existing Calendar event from work_records
      if (__path === "/api/calendar/google/update-record-event") {
        return handleGoogleCalendarUpdateRecordEvent(request, env, body);
      }
      // CAL-8F-1: delete the Calendar event linked to a work_record before PASSMAP row removal
      if (__path === "/api/calendar/google/delete-record-event") {
        return handleGoogleCalendarDeleteRecordEvent(request, env, body);
      }
      // ✅ NEW: schema-only parse endpoint (/api/parse)
      // - JSON-only
      // - validate 실패/JSON parse 실패 => ok:false
      // - /api/enhance 기존 호환 유지
      // guard: missing key — shared by /api/parse and /api/enhance
      const __key = (env.GEMINI_API_KEY || env.GEMINI_API_KEY_V2 || "").toString().trim();
      if (url.pathname === "/api/parse") {
        const t0 = Date.now();
        const requestId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());

        const task = (body?.task || "").toString();
        const kind = (body?.kind || "").toString(); // "jd" | "resume"
        const text = (body?.text || "").toString().slice(0, 12000);

        if (task !== "SCHEMA_PARSE" || (kind !== "jd" && kind !== "resume") || !text.trim()) {
          return json({
            ok: false,
            error: { code: "BAD_REQUEST", message: "task/kind/text is required" },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        const prompt = buildSchemaPrompt({ kind, text });

        if (!__key) {
          return json({
            ok: false,
            error: { code: "NO_API_KEY", message: "Missing GEMINI_API_KEY(_V2)" },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }


        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${__key}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1 },
            }),
          }
        );

        if (!resp.ok) {
          const errText = await resp.text();
          return json({
            ok: false,
            error: { code: "MODEL_ERROR", message: errText.slice(0, 300) },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        const data = await resp.json();
        const raw =
          data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

        const extracted = extractJsonObject(raw);
        if (!extracted) {
          return json({
            ok: false,
            error: { code: "INVALID_JSON", message: "No JSON object found in model output" },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        let parsed;
        try {
          parsed = JSON.parse(extracted);
        } catch (e) {
          return json({
            ok: false,
            error: { code: "INVALID_JSON", message: String(e).slice(0, 160) },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        const v = validateSchema(kind, parsed);
        if (!v.ok) {
          return json({
            ok: false,
            error: { code: "INVALID_SCHEMA", message: v.reason },
            meta: { requestId, ms: Date.now() - t0 },
          });
        }

        return json({
          ok: true,
          parsed,
          meta: { requestId, ms: Date.now() - t0 },
        });
      }
      if (url.pathname === "/api/resume-generate") {
        return handleResumeGenerate(request, env, body, __key);
      }
      if (url.pathname === "/api/resume-import-ai") {
        return handleResumeImportAI(request, env, body, __key);
      }
      const jd = (body.jd || "").toString().slice(0, 12000);
      const resume = (body.resume || "").toString().slice(0, 12000);

      const prompt = `
너는 채용 JD와 이력서를 비교해 규칙 기반 분석기의 정확도를 보조하는 JSON만 출력해야 한다.
설명 금지. JSON 외 텍스트 절대 금지.

출력 형식:
{
  "jdMustHave": string[],
  "jdNiceToHave": string[],
  "resumeSkillTags": string[],
  "confidenceDeltaByHypothesis": {
    "fit-mismatch": number,
    "weak-proof": number,
    "unclear-positioning": number,
    "gap-risk": number,
    "knockout-missing": number
  }
}

제약:
- 모든 문자열은 소문자
- confidenceDeltaByHypothesis 값은 -0.15 ~ +0.15 범위

[JD]
${jd}

[RESUME]
${resume}
`.trim();

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${__key}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
            },
          }),
        }
      );

      if (!resp.ok) {
        const errText = await resp.text();
        return json({ ok: false, error: errText.slice(0, 300) });
      }

      const data = await resp.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("\n") || "";

      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");

      let parsed = {};
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        } catch {
          parsed = {};
        }
      }

      return json({ ok: true, ai: parsed });

    } catch (e) {
      return json({ ok: false, error: String(e).slice(0, 200) });
    }
  },
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
// ------------------------------
// ✅ helpers for /api/parse
// ------------------------------
function extractJsonObject(text) {
  if (!text) return null;
  const s = text.indexOf("{");
  const e = text.lastIndexOf("}");
  if (s === -1 || e === -1 || e <= s) return null;
  return text.slice(s, e + 1);
}

function buildSchemaPrompt({ kind, text }) {
  // JSON-only 강제 (코드블록/설명 금지)
  if (kind === "jd") {
    return `
You MUST output JSON ONLY. No markdown, no explanations, no code fences.
Return a single JSON object with this exact shape:

{
  "jobTitle": string | null,
  "mustHave": string[],
  "preferred": string[],
  "coreTasks": string[],
  "tools": string[],
  "constraints": string[],
  "domainKeywords": string[]
}

Rules:
- Arrays must contain short noun phrases (2~8 words), not full sentences.
- No placeholder like "unknown", "N/A". If truly missing, use empty array or null.
- Do not include advice text.

[JD TEXT]
${text}
    `.trim();
  }

  // resume
  return `
You MUST output JSON ONLY. No markdown, no explanations, no code fences.
Return a single JSON object with this exact shape:

{
  "summary": string | null,
  "timeline": string[],
  "skills": string[],
  "achievements": string[],
  "projects": string[]
}

Rules:
- Arrays must contain short items (bullet-style), not long guidance sentences.
- No placeholder like "unknown", "N/A". If truly missing, use empty array or null.
- Do not include advice text.

[RESUME TEXT]
${text}
  `.trim();
}

function validateSchema(kind, obj) {
  const isArr = (v) => Array.isArray(v);
  const isStr = (v) => typeof v === "string";
  const cleanItem = (s) => (isStr(s) ? s.trim() : "");

  const hasBadPlaceholder = (s) => {
    const t = cleanItem(s).toLowerCase();
    return t === "unknown" || t === "n/a" || t === "na" || t === "none";
  };

  if (!obj || typeof obj !== "object") {
    return { ok: false, reason: "not an object" };
  }

  if (kind === "jd") {
    const mustHave = obj.mustHave;
    const preferred = obj.preferred;
    const coreTasks = obj.coreTasks;
    const tools = obj.tools;
    const constraints = obj.constraints;
    const domainKeywords = obj.domainKeywords;

    const buckets = [mustHave, preferred, coreTasks, tools, constraints, domainKeywords];

    // 최소 조건: 배열 형태 2개 이상 + 전체 항목 3개 이상
    const arrCount = buckets.filter(isArr).length;
    const itemCount = buckets
      .filter(isArr)
      .reduce((acc, a) => acc + a.filter((x) => cleanItem(x).length >= 2 && !hasBadPlaceholder(x)).length, 0);

    if (arrCount < 2 || itemCount < 3) {
      return { ok: false, reason: "too empty (need >=2 arrays and >=3 total items)" };
    }

    // 템플릿/가이드 문장 혼입 방지(완전 방어는 아니고 최소)
    const jt = obj.jobTitle;
    if (jt != null && isStr(jt)) {
      const t = jt.trim();
      if (t.length >= 40) return { ok: false, reason: "jobTitle looks like a sentence" };
      if (hasBadPlaceholder(t)) return { ok: false, reason: "jobTitle placeholder" };
    }

    return { ok: true };
  }

  // resume
  const timeline = obj.timeline;
  const skills = obj.skills;
  const achievements = obj.achievements;
  const projects = obj.projects;

  const buckets = [timeline, skills, achievements, projects];
  const arrCount = buckets.filter(isArr).length;
  const itemCount = buckets
    .filter(isArr)
    .reduce((acc, a) => acc + a.filter((x) => cleanItem(x).length >= 2 && !hasBadPlaceholder(x)).length, 0);

  if (arrCount < 2 || itemCount < 3) {
    return { ok: false, reason: "too empty (need >=2 arrays and >=3 total items)" };
  }

  return { ok: true };
}

// ============================================================
// Security helpers — Round 7-C1
// ============================================================
// Support Notion OAuth / import flow (Round 7-C2+).
// These functions do NOT modify /api/enhance or /api/parse.
// ============================================================

/**
 * Extract Bearer token from Authorization header.
 * Returns null if absent or malformed. Token is never logged.
 */
function getBearerToken(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verify a Supabase user JWT by calling /auth/v1/user.
 * Returns { user: { id, email } } on success.
 * Returns { error: number, message: string } on failure.
 * The JWT and service role key are never logged.
 */
async function requireSupabaseUser(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: 500, message: "Supabase config missing" };
  }
  const token = getBearerToken(request);
  if (!token) {
    return { error: 401, message: "Authorization header required" };
  }
  let resp;
  try {
    const baseUrl = env.SUPABASE_URL.replace(/\/+$/, "");
    resp = await fetch(`${baseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
  } catch (_) {
    return { error: 502, message: "Auth service unreachable" };
  }
  if (!resp.ok) {
    return { error: 401, message: "Invalid or expired token" };
  }
  let userData;
  try {
    userData = await resp.json();
  } catch (_) {
    return { error: 500, message: "Malformed auth response" };
  }
  if (!userData?.id) {
    return { error: 401, message: "User not found" };
  }
  return { user: { id: userData.id, email: userData.email ?? null } };
}

/**
 * Call Supabase REST (PostgREST) API with service role key.
 * path: e.g. "/rest/v1/notion_connections"
 * options: standard fetch init (method, body, headers override, etc.)
 * Service role key is never exposed to the browser or logged.
 */
async function supabaseRest(env, path, options = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase config missing");
  }
  const baseUrl = env.SUPABASE_URL.replace(/\/+$/, "");
  const normalizedPath = String(path || "");
  const url = `${baseUrl}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...(options.headers ?? {}),
  };
  return fetch(url, { ...options, headers });
}

/**
 * Import AES-GCM CryptoKey from TOKEN_ENCRYPTION_KEY env secret.
 * TOKEN_ENCRYPTION_KEY must be a standard-base64-encoded 32-byte value.
 * Key material is never logged.
 */
async function importAesKey(env) {
  if (!env.TOKEN_ENCRYPTION_KEY) throw new Error("TOKEN_ENCRYPTION_KEY not set");
  let keyBytes;
  try {
    keyBytes = _b64ToBytes(env.TOKEN_ENCRYPTION_KEY);
  } catch (_) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be valid base64");
  }
  if (keyBytes.byteLength !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (256-bit)");
  }
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plainText with AES-GCM using a random 12-byte IV.
 * Returns "<iv_b64>:<ciphertext_b64>" — suitable for access_token_enc column.
 * Plaintext and key are never logged.
 */
async function encryptSecret(plainText, env) {
  const key = await importAesKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return `${_bytesToB64(iv)}:${_bytesToB64(new Uint8Array(cipherBuf))}`;
}

/**
 * Decrypt a value produced by encryptSecret.
 * Expected format: "<iv_b64>:<ciphertext_b64>"
 * Returns original plainText. Decrypted value is never logged.
 */
async function decryptSecret(cipherText, env) {
  const sep = cipherText.indexOf(":");
  if (sep === -1) throw new Error("Invalid cipherText: missing ':' separator");
  let iv;
  let ct;
  try {
    iv = _b64ToBytes(cipherText.slice(0, sep));
    ct = _b64ToBytes(cipherText.slice(sep + 1));
  } catch (_) {
    throw new Error("Invalid cipherText: expected base64 iv and ciphertext");
  }
  if (iv.byteLength !== 12) {
    throw new Error("Invalid cipherText: IV must decode to 12 bytes");
  }
  if (ct.byteLength === 0) {
    throw new Error("Invalid cipherText: ciphertext is empty");
  }
  const key = await importAesKey(env);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plainBuf);
}

// ============================================================
// Base64 utilities — Workers-native (btoa/atob are global)
// ============================================================

function _bytesToB64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function _b64ToBytes(b64) {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

// ============================================================
// Notion OAuth helpers — Round 7-C2
// ============================================================

/**
 * Status-aware JSON response helper.
 * Extends json() for 4xx/5xx responses where HTTP status matters.
 */
function jsonStatus(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

/**
 * Build an AES-GCM-encrypted OAuth state string.
 * The state payload embeds userId + nonce + TTL so that
 * the Round 7-C3 callback can identify the originating PASSMAP user
 * without a separate oauth_states table.
 *
 * No secrets or credentials are included in the payload.
 */
async function buildNotionOAuthState(userId, env) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 10 * 60 * 1000;
  const nonce = crypto?.randomUUID ? crypto.randomUUID() : _bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
  const payload = {
    provider: "notion",
    purpose: "oauth",
    userId,
    nonce,
    issuedAt,
    expiresAt,
  };
  return encryptSecret(JSON.stringify(payload), env);
}

/**
 * Build the full Notion OAuth authorization URL.
 * client_secret is intentionally absent — it is only needed for token exchange.
 * URLSearchParams handles all percent-encoding of state and redirect_uri.
 */
async function buildNotionAuthUrl(user, env) {
  const encryptedState = await buildNotionOAuthState(user.id, env);
  const params = new URLSearchParams({
    owner: "user",
    client_id: env.NOTION_CLIENT_ID,
    redirect_uri: env.NOTION_REDIRECT_URI,
    response_type: "code",
    state: encryptedState,
  });
  return `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
}

/**
 * Route handler for POST /api/notion/auth-url.
 * 1. Checks required secrets are configured.
 * 2. Verifies the caller's Supabase JWT.
 * 3. Returns an encrypted Notion OAuth authorization URL.
 *
 * The encrypted state and auth URL are safe to return to the browser.
 * State plaintext, secrets, and service role key are never exposed.
 */
async function handleNotionAuthUrl(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.NOTION_CLIENT_ID) missing.push("NOTION_CLIENT_ID");
  if (!env.NOTION_REDIRECT_URI) missing.push("NOTION_REDIRECT_URI");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `Worker config missing: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }

  let authUrl;
  try {
    authUrl = await buildNotionAuthUrl(authResult.user, env);
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to generate authorization URL" }, 500);
  }

  return json({ ok: true, authUrl, expiresInSeconds: 600 });
}

// ─────────────────────────────────────────────
// Round 7-C3: Notion OAuth callback helpers
// ─────────────────────────────────────────────

function htmlResponse(title, message, status = 200) {
  const body = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center}
h1{font-size:1.4rem}p{color:#555}</style></head>
<body><h1>${title}</h1><p>${message}</p></body></html>`;
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

async function validateNotionOAuthState(state, env) {
  let plaintext;
  try {
    plaintext = await decryptSecret(state, env);
  } catch (_) {
    return { ok: false, reason: "state_decrypt_failed" };
  }

  let payload;
  try {
    payload = JSON.parse(plaintext);
  } catch (_) {
    return { ok: false, reason: "state_parse_failed" };
  }

  if (payload.provider !== "notion" || payload.purpose !== "oauth") {
    return { ok: false, reason: "state_invalid_purpose" };
  }
  if (!payload.userId || typeof payload.userId !== "string") {
    return { ok: false, reason: "state_missing_userId" };
  }
  if (!payload.expiresAt || Date.now() > payload.expiresAt) {
    return { ok: false, reason: "state_expired" };
  }
  if (!payload.nonce || typeof payload.nonce !== "string") {
    return { ok: false, reason: "state_missing_nonce" };
  }
  if (typeof payload.issuedAt === "number" && payload.issuedAt > Date.now() + 60_000) {
    return { ok: false, reason: "state_issued_in_future" };
  }

  return { ok: true, payload };
}

async function exchangeNotionCodeForToken(code, env) {
  const credentials = btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`);
  let resp;
  try {
    resp = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: env.NOTION_REDIRECT_URI,
      }),
    });
  } catch (err) {
    return { ok: false, reason: `notion_token_fetch_error: ${err.message}` };
  }

  const data = await resp.json();
  if (!resp.ok) {
    return { ok: false, reason: data.error ?? "notion_token_exchange_failed" };
  }

  return { ok: true, data };
}

async function upsertNotionConnection(tokenData, userId, env) {
  const workspaceId = tokenData.workspace_id;
  if (!workspaceId) {
    return { ok: false, reason: "notion_token_missing_workspace_id" };
  }

  let accessTokenEnc;
  try {
    accessTokenEnc = await encryptSecret(tokenData.access_token, env);
  } catch (_) {
    return { ok: false, reason: "token_encrypt_failed" };
  }

  const row = {
    user_id: userId,
    workspace_id: workspaceId,
    workspace_name: tokenData.workspace_name ?? null,
    bot_id: tokenData.bot_id ?? null,
    access_token_enc: accessTokenEnc,
    status: "active",
    connected_at: new Date().toISOString(),
  };

  const result = await supabaseRest(
    env,
    "/rest/v1/notion_connections?on_conflict=user_id,workspace_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    }
  );

  if (!result.ok) {
    return { ok: false, reason: `upsert_failed: ${result.error ?? result.status}` };
  }

  return { ok: true };
}

async function handleNotionCallback(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.NOTION_CLIENT_ID) missing.push("NOTION_CLIENT_ID");
  if (!env.NOTION_CLIENT_SECRET) missing.push("NOTION_CLIENT_SECRET");
  if (!env.NOTION_REDIRECT_URI) missing.push("NOTION_REDIRECT_URI");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return htmlResponse("Configuration Error", "Worker secrets not configured.", 500);
  }

  const url = new URL(request.url);
  const notionError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (notionError) {
    const desc = url.searchParams.get("error_description") ?? notionError;
    return htmlResponse("Connection Cancelled", `Notion declined the request: ${desc}`, 400);
  }
  if (!code || !state) {
    return htmlResponse("Invalid Request", "Missing required OAuth parameters.", 400);
  }

  const stateResult = await validateNotionOAuthState(state, env);
  if (!stateResult.ok) {
    return htmlResponse("Connection Failed", `Invalid or expired authorization state (${stateResult.reason}). Please try again.`, 400);
  }

  const userId = stateResult.payload.userId;

  const tokenResult = await exchangeNotionCodeForToken(code, env);
  if (!tokenResult.ok) {
    return htmlResponse("Connection Failed", `Could not exchange authorization code (${tokenResult.reason}). Please try again.`, 502);
  }

  const upsertResult = await upsertNotionConnection(tokenResult.data, userId, env);
  if (!upsertResult.ok) {
    return htmlResponse("Connection Failed", `Could not save Notion connection (${upsertResult.reason}). Please try again.`, 500);
  }

  return htmlResponse(
    "Notion Connected",
    "Your Notion workspace has been connected to PASSMAP. You may close this window."
  );
}

// ─────────────────────────────────────────────
// Round 7-C4: Notion connection status API
// ─────────────────────────────────────────────

async function handleNotionStatus(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonStatus(
      { ok: false, error: `Worker config missing: ${[!env.SUPABASE_URL && "SUPABASE_URL", !env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY"].filter(Boolean).join(", ")}` },
      500
    );
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }

  const userId = encodeURIComponent(authResult.user.id);
  const path =
    `/rest/v1/notion_connections` +
    `?user_id=eq.${userId}` +
    `&status=eq.active` +
    `&select=workspace_name,status,connected_at,last_checked_at` +
    `&order=connected_at.desc` +
    `&limit=1`;

  let resp;
  try {
    resp = await supabaseRest(env, path, { method: "GET" });
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to load Notion connection status" }, 502);
  }

  if (!resp.ok) {
    return jsonStatus({ ok: false, error: "Failed to load Notion connection status" }, 502);
  }

  let rows;
  try {
    rows = await resp.json();
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to load Notion connection status" }, 502);
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return json({ ok: true, connected: false });
  }

  const row = rows[0];
  return json({
    ok: true,
    connected: true,
    workspaceName: row.workspace_name ?? null,
    status: row.status,
    connectedAt: row.connected_at ?? null,
    lastCheckedAt: row.last_checked_at ?? null,
  });
}

// ─────────────────────────────────────────────
// Round 7-D: Notion source / schema API helpers
// ─────────────────────────────────────────────

// Notion API version — confirmed published (Round 7-D-VERIFY).
// 2025-09-03 introduced: /v1/data_sources/{id} endpoint, data_sources[] on database objects.
// Latest stable as of 2026-04-28: 2026-03-11. Project uses 2025-09-03 per design decision.
// CRITICAL: As of 2025-09-03, GET /v1/databases/{id} does NOT return properties.
// Property schema MUST come from GET /v1/data_sources/{data_source_id} only.
// Unknown Notion-Version header behavior is unverified — no automatic fallback is assumed.
const NOTION_VERSION = "2025-09-03";

// Property type → schema metadata map.
// Derived from docs/notion-import-normalization-contract.md §4.
const PROPERTY_SCHEMA_MAP = {
  title:        { mvpMapping: "direct",   required: true,  recommended: false, passmapCandidates: ["title"] },
  rich_text:    { mvpMapping: "direct",   required: false, recommended: true,  passmapCandidates: ["description", "task", "result", "projectName"] },
  date:         { mvpMapping: "direct",   required: false, recommended: true,  passmapCandidates: ["recordDate", "startDate", "endDate"] },
  select:       { mvpMapping: "direct",   required: false, recommended: true,  passmapCandidates: ["projectName", "recordType", "skillTags", "strengthTags"] },
  multi_select: { mvpMapping: "direct",   required: false, recommended: true,  passmapCandidates: ["skillTags", "strengthTags"] },
  status:       { mvpMapping: "optional", required: false, recommended: false, passmapCandidates: [] },
  checkbox:     { mvpMapping: "optional", required: false, recommended: false, passmapCandidates: [] },
  number:       { mvpMapping: "optional", required: false, recommended: false, passmapCandidates: [] },
  url:          { mvpMapping: "raw_only", required: false, recommended: false, passmapCandidates: [] },
  relation:     { mvpMapping: "future",   required: false, recommended: false, passmapCandidates: [] },
  formula:      { mvpMapping: "future",   required: false, recommended: false, passmapCandidates: [] },
  rollup:       { mvpMapping: "future",   required: false, recommended: false, passmapCandidates: [] },
  people:       { mvpMapping: "excluded", required: false, recommended: false, passmapCandidates: [] },
  files:        { mvpMapping: "excluded", required: false, recommended: false, passmapCandidates: [] },
};

// MVP mapping priority for sorting (lower index = higher priority)
const MVP_MAPPING_PRIORITY = { direct: 0, optional: 1, raw_only: 2, future: 3, excluded: 4 };

/**
 * Query notion_connections for the user's active connection.
 * Returns the row (including access_token_enc) or null if none found.
 * Throws if Supabase is unreachable or returns a non-ok status.
 * access_token_enc is NEVER logged or returned to the client.
 */
async function getActiveNotionConnection(userId, env) {
  const encodedId = encodeURIComponent(userId);
  const path =
    `/rest/v1/notion_connections` +
    `?user_id=eq.${encodedId}` +
    `&status=eq.active` +
    `&select=workspace_name,workspace_id,bot_id,access_token_enc,connected_at,last_checked_at` +
    `&order=connected_at.desc` +
    `&limit=1`;
  const resp = await supabaseRest(env, path, { method: "GET" });
  if (!resp.ok) throw new Error(`supabase_error:${resp.status}`);
  const rows = await resp.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return rows[0];
}

/**
 * Call the Notion API.
 * Authorization header uses the decrypted token — never logged.
 */
async function notionFetch(path, token, options = {}) {
  const notionUrl = `https://api.notion.com${path}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };
  return fetch(notionUrl, { ...options, headers });
}

/**
 * Normalize a Notion search result item (database object) into one or more
 * source candidates for the frontend.
 *
 * Notion API 2025-09-03 shape: database may include a data_sources array.
 * Older API shape: no data_sources → schemaReadable:false, databaseReadable:true.
 */
function normalizeNotionSourceCandidate(item) {
  const titleParts = Array.isArray(item.title) ? item.title : [];
  const dbTitle = titleParts.map(t => t.plain_text ?? "").join("") || "Untitled";

  // New shape: database has data_sources[]
  const dataSources = Array.isArray(item.data_sources) ? item.data_sources : [];
  if (dataSources.length > 0) {
    return dataSources.map(ds => {
      const dsTitleParts = Array.isArray(ds.title) ? ds.title : [];
      const dsTitle = dsTitleParts.map(t => t.plain_text ?? "").join("") || dbTitle;
      return {
        databaseId: item.id ?? null,
        dataSourceId: ds.id ?? null,
        title: dsTitle,
        dataSourceTitle: dsTitle,
        url: item.url ?? null,
        lastEditedTime: item.last_edited_time ?? null,
        object: "data_source",
        schemaReadable: !!(ds.id),
        databaseReadable: !!(item.id),
      };
    });
  }

  // Fallback shape: no data_sources[] present (old API response or pre-2025-09-03 shape).
  // dataSourceId is null → schemaReadable:false.
  // source-schema endpoint requires data_source_id; this candidate cannot be schema-queried.
  // databaseReadable:true indicates the database_id is valid metadata, nothing more.
  return [{
    databaseId: item.id ?? null,
    dataSourceId: null,
    title: dbTitle,
    dataSourceTitle: dbTitle,
    url: item.url ?? null,
    lastEditedTime: item.last_edited_time ?? null,
    object: "database",
    schemaReadable: false,
    databaseReadable: !!(item.id),
  }];
}

/**
 * Convert a Notion database/data_source's properties object into the schema
 * array used by the mapping UI (Round 7-E).
 * Normalizes per docs/notion-import-normalization-contract.md §4.
 */
function normalizeNotionPropertySchema(source) {
  const rawProperties = source.properties ?? {};
  const properties = [];

  for (const [name, prop] of Object.entries(rawProperties)) {
    const type = prop.type ?? "unknown";
    const meta = PROPERTY_SCHEMA_MAP[type] ?? {
      mvpMapping: "raw_only",
      required: false,
      recommended: false,
      passmapCandidates: [],
    };

    // For select/multi_select/status: extract options (name + color only)
    let options = null;
    if (type === "select" && Array.isArray(prop.select?.options)) {
      options = prop.select.options.map(o => ({ name: o.name, color: o.color ?? null }));
    } else if (type === "multi_select" && Array.isArray(prop.multi_select?.options)) {
      options = prop.multi_select.options.map(o => ({ name: o.name, color: o.color ?? null }));
    } else if (type === "status" && Array.isArray(prop.status?.options)) {
      options = prop.status.options.map(o => ({ name: o.name, color: o.color ?? null }));
    }

    properties.push({
      id: prop.id,
      name,
      type,
      requiredCandidate: meta.required,
      recommendedCandidate: meta.recommended,
      passmapCandidates: meta.passmapCandidates,
      mvpMapping: meta.mvpMapping,
      options,
      raw: { id: prop.id, type: prop.type },
    });
  }

  // Sort: title type first, then by mvpMapping priority
  properties.sort((a, b) => {
    if (a.type === "title") return -1;
    if (b.type === "title") return 1;
    const pa = MVP_MAPPING_PRIORITY[a.mvpMapping] ?? 99;
    const pb = MVP_MAPPING_PRIORITY[b.mvpMapping] ?? 99;
    return pa - pb;
  });

  return properties;
}

async function handleNotionSources(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.TOKEN_ENCRYPTION_KEY) {
    const missing = [
      !env.SUPABASE_URL && "SUPABASE_URL",
      !env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      !env.TOKEN_ENCRYPTION_KEY && "TOKEN_ENCRYPTION_KEY",
    ].filter(Boolean);
    return jsonStatus({ ok: false, error: `Worker config missing: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }

  let conn;
  try {
    conn = await getActiveNotionConnection(authResult.user.id, env);
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to load Notion connection" }, 502);
  }
  if (!conn) {
    return jsonStatus({ ok: false, error: "Notion is not connected", code: "notion_not_connected" }, 409);
  }

  let token;
  try {
    token = await decryptSecret(conn.access_token_enc, env);
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to decrypt Notion token" }, 500);
  }

  let notionResp;
  try {
    notionResp = await notionFetch("/v1/search", token, {
      method: "POST",
      body: JSON.stringify({
        filter: { property: "object", value: "database" },
        page_size: 25,
      }),
    });
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to reach Notion API", code: "notion_api_error" }, 502);
  }

  if (!notionResp.ok) {
    const s = notionResp.status;
    if (s === 401 || s === 403) {
      return jsonStatus({ ok: false, error: "Notion access denied", code: "notion_access_denied" }, 502);
    }
    return jsonStatus({ ok: false, error: "Notion API error", code: "notion_api_error" }, 502);
  }

  let notionData;
  try {
    notionData = await notionResp.json();
  } catch (_) {
    return jsonStatus({ ok: false, error: "Notion API returned invalid response", code: "notion_api_error" }, 502);
  }

  const results = Array.isArray(notionData.results) ? notionData.results : [];
  const sources = results.flatMap(item => normalizeNotionSourceCandidate(item));

  return json({ ok: true, sources });
}

async function handleNotionSourceSchema(request, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.TOKEN_ENCRYPTION_KEY) {
    const missing = [
      !env.SUPABASE_URL && "SUPABASE_URL",
      !env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      !env.TOKEN_ENCRYPTION_KEY && "TOKEN_ENCRYPTION_KEY",
    ].filter(Boolean);
    return jsonStatus({ ok: false, error: `Worker config missing: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }

  const reqUrl = new URL(request.url);
  const dataSourceId = reqUrl.searchParams.get("data_source_id") ?? "";
  const databaseId   = reqUrl.searchParams.get("database_id")   ?? "";

  // data_source_id is strictly required.
  // As of Notion API 2025-09-03, GET /v1/databases/{id} does NOT return properties.
  // Schema MUST come from GET /v1/data_sources/{data_source_id}.
  // database_id is accepted only for response metadata — never used for API calls.
  if (!dataSourceId) {
    return jsonStatus({
      ok: false,
      error: "data_source_id is required to read Notion source schema",
      code: "missing_data_source_id",
    }, 400);
  }

  let conn;
  try {
    conn = await getActiveNotionConnection(authResult.user.id, env);
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to load Notion connection" }, 502);
  }
  if (!conn) {
    return jsonStatus({ ok: false, error: "Notion is not connected", code: "notion_not_connected" }, 409);
  }

  let token;
  try {
    token = await decryptSecret(conn.access_token_enc, env);
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to decrypt Notion token" }, 500);
  }

  let notionResp;
  try {
    notionResp = await notionFetch(`/v1/data_sources/${encodeURIComponent(dataSourceId)}`, token, { method: "GET" });
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to reach Notion API", code: "notion_api_error" }, 502);
  }

  if (!notionResp.ok) {
    const s = notionResp.status;
    if (s === 404) return jsonStatus({ ok: false, error: "Source not found", code: "notion_source_not_found" }, 404);
    if (s === 401 || s === 403) return jsonStatus({ ok: false, error: "Notion access denied", code: "notion_access_denied" }, 502);
    return jsonStatus({ ok: false, error: "Notion API error", code: "notion_api_error" }, 502);
  }

  let dataSource;
  try {
    dataSource = await notionResp.json();
  } catch (_) {
    return jsonStatus({ ok: false, error: "Notion API returned invalid response", code: "notion_api_error" }, 502);
  }

  // data_source title may be a rich_text array or a plain string depending on API shape
  let sourceTitle;
  if (Array.isArray(dataSource.title)) {
    sourceTitle = dataSource.title.map(t => t.plain_text ?? "").join("") || "Untitled";
  } else if (typeof dataSource.name === "string") {
    sourceTitle = dataSource.name || "Untitled";
  } else {
    sourceTitle = "Untitled";
  }

  const source = {
    dataSourceId,
    databaseId: databaseId || dataSource.database_id || null,
    title: sourceTitle,
  };

  const properties = normalizeNotionPropertySchema(dataSource);

  return json({ ok: true, source, properties });
}


// ─── Round 7-F1: Preview helpers ─────────────────────────────────────────────

function getNotionProperty(page, propertyName) {
  return page?.properties?.[propertyName] ?? null;
}

function readPlainText(prop) {
  if (!prop) return null;
  const type = prop.type;
  if (type === "title" && Array.isArray(prop.title)) {
    return prop.title.map(t => t.plain_text ?? "").join("") || null;
  }
  if (type === "rich_text" && Array.isArray(prop.rich_text)) {
    return prop.rich_text.map(t => t.plain_text ?? "").join("") || null;
  }
  return null;
}

function readDateValue(prop) {
  if (!prop || prop.type !== "date" || !prop.date) return null;
  return prop.date;
}

function readSelectName(prop) {
  if (!prop || prop.type !== "select") return null;
  return prop.select?.name ?? null;
}

function readMultiSelectNames(prop) {
  if (!prop) return [];
  if (prop.type === "multi_select" && Array.isArray(prop.multi_select)) {
    return prop.multi_select.map(s => s.name).filter(Boolean);
  }
  if (prop.type === "select") {
    const n = prop.select?.name;
    return n ? [n] : [];
  }
  return [];
}

function normalizeDateString(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function extractMappedFieldsFromPage(page, propertyMap, defaults, fallbacks) {
  const errors = [];
  const warnings = [];
  const mapped = {
    title: null,
    recordDate: null,
    description: null,
    task: null,
    result: null,
    projectName: null,
    skillTags: [],
    strengthTags: [],
    startDate: null,
    endDate: null,
    recordType: defaults.recordType ?? "weekly",
    workType: defaults.workType ?? "이번 주 기록",
  };

  // title
  if (propertyMap.title) {
    const prop = getNotionProperty(page, propertyMap.title);
    if (prop && (prop.type === "title" || prop.type === "rich_text")) {
      mapped.title = readPlainText(prop) ?? null;
    } else if (prop) {
      errors.push("unsupported_title_property");
    }
  }
  if (!mapped.title) {
    errors.push("missing_title");
  }

  // recordDate (with fallback chain)
  let dateResolved = false;
  if (propertyMap.recordDate) {
    const prop = getNotionProperty(page, propertyMap.recordDate);
    if (prop && prop.type === "date") {
      const d = readDateValue(prop);
      if (d && d.start) {
        mapped.recordDate = normalizeDateString(d.start);
        mapped.startDate = normalizeDateString(d.start);
        if (d.end) {
          mapped.endDate = normalizeDateString(d.end);
          warnings.push("date_range_detected");
        }
        dateResolved = true;
      } else {
        errors.push("invalid_date_property");
      }
    } else if (prop) {
      errors.push("unsupported_record_date_property");
    }
  }
  if (!dateResolved) {
    if (fallbacks.allowCreatedTimeAsRecordDate && page.created_time) {
      mapped.recordDate = normalizeDateString(page.created_time);
      mapped.startDate = mapped.recordDate;
      warnings.push("used_created_time_as_record_date");
      dateResolved = true;
    } else if (fallbacks.allowLastEditedTimeAsRecordDate && page.last_edited_time) {
      mapped.recordDate = normalizeDateString(page.last_edited_time);
      mapped.startDate = mapped.recordDate;
      warnings.push("used_last_edited_time_as_record_date");
      dateResolved = true;
    }
  }
  if (!dateResolved || !mapped.recordDate) {
    if (!errors.includes("missing_record_date") && !errors.includes("invalid_date_property")) {
      errors.push("missing_record_date");
    }
  }

  // optional fields
  if (propertyMap.description) {
    mapped.description = readPlainText(getNotionProperty(page, propertyMap.description));
  }
  if (propertyMap.task) {
    mapped.task = readPlainText(getNotionProperty(page, propertyMap.task));
  }
  if (propertyMap.result) {
    mapped.result = readPlainText(getNotionProperty(page, propertyMap.result));
  }
  if (propertyMap.projectName) {
    const prop = getNotionProperty(page, propertyMap.projectName);
    mapped.projectName = readPlainText(prop) ?? readSelectName(prop);
  }
  if (propertyMap.skillTags) {
    const prop = getNotionProperty(page, propertyMap.skillTags);
    mapped.skillTags = readMultiSelectNames(prop);
    if (prop && prop.type === "relation") warnings.push("relation_saved_as_raw_only");
  }
  if (propertyMap.strengthTags) {
    const prop = getNotionProperty(page, propertyMap.strengthTags);
    mapped.strengthTags = readMultiSelectNames(prop);
    if (prop && prop.type === "relation") warnings.push("relation_saved_as_raw_only");
  }

  return { mapped, errors, warnings };
}

function buildHashInput(mapped) {
  return {
    title:        mapped.title        ?? null,
    recordDate:   mapped.recordDate   ?? null,
    description:  mapped.description  ?? null,
    task:         mapped.task         ?? null,
    result:       mapped.result       ?? null,
    projectName:  mapped.projectName  ?? null,
    skillTags:    [...(mapped.skillTags    ?? [])].sort(),
    strengthTags: [...(mapped.strengthTags ?? [])].sort(),
    startDate:    mapped.startDate    ?? null,
    endDate:      mapped.endDate      ?? null,
    recordType:   mapped.recordType   ?? null,
    workType:     mapped.workType     ?? null,
  };
}

async function sha256Hex(value) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function lookupExternalRecordLinks(userId, pageIds, env) {
  if (!pageIds.length) return new Map();
  const idList = pageIds.join(",");
  const path =
    `/rest/v1/external_record_links` +
    `?user_id=eq.${userId}` +
    `&provider=eq.notion` +
    `&external_record_id=in.(${idList})` +
    `&select=external_record_id,work_record_id,content_hash,sync_status,external_updated_at`;
  let resp;
  try {
    resp = await supabaseRest(env, path, { method: "GET" });
  } catch (_) {
    return null;
  }
  if (!resp.ok) return null;
  let rows;
  try { rows = await resp.json(); } catch (_) { return null; }
  const map = new Map();
  for (const row of (rows ?? [])) {
    map.set(row.external_record_id, {
      workRecordId: row.work_record_id,
      contentHash:  row.content_hash,
      syncStatus:   row.sync_status,
      externalUpdatedAt: row.external_updated_at,
    });
  }
  return map;
}

async function handleNotionPreview(request, env, body) {
  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    const code = authResult.error === 401 ? "unauthorized" : "config_missing";
    return jsonStatus({ ok: false, error: authResult.message, code }, authResult.error);
  }
  const userId = authResult.user.id;

  const dataSourceId = (body?.dataSourceId ?? "").toString().trim();
  const databaseId   = body?.databaseId ?? null;
  const propertyMap  = body?.propertyMap ?? {};
  const defaults = {
    recordType: body?.defaults?.recordType ?? "weekly",
    workType:   body?.defaults?.workType   ?? "이번 주 기록",
  };
  const fallbacks = {
    allowCreatedTimeAsRecordDate:    body?.fallbacks?.allowCreatedTimeAsRecordDate    === true,
    allowLastEditedTimeAsRecordDate: body?.fallbacks?.allowLastEditedTimeAsRecordDate === true,
  };
  const limit = Math.min(50, Math.max(1, parseInt(body?.limit ?? "50", 10) || 50));

  if (!dataSourceId) {
    return jsonStatus({ ok: false, error: "dataSourceId is required", code: "missing_data_source_id" }, 400);
  }
  if (!propertyMap.title) {
    return jsonStatus({ ok: false, error: "propertyMap.title is required", code: "invalid_property_map" }, 400);
  }
  if (!propertyMap.recordDate && !fallbacks.allowCreatedTimeAsRecordDate && !fallbacks.allowLastEditedTimeAsRecordDate) {
    return jsonStatus({ ok: false, error: "propertyMap.recordDate is required when no date fallback is enabled", code: "invalid_property_map" }, 400);
  }

  const conn = await getActiveNotionConnection(userId, env).catch(() => null);
  if (!conn) {
    return jsonStatus({ ok: false, error: "Notion is not connected", code: "notion_not_connected" }, 409);
  }
  let token;
  try { token = await decryptSecret(conn.access_token_enc, env); }
  catch (_) { return jsonStatus({ ok: false, error: "Worker config missing: TOKEN_ENCRYPTION_KEY", code: "config_missing" }, 500); }

  const queryBody = {
    page_size: limit,
  };

  let notionResp;
  try {
    notionResp = await notionFetch(
      `/v1/data_sources/${encodeURIComponent(dataSourceId)}/query`,
      token,
      { method: "POST", body: JSON.stringify(queryBody) }
    );
  } catch (_) {
    return jsonStatus({ ok: false, error: "Notion API unreachable", code: "notion_api_error" }, 502);
  }

  if (notionResp.status === 401 || notionResp.status === 403) {
    return jsonStatus({ ok: false, error: "Notion access denied", code: "notion_access_denied" }, 502);
  }
  if (notionResp.status === 404) {
    return jsonStatus({ ok: false, error: "Source not found", code: "notion_source_not_found" }, 404);
  }
  if (!notionResp.ok) {
    return jsonStatus({ ok: false, error: "Notion API error", code: "notion_api_error" }, 502);
  }

  let notionData;
  try { notionData = await notionResp.json(); }
  catch (_) { return jsonStatus({ ok: false, error: "Notion API returned invalid response", code: "notion_api_error" }, 502); }

  const pages = notionData?.results ?? [];

  // Normalize each page
  const normalizedPages = [];
  for (const page of pages) {
    let mapped, errors, warnings;
    try {
      ({ mapped, errors, warnings } = extractMappedFieldsFromPage(page, propertyMap, defaults, fallbacks));
    } catch (_) {
      errors = ["notion_page_parse_failed"];
      warnings = [];
      mapped = {
        title: null, recordDate: null, description: null, task: null, result: null,
        projectName: null, skillTags: [], strengthTags: [],
        startDate: null, endDate: null,
        recordType: defaults.recordType, workType: defaults.workType,
      };
    }
    const contentHash = errors.length === 0
      ? await sha256Hex(JSON.stringify(buildHashInput(mapped)))
      : null;
    normalizedPages.push({
      pageId:        page.id,
      url:           page.url           ?? null,
      createdTime:   page.created_time  ?? null,
      lastEditedTime: page.last_edited_time ?? null,
      mapped, errors, warnings, contentHash,
    });
  }

  // Lookup existing import records
  const pageIds = normalizedPages.map(p => p.pageId);
  const lookupMap = await lookupExternalRecordLinks(userId, pageIds, env);
  if (lookupMap === null) {
    return jsonStatus({ ok: false, error: "Failed to load import status", code: "supabase_error" }, 502);
  }

  // Build response
  const summary = { total: 0, new: 0, duplicate: 0, pendingUpdate: 0, invalid: 0, previouslyImportedDeleted: 0 };
  const items = [];

  for (const p of normalizedPages) {
    let status, link = null, commitEligible = false;

    if (p.errors.length > 0) {
      status = "invalid";
    } else {
      const existing = lookupMap.get(p.pageId);
      if (!existing) {
        status = "new";
        commitEligible = true;
      } else if (!existing.workRecordId) {
        status = "previously_imported_deleted";
        link = { workRecordId: null, contentHash: existing.contentHash, syncStatus: existing.syncStatus, externalUpdatedAt: existing.externalUpdatedAt };
      } else if (existing.contentHash === p.contentHash) {
        status = "duplicate";
        link = { workRecordId: existing.workRecordId, contentHash: existing.contentHash, syncStatus: existing.syncStatus, externalUpdatedAt: existing.externalUpdatedAt };
      } else {
        status = "pending_update";
        link = { workRecordId: existing.workRecordId, contentHash: existing.contentHash, syncStatus: existing.syncStatus, externalUpdatedAt: existing.externalUpdatedAt };
      }
    }

    summary.total++;
    if (status === "new")                       summary.new++;
    else if (status === "duplicate")            summary.duplicate++;
    else if (status === "pending_update")       summary.pendingUpdate++;
    else if (status === "invalid")              summary.invalid++;
    else if (status === "previously_imported_deleted") summary.previouslyImportedDeleted++;

    items.push({
      previewId: `notion:${p.pageId}`,
      status,
      commitEligible,
      external: {
        pageId:        p.pageId,
        dataSourceId,
        databaseId:    databaseId ?? null,
        url:           p.url,
        createdTime:   p.createdTime,
        lastEditedTime: p.lastEditedTime,
      },
      mapped:     p.mapped,
      validation: { errors: p.errors, warnings: p.warnings },
      contentHash: p.contentHash,
      link,
    });
  }

  return json({ ok: true, summary, items });
}

// ── Round 7-G1-B ─────────────────────────────────────────────────────────────
// POST /api/notion/commit
// Server re-validates every page (re-queries Notion + re-checks DB) before
// calling the SQL RPC. This prevents the frontend from forcing commits by
// submitting stale preview data.
// ─────────────────────────────────────────────────────────────────────────────
async function handleNotionCommit(request, env, body) {
  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    const code = authResult.error === 401 ? "unauthorized" : "config_missing";
    return jsonStatus({ ok: false, error: authResult.message, code }, authResult.error);
  }
  const userId = authResult.user.id;

  const dataSourceId = (body?.dataSourceId ?? "").toString().trim();
  const propertyMap  = body?.propertyMap ?? {};
  const defaults = {
    recordType: body?.defaults?.recordType ?? "weekly",
    workType:   body?.defaults?.workType   ?? "이번 주 기록",
  };
  const fallbacks = {
    allowCreatedTimeAsRecordDate:    body?.fallbacks?.allowCreatedTimeAsRecordDate    === true,
    allowLastEditedTimeAsRecordDate: body?.fallbacks?.allowLastEditedTimeAsRecordDate === true,
  };
  const limit = Math.min(50, Math.max(1, parseInt(body?.limit ?? "50", 10) || 50));
  // Optional: only commit pages whose previewId appears in this list.
  // Absent / null = commit all eligible new pages.
  const selectedPreviewIds = Array.isArray(body?.selectedPreviewIds)
    ? new Set(body.selectedPreviewIds)
    : null;

  if (!dataSourceId) {
    return jsonStatus({ ok: false, error: "dataSourceId is required", code: "missing_data_source_id" }, 400);
  }
  if (!propertyMap.title) {
    return jsonStatus({ ok: false, error: "propertyMap.title is required", code: "invalid_property_map" }, 400);
  }
  if (!propertyMap.recordDate && !fallbacks.allowCreatedTimeAsRecordDate && !fallbacks.allowLastEditedTimeAsRecordDate) {
    return jsonStatus({ ok: false, error: "propertyMap.recordDate is required when no date fallback is enabled", code: "invalid_property_map" }, 400);
  }

  const conn = await getActiveNotionConnection(userId, env).catch(() => null);
  if (!conn) {
    return jsonStatus({ ok: false, error: "Notion is not connected", code: "notion_not_connected" }, 409);
  }
  let token;
  try { token = await decryptSecret(conn.access_token_enc, env); }
  catch (_) { return jsonStatus({ ok: false, error: "Worker config missing: TOKEN_ENCRYPTION_KEY", code: "config_missing" }, 500); }

  // ── Step 1: Re-query Notion ───────────────────────────────────────────────
  let notionResp;
  try {
    notionResp = await notionFetch(
      `/v1/data_sources/${encodeURIComponent(dataSourceId)}/query`,
      token,
      { method: "POST", body: JSON.stringify({ page_size: limit }) }
    );
  } catch (_) {
    return jsonStatus({ ok: false, error: "Notion API unreachable", code: "notion_api_error" }, 502);
  }
  if (notionResp.status === 401 || notionResp.status === 403) {
    return jsonStatus({ ok: false, error: "Notion access denied", code: "notion_access_denied" }, 502);
  }
  if (notionResp.status === 404) {
    return jsonStatus({ ok: false, error: "Source not found", code: "notion_source_not_found" }, 404);
  }
  if (!notionResp.ok) {
    return jsonStatus({ ok: false, error: "Notion API error", code: "notion_api_error" }, 502);
  }
  let notionData;
  try { notionData = await notionResp.json(); }
  catch (_) { return jsonStatus({ ok: false, error: "Notion API returned invalid response", code: "notion_api_error" }, 502); }

  const pages = notionData?.results ?? [];

  // ── Step 2: Normalize all pages ───────────────────────────────────────────
  const normalizedPages = [];
  for (const page of pages) {
    let mapped, errors, warnings;
    try {
      ({ mapped, errors, warnings } = extractMappedFieldsFromPage(page, propertyMap, defaults, fallbacks));
    } catch (_) {
      errors = ["notion_page_parse_failed"];
      warnings = [];
      mapped = {
        title: null, recordDate: null, description: null, task: null, result: null,
        projectName: null, skillTags: [], strengthTags: [],
        startDate: null, endDate: null,
        recordType: defaults.recordType, workType: defaults.workType,
      };
    }
    const contentHash = errors.length === 0
      ? await sha256Hex(JSON.stringify(buildHashInput(mapped)))
      : null;
    normalizedPages.push({ pageId: page.id, url: page.url ?? null, createdTime: page.created_time ?? null, lastEditedTime: page.last_edited_time ?? null, databaseId: page.parent?.database_id ?? null, mapped, errors, warnings, contentHash });
  }

  // ── Step 3: Re-check existing import records ──────────────────────────────
  const pageIds = normalizedPages.map(p => p.pageId);
  const lookupMap = await lookupExternalRecordLinks(userId, pageIds, env);
  if (lookupMap === null) {
    return jsonStatus({ ok: false, error: "Failed to load import status", code: "supabase_error" }, 502);
  }

  // ── Step 4: Determine per-page status and collect eligible items ──────────
  const eligibleItems = [];
  const skippedItems  = [];

  for (const p of normalizedPages) {
    const previewId = `notion:${p.pageId}`;
    if (p.errors.length > 0) {
      skippedItems.push({ previewId, status: "skipped_invalid" });
      continue;
    }
    const existing = lookupMap.get(p.pageId);
    if (existing) {
      if (existing.workRecordId && existing.contentHash !== p.contentHash) {
        skippedItems.push({ previewId, status: "skipped_pending_update" });
      } else if (existing.workRecordId) {
        skippedItems.push({ previewId, status: "skipped_duplicate" });
      } else {
        skippedItems.push({ previewId, status: "skipped_previously_imported_deleted" });
      }
      continue;
    }
    // Page is new — honour selectedPreviewIds filter if provided
    if (selectedPreviewIds !== null && !selectedPreviewIds.has(previewId)) {
      skippedItems.push({ previewId, status: "skipped_not_selected" });
      continue;
    }
    eligibleItems.push(p);
  }

  // ── Step 5: Commit eligible items via SQL RPC ─────────────────────────────
  const rpcResults = await Promise.allSettled(
    eligibleItems.map(async (p) => {
      const workRecordPayload = {
        record_date:   p.mapped.recordDate,
        title:         p.mapped.title,
        description:   p.mapped.description   ?? null,
        task:          p.mapped.task           ?? null,
        result:        p.mapped.result         ?? null,
        project_name:  p.mapped.projectName    ?? null,
        skill_tags:    p.mapped.skillTags      ?? [],
        strength_tags: p.mapped.strengthTags   ?? [],
        work_type:     p.mapped.workType       ?? defaults.workType,
        visibility:    "private",
        raw_payload: {
          startDate:  p.mapped.startDate  ?? null,
          endDate:    p.mapped.endDate    ?? null,
          recordType: p.mapped.recordType ?? defaults.recordType,
          workType:   p.mapped.workType   ?? defaults.workType,
          notion: {
            page_id:          p.pageId,
            data_source_id:   dataSourceId,
            database_id:      p.databaseId ?? null,
            url:              p.url,
            created_time:     p.createdTime,
            last_edited_time: p.lastEditedTime,
            property_map:     propertyMap,
            imported_at:      new Date().toISOString(),
            content_hash:     p.contentHash,
            validation: { errors: p.errors, warnings: p.warnings },
          },
        },
      };
      const externalLinkPayload = {
        external_source_id:  dataSourceId,
        external_updated_at: p.lastEditedTime ?? "",
        raw_meta: {
          page_id:          p.pageId,
          data_source_id:   dataSourceId,
          database_id:      p.databaseId ?? null,
          url:              p.url,
          title:            p.mapped.title ?? null,
          last_edited_time: p.lastEditedTime,
        },
      };
      const rpcBody = {
        p_user_id:               userId,
        p_external_record_id:    p.pageId,
        p_content_hash:          p.contentHash,
        p_work_record_payload:   workRecordPayload,
        p_external_link_payload: externalLinkPayload,
      };
      let resp;
      try {
        resp = await supabaseRest(env, "/rest/v1/rpc/import_notion_work_record", {
          method: "POST",
          body:   JSON.stringify(rpcBody),
          headers: { Prefer: "return=representation" },
        });
      } catch (e) {
        throw new Error(`supabase_unreachable: ${e.message}`);
      }
      let rpcData;
      try { rpcData = await resp.json(); } catch (_) { rpcData = null; }
      if (!resp.ok || !rpcData?.ok) {
        throw Object.assign(new Error(rpcData?.message ?? "rpc_failed"), { rpcData });
      }
      return { previewId: `notion:${p.pageId}`, rpcData };
    })
  );

  // ── Step 6: Build summary + results ──────────────────────────────────────
  // total = all pages re-fetched from Notion this call
  // requested = pages considered for commit (selectedPreviewIds if provided, else total)
  // skipped_not_selected is an extension field (not in contract §12) for audit
  const summary = {
    total:                              normalizedPages.length,
    requested:                          selectedPreviewIds !== null ? selectedPreviewIds.size : normalizedPages.length,
    committed:                          0,
    skipped_duplicate:                  0,
    skipped_pending_update:             0,
    skipped_invalid:                    0,
    skipped_previously_imported_deleted: 0,
    skipped_not_selected:               0,
    failed:                             0,
  };
  for (const s of skippedItems) {
    const key = s.status;
    if (key in summary) summary[key]++;
  }

  const results = [];
  for (let i = 0; i < rpcResults.length; i++) {
    const settled = rpcResults[i];
    const pageId    = eligibleItems[i].pageId;
    const previewId = `notion:${pageId}`;
    if (settled.status === "fulfilled") {
      const { rpcData } = settled.value;
      if (rpcData.status === "committed") {
        summary.committed++;
        results.push({ previewId, external_record_id: pageId, status: "committed", work_record_id: rpcData.work_record_id, link_id: rpcData.link_id });
      } else if (rpcData.status === "skipped_duplicate") {
        summary.skipped_duplicate++;
        results.push({ previewId, external_record_id: pageId, status: "skipped_duplicate", work_record_id: null, link_id: null });
      } else {
        summary.failed++;
        results.push({ previewId, external_record_id: pageId, status: "failed", error: rpcData.message ?? "unknown" });
      }
    } else {
      summary.failed++;
      results.push({ previewId, external_record_id: pageId, status: "failed", error: settled.reason?.message ?? "unknown" });
    }
  }
  // Append skipped items to results for full audit trail
  for (const s of skippedItems) {
    results.push({ previewId: s.previewId, external_record_id: s.previewId.slice(7), status: s.status });
  }

  return json({ ok: true, summary, results });
}

// ============================================================
// Google Calendar OAuth helpers — CAL-5B
// ============================================================

/**
 * Build an AES-GCM-encrypted OAuth state string for Google Calendar.
 * Mirrors buildNotionOAuthState. provider field identifies this as Google Calendar.
 */
async function buildGoogleCalendarOAuthState(userId, env) {
  const issuedAt = Date.now();
  const expiresAt = issuedAt + 10 * 60 * 1000;
  const nonce = crypto?.randomUUID ? crypto.randomUUID() : _bytesToB64(crypto.getRandomValues(new Uint8Array(16)));
  const payload = {
    provider: "google_calendar",
    purpose: "oauth",
    userId,
    nonce,
    issuedAt,
    expiresAt,
  };
  return encryptSecret(JSON.stringify(payload), env);
}

/**
 * Build the Google OAuth 2.0 authorization URL.
 * access_type=offline + prompt=consent ensures refresh_token is issued on every auth.
 * scope=calendar is required for CAL-6 dedicated calendar creation.
 * Scope narrowing to calendar.events is possible post-CAL-6 if calendar creation is skipped.
 */
async function buildGoogleCalendarAuthUrl(user, env) {
  const encryptedState = await buildGoogleCalendarOAuthState(user.id, env);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: env.GOOGLE_CALENDAR_REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: encryptedState,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Route handler for POST /api/calendar/google/connect/start.
 * Verifies Supabase JWT, builds Google OAuth URL, returns it as JSON.
 * Mirrors handleNotionAuthUrl pattern exactly.
 */
async function handleGoogleCalendarConnectStart(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CALENDAR_REDIRECT_URI) missing.push("GOOGLE_CALENDAR_REDIRECT_URI");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_google_oauth_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }

  let authUrl;
  try {
    authUrl = await buildGoogleCalendarAuthUrl(authResult.user, env);
  } catch (_) {
    return jsonStatus({ ok: false, error: "Failed to generate Google OAuth authorization URL" }, 500);
  }

  return json({ ok: true, authUrl, expiresInSeconds: 600 });
}

/**
 * Validate the encrypted Google Calendar OAuth state parameter.
 * Mirrors validateNotionOAuthState. Checks provider === "google_calendar".
 */
async function validateGoogleCalendarOAuthState(state, env) {
  let plaintext;
  try {
    plaintext = await decryptSecret(state, env);
  } catch (_) {
    return { ok: false, reason: "state_decrypt_failed" };
  }

  let payload;
  try {
    payload = JSON.parse(plaintext);
  } catch (_) {
    return { ok: false, reason: "state_parse_failed" };
  }

  if (payload.provider !== "google_calendar" || payload.purpose !== "oauth") {
    return { ok: false, reason: "state_invalid_purpose" };
  }
  if (!payload.userId || typeof payload.userId !== "string") {
    return { ok: false, reason: "state_missing_userId" };
  }
  if (!payload.expiresAt || Date.now() > payload.expiresAt) {
    return { ok: false, reason: "state_expired" };
  }
  if (!payload.nonce || typeof payload.nonce !== "string") {
    return { ok: false, reason: "state_missing_nonce" };
  }
  if (typeof payload.issuedAt === "number" && payload.issuedAt > Date.now() + 60_000) {
    return { ok: false, reason: "state_issued_in_future" };
  }

  return { ok: true, payload };
}

/**
 * Exchange Google authorization code for access + refresh tokens.
 * Google uses form-encoded POST — different from Notion's Basic Auth + JSON.
 * refresh_token is only issued when access_type=offline + prompt=consent.
 */
async function exchangeGoogleCodeForToken(code, env) {
  let resp;
  try {
    const body = new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_CALENDAR_REDIRECT_URI,
      grant_type: "authorization_code",
    });
    resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch (err) {
    return { ok: false, reason: `google_token_fetch_error: ${err.message}` };
  }

  const data = await resp.json();
  if (!resp.ok) {
    return { ok: false, reason: data.error ?? "google_token_exchange_failed" };
  }

  return { ok: true, data };
}

/**
 * Upsert Google Calendar connection into google_calendar_connections.
 * access_token and refresh_token are AES-GCM encrypted via encryptSecret.
 * provider_account_email is null — calendar scope does not yield email/profile claims.
 * On conflict (user_id), existing row is overwritten (merge-duplicates).
 * If refresh_token is absent (should not happen with prompt=consent), status = "token_partial".
 */
async function upsertGoogleCalendarConnection(tokenData, userId, env) {
  let accessTokenEnc;
  try {
    accessTokenEnc = await encryptSecret(tokenData.access_token, env);
  } catch (_) {
    return { ok: false, reason: "access_token_encrypt_failed" };
  }

  let refreshTokenEnc = null;
  if (tokenData.refresh_token) {
    try {
      refreshTokenEnc = await encryptSecret(tokenData.refresh_token, env);
    } catch (_) {
      return { ok: false, reason: "refresh_token_encrypt_failed" };
    }
  }

  const tokenExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  const now = new Date().toISOString();
  const row = {
    user_id: userId,
    provider: "google",
    provider_account_email: null,
    scope: tokenData.scope ?? null,
    access_token_enc: accessTokenEnc,
    refresh_token_enc: refreshTokenEnc,
    token_expires_at: tokenExpiresAt,
    status: refreshTokenEnc ? "connected" : "token_partial",
    connected_at: now,
    updated_at: now,
  };

  const result = await supabaseRest(
    env,
    "/rest/v1/google_calendar_connections?on_conflict=user_id",
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(row),
    }
  );

  if (!result.ok) {
    return { ok: false, reason: `upsert_failed_status: ${result.status}` };
  }

  return { ok: true, hasRefreshToken: !!refreshTokenEnc };
}

/**
 * Route handler for GET /api/calendar/google/oauth/callback.
 * Google redirects here after the user grants or denies consent.
 * Returns an HTML close-window page — mirrors Notion callback pattern exactly.
 * No frontend redirect URL is needed; the popup window self-closes.
 */
async function handleGoogleCalendarCallback(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.GOOGLE_CALENDAR_REDIRECT_URI) missing.push("GOOGLE_CALENDAR_REDIRECT_URI");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return htmlResponse("Configuration Error", "Worker secrets not configured.", 500);
  }

  const url = new URL(request.url);
  const googleError = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (googleError) {
    const desc = url.searchParams.get("error_description") ?? googleError;
    return htmlResponse("Connection Cancelled", `Google declined the request: ${desc}`, 400);
  }
  if (!code || !state) {
    return htmlResponse("Invalid Request", "Missing required OAuth parameters.", 400);
  }

  const stateResult = await validateGoogleCalendarOAuthState(state, env);
  if (!stateResult.ok) {
    return htmlResponse("Connection Failed", `Invalid or expired authorization state (${stateResult.reason}). Please try again.`, 400);
  }

  const userId = stateResult.payload.userId;

  const tokenResult = await exchangeGoogleCodeForToken(code, env);
  if (!tokenResult.ok) {
    return htmlResponse("Connection Failed", `Could not exchange authorization code (${tokenResult.reason}). Please try again.`, 502);
  }

  const upsertResult = await upsertGoogleCalendarConnection(tokenResult.data, userId, env);
  if (!upsertResult.ok) {
    return htmlResponse("Connection Failed", `Could not save Google Calendar connection (${upsertResult.reason}). Please try again.`, 500);
  }

  if (!upsertResult.hasRefreshToken) {
    return htmlResponse(
      "Google Calendar Connected (Partial)",
      "Connected, but no refresh token was issued. You may need to reconnect after the access token expires (~1 hour). You may close this window."
    );
  }

  return htmlResponse(
    "Google Calendar Connected",
    "Your Google Calendar has been connected to PASSMAP. You may close this window."
  );
}

/**
 * Return a valid Google access_token for the given connection row.
 * Uses the stored access_token if it has more than 5 minutes remaining.
 * Falls back to refreshing via refresh_token when near-expiry or expired.
 * Token values are never logged.
 */
async function getValidGoogleAccessToken(conn, userId, env) {
  if (conn.token_expires_at) {
    const expiresAt = new Date(conn.token_expires_at).getTime();
    if (Date.now() + 5 * 60 * 1000 < expiresAt) {
      try {
        const accessToken = await decryptSecret(conn.access_token_enc, env);
        return { ok: true, accessToken };
      } catch (_) {
        // decrypt failed — fall through to refresh
      }
    }
  }
  if (!conn.refresh_token_enc) {
    return { ok: false, error: "refresh_token_unavailable" };
  }
  return refreshGoogleAccessToken(conn, userId, env);
}

/**
 * Exchange a stored refresh_token for a new access_token and persist the update.
 * Decrypts refresh_token_enc; new access_token is re-encrypted before storage.
 * Refresh token value is never logged.
 */
async function refreshGoogleAccessToken(conn, userId, env) {
  let refreshToken;
  try {
    refreshToken = await decryptSecret(conn.refresh_token_enc, env);
  } catch (_) {
    return { ok: false, error: "refresh_token_decrypt_failed" };
  }

  let tokenData;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });
    tokenData = await res.json();
    if (!res.ok) {
      return { ok: false, error: "token_refresh_failed" };
    }
  } catch (_) {
    return { ok: false, error: "token_refresh_network_error" };
  }

  let newAccessTokenEnc;
  try {
    newAccessTokenEnc = await encryptSecret(tokenData.access_token, env);
  } catch (_) {
    return { ok: false, error: "access_token_encrypt_failed" };
  }

  const newTokenExpiresAt = tokenData.expires_in
    ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    : null;

  const patch = {
    access_token_enc: newAccessTokenEnc,
    token_expires_at: newTokenExpiresAt,
    status: "connected",
    updated_at: new Date().toISOString(),
  };
  // Google may rotate the refresh_token on long-lived sessions — save it if provided
  if (tokenData.refresh_token) {
    try {
      patch.refresh_token_enc = await encryptSecret(tokenData.refresh_token, env);
    } catch (_) { /* keep existing refresh_token_enc */ }
  }

  try {
    await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      }
    );
  } catch (_) {
    // DB update failed but new access token is still usable — proceed
  }

  return { ok: true, accessToken: tokenData.access_token };
}

/**
 * Route handler for POST /api/calendar/google/create-passmap-calendar.
 * Creates (or re-uses) a PASSMAP-dedicated Google Calendar named "PASSMAP 기록".
 * Idempotent: if google_calendar_id is already present in DB, returns it without API call.
 */
async function handleGoogleCalendarCreatePassmapCalendar(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }
  const userId = authResult.user.id;

  // Fetch connection row
  let conn;
  try {
    const connResp = await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!connResp.ok) {
      return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
    }
    const rows = await connResp.json();
    if (!rows?.length) {
      return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
    }
    conn = rows[0];
  } catch (_) {
    return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
  }

  if (!["connected", "token_partial"].includes(conn.status)) {
    return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
  }

  // Idempotency: google_calendar_id already recorded — return without creating a new calendar
  if (conn.google_calendar_id) {
    return json({
      ok: true,
      calendarId: conn.google_calendar_id,
      calendarName: conn.google_calendar_name ?? "PASSMAP 기록",
      created: false,
    });
  }

  // Ensure we have a live access token (refresh if needed)
  const tokenResult = await getValidGoogleAccessToken(conn, userId, env);
  if (!tokenResult.ok) {
    return jsonStatus({ ok: false, error: tokenResult.error }, 502);
  }

  // Create PASSMAP-dedicated Google Calendar
  let calendarData;
  try {
    const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenResult.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: "PASSMAP 기록",
        description: "PASSMAP에서 저장한 업무 기록을 모아두는 전용 캘린더입니다.",
        timeZone: "Asia/Seoul",
      }),
    });
    calendarData = await calRes.json();
    if (!calRes.ok) {
      return jsonStatus({ ok: false, error: "google_calendar_create_failed" }, 502);
    }
  } catch (_) {
    return jsonStatus({ ok: false, error: "google_calendar_create_failed" }, 502);
  }

  // Persist google_calendar_id to DB
  try {
    await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          google_calendar_id: calendarData.id,
          google_calendar_name: calendarData.summary,
          google_calendar_created_by_passmap: true,
          updated_at: new Date().toISOString(),
        }),
      }
    );
  } catch (_) {
    return jsonStatus({ ok: false, error: "google_calendar_save_failed" }, 500);
  }

  return json({
    ok: true,
    calendarId: calendarData.id,
    calendarName: calendarData.summary,
    created: true,
  });
}

// ─── CAL-7B: sync-record helpers ─────────────────────────────────────────────

/**
 * Return the ISO date of the day after isoDate ("YYYY-MM-DD").
 * Used for all-day event end.date (Google Calendar requires exclusive end).
 */
function _calNextIsoDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

const PASSMAP_CALENDAR_EVENT_SUMMARY_FALLBACK = "업무 기록 요약";
const PASSMAP_CALENDAR_EVENT_SUMMARY_GENERIC_PARTS = new Set([
  "PASSMAP",
  "업무 기록",
  "기록",
  "이번 주 기록",
  "팀 프로젝트 기록",
  "개인 업무 기록",
  "기록한 업무를 정리했습니다.",
  "이번 주 기록을 정리했습니다.",
  "팀 프로젝트 기록을 정리했습니다.",
]);

function truncateCalendarSummary(value, maxLength = 36) {
  const text = String(value || "").trim();
  const chars = Array.from(text);
  if (chars.length <= maxLength) return text;
  return `${chars.slice(0, Math.max(0, maxLength - 1)).join("").trim()}…`;
}

function normalizeCalendarSummaryPart(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeCalendarSummaryPart(item))
      .filter(Boolean)
      .join(" ");
  }

  const text = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s•*-]+/, "")
    .trim();
  if (!text || /^PASSMAP\b/i.test(text)) return "";
  if (PASSMAP_CALENDAR_EVENT_SUMMARY_GENERIC_PARTS.has(text)) return "";
  return truncateCalendarSummary(text);
}

function _pushCalendarSummaryPart(parts, seen, value) {
  const part = normalizeCalendarSummaryPart(value);
  if (!part) return;

  const key = part.toLowerCase();
  if (seen.has(key)) return;
  if (parts.some((existing) => existing.includes(part) || part.includes(existing))) return;

  seen.add(key);
  parts.push(part);
}

function buildPassmapCalendarEventSummary(recordLike) {
  const record = recordLike && typeof recordLike === "object" ? recordLike : {};
  const raw =
    record.raw_payload && typeof record.raw_payload === "object"
      ? record.raw_payload
      : {};
  const parts = [];
  const seen = new Set();

  [
    record.title,
    record.task,
    raw.projectActions,
    record.description,
    raw.text,
    record.result,
    raw.projectResult,
    record.project_name,
    raw.projectName,
    raw.projectGoal,
    raw.resumeSentence,
    raw.reflectedSentence,
  ].forEach((value) => _pushCalendarSummaryPart(parts, seen, value));

  if (parts.length === 0) {
    [
      record.strength_tags,
      record.skill_tags,
      raw.roleTags,
      raw.resultTags,
      raw.collaborationTags,
    ].forEach((value) => _pushCalendarSummaryPart(parts, seen, value));
  }

  const baseSummary = parts.slice(0, 3).join(" · ") || PASSMAP_CALENDAR_EVENT_SUMMARY_FALLBACK;
  return `${baseSummary} | PASSMAP`;
}

/**
 * Build the Google Calendar event description from a work_records row.
 * Structure mirrors calendarExport.js buildPassmapDailyCalendarEvents description.
 * raw_payload is already parsed JSON when returned by Supabase PostgREST.
 */
function buildGoogleCalendarEventDescription(record) {
  const raw =
    record.raw_payload && typeof record.raw_payload === "object"
      ? record.raw_payload
      : {};

  const contentLine = String(
    record.description || raw.text || raw.projectActions || record.title || ""
  ).trim();

  const resumeSentence = String(
    raw.resumeSentence || raw.reflectedSentence || record.result || ""
  ).trim();

  const tags = Array.isArray(record.strength_tags) ? record.strength_tags : [];

  const lines = ["[PASSMAP 업무 기록]"];
  if (contentLine) lines.push(`• ${contentLine}`);

  if (resumeSentence) {
    lines.push("", "[이력서 문장]");
    lines.push(resumeSentence);
  }

  if (tags.length > 0) {
    lines.push("", "[태그]");
    lines.push(
      tags
        .map((t) => `#${String(t).trim()}`)
        .filter(Boolean)
        .join(" ")
    );
  }

  return lines.join("\n");
}

function buildGoogleCalendarEventPayload(record) {
  const recordDate = String(record.record_date || "").trim().slice(0, 10);
  const endDate = _calNextIsoDate(recordDate);
  return {
    summary: buildPassmapCalendarEventSummary(record),
    description: buildGoogleCalendarEventDescription(record),
    start: { date: recordDate },
    end: { date: endDate },
    visibility: "private",
    transparency: "transparent",
    extendedProperties: {
      private: {
        passmapRecordId: String(record.id || ""),
        passmapSyncType: "single_record",
      },
    },
  };
}

/**
 * PATCH work_records sync fields after a sync attempt.
 * Errors are swallowed — the caller already handled the user-facing response.
 */
async function _patchWorkRecordSyncStatus(env, recordId, status, errorCode, eventId) {
  const patch = {
    google_calendar_sync_status: status,
    google_calendar_sync_error: errorCode ?? null,
  };
  if (status === "synced") {
    patch.google_calendar_synced_at = new Date().toISOString();
    if (eventId) patch.google_calendar_event_id = eventId;
  }
  try {
    await supabaseRest(
      env,
      `/rest/v1/work_records?id=eq.${encodeURIComponent(recordId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(patch),
      }
    );
  } catch (_) { /* non-fatal — PASSMAP record is always preserved */ }
}

/**
 * Route handler for POST /api/calendar/google/sync-record.
 * Inserts a single work_record as an all-day event into the PASSMAP-dedicated Google Calendar.
 * Idempotent: if google_calendar_event_id is already set, returns skipped without API call.
 * PASSMAP record is never modified on Google Calendar failure.
 */
async function handleGoogleCalendarSyncRecord(request, env, body) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }
  const userId = authResult.user.id;

  // Input validation
  const recordId = body?.recordId;
  if (!recordId || typeof recordId !== "string") {
    return jsonStatus({ ok: false, error: "missing_record_id" }, 400);
  }

  // Fetch work_records row — user_id filter enforces ownership
  let record;
  try {
    const resp = await supabaseRest(
      env,
      `/rest/v1/work_records?id=eq.${encodeURIComponent(recordId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!resp.ok) {
      return jsonStatus({ ok: false, error: "record_not_found" }, 400);
    }
    const rows = await resp.json();
    if (!rows?.length) {
      return jsonStatus({ ok: false, error: "record_not_found" }, 400);
    }
    record = rows[0];
  } catch (_) {
    return jsonStatus({ ok: false, error: "record_not_found" }, 400);
  }

  // Validate record_date
  const recordDate = String(record.record_date || "").trim().slice(0, 10);
  if (!recordDate || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
    return jsonStatus({ ok: false, error: "missing_record_date" }, 400);
  }

  // Idempotency: already synced — do not create a duplicate event
  if (record.google_calendar_event_id) {
    return json({ ok: true, skipped: true, reason: "already_synced" });
  }

  // Fetch Google Calendar connection
  let conn;
  try {
    const connResp = await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!connResp.ok) {
      return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
    }
    const rows = await connResp.json();
    if (!rows?.length) {
      return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
    }
    conn = rows[0];
  } catch (_) {
    return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
  }

  if (!["connected", "token_partial"].includes(conn.status)) {
    return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
  }

  if (!conn.google_calendar_id) {
    return jsonStatus({ ok: false, error: "google_calendar_not_ready" }, 400);
  }

  // Mark sync as pending
  await _patchWorkRecordSyncStatus(env, recordId, "pending", null, null);

  // Ensure valid access token (refresh if needed)
  const tokenResult = await getValidGoogleAccessToken(conn, userId, env);
  if (!tokenResult.ok) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", tokenResult.error, null);
    return jsonStatus({ ok: false, error: tokenResult.error }, 502);
  }

  // Build Google Calendar event
  const eventPayload = buildGoogleCalendarEventPayload(record);

  // Insert event into PASSMAP-dedicated calendar
  let eventData;
  try {
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.google_calendar_id)}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );
    eventData = await calRes.json();
    if (!calRes.ok) {
      await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_insert_failed", null);
      return jsonStatus({ ok: false, error: "google_calendar_event_insert_failed" }, 502);
    }
  } catch (_) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_insert_failed", null);
    return jsonStatus({ ok: false, error: "google_calendar_event_insert_failed" }, 502);
  }

  // Persist event id and mark synced
  await _patchWorkRecordSyncStatus(env, recordId, "synced", null, eventData.id);

  return json({ ok: true, eventId: eventData.id, status: "synced" });
}

/**
 * Route handler for POST /api/calendar/google/update-record-event.
 * Patches an existing Google Calendar event from the latest work_records row.
 * The client sends only recordId; event id stays server-side.
 */
async function handleGoogleCalendarUpdateRecordEvent(request, env, body) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }
  const userId = authResult.user.id;

  const recordId = body?.recordId;
  if (!recordId || typeof recordId !== "string") {
    return jsonStatus({ ok: false, error: "missing_record_id" }, 400);
  }

  let record;
  try {
    const resp = await supabaseRest(
      env,
      `/rest/v1/work_records?id=eq.${encodeURIComponent(recordId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!resp.ok) {
      return jsonStatus({ ok: false, error: "record_not_found" }, 404);
    }
    const rows = await resp.json();
    if (!rows?.length) {
      return jsonStatus({ ok: false, error: "record_not_found" }, 404);
    }
    record = rows[0];
  } catch (_) {
    return jsonStatus({ ok: false, error: "record_not_found" }, 404);
  }

  if (!record.google_calendar_event_id) {
    return json({ ok: true, status: "skipped", reason: "missing_event_id" });
  }

  const recordDate = String(record.record_date || "").trim().slice(0, 10);
  if (!recordDate || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", "missing_record_date", null);
    return jsonStatus({ ok: false, error: "missing_record_date" }, 400);
  }

  let conn;
  try {
    const connResp = await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!connResp.ok) {
      await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_not_connected", null);
      return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
    }
    const rows = await connResp.json();
    if (!rows?.length) {
      await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_not_connected", null);
      return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
    }
    conn = rows[0];
  } catch (_) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_not_connected", null);
    return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
  }

  if (!["connected", "token_partial"].includes(conn.status)) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_not_connected", null);
    return jsonStatus({ ok: false, error: "google_calendar_not_connected" }, 400);
  }

  if (!conn.google_calendar_id) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_not_ready", null);
    return jsonStatus({ ok: false, error: "google_calendar_not_ready" }, 400);
  }

  const tokenResult = await getValidGoogleAccessToken(conn, userId, env);
  if (!tokenResult.ok) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", tokenResult.error, null);
    return jsonStatus({ ok: false, error: tokenResult.error }, 502);
  }

  const eventPayload = buildGoogleCalendarEventPayload(record);
  try {
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.google_calendar_id)}/events/${encodeURIComponent(record.google_calendar_event_id)}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      }
    );
    if (!calRes.ok) {
      await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_update_failed", null);
      return jsonStatus({ ok: false, error: "google_calendar_event_update_failed" }, 502);
    }
  } catch (_) {
    await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_update_failed", null);
    return jsonStatus({ ok: false, error: "google_calendar_event_update_failed" }, 502);
  }

  await _patchWorkRecordSyncStatus(env, recordId, "synced", null, null);
  return json({ ok: true, status: "synced", action: "updated" });
}

/**
 * CAL-8F-1: Route handler for POST /api/calendar/google/delete-record-event.
 * Deletes the Google Calendar event linked to a work_record before the row is removed.
 * Client sends only recordId; event id is read server-side from work_records.
 * All Calendar failures return ok:true (skipped/already_missing) — PASSMAP delete must never be blocked.
 */
async function handleGoogleCalendarDeleteRecordEvent(request, env, body) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }
  const userId = authResult.user.id;

  const recordId = body?.recordId;
  if (!recordId || typeof recordId !== "string") {
    return jsonStatus({ ok: false, error: "missing_record_id" }, 400);
  }

  let record;
  try {
    const resp = await supabaseRest(
      env,
      `/rest/v1/work_records?id=eq.${encodeURIComponent(recordId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!resp.ok) {
      return json({ ok: true, status: "skipped", reason: "record_not_found" });
    }
    const rows = await resp.json();
    if (!rows?.length) {
      return json({ ok: true, status: "skipped", reason: "record_not_found" });
    }
    record = rows[0];
  } catch (_) {
    return json({ ok: true, status: "skipped", reason: "record_not_found" });
  }

  if (!record.google_calendar_event_id) {
    return json({ ok: true, status: "skipped", reason: "missing_event_id" });
  }

  let conn;
  try {
    const connResp = await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!connResp.ok) {
      return json({ ok: true, status: "skipped", reason: "google_calendar_not_connected" });
    }
    const rows = await connResp.json();
    if (!rows?.length) {
      return json({ ok: true, status: "skipped", reason: "google_calendar_not_connected" });
    }
    conn = rows[0];
  } catch (_) {
    return json({ ok: true, status: "skipped", reason: "google_calendar_not_connected" });
  }

  if (!["connected", "token_partial"].includes(conn.status)) {
    return json({ ok: true, status: "skipped", reason: "google_calendar_not_connected" });
  }

  if (!conn.google_calendar_id) {
    return json({ ok: true, status: "skipped", reason: "google_calendar_not_ready" });
  }

  const tokenResult = await getValidGoogleAccessToken(conn, userId, env);
  if (!tokenResult.ok) {
    return json({ ok: true, status: "skipped", reason: "token_unavailable" });
  }

  try {
    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.google_calendar_id)}/events/${encodeURIComponent(record.google_calendar_event_id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenResult.accessToken}`,
        },
      }
    );
    if (calRes.status === 404 || calRes.status === 410) {
      return json({ ok: true, status: "already_missing" });
    }
    if (!calRes.ok) {
      return jsonStatus({ ok: false, status: "failed", error: "google_calendar_event_delete_failed" }, 502);
    }
  } catch (_) {
    return jsonStatus({ ok: false, status: "failed", error: "google_calendar_event_delete_failed" }, 502);
  }

  return json({ ok: true, status: "deleted" });
}

/**
 * CAL-8G-1: Route handler for POST /api/calendar/google/disconnect.
 * Sets status="disconnected", nulls access_token_enc and refresh_token_enc.
 * Preserves google_calendar_id and google_calendar_name for easy reconnection.
 * No Google Calendar API call. No Calendar events are deleted.
 * Idempotent: calling when already disconnected or when row is missing returns ok:true.
 */
async function handleGoogleCalendarDisconnect(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }
  const userId = authResult.user.id;

  try {
    const patchResp = await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "disconnected",
          access_token_enc: null,
          refresh_token_enc: null,
          updated_at: new Date().toISOString(),
        }),
      }
    );
    if (!patchResp.ok) {
      return jsonStatus({ ok: false, error: "disconnect_db_failed" }, 502);
    }
  } catch (_) {
    return jsonStatus({ ok: false, error: "disconnect_db_failed" }, 502);
  }

  return json({ ok: true, status: "disconnected" });
}

/**
 * CAL-8H-1: Route handler for POST /api/calendar/google/retry-failed-records.
 * Queries work_records with sync_status="failed" for the authenticated user (max 50).
 * Branches on google_calendar_event_id: null → INSERT, non-null → PATCH.
 * Response contains only summary counters. No eventId/token/calendarId exposed.
 */
async function handleGoogleCalendarRetryFailedRecords(request, env) {
  const missing = [];
  if (!env.SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
  if (!env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
  if (!env.TOKEN_ENCRYPTION_KEY) missing.push("TOKEN_ENCRYPTION_KEY");
  if (missing.length > 0) {
    return jsonStatus({ ok: false, error: `missing_env: ${missing.join(", ")}` }, 500);
  }

  const authResult = await requireSupabaseUser(request, env);
  if (authResult.error) {
    return jsonStatus({ ok: false, error: authResult.message }, authResult.error);
  }
  const userId = authResult.user.id;

  let conn;
  try {
    const connResp = await supabaseRest(
      env,
      `/rest/v1/google_calendar_connections?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
      { method: "GET" }
    );
    if (!connResp.ok) {
      return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "google_calendar_not_connected" });
    }
    const rows = await connResp.json();
    if (!rows?.length) {
      return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "google_calendar_not_connected" });
    }
    conn = rows[0];
  } catch (_) {
    return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "google_calendar_not_connected" });
  }

  if (!["connected", "token_partial"].includes(conn.status)) {
    return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "google_calendar_not_connected" });
  }

  if (!conn.google_calendar_id) {
    return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "google_calendar_not_ready" });
  }

  const tokenResult = await getValidGoogleAccessToken(conn, userId, env);
  if (!tokenResult.ok) {
    return json({ ok: false, total: 0, synced: 0, skipped: 0, failed: 0, error: "google_calendar_token_unavailable" });
  }

  let failedRecords;
  try {
    const recResp = await supabaseRest(
      env,
      `/rest/v1/work_records?user_id=eq.${encodeURIComponent(userId)}&google_calendar_sync_status=eq.failed&select=*&limit=50&order=record_date.desc`,
      { method: "GET" }
    );
    if (!recResp.ok) {
      return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "records_fetch_failed" });
    }
    failedRecords = await recResp.json();
  } catch (_) {
    return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "skipped", reason: "records_fetch_failed" });
  }

  if (!Array.isArray(failedRecords) || failedRecords.length === 0) {
    return json({ ok: true, total: 0, synced: 0, skipped: 0, failed: 0, status: "no_failed_records" });
  }

  const total = failedRecords.length;
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  for (const record of failedRecords) {
    const recordId = record.id;
    const recordDate = String(record.record_date || "").trim().slice(0, 10);

    if (!recordDate || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) {
      await _patchWorkRecordSyncStatus(env, recordId, "failed", "missing_record_date", null);
      skipped++;
      continue;
    }

    const eventPayload = buildGoogleCalendarEventPayload(record);
    const existingEventId = record.google_calendar_event_id ?? null;

    try {
      if (!existingEventId) {
        // Type 1: no eventId — INSERT
        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.google_calendar_id)}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenResult.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventPayload),
          }
        );
        if (calRes.ok) {
          const eventData = await calRes.json();
          await _patchWorkRecordSyncStatus(env, recordId, "synced", null, eventData.id);
          synced++;
        } else {
          await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_insert_retry_failed", null);
          failed++;
        }
      } else {
        // Type 2: eventId present — PATCH
        const calRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(conn.google_calendar_id)}/events/${encodeURIComponent(existingEventId)}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${tokenResult.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventPayload),
          }
        );
        if (calRes.ok) {
          await _patchWorkRecordSyncStatus(env, recordId, "synced", null, existingEventId);
          synced++;
        } else if (calRes.status === 404 || calRes.status === 410) {
          await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_not_found", null);
          failed++;
        } else {
          await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_event_update_retry_failed", null);
          failed++;
        }
      }
    } catch (_) {
      await _patchWorkRecordSyncStatus(env, recordId, "failed", "google_calendar_retry_exception", null);
      failed++;
    }
  }

  return json({ ok: true, total, synced, skipped, failed });
}

// ── Helper: Vercel OpenAI Proxy ──────────────────────────────────────────────
async function callVercelOpenAIProxy(env, requestBody) {
  const proxyUrl = (env.VERCEL_OPENAI_PROXY_URL || "").toString().trim();
  const apiKey = (env.OPENAI_API_KEY || "").toString().trim();

  // Prefer Vercel proxy if available, fallback to direct OpenAI API
  if (proxyUrl) {
    return callOpenAIViaProxy(proxyUrl, requestBody);
  }

  if (apiKey) {
    return callOpenAIDirect(apiKey, requestBody);
  }

  return {
    ok: false,
    error: "Neither VERCEL_OPENAI_PROXY_URL nor OPENAI_API_KEY configured",
  };
}

async function callOpenAIViaProxy(proxyUrl, requestBody) {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const resp = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return {
        ok: false,
        error: errData?.error || `Vercel proxy returned ${resp.status}`,
        status: resp.status,
      };
    }

    const data = await resp.json();
    return {
      ok: data?.ok ?? false,
      data: data?.data,
      error: data?.error,
      ms: Date.now() - t0,
    };
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: false, error: "TIMEOUT" };
    }
    return { ok: false, error: "FETCH_ERROR", message: e?.message };
  }
}

async function callOpenAIDirect(apiKey, requestBody) {
  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: requestBody.messages,
        model: requestBody.model,
        temperature: requestBody.temperature,
        max_tokens: requestBody.max_tokens,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      return {
        ok: false,
        error: errData?.error?.message || `OpenAI API returned ${resp.status}`,
        status: resp.status,
      };
    }

    const data = await resp.json();
    return {
      ok: true,
      data,
      error: null,
      ms: Date.now() - t0,
    };
  } catch (e) {
    if (e?.name === "AbortError") {
      return { ok: false, error: "TIMEOUT" };
    }
    return { ok: false, error: "FETCH_ERROR", message: e?.message };
  }
}

// ── /api/resume-generate · OpenAI provider ───────────────────────────────────
// P-AI-1-OAI: body.provider === "openai" 일 때 호출. 자동 저장 없음.
// Supabase write 없음. 응답 shape는 Gemini 경로와 동일.
async function handleResumeGenerateOpenAI(env, body, t0, requestId) {
  const model = (env.OPENAI_MODEL || "gpt-4o-mini").toString().trim();

  const workRecord = (body?.workRecord && typeof body.workRecord === "object") ? body.workRecord : {};
  const targetJob = (body?.targetJob ?? "").toString().slice(0, 100);
  const tone = ["impact", "transition"].includes(body?.tone) ? body.tone : "default";

  const title = (workRecord.title ?? "").toString().slice(0, 200);
  const sourceText = (workRecord.sourceText ?? "").toString().slice(0, 1000);
  const projectActionsRaw = Array.isArray(workRecord.projectActions) ? workRecord.projectActions : [];
  const projectActions = projectActionsRaw.map((s) => String(s).slice(0, 300)).filter(Boolean).join("\n");
  const projectResult = (workRecord.projectResult ?? "").toString().slice(0, 500);
  const role = (workRecord.role ?? "").toString().slice(0, 200);
  const toolsRaw = Array.isArray(workRecord.tools) ? workRecord.tools : [];
  const tools = toolsRaw.map((s) => String(s).slice(0, 50)).filter(Boolean).slice(0, 10).join(", ");

  const hasContent = title || sourceText || projectActions || projectResult;
  if (!hasContent) {
    return json({
      ok: false,
      error: { code: "EMPTY_RECORD", message: "workRecord has no content" },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  const toneInstruction =
    tone === "impact"
      ? "성과와 수치를 강조하는 방향으로 작성하되, 입력에 없는 수치는 절대 만들지 말 것."
      : tone === "transition"
      ? "직무 전환 맥락을 고려해 역할 이동의 연속성을 부각하는 방향으로 작성."
      : "자연스럽고 간결한 이력서 문체로 작성.";

  const prompt = `너는 한국어 이력서/경력기술서 전문 작성 보조 AI다.
사용자가 제공한 업무 기록 정보를 바탕으로 이력서에 활용할 수 있는 경험 기술 문장 초안을 생성해야 한다.

출력 규칙:
- JSON만 출력. 설명 텍스트, 마크다운 코드블록 절대 금지.
- bullets는 1~4개 생성한다. 개수는 입력 개수가 아니라 의미 단위 기준으로 판단한다.
  * 입력이 하나의 업무 흐름이면 1개
  * 역할/협업/산출물/성과가 분리되면 2~3개
  * 입력이 많아도 유사 항목은 묶어 최대 4개
  * 근거가 부족하면 억지로 여러 개 만들지 않는다.
- 사용자가 입력한 태그를 그대로 쉼표로 이어붙이지 말 것.
- 가능한 경우 2개 이상의 입력 신호를 묶어 하나의 의미 단위로 만들 것.
- 업무 목적, 협업 맥락, 산출물, 진행 방식, 성과/변화 중 최소 하나가 드러나게 쓸 것.
- "성과를 극대화하였습니다", "전략적 방향성을 제시하였습니다", "기여하였습니다"처럼 추상적인 표현은 피할 것.
- 수치, 매출, 전환율, 인원 수, 기간, 회사명, 프로젝트명은 입력에 없으면 절대 만들지 말 것.
- 근거가 약한 경우 "기반 마련", "후보군 정리", "논의 준비", "진행 지원", "관리", "구축", "정리"처럼 안전한 표현을 사용할 것.
- 경력기술서에 바로 붙일 수 있는 간결한 bullet 스타일로 작성할 것.
- 각 bullet은 대략 35~90자 안에서 작성하되, 억지로 길게 만들지 말 것.
- focus 필드: "achievement", "role", "skill", "process", "collaboration", "output" 중 하나.
- sourceSignals: 각 bullet을 만드는 데 사용한 입력 신호들 배열 (1~5개).
- evidenceLevel: 입력 근거의 충분함. "high" (여러 신호 충분), "medium" (2개 신호 있으나 성과 근거 제한), "low" (신호 부족해 안전한 표현).
- 톤: ${toneInstruction}

출력 형식 (JSON만, 다른 텍스트 절대 없음):
{
  "bullets": [
    {
      "text": "경력기술서형 문장",
      "type": "resume_bullet",
      "focus": "achievement | role | skill | process | collaboration | output",
      "sourceSignals": ["근거가 된 입력 신호"],
      "evidenceLevel": "high | medium | low"
    }
  ],
  "missingInfoHints": ["보강하면 좋은 정보"]
}

[예시]
Input:
업무 유형: 시장 기회 분석, 딜 파이프라인 관리, 딜 파이프라인 확보
협업 맥락: 마케팅팀, PM, 외부 파트너
성과/변화: 사업 확장 지원, 전략적 제휴 강화

Good output:
{
  "bullets": [
    {
      "text": "신규 사업 확장을 위한 시장 기회 및 잠재 파트너 후보군 분석",
      "type": "resume_bullet",
      "focus": "role",
      "sourceSignals": ["시장 기회 분석", "사업 확장 지원"],
      "evidenceLevel": "medium"
    },
    {
      "text": "마케팅팀·PM·외부 파트너와 협업하여 딜 파이프라인 구축 및 관리",
      "type": "resume_bullet",
      "focus": "collaboration",
      "sourceSignals": ["딜 파이프라인 관리", "딜 파이프라인 확보", "마케팅팀", "PM", "외부 파트너"],
      "evidenceLevel": "medium"
    },
    {
      "text": "후속 제휴 논의를 위한 파트너십 후보 정리 및 사업 확장 기반 마련",
      "type": "resume_bullet",
      "focus": "achievement",
      "sourceSignals": ["전략적 제휴 강화", "사업 확장 지원"],
      "evidenceLevel": "medium"
    }
  ],
  "missingInfoHints": ["성과 수치나 전후 변화가 있으면 더 강한 성과형 문장으로 다듬을 수 있습니다."]
}

Bad examples to avoid:
- "시장 기회 분석, 딜 파이프라인 관리, 딜 파이프라인 확보를 수행했습니다." → 입력 태그를 그대로 나열함.
- "시장 기회 분석을 통해 성과를 극대화하였습니다." → 추상적이고 근거 없는 성과 표현.
- "신규 파트너 30개사를 확보했습니다." → 입력에 없는 수치를 만듦.

[업무 기록]
제목: ${title || "(없음)"}
업무 내용: ${sourceText || "(없음)"}
수행 활동: ${projectActions || "(없음)"}
결과/성과: ${projectResult || "(없음)"}
역할/역량 태그: ${role || "(없음)"}
사용 도구/기술: ${tools || "(없음)"}
지원 직務: ${targetJob || "(없음)"}`.trim();

  const proxyResult = await callVercelOpenAIProxy(env, {
    messages: [{ role: "user", content: prompt }],
    model,
    temperature: 0.3,
    max_tokens: 512,
    requestId,
    t0,
  });

  if (!proxyResult.ok) {
    const errorCode = proxyResult.error === "TIMEOUT" ? "FETCH_ERROR" : "MODEL_ERROR";
    const errorMsg = proxyResult.error === "TIMEOUT"
      ? "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
      : "AI 응답 처리 중 오류가 발생했습니다. 다시 시도해 주세요.";
    return json({
      ok: false,
      error: { code: errorCode, message: errorMsg },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  const data = proxyResult.data;
  const shapeDignostics = {};

  // Diagnostic: response shape
  shapeDignostics.hasChoices = Array.isArray(data?.choices);
  shapeDignostics.choicesLength = shapeDignostics.hasChoices ? data.choices.length : 0;
  shapeDignostics.hasMessage = data?.choices?.[0]?.message != null;
  shapeDignostics.hasContent = typeof data?.choices?.[0]?.message?.content === "string";
  shapeDignostics.contentLength = shapeDignostics.hasContent ? String(data.choices[0].message.content).length : 0;
  shapeDignostics.contentHasOpeningBrace = shapeDignostics.hasContent && String(data.choices[0].message.content).charAt(0) === "{";
  shapeDignostics.contentHasCodeFence = shapeDignostics.hasContent && String(data.choices[0].message.content).includes("```");
  shapeDignostics.finishReason = data?.choices?.[0]?.finish_reason;

  const content = data?.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (_) {
    shapeDignostics.jsonParseAttempt1 = "failed";
    const extracted = extractJsonObject(content);
    if (!extracted) {
      shapeDignostics.jsonExtraction = "failed_no_object";
      return json({
        ok: false,
        error: { code: "OPENAI_INVALID_JSON", message: "AI 응답 파싱에 실패했습니다. 다시 시도해 주세요." },
        meta: { requestId, ms: Date.now() - t0, ...shapeDignostics },
      });
    }
    shapeDignostics.jsonExtraction = "found";
    try {
      parsed = JSON.parse(extracted);
    } catch (_e) {
      shapeDignostics.jsonParseAttempt2 = "failed";
      return json({
        ok: false,
        error: { code: "OPENAI_INVALID_JSON", message: "AI 응답 파싱에 실패했습니다. 다시 시도해 주세요." },
        meta: { requestId, ms: Date.now() - t0, ...shapeDignostics },
      });
    }
  }

  shapeDignostics.jsonParseSuccess = true;
  shapeDignostics.hasParsedBullets = Array.isArray(parsed?.bullets);

  const validFocus = new Set(["achievement", "role", "skill", "process", "collaboration", "output"]);
  const rawBulletCount = Array.isArray(parsed?.bullets) ? parsed.bullets.length : 0;
  const bullets = Array.isArray(parsed?.bullets)
    ? parsed.bullets
        .filter((b) => b && typeof b.text === "string" && b.text.trim())
        .map((b) => ({
          text: String(b.text).trim().slice(0, 300),
          type: "resume_bullet",
          focus: validFocus.has(b.focus) ? b.focus : "role",
          ...(Array.isArray(b.sourceSignals) && { sourceSignals: b.sourceSignals }),
          ...(typeof b.evidenceLevel === "string" && { evidenceLevel: b.evidenceLevel }),
        }))
        .slice(0, 4)
    : [];

  shapeDignostics.rawBulletCount = rawBulletCount;
  shapeDignostics.filteredBulletCount = bullets.length;

  const missingInfoHints = Array.isArray(parsed?.missingInfoHints)
    ? parsed.missingInfoHints.filter((h) => typeof h === "string" && h.trim()).map((h) => h.slice(0, 200)).slice(0, 3)
    : [];

  if (bullets.length === 0) {
    return json({
      ok: false,
      error: { code: "OPENAI_EMPTY_BULLETS", message: "AI가 유효한 이력서 문장을 생성하지 못했습니다. 다시 시도해 주세요." },
      meta: { requestId, ms: Date.now() - t0, ...shapeDignostics },
    });
  }

  return json({
    ok: true,
    bullets,
    missingInfoHints,
    model,
    meta: { requestId, ms: Date.now() - t0, ...shapeDignostics },
  });
}

// ── /api/resume-generate ─────────────────────────────────────────────────────
// P-AI-1: 업무기록 → 한국어 이력서 bullet 초안 생성 (Gemini 2.5 Flash)
// 자동 저장 없음. 사용자 확인·수정 후 프론트 기존 저장 흐름으로 저장.
async function handleResumeGenerate(request, env, body, __key) {
  const t0 = Date.now();
  const requestId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());

  if (body?.provider === "openai") {
    return handleResumeGenerateOpenAI(env, body, t0, requestId);
  }

  if (!__key) {
    return json({
      ok: false,
      error: { code: "NO_API_KEY", message: "Missing GEMINI_API_KEY(_V2)" },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  const workRecord = (body?.workRecord && typeof body.workRecord === "object") ? body.workRecord : {};
  const targetJob = (body?.targetJob ?? "").toString().slice(0, 100);
  const tone = ["impact", "transition"].includes(body?.tone) ? body.tone : "default";

  const title = (workRecord.title ?? "").toString().slice(0, 200);
  const sourceText = (workRecord.sourceText ?? "").toString().slice(0, 1000);
  const projectActionsRaw = Array.isArray(workRecord.projectActions) ? workRecord.projectActions : [];
  const projectActions = projectActionsRaw.map((s) => String(s).slice(0, 300)).filter(Boolean).join("\n");
  const projectResult = (workRecord.projectResult ?? "").toString().slice(0, 500);
  const role = (workRecord.role ?? "").toString().slice(0, 200);
  const toolsRaw = Array.isArray(workRecord.tools) ? workRecord.tools : [];
  const tools = toolsRaw.map((s) => String(s).slice(0, 50)).filter(Boolean).slice(0, 10).join(", ");

  const hasContent = title || sourceText || projectActions || projectResult;
  if (!hasContent) {
    return json({
      ok: false,
      error: { code: "EMPTY_RECORD", message: "workRecord has no content" },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  const toneInstruction =
    tone === "impact"
      ? "성과와 수치를 강조하는 방향으로 작성하되, 입력에 없는 수치는 절대 만들지 말 것."
      : tone === "transition"
      ? "직무 전환 맥락을 고려해 역할 이동의 연속성을 부각하는 방향으로 작성."
      : "자연스럽고 간결한 이력서 문체로 작성.";

  const prompt = `너는 한국어 이력서/경력기술서 전문 작성 보조 AI다.
사용자가 제공한 업무 기록 정보를 바탕으로 이력서에 활용할 수 있는 경험 기술 문장 초안을 생성해야 한다.

출력 규칙:
- JSON만 출력. 설명 텍스트, 마크다운 코드블록 절대 금지.
- bullets는 1~4개 생성한다. 개수는 입력 개수가 아니라 의미 단위 기준으로 판단한다.
  * 입력이 하나의 업무 흐름이면 1개
  * 역할/협업/산출물/성과가 분리되면 2~3개
  * 입력이 많아도 유사 항목은 묶어 최대 4개
  * 근거가 부족하면 억지로 여러 개 만들지 않는다.
- 사용자가 입력한 태그를 그대로 쉼표로 이어붙이지 말 것.
- 가능한 경우 2개 이상의 입력 신호를 묶어 하나의 의미 단위로 만들 것.
- 업무 목적, 협업 맥락, 산출물, 진행 방식, 성과/변화 중 최소 하나가 드러나게 쓸 것.
- "성과를 극대화하였습니다", "전략적 방향성을 제시하였습니다", "기여하였습니다"처럼 추상적인 표현은 피할 것.
- 수치, 매출, 전환율, 인원 수, 기간, 회사명, 프로젝트명은 입력에 없으면 절대 만들지 말 것.
- 근거가 약한 경우 "기반 마련", "후보군 정리", "논의 준비", "진행 지원", "관리", "구축", "정리"처럼 안전한 표현을 사용할 것.
- 경력기술서에 바로 붙일 수 있는 간결한 bullet 스타일로 작성할 것.
- 각 bullet은 대략 35~90자 안에서 작성하되, 억지로 길게 만들지 말 것.
- focus 필드: "achievement", "role", "skill", "process", "collaboration", "output" 중 하나.
- sourceSignals: 각 bullet을 만드는 데 사용한 입력 신호들 배열 (1~5개).
- evidenceLevel: 입력 근거의 충분함. "high" (여러 신호 충분), "medium" (2개 신호 있으나 성과 근거 제한), "low" (신호 부족해 안전한 표현).
- 톤: ${toneInstruction}

출력 형식 (JSON만, 다른 텍스트 절대 없음):
{
  "bullets": [
    {
      "text": "경력기술서형 문장",
      "type": "resume_bullet",
      "focus": "achievement | role | skill | process | collaboration | output",
      "sourceSignals": ["근거가 된 입력 신호"],
      "evidenceLevel": "high | medium | low"
    }
  ],
  "missingInfoHints": ["보강하면 좋은 정보"]
}

[예시]
Input:
업무 유형: 시장 기회 분석, 딜 파이프라인 관리, 딜 파이프라인 확보
협업 맥락: 마케팅팀, PM, 외부 파트너
성과/변화: 사업 확장 지원, 전략적 제휴 강화

Good output:
{
  "bullets": [
    {
      "text": "신규 사업 확장을 위한 시장 기회 및 잠재 파트너 후보군 분석",
      "type": "resume_bullet",
      "focus": "role",
      "sourceSignals": ["시장 기회 분석", "사업 확장 지원"],
      "evidenceLevel": "medium"
    },
    {
      "text": "마케팅팀·PM·외부 파트너와 협업하여 딜 파이프라인 구축 및 관리",
      "type": "resume_bullet",
      "focus": "collaboration",
      "sourceSignals": ["딜 파이프라인 관리", "딜 파이프라인 확보", "마케팅팀", "PM", "외부 파트너"],
      "evidenceLevel": "medium"
    },
    {
      "text": "후속 제휴 논의를 위한 파트너십 후보 정리 및 사업 확장 기반 마련",
      "type": "resume_bullet",
      "focus": "achievement",
      "sourceSignals": ["전략적 제휴 강화", "사업 확장 지원"],
      "evidenceLevel": "medium"
    }
  ],
  "missingInfoHints": ["성과 수치나 전후 변화가 있으면 더 강한 성과형 문장으로 다듬을 수 있습니다."]
}

Bad examples to avoid:
- "시장 기회 분석, 딜 파이프라인 관리, 딜 파이프라인 확보를 수행했습니다." → 입력 태그를 그대로 나열함.
- "시장 기회 분석을 통해 성과를 극대화하였습니다." → 추상적이고 근거 없는 성과 표현.
- "신규 파트너 30개사를 확보했습니다." → 입력에 없는 수치를 만듦.

[업무 기록]
제목: ${title || "(없음)"}
업무 내용: ${sourceText || "(없음)"}
수행 활동: ${projectActions || "(없음)"}
결과/성과: ${projectResult || "(없음)"}
역할/역량 태그: ${role || "(없음)"}
사용 도구/기술: ${tools || "(없음)"}
지원 직무: ${targetJob || "(없음)"}`.trim();

  let resp;
  try {
    resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${__key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );
  } catch (e) {
    return json({
      ok: false,
      error: { code: "FETCH_ERROR", message: String(e?.message || e).slice(0, 200) },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  if (!resp.ok) {
    const errText = await resp.text();
    const isLocationError = errText.toLowerCase().includes("location") ||
                            errText.toLowerCase().includes("region") ||
                            errText.toLowerCase().includes("unsupported");

    let diagnosticMeta = {};

    if (isLocationError) {
      const hasOpenAIKey = Boolean(env.OPENAI_API_KEY);
      const hasOpenAIProxyUrl = Boolean(env.VERCEL_OPENAI_PROXY_URL);
      const fallbackEligible = hasOpenAIKey || hasOpenAIProxyUrl;

      diagnosticMeta.fallbackEligible = fallbackEligible;
      diagnosticMeta.hasOpenAIKey = hasOpenAIKey;
      diagnosticMeta.hasOpenAIProxyUrl = hasOpenAIProxyUrl;

      // Try OpenAI fallback if eligible
      if (fallbackEligible) {
        diagnosticMeta.fallbackAttempted = true;

        const fallbackResponse = await handleResumeGenerateOpenAI(env, body, t0, requestId);
        let fallbackPayload;
        try {
          fallbackPayload = await fallbackResponse.json().catch(() => null);
        } catch (_) {
          fallbackPayload = null;
        }

        if (fallbackPayload?.ok) {
          diagnosticMeta.fallbackOk = true;
          diagnosticMeta.fallbackProvider = "openai";
          return json({
            ...fallbackPayload,
            meta: {
              ...(fallbackPayload.meta || {}),
              fallbackUsed: true,
              fallbackProvider: "openai",
            },
          });
        } else {
          diagnosticMeta.fallbackOk = false;
          diagnosticMeta.fallbackProvider = "openai";
          diagnosticMeta.fallbackErrorCode = fallbackPayload?.error?.code || "OPENAI_FALLBACK_FAILED";
          if (fallbackResponse?.status) {
            diagnosticMeta.fallbackHttpStatus = fallbackResponse.status;
          }
          // Merge fallback shape diagnostics (hasChoices, contentHasCodeFence, etc.) while preserving outer fields
          if (fallbackPayload && typeof fallbackPayload.meta === "object") {
            diagnosticMeta = {
              ...fallbackPayload.meta,
              ...diagnosticMeta, // outer fallback fields take precedence
            };
          }
        }
      } else {
        diagnosticMeta.fallbackAttempted = false;
        diagnosticMeta.fallbackProvider = "none";
        diagnosticMeta.fallbackErrorCode = "NO_OPENAI_CONFIG";
      }
    }

    return json({
      ok: false,
      error: {
        code: isLocationError ? "MODEL_REGION_UNAVAILABLE" : "MODEL_ERROR",
        message: isLocationError
          ? "현재 AI 초안 생성 서버가 응답하지 않아, 기록 기반 임시 초안을 표시합니다."
          : errText.slice(0, 300)
      },
      meta: { requestId, ms: Date.now() - t0, ...diagnosticMeta },
    });
  }

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";

  const extracted = extractJsonObject(raw);
  if (!extracted) {
    return json({
      ok: false,
      error: { code: "INVALID_JSON", message: "No JSON object found in model output" },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(extracted);
  } catch (e) {
    return json({
      ok: false,
      error: { code: "INVALID_JSON", message: String(e).slice(0, 160) },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  const validFocus = new Set(["achievement", "role", "skill", "process", "collaboration", "output"]);
  const bullets = Array.isArray(parsed?.bullets)
    ? parsed.bullets
        .filter((b) => b && typeof b.text === "string" && b.text.trim())
        .map((b) => ({
          text: String(b.text).trim().slice(0, 300),
          type: "resume_bullet",
          focus: validFocus.has(b.focus) ? b.focus : "role",
          ...(Array.isArray(b.sourceSignals) && { sourceSignals: b.sourceSignals }),
          ...(typeof b.evidenceLevel === "string" && { evidenceLevel: b.evidenceLevel }),
        }))
        .slice(0, 4)
    : [];

  const missingInfoHints = Array.isArray(parsed?.missingInfoHints)
    ? parsed.missingInfoHints.filter((h) => typeof h === "string" && h.trim()).map((h) => h.slice(0, 200)).slice(0, 3)
    : [];

  if (bullets.length === 0) {
    return json({
      ok: false,
      error: { code: "EMPTY_BULLETS", message: "Model returned no usable bullets" },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  return json({
    ok: true,
    bullets,
    missingInfoHints,
    model: "gemini-2.5-flash",
    meta: { requestId, ms: Date.now() - t0 },
  });
}

async function handleResumeImportAI(request, env, body, __key) {
  const t0 = Date.now();
  const requestId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
  const maxInputLength = 15000;

  const text = typeof body?.text === "string" ? body.text : "";
  const trimmed = text.trim();
  if (!trimmed) {
    return json({
      ok: false,
      error: { code: "INVALID_INPUT", message: "분석할 이력서 내용을 입력해 주세요." },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }
  if (trimmed.length < 50) {
    return json({
      ok: false,
      error: { code: "INVALID_INPUT", message: "분석할 이력서 내용이 너무 짧습니다." },
      meta: { requestId, ms: Date.now() - t0 },
    });
  }

  const provider = body?.provider === "openai" ? "openai" : "gemini";
  const locale = typeof body?.locale === "string" && body.locale.trim() ? body.locale.trim().slice(0, 20) : "ko-KR";
  const mode = typeof body?.mode === "string" && body.mode.trim() ? body.mode.trim().slice(0, 40) : "resume_import";
  const maxPreviewCharsRaw = Number(body?.maxPreviewChars);
  const maxPreviewChars = Number.isFinite(maxPreviewCharsRaw)
    ? Math.max(120, Math.min(1000, Math.floor(maxPreviewCharsRaw)))
    : 500;

  const truncated = trimmed.length > maxInputLength;
  const inputText = truncated ? trimmed.slice(0, maxInputLength) : trimmed;
  const meta = {
    provider,
    truncated,
    inputLength: trimmed.length,
    requestId,
    ms: 0,
  };

  if (provider === "openai") {
    return handleResumeImportAIOpenAI(env, {
      inputText,
      locale,
      mode,
      maxPreviewChars,
      meta,
      t0,
    });
  }

  if (!__key) {
    return json({
      ok: false,
      error: { code: "NO_API_KEY", message: "Missing GEMINI_API_KEY(_V2)" },
      meta: { ...meta, ms: Date.now() - t0 },
    });
  }

  return handleResumeImportAIGemini(__key, {
    inputText,
    locale,
    mode,
    maxPreviewChars,
    meta,
    t0,
  });
}

async function handleResumeImportAIOpenAI(env, context) {
  const model = (env.OPENAI_MODEL || "gpt-4o-mini").toString().trim();
  const messages = buildResumeImportPrompt(context);

  const proxyResult = await callVercelOpenAIProxy(env, {
    messages,
    model,
    temperature: 0.1,
    max_tokens: 1800,
    requestId: context.meta.requestId,
    t0: context.t0,
  });

  if (!proxyResult.ok) {
    const errorCode = proxyResult.error === "TIMEOUT" ? "FETCH_ERROR" : "MODEL_ERROR";
    const errorMsg = proxyResult.error === "TIMEOUT"
      ? "AI 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."
      : "AI 응답 처리 중 오류가 발생했습니다. 다시 시도해 주세요.";
    return json({
      ok: false,
      error: { code: errorCode, message: errorMsg },
      meta: { ...context.meta, ms: Date.now() - context.t0 },
    });
  }

  const data = proxyResult.data;
  const raw = data?.choices?.[0]?.message?.content || "";
  return buildResumeImportSuccessResponse(raw, context);
}

async function handleResumeImportAIGemini(apiKey, context) {
  const prompt = buildResumeImportPrompt(context);

  let resp;
  try {
    resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.content }],
          })),
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2200,
          },
        }),
      }
    );
  } catch (e) {
    return json({
      ok: false,
      error: { code: "FETCH_ERROR", message: String(e?.message || e).slice(0, 200) },
      meta: { ...context.meta, ms: Date.now() - context.t0 },
    });
  }

  if (!resp.ok) {
    const errText = await resp.text();
    return json({
      ok: false,
      error: { code: "MODEL_ERROR", message: errText.slice(0, 300) },
      meta: { ...context.meta, ms: Date.now() - context.t0 },
    });
  }

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") || "";
  return buildResumeImportSuccessResponse(raw, context);
}

function buildResumeImportPrompt({ inputText, locale, mode, maxPreviewChars }) {
  const system = [
    "You convert raw resume text into PASSMAP resumeDraft JSON.",
    "Output JSON only. No markdown, no explanations, no code fences.",
    "Do not invent facts that are not present in the source text.",
    "If a value is uncertain or missing, leave it empty or put a short note in unknowns.",
    "Contact info, school names, company names, and personal data may be included only if explicitly present.",
    "summary must have at most 3 items.",
    "experiences must have at most 5 items.",
    "Each experience bullets array must have at most 4 items.",
    "skills must have at most 20 items.",
    "warnings and unknowns should contain concise strings.",
    "Return the exact top-level fields schemaVersion, source, importedAt, profile, target, summary, experiences, education, skills, warnings, unknowns, confidence, rawInputPreview.",
  ].join(" ");

  const user = `
locale=${locale}
mode=${mode}
maxPreviewChars=${maxPreviewChars}

Return a JSON object with this shape:
{
  "schemaVersion": 1,
  "source": "passmap_ai_resume_import",
  "importedAt": "ISO_DATE",
  "profile": {
    "name": "",
    "phone": "",
    "email": "",
    "location": "",
    "portfolioUrl": ""
  },
  "target": {
    "job": "",
    "industry": ""
  },
  "summary": [],
  "experiences": [
    {
      "company": "",
      "role": "",
      "startDate": "",
      "endDate": "",
      "description": "",
      "bullets": []
    }
  ],
  "education": [],
  "skills": [],
  "warnings": [],
  "unknowns": [],
  "confidence": {
    "profile": "low",
    "target": "low",
    "experiences": "low",
    "skills": "low"
  },
  "rawInputPreview": ""
}

Rules:
- Do not fabricate dates, names, employers, schools, or skills.
- If target job or target industry is not explicit, keep them empty.
- Keep each summary item short and source-grounded.
- Experience bullets must be concise and must not exaggerate the source text.
- Use empty arrays instead of null.
- Use empty strings instead of guessed values.
- rawInputPreview should be a short preview of the input text, not the full input.

[RESUME TEXT]
${inputText}
  `.trim();

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function buildResumeImportSuccessResponse(raw, context) {
  const parsedResult = parseResumeImportDraft(raw);
  if (!parsedResult.ok) {
    return json({
      ok: false,
      error: parsedResult.error,
      meta: { ...context.meta, ms: Date.now() - context.t0 },
    });
  }

  const draft = normalizeResumeImportDraft(parsedResult.parsed, {
    inputText: context.inputText,
    maxPreviewChars: context.maxPreviewChars,
  });

  return json({
    ok: true,
    draft,
    meta: { ...context.meta, ms: Date.now() - context.t0 },
  });
}

function parseResumeImportDraft(raw) {
  const content = typeof raw === "string" ? raw.trim() : "";
  if (!content) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", message: "AI 응답이 비어 있습니다." },
    };
  }

  const withoutFence = content
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const extracted = extractJsonObject(withoutFence);
  if (!extracted) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", message: "AI 응답에서 JSON 객체를 찾지 못했습니다." },
    };
  }

  try {
    return { ok: true, parsed: JSON.parse(extracted) };
  } catch (e) {
    return {
      ok: false,
      error: { code: "INVALID_JSON", message: String(e).slice(0, 160) },
    };
  }
}

function normalizeResumeImportDraft(draft, options = {}) {
  const sourceText = typeof options.inputText === "string" ? options.inputText : "";
  const maxPreviewChars = Number.isFinite(options.maxPreviewChars)
    ? Math.max(120, Math.min(1000, Math.floor(options.maxPreviewChars)))
    : 500;

  const profile = draft?.profile && typeof draft.profile === "object" ? draft.profile : {};
  const target = draft?.target && typeof draft.target === "object" ? draft.target : {};
  const confidence = draft?.confidence && typeof draft.confidence === "object" ? draft.confidence : {};

  const normalized = {
    schemaVersion: 1,
    source: "passmap_ai_resume_import",
    importedAt: normalizeResumeImportDateString(draft?.importedAt),
    profile: {
      name: limitString(profile.name, 120),
      phone: limitString(profile.phone, 80),
      email: limitString(profile.email, 120),
      location: limitString(profile.location, 120),
      portfolioUrl: limitString(profile.portfolioUrl, 300),
    },
    target: {
      job: limitString(target.job, 120),
      industry: limitString(target.industry, 120),
    },
    summary: normalizeStringList(draft?.summary, 3, 220),
    experiences: normalizeExperiences(draft?.experiences),
    education: normalizeEducation(draft?.education),
    skills: normalizeStringList(draft?.skills, 20, 80),
    warnings: normalizeStringList(draft?.warnings, 10, 220),
    unknowns: normalizeStringList(draft?.unknowns, 10, 220),
    confidence: {
      profile: normalizeConfidenceValue(confidence.profile),
      target: normalizeConfidenceValue(confidence.target),
      experiences: normalizeConfidenceValue(confidence.experiences),
      skills: normalizeConfidenceValue(confidence.skills),
    },
    rawInputPreview: limitString(
      draft?.rawInputPreview || sourceText.slice(0, maxPreviewChars),
      maxPreviewChars
    ),
  };

  return normalized;
}

function normalizeExperiences(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 5)
    .map((item) => ({
      company: limitString(item.company, 160),
      role: limitString(item.role, 160),
      startDate: limitString(item.startDate, 40),
      endDate: limitString(item.endDate, 40),
      description: limitString(item.description, 400),
      bullets: normalizeStringList(item.bullets, 4, 220),
    }));
}

function normalizeEducation(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 5)
    .map((item) => ({
      school: limitString(item.school, 160),
      degree: limitString(item.degree, 160),
      major: limitString(item.major, 160),
      startDate: limitString(item.startDate, 40),
      endDate: limitString(item.endDate, 40),
      description: limitString(item.description, 300),
    }));
}

function normalizeStringList(value, maxItems, maxLength) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => limitString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeConfidenceValue(value) {
  return value === "high" || value === "medium" ? value : "low";
}

function normalizeResumeImportDateString(value) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return new Date().toISOString();
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? new Date().toISOString() : new Date(parsed).toISOString();
}

function limitString(value, maxLength) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, maxLength);
}
