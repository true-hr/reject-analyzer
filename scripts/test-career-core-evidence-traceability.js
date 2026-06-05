import assert from "node:assert/strict";
import { buildEvidenceTraceMap } from "../src/lib/career-core/index.js";
import { evidenceTraceabilityCases } from "../src/lib/career-core/__fixtures__/evidenceTraceabilityCases.js";

function firstTrace(actual, signal) {
  return actual.tracesBySignal[signal]?.[0];
}

function assertTraceIntegrity(actual, caseId) {
  for (const [signal, traces] of Object.entries(actual.tracesBySignal)) {
    assert.ok(Array.isArray(traces) && traces.length > 0, `${caseId} ${signal} has traces`);
    for (const trace of traces) {
      assert.equal(trace.signal, signal, `${caseId} ${signal} trace signal`);
      assert.ok(trace.sourceText, `${caseId} ${signal} sourceText`);
      assert.ok(trace.sourceField, `${caseId} ${signal} sourceField`);
      assert.ok(trace.reasonCode, `${caseId} ${signal} reasonCode`);
      assert.equal(typeof trace.isContradicted, "boolean", `${caseId} ${signal} isContradicted`);
      if (trace.sourceField === "description") {
        assert.equal(typeof trace.sourceIndex, "number", `${caseId} ${signal} description sourceIndex`);
      }
    }
  }
  assert.equal(actual.appliedToCareerProfile, false, `${caseId} appliedToCareerProfile`);
}

for (const item of evidenceTraceabilityCases) {
  const actual = buildEvidenceTraceMap(item.input, item.options);
  const expected = item.expected;

  assertTraceIntegrity(actual, item.id);

  for (const signal of expected.tracedSignals ?? []) {
    assert.ok(actual.tracesBySignal[signal]?.length > 0, `${item.id} ${signal} traced`);
    assert.ok(firstTrace(actual, signal).sourceText, `${item.id} ${signal} sourceText`);
  }

  if (expected.missingSignals) {
    assert.deepEqual(actual.missingSignals, expected.missingSignals, `${item.id} missingSignals`);
  }

  for (const signal of expected.missingSignalsIncludes ?? []) {
    assert.ok(actual.missingSignals.includes(signal), `${item.id} missingSignals includes ${signal}`);
  }

  for (const signal of expected.noTraceSignals ?? []) {
    assert.equal(actual.tracesBySignal[signal], undefined, `${item.id} no trace for ${signal}`);
  }

  for (const signal of expected.contradictedSignals ?? []) {
    assert.ok(actual.contradictedSignals.includes(signal), `${item.id} contradictedSignals includes ${signal}`);
    assert.ok(
      actual.tracesBySignal[signal].some((trace) => trace.isContradicted),
      `${item.id} ${signal} has contradicted trace`,
    );
  }

  if (expected.contradictedOneOf) {
    assert.ok(
      expected.contradictedOneOf.some((signal) => actual.contradictedSignals.includes(signal)),
      `${item.id} contradicted oneOf ${expected.contradictedOneOf.join(", ")}`,
    );
  }

  for (const signal of expected.noExplicitSignals ?? []) {
    for (const trace of actual.tracesBySignal[signal] ?? []) {
      assert.notEqual(trace.evidenceLevel, "explicit", `${item.id} ${signal} not explicit`);
      assert.notEqual(trace.confidence, "explicit", `${item.id} ${signal} confidence not explicit`);
    }
  }

  for (const [signal, sourceField] of Object.entries(expected.sourceFieldBySignal ?? {})) {
    assert.ok(
      (actual.tracesBySignal[signal] ?? []).some((trace) => trace.sourceField === sourceField),
      `${item.id} ${signal} sourceField`,
    );
  }

  for (const [signal, sourceIndex] of Object.entries(expected.sourceIndexBySignal ?? {})) {
    assert.ok(
      (actual.tracesBySignal[signal] ?? []).some((trace) => trace.sourceIndex === sourceIndex),
      `${item.id} ${signal} sourceIndex`,
    );
  }
}

console.log("PASS career-core evidence source traceability deterministic checks");
