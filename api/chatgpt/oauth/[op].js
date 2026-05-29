import {
  basicRateLimit,
  clientIpKey,
  getServiceRoleClient,
  hashSecret,
} from "../../_mcp_auth.js";
import {
  CHATGPT_OAUTH_SCOPE,
  chatgptOAuthAccessTokenExpiry,
  chatgptOAuthCodeExpiry,
  chatgptOAuthStateExpiry,
  generateOpaqueToken,
  getChatgptOAuthConfig,
  getTokenPrefix,
  jsonOAuthError,
  readOAuthBody,
  setOAuthCors,
  validateChatgptOAuthClient,
  validateChatgptOAuthScope,
  verifySupabaseBearerForOAuthComplete,
} from "../../_chatgpt_oauth.js";

function _s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function _first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function _op(req) {
  return _s(_first(req?.query?.op)).toLowerCase();
}

function _query(req, key) {
  return _s(_first(req?.query?.[key]));
}

function _redirectWithParams(baseUrl, params) {
  const url = new URL(baseUrl);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function handleAuthorize(req, res) {
  if (req.method !== "GET") {
    return jsonOAuthError(res, 405, "invalid_request", "GET required");
  }

  const responseType = _query(req, "response_type");
  const clientId = _query(req, "client_id");
  const redirectUri = _query(req, "redirect_uri");
  const requestedScope = _query(req, "scope") || CHATGPT_OAUTH_SCOPE;
  const state = _query(req, "state");

  if (responseType !== "code") {
    return jsonOAuthError(res, 400, "unsupported_response_type", "response_type must be code");
  }
  if (!state) {
    return jsonOAuthError(res, 400, "invalid_request", "state is required");
  }

  const client = validateChatgptOAuthClient({ clientId, redirectUri });
  if (!client.ok) {
    return jsonOAuthError(res, client.status, client.error, client.message);
  }
  const scopeCheck = validateChatgptOAuthScope(requestedScope);
  if (!scopeCheck.ok) {
    return jsonOAuthError(res, scopeCheck.status, scopeCheck.error, scopeCheck.message);
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonOAuthError(res, 503, "server_error", "OAuth service is not configured");
  }

  try {
    const { error } = await supabase.from("chatgpt_oauth_states").insert({
      state_hash: hashSecret(state),
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopeCheck.scope,
      expires_at: chatgptOAuthStateExpiry(),
      metadata: {
        source: "chatgpt_actions",
        responseType,
      },
    });
    if (error) {
      console.error("[chatgpt-oauth] authorize state insert failed:", error.message);
      return jsonOAuthError(res, 500, "server_error", "Could not start OAuth authorization");
    }
  } catch (err) {
    console.error("[chatgpt-oauth] authorize unexpected:", err?.message || "unknown");
    return jsonOAuthError(res, 500, "server_error", "Could not start OAuth authorization");
  }

  const consentUrl = _redirectWithParams(`${client.config.passmapAppBaseUrl}/chatgpt-oauth/consent`, {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopeCheck.scope,
    state,
  });

  res.setHeader("Location", consentUrl);
  return res.status(302).end();
}

async function handleComplete(req, res) {
  if (req.method !== "POST") {
    return jsonOAuthError(res, 405, "invalid_request", "POST required");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonOAuthError(res, 503, "server_error", "OAuth service is not configured");
  }

  const identity = await verifySupabaseBearerForOAuthComplete({ req, supabase });
  if (!identity.ok) {
    return jsonOAuthError(res, identity.status || 401, "access_denied", identity.message);
  }

  const body = await readOAuthBody(req);
  const clientId = _s(body?.client_id);
  const redirectUri = _s(body?.redirect_uri);
  const requestedScope = _s(body?.scope) || CHATGPT_OAUTH_SCOPE;
  const state = _s(body?.state);

  if (!state) {
    return jsonOAuthError(res, 400, "invalid_request", "state is required");
  }

  const client = validateChatgptOAuthClient({ clientId, redirectUri });
  if (!client.ok) {
    return jsonOAuthError(res, client.status, client.error, client.message);
  }
  const scopeCheck = validateChatgptOAuthScope(requestedScope);
  if (!scopeCheck.ok) {
    return jsonOAuthError(res, scopeCheck.status, scopeCheck.error, scopeCheck.message);
  }

  const stateHash = hashSecret(state);
  let stateRow = null;
  try {
    const { data, error } = await supabase
      .from("chatgpt_oauth_states")
      .select("id, expires_at, consumed_at")
      .eq("state_hash", stateHash)
      .eq("client_id", clientId)
      .eq("redirect_uri", redirectUri)
      .eq("scope", scopeCheck.scope)
      .is("consumed_at", null)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[chatgpt-oauth] complete state lookup failed:", error.message);
      return jsonOAuthError(res, 500, "server_error", "Could not verify OAuth state");
    }
    stateRow = data;
  } catch (err) {
    console.error("[chatgpt-oauth] complete state lookup unexpected:", err?.message || "unknown");
    return jsonOAuthError(res, 500, "server_error", "Could not verify OAuth state");
  }

  if (!stateRow?.id || (stateRow.expires_at && new Date(stateRow.expires_at).getTime() < Date.now())) {
    return jsonOAuthError(res, 400, "invalid_grant", "OAuth state is invalid or expired");
  }

  const code = generateOpaqueToken("pmgpt_code_", 24);
  const codeHash = hashSecret(code);
  const nowIso = new Date().toISOString();

  try {
    const { error: insertError } = await supabase.from("chatgpt_oauth_authorization_codes").insert({
      code_hash: codeHash,
      user_id: identity.userId,
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopeCheck.scope,
      expires_at: chatgptOAuthCodeExpiry(),
      metadata: {
        source: "chatgpt_actions",
        stateId: stateRow.id,
      },
    });
    if (insertError) {
      console.error("[chatgpt-oauth] complete code insert failed:", insertError.message);
      return jsonOAuthError(res, 500, "server_error", "Could not issue authorization code");
    }

    const { error: consumeError } = await supabase
      .from("chatgpt_oauth_states")
      .update({ consumed_at: nowIso })
      .eq("id", stateRow.id)
      .is("consumed_at", null);
    if (consumeError) {
      console.error("[chatgpt-oauth] complete state consume failed:", consumeError.message);
      return jsonOAuthError(res, 500, "server_error", "Could not complete OAuth authorization");
    }
  } catch (err) {
    console.error("[chatgpt-oauth] complete unexpected:", err?.message || "unknown");
    return jsonOAuthError(res, 500, "server_error", "Could not complete OAuth authorization");
  }

  const redirectUrl = _redirectWithParams(redirectUri, { code, state });
  return res.status(200).json({ ok: true, redirectUrl });
}

async function handleToken(req, res) {
  if (req.method !== "POST") {
    return jsonOAuthError(res, 405, "invalid_request", "POST required");
  }

  const rl = await basicRateLimit({
    key: `chatgpt_oauth_token:${clientIpKey(req)}`,
    limit: 60,
  });
  if (!rl.allow) {
    return jsonOAuthError(res, rl.status || 429, "slow_down", "Too many token requests");
  }

  const body = await readOAuthBody(req);
  const grantType = _s(body?.grant_type);
  const code = _s(body?.code);
  const clientId = _s(body?.client_id);
  const clientSecret = _s(body?.client_secret);
  const redirectUri = _s(body?.redirect_uri);

  if (grantType !== "authorization_code") {
    return jsonOAuthError(res, 400, "unsupported_grant_type", "grant_type must be authorization_code");
  }
  if (!code) {
    return jsonOAuthError(res, 400, "invalid_request", "code is required");
  }

  const client = validateChatgptOAuthClient({
    clientId,
    clientSecret,
    redirectUri,
    requireSecret: true,
  });
  if (!client.ok) {
    return jsonOAuthError(res, client.status, client.error, client.message);
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonOAuthError(res, 503, "server_error", "OAuth service is not configured");
  }

  let codeRow = null;
  try {
    const { data, error } = await supabase
      .from("chatgpt_oauth_authorization_codes")
      .select("id, user_id, client_id, redirect_uri, scope, expires_at, consumed_at")
      .eq("code_hash", hashSecret(code))
      .eq("client_id", clientId)
      .eq("redirect_uri", redirectUri)
      .is("consumed_at", null)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[chatgpt-oauth] token code lookup failed:", error.message);
      return jsonOAuthError(res, 500, "server_error", "Could not verify authorization code");
    }
    codeRow = data;
  } catch (err) {
    console.error("[chatgpt-oauth] token code lookup unexpected:", err?.message || "unknown");
    return jsonOAuthError(res, 500, "server_error", "Could not verify authorization code");
  }

  if (!codeRow?.id || (codeRow.expires_at && new Date(codeRow.expires_at).getTime() < Date.now())) {
    return jsonOAuthError(res, 400, "invalid_grant", "Authorization code is invalid or expired");
  }

  const accessToken = generateOpaqueToken();
  const expiresAt = chatgptOAuthAccessTokenExpiry(client.config.tokenTtlSeconds);
  const nowIso = new Date().toISOString();

  try {
    const { error: consumeError } = await supabase
      .from("chatgpt_oauth_authorization_codes")
      .update({ consumed_at: nowIso })
      .eq("id", codeRow.id)
      .is("consumed_at", null);
    if (consumeError) {
      console.error("[chatgpt-oauth] token code consume failed:", consumeError.message);
      return jsonOAuthError(res, 500, "server_error", "Could not consume authorization code");
    }

    const { error: tokenError } = await supabase.from("chatgpt_oauth_access_tokens").insert({
      token_hash: hashSecret(accessToken),
      token_prefix: getTokenPrefix(accessToken),
      user_id: codeRow.user_id,
      client_id: clientId,
      scope: codeRow.scope || CHATGPT_OAUTH_SCOPE,
      expires_at: expiresAt,
      metadata: {
        source: "chatgpt_actions",
        authorizationCodeId: codeRow.id,
      },
    });
    if (tokenError) {
      console.error("[chatgpt-oauth] token insert failed:", tokenError.message);
      return jsonOAuthError(res, 500, "server_error", "Could not issue access token");
    }
  } catch (err) {
    console.error("[chatgpt-oauth] token unexpected:", err?.message || "unknown");
    return jsonOAuthError(res, 500, "server_error", "Could not issue access token");
  }

  return res.status(200).json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: client.config.tokenTtlSeconds,
    scope: codeRow.scope || CHATGPT_OAUTH_SCOPE,
  });
}

export default async function handler(req, res) {
  setOAuthCors(res);
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Force config evaluation for every operation so missing env fails closed.
  const cfg = getChatgptOAuthConfig();
  if (!cfg.ok) {
    return jsonOAuthError(res, 503, "server_error", "OAuth service is not configured");
  }

  switch (_op(req)) {
    case "authorize":
      return handleAuthorize(req, res);
    case "complete":
      return handleComplete(req, res);
    case "token":
      return handleToken(req, res);
    default:
      return jsonOAuthError(res, 404, "invalid_request", "Unknown OAuth endpoint");
  }
}
