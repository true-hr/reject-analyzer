import React from "react";

const MISSING_COPY = {
  "identity.name": "이름 정보가 비어 있습니다.",
  "identity.contact": "연락처 정보가 비어 있습니다.",
  "headline.summary": "요약 문장이 비어 있습니다.",
  experiences: "경력 정보가 비어 있습니다.",
  projects: "프로젝트 정보가 비어 있습니다.",
  education: "학력 정보가 비어 있습니다.",
  skills: "스킬 정보가 비어 있습니다.",
};

function scoreTone(score) {
  const value = Number(score) || 0;
  if (value >= 80) return "text-emerald-700";
  if (value >= 60) return "text-sky-700";
  return "text-amber-700";
}

function ScoreItem({ label, score }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${scoreTone(score)}`}>{Number(score || 0)}</div>
    </div>
  );
}

export default function ResumeQualityPanel({ quality }) {
  const missingSections = Array.isArray(quality?.missingSections) ? quality.missingSections : [];
  const riskyClaims = Array.isArray(quality?.riskyClaims) ? quality.riskyClaims : [];
  const duplicateBullets = Array.isArray(quality?.duplicateBullets) ? quality.duplicateBullets : [];
  const evidenceScore = Number(quality?.evidenceScore || 0);

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ScoreItem label="완성도" score={quality?.completenessScore} />
        <ScoreItem label="근거 점수" score={quality?.evidenceScore} />
        <ScoreItem label="ATS 기본 점수" score={quality?.atsScore} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg bg-white px-3 py-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-950">비어 있는 항목</div>
          <ul className="mt-2 space-y-1">
            {missingSections.length ? (
              missingSections.map((item) => <li key={item}>{MISSING_COPY[item] || `${item} 정보가 비어 있습니다.`}</li>)
            ) : (
              <li>주요 항목이 채워져 있습니다.</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg bg-white px-3 py-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-950">근거 확인</div>
          <ul className="mt-2 space-y-1">
            {evidenceScore < 60 ? <li>성과 문장에 수치/결과가 부족합니다.</li> : null}
            {riskyClaims.length ? <li>근거 확인이 필요한 문장이 있습니다.</li> : null}
            {riskyClaims.slice(0, 2).map((item) => <li key={item} className="truncate text-xs text-slate-500">{item}</li>)}
            {!riskyClaims.length && evidenceScore >= 60 ? <li>근거 위험 신호가 낮습니다.</li> : null}
          </ul>
        </div>
        <div className="rounded-lg bg-white px-3 py-3 text-sm text-slate-700">
          <div className="font-semibold text-slate-950">중복 가능성</div>
          <ul className="mt-2 space-y-1">
            {duplicateBullets.length ? <li>중복 가능성이 있는 문장이 있습니다.</li> : <li>중복 가능성이 낮습니다.</li>}
            {duplicateBullets.slice(0, 2).map((item) => <li key={item} className="truncate text-xs text-slate-500">{item}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
