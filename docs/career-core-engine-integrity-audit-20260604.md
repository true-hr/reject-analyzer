# Career Core Engine Integrity Audit - 2026-06-04

## 1. Investigation purpose

This investigation checks how Career Core is currently structured and consumed after the Work Records adapter and AI Inbox read-only signal landed on `main`.

Scope is investigation-only:

- no product direction decision
- no implementation
- no refactor
- no UI/copy/API/DB/Supabase/env/deployment change
- docs only

## 2. Baseline branch / HEAD

- Branch: `qa/career-core-engine-integrity-audit-20260604`
- Base: latest `origin/main`
- HEAD: `ec46afaf`

## 3. Investigation scope

Inspected:

- `src/lib/career-core/*`
- Career Core direct call sites in JD Tailoring, Rejection Analysis, and AI Inbox
- Work Records adapter inputs and guardrails
- Home / Career Asset Map / Work Records surfaces for missing or duplicate Career Core use
- Duplicate duration, role, industry, fit, risk, asset-direction logic outside Career Core
- Persistence paths for possible Career Core result storage

## 4. Career Core current structure summary

| Area | File(s) | Current fact |
| --- | --- | --- |
| Public exports | `src/lib/career-core/index.js` | Exports model normalizers, timeline analyzer, signal extractor, ResumeProfile adapter, WorkRecords adapter, fit model, role/industry scorers, and fit summary builder. |
| Profile model | `careerProfileModel.js` | Defines `CAREER_PROFILE_SCHEMA_VERSION = "passmap.careerProfile.v0"` and normalizes `timeline`, `summary`, `signals`, `fit`, `meta.warnings`. |
| Timeline | `analyzeCareerTimeline.js` | Parses month-like start/end dates, computes duration, overlap, gaps, short tenure count, current role months, recent experience months, and date warnings. |
| Signal extraction | `extractCareerSignalsFromResumeProfile.js` | Extracts role family, industry domain, strength, skill, tool, and risk hints from profile headline, experiences, bullets, skills, and timeline warnings. |
| ResumeProfile adapter | `buildCareerProfileFromResumeProfile.js` | Builds timeline + signals from `resumeProfile.experiences`; optionally adds fit if `options.target` exists. |
| WorkRecords adapter | `buildCareerProfileFromWorkRecords.js` | Converts WorkRecord-like rows to ResumeProfile-like input and reuses `buildCareerProfileFromResumeProfile()`. |
| Fit model | `careerFitModel.js` | Normalizes fit levels `direct`, `adjacent`, `transferable`, `unrelated`, `unknown` and summary month buckets. |
| Role fit | `scoreCareerRoleFit.js` | Scores per timeline experience against role family target using role/strength signals and adjacent-role map. |
| Industry fit | `scoreCareerIndustryFit.js` | Scores per timeline experience against industry target using industry/role/strength signals and adjacent-industry map. |
| Fit summary | `buildCareerFitSummary.js` | Combines role + industry fit into overall fit and aggregates duration-month buckets. |
| Keyword taxonomy | `careerSignalKeywords.js` | Holds small v0 keyword catalogs for role families, industry domains, strengths, and risk labels. Several Korean strings appear mojibake in source. |
| Signal model | `careerSignalModel.js` | Normalizes signal type, label, source, evidence text, confidence, weight, and dedupes. |

## 5. CareerProfile contract summary

| Contract field | Current structure |
| --- | --- |
| `schemaVersion` | Always normalized to `passmap.careerProfile.v0`. |
| `timeline` | Array of experience rows with `id`, `company`, `title`, `startMonth`, `endMonth`, `durationMonths`, `isCurrent`, `isShortTenure`, `warnings`. |
| `summary` | `totalExperienceMonths`, `uniqueExperienceMonths`, `overlapMonths`, `gapMonths`, `shortTenureCount`, `currentRoleMonths`, `recentExperienceMonths`, `experienceCount`. |
| `signals.roleFamilies` | Career signals of type `role_family_hint`. |
| `signals.industryDomains` | Career signals of type `industry_domain_hint`. |
| `signals.strengthSignals` | Career signals of type `strength_hint`. |
| `signals.riskSignals` | Career signals of type `risk_hint`, including short tenure, weak evidence, missing evidence, timeline date issue. |
| `signals.skillSignals` / `toolSignals` | Profile skill/tool hints. |
| `fit` | `null` unless target is provided; otherwise normalized CareerFit result. |
| `meta.source` | `resume_profile` or `work_records`. |
| `meta.warnings` | Timeline warnings plus adapter warnings for WorkRecords. |

## 6. Input adapter status

| Input type | Input source | Adapter | Output type | schemaVersion | warnings | duration precision | fit usage | saved? | UI shown? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ResumeProfile | Resume/JD Tailoring sample/profile data | `buildCareerProfileFromResumeProfile(profile, options)` | CareerProfile | `passmap.careerProfile.v0`; source resume schema recorded in `meta.resumeProfileSchemaVersion` | timeline date warnings | month range from explicit experience start/end | optional via `options.target` | No Career Core-specific persistence observed | JD Tailoring, Rejection |
| ResumeProfile from parsed resume | Rejection analysis path builds via `buildResumeProfileFromParsedResume()` | `buildRejectionCareerCoreSignal()` calls ResumeProfile adapter | Read-only signal wrapper containing fit and buckets | CareerProfile normalized internally; wrapper has no `schemaVersion` field | Career Core warnings are not surfaced in wrapper | `classificationBasis: experience_duration_sum` | yes | No dedicated Career Core DB save observed; analysis state contains signal | Rejection result |
| WorkRecord-like rows | AI Inbox item converted in memory | `buildCareerProfileFromWorkRecords([record])` | CareerProfile | `passmap.careerProfile.v0`; adapter meta `passmap.workRecordsCareerProfileAdapter.v0` | `work_record_duration_unknown`, `record_date_is_not_duration` | `record_based_reference` | optional, but AI Inbox current call has no target | No | AI Inbox signal pills only |
| WorkRecords repository rows | Work Records / Home / Asset Map | No direct Career Core adapter use found | N/A | N/A | N/A | N/A | N/A | Work records are stored independently | Home / Asset Map use separate logic |
| Parsed resume career interpretation | `/api/p1-analysis` P1-A | Not Career Core | API-specific career JSON | `schemaVersion: 1` | API fallback/meta only | LLM-provided `durationMonths` | P1-C role-fit path | API result path | Rejection/precise analysis support |

## 7. Output contract status

| Output area | Current fact |
| --- | --- |
| Timeline | Career Core computes ranges only from explicit start/end/current dates. Invalid/missing dates become zero months with warnings. |
| Summary | Career Core summary is deterministic and normalized; `gapMonths` and `shortTenureCount` are part of the engine contract. |
| Signals | Keyword-based v0 hints. Labels are normalized to lower-case keys. Signal sources point to profile, experience, bullet, skill, or timeline rows. |
| Fit | Optional. Uses role and industry scoring per experience and aggregates by experience `durationMonths`. |
| Meta/warnings | Present in CareerProfile. WorkRecords adapter adds adapter-specific warnings and `durationPrecision`. |
| UI wrappers | JD Tailoring consumes `fit` directly; Rejection wraps fit into `careerCoreSignal`; AI Inbox strips to top role/industry/strength labels. |

## 8. Feature call status

| Feature | Career Core use | Current details |
| --- | --- | --- |
| JD Tailoring | Direct use | `ResumeJdTailoringPanel.jsx` imports `buildCareerProfileFromResumeProfile()`. It derives a target with `buildCareerCoreTargetFromJdFit()` and displays `fit.summary` month buckets. |
| Rejection Analysis | Direct use through bridge | `App.jsx` builds a ResumeProfile from parsed resume and calls `buildRejectionCareerCoreSignal()`. `PreciseAnalysisFlow.jsx` displays a read-only box if `signal.status === "ready"`. |
| AI Inbox | Direct use through WorkRecords adapter | `AiExperienceInboxPanel.jsx` converts one AI Inbox item into a WorkRecord-like object, calls `buildCareerProfileFromWorkRecords()`, and displays only role/industry/strength groups. |
| Work Records | Adapter exists, repository not wired to Career Core | Work record save/list/update files do not call Career Core. Work Records data can be interpreted by the adapter when a caller opts in. |
| Career Asset Map / Home | No direct Career Core use found | Home adapts work records with local mapping. `CareerAssetMapMock.jsx` builds record-to-asset and asset-to-role edges with keyword/co-occurrence heuristics. |
| Mobile Home / Week Strip | No direct Career Core use found | Uses record dates and record summaries/tags, not Career Core. |

## 9. Duplicate logic outside Career Core

| Topic | File(s) | Current duplicate / parallel logic |
| --- | --- | --- |
| Duration calculation | `src/App.jsx`, `src/lib/simulation/buildCareerTimeline.js`, `api/p1-analysis.js` | Month math and duration/gap calculations exist outside Career Core. |
| Gap months | `src/App.jsx`, `src/lib/simulation/buildCareerTimeline.js`, `api/p1-analysis.js` | Gap/recency/career flow logic exists independently. |
| Short tenure / risk | `src/App.jsx`, `src/lib/decision/**`, `src/lib/preciseAnalysis/**`, `api/p1-analysis.js` | Short tenure and career risk are judged by several non-Career-Core paths. |
| Role tags / role fit | `api/p1-analysis.js`, `src/lib/fit/jdResumeFit.js`, `src/lib/resume/buildResumeJdFit.js`, `src/lib/shared/taxonomy/**`, `src/data/transitionLite/**` | Role family/target role matching has multiple separate systems. |
| Industry tags / industry fit | `src/lib/shared/taxonomy/**`, `src/data/transitionLite/**`, `src/data/transitionLite/industryArchetypeRegistry.js`, `src/lib/decision/riskProfiles/companyIndustryContext/**` | Industry interpretation exists outside Career Core taxonomy. |
| Strength/competency signals | `src/lib/resume/recordToResumeCandidate.js`, `src/lib/resume/buildExperienceSignalsFromRecord.js`, `src/components/home/CareerAssetMapMock.jsx`, `src/lib/analysis/buildNewgradAxisPack.js` | Strength and evidence signals are extracted or interpreted separately. |
| JD fit | `src/lib/fit/jdResumeFit.js`, `src/lib/resume/buildResumeJdFit.js`, `api/p1-analysis.js` | JD fit and role-relevant months are computed outside Career Core. |
| Relevant / unrelated judgment | Career Core fit, `api/p1-analysis.js` P1-C, precise-analysis risk builders | Career relevance has multiple schemas: Career Core `direct/adjacent/transferable/...`; P1-C `direct/similar/transferable/weak/...`; risk builders use their own gap terms. |
| Asset / direction judgment | `src/components/home/CareerAssetMapMock.jsx`, `src/data/transitionLite/**` | Asset-to-role direction is keyword/co-occurrence and registry based, not Career Core based. |
| WorkRecord date as period | `src/components/home/HomeDashboard.jsx`, `src/lib/resume/recordToResumeCandidate.js`, `src/components/mvp/PmMvpView.jsx` | Some non-Career-Core paths fall back from `record_date` to `startDate`/`endDate` or candidate date fields. |

## 10. Risk findings

| Risk question | Finding | Status |
| --- | --- | --- |
| Career Core result stored? | No dedicated Career Core persistence was found. `App.jsx` stores `careerCoreSignal` in in-memory analysis state, but `saveAnalysisRun()` currently builds persisted `resultJson` from `simulationViewModel` and `riskResults`, not `preciseAnalysis.careerCoreSignal`. | PASS with watch item |
| Career Core outside duration/month recalculation? | Yes. Duration/gap/month logic exists in `App.jsx`, `simulation/buildCareerTimeline.js`, and `api/p1-analysis.js`. | REVIEW |
| WorkRecord `record_date` used as career duration? | Career Core adapter explicitly warns and does not use `record_date` as duration. Outside Career Core, Home/Resume candidate paths use `record_date` as start/end/date fallback for record display or candidate conversion. | REVIEW |
| AI Inbox displays month/duration/relevant months? | Current AI Inbox UI only renders role/industry/strength groups. No month bucket display found in AI Inbox block. | PASS |
| JD/Rejection/Asset Map use different role/industry criteria? | Yes. JD/Rejection can use Career Core target inference; Asset Map/Home use separate keyword/co-occurrence and registries. P1 API has another role-fit schema. | REVIEW |
| Consuming Career Core without schemaVersion? | JD Tailoring consumes `fit` only. Rejection bridge wrapper does not expose CareerProfile `schemaVersion`; it passes a `careerCoreSignal` wrapper with `source: "career_core_v0"`. AI Inbox consumes signals only. | REVIEW |
| Warnings ignored or hidden? | CareerProfile warnings exist. JD Tailoring and Rejection UI do not surface raw Career Core warnings. AI Inbox intentionally avoids duration display but also does not display adapter warnings. | REVIEW |
| Existing source encoding | Several Korean literals in Career Core keyword catalog and connected UI files render as mojibake in source output. This is existing state, not changed here. | REVIEW |

## 11. Engine gaps observed

Facts only:

- Career Core is present as a reusable deterministic module, but it is not yet the single source of truth for duration, gap, role fit, industry fit, or career relevance.
- Career Core has only two input adapters: ResumeProfile and WorkRecords.
- Career Core keyword taxonomy is small v0 and separate from broader PASSMAP job/industry taxonomy registries.
- Career Core warnings are normalized in engine output but are mostly not consumed by UI wrappers.
- Rejection and JD Tailoring can show month buckets from Career Core; AI Inbox intentionally does not.
- Home / Career Asset Map are not wired to Career Core and continue to use local heuristics.
- API P1 career interpretation and role-fit matcher use independent schemaVersion `1` outputs and independent relevance labels.

## 12. Next work candidates

### Safe next patch candidates

- Add docs-only contract map for CareerProfile and CareerFit output fields.
- Add deterministic tests asserting WorkRecords `record_date` never increases `durationMonths`.
- Add source QA asserting AI Inbox never renders Career Core month fields.
- Add source QA asserting Rejection/JD wrappers label month buckets as reference duration sums.

### Risky patch candidates

- Surface Career Core warnings in JD/Rejection UI because it affects user-facing copy and layout.
- Replace Home/Asset Map keyword co-occurrence with Career Core signals because it changes displayed asset/role graph behavior.
- Align P1-C role-fit labels with Career Core fit levels because it changes API/result semantics.
- Route non-Career-Core duration calculations through Career Core because older flows may depend on current month math.

### Protected candidates

- Any DB persistence of CareerProfile or CareerFit.
- Any Supabase schema or RLS change for storing Career Core outputs.
- Any API contract change that replaces P1 career interpretation or role-fit output schemas.
- Any production deploy/redeploy to validate this investigation.

### Backlog candidates

- Compare Career Core keyword catalog with broader job/industry taxonomy registries.
- Inventory mojibake literals in Career Core-connected source files.
- Build a fixture matrix for ResumeProfile, WorkRecords, parsed resume, and Work Record repository rows.
- Create a no-behavior-change report of all duration calculators in the codebase.

## 13. Verification

Passed:

- `node scripts/test-career-core-timeline.js`
- `node scripts/test-career-core-signals.js`
- `node scripts/test-career-core-fit.js`
- `node scripts/test-career-core-work-records-adapter.js`
- `node scripts/qa-career-core-fit-real-cases.js`

Attempted:

- `npm run build`

Build result:

- Failed because this fresh worktree had no `node_modules`; `vite` was not recognized.
- No package or dependency files were changed.
- The command was not repeated.

## 14. Conclusion

Result: `REVIEW`

Career Core is established as a reusable read-only interpretation module and is already used by JD Tailoring, Rejection Analysis, and AI Inbox. It is not yet the central engine for all career interpretation in PASSMAP because duration, gap, role/industry fit, risk, and asset-direction logic still exist in several non-Career-Core paths.
