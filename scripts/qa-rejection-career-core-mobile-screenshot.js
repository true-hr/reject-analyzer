import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { createServer } from "vite";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const tmpDir = path.join(projectRoot, ".tmp_rejection_career_core_mobile_qa");
const screenshotDir = path.join(projectRoot, "screenshots");
const desktopReadyScreenshot = path.join(screenshotDir, "rejection-career-core-desktop-ready.png");
const mobileReadyScreenshot = path.join(screenshotDir, "rejection-career-core-mobile-ready.png");
const mobileSkippedScreenshot = path.join(screenshotDir, "rejection-career-core-mobile-skipped.png");

function fsPath(value) {
  return value.replace(/\\/g, "/");
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "Google\\Chrome\\Application\\chrome.exe"),
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  assert.ok(found, "Chrome or Edge executable is required for screenshot QA");
  return found;
}

async function createHarness() {
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });
  await mkdir(screenshotDir, { recursive: true });

  const rootFs = fsPath(projectRoot);
  await writeFile(path.join(tmpDir, "index.html"), `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Rejection Career Core Mobile QA</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/qa-entry.jsx"></script>
      </body>
    </html>
  `);
  await writeFile(path.join(tmpDir, "qa-entry.jsx"), `
    import React, { useEffect } from "react";
    import ReactDOM from "react-dom/client";
    import "/@fs/${rootFs}/src/index.css";
    import PreciseAnalysisFlow from "/@fs/${rootFs}/src/components/input/PreciseAnalysisFlow.jsx";

    const params = new URLSearchParams(window.location.search);
    const scenario = params.get("scenario") || "ready";

    const readySignal = {
      status: "ready",
      source: "career_core_v0",
      target: {
        roleFamily: "marketing_growth",
        industryDomain: "b2b_saas",
        targetRoleText: scenario === "long"
          ? "Senior Lifecycle Content Marketing Operations Strategy Lead for Enterprise SaaS Conversion Programs"
          : "Content Marketing Manager",
        targetIndustryText: scenario === "long"
          ? "Enterprise B2B SaaS Platform and Career Education Marketplace Operations"
          : "B2B SaaS",
      },
      primaryFitLevel: "transferable",
      monthBuckets: {
        direct: 0,
        adjacent: 0,
        transferable: 18,
        unrelated: 0,
        unknown: 0,
        total: 18,
      },
    };

    const skippedSignal = {
      status: "skipped",
      reason: "target_not_inferred",
      source: "career_core_v0",
      target: null,
      primaryFitLevel: "unknown",
      monthBuckets: { direct: 0, adjacent: 0, transferable: 0, unrelated: 0, unknown: 0, total: 0 },
    };

    const analysis = {
      preciseAnalysis: {
        careerCoreSignal: scenario === "skipped" ? skippedSignal : readySignal,
        compositeRisk: {
          summary: {
            overallBand: "warning",
            overallReason: "핵심 리스크 요약 카드입니다. Career Core box와의 시각 위계를 비교하기 위한 synthetic summary입니다.",
          },
          topRisks: [],
          supporting: {
            lowRisks: [],
            insufficientData: [],
          },
        },
      },
    };

    function App() {
      useEffect(() => {
        const measure = () => {
          const box = Array.from(document.querySelectorAll("section")).find((node) =>
            node.textContent.includes("Career Core v0 참고 신호")
          );
          const bucketGrid = box ? Array.from(box.querySelectorAll("div")).find((node) =>
            node.className.includes("grid-cols-2") && node.textContent.includes("직접 유관")
          ) : null;
          document.documentElement.dataset.qaOverflow = String(document.documentElement.scrollWidth - window.innerWidth);
          document.documentElement.dataset.qaCareerCoreWidth = box ? String(Math.ceil(box.getBoundingClientRect().width)) : "0";
          document.documentElement.dataset.qaBucketGridWidth = bucketGrid ? String(Math.ceil(bucketGrid.getBoundingClientRect().width)) : "0";
        };
        measure();
        window.setTimeout(measure, 250);
      }, []);

      return (
        <main className="min-h-screen bg-slate-100 px-3 py-4 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-5xl">
            <PreciseAnalysisFlow
              mode="result"
              state={{
                jd: "Content marketing manager for lifecycle campaigns and CRM conversion content.",
                resume: "Career content and marketing resume sample.",
              }}
              setState={() => {}}
              analysis={analysis}
            />
          </div>
        </main>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  `);
}

async function capture({ chrome, url, output, width, height }) {
  await rm(output, { force: true });
  await execFileAsync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=5000",
    `--screenshot=${output}`,
    url,
  ], { timeout: 60000 });
  const stat = fs.statSync(output);
  assert.ok(stat.size > 10000, `screenshot appears empty: ${output}`);
}

async function dumpDom({ chrome, url, width, height }) {
  const { stdout } = await execFileAsync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=5000",
    "--dump-dom",
    url,
  ], { timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
  return stdout;
}

function assertReadyDom(dom) {
  assert.match(dom, /서류 탈락 원인 분석 결과/);
  assert.match(dom, /Career Core v0 참고 신호/);
  assert.match(dom, /개월 수는 정밀한 기간 산정이 아닌 항목 기준 참고값입니다/);
  assert.match(dom, /중복 기간이나 세부 기여도는 별도 보정하지 않습니다/);
  assert.match(dom, /18개월/);
  assert.match(dom, /전환 가능/);
}

function readMetric(dom, key) {
  const match = dom.match(new RegExp(`data-${key}="([^"]+)"`));
  return match ? Number(match[1]) : Number.NaN;
}

function assertNoHorizontalOverflow(dom, label) {
  const overflow = readMetric(dom, "qa-overflow");
  assert.ok(Number.isFinite(overflow), `${label}: missing overflow metric`);
  assert.ok(overflow <= 2, `${label}: horizontal overflow ${overflow}px`);
}

async function run() {
  await createHarness();

  const chrome = findChrome();
  const server = await createServer({
    root: tmpDir,
    resolve: {
      alias: {
        "@": path.join(projectRoot, "src"),
      },
    },
    server: {
      host: "127.0.0.1",
      port: 4192,
      strictPort: true,
      fs: { allow: [projectRoot, tmpDir] },
    },
    logLevel: "error",
  });
  await server.listen();

  const baseUrl = "http://127.0.0.1:4192";
  const rows = [];

  try {
    const desktopReadyUrl = `${baseUrl}/?scenario=long`;
    const mobileReadyUrl = `${baseUrl}/?scenario=ready`;
    const mobileSkippedUrl = `${baseUrl}/?scenario=skipped`;

    const desktopDom = await dumpDom({ chrome, url: desktopReadyUrl, width: 1366, height: 1000 });
    assertReadyDom(desktopDom);
    assertNoHorizontalOverflow(desktopDom, "desktop ready");
    assert.match(desktopDom, /Senior Lifecycle Content Marketing Operations Strategy Lead/);
    await capture({ chrome, url: desktopReadyUrl, output: desktopReadyScreenshot, width: 1366, height: 1000 });
    rows.push({
      case: "desktop ready + long target labels",
      result: "PASS",
      overflowPx: readMetric(desktopDom, "qa-overflow"),
    });

    const mobileDom = await dumpDom({ chrome, url: mobileReadyUrl, width: 390, height: 1100 });
    assertReadyDom(mobileDom);
    assertNoHorizontalOverflow(mobileDom, "mobile ready");
    const mobileCareerCoreWidth = readMetric(mobileDom, "qa-career-core-width");
    await capture({ chrome, url: mobileReadyUrl, output: mobileReadyScreenshot, width: 390, height: 1100 });
    rows.push({
      case: "mobile ready",
      result: "PASS",
      overflowPx: readMetric(mobileDom, "qa-overflow"),
      careerCoreWidth: mobileCareerCoreWidth,
    });

    const skippedDom = await dumpDom({ chrome, url: mobileSkippedUrl, width: 390, height: 900 });
    assert.match(skippedDom, /서류 탈락 원인 분석 결과/);
    assertNoHorizontalOverflow(skippedDom, "mobile skipped");
    assert.doesNotMatch(skippedDom, /Career Core v0 참고 신호/);
    assert.doesNotMatch(skippedDom, /18개월/);
    await capture({ chrome, url: mobileSkippedUrl, output: mobileSkippedScreenshot, width: 390, height: 900 });
    rows.push({
      case: "mobile skipped/missing",
      result: "PASS",
      overflowPx: readMetric(skippedDom, "qa-overflow"),
    });

    console.table(rows);
    console.log(`desktop ready screenshot: ${desktopReadyScreenshot}`);
    console.log(`mobile ready screenshot: ${mobileReadyScreenshot}`);
    console.log(`mobile skipped screenshot: ${mobileSkippedScreenshot}`);
    console.log("PASS rejection Career Core mobile screenshot QA");
  } finally {
    await server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
