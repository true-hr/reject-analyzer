import {
  createEmptyResumeProfile,
  createResumeBullet,
  createResumeExperience,
  createResumeProject,
  createResumeSource,
} from "./resumeProfileModel.js";
import {
  classifyBulletEvidence,
  scoreBulletStrength,
  scoreResumeProfileQuality,
} from "./scoreResumeProfileQuality.js";

function bullet(text, source) {
  return createResumeBullet({
    text,
    source,
    strengthScore: scoreBulletStrength(text),
    evidenceType: classifyBulletEvidence(text),
  });
}

export function createSampleResumeProfile() {
  const profile = createEmptyResumeProfile();
  const source = createResumeSource({
    type: "imported_resume",
    refId: "sample-review-profile",
    label: "Review Studio sample",
    confidence: 0.9,
  });

  profile.identity.name = "Sample Candidate";
  profile.identity.email = "sample@example.com";
  profile.headline.summary = "B2B SaaS product operator with onboarding, retention, and workflow improvement experience.";
  profile.headline.keywords = ["B2B SaaS", "Product operations", "Onboarding"];
  profile.experiences = [
    createResumeExperience({
      company: "Passmap Labs",
      title: "Product Manager",
      startDate: "2023-01",
      endDate: "present",
      employmentType: "full-time",
      source,
      bullets: [
        bullet("Improved onboarding activation by 18% by redesigning import review checkpoints.", source),
        bullet("Launched resume review QA workflow with design and engineering stakeholders.", source),
        bullet("Managed weekly product roadmap meetings.", source),
      ],
    }),
    createResumeExperience({
      company: "Growth Studio",
      title: "Operations Analyst",
      startDate: "2021-03",
      endDate: "2022-12",
      employmentType: "contract",
      source,
      bullets: [
        bullet("Automated weekly reporting workflow and saved 6 hours per week.", source),
        bullet("Managed weekly product roadmap meetings.", source),
      ],
    }),
  ];
  profile.projects = [
    createResumeProject({
      name: "Resume Import Review",
      role: "Workflow owner",
      source,
      bullets: [
        bullet("Built deterministic review sample data for QA handoff.", source),
      ],
    }),
  ];
  profile.skills = {
    technical: ["Workflow design", "Data QA"],
    tools: ["SQL", "Figma", "Excel"],
    domain: ["HR tech", "B2B SaaS"],
    language: ["English"],
    certificates: [],
  };
  profile.quality = {
    ...scoreResumeProfileQuality(profile),
    riskyClaims: [
      "Launched resume review QA workflow with design and engineering stakeholders.",
      "Managed weekly product roadmap meetings.",
    ],
  };
  profile.meta.sources = [source];

  return profile;
}

const sampleResumeProfile = createSampleResumeProfile();

export default sampleResumeProfile;
