import { useState } from "react";

const DEFAULT_PROMPT = "이 대화 내용을 패스맵 업무기록으로 정리해서 저장해줘.";

const SAMPLE_TEXT = [
  "CS 문의를 유형별로 분류하고 FAQ 문구를 정리했습니다.",
  "반복 질문 답변 시간을 줄이기 위해 상담팀과 공유했습니다.",
  "다음 주에는 배송 지연 문의까지 같은 방식으로 정리하기로 했습니다.",
].join("\n");

function copyTextFallback(text) {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  textarea.style.left = "-1000px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let copied = false;
  try {
    copied = Boolean(document.execCommand && document.execCommand("copy"));
  } catch {
    copied = false;
  }
  document.body.removeChild(textarea);
  return copied;
}

export default function AiRecordOnboardingPanel({ compact = false }) {
  const [copied, setCopied] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);

  const markCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const handleCopy = async () => {
    let didCopy = false;
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(DEFAULT_PROMPT);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }
    if (!didCopy) didCopy = copyTextFallback(DEFAULT_PROMPT);
    if (didCopy) markCopied();
  };

  return (
    <section
      className={`rounded-xl border border-violet-100 bg-violet-50/50 ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      }`}
    >
      <div className={compact ? "space-y-2" : "space-y-3"}>
        <div>
          <h3 className={`${compact ? "text-sm" : "text-base"} font-semibold text-slate-900`}>
            AI 대화에서 경험 찾기
          </h3>
          <p className={`${compact ? "mt-1 text-[11px]" : "mt-1 text-xs"} leading-relaxed text-slate-600`}>
            ChatGPT·Claude·Gemini에서 나눈 업무 대화를 붙여넣어 주세요. AI가 내가 실제로 한 일만 골라 확정 전 초안으로 정리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSampleOpen((value) => !value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            예시 보기
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
          >
            {copied ? "복사됨" : "ChatGPT에 말할 문장 복사"}
          </button>
        </div>

        {sampleOpen && (
          <pre className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            {SAMPLE_TEXT}
          </pre>
        )}

        <p className="text-[11px] leading-relaxed text-slate-500">
          AI가 정리한 내용은 바로 저장되지 않아요. 맞는 내용만 골라 확정하면 됩니다.
        </p>
      </div>
    </section>
  );
}
