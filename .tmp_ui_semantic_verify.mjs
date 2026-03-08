import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const DEV_URL = "http://127.0.0.1:4174";
const CDP_URL = "http://127.0.0.1:9222";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const cases = [
  {
    id: "A-1",
    jd: `서비스 기획 및 전략 부문 팀장/팀원 경력직 채용\n서비스 정책 수립 및 요구사항 정의\n로드맵 기반 개선 과제 도출`,
    resume: `현장 인력 스케줄 관리\n일일 배치 운영 및 근태 확인\n현장 운영 이슈 대응`,
  },
  {
    id: "A-2",
    jd: `전략기획\n사업전략 수립\n경영기획 및 GTM 전략 지원`,
    resume: `운영지원\n현장 운영관리\n스케줄 조정 및 운영 대응`,
  },
  {
    id: "B-1",
    jd: `서비스기획\n사용자 요구사항 정의\n서비스 로드맵 수립\n유관부서 협업 기반 정책 개선`,
    resume: `PM으로 요구사항 정의 수행\n서비스 개선 로드맵 운영\n정책/기능 기획 경험`,
  },
];

async function waitHttp(url, retries = 80, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {}
    await sleep(delay);
  }
  return false;
}

async function getJson(url, retries = 40, delay = 300) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
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
  close() {
    try { this.ws.close(); } catch {}
  }
}

function buildEval(caseObj) {
  const jd = JSON.stringify(caseObj.jd);
  const rs = JSON.stringify(caseObj.resume);
  const cid = JSON.stringify(caseObj.id);
  return `
(async () => {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const jdText = ${jd};
  const rsText = ${rs};
  const cid = ${cid};

  window.__E2E_ERRS__ = [];
  window.addEventListener('error', (e) => { try { window.__E2E_ERRS__.push(String(e.message||e.error||'error')); } catch {} });
  window.addEventListener('unhandledrejection', (e) => { try { window.__E2E_ERRS__.push(String(e.reason||'rejection')); } catch {} });

  const nodes = [...document.querySelectorAll('textarea, input[type="text"], input:not([type])')];
  const jdInput = nodes.find(el => /jd|채용공고|직무/.test(((el.previousElementSibling && el.previousElementSibling.innerText) || '') + ' ' + (el.placeholder || ''))) || nodes[0];
  const rsInput = nodes.find(el => /이력서|resume|지원용/.test(((el.previousElementSibling && el.previousElementSibling.innerText) || '') + ' ' + (el.placeholder || ''))) || nodes[1];
  const fire = (el, v) => {
    if (!el) return;
    el.focus();
    el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  };
  fire(jdInput, jdText);
  fire(rsInput, rsText);

  const y = [...document.querySelectorAll('input')].find(el => /예:\s*30|예:\s*3/.test(el.placeholder || ''));
  fire(y, '5');

  for (let i = 0; i < 8; i++) {
    const trig = [...document.querySelectorAll('button,[role="combobox"]')].find(el => /선택/.test((el.innerText || '').trim()));
    if (!trig) break;
    trig.click();
    await sleep(200);
    const opt = [...document.querySelectorAll('[role="option"], [data-radix-collection-item], [role="menuitem"]')]
      .find(el => {
        const t = (el.innerText || '').trim();
        return t && !/선택/.test(t);
      });
    if (opt) opt.click();
    await sleep(250);
  }

  const btn = [...document.querySelectorAll('button')].find(b => /바로 분석|분석하기|분석 시작/.test((b.innerText || '').trim()));
  if (btn) btn.click();

  await sleep(15000);

  const a = window.__DBG_ANALYSIS__ || window.__DBG_ACTIVE__ || null;
  const sem = window.__DBG_SEMANTIC__ || window.__DBG_SEMANTIC_LAST__ || null;
  const el = [...document.querySelectorAll('section,div')].find(x => (x.innerText || '').includes('의미 기반 JD-이력서 매칭'));
  const cardText = el ? (el.innerText || '') : '';

  const matches = Array.isArray(a?.semanticMatch?.matches) ? a.semanticMatch.matches : [];
  const flat = [];
  for (const m of matches) {
    if (m && m.best && typeof m.best === 'object') {
      flat.push({ jd: m.jd || '', text: m.best.text || '', score: Number(m.best.score || 0), candidates: Array.isArray(m.candidates)?m.candidates.length:0 });
    }
  }
  flat.sort((x,y)=>y.score-x.score);
  return {
    caseId: cid,
    hasSemanticCard: !!el,
    bestAny: flat[0] || null,
    candidatesTotal: matches.reduce((acc,m)=>acc + (Array.isArray(m?.candidates)?m.candidates.length:0),0),
    matchesCount: matches.length,
    semanticPhase: sem?.phase || null,
    semanticError: sem?.error || null,
    semanticDevice: a?.semanticMatch?.device || null,
    semanticDtype: a?.semanticMatch?.dtype || null,
    cardPreview: cardText.slice(0, 260),
    jsErrors: window.__E2E_ERRS__ || []
  };
})();
`;
}

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

  const results = [];
  for (const c of cases) {
    await cdp.send("Page.navigate", { url: DEV_URL });
    await sleep(2000);
    const resp = await cdp.send("Runtime.evaluate", {
      expression: buildEval(c),
      awaitPromise: true,
      returnByValue: true,
    });
    results.push(resp?.result?.result?.value || { caseId: c.id, error: "no_value" });
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: String(e?.message || e) }, null, 2));
} finally {
  try { cdp?.close(); } catch {}
  try { edge?.kill("SIGKILL"); } catch {}
  try { dev?.kill("SIGKILL"); } catch {}
}
