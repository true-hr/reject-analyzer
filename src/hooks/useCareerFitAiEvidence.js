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

const REQUEST_TIMEOUT_MS = 60000;

function makeDiagnostic({ code = "", message = "", status = 0, meta = null, requestId = "", timedOut = false, empty = false, authMode = "anonymous" } = {}) {
  return {
    code: code || "",
    message: message || "",
    status: Number(status) || 0,
    meta: meta && typeof meta === "object" ? {
      endpoint: meta.endpoint || meta.source || "",
      ms: typeof meta.ms === "number" ? meta.ms : null,
      requestId: meta.requestId || requestId || "",
    } : null,
    requestId: requestId || meta?.requestId || "",
    timedOut: Boolean(timedOut),
    empty: Boolean(empty),
    authMode,
  };
}

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
    diagnostic: null,
    attempted: false,
    timedOut: false,
  });

  const abortRef = useRef(null);
  const calledRef = useRef(false);
  const timedOutRef = useRef(false);

  const eligible = Boolean(isCareerReport);
  const missingRequiredLabels =
    isCareerReport &&
    (!String(currentJobLabel || "").trim() || !String(targetJobLabel || "").trim());
  const shouldCall =
    isCareerReport &&
    Boolean(currentJobLabel) &&
    Boolean(targetJobLabel);
  const reportContextKey = JSON.stringify({
    axisScores: Array.isArray(reportContext?.axisScores)
      ? reportContext.axisScores
      : extractAxisScoresFromPack(reportContext?.axisPack),
    topRisks: Array.isArray(reportContext?.topRisks)
      ? reportContext.topRisks.slice(0, 3).map((r) => ({ title: r?.title ?? "", key: r?.key ?? "" }))
      : [],
    targetJobContext: reportContext?.targetJobContext ?? null,
    industryContext: reportContext?.industryContext ?? null,
  });

  useEffect(() => {
    if (!shouldCall) {
      setState({ loading: false, data: null, empty: false, error: null, diagnostic: null, attempted: false, timedOut: false });
      return;
    }

    // Deduplicate: only call once per mount with the same inputs
    const authMode = bearerToken ? "authenticated" : "anonymous";
    const callKey = [currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel, reportContextKey, authMode].join("|");
    if (calledRef.current === callKey) return;
    calledRef.current = callKey;

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    timedOutRef.current = false;

    setState({ loading: true, data: null, empty: false, error: null, diagnostic: null, attempted: true, timedOut: false });

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

    const requestId = `cfa-${Date.now()}`;

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
        requestId,
      }),
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const err = new Error(body?.error?.message || `HTTP ${res.status}`);
          err.status = res.status;
          err.code = body?.error?.code || "API_ERROR";
          err.meta = body?.meta || null;
          throw err;
        }
        return { json: body, status: res.status };
      })
      .then(({ json, status }) => {
        if (!json?.ok) {
          if (json?.empty) {
            setState({ loading: false, data: null, empty: true, error: null, diagnostic: makeDiagnostic({ code: "EMPTY_RESPONSE", message: "AI returned empty response", status, meta: json?.meta, requestId, empty: true, authMode }), attempted: true, timedOut: false });
          } else {
            const diagnostic = makeDiagnostic({ code: json?.error?.code || "API_ERROR", message: json?.error?.message || "unknown", status, meta: json?.meta, requestId, authMode });
            setState({ loading: false, data: null, empty: false, error: diagnostic, diagnostic, attempted: true, timedOut: false });
          }
          return;
        }
        if (json.empty) {
          setState({ loading: false, data: null, empty: true, error: null, diagnostic: makeDiagnostic({ code: "EMPTY_RESPONSE", message: "AI returned empty response", status, meta: json?.meta, requestId, empty: true, authMode }), attempted: true, timedOut: false });
          return;
        }
        const data = validateEvidenceMap(json.data);
        if (!data) {
          setState({ loading: false, data: null, empty: true, error: null, diagnostic: makeDiagnostic({ code: "VALIDATION_FAILED", message: "AI response failed client validation", status, meta: json?.meta, requestId, empty: true, authMode }), attempted: true, timedOut: false });
          return;
        }
        setState({ loading: false, data, empty: false, error: null, diagnostic: makeDiagnostic({ code: "OK", status, meta: json?.meta, requestId, authMode }), attempted: true, timedOut: false });
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err?.name === "AbortError") {
          if (timedOutRef.current) {
            timedOutRef.current = false;
            const diagnostic = makeDiagnostic({ code: "TIMEOUT", message: "AI request timed out on the client", status: 0, requestId, timedOut: true, authMode });
            setState({ loading: false, data: null, empty: false, error: diagnostic, diagnostic, attempted: true, timedOut: true });
          } else {
            setState({ loading: false, data: null, empty: true, error: null, diagnostic: makeDiagnostic({ code: "ABORTED", message: "AI request was aborted", status: 0, requestId, empty: true, authMode }), attempted: true, timedOut: false });
          }
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn("[useCareerFitAiEvidence] AI call failed:", err?.message);
        }
        const diagnostic = makeDiagnostic({ code: err?.code || "FETCH_ERROR", message: err?.message || "error", status: err?.status || 0, meta: err?.meta, requestId, authMode });
        setState({ loading: false, data: null, empty: false, error: diagnostic, diagnostic, attempted: true, timedOut: false });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [shouldCall, currentJobLabel, targetJobLabel, currentIndustryLabel, targetIndustryLabel, bearerToken, reportContextKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, eligible, shouldCall, missingRequiredLabels, settled: state.attempted && !state.loading };
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
