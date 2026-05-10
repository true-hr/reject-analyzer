import React, { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Download, Loader2, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UploadPanel from "../upload/UploadPanel.jsx";

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickFirstText(...values) {
  for (const value of values) {
    const text = toText(value);
    if (text) return text;
  }
  return "";
}

function uniqueTexts(values) {
  const seen = new Set();
  const out = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = toText(value);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function isRenderableRisk(candidate) {
  if (!candidate || typeof candidate !== "object") return false;

  if (candidate.triggered === true) return true;
  if (candidate.gateTriggered === true) return true;

  const severity = toText(candidate.severity).toLowerCase();
  if (severity && severity !== "none") return true;

  const gateLikeLayer = toText(candidate.layer).toLowerCase();
  const gateLikeGroup = toText(candidate.group).toLowerCase();
  if (gateLikeLayer === "gate" || gateLikeGroup === "gate" || gateLikeGroup === "gates") return true;

  const key = toText(candidate.key) || toText(candidate.id);
  return key === "must_requirements_gap" || key === "experience_level_gap";
}

function normalizeRiskCandidate(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const title = pickFirstText(candidate.title, candidate.label, candidate.name, candidate.id, candidate.key);
  const canonicalCard = candidate?.canonicalCard && typeof candidate.canonicalCard === "object"
    ? candidate.canonicalCard
    : null;
  const summaryText = pickFirstText(
    candidate.summaryText,
    canonicalCard?.summary,
    candidate.summary,
    candidate.oneLiner,
    candidate.reasonShort,
    candidate.description,
    candidate.userReason,
    candidate.interviewerView,
    title
  );
  const detailText = pickFirstText(
    candidate.detailText,
    candidate.reason,
    candidate.note,
    candidate.explain?.title
  );
  const evidence = [
    ...toList(candidate.evidence),
    ...toList(candidate.explain?.evidence),
    ...toList(candidate.jdEvidence),
    ...toList(candidate.resumeEvidence),
    ...toList(candidate.explain?.jdEvidence),
    ...toList(candidate.explain?.resumeEvidence),
  ].map((item) => String(item)).filter(Boolean);
  const category = toText(candidate.category) || "";
  const key = toText(candidate.key) || toText(candidate.id) || "";

  if (!isRenderableRisk(candidate)) return null;
  if (!title || !summaryText) return null;

  return {
    key: key || title,
    title,
    summaryText,
    detailText,
    evidence,
    category,
  };
}

function pickPreciseRisk({ analysis, debugRisk, key }) {
  const reportRiskResults = Array.isArray(analysis?.reportPack?.decisionPack?.riskResults)
    ? analysis.reportPack.decisionPack.riskResults
    : [];
  const decisionRiskResults = Array.isArray(analysis?.decisionPack?.riskResults)
    ? analysis.decisionPack.riskResults
    : [];
  const fromRiskResults = [...reportRiskResults, ...decisionRiskResults].find((item) => {
    const itemKey = toText(item?.key) || toText(item?.id);
    return itemKey === key;
  });

  return normalizeRiskCandidate(fromRiskResults) || normalizeRiskCandidate(debugRisk);
}

function getPreciseRiskRecord(analysis, key) {
  const reportRiskResults = Array.isArray(analysis?.reportPack?.decisionPack?.riskResults)
    ? analysis.reportPack.decisionPack.riskResults
    : [];
  const decisionRiskResults = Array.isArray(analysis?.decisionPack?.riskResults)
    ? analysis.decisionPack.riskResults
    : [];
  return [...reportRiskResults, ...decisionRiskResults].find((item) => {
    const itemKey = toText(item?.key) || toText(item?.id);
    return itemKey === key;
  }) || null;
}

function formatPeriodLabel(period) {
  if (!period || typeof period !== "object") return "";
  const from = toText(period.from).replace("-", ".");
  const to = toText(period.to).replace("-", ".");
  if (from && to) return `${from} ~ ${to}`;
  if (from) return `${from} ~`;
  if (to) return `~ ${to}`;
  return "";
}

function formatYearsLabel(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return String(Math.round(value * 10) / 10).replace(/\.0$/, "");
}

// ── composite band → UI 스타일/문구 매핑 ──────────────────────────────────
const BAND_UI = {
  high_risk: {
    label:      "서류 통과를 막을 수 있는 리스크가 확인됐어요",
    badgeText:  "핵심 리스크",
    wrapClass:  "rounded-[24px] border border-red-200/80 bg-red-50/60 px-5 py-5",
    badgeClass: "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700",
  },
  warning: {
    label:      "몇 가지 보완이 필요한 지점이 보여요",
    badgeText:  "보완 필요",
    wrapClass:  "rounded-[24px] border border-amber-200/80 bg-amber-50/60 px-5 py-5",
    badgeClass: "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700",
  },
  caution: {
    label:      "치명적인 리스크는 적지만 함께 점검할 항목이 있어요",
    badgeText:  "경미한 리스크",
    wrapClass:  "rounded-[24px] border border-blue-200/80 bg-blue-50/60 px-5 py-5",
    badgeClass: "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700",
  },
  pass: {
    label:      "이력서에서 큰 리스크는 확인되지 않았어요",
    badgeText:  "리스크 없음",
    wrapClass:  "rounded-[24px] border border-green-200/80 bg-green-50/60 px-5 py-5",
    badgeClass: "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700",
  },
};

const SEVERITY_BADGE = {
  critical: { cls: "bg-red-100 text-red-700",       text: "매우 심각" },
  high:     { cls: "bg-orange-100 text-orange-700",  text: "높음"     },
  medium:   { cls: "bg-amber-100 text-amber-700",    text: "보통"     },
  low:      { cls: "bg-slate-100 text-slate-600",    text: "낮음"     },
};

function SectionIntro({ label, title, description }) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="space-y-1.5">
        <div className="text-lg font-semibold tracking-tight text-slate-950">{title}</div>
        <p className="text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

const INSUF_HELP = {
  experience_level_gap: {
    hint: "기간이 보이게 적어주시면 더 정확히 볼 수 있어요.",
    title: "어떤 정보를 넣으면 되나요?",
    body: "아래처럼 기간이 보이게 적어주시면 더 정확히 볼 수 있어요.",
    examples: [
      "2019.03 ~ 2021.06 A사 사업운영",
      "2021.07 ~ 2024.02 B사 운영기획",
      "총 경력 4년 11개월",
      "운영 관련 경력 3년 이상",
    ],
    note: "회사명만 적기보다 시작/종료 시점이 함께 보이게 적어주시는 게 중요해요.",
  },
  achievement_evidence_gap: {
    hint: "내가 만든 변화나 결과가 드러나면 더 정확히 볼 수 있어요.",
    title: "어떤 정보를 넣으면 되나요?",
    body: "숫자가 꼭 없어도 괜찮지만, 내가 만든 변화나 결과가 드러나면 더 정확히 볼 수 있어요.",
    examples: [
      "문의 처리 시간을 20% 줄였습니다",
      "운영 정책 문서를 개편했습니다",
      "이슈 대응 프로세스를 표준화했습니다",
      "신규 담당자 온보딩 문서를 정리했습니다",
    ],
    note: "단순 담당 업무만 적기보다, 개선·정리·전환·효율화처럼 결과가 드러나는 표현이 좋습니다.",
  },
  gap_explanation_missing: {
    hint: "현재 입력만으로는 공백이나 이직 패턴을 판단하기 어렵습니다. 재직기간과 공백 사유가 함께 보이면 더 정확히 확인할 수 있어요.",
    title: "어떤 정보를 넣으면 되나요?",
    body: "공백 자체보다, 그 기간을 어떻게 보냈는지가 짧게라도 보이면 더 정확히 판단할 수 있어요.",
    examples: [
      "2023.02 ~ 2023.11 건강 회복 및 재정비",
      "2024년 상반기 이직 준비와 개인 프로젝트 병행",
      "가족 사정으로 잠시 휴식 후 재취업 준비",
    ],
    note: "길게 쓰기보다, 기간과 이유가 함께 보이게 짧게 적는 게 가장 좋습니다.",
  },
};

function buildReportSectionData({ analysis, insufficientKeys, key }) {
  const risk = getPreciseRiskRecord(analysis, key);
  const raw = risk?.raw && typeof risk.raw === "object" ? risk.raw : {};

  // append-only Round 6: gap_explanation_missing이 insufficient-data 상태이면
  // 리스크 카드에서 제외하고 추가정보 섹션에서만 표시 (중복 노출 방지)
  if (
    key === "gap_explanation_missing" &&
    insufficientKeys.has(key) &&
    !risk?.triggered
  ) {
    return null;
  }

  const shouldShow = Boolean(
    (risk && toText(risk.severity).toLowerCase() !== "none") ||
    insufficientKeys.has(key)
  );
  if (!shouldShow) return null;

  if (key === "experience_level_gap") {
    const countedPeriods = Array.isArray(raw.countedPeriods) ? raw.countedPeriods : [];
    const skippedPeriods = Array.isArray(raw.skippedPeriods) ? raw.skippedPeriods : [];
    const reasons = uniqueTexts([
      pickFirstText(risk?.detailText),
      raw.yearsRequiredMin != null ? `JD 기준 최소 연차는 ${raw.yearsRequiredMin}년입니다.` : "",
      countedPeriods.length && raw.totalCareerYears != null
        ? `기간 기준으로 합산 가능한 경력은 약 ${formatYearsLabel(raw.totalCareerYears)}년입니다.`
        : "",
      skippedPeriods.length ? `기간을 셀 수 없는 경력 항목이 ${skippedPeriods.length}개 있습니다.` : "",
    ]);
    const evidenceItems = uniqueTexts(Array.isArray(risk?.evidence) ? risk.evidence : []);
    const positives = uniqueTexts(countedPeriods.map(formatPeriodLabel));
    const gaps = uniqueTexts([
      !countedPeriods.length ? "현재 이력서에서 기간이 명확한 경력을 충분히 찾기 어려웠습니다." : "",
      raw.yearsRequiredMin != null && raw.totalCareerYears != null && raw.totalCareerYears < raw.yearsRequiredMin
        ? `JD 최소 연차 ${raw.yearsRequiredMin}년에 비해 현재 기간 기준 합산 경력은 약 ${formatYearsLabel(raw.totalCareerYears)}년으로 보입니다.`
        : "",
      skippedPeriods.length ? `시작/종료 시점이 함께 보이지 않는 경력 항목이 ${skippedPeriods.length}개 있습니다.` : "",
    ]);
    return {
      key,
      title: "연차/레벨",
      summary: "현재 이력서 기준으로는 JD가 요구하는 연차를 충분히 확인하기 어렵습니다.",
      supportText: "경력 기간 표현이 제한적이면 실제 경력보다 보수적으로 판단될 수 있어요.",
      reasons,
      evidenceItems,
      positivesTitle: "직접 확인된 기간 표현",
      positives,
      gapsTitle: "부족하거나 직접 확인되지 않은 것",
      gaps,
      actionText: "기간이 보이게 적어주시면 더 정확히 볼 수 있어요.",
      helpKey: "experience_level_gap",
    };
  }

  if (key === "gap_explanation_missing") {
    const gapDescriptions = Array.isArray(raw.gapDescriptions) ? raw.gapDescriptions : [];
    const transitionNarratives = Array.isArray(raw.transitionNarratives) ? raw.transitionNarratives : [];
    const explainedItems = uniqueTexts([...gapDescriptions, ...transitionNarratives]);
    const reasons = uniqueTexts([
      pickFirstText(risk?.detailText),
      raw.gapCount ? `이력서 기간 표현 기준으로 공백 추정 구간이 ${raw.gapCount}개 보입니다.` : "",
      raw.maxGapMonths ? `가장 긴 공백 추정 구간은 약 ${raw.maxGapMonths}개월입니다.` : "",
      raw.describedGapCount ? `공백이나 전환 설명으로 잡힌 항목은 ${raw.describedGapCount}개입니다.` : "",
    ]);
    const evidenceItems = uniqueTexts(Array.isArray(risk?.evidence) ? risk.evidence : []);
    const gaps = uniqueTexts([
      raw.describedGapCount === 0 ? "현재 이력서에서 공백 설명을 직접 찾기 어려웠습니다." : "",
      raw.skippedPeriods?.length ? `기간을 계산하기 어려운 경력 항목이 ${raw.skippedPeriods.length}개 있습니다.` : "",
    ]);
    return {
      key,
      title: "공백/이직",
      summary: "현재 이력서 기준으로는 공백 기간과 설명 연결이 충분히 드러나지 않았습니다.",
      supportText: "공백이 있어도 기간과 이유가 함께 보이면 해석이 달라질 수 있어요.",
      reasons,
      evidenceItems,
      positivesTitle: "현재 이력서에서 확인된 설명",
      positives: explainedItems,
      gapsTitle: "부족하거나 직접 확인되지 않은 것",
      gaps,
      actionText: "공백 기간과 이유가 짧게라도 보이면 더 정확히 볼 수 있어요.",
      helpKey: "gap_explanation_missing",
    };
  }

  if (key === "jd_keyword_coverage_gap") {
    const matchedKeywords = Array.isArray(raw.matchedKeywords) ? raw.matchedKeywords : [];
    const missingKeywords = Array.isArray(raw.missingKeywords) ? raw.missingKeywords : [];
    const reasons = uniqueTexts([
      pickFirstText(risk?.detailText),
      raw.domainKeywordCount != null && raw.matchedKeywordCount != null
        ? `JD 핵심 키워드 ${raw.domainKeywordCount}개 중 현재 이력서에서 직접 확인된 키워드는 ${raw.matchedKeywordCount}개입니다.`
        : "",
      raw.keywordCoverageRatio != null
        ? `키워드 반영도는 약 ${Math.round(Number(raw.keywordCoverageRatio || 0) * 100)}%입니다.`
        : "",
    ]);
    const evidenceItems = uniqueTexts(Array.isArray(risk?.evidence) ? risk.evidence : []);
    const gaps = uniqueTexts([
      ...missingKeywords,
      !missingKeywords.length ? "현재 기준에서 추가로 약하게 연결된 키워드는 찾지 못했습니다." : "",
    ]);
    return {
      key,
      title: "JD 키워드 반영 부족",
      summary: "현재 이력서 표현만 기준으로 보면 JD 핵심 키워드 반영도가 높지 않습니다.",
      supportText: "같은 경험이 있어도 JD에서 쓰는 표현과 다르면 연결이 약하게 보일 수 있어요.",
      reasons,
      evidenceItems,
      positivesTitle: "이력서에서 직접 확인된 키워드",
      positives: uniqueTexts(matchedKeywords),
      gapsTitle: "아직 직접 연결이 약한 키워드",
      gaps,
      actionText: "JD에서 쓰는 표현과 실제 수행 경험 문장을 더 직접 연결해 적어주시면 좋습니다.",
      helpKey: "",
    };
  }

  if (key === "must_requirements_gap") {
    const hitItems = Array.isArray(raw.hitItems) ? raw.hitItems : [];
    const missItems = Array.isArray(raw.effectiveMissItems) ? raw.effectiveMissItems : [];
    const reasons = uniqueTexts([
      pickFirstText(risk?.detailText),
      raw.effectiveMustTotal != null && raw.mustHit != null
        ? `JD 필수요건 ${raw.effectiveMustTotal}개 중 현재 이력서에서 직접 연결된 항목은 ${raw.mustHit}개입니다.`
        : "",
      raw.effectiveMustMiss != null && raw.effectiveMustMiss > 0
        ? `직접 연결이 약한 필수요건은 ${raw.effectiveMustMiss}개입니다.`
        : "",
    ]);
    const evidenceItems = uniqueTexts(Array.isArray(risk?.evidence) ? risk.evidence : []);
    return {
      key,
      title: toText(risk?.title) || "필수요건 미충족",
      summary: raw.aiOnlyCriticalGap
        ? (toText(risk?.summaryText) || "지원 직무의 핵심 업무 수행 경험이 이력서에서 충분히 드러나지 않습니다.")
        : "현재 이력서 문구만으로는 JD 필수요건과 직접 연결되는 표현을 충분히 찾지 못했습니다.",
      supportText: "실제 경험이 있더라도 이력서에 드러나지 않으면 누락으로 보일 수 있어요.",
      reasons,
      evidenceItems,
      positivesTitle: "실제로 확인된 표현",
      positivesNote: "이력서에서 직접 연결된 표현만 근거로 잡았습니다.",
      positives: uniqueTexts(hitItems),
      gapsTitle: "직접 확인되지 않은 요구",
      gapsNote: "실제 경험이 있더라도 이력서에 드러나지 않으면 누락으로 보일 수 있어요.",
      gaps: uniqueTexts(missItems),
      actionText: "JD 필수요건과 직접 연결되는 경험 문장을 이력서에 더 분명하게 드러내는 것이 좋습니다.",
      helpKey: "",
    };
  }

  return null;
}

function ReportAnalysisCard({
  item,
  expanded = false,
  onToggle = null,
  helpOpen = false,
  onToggleHelp = null,
}) {
  if (!item) return null;
  const help = item.helpKey ? (INSUF_HELP[item.helpKey] ?? null) : null;
  const hasContent = item.reasons.length || item.evidenceItems.length || item.positives.length || item.gaps.length || item.actionText || help;

  return (
    <Card
      className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-black/[0.04]"
      data-print-card="true"
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="space-y-2">
          <CardTitle className="text-lg leading-snug text-slate-950">{item.title}</CardTitle>
          <p className="text-sm font-semibold leading-6 text-slate-800">{item.summary}</p>
          <p className="text-sm leading-6 text-slate-500">{item.supportText}</p>
        </div>
      </CardHeader>

      {hasContent ? (
        <>
          <CardContent className="pt-0">
            <button
              type="button"
              onClick={onToggle || undefined}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
              aria-expanded={expanded}
            >
              <span className="text-sm font-semibold text-slate-700">{expanded ? "접기" : "상세보기"}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
            </button>
          </CardContent>

          {expanded ? (
            <CardContent className="space-y-4 pt-4">
              {item.reasons.length ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">왜 이렇게 봤는지</div>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                    {item.reasons.map((reason, index) => (
                      <li key={`${item.key}_reason_${index}`} className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.evidenceItems.length ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">실제 근거 표현 / 근거 항목</div>
                  <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                    {item.evidenceItems.map((row, index) => (
                      <li key={`${item.key}_evidence_${index}`} className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3 leading-6">
                        {row}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {item.positives.length ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.positivesTitle}</div>
                  {item.positivesNote ? (
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.positivesNote}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.positives.map((phrase, index) => (
                      <span key={`${item.key}_positive_${index}`} className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.gaps.length ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.gapsTitle}</div>
                  {item.gapsNote ? (
                    <p className="mt-1 text-xs leading-5 text-slate-400">{item.gapsNote}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.gaps.map((phrase, index) => (
                      <span key={`${item.key}_gap_${index}`} className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {item.actionText ? (
                <div className="rounded-2xl border border-sky-200/80 bg-sky-50/60 px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">필요한 경우 어떻게 보완하면 되는지</div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{item.actionText}</p>
                  {help ? (
                    <div className="mt-3 space-y-3">
                      <button
                        type="button"
                        onClick={onToggleHelp || undefined}
                        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                        aria-expanded={helpOpen}
                      >
                        {helpOpen ? "입력 예시 접기" : "입력 예시 보기"}
                      </button>
                      {helpOpen ? (
                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-3">
                          <p className="text-sm font-semibold text-slate-800">{help.title}</p>
                          <p className="text-sm leading-6 text-slate-600">{help.body}</p>
                          <ul className="space-y-1.5">
                            {help.examples.map((example, index) => (
                              <li key={`${item.key}_help_${index}`} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-sm leading-6 text-slate-600">
                                {example}
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs leading-5 text-slate-500">{help.note}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

function ResultRiskCard({ item, expanded = false, onToggle = null }) {
  if (!item) return null;

  const hasDetails = Boolean(item.detailText || item.evidence.length);
  const sevBadge = item.severity ? SEVERITY_BADGE[item.severity] : null;

  return (
    <Card
      className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-black/[0.04]"
      data-print-card="true"
    >
      <CardHeader className="space-y-3 pb-4">
        <div className="min-w-0 space-y-1.5">
          {sevBadge ? (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${sevBadge.cls}`}>
              {sevBadge.text}
            </span>
          ) : null}
          <CardTitle className="text-lg leading-snug text-slate-950">{item.title}</CardTitle>
          <p className="text-sm leading-6 text-slate-600">{item.summaryText}</p>
        </div>
      </CardHeader>

      {hasDetails ? (
        <>
          <CardContent className="pt-0">
            <button
              type="button"
              onClick={onToggle || undefined}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white"
              aria-expanded={expanded}
            >
              <span className="text-sm font-semibold text-slate-700">{expanded ? "접기" : "상세보기"}</span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200${expanded ? " rotate-180" : ""}`} />
            </button>
          </CardContent>

          {expanded ? (
            <CardContent className="space-y-4 pt-4">
              {item.detailText ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-700">
                  {item.detailText}
                </div>
              ) : null}

              {item.key === "must_requirements_gap" && item.raw ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 space-y-4">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">실제로 확인된 표현</div>
                    <p className="mt-1 text-xs text-slate-400">이력서에서 직접 연결된 표현만 근거로 잡았습니다.</p>
                    {Array.isArray(item.raw.hitItems) && item.raw.hitItems.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.raw.hitItems.slice(0, 5).map((phrase, i) => (
                          <span key={i} className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700">{phrase}</span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">현재 이력서 문구만으로는 JD 필수요건과 직접 연결되는 표현을 충분히 찾지 못했습니다.</p>
                    )}
                  </div>
                  {Array.isArray(item.raw.effectiveMissItems) && item.raw.effectiveMissItems.length > 0 ? (
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">직접 확인되지 않은 요구</div>
                      <p className="mt-1 text-xs text-slate-400">실제 경험이 있더라도 이력서에 드러나지 않으면 누락으로 보일 수 있어요.</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.raw.effectiveMissItems.slice(0, 5).map((phrase, i) => (
                          <span key={i} className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs text-rose-700">{phrase}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {item.evidence.length ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">근거로 잡힌 표현</div>
                  <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                    {item.evidence.map((row, index) => (
                      <li key={`${item.key}_evidence_${index}`} className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-3 leading-6">
                        {row}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          ) : null}
        </>
      ) : null}
    </Card>
  );
}

export default function PreciseAnalysisFlow({
  mode = "input",
  state,
  setState,
  analysis = null,
  isAnalyzing = false,
  onAnalyze = null,
  onBack = null,
  onGoHome = null,
  onPrimaryCta = null,
  onSecondaryCta = null,
  onOpenShare = null,
  shareAnchorRef = null,
}) {
  const [submitError, setSubmitError] = useState("");
  const [expandedKeys, setExpandedKeys] = useState({});
  const [helpOpenKeys, setHelpOpenKeys] = useState({});

  const compositeData = useMemo(() => {
    // Priority 1: Read from analysis prop (primary source)
    const fromAnalysis =
      analysis?.preciseAnalysis?.compositeRisk ??
      analysis?.compositeRisk ??
      null;

    if (fromAnalysis && typeof fromAnalysis === "object") {
      return fromAnalysis;
    }

    // Priority 2: Fallback to debug global (backward-compatible)
    const debugStore =
      typeof window !== "undefined" && window.__PRECISE_ANALYSIS_DEBUG__ && typeof window.__PRECISE_ANALYSIS_DEBUG__ === "object"
        ? window.__PRECISE_ANALYSIS_DEBUG__
        : null;
    return debugStore?.compositeRisk ?? null;
  }, [analysis]);

  const handleExtract = (kind, text) => {
    const value = String(text || "");
    if (kind === "jd") {
      setState((prev) => ({ ...prev, jd: value }));
      return;
    }
    if (kind === "resume") {
      setState((prev) => ({ ...prev, resume: value }));
    }
  };

  const handleAnalyzeClick = async () => {
    const hasJd = toText(state?.jd).length > 0;
    const hasResume = toText(state?.resume).length > 0;

    if (!hasJd) {
      setSubmitError("지원한 JD를 입력해 주세요.");
      return;
    }
    if (!hasResume) {
      setSubmitError("제출할 이력서를 입력해 주세요.");
      return;
    }
    if (typeof onAnalyze !== "function") {
      setSubmitError("분석을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setSubmitError("");
    await Promise.resolve(onAnalyze());
  };

  const toggleItem = (key) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handlePrintResult = () => {
    if (typeof window === "undefined" || typeof window.print !== "function") return;
    window.print();
  };

  if (mode === "loading") {
    return (
      <Card className="rounded-[28px] border border-slate-200 bg-white/95 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="text-xl font-semibold text-slate-950">JD와 이력서를 대조하는 중입니다...</div>
            <p className="text-sm leading-6 text-slate-500">
              필수요건, 연차, 성과 표현 등을 순서대로 확인하고 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (mode === "result") {
    const summary        = compositeData?.summary ?? null;
    const topRisks       = compositeData?.topRisks ?? [];
    const lowRisks       = compositeData?.supporting?.lowRisks ?? [];
    const insufficientData = compositeData?.supporting?.insufficientData ?? [];
    const bandUi         = BAND_UI[summary?.overallBand] ?? BAND_UI.pass;

    const topItems = topRisks.map((r) => {
      const n = normalizeRiskCandidate(r);
      return n ? { ...n, severity: r.severity, raw: r.raw ?? null } : null;
    }).filter(Boolean);

    const lowItems = lowRisks.map((r) => {
      const n = normalizeRiskCandidate(r);
      return n ? { ...n, severity: r.severity, raw: r.raw ?? null } : null;
    }).filter(Boolean);

    const insufItems = insufficientData
      .filter((r) => {
        const k = toText(r?.key);
        const rRaw = r?.raw ?? {};
        // JD 연차 요건 없음 + 이미 파싱된 경력 구간 존재 → 사용자 입력 부족 문제가 아님, 추가정보 요청 불필요
        // 파싱된 구간이 없으면 날짜 입력 안내가 여전히 필요하므로 표시 유지
        if (k === "experience_level_gap" && rRaw.yearsRequiredMin == null &&
          Array.isArray(rRaw.countedPeriods) && rRaw.countedPeriods.length > 0) return false;
        // 재직 구간 정확히 1개 + 파싱 실패 구간 없음 → 공백 패턴 판단 불가이나 사용자 입력 문제 아님
        // 파싱 실패 구간이 있으면 날짜 보정 안내가 여전히 필요하므로 표시 유지
        if (k === "gap_explanation_missing" && rRaw.timelinePeriodCount === 1 &&
          (!Array.isArray(rRaw.skippedPeriods) || rRaw.skippedPeriods.length === 0)) return false;
        return true;
      })
      .map((r) => {
        const k = toText(r?.key);
        // append-only Round 6: gap_explanation_missing 추가정보 섹션 제목 보정
        const t = k === "gap_explanation_missing"
          ? "공백/이직 판단에 필요한 재직기간 정보가 부족함"
          : toText(r?.title);
        return { key: k, title: t };
      })
      .filter((r) => r.key && r.title);
    const insufficientKeys = new Set(insufItems.map((item) => item.key));
    const reportSectionItems = [
      "experience_level_gap",
      "gap_explanation_missing",
      "jd_keyword_coverage_gap",
      "must_requirements_gap",
    ]
      .map((key) => buildReportSectionData({ analysis, insufficientKeys, key }))
      .filter(Boolean);

    return (
      <div className="space-y-6" data-print-root="precise-analysis-result">
        <div className="flex items-center" data-print-hidden="true">
          {typeof onGoHome === "function" ? (
            <Button
              type="button"
              variant="outline"
              onClick={onGoHome}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            >
              홈으로
            </Button>
          ) : null}
        </div>
        <Card
          className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-black/[0.04]"
          data-print-card="true"
        >
          <CardHeader className="space-y-4 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {typeof onBack === "function" ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    data-print-hidden="true"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <div className="min-w-0 space-y-2">
                  <CardTitle className="text-2xl leading-tight text-slate-950">서류 탈락 원인 분석 결과</CardTitle>
                  <p className="max-w-2xl text-sm leading-6 text-slate-500">
                    이력서와 JD를 대조해 확인한 리스크입니다. 수정 가능한 항목부터 차례대로 확인해보세요.
                  </p>
                </div>
              </div>
              <div className="shrink-0" data-print-hidden="true">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 rounded-full px-4"
                  onClick={handlePrintResult}
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    <span>PDF 저장</span>
                  </span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8 border-t border-slate-200/70 pt-6">
            {summary ? (
              <div className={bandUi.wrapClass}>
                <span className={bandUi.badgeClass}>{bandUi.badgeText}</span>
                <p className="mt-2.5 text-base font-semibold text-slate-950">{bandUi.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{summary.overallReason}</p>
              </div>
            ) : null}

            {(() => {
              const preciseAnalysis = analysis?.preciseAnalysis;
              const aiDeepAnalysis = preciseAnalysis?.aiDeepAnalysis;
              const aiMeta = preciseAnalysis?.aiMeta;

              if (!aiMeta) return null;

              if (aiMeta.ok && aiDeepAnalysis) {
                const recruiterInterpretation = String(aiDeepAnalysis.recruiterInterpretation || aiDeepAnalysis.identityGapSummary || "").trim();
                const targetProfile = String(aiDeepAnalysis.targetCandidateProfile || "").trim();
                const resumeProfile = String(aiDeepAnalysis.resumeReadProfile || "").trim();
                const mustGaps = Array.isArray(aiDeepAnalysis.mustRequirementGaps) ? aiDeepAnalysis.mustRequirementGaps.slice(0, 3) : [];
                const questions = Array.isArray(aiDeepAnalysis.missingInfoQuestions) ? aiDeepAnalysis.missingInfoQuestions.slice(0, 3) : [];
                const isGrounded = aiMeta.grounded === true;
                const rewriteDirs = isGrounded && Array.isArray(aiDeepAnalysis.rewriteDirections) ? aiDeepAnalysis.rewriteDirections.slice(0, 3) : [];
                const overclaimWarnings = isGrounded && Array.isArray(aiDeepAnalysis.antiOverclaimWarnings) ? aiDeepAnalysis.antiOverclaimWarnings.slice(0, 2) : [];

                if (!recruiterInterpretation && !targetProfile && !resumeProfile && mustGaps.length === 0 && questions.length === 0 && rewriteDirs.length === 0 && overclaimWarnings.length === 0) {
                  return null;
                }

                return (
                  <section className="space-y-4 rounded-2xl border border-blue-100/60 bg-blue-50/30 p-6">
                    <SectionIntro
                      label={isGrounded ? "AI 맞춤 개선 가이드" : "AI 심화 해석"}
                      title="채용담당자 관점 심화 해석"
                      description={isGrounded ? "탈락 위험 진단 결과를 바탕으로 이력서 개선 방향을 제시합니다." : "입력하신 JD와 이력서를 AI로 분석한 결과입니다."}
                    />

                    {recruiterInterpretation && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-900">채용담당자의 판단</h4>
                        <p className="text-sm leading-6 text-slate-700">{recruiterInterpretation}</p>
                      </div>
                    )}

                    {(targetProfile || resumeProfile) && (
                      <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
                        {targetProfile && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">JD가 찾는 후보</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-700">{targetProfile}</p>
                          </div>
                        )}
                        {resumeProfile && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">이력서에서 먼저 읽히는 모습</p>
                            <p className="mt-1.5 text-sm leading-6 text-slate-700">{resumeProfile}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {mustGaps.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-semibold text-slate-900">필수 요건 부족 항목</h4>
                        <div className="space-y-2">
                          {mustGaps.map((gap, idx) => {
                            const req = String(gap.requirement || "").trim();
                            const severity = String(gap.severity || "").trim();
                            const reason = String(gap.riskReason || "").trim();
                            if (!req) return null;
                            return (
                              <div key={idx} className="rounded border border-slate-200 bg-white p-3">
                                <div className="flex items-start gap-2">
                                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                    severity === "critical" ? "bg-red-100 text-red-700" :
                                    severity === "high" ? "bg-orange-100 text-orange-700" :
                                    "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {severity || "중"}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900">{req}</p>
                                    {reason && <p className="mt-1 text-xs leading-5 text-slate-600">{reason}</p>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {rewriteDirs.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-semibold text-slate-900">먼저 고칠 부분</h4>
                        <div className="space-y-2">
                          {rewriteDirs.map((dir, idx) => {
                            const originalEvidence = String(dir.originalEvidence || "").trim();
                            const direction = String(dir.direction || "").trim();
                            const safeExample = String(dir.safeExample || "").trim();
                            if (!direction) return null;
                            return (
                              <div key={idx} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 space-y-2">
                                {originalEvidence && <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">현재 표현</p>}
                                {originalEvidence && <p className="text-sm leading-5 text-slate-600">{originalEvidence}</p>}
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">개선 방향</p>
                                <p className="text-sm leading-5 text-slate-700">{direction}</p>
                                {safeExample && <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-sm leading-5 text-slate-600">{safeExample}</div>}
                                {dir.needsUserConfirmation === true && <p className="text-xs text-amber-600">실제 수치·성과 여부를 확인한 뒤 반영하세요.</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {overclaimWarnings.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-semibold text-slate-900">표현 시 주의할 점</h4>
                        <div className="space-y-2">
                          {overclaimWarnings.map((w, idx) => {
                            const risk = String(w.risk || "").trim();
                            const reason = String(w.reason || "").trim();
                            if (!risk) return null;
                            return (
                              <div key={idx} className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
                                <p className="text-sm font-semibold text-amber-900">{risk}</p>
                                {reason && <p className="mt-1 text-xs leading-5 text-amber-700">{reason}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {questions.length > 0 && (
                      <div className="space-y-2.5">
                        <h4 className="text-sm font-semibold text-slate-900">더 알아야 할 질문</h4>
                        <div className="space-y-2">
                          {questions.map((q, idx) => {
                            const question = String(q.question || "").trim();
                            if (!question) return null;
                            return (
                              <div key={idx} className="flex items-start gap-3 text-sm">
                                <span className="mt-1 shrink-0 text-blue-400">•</span>
                                <p className="flex-1 leading-6 text-slate-700">{question}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
                );
              }

              if (!aiMeta.ok || (aiMeta.ok && !aiDeepAnalysis)) {
                return (
                  <section className="space-y-3 rounded-2xl border border-blue-100/60 bg-blue-50/30 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-slate-900">이력서와 JD의 차이를 더 깊게 읽고 있어요.</p>
                        <p className="text-sm leading-5 text-slate-600">심화 해석이 준비되면 바로 이어서 보여드릴게요.</p>
                      </div>
                    </div>
                  </section>
                );
              }

              return null;
            })()}

            {reportSectionItems.length === 0 && topItems.length === 0 && insufItems.length === 0 && lowItems.length === 0 ? (
              <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-amber-900">분석 결과를 불러오지 못했습니다.</p>
                <p className="mt-2 text-sm leading-6 text-amber-700">
                  입력 내용을 다시 확인한 뒤 분석을 다시 실행해주세요.
                </p>
              </div>
            ) : null}

            {reportSectionItems.length ? (
              <section className="space-y-4">
                <SectionIntro
                  label="리포트 섹션"
                  title="서류 탈락 원인 분석"
                  description="현재 이력서 표현과 JD 기준으로, 서류 단계에서 실제로 걸릴 가능성이 높은 항목부터 정리했습니다."
                />
                <div className="space-y-4">
                  {reportSectionItems.map((item) => (
                    <ReportAnalysisCard
                      key={`report_${item.key}`}
                      item={item}
                      expanded={Boolean(expandedKeys[`report_${item.key}`])}
                      onToggle={() => toggleItem(`report_${item.key}`)}
                      helpOpen={Boolean(helpOpenKeys[`report_${item.key}`])}
                      onToggleHelp={() => setHelpOpenKeys((prev) => ({
                        ...prev,
                        [`report_${item.key}`]: !prev[`report_${item.key}`],
                      }))}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {topItems.length ? (
              <section className="space-y-4">
                <SectionIntro
                  label="핵심 리스크"
                  title="가장 먼저 보완해야 할 리스크"
                  description="지금 단계에서 가장 먼저 손봐야 할 항목입니다."
                />
                <div className="space-y-4">
                  {topItems.map((item) => (
                    <ResultRiskCard
                      key={`top_${item.key}`}
                      item={item}
                      expanded={Boolean(expandedKeys[item.key])}
                      onToggle={() => toggleItem(item.key)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {insufItems.length ? (
              <section className="space-y-4">
                <SectionIntro
                  label="추가 정보 필요"
                  title="추가 정보가 있으면 더 정확히 볼 수 있어요"
                  description="아래 항목은 이력서에서 판단에 필요한 정보를 충분히 확인할 수 없어 분석에서 제외됐습니다."
                />
                <div className="space-y-2.5">
                  {insufItems.map((item) => {
                    const help = INSUF_HELP[item.key] ?? null;
                    const helpOpen = Boolean(helpOpenKeys[item.key]);
                    return (
                      <div
                        key={`insuf_${item.key}`}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-4"
                        data-print-card="true"
                      >
                        <div className="space-y-3">
                          <div className="text-sm font-semibold text-slate-700">{item.title}</div>
                          <p className="text-sm leading-6 text-slate-600">
                            {help?.hint ?? "이력서에 해당 정보를 추가하면 더 정확히 확인할 수 있어요."}
                          </p>
                          {help ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setHelpOpenKeys((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                                className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
                                aria-expanded={helpOpen}
                                aria-label={helpOpen ? "입력 예시 접기" : "입력 예시 보기"}
                              >
                                {helpOpen ? "입력 예시 접기" : "입력 예시 보기"}
                              </button>
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-400">
                                ?
                              </span>
                            </div>
                          ) : null}
                        </div>
                        {help && helpOpen ? (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-3">
                            <p className="text-sm font-semibold text-slate-800">{help.title}</p>
                            <p className="text-sm leading-6 text-slate-600">{help.body}</p>
                            <ul className="space-y-1.5">
                              {help.examples.map((ex, i) => (
                                <li key={i} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2 text-sm leading-6 text-slate-600">{ex}</li>
                              ))}
                            </ul>
                            <p className="text-xs leading-5 text-slate-500">{help.note}</p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {lowItems.length ? (
              <section className="space-y-4">
                <SectionIntro
                  label="참고"
                  title="함께 점검하면 좋은 항목"
                  description="당장 결격 사유는 아니지만, 함께 살펴보면 좋습니다."
                />
                <div className="space-y-4">
                  {lowItems.map((item) => (
                    <ResultRiskCard
                      key={`low_${item.key}`}
                      item={item}
                      expanded={Boolean(expandedKeys[item.key])}
                      onToggle={() => toggleItem(item.key)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-5" ref={shareAnchorRef} data-print-hidden="true">
          <Card className="rounded-[28px] border border-slate-200/80 bg-white shadow-sm shadow-black/[0.04]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold leading-snug text-slate-900">
                분석 결과를 실제 합격 전략으로 바꿔보세요
              </CardTitle>
              <div className="mt-1 text-sm leading-relaxed text-slate-500">
                현재 분석 결과를 바탕으로, 지원 직무에 맞는 표현으로 정리하고 합격 관점에서 더 설득력 있게 보완할 수 있습니다.
              </div>
            </CardHeader>

            <CardContent className="space-y-5 text-sm sm:space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-500">QUICK CHECK</div>
                  <div className="mb-1 text-sm font-bold text-slate-900">미니 컨설팅</div>
                  <div className="mb-4 text-xs text-slate-500">지금 바로 빠르게 궁금할 때</div>
                  <div className="mb-5 text-3xl font-bold text-slate-900">무료</div>
                  <ul className="mb-5 flex-1 space-y-2">
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-400">✓</span>15분 빠른 점검</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-400">✓</span>핵심 포인트 피드백</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-400">✓</span>온라인 진행</li>
                  </ul>
                  <a
                    className="mt-auto block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    href="/reject-analyzer/?page=consulting-lead&type=mini"
                  >
                    신청하기
                  </a>
                </div>

                <div className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-blue-50/20 p-5 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white">인기</span>
                  </div>
                  <span className="absolute top-3 right-3 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-500">한시적 이벤트</span>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-600">EMERGENCY</div>
                  <div className="mb-1 text-sm font-bold text-slate-900">원포인트 컨설팅</div>
                  <div className="mb-4 text-xs text-slate-500">당장 제출이 면접이 급할 때</div>
                  <div className="mb-5">
                    <div className="text-sm text-slate-400 line-through">200,000원</div>
                    <div className="text-3xl font-bold text-slate-900">120,000원</div>
                  </div>
                  <ul className="mb-5 flex-1 space-y-2">
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-500">✓</span>1회 60분 집중 진행</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-500">✓</span>서류 혹은 면접 택 1</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-500">✓</span>합격 맞춤형 정밀 첨삭</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-500">✓</span>집중 모의 면접 (선택 시)</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-blue-500">✓</span>온라인 진행</li>
                  </ul>
                  <a
                    className="mt-auto block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    href="/reject-analyzer/?page=consulting-lead&type=onepoint"
                  >
                    1:1 원포인트 신청하기
                  </a>
                </div>

                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">MASTER CLASS</div>
                  <div className="mb-1 text-sm font-bold text-slate-900">1:1 집중 취업 밀착 케어</div>
                  <div className="mb-4 text-xs text-slate-500">취업, 이직의 반응 바꾸고 싶을 때</div>
                  <div className="mb-5 text-2xl font-bold text-slate-700">상담 후 결정</div>
                  <ul className="mb-5 flex-1 space-y-2">
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-slate-400">✓</span>1시간 x 4회 완성</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-slate-400">✓</span>커리어 전환/합격 전략 설계</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-slate-400">✓</span>입사서류 + 면접 + 산업분석</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-slate-400">✓</span>1:1 멘탈 관리 및 동기부여</li>
                    <li className="flex items-start gap-2 text-sm text-slate-700"><span className="mt-0.5 shrink-0 text-slate-400">✓</span>온오프라인 하이브리드</li>
                  </ul>
                  <a
                    className="mt-auto block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    href="/reject-analyzer/?page=consulting-lead&type=care"
                  >
                    커스텀 견적 문의하기
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-1" data-print-hidden="true">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-full px-5"
              onClick={() => onOpenShare?.()}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <Share2 className="h-4 w-4" />
                <span>공유하기</span>
              </span>
            </Button>
          </div>
        </section>
        <div className="flex items-center justify-start" data-print-hidden="true">
          {typeof onGoHome === "function" ? (
            <Button
              type="button"
              variant="outline"
              onClick={onGoHome}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            >
              홈으로
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        {typeof onGoHome === "function" ? (
          <Button
            type="button"
            variant="outline"
            onClick={onGoHome}
            className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          >
            홈으로
          </Button>
        ) : null}
      </div>
      <Card className="rounded-[28px] border border-slate-200 bg-white/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            {typeof onBack === "function" ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            <div className="min-w-0">
              <CardTitle className="text-2xl text-slate-950">서류 탈락 원인 분석</CardTitle>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                JD와 이력서를 입력하면, 어떤 부분에서 걸릴 수 있는지 구체적으로 확인해드립니다.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-0">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
            PDF, DOCX, TXT를 올리거나 텍스트를 직접 붙여넣을 수 있습니다. 스캔 PDF는 텍스트가 추출되지 않을 수 있습니다.
          </div>

          <UploadPanel onExtract={handleExtract} />

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">지원한 JD (채용공고)</div>
            <Textarea
              value={state?.jd || ""}
              onChange={(e) => setState((prev) => ({ ...prev, jd: e.target.value }))}
              className="min-h-[220px] rounded-3xl border border-slate-200 px-4 py-4 text-sm leading-6"
            />
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">제출할 이력서</div>
            <Textarea
              value={state?.resume || ""}
              onChange={(e) => setState((prev) => ({ ...prev, resume: e.target.value }))}
              className="min-h-[240px] rounded-3xl border border-slate-200 px-4 py-4 text-sm leading-6"
            />
          </div>

          <div className="space-y-3">
            {submitError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}
            <Button
              type="button"
              className="h-12 w-full rounded-full bg-slate-900 text-white hover:bg-slate-800"
              disabled={isAnalyzing}
              onClick={handleAnalyzeClick}
            >
              탈락 원인 분석하기
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-start">
        {typeof onGoHome === "function" ? (
          <Button
            type="button"
            variant="outline"
            onClick={onGoHome}
            className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"
          >
            홈으로
          </Button>
        ) : null}
      </div>
    </div>
  );
}
