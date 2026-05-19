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

const REQUEST_TIMEOUT_MS = 10000;

// @MX:ANCHOR: [AUTO] useNewgradJobIndustryBridge — async AI bridge hook for newgrad Axis2 supplement
// @MX:REASON: Called only when payload.status === "ready"; fires once per mount via calledRef dedup; failure silently returns null (no error shown)
export function useNewgradJobIndustryBridge({ payload = null, bearerToken = null } = {}) {
  const [state, setState] = useState({
    loading: false,
    data: null,
    error: null,
  });

  const abortRef = useRef(null);
  const calledRef = useRef(false);
  const timedOutRef = useRef(false);

  const shouldCall = payload?.status === "ready";

  useEffect(() => {
    if (!shouldCall) {
      setState({ loading: false, data: null, error: null });
      return;
    }

    const callKey = [
      payload?.target?.jobId ?? "",
      payload?.target?.industryId ?? "",
      payload?.target?.archetypeKey ?? "",
    ].join("|");
    if (calledRef.current === callKey) return;
    calledRef.current = callKey;

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    timedOutRef.current = false;

    setState({ loading: true, data: null, error: null });

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

    fetch(resolveP1AnalysisEndpoint(), {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        action: "newgrad-job-industry-bridge",
        payload,
        requestId: `njib-${Date.now()}`,
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
        if (!json?.ok || !json?.data?.bridgeResult) {
          setState({ loading: false, data: null, error: null });
          return;
        }
        setState({ loading: false, data: json.data, error: null });
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        if (err?.name === "AbortError") {
          setState({ loading: false, data: null, error: null });
          return;
        }
        if (process.env.NODE_ENV !== "production") {
          console.warn("[useNewgradJobIndustryBridge] AI call failed:", err?.message);
        }
        setState({ loading: false, data: null, error: null });
      });

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [shouldCall, payload?.target?.jobId, payload?.target?.industryId, payload?.target?.archetypeKey, bearerToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
