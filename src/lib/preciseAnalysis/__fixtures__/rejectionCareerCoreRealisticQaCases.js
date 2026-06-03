export const REJECTION_CAREER_CORE_REALISTIC_QA_CURRENT_DATE = "2026-06-03T00:00:00.000Z";

const pmSaasJd = [
  "Product Manager for B2B SaaS onboarding platform.",
  "Own roadmap, requirements, funnel metrics, stakeholder alignment, and release planning.",
  "Experience with operations process improvement, dashboard analysis, and customer onboarding is preferred.",
].join(" ");

const bioGmpJd = [
  "GMP production quality specialist for bio pharma manufacturing.",
  "Review batch records, deviation reports, inspection readiness, and quality process controls.",
].join(" ");

export const rejectionCareerCoreRealisticQaCases = Object.freeze([
  {
    id: "real-001-pm-saas-service-planning-ops",
    title: "PM/SaaS JD + service planning and operations resume",
    resumeType: "service planning / operations",
    jdType: "PM/SaaS",
    expected: "ready",
    jdText: pmSaasJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "ready; direct or transferable/adjacent is acceptable.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "svc-planning-ops-1",
          company: "Subscription Platform Co",
          title: "Service Planning Manager",
          startDate: "2022-03",
          endDate: "2026-02",
          bullets: [
            { text: "Planned onboarding service flow, wrote product requirements, and prioritized roadmap improvements.", evidenceType: "strong" },
            { text: "Improved activation dashboard and reduced operations handoff delay by standardizing SOP.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-002-pm-saas-bio-quality",
    title: "PM/SaaS JD + bio production quality resume",
    resumeType: "bio production quality",
    jdType: "PM/SaaS",
    expected: "ready_or_skipped",
    jdText: pmSaasJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "ready is acceptable only if direct months remain 0.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "bio-quality-cross-1",
          company: "Bio Pharma Plant",
          title: "Production Quality Specialist",
          startDate: "2021-01",
          endDate: "2025-12",
          bullets: [
            { text: "Managed GMP manufacturing quality, deviation reports, and pharmaceutical inspection records.", evidenceType: "strong" },
            { text: "Standardized batch release checklist for production process control.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-003-bio-gmp-quality-aligned",
    title: "Bio/GMP quality JD + bio production quality resume",
    resumeType: "bio production quality",
    jdType: "Bio/GMP quality",
    expected: "ready",
    jdText: bioGmpJd,
    targetRole: "Production Quality",
    targetIndustry: "Bio Pharma",
    expectedNote: "ready; direct months should dominate.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "bio-quality-aligned-1",
          company: "Bio Pharma Plant",
          title: "GMP Quality Specialist",
          startDate: "2020-07",
          endDate: "2026-06",
          bullets: [
            { text: "Led GMP quality process control for bio pharmaceutical production batches.", evidenceType: "strong" },
            { text: "Prepared inspection readiness evidence and deviation CAPA reporting.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-004-bio-gmp-korean-only",
    title: "Bio/GMP quality Korean-only JD + bio production quality resume",
    resumeType: "bio production quality",
    jdType: "Korean-only Bio/GMP quality",
    expected: "ready_preferred",
    jdText: "바이오 의약품 생산 품질 담당자를 채용합니다. GMP 제조 기록서 검토, 일탈 보고, 공정 품질 관리, 실사 대응 경험을 요구합니다.",
    expectedNote: "skipped should be recorded as a Korean-only inference gap.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "bio-quality-kr-1",
          company: "Bio Pharma Plant",
          title: "GMP Quality Specialist",
          startDate: "2022-01",
          endDate: "2026-06",
          bullets: [
            { text: "GMP manufacturing quality, batch record review, and deviation report control.", evidenceType: "strong" },
          ],
        },
      ],
    },
  },
  {
    id: "real-005-career-education-content",
    title: "Career education resume/interview JD + career content resume",
    resumeType: "career content / consulting",
    jdType: "career education",
    expected: "ready",
    jdText: "Create resume review, interview coaching, recruiting education, and career content programs for job seekers.",
    targetRole: "Content Marketing",
    targetIndustry: "Career Education",
    expectedNote: "career_education target should be inferred.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "career-content-1",
          company: "Career Coaching Studio",
          title: "Career Content Lead",
          startDate: "2022-06",
          endDate: "2026-05",
          bullets: [
            { text: "Produced resume, interview, job search, recruiting, and career coaching content.", evidenceType: "strong" },
            { text: "Converted consultation articles into paid coaching applications.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-006-marketing-content-career-content",
    title: "Marketing/content JD + career content resume",
    resumeType: "career content / consulting",
    jdType: "marketing content",
    expected: "ready_or_transferable",
    jdText: "Content marketing manager for lifecycle campaigns, CRM newsletter, SEO articles, and conversion content.",
    targetRole: "Content Marketing",
    targetIndustry: "Marketing",
    expectedNote: "marketing_growth should appear; career education may remain as resume-side context.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "career-content-marketing-1",
          company: "Career Coaching Studio",
          title: "Content Marketing Manager",
          startDate: "2023-01",
          endDate: "2025-12",
          bullets: [
            { text: "Ran content marketing campaigns for resume review and interview coaching products.", evidenceType: "strong" },
            { text: "Managed CRM newsletter and improved article-to-consultation conversion.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-007-operations-cs-process",
    title: "Operations/CS/process improvement JD + operations resume",
    resumeType: "operations / CS",
    jdType: "operations / process improvement",
    expected: "ready",
    jdText: "Operations manager for CS workflow, SOP, process improvement, vendor coordination, and service quality metrics.",
    targetRole: "Operations Manager",
    targetIndustry: "Platform Operations",
    expectedNote: "should not over-infer as product_planning_pm unless PM signals dominate.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "ops-cs-1",
          company: "Commerce Operations Co",
          title: "Operations Manager",
          startDate: "2021-04",
          endDate: "2026-03",
          bullets: [
            { text: "Managed CS workflow, SOP, vendor coordination, and process improvement metrics.", evidenceType: "strong" },
            { text: "Reduced weekly backlog by redesigning escalation operations dashboard.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-008-ambiguous-jd",
    title: "Very ambiguous JD + PM/SaaS resume",
    resumeType: "PM/SaaS",
    jdType: "ambiguous",
    expected: "skipped",
    jdText: "We are hiring a flexible team member for a growing organization. Communicate well, learn quickly, and support business tasks.",
    expectedNote: "box should not render.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "pm-saas-ambiguous-1",
          company: "SaaS Platform Co",
          title: "Product Manager",
          startDate: "2024-01",
          endDate: "2026-06",
          bullets: [
            { text: "Owned product roadmap and B2B SaaS onboarding metrics.", evidenceType: "metric" },
          ],
        },
      ],
    },
  },
  {
    id: "real-009-korean-only-pm-jd",
    title: "Korean-only PM/SaaS JD + service planning resume",
    resumeType: "service planning / operations",
    jdType: "Korean-only PM/SaaS",
    expected: "inference_gap_check",
    jdText: "B2B SaaS 서비스의 제품 기획자를 채용합니다. 로드맵 수립, 요구사항 정의, 온보딩 지표 분석, 이해관계자 커뮤니케이션을 담당합니다.",
    expectedNote: "ready is preferred; skipped should be counted as Korean-only inference gap.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "service-planning-kr-1",
          company: "Subscription Platform Co",
          title: "Service Planning Manager",
          startDate: "2023-01",
          endDate: "2026-06",
          bullets: [
            { text: "Planned product requirements, roadmap priorities, onboarding dashboard, and stakeholder release process.", evidenceType: "strong" },
          ],
        },
      ],
    },
  },
  {
    id: "real-010-long-jd-pm-saas",
    title: "Long PM/SaaS JD + mixed resume",
    resumeType: "mixed PM / operations / production",
    jdType: "long PM/SaaS",
    expected: "ready",
    jdText: [
      pmSaasJd,
      "The role also mentions collaboration with sales, support, finance, compliance, data, and operations teams.",
      "Preferred background includes customer discovery, launch readiness, onboarding funnel analysis, service policy, and enterprise stakeholder communication.",
      "This long text intentionally includes many business keywords to check over-inference.",
    ].join(" "),
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "ready is expected; check whether many keywords overstate direct relevance.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "mixed-pm-1",
          company: "SaaS Platform Co",
          title: "Product Manager",
          startDate: "2024-01",
          endDate: "2025-12",
          bullets: [
            { text: "Owned product roadmap, requirements, and onboarding funnel metrics.", evidenceType: "metric" },
          ],
        },
        {
          id: "mixed-ops-1",
          company: "Operations Co",
          title: "Operations Manager",
          startDate: "2021-01",
          endDate: "2023-12",
          bullets: [
            { text: "Improved SOP, dashboard reporting, and cross-functional operations process.", evidenceType: "strong" },
          ],
        },
        {
          id: "mixed-prod-1",
          company: "Manufacturing Co",
          title: "Production Coordinator",
          startDate: "2019-01",
          endDate: "2020-12",
          bullets: [
            { text: "Managed production schedule and inspection records.", evidenceType: "strong" },
          ],
        },
      ],
    },
  },
  {
    id: "real-011-newgrad-intern-pm",
    title: "PM/SaaS JD + newgrad/intern resume",
    resumeType: "newgrad / intern",
    jdType: "PM/SaaS",
    expected: "ready_or_unknown",
    jdText: pmSaasJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "ready may show limited months; unknown should not be overclaimed.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "intern-pm-1",
          company: "Campus Startup",
          title: "Product Intern",
          startDate: "2025-07",
          endDate: "2025-12",
          bullets: [
            { text: "Assisted product research, user interview notes, and onboarding metrics dashboard.", evidenceType: "support" },
          ],
        },
      ],
    },
  },
  {
    id: "real-012-career-gap-ops-to-pm",
    title: "PM/SaaS JD + operations resume with career gap",
    resumeType: "operations with gap",
    jdType: "PM/SaaS",
    expected: "ready",
    jdText: pmSaasJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "month buckets should be duration sum of experience items only.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "ops-gap-1",
          company: "Operations Co",
          title: "Operations Specialist",
          startDate: "2020-01",
          endDate: "2021-12",
          bullets: [
            { text: "Improved SOP, dashboard reporting, and service process metrics.", evidenceType: "metric" },
          ],
        },
        {
          id: "ops-gap-2",
          company: "Platform Co",
          title: "Operations Manager",
          startDate: "2024-01",
          endDate: "2026-06",
          bullets: [
            { text: "Led process improvement and onboarding operations dashboard.", evidenceType: "strong" },
          ],
        },
      ],
    },
  },
  {
    id: "real-013-short-tenures-marketing",
    title: "Marketing/content JD + many short tenures",
    resumeType: "short-tenure marketing",
    jdType: "marketing content",
    expected: "ready",
    jdText: "Marketing growth role for CRM campaigns, content strategy, analytics reports, and conversion optimization.",
    targetRole: "Marketing Growth",
    targetIndustry: "B2B SaaS",
    expectedNote: "duration sum may look precise; review copy risk.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "short-mkt-1",
          company: "Agency A",
          title: "Content Marketer",
          startDate: "2024-01",
          endDate: "2024-06",
          bullets: [{ text: "Created CRM newsletter and campaign landing pages.", evidenceType: "strong" }],
        },
        {
          id: "short-mkt-2",
          company: "Startup B",
          title: "Growth Marketer",
          startDate: "2024-09",
          endDate: "2025-02",
          bullets: [{ text: "Analyzed conversion reports and improved content funnel.", evidenceType: "metric" }],
        },
        {
          id: "short-mkt-3",
          company: "Studio C",
          title: "Marketing Contractor",
          startDate: "2025-05",
          endDate: "2025-10",
          bullets: [{ text: "Managed SEO articles and campaign performance dashboard.", evidenceType: "strong" }],
        },
      ],
    },
  },
  {
    id: "real-014-same-industry-different-role",
    title: "B2B SaaS PM JD + same industry CS role",
    resumeType: "B2B SaaS customer support",
    jdType: "PM/SaaS",
    expected: "ready",
    jdText: pmSaasJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "industry is aligned but role differs; direct should not dominate too easily.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "saas-cs-1",
          company: "B2B SaaS Support Co",
          title: "Customer Success Manager",
          startDate: "2021-01",
          endDate: "2025-12",
          bullets: [
            { text: "Managed enterprise SaaS onboarding, support metrics, customer escalation, and renewal operations.", evidenceType: "strong" },
          ],
        },
      ],
    },
  },
  {
    id: "real-015-same-role-different-industry",
    title: "B2B SaaS PM JD + PM in bio manufacturing",
    resumeType: "PM role in bio manufacturing",
    jdType: "PM/SaaS",
    expected: "ready",
    jdText: pmSaasJd,
    targetRole: "Product Manager",
    targetIndustry: "B2B SaaS",
    expectedNote: "role is aligned but industry differs; transferable/adjacent should be plausible.",
    resumeProfile: {
      schemaVersion: "passmap.resumeProfile.v1",
      experiences: [
        {
          id: "bio-pm-1",
          company: "Bio Manufacturing Co",
          title: "Product Manager",
          startDate: "2022-01",
          endDate: "2025-12",
          bullets: [
            { text: "Owned roadmap and requirements for manufacturing quality workflow software in bio pharma operations.", evidenceType: "strong" },
          ],
        },
      ],
    },
  },
]);
