import React, { useEffect, useState } from "react";
import { getSession } from "../lib/auth";

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __formatDate(value) {
  const text = __s(value);
  if (!text) return "-";
  try {
    return new Date(text).toLocaleString("ko-KR");
  } catch {
    return text;
  }
}

function __prettyJson(value) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return String(value || "");
  }
}

function __getApiUrl(path) {
  const base = __s(import.meta.env.VITE_API_BASE);
  return base ? `${base.replace(/\/$/, "")}${path}` : path;
}

export default function AdminAnalysisPage() {
  const [accessToken, setAccessToken] = useState("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [candidateTypeFilter, setCandidateTypeFilter] = useState("all");
  const [limitFilter, setLimitFilter] = useState("20");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [submittedCandidateType, setSubmittedCandidateType] = useState("all");
  const [submittedLimit, setSubmittedLimit] = useState("20");
  const [candidateTypeOptions, setCandidateTypeOptions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailData, setDetailData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminSession() {
      try {
        const session = await getSession();
        if (!cancelled) {
          setAccessToken(__s(session?.access_token));
        }
      } catch {
        if (!cancelled) {
          setAccessToken("");
          setError("관리자 계정으로 로그인해야 합니다.");
        }
      } finally {
        if (!cancelled) {
          setSessionChecked(true);
        }
      }
    }

    loadAdminSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      if (!sessionChecked) {
        return;
      }
      if (!accessToken) {
        setItems([]);
        setCandidateTypeOptions([]);
        setLoading(false);
        setError("관리자 계정으로 로그인해야 합니다.");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const sp = new URLSearchParams();
        if (__s(submittedQuery)) sp.set("q", __s(submittedQuery));
        if (__s(submittedCandidateType) && __s(submittedCandidateType) !== "all") {
          sp.set("candidateType", __s(submittedCandidateType));
        }
        if (__s(submittedLimit)) sp.set("limit", __s(submittedLimit));
        sp.set("type", "list");
        const url = `${__getApiUrl("/api/admin-analysis")}?${sp.toString()}`;
        const resp = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = await resp.json().catch(() => null);
        if (resp.status === 401) {
          throw new Error("관리자 계정으로 로그인해야 합니다.");
        }
        if (resp.status === 403) {
          throw new Error("관리자 권한이 없습니다.");
        }
        if (!resp.ok || !data?.ok) {
          throw new Error(data?.error?.message || data?.error || "admin_analysis_list_failed");
        }
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setCandidateTypeOptions(Array.isArray(data.candidateTypes) ? data.candidateTypes : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(String(err?.message || err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadList();
    return () => {
      cancelled = true;
    };
  }, [accessToken, sessionChecked, submittedCandidateType, submittedLimit, submittedQuery]);

  async function openDetail(runId) {
    const safeRunId = __s(runId);
    if (!safeRunId || !accessToken) return;

    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setDetailData(null);

    try {
      const url = `${__getApiUrl("/api/admin-analysis")}?type=detail&runId=${encodeURIComponent(safeRunId)}`;
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await resp.json().catch(() => null);
      if (resp.status === 401) {
        throw new Error("관리자 계정으로 로그인해야 합니다.");
      }
      if (resp.status === 403) {
        throw new Error("관리자 권한이 없습니다.");
      }
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.error?.message || data?.error || "admin_analysis_detail_failed");
      }
      setDetailData(data);
    } catch (err) {
      setDetailError(String(err?.message || err));
    } finally {
      setDetailLoading(false);
    }
  }

  async function refreshSession(e) {
    e?.preventDefault?.();
    setError("");
    try {
      const session = await getSession();
      const nextAccessToken = __s(session?.access_token);
      setAccessToken(nextAccessToken);
      setSessionChecked(true);
      setDetailOpen(false);
      setDetailData(null);
      setDetailError("");
      if (!nextAccessToken) {
        setItems([]);
        setCandidateTypeOptions([]);
        setError("관리자 계정으로 로그인해야 합니다.");
      }
    } catch {
      setAccessToken("");
      setSessionChecked(true);
      setItems([]);
      setCandidateTypeOptions([]);
      setError("관리자 계정으로 로그인해야 합니다.");
    }
  }

  function clearSession() {
    setAccessToken("");
    setSessionChecked(true);
    setItems([]);
    setCandidateTypeOptions([]);
    setError("관리자 계정으로 로그인해야 합니다.");
    setDetailOpen(false);
    setDetailData(null);
    setDetailError("");
  }

  function applyFilters(e) {
    e?.preventDefault?.();
    setSubmittedQuery(__s(queryInput));
    setSubmittedCandidateType(__s(candidateTypeFilter) || "all");
    setSubmittedLimit(__s(limitFilter) || "20");
  }

  const run = detailData?.run || null;
  const input = detailData?.input || null;
  const resultJson = run?.result_json && typeof run.result_json === "object" ? run.result_json : {};
  const simulationViewModel = resultJson?.simulationViewModel ?? null;
  const riskResults = Array.isArray(resultJson?.riskResults) ? resultJson.riskResults : [];
  const topRisks = Array.isArray(run?.top_risks_json) ? run.top_risks_json : [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6">
          <div className="text-sm font-medium text-slate-500">PASSMAP Admin</div>
          <h1 className="text-3xl font-semibold tracking-tight">분석 저장 조회</h1>
        </div>

        <form className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={refreshSession}>
          <div className="mb-3 text-sm font-medium text-slate-700">관리자 계정 인증</div>
          <div className="flex flex-col gap-3 md:flex-row">
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
            >
              세션 확인 후 조회
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
              onClick={clearSession}
            >
              세션 초기화
            </button>
          </div>
          {!accessToken ? (
            <div className="mt-3 text-sm text-slate-500">로그인 세션이 없으면 목록과 상세 요청을 보내지 않습니다.</div>
          ) : (
            <div className="mt-3 text-sm text-emerald-700">현재 로그인 세션으로 관리자 권한을 확인합니다.</div>
          )}
        </form>

        <form className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={applyFilters}>
          <div className="mb-3 text-sm font-medium text-slate-700">목록 필터</div>
          <div className="flex flex-col gap-3 lg:flex-row">
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              placeholder="companyName 또는 targetRole 검색"
              disabled={!accessToken}
            />
            <select
              value={candidateTypeFilter}
              onChange={(e) => setCandidateTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              disabled={!accessToken}
            >
              <option value="all">전체 candidateType</option>
              {candidateTypeOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <select
              value={limitFilter}
              onChange={(e) => setLimitFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
              disabled={!accessToken}
            >
              <option value="20">최근 20건</option>
              <option value="50">최근 50건</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!accessToken}
            >
              조회
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">createdAt</th>
                  <th className="px-4 py-3 font-medium">companyName</th>
                  <th className="px-4 py-3 font-medium">targetRole</th>
                  <th className="px-4 py-3 font-medium">industry</th>
                  <th className="px-4 py-3 font-medium">score</th>
                  <th className="px-4 py-3 font-medium">candidateType</th>
                  <th className="px-4 py-3 font-medium">topRisk1</th>
                  <th className="px-4 py-3 font-medium">engineVersion</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>불러오는 중...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-rose-600" colSpan={8}>{error}</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-slate-500" colSpan={8}>저장된 분석이 없습니다.</td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.runId}
                      className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                      onClick={() => openDetail(item.runId)}
                    >
                      <td className="px-4 py-3">{__formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3">{item.companyName || "-"}</td>
                      <td className="px-4 py-3">{item.targetRole || "-"}</td>
                      <td className="px-4 py-3">{item.industry || "-"}</td>
                      <td className="px-4 py-3">{item.score ?? "-"}</td>
                      <td className="px-4 py-3">{item.candidateType || "-"}</td>
                      <td className="px-4 py-3">{item.topRisk1 || "-"}</td>
                      <td className="px-4 py-3">{item.engineVersion || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 px-4 py-6" onClick={() => setDetailOpen(false)}>
          <div
            className="mx-auto max-h-[92vh] max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <div className="text-xs text-slate-500">runId</div>
                <div className="font-mono text-sm text-slate-800">{run?.id || "-"}</div>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setDetailOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="space-y-6 px-6 py-6">
              {detailLoading ? <div className="text-slate-500">상세 불러오는 중...</div> : null}
              {detailError ? <div className="text-rose-600">{detailError}</div> : null}

              {!detailLoading && !detailError && detailData ? (
                <>
                  <section className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
                    <div>
                      <div className="text-xs text-slate-500">score</div>
                      <div className="text-base font-semibold">{run?.score ?? "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">candidateType</div>
                      <div className="text-base font-semibold">{run?.candidate_type || "-"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">engineVersion</div>
                      <div className="text-sm font-medium">{run?.engine_version || "-"}</div>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold">JD 원문</h2>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6">{input?.jd_text || "-"}</pre>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold">Resume 원문</h2>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6">{input?.resume_text || "-"}</pre>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold">topRisks</h2>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6">{__prettyJson(topRisks)}</pre>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold">simulationViewModel</h2>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6">{__prettyJson(simulationViewModel)}</pre>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-lg font-semibold">riskResults</h2>
                    <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6">{__prettyJson(riskResults)}</pre>
                  </section>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
