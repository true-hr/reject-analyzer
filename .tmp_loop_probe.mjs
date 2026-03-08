import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const DEV_URL = "http://127.0.0.1:4174";
const CDP_URL = "http://127.0.0.1:9222";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

async function waitHttp(url, retries = 80, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await sleep(delay);
  }
  return false;
}

async function getJson(url, retries = 40, delay = 300) {
  for (let i = 0; i < retries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(delay);
  }
  throw new Error(`failed fetch ${url}`);
}

class CdpClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.waiters = new Map();
    this.ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg && msg.id && this.waiters.has(msg.id)) {
        const { resolve } = this.waiters.get(msg.id);
        this.waiters.delete(msg.id);
        resolve(msg);
      }
    };
  }
  async open() {
    if (this.ws.readyState === 1) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
    });
  }
  async send(method, params = {}) {
    const id = this.id++;
    const payload = JSON.stringify({ id, method, params });
    const p = new Promise((resolve, reject) => {
      this.waiters.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.waiters.has(id)) {
          this.waiters.delete(id);
          reject(new Error(`cdp timeout ${method}`));
        }
      }, 30000);
    });
    this.ws.send(payload);
    return await p;
  }
  close() { try { this.ws.close(); } catch {} }
}

const evalScript = `
(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  window.__PASSMAP_LOOP_TRACE__ = [];
  const clickByText = (re) => {
    const btn = [...document.querySelectorAll('button')].find(b => re.test((b.innerText || '').trim()));
    if (btn) { btn.click(); return true; }
    return false;
  };

  // InputFlow 노출 유도
  clickByText(/내 정보 입력|입력하기|시작/i);
  await sleep(500);
  clickByText(/job|직무|입력/i);
  await sleep(500);

  // ModeSelector의 카드형 버튼 우선 클릭
  const modeBtn = [...document.querySelectorAll('button')].find(el => {
    const cls = String(el.className || '');
    return cls.includes('rounded-2xl') && cls.includes('border-2');
  });
  if (modeBtn) {
    modeBtn.click();
    await sleep(350);
  }

  // 다음 버튼이 보이면 1회 진행
  const nextBtn = [...document.querySelectorAll('button')].find(el => /다음|next/i.test((el.innerText || '').trim()));
  if (nextBtn) {
    nextBtn.click();
    await sleep(300);
  }

  // 상태 변화 유도: 상단 버튼 중 클릭 가능한 것 순회
  const btns = [...document.querySelectorAll('button:not([disabled])')].slice(0, 16);
  for (const b of btns) {
    try { b.click(); } catch {}
    await sleep(120);
    const len = Array.isArray(window.__PASSMAP_LOOP_TRACE__) ? window.__PASSMAP_LOOP_TRACE__.length : 0;
    if (len > 8) break;
  }

  await sleep(1500);
  const trace = Array.isArray(window.__PASSMAP_LOOP_TRACE__) ? window.__PASSMAP_LOOP_TRACE__ : [];
  const pick = new Set([
    'APP_TO_INPUTFLOW_PRECHECK',
    'INPUTFLOW_TO_APP_PRECHECK',
    'INPUTFLOW_TO_APP_CALL',
    'INPUTFLOW_TO_APP_SKIP',
    'INPUTFLOW_PARENT_SYNC_DECISION',
    'APP_UISTATE_PRECHECK',
    'APP_UISTATE_DECISION',
    'APP_UISTATE_IN',
    'INPUTFLOW_RENDER',
    'INPUTFLOW_PARENT_SYNC',
    'APP_RENDER',
    'APP_TO_INPUTFLOW',
  ]);
  const filtered = trace.filter(x => pick.has(String(x?.source || '')));
  return {
    href: String(location.href || ""),
    buttonCount: document.querySelectorAll("button").length,
    total: trace.length,
    filteredCount: filtered.length,
    seq: filtered.map(x => x.source),
    precheckSamples: filtered.filter(x => x.source === 'INPUTFLOW_TO_APP_PRECHECK').map(x => x.payload).slice(-10),
    parentSyncDecisionSamples: filtered.filter(x => x.source === 'INPUTFLOW_PARENT_SYNC_DECISION').map(x => x.payload).slice(-10),
    appToInputFlowPrecheckSamples: filtered.filter(x => x.source === 'APP_TO_INPUTFLOW_PRECHECK').map(x => x.payload).slice(-10),
    appPrecheckSamples: filtered.filter(x => x.source === 'APP_UISTATE_PRECHECK').map(x => x.payload).slice(-10),
    appDecisionSamples: filtered.filter(x => x.source === 'APP_UISTATE_DECISION').map(x => x.payload).slice(-10),
  };
})();
`;

const dev = spawn("cmd.exe", ["/c", "npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "4174", "--strictPort", "--clearScreen", "false"], { stdio: "ignore" });
let edge;
let cdp;
try {
  const up = await waitHttp(DEV_URL);
  if (!up) throw new Error("dev_not_ready");

  const userDataDir = `${process.cwd()}/.tmp_edge_profile_ui`;
  edge = spawn(EDGE, ["--headless=new", "--disable-gpu", "--remote-debugging-port=9222", `--user-data-dir=${userDataDir}`, DEV_URL], { stdio: "ignore" });

  const tabs = await getJson(`${CDP_URL}/json/list`);
  const tab = tabs.find(t => (t.url || "").includes("127.0.0.1:4174")) || tabs[0];
  if (!tab?.webSocketDebuggerUrl) throw new Error("cdp_tab_not_found");

  cdp = new CdpClient(tab.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Runtime.enable", {});
  await cdp.send("Page.enable", {});
  await cdp.send("Page.navigate", { url: DEV_URL });
  await sleep(7000);

  const resp = await cdp.send("Runtime.evaluate", {
    expression: evalScript,
    awaitPromise: true,
    returnByValue: true,
  });

  console.log(JSON.stringify(resp?.result?.result?.value || { error: 'no_value' }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e?.message || e) }, null, 2));
} finally {
  try { cdp?.close(); } catch {}
  try { edge?.kill("SIGKILL"); } catch {}
  try { dev?.kill("SIGKILL"); } catch {}
}
