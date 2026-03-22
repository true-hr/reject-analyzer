import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGroupDetailByKey } from "../../lib/passmap/riskGroupSsot.js";

function __txt(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __arr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function __isRawInternalVisibleToken(text) {
  const value = __txt(text);
  if (!value) return false;
  return (
    /^[A-Z]{2,}_[A-Z0-9_]+$/.test(value)
    || /\b(?:must_have_gap|weak_evidence|distant_family|same_family|adjacent_family|sourceFamily|requirementProofRelation|semanticStatus|confidence_low|fallback|generic)\b/i.test(value)
    || /\b(?:IND|JOB|RISK)_[A-Z0-9_]+\b/.test(value)
    || /[a-z]+_[a-z0-9_]+/.test(value)
    || /\b(?:sourceFamily|requirementProofRelation|semanticStatus|familyDistance)\b/.test(value)
    || /(?:^|[\s(])(?:fallback|generic|unknown)(?:$|[\s)])/.test(value)
  );
}

function __visibleSafeKoreanText(text, fallback = "") {
  const value = __txt(text)
    .replace(/[\[\]{}<>]/g, " ")
    .replace(/\b(?:sourceFamily|requirementProofRelation|semanticStatus|familyDistance)\b/gi, " ")
    .replace(/\b(?:fallback|generic|unknown|weak evidence|same family|cross family|continuity issue)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!value) return fallback;
  if (__isRawInternalVisibleToken(value)) return fallback;
  if (!/[가-힣]/.test(value) && !/[.!?]/.test(value)) return fallback;
  return value;
}

// Phase 6 polish: product-facing label helpers
function __sourceFamilyLabel(key) {
  const map = {
    jd_competitiveness: "JD 적합 기반",
    candidate_axis_pack: "후보 축 해석 기반",
    judgment_pack: "판단 묶음 기반",
    interaction_decision: "상호작용 해석 기반",
    "interaction decision": "상호작용 해석 기반",
    top3_canonical: "주요 리스크 기반",
    evidence_fit_meta: "증거 적합 기반",
    career_accumulation: "경력 축적 기반",
    "career accumulation": "경력 축적 기반",
    per_risk_evidence: "리스크 증거 기반",
    section_assemblies: "섹션 분석 기반",
    "section assemblies": "섹션 분석 기반",
    risk_linked_response: "리스크 연계 응답",
    "risk linked response": "리스크 연계 응답",
    "supported risk": "지원 리스크 기반",
    candidate_axis_pack_bridge: "인접 직무 해석 기반",
    fallback: "보조 해석",
    unavailable: "해석 정보 부족",
  };
  return map[key] || "판단 근거";
}
function __visibleSourceLabel(value) {
  const text = __txt(value);
  if (!text) return null;
  if (/[가-힣]/.test(text) && !__isRawInternalVisibleToken(text)) return __visibleSafeKoreanText(text, "판단 근거");
  return __sourceFamilyLabel(text);
}
function __confidenceLabel(key) {
  const map = {
    high: "높음",
    medium: "보통",
    low: "낮음",
    direct: "직접",
    partial: "일부",
    thin: "부족",
    // evidenceState bridge ??raw English evidenceState ?몄텧 李⑤떒
    strong: "높음",
    moderate: "보통",
    supported: "확인됨",
    weak: "약함",
    evidence_supported: "확인됨",
    evidence_weak: "약함",
  };
  return (key && map[key]) || null;
}
function __statusLabel(key) {
  const map = {
    ready: "근거 있음",
    partial: "일부 근거",
    unavailable: "해석 제한",
    supported: "근거 있음",
    weak: "약한 근거",
    sparse: "제한된 근거",
    high_attention: "중점 확인",
    "high attention": "중점 확인",
    moderate_attention: "확인 권장",
    "moderate attention": "확인 권장",
    review_needed: "검토 필요",
    "review needed": "검토 필요",
    provisional: "검토 중",
  };
  return key ? (map[key] || "검토 필요") : null;
}
function __jLabel(key) {
  const map = {
    targetRoleFit: "직무 적합성",
    industryContinuity: "도메인 연속성",
    levelPositionFit: "레벨 포지션",
    evidenceDensity: "증빙 밀도",
    ownershipDepth: "오너십 깊이",
    achievementProof: "성과 증빙",
    toolProof: "도구 증빙",
    transitionReadiness: "전환 준비",
    interviewReadRisk: "면접 리스크",
  };
  return map[key] || "추가 확인";
}
function __riskFamilyLabel(key) {
  const map = {
    must_have_gap: "핵심 역량 부족",
    directness_context: "직무 직접성",
    years_seniority: "경력 연차",
    ownership_scope: "오너십 범위",
    transition_path: "전환 경로",
  };
  return map[key] || "핵심 리스크";
}

// Blocker 2 bridge: type detail payload builder + sheet

function __hasRoleReadSignal(text) {
  const value = __txt(text);
  if (!value) return false;
  return /(역할|직무|포지션|범위|오너십|책임|실무|지원|관리|리드|주도|전환|인접|도메인|연속성|맥락|경력 흐름|축|같은.*군|확장|읽힙니다|읽히는)/.test(value);
}

function __isRiskLikeRoleText(text) {
  const value = __txt(text);
  if (!value) return true;
  return /(JD|요건|증빙|근거 부족|증빙 부족|proof gap|직접 근거|보강이 필요|추가 증명|리스크|검토 포인트|보수적으로|확인되지 않|경영 근거)/i.test(value);
}

function __trimRoleReadClause(text) {
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe) return "";
  const lead = safe
    .split(/(?:다만|하지만|그러나|그래서|따라서)/)[0]
    .replace(/[,;]\s*(JD|요건|증빙|근거|리스크).*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!lead) return "";
  if (__isRawInternalVisibleToken(lead)) return "";
  if (!__hasRoleReadSignal(lead)) return "";
  if (__isRiskLikeRoleText(lead)) return "";
  return /[.!?]$/.test(lead) ? lead : `${lead}.`;
}

function __roleReadTopRiskConnection(topRiskSurface) {
  const structured = topRiskSurface?.structured || {};
  const familyDistance = __txt(structured.familyDistance).toLowerCase();
  const riskFamily = __txt(structured.riskFamily).toLowerCase();
  if (["distant_family", "cross_family", "unrelated_family"].includes(familyDistance)) {
    return "이 역할 읽힘 때문에 목표 역할과의 거리가 현재 우선 리스크 판단에 함께 반영됩니다.";
  }
  if (familyDistance === "adjacent" || riskFamily === "transition_path") {
    return "현재 역할 읽힘이 목표 역할과 인접한 전환으로 해석되면서, 직접성 판단이 함께 보수적으로 붙을 수 있습니다.";
  }
  if (riskFamily === "ownership_scope" || riskFamily === "years_seniority") {
    return "현재 역할 읽힘이 책임 범위와 레벨 해석에 직접 연결되면서 우선 리스크가 형성될 수 있습니다.";
  }
  return null;
}

function __getRoleReadPrimarySurface(surface) {
  if (!surface || typeof surface !== "object") return null;
  const roleReadPrimary = (surface.roleReadPrimary && typeof surface.roleReadPrimary === "object")
    ? surface.roleReadPrimary
    : null;
  if (!roleReadPrimary) return null;
  if (!__txt(roleReadPrimary.posture) && !__txt(roleReadPrimary.context)) return null;
  return {
    status: roleReadPrimary.status || "unavailable",
    sourceFamily: roleReadPrimary.sourceFamily || "fallback",
    label: roleReadPrimary.label || null,
    posture: roleReadPrimary.posture || null,
    context: roleReadPrimary.context || null,
    confidence: roleReadPrimary.confidence || null,
    evidenceStrength: roleReadPrimary.evidenceStrength || null,
    roleReadPrimary,
    roleReadSupport: (surface.roleReadSupport && typeof surface.roleReadSupport === "object")
      ? surface.roleReadSupport
      : { items: [] },
    heroLines: surface.heroLines,
    whyLines: surface.whyLines,
    topRiskSurface: surface.topRiskSurface,
  };
}

function __buildTypeReadDisplayPayload(surface) {
  const roleSurface = __getRoleReadPrimarySurface(surface);
  if (!roleSurface) return null;
  const topRiskSurface = (roleSurface.topRiskSurface && typeof roleSurface.topRiskSurface === "object") ? roleSurface.topRiskSurface : null;
  const heroLines = __arr(roleSurface.heroLines).map(__txt).filter(Boolean);
  const whyLines = __arr(roleSurface.whyLines).map(__txt).filter(Boolean);
  const overlapLines = [...heroLines, ...whyLines];
  const roleSupportItems = __arr(roleSurface.roleReadSupport?.items)
    .filter((item) => item && typeof item === "object");
  const candidates = [
    __txt(roleSurface.context),
    __txt(roleSurface.posture),
    ...roleSupportItems.flatMap((item) => [__txt(item.context), __txt(item.posture)]),
  ].filter(Boolean);

  const headline = candidates
    .map(__trimRoleReadClause)
    .find((text) => text && !__isMostlyDuplicateOfLines(text, overlapLines)) || null;

  const summary = candidates
    .map((text) => __visibleConsumerTextOrEmpty(text))
    .filter(Boolean)
    .filter((text) => __hasRoleReadSignal(text))
    .filter((text) => !__isRiskLikeRoleText(text))
    .filter((text) => !__isMostlyDuplicateOfLines(text, overlapLines))
    .find((text) => !headline || !__isNearDuplicateText(text, headline)) || null;

  const context = [
    ...roleSupportItems.flatMap((item) => [__txt(item.context), __txt(item.posture)]),
    __roleReadTopRiskConnection(topRiskSurface),
  ]
    .map((text) => __visibleConsumerTextOrEmpty(text))
    .filter(Boolean)
    .filter((text) => __hasRoleReadSignal(text) || /우선 리스크 판단|직접성 판단|책임 범위|레벨 해석/.test(text))
    .filter((text) => !__isRiskLikeRoleText(text) || /우선 리스크 판단|직접성 판단|책임 범위|레벨 해석/.test(text))
    .find((text) => !headline || !__isNearDuplicateText(text, headline)) || null;

  const sourceLabel = (roleSurface.sourceFamily && roleSurface.sourceFamily !== "fallback" && roleSurface.sourceFamily !== "unavailable")
    ? __visibleSourceLabel(__txt(roleSurface.sourceFamily))
    : null;

  if (!headline || !summary) return null;
  return { title: headline, summary, context, caution: null, sourceLabel };
}

function __buildTypeDetailPayload(surface) {
  return __buildTypeReadDisplayPayload(surface);
}

function TypeDetailSheet({ payload, onClose }) {
  if (!payload) return null;
  const { title, summary, context, caution, sourceLabel } = payload;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-auto flex min-h-full w-full items-center justify-center px-4 py-4 sm:py-8">
        <div className="mx-auto w-[min(720px,92vw)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-4">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">판단 상세 정보</div>
                {title ? <div className="mt-1 text-lg font-semibold text-slate-900">{title}</div> : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {summary ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-slate-500">해석 요약</div>
                  <div className="mt-1 text-sm leading-6 text-slate-800">{summary}</div>
                </div>
              ) : null}
              {context ? (
                <div className="rounded-xl border border-slate-200 bg-white/60">
                  <div className="border-b border-slate-200/70 px-4 py-2.5 text-sm font-semibold text-slate-900">이렇게 보이는 이유</div>
                  <div className="px-4 py-3 text-sm leading-6 text-slate-700">{context}</div>
                </div>
              ) : null}
              {caution ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-amber-700">보완하면 좋아지는 점</div>
                  <div className="mt-1 text-sm leading-6 text-slate-800">{caution}</div>
                </div>
              ) : null}
              {sourceLabel ? (
                <div className="text-xs text-slate-400">출처: {sourceLabel}</div>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Blocker 1 bridge: per-risk deep-dive helpers + components

function __toLines(v) {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((x) => __txt(x)).filter(Boolean);
  if (typeof v === "string") return [v.trim()].filter(Boolean);
  return [];
}

function __dedupLines(arr) {
  const seen = new Set();
  return arr.filter((s) => {
    const k = __txt(s);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function __buildRiskDetailPayload(risk) {
  if (!risk || typeof risk !== "object") return null;
  if (!risk?.canonicalCard) {
    const title = __txt(risk.label || risk.headline || risk.title || "핵심 리스크");
    const mind = __txt(risk.posture || risk.summary || __toLines(risk.detailBody)[0]) || null;
    const reasons = __dedupLines([
      ...__toLines(risk.whyThisRiskItems),
      ...__toLines(risk.reasonLines),
    ]).slice(0, 3);
    const questions = __dedupLines(__toLines(risk.evidenceLines)).slice(0, 3);
    const fixes = __dedupLines([
      __txt(risk.reviewSuggestion),
      ...__toLines(risk.detailBody),
    ]).slice(0, 3);
    const sourceLabel = __txt(risk.sourceFamilyLabel || risk.sourceLabel) || null;
    const confidenceLabel = __txt(risk.confidenceLabel || risk.strengthLabel) || null;
    return {
      title,
      mind,
      reasons,
      questions,
      fixes,
      signalLabel: sourceLabel,
      signalSummary: confidenceLabel,
      jdNeedLine: null,
      resumeGapLine: null,
    };
  }
  const rawId = __txt(risk.id || risk.rawId || risk.code || "");
  const canonicalCard = (risk.canonicalCard && typeof risk.canonicalCard === "object") ? risk.canonicalCard : null;
  const explain = (risk.explain && typeof risk.explain === "object") ? risk.explain : {};
  const ivNote = (explain.interviewerNote && typeof explain.interviewerNote === "object") ? explain.interviewerNote : null;
  const groupDetail = rawId ? getGroupDetailByKey(rawId) : null;

  const title = __txt(groupDetail?.title || canonicalCard?.headline || risk.title || risk.label || "핵심 리스크");

  const mind = __txt(canonicalCard?.summary)
    || __txt(ivNote?.oneLiner)
    || __txt(__toLines(explain.why)[0])
    || null;

  const reasons = __dedupLines([
    __txt(canonicalCard?.supportingEvidence),
    ...__toLines(ivNote?.reasons || ivNote?.concerns),
    ...__toLines(explain.why),
    ...__toLines(groupDetail?.reasons),
  ]).slice(0, 3);

  const questions = __dedupLines([
    ...__toLines(ivNote?.questions),
    ...__toLines(groupDetail?.questions),
  ]).slice(0, 3);

  const fixes = __dedupLines([
    ...__toLines(explain.action),
    ...__toLines(ivNote?.fixes),
    ...__toLines(groupDetail?.fixes),
  ]).slice(0, 3);

  const signalLabel = __txt(risk.signalLabel) || __txt(canonicalCard?.signalLabel) || null;
  const signalSummary = __txt(canonicalCard?.summary) || __txt(risk.summary) || null;

  const jdNeedLine = __txt(__toLines(explain.jdEvidence)[0]) || __txt(groupDetail?.jdNeedLine) || null;
  const resumeGapLine = __txt(__toLines(explain.resumeEvidence)[0]) || __txt(groupDetail?.resumeGapLine) || null;

  return { title, mind, reasons, questions, fixes, signalLabel, signalSummary, jdNeedLine, resumeGapLine };
}

function RiskDetailSheet({ payload, onClose }) {
  if (!payload) return null;
  const { title, mind, reasons, questions, fixes, jdNeedLine, resumeGapLine, signalLabel, signalSummary } = payload;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative mx-auto flex min-h-full w-full items-center justify-center px-4 py-4 sm:py-8">
        <div className="mx-auto w-[min(720px,92vw)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-4">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">리스크 상세</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{title}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {mind ? (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-amber-700">핵심 해석</div>
                  <div className="mt-1 text-sm leading-6 text-slate-900">{mind}</div>
                </div>
              ) : null}
              {reasons.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white/60">
                  <div className="border-b border-slate-200/70 px-4 py-2.5 text-sm font-semibold text-slate-900">왜 이런 신호로 보이는지</div>
                  <ul className="px-4 py-3 space-y-2">
                    {reasons.map((r, i) => (
                      <li key={i} className="flex gap-2.5 text-sm leading-5 text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {questions.length > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white/60">
                  <div className="border-b border-slate-200/70 px-4 py-2.5 text-sm font-semibold text-slate-900">면접에서 확인될 수 있는 질문</div>
                  <ul className="px-4 py-3 space-y-2">
                    {questions.map((q, i) => (
                      <li key={i} className="flex gap-2.5 text-sm leading-5 text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {fixes.length > 0 ? (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
                  <div className="text-[11px] font-semibold tracking-wide text-indigo-700">보완 포인트</div>
                  <ul className="mt-2 space-y-2">
                    {fixes.map((f, i) => (
                      <li key={i} className="flex gap-2.5 text-sm leading-5 text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(jdNeedLine || resumeGapLine) ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {jdNeedLine ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-[11px] font-semibold text-slate-500">JD에서 보이는 포인트</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">{jdNeedLine}</div>
                    </div>
                  ) : null}
                  {resumeGapLine ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="text-[11px] font-semibold text-slate-500">이력서에서 확인되는 포인트</div>
                      <div className="mt-1 text-xs leading-5 text-slate-600">{resumeGapLine}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {(signalLabel || signalSummary) ? (
                <div className="flex flex-wrap gap-2">
                  {signalLabel ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {signalLabel}
                    </span>
                  ) : null}
                  {signalSummary ? (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {signalSummary}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function __canRenderSurface(surface) {
  if (!surface || typeof surface !== "object") return false;
  const status = __txt(surface.status);
  return status !== "hidden";
}

function __surfaceTone(status) {
  if (status === "available" || status === "ready") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "partial") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function __surfaceBodyTone(status) {
  if (status === "partial") return "border-amber-200 bg-amber-50/60";
  if (status === "unavailable") return "border-dashed border-slate-200 bg-slate-50";
  return "border-slate-200 bg-slate-50";
}

function SurfaceShell({ title, surface, children, hero = false }) {
  if (!__canRenderSurface(surface)) return null;
  const status = __txt(surface?.status) || "unavailable";
  const sourceFamily = __txt(surface?.sourceFamily) || "unavailable";
  const unavailableReason = __txt(surface?.unavailableReason);
  const partialReason = __txt(surface?.hiddenReason) || __txt(surface?.unavailableReason);
  // Slice C retry: final full-hide guard ??body-aware, title alone is not sufficient chrome
  const __subtitleWillShow = !!(sourceFamily && sourceFamily !== "unavailable");
  const __badgeWillShow = !!__statusLabel(status);
  const __unavailableBodyWillShow = status === "unavailable"; // Slice A always provides fallback body
  if (!__subtitleWillShow && !__badgeWillShow && !__unavailableBodyWillShow) return null;
  // Phase 14: hide section shell when non-unavailable surface has no meaningful children
  if (status !== "unavailable" && (children === null || children === undefined)) return null;

  return (
    <Card className={`rounded-2xl border bg-white/80 shadow-sm backdrop-blur ${hero ? "border-violet-200/80 shadow-md" : ""}`}>
      <CardHeader className={hero ? "pb-4" : "pb-3"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className={hero ? "text-lg text-slate-900" : "text-base text-slate-900"}>{title}</CardTitle>
            {sourceFamily && sourceFamily !== "unavailable" ? (
              <div className="mt-1 text-xs text-slate-500">{__sourceFamilyLabel(sourceFamily)}</div>
            ) : null}
          </div>
          {(__statusLabel(status) && __statusLabel(status) !== "근거 있음") ? (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${__surfaceTone(status)}`}>
              {__statusLabel(status)}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {status === "unavailable" ? (
          <div className={`rounded-xl border px-4 py-3 text-sm text-slate-600 ${__surfaceBodyTone(status)}`}>
            {(unavailableReason && !/^[a-z_]+$/.test(unavailableReason) && !unavailableReason.startsWith("report_v2"))
              ? unavailableReason
              : "현재 이 항목에 대한 직접 근거가 충분히 확인되지 않습니다."}
          </div>
        ) : (
          <div className="space-y-3">
            {status === "partial" && partialReason ? (
              <div className={`rounded-xl border px-4 py-3 text-xs text-slate-600 ${__surfaceBodyTone(status)}`}>
                보완 필요: {partialReason}
              </div>
            ) : null}
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Phase 14 Slice 7: Cross-surface dedupe helpers (pure, consumer-only)
function __normDedupeText(text) {
  if (text == null) return "";
  return String(text)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^(현재|다소|아직|추가로)\s+/g, "")
    .replace(/[.!?。]+$/g, "")
    .toLowerCase();
}
function __isNearDuplicateText(a, b) {
  const na = __normDedupeText(a);
  const nb = __normDedupeText(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  if (shorter.length >= 12 && longer.includes(shorter)) return true;
  if (na.length >= 16 && nb.length >= 16 && Math.abs(na.length - nb.length) <= 12 && na.slice(0, 16) === nb.slice(0, 16)) return true;
  return false;
}
function __dedupeOrderedItems(items, seenTexts) {
  const accepted = [];
  const seen = Array.isArray(seenTexts) ? [...seenTexts] : [];
  for (const item of items) {
    const t = __normDedupeText(item.__dedupeText);
    if (!t) { accepted.push(item); continue; }
    const isDup = seen.some((s) => __isNearDuplicateText(t, s));
    if (!isDup) { accepted.push(item); seen.push(t); }
  }
  return accepted;
}
function __collectVisibleText(item, resolver) {
  if (!item) return "";
  const copy = resolver(item);
  return __normDedupeText(copy?.text) || "";
}
function __normalizeUsefulnessText(text) {
  return __normDedupeText(text)
    .replace(/[,:;()[\]'"`]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/(필요가 있습니다|필요합니다|남을 수 있습니다|해석될 수 있습니다|보입니다|읽힙니다)$/g, "")
    .trim();
}
function __hasSpecificSurfaceSignal(text) {
  return /jd|직무|역할|요건|성과|수치|범위|책임|오너십|도메인|전환|경력|축|맥락|연속성|면접|프로젝트|사례|경험|이력서|bullet|증빙|근거|resume|scope|ownership|domain|transition/i.test(__txt(text));
}
function __isWeakGenericRemnantText(text) {
  const value = __txt(text);
  if (!value) return true;
  const normalized = __normalizeUsefulnessText(value);
  if (!normalized) return true;
  if (__hasSpecificSurfaceSignal(value) && value.length >= 20) return false;
  return /더 구체화|근거를 보강|연결성을 더 보여|조금 더 선명|보완이 필요|설명이 필요|추가 확인 포인트|검토 포인트|직접 근거가 아직 제한적|직접 근거가 충분히 확인되지 않|추가 근거가 필요|보수적으로 판단/.test(normalized);
}
function __isMostlyDuplicateOfLines(text, lines = []) {
  const value = __txt(text);
  if (!value) return false;
  return __arr(lines).some((line) => __isNearDuplicateText(value, line));
}
function __hasRequirementProofRelation(row) {
  const jd = __txt(row?.jdExpects);
  const resume = __txt(row?.resumeShows);
  const note = __txt(row?.note);
  if (jd && jd !== "-" && resume && resume !== "-") return true;
  return /jd|요건|직접 비교|근거|증빙|사례|수치|성과|범위|책임|resume|proof|evidence/i.test(note);
}
function __isWeakCareerContextText(text) {
  const value = __txt(text);
  if (!value) return true;
  if (__isWeakGenericRemnantText(value)) return true;
  return /(자연스럽게 이어집니다|확장 가능합니다|활용 가능합니다|연결될 수 있습니다|경험이 도움이 됩니다|기반이 있습니다)/.test(value)
    && !/(직무|역할|도메인|전환|연속성|경력|포지션|시니어리티|축|맥락|인접|adjacent|same-family|cross-family)/.test(value);
}
function __hasMaterialCareerSignal(text) {
  return /(직무|역할|도메인|전환|연속성|경력|포지션|시니어리티|축|맥락|인접|adjacent|same-family|cross-family|resume|target)/i.test(__txt(text));
}
function __shouldHideCareerContext(text, overlapLines = []) {
  const value = __txt(text);
  if (!value) return true;
  let score = 0;
  if (__hasMaterialCareerSignal(value)) score += 1;
  if (value.length >= 28 && !__isWeakCareerContextText(value)) score += 1;
  if (!__isMostlyDuplicateOfLines(value, overlapLines)) score += 1;
  if (!__isWeakCareerContextText(value)) score += 1;
  return score < 2;
}
function __isRoleReadLikeText(text) {
  const value = __txt(text);
  if (!value) return false;
  return /(역할 판단|역할 방향|직무 정렬|직무 적합|목표 역할 수행 경험|인접 역할 확장|레벨 신호|포지션|후보자|후보군|오너십|전환 준비도|읽히는 역할)/.test(value);
}
function __hasTrajectoryBackgroundSignal(text) {
  const value = __txt(text);
  if (!value) return false;
  return /(경력 맥락|경력 흐름|커리어 흐름|커리어 맥락|연속성|이전 경험|누적|축적|전환 맥락|이동 경로|이어진|이어져|배경)/.test(value);
}
function __isOriginCausalText(text) {
  const value = __txt(text);
  if (!value) return false;
  if (__isRawInternalVisibleToken(value)) return false;
  return /(직접 근거|증빙|요건|JD|범위|책임|부족|얇|약하|모이지 않아|붙지 않아|보수적으로|도메인 직접성|가장 먼저 읽혀|리스크 축|확인되지 않아|지지하는 근거)/i.test(value);
}
function __shouldHideHeroSupportText(text) {
  const value = __visibleSafeKoreanText(text, "");
  if (!value) return true;
  if (__isGenericConsumerShell(value)) return true;
  if (__isRoleReadLikeText(value)) return true;
  if (__hasTrajectoryBackgroundSignal(value)) return true;
  if (__isActionOnlyText(value)) return true;
  return false;
}
function __shouldHideRoleSectionText(text, heroLines = [], whyLines = []) {
  const value = __visibleConsumerTextOrEmpty(text);
  if (!value) return true;
  if (__isMostlyDuplicateOfLines(value, heroLines)) return true;
  if (__isMostlyDuplicateOfLines(value, whyLines)) return true;
  if (__hasTrajectoryBackgroundSignal(value)) return true;
  if (__isActionOnlyText(value)) return true;
  return false;
}
function __sanitizeOriginVisibleText(text, heroLines = []) {
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe) return "";
  if (__isRawInternalVisibleToken(safe)) return "";
  if (__isReviewCheckOnlyText(safe)) return "";
  if (!__isOriginCausalText(safe)) return "";
  if (__isMostlyDuplicateOfLines(safe, heroLines)) return "";
  return safe;
}
function __isGenericActionText(text) {
  const value = __txt(text);
  if (!value) return true;
  return /(강조하세요|보완하세요|구체화하세요|연결하세요|어필하세요|준비하세요|정리하세요|설명하세요)/.test(value)
    && !/(이력서|경력기술서|bullet|상단|본문|면접|답변|한 줄|수치|사례|프로젝트|범위|책임|JD|직무)/i.test(value);
}
function __isGenericConsumerShell(text) {
  const value = __visibleSafeKoreanText(text, "");
  if (!value) return true;
  return /(현재 경험은 확장 가능성이 있습니다|지금까지의 경험은 다음 단계와 연결될 수 있습니다|방향성은 나쁘지 않지만 조금 더 또렷해질 필요가 있습니다|현재 문서 기준으로는 추가 검토가 필요합니다|자연스럽게 이어집니다|확장 가능합니다|활용 가능합니다|연결될 수 있습니다|경험이 도움이 됩니다|기반이 있습니다)/.test(value)
    && !/(인접 역할 확장|목표 역할 수행 경험|직무 전환 맥락|연차|책임 범위 차이|JD와의 직접 연결|성과 근거|요건 증빙|도메인 직접성)/.test(value);
}
function __hasMaterialConsumerGrounding(text, options = {}) {
  const value = __visibleSafeKoreanText(text, "");
  if (!value) return false;
  if (__isRawInternalVisibleToken(value)) return false;
  const hasRoleDirection = /(인접 역할 확장|목표 역할 수행 경험|직무 전환 맥락|연차|책임 범위 차이|JD와의 직접 연결|도메인 직접성|역할 방향|직무 정렬|전환 준비도|레벨 신호|오너십|성과 근거|요건 증빙)/.test(value);
  const hasSpecificKorean = /[가-힣]/.test(value) && value.length >= (options.minLength || 14);
  return hasRoleDirection || (hasSpecificKorean && !__isGenericConsumerShell(value));
}
function __visibleConsumerTextOrEmpty(text) {
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe) return "";
  if (__isRawInternalVisibleToken(safe)) return "";
  if (__isGenericConsumerShell(safe)) return "";
  if (!__hasMaterialConsumerGrounding(safe)) return "";
  return safe;
}
// Phase 14-14: detect action-instruction text (coaching verbs) — used to gate Why body selection
function __isActionOnlyText(text) {
  const value = __txt(text);
  if (!value) return false;
  return /(추가하세요|보완하세요|구체화하세요|명시하세요|정리하세요|수치화하세요|사례화하세요|준비하세요|작성하세요|보강하세요|강조하세요|연결하세요|추가해|보완해|구체화해|명시해|수치화해)/.test(value);
}
function __hasActionConversionShape(text) {
  const value = __txt(text);
  if (!value) return 0;
  let score = 0;
  if (/(오너십|성과|근거|수치|bullet|경력기술서|이력서|경험|사례|프로젝트|직무|JD|면접 답변|범위|책임)/i.test(value)) score += 1;
  if (/(이력서|경력기술서|상단|본문|bullet|요약|프로필|면접|답변|첫 문장|항목|헤드라인)/i.test(value)) score += 1;
  if (/(한 줄|먼저 배치|바꾸|분리|정리|압축|추가|명확히|수치화|구조로|문장으로|보여주|설명하)/.test(value)) score += 1;
  return score;
}
function __isMaterialActionText(text) {
  const value = __txt(text);
  if (!value || value.length < 12) return false;
  if (__isWeakGenericRemnantText(value)) return false;
  if (__isGenericActionText(value)) return false;
  if (__hasActionConversionShape(value) < 2) return false;
  // Phase 14-14: reject Why-like text scoring 2 by incidental word match — require directive verb
  return /(하세요|해야|해보|할 필요|추가하|명시하|구체화하|수치화하|정리하|보강하|작성하|사례화|답변|준비하|어필하|강조하|연결하)/.test(value);
}
function __isWeakSecondaryRiskCandidate(risk, mode, topReadingVisiblePool = []) {
  const copy = __resolveTopRiskCardCopy(risk, mode);
  const title = __txt(copy.title);
  const summary = __txt(copy.summary);
  if (!title || !summary) return true;
  if (__isWeakGenericRemnantText(summary)) return true;
  if (!__hasSpecificSurfaceSignal(`${title} ${summary}`)) return true;
  if (__isMostlyDuplicateOfLines(summary, topReadingVisiblePool)) return true;
  return false;
}
function __isMeaningfullyDistinctRisk(risk, primaryRisk, mode) {
  if (!primaryRisk) return true;
  const current = __resolveTopRiskCardCopy(risk, mode);
  const primary = __resolveTopRiskCardCopy(primaryRisk, mode);
  const currentFamily = __txt(risk?.riskFamily);
  const primaryFamily = __txt(primaryRisk?.riskFamily);
  if (currentFamily && primaryFamily && currentFamily === primaryFamily) return false;
  if (__isNearDuplicateText(current.title, primary.title)) return false;
  if (__isNearDuplicateText(current.summary, primary.summary)) return false;
  const __isProofGapVariant = (text) => /근거|증빙|보강|직접 연결|proof|evidence/i.test(__txt(text)) && !/(도메인|전환|시니어리티|연차|범위|오너십|면접|직무|역할)/i.test(__txt(text));
  if (__isProofGapVariant(current.summary) && __isProofGapVariant(primary.summary)) return false;
  return true;
}
function __normalizeVisibleTone(text, status) {
  const st = __txt(status);
  if (!text || !st) return text;
  const cautious =
    st === "weak_evidence" ||
    st === "partial" ||
    st === "provisional" ||
    st === "disputed" ||
    st === "review_needed" ||
    st === "review needed" ||
    st === "overridden";
  if (!cautious) return text;
  if (!/분명합니다|명확합니다|확실합니다|강하게 시사합니다|확정/.test(String(text))) return text;
  if (st === "disputed" || st === "review_needed" || st === "review needed") {
    return "서로 다른 신호가 엇갈려 추가 확인이 필요합니다.";
  }
  if (st === "overridden") {
    return "이전 정보와 실제 신호 간 이유 차이가 있어 예외 처리로 판단됩니다.";
  }
  return "직접 근거가 충분히 확인되지 않아 보수적으로 판단됩니다.";
}
function __isWeakEvidenceStrength(value) {
  const v = __txt(value).toLowerCase();
  return v === "weak" || v === "noise";
}
function __applyEvidenceStrengthTone(text, evidenceStrength) {
  const value = __txt(text);
  if (!value) return value;
  if (__txt(evidenceStrength).toLowerCase() === "medium") {
    if (/분명합니다|명확합니다|확실합니다|강하게 시사합니다|확정|가장 먼저 검토됩니다|유력하게 보입니다|먼저 보입니다|먼저 읽힙니다/.test(value)) {
      return "현재 문서 기준으로는 우선 검토 후보로 읽힐 가능성이 있습니다.";
    }
    return value;
  }
  if (!__isWeakEvidenceStrength(evidenceStrength)) return value;
  if (/다만|하지만|직접 근거|추가 근거|보수적으로|제한적|아직/.test(value)) return value;
  if (/분명합니다|명확합니다|확실합니다|강하게 시사합니다|확정|가장 먼저 검토됩니다|유력하게 보입니다|먼저 보입니다|먼저 읽힙니다/.test(value)) {
    return "직접 근거가 아직 제한적이어서 보수적으로 해석하는 편이 안전합니다.";
  }
  if (/(적합|잘 맞|강점이 분명|유리하|충분히|또렷하)/.test(value)) {
    return `${value} 다만 직접 근거는 아직 제한적입니다.`;
  }
  return value;
}
function __isCautiousRiskStatus(status) {
  const st = __txt(status);
  return st === "weak_evidence" || st === "partial" || st === "provisional" || st === "disputed" || st === "review_needed" || st === "review needed" || st === "overridden";
}
function __applyContradictionGuard(text, riskStatus) {
  const value = __txt(text);
  if (!value) return value;
  if (!__isCautiousRiskStatus(riskStatus)) return value;
  if (/다만|하지만|직접 근거|추가 근거|보수적으로|제한적|아직/.test(value)) return value;
  if (/(이어지|연결되|접점은 보이|자연스럽게|연속성|흐름상)/.test(value)) {
    return `${value} 다만 현재 JD 기준의 직접 근거는 더 필요합니다.`;
  }
  if (/(적합|잘 맞|강점이 분명|유리하)/.test(value)) {
    return "배경상 연결점은 보이지만, 현재 JD 기준의 직접 근거는 더 필요합니다.";
  }
  return value;
}
function __getOwnershipBucket(text) {
  if (!text) return "proof";
  const t = String(text).trim().replace(/\s+/g, " ");
  if (/보완|정리|추가|강화|준비|개선|권장|추천|필요/.test(t)) return "action";
  if (/경력 흐름|이어지|전환|브릿지|이전 경험|커리어 이동|경력 방향/.test(t)) return "flow";
  if (/candidate|posture|context|role read|인상|포지셔닝/.test(t)) return "type";
  return "proof";
}
// Phase 14 Slice 9: copy mode rewrite helpers (pure, consumer-only)
function __rewriteByCopyMode(text, mode) {
  if (!text || typeof text !== "string") return text;
  return text;
}
function __applyCopyModeToView(view, mode) {
  if (!view) return view;
  const rewriteItem = (item) => {
    if (!item) return item;
    const orig = __txt(item.text);
    const rewritten = __rewriteByCopyMode(orig, mode);
    return rewritten !== orig ? { ...item, text: rewritten } : item;
  };
  if (Array.isArray(view.strengths) || Array.isArray(view.missing)) {
    return {
      ...view,
      strengths: __arr(view.strengths).map(rewriteItem),
      missing: __arr(view.missing).map(rewriteItem),
    };
  }
  return {
    ...view,
    primary: rewriteItem(view.primary),
    secondary: __arr(view.secondary).map(rewriteItem),
  };
}

// Phase 14 Slice 1: Personalization mode detection (pure, consumer-only)
function __derivePersonalizationMode(reportV2, top3) {
  const trStructured = reportV2?.topRiskRead?.structured || {};
  const typeReadV2 = reportV2?.typeReadV2 || {};
  const proofMissing = Array.isArray(reportV2?.proofSummaryV2?.missing) ? reportV2.proofSummaryV2.missing : [];
  const proofStrengths = Array.isArray(reportV2?.proofSummaryV2?.strengths) ? reportV2.proofSummaryV2.strengths : [];
  const attentionLevel = __txt(trStructured.attentionLevel);
  const riskFamily = __txt(trStructured.riskFamily);
  const typeConf = __txt(typeReadV2.confidence);
  const typeStatus = __txt(typeReadV2.status);
  const hasMissingTargetRoleFit = proofMissing.some((m) => m?.judgment === "targetRoleFit");
  // Mode D (highest priority)
  if (
    attentionLevel === "high_attention" &&
    riskFamily === "must_have_gap" &&
    proofMissing.length >= 2 &&
    typeConf !== "high"
  ) return "mode_d";
  // Mode B
  if (
    typeStatus !== "unavailable" &&
    (typeConf === "low" || (typeConf === "medium" && hasMissingTargetRoleFit)) &&
    hasMissingTargetRoleFit
  ) return "mode_b";
  // Mode A
  if (
    (typeConf === "high" || (typeConf === "medium" && proofStrengths.length >= 2)) &&
    !hasMissingTargetRoleFit &&
    riskFamily !== "must_have_gap" &&
    attentionLevel !== "high_attention"
  ) return "mode_a";
  // Mode C (fallback)
  return "mode_c";
}

function __firstSentence(value) {
  const text = __txt(value);
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.split(/[.!?]/)[0]?.trim() || normalized;
}

function __isGenericTopReadingLabel(value) {
  const text = __txt(value).replace(/\s+/g, " ").trim();
  if (!text) return false;
  return [
    "직무 적합성",
    "도메인 연속성",
    "레벨 포지션 적합성",
    "전환 준비 상태",
    "증빙 밀도",
    "오너십 깊이",
    "도메인 직접성 확인 리스크",
    "협업·전사 범위 증빙 리스크",
    "재무기획 직접 수행 증빙 리스크",
    "JD 핵심 요건 증빙 리스크",
    "우선 확인될 가능성이 높은 리스크 축",
  ].includes(text) || /혼재|분산|혼합/.test(text);
}

function __pickReadableLead(candidates, options = {}) {
  const { allowGeneric = false } = options;
  for (const candidate of Array.isArray(candidates) ? candidates : []) {
    const text = __firstSentence(candidate);
    if (!text) continue;
    if (/^[a-z_]+$/i.test(text) || text.startsWith("report_v2")) continue;
    if (!allowGeneric && __isGenericTopReadingLabel(text)) continue;
    return text;
  }
  return null;
}

// Phase 14 Slice 1: Top Reading slot resolver (pure, consumer-only)
function __resolveTopReadingSlots(reportV2, top3, mode) {
  const trStructured = reportV2?.topRiskRead?.structured || {};
  const trText = reportV2?.topRiskRead?.text || {};
  const typeReadV2 = reportV2?.typeReadV2 || {};
  const proofMissing = Array.isArray(reportV2?.proofSummaryV2?.missing) ? reportV2.proofSummaryV2.missing : [];
  const safeTop3 = Array.isArray(top3) ? top3 : [];
  const __isHR = (s) => !!s && !/^[a-z_]+$/.test(s) && !s.startsWith("report_v2");
  const __safe = (primary, fallback) => {
    const p = __txt(primary);
    if (__isHR(p)) return p;
    const f = __txt(fallback);
    return __isHR(f) ? f : null;
  };
  const targetRoleFitItem = proofMissing.find((m) => m?.judgment === "targetRoleFit");
  const top0Card = safeTop3[0]?.canonicalCard || {};
  const headlineSpecific = __pickReadableLead([
    typeReadV2.context,
    typeReadV2.posture,
    trStructured.postureSummary,
    trText.posture,
    targetRoleFitItem?.text,
    top0Card.summary,
  ]);
  const headlineFallback = __pickReadableLead([
    trStructured.headline,
    trText.headline,
    typeReadV2.label,
    top0Card.headline,
  ], { allowGeneric: true });
  const postureSpecific = __pickReadableLead([
    typeReadV2.context,
    typeReadV2.posture,
    trStructured.postureSummary,
    trText.posture,
    targetRoleFitItem?.text,
    top0Card.summary,
  ], { allowGeneric: true });
  const __isTooGeneric = (s) => typeof s === "string" && /다양한 경험|직접 경험|유사한 경험|영역 경험/.test(s);
  if (mode === "mode_a") {
    return {
      headline: headlineSpecific || __safe(trStructured.headline, trText.headline) || headlineFallback,
      posture: postureSpecific || __safe(typeReadV2.posture, trStructured.postureSummary),
    };
  }
  if (mode === "mode_b") {
    const labelPart = __isHR(__txt(typeReadV2.label)) ? __txt(typeReadV2.label) : null;
    const headlinePart = __isHR(__txt(trStructured.headline)) ? __txt(trStructured.headline) : null;
    let headline = null;
    if (labelPart && headlinePart) headline = `${labelPart} · ${headlinePart}`;
    else headline = labelPart || headlinePart || __safe(trText.headline, null);
    const postureRaw = __safe(typeReadV2.posture, targetRoleFitItem?.text);
    const posture = (__isTooGeneric(postureRaw)
      ? (__isHR(__txt(targetRoleFitItem?.text)) ? __txt(targetRoleFitItem.text) : null)
      : postureRaw);
    return {
      headline: headlineSpecific || __safe(trStructured.headline, trText.headline) || headline || headlineFallback,
      posture: postureSpecific || posture,
    };
  }
  if (mode === "mode_c") {
    const labelPart = __isHR(__txt(typeReadV2.label)) ? __txt(typeReadV2.label) : null;
    const headlineFallback = labelPart ? `${labelPart} 현황/전환` : null;
    return {
      headline: headlineSpecific || __safe(trStructured.headline, trText.headline) || headlineFallback,
      posture: postureSpecific || __safe(typeReadV2.context, trStructured.postureSummary),
    };
  }
  if (mode === "mode_d") {
    return {
      headline: headlineSpecific || __safe(trStructured.headline, top0Card.headline) || headlineFallback,
      posture: postureSpecific || __safe(trStructured.postureSummary, top0Card.summary),
    };
  }
  return {
    headline: headlineSpecific || headlineFallback || null,
    posture: postureSpecific || null,
  };
}

// Phase 14 Slice 2: Top Risks order resolver (pure, consumer-only)
function __resolveTopRiskOrder(reportV2, top3, mode) {
  const arr = top3.slice(0, 3);
  if (arr.length <= 1) return arr;
  const __riskId = (r) => __txt(r?.id || r?.rawId || r?.code || "").toLowerCase();
  if (mode === "mode_b") {
    const __isBRelevant = (r) => {
      const id = __riskId(r);
      return id.includes("targetrolefit") || id.includes("semanticsimilarity") || id.includes("roleread") || id.includes("role_fit");
    };
    return [...arr.filter(__isBRelevant), ...arr.filter((r) => !__isBRelevant(r))];
  }
  if (mode === "mode_c") {
    const __isCRelevant = (r) => {
      const id = __riskId(r);
      return id.includes("clarity") || id.includes("consistency") || id.includes("structure") || id.includes("content");
    };
    return [...arr.filter(__isCRelevant), ...arr.filter((r) => !__isCRelevant(r))];
  }
  // mode_a and mode_d: preserve existing order
  return arr;
}

// Phase 14 Slice 2: Top Risk card copy resolver (pure, consumer-only)
function __resolveTopRiskCardCopy(risk, mode) {
  if (risk && !risk?.canonicalCard) {
    return {
      title: __txt(risk?.label || risk?.headline || risk?.title || risk?.id || "주요 리스크"),
      summary: __txt(risk?.summary || risk?.posture || __toLines(risk?.reasonLines)[0] || risk?.reviewSuggestion || ""),
    };
  }
  const canonicalCard = risk?.canonicalCard || {};
  const explain = risk?.explain || {};
  const ivNote = (explain.interviewerNote && typeof explain.interviewerNote === "object") ? explain.interviewerNote : null;
  const rawId = __txt(risk?.id || risk?.rawId || risk?.code || "");
  const title = __txt(canonicalCard.headline || risk?.title || risk?.label || rawId || "주요 리스크");
  const __isHR = (s) => !!s && !/^[a-z_]+$/.test(s) && !s.startsWith("report_v2");
  const __isTooGenericRiskLine = (s) => typeof s === "string" && /^(주의 필요|주의가 필요|확인 필요|일반적인 리스크)$/.test(s.trim());
  let candidates = [];
  if (mode === "mode_a") {
    candidates = [
      __txt(canonicalCard.supportingEvidence),
      __txt(canonicalCard.summary),
      ...__toLines(explain.why),
      __txt(ivNote?.oneLiner),
      ...__toLines(ivNote?.reasons),
    ];
  } else if (mode === "mode_b") {
    candidates = [
      __txt(ivNote?.oneLiner),
      ...__toLines(ivNote?.reasons),
      __txt(canonicalCard.summary),
      ...__toLines(explain.why),
    ];
  } else if (mode === "mode_c") {
    candidates = [
      __txt(ivNote?.oneLiner),
      __txt(canonicalCard.summary),
      ...__toLines(explain.why),
      ...__toLines(ivNote?.reasons),
    ];
  } else if (mode === "mode_d") {
    candidates = [
      __txt(ivNote?.oneLiner),
      ...__toLines(explain.action),
      __txt(canonicalCard.summary),
      ...__toLines(explain.why),
    ];
  } else {
    candidates = [
      __txt(canonicalCard.summary),
      ...__toLines(explain.why),
      __txt(ivNote?.oneLiner),
    ];
  }
  const summary = candidates.filter(__isHR).filter((s) => !__isTooGenericRiskLine(s)).find(Boolean)
    || (__isHR(__txt(canonicalCard.summary)) ? __txt(canonicalCard.summary) : null);
  return { title, summary };
}

// Phase 14-11: Top Risk Selection Rationale — role identity priority + axis hardening
function __topRiskSelectionRationale(surface) {
  // A. Input normalization
  const status          = __txt(surface?.status) || "";
  const riskFamily      = __txt(surface?.structured?.riskFamily) || "";
  const sourceFamilyRaw = __txt(surface?.sourceFamily) || __txt(surface?.structured?.sourceFamilyLabel) || "";
  const why             = __txt(surface?.why) || "";
  const proofMissing    = __txt(surface?.proofMissing) || __txt(surface?.structured?.top1ProofMissingText) || __txt(surface?.structured?.proofMissingText) || "";
  const actionHint      = __txt(surface?.actionHint) || __txt(surface?.structured?.actionHint) || "";
  const headline        = __txt(surface?.structured?.headline) || __txt(surface?.text?.headline) || "";
  const postureSummary  = __txt(surface?.structured?.postureSummary) || __txt(surface?.text?.posture) || "";
  const evidenceStrength = __txt(surface?.evidenceStrength) || __txt(surface?.structured?.evidenceStrength) || __txt(surface?.text?.evidenceStrength) || null;
  const familyDistance  = __txt(surface?.structured?.familyDistance) || "";
  if (status === "unavailable") return null;
  // Lowercase normalized haystacks
  const riskKey    = (riskFamily + " " + sourceFamilyRaw).toLowerCase();
  const whyText    = why.toLowerCase();
  const mergedText = (why + " " + actionHint + " " + headline + " " + proofMissing).toLowerCase();

  // B1. Exact token-set from riskKey (split by non-alnum separators + underscore parts)
  const __riskKeyTokens = (() => {
    const s = new Set();
    riskKey.split(/[^a-z0-9_]+/).forEach((t) => {
      if (t) { s.add(t); t.split("_").forEach((p) => { if (p) s.add(p); }); }
    });
    return s;
  })();
  const __hasRiskToken = (token) => __riskKeyTokens.has(token);

  // B. Status → tone class (3-way; unknown/empty → CAUTIOUS)
  const __tone = (
    (status === "confirmed" || status === "likely") ? "DIRECT" :
    (status === "partial"   || status === "mixed")  ? "MODERATE" :
    "CAUTIOUS"
  );

  // Axis signal counts
  // ROLE_IDENTITY_MISMATCH — Priority A: must outrank generic proof-gap when role divergence is concrete
  const __riSigs = [
    // RI1: owner-supplied family distance is cross-role (not same/adjacent/bridgeable/unclear)
    familyDistance === "distant_family",
    // RI2: riskFamily is a role-direction indicator
    riskFamily === "transition_path" || riskFamily === "years_seniority",
    // RI3: actionHint contains role/direction tension language
    /전환|방향 전환|다른 직무|직무 전환|다른 역할|역할 방향/.test(actionHint),
    // RI4: headline/postureSummary indicate role-identity divergence
    /다른 역할로|역할 경계|전환.*방향|목표 직무.*방향|읽히는 역할/.test(headline + " " + postureSummary),
  ].filter(Boolean).length;

  // PROOF_GAP
  const __pgSigs = [
    // PG1
    proofMissing.trim().length > 0,
    // PG2: Korean grouped phrases + English exact-word patterns
    /증명|근거|사례|구체화|정량화|성과 보강|증빙|보여주/.test(why + " " + actionHint + " " + proofMissing)
      || /\b(proof|evidence|example|demonstrate|demonstration|quantify|quantified)\b/.test(mergedText),
    // PG3: headline contains shortage wording
    /근거 부족|증빙 부족|사례 부족|직접 연결 부족/.test(headline),
    // PG4: exact token membership — no regex substring scan
    __hasRiskToken("must_have_gap") || __hasRiskToken("evidence_density")
      || __hasRiskToken("ownershipdepth") || __hasRiskToken("achievementproof"),
  ].filter(Boolean).length;

  // JD_DIRECTNESS
  const __jdSigs = [
    // JD1: why contains JD-direct wording (Korean phrases + English exact-word + literal JD)
    /핵심 요건|필수|핵심 역량|직접 요구/.test(why) || /JD/.test(why)
      || /\b(must-have|requirement|requirements)\b/.test(whyText),
    // JD2: exact token membership
    __hasRiskToken("must_have_gap") || __hasRiskToken("directness_context")
      || __hasRiskToken("targetrolefit") || __hasRiskToken("role_skill"),
    // JD3: actionHint contains JD-direct wording
    /핵심 요건|필수|직접 요구/.test(actionHint) || /JD/.test(actionHint),
    // JD4: headline contains role-fit/requirement link wording
    /직무 적합|역할 직접|요건 연결/.test(headline),
  ].filter(Boolean).length;

  // DECLARED_ROLE_TENSION
  const __drSigs = [
    // DR1: why + actionHint contains declared-direction tension phrases
    /방향은 보이지만|목표 방향|설정한 방향|지원 근거 부족|목표 방향은 있/.test(why + " " + actionHint),
    // DR2: headline contains direction tension phrases
    /방향은 보이지만|목표 방향|설정한 방향/.test(headline),
    // DR3: riskFamily exact string match
    ["transition_path", "years_seniority", "ownership_scope"].includes(riskFamily),
    // DR4: why + actionHint matches direction-deficit concept
    /방향.*부족|목표.*근거|방향.*뒷받침/.test(why + " " + actionHint),
  ].filter(Boolean).length;

  // HIRING_IMPACT
  const __hiSigs = [
    // HI1: grouped hiring phrases only — plain 채용/판단 alone do NOT count
    /면접|채용 판단|스크리닝|리크루터|먼저 걸릴|읽힘 영향/.test(why + " " + actionHint + " " + headline),
    // HI2: exact token membership — interview / recruiter / screening / hiring
    __hasRiskToken("interview") || __hasRiskToken("recruiter")
      || __hasRiskToken("screening") || __hasRiskToken("hiring"),
    // HI3: exact token membership — interviewreadrisk (camelCase-lowercased)
    __hasRiskToken("interviewreadrisk"),
    // HI4: why contains hiring-judgment phrases
    /면접|채용 판단|스크리닝/.test(why),
  ].filter(Boolean).length;

  // Priority: ROLE_IDENTITY_MISMATCH(A) > JD_DIRECTNESS(B) > PROOF_GAP(C) > DECLARED_ROLE_TENSION > HIRING_IMPACT > FIT_PRIMARY
  const __axis = (
    __riSigs >= 2 ? "ROLE_IDENTITY_MISMATCH" :
    __jdSigs >= 2 ? "JD_DIRECTNESS" :
    __pgSigs >= 2 ? "PROOF_GAP" :
    __drSigs >= 2 ? "DECLARED_ROLE_TENSION" :
    __hiSigs >= 2 ? "HIRING_IMPACT" :
    "FIT_PRIMARY"
  );

  // Fixed template lookup — single-axis × tone only
  const __tpl = {
    ROLE_IDENTITY_MISMATCH: {
      DIRECT:   "증빙 보강보다 앞서, 현재 문서가 목표 역할과 같은 방향으로 읽히는지가 먼저 확인되어야 할 지점입니다.",
      MODERATE: "현재 읽힘에서는 증빙 밀도보다, 목표 역할과 관측 역할 사이의 거리가 더 먼저 좁혀질 필요가 있어 보입니다.",
      CAUTIOUS: "현재 문서 기준으로는, 증빙 보강보다 먼저 목표 역할 방향이 현재 경력과 어떻게 이어지는지 점검해볼 필요가 있습니다.",
    },
    PROOF_GAP: {
      DIRECT:   "지금 단계에서는 다른 보조 신호보다, 목표 역할을 직접 증명하는 근거 부족이 더 크게 읽힙니다.",
      MODERATE: "현재 문서에서는 여러 신호 중에서도, 목표 역할을 직접 뒷받침하는 근거의 밀도가 가장 먼저 보완이 필요한 부분으로 읽힙니다.",
      CAUTIOUS: "현재 문서 기준으로는, 목표 역할을 직접 보여주는 근거가 충분한지부터 먼저 점검할 필요가 있습니다.",
    },
    JD_DIRECTNESS: {
      DIRECT:   "다른 보조 리스크보다, 현재 JD 핵심 요건과 직접 맞닿아 있는 부족 신호가 더 크게 읽힙니다.",
      MODERATE: "현재 읽힘에서는 주변 맥락보다, JD 핵심 요구와 직접 연결되는 지점의 보완 필요가 더 먼저 보입니다.",
      CAUTIOUS: "현재 문서 기준으로는, JD 핵심 요구와 직접 연결되는 부분부터 먼저 확인해볼 필요가 있습니다.",
    },
    DECLARED_ROLE_TENSION: {
      DIRECT:   "목표 방향은 분명하지만, 현재 문서가 그 방향을 직접 지지하는 힘이 아직 가장 약한 지점으로 읽힙니다.",
      MODERATE: "목표 방향은 보이지만, 그 방향을 현재 이력서가 충분히 뒷받침하는지는 조금 더 보강이 필요한 상태로 읽힙니다.",
      CAUTIOUS: "현재 문서 기준으로는, 설정한 목표 방향이 직접적으로 드러나는지부터 먼저 점검하는 편이 좋습니다.",
    },
    HIRING_IMPACT: {
      DIRECT:   "여러 신호가 함께 보이지만, 채용 판단에 가장 직접 영향을 줄 수 있는 축이 이 리스크입니다.",
      MODERATE: "현재 읽힘에서는 다른 보조 신호보다, 실제 채용 판단에 먼저 작용할 가능성이 있는 지점이 더 크게 보입니다.",
      CAUTIOUS: "현재 문서 기준으로는, 채용 판단에서 먼저 확인될 가능성이 큰 포인트부터 점검하는 편이 안전합니다.",
    },
    FIT_PRIMARY: {
      DIRECT:   "다른 보조 리스크보다, 현재 적합도 해석의 중심을 가장 직접적으로 흔드는 지점이 이 부분입니다.",
      MODERATE: "현재 읽힘에서는 주변 리스크보다, 전체 적합도 판단에 더 직접 연결되는 신호가 먼저 보입니다.",
      CAUTIOUS: "현재 문서 기준으로는, 보조 신호보다 전체 적합도에 더 직접 연결되는 부분을 먼저 확인해볼 필요가 있습니다.",
    },
  };
  const rationale = __tpl[__axis]?.[__tone] || null;

  // Duplicate suppression — headline and postureSummary only
  if (!rationale) return null;                                                          // F1
  if (__isNearDuplicateText(rationale, headline)) return null;                          // F2
  if (postureSummary && __isNearDuplicateText(rationale, postureSummary)) return null;  // F3
  return __applyEvidenceStrengthTone(rationale, evidenceStrength);
}

function __topRiskRequirementLabel(value) {
  const raw = __txt(value);
  if (!raw) return null;
  if (/[가-힣]/.test(raw) && !__isRawInternalVisibleToken(raw)) return raw;
  if (/^[a-z_]+$/i.test(raw)) return __riskFamilyLabel(raw);
  return __visibleSafeKoreanText(raw, "") || __riskFamilyLabel(raw);
}

function __topRiskProofStateLabel(value) {
  const raw = __txt(value).toLowerCase();
  if (raw === "direct" || raw === "supported" || raw === "satisfied") return "직접 증빙이 확인된 상태";
  if (raw === "partial") return "직접 증빙이 부분적으로만 확인된 상태";
  if (raw === "weak" || raw === "thin" || raw === "gap") return "직접 증빙이 부족한 상태";
  if (raw === "mismatch") return "직접 대응 증빙이 어긋난 상태";
  return null;
}

function __topRiskMismatchLabel(surface) {
  const structured = surface?.structured || {};
  const familyDistance = __txt(structured.familyDistance).toLowerCase();
  const riskFamily = __txt(structured.riskFamily).toLowerCase();
  if (riskFamily === "ownership_scope") return "책임 범위 차이";
  if (riskFamily === "years_seniority") return "깊이 부족";
  if (riskFamily === "transition_path") return "방향 전환 간극";
  if (["distant_family", "cross_family", "unrelated_family", "adjacent"].includes(familyDistance)) return "역할 방향 간극";
  if (riskFamily === "must_have_gap" || riskFamily === "directness_context") return "JD 직접성 부족";
  return null;
}

function __isTopRiskOwnedSupportText(text) {
  const value = __visibleSafeKoreanText(text, "");
  if (!value) return false;
  if (__isRawInternalVisibleToken(value)) return false;
  if (__isWeakGenericRemnantText(value)) return false;
  if (__shouldHideHeroSupportText(value)) return false;
  if (__isReviewCheckOnlyText(value)) return false;
  if (__isActionOnlyText(value)) return false;
  return /(직접 근거|증빙|요건|JD|부족|약하|얇|모이지 않아|붙지 않아|지지하는 근거|직접성|근거|리스크 축|보수적으로|기준에서는|증명|확인되지 않아|증빙이 부족한 상태)/i.test(value);
}

function __topRiskSupportSpecificityScore(text) {
  const value = __txt(text);
  if (!value) return 0;
  let score = 0;
  if (/(직접 근거|증빙|증명|proof|evidence)/i.test(value)) score += 3;
  if (/(JD|요건|requirement)/i.test(value)) score += 3;
  if (/(부족|약하|얇|모이지 않아|붙지 않아|확인되지 않아)/.test(value)) score += 2;
  if (/(출처|기준|직접성|범위|책임|역할 방향 간극|JD 직접성 부족)/.test(value)) score += 1;
  return score;
}

function __finalizeTopRiskSupportText(text, headline = "") {
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe) return null;
  if (!__isTopRiskOwnedSupportText(safe)) return null;
  if (headline && __isNearDuplicateText(safe, headline)) return null;
  return /[.!?]$/.test(safe) ? safe : `${safe}.`;
}

function __resolveTopRiskBody(surface) {
  const structured = surface?.structured || {};
  const text = surface?.text || {};
  const relation = (structured.top1RequirementProofRelation && typeof structured.top1RequirementProofRelation === "object")
    ? structured.top1RequirementProofRelation
    : ((structured.requirementProofRelation && typeof structured.requirementProofRelation === "object")
      ? structured.requirementProofRelation
      : null);
  const requirementLabel = __topRiskRequirementLabel(
    relation?.requirementLabel
    || structured.top1RequirementLabel
    || structured.riskFamily
  );
  const sourceLabel = __visibleSourceLabel(
    __txt(structured.top1SourceLabel)
    || __txt(relation?.sourceLabel)
    || __txt(structured.sourceFamilyLabel)
    || __txt(text.sourceLabel)
  );
  const proofStateLabel = __topRiskProofStateLabel(
    relation?.proofState
    || relation?.relationKind
  );
  const mismatchLabel = __topRiskMismatchLabel(surface);
  const proofForText = __visibleSafeKoreanText(
    __txt(structured.top1ProofForText)
    || __txt(structured.proofForText),
    ""
  );
  const proofMissingText = __visibleSafeKoreanText(
    __txt(structured.top1ProofMissingText)
    || __txt(structured.proofMissingText)
    || __txt(surface?.proofMissing),
    ""
  );
  const evidenceCue = __visibleSafeKoreanText(__txt(structured.top1EvidenceCue), "");
  const cueText = [proofForText, evidenceCue]
    .filter(Boolean)
    .find((candidate, index, arr) => arr.findIndex((item) => __isNearDuplicateText(item, candidate)) === index) || null;
  const headline = __txt(structured.headline) || __txt(text.headline);
  const candidates = [];
  const __pushCandidate = (textValue, priority) => {
    const finalized = __finalizeTopRiskSupportText(textValue, headline);
    if (!finalized) return;
    candidates.push({
      text: finalized,
      priority,
      specificity: __topRiskSupportSpecificityScore(finalized),
    });
  };

  __pushCandidate(proofMissingText, 400);

  if (relation && (requirementLabel || proofStateLabel || mismatchLabel)) {
    const relationBody = [
      requirementLabel ? `${requirementLabel} 기준에서` : null,
      proofStateLabel || mismatchLabel,
      proofMissingText && !__isNearDuplicateText(proofMissingText, proofStateLabel || "") ? proofMissingText : null,
    ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    __pushCandidate(relationBody, 300);
  }

  if (cueText || sourceLabel || mismatchLabel) {
    const cueBody = [
      sourceLabel ? `${sourceLabel} 기준에서는` : null,
      cueText ? `${cueText} 수준의 단서만 보여` : null,
      !cueText && mismatchLabel ? `${mismatchLabel}가 먼저 읽혀` : null,
    ].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    __pushCandidate(cueBody, 200);
  }

  __pushCandidate(__txt(surface?.why), 150);

  const signalCount = [requirementLabel, proofStateLabel, mismatchLabel, sourceLabel, cueText || proofMissingText].filter(Boolean).length;
  if (signalCount >= 2) {
    const leadParts = [
      requirementLabel ? `${requirementLabel} 축에서` : null,
      sourceLabel ? `${sourceLabel} 기준` : null,
      proofStateLabel ? proofStateLabel : null,
    ].filter(Boolean);
    const detailParts = [
      mismatchLabel ? `${mismatchLabel}로 읽히고` : null,
      cueText ? `현재 문서에는 ${cueText} 수준의 단서가 보이지만` : null,
      !cueText && proofMissingText ? proofMissingText : null,
    ].filter(Boolean);
    const body = `${leadParts.join(" ")} ${detailParts.join(" ")}`.replace(/\s+/g, " ").trim();
    __pushCandidate(body, 100);
  }

  const winner = candidates
    .sort((a, b) => (b.priority - a.priority) || (b.specificity - a.specificity) || (b.text.length - a.text.length))[0];
  return winner?.text || null;
}

function TopRiskRead({ surface }) {
  const text = surface?.text || {};
  const structured = surface?.structured || {};
  const __surfaceEvidenceStrength = __txt(surface?.evidenceStrength) || __txt(structured?.evidenceStrength) || __txt(text?.evidenceStrength) || null;
  const __resolvedTopRiskBody = __resolveTopRiskBody(surface);
  // Slice B: degraded short-form detection
  const __topConfidenceRaw = __txt(structured.confidenceLabel) || __txt(text.confidence);
  const __isDegradedRead = surface?.status === "partial" || surface?.status === "provisional"
    || __topConfidenceRaw === "low";
  // Slice B: short-form source priority ??actionHint > proofMissing > why > fallback
  const __isHumanReadableSB = (s) => !!s && !/^[a-z_]+$/.test(s) && !s.startsWith("report_v2");
  const __degradedShortBody = __isDegradedRead ? (
    [__txt(surface?.actionHint), __txt(surface?.proofMissing) || __txt(surface?.structured?.top1ProofMissingText) || __txt(surface?.structured?.proofMissingText), __txt(surface?.why)]
      .find(__isHumanReadableSB)
    || "직접 근거가 충분히 확인되지 않아 보수적으로 판단됩니다."
  ) : null;
  // Phase 12: tone/copy policy ??status-aware tone normalization
  const __currentStatus = __txt(surface?.status) || "";
  const __toneFamilyFromStatus = (st) => {
    if (st === "confirmed") return "confirmed";
    if (st === "likely") return "likely";
    if (st === "weak_evidence" || st === "partial" || st === "provisional") return "weak_evidence";
    if (st === "disputed" || st === "review_needed" || st === "review needed") return "disputed";
    if (st === "overridden") return "overridden";
    return null;
  };
  const __toneFamily = __toneFamilyFromStatus(__currentStatus);
  const __toneFallbackMap = {
    confirmed: "우선 검토 신호가 지표상 명확하게 수렴합니다.",
    likely: "현재 검토 방향 신호가 유력하게 보입니다.",
    weak_evidence: "직접 근거가 충분히 확인되지 않아 보수적으로 판단됩니다.",
    disputed: "서로 다른 검토 신호가 엇갈려 추가 확인이 필요합니다.",
    overridden: "이전 정보와 실제 결정 간 이유 차이가 있어 예외 처리로 판단됩니다.",
  };
  const __hasForbiddenPhrase = (s) =>
    typeof s === "string" && /분명합니다|명확합니다|확실합니다|강하게 시사합니다|확정/.test(s);
  const __normalizeTone = (bodyText) => {
    if (!bodyText || !__toneFamily) return bodyText;
    const __cautious = ["weak_evidence", "disputed", "overridden"];
    if (__cautious.includes(__toneFamily) && __hasForbiddenPhrase(bodyText)) {
      return __toneFallbackMap[__toneFamily];
    }
    return bodyText;
  };
    const __heroHeadline = __txt(structured.headline) || __txt(text.headline) || (__toneFamily === "weak_evidence"
      ? "핵심 리스크 쪽으로 읽힐 수 있어 추가 근거가 필요합니다."
      : __toneFamily === "disputed"
      ? "핵심 리스크 해석이 먼저 보이지만, 신호가 엇갈려 추가 확인이 필요합니다."
      : "핵심 리스크가 가장 먼저 검토됩니다.");
    const __heroSupportRaw = __resolvedTopRiskBody
      || (__isDegradedRead ? __degradedShortBody : (__txt(structured.postureSummary) || __txt(text.posture)));
    const __heroSupportText = (() => {
      const toned = __applyEvidenceStrengthTone(__normalizeTone(__heroSupportRaw), __surfaceEvidenceStrength);
      return __shouldHideHeroSupportText(toned) ? "" : toned;
    })();
    return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            우선 리스크 판단 기준
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            {__applyEvidenceStrengthTone(__heroHeadline, __surfaceEvidenceStrength)}
          </div>
          {(() => {
            const __rationale = __topRiskSelectionRationale(surface);
            return __rationale ? (
              <p className="mt-2 text-sm leading-6 text-slate-500">{__rationale}</p>
            ) : null;
          })()}
            {__heroSupportText ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3">
                <p className="text-sm leading-6 text-slate-800">{__heroSupportText}</p>
              </div>
            ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {__statusLabel(__txt(structured.strengthLabel) || __txt(text.badge)) ? (
            <span className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
              {__statusLabel(__txt(structured.strengthLabel) || __txt(text.badge))}
            </span>
          ) : null}
          {__confidenceLabel(__txt(structured.confidenceLabel) || __txt(text.confidence)) ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {__confidenceLabel(__txt(structured.confidenceLabel) || __txt(text.confidence))}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Phase 14 Slice 6: Type Read helpers (pure, consumer-only)
// NOTE: typeReadV2 surface has no real judgment key ??all items score 9 (neutral).
// Mode-aware priority has no reorder effect; generic suppression and copy resolver are the primary changes.
function __getTypeReadPriority(item, mode) {
  // surface.label is human-readable only ??never used as judgment key
  const j = item?.judgment || "";
  const maps = {
    mode_a: { targetRoleFit: 0, achievementProof: 1, evidenceDensity: 2, interviewReadRisk: 3 },
    mode_b: { targetRoleFit: 0, ownershipDepth: 1, achievementProof: 2, expressionGap: 3 },
    mode_c: { industryContinuity: 0, levelPositionFit: 1, careerContinuity: 2, targetRoleFit: 3 },
    mode_d: { targetRoleFit: 0, interviewReadRisk: 1, evidenceDensity: 2, ownershipDepth: 3 },
  };
  const defaultMap = { targetRoleFit: 0, careerContinuity: 1 };
  const map = maps[mode] || defaultMap;
  return j in map ? map[j] : 9;
}
function __resolveTypeReadView(surface, mode) {
  const GENERIC_TR_RE = [/주의 필요/, /보완 필요/, /상반된 신호/, /단정적 해석이 어렵/, /핵심 리스크 구조/, /한 줄로 읽기 어렵/];
  const roleSurface = __getRoleReadPrimarySurface(surface);
  const supportItems = __arr(roleSurface?.roleReadSupport?.items).filter((item) => item && typeof item === "object");
  const items = [
    __txt(roleSurface?.posture) ? { text: __txt(roleSurface.posture), field: "posture", judgment: roleSurface.roleReadPrimary?.key || null } : null,
    __txt(roleSurface?.context) ? { text: __txt(roleSurface.context), field: "context", judgment: roleSurface.roleReadPrimary?.key || null } : null,
    ...supportItems.flatMap((item) => ([
      __txt(item?.posture) ? { text: __txt(item.posture), field: "posture", judgment: item?.key || null } : null,
      __txt(item?.context) ? { text: __txt(item.context), field: "context", judgment: item?.key || null } : null,
    ])),
  ].filter(Boolean);
  const filtered = items.filter((item) => !GENERIC_TR_RE.some((re) => re.test(item.text.trim())));
  const sorted = filtered
    .map((item, i) => ({ item, score: __getTypeReadPriority(item, mode), i }))
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.i - b.i)
    .map(({ item }) => item);
  return { primary: sorted[0] || null, secondary: sorted.slice(1) };
}
function __resolveTypeReadCopy(item, mode) {
  const text = __txt(item?.text) || __txt(item?.summary) || __txt(item?.description) || __txt(item?.label) || __txt(item?.title) || null;
  return { label: null, text };
}

// Phase 5: judgment-owned type label + posture
function TypeReadV2({ surface, resolvedView, mode, onDetailClick }) {
  const roleSurface = __getRoleReadPrimarySurface(surface);
  if (!roleSurface || roleSurface.status === "unavailable") return null;
  const __displayPayload = __buildTypeReadDisplayPayload(surface);
  if (!__displayPayload) return null;
  const primary = resolvedView ? resolvedView.primary : (
    __txt(roleSurface.posture) ? { text: __txt(roleSurface.posture), field: "posture" } : null
  );
  const secondary = resolvedView ? resolvedView.secondary : (
    __txt(roleSurface.context) ? [{ text: __txt(roleSurface.context), field: "context" }] : []
  );
  const primaryCopy = primary ? __resolveTypeReadCopy(primary, mode) : null;
  const __surfaceStatus = __txt(roleSurface?.status) || "";
  const __showPrimaryLabel = __displayPayload.title;
  const __showSecondaryLabel = __txt(roleSurface.label) && !__isRiskLikeRoleText(__txt(roleSurface.label)) ? __txt(roleSurface.label) : null;
  const __primaryTextRaw = __displayPayload.summary
    ? __applyEvidenceStrengthTone(__normalizeVisibleTone(__displayPayload.summary, __surfaceStatus), roleSurface?.evidenceStrength)
    : "";
  // Phase 15-C: dedup guard — body must not repeat headline
  const __primaryText = (() => {
    if (!__primaryTextRaw || !__showPrimaryLabel) return __primaryTextRaw;
    if (!__isNearDuplicateText(__primaryTextRaw, __showPrimaryLabel)) return __primaryTextRaw;
    // body is near-duplicate of headline — try context first
    const __ctxCandidate = __displayPayload.context
      ? __applyEvidenceStrengthTone(__normalizeVisibleTone(__displayPayload.context, __surfaceStatus), roleSurface?.evidenceStrength)
      : null;
    if (__ctxCandidate && !__isNearDuplicateText(__ctxCandidate, __showPrimaryLabel)) return __ctxCandidate;
    // synthesize a minimal supporting sentence based on headline content
    if (/팀 범위|팀 단위/.test(__showPrimaryLabel)) return "현재 문서에서는 개인 단위 성과보다 팀 단위 기여가 먼저 읽혀 역할 폭이 보수적으로 해석될 수 있습니다.";
    if (/담당 범위|주도/.test(__showPrimaryLabel)) return "담당 범위는 보이지만, 직접 주도한 범위가 어디까지였는지는 한 번 더 확인될 수 있습니다.";
    return "역할 방향은 맞지만, 책임 범위와 주도 수준을 더 또렷하게 보여주면 해석이 강화될 수 있습니다.";
  })();
  const __secondaryVisible = (__displayPayload.context ? [__displayPayload.context] : [])
    .filter((text) => !__shouldHideRoleSectionText(text, __arr(surface?.heroLines), __arr(surface?.whyLines)))
    .filter((text) => !__isNearDuplicateText(text, __primaryText))
    .slice(0, 1);
  if (!__showPrimaryLabel || !__primaryText) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {__showPrimaryLabel ? (
            <div className="text-base font-semibold text-slate-900">{__showPrimaryLabel}</div>
          ) : null}
          {__showSecondaryLabel ? (
            <div className="pt-1 text-xs font-semibold tracking-wide text-slate-500">{__showSecondaryLabel}</div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {(roleSurface.badge && __statusLabel(roleSurface.badge) !== "근거 있음") ? (
            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${__surfaceTone(roleSurface.status)}`}>
              {__statusLabel(roleSurface.badge)}
            </span>
          ) : null}
          {__confidenceLabel(roleSurface.confidence) ? (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              신뢰도: {__confidenceLabel(roleSurface.confidence)}
            </span>
          ) : null}
        </div>
      </div>
        {__primaryText ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">
            {__primaryText}
          </div>
        ) : null}
      {__secondaryVisible.map((text, i) => {
        return text ? (
          <div key={`typeread-sec-${i}`} className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-2 text-xs leading-5 text-slate-600">
            {text}
          </div>
        ) : null;
      })}
      {onDetailClick ? (
        <div className="pt-1">
          <button type="button" onClick={onDetailClick} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
            상세보기 →          </button>
        </div>
      ) : null}
    </div>
  );
}

// Phase 14 Slice 3: Proof Summary view resolver (pure, consumer-only)
function __resolveProofSummaryView(surface, mode) {
  const strengths = __arr(surface?.strengths);
  const missing = __arr(surface?.missing);
  const __isTooGenericProofLine = (s) => typeof s === "string" && /^(보완 필요|경험 보완|일반적인|증빙 부족 확인 필요)$/.test(s.trim());
  const __filterItem = (item) => !__isTooGenericProofLine(__txt(item?.text));
  const __stableSort = (arr, scoreFn) =>
    arr.map((item, i) => ({ item, score: scoreFn(item), i }))
      .sort((a, b) => a.score !== b.score ? a.score - b.score : a.i - b.i)
      .map(({ item }) => item);
  const __missingScore = (item) => {
    const j = item?.judgment || "";
    if (mode === "mode_b") {
      if (j === "targetRoleFit") return 0;
      if (j === "interviewReadRisk") return 1;
      if (j === "ownershipDepth") return 2;
      return 3;
    }
    if (mode === "mode_c") {
      if (j === "industryContinuity") return 0;
      if (j === "levelPositionFit") return 1;
      if (j === "targetRoleFit") return 2;
      return 3;
    }
    if (mode === "mode_d") {
      if (j === "targetRoleFit") return 0;
      if (j === "evidenceDensity") return 1;
      if (j === "ownershipDepth") return 2;
      return 3;
    }
    return 0;
  };
  const __strengthScore = (item) => {
    const j = item?.judgment || "";
    if (mode === "mode_a") {
      if (j === "achievementProof") return 0;
      if (j === "evidenceDensity") return 1;
      if (j === "toolProof") return 2;
      return 3;
    }
    if (mode === "mode_d") return 10;
    return 0;
  };
  return {
    strengths: __stableSort(strengths.filter(__filterItem), __strengthScore),
    missing: __stableSort(missing.filter(__filterItem), __missingScore),
  };
}

// Phase 14 Slice 3: Proof item copy resolver (pure, consumer-only)
function __resolveProofItemCopy(item, bucket, mode) {
  const label = __jLabel(item?.judgment || "");
  const text = __txt(item?.text) || __txt(item?.label) || __txt(item?.summary) || null;
  return { label, text };
}

// Phase 5: judgment-owned proof strengths + missing groups
function ProofSummaryV2({ surface, resolvedView, mode }) {
  const strengths = resolvedView ? resolvedView.strengths : __arr(surface?.strengths);
  const missing = resolvedView ? resolvedView.missing : __arr(surface?.missing);
  const __surfaceStatus = __txt(surface?.status) || "";
  if (strengths.length === 0 && missing.length === 0) return null;
  return (
    <div className="space-y-3">
      {strengths.length > 0 ? (
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">확인된 근거</div>
          <div className="space-y-2">
            {strengths.map((s, i) => {
              const copy = __resolveProofItemCopy(s, "strengths", mode);
              return (
                <div key={`${s.judgment}-${i}`} className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2">
                  <div className="text-xs font-semibold text-emerald-700">{copy.label}</div>
                  <div className="mt-0.5 text-sm text-slate-800">{__applyEvidenceStrengthTone(__normalizeVisibleTone(copy.text, __surfaceStatus), s.evidenceStrength)}</div>
                  {s.confidence ? <div className="mt-1 text-[10px] text-slate-500">신뢰도: {__confidenceLabel(s.confidence)}</div> : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {missing.length > 0 ? (
        <div>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">보완 필요</div>
          <div className="space-y-2">
            {missing.map((m, i) => {
              const copy = __resolveProofItemCopy(m, "missing", mode);
              return (
                <div key={`${m.judgment}-${i}`} className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-2">
                  <div className="text-xs font-semibold text-amber-700">{copy.label}</div>
                  <div className="mt-0.5 text-sm text-slate-800">{__applyEvidenceStrengthTone(__normalizeVisibleTone(copy.text, __surfaceStatus), m.evidenceStrength)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function __isSafeVisibleWhyText(text) {
  const value = __txt(text);
  if (!value) return false;
  if (__hasWhyMachineCueResidue(value)) return false;
  if (/^[a-z0-9_:-]+$/i.test(value)) return false;
  if (/source|provenance|diagnostic|ontology|family id|canonical id/i.test(value)) return false;
  if (/sourceFamily|evidenceState|provenanceTier|candidateFamilyKeys|emittedFamilyKeys|suppressedFamilyKeys/.test(value)) return false;
  // Phase 14-11: raw English internal label phrases (e.g. "limited industry transfer evidence")
  if (!/[가-힣]/.test(value) && !/\d/.test(value) && !/[.!?,]/.test(value)
    && /^[a-z][a-z ]{4,60}(evidence|gap|risk|signal|fit|mismatch|transfer|continuity|alignment|readiness|density|depth|score|coverage)$/i.test(value)) return false;
  return true;
}

function __hasWhyMachineCueResidue(text) {
  const value = __txt(text);
  if (!value) return false;
  if (__isRawInternalVisibleToken(value)) return true;
  return (
    /\b(?:thin|gap|weak|partial|fallback|generic|unknown)\b/i.test(value)
    || /\b(?:must_have_gap|directness_context|ownership_scope|years_seniority|transition_path|family_distance|source_family|proof_state|relation_kind|subtype|risk_family)\b/i.test(value)
    || /\b(?:sourceFamily|familyDistance|riskFamily|proofState|relationKind|semanticStatus|requirementProofRelation)\b/.test(value)
    || /[a-z]+_[a-z0-9_]+/.test(value)
  );
}

function __humanizeWhyRequirementLabel(value) {
  const safe = __topRiskRequirementLabel(value);
  return safe && !__hasWhyMachineCueResidue(safe) ? safe : null;
}

function __humanizeWhyProofStateLabel(value) {
  const safe = __topRiskProofStateLabel(value);
  return safe && !__hasWhyMachineCueResidue(safe) ? safe : null;
}

function __humanizeWhySourceLabel(value) {
  const safe = __visibleSourceLabel(value);
  return safe && !__hasWhyMachineCueResidue(safe) ? safe : null;
}

function __sanitizeWhyVisibleText(text) {
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe) return "";
  if (__hasWhyMachineCueResidue(safe)) return "";
  if (__isWeakGenericRemnantText(safe)) return "";
  return safe;
}

function __resolveWhyLabel(row) {
  const rawLabel = __txt(row?.label);
  const rawNote = __txt(row?.note);
  if (/[가-힣]/.test(rawLabel) && !/^[a-z0-9_:-]+$/i.test(rawLabel)) return rawLabel;
  const key = `${rawNote} ${rawLabel}`.toLowerCase();
  if (/targetrolefit|target_role|role_fit|role_alignment|directness|executionspecificity/.test(key)) return "직무 정렬";
  if (/industrycontinuity|industry_fit|domain_continuity|industry_alignment|domaintranslation|contextgap/.test(key)) return "도메인 연결성";
  if (/levelpositionfit|level_fit|seniority|level_alignment/.test(key)) return "레벨 신호";
  if (/ownershipdepth|ownership|scope_depth|ownershipscope/.test(key)) return "주도 범위";
  if (/evidencedensity|evidence|proof_density|evidencedepth/.test(key)) return "근거 밀도";
  if (/toolproof|tool|tool_evidence/.test(key)) return "도구 증빙";
  if (/achievementproof|achievement|outcome/.test(key)) return "성과 증빙";
  if (/transitionreadiness|transition|move_readiness|readinessgap/.test(key)) return "전환 준비도";
  if (/expressiongap|narrative|expression/.test(key)) return "표현 정합성";
  if (/interviewreadrisk|interview|review_risk/.test(key)) return "면접 해석 리스크";
  return "검토 포인트";
}

function __resolveWhySentenceByLabel(label) {
  const map = {
    "직무 정렬": "목표 직무 방향은 보이지만, 현재 문서에서는 직접 연결 근거가 더 또렷해야 합니다.",
    "도메인 연결성": "경력 축은 이어지지만, 이번 JD와 맞닿는 도메인 근거는 더 선명하게 보일 필요가 있습니다.",
    "레벨 신호": "수행 경험은 보이지만, 기대 레벨에 맞는 범위와 깊이가 문서상 충분히 드러나지 않을 수 있습니다.",
    "주도 범위": "참여 경험은 확인되지만, 직접 주도한 범위가 얼마나 컸는지는 추가 확인이 필요해 보입니다.",
    "근거 밀도": "관련 경험은 있으나, 판단에 직접 쓰일 수 있는 문서상 근거가 아직 촘촘하지 않습니다.",
    "도구 증빙": "관련 도구를 다뤘을 가능성은 보이지만, 실제 사용 맥락이 더 분명하게 적히면 해석이 안정됩니다.",
    "성과 증빙": "업무 수행 내용은 보이지만, 결과와 변화까지 연결되는 성과 근거는 더 보강될 여지가 있습니다.",
    "전환 준비도": "방향 전환 의도는 읽히지만, 이번 이동이 자연스럽게 이어진다는 직접 근거는 더 필요할 수 있습니다.",
    "표현 정합성": "경험 자체보다도, 현재 문서에서 강점이 한 축으로 정리되어 읽히지 않을 가능성이 있습니다.",
    "면접 해석 리스크": "면접관 입장에서는 추가 설명이 없으면 여러 방향으로 해석될 여지가 남아 있습니다.",
    "검토 포인트": "현재 문서 기준으로는 이 지점이 보수적으로 검토될 가능성이 있습니다.",
  };
  return map[label] || map["검토 포인트"];
}

function __isWhyGenericBody(text, label = "") {
  const value = __txt(text);
  if (!value) return true;
  if (__isWeakGenericRemnantText(value)) return true;
  if (label && (__isNearDuplicateText(value, label) || value.startsWith(label))) return true;
  if (/더 필요합니다|보완이 필요합니다|설명이 필요합니다|추가 확인이 필요합니다/.test(value)
    && !/(직무|역할|방향|요건|근거|증빙|도메인|전환|범위|책임|JD|요구)/i.test(value)) return true;
  return false;
}
// Phase 14-14: detect reviewer-verification-prompt text — gate Why body selection
function __isReviewCheckOnlyText(text) {
  const value = __txt(text);
  if (!value) return false;
  if (!/(확인이 필요|확인해볼 필요|검증이 필요|면접에서 확인|추가 확인|직접 확인해볼)/.test(value)) return false;
  // Allow if a causal connective is present (makes it Why-like: "붙지 않아 확인이 필요" etc.)
  return !/(때문|않아|않습니다|없어|없습니다|않고|읽혀|읽힐|부족|거칠|약해|아직|현재 문서|충분히 붙지|충분히 드러나지)/.test(value);
}

function __resolveWhySpecificBody(row, riskSurface, heroLines = [], seenBodies = []) {
  const label = __resolveWhyLabel(row);
  const ownerValue = __firstSentence(row?.value);
  const safeOwnerValue = __isSafeVisibleWhyText(ownerValue) ? __sanitizeWhyVisibleText(ownerValue) : null;
  const riskStructured = riskSurface?.structured || {};
  const riskText = riskSurface?.text || {};
  const familyDistance = __txt(riskStructured?.familyDistance || riskSurface?.familyDistance);
  const proofMissingText = __sanitizeWhyVisibleText(__txt(riskStructured?.proofMissingText || riskSurface?.proofMissing || row?.proofMissingText));
  const relation = (riskStructured?.requirementProofRelation && typeof riskStructured.requirementProofRelation === "object")
    ? riskStructured.requirementProofRelation
    : null;
  const relationRequirementLabel = __humanizeWhyRequirementLabel(relation?.requirementLabel);
  const relationProofState = __humanizeWhyProofStateLabel(relation?.proofState || relation?.relationKind);
  const relationKind = __txt(relation?.relationKind);
  const sourceLabel = __humanizeWhySourceLabel(riskText?.sourceLabel || riskStructured?.sourceFamilyLabel || riskSurface?.sourceFamily);
  const subtype = __txt(riskSurface?.subtype || riskStructured?.subtype || row?.subtype);
  const actionHint = __txt(riskStructured?.actionHint || riskSurface?.actionHint);
  const candidates = [];

  const __roleIdentityMismatch = (
    familyDistance === "distant_family"
    || familyDistance === "cross_family"
    || familyDistance === "unrelated_family"
    || /role|identity|mismatch|cross_family|different_role/i.test(subtype)
    || /전환|다른 역할|역할 방향|목표 직무.*방향|읽히는 역할/.test(actionHint)
  );
  if (__roleIdentityMismatch) {
    candidates.push("현재 문서는 목표 역할 방향보다 인접하거나 다른 역할 방향의 경험으로 먼저 읽혀, 선언한 방향을 직접 지지하는 근거가 약하게 보일 수 있습니다.");
  }

  // Phase 15-A: safeOwnerValue priority — prefer pre-built Korean summary over relation-derived sentence
  if (safeOwnerValue) candidates.push(safeOwnerValue);

  if (relation && (relationRequirementLabel || relationProofState || sourceLabel)) {
    const __requirementPart = relationRequirementLabel
      ? (/jd|요건|requirement/i.test(relationRequirementLabel)
        ? `${relationRequirementLabel} 쪽에서`
        : `${relationRequirementLabel} 축에서`)
      : "현재 리스크 축에서";
    const __proofPart = relationProofState
      ? `${relationProofState} 상태라`
      : "직접 근거가 충분히 붙지 않아";
    candidates.push(`${__requirementPart} ${__proofPart} 보수적으로 읽힐 수 있습니다.`);
  }

  // Phase 14-14: proofMissingText = actionHint — reject if it's action-instruction, not causal explanation
  if (proofMissingText && !__isWhyGenericBody(proofMissingText, label) && !__isActionOnlyText(proofMissingText)) {
    candidates.push(/다\.$|요\.$|니다\.$/.test(proofMissingText)
      ? proofMissingText
      : `현재 리스크 축에서는 ${proofMissingText}`);
  }

  if (sourceLabel || familyDistance) {
    const __sourcePart = sourceLabel ? `${sourceLabel} 기준에서는` : "현재 문서 기준에서는";
    const __relationPart = (familyDistance === "distant_family" || familyDistance === "cross_family" || familyDistance === "unrelated_family")
      ? "목표 역할 방향을 직접 지지하는 신호가 아직 거칠게 남아 있어"
      : "직접 지지 근거가 충분히 모이지 않아";
    candidates.push(`${__sourcePart} ${__relationPart} 보수적으로 읽힐 수 있습니다.`);
  }

  return candidates
    .map((candidate) => __sanitizeWhyVisibleText(__txt(candidate)))
    .filter(Boolean)
    .find((candidate) => {
      if (!__isSafeVisibleWhyText(candidate)) return false;
      if (__isWhyGenericBody(candidate, label)) return false;
      if (__isReviewCheckOnlyText(candidate)) return false;
      if (__arr(heroLines).some((line) => __isNearDuplicateText(candidate, line))) return false;
      if (__arr(seenBodies).some((line) => __isNearDuplicateText(candidate, line))) return false;
      return true;
    }) || null;
}

function __resolveWhyCue(row, sentence) {
  const value = __sanitizeWhyVisibleText(__sanitizeOriginVisibleText(__firstSentence(row?.value)));
  if (!value) return null;
  if (__isNearDuplicateText(value, sentence)) return null;
  if (__isWeakGenericRemnantText(value)) return null;
  return value;
}

function __resolveWhyRows(surface, heroLines, riskSurface = null) {
  const rows = __arr(surface?.structured?.rows);
  const safeHeroLines = __arr(heroLines).map(__txt).filter(Boolean);
  const seenLabels = new Set();
  const seenSentences = [];
    return rows
      .map((row) => {
        const label = __resolveWhyLabel(row);
        const sentence = __sanitizeWhyVisibleText(__sanitizeOriginVisibleText(__resolveWhySpecificBody(row, riskSurface, safeHeroLines, seenSentences), safeHeroLines));
        const cue = __resolveWhyCue(row, sentence);
        return { label, sentence, cue };
      })
    .filter((row) => row.label && row.sentence)
    .filter((row) => {
      if (seenLabels.has(row.label)) return false;
      if (safeHeroLines.some((line) => __isNearDuplicateText(row.sentence, line))) return false;
      if (seenSentences.some((line) => __isNearDuplicateText(row.sentence, line))) return false;
      seenLabels.add(row.label);
      seenSentences.push(row.sentence);
      return true;
    })
    .slice(0, 3);
}

function WhyThisRisk({ surface, heroLines = [], riskSurface = null }) {
  const __surfaceEvidenceStrength = __txt(surface?.evidenceStrength) || __txt(surface?.structured?.evidenceStrength) || __txt(surface?.text?.evidenceStrength) || null;
  const rows = __resolveWhyRows(surface, heroLines, riskSurface)
    .filter((row) => !__isWeakGenericRemnantText(row.sentence))
    .filter((row) => !__isRawInternalVisibleToken(`${row.label} ${row.sentence} ${row.cue || ""}`));
  if (rows.length === 0) return null;
  return (
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">{row.label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{__applyEvidenceStrengthTone(row.sentence, __surfaceEvidenceStrength)}</p>
          {row.cue ? (
            <div className="mt-2 text-xs leading-5 text-slate-500">{__applyEvidenceStrengthTone(row.cue, __surfaceEvidenceStrength)}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// Phase 14 Slice 5: Career Flow helpers (pure, consumer-only)
function __getCareerFlowPriority(item, mode) {
  const j = item?.judgment || "";
  const maps = {
    mode_a: { targetRoleFit: 0, achievementProof: 1, careerContinuity: 2, industryContinuity: 3 },
    mode_b: { targetRoleFit: 0, careerContinuity: 1, ownershipDepth: 2, achievementProof: 3 },
    mode_c: { industryContinuity: 0, levelPositionFit: 1, targetRoleFit: 2, careerContinuity: 3 },
    mode_d: { targetRoleFit: 0, evidenceDensity: 1, interviewReadRisk: 2, careerContinuity: 3 },
  };
  const defaultMap = { careerContinuity: 0, targetRoleFit: 1 };
  const map = maps[mode] || defaultMap;
  return j in map ? map[j] : 9;
}
function __resolveCareerFlowView(surface, mode) {
  const structured = surface?.structured || {};
  const text = surface?.text || {};
  const GENERIC_CF_RE = [/한 줄로 읽기 어렵/, /하나의 중심축으로 읽기 어렵/, /상반된 신호/, /현재 이력서만으로는/];
  const mainText = __txt(structured.mainThesis) || __txt(text.summary) || "";
  const mainItem = mainText ? { judgment: __txt(structured.primaryAxis), text: mainText, isMain: true } : null;
  const supportItems = __arr(structured.supportingPoints).map((p) => ({ text: __txt(p), isSupport: true }));
  const allItems = [mainItem, ...supportItems].filter(Boolean);
  const filtered = allItems.filter((item) => !GENERIC_CF_RE.some((re) => re.test(item.text.trim())));
  const sorted = filtered
    .map((item, i) => ({ item, score: __getCareerFlowPriority(item, mode), i }))
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.i - b.i)
    .map(({ item }) => item);
  return { primary: sorted[0] || null, secondary: sorted.slice(1) };
}
function __resolveCareerFlowCopy(item, mode) {
  const jLabelMap = {
    targetRoleFit: "직무 적합성",
    industryContinuity: "도메인 연속성",
    levelPositionFit: "레벨 포지션",
    evidenceDensity: "증빙 밀도",
    ownershipDepth: "오너십 깊이",
    achievementProof: "성과 증빙",
    toolProof: "도구 증빙",
    transitionReadiness: "전환 준비",
    interviewReadRisk: "면접 리스크",
    expressionGap: "표현 개선",
    careerContinuity: "경력 연속성",
  };
  const j = item?.judgment || "";
  const label = (j && jLabelMap[j]) || __txt(item?.label) || __txt(item?.title) || null;
  const text = __txt(item?.text) || __txt(item?.summary) || __txt(item?.label) || __txt(item?.title) || null;
  return { label, text };
}

function CareerContext({ surface, resolvedView, mode, heroLines = [], whyLines = [] }) {
  const structured = surface?.structured || {};
  const text = surface?.text || {};
  const primary = resolvedView ? resolvedView.primary : (
    (__txt(structured.mainThesis) || __txt(text.summary))
      ? { judgment: __txt(structured.primaryAxis), text: __txt(structured.mainThesis) || __txt(text.summary), isMain: true }
      : null
  );
  const secondary = resolvedView ? resolvedView.secondary : __arr(structured.supportingPoints).map((p) => ({ text: __txt(p), isSupport: true }));
  const primaryCopy = primary ? __resolveCareerFlowCopy(primary, mode) : null;
    const sourceLabel = __visibleSourceLabel(__txt(structured.sourceFamilyLabel)) || null;
    const higherPriorityLines = [...__arr(heroLines), ...__arr(whyLines)].map(__txt).filter(Boolean);
    const supportItems = secondary.filter((s) => s.isSupport || !s.isMain);
    const __surfaceStatus = __txt(surface?.status) || "";
    const __primaryText = primaryCopy?.text ? __visibleConsumerTextOrEmpty(__applyContradictionGuard(__normalizeVisibleTone(primaryCopy.text, __surfaceStatus), surface?.riskStatus)) : "";
    const __primaryVisible = __primaryText
      && __hasTrajectoryBackgroundSignal(__primaryText)
      && !__isRoleReadLikeText(__primaryText)
      && !__shouldHideCareerContext(__primaryText, higherPriorityLines);
    const __supportVisible = supportItems
      .map((item) => ({ item, copy: __resolveCareerFlowCopy(item, mode) }))
      .map(({ item, copy }) => ({
        item,
        text: __visibleConsumerTextOrEmpty(__applyContradictionGuard(__normalizeVisibleTone(copy.text, __surfaceStatus), surface?.riskStatus)),
      }))
      .filter(({ text }) => text)
      .filter(({ text }) => __hasTrajectoryBackgroundSignal(text))
      .filter(({ text }) => !__isRoleReadLikeText(text))
      .filter(({ text }) => !__shouldHideCareerContext(text, [...higherPriorityLines, __primaryVisible ? __primaryText : null]))
      .filter(({ text }, index, arr) => arr.findIndex((entry) => __isNearDuplicateText(entry.text, text)) === index)
      .slice(0, __primaryVisible ? 1 : 2);
  // Phase 14: hide section when no meaningful context content survives
  if (!__primaryVisible && __supportVisible.length === 0) return null;
  return (
    <div className="space-y-3">
      {__primaryVisible ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          {primaryCopy.label ? (
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{primaryCopy.label}</div>
          ) : null}
          <p className="text-sm leading-6 text-slate-700">{__primaryText}</p>
        </div>
      ) : null}
      {sourceLabel && (__primaryVisible || __supportVisible.length > 0) ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">해석 출처</div>
          <div className="mt-1 text-sm text-slate-800">{sourceLabel}</div>
        </div>
      ) : null}
      {__supportVisible.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">근거 포인트</div>
          <ul className="mt-2 space-y-2">
            {__supportVisible.map(({ item, text: visibleText }, index) => {
              const copy = __resolveCareerFlowCopy(item, mode);
              return (
                <li key={`career-support-${index}`} className="text-sm leading-6 text-slate-700">
                  {visibleText || copy.text}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function __shouldRenderCareerContext(surface, resolvedView, mode, riskSurface) {
  const structured = surface?.structured || {};
  const text = surface?.text || {};
  const primary = resolvedView ? resolvedView.primary : (
    (__txt(structured.mainThesis) || __txt(text.summary))
      ? { judgment: __txt(structured.primaryAxis), text: __txt(structured.mainThesis) || __txt(text.summary), isMain: true }
      : null
  );
  const secondary = resolvedView ? resolvedView.secondary : __arr(structured.supportingPoints).map((p) => ({ text: __txt(p), isSupport: true }));
  const candidates = [primary, ...secondary]
    .filter(Boolean)
    .map((item) => __visibleConsumerTextOrEmpty(__resolveCareerFlowCopy(item, mode).text))
    .filter(Boolean);
  if (candidates.length === 0) return false;

  const riskStructured = riskSurface?.structured || {};
    const riskFamily = __txt(riskStructured.riskFamily).toLowerCase();
    const familyDistance = __txt(riskStructured.familyDistance).toLowerCase();
    return candidates.some((candidate) => {
      if (!__hasTrajectoryBackgroundSignal(candidate)) return false;
      if (__isRoleReadLikeText(candidate)) return false;
      if (__shouldHideCareerContext(candidate, [])) return false;
      if ((riskFamily === "must_have_gap" || riskFamily === "directness_context")
        && /(JD|직무|요건|직접|도메인|증빙|근거)/.test(candidate)) return true;
    if ((riskFamily === "ownership_scope" || riskFamily === "years_seniority")
      && /(범위|책임|오너십|레벨|시니어|의사결정|깊이)/.test(candidate)) return true;
    if ((riskFamily === "transition_path" || ["adjacent", "distant_family", "cross_family", "unrelated_family"].includes(familyDistance))
      && /(역할|방향|전환|연속성|맥락|인접|도메인)/.test(candidate)) return true;
    return false;
  });
}

function __resolveSupportedReviewLabel(item) {
  const label = __txt(item?.label);
  if (/직접 수행|직접 연결|JD 직접/.test(label)) return "JD 직접 연결 근거";
  if (/범위|의사결정|책임|오너십/.test(label)) return "책임 범위";
  if (/도메인|맥락|전환/.test(label)) return "도메인 직접성 근거";
  if (/대표 사례|증빙|성과/.test(label)) return "성과 지표 근거";
  if (/핵심 역량/.test(label)) return "JD 직접 요구와의 연결 근거";
  if (/적합도|연결성/.test(label)) return "검토 포인트";
  return label || "검토 포인트";
}
function __resolveSupportedReviewStem(card) {
  const text = `${__txt(card?.label)} ${__txt(card?.body)} ${__txt(card?.evidence)} ${__txt(card?.suggestion)}`;
  if (/jd|직접 연결|직접 수행|직접 요구/.test(text.toLowerCase()) || /JD|직접 연결|직접 수행|직접 요구/.test(text)) return "jd_direct_link";
  if (/근거|증빙 밀도|촘촘|문서상 근거/.test(text)) return "evidence_density";
  if (/범위|의사결정|책임|오너십/.test(text)) return "ownership_scope";
  if (/성과|수치|결과|변화|지표/.test(text)) return "achievement_proof";
  if (/도메인|맥락|전환|업종/.test(text)) return "domain_directness";
  if (/도구|엑셀|excel|sql|sap|power bi|tableau|crm/.test(text.toLowerCase()) || /도구|엑셀|SQL|SAP|Power BI|Tableau|CRM/.test(text)) return "tool_context";
  if (/조직 운영|인사|피플|관리|채용/.test(text)) return "people_management";
  if (/전략|판단|우선순위|기획 근거/.test(text)) return "strategy_reasoning";
  if (/실행|수행 장면|프로세스|운영 장면/.test(text)) return "execution_specificity";
  if (/kpi|okr|metric|지표|수치/.test(text.toLowerCase()) || /KPI|OKR|지표|수치/.test(text)) return "metric_specificity";
  return "generic";
}
function __isAbstractOnlyReviewBody(text) {
  const value = __txt(text);
  if (!value) return true;
  if (/근거 부족|역량 부족|적합성 부족|전략성 부족|연결 필요/.test(value) && !/JD|직접|성과|수치|범위|책임|도메인|도구|지표|사례/.test(value)) {
    return true;
  }
  return /^(검토 포인트|추가 확인 포인트|보수적으로 해석될 수 있습니다)\.?$/.test(value);
}
function __supportedReviewValueScore(card) {
  let score = 0;
  if (/JD|직접|요구/.test(card.label) || /JD|직접|요구/.test(card.body)) score += 4;
  if (/성과|수치|결과|변화/.test(card.label) || /성과|수치|결과|변화/.test(card.body)) score += 3;
  if (/범위|책임|의사결정|오너십/.test(card.label) || /범위|책임|의사결정|오너십/.test(card.body)) score += 3;
  if (card.evidence) score += 2;
  if (card.suggestion) score += 4;  // Phase 14-11: source-aware suggestion outranks generic candidate
  if (card.body.length <= 80) score += 1;
  return score;
}

function __sanitizeReviewRequirementLabel(value) {
  const text = __txt(value)
    .replace(/^[A-Z_:-]+\s*/i, "")
    .replace(/[\[\]{}<>]/g, " ")
    .replace(/\([^)]*\b(?:id|code|enum|key)\b[^)]*\)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return "";
  if (text.length < 3) return "";
  if (/^[\W_]+$/.test(text)) return "";
  if (__isRawInternalVisibleToken(text)) return "";
  if (!/[가-힣]/.test(text) && /[A-Za-z]{4,}/.test(text)) return "";
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe || __isRawInternalVisibleToken(safe)) return "";
  return safe;
}
function __reviewCardVisibleText(card) {
  return [card?.label, card?.body, card?.evidence, card?.suggestion]
    .map(__txt)
    .filter(Boolean)
    .join(" ");
}
function __topRiskReviewSignals(topRiskSurface) {
  const topRiskStructured = topRiskSurface?.structured || {};
  const familyDistance = __txt(topRiskStructured?.familyDistance);
  const relation = topRiskStructured?.requirementProofRelation || null;
  const proofMissingText = __txt(topRiskStructured?.proofMissingText);
  return {
    hasFamilyDistanceRisk: ["adjacent", "cross", "distant_family", "unrelated"].includes(familyDistance),
    familyDistance,
    hasRequirementProofRelation: !!(relation && (
      __sanitizeReviewRequirementLabel(relation?.requirementLabel)
      || __txt(relation?.relation)
      || __txt(relation?.proofFor)
      || __txt(relation?.proofMissing)
    )),
    hasProofMissing: !!(proofMissingText && __isSafeVisibleWhyText(proofMissingText) && !__isWeakGenericRemnantText(proofMissingText)),
  };
}
function __hasReviewVerificationTarget(text) {
  return /(역할|방향|직무|요건|증빙|근거|도메인|전환|범위|책임|성과|수치|JD|면접 확인 질문|직접 증명|같은 축|인접한 역할|이력서 사례|공고 요건)/.test(__txt(text));
}
function __isRoleDirectionReviewCard(card) {
  const text = __reviewCardVisibleText(card);
  return /같은 축|인접한 역할|역할 방향|직무 전환|목표 역할 수행 경험|실제 목표 역할|역할 확장|다른 역할|목표 역할 방향/.test(text);
}
function __isRequirementProofReviewCard(card) {
  const text = __reviewCardVisibleText(card);
  return /요건|공고 요건|JD|직접 증명|이력서 사례|직접 연결|핵심 요건/.test(text);
}
function __isProofMissingReviewCard(card, topRiskSurface) {
  const text = __reviewCardVisibleText(card);
  const signals = __topRiskReviewSignals(topRiskSurface);
  if (!signals.hasProofMissing) return false;
  return /직접 근거|증빙 확인|보완 필요 증빙|면접 확인 질문|직접 증명되는지 확인/.test(text);
}
function __classifyReviewCardTier(card, topRiskSurface) {
  const signals = __topRiskReviewSignals(topRiskSurface);
  const text = __reviewCardVisibleText(card);
  const isSourceAware =
    ((__txt(card.sourceFamily) && __txt(card.sourceFamily) !== "fallback")
      || /출처|지원 출처|읽힘 기준/.test(text));
  const isSpecific =
    !__isAbstractOnlyReviewBody(card.body) && __hasReviewVerificationTarget(text);
  if (__txt(card.id).startsWith("review-synth-family-distance")) return 1;
  if (__txt(card.id).startsWith("review-synth-relation")) return 2;
  if (__txt(card.id).startsWith("review-synth-proof-missing")) return 3;
  if (signals.hasFamilyDistanceRisk && __isRoleDirectionReviewCard(card)) return 1;
  if (signals.hasRequirementProofRelation && __isRequirementProofReviewCard(card)) return 2;
  if (signals.hasProofMissing && __isProofMissingReviewCard(card, topRiskSurface)) return 3;
  if (isSourceAware) return 4;
  if (isSpecific) return 5;
  return 9;
}
function __synthesizeUpstreamReviewCandidates(topRiskSurface) {
  const topRiskStructured = topRiskSurface?.structured || {};
  const signals = __topRiskReviewSignals(topRiskSurface);
  const candidates = [];
  const proofMissingText = __visibleSafeKoreanText(__txt(topRiskStructured?.proofMissingText), "");
  const relation = topRiskStructured?.requirementProofRelation || null;
  const relationRequirementLabel = __sanitizeReviewRequirementLabel(relation?.requirementLabel);
  if (signals.hasFamilyDistanceRisk) {
    candidates.push({
      id: "review-synth-family-distance",
      label: "역할 방향 확인",
      body: __visibleSafeKoreanText(signals.familyDistance === "adjacent"
        ? "현재 경험이 인접한 역할 확장인지, 실제 목표 역할 수행 경험인지 구분해서 확인할 필요가 있습니다."
        : "이 경력이 목표 역할과 같은 축으로 직접 읽히는지는 면접 단계에서 추가 확인이 필요합니다.", "면접에서 직접 확인해볼 필요가 있습니다."),
      evidence: null,
      suggestion: null,
      sourceFamily: "topRiskStructured",
      __synthetic: true,
    });
  }
  if (signals.hasRequirementProofRelation) {
    const requirementPart = relationRequirementLabel
      ? `${relationRequirementLabel} 관련 요건이`
      : "JD에서 요구하는 핵심 요건이";
    candidates.push({
      id: "review-synth-relation",
      label: "요건-증빙 확인",
      body: __visibleSafeKoreanText(`${requirementPart} 이력서 사례에서 직접 증명되는지 확인해볼 필요가 있습니다.`, "JD 핵심 요건이 이력서 사례에서 직접 증명되는지 확인해볼 필요가 있습니다."),
      evidence: null,
      suggestion: null,
      sourceFamily: "topRiskStructured",
      __synthetic: true,
    });
  }
  if (signals.hasProofMissing && proofMissingText) {
    candidates.push({
      id: "review-synth-proof-missing",
      label: "보완 필요 증빙 확인",
      body: __visibleSafeKoreanText(`${proofMissingText} 이 부분은 직접 근거가 면접 확인 질문으로 이어질 수 있습니다.`, ""),
      evidence: null,
      suggestion: null,
      sourceFamily: "topRiskStructured",
      __synthetic: true,
    });
  }
  return candidates.filter((card) => __visibleSafeKoreanText(card.body, ""));
}
function __isRejectableReviewCard(card, whyBodyText) {
  const body = __txt(card.body);
  const label = __txt(card.label);
  const merged = [label, body, __txt(card.evidence), __txt(card.suggestion)].filter(Boolean).join(" ");
  if (!body || body.length < 8) return true;
  if (__isAbstractOnlyReviewBody(body)) return true;
  if (__isActionOnlyText(body)) return true;
  if (/JD와 더 또렷하게 연결할 필요가 있습니다|조금 더 구체화하면 좋습니다|근거를 보강해보세요|설득력을 높일 필요가 있습니다/.test(body) && !__hasReviewVerificationTarget(body)) return true;
  if (__isNearDuplicateText(body, label) || __isNearDuplicateText(__firstSentence(body), label)) return true;
  if (whyBodyText && __isNearDuplicateText(body, whyBodyText)) return true;
  if (/continuity|familyDistance|requirementProofRelation|weak_evidence|disputed|overridden|sourceFamily|must_have_gap|[a-z]+_[a-z0-9_]+/i.test(merged)) return true;
  if (/한 번에 읽히지 않아 보수적으로 해석될 수 있습니다|추가 확인 포인트로 남을 수 있습니다|더 선명하게 드러날 필요가 있습니다|성과 근거는 더 보강될 여지가 있습니다|현재 문서 기준으로는 이 지점이 추가 확인 포인트로 남을 수 있습니다/.test(body)) return true;
  if (!__hasReviewVerificationTarget(merged)) return true;
  if (!/(확인|구분|직접 증명|면접 확인 질문|검증)/.test(body)) return true;
  return false;
}
function __resolveSupportedReviewEvidence(item, body) {
  const text = __firstSentence(item?.whyItSurfaced);
  if (!__isSafeVisibleWhyText(text)) return null;
  if (__isNearDuplicateText(text, body)) return null;
  if (/적합도|연결성|핵심 역량|전략성|경영 근거/.test(text) && !/성과|범위|도구|JD|직접|도메인|책임/.test(text)) return null;
  return text;
}

function __resolveSupportedReviewSuggestion(item, body, seenSuggestions) {
  const text = __firstSentence(item?.reviewSuggestion);
  if (!__isSafeVisibleWhyText(text)) return null;
  if (__isNearDuplicateText(text, body)) return null;
  if (seenSuggestions.some((line) => __isNearDuplicateText(line, text))) return null;
  return text;
}

function __resolveSupportedReviewBody(item, label) {
  const base = __firstSentence(item?.whyItSurfaced);
  if (__isSafeVisibleWhyText(base) && !/검토가 필요합니다$/.test(base)) return base;
  const fallback = {
    "JD 직접 연결 근거": "이 지점은 추가 확인이 필요합니다.",
    "책임 범위": "면접에서 직접 확인해볼 필요가 있습니다.",
    "도메인 직접성 근거": "현재 문서만으로는 단정하기 어려워 추가 검토가 필요합니다.",
    "성과 지표 근거": "면접에서 직접 확인해볼 필요가 있습니다.",
    "검토 포인트": "이 지점은 추가 확인이 필요합니다.",
  };
  return fallback[label] || fallback["검토 포인트"];
}

// Phase 14-12: topRiskSurface added — enables upstream relation-aware ranking and synthesis
function __resolveSupportedReviewCards(surface, heroLines, whyLines, topRiskSurface) {
  const items = __arr(surface?.structured?.items);
  const visibleHeroLines = __arr(heroLines).map(__txt).filter(Boolean);
  const visibleWhyLines = __arr(whyLines).map(__txt).filter(Boolean);
  const whyBodyText = visibleWhyLines.join(" ");
  const seenSuggestions = [];
  const ownerCandidates = items
    .map((item) => {
      const label = __resolveSupportedReviewLabel(item);
      const body = __resolveSupportedReviewBody(item, label);
      const evidence = __resolveSupportedReviewEvidence(item, body);
      const suggestion = __resolveSupportedReviewSuggestion(item, body, seenSuggestions);
      return { id: item.id, label, body, evidence, suggestion, riskFamily: item.riskFamily, sourceFamily: item.sourceFamily, __synthetic: false };
    })
    .filter((card) => card.label && card.body)
    .map((card) => ({
      ...card,
      __stem: __resolveSupportedReviewStem(card),
      __headlineNorm: __normDedupeText(card.label),
      __bodyNorm: __normDedupeText(__firstSentence(card.body) || card.body),
      __score: __supportedReviewValueScore(card),
      __tier: __classifyReviewCardTier(card, topRiskSurface),
    }));
  const syntheticCandidates = __synthesizeUpstreamReviewCandidates(topRiskSurface)
    .map((card) => ({
      ...card,
      __stem: __resolveSupportedReviewStem(card),
      __headlineNorm: __normDedupeText(card.label),
      __bodyNorm: __normDedupeText(__firstSentence(card.body) || card.body),
      __score: __supportedReviewValueScore(card),
      __tier: __classifyReviewCardTier(card, topRiskSurface),
    }));
  const allCandidates = [...syntheticCandidates, ...ownerCandidates]
    .sort((a, b) => {
      const tierDiff = (a.__tier || 9) - (b.__tier || 9);
      return tierDiff !== 0 ? tierDiff : (b.__score || 0) - (a.__score || 0);
    });
  const seenLabels = new Set();
  const seenBodies = [];
  const seenStems = new Set();
  const deduped = allCandidates
    .filter((card) => {
      if (seenLabels.has(card.__headlineNorm)) return false;
      if (seenBodies.some((line) => __isNearDuplicateText(line, card.__bodyNorm))) return false;
      if (card.__stem !== "generic" && seenStems.has(card.__stem)) return false;
      seenLabels.add(card.__headlineNorm);
      seenBodies.push(card.__bodyNorm);
      if (card.__stem !== "generic") seenStems.add(card.__stem);
      return true;
    });
  const finalCards = deduped
    .filter((card) => {
      if (__isRejectableReviewCard(card, whyBodyText)) return false;
      if (visibleHeroLines.some((line) => __isNearDuplicateText(line, card.body))) return false;
      // Phase 14-14: per-line Why near-dup suppression (joined whyBodyText misses wrapped substring matches)
      if (visibleWhyLines.some((line) => line.length >= 12 && __isNearDuplicateText(card.body, line))) return false;
      if (card.__tier === 9 && !__hasReviewVerificationTarget(card.body)) return false;
      if (card.suggestion) seenSuggestions.push(card.suggestion);
      return true;
    })
    .slice(0, 3)
    .map(({ __score, __stem, __headlineNorm, __bodyNorm, __tier, ...card }) => ({
      ...card,
      label: __visibleSafeKoreanText(card.label, "추가 확인 포인트"),
      body: __visibleSafeKoreanText(card.body, "면접에서 직접 확인해볼 필요가 있습니다."),
    }))
    .filter((card) => !__isRawInternalVisibleToken(card.label) && !__isRawInternalVisibleToken(card.body))
    .filter((card) => !__isNearDuplicateText(card.label, card.body));
  return finalCards.some((card) => !__isWeakGenericRemnantText(card.body)) ? finalCards : [];
}

function SupportedReviewPoints({ surface, heroLines = [], whyLines = [], topRiskSurface = null }) {
  const cards = __resolveSupportedReviewCards(surface, heroLines, whyLines, topRiskSurface)
    .filter((card) => {
      const merged = [card.body, card.evidence, card.suggestion].filter(Boolean).join(" ");
      if (__isWeakGenericRemnantText(card.body) && !card.evidence && !card.suggestion) return false;
      if (!__hasSpecificSurfaceSignal(merged) && [card.evidence, card.suggestion].filter(Boolean).length === 0) return false;
      return true;
    });
  if (cards.length < 1) return null;
  return (
    <div className={`grid gap-3 ${cards.length >= 3 ? "lg:grid-cols-3" : cards.length === 2 ? "lg:grid-cols-2" : ""}`}>
      {cards.map((card, index) => (
        <div key={card.id || `review-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="text-sm font-semibold text-slate-900">{card.label}</div>
          <p className="mt-2 text-sm leading-6 text-slate-700">{card.body}</p>
          {card.evidence ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.evidence}</p>
          ) : null}
          {card.suggestion ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">{card.suggestion}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// Phase 14-14: grounding-row tier classification (lower = higher evidence-comparison priority)
function __classifyGroundingRowTier(row) {
  const pt = __txt(row?.provenanceTier) || "";
  if (pt === "top1_req_proof") return 1;        // REQUIREMENT_PROOF_COMPARISON
  if (pt === "top1_direct_evidence") return 2;  // DIRECT_EVIDENCE_CUE
  if (pt === "direct_proof" || pt === "candidate_proof") return 3;  // SOURCE-AWARE EVIDENCE
  if (pt === "contextual_support") return 4;    // COARSE BUT TRUE fallback
  if (pt === "diagnostic_fallback") return 5;   // existing owner row (low priority)
  return 6;
}
// Phase 14-14: reject grounding rows that are generic/metadata/non-comparison
function __isRejectableGroundingRow(row, overlapLines) {
  const note = __txt(row.note) || "";
  if (!note || note === "-") return true;
  // Reject known template non-comparison notes
  if (/^JD와 이력서 양쪽에서 직접 확인 가능한 포인트입니다\.?$/.test(note.trim())) return true;
  if (/^interaction decision 기반 fallback row입니다\.?$/.test(note.trim())) return true;
  if (/^candidate axis pack 기반 연결 구조입니다\.?$/.test(note.trim())) return true;
  if (/^career accumulation assembly 기반 비교입니다\.?$/.test(note.trim())) return true;
  if (/^범위\/레벨 정합성을 비교하는 데 사용된 구조 신호입니다\.?$/.test(note.trim())) return true;
  // Reject internal metadata notes (e.g. "decision status: ready", "family distance: distant_family")
  if (/^(decision status|family distance):\s*[a-zA-Z_]+$/.test(note.trim())) return true;
  // Require at least one concrete comparison signal
  const hasComparisonSignal = /대비|비교|차이|격차|부족|수준|충족|확인|직접|근거|JD|요구|증거|축|수행/.test(note);
  if (!hasComparisonSignal) return true;
  // Reject near-duplicate of Why/Why+Review overlap
  if (__isMostlyDuplicateOfLines(note, overlapLines)) return true;
  return false;
}
function __isSubstantialGroundingRow(row) {
  const hasMeaningfulJD = !!row.jdExpects;
  const hasMeaningfulResume = !!row.resumeShows;
  const hasMeaningfulNote = !!row.note && !/^직접 비교 근거/.test(row.note);
  return [hasMeaningfulJD, hasMeaningfulResume, hasMeaningfulNote].filter(Boolean).length >= 2;
}
function __isPlaceholderGroundingText(value) {
  const text = __txt(value);
  if (!text) return true;
  return /^(?:-|—|N\/A|n\/a|none|null|unknown|unavailable|비교 불가|정보 부족|해석 필요|직접 비교 근거는 아직 제한적입니다\.?)$/i.test(text);
}
function __safeGroundingComparisonLabel(value) {
  const text = __txt(value);
  if (!text) return "";
  const mapped = {
    "career continuity": "경력 연속성",
    "interaction decision": "상호작용 판단",
  }[text.toLowerCase()] || null;
  if (mapped) return mapped;
  const safe = __visibleSafeKoreanText(text, "");
  if (!safe || __isPlaceholderGroundingText(safe) || __isRawInternalVisibleToken(safe)) return "";
  if (/^[a-z][a-z0-9-]{2,}$/i.test(safe)) return "";
  return safe;
}
function __safeGroundingCellText(value) {
  const text = __txt(value);
  if (!text) return "";
  if (/^(report_v2|sourcefamily|evidencestate|provenancetier|candidatefamilykeys|emittedfamilykeys|suppressedfamilykeys)$/i.test(text)) return "";
  if (/^[a-z]+(?:_[a-z0-9]+){1,}$/i.test(text)) return "";
  if (/^[a-z]+(?:[A-Z][a-z0-9]+){1,}$/i.test(text) && !/^(PowerBI)$/i.test(text)) return "";
  if (/(_id|family_id|canonical_id|ontology_path)$/i.test(text)) return "";
  if (/sourceFamily|provenance|diagnostic|canonical id|ontology path|debug/i.test(text)) return "";
  if (__isPlaceholderGroundingText(text)) return "";
  if (/^[a-z][a-z0-9-]{2,}$/i.test(text) && !/(sql|excel|power bi|sap|crm|kpi|okr)/i.test(text)) return "";
  const safe = __visibleSafeKoreanText(text, "");
  if (safe) return safe;
  if (/[가-힣]/.test(text) || /\d/.test(text) || /[/:,+()]/.test(text)) return text;
  return "";
}
function EvidenceGrounding({ surface, overlapLines = [] }) {
  const rows = __arr(surface?.structured?.rows)
    .map((row) => ({
      comparisonItem: __safeGroundingComparisonLabel(row?.comparisonItem),
      jdExpects: __safeGroundingCellText(row?.jdExpects),
      resumeShows: __safeGroundingCellText(row?.resumeShows),
      note: __normalizeVisibleTone(__safeGroundingCellText(row?.note), row?.confidence),
      confidence: __confidenceLabel(__txt(row?.confidence)) || ({
        confirmed: "높음",
        likely: "비교적 높음",
        weak_evidence: "제한적",
        disputed: "엇갈림",
        overridden: "예외 처리됨",
      }[__txt(row?.confidence)] || "제한적"),
      provenanceTier: row?.provenanceTier,
    }))
    .filter((row) => row.comparisonItem || row.jdExpects || row.resumeShows || row.note);
  // Phase 14-14: sort rows by evidence-comparison tier before filtering
  const sortedRows = [...rows].sort((a, b) => __classifyGroundingRowTier(a) - __classifyGroundingRowTier(b));
  const substantialRows = sortedRows
    .filter(__isSubstantialGroundingRow)
    .filter((row) => __hasRequirementProofRelation(row))
    .filter((row) => !__isRejectableGroundingRow(row, overlapLines))
    .filter((row) => !__isWeakGenericRemnantText(row.note) || (row.jdExpects && row.resumeShows))
    .filter((row) => !__isRawInternalVisibleToken([row.comparisonItem, row.jdExpects, row.resumeShows, row.note].filter(Boolean).join(" ")))
    .filter((row, index, arr) => arr.findIndex((entry) => (
      __isNearDuplicateText(entry.comparisonItem, row.comparisonItem)
      && __isNearDuplicateText(entry.note, row.note)
    )) === index);
  // Phase 14-14: hide if no row is materially grounding-like (comparison-oriented, non-generic)
  if (substantialRows.length === 0) return null;
  if (!substantialRows.some((row) => __classifyGroundingRowTier(row) <= 4)) return null;
  return (
    <div className="space-y-3">
      {substantialRows.map((row, index) => (
        <div key={`${row.comparisonItem || "evidence"}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,120px)_minmax(0,1fr)]">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">비교 항목</div>
            <div className="text-sm font-semibold text-slate-900">{__txt(row.comparisonItem)}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">JD 요건</div>
            <div className="text-sm text-slate-700">{__txt(row.jdExpects)}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">이력서 내용</div>
            <div className="text-sm text-slate-700">{__txt(row.resumeShows)}</div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">해석 노트</div>
            <div className="text-sm text-slate-700">{__txt(row.note)}</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500">
            <span>신뢰도: {__txt(row.confidence)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Phase 14 Slice 4: Action Response helpers (pure, consumer-only)
function __getActionPriority(item, mode) {
  const j = item?.judgment || item?.actionKey || "";
  const maps = {
    mode_a: { achievementProof: 0, expressionGap: 1, interviewReadRisk: 2, toolProof: 3 },
    mode_b: { targetRoleFit: 0, ownershipDepth: 1, achievementProof: 2, expressionGap: 3 },
    mode_c: { industryContinuity: 0, levelPositionFit: 1, expressionGap: 2, interviewReadRisk: 3 },
    mode_d: { targetRoleFit: 0, evidenceDensity: 1, ownershipDepth: 2, interviewReadRisk: 3 },
  };
  const defaultMap = { expressionGap: 0, achievementProof: 1 };
  const map = maps[mode] || defaultMap;
  return j in map ? map[j] : 9;
}
function __resolveActionResponseView(surface, mode) {
  const items = __arr(surface?.structured?.items);
  const GENERIC_ACTION = new Set(["보완 필요", "설명 준비 포인트"]);
  const __resolveRawText = (item) =>
    __txt(item?.text) || __txt(item?.actionText) || __txt(item?.label) || __txt(item?.title) || __txt(item?.summary) || "";
  const filtered = items.filter((item) => !GENERIC_ACTION.has(__resolveRawText(item).trim()));
  const sorted = filtered
    .map((item, i) => ({ item, score: __getActionPriority(item, mode), i }))
    .sort((a, b) => a.score !== b.score ? a.score - b.score : a.i - b.i)
    .map(({ item }) => item);
  return { primary: sorted[0] || null, secondary: sorted.slice(1) };
}
function __resolveActionItemCopy(item, mode) {
  const jLabelMap = {
    targetRoleFit: "직무 적합성",
    industryContinuity: "도메인 연속성",
    levelPositionFit: "레벨 포지션",
    evidenceDensity: "증빙 밀도",
    ownershipDepth: "오너십 깊이",
    achievementProof: "성과 증빙",
    toolProof: "도구 증빙",
    transitionReadiness: "전환 준비",
    interviewReadRisk: "면접 리스크",
    expressionGap: "표현 개선",
    // action category keys
    prepare_interview_answer: "면접 답변 준비",
    strengthen_directness_proof: "직무 직접성 보강",
    clarify_scope: "책임 범위 명확화",
    translate_domain_context: "도메인 맥락 설명",
    evidence_upgrade: "증빙 보강",
  };
  const j = item?.judgment || item?.actionKey || item?.category || "";
  const label = (j && jLabelMap[j]) || __txt(item?.label) || __txt(item?.title) || null;
  const text = __txt(item?.text) || __txt(item?.actionText) || __txt(item?.instruction) || __txt(item?.label) || __txt(item?.title) || __txt(item?.summary) || null;
  return { label, text };
}

function ActionResponse({ surface, resolvedView, mode, overlapLines = [] }) {
  const primary = resolvedView ? resolvedView.primary : (__arr(surface?.structured?.items)[0] || null);
  const secondary = resolvedView ? resolvedView.secondary : __arr(surface?.structured?.items).slice(1, 4);
  const all = [primary, ...secondary].filter(Boolean);
  const __surfaceStatus = __txt(surface?.status) || "";
  // Phase 14: hide section when no items, or all items are label-only with no meaningful body
  if (all.length === 0) return null;
  const visibleItems = all.map((item) => {
    const copy = __resolveActionItemCopy(item, mode);
    const textValue = __normalizeVisibleTone(copy.text, __surfaceStatus);
    return {
      item,
      copy,
      textValue,
      resolvedLabel: copy.label || null,
    };
  }).filter(({ copy, textValue, resolvedLabel }) => (
    textValue
    && !__isNearDuplicateText(textValue, resolvedLabel || "")
    && __isMaterialActionText(textValue)
    && !__isMostlyDuplicateOfLines(textValue, overlapLines)
  )).filter(({ textValue }, index, arr) => arr.findIndex((entry) => __isNearDuplicateText(entry.textValue, textValue)) === index);
  if (visibleItems.length === 0) return null;
  return (
    <div className="space-y-3">
      {visibleItems.slice(0, 4).map(({ item, copy, textValue, resolvedLabel }, index) => {
        const finalLabel = resolvedLabel || (index === 0 ? "우선 준비할 설명" : "추가 준비 포인트");
        const isDupText = textValue && __isNearDuplicateText(textValue, finalLabel);
        return (
          <div key={`${item.judgment || item.category || "action"}-${index}`} className={`rounded-xl border px-4 py-3 ${index === 0 ? "border-sky-200 bg-sky-50/70" : "border-sky-200 bg-sky-50/50"}`}>
            <div className="text-sm font-semibold text-slate-900">
              {finalLabel}
            </div>
            {copy.text && !isDupText ? (
              <p className="mt-2 text-sm leading-6 text-slate-700">{textValue}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function ReportV2Container({ simVM }) {
  const vm = (simVM && typeof simVM === "object") ? simVM : {};
  const reportV2 = (vm?.reportV2 && typeof vm.reportV2 === "object") ? vm.reportV2 : null;
  const [riskDetailOpen, setRiskDetailOpen] = useState(false);
  const [riskDetailIdx, setRiskDetailIdx] = useState(0);
  const [typeDetailOpen, setTypeDetailOpen] = useState(false);

  if (!reportV2) {
    return (
      <Card className="rounded-2xl border bg-white/80 shadow-sm backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">분석 결과</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            reportV2 데이터가 생성되지 않았습니다.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Slice C: topRiskRead caller-side full-hide ??evaluate final visible body from surface data
  const __isHRCsliceC = (s) => !!s && !/^[a-z_]+$/.test(s) && !s.startsWith("report_v2");
  const __trStatus = __txt(reportV2.topRiskRead?.status) || "unavailable";
  const __topRiskHasContent = __trStatus === "unavailable" || __trStatus === "partial" || __trStatus === "provisional"
    || __isHRCsliceC(__txt(reportV2.topRiskRead?.structured?.headline))
    || __isHRCsliceC(__txt(reportV2.topRiskRead?.text?.headline))
    || __isHRCsliceC(__txt(reportV2.topRiskRead?.structured?.postureSummary))
    || __isHRCsliceC(__txt(reportV2.topRiskRead?.text?.posture));

  // Phase 14 Slice 1: personalization mode + top reading slot resolution
  const __p14Top3 = Array.isArray(vm.top3) ? vm.top3 : [];
  const __personMode = __derivePersonalizationMode(reportV2, __p14Top3);
  const __riskOwnerItems = Array.isArray(reportV2.topRiskRead?.structured?.items) ? reportV2.topRiskRead.structured.items : [];
  const __p14OrderedRiskItems = __resolveTopRiskOrder(reportV2, __riskOwnerItems, __personMode);
  const __p14ProofView = __resolveProofSummaryView(reportV2.proofSummaryV2, __personMode);
  const __p14ActionView = __resolveActionResponseView(reportV2.actionResponse, __personMode);
  const __p14CareerFlowView = __resolveCareerFlowView(reportV2.careerContext, __personMode);
  const __p14TypeReadView = __resolveTypeReadView(reportV2.typeReadV2, __personMode);

  // Phase 14 Slice 9: copy mode lock (evidence / action / flow / type)
  const __p14ProofViewCopyLocked = __applyCopyModeToView(__p14ProofView, "evidence") || __p14ProofView;
  const __p14ActionViewCopyLocked = __applyCopyModeToView(__p14ActionView, "action") || __p14ActionView;
  const __p14CareerFlowViewCopyLocked = __applyCopyModeToView(__p14CareerFlowView, "flow") || __p14CareerFlowView;
  const __p14TypeReadViewCopyLocked = __applyCopyModeToView(__p14TypeReadView, "type") || __p14TypeReadView;

  // Phase 14 Slice 8: surface ownership filter (Proof ??Action ??CareerFlow ??TypeRead)
  const __filterByBucket = (items, ownedBucket, resolver, fallback) => {
    const filtered = items.filter((item) => {
      const t = resolver(item)?.text || "";
      return __getOwnershipBucket(t) === ownedBucket;
    });
    return filtered.length > 0 ? filtered : null;
  };
  const __p14ProofViewOwned = (() => {
    const src = __p14ProofViewCopyLocked || __p14ProofView;
    if (!src) return src;
    const rS = (item) => __resolveProofItemCopy(item, "strengths", __personMode);
    const rM = (item) => __resolveProofItemCopy(item, "missing", __personMode);
    const strengths = __filterByBucket(__arr(src.strengths), "proof", rS, null) || __arr(src.strengths);
    const missing = __filterByBucket(__arr(src.missing), "proof", rM, null) || __arr(src.missing);
    if (strengths.length === 0 && missing.length === 0) return src;
    return { strengths, missing };
  })();
  const __p14ActionViewOwned = (() => {
    const src = __p14ActionViewCopyLocked || __p14ActionView;
    if (!src) return src;
    const r = (item) => __resolveActionItemCopy(item, __personMode);
    const all = [src.primary, ...__arr(src.secondary)].filter(Boolean);
    const survived = __filterByBucket(all, "action", r, null) || all;
    if (survived.length === 0) return src;
    return { primary: survived[0], secondary: survived.slice(1) };
  })();
  const __p14CareerFlowViewOwned = (() => {
    const src = __p14CareerFlowViewCopyLocked || __p14CareerFlowView;
    if (!src) return src;
    const r = (item) => __resolveCareerFlowCopy(item, __personMode);
    const all = [src.primary, ...__arr(src.secondary)].filter(Boolean);
    const survived = __filterByBucket(all, "flow", r, null) || all;
    if (survived.length === 0) return src;
    return { primary: survived[0], secondary: survived.slice(1) };
  })();
  const __p14TypeReadViewOwned = (() => {
    const src = __p14TypeReadViewCopyLocked || __p14TypeReadView;
    if (!src) return src;
    const r = (item) => __resolveTypeReadCopy(item, __personMode);
    const all = [src.primary, ...__arr(src.secondary)].filter(Boolean);
    const survived = __filterByBucket(all, "type", r, null) || all;
    if (survived.length === 0) return src;
    return { primary: survived[0], secondary: survived.slice(1) };
  })();

  // Phase 14 Slice 7: cross-surface dedupe pipeline (Proof ??Action ??CareerFlow ??TypeRead)
  const __seen = [];
  // 1. Proof Summary: self-dedupe within strengths and missing arrays
  const __p14ProofViewDedupe = (() => {
    if (!__p14ProofViewOwned) return __p14ProofView;
    const tagItems = (arr) => arr.map((item) => ({ ...item, __dedupeText: __resolveProofItemCopy(item, "strengths", __personMode).text }));
    const dedupeArr = (arr) => {
      const tagged = tagItems(arr);
      const result = __dedupeOrderedItems(tagged, __seen);
      result.forEach((item) => { const t = __normDedupeText(item.__dedupeText); if (t) __seen.push(t); });
      return result;
    };
    const strengths = dedupeArr(__arr(__p14ProofViewOwned.strengths));
    const missing = dedupeArr(__arr(__p14ProofViewOwned.missing));
    if (strengths.length === 0 && missing.length === 0) return __p14ProofViewOwned;
    return { strengths, missing };
  })();
  // 2. Action Response: dedupe against accumulated seen (Proof Summary)
  const __p14ActionViewDedupe = (() => {
    if (!__p14ActionViewOwned) return __p14ActionView;
    const tag = (item) => item ? { ...item, __dedupeText: __resolveActionItemCopy(item, __personMode).text } : null;
    const taggedAll = [tag(__p14ActionViewOwned.primary), ...__arr(__p14ActionViewOwned.secondary).map(tag)].filter(Boolean);
    const survived = __dedupeOrderedItems(taggedAll, __seen);
    survived.forEach((item) => { const t = __normDedupeText(item.__dedupeText); if (t) __seen.push(t); });
    if (survived.length === 0) return __p14ActionViewOwned;
    return { primary: survived[0], secondary: survived.slice(1) };
  })();
  // 3. Career Flow: dedupe against accumulated seen (Proof + Action)
  const __p14CareerFlowViewDedupe = (() => {
    if (!__p14CareerFlowViewOwned) return __p14CareerFlowView;
    const tag = (item) => item ? { ...item, __dedupeText: __resolveCareerFlowCopy(item, __personMode).text } : null;
    const taggedAll = [tag(__p14CareerFlowViewOwned.primary), ...__arr(__p14CareerFlowViewOwned.secondary).map(tag)].filter(Boolean);
    const survived = __dedupeOrderedItems(taggedAll, __seen);
    survived.forEach((item) => { const t = __normDedupeText(item.__dedupeText); if (t) __seen.push(t); });
    if (survived.length === 0) return __p14CareerFlowViewOwned;
    return { primary: survived[0], secondary: survived.slice(1) };
  })();
  // 4. Type Read: dedupe against accumulated seen (Proof + Action + CareerFlow)
  const __p14TypeReadViewDedupe = (() => {
    if (!__p14TypeReadViewOwned) return __p14TypeReadView;
    const tag = (item) => item ? { ...item, __dedupeText: __resolveTypeReadCopy(item, __personMode).text } : null;
    const taggedAll = [tag(__p14TypeReadViewOwned.primary), ...__arr(__p14TypeReadViewOwned.secondary).map(tag)].filter(Boolean);
    const survived = __dedupeOrderedItems(taggedAll, __seen);
    if (survived.length === 0) return __p14TypeReadViewOwned;
    return { primary: survived[0], secondary: survived.slice(1) };
  })();
  const __topRiskResolvedBody = __resolveTopRiskBody(reportV2.topRiskRead);
  const __topRiskRationaleLine = __txt(__topRiskSelectionRationale(reportV2.topRiskRead));
  const __topRiskVisibleLines = [
      __txt(reportV2.topRiskRead?.structured?.headline),
      __txt(reportV2.topRiskRead?.text?.headline),
      __topRiskRationaleLine,
      __shouldHideHeroSupportText(__topRiskResolvedBody) ? "" : __topRiskResolvedBody,
    ].filter(Boolean);
  const __whyVisibleLines = __resolveWhyRows(reportV2.whyThisRisk, __topRiskVisibleLines, reportV2.topRiskRead).map((row) => row.sentence);
  const __supportedReviewVisibleLines = __resolveSupportedReviewCards(reportV2.supportedReviewPoints, __topRiskVisibleLines, __whyVisibleLines, reportV2.topRiskRead)
    .flatMap((card) => [card.body, card.evidence, card.suggestion].filter(Boolean));
  const __groundingVisibleLines = __arr(reportV2.evidenceGrounding?.structured?.rows)
    .flatMap((row) => [row?.comparisonItem, row?.jdExpects, row?.resumeShows, row?.note].map(__txt).filter(Boolean));
  const __topReadingVisiblePool = [
    __txt(reportV2.topRiskRead?.structured?.headline),
    __txt(reportV2.topRiskRead?.structured?.postureSummary),
    __txt(reportV2.topRiskRead?.text?.headline),
    __txt(reportV2.topRiskRead?.text?.posture),
  ].filter(Boolean);
  const __primaryRiskItem = __p14OrderedRiskItems[0] || null;
  const __visibleRiskItems = __p14OrderedRiskItems.filter((risk, index) => {
    if (__isWeakSecondaryRiskCandidate(risk, __personMode, __topReadingVisiblePool)) return false;
    if (index === 0) return true;
    return __isMeaningfullyDistinctRisk(risk, __primaryRiskItem, __personMode);
  });
    const __visibleSecondaryRiskItems = __visibleRiskItems
      .filter((risk) => risk !== __primaryRiskItem)
      .filter((risk) => {
        const __resolved = __resolveTopRiskCardCopy(risk, __personMode);
        const __summary = __txt(__resolved.summary);
        if (!__summary) return true;
        if (__isWeakGenericRemnantText(__summary)) return false;
        if (__isMostlyDuplicateOfLines(__summary, [...__topRiskVisibleLines, ...__whyVisibleLines])) return false;
        return true;
      });
    const __hasMaterialVisibleRisk = __visibleRiskItems.length > 0;
    const __hasOnlyWeakRiskSurvivor = __visibleRiskItems.length === 1
      && __isWeakSecondaryRiskCandidate(__visibleRiskItems[0], __personMode, __topReadingVisiblePool);
    const __shouldUseRiskEmptyState = !__hasMaterialVisibleRisk || __hasOnlyWeakRiskSurvivor;
    const __shouldRenderRiskSection = __p14OrderedRiskItems.length > 0 && (__shouldUseRiskEmptyState || __visibleSecondaryRiskItems.length > 0);
  const __shouldRenderCareerContextSection = __shouldRenderCareerContext(
    { ...reportV2.careerContext, riskStatus: reportV2.topRiskRead?.status },
    __p14CareerFlowViewDedupe,
    __personMode,
    reportV2.topRiskRead
  );
  const __sectionVisibility = {
    careerContext: __shouldRenderCareerContextSection,
    proofSummary: false,
    supportedReviewPoints: false,
    evidenceGrounding: false,
    actionResponse: false,
  };

  return (
    <div className="space-y-5" data-report-v2="true">
      {__topRiskHasContent ? (
        <SurfaceShell title="우선 리스크 판단" surface={reportV2.topRiskRead} hero>
          <TopRiskRead surface={reportV2.topRiskRead} />
        </SurfaceShell>
      ) : null}

      {/* Blocker 1 bridge: per-risk clickable detail cards */}
      {__shouldRenderRiskSection ? (
        __shouldUseRiskEmptyState ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            현재 문서에서 즉시 크게 걸리는 리스크는 두드러지지 않습니다. 뚜렷한 감점 요인보다는, 설득력을 더 높일 보완 포인트 정도가 남아 있습니다.
          </div>
        ) : (
        <Card className="rounded-2xl border bg-white/80 shadow-sm backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-slate-900">우선 리스크 항목</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
                {__visibleSecondaryRiskItems.map((risk, idx) => {
                  const __rawId = __txt(risk?.id || risk?.rawId || risk?.code || "");
                  const __riskOrderedIndex = Math.max(0, __p14OrderedRiskItems.findIndex((item) => item === risk));
                  const __resolved = __resolveTopRiskCardCopy(risk, __personMode);
                  const __resolvedSummary = __txt(__resolved.summary);
                  const __visibleSummary = __resolvedSummary && !__topReadingVisiblePool.some((line) => __isNearDuplicateText(__resolvedSummary, line))
                    ? __resolvedSummary
                    : null;
                return (
                  <button
                    key={`risk-detail-${idx}-${__rawId}`}
                    type="button"
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/55 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25"
                      onClick={() => { setRiskDetailIdx(__riskOrderedIndex); setRiskDetailOpen(true); }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                          {idx + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-900">{__resolved.title}</span>
                      </div>
                      {__visibleSummary ? (
                        <div className="mt-1 pl-7 text-xs leading-5 text-slate-500">{__normalizeVisibleTone(__visibleSummary, reportV2.topRiskRead?.status)}</div>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-indigo-600">상세보기</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )
      ) : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <SurfaceShell title="역할 판단" surface={reportV2.typeReadV2}>
          <TypeReadV2 surface={{ ...reportV2.typeReadV2, riskStatus: reportV2.topRiskRead?.status, heroLines: __topRiskVisibleLines, whyLines: __whyVisibleLines, topRiskSurface: reportV2.topRiskRead }} resolvedView={__p14TypeReadViewDedupe} mode={__personMode} onDetailClick={() => setTypeDetailOpen(true)} />
          </SurfaceShell>
        {__sectionVisibility.proofSummary ? (
          <SurfaceShell title="증빙 요약" surface={reportV2.proofSummaryV2}>
            <ProofSummaryV2 surface={reportV2.proofSummaryV2} resolvedView={__p14ProofViewDedupe} mode={__personMode} />
          </SurfaceShell>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <SurfaceShell title="리스크 발생 원인" surface={reportV2.whyThisRisk}>
          <WhyThisRisk
            surface={reportV2.whyThisRisk}
            heroLines={__topRiskVisibleLines}
            riskSurface={reportV2.topRiskRead}
          />
        </SurfaceShell>

        {__sectionVisibility.careerContext ? (
          <SurfaceShell title="경력 맥락" surface={reportV2.careerContext}>
            <CareerContext surface={{ ...reportV2.careerContext, riskStatus: reportV2.topRiskRead?.status }} resolvedView={__p14CareerFlowViewDedupe} mode={__personMode} heroLines={__topRiskVisibleLines} whyLines={__whyVisibleLines} />
          </SurfaceShell>
        ) : null}
      </div>

      {__sectionVisibility.supportedReviewPoints ? (
        <SurfaceShell title="검토 포인트" surface={reportV2.supportedReviewPoints}>
          <SupportedReviewPoints
            surface={reportV2.supportedReviewPoints}
            heroLines={__topRiskVisibleLines}
            whyLines={__whyVisibleLines}
            topRiskSurface={reportV2.topRiskRead}
          />
        </SurfaceShell>
      ) : null}

      {__sectionVisibility.evidenceGrounding ? (
        <div className="mt-4">
          <SurfaceShell title="증거 기반 비교" surface={reportV2.evidenceGrounding}>
            <EvidenceGrounding surface={reportV2.evidenceGrounding} overlapLines={[...__topRiskVisibleLines, ...__whyVisibleLines, ...__supportedReviewVisibleLines]} />
          </SurfaceShell>
        </div>
      ) : null}

      {__sectionVisibility.actionResponse ? (
        <SurfaceShell title="면접 대응 방향" surface={reportV2.actionResponse}>
          <ActionResponse surface={reportV2.actionResponse} resolvedView={__p14ActionViewDedupe} mode={__personMode} overlapLines={[...__topRiskVisibleLines, ...__whyVisibleLines, ...__supportedReviewVisibleLines, ...__groundingVisibleLines]} />
        </SurfaceShell>
      ) : null}

      {/* Blocker 2 bridge: type detail modal */}
      {typeDetailOpen ? (() => {
        const payload = __buildTypeDetailPayload({ ...reportV2.typeReadV2, topRiskSurface: reportV2.topRiskRead, heroLines: __topRiskVisibleLines, whyLines: __whyVisibleLines });
        return payload ? (
          <TypeDetailSheet payload={payload} onClose={() => setTypeDetailOpen(false)} />
        ) : null;
      })() : null}

      {/* Blocker 1 bridge: risk detail modal */}
      {riskDetailOpen ? (() => {
        const selectedRisk = __visibleRiskItems[riskDetailIdx] || null;
        const payload = selectedRisk ? __buildRiskDetailPayload(selectedRisk) : null;
        return payload ? (
          <RiskDetailSheet payload={payload} onClose={() => setRiskDetailOpen(false)} />
        ) : null;
      })() : null}
    </div>
  );
}
