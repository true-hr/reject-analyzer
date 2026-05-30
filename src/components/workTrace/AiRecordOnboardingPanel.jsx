import { useState } from "react";

const DEFAULT_PROMPT = "이 대화에서 내가 실제로 한 일만 골라 패스맵 업무기록으로 정리해서 저장해줘.";

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
            먼저 ChatGPT에 이렇게 요청하세요
          </h3>
          <p className={`${compact ? "mt-1 text-[11px]" : "mt-1 text-xs"} leading-relaxed text-slate-600`}>
            AI가 제안한 내용이 아니라, 내가 실제로 한 일만 골라 확정 전 초안으로 정리합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            {copied ? "복사됨" : "ChatGPT에 말할 문장 복사"}
          </button>
          <button
            type="button"
            onClick={() => setSampleOpen((value) => !value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            예시 보기
          </button>
        </div>

        {sampleOpen && (
          <pre className="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            {SAMPLE_TEXT}
          </pre>
        )}

        <p className="text-[11px] leading-relaxed text-slate-500">
          초안은 바로 이력서 재료로 확정되지 않습니다. 확인 후 필요한 항목만 확정하세요.
        </p>
      </div>
    </section>
  );
}
