import assert from "node:assert/strict";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const tmpDir = path.join(projectRoot, ".tmp_jd_tailoring_career_core_ui");
const screenshotDir = path.join(projectRoot, "screenshots");
const desktopScreenshot = path.join(screenshotDir, "jd-tailoring-career-core-desktop.png");
const mobileScreenshot = path.join(screenshotDir, "jd-tailoring-career-core-mobile.png");

function fsPath(value) {
  return value.replace(/\\/g, "/");
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
        <title>JD Tailoring Career Core QA</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/qa-entry.jsx"></script>
      </body>
    </html>
  `);
  await writeFile(path.join(tmpDir, "qa-entry.jsx"), `
    import React, { useState } from "react";
    import ReactDOM from "react-dom/client";
    import "/@fs/${rootFs}/src/index.css";
    import ResumeJdTailoringPanel from "/@fs/${rootFs}/src/components/resume/ResumeJdTailoringPanel.jsx";
    import sampleResumeProfile from "/@fs/${rootFs}/src/lib/resume/sampleResumeProfile.js";

    function App() {
      const [hasProfile, setHasProfile] = useState(true);
      return (
        <main className="min-h-screen bg-slate-100 p-4">
          <div className="mx-auto max-w-5xl space-y-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <button
                type="button"
                data-testid="toggle-profile"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => setHasProfile((value) => !value)}
              >
                toggle profile
              </button>
            </div>
            <ResumeJdTailoringPanel profile={hasProfile ? sampleResumeProfile : null} />
          </div>
        </main>
      );
    }

    ReactDOM.createRoot(document.getElementById("root")).render(<App />);
  `);
}

async function expectVisibleText(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 10000 });
}

async function fillJd(page, value) {
  await page.locator("textarea").fill(value);
  await page.waitForTimeout(150);
}

async function readSummary(page) {
  return page.locator("text=Career Core v0 추정").locator("xpath=ancestor::div[contains(@class,'rounded-lg')][1]");
}

async function run() {
  await createHarness();

  const server = await createServer({
    root: tmpDir,
    server: {
      host: "127.0.0.1",
      port: 4177,
      strictPort: true,
      fs: { allow: [projectRoot, tmpDir] },
    },
    logLevel: "error",
  });
  await server.listen();

  const browser = await chromium.launch();
  const rows = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await page.goto("http://127.0.0.1:4177", { waitUntil: "networkidle" });

    await expectVisibleText(page, "Career Core v0 추정");
    await expectVisibleText(page, "직무/산업 신호 기준의 참고용 분류입니다.");
    await expectVisibleText(page, "Fit score");
    await expectVisibleText(page, "Target version summary");
    await expectVisibleText(page, "target: product_planning_pm / b2b_saas");
    rows.push({ case: "initial PM/SaaS sample", status: "PASS" });

    await fillJd(page, "Flexible team member for a growing organization.");
    await expectVisibleText(page, "판정 불가");
    await expectVisibleText(page, "Career Core target을 보수적으로 추정할 수 없어");
    rows.push({ case: "ambiguous JD fallback", status: "PASS" });

    await fillJd(page, "Product Manager role for B2B SaaS platform. Own roadmap and requirements.");
    await expectVisibleText(page, "target: product_planning_pm / b2b_saas");
    await page.screenshot({ path: desktopScreenshot, fullPage: true });
    rows.push({ case: "PM/SaaS JD target", status: "PASS" });

    await fillJd(page, "GMP manufacturing quality specialist for bio pharma production process.");
    await expectVisibleText(page, "target: production_quality / bio_pharma");
    rows.push({ case: "bio/GMP quality JD target", status: "PASS" });

    await fillJd(page, "Create resume, interview, recruiting, and career coaching content campaigns.");
    await expectVisibleText(page, "target: marketing_growth / career_education");
    rows.push({ case: "career education JD target", status: "PASS" });

    await page.getByTestId("toggle-profile").click();
    await expectVisibleText(page, "JD 맞춤 이력서");
    await expectVisibleText(page, "분석할 이력서 데이터가 아직 없습니다.");
    assert.equal(await page.getByText("Career Core v0 추정").count(), 0);
    rows.push({ case: "profile missing", status: "PASS" });

    const mobile = await browser.newPage({ viewport: { width: 390, height: 900 }, isMobile: true });
    await mobile.goto("http://127.0.0.1:4177", { waitUntil: "networkidle" });
    await fillJd(mobile, "Product Manager role for B2B SaaS platform. Own roadmap and requirements.");
    await expectVisibleText(mobile, "Career Core v0 추정");
    await expectVisibleText(mobile, "직접 유관");
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 2, `mobile horizontal overflow: ${overflow}`);
    await mobile.screenshot({ path: mobileScreenshot, fullPage: true });
    rows.push({ case: "mobile layout", status: "PASS" });

    console.table(rows);
    console.log(`desktop screenshot: ${desktopScreenshot}`);
    console.log(`mobile screenshot: ${mobileScreenshot}`);
    console.log("PASS JD tailoring Career Core UI QA");
  } finally {
    await browser.close();
    await server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
