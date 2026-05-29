import { useState, useEffect, useRef } from "react";

function resolveP1AnalysisEndpoint() {
  if (typeof window === "undefined") return "/api/p1-analysis";

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3000/api/p1-analysis";
  }

  if (hostname === "true-hr.github.io") {
    return "https://reject-analyzer.vercel.app/api/p1-analysis";
  }

  return "/api/p1-analysis";
}

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

// @MX:ANCHOR: [AUTO] useNewgradJobIndustryBridge — async AI bridge hook for newgrad Axis2 supplement
// @MX:REASON: Called only when payload.status === "ready"; fires once per mount via calledRef dedup; failure silently returns null (no error shown)
export function useNewgradJobIndustryBridge({ payload = null, bearerToken = null } = {}) {
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

  const shouldCall = payload?.status === "ready";

  useEffect(() => {
    if (!shouldCall) {
      setState({ loading: false, data: null, empty: false, error: null, diagnostic: null, attempted: false, timedOut: false });
      return;
    }

    const authMode = bearerToken ? "authenticated" : "anonymous";
    const callKey = [
      payload?.target?.jobId ?? "",
      payload?.target?.industryId ?? "",
      payload?.target?.archetypeKey ?? "",
      authMode,
    ].join("|");
    if (calledRef.current === callKey) return;
    calledRef.current = callKey;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    timedOutRef.current = false;

    setState({ loading: true, data: null, empty: false, error: null, diagnostic: null, attempted: true, timedOut: false });

    if (process.env.NODE_ENV !== "production") {
      console.info("[newgrad-bridge] calling /api/p1-analysis", {
        endpoint: resolveP1AnalysisEndpoint(),
        jobId: payload?.target?.jobId,
        industryId: payload?.target?.industryId,
      });
    }

    const timeoutId = setTimeout(() => {
      timedOutRef.current = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    const headers = { "Content-Type": "application/json" };
    if (bearerToken) headers["Authorization"] = `Bearer ${bearerToken}`;
    const requestId = `njib-${Date.now()}`;

    fetch(resolveP1AnalysisEndpoint(), {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        action: "newgrad-job-industry-bridge",
        payload,
        requestId,
      }),
    })
      .then(async (res) => {
        clearTimeout(timeoutId);
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const err = new Error(body?.error?.message || `HTTP ${res.status}`);
          err.status = res.status;
          err.code = body?.error?.code ?? null;
          err.meta = body?.meta || null;
          throw err;
        }
        return { json: body, status: res.status };
      })
      .then(({ json, status }) => {
        if (!json?.ok || !json?.data?.bridgeResult) {
          setState({ loading: false, data: null, empty: true, error: null, diagnostic: makeDiagnostic({ code: "EMPTY_RESPONSE", message: "AI bridge returned empty response", status, meta: json?.meta, requestId, empty: true, authMode }), attempted: true, timedOut: false });
          return;
        }
        setState({ loading: false, data: json.data, empty: false, error: null, diagnostic: makeDiagnostic({ code: "OK", status, meta: json?.meta, requestId, authMode }), attempted: true, timedOut: false });
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err?.name === "AbortError") {
          if (timedOutRef.current) {
            const diagnostic = makeDiagnostic({ code: "TIMEOUT", message: "AI response timed out on the client", status: 0, requestId, timedOut: true, authMode });
            setState({ loading: false, data: null, empty: false, error: diagnostic, diagnostic, attempted: true, timedOut: true });
          } else {
            setState({ loading: false, data: null, empty: true, error: null, diagnostic: makeDiagnostic({ code: "ABORTED", message: "AI bridge request was aborted", status: 0, requestId, empty: true, authMode }), attempted: true, timedOut: false });
          }
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn("[useNewgradJobIndustryBridge] AI call failed:", err?.message);
        }
        if (err?.status === 429) {
          const diagnostic = makeDiagnostic({ code: err.code ?? "RATE_LIMITED", message: err.message, status: 429, meta: err?.meta, requestId, authMode });
          setState({ loading: false, data: null, empty: false, error: diagnostic, diagnostic, attempted: true, timedOut: false });
          return;
        }
        const diagnostic = makeDiagnostic({ code: err?.code ?? "AI_BRIDGE_FAILED", message: err?.message || "AI bridge failed.", status: err?.status ?? 0, meta: err?.meta, requestId, authMode });
        setState({ loading: false, data: null, empty: false, error: diagnostic, diagnostic, attempted: true, timedOut: false });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [shouldCall, payload?.target?.jobId, payload?.target?.industryId, payload?.target?.archetypeKey, bearerToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, shouldCall, settled: state.attempted && !state.loading };
}
