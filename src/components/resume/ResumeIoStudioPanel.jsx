import React from "react";
import ResumeExportPanel from "./ResumeExportPanel.jsx";
import ResumeImportReview from "./ResumeImportReview.jsx";
import ResumeJdTailoringPanel from "./ResumeJdTailoringPanel.jsx";

function StatusPill({ label, active }) {
  return (
    <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
      {label}: {active ? "있음" : "없음"}
    </div>
  );
}

export default function ResumeIoStudioPanel({
  profile,
  parsedResume = null,
  rawResumeText = "",
  importMeta = null,
}) {
  const hasParsedResume = Boolean(parsedResume && typeof parsedResume === "object");
  const hasRawResumeText = String(rawResumeText || "").trim().length > 0;
  const hasProfile = Boolean(profile);
  const sourceLabel = importMeta?.fileName || importMeta?.label || "가져온 이력서";

  return (
    <section className="mt-4 space-y-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-950">이력서 가져오기/내보내기</h2>
        <p className="mt-1 text-sm text-slate-500">가져온 이력서를 검수하고, 제출 가능한 형식으로 내보내세요.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <StatusPill label="ResumeProfile 생성됨" active={hasProfile} />
        <StatusPill label="parsedResume" active={hasParsedResume} />
        <StatusPill label="raw resume text" active={hasRawResumeText} />
      </div>

      {importMeta ? (
        <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          source: {sourceLabel}
        </div>
      ) : null}

      {!hasProfile ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
          이력서를 분석하면 검수/내보내기 도구가 표시됩니다.
        </div>
      ) : (
        <div className="space-y-4">
          <ResumeImportReview profile={profile} />
          <ResumeExportPanel profile={profile} />
          <ResumeJdTailoringPanel profile={profile} />
        </div>
      )}
    </section>
  );
}
