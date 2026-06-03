export const CAREER_CORE_FIT_QA_CURRENT_DATE = "2026-06-01T00:00:00.000Z";

export const careerCoreFitQaCases = Object.freeze([
  {
    id: "qa-fit-001-pm-saas-aligned",
    title: "PM/SaaS aligned",
    expected: "High direct relevance for PM and B2B SaaS.",
    target: {
      roleFamily: "product_planning_pm",
      industryDomain: "b2b_saas",
      targetRoleText: "Product Manager",
      targetIndustryText: "B2B SaaS",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "pm-saas-1",
          company: "SaaS Platform Co",
          title: "Product Manager",
          startDate: "2024-01",
          endDate: "2026-06",
          bullets: [
            {
              text: "Owned product roadmap, requirements, activation dashboard, and B2B SaaS onboarding metrics.",
              evidenceType: "metric",
            },
            {
              text: "Coordinated stakeholder alignment for enterprise platform feature releases.",
              evidenceType: "strong",
            },
          ],
        },
      ],
    },
    checks: {
      directMonthsMin: 1,
      disallowAllDirect: false,
      disallowAnyDirect: false,
    },
  },
  {
    id: "qa-fit-002-ops-to-pm",
    title: "Operations to PM transferable",
    expected: "Adjacent or transferable should dominate.",
    target: {
      roleFamily: "product_planning_pm",
      industryDomain: "b2b_saas",
      targetRoleText: "Product Manager",
      targetIndustryText: "B2B SaaS",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "ops-1",
          company: "Operations Co",
          title: "Operations Manager",
          startDate: "2023-01",
          endDate: "2025-12",
          bullets: [
            {
              text: "Standardized SOP, automated settlement process, and improved weekly operations dashboard.",
              evidenceType: "metric",
            },
            {
              text: "Analyzed report data to reduce manual review time.",
              evidenceType: "strong",
            },
          ],
        },
      ],
    },
    checks: {
      adjacentOrTransferableMonthsMin: 1,
      directMonthsMax: 0,
    },
  },
  {
    id: "qa-fit-003-bio-quality-to-pm-saas",
    title: "Bio production quality to PM/SaaS mismatch",
    expected: "Direct should not appear; unrelated or transferable should dominate.",
    target: {
      roleFamily: "product_planning_pm",
      industryDomain: "b2b_saas",
      targetRoleText: "Product Manager",
      targetIndustryText: "B2B SaaS",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "bio-quality-1",
          company: "Bio Pharma GMP Lab",
          title: "Production Quality Specialist",
          startDate: "2022-01",
          endDate: "2025-12",
          bullets: [
            {
              text: "Managed GMP manufacturing quality and pharmaceutical process control.",
              evidenceType: "strong",
            },
            {
              text: "Improved deviation report workflow for production inspection.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
    checks: {
      directMonthsMax: 0,
      disallowAllDirect: true,
    },
  },
  {
    id: "qa-fit-004-bio-quality-aligned",
    title: "Bio production quality aligned",
    expected: "High direct relevance for production quality and bio pharma.",
    target: {
      roleFamily: "production_quality",
      industryDomain: "bio_pharma",
      targetRoleText: "Production Quality",
      targetIndustryText: "Bio Pharma",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "bio-quality-2",
          company: "Bio Pharma GMP Lab",
          title: "Production Quality Specialist",
          startDate: "2023-01",
          endDate: "2026-06",
          bullets: [
            {
              text: "Led GMP manufacturing quality process control for pharmaceutical batches.",
              evidenceType: "strong",
            },
            {
              text: "Reduced production inspection errors through standardized quality reporting.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
    checks: {
      directMonthsMin: 1,
    },
  },
  {
    id: "qa-fit-005-career-content-education",
    title: "Career content to career education",
    expected: "Industry direct, role marketing or transferable.",
    target: {
      roleFamily: "marketing_growth",
      industryDomain: "career_education",
      targetRoleText: "Content Marketing",
      targetIndustryText: "Career Education",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "career-content-1",
          company: "Career Education Studio",
          title: "Content Marketing Manager",
          startDate: "2023-01",
          endDate: "2025-12",
          bullets: [
            {
              text: "Created resume review, interview coaching, job search, and career content campaigns.",
              evidenceType: "strong",
            },
            {
              text: "Improved conversion from consultation content to paid coaching.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
    checks: {
      directMonthsMin: 1,
    },
  },
  {
    id: "qa-fit-006-data-assist-to-pm",
    title: "Data analysis support to PM/operations",
    expected: "Adjacent or transferable should dominate.",
    target: {
      roleFamily: "product_planning_pm",
      industryDomain: "b2b_saas",
      targetRoleText: "Product Manager",
      targetIndustryText: "B2B SaaS",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "data-1",
          company: "Analytics Support Team",
          title: "Data Analyst",
          startDate: "2024-01",
          endDate: "2025-12",
          bullets: [
            {
              text: "Built SQL dashboard reports and analysis for product and operations metrics.",
              evidenceType: "metric",
            },
            {
              text: "Automated recurring KPI report for decision meetings.",
              evidenceType: "strong",
            },
          ],
        },
      ],
    },
    checks: {
      adjacentOrTransferableMonthsMin: 1,
      directMonthsMax: 0,
    },
  },
  {
    id: "qa-fit-007-insufficient-info",
    title: "Insufficient information",
    expected: "Unknown should dominate and direct should not appear.",
    target: {
      roleFamily: "product_planning_pm",
      industryDomain: "b2b_saas",
      targetRoleText: "Product Manager",
      targetIndustryText: "B2B SaaS",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "unknown-1",
          company: "Local Office",
          title: "Associate",
          startDate: "2025-01",
          endDate: "2025-12",
          bullets: [],
        },
      ],
    },
    checks: {
      unknownMonthsMin: 1,
      directMonthsMax: 0,
      disallowAnyDirect: true,
    },
  },
  {
    id: "qa-fit-008-mixed-career",
    title: "Mixed production, operations, and PM career",
    expected: "Duration sum should be 84 months; PM direct, operations adjacent or transferable, production not direct for PM/SaaS.",
    target: {
      roleFamily: "product_planning_pm",
      industryDomain: "b2b_saas",
      targetRoleText: "Product Manager",
      targetIndustryText: "B2B SaaS",
    },
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "mixed-production",
          company: "Bio Pharma GMP Lab",
          title: "Production Quality Specialist",
          startDate: "2019-01",
          endDate: "2020-12",
          bullets: [
            {
              text: "Managed GMP production quality and manufacturing process control.",
              evidenceType: "strong",
            },
          ],
        },
        {
          id: "mixed-ops",
          company: "Operations Co",
          title: "Operations Manager",
          startDate: "2021-01",
          endDate: "2023-12",
          bullets: [
            {
              text: "Improved SOP, settlement process, and operations dashboard reporting.",
              evidenceType: "metric",
            },
          ],
        },
        {
          id: "mixed-pm",
          company: "B2B SaaS Platform",
          title: "Product Manager",
          startDate: "2024-01",
          endDate: "2025-12",
          bullets: [
            {
              text: "Owned product roadmap, requirements, and B2B SaaS platform activation metrics.",
              evidenceType: "metric",
            },
          ],
        },
      ],
    },
    checks: {
      totalClassifiedMonths: 84,
      directMonthsMin: 1,
      disallowAllDirect: false,
    },
  },
]);
