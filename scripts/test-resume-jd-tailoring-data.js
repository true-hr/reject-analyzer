import assert from "node:assert/strict";
import sampleResumeProfile from "../src/lib/resume/sampleResumeProfile.js";
import { applyTargetResumeVersion } from "../src/lib/resume/applyTargetResumeVersion.js";
import { buildResumeJdFit } from "../src/lib/resume/buildResumeJdFit.js";
import { buildTargetResumeVersion } from "../src/lib/resume/buildTargetResumeVersion.js";
import { exportResumeMarkdown } from "../src/lib/resume/exportResumeMarkdown.js";
import { sampleJdText, sampleTargetCompany, sampleTargetRole } from "../src/lib/resume/sampleJdTailoring.js";

const before = JSON.stringify(sampleResumeProfile);
const fit = buildResumeJdFit({ profile: sampleResumeProfile, jdText: sampleJdText });

assert.ok(Array.isArray(fit.jdKeywords));
assert.ok(fit.jdKeywords.length > 0);
assert.ok(Array.isArray(fit.bulletMatches));
assert.ok(fit.bulletMatches.length > 0);
assert.equal(typeof fit.summary.fitScore, "number");
assert.ok(Array.isArray(fit.gaps));

const targetVersion = buildTargetResumeVersion({
  fit,
  targetRole: sampleTargetRole,
  targetCompany: sampleTargetCompany,
});

assert.ok(targetVersion.id);
assert.ok(Array.isArray(targetVersion.selectedBulletIds));
assert.ok(Array.isArray(targetVersion.promotedBulletIds));
assert.ok(Array.isArray(targetVersion.hiddenBulletIds));

const applied = applyTargetResumeVersion(sampleResumeProfile, targetVersion);

assert.equal(applied.schemaVersion, sampleResumeProfile.schemaVersion);
assert.ok(Array.isArray(applied.experiences));
assert.ok(Array.isArray(applied.versions));
assert.ok(applied.versions.some((version) => version.id === targetVersion.id));

const markdown = exportResumeMarkdown(applied);
assert.equal(typeof markdown, "string");
assert.ok(markdown.includes("## Experience"));

assert.equal(JSON.stringify(sampleResumeProfile), before);

console.log("PASS resume JD tailoring deterministic checks");
