import { useState, useEffect, useRef } from "react";

const API_ENDPOINT =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3000/api/p1-analysis"
    : "/api/p1-analysis";

const REQUEST_TIMEOUT_MS = 10000;

// @MX:ANCHOR: [AUTO] useCareerFitAiEvidence — async AI evidence hook for career-only report section
// @MX:REASON: Called only when !isNewgradReport and candidateExperienceText is non-empty; must never block existing report render
export function useCareerFitAiEvidence({
  isCareerReport = false,
  currentJobLabel = "",
  targetJobLabel = "",
  currentIndustryLabel = "",
  targetIndustryLabel = "",
  candidateExperienceText = "",
  reportContext = null,
  bearerToken = null,
} = {}) {
  const [state, setState] = useState({
    loading: false,
    data: null,
    empty: false,
    error: null,
  });

  const abortRef = useRef(null);
  const calledRef = useRef(false);

  const expText = String(candidateExperienceText || "").trim();
  const shouldCall =
    isCareerReport &&
    Boolean(currentJobLabel) &&
    Boolean(targetJobLabel) &&
    expText.length >= 30;

  useEffect(() => {
    if (!shouldCall) {
      setState({ loading: false, data: null, empty: true, error: null });
      return;
    }

    // Deduplicate: only call once per mount with the same inputs
    const callKey = [currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel, expText.slice(0, 80)].join("|");
    if (calledRef.current === callKey) return;
    calledRef.current = callKey;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ loading: true, data: null, empty: false, error: null });

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    const headers = { "Content-Type": "application/json" };
    if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;

    const axisScores = Array.isArray(reportContext?.axisScores)
      ? reportContext.axisScores
      : extractAxisScoresFromPack(reportContext?.axisPack);

    fetch(API_ENDPOINT, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        action: "career-fit-ai",
        currentJobLabel,
        targetJobLabel,
        currentIndustryLabel,
        targetIndustryLabel,
        candidateExperienceText: expText,
        reportContext: {
          axisScores,
          topRisks: Array.isArray(reportContext?.topRisks)
            ? reportContext.topRisks.slice(0, 3).map((r) => ({ title: r?.title ?? "", key: r?.key ?? "" }))
            : [],
        },
        requestId: `cfa-${Date.now()}`,
      }),
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error?.message || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((json) => {
        if (!json?.ok) {
          if (json?.empty) {
            setState({ loading: false, data: null, empty: true, error: null });
          } else {
            setState({ loading: false, data: null, empty: false, error: json?.error?.message || "unknown" });
          }
          return;
        }
        if (json.empty) {
          setState({ loading: false, data: null, empty: true, error: null });
          return;
        }
        const data = validateEvidenceMap(json.data);
        if (!data) {
          setState({ loading: false, data: null, empty: true, error: null });
          return;
        }
        setState({ loading: false, data, empty: false, error: null });
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err?.name === "AbortError") {
          setState({ loading: false, data: null, empty: true, error: null });
          return;
        }
        // Silent failure: do not surface errors to user, just treat as empty
        console.warn("[useCareerFitAiEvidence] AI call failed:", err?.message);
        setState({ loading: false, data: null, empty: true, error: null });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [shouldCall, currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel, expText, bearerToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}

function extractAxisScoresFromPack(axisPack) {
  if (!axisPack?.axes || typeof axisPack.axes !== "object") return [];
  return Object.values(axisPack.axes)
    .filter(Boolean)
    .map((axis) => ({
      label: typeof axis.label === "string" ? axis.label : "",
      band: typeof axis.band === "string" ? axis.band : "",
    }))
    .filter((a) => a.label);
}

function validateEvidenceMap(data) {
  if (!data || typeof data !== "object") return null;
  // Must have at least a summary string to be considered valid
  if (typeof data.summary !== "string") return null;
  return data;
}
