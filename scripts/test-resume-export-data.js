import assert from "node:assert/strict";
import sampleResumeProfile from "../src/lib/resume/sampleResumeProfile.js";
import { exportResumeJson } from "../src/lib/resume/exportResumeJson.js";
import { exportResumeMarkdown } from "../src/lib/resume/exportResumeMarkdown.js";
import { exportResumeText } from "../src/lib/resume/exportResumeText.js";
import {
  buildResumeExportFilename,
  buildResumeExportWarnings,
} from "../src/lib/resume/resumeDraftTransfer.js";

const markdown = exportResumeMarkdown(sampleResumeProfile);
assert.equal(typeof markdown, "string");
assert.ok(markdown.includes("## Experience"));
assert.ok(markdown.includes("## Projects"));
assert.ok(markdown.includes("## Skills"));

const text = exportResumeText(sampleResumeProfile);
assert.equal(typeof text, "string");
assert.ok(text.includes("기본 정보"));
assert.ok(text.includes("경력"));

const jsonText = exportResumeJson(sampleResumeProfile, { exportedAt: "2026-05-31T00:00:00.000Z" });
const backup = JSON.parse(jsonText);
assert.ok(backup.schemaVersion);
assert.equal(backup.exportedAt, "2026-05-31T00:00:00.000Z");
assert.equal(backup.exportType, "resume_profile_backup");
assert.ok(backup.profile);

const warnings = buildResumeExportWarnings(sampleResumeProfile);
assert.ok(Array.isArray(warnings));
assert.ok(warnings.length >= 1);

["md", "txt", "json", "pdf"].forEach((format) => {
  const filename = buildResumeExportFilename(sampleResumeProfile, format);
  assert.ok(filename.includes(`.${format}`));
});

console.log("PASS resume export deterministic checks");
