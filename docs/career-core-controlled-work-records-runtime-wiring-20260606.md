# Career Core Controlled WorkRecords Runtime Wiring

## 1. Purpose

This batch adds opt-in WorkRecords controlled signal wiring to `buildCareerProfileFromWorkRecords()`.

The goal is to surface source-backed WorkRecord ownership, judgment, and impact candidates without changing default CareerProfile behavior.

## 2. Opt-in mode

Controlled WorkRecords candidates run only when:

```js
buildCareerProfileFromWorkRecords(workRecords, {
  enableControlledWorkRecordSignals: true,
});
```

Any value other than `true` keeps the existing adapter output unchanged.

## 3. Default disabled invariant

Default calls and explicit false calls must remain deep-equal to the previous WorkRecords CareerProfile output. No controlled metadata is added in disabled mode.

## 4. Controlled strength conditions

Controlled strength candidates require source text, source record id, and either record date or createdAt. They also require explicit ownership, explicit judgment, or explicit impact evidence.

Weak activity, contradicted ownership, missing context, meeting attendance, document cleanup, Excel-only cleanup, report-only cleanup, and handoff-only records are not promoted to strength.

## 5. Weak, contradicted, and missing-context handling

Weak, contradicted, and missing-context WorkRecords are routed to controlled risk candidates. Risk candidates keep a reason code, evidence text, or source text.

## 6. MissingEvidence metadata

Missing evidence is stored only at:

```text
meta.controlledWorkRecordSignalCandidates.missingEvidence
```

The `signals` schema is unchanged and does not gain `missingEvidence`.

## 7. Forbidden files and behavior

This batch does not modify ResumeProfile runtime, CareerProfile schema, RoleFit/scoring, UI, API, Supabase, env, deployment, or package files.

It does not infer strength from source-less records or from meeting attendance, handoff, Excel cleanup, or report cleanup alone.

## 8. Next-step conditions

Future batches can broaden the classifier only if they preserve opt-in behavior, source-backed strength requirements, protected-surface guardrails, and the default disabled deepEqual invariant.
