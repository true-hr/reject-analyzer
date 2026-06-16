export const GITHUB_CONNECTION_STATUSES = Object.freeze([
  "connected",
  "disconnected",
  "revoked",
  "error",
]);

export const GITHUB_CONNECTION_TYPES = Object.freeze([
  "github_app",
  "oauth_app",
]);

export const GITHUB_TOKEN_FORBIDDEN_KEYS = Object.freeze([
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "secret",
  "private_key",
  "client_secret",
]);

export const GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS = Object.freeze([
  "diff",
  "patch",
  "raw",
  "raw_payload",
  "raw_text",
  "body",
]);

const FORBIDDEN_STORAGE_KEYS = Object.freeze([
  ...GITHUB_TOKEN_FORBIDDEN_KEYS,
  ...GITHUB_RAW_PAYLOAD_FORBIDDEN_KEYS,
]);

function contractError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBigintString(value, fieldName) {
  if (typeof value === "bigint") {
    if (value < 0n) throw contractError("INVALID_BIGINT", `${fieldName} must be non-negative`);
    return value.toString();
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw contractError("INVALID_BIGINT", `${fieldName} must be a safe non-negative integer`);
    }
    return String(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw contractError("INVALID_BIGINT", `${fieldName} must be an integer-like string`);
    }
    return BigInt(trimmed).toString();
  }

  throw contractError("INVALID_BIGINT", `${fieldName} is required`);
}

function assertPlainObject(value, fieldName) {
  if (!isPlainObject(value)) {
    throw contractError("INVALID_OBJECT", `${fieldName} must be a plain object`);
  }
}

function findForbiddenStorageKey(value, path = []) {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findForbiddenStorageKey(value[index], [...path, String(index)]);
      if (found) return found;
    }
    return null;
  }

  if (!value || typeof value !== "object") return null;

  for (const [key, child] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_STORAGE_KEYS.includes(normalizedKey)) {
      return [...path, key].join(".");
    }
    const found = findForbiddenStorageKey(child, [...path, key]);
    if (found) return found;
  }

  return null;
}

function assertNoForbiddenStorageKeys(value, fieldName) {
  const found = findForbiddenStorageKey(value);
  if (found) {
    throw contractError("FORBIDDEN_STORAGE_KEY", `${fieldName} contains forbidden key: ${found}`);
  }
}

function shallowPlainClone(value) {
  return Object.fromEntries(Object.entries(value));
}

function normalizeAccountType(value) {
  const type = trimString(value);
  const lower = type.toLowerCase();
  if (lower === "user") return "User";
  if (lower === "organization" || lower === "org") return "Organization";
  if (!type) throw contractError("INVALID_ACCOUNT_TYPE", "github_account_type is required");
  return type;
}

function normalizeBoolean(value, fieldName) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw contractError("INVALID_BOOLEAN", `${fieldName} must be boolean`);
}

function resolveOwner(input) {
  if (typeof input.owner === "string") return trimString(input.owner);
  if (isPlainObject(input.owner)) return trimString(input.owner.login || input.owner.name);
  return "";
}

export function normalizeGithubAccount(input = {}) {
  assertPlainObject(input, "account");
  assertNoForbiddenStorageKeys(input, "account");

  const github_account_id = normalizeBigintString(input.id ?? input.github_account_id, "github_account_id");
  const github_login = trimString(input.login ?? input.github_login);
  if (!github_login) throw contractError("INVALID_LOGIN", "github_login is required");

  return {
    github_account_id,
    github_login,
    github_account_type: normalizeAccountType(input.type ?? input.github_account_type),
  };
}

export function normalizeGithubInstallation(input = {}) {
  assertPlainObject(input, "installation");
  assertNoForbiddenStorageKeys(input, "installation");

  const installationId = input.id ?? input.installation_id;
  const grantedPermissions = input.permissions ?? input.granted_permissions ?? {};
  const grantedEvents = input.events ?? input.granted_events ?? [];

  assertPlainObject(grantedPermissions, "granted_permissions");
  if (!Array.isArray(grantedEvents)) {
    throw contractError("INVALID_EVENTS", "granted_events must be an array");
  }

  return {
    installation_id: installationId == null ? null : normalizeBigintString(installationId, "installation_id"),
    granted_permissions: shallowPlainClone(grantedPermissions),
    granted_events: grantedEvents.map((event) => trimString(event)).filter(Boolean),
  };
}

export function normalizeGithubRepository(input = {}) {
  assertPlainObject(input, "repository");
  assertNoForbiddenStorageKeys(input, "repository");

  const github_repo_id = normalizeBigintString(input.id ?? input.github_repo_id, "github_repo_id");
  const owner = resolveOwner(input);
  const name = trimString(input.name);
  const full_name = trimString(input.full_name);

  if (!owner) throw contractError("INVALID_OWNER", "owner is required");
  if (!name) throw contractError("INVALID_REPOSITORY_NAME", "name is required");
  if (!full_name) throw contractError("INVALID_FULL_NAME", "full_name is required");
  if (full_name !== `${owner}/${name}`) {
    throw contractError("INVALID_FULL_NAME", "full_name must match owner/name");
  }

  const permissionSnapshot = input.permission_snapshot ?? input.permissions ?? {};
  assertPlainObject(permissionSnapshot, "permission_snapshot");
  assertNoForbiddenStorageKeys(permissionSnapshot, "permission_snapshot");

  return {
    github_repo_id,
    owner,
    name,
    full_name,
    private: normalizeBoolean(input.private ?? false, "private"),
    permission_snapshot: shallowPlainClone(permissionSnapshot),
  };
}

export function validateGithubRepositoryAccessSnapshot(snapshot) {
  try {
    normalizeGithubRepository(snapshot);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error?.code || "INVALID_REPOSITORY_ACCESS_SNAPSHOT",
        message: error?.message || "Repository access snapshot is invalid",
      },
    };
  }
}

export function buildGithubConnectionRecord({ userId, account, installation } = {}) {
  const user_id = trimString(userId);
  if (!user_id) throw contractError("INVALID_USER_ID", "verified userId is required");

  const normalizedAccount = normalizeGithubAccount(account);
  const normalizedInstallation = normalizeGithubInstallation(installation ?? {});

  return {
    user_id,
    ...normalizedAccount,
    ...normalizedInstallation,
    connection_type: "github_app",
    status: "connected",
  };
}

export function buildGithubRepositoryAccessRecord({
  userId,
  connectionId,
  repository,
  selected = false,
} = {}) {
  const user_id = trimString(userId);
  const connection_id = trimString(connectionId);
  if (!user_id) throw contractError("INVALID_USER_ID", "verified userId is required");
  if (!connection_id) throw contractError("INVALID_CONNECTION_ID", "connectionId is required");

  return {
    user_id,
    connection_id,
    ...normalizeGithubRepository(repository),
    selected: normalizeBoolean(selected, "selected"),
  };
}
