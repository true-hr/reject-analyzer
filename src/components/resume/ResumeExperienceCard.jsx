import React from "react";
import ResumeBulletQualityBadge from "./ResumeBulletQualityBadge.jsx";

function joinPeriod(startDate, endDate) {
  const start = startDate || "시작일 미확인";
  const end = endDate || "종료일 미확인";
  return `${start} - ${end}`;
}

export default function ResumeExperienceCard({ experience }) {
  const bullets = Array.isArray(experience?.bullets) ? experience.bullets : [];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-950">{experience?.company || "회사명 미확인"}</h3>
          <p className="mt-1 text-sm text-slate-700">{experience?.title || "역할 미확인"}</p>
        </div>
        <div className="text-left text-xs text-slate-500 sm:text-right">
          <div>{joinPeriod(experience?.startDate, experience?.endDate)}</div>
          {experience?.employmentType ? <div className="mt-1">{experience.employmentType}</div> : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {bullets.length ? (
          bullets.map((bullet) => (
            <div key={bullet.id || bullet.text} className="flex flex-col gap-2 rounded-md bg-slate-50 px-3 py-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 text-sm leading-6 text-slate-800">
                <div>{bullet.text}</div>
                {bullet.evidenceType === "weak" ? (
                  <div className="mt-1 text-xs text-amber-700">결과/수치/기여도가 부족할 수 있습니다.</div>
                ) : null}
              </div>
              <ResumeBulletQualityBadge bullet={bullet} />
            </div>
          ))
        ) : (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-500">아직 성과 문장이 없습니다.</div>
        )}
      </div>
    </article>
  );
}
