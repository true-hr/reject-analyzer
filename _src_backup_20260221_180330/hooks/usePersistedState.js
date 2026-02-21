// src/hooks/usePersistedState.js
import { useEffect, useMemo, useRef, useState } from "react";
import { loadState, saveState, clearState } from "../lib/storage";
import { defaultState } from "../lib/schema";

// ---- clone (crash-safe) ----
function clone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

/**
 * IME-safe persisted state hook (storage.js ?쒓렇?덉쿂 ?명솚 踰꾩쟾)
 * - Debounced save only
 * - While ANY IME composition is active: NEVER save
 * - On compositionend: flush pending save once (with latest state)
 *
 * NOTE:
 * - ?꾩옱 storage.js??key ?몄옄瑜?諛쏆? ?딆쓬(loadState/saveState/clearState)
 * - ?곕씪??storageKey??"?섏〈??臾몄꽌???쇰줈留??좎??섍퀬 ?ㅼ젣 ??μ? storage.js??KEY_V3濡??섑뻾??
 */
export function usePersistedState(storageKey, initial = defaultState) {
  // ---- state init: always use clone to avoid shared reference ----
  const [state, setState] = useState(() => {
    const loaded = loadState(); // ??storage.js: loadState() only
    return loaded && typeof loaded === "object" ? clone(loaded) : clone(initial);
  });

  // ---- reset ----
  const resetState = useMemo(() => {
    return () => {
      try {
        clearState(); // ??storage.js: clearState() only
      } catch {
        // ignore
      }
      setState(clone(initial));
    };
  }, [storageKey, initial]);

  // ---- IME composition tracking (global, no App.jsx changes required) ----
  const isComposingAnyRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const latestStateRef = useRef(state);

  // ---- debounced save timer ref ----
  const saveTimerRef = useRef(null);

  // ---- mount guard (StrictMode/dev safety) ----
  const mountedRef = useRef(false);

  const safeSave = (snapshot) => {
    try {
      saveState(clone(snapshot)); // ??storage.js: saveState(state) only
    } catch {
      // ignore
    }
  };

  // keep latest state in ref for flush-on-compositionend
  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onCompStart = () => {
      isComposingAnyRef.current = true;

      // If a save was scheduled right before composition, cancel it and mark pending.
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        pendingSaveRef.current = true;
      }
    };

    const onCompEnd = () => {
      // composition finished -> allow saves again
      isComposingAnyRef.current = false;

      // flush once now (but still via debounce safety)
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;

        if (saveTimerRef.current) {
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = null;
        }

        saveTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          safeSave(latestStateRef.current);
        }, 0);
      }
    };

    // capture phase to catch composition events early
    window.addEventListener("compositionstart", onCompStart, true);
    window.addEventListener("compositionend", onCompEnd, true);

    return () => {
      window.removeEventListener("compositionstart", onCompStart, true);
      window.removeEventListener("compositionend", onCompEnd, true);
    };
  }, [storageKey]);

  // ---- debounced save (IME-safe) ----
  useEffect(() => {
    // clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    // if IME is composing, NEVER save now. mark pending and exit.
    if (isComposingAnyRef.current) {
      pendingSaveRef.current = true;
      return;
    }

    // normal case: debounce save
    saveTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      safeSave(state);
    }, 500);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [state, storageKey]);

  return [state, setState, resetState];
}
