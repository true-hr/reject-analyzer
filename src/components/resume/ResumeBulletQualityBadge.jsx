import React from "react";

const STRENGTH_LABELS = {
  strong: "강함",
  medium: "보통",
  weak: "약함",
};

const EVIDENCE_LABELS = {
  metric_outcome: "수치+결과",
  metric: "수치 근거",
  outcome: "결과 표현",
  task: "업무 설명",
  descriptive: "업무 설명",
  weak: "담당/수행 중심",
  unknown: "근거 불명확",
  empty: "근거 불명확",
};

const STRENGTH_CLASS = {
  strong: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  weak: "border-amber-200 bg-amber-50 text-amber-900",
};

function strengthKey(score) {
  const value = Number(score);
  if (Number.isFinite(value) && value >= 80) return "strong";
  if (Number.isFinite(value) && value >= 60) return "medium";
  return "weak";
}

export default function ResumeBulletQualityBadge({ bullet }) {
  const key = strengthKey(bullet?.strengthScore);
  const evidenceType = bullet?.evidenceType || "unknown";
  const evidenceLabel = EVIDENCE_LABELS[evidenceType] || EVIDENCE_LABELS.unknown;

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STRENGTH_CLASS[key]}`}>
      <span>{STRENGTH_LABELS[key]}</span>
      <span className="opacity-60">·</span>
      <span>{evidenceLabel}</span>
    </span>
  );
}
