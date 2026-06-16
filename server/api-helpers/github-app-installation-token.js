import { createSign } from "crypto";

const GITHUB_APP_INSTALLATION_TOKEN_URL = "https://api.github.com/app/installations";

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function normalizeGithubAppId(value) {
  const appId = trimString(value);
  if (!/^\d{1,20}$/.test(appId)) return null;
  return appId;
}

export function normalizeGithubPrivateKey(value) {
  const key = trimString(value).replace(/\\n/g, "\n");
  if (!key) return null;
  if (!key.includes("BEGIN") || !key.includes("PRIVATE KEY") || !key.includes("END")) return null;
  return key;
}

export function readGithubAppPrivateConfig(env = process.env) {
  const appId = normalizeGithubAppId(env?.GITHUB_APP_ID);
  const privateKey = normalizeGithubPrivateKey(env?.GITHUB_APP_PRIVATE_KEY);
  if (!appId || !privateKey) return { configured: false };
  return { configured: true, appId, privateKey };
}

export function isGithubInstallationTokenConfigMissing(result) {
  return result?.code === "github_app_private_config_missing";
}

export function isGithubInstallationTokenUnavailable(result) {
  return result?.code === "github_installation_token_unavailable";
}

export function createGithubAppJwt({
  appId,
  privateKey,
  now = Date.now,
} = {}) {
  const normalizedAppId = normalizeGithubAppId(appId);
  const normalizedPrivateKey = normalizeGithubPrivateKey(privateKey);
  if (!normalizedAppId || !normalizedPrivateKey) {
    return { ok: false, code: "github_app_private_config_missing" };
  }

  const nowSeconds = Math.floor(Number(now()) / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iat: nowSeconds - 60,
    exp: nowSeconds + 9 * 60,
    iss: normalizedAppId,
  };
  const unsigned = `${base64urlJson(header)}.${base64urlJson(payload)}`;

  try {
    const signature = createSign("RSA-SHA256")
      .update(unsigned)
      .end()
      .sign(normalizedPrivateKey, "base64url");
    return { ok: true, jwt: `${unsigned}.${signature}` };
  } catch {
    return { ok: false, code: "github_installation_token_unavailable" };
  }
}

export async function createGithubInstallationAccessToken({
  installationId,
  env = process.env,
  fetchFn = globalThis.fetch,
  now = Date.now,
} = {}) {
  const config = readGithubAppPrivateConfig(env);
  if (!config.configured) return { ok: false, code: "github_app_private_config_missing" };
  const id = trimString(installationId);
  if (!/^\d{1,20}$/.test(id)) return { ok: false, code: "github_installation_token_unavailable" };

  const jwtResult = createGithubAppJwt({ appId: config.appId, privateKey: config.privateKey, now });
  if (!jwtResult.ok) return { ok: false, code: jwtResult.code || "github_installation_token_unavailable" };

  try {
    const response = await fetchFn(`${GITHUB_APP_INSTALLATION_TOKEN_URL}/${id}/access_tokens`, {
      method: "POST",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${jwtResult.jwt}`,
        "x-github-api-version": "2022-11-28",
      },
    });
    if (!response?.ok) return { ok: false, code: "github_installation_token_unavailable" };
    const data = await response.json().catch(() => null);
    const token = trimString(data?.token);
    if (!token) return { ok: false, code: "github_installation_token_unavailable" };
    return { ok: true, token };
  } catch {
    return { ok: false, code: "github_installation_token_unavailable" };
  }
}
