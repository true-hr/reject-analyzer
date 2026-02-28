// src/components/upload/UploadPanel.jsx
import React, { useCallback, useMemo, useState } from "react";
import { extractTextFromFile } from "../../lib/extract/extractTextFromFile.js";

function _short(s, n) {
  const t = String(s || "");
  if (t.length <= n) return t;
  return t.slice(0, n) + "…";
}

function DropZone({
  title,
  hint,
  kind, // "jd" | "resume"
  onExtract,
}) {
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(null); // { ok, meta, textPreview }

  const accept = useMemo(() => ".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain", []);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setBusy(true);
      try {
        const res = await extractTextFromFile(file, kind);
        const preview = _short(res.text, 900);
        setLast({ ok: res.ok, meta: res.meta, textPreview: preview, fullText: res.text });
        if (res.ok && typeof onExtract === "function") {
          onExtract(kind, res.text, res.meta);
        }
      } finally {
        setBusy(false);
      }
    },
    [kind, onExtract]
  );

  const onDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files?.[0] || null;
      await handleFile(file);
    },
    [handleFile]
  );

  const onPick = useCallback(
    async (e) => {
      const file = e.target?.files?.[0] || null;
      await handleFile(file);
      // reset input so same file re-pick works
      try { e.target.value = ""; } catch {}
    },
    [handleFile]
  );

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-600">{hint}</div>
          </div>
          <div className="text-[11px] text-slate-500">
            {busy ? "추출 중…" : last?.ok ? "✅ 추출 완료" : last ? "⚠️ 확인 필요" : "대기"}
          </div>
        </div>

        <div
          className={[
            "mt-3 rounded-2xl border border-dashed px-4 py-4",
            "bg-slate-50/60 border-slate-300/70",
            busy ? "opacity-70 pointer-events-none" : "hover:bg-slate-50"
          ].join(" ")}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={onDrop}
        >
          <div className="flex flex-col gap-2">
            <div className="text-xs text-slate-700">
              <span className="font-semibold">드래그&드롭</span> 하거나 파일을 선택하세요. (PDF/DOCX/TXT)
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800">
                파일 선택
                <input
                  type="file"
                  className="hidden"
                  accept={accept}
                  onChange={onPick}
                />
              </label>

              {last?.meta?.name ? (
                <div className="text-[11px] text-slate-600">
                  <span className="font-medium">{_short(last.meta.name, 32)}</span>
                  {typeof last.meta.charCount === "number" ? (
                    <span className="ml-2 text-slate-500">({last.meta.charCount.toLocaleString()} chars)</span>
                  ) : null}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">예: JD.pdf / Resume.docx</div>
              )}
            </div>

            {Array.isArray(last?.meta?.warnings) && last.meta.warnings.length ? (
              <div className="mt-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900/80">
                <div className="font-semibold">주의</div>
                <ul className="mt-1 list-disc pl-4">
                  {last.meta.warnings.slice(0, 3).map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
                <div className="mt-1 text-amber-900/70">
                  추출이 약하면 <span className="font-semibold">DOCX로 다시 업로드</span>하거나, 아래 미리보기에서 텍스트를 보완하세요.
                </div>
              </div>
            ) : null}

            {last?.textPreview ? (
              <details className="mt-2">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-700">
                  추출 텍스트 미리보기 (펼치기)
                </summary>
                <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-200 bg-white p-3 text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {last.textPreview}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UploadPanel({ onExtract }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <DropZone
        title="JD 파일 첨부"
        hint="파일을 올리면 텍스트를 자동 추출해서 입력창에 채워넣습니다."
        kind="jd"
        onExtract={onExtract}
      />
      <DropZone
        title="이력서 파일 첨부"
        hint="PDF/DOCX/TXT를 지원합니다. (스캔 PDF는 텍스트가 안 나올 수 있어요)"
        kind="resume"
        onExtract={onExtract}
      />
    </div>
  );
}