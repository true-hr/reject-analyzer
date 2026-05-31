import React, { useMemo, useState } from "react";
import { exportResumeJson } from "../../lib/resume/exportResumeJson.js";
import { exportResumeMarkdown } from "../../lib/resume/exportResumeMarkdown.js";
import { exportResumeText } from "../../lib/resume/exportResumeText.js";
import {
  buildResumeExportFilename,
  buildResumeExportWarnings,
  summarizeResumeExportReadiness,
} from "../../lib/resume/resumeDraftTransfer.js";

const FORMAT_LABELS = {
  markdown: "Markdown",
  text: "TXT",
  clipboard: "클립보드 복사",
  json: "JSON 백업",
  pdf: "PDF 기본형",
};

function buildPreview(profile, format) {
  if (!profile) return "";
  if (format === "json") return exportResumeJson(profile);
  if (format === "text" || format === "clipboard") return exportResumeText(profile);
  if (format === "pdf") return "PDF 기본형은 ResumePdfDocument 컴포넌트와 연결 가능한 foundation 상태입니다.";
  return exportResumeMarkdown(profile);
}

export default function ResumeExportPanel({ profile }) {
  const [format, setFormat] = useState("markdown");
  const [copyStatus, setCopyStatus] = useState("");
  const warnings = useMemo(() => buildResumeExportWarnings(profile), [profile]);
  const readiness = useMemo(() => summarizeResumeExportReadiness(profile), [profile]);
  const preview = useMemo(() => buildPreview(profile, format), [profile, format]);
  const filename = useMemo(() => buildResumeExportFilename(profile, format === "clipboard" ? "txt" : format), [profile, format]);

  async function copyPreview() {
    if (!preview) return;
    try {
      await navigator.clipboard.writeText(preview);
      setCopyStatus("클립보드에 복사했습니다.");
    } catch {
      setCopyStatus("브라우저 권한 때문에 복사하지 못했습니다.");
    }
  }

  if (!profile) {
    return (
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
        <h2 className="text-base font-semibold text-slate-950">이력서 내보내기</h2>
        <p className="mt-2 text-sm text-slate-500">내보낼 이력서 데이터가 아직 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-950">이력서 내보내기</h2>
        <p className="mt-1 text-sm text-slate-500">검수한 이력서를 제출/공유 가능한 형식으로 내보내세요.</p>
      </header>

      <div className="grid gap-2 sm:grid-cols-5">
        {Object.entries(FORMAT_LABELS).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFormat(key)}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold ${format === key ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
        <div className="font-semibold text-slate-950">내보내기 준비도: {readiness.label}</div>
        <div className="mt-1">파일명 후보: {filename}</div>
        {warnings.length ? (
          <ul className="mt-2 space-y-1 text-amber-800">
            {warnings.map((warning) => <li key={warning}>- {warning}</li>)}
          </ul>
        ) : (
          <div className="mt-2 text-emerald-700">주요 품질 경고가 없습니다.</div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-950">{FORMAT_LABELS[format]} preview</div>
          <button type="button" onClick={copyPreview} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700">
            클립보드 복사
          </button>
        </div>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs leading-5 text-slate-50">
          {preview}
        </pre>
        {copyStatus ? <div className="mt-2 text-xs text-slate-500">{copyStatus}</div> : null}
      </div>
    </section>
  );
}
