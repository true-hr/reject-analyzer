import { useState } from "react";

const PROMPTS = [
  "오늘 한 일 패스맵에 업무기록으로 저장해줘.",
  "이 대화 내용을 패스맵 업무기록으로 정리해서 저장해줘.",
  "이 내용을 나중에 이력서에 쓸 수 있게 패스맵에 저장해줘.",
];

const SAMPLE_TEXT = [
  "이번 주 CS 문의 중 반복되는 환불 질문을 유형별로 분류했다.",
  "FAQ 문구를 수정하고 상담팀에 공유해서 같은 답변을 빠르게 보낼 수 있게 했다.",
  "수정 후 같은 유형의 문의 처리 시간이 줄었고, 다음 주에는 배송 지연 문의까지 같은 방식으로 정리하기로 했다.",
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

export default function AiRecordOnboardingPanel({
  compact = false,
  onOpenAiPaste = null,
}) {
  const [copiedKey, setCopiedKey] = useState("");
  const [sampleOpen, setSampleOpen] = useState(false);

  const markCopied = (key) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? "" : current));
    }, 1600);
  };

  const handleCopy = async (text, key) => {
    let copied = false;
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) copied = copyTextFallback(text);
    if (copied) markCopied(key);
  };

  const openAiPaste = () => {
    onOpenAiPaste?.();
  };

  const openSample = () => {
    setSampleOpen((value) => !value);
    openAiPaste();
  };

  return (
    <section className={`rounded-2xl border border-violet-100 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}>
      <div className={compact ? "space-y-3" : "space-y-4"}>
        <div>
          <h2 className={`${compact ? "text-base" : "text-xl"} font-bold tracking-tight text-slate-950`}>
            AI와 일한 내용을 경력 기록으로 남겨보세요
          </h2>
          <p className={`${compact ? "mt-1 text-[12px]" : "mt-2 text-sm"} leading-relaxed text-slate-600`}>
            ChatGPT, Claude, Gemini에서 정리한 업무 내용을 PASSMAP에 모아두고, 확인한 기록만 이력서 재료와 캘린더에 반영할 수 있습니다.
          </p>
        </div>

        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "md:grid-cols-3"}`}>
          <button
            type="button"
            onClick={openSample}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:border-violet-200 hover:bg-violet-50"
          >
            <div className="text-sm font-semibold text-slate-900">샘플로 먼저 보기</div>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
              예시 대화 기록을 보고 AI 대화 탭에서 시작합니다.
            </div>
          </button>
          <button
            type="button"
            onClick={openAiPaste}
            className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-3 text-left transition-colors hover:bg-violet-100"
          >
            <div className="text-sm font-semibold text-violet-800">내 AI 대화 붙여넣기</div>
            <div className="mt-1 text-[11px] leading-relaxed text-violet-700">
              현재 화면을 AI 대화 입력으로 전환합니다.
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleCopy(PROMPTS.join("\n"), "chatgpt")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition-colors hover:border-violet-200 hover:bg-violet-50"
          >
            <div className="text-sm font-semibold text-slate-900">ChatGPT에서 바로 저장하기</div>
            <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {copiedKey === "chatgpt" ? "프롬프트 복사됨" : "ChatGPT에 붙여넣을 문장을 복사합니다."}
            </div>
          </button>
        </div>

        {sampleOpen && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="text-[11px] font-semibold text-slate-500">샘플 텍스트</div>
            <pre className="mt-2 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-slate-700">
              {SAMPLE_TEXT}
            </pre>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">공식 프롬프트</div>
            <button
              type="button"
              onClick={() => handleCopy(PROMPTS.join("\n"), "all")}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
            >
              {copiedKey === "all" ? "전체 복사됨" : "전체 복사"}
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {PROMPTS.map((prompt, index) => {
              const key = `prompt-${index}`;
              return (
                <div key={prompt} className="flex items-start gap-2 rounded-lg bg-white px-2.5 py-2">
                  <p className="min-w-0 flex-1 break-words text-[12px] leading-relaxed text-slate-700">
                    {prompt}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCopy(prompt, key)}
                    className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                  >
                    {copiedKey === key ? "복사됨" : "복사"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-relaxed text-amber-900">
          AI가 보낸 기록은 먼저 후보로 저장됩니다. “이력서 재료로 확정”을 눌러야 캘린더와 이력서 재료에 반영됩니다.
        </p>
      </div>
    </section>
  );
}
