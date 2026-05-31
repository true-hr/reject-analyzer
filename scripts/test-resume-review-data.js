import assert from "node:assert/strict";
import sampleResumeProfile from "../src/lib/resume/sampleResumeProfile.js";

assert.ok(sampleResumeProfile.schemaVersion);
assert.ok(Array.isArray(sampleResumeProfile.experiences));
assert.ok(sampleResumeProfile.experiences.length >= 2);

const bullets = sampleResumeProfile.experiences.flatMap((experience) => experience.bullets || []);
assert.ok(bullets.length >= 3);
bullets.forEach((bullet) => {
  assert.ok(bullet.id);
  assert.equal(typeof bullet.strengthScore, "number");
  assert.ok(bullet.evidenceType);
});

assert.ok(Array.isArray(sampleResumeProfile.quality?.missingSections));
assert.ok(sampleResumeProfile.quality.missingSections.includes("education"));
assert.ok(Array.isArray(sampleResumeProfile.quality?.riskyClaims));
assert.ok(sampleResumeProfile.quality.riskyClaims.length >= 1);
assert.ok(Array.isArray(sampleResumeProfile.quality?.duplicateBullets));
assert.ok(sampleResumeProfile.quality.duplicateBullets.length >= 1);

console.log("PASS resume review data deterministic checks");
