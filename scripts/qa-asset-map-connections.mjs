import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.argv[2] || "http://localhost:5173/reject-analyzer/";
const edgePath = process.env.EDGE_PATH || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const debugPort = Number(process.env.CDP_PORT || (9300 + Math.floor(Math.random() * 500)));
const profileDir = mkdtempSync(join(tmpdir(), "passmap-asset-map-qa-"));

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(targetUrl, attempts = 40) {
  let lastError = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(targetUrl);
      if (response.ok) return response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(250);
  }
  throw lastError;
}

function createCdpClient(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let seq = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const item = pending.get(message.id);
    if (!item) return;
    pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message || JSON.stringify(message.error)));
    else item.resolve(message.result);
  });

  const opened = new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  return {
    async send(method, params = {}, sessionId = null) {
      await opened;
      const id = ++seq;
      const result = new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, 15000);
        pending.set(id, {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (error) => {
            clearTimeout(timer);
            reject(error);
          },
        });
      });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      return result;
    },
    close() {
      socket.close();
    },
  };
}

const browser = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${profileDir}`,
  "about:blank",
], { stdio: "ignore" });

let cdp = null;

try {
  const version = await fetchJson(`http://127.0.0.1:${debugPort}/json/version`);
  cdp = createCdpClient(version.webSocketDebuggerUrl);
  await cdp.send("Target.setDiscoverTargets", { discover: true });
  const target = await cdp.send("Target.createTarget", {
    url: "about:blank",
  });
  const attached = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  const send = (method, params = {}) => cdp.send(method, params, sessionId);

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send("Page.navigate", { url });
  await delay(2500);
  const navigationProbe = await send("Runtime.evaluate", {
    expression: `(() => {
      const button = Array.from(document.querySelectorAll("button"))
        .find((node) => (node.textContent || "").includes("자산 맵"));
      if (button) button.click();
      return {
        clickedAssetMap: !!button,
        bodyText: (document.body?.innerText || "").slice(0, 300),
      };
    })()`,
    returnByValue: true,
  });
  await delay(2500);

  const expression = `(() => {
    const readEdges = (type) => Array.from(document.querySelectorAll(\`path[data-edge-type="\${type}"]\`)).map((path) => ({
      id: path.getAttribute("data-edge-id") || "",
      fromId: path.getAttribute("data-from-id") || "",
      toId: path.getAttribute("data-to-id") || "",
      strength: path.getAttribute("data-strength") || "",
      d: path.getAttribute("d") || "",
      opacity: path.getAttribute("opacity") || "",
      stroke: path.getAttribute("stroke") || "",
    }));
    const workEdges = readEdges("work-to-asset");
    const roleEdges = readEdges("asset-to-role");
    const allEdges = [...workEdges, ...roleEdges];
    const pairCounts = new Map();
    allEdges.forEach((edge) => {
      const key = \`\${edge.fromId}->\${edge.toId}\`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    });
    const duplicatePairs = Array.from(pairCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([pair, count]) => ({ pair, count }));
    const groupToIds = (edges) => {
      const map = new Map();
      edges.forEach((edge) => {
        if (!map.has(edge.fromId)) map.set(edge.fromId, new Set());
        map.get(edge.fromId).add(edge.toId);
      });
      return Object.fromEntries(Array.from(map.entries()).map(([fromId, toIds]) => [fromId, Array.from(toIds).sort()]));
    };
    const visibleTraceIds = Array.from(document.querySelectorAll('[data-connection-card="trace"][data-node-id]'))
      .map((node) => node.getAttribute("data-node-id"))
      .filter(Boolean);
    const visibleAssetIds = Array.from(document.querySelectorAll('[data-node-id^="asset-"]'))
      .map((node) => node.getAttribute("data-node-id"))
      .filter(Boolean);
    const visibleRoleIds = Array.from(document.querySelectorAll('[data-connection-card="direction"][data-node-id]'))
      .map((node) => node.getAttribute("data-node-id"))
      .filter(Boolean);
    const connectedTraceIds = new Set(workEdges.map((edge) => edge.fromId));
    const connectedAssetIds = new Set([
      ...workEdges.map((edge) => edge.toId),
      ...roleEdges.map((edge) => edge.fromId),
    ]);
    const connectedRoleIds = new Set(roleEdges.map((edge) => edge.toId));
    const visibleNodeIds = new Set([...visibleTraceIds, ...visibleAssetIds, ...visibleRoleIds]);
    const strongMediumMissingNodes = allEdges
      .filter((edge) => edge.strength === "strong" || edge.strength === "medium")
      .filter((edge) => !visibleNodeIds.has(edge.fromId) || !visibleNodeIds.has(edge.toId))
      .map((edge) => ({ id: edge.id, fromId: edge.fromId, toId: edge.toId, strength: edge.strength }));

    return {
      url: location.href,
      navigationProbe: ${JSON.stringify(null)},
      bodyTextSample: (document.body?.innerText || "").slice(0, 500),
      counts: {
        workToAsset: workEdges.length,
        assetToRole: roleEdges.length,
        total: allEdges.length,
        duplicatePairs: duplicatePairs.length,
        workFoundExperience: workEdges.filter((edge) => edge.fromId === "work-found-experience").length,
        missingD: allEdges.filter((edge) => !edge.d).length,
        opacityZero: allEdges.filter((edge) => edge.opacity === "0" || edge.opacity === "0.0").length,
        strokeNone: allEdges.filter((edge) => edge.stroke === "none").length,
        strongMediumMissingNodes: strongMediumMissingNodes.length,
      },
      byFromId: {
        workToAsset: groupToIds(workEdges),
        assetToRole: groupToIds(roleEdges),
      },
      duplicatePairs,
      orphanTraceIds: visibleTraceIds.filter((id) => !connectedTraceIds.has(id)),
      orphanAssetIds: visibleAssetIds.filter((id) => !connectedAssetIds.has(id)),
      orphanRoleIds: visibleRoleIds.filter((id) => !connectedRoleIds.has(id)),
      strongMediumMissingNodes,
    };
  })()`;

  const evaluated = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  const result = evaluated.result?.value || {};
  result.navigationProbe = navigationProbe.result?.value || null;
  console.log(JSON.stringify(result, null, 2));
} finally {
  if (cdp) cdp.close();
  browser.kill();
  await delay(500);
  try {
    rmSync(profileDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 250 });
  } catch {
    // Edge can hold the temp profile briefly after headless shutdown; this is not QA data.
  }
}
