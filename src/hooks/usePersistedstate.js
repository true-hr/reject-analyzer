// src/hooks/usePersistedState.js
import { useEffect, useState } from "react";
import { loadState, saveState, clearState } from "../lib/storage";
import { defaultState } from "../lib/schema";

function clone(obj) {
  // structuredClone이 없을 수도 있어서 안전하게 처리
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export function usePersistedState(initial = defaultState) {
  const [state, setState] = useState(() => {
    const loaded = loadState();
    return loaded && typeof loaded === "object" ? loaded : clone(initial);
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  function resetState() {
    clearState();
    setState(clone(defaultState));
  }

  return [state, setState, resetState];
}
