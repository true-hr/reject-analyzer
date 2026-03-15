const SLOT_B_PREFERRED_CLUSTERS = ["evidence_strength", "jd_alignment"];
const MUST_INCLUDE_CLUSTERS = ["hard_gate", "seniority_gap", "domain_fit"];
const MUST_INCLUDE_THRESHOLD = 0.72;

function __toSortedActions(actions = []) {
  return [...(Array.isArray(actions) ? actions : [])].sort(
    (a, b) => Number(b?.priority || 0) - Number(a?.priority || 0)
  );
}

function __buildClusterScoreMap(actions = []) {
  const scores = new Map();
  for (const action of actions) {
    const cluster = String(action?.problemCluster || "").trim();
    if (!cluster) continue;
    const prev = Number(scores.get(cluster) || 0);
    const next = Math.max(prev, Number(action?.sourcePriority ?? action?.priority ?? 0));
    scores.set(cluster, next);
  }
  return scores;
}

function __pickBest(actions, { usedIds, coveredClusters, preferredClusters, allowCoveredCluster = false }) {
  const preferred = Array.isArray(preferredClusters) ? preferredClusters : [];
  const preferredSet = new Set(preferred);
  const pool = actions.filter((action) => {
    const actionId = String(action?.id || "").trim();
    const cluster = String(action?.problemCluster || "").trim();
    if (!actionId || usedIds.has(actionId)) return false;
    if (!allowCoveredCluster && cluster && coveredClusters.has(cluster)) return false;
    return true;
  });

  if (preferredSet.size) {
    const preferredHit = pool.find((action) => preferredSet.has(String(action?.problemCluster || "").trim()));
    if (preferredHit) return preferredHit;
  }
  return pool[0] || null;
}

function __pickByCluster(actions, cluster, usedIds, coveredClusters) {
  return __pickBest(actions, {
    usedIds,
    coveredClusters,
    preferredClusters: [cluster],
  });
}

function __pushSelection(out, action, usedIds, coveredClusters) {
  if (!action) return;
  const actionId = String(action?.id || "").trim();
  if (!actionId || usedIds.has(actionId)) return;
  out.push(action);
  usedIds.add(actionId);
  const cluster = String(action?.problemCluster || "").trim();
  if (cluster) coveredClusters.add(cluster);
}

export function rankActions(actions = []) {
  const sorted = __toSortedActions(actions);
  if (!sorted.length) return [];

  const clusterScores = __buildClusterScoreMap(sorted);
  const usedIds = new Set();
  const coveredClusters = new Set();
  const selected = [];

  const mustIncludeCluster = MUST_INCLUDE_CLUSTERS
    .filter((cluster) => Number(clusterScores.get(cluster) || 0) >= MUST_INCLUDE_THRESHOLD)
    .sort((a, b) => Number(clusterScores.get(b) || 0) - Number(clusterScores.get(a) || 0))[0];

  const strongestCluster =
    mustIncludeCluster ||
    [...clusterScores.entries()].sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0]?.[0] ||
    "";

  __pushSelection(
    selected,
    __pickByCluster(sorted, strongestCluster, usedIds, coveredClusters) ||
      __pickBest(sorted, { usedIds, coveredClusters }),
    usedIds,
    coveredClusters
  );

  __pushSelection(
    selected,
    __pickBest(sorted, {
      usedIds,
      coveredClusters,
      preferredClusters: SLOT_B_PREFERRED_CLUSTERS,
    }) ||
      __pickBest(sorted, { usedIds, coveredClusters }),
    usedIds,
    coveredClusters
  );

  if (
    mustIncludeCluster &&
    !coveredClusters.has(mustIncludeCluster) &&
    selected.length < 3
  ) {
    __pushSelection(
      selected,
      __pickByCluster(sorted, mustIncludeCluster, usedIds, coveredClusters),
      usedIds,
      coveredClusters
    );
  }

  const remainingCluster = [...clusterScores.entries()]
    .filter(([cluster]) => cluster && !coveredClusters.has(cluster))
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0]?.[0];
  const slotCAction =
    (remainingCluster &&
      __pickByCluster(sorted, remainingCluster, usedIds, coveredClusters)) ||
    __pickBest(sorted, { usedIds, coveredClusters });

  __pushSelection(
    selected,
    slotCAction,
    usedIds,
    coveredClusters
  );

  while (selected.length < 3) {
    const fallback = __pickBest(sorted, {
      usedIds,
      coveredClusters,
      allowCoveredCluster: true,
    });
    if (!fallback) break;
    __pushSelection(selected, fallback, usedIds, coveredClusters);
  }

  return selected.slice(0, 3);
}
