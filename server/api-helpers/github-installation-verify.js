import { buildGithubConnectionRecord } from "./github-app-connection.js";

const GITHUB_OAUTH_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_INSTALLATIONS_URL = "https://api.github.com/user/installations";
const GITHUB_OAUTH_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function nowIso(now = Date.now) {
  return new Date(Number(now())).toISOString();
}

function safeJsonObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function normalizeGithubOAuthCodeForCallback(value) {
  const code = trimString(value);
  if (!code) return null;
  if (code.length < 8 || code.length > 512) return null;
  if (!GITHUB_OAUTH_CODE_PATTERN.test(code)) return null;
  return code;
}

export function readGithubOAuthConfig(env = process.env) {
  const clientId = trimString(env?.GITHUB_CLIENT_ID);
  const clientSecret = trimString(env?.GITHUB_CLIENT_SECRET);
  const redirectUri = trimString(env?.GITHUB_APP_CALLBACK_URL);

  if (!clientId || !clientSecret) {
    return { configured: false };
  }

  return {
    configured: true,
    clientId,
    clientSecret,
    redirectUri: redirectUri || null,
  };
}

export async function exchangeGithubOAuthCodeForUserToken({
  code,
  config = readGithubOAuthConfig(),
  fetchFn = globalThis.fetch,
} = {}) {
  if (!config?.configured) return { ok: false, code: "github_oauth_config_missing" };
  if (!fetchFn) return { ok: false, code: "github_user_token_exchange_failed" };

  const body = {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
  };
  if (config.redirectUri) body.redirect_uri = config.redirectUri;

  try {
    const response = await fetchFn(GITHUB_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response?.ok) return { ok: false, code: "github_user_token_exchange_failed" };

    const data = safeJsonObject(await response.json());
    const accessToken = trimString(data.access_token);
    if (data.error || !accessToken) {
      return { ok: false, code: "github_user_token_exchange_failed" };
    }

    return { ok: true, accessToken };
  } catch {
    return { ok: false, code: "github_user_token_exchange_failed" };
  }
}

export async function readGithubUserInstallations({
  accessToken,
  fetchFn = globalThis.fetch,
} = {}) {
  const token = trimString(accessToken);
  if (!token || !fetchFn) {
    return { ok: false, code: "github_installation_verification_unavailable" };
  }

  try {
    const response = await fetchFn(GITHUB_USER_INSTALLATIONS_URL, {
      method: "GET",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
      },
    });

    if (!response?.ok) {
      return { ok: false, code: "github_installation_verification_unavailable" };
    }

    const data = safeJsonObject(await response.json());
    const installations = Array.isArray(data.installations) ? data.installations : [];
    return { ok: true, installations };
  } catch {
    return { ok: false, code: "github_installation_verification_unavailable" };
  }
}

export function findGithubInstallationById(installations = [], installationId) {
  const expected = trimString(installationId);
  if (!expected) return null;
  return installations.find((installation) => String(installation?.id) === expected) || null;
}

export function buildVerifiedGithubConnectionRecord({
  userId,
  installation,
  now = Date.now,
} = {}) {
  const safeInstallation = safeJsonObject(installation);
  const account = safeJsonObject(safeInstallation.account);
  const timestamp = nowIso(now);
  return {
    ...buildGithubConnectionRecord({
      userId,
      account,
      installation: {
        id: safeInstallation.id,
        permissions: safeJsonObject(safeInstallation.permissions),
        events: Array.isArray(safeInstallation.events) ? safeInstallation.events : [],
      },
    }),
    connected_at: timestamp,
    last_checked_at: timestamp,
    updated_at: timestamp,
    disconnected_at: null,
  };
}

export function isGithubConnectionPersistenceUnavailableError(error) {
  const code = trimString(error?.code).toUpperCase();
  if (["42P01", "PGRST205", "PGRST202"].includes(code)) return true;
  const message = trimString(error?.message).toLowerCase();
  return message.includes("github_connections") || message.includes("schema cache");
}

export async function persistVerifiedGithubConnection({ supabase, record } = {}) {
  try {
    const { data: existing, error: readError } = await supabase
      .from("github_connections")
      .select("id")
      .eq("user_id", record.user_id)
      .eq("connection_type", "github_app")
      .eq("installation_id", record.installation_id)
      .eq("status", "connected")
      .limit(1)
      .maybeSingle();

    if (readError) {
      return {
        ok: false,
        code: "github_connection_persistence_unavailable",
        unavailable: isGithubConnectionPersistenceUnavailableError(readError),
      };
    }

    if (existing?.id) {
      const patch = {
        github_account_id: record.github_account_id,
        github_login: record.github_login,
        github_account_type: record.github_account_type,
        granted_permissions: record.granted_permissions,
        granted_events: record.granted_events,
        status: "connected",
        disconnected_at: null,
        last_checked_at: record.last_checked_at,
        updated_at: record.updated_at,
      };
      const { error } = await supabase
        .from("github_connections")
        .update(patch)
        .eq("id", existing.id)
        .eq("user_id", record.user_id)
        .eq("connection_type", "github_app")
        .eq("installation_id", record.installation_id);
      if (error) {
        return {
          ok: false,
          code: "github_connection_persistence_unavailable",
          unavailable: isGithubConnectionPersistenceUnavailableError(error),
        };
      }
      return { ok: true, action: "updated" };
    }

    const { error } = await supabase
      .from("github_connections")
      .insert(record);
    if (error) {
      return {
        ok: false,
        code: "github_connection_persistence_unavailable",
        unavailable: isGithubConnectionPersistenceUnavailableError(error),
      };
    }

    return { ok: true, action: "inserted" };
  } catch (error) {
    return {
      ok: false,
      code: "github_connection_persistence_unavailable",
      unavailable: isGithubConnectionPersistenceUnavailableError(error),
    };
  }
}

export async function verifyAndPersistGithubInstallationConnection({
  supabase,
  userId,
  code,
  installationId,
  env = process.env,
  fetchFn = globalThis.fetch,
  now = Date.now,
} = {}) {
  const config = readGithubOAuthConfig(env);
  if (!config.configured) return { ok: false, code: "github_oauth_config_missing" };

  const tokenResult = await exchangeGithubOAuthCodeForUserToken({ code, config, fetchFn });
  if (!tokenResult.ok) return { ok: false, code: tokenResult.code || "github_user_token_exchange_failed" };

  const installationResult = await readGithubUserInstallations({
    accessToken: tokenResult.accessToken,
    fetchFn,
  });
  if (!installationResult.ok) {
    return { ok: false, code: installationResult.code || "github_installation_verification_unavailable" };
  }

  const installation = findGithubInstallationById(installationResult.installations, installationId);
  if (!installation) return { ok: false, code: "github_installation_not_accessible" };

  let record;
  try {
    record = buildVerifiedGithubConnectionRecord({ userId, installation, now });
  } catch {
    return { ok: false, code: "github_installation_verification_unavailable" };
  }

  const persistResult = await persistVerifiedGithubConnection({ supabase, record });
  if (!persistResult.ok) {
    return { ok: false, code: "github_connection_persistence_unavailable" };
  }

  return {
    ok: true,
    github_login: record.github_login,
    installation_id: record.installation_id,
    persistence: persistResult.action,
  };
}
