// tools/passmap-mcp-local/lib/store.mjs
// File-backed JSON store for the local PASSMAP MCP demo.
// Single-file storage at ./data/experiences.json. No external dependencies.
//
// IMPORTANT: This store is for local UX validation only. It does NOT talk to
// Supabase / Postgres / any production database. It does NOT scale beyond a
// few hundred records. Concurrent writes are not protected — single MCP
// client per process is assumed.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

import { validateSavePayload, validateSearchPayload } from "./validate.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DEFAULT_DATA_PATH = resolve(__dirname, "..", "data", "experiences.json");

const DATA_VERSION = 1;

function _readAll(dataPath) {
  if (!existsSync(dataPath)) {
    mkdirSync(dirname(dataPath), { recursive: true });
    writeFileSync(dataPath, JSON.stringify({ version: DATA_VERSION, items: [] }, null, 2), "utf8");
    return { version: DATA_VERSION, items: [] };
  }
  const raw = readFileSync(dataPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    return { version: DATA_VERSION, items: [] };
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.items)) {
    return { version: DATA_VERSION, items: [] };
  }
  return { version: parsed.version || DATA_VERSION, items: parsed.items };
}

function _writeAll(dataPath, store) {
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, JSON.stringify(store, null, 2), "utf8");
}

function _generateId() {
  return `exp_${randomUUID()}`;
}

function _matchesAllTags(itemTags, queryTags) {
  if (queryTags.length === 0) return true;
  const haystack = new Set((itemTags || []).map((t) => String(t).toLowerCase()));
  return queryTags.every((t) => haystack.has(String(t).toLowerCase()));
}

function _matchesFreeText(item, queryLower) {
  if (!queryLower) return true;
  const buckets = [
    item.title,
    item.situation,
    item.task,
    item.resultCandidate,
    ...(item.actions || []),
    ...(item.skills || []),
    ...(item.jobTags || []),
    ...(item.industryTags || []),
    ...(item.evidenceTexts || []),
  ];
  for (const v of buckets) {
    if (typeof v === "string" && v.toLowerCase().includes(queryLower)) return true;
  }
  return false;
}

function _summarize(item) {
  const parts = [];
  if (item.situation) parts.push(item.situation);
  if (item.task) parts.push(item.task);
  if (parts.length === 0 && Array.isArray(item.actions) && item.actions.length > 0) {
    parts.push(item.actions.slice(0, 2).join(" · "));
  }
  const text = parts.join(" / ");
  if (text.length <= 200) return text;
  return text.slice(0, 197) + "…";
}

function _suggestedUse(item) {
  const tags = [...(item.jobTags || []), ...(item.industryTags || []), ...(item.skills || [])];
  if (tags.length === 0) {
    return "이 경험의 활용 방향은 아직 명확하지 않습니다. 직무·산업 태그를 보강해 보세요.";
  }
  const preview = tags.slice(0, 3).join(", ");
  return `이 경험은 ${preview} 관련 이력서·면접 문항에 활용할 수 있습니다.`;
}

/**
 * Save a validated payload. Returns the persisted item.
 * Throws if validation fails — caller is responsible for catching and
 * surfacing the error code/message.
 */
export function saveExperience(input, { dataPath = DEFAULT_DATA_PATH } = {}) {
  const v = validateSavePayload(input);
  if (!v.ok) {
    const err = new Error(v.message);
    err.code = v.errorCode;
    throw err;
  }
  const store = _readAll(dataPath);
  const id = _generateId();
  const createdAt = new Date().toISOString();
  const item = {
    id,
    ...v.normalized,
    status: "candidate",
    createdAt,
  };
  store.items.push(item);
  _writeAll(dataPath, store);
  return item;
}

/**
 * Search stored items. Returns up to `limit` results.
 * - free-text query (case-insensitive substring across multiple fields)
 * - tag filters (AND across each tag dimension)
 * - empty query: most-recent first
 */
export function searchExperiences(input = {}, { dataPath = DEFAULT_DATA_PATH } = {}) {
  const v = validateSearchPayload(input);
  if (!v.ok) {
    const err = new Error(v.message);
    err.code = v.errorCode;
    throw err;
  }
  const { query, skills, jobTags, industryTags, limit } = v.normalized;
  const store = _readAll(dataPath);
  const queryLower = query.toLowerCase();

  const all = store.items
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const matched = [];
  for (const item of all) {
    if (!_matchesFreeText(item, queryLower)) continue;
    if (!_matchesAllTags(item.skills, skills)) continue;
    if (!_matchesAllTags(item.jobTags, jobTags)) continue;
    if (!_matchesAllTags(item.industryTags, industryTags)) continue;
    matched.push(item);
    if (matched.length >= limit) break;
  }

  return {
    count: matched.length,
    items: matched.map((item) => ({
      id: item.id,
      title: item.title,
      summary: _summarize(item),
      skills: item.skills || [],
      jobTags: item.jobTags || [],
      industryTags: item.industryTags || [],
      suggestedUse: _suggestedUse(item),
      evidenceTexts: item.evidenceTexts || [],
      createdAt: item.createdAt,
    })),
  };
}

export const _internals = {
  DEFAULT_DATA_PATH,
  DATA_VERSION,
  _readAll,
  _writeAll,
  _matchesAllTags,
  _matchesFreeText,
  _summarize,
  _suggestedUse,
};
