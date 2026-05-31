import React from "react";
import {
  hasParsedResumeContent,
  normalizeResumeIoList,
  normalizeResumeIoText,
} from "../../lib/resume/resumeProfileFromParsedResume.js";

function StatusPill({ label, tone = "slate" }) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>
      {label}
    </span>
  );
}

function PanelSection({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CompactList({ items, emptyLabel }) {
  const list = normalizeResumeIoList(items).slice(0, 5);
  if (!list.length) return <div className="text-xs text-slate-400">{emptyLabel}</div>;

  return (
    <ul className="space-y-1.5 text-xs leading-5 text-slate-600">
      {list.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ResumeImportReview({ profile, parsedResume, rawResumeText, importMeta }) {
  const timelineCount = Array.isArray(profile?.timeline) ? profile.timeline.length : 0;
  const rawTextCharCount = normalizeResumeIoText(rawResumeText).length || Number(profile?.rawTextCharCount || 0);
  const sourceLabel = normalizeResumeIoText(importMeta?.sourceLabel || profile?.sourceLabel) || "가져온 이력서";

  return (
    <PanelSection title="가져온 이력서 검수">
      <div className="grid grid-cols-1 gap-3 text-xs text-slate-600 md:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="font-semibold text-slate-700">출처</div>
          <div className="mt-1">{sourceLabel}</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="font-semibold text-slate-700">경력 항목</div>
          <div className="mt-1">{timelineCount}개</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <div className="font-semibold text-slate-700">원문 길이</div>
          <div className="mt-1">{rawTextCharCount ? `${rawTextCharCount.toLocaleString()}자` : "없음"}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">핵심 역량</div>
          <CompactList items={parsedResume?.skills || profile?.skills} emptyLabel="추출된 역량이 없습니다." />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">성과 후보</div>
          <CompactList items={parsedResume?.achievements || profile?.achievements} emptyLabel="추출된 성과가 없습니다." />
        </div>
      </div>
    </PanelSection>
  );
}

function ResumeExportPanel({ profile }) {
  const previewLines = [
    profile?.summary,
    ...(Array.isArray(profile?.achievements) ? profile.achievements.slice(0, 2) : []),
    ...(Array.isArray(profile?.skills) && profile.skills.length ? [`보유 역량: ${profile.skills.slice(0, 6).join(", ")}`] : []),
  ].filter(Boolean);

  return (
    <PanelSection title="제출용 내보내기 준비">
      <div className="text-xs leading-5 text-slate-500">
        DOCX/PDF 저장 없이, 제출 전 검수 가능한 텍스트 구조만 표시합니다.
      </div>
      <div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
        <CompactList items={previewLines} emptyLabel="내보내기 미리보기에 사용할 항목이 없습니다." />
      </div>
    </PanelSection>
  );
}

function ResumeJdTailoringPanel({ profile }) {
  return (
    <PanelSection title="JD 맞춤화 기반">
      <div className="text-xs leading-5 text-slate-500">
        실제 AI 재작성이나 JD 저장 없이, 맞춤화에 사용할 후보 정보만 확인합니다.
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">프로젝트 후보</div>
          <CompactList items={profile?.projects} emptyLabel="추출된 프로젝트가 없습니다." />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold text-slate-700">전환 서사 후보</div>
          <CompactList items={profile?.transitionNarrative} emptyLabel="추출된 전환 서사가 없습니다." />
        </div>
      </div>
    </PanelSection>
  );
}

export default function ResumeIoStudioPanel({
  profile,
  parsedResume = null,
  rawResumeText = "",
  importMeta = null,
  className = "",
}) {
  const hasParsedResume = hasParsedResumeContent(parsedResume);
  const hasRawText = Boolean(normalizeResumeIoText(rawResumeText));

  if (!profile) {
    return (
      <div className={`rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5 ${className}`}>
        <div className="text-sm font-semibold text-slate-900">이력서 가져오기/내보내기</div>
        <div className="mt-1 text-sm text-slate-500">
          이력서를 분석하면 검수/내보내기 도구가 표시됩니다.
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white/80 p-5 ${className}`}>
      <div>
        <h2 className="text-base font-semibold text-slate-900">이력서 가져오기/내보내기</h2>
        <p className="mt-1 text-sm text-slate-500">
          가져온 이력서를 검수하고, 제출 가능한 형식으로 내보내세요.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <StatusPill label="ResumeProfile 생성됨" tone="green" />
        <StatusPill label={hasParsedResume ? "parsedResume 있음" : "parsedResume 없음"} tone={hasParsedResume ? "green" : "amber"} />
        <StatusPill label={hasRawText ? "raw resume text 있음" : "raw resume text 없음"} tone={hasRawText ? "green" : "amber"} />
      </div>

      <div className="mt-4 space-y-4">
        <ResumeImportReview
          profile={profile}
          parsedResume={parsedResume}
          rawResumeText={rawResumeText}
          importMeta={importMeta}
        />
        <ResumeExportPanel profile={profile} />
        <ResumeJdTailoringPanel profile={profile} />
      </div>
    </div>
  );
}
