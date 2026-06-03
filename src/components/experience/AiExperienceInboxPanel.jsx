// src/components/experience/AiExperienceInboxPanel.jsx
// PASSMAP 12-C1 / 12-C2-A / 12-C2-B — AI 작업기록 Inbox.
//
// 12-C1: read-only 목록 조회.
// 12-C2-A: 카드별 "보관" / "이력서 재료로 확정" 상태 변경 액션 추가.
// 12-C2-B: 같은 패널 내부에 "이력서 재료함(converted)" 탭 추가 (read-only).
// 삭제/되돌리기/편집/검색/태그 필터/SQL/API 추가는 이번 범위가 아니다.
// 패널은 여전히 raw_sources.raw_text를 SELECT하지 않으며 user_id를
// payload로 보내지 않는다. 권한은 RLS에 위임된다.

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listAiInboxExperiences,
  listAiResumeMaterialExperiences,
  updateAiInboxExperienceStatus,
} from "../../lib/experience/aiInboxRepository.js";
import { buildCareerProfileFromWorkRecords } from "../../lib/career-core/index.js";
import { createMcpPairing } from "../../lib/mcp/mcpPairingClient.js";

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
  passmap_ai: "PASSMAP AI 대화",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  manual: "Manual",
  unknown: "Unknown",
};

const PLATFORM_BADGE_TONE = {
  passmap_ai: "bg-violet-50 text-violet-700 border-violet-200",
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

function formatRecordDateLabel(value) {
  const text = String(value || "").trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return "";
  return `${text} 업무기록`;
}

function formatCaptureQuality(value) {
  const key = String(value || "").trim().toLowerCase();
  if (!key) return "";
  if (key === "chatgpt_message_nodes") return "대화 메시지 기준 캡처";
  if (key === "chatgpt_message_nodes_failed") return "대화 자동 읽기 실패";
  if (key === "body_inner_text") return "화면 내용 기준 캡처";
  if (key === "selection") return "선택한 부분 기준";
  if (key === "unknown") return "캡처 방식 확인 필요";
  return "캡처 방식 확인 필요";
}

function hasPollutionMarker(item) {
  const haystack = [item?.summary, item?.situation, item?.task]
    .filter((s) => typeof s === "string" && s.length > 0)
    .join("\n");
  if (!haystack) return false;
  return POLLUTION_MARKERS.some((marker) => haystack.includes(marker));
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  const text = String(value || "").trim();
  return text ? [text] : [];
}

function hasCareerCoreInput(item) {
  if (!item || typeof item !== "object") return false;
  return [
    item.title,
    item.summary,
    item.situation,
    item.task,
    item.suggestedResumeBullet,
    item.resultCandidate,
    item.skills,
    item.jobTags,
    item.industryTags,
    item.evidenceTexts,
  ].some((value) => toStringArray(value).length > 0);
}

function careerCoreLabel(label) {
  const key = String(label || "").trim();
  const labels = {
    product_planning_pm: "프로덕트 기획/PM",
    operations: "운영/프로세스",
    marketing_growth: "마케팅/성장",
    data_analytics: "데이터 분석",
    production_quality: "생산/품질",
    bio_pharma: "바이오/제약",
    beauty_cosmetics: "뷰티/화장품",
    career_education: "커리어/교육",
    b2b_saas: "SaaS 플랫폼",
    process_improvement: "프로세스 개선",
    stakeholder_coordination: "이해관계자 조율",
    metric_based_execution: "지표 기반 실행",
    planning_strategy: "기획/전략",
  };
  return labels[key] || key.replace(/[_-]+/g, " ");
}

function topSignalLabels(signals, limit = 1) {
  const seen = new Set();
  const out = [];
  for (const signal of Array.isArray(signals) ? signals : []) {
    const label = careerCoreLabel(signal?.label);
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    out.push(label);
    if (out.length >= limit) break;
  }
  return out;
}

function buildWorkRecordLikeFromInboxItem(item) {
  return {
    id: item?.workRecordId || item?.id || "ai-inbox-item",
    title: item?.title,
    description: item?.situation || item?.summary,
    task: item?.task,
    result: item?.suggestedResumeBullet || item?.resultCandidate,
    record_date: item?.recordDate || null,
    strength_tags: toStringArray(item?.skills),
    skill_tags: toStringArray(item?.jobTags || item?.job_tags),
    raw_payload: {
      summary: item?.summary,
      sourceMode: item?.isPassmapAiConversation ? "ai_conversation" : "ai_inbox",
      sourceLabel: item?.sourceLabel,
      acceptedCandidates: [
        {
          title: item?.title,
          situation: item?.situation,
          task: item?.task,
          actions: toStringArray(item?.actions),
          result: toStringArray(item?.result),
          resultCandidate: item?.resultCandidate,
          skills: toStringArray(item?.skills),
          jobTags: toStringArray(item?.jobTags || item?.job_tags),
          industryTags: toStringArray(item?.industryTags || item?.industry_tags),
          suggestedResumeBullet: item?.suggestedResumeBullet,
          evidenceTexts: toStringArray(item?.evidenceTexts),
          riskNotes: toStringArray(item?.riskNotes),
          missingInfoQuestions: toStringArray(item?.missingInfoQuestions),
          confidenceLevel: item?.confidenceLevel,
          resumePotential: item?.resumePotential,
        },
      ],
    },
  };
}

export function buildAiInboxCareerCoreSignal(item) {
  if (!hasCareerCoreInput(item)) return null;
  const profile = buildCareerProfileFromWorkRecords([buildWorkRecordLikeFromInboxItem(item)]);
  const groups = [
    { label: "직무", values: topSignalLabels(profile?.signals?.roleFamilies, 1) },
    { label: "산업", values: topSignalLabels(profile?.signals?.industryDomains, 1) },
    { label: "강점", values: topSignalLabels(profile?.signals?.strengthSignals, 1) },
  ].filter((group) => group.values.length > 0).slice(0, 3);

  return groups.length > 0 ? { groups } : null;
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

function CareerCoreSignalBlock({ signal }) {
  if (!signal?.groups?.length) return null;
  return (
    <div
      className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
      data-career-core-readonly-signal="true"
    >
      <div className="text-[11px] font-semibold text-slate-700">Career Core v0 참고 신호</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {signal.groups.map((group) => (
          <span
            key={`${group.label}-${group.values.join("-")}`}
            className="max-w-full rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] leading-relaxed text-slate-600"
          >
            <span className="font-medium text-slate-500">{group.label}</span>
            <span className="mx-1 text-slate-300">/</span>
            <span className="break-words">{truncatePlain(group.values.join(", "), 32)}</span>
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
        저장된 후보의 직무/산업/강점 단서를 바탕으로 만든 참고 신호입니다.
        경력 기간이나 적합도 확정 판단이 아닙니다.
      </p>
    </div>
  );
}

function InboxCard({
  item,
  pending,
  errorMessage,
  onUpdateStatus,
  showActions = true,
}) {
  const polluted = hasPollutionMarker(item);
  const skillsEmpty = !Array.isArray(item?.skills) || item.skills.length === 0;
  const previewBase = item?.summary || item?.situation || item?.task || "(요약 없음)";
  const effectivePreviewBase = previewBase || item?.suggestedResumeBullet;
  const previewText = truncatePlain(effectivePreviewBase, 200);
  const evidencePreview = (item?.evidenceTexts || [])
    .map((t) => truncateText(t, 120))
    .filter(Boolean)
    .slice(0, 2);

  const title = item?.title || "제목 없는 경험";
  const conversationLabel = item?.sourceConversationTitle || item?.sourceLabel || "";
  const sourceTitle = truncatePlain(item?.sourceTitle, 80);
  const sourcePlatformKey = typeof item?.sourcePlatform === "string"
    ? item.sourcePlatform.toLowerCase()
    : "unknown";
  const sourcePlatformLabel = PLATFORM_BADGE_LABEL[sourcePlatformKey] || "AI 대화";
  const captureQualityLabel = formatCaptureQuality(item?.captureQuality);
  const sourceDetails = [
    sourcePlatformKey === "chatgpt" ? "ChatGPT 대화에서 가져옴" : `${sourcePlatformLabel}에서 가져옴`,
    sourceTitle ? `대화 제목: ${sourceTitle}` : "",
    item?.messageCount ? `최근 대화 ${item.messageCount}개 메시지 기준` : "",
    captureQualityLabel,
  ].filter(Boolean);
  const sourceUrl = String(item?.sourceUrl || "").trim();
  const missingInfoQuestions = Array.isArray(item?.missingInfoQuestions)
    ? item.missingInfoQuestions.map((q) => truncateText(q, 140)).filter(Boolean).slice(0, 2)
    : [];
  const confirmationPrompts = missingInfoQuestions.length > 0
    ? missingInfoQuestions
    : Array.isArray(item?.riskNotes)
    ? item.riskNotes.map((note) => truncateText(note, 140)).filter(Boolean).slice(0, 2)
    : [];
  const createdAt = formatDateTimeKo(item?.createdAt);
  const recordDateLabel = formatRecordDateLabel(item?.recordDate);
  const careerCoreSignal = useMemo(() => buildAiInboxCareerCoreSignal(item), [item]);
  const candidateNotice = item?.isPassmapAiConversation && recordDateLabel
    ? `이 기록은 ${recordDateLabel}으로 저장되었고, 이력서 재료로 쓰려면 확정이 필요합니다.`
    : "AI가 정리한 확정 전 초안입니다. 맞는 내용만 골라 확정하세요.";

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformBadge platform={item?.sourcePlatform} />
            {showActions && (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                확정 전 후보
              </span>
            )}
            {recordDateLabel && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                {recordDateLabel}
              </span>
            )}
            <span className="text-[11px] text-slate-400">{createdAt}</span>
            {item?.status && item.status !== "accepted" && (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-500">
                {item.status}
              </span>
            )}
          </div>
          <p className="mt-1 break-words text-sm font-semibold text-slate-900">{title}</p>
          {conversationLabel && conversationLabel !== sourceTitle && (
            <p className="mt-0.5 break-words text-[11px] text-slate-500">
              {conversationLabel}
            </p>
          )}
          {sourceDetails.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
              {sourceDetails.map((detail) => (
                <span
                  key={detail}
                  className="max-w-full rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 leading-relaxed"
                >
                  {detail}
                </span>
              ))}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-full rounded-full border border-slate-200 bg-white px-2 py-0.5 leading-relaxed text-slate-500 hover:text-violet-700"
                >
                  원본 대화 열기
                </a>
              ) : null}
            </div>
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

      {item?.suggestedResumeBullet && (
        <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50 px-3 py-2">
          <div className="text-[11px] font-semibold text-violet-700">이력서 문장 후보</div>
          <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-slate-700">
            {truncatePlain(item.suggestedResumeBullet, 220)}
          </p>
        </div>
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

      <CareerCoreSignalBlock signal={careerCoreSignal} />

      {evidencePreview.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-violet-100 bg-violet-50/60 p-2.5">
          <div className="text-[11px] font-semibold text-violet-700">
            이 대화를 바탕으로 만들었어요
          </div>
          {evidencePreview.map((snippet, idx) => (
            <div
              key={`${item.id}-ev-${idx}`}
              className="rounded-md bg-white px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-700"
            >
              {snippet}
            </div>
          ))}
        </div>
      )}

      {confirmationPrompts.length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
          <div className="text-[11px] font-semibold text-amber-800">
            확정 전에 확인하면 좋아요
          </div>
          <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-amber-900">
            {confirmationPrompts.map((question, idx) => (
              <li key={`${item.id}-missing-${idx}`}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {showActions ? (
        <>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            {candidateNotice}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus?.(item, "archived")}
              disabled={pending}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "처리 중..." : "나중에 보기"}
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus?.(item, "converted")}
              disabled={pending}
              className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "처리 중..." : "이력서 재료로 확정"}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] leading-relaxed text-rose-700">
              {errorMessage}
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 flex flex-wrap items-center justify-end">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            이력서 재료로 확정된 작업기록
          </span>
        </div>
      )}
    </li>
  );
}

const TAB_INBOX = "inbox";
const TAB_MATERIALS = "materials";

const TAB_OPTIONS = [
  { value: TAB_INBOX, label: "Inbox" },
  { value: TAB_MATERIALS, label: "이력서 재료함" },
];

const BROWSER_EXTENSION_CLIENT_NAME = "Browser Extension";
const BROWSER_EXTENSION_ONBOARDING_STEPS = [
  "Chrome에서 PASSMAP 확장을 켭니다.",
  "PASSMAP에서 연결 코드를 발급합니다.",
  "확장 popup에 코드를 입력합니다.",
  "ChatGPT 대화방에서 'AI Inbox에 후보로 보내기'를 누릅니다.",
  "PASSMAP에서 맞는 내용만 이력서 재료로 확정합니다.",
];

const EMPTY_INBOX_STEPS = [
  "위 브라우저 확장 연결 카드에서 연결 코드를 발급합니다.",
  "Chrome 확장 popup에 코드를 입력하고 PASSMAP 연결됨을 확인합니다.",
  "ChatGPT 대화방에서 AI Inbox에 후보로 보내기를 누릅니다.",
];

function BrowserExtensionPairingCard() {
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState("");

  const handleCreateCode = async () => {
    if (creating) return;
    setCreating(true);
    setCode("");
    setExpiresAt(null);
    setError("");
    try {
      const data = await createMcpPairing({
        clientName: BROWSER_EXTENSION_CLIENT_NAME,
      });
      const nextCode = String(data?.code || "").trim().toUpperCase();
      if (!nextCode) {
        throw new Error("브라우저 확장 연결 코드를 발급하지 못했습니다. 다시 시도해 주세요.");
      }
      setCode(nextCode);
      setExpiresAt(data?.expiresAt || null);
    } catch (err) {
      setError(
        err?.message ||
          "브라우저 확장 연결 코드를 발급하지 못했습니다. 로그인 상태를 확인한 뒤 다시 시도해 주세요."
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">브라우저 확장 연결</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            ChatGPT에서 나눈 업무 대화를 AI Inbox 후보로 보내고, 맞는 내용만 나중에 확정할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateCode}
          disabled={creating}
          className="shrink-0 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "발급 중..." : "연결 코드 발급"}
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-violet-100 bg-white/70 px-3 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-900">처음 사용하시나요?</div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              ChatGPT에서 저장하고, AI Inbox에서 후보를 확인한 뒤, 맞는 내용만 이력서 재료로 확정하세요.
            </p>
          </div>
          <a
            href="#ai-inbox"
            className="shrink-0 rounded-lg border border-violet-200 bg-white px-3 py-1.5 text-center text-[11px] font-semibold text-violet-700 hover:bg-violet-50"
          >
            저장 후 Inbox 확인하기
          </a>
        </div>
        <ol className="mt-3 grid gap-2 text-[11px] leading-relaxed text-slate-600 sm:grid-cols-5">
          {BROWSER_EXTENSION_ONBOARDING_STEPS.map((step, index) => (
            <li key={step} className="rounded-md border border-slate-100 bg-white px-2 py-2">
              <span className="mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                {index + 1}
              </span>
              <span className="block">{step}</span>
            </li>
          ))}
        </ol>
        <details className="mt-3 rounded-lg border border-dashed border-violet-200 bg-white px-3 py-2">
          <summary className="cursor-pointer text-[11px] font-semibold text-violet-700">
            확장 설치 방법 보기
          </summary>
          <div className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-600">
            <p>Chrome 주소창에서 <span className="font-mono">chrome://extensions</span>를 열고 개발자 모드를 켭니다.</p>
            <p>압축해제된 확장 프로그램 로드에서 PASSMAP 확장 폴더를 선택한 뒤, 코드가 바뀌면 새로고침하세요.</p>
          </div>
        </details>
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          후보로 보내도 바로 이력서 재료가 되지는 않습니다. 확정은 AI Inbox에서 직접 선택합니다.
        </p>
      </div>

      {code ? (
        <div className="mt-3 rounded-lg border border-violet-200 bg-white px-3 py-3">
          <div className="text-[11px] font-medium text-slate-500">연결 코드</div>
          <div className="mt-1 font-mono text-2xl font-bold tracking-[0.18em] text-slate-950">
            {code}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            이 코드를 Chrome 확장 popup의 연결 코드 입력란에 붙여넣으세요.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span>만료: {formatDateTimeKo(expiresAt)}</span>
            <span>코드는 한 번만 사용할 수 있습니다.</span>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-lg border border-rose-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-rose-700">
          {error}
        </div>
      ) : null}

      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
        화면에는 6자리 연결 코드만 표시하며, access token이나 pairing token은 표시하거나 저장하지 않습니다.
      </p>
    </section>
  );
}

export default function AiExperienceInboxPanel({ isLoggedIn = false }) {
  const [activeTab, setActiveTab] = useState(TAB_INBOX);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [platform, setPlatform] = useState("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [actionPendingId, setActionPendingId] = useState("");
  const [actionError, setActionError] = useState({ id: "", message: "" });

  const fetchPage = useCallback(
    async ({
      reset = false,
      nextOffset = 0,
      nextPlatform = platform,
      nextTab = activeTab,
    } = {}) => {
      if (!isLoggedIn) return;
      setLoading(true);
      setError("");
      try {
        const fetcher =
          nextTab === TAB_MATERIALS
            ? listAiResumeMaterialExperiences
            : listAiInboxExperiences;
        const data = await fetcher({
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
    [isLoggedIn, platform, activeTab]
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setOffset(0);
      setHasMore(false);
      setError("");
      setActionPendingId("");
      setActionError({ id: "", message: "" });
      return;
    }
    fetchPage({
      reset: true,
      nextOffset: 0,
      nextPlatform: platform,
      nextTab: activeTab,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, platform, activeTab]);

  const handleSelectTab = (next) => {
    if (next !== TAB_INBOX && next !== TAB_MATERIALS) return;
    if (next === activeTab) return;
    setItems([]);
    setOffset(0);
    setHasMore(false);
    setError("");
    setActionError({ id: "", message: "" });
    setActiveTab(next);
    // useEffect will re-trigger the fetch with the new tab.
  };

  const handleSelectPlatform = (next) => {
    if (next === platform) return;
    setPlatform(next);
    // useEffect will re-trigger the fetch.
  };

  const handleRefresh = () => {
    setActionError({ id: "", message: "" });
    fetchPage({
      reset: true,
      nextOffset: 0,
      nextPlatform: platform,
      nextTab: activeTab,
    });
  };

  const handleLoadMore = () => {
    if (loading || !hasMore) return;
    fetchPage({
      reset: false,
      nextOffset: offset,
      nextPlatform: platform,
      nextTab: activeTab,
    });
  };

  const handleUpdateStatus = useCallback(async (item, nextStatus) => {
    if (!item?.id) return;
    if (nextStatus !== "archived" && nextStatus !== "converted") return;
    setActionPendingId(item.id);
    setActionError({ id: "", message: "" });
    try {
      const result = await updateAiInboxExperienceStatus({ id: item.id, status: nextStatus });
      if (result?.ok === false) {
        throw new Error(result.error || "상태를 변경하지 못했습니다.");
      }
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } catch (err) {
      setActionError({
        id: item.id,
        message:
          err?.message ||
          "상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    } finally {
      setActionPendingId("");
    }
  }, []);

  const isEmpty = useMemo(
    () => !loading && !error && items.length === 0,
    [loading, error, items.length]
  );

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">AI 작업기록 Inbox</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          ChatGPT에서 보낸 업무기록 후보가 이곳에 모입니다.
          AI가 정리한 내용은 바로 이력서 재료가 되지 않아요. 맞는 내용만 골라 확정하면 됩니다.
        </p>
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          로그인 후 AI 작업기록을 확인할 수 있어요.
        </p>
      </div>
    );
  }

  return (
    <div id="ai-inbox" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">AI 작업기록 Inbox</div>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            ChatGPT에서 보낸 업무기록 후보가 이곳에 모입니다.
            AI가 정리한 내용은 바로 이력서 재료가 되지 않아요. 맞는 내용만 골라 확정하면 됩니다.
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

      <BrowserExtensionPairingCard />

      <div className="mt-3 flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {TAB_OPTIONS.map((opt) => {
          const active = opt.value === activeTab;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelectTab(opt.value)}
              className={[
                "rounded-t-lg border-b-2 px-2.5 py-1 text-[12px] font-medium transition-colors",
                active
                  ? "border-violet-500 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
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
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-3 py-3 text-[11px] leading-relaxed text-slate-600">
            {activeTab === TAB_MATERIALS ? (
              <p>아직 이력서 재료로 확정한 작업기록이 없습니다. Inbox에서 필요한 항목을 확정해보세요.</p>
            ) : (
              <div>
                <div className="text-xs font-semibold text-slate-900">첫 AI 작업기록을 보내보세요</div>
                <p className="mt-1 text-slate-600">
                  ChatGPT에서 업무 대화를 나눈 뒤 확장 버튼으로 보내면 여기에 후보가 도착합니다.
                </p>
                <ol className="mt-2 grid gap-1.5 sm:grid-cols-3">
                  {EMPTY_INBOX_STEPS.map((step, index) => (
                    <li key={step} className="rounded-lg border border-white bg-white px-2 py-2">
                      <span className="mr-1 font-semibold text-violet-700">{index + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
                <p className="mt-2 text-slate-500">
                  Claude/Gemini는 필요한 부분을 드래그한 뒤 선택한 부분만 저장을 사용해 주세요.
                </p>
              </div>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <InboxCard
                key={item.id || `${item.title}-${item.createdAt}`}
                item={item}
                pending={actionPendingId === item.id}
                errorMessage={actionError.id === item.id ? actionError.message : ""}
                onUpdateStatus={handleUpdateStatus}
                showActions={activeTab === TAB_INBOX}
              />
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
        {activeTab === TAB_MATERIALS
          ? "이력서 재료함은 확정된 AI 작업기록을 다시 확인하는 공간입니다. 편집과 되돌리기는 다음 단계에서 다룹니다."
          : "나중에 보기로 넘기거나 이력서 재료로 확정한 항목은 이 Inbox 목록에서 사라집니다. 삭제 기능은 안전을 위해 별도 단계에서 다룹니다."}
      </p>
    </div>
  );
}
