import {
  buildGithubRepositoryAccessRecord,
  normalizeGithubRepository,
} from "./github-app-connection.js";

const GITHUB_INSTALLATION_REPOSITORIES_URL = "https://api.github.com/installation/repositories";

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeRepoId(value) {
  const id = trimString(value);
  if (!/^\d{1,20}$/.test(id)) return null;
  return BigInt(id).toString();
}

function rowRepoId(row) {
  return normalizeRepoId(row?.github_repo_id);
}

function isUnavailableError(error, tableName) {
  const code = trimString(error?.code).toUpperCase();
  if (["42P01", "PGRST205", "PGRST202"].includes(code)) return true;
  const message = trimString(error?.message).toLowerCase();
  return message.includes(tableName) || message.includes("schema cache");
}

function safeRepositoryResponse(row = {}) {
  return {
    github_repo_id: String(row.github_repo_id),
    owner: row.owner,
    name: row.name,
    full_name: row.full_name,
    private: row.private === true,
    selected: row.selected === true,
    permission_snapshot: row.permission_snapshot && typeof row.permission_snapshot === "object"
      ? row.permission_snapshot
      : {},
  };
}

export function normalizeGithubRepositoryFromInstallation(repository = {}) {
  return normalizeGithubRepository({
    id: repository.id,
    owner: repository.owner,
    name: repository.name,
    full_name: repository.full_name,
    private: repository.private === true,
    permissions: repository.permissions || {},
  });
}

export async function readConnectedGithubConnectionForUser({ supabase, userId } = {}) {
  try {
    const { data, error } = await supabase
      .from("github_connections")
      .select("id, user_id, installation_id, github_login, connection_type, status, connected_at, updated_at")
      .eq("user_id", userId)
      .eq("connection_type", "github_app")
      .eq("status", "connected")
      .order("connected_at", { ascending: false, nullsFirst: false })
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        code: "github_connection_unavailable",
        unavailable: isUnavailableError(error, "github_connections"),
      };
    }
    return { ok: true, connection: data || null };
  } catch (error) {
    return {
      ok: false,
      code: "github_connection_unavailable",
      unavailable: isUnavailableError(error, "github_connections"),
    };
  }
}

export async function fetchGithubInstallationRepositories({
  installationToken,
  fetchFn = globalThis.fetch,
} = {}) {
  const token = trimString(installationToken);
  if (!token || !fetchFn) return { ok: false, code: "github_repository_list_unavailable" };

  try {
    const response = await fetchFn(GITHUB_INSTALLATION_REPOSITORIES_URL, {
      method: "GET",
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${token}`,
        "x-github-api-version": "2022-11-28",
      },
    });
    if (!response?.ok) return { ok: false, code: "github_repository_list_unavailable" };
    const data = await response.json().catch(() => null);
    const repositories = safeArray(data?.repositories).map(normalizeGithubRepositoryFromInstallation);
    return { ok: true, repositories };
  } catch {
    return { ok: false, code: "github_repository_list_unavailable" };
  }
}

export async function readGithubRepositoryAccessRows({ supabase, userId, connectionId } = {}) {
  try {
    const { data, error } = await supabase
      .from("github_repository_access")
      .select("id, user_id, connection_id, github_repo_id, owner, name, full_name, private, selected, permission_snapshot")
      .eq("user_id", userId)
      .eq("connection_id", connectionId);
    if (error) {
      return {
        ok: false,
        code: "github_repository_access_unavailable",
        unavailable: isUnavailableError(error, "github_repository_access"),
      };
    }
    return { ok: true, rows: safeArray(data) };
  } catch (error) {
    return {
      ok: false,
      code: "github_repository_access_unavailable",
      unavailable: isUnavailableError(error, "github_repository_access"),
    };
  }
}

export async function persistGithubRepositoryAccessSnapshots({
  supabase,
  userId,
  connectionId,
  repositories = [],
  existingRows = [],
} = {}) {
  const existingByRepoId = new Map(existingRows.map((row) => [rowRepoId(row), row]).filter(([id]) => Boolean(id)));
  const savedRows = [];

  try {
    for (const repository of repositories) {
      const repoId = normalizeRepoId(repository.github_repo_id);
      if (!repoId) continue;
      const existing = existingByRepoId.get(repoId);
      const record = buildGithubRepositoryAccessRecord({
        userId,
        connectionId,
        repository,
        selected: existing?.selected === true,
      });

      if (existing?.id) {
        const patch = {
          owner: record.owner,
          name: record.name,
          full_name: record.full_name,
          private: record.private,
          permission_snapshot: record.permission_snapshot,
          selected: record.selected,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from("github_repository_access")
          .update(patch)
          .eq("id", existing.id)
          .eq("user_id", userId)
          .eq("connection_id", connectionId)
          .eq("github_repo_id", repoId);
        if (error) {
          return { ok: false, code: "github_repository_access_unavailable" };
        }
        savedRows.push({ ...record, id: existing.id });
      } else {
        const { error } = await supabase
          .from("github_repository_access")
          .insert(record);
        if (error) {
          return { ok: false, code: "github_repository_access_unavailable" };
        }
        savedRows.push(record);
      }
    }
    return { ok: true, rows: savedRows };
  } catch {
    return { ok: false, code: "github_repository_access_unavailable" };
  }
}

export function normalizeGithubRepositorySelectionPayload(body = {}) {
  if (body?.user_id || body?.connection_id) {
    return { ok: false, code: "github_repository_selection_scope_forbidden" };
  }

  if (Array.isArray(body?.selected_repo_ids)) {
    const ids = body.selected_repo_ids.map(normalizeRepoId).filter(Boolean);
    return { ok: true, selectedRepoIds: [...new Set(ids)] };
  }

  if (Array.isArray(body?.repositories)) {
    const selectedRepoIds = [];
    for (const item of body.repositories) {
      const id = normalizeRepoId(item?.github_repo_id);
      if (!id) return { ok: false, code: "github_repository_selection_invalid" };
      if (item?.selected === true) selectedRepoIds.push(id);
    }
    return { ok: true, selectedRepoIds: [...new Set(selectedRepoIds)] };
  }

  return { ok: false, code: "github_repository_selection_required" };
}

export async function updateGithubRepositorySelection({
  supabase,
  userId,
  connectionId,
  selectedRepoIds = [],
  existingRows = [],
} = {}) {
  const selectedSet = new Set(selectedRepoIds.map(normalizeRepoId).filter(Boolean));
  const rowsByRepoId = new Map(existingRows.map((row) => [rowRepoId(row), row]).filter(([id]) => Boolean(id)));
  const missing = [...selectedSet].filter((id) => !rowsByRepoId.has(id));
  if (missing.length > 0) return { ok: false, code: "github_repository_not_found" };

  try {
    const selectedRows = [];
    for (const row of existingRows) {
      const repoId = rowRepoId(row);
      if (!repoId) continue;
      const selected = selectedSet.has(repoId);
      const { error } = await supabase
        .from("github_repository_access")
        .update({ selected, updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("user_id", userId)
        .eq("connection_id", connectionId)
        .eq("github_repo_id", repoId);
      if (error) return { ok: false, code: "github_repository_access_unavailable" };
      if (selected) selectedRows.push({ ...row, selected: true });
    }
    return { ok: true, selectedRows };
  } catch {
    return { ok: false, code: "github_repository_access_unavailable" };
  }
}

export function buildGithubRepositoryAccessListResponse({ rows = [], warning = null } = {}) {
  const response = {
    ok: true,
    repositories: safeArray(rows).map(safeRepositoryResponse),
    next_action: "select_github_repositories",
  };
  if (warning) response.warning = warning;
  return response;
}

export function buildGithubRepositorySelectionResponse({ selectedRows = [] } = {}) {
  const selected = safeArray(selectedRows).map((row) => ({
    github_repo_id: String(row.github_repo_id),
    full_name: row.full_name,
    selected: true,
  }));
  return {
    ok: true,
    repositories_selected: selected.length,
    selected_repositories: selected,
    next_action: "import_recent_github_pull_requests",
  };
}
