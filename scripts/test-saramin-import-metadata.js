import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { attachResumeImportMetadata, buildResumeImportMetadata } from "../src/lib/resume/buildResumeImportMetadata.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "tests", "fixtures", "extract", "saramin_text_resume_anonymized.txt");
const saraminText = fs.readFileSync(fixturePath, "utf8");

const genericText = [
  "Product manager resume",
  "Experience",
  "2022-01 to 2024-12 Example Company",
  "- Improved onboarding metrics and managed roadmap reviews.",
  "Education",
  "Example University",
].join("\n");

const genericMeta = attachResumeImportMetadata({ ok: true, ext: "txt" }, genericText, { kind: "resume" });
assert.equal(genericMeta.resumeImportMetadata, undefined, "generic resume text must not get saramin metadata");

const jdMeta = attachResumeImportMetadata({ ok: true, ext: "txt" }, saraminText, { kind: "jd" });
assert.equal(jdMeta.resumeImportMetadata, undefined, "JD import must not get resume metadata");

const metadata = buildResumeImportMetadata(saraminText, { kind: "resume" });
assert.ok(metadata, "saramin fixture should produce metadata");
assert.equal(metadata.sourcePlatform, "saramin");
assert.equal(metadata.sourceDocumentRole, "resume_plus_cover_letter");
assert.equal(metadata.textExtractable, true);
assert.equal(metadata.ocrRequired, false);
assert.equal(metadata.reviewRequired, true);
assert.ok(metadata.detectionConfidence >= 0.5, `detection confidence too low: ${metadata.detectionConfidence}`);
assert.ok(metadata.detectedSections.includes("experience"), "experience section should be detected");
assert.ok(metadata.detectedSections.includes("coverLetter"), "cover letter section should be detected");
assert.ok(metadata.resumeProfileCandidate, "resumeProfileCandidate should exist");
assert.ok(metadata.evidenceBankCandidate, "evidenceBankCandidate should exist");

const attached = attachResumeImportMetadata({ ok: true, ext: "txt" }, saraminText, { kind: "resume" });
assert.ok(attached.resumeImportMetadata, "saramin metadata should attach to meta");
assert.equal(attached.ok, true, "existing meta fields should be preserved");
assert.equal(attached.ext, "txt", "existing extraction meta should be preserved");

const bullets = attached.resumeImportMetadata.resumeProfileCandidate.experiences
  .flatMap((experience) => experience.responsibilities || []);
assert.ok(bullets.length > 0, "experience bullets should remain present");
assert.ok(!bullets.some((line) => line.includes("고객 문제를 이해하고")), "motivation text must not become an experience bullet");
assert.ok(!bullets.some((line) => line.includes("장기적인 고객 관계")), "post-hire plan text must not become an experience bullet");

console.log("PASS saramin import metadata deterministic checks");
