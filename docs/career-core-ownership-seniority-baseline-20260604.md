# Career Core Ownership & Seniority Baseline - 2026-06-04

## Purpose

This baseline captures an important resume interpretation problem:

> The same visible artifact can mean very different career value depending on ownership, judgment, seniority, and domain context.

Example:

- A junior accounting clerk may create a monthly Excel sheet by entering receipts and invoice data into a fixed format.
- A senior accountant may create a monthly close Excel pack by reconciling accounts, judging adjustment entries, preparing audit evidence, and explaining financial impact.

Both outputs may look like “Excel file,” but Career Core must not treat them as the same experience.

## Why this matters for PASSMAP

PASSMAP will often update resumes from working professionals. These users will not only upload formal resumes; they may also bring work records, screenshots, spreadsheets, Slack notes, calendar events, and daily task logs.

Many real work records are artifact-centered:

- Excel file
- report
- checklist
- meeting note
- dashboard
- proposal
- SOP
- customer issue sheet

The artifact itself is not enough. Career Core must ask:

1. Did the person merely enter data, or did they judge and own the work?
2. Was the person supporting someone else, recommending action, or leading the decision?
3. Was the work administrative, analytical, operational, financial, product-related, HR-related, or accounting-specific?
4. Is there explicit evidence for seniority, or are we over-inferencing?

## Baseline files

Added fixtures:

```text
src/lib/career-core/__fixtures__/ownershipSeniorityCases.js
src/lib/career-core/__fixtures__/expectedOwnershipSeniorityProfiles.js
```

This is a baseline-only QA batch. It does not change Career Core runtime logic.

## Core distinction

The baseline separates four dimensions:

### 1. artifactType

What was produced?

Example:

- spreadsheet
- report
- close pack
- forecast model
- funnel report

### 2. roleFamily

What kind of work does the artifact actually signal?

Examples:

- accounting_admin
- accounting_finance
- finance_analysis
- hr_operations
- product_operations
- unknown_admin_support

### 3. ownershipLevel

How much of the work did the person own?

Examples:

- support
- recommend
- recommend_and_follow_up
- lead
- unknown

### 4. judgmentLevel

How much professional judgment is evidenced?

Examples:

- low
- medium_low
- medium_high
- high
- unknown

## Baseline cases

### Case 1. Accounting admin Excel entry

Same artifact family: spreadsheet.

Interpretation:

- roleFamily: accounting_admin
- seniorityLevel: junior_support
- ownershipLevel: support
- judgmentLevel: low

Boundary:

Do not infer senior accounting judgment, financial analysis, close ownership, or audit lead experience from basic Excel entry and evidence organization.

### Case 2. Senior accountant close pack

Same artifact family: spreadsheet.

Interpretation:

- roleFamily: accounting_finance
- seniorityLevel: senior_practitioner
- ownershipLevel: lead
- judgmentLevel: high

Boundary:

Account reconciliation, closing review, variance analysis, audit evidence preparation, and financial issue explanation indicate senior accounting work.

### Case 3. Finance analyst forecast model

Same artifact family: spreadsheet.

Interpretation:

- roleFamily: finance_analysis
- seniorityLevel: analyst_or_mid
- ownershipLevel: recommend
- judgmentLevel: medium_high

Boundary:

Forecasting, scenario analysis, assumptions, and executive decision support should be treated as FP&A/finance analysis, not accounting close ownership.

### Case 4. HR operations payroll support

Same artifact family: spreadsheet.

Interpretation:

- roleFamily: hr_operations
- seniorityLevel: junior_or_mid_support
- ownershipLevel: support
- judgmentLevel: medium_low

Boundary:

Attendance/payroll input preparation is HR operations, not accounting finance. Do not infer labor-law policy ownership without evidence.

### Case 5. Product operations funnel report

Same artifact family: spreadsheet.

Interpretation:

- roleFamily: product_operations
- seniorityLevel: mid_practitioner
- ownershipLevel: recommend_and_follow_up
- judgmentLevel: medium_high

Boundary:

When a spreadsheet is used to diagnose user drop-off, recommend product improvements, and track post-release impact, it is product/service operations evidence.

### Case 6. Ambiguous Excel only

Same artifact family: spreadsheet.

Interpretation:

- roleFamily: unknown_admin_support
- seniorityLevel: unknown
- ownershipLevel: unknown
- judgmentLevel: unknown
- evidenceLevel: inferred_weak

Boundary:

“Used Excel to organize data” alone is not enough to infer accounting, finance analysis, product operations, seniority, or domain expertise.

## Anti-overclaim rules

Career Core must not infer high-value experience from artifact labels alone.

Forbidden overclaims:

- Excel = accounting finance
- Excel = data analysis
- report = strategy
- dashboard = senior analytics
- meeting note = stakeholder leadership
- checklist = process ownership

Allowed inference requires evidence of:

- decision authority
- judgment
- ownership
- review structure
- impact on downstream decisions
- domain-specific reasoning
- stakeholder explanation
- follow-up after output delivery

## Relation to prior Date/Employment work

The previous Date/Employment foundation answers:

- How long was the interval?
- What was the employment type?
- Is it experience, gap, signal, training, leave, or military?

This ownership/seniority baseline answers:

- What did the work actually mean?
- How deep was the work?
- Was it support, recommendation, ownership, or leadership?
- Which career signal should be extracted?
- What must not be inferred?

Both are required for Career Core to become a reliable resume/work-record interpretation engine.

## Next implementation direction

Do not wire this directly into UI or CareerProfile yet.

Recommended next patch:

1. Add a pure `classifyOwnershipSeniority()` utility.
2. Use this baseline fixture as source of truth.
3. Return roleFamily, ownershipLevel, judgmentLevel, seniorityLevel, evidenceLevel, strengthSignals, riskSignals, and shouldNotInfer.
4. Add deterministic tests.
5. Keep it read-only and not applied to CareerProfile until integration is designed.

## Guardrails

This baseline does not change:

- runtime CareerProfile generation
- timeline calculation
- scoring
- taxonomy
- UI
- API
- DB
- Supabase
- deployment

It is intentionally a QA baseline fixture batch.
