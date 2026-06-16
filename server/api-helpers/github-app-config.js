const GITHUB_APP_INSTALL_BASE_URL = "https://github.com/apps";
const GITHUB_APP_SLUG_PATTERN = /^[A-Za-z0-9-]+$/;

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeGithubAppSlug(value) {
  const slug = trimString(value);
  if (!slug) return null;
  if (!GITHUB_APP_SLUG_PATTERN.test(slug)) return null;
  return slug;
}

export function buildGithubAppInstallUrl({ appSlug } = {}) {
  const slug = normalizeGithubAppSlug(appSlug);
  if (!slug) return null;
  return `${GITHUB_APP_INSTALL_BASE_URL}/${slug}/installations/new`;
}

export function readGithubAppPublicConfig(env = process.env) {
  const rawSlug = trimString(env?.GITHUB_APP_SLUG);
  if (!rawSlug) {
    return {
      configured: false,
      reason: "github_app_not_configured",
      installation_url: null,
    };
  }

  const appSlug = normalizeGithubAppSlug(rawSlug);
  if (!appSlug) {
    return {
      configured: false,
      reason: "github_app_invalid_config",
      installation_url: null,
    };
  }

  return {
    configured: true,
    reason: "github_connection_state_not_implemented",
    installation_url: buildGithubAppInstallUrl({ appSlug }),
  };
}
