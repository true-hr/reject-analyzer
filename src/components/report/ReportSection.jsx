import React, { useMemo } from "react";

function safeStr(v) {
  return (v ?? "").toString();
}
function safeLower(v) {
  return safeStr(v).trim().toLowerCase();
}
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function getRiskId(x) {
  return safeStr(x?.id ?? x?.code ?? x?.riskId ?? x?.slug ?? "");
}
function getRiskTitle(x) {
  return safeStr(x?.title ?? x?.explain?.title ?? "");
}
function isGateRisk(x) {
  // [CONTRACT] gate 판정 기준: 정규화된 layer === "gate" 단독.
  // id prefix("GATE__"), group 이름("gates") 기반 판정 금지.
  return safeLower(x?.layer) === "gate";
}
function getPriority(x) {
  return safeNum(x?.priority, 0);
}
function getLayer(x) {
  return safeLower(x?.layer);
}

// 0.0 = 방어 거의 불가(서류에서 보수적 컷), 1.0 = 방어 매우 쉬움(면접 설득 가능)
const DEF_MAP = {
  // Gate/강한 컷
  GATE__AGE: 0.1,

  // salary/comp
  salaryMismatchRisk: 0.2,
  salaryDownshiftRisk: 0.3,

  // domain shift
  domainShiftRisk: 0.5,

  // ownership/impact
  ownershipRatioRisk: 0.7,
  decisionSignalRisk: 0.7,
  impactVerbRisk: 0.8,
  quantifiedImpactRisk: 0.8,
  processOnlyRisk: 0.8,

  // role/skill
  mustHaveSkillMissingRisk: 0.3,
  jdKeywordAbsenceRisk: 0.4,
};

function getDef(x) {
  const id = getRiskId(x);
  if (Object.prototype.hasOwnProperty.call(DEF_MAP, id)) return DEF_MAP[id];
  if (id.startsWith("GATE__")) return 0.2;
  return 0.5;
}
function defLabel(def) {
  const d = safeNum(def, 0.5);
  if (d <= 0.25) return "방어 어려움";
  if (d <= 0.6) return "방어 보통";
  return "방어 쉬움";
}
function defBadgeClass(def) {
  const d = safeNum(def, 0.5);
  if (d <= 0.25) return "bg-red-50 text-red-700 border-red-200";
  if (d <= 0.6) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function pickTop(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults.slice() : [];

  // HR 서류 관점 정렬:
  // 1) Gate 우선
  // 2) layer=document 우선
  // 3) priority 높은 순 (현재 프로젝트에서 priority=우선순위 의미로 사용되는 흐름에 맞춤)
  arr.sort((a, b) => {
    const ga = isGateRisk(a) ? 1 : 0;
    const gb = isGateRisk(b) ? 1 : 0;
    if (ga !== gb) return gb - ga;

    const la = getLayer(a) === "document" ? 1 : 0;
    const lb = getLayer(b) === "document" ? 1 : 0;
    if (la !== lb) return lb - la;

    const pa = getPriority(a);
    const pb = getPriority(b);
    if (pa !== pb) return pb - pa;

    const ta = getRiskTitle(a);
    const tb = getRiskTitle(b);
    return ta.localeCompare(tb);
  });

  return arr;
}

function getTop3DisplayClusterIdForMainContract(risk) {
  const id = String(risk?.id || "");
  if (
    id === "RISK__EXECUTION_IMPACT_GAP" ||
    id === "EXP__SCOPE__TOO_SHALLOW" ||
    id === "LOW_CONTENT_DENSITY_RISK"
  ) {
    return "CLUSTER__EXECUTION_IMPACT_SURFACE";
  }
  return String(risk?.group || id);
}

function dedupeTop3NormalsByDisplayClusterForMainContract(normals) {
  const out = [];
  const seen = new Set();
  for (const r of Array.isArray(normals) ? normals : []) {
    const cid = getTop3DisplayClusterIdForMainContract(r);
    if (seen.has(cid)) continue;
    seen.add(cid);
    out.push(r);
  }
  return out;
}

function pickTopMainContract(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults.slice() : [];
  const sorted = arr.sort((a, b) => getPriority(b) - getPriority(a));
  const gates = sorted.filter((x) => isGateRisk(x));
  const normals = sorted.filter((x) => !isGateRisk(x));
  const need = Math.max(0, 3 - Math.min(3, gates.length));

  // 메인 Top3 계약과 동일: 특정 gate 존재 시 동일 데이터 normal 중복 제거
  const gateIds = new Set(gates.slice(0, 3).map((r) => String(r?.id || "")));
  const normalsGateDeduped = gateIds.has("GATE__CRITICAL_EXPERIENCE_GAP")
    ? normals.filter((r) => String(r?.id || "") !== "ROLE_SKILL__MUST_HAVE_MISSING")
    : normals;

  // 메인 Top3 계약과 동일: execution/impact 의미군 display dedupe
  const normalsDeduped = dedupeTop3NormalsByDisplayClusterForMainContract(normalsGateDeduped);
  return [...gates.slice(0, 3), ...normalsDeduped.slice(0, need)];
}

export default function ReportSection(props) {
  const decisionPack =
    props?.decisionPack ||
    props?.reportPack?.decisionPack ||
    props?.analysis?.reportPack?.decisionPack ||
    (typeof window !== "undefined" ? window.__DBG_ACTIVE__?.reportPack?.decisionPack : null) ||
    null;

  // ✅ PATCH (append-only): prefer riskFeed over legacy riskResults (UI only)
  // - engine 산출: decisionPack.riskFeed (예: 13개)
  // - 기존 유지: decisionPack.riskResults (예: 4개)
  // - 점수/게이트/룰엔진 로직에는 영향 없음 (표시용 입력만 교체)
  const __riskFeed = decisionPack?.riskFeed;
  const __riskResultsLegacy = decisionPack?.riskResults;

  const __viewRisks = useMemo(() => {
    if (Array.isArray(__riskFeed) && __riskFeed.length > 0) {
      return __riskFeed;
    }
    if (Array.isArray(__riskResultsLegacy)) {
      return __riskResultsLegacy;
    }
    return [];
  }, [__riskFeed, __riskResultsLegacy]);

  // ✅ SSOT PATCH: 상위 리스크(Primary/Secondary)는 메인 Top3 계약을 따름
  // - source: decisionPack.riskResults 우선
  // - fallback: riskFeed (riskResults 미존재/빈 배열일 때만)
  // - sort contract: gate 우선 + priority 중심
  const __topRiskSource = useMemo(() => {
    if (Array.isArray(__riskResultsLegacy) && __riskResultsLegacy.length > 0) {
      return __riskResultsLegacy;
    }
    if (Array.isArray(__riskFeed) && __riskFeed.length > 0) {
      return __riskFeed;
    }
    return [];
  }, [__riskResultsLegacy, __riskFeed]);

  const vm = useMemo(() => {
    const topSorted = pickTopMainContract(__topRiskSource);
    const listSorted = pickTop(__viewRisks);
    const primary = topSorted[0] || null;
    const secondary = topSorted.slice(1, 3);

    const primarySummary = primary
      ? {
        id: getRiskId(primary),
        title: getRiskTitle(primary),
        isGate: isGateRisk(primary),
        priority: getPriority(primary),
        layer: getLayer(primary),
        def: getDef(primary),
      }
      : null;

    const secondarySummaries = (secondary || []).map((x) => ({
      id: getRiskId(x),
      title: getRiskTitle(x),
      isGate: isGateRisk(x),
      priority: getPriority(x),
      layer: getLayer(x),
      def: getDef(x),
    }));

    const decorated = listSorted.map((x) => {
      const def = getDef(x);
      return {
        raw: x,
        id: getRiskId(x),
        title: getRiskTitle(x),
        isGate: isGateRisk(x),
        priority: getPriority(x),
        layer: getLayer(x),
        def,
        defLabel: defLabel(def),
      };
    });

    // ✅ PATCH (append-only): hiddenRisk meta (UI teaser)
    // - 표준 경로: decisionPack.hiddenRisk
    // - 절대 크래시 나지 않게 방어
    const __hidden = decisionPack?.hiddenRisk ?? null;
    const __hiddenCountRaw = __hidden?.riskCount;
    const __hiddenCountNum = (() => {
      const n = typeof __hiddenCountRaw === "number" ? __hiddenCountRaw : Number(__hiddenCountRaw);
      return Number.isFinite(n) ? n : 0;
    })();

    return {
      primary: primarySummary,
      secondary: secondarySummaries,
      risks: decorated,
      meta: {
        hasDecisionPack: !!decisionPack,

        // ✅ 변경: "리포트 입력 배열(__viewRisks) 개수"
        riskCount: Array.isArray(__viewRisks) ? __viewRisks.length : 0,

        // (append-only) 디버그/검증용 카운트: legacy vs feed
        riskFeedCount: Array.isArray(__riskFeed) ? __riskFeed.length : 0,
        legacyRiskResultsCount: Array.isArray(__riskResultsLegacy) ? __riskResultsLegacy.length : 0,

        // ✅ 추가: 숨은 리스크 카운트 (0~5 버킷)
        hiddenRiskCount: __hiddenCountNum,
        hiddenRiskLevel: __hidden?.riskLevel ?? null,
        hiddenRiskEngineVersion: __hidden?.engineVersion ?? null,
      },
    };
  }, [decisionPack, __topRiskSource, __viewRisks]);

  // 아직 분석 결과가 없을 때(초기 화면)
  if (!vm?.meta?.hasDecisionPack) {
    return (
      <div className="p-4 rounded-lg border">
        <div className="font-semibold">리포트</div>
        <div className="text-sm text-muted-foreground mt-1">
          아직 분석 결과가 없습니다. 입력 후 ‘분석’ 실행을 해주세요.
        </div>
      </div>
    );
  }

  // 분석은 됐는데 리포트 입력 배열이 비어있는 경우(riskFeed/riskResults 폴백 포함)
  if (!Array.isArray(__viewRisks) || __viewRisks.length === 0) {
    return (
      <div className="p-4 rounded-lg border">
        <div className="font-semibold">리포트</div>
        <div className="text-sm text-muted-foreground mt-1">
          분석 결과(riskFeed/riskResults)가 비어 있습니다. 입력 데이터가 충분한지 확인해 주세요.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg border space-y-4">
      {/* 1) Primary Reject Hypothesis */}
      <div className="rounded-lg border p-3 bg-slate-50">
        <div className="flex items-center justify-between gap-2">
          <div className="font-semibold">최상위 탈락 가설</div>
          {vm.primary ? (
            <span
              className={[
                "text-xs px-2 py-1 rounded-full border",
                defBadgeClass(vm.primary.def),
              ].join(" ")}
              title="면접에서 설득(방어) 가능성의 대략적 난이도"
            >
              {defLabel(vm.primary.def)}
            </span>
          ) : null}
        </div>

        {vm.primary ? (
          <div className="mt-2">
            <div className="text-sm">
              {vm.primary.title || "상위 리스크를 기반으로 한 탈락 가설"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {vm.primary.isGate ? (
                <span className="px-2 py-1 rounded-full border bg-white">Gate</span>
              ) : (
                <span className="px-2 py-1 rounded-full border bg-white">Risk</span>
              )}
              {vm.primary.layer ? (
                <span className="px-2 py-1 rounded-full border bg-white">
                  {vm.primary.layer}
                </span>
              ) : null}
              <span className="px-2 py-1 rounded-full border bg-white">
                priority {safeNum(vm.primary.priority, 0)}
              </span>
              {vm.primary.id ? (
                <span className="px-2 py-1 rounded-full border bg-white">{vm.primary.id}</span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground mt-2">상위 가설을 생성할 데이터가 부족합니다.</div>
        )}
      </div>

      {/* 2) Secondary concerns */}
      <div className="rounded-lg border p-3">
        <div className="font-semibold">보조 우려(2)</div>
        <div className="mt-2 space-y-2">
          {Array.isArray(vm.secondary) && vm.secondary.length > 0 ? (
            vm.secondary.map((x, idx) => (
              <div key={`${x.id || idx}`} className="flex items-start justify-between gap-3">
                <div className="text-sm">
                  <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                  {x.title || "보조 우려"}
                </div>
                <span className={["shrink-0 text-xs px-2 py-1 rounded-full border", defBadgeClass(x.def)].join(" ")}>
                  {defLabel(x.def)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">추가 우려를 생성할 데이터가 부족합니다.</div>
          )}
        </div>
      </div>

      {/* 3) Risk list */}
      <div className="rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">리스크 목록</div>
          <div className="text-xs text-muted-foreground text-right">
            <div>총 {vm.meta.riskCount}개</div>
            <div className="mt-0.5">
              숨은 리스크 {safeNum(vm?.meta?.hiddenRiskCount, 0)}개 감지
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {vm.risks.map((r, idx) => (
            <div key={`${r.id || idx}`} className="rounded-md border p-3 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    {r.title || "(제목 없음)"}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {r.isGate ? (
                      <span className="px-2 py-1 rounded-full border bg-slate-50">Gate</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full border bg-slate-50">Risk</span>
                    )}
                    {r.layer ? (
                      <span className="px-2 py-1 rounded-full border bg-slate-50">
                        {r.layer}
                      </span>
                    ) : null}
                    <span className="px-2 py-1 rounded-full border bg-slate-50">
                      priority {safeNum(r.priority, 0)}
                    </span>
                    {r.id ? (
                      <span className="px-2 py-1 rounded-full border bg-slate-50">
                        {r.id}
                      </span>
                    ) : null}
                  </div>
                </div>

                <span
                  className={[
                    "shrink-0 text-xs px-2 py-1 rounded-full border",
                    defBadgeClass(r.def),
                  ].join(" ")}
                  title="면접에서 설득(방어) 가능성의 대략적 난이도"
                >
                  {r.defLabel}
                </span>
              </div>

              {/* 설명(있으면 노출) */}
              {r.raw?.explain?.why && Array.isArray(r.raw.explain.why) && r.raw.explain.why.length > 0 ? (
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                  {r.raw.explain.why.slice(0, 3).map((w, i) => (
                    <li key={i}>{safeStr(w)}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* 4) 복합 판단 (append-only, interactions 기반, 점수 무영향) */}
      {(() => {
        // fallback 제목 helper
        function __interactionTitle(ix) {
          if (ix?.title) return safeStr(ix.title);
          const id = safeStr(ix?.id ?? "");
          if (id === "IX__EXP_GAP_x_JOB_HOPPING") return "경험 부족 + 잦은 이직";
          if (id === "IX__SALARY_MISMATCH_x_COMPANY_JUMP") return "연봉 미스매치 + 기업규모 점프";
          return "복합 판단";
        }

        // [PATCH] cluster dedup + priority 정렬 + 최대 2개
        const __arr = Array.isArray(decisionPack?.interactions)
          ? decisionPack.interactions
          : [];
        const __byCluster = new Map();
        for (const ix of __arr) {
          const c = ix?.meta?.cluster || "misc";
          if (!__byCluster.has(c)) __byCluster.set(c, ix);
        }
        const __interactions = [...__byCluster.values()]
          .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))
          .slice(0, 2);

        if (__interactions.length === 0) return null;

        return (
          <div className="rounded-lg border p-3">
            <div className="text-xs font-medium text-slate-500 mb-2">복합 판단 — 개별 리스크를 종합해서 보면</div>
            <div className="space-y-3">
              {__interactions.map((ix, idx) => {
                const title = __interactionTitle(ix);
                const why = ix?.explain?.why?.[0] ?? null;
                const __why1 = typeof ix?.explain?.why?.[1] === "string"
                  ? safeStr(ix.explain.why[1]).trim()
                  : null;
                const action = ix?.explain?.action?.[0] ?? null;

                // [PATCH 7/9] evidence snippet — safeStr 정리 후 filter, 최대 3개
                const __signals = Array.isArray(ix?.explain?.signals)
                  ? ix.explain.signals.map((s) => safeStr(s).trim()).filter(Boolean).slice(0, 3)
                  : [];
                const __evidence = Array.isArray(ix?.explain?.evidence)
                  ? ix.explain.evidence.map((e) => safeStr(e).trim()).filter(Boolean).slice(0, 3)
                  : [];

                // [PATCH SPLIT] jdEvidence / resumeEvidence 분리 렌더용
                const __jdEvidence = Array.isArray(ix?.explain?.jdEvidence)
                  ? ix.explain.jdEvidence.map((s) => safeStr(s).trim()).filter(Boolean).slice(0, 3)
                  : [];
                const __resumeEvidence = Array.isArray(ix?.explain?.resumeEvidence)
                  ? ix.explain.resumeEvidence.map((s) => safeStr(s).trim()).filter(Boolean).slice(0, 3)
                  : [];

                return (
                  <div key={safeStr(ix?.id ?? idx)} className="rounded-md border p-3 bg-white">
                    <div className="text-sm font-medium">{title}</div>
                    {why ? (
                      <p className="mt-1 text-sm text-muted-foreground">{why}</p>
                    ) : null}
                    {__why1 ? (
                      <p className="mt-1 text-xs text-slate-400">{__why1}</p>
                    ) : null}
                    {action ? (
                      <p className="mt-1 text-xs text-slate-500">{action}</p>
                    ) : null}
                    {(__jdEvidence.length === 0 && __resumeEvidence.length === 0) ? (
                      __signals.length > 0 ? (
                        <div className="mt-2 text-xs text-slate-400">
                          <span className="font-medium text-slate-500">근거</span>
                          {__signals.map((s, si) => (
                            <span key={si} className="ml-2">{safeStr(s)}</span>
                          ))}
                        </div>
                      ) : __evidence.length > 0 ? (
                        <div className="mt-2 text-xs text-slate-400">
                          <div className="font-medium text-slate-500 mb-0.5">확인된 근거</div>
                          <ul className="list-disc pl-4 space-y-0.5">
                            {__evidence.map((e, ei) => (
                              <li key={ei}>{safeStr(e)}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null
                    ) : null}
                    {(__jdEvidence.length > 0 || __resumeEvidence.length > 0) ? (
                      <div className="mt-2 text-xs text-slate-400 space-y-1">
                        {__jdEvidence.length > 0 ? (
                          <div>
                            <span className="font-medium text-slate-500">JD 요구</span>
                            <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                              {__jdEvidence.map((e, ei) => (
                                <li key={ei}>{safeStr(e)}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {__resumeEvidence.length > 0 ? (
                          <div>
                            <span className="font-medium text-slate-500">이력서 확인</span>
                            <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                              {__resumeEvidence.map((e, ei) => (
                                <li key={ei}>{safeStr(e)}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 5) Leadership 채용 해석 포인트 (append-only, 점수 무영향) */}
      {(() => {
        const lr = props?.analysis?.leadershipRisk ?? props?.leadershipRisk ?? null;
        if (!lr || lr.riskLevel === "none" || !lr.type) return null;

        const mainMsg = {
          leadership_gap: "지원 역할은 리더 경험을 요구하는 방향으로 해석될 수 있어, 실제 리딩 경험 여부를 추가 확인받을 가능성이 있습니다.",
          scope_mismatch: "현재 리더십 수준과 지원 역할 범위 사이에 차이가 있어, 채용 측이 역할 적합성을 추가로 확인할 수 있습니다.",
          overqualified: "현재 리더십 수준 대비 지원 역할이 더 실무 중심으로 보여, 오버스펙 또는 역할 불일치로 해석될 수 있습니다.",
        }[lr.type] ?? null;
        if (!mainMsg) return null;

        const scaleNote = lr.scaleDirection === "upgrade"
          ? " 상향 이동 맥락에서는 일부 완화될 수 있습니다."
          : lr.scaleDirection === "downgrade"
            ? " 하향 이동 맥락에서는 의문이 더 커질 수 있습니다."
            : null;

        return (
          <div className="rounded-lg border p-3 bg-slate-50">
            <div className="text-xs font-medium text-slate-500 mb-1">채용 해석 포인트</div>
            <p className="text-sm text-slate-700">
              {mainMsg}{scaleNote}
            </p>
          </div>
        );
      })()}
    </div>
  );
}
