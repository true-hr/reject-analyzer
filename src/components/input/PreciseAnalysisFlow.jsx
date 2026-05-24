import React, { useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, Check, ChevronDown, Download, Loader2, RotateCcw, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import UploadPanel from "../upload/UploadPanel.jsx";
import { JOB_CATEGORY_OPTIONS, INDUSTRY_CATEGORY_OPTIONS } from "./categoryOptions";
import { findJobOntologyByUiSelection, findIndustryRegistryByUiSelection } from "../../data/job/jobLookup.index.js";
import { inferCalibrationProfileKey, buildCalibratedMustGaps, getTopicBucket, getLinkedQuestionForGap } from "../../lib/rejectionAnalysis/calibration.js";
import { getAiErrorUserMessage } from "../../lib/rejectionAnalysis/aiErrorMessage.js";
import { deriveRejectionAnalysisProgress, REJECTION_ANALYSIS_STEPS } from "../../lib/rejectionAnalysis/analysisProgress.js";
import { buildRiskEvidenceGroups, sortGroupsByPriority } from "../../lib/rejectionAnalysis/riskEvidenceChips.js";

const JOB_SUBCATEGORY_LOOKUP_ALIASES = Object.freeze({
  "프로젝트관리(PM)": "프로젝트관리",
  "Key Account Management(KAM)": "Key Account Management",
  "고객성공(CSM)": "고객성공",
  "평가보상(C&B)": "평가보상",
  "HR 운영(HR Ops)": "HR 운영",
  "품질관리(QC)": "품질관리",
  "품질보증(QA)": "품질보증",
  "연구개발(R&D)": "연구개발",
});

function resolvePreciseJobSelection({ majorCategory, subcategory }) {
  const direct = findJobOntologyByUiSelection({ majorCategory, subcategory });
  if (direct?.id) return direct;
  const alias = JOB_SUBCATEGORY_LOOKUP_ALIASES[String(subcategory || "").trim()];
  if (alias) {
    const fallback = findJobOntologyByUiSelection({ majorCategory, subcategory: alias });
    if (fallback?.id) return fallback;
  }
  return direct;
}

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

const SEVERITY_KO = { critical: "치명", high: "높음", medium: "보완 필요", low: "낮음", unclear: "확인 필요" };
const MATCH_LEVEL_KO = { missing: "근거 부족", weak: "약한 연결", partial: "부분 연결", strong: "강한 연결", unclear: "확인 필요" };
const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const MATCH_ORDER = { missing: 0, weak: 1, partial: 2, unclear: 3, strong: 4 };
const EXECUTION_LEVEL_KO = { none: "수행 근거 없음", indirect: "간접 경험", support: "지원 역할", collaboration: "협업 수행", direct: "직접 수행", metric: "지표 관리", unclear: "확인 필요" };
const PRIORITY_KO = { high: "우선 확인", medium: "확인 필요", low: "참고" };
const RISK_LEVEL_KO = { critical: "치명", high: "높음", medium: "보완 필요", low: "낮음", unclear: "확인 필요" };

// B-1: preferred/advanced gap 판정 helper
const PM_PREFERRED_TOOL_RE_FRONT = /\bsql\b|\bga4\b|\bamplitude\b|a\/b\s*테스트|ab\s*테스트|퍼널\s*분석|전환율\s*개선|그로스|growth|실험\s*설계|데이터\s*분석\s*도구|로그\s*분석|이벤트\s*분석|지표\s*분석/i;

function isPreferredOrAdvancedGap(gap, profileKey = '') {
  const source = String(gap.source || '').toLowerCase();
  const reqType = String(gap.requirementType || '').toLowerCase();
  if (source === 'preferred' || reqType === 'preferred' || reqType === 'advanced') return true;
  // PM profile fallback: known data/tool keywords with medium-or-lower severity
  if (profileKey === 'productPlanning') {
    const gapText = `${gap.requirement || ''} ${gap.jdEvidence || ''} ${gap.riskReason || ''}`;
    const sev = String(gap.severity || '').toLowerCase();
    if (PM_PREFERRED_TOOL_RE_FRONT.test(gapText) && (sev === 'medium' || sev === 'low')) return true;
  }
  return false;
}

// C-3: warningType inference helper for backward-compat
const WEAK_EXPRESSION_RE_FRONT = /관심|희망|참여|이해가\s*있|경험이\s*있|하고\s*싶|배우고|배울/i;
const OVERCLAIM_SIGNAL_RE_FRONT = /개선에\s*기여|주도|소유|의사결정|재계약|업셀|upsell|churn|retention|성과|성장률|증가율|전환율/i;

function inferWarningType(w) {
  const t = String(w.warningType || '').toLowerCase();
  if (t === 'overclaim' || t === 'needs_confirmation' || t === 'weak_expression') return t;
  const text = `${w.risk || ''} ${w.reason || ''} ${w.linkedOriginalEvidence || ''}`;
  if (WEAK_EXPRESSION_RE_FRONT.test(text) && !OVERCLAIM_SIGNAL_RE_FRONT.test(text)) return 'weak_expression';
  return 'overclaim';
}

function getSeverityBadgeClass(s) {
  if (s === "critical") return "bg-red-100 text-red-700 border border-red-200";
  if (s === "high") return "bg-orange-100 text-orange-700 border border-orange-200";
  if (s === "medium") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (s === "low") return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-slate-100 text-slate-500 border border-slate-200";
}

function getMatchLevelBadgeClass(m) {
  if (m === "missing") return "bg-red-100 text-red-700 border border-red-200";
  if (m === "weak") return "bg-orange-100 text-orange-700 border border-orange-200";
  if (m === "partial") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (m === "strong") return "bg-green-100 text-green-700 border border-green-200";
  return "bg-slate-100 text-slate-500 border border-slate-200";
}

function getPriorityBadgeClass(p) {
  if (p === "high") return "bg-red-100 text-red-700 border border-red-200";
  if (p === "medium") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-slate-100 text-slate-500 border border-slate-200";
}

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

const EVIDENCE_CHIP_TONE = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  negative: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
};

function EvidenceChipGroup({ group, groupKey }) {
  if (!group || !Array.isArray(group.items) || group.items.length === 0) return null;
  const toneClass = EVIDENCE_CHIP_TONE[group.tone] || EVIDENCE_CHIP_TONE.neutral;
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</div>
      {group.note ? <p className="mt-1 text-xs text-slate-400">{group.note}</p> : null}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {group.items.map((phrase, idx) => (
          <span
            key={`${groupKey}_chip_${idx}`}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs ${toneClass}`}
          >
            {phrase}
          </span>
        ))}
        {group.overflow > 0 ? (
          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-500">
            외 {group.overflow}개
          </span>
        ) : null}
      </div>
    </div>
  );
}

// Batch A: 카드 안 chip 그룹은 우선순위 정렬 + 상위 N개만 기본 노출.
// negative / alias neutral 그룹을 위에 두고, "근거 더 보기 N개"로 나머지 접기.
const DEFAULT_VISIBLE_GROUPS = 3;

function ResultRiskCard({ item, expanded = false, onToggle = null }) {
  if (!item) return null;

  const evidenceGroups = useMemo(
    () => sortGroupsByPriority(buildRiskEvidenceGroups(item?.key, item?.raw)),
    [item?.key, item?.raw]
  );
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  const visibleGroups = groupsExpanded
    ? evidenceGroups
    : evidenceGroups.slice(0, DEFAULT_VISIBLE_GROUPS);
  const hiddenCount = Math.max(0, evidenceGroups.length - DEFAULT_VISIBLE_GROUPS);
  const hasDetails = Boolean(item.detailText || item.evidence.length || evidenceGroups.length);
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

              {evidenceGroups.length ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 space-y-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">판정 근거</div>
                  {visibleGroups.map((group, idx) => (
                    <EvidenceChipGroup
                      key={`${item.key}_evidence_group_${idx}`}
                      group={group}
                      groupKey={`${item.key}_evidence_group_${idx}`}
                    />
                  ))}
                  {hiddenCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setGroupsExpanded((v) => !v)}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                      aria-expanded={groupsExpanded}
                    >
                      {groupsExpanded ? "근거 접기" : `근거 더 보기 ${hiddenCount}개`}
                    </button>
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

function RejectionAnalysisStepList({ progress }) {
  const safeProgress = progress && typeof progress === "object" ? progress : null;
  const completedSet = new Set(
    safeProgress && Array.isArray(safeProgress.completedStepKeys) ? safeProgress.completedStepKeys : []
  );
  const activeKey = safeProgress ? safeProgress.activeStepKey : "base";
  const failedKey = safeProgress ? safeProgress.failedStepKey : null;
  return (
    <ul className="space-y-2.5">
      {REJECTION_ANALYSIS_STEPS.map((step) => {
        const isCompleted = completedSet.has(step.key);
        const isFailed = failedKey === step.key;
        const isActive = !isFailed && !isCompleted && activeKey === step.key;
        let icon;
        let labelClass;
        let descClass;
        if (isCompleted) {
          icon = (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3 w-3" />
            </span>
          );
          labelClass = "text-sm font-semibold text-slate-700";
          descClass = "text-xs leading-5 text-slate-500";
        } else if (isFailed) {
          icon = (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertCircle className="h-3 w-3" />
            </span>
          );
          labelClass = "text-sm font-semibold text-rose-700";
          descClass = "text-xs leading-5 text-rose-500";
        } else if (isActive) {
          icon = (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Loader2 className="h-3 w-3 animate-spin" />
            </span>
          );
          labelClass = "text-sm font-semibold text-slate-900";
          descClass = "text-xs leading-5 text-slate-500";
        } else {
          icon = (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white" />
          );
          labelClass = "text-sm text-slate-400";
          descClass = "text-xs leading-5 text-slate-400";
        }
        return (
          <li key={step.key} className="flex items-start gap-3">
            {icon}
            <div className="space-y-0.5">
              <p className={labelClass}>{step.label}</p>
              <p className={descClass}>{step.description}</p>
            </div>
          </li>
        );
      })}
    </ul>
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
  onReset = null,
  onPrimaryCta = null,
  onSecondaryCta = null,
  onOpenShare = null,
  onRetryAiDeepAnalysis = null,
  shareAnchorRef = null,
}) {
  const [submitError, setSubmitError] = useState("");
  const [expandedKeys, setExpandedKeys] = useState({});
  const [helpOpenKeys, setHelpOpenKeys] = useState({});
  const [jdUrl, setJdUrl] = useState("");
  const [jdUrlLoadStatus, setJdUrlLoadStatus] = useState("idle");
  const [jdUrlError, setJdUrlError] = useState("");
  const [preciseTargetJobMajor, setPreciseTargetJobMajor] = useState(
    () => state?.preciseTargetJobTaxonomy?.major || ""
  );
  const [preciseTargetJobSub, setPreciseTargetJobSub] = useState(
    () => state?.preciseTargetJobTaxonomy?.sub || ""
  );
  const [preciseTargetIndustryMajor, setPreciseTargetIndustryMajor] = useState(
    () => state?.preciseTargetIndustryResolved?.major || ""
  );
  const [preciseTargetIndustrySub, setPreciseTargetIndustrySub] = useState(
    () => state?.preciseTargetIndustryResolved?.sub || ""
  );
  const [preciseCurrentJobMajor, setPreciseCurrentJobMajor] = useState(
    () => state?.preciseCurrentJobTaxonomy?.major || ""
  );
  const [preciseCurrentJobSub, setPreciseCurrentJobSub] = useState(
    () => state?.preciseCurrentJobTaxonomy?.sub || ""
  );

  const preciseTargetJobSubs = JOB_CATEGORY_OPTIONS.find((c) => c.v === preciseTargetJobMajor)?.subs ?? [];
  const preciseTargetIndustrySubs = INDUSTRY_CATEGORY_OPTIONS.find((c) => c.v === preciseTargetIndustryMajor)?.subs ?? [];
  const preciseCurrentJobSubs = JOB_CATEGORY_OPTIONS.find((c) => c.v === preciseCurrentJobMajor)?.subs ?? [];

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

  const JD_URL_HOST_ALLOW = new Set([
    "saramin.co.kr",
    "www.saramin.co.kr",
    "jobkorea.co.kr",
    "www.jobkorea.co.kr",
  ]);

  const getJdUrlErrorMessage = (code) => {
    if (code === "UNSUPPORTED_DOMAIN") return "공고를 자동으로 불러오지 못했어요. 잡코리아 또는 사람인 채용공고 URL을 붙여넣어 주세요.";
    if (code === "FETCH_FAILED") return "공고를 자동으로 불러오지 못했어요. 잡코리아/사람인 일부 공고는 사이트 접근 제한으로 자동 추출이 실패할 수 있습니다. 원문 공고를 열어 모집요강을 복사한 뒤 아래 JD 입력칸에 붙여넣어 주세요.";
    if (code === "TEXT_TOO_SHORT") return "공고를 자동으로 불러오지 못했어요. 잡코리아/사람인 일부 공고는 사이트 접근 제한으로 자동 추출이 실패할 수 있습니다. 원문 공고를 열어 모집요강을 복사한 뒤 아래 JD 입력칸에 붙여넣어 주세요.";
    if (code === "NOT_JOB_DESCRIPTION") return "채용공고 상세 페이지의 URL을 복사해 주세요. 목록 페이지나 메인 페이지는 지원하지 않습니다.";
    if (code === "INVALID_URL") return "올바른 링크 형식이 아닙니다. 잡코리아 또는 사람인 채용공고 URL을 붙여넣어 주세요.";
    return "공고를 자동으로 불러오지 못했어요. 잡코리아/사람인 일부 공고는 사이트 접근 제한으로 자동 추출이 실패할 수 있습니다. 원문 공고를 열어 모집요강을 복사한 뒤 아래 JD 입력칸에 붙여넣어 주세요.";
  };

  const handleLoadJDFromUrl = async () => {
    const raw = String(jdUrl || "").trim();
    if (!raw) {
      setJdUrlLoadStatus("error");
      setJdUrlError("채용공고 URL을 입력해 주세요.");
      return;
    }

    let parsed = null;
    try {
      parsed = new URL(raw);
    } catch {
      setJdUrlLoadStatus("error");
      setJdUrlError("올바른 링크 형식이 아닙니다. 잡코리아 또는 사람인 채용공고 URL을 붙여넣어 주세요.");
      return;
    }

    const host = String(parsed.hostname || "").toLowerCase();
    if (!JD_URL_HOST_ALLOW.has(host)) {
      setJdUrlLoadStatus("error");
      setJdUrlError("공고를 자동으로 불러오지 못했어요. 채용공고 본문을 복사해서 아래에 붙여넣으면 동일하게 분석할 수 있습니다.");
      return;
    }

    setJdUrlLoadStatus("loading");
    setJdUrlError("");
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "";
      const endpoint = `${API_BASE}/api/extract-job-posting`;
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await resp.json().catch(() => null);

      if (!resp.ok || !data?.ok || !String(data?.finalText || data?.text || "").trim()) {
        setJdUrlLoadStatus("error");
        setJdUrlError(getJdUrlErrorMessage(String(data?.error || "")));
        return;
      }

      const nextText = String(data.finalText || data.text || "").trim();
      setState((prev) => ({ ...prev, jd: nextText }));
      setJdUrlLoadStatus("success");
      setJdUrlError("");
    } catch {
      setJdUrlLoadStatus("error");
      setJdUrlError("공고를 자동으로 불러오지 못했어요. 채용공고 본문을 복사해서 아래에 붙여넣으면 동일하게 분석할 수 있습니다.");
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
    const loadingProgress = deriveRejectionAnalysisProgress(analysis);
    return (
      <Card className="rounded-[28px] border border-slate-200 bg-white/95 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center gap-6 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="text-xl font-semibold text-slate-950">JD와 이력서를 대조하는 중입니다.</div>
            <p className="text-sm leading-6 text-slate-500">
              기본 분석이 끝나면 AI 심화 해석을 이어서 불러옵니다.
            </p>
          </div>
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white px-5 py-4 text-left">
            <RejectionAnalysisStepList progress={loadingProgress} />
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

    const preciseAnalysis = analysis?.preciseAnalysis;
    const aiDeepAnalysis = preciseAnalysis?.aiDeepAnalysis;
    const aiMeta = preciseAnalysis?.aiMeta;
    const aiIsPending = aiMeta != null && aiMeta.ok === undefined;
    const aiIsSuccess = aiMeta?.ok === true && Boolean(aiDeepAnalysis);
    const aiIsFailure = aiMeta?.ok === false;

    return (
      <div className="space-y-6" data-print-root="precise-analysis-result">
        <div className="flex items-center gap-2" data-print-hidden="true">
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
          {typeof onReset === "function" ? (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              분석 다시 시작
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
              if (!aiMeta) return null;

              if (aiMeta.ok && aiDeepAnalysis) {
                const recruiterInterpretation = String(aiDeepAnalysis.recruiterInterpretation || aiDeepAnalysis.identityGapSummary || "").trim();
                const targetProfile = String(aiDeepAnalysis.targetCandidateProfile || "").trim();
                const resumeProfile = String(aiDeepAnalysis.resumeReadProfile || "").trim();
                const overallRiskLevel = String(aiDeepAnalysis.overallRiskLevel || "").trim();
                const mustGaps = Array.isArray(aiDeepAnalysis.mustRequirementGaps) ? aiDeepAnalysis.mustRequirementGaps.slice(0, 5) : [];
                const transferables = Array.isArray(aiDeepAnalysis.transferableSignals) ? aiDeepAnalysis.transferableSignals.slice(0, 3) : [];
                const questions = Array.isArray(aiDeepAnalysis.missingInfoQuestions) ? aiDeepAnalysis.missingInfoQuestions.slice(0, 4) : [];
                const rewriteDirs = Array.isArray(aiDeepAnalysis.rewriteDirections) ? aiDeepAnalysis.rewriteDirections.slice(0, 3) : [];
                const overclaimWarnings = Array.isArray(aiDeepAnalysis.antiOverclaimWarnings) ? aiDeepAnalysis.antiOverclaimWarnings.slice(0, 3) : [];

                const hasAnyMissing = mustGaps.some((g) => g.matchLevel === "missing" || g.matchLevel === "weak");
                const hasAnyPartial = mustGaps.some((g) => g.matchLevel === "partial");
                const connectionLabel = hasAnyMissing ? "보완 필요" : hasAnyPartial ? "부분 연결" : mustGaps.length > 0 ? "강한 연결" : "—";

                const hasContent = recruiterInterpretation || targetProfile || resumeProfile || mustGaps.length > 0 || questions.length > 0 || rewriteDirs.length > 0 || overclaimWarnings.length > 0 || transferables.length > 0;
                if (!hasContent) return null;

                const calibrationProfileKey = inferCalibrationProfileKey({
                  jobTitle: preciseTargetJobMajor,
                  targetJob: preciseTargetJobSub,
                  jdText: state?.jd,
                  resumeText: state?.resume,
                });
                const calibratedMustGaps = buildCalibratedMustGaps(mustGaps, { profileKey: calibrationProfileKey });

                return (
                  <section className="space-y-8 rounded-3xl border border-blue-100/70 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 p-6">

                    {/* A. Header */}
                    <div className="space-y-1.5">
                      <div className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">
                        AI 판독 맵
                      </div>
                      <div className="text-lg font-bold tracking-tight text-slate-950">채용담당자 관점 서류탈락 리스크 맵</div>
                      <p className="text-sm leading-6 text-slate-500">JD 요구사항과 이력서 근거를 연결해, 부족하게 읽히는 지점과 바로 고칠 문장을 정리했습니다.</p>
                    </div>

                    {/* B. 지금 먼저 고칠 3가지 */}
                    {(() => {
                      const actionItems = [];
                      const usedTopics = new Set();
                      const POSITIVE_MARKERS = ["명확하게 확인", "확인됨", "충분히 확인", "강한 연결"];
                      const GENERIC_DIR_MARKERS = ["구체적인", "명시", "개선 방향", "설명하는 방향", "강조", "보완"];

                      // 1순위: calibratedMustGaps missing/weak, severity critical/high/medium
                      // B-3: preserve buildCalibratedMustGaps order (already sorted by metadata weight + severity)
                      // B-3: exclude preferred/advanced gaps from 1순위
                      const primaryGaps = calibratedMustGaps
                        .filter((gap) => {
                          const gapMatch = String(gap.matchLevel || "").trim().toLowerCase();
                          const gapSev = String(gap.severity || "").trim().toLowerCase();
                          const gapRiskReason = String(gap.riskReason || "").trim();
                          return (gapMatch === "missing" || gapMatch === "weak")
                            && (gapSev === "critical" || gapSev === "high" || gapSev === "medium")
                            && !POSITIVE_MARKERS.some((m) => gapRiskReason.includes(m))
                            && Boolean(String(gap.requirement || "").trim())
                            && !isPreferredOrAdvancedGap(gap, calibrationProfileKey);
                        });
                      primaryGaps.forEach((gap) => {
                        if (actionItems.length >= 3) return;
                        const req = String(gap.requirement || "").trim();
                        const gapMatch = String(gap.matchLevel || "").trim().toLowerCase();
                        const gapRiskReason = String(gap.riskReason || "").trim();
                        const gapTopic = getTopicBucket(req + " " + gapRiskReason, calibrationProfileKey);
                        if (gapTopic && usedTopics.has(gapTopic)) return;
                        if (gapTopic) usedTopics.add(gapTopic);
                        const title = gapMatch === "missing"
                          ? `"${req}" 요건이 이력서에서 충분히 확인되지 않음`
                          : `"${req}" 경험이 채용담당자에게 약하게 읽힘`;
                        actionItems.push({ num: actionItems.length + 1, title, reason: gapRiskReason, badge: "보완" });
                      });

                      // 2순위: rewriteDirs 최대 1개 (주제 중복 제외)
                      rewriteDirs.slice(0, 1).forEach((dir) => {
                        if (actionItems.length >= 3) return;
                        const orig = String(dir.originalEvidence || "").trim();
                        const direction = String(dir.direction || "").trim();
                        const reason = String(dir.riskReason || "").trim();
                        if (!direction) return;
                        const topic = getTopicBucket(orig + " " + direction + " " + reason, calibrationProfileKey);
                        if (topic && usedTopics.has(topic)) return;
                        if (topic) usedTopics.add(topic);
                        const isGeneric = GENERIC_DIR_MARKERS.some((m) => direction.includes(m));
                        const shortOrig = orig.length > 22 ? orig.slice(0, 22) + "…" : orig;
                        const title = (() => {
                          if (!orig) return direction;
                          if (isGeneric) return `"${shortOrig}" 문장을 더 구체적인 문제→행동→협업 구조로 바꾸기`;
                          return `"${shortOrig}" 문장을 ${direction}`;
                        })();
                        actionItems.push({ num: actionItems.length + 1, title, reason, badge: "수정" });
                      });

                      // 3순위: overclaimWarnings 최대 1개
                      overclaimWarnings.slice(0, 1).forEach((w) => {
                        if (actionItems.length >= 3) return;
                        const genericRisk = new Set(["과장 위험", "주의 필요", "불명확함"]);
                        const risk = String(w.risk || "").trim();
                        const reason = String(w.reason || "").trim();
                        const display = (!risk || genericRisk.has(risk)) ? reason : `"${risk}" 표현을 수치 없이는 낮춰 쓰기`;
                        if (display) {
                          const topic = getTopicBucket(risk + " " + reason, calibrationProfileKey);
                          if (topic && usedTopics.has(topic)) return;
                          if (topic) usedTopics.add(topic);
                          actionItems.push({ num: actionItems.length + 1, title: display, reason, badge: "피하기" });
                        }
                      });

                      // 4순위: fallback — partial calibratedMustGaps, 이후 남은 rewriteDirs
                      if (actionItems.length < 3) {
                        calibratedMustGaps.forEach((gap) => {
                          if (actionItems.length >= 3) return;
                          const gapMatch = String(gap.matchLevel || "").trim().toLowerCase();
                          const gapSev = String(gap.severity || "").trim().toLowerCase();
                          const gapRiskReason = String(gap.riskReason || "").trim();
                          if (gapMatch === "strong") return;
                          if (gapSev === "low" || gapSev === "none") return;
                          if (POSITIVE_MARKERS.some((m) => gapRiskReason.includes(m))) return;
                          // B-4: preferred/advanced gaps are lower priority in fallback
                          if (isPreferredOrAdvancedGap(gap, calibrationProfileKey)) return;
                          const req = String(gap.requirement || "").trim();
                          if (!req) return;
                          const gapTopic = getTopicBucket(req + " " + gapRiskReason, calibrationProfileKey);
                          if (gapTopic && usedTopics.has(gapTopic)) return;
                          if (gapTopic) usedTopics.add(gapTopic);
                          const title = gapMatch === "partial"
                            ? `"${req}" 경험이 일부만 확인됨`
                            : `"${req}" 보완 필요`;
                          actionItems.push({ num: actionItems.length + 1, title, reason: gapRiskReason, badge: "보완" });
                        });
                        rewriteDirs.slice(1).forEach((dir) => {
                          if (actionItems.length >= 3) return;
                          const orig = String(dir.originalEvidence || "").trim();
                          const direction = String(dir.direction || "").trim();
                          const reason = String(dir.riskReason || "").trim();
                          if (!direction) return;
                          const topic = getTopicBucket(orig + " " + direction + " " + reason, calibrationProfileKey);
                          if (topic && usedTopics.has(topic)) return;
                          if (topic) usedTopics.add(topic);
                          const isGeneric = GENERIC_DIR_MARKERS.some((m) => direction.includes(m));
                          const shortOrig = orig.length > 22 ? orig.slice(0, 22) + "…" : orig;
                          const title = (() => {
                            if (!orig) return direction;
                            if (isGeneric) return `"${shortOrig}" 문장을 더 구체적인 문제→행동→협업 구조로 바꾸기`;
                            return `"${shortOrig}" 문장을 ${direction}`;
                          })();
                          actionItems.push({ num: actionItems.length + 1, title, reason, badge: "수정" });
                        });
                      }
                      if (!actionItems.length) return null;
                      return (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-lg font-bold tracking-tight text-slate-950">지금 먼저 고칠 3가지</p>
                            <p className="text-sm leading-6 text-slate-500">서류 통과 가능성을 높이기 위해 먼저 손봐야 할 항목입니다.</p>
                          </div>
                          <div className="space-y-2">
                            {actionItems.map((item) => {
                              const badgeClass = item.badge === "수정"
                                ? "bg-blue-100 text-blue-700"
                                : item.badge === "피하기"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700";
                              return (
                                <div key={item.num} className="flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">{item.num}</div>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex flex-wrap items-start gap-2">
                                      <p className="min-w-0 flex-1 break-keep text-base font-semibold text-slate-900">{item.title}</p>
                                      <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${badgeClass}`}>{item.badge}</span>
                                    </div>
                                    {item.reason ? <p className="break-keep text-sm leading-5 text-slate-500">{item.reason}</p> : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* B-2. 탈락 가능성이 높은 JD 핵심 gap */}
                    {(() => {
                      const coreGaps = calibratedMustGaps
                        .filter((gap) => {
                          const gapMatch = String(gap.matchLevel || "").trim().toLowerCase();
                          const gapSev = String(gap.severity || "").trim().toLowerCase();
                          // B-2: exclude preferred/advanced gaps from "핵심 탈락 리스크" section
                          if (isPreferredOrAdvancedGap(gap, calibrationProfileKey)) return false;
                          return (gapMatch === "missing" || gapMatch === "weak" || gapMatch === "partial")
                            && (gapSev === "critical" || gapSev === "high" || gapSev === "medium");
                        })
                        .sort((a, b) => {
                          const oa = SEV_ORDER[String(a.severity || "").toLowerCase()] ?? 99;
                          const ob = SEV_ORDER[String(b.severity || "").toLowerCase()] ?? 99;
                          if (oa !== ob) return oa - ob;
                          const ma = MATCH_ORDER[String(a.matchLevel || "").toLowerCase()] ?? 99;
                          const mb = MATCH_ORDER[String(b.matchLevel || "").toLowerCase()] ?? 99;
                          return ma - mb;
                        })
                        .slice(0, 3);
                      if (!coreGaps.length) return null;
                      return (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="inline-flex items-center rounded-full border border-red-200/60 bg-red-50/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-600">핵심 탈락 리스크</div>
                            <p className="text-lg font-bold tracking-tight text-slate-950">탈락 가능성이 높은 JD 핵심 gap</p>
                            <p className="text-sm leading-6 text-slate-500">문장 수정 전에 먼저 확인해야 할 JD 필수요건과 이력서 근거의 간극입니다.</p>
                          </div>
                          <div className="space-y-2">
                            {coreGaps.map((gap, idx) => {
                              const req = String(gap.requirement || "").trim();
                              const gapMatch = String(gap.matchLevel || "").trim();
                              const gapSev = String(gap.severity || "").trim();
                              const riskReason = String(gap.riskReason || "").trim();
                              if (!req) return null;
                              return (
                                <div key={idx} className="flex items-start gap-3 rounded-2xl border border-red-100/70 bg-white px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-0.5">
                                    {gapSev ? (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSeverityBadgeClass(gapSev)}`}>
                                        {SEVERITY_KO[gapSev] || gapSev}
                                      </span>
                                    ) : null}
                                    {gapMatch ? (
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getMatchLevelBadgeClass(gapMatch)}`}>
                                        {MATCH_LEVEL_KO[gapMatch] || gapMatch}
                                      </span>
                                    ) : null}
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-0.5">
                                    <p className="break-keep text-sm font-semibold text-slate-900">{req}</p>
                                    {riskReason ? <p className="break-keep text-xs leading-5 text-slate-500">{riskReason}</p> : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* C. 먼저 고칠 이력서 문장 */}
                    {rewriteDirs.length > 0 ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center rounded-full border border-blue-200/60 bg-blue-50/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-600">수정 방향</div>
                          <p className="text-lg font-bold tracking-tight text-slate-950">먼저 고칠 이력서 문장</p>
                          <p className="text-sm leading-6 text-slate-500">이력서에서 가장 먼저 수정해야 할 문장과 방향입니다.</p>
                        </div>
                        <div className="space-y-4">
                          {rewriteDirs.slice(0, 3).map((dir, idx) => {
                            const orig = String(dir.originalEvidence || "").trim();
                            const direction = String(dir.direction || "").trim();
                            const riskReason = String(dir.riskReason || "").trim();
                            const safe = String(dir.safeExample || "").trim();
                            const stronger = String(dir.strongerExample || "").trim();
                            const confirmQ = String(dir.confirmationQuestion || "").trim();
                            if (!direction) return null;
                            return (
                              <div key={idx} className="space-y-4 rounded-2xl border border-blue-200/60 bg-white px-5 py-5">
                                {orig ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">현재 근거</p>
                                    <p className="break-keep rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{orig}</p>
                                  </div>
                                ) : null}
                                {riskReason ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">약하게 읽히는 이유</p>
                                    <p className="break-keep text-sm leading-6 text-slate-600">{riskReason}</p>
                                  </div>
                                ) : null}
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">이렇게 바꾸기</p>
                                  <p className="break-keep text-base font-semibold leading-6 text-slate-900">{direction}</p>
                                </div>
                                {safe ? (
                                  <div className="rounded-xl border-l-4 border-blue-400 bg-blue-50/60 px-4 py-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-500">수정 예시</p>
                                    <p className="break-keep text-sm italic leading-6 text-slate-800">{safe}</p>
                                  </div>
                                ) : null}
                                {stronger ? (
                                  <div className="rounded-xl border border-green-200/60 bg-green-50/40 px-4 py-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-green-600">더 강한 표현 가능</p>
                                    <p className="break-keep text-sm italic leading-6 text-slate-800">{stronger}</p>
                                  </div>
                                ) : null}
                                {confirmQ ? (
                                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">이게 있다면 더 강한 표현 가능</p>
                                    <p className="break-keep text-sm leading-6 text-slate-700">{confirmQ}</p>
                                  </div>
                                ) : null}
                                {dir.needsUserConfirmation === true && !confirmQ ? (
                                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">사실 확인 후 사용</span>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* D. 쓰면 위험한 표현 */}
                    {overclaimWarnings.length > 0 ? (
                      <div className="space-y-4">
                        {(() => {
                          // C-1: determine section type based on warningType
                          const hasOverclaimType = overclaimWarnings.some(w => {
                            const t = inferWarningType(w);
                            return t === 'overclaim' || t === 'needs_confirmation';
                          });
                          const onlyWeakExpression = !hasOverclaimType;
                          const sectionLabel = onlyWeakExpression ? "약한 표현" : "주의 표현";
                          const sectionTitle = onlyWeakExpression ? "임팩트가 약하게 읽히는 표현" : "쓰면 위험한 표현";
                          const sectionDesc = onlyWeakExpression
                            ? "경험 자체보다 관심·참여 중심으로 보여 임팩트가 약해질 수 있는 표현입니다."
                            : "채용담당자에게 과장으로 읽힐 수 있는 표현입니다.";
                          const sectionBadgeColor = onlyWeakExpression
                            ? "border-amber-200/60 bg-amber-50/60 text-amber-600"
                            : "border-rose-200/60 bg-rose-50/60 text-rose-600";
                          return (
                            <div className="space-y-1">
                              <div className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${sectionBadgeColor}`}>{sectionLabel}</div>
                              <p className="text-lg font-bold tracking-tight text-slate-950">{sectionTitle}</p>
                              <p className="text-sm leading-6 text-slate-500">{sectionDesc}</p>
                            </div>
                          );
                        })()}
                        <div className="space-y-3">
                          {overclaimWarnings.slice(0, 3).map((w, idx) => {
                            const wType = inferWarningType(w);
                            const isWeakExp = wType === 'weak_expression';
                            const risk = String(w.risk || "").trim();
                            const reason = String(w.reason || "").trim();
                            const genericRisk = new Set(["과장 위험", "주의 필요", "불명확함"]);
                            const isGeneric = !risk || genericRisk.has(risk);
                            const displayTitle = isGeneric ? (reason || "주의가 필요한 주장") : risk;
                            const wConfirmQ = String(w.confirmationQuestion || "").trim();
                            // C-2: per-item label by warningType
                            const itemLabel = wType === 'weak_expression' ? "더 구체화"
                              : wType === 'needs_confirmation' ? "확인 후 사용"
                              : "피하기";
                            const itemLabelColor = isWeakExp ? "text-amber-600" : "text-rose-500";
                            const cardBorderColor = isWeakExp
                              ? "border-amber-200/50 bg-amber-50/20"
                              : "border-rose-200/50 bg-rose-50/30";
                            // Prefer saferAlternative from warning itself; fall back to matched rewriteDir only on confident match
                            const safeAlt = (() => {
                              const warnSafer = String(w.saferAlternative || "").trim();
                              if (warnSafer) return warnSafer;
                              const linked = String(w.linkedOriginalEvidence || "").trim();
                              if (linked) {
                                const matchDir = rewriteDirs.find((d) => {
                                  const orig = String(d.originalEvidence || "").trim();
                                  return orig.length > 5 && linked.length > 5 && orig.slice(0, 8) === linked.slice(0, 8);
                                });
                                if (matchDir) return String(matchDir.safeExample || "").trim();
                              }
                              return "";
                            })();
                            return (
                              <div key={idx} className={`space-y-3 rounded-2xl border px-5 py-4 ${cardBorderColor}`}>
                                <div className="space-y-1">
                                  <p className={`text-xs font-semibold uppercase tracking-wider ${itemLabelColor}`}>{itemLabel}</p>
                                  <p className="break-keep text-base font-semibold text-slate-900">{displayTitle}</p>
                                </div>
                                {reason ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">이유</p>
                                    <p className="break-keep text-sm leading-6 text-slate-600">{reason}</p>
                                  </div>
                                ) : null}
                                {safeAlt ? (
                                  <div className="rounded-xl border border-blue-200/60 bg-blue-50/40 px-4 py-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-500">대신 이렇게 쓰기</p>
                                    <p className="break-keep text-sm leading-6 text-slate-700">{safeAlt}</p>
                                  </div>
                                ) : null}
                                {wConfirmQ ? (
                                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/40 px-4 py-3">
                                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-600">이 표현을 쓰려면 확인할 것</p>
                                    <p className="break-keep text-sm leading-6 text-slate-700">{wConfirmQ}</p>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* E. 강점으로 살릴 경험 */}
                    {transferables.length > 0 ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center rounded-full border border-green-200/60 bg-green-50/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-green-600">강점 신호</div>
                          <p className="text-lg font-bold tracking-tight text-slate-950">강점으로 살릴 경험</p>
                          <p className="text-sm leading-6 text-slate-500">보유 경험 중 JD 요구와 연결 가능한 항목입니다.</p>
                        </div>
                        <div className="space-y-3">
                          {transferables.slice(0, 3).map((s, idx) => {
                            const ev = String(s.resumeEvidence || "").trim();
                            const to = String(s.canTransferTo || "").trim();
                            const limit = String(s.limit || "").trim();
                            if (!ev && !to) return null;
                            return (
                              <div key={idx} className="space-y-3 rounded-2xl border border-green-200/50 bg-green-50/30 px-5 py-4">
                                {ev ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">현재 경험</p>
                                    <p className="break-keep text-sm leading-6 text-slate-700">{ev}</p>
                                  </div>
                                ) : null}
                                {to ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600">연결 가능한 JD 요구</p>
                                    <p className="break-keep text-sm font-semibold leading-6 text-slate-800">{to}</p>
                                  </div>
                                ) : null}
                                {limit ? (
                                  <div className="rounded-lg border border-amber-200/50 bg-amber-50/40 px-3 py-2">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">아직 부족한 점</p>
                                    <p className="mt-1 break-keep text-sm leading-5 text-slate-600">{limit}</p>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* F. 채용담당자 판단 요약 */}
                    {(recruiterInterpretation || targetProfile || resumeProfile) ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center rounded-full border border-slate-200/60 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">근거 맥락</div>
                          <p className="text-lg font-bold tracking-tight text-slate-950">채용담당자 판단 요약</p>
                        </div>
                        {recruiterInterpretation ? (
                          <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-slate-200/80 bg-white px-5 py-4">
                            <p className="min-w-0 flex-1 break-keep text-base leading-6 text-slate-700">{recruiterInterpretation}</p>
                            {overallRiskLevel ? (
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getSeverityBadgeClass(overallRiskLevel)}`}>
                                {RISK_LEVEL_KO[overallRiskLevel] || overallRiskLevel}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        {(targetProfile || resumeProfile) ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr]">
                            {targetProfile ? (
                              <div className="rounded-2xl border border-blue-200/60 bg-blue-50/40 px-4 py-4">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500">JD가 찾는 후보</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{targetProfile}</p>
                              </div>
                            ) : <div />}
                            <div className="flex items-center justify-center">
                              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-400">VS</span>
                            </div>
                            {resumeProfile ? (
                              <div className="rounded-2xl border border-green-200/60 bg-green-50/40 px-4 py-4">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600">이력서에서 먼저 읽히는 모습</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{resumeProfile}</p>
                              </div>
                            ) : <div />}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {/* G. 근거 확인: JD ↔ 이력서 연결 맵 */}
                    {calibratedMustGaps.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="inline-flex items-center rounded-full border border-slate-200/60 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">근거 확인</div>
                          <p className="text-lg font-bold tracking-tight text-slate-950">근거 확인: JD ↔ 이력서 연결 맵</p>
                          <p className="text-sm leading-6 text-slate-500">위 수정 방향이 나온 근거를 확인할 수 있습니다.</p>
                        </div>
                        <div className="space-y-3">
                          {calibratedMustGaps.map((gap, idx) => {
                            const req = String(gap.requirement || "").trim();
                            if (!req) return null;
                            const jdEv = String(gap.jdEvidence || "").trim() || req;
                            const resumeEv = String(gap.resumeEvidence || "").trim() || "이력서에서 직접 근거가 충분히 확인되지 않습니다.";
                            const reason = String(gap.riskReason || "").trim();
                            const matchLevel = String(gap.matchLevel || "").trim();
                            const execLevel = String(gap.executionLevel || "").trim();
                            const severity = String(gap.severity || "").trim();
                            return (
                              <div key={idx} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
                                <div className="flex items-start gap-2 border-b border-slate-100 px-4 py-3">
                                  {severity ? (
                                    <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${getSeverityBadgeClass(severity)}`}>
                                      {SEVERITY_KO[severity] || "—"}
                                    </span>
                                  ) : null}
                                  <p className="flex-1 min-w-0 break-keep text-sm font-semibold leading-5 text-slate-900">{req}</p>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_108px_minmax(0,1fr)]">
                                  <div className="px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">JD 요구</p>
                                    <p className="mt-1 break-keep text-sm leading-6 text-slate-600">{jdEv}</p>
                                  </div>
                                  <div className="hidden lg:flex flex-col items-center justify-center px-2 py-2 gap-1">
                                    <div className="h-3 w-px border-l border-dashed border-slate-300" />
                                    {matchLevel ? (
                                      <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap ${getMatchLevelBadgeClass(matchLevel)}`}>
                                        {MATCH_LEVEL_KO[matchLevel] || matchLevel}
                                      </span>
                                    ) : null}
                                    {(execLevel && execLevel !== "unclear") ? (
                                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 whitespace-nowrap border border-slate-200">
                                        {EXECUTION_LEVEL_KO[execLevel] || execLevel}
                                      </span>
                                    ) : null}
                                    <div className="h-3 w-px border-l border-dashed border-slate-300" />
                                  </div>
                                  {(matchLevel || (execLevel && execLevel !== "unclear")) ? (
                                    <div className="flex lg:hidden items-center gap-1.5 px-4 py-2">
                                      {matchLevel ? (
                                        <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${getMatchLevelBadgeClass(matchLevel)}`}>
                                          {MATCH_LEVEL_KO[matchLevel] || matchLevel}
                                        </span>
                                      ) : null}
                                      {(execLevel && execLevel !== "unclear") ? (
                                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                                          {EXECUTION_LEVEL_KO[execLevel] || execLevel}
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  <div className="px-4 py-3 lg:border-l lg:border-slate-100">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-green-600">이력서 근거</p>
                                    <p className="mt-1 break-keep text-sm leading-6 text-slate-600">{resumeEv}</p>
                                  </div>
                                </div>
                                {reason ? (
                                  <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                      {matchLevel === "strong"
                                        ? "확인된 연결 근거"
                                        : matchLevel === "partial"
                                          ? "아직 약하게 읽히는 이유"
                                          : "부족하게 읽히는 이유"}
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600">{reason}</p>
                                  </div>
                                ) : null}
                                {matchLevel !== "strong" && (matchLevel === "missing" || matchLevel === "weak" || matchLevel === "partial" || matchLevel === "unclear" || resumeEv === "불명확함") && questions.length > 0 ? (() => {
                                  const linkedQ = getLinkedQuestionForGap(gap, questions, { profileKey: calibrationProfileKey });
                                  const qText = String(linkedQ?.question || "").trim();
                                  return qText ? (
                                    <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-3">
                                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">추가로 확인할 질문</p>
                                      <p className="mt-1 text-sm leading-6 text-slate-600">{qText}</p>
                                    </div>
                                  ) : null;
                                })() : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* F. Summary grid removed: mustGaps shown in G, rewriteDirs in C, overclaimWarnings in D, transferableSignals in E */}

                    {/* H. 더 확인해야 할 질문 */}
                    {questions.length > 0 ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <p className="text-lg font-bold tracking-tight text-slate-950">더 확인해야 할 질문</p>
                          <p className="text-sm leading-6 text-slate-400">면접이나 추가 정보를 통해 확인하면 좋은 질문들</p>
                        </div>
                        <div className="space-y-2">
                          {questions.map((q, idx) => {
                            const question = String(q.question || "").trim();
                            const why = String(q.whyItMatters || "").trim();
                            const priority = String(q.priority || "").trim();
                            if (!question) return null;
                            return (
                              <div key={idx} className="rounded-xl border border-slate-200/70 bg-white px-4 py-4 space-y-2">
                                <div className="flex items-start gap-2">
                                  {priority ? (
                                    <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-xs font-semibold ${getPriorityBadgeClass(priority)}`}>
                                      {PRIORITY_KO[priority] || priority}
                                    </span>
                                  ) : null}
                                  <p className="flex-1 text-sm leading-6 text-slate-800">{question}</p>
                                </div>
                                {why ? <p className="text-sm leading-6 text-slate-500">{why}</p> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* I. Trust/disclaimer bar */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                      <p className="text-xs leading-5 text-slate-400">이 분석은 AI가 JD와 이력서를 기반으로 정량·정성 분석한 결과입니다. 최종 판단은 면접과 추가 정보 확인을 통해 달라질 수 있습니다.</p>
                    </div>
                  </section>
                );
              }

              if (aiIsPending) {
                const isRetryingAi = aiMeta?.retrying === true;
                return (
                  <section className="space-y-5 rounded-2xl border border-blue-100/60 bg-blue-50/40 p-7">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-slate-900">
                          {isRetryingAi ? "AI 심화 해석을 다시 불러오는 중입니다." : "서류탈락 원인을 분석하고 있어요"}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {isRetryingAi ? (
                            "기본 분석 결과는 그대로 유지됩니다."
                          ) : (
                            <>
                              입력하신 JD와 이력서를 바탕으로 채용담당자 관점의 심화 해석을 생성 중입니다.<br />
                              답변 완성까지 보통 약 10초 정도 소요됩니다.
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-blue-100 bg-white/60 px-5 py-4">
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 animate-pulse" />
                        JD의 필수요건을 확인하고 있어요
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300 animate-pulse" style={{ animationDelay: "0.3s" }} />
                        이력서에서 부족하게 읽힐 수 있는 항목을 찾고 있어요
                      </div>
                      <div className="flex items-center gap-2.5 text-sm text-slate-600">
                        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-200 animate-pulse" style={{ animationDelay: "0.6s" }} />
                        채용담당자가 궁금해할 질문을 정리하고 있어요
                      </div>
                    </div>
                  </section>
                );
              }

              if (aiIsFailure || (aiMeta?.ok === true && !aiDeepAnalysis)) {
                const errorCode = typeof aiMeta?.errorCode === "string" ? aiMeta.errorCode : "";
                const userMessage = getAiErrorUserMessage(errorCode);
                const requestId = typeof aiMeta?.requestId === "string" ? aiMeta.requestId.trim() : "";
                const canRetry = typeof onRetryAiDeepAnalysis === "function";
                return (
                  <section className="rounded-2xl border border-slate-200/70 bg-slate-50/60 px-5 py-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-700">{userMessage.title}</p>
                    <p className="text-sm leading-6 text-slate-500">{userMessage.body}</p>
                    <p className="text-sm leading-6 text-slate-500">기본 분석 결과는 아래에서 계속 확인할 수 있습니다.</p>
                    {canRetry ? (
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={onRetryAiDeepAnalysis}
                          className="h-9 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          AI 심화 해석 다시 시도
                        </Button>
                      </div>
                    ) : null}
                    {requestId ? (
                      <p className="pt-1 text-xs text-slate-400">문제 추적 ID: {requestId}</p>
                    ) : null}
                  </section>
                );
              }

              return null;
            })()}

            {!(aiIsPending || aiIsSuccess) && (
            <>
            {/* Hotfix 2026-05-24: never show the empty-result fallback while analysis is still running. */}
            {(() => {
              const __preciseBuildError = typeof analysis?.preciseAnalysis?.error === "string"
                ? analysis.preciseAnalysis.error.trim()
                : "";
              const __hasPreciseBuildError =
                !isAnalyzing &&
                !analysis?.preciseAnalysis?.compositeRisk &&
                __preciseBuildError.length > 0;
              const __shouldShowEmptyFallback =
                !__hasPreciseBuildError &&
                !isAnalyzing &&
                reportSectionItems.length === 0 &&
                topItems.length === 0 &&
                insufItems.length === 0 &&
                lowItems.length === 0;
              // Hotfix 2 (2026-05-24): diagnostic snapshot when the empty-result fallback would render.
              // Helps trace why analysis.preciseAnalysis.compositeRisk did not materialize after
              // deterministic + AI flows complete. Side-effect only when the fallback condition holds.
              if (__shouldShowEmptyFallback || __hasPreciseBuildError) {
                try {
                  if (typeof window !== "undefined") {
                    window.__PASSMAP_PRECISE_EMPTY_RESULT_DEBUG__ = {
                      at: Date.now(),
                      isAnalyzing,
                      hasAnalysis: Boolean(analysis),
                      hasPreciseAnalysis: Boolean(analysis?.preciseAnalysis),
                      hasCompositeRisk: Boolean(analysis?.preciseAnalysis?.compositeRisk),
                      hasReportPack: Boolean(analysis?.reportPack),
                      reportSectionCount: reportSectionItems.length,
                      topCount: topItems.length,
                      insufCount: insufItems.length,
                      lowCount: lowItems.length,
                      aiMeta: analysis?.preciseAnalysis?.aiMeta || analysis?.aiMeta || null,
                      preciseError: analysis?.preciseAnalysis?.error || null,
                      analysisKey: analysis?.key || null,
                      renderedAs: __hasPreciseBuildError ? "build_error_card" : "empty_fallback",
                    };
                  }
                } catch {}
              }
              if (__hasPreciseBuildError) {
                // Hotfix 4 (2026-05-24): when analysis.preciseAnalysis.error is set, render a
                // dedicated build-error card instead of the generic empty fallback. The AI
                // failure card has its own branch above (aiIsFailure) — keep this distinct from
                // it so users know the deterministic risk pipeline did not complete.
                return (
                  <div className="rounded-2xl border border-rose-200/60 bg-rose-50/50 px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-rose-900">서류탈락 정밀 분석을 완성하지 못했습니다.</p>
                    <p className="mt-2 text-sm leading-6 text-rose-700">
                      입력값은 정상적으로 저장되었지만, 정밀 리스크 계산 중 일부 단계가 실패했습니다. 분석을 다시 실행해 주세요.
                    </p>
                    <p className="mt-2 text-xs leading-5 text-rose-500">
                      문제가 반복되면 브라우저 콘솔에서 <code>__PRECISE_ANALYSIS_BUILD_ERR__</code> 값을 확인해 주세요.
                    </p>
                  </div>
                );
              }
              return __shouldShowEmptyFallback ? (
                <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-6 text-center">
                  <p className="text-sm font-semibold text-amber-900">분석 결과를 불러오지 못했습니다.</p>
                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    입력 내용을 다시 확인한 뒤 분석을 다시 실행해주세요.
                  </p>
                </div>
              ) : null;
            })()}

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
            </>
            )}
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
        <div className="flex items-center justify-start gap-2" data-print-hidden="true">
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
          {typeof onReset === "function" ? (
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              분석 다시 시작
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
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
        {typeof onReset === "function" && (state?.jd || state?.resume) ? (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isAnalyzing}
            className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            분석 다시 시작
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
            먼저 채용공고와 이력서를 입력해 주세요. URL 불러오기가 실패하면 공고 내용을 직접 복사해 붙여넣으면 됩니다.
          </div>

          {/* 채용공고 입력 */}
          <div className="text-sm font-semibold text-slate-900">채용공고 입력</div>

          {/* JD URL 불러오기 */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-4">
            <div className="text-sm font-semibold text-slate-700">채용공고 URL로 JD 불러오기</div>
            <p className="text-xs text-slate-500">
              채용공고 URL을 붙여넣으면 JD 자동 불러오기를 시도합니다. 실패하면 원문 공고를 열어 모집요강을 복사해 아래에 붙여넣어 주세요.
            </p>
            {/* 채용공고 사이트 바로가기 */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-slate-400">채용공고 사이트 바로가기</span>
              <div className="flex gap-2">
                <a
                  href="https://www.jobkorea.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-800"
                >
                  JobKorea <span className="opacity-80">잡코리아</span>
                </a>
                <a
                  href="https://www.saramin.co.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Saramin <span className="opacity-80">사람인</span>
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                placeholder="https://www.jobkorea.co.kr/..."
                value={jdUrl}
                onChange={(e) => {
                  setJdUrl(e.target.value);
                  if (jdUrlLoadStatus !== "idle") setJdUrlLoadStatus("idle");
                  if (jdUrlError) setJdUrlError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLoadJDFromUrl();
                }}
              />
              <button
                type="button"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLoadJDFromUrl}
                disabled={jdUrlLoadStatus === "loading"}
              >
                {jdUrlLoadStatus === "loading" ? "불러오는 중..." : "불러오기"}
              </button>
            </div>
            {jdUrl.trim() && (
              <a
                href={jdUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-1 text-sm text-slate-500 underline underline-offset-2 hover:text-slate-700"
              >
                원문 공고 열기
              </a>
            )}
            {jdUrlLoadStatus === "success" && !jdUrlError && (
              <div className="text-sm text-emerald-700">
                채용공고 내용을 불러왔어요. 아래 JD 내용을 확인한 뒤 분석을 진행해 주세요.
              </div>
            )}
            {jdUrlError && (
              <div className="text-sm text-red-600">{jdUrlError}</div>
            )}
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-700">지원한 JD (채용공고)</div>
            <Textarea
              value={state?.jd || ""}
              onChange={(e) => setState((prev) => ({ ...prev, jd: e.target.value }))}
              className="min-h-[220px] rounded-3xl border border-slate-200 px-4 py-4 text-sm leading-6"
            />
          </div>

          <div className="text-sm font-semibold text-slate-900">이력서 입력</div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-700">제출할 이력서</div>
            <Textarea
              value={state?.resume || ""}
              onChange={(e) => setState((prev) => ({ ...prev, resume: e.target.value }))}
              className="min-h-[240px] rounded-3xl border border-slate-200 px-4 py-4 text-sm leading-6"
            />
          </div>

          {/* 분석 기준 보정 */}
          <details className="rounded-2xl border border-slate-200 bg-slate-50/60">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
              분석 기준 보정
              <span className="ml-2 text-xs font-normal text-slate-400">JD에 여러 모집부문이 함께 있을 때만 열어 입력해도 됩니다.</span>
            </summary>
            <div className="space-y-4 px-4 pb-4">
            <p className="pt-2 text-xs text-slate-500">필수는 아니지만, JD에 여러 모집부문이 함께 있다면 '공고 내 지원 모집부문명'만 입력해도 분석 기준을 좁힐 수 있습니다.</p>

            <div className="space-y-1.5">
              <div className="text-sm font-medium text-slate-700">지원 직무 <span className="font-normal text-slate-400">(선택)</span></div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900"
                  value={preciseTargetJobMajor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPreciseTargetJobMajor(v);
                    setPreciseTargetJobSub("");
                    setState((prev) => ({ ...prev, preciseTargetJobTaxonomy: null }));
                  }}
                >
                  <option value="">직무 대분류</option>
                  {JOB_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.v} value={c.v}>{c.t}</option>
                  ))}
                </select>
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900"
                  value={preciseTargetJobSub}
                  disabled={!preciseTargetJobMajor}
                  onChange={(e) => {
                    const sub = e.target.value;
                    setPreciseTargetJobSub(sub);
                    const found = preciseTargetJobMajor && sub
                      ? resolvePreciseJobSelection({ majorCategory: preciseTargetJobMajor, subcategory: sub })
                      : null;
                    setState((prev) => ({
                      ...prev,
                      preciseTargetJobTaxonomy: sub ? {
                        major: preciseTargetJobMajor,
                        sub,
                        label: found?.label || sub,
                        jobId: found?.id || "",
                      } : null,
                    }));
                  }}
                >
                  <option value="">직무 소분류</option>
                  {preciseTargetJobSubs.map((s) => (
                    <option key={s.v} value={s.v}>{s.t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-medium text-slate-700">지원 산업 <span className="font-normal text-slate-400">(선택)</span></div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900"
                  value={preciseTargetIndustryMajor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPreciseTargetIndustryMajor(v);
                    setPreciseTargetIndustrySub("");
                    setState((prev) => ({ ...prev, preciseTargetIndustryResolved: null }));
                  }}
                >
                  <option value="">산업 대분류</option>
                  {INDUSTRY_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.v} value={c.v}>{c.t}</option>
                  ))}
                </select>
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900"
                  value={preciseTargetIndustrySub}
                  disabled={!preciseTargetIndustryMajor}
                  onChange={(e) => {
                    const sub = e.target.value;
                    setPreciseTargetIndustrySub(sub);
                    const found = preciseTargetIndustryMajor && sub
                      ? findIndustryRegistryByUiSelection({ sector: preciseTargetIndustryMajor, subSector: sub })
                      : null;
                    setState((prev) => ({
                      ...prev,
                      preciseTargetIndustryResolved: sub ? {
                        major: preciseTargetIndustryMajor,
                        sub,
                        label: found?.label || found?.name || sub,
                        id: found?.id || "",
                      } : null,
                    }));
                  }}
                >
                  <option value="">산업 소분류</option>
                  {preciseTargetIndustrySubs.map((s) => (
                    <option key={s.v} value={s.v}>{s.t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-medium text-slate-700">현재·최근 직무 <span className="font-normal text-slate-400">(선택)</span></div>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900"
                  value={preciseCurrentJobMajor}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPreciseCurrentJobMajor(v);
                    setPreciseCurrentJobSub("");
                    setState((prev) => ({ ...prev, preciseCurrentJobTaxonomy: null }));
                  }}
                >
                  <option value="">직무 대분류</option>
                  {JOB_CATEGORY_OPTIONS.map((c) => (
                    <option key={c.v} value={c.v}>{c.t}</option>
                  ))}
                </select>
                <select
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-900"
                  value={preciseCurrentJobSub}
                  disabled={!preciseCurrentJobMajor}
                  onChange={(e) => {
                    const sub = e.target.value;
                    setPreciseCurrentJobSub(sub);
                    const found = preciseCurrentJobMajor && sub
                      ? resolvePreciseJobSelection({ majorCategory: preciseCurrentJobMajor, subcategory: sub })
                      : null;
                    setState((prev) => ({
                      ...prev,
                      preciseCurrentJobTaxonomy: sub ? {
                        major: preciseCurrentJobMajor,
                        sub,
                        label: found?.label || sub,
                        jobId: found?.id || "",
                      } : null,
                    }));
                  }}
                >
                  <option value="">직무 소분류</option>
                  {preciseCurrentJobSubs.map((s) => (
                    <option key={s.v} value={s.v}>{s.t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm font-medium text-slate-700">공고 내 지원 모집부문명 <span className="font-normal text-slate-400">(선택)</span></div>
              <p className="text-xs text-slate-500">공고에 여러 직무가 함께 있다면, 지원하려는 부문만 입력해 주세요.</p>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                placeholder="예: Renal 마케팅, 사업개발, 글로벌 RA"
                value={state?.targetRoleInPosting || ""}
                onChange={(e) => setState((prev) => ({ ...prev, targetRoleInPosting: e.target.value }))}
              />
            </div>
            </div>
          </details>

          <details className="rounded-2xl border border-slate-200 bg-slate-50/60">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900">
              파일로 입력하기
              <span className="ml-2 text-xs font-normal text-slate-400">PDF/DOCX/TXT 파일이 있다면 열어서 업로드할 수 있습니다.</span>
            </summary>
            <div className="px-4 pb-4 pt-2">
              <UploadPanel onExtract={handleExtract} />
            </div>
          </details>

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
      <div className="flex items-center justify-start gap-2">
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
        {typeof onReset === "function" && (state?.jd || state?.resume) ? (
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={isAnalyzing}
            className="h-9 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            분석 다시 시작
          </Button>
        ) : null}
      </div>
    </div>
  );
}
