import assert from "node:assert/strict";
import { buildResumeProfileFromParsedResume } from "../src/lib/resume/buildResumeProfileFromParsedResume.js";
import { parseResumeProfileJson, serializeResumeProfile } from "../src/lib/resume/serializeResumeProfile.js";

const sampleParsedResume = {
  summary: "B2B SaaS product manager focused on onboarding and retention.",
  timeline: [
    {
      company: "Passmap Labs",
      role: "Product Manager",
      start: "2023-01",
      end: "present",
      type: "full-time",
      bullets: [
        "Improved activation by 18% by redesigning onboarding checkpoints.",
        "Managed weekly roadmap review with design and engineering.",
      ],
    },
    {
      company: "Growth Studio",
      role: "Operations Analyst",
      start: "2021-03",
      end: "2022-12",
      type: "contract",
      bullets: [
        "Automated reporting workflow and saved 6 hours per week.",
      ],
    },
  ],
  skills: [],
  achievements: ["Won internal product quality award in 2024."],
  projects: ["Resume Import/Export Studio"],
  gaps: ["Timeline has one contract role that may need clearer scope."],
  transitionNarrative: ["B2B SaaS", "Product operations"],
};

const profile = buildResumeProfileFromParsedResume({
  parsedResume: sampleParsedResume,
  rawText: "sample resume text",
  importMeta: { id: "sample-import-1", fileName: "sample-resume.txt", confidence: 0.92 },
  sourceLabel: "Sample resume",
});

assert.equal(profile.schemaVersion, "passmap.resumeProfile.v1");
assert.equal(profile.experiences.length, 2);
assert.deepEqual(profile.skills, {
  technical: [],
  tools: [],
  domain: [],
  language: [],
  certificates: [],
});
assert.ok(profile.quality.missingSections.includes("education"));

profile.experiences.forEach((experience) => {
  assert.ok(experience.id);
  experience.bullets.forEach((bullet) => {
    assert.ok(bullet.id);
    assert.ok(bullet.source);
    assert.equal(bullet.source.type, "imported_resume");
    assert.equal(typeof bullet.strengthScore, "number");
    assert.ok(bullet.evidenceType);
  });
});

const json = serializeResumeProfile(profile);
const restored = parseResumeProfileJson(json);

assert.equal(restored.schemaVersion, profile.schemaVersion);
assert.equal(restored.experiences.length, profile.experiences.length);
assert.equal(restored.experiences[0].bullets[0].id, profile.experiences[0].bullets[0].id);

console.log("PASS resume profile model deterministic checks");
