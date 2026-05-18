import { useState, useEffect, useRef } from "react";

const VERCEL_API_ORIGIN = "https://reject-analyzer.vercel.app";

function resolveApiEndpoint() {
  if (typeof window === "undefined") return "/api/p1-analysis";

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000/api/p1-analysis";
  }

  if (hostname.endsWith("github.io")) {
    return `${VERCEL_API_ORIGIN}/api/p1-analysis`;
  }

  return "/api/p1-analysis";
}

const API_ENDPOINT = resolveApiEndpoint();

const REQUEST_TIMEOUT_MS = 10000;

// @MX:ANCHOR: [AUTO] useCareerFitAiEvidence — async AI evidence hook for career-only report section
// @MX:REASON: Called only when isCareerReport=true with valid job labels; fires on 4-field job/industry selection without candidate experience text
export function useCareerFitAiEvidence({
  isCareerReport = false,
  currentJobLabel = "",
  targetJobLabel = "",
  currentIndustryLabel = "",
  targetIndustryLabel = "",
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
  const timedOutRef = useRef(false);

  const eligible = Boolean(isCareerReport);
  const shouldCall =
    isCareerReport &&
    Boolean(currentJobLabel) &&
    Boolean(targetJobLabel);

  useEffect(() => {
    if (!shouldCall) {
      setState({ loading: false, data: null, empty: true, error: null });
      return;
    }

    // Deduplicate: only call once per mount with the same inputs
    const callKey = [currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel].join("|");
    if (calledRef.current === callKey) return;
    calledRef.current = callKey;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    timedOutRef.current = false;

    setState({ loading: true, data: null, empty: false, error: null });

    if (process.env.NODE_ENV !== "production") {
      console.info("[career-fit-ai] context mode — calling /api/p1-analysis", { currentJobLabel, targetJobLabel });
    }

    const timeoutId = setTimeout(() => {
      timedOutRef.current = true;
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
        reportContext: {
          axisScores,
          topRisks: Array.isArray(reportContext?.topRisks)
            ? reportContext.topRisks.slice(0, 3).map((r) => ({ title: r?.title ?? "", key: r?.key ?? "" }))
            : [],
          targetJobContext: reportContext?.targetJobContext ?? null,
          industryContext: reportContext?.industryContext ?? null,
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
          if (timedOutRef.current) {
            timedOutRef.current = false;
            setState({ loading: false, data: null, empty: false, error: "timeout" });
          } else {
            setState({ loading: false, data: null, empty: true, error: null });
          }
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn("[useCareerFitAiEvidence] AI call failed:", err?.message);
        }
        setState({ loading: false, data: null, empty: false, error: err?.message || "error" });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [shouldCall, currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel, bearerToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, eligible };
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
