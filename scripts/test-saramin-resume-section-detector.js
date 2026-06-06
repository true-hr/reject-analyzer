import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectSaraminResumeText } from "../src/lib/resume/detectSaraminResumeText.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "tests", "fixtures", "extract", "saramin_text_resume_anonymized.txt");
const fixture = fs.readFileSync(fixturePath, "utf8");

const result = detectSaraminResumeText(fixture);

assert.equal(result.sourcePlatform, "saramin");
assert.equal(result.textExtractable, true);
assert.equal(result.ocrRequired, false);
assert.equal(result.sourceDocumentRole, "resume_plus_cover_letter");
assert.ok(result.confidence >= 0.5, `confidence too low: ${result.confidence}`);

for (const key of ["basicInfo", "personalInfo", "university", "experience", "certificates", "coverLetter"]) {
  assert.equal(result.sections[key].detected, true, `${key} should be detected`);
}

for (const key of ["highSchool", "graduateSchool", "attachedCareerDescription", "officialLanguageTest", "activitiesEducation"]) {
  assert.equal(result.sections[key].detected, true, `${key} should be detected`);
}

assert.ok(result.experienceSectionText.includes("신규 거래처 발굴"), "experience text should include career bullet");
assert.ok(!result.experienceSectionText.includes("지원동기"), "cover letter heading must not be inside experience text");
assert.ok(!result.experienceSectionText.includes("입사 후 포부"), "post-hire plan must not be inside experience text");
assert.ok(!result.experienceSectionText.includes("고객 문제를 이해하고"), "cover letter body must not be inside experience text");

assert.ok(result.coverLetterSectionText.includes("고객 문제를 이해하고"), "cover letter text should be captured separately");
assert.ok(result.coverLetterSectionText.includes("장기적인 고객 관계"), "post-hire plan text should be captured separately");

const experienceOrder = result.sectionOrder.find((section) => section.key === "experience");
const coverLetterOrder = result.sectionOrder.find((section) => section.key === "coverLetter");
assert.ok(experienceOrder, "experience section order should exist");
assert.ok(coverLetterOrder, "cover letter section order should exist");
assert.ok(experienceOrder.endLine < coverLetterOrder.startLine, "experience range should end before cover letter starts");

console.log("PASS saramin resume text section detector deterministic checks");
