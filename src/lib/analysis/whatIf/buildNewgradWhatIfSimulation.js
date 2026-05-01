// Shadow-reruns buildNewgradTransitionLiteResult with a virtual cert appended.
// Never mutates baseInput, baseVm, or App state.

import { buildNewgradTransitionLiteResult } from "../../transitionLite/buildNewgradTransitionLiteResult.js";
import { compareNewgradWhatIfResult } from "./compareNewgradWhatIfResult.js";

export function buildNewgradWhatIfSimulation({ baseInput, baseVm, virtualCert }) {
  if (!baseInput || typeof baseInput !== "object") {
    return { simulatedVm: null, delta: null, error: "missing_base_input" };
  }
  if (!baseVm || typeof baseVm !== "object") {
    return { simulatedVm: null, delta: null, error: "missing_base_vm" };
  }
  if (!virtualCert || typeof virtualCert !== "object" || !virtualCert.label) {
    return { simulatedVm: null, delta: null, error: "missing_virtual_cert" };
  }

  try {
    const clonedInput = JSON.parse(JSON.stringify(baseInput));
    if (!Array.isArray(clonedInput.certifications)) {
      clonedInput.certifications = [];
    }
    clonedInput.certifications = [...clonedInput.certifications, { label: virtualCert.label }];

    const simulatedVm = buildNewgradTransitionLiteResult(clonedInput);
    const delta = compareNewgradWhatIfResult(baseVm, simulatedVm, virtualCert);

    return { simulatedVm, delta, error: null };
  } catch (err) {
    return { simulatedVm: null, delta: null, error: err?.message || "simulation_error" };
  }
}
