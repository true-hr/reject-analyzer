// src/components/experience/AiExperienceInboxPanel.jsx
// PASSMAP 12-C1 — AI 작업기록 Inbox (read-only).
//
// Lists experience cards that arrived via the MCP save_experience flow
// from Claude Code / ChatGPT / Gemini / Claude. No mutations in this
// first patch: status changes, archive, delete and inline edit all land
// in 12-C2+. The panel never selects raw_sources.raw_text and never
// sends user_id; authorization is handled by Supabase RLS in the
// repository layer.

import { useCallback, useEffect, useMemo, useState } from "react";

import { listAiInboxExperiences } from "../../lib/experience/aiInboxRepository.js";

const PAGE_SIZE = 30;

const PLATFORM_FILTERS = [
  { value: "all", label: "전체" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "gemini", label: "Gemini" },
  { value: "claude", label: "Claude" },
  { value: "manual", label: "Manual" },
  { value: "unknown", label: "Unknown" },
];

const PLATFORM_BADGE_LABEL = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  manual: "Manual",
  unknown: "Unknown",
};

const PLATFORM_BADGE_TONE = {
  chatgpt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  gemini: "bg-sky-50 text-sky-700 border-sky-200",
  claude: "bg-violet-50 text-violet-700 border-violet-200",
  manual: "bg-amber-50 text-amber-700 border-amber-200",
  unknown: "bg-slate-50 text-slate-500 border-slate-200",
};

const POLLUTION_MARKERS = [
  "<parameter",
  "</situation>",
  "</task>",
  "</actions>",
  "</resultCandidate>",
];

// ── small utilities ──────────────────────────────────────────────────────
// maskSensitiveText / truncateText mirror the helpers in
// src/components/workTrace/ExperienceEvidenceSection.jsx. They are not
// exported there, so we keep a small local copy here to avoid touching
// an unrelated component in this read-only patch.

function maskSensitiveText(value) {
  return String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[이메일]")
    .replace(/(?:\+82[-\s.]?)?0?1[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, "[전화번호]")
    .replace(/\b\d{2,3}[-\s.]\d{3,4}[-\s.]\d{4}\b/g, "[전화번호]");
}

function truncateText(value, max = 120) {
  const text = maskSensitiveText(value).trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function truncatePlain(value, max = 200) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatDateTimeKo(value) {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "-";
  }
}

function hasPollutionMarker(item) {
  const haystack = [item?.summary, item?.situation, item?.task]
    .filter((s) => typeof s === "string" && s.length > 0)
    .join("\n");
  if (!haystack) return false;
  return POLLUTION_MARKERS.some((marker) => haystack.includes(marker));
}

function PlatformBadge({ platform }) {
  const key = typeof platform === "string" ? platform.toLowerCase() : "unknown";
  const label = PLATFORM_BADGE_LABEL[key] || "Unknown";
  const tone = PLATFORM_BADGE_TONE[key] || PLATFORM_BADGE_TONE.unknown;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function TagRow({ items, max = 6, tone = "slate" }) {
  const list = Array.isArray(items)
    ? items.map((t) => String(t || "").trim()).filter(Boolean)
    : [];
  if (list.length === 0) return null;
  const visible = list.slice(0, max);
  const hidden = list.length - visible.length;
  const toneClass =
    tone === "violet"
      ? "bg-violet-50 text-violet-700 border-violet-100"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((tag, idx) => (
        <span
          key={`${tag}-${idx}`}
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${toneClass}`}
        >
          {tag}
        </span>
      ))}
      {hidden > 0 && (
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-400">
          +{hidden}
        </span>
      )}
    </div>
  );
}

function InboxCard({ item }) {
  const polluted = hasPollutionMarker(item);
  const skillsEmpty = !Array.isArray(item?.skills) || item.skills.length === 0;
  const previewBase = item?.summary || item?.situation || item?.task || "(요약 없음)";
  const previewText = truncatePlain(previewBase, 200);
  const evidencePreview = (item?.evidenceTexts || [])
    .map((t) => truncateText(t, 120))
    .filter(Boolean)
    .slice(0, 2);

  const title = item?.title || "제목 없는 경험";
  const conversationLabel = item?.sourceConversationTitle || item?.sourceLabel || "";
  const createdAt = formatDateTimeKo(item?.createdAt);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={item?.sourcePlatform} />
            <span className="text-[11px] text-slate-400">{createdAt}</span>
            {item?.status && item.status !== "accepted" && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                {item.status}
              </span>
            )}
          </div>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900">{title}</p>
          {conversationLabel && (
            <p className="mt-0.5 break-words text-[11px] text-slate-500">
              {conversationLabel}
            </p>
          )}
        </div>
      </div>

      {polluted && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          이 항목의 요약은 도구 호출 인코딩 오류로 일부 텍스트가 섞여 있습니다. 원본 인용은
          아래 근거에서 확인하세요.
        </div>
      )}

      {previewText && (
        <p className="mt-2 whitespace-pre-line break-words text-xs leading-relaxed text-slate-600">
          {previewText}
        </p>
      )}

      <div className="mt-2 space-y-1.5">
        {!skillsEmpty ? (
          <TagRow items={item?.skills} max={6} tone="violet" />
        ) : (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
            스킬 태그 미저장
          </span>
        )}
        <TagRow items={item?.jobTags} max={6} tone="emerald" />
        <TagRow items={item?.industryTags} max={6} tone="slate" />
      </div>

      {evidencePreview.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            근거 인용
          </div>
          {evidencePreview.map((snippet, idx) => (
            <div
              key={`${item.id}-ev-${idx}`}
              className="rounded-md bg-white px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-600"
            >
              {snippet}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export default function AiExperienceInboxPanel({ isLoggedIn = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [platform, setPlatform] = useState("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchPage = useCallback(
    async ({ reset = false, nextOffset = 0, nextPlatform = platform } = {}) => {
      if (!isLoggedIn) return;
      setLoading(true);
      setError("");
      try {
        const data = await listAiInboxExperiences({
          limit: PAGE_SIZE,
          offset: nextOffset,
          platform: nextPlatform,
        });
        const incoming = Array.isArray(data.items) ? data.items : [];
        setItems((prev) => (reset ? incoming : [...prev, ...incoming]));
        setHasMore(Boolean(data.hasMore));
        setOffset(nextOffset + incoming.length);
      } catch (err) {
        setError(err?.message || "AI 작업기록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, platform]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setOffset(0);
      setHasMore(false);
      setError("");
      return;
    }
    fetchPage({ reset: true, nextOffset: 0, nextPlatform: platform });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, platform]);

  const handleSelectPlatform = (next) => {
    if (next === platform) return;
    setPlatform(next);
    // useEffect will re-trigger the fetch.
  };

  const handleRefresh = () => {
    fetchPage({ reset: true, nextOffset: 0, nextPlatform: platform });
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    fetchPage({ reset: false, nextOffset: offset, nextPlatform: platform });
  };

  const isEmpty = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items.length]
  );

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">AI 작업기록 Inbox</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Claude Code, ChatGPT, Gemini 등에서 PASSMAP으로 보낸 경험 후보를 확인합니다.
        </p>
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          로그인 후 AI 작업기록을 확인할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">AI 작업기록 Inbox</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Claude Code, ChatGPT, Gemini 등에서 PASSMAP으로 보낸 경험 후보를 확인합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PLATFORM_FILTERS.map((opt) => {
          const active = opt.value === platform;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectPlatform(opt.value)}
              className={[
                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                active
                  ? "border-violet-300 bg-violet-50 text-violet-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-700">
          {error}
        </div>
      )}

      <div className="mt-3">
        {loading && items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-[11px] text-slate-500">
            AI 작업기록을 불러오는 중입니다...
          </div>
        ) : isEmpty ? (
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-[11px] leading-relaxed text-slate-500">
            아직 AI 작업기록이 없습니다. Claude Code나 외부 AI에서 “오늘 작업한 내용 PASSMAP에
            보내줘”라고 요청해보세요.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <InboxCard key={item.id || `${item.title}-${item.createdAt}`} item={item} />
            ))}
          </ul>
        )}
      </div>

      {hasMore && items.length > 0 && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "불러오는 중..." : "더 보기"}
          </button>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        이 목록은 읽기 전용입니다. 정리/보관/삭제 기능은 다음 단계(12-C2)에서 추가될 예정입니다.
      </p>
    </div>
  );
}
