import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectSaraminResumeText } from "../src/lib/resume/detectSaraminResumeText.js";
import { buildSaraminResumeProfileCandidate } from "../src/lib/resume/buildSaraminResumeProfileCandidate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "tests", "fixtures", "extract", "saramin_text_resume_anonymized.txt");
const fixture = fs.readFileSync(fixturePath, "utf8");

const detection = detectSaraminResumeText(fixture);
const result = buildSaraminResumeProfileCandidate(fixture, detection);
const profile = result.resumeProfileCandidate;
const evidence = result.evidenceBankCandidate;

assert.equal(result.sourcePlatform, "saramin");
assert.equal(result.sourceDocumentRole, "resume_plus_cover_letter");
assert.ok(result.confidence >= 0.5, `mapper confidence too low: ${result.confidence}`);

assert.equal(profile.identity.email, "candidate@example.com");
assert.equal(profile.identity.phone, "010-0000-0000");
assert.ok(profile.identity.address.includes("서울특별시"), "address candidate should be captured");

assert.ok(profile.education.length >= 2, "education candidates should be captured");
assert.ok(profile.education.some((item) => item.level === "highSchool"), "high school candidate should exist");
assert.ok(profile.education.some((item) => item.level === "university"), "university candidate should exist");

assert.ok(profile.experiences.length >= 1, "at least one experience candidate should be captured");
assert.ok(profile.experiences[0].companyName.includes("비공개회사"), "experience company candidate should be captured");
assert.ok(profile.experiences[0].responsibilities.some((line) => line.includes("신규 거래처")), "experience bullet should be captured");

assert.ok(profile.skills.some((skill) => skill.name.toLowerCase() === "salesforce"), "Salesforce skill should be captured");
assert.ok(profile.skills.some((skill) => skill.name.toLowerCase() === "excel"), "Excel skill should be captured");
assert.ok(profile.certificates.some((item) => item.name.includes("컴퓨터활용능력")), "certificate candidate should be captured");
assert.ok(profile.awardsAndActivities.some((item) => item.title.includes("TOEIC")), "language test candidate should be captured");

assert.ok(evidence.evidenceItems.length >= 3, "cover letter evidence candidates should be captured");
assert.ok(evidence.evidenceItems.some((item) => item.type === "motivation"), "motivation evidence should be captured");
assert.ok(evidence.evidenceItems.some((item) => item.type === "relatedExperience"), "related experience evidence should be captured");
assert.ok(evidence.evidenceItems.some((item) => item.type === "postHirePlan"), "post-hire plan evidence should be captured");
assert.ok(result.importWarnings.includes("company_specific_content"), "company-specific content warning should be present");

const allExperienceBullets = profile.experiences.flatMap((item) => item.responsibilities || []);
assert.ok(!allExperienceBullets.some((line) => line.includes("고객 문제를 이해하고")), "motivation text must not become an experience bullet");
assert.ok(!allExperienceBullets.some((line) => line.includes("장기적인 고객 관계")), "post-hire plan text must not become an experience bullet");
assert.ok(!allExperienceBullets.some((line) => line.includes("입사 후")), "company-specific cover letter text must not become an experience bullet");

console.log("PASS saramin resume profile candidate mapper deterministic checks");
