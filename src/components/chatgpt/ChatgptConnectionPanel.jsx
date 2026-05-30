import { useState } from "react";
import { CheckCircle2, Clipboard, ExternalLink } from "lucide-react";

const TEST_PROMPT = "오늘 한 일 패스맵에 업무기록으로 저장해줘.";
const STEPS = [
  "PASSMAP에 로그인",
  "ChatGPT에서 PASSMAP GPT 열기",
  "연결 승인하기",
  "첫 저장 테스트하기",
  "AI Inbox에서 도착 확인",
];

async function copyText(value) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }
  return false;
}

export default function ChatgptConnectionPanel({ onOpenInbox }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await copyText(TEST_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">ChatGPT와 PASSMAP 연결</div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            ChatGPT에서 “패스맵에 저장해줘”라고 요청하면, PASSMAP AI Inbox에 경험 후보로 저장할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenInbox}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          AI Inbox 열기
        </button>
      </div>

      <ol className="mt-3 grid gap-1.5 sm:grid-cols-5">
        {STEPS.map((step, index) => (
          <li key={step} className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
            <div className="text-[10px] font-semibold text-slate-400">STEP {index + 1}</div>
            <div className="mt-0.5 text-[11px] font-medium leading-snug text-slate-700">{step}</div>
          </li>
        ))}
      </ol>

      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
        ChatGPT가 말로만 “저장했습니다”라고 한 것은 성공이 아닙니다. 도구 호출 후 PASSMAP AI Inbox에 후보가 도착해야 저장 성공입니다.
      </div>

      <div className="mt-3 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-500">첫 저장 테스트 문장</div>
          <div className="mt-0.5 break-words text-xs font-medium text-slate-900">{TEST_PROMPT}</div>
          <div className="mt-1 text-[11px] text-slate-500">
            ChatGPT에서 PASSMAP GPT를 열고 위 문장을 입력하세요. 저장 후 AI Inbox에서 ChatGPT 필터를 선택해 확인할 수 있습니다.
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
          {copied ? "복사됨" : "테스트 문장 복사"}
        </button>
      </div>
    </section>
  );
}
