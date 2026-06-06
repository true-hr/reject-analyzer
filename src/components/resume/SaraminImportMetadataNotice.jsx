import React from "react";
import { buildSaraminImportMetadataNoticeModel } from "../../lib/resume/buildSaraminImportMetadataNoticeModel.js";

export default function SaraminImportMetadataNotice({ meta, className = "" }) {
  const model = buildSaraminImportMetadataNoticeModel(meta);
  if (!model) return null;

  return (
    <div className={`rounded-xl border border-sky-200 bg-sky-50 px-3 py-3 text-xs text-sky-950 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">{model.title}</div>
        <div className="rounded-full border border-sky-200 bg-white/70 px-2 py-0.5 font-semibold text-sky-800">
          {model.actionLabels[0]}
        </div>
      </div>

      <div className="mt-1 text-sky-900/80">{model.description}</div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <div className="rounded-lg bg-white/60 px-2 py-2">
          <div className="font-semibold">감지 정보</div>
          <ul className="mt-1 space-y-1 text-sky-900/85">
            <li>- 출처: {model.platformLabel}</li>
            <li>- 문서 역할: {model.sourceDocumentRoleLabel}</li>
            <li>- 텍스트 추출: {model.textExtractable ? "가능" : "검수 필요"}</li>
            <li>- OCR: {model.ocrRequired ? "검수 필요" : "필요 없음"}</li>
          </ul>
        </div>

        <div className="rounded-lg bg-white/60 px-2 py-2">
          <div className="font-semibold">검수 후보</div>
          <ul className="mt-1 space-y-1 text-sky-900/85">
            <li>- 감지 섹션 {model.sectionCount}개</li>
            <li>- 후보 데이터: {model.hasResumeProfileCandidate ? "있음" : "검수 필요"}</li>
            <li>- 자기소개서 후보: {model.hasEvidenceBankCandidate ? "있음" : "검수 필요"}</li>
            <li>- 상태: {model.reviewRequired ? model.actionLabels[1] : "확인 필요"}</li>
          </ul>
        </div>
      </div>

      {model.sectionLabels.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {model.sectionLabels.map((label) => (
            <span key={label} className="rounded-full border border-sky-200 bg-white/70 px-2 py-0.5 text-sky-900">
              {label}
            </span>
          ))}
          {model.hiddenSectionCount > 0 ? (
            <span className="rounded-full border border-sky-200 bg-white/70 px-2 py-0.5 text-sky-900">
              +{model.hiddenSectionCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {model.hasCoverLetterSeparation ? (
        <div className="mt-3 rounded-lg bg-white/60 px-2 py-2 text-sky-900/85">
          경력/학력/자격/자기소개서 섹션을 분리해 확인할 수 있습니다.
        </div>
      ) : null}

      {model.warningLabels.length ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-amber-900">
          <div className="font-semibold">검수 메모</div>
          <ul className="mt-1 space-y-1">
            {model.warningLabels.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
