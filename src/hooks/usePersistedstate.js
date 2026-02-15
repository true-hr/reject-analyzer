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
    // ✅ loaded도 그대로 쓰지 말고 "복사본"으로 사용 (loadState가 내부 캐시 객체를 반환/공유할 수 있음)
    return loaded && typeof loaded === "object" ? clone(loaded) : clone(initial);
  });

  useEffect(() => {
    // ✅ 핵심: 저장은 디바운스 + 큰 텍스트면 지연시간을 늘려 IME 조합(한글 입력) 끊김을 방지
    const hasLargeText =
      (state?.jd?.length ?? 0) > 500 ||
      (state?.resume?.length ?? 0) > 500 ||
      (state?.interviewNotes?.length ?? 0) > 500;

    const delay = hasLargeText ? 900 : 450;

    // 1. 타이머 생성 (delay 후 저장)
    const timer = setTimeout(() => {
      try {
        // ✅ storage.js의 saveState는 JSON.stringify만 하므로 clone 불필요(비용/끊김 유발)
        saveState(state);
      } catch {
        // ignore
      }
    }, delay);

    // 2. state가 다시 바뀌면 이전 타이머 취소
    return () => clearTimeout(timer);
  }, [state]);

  function resetState() {
    clearState();
    setState(clone(defaultState));
  }

  return [state, setState, resetState];
}
