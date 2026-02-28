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
  const id = getRiskId(x);
  const group = safeLower(x?.group);
  if (id.startsWith("GATE__")) return true;
  if (group === "gate" || group === "gates") return true;
  return false;
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

  const vm = useMemo(() => {
    const sorted = pickTop(__viewRisks);
    const primary = sorted[0] || null;
    const secondary = sorted.slice(1, 3);

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

    const decorated = sorted.map((x) => {
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
  }, [decisionPack, __viewRisks]);

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
    </div>
  );
}