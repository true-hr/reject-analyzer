export function normalizePmMvpCustomTag(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function appendPmMvpCustomTag(items, rawValue) {
  const normalized = normalizePmMvpCustomTag(rawValue);
  if (!normalized) {
    return items;
  }

  return items.includes(normalized) ? items : [...items, normalized];
}
