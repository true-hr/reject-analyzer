import { useState } from "react";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function fmtSchedule(day, time) {
  return `매주 ${DAY_LABELS[day]}요일 ${(time || "").slice(0, 5)}`;
}

function getPushSummary(pushStatus, pushSubscribed) {
  if (pushStatus === "granted" && pushSubscribed) return "이 기기에서 알림 수신 중";
  if (pushStatus === "idle" || pushStatus === "error") return "브라우저 알림 미설정";
  if (pushStatus === "denied") return "브라우저 알림 차단됨";
  if (pushStatus === "unsupported") return "이 브라우저는 알림 미지원";
  if (pushStatus === "key_missing") return "브라우저 알림 비활성화됨";
  return "";
}

function getNextReminderSummary(reminderPref) {
  if (!reminderPref) return "저장 후 다음 알림 예정 시간이 표시됩니다";
  if (!reminderPref.is_enabled) return "알림이 꺼져 있어요";
  const timeStr = (reminderPref.preferred_time_local || "").slice(0, 5);
  if (!timeStr || !timeStr.includes(":")) return null;
  const dayOfWeek = reminderPref.preferred_day_of_week;
  const [hh, mm] = timeStr.split(":").map(Number);
  const now = new Date();
  const currentDay = now.getDay();
  let daysAhead = dayOfWeek - currentDay;
  if (daysAhead < 0) {
    daysAhead += 7;
  } else if (daysAhead === 0) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (hh * 60 + mm <= nowMinutes) daysAhead = 7;
  }
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysAhead);
  const month = nextDate.getMonth() + 1;
  const day = nextDate.getDate();
  return `다음 알림 예정: ${month}월 ${day}일 ${DAY_LABELS[dayOfWeek]}요일 ${timeStr}`;
}

function ExpandedCards({
  auth,
  reminderPref,
  reminderDraft,
  reminderSaveStatus,
  reminderSavedSnapshot,
  pushStatus,
  pushSubscribed,
  onToggleEnabled,
  onDayChange,
  onTimeChange,
  onSave,
  onRequestPush,
  onRevokePush,
}) {
  const loggedIn = auth?.loggedIn;
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">주간 경험 회수</div>
            <div className="mt-1 text-sm text-slate-500">이번 주 경험이 흐려지기 전에 남겨두면, 나중에 이력서 재료와 연봉 협상 근거로 꺼내 쓸 수 있어요.</div>
          </div>
          <button
            type="button"
            onClick={onToggleEnabled}
            disabled={!loggedIn}
            className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none ${reminderDraft.is_enabled ? "bg-slate-900" : "bg-slate-200"} ${!loggedIn ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            aria-checked={reminderDraft.is_enabled}
            role="switch"
          >
            <span className={`block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 absolute top-1 ${reminderDraft.is_enabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        <div className={`space-y-2 pt-2 border-t border-slate-100 ${!loggedIn ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-10 flex-shrink-0">요일</span>
            <div className="flex gap-1 flex-wrap">
              {DAY_LABELS.map((label, dayIdx) => (
                <button
                  key={dayIdx}
                  type="button"
                  onClick={() => onDayChange(dayIdx)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium border transition ${reminderDraft.preferred_day_of_week === dayIdx ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 w-10 flex-shrink-0">시간</span>
            <input
              type="time"
              value={(reminderDraft.preferred_time_local || "18:00").slice(0, 5)}
              onChange={(e) => onTimeChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
            />
          </div>
        </div>
        {loggedIn && (
          <div className="pt-1 space-y-0.5 text-xs text-slate-400">
            <div>
              {reminderPref
                ? `현재 저장된 설정: ${fmtSchedule(reminderPref.preferred_day_of_week, reminderPref.preferred_time_local)}`
                : "현재 저장된 설정: 아직 저장된 일정이 없습니다."}
            </div>
            {reminderPref && reminderPref.is_enabled && (
              <div>{getNextReminderSummary(reminderPref)}</div>
            )}
            {(
              !reminderPref ||
              reminderPref.preferred_day_of_week !== reminderDraft.preferred_day_of_week ||
              (reminderPref.preferred_time_local || "").slice(0, 5) !== (reminderDraft.preferred_time_local || "").slice(0, 5) ||
              reminderPref.is_enabled !== reminderDraft.is_enabled
            ) && (
              <div>{`저장 전 선택: ${fmtSchedule(reminderDraft.preferred_day_of_week, reminderDraft.preferred_time_local)}`}</div>
            )}
            <div>주 1회 알림이며, 새 일정으로 저장하면 기존 일정이 바뀝니다.</div>
          </div>
        )}
        {loggedIn ? (
          <div className="flex items-center justify-end gap-2 pt-1">
            {reminderSaveStatus === "saved" && reminderSavedSnapshot && (
              <span className="text-xs text-emerald-600 font-medium">{`${reminderSavedSnapshot}로 저장됐어요`}</span>
            )}
            {reminderSaveStatus === "error" && (
              <span className="text-xs text-red-500">저장 실패. 다시 시도해 주세요.</span>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={reminderSaveStatus === "saving"}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${reminderSaveStatus === "saving" ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-slate-700"}`}
            >
              {reminderSaveStatus === "saving" ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        ) : (
          <div className="pt-1 text-xs text-slate-400">로그인 후 설정을 저장할 수 있습니다.</div>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-2">
        <div className="text-sm font-semibold text-slate-900">브라우저 알림</div>
        <div className="text-sm text-slate-500">이 기기에서 알림을 허용하면 실제 리마인드를 받을 수 있어요.</div>
        {pushStatus === "unsupported" && (
          <div className="text-xs text-slate-400">이 브라우저는 웹 푸시를 지원하지 않습니다.</div>
        )}
        {pushStatus === "key_missing" && (
          <div className="text-xs text-slate-400">이 환경에서는 브라우저 알림이 아직 활성화되지 않았습니다.</div>
        )}
        {pushStatus === "denied" && (
          <div className="text-xs text-amber-600">브라우저 설정에서 알림을 허용한 후 다시 시도해 주세요.</div>
        )}
        {!loggedIn && pushStatus !== "unsupported" && pushStatus !== "key_missing" && (
          <div className="text-xs text-slate-400">로그인 후 이 기기를 등록할 수 있습니다.</div>
        )}
        {loggedIn && pushStatus === "granted" && pushSubscribed && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-emerald-600 font-medium">이 기기에서 알림을 받을 수 있어요</span>
            <button
              type="button"
              onClick={onRevokePush}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-400 transition"
            >
              이 기기 알림 끄기
            </button>
          </div>
        )}
        {loggedIn && (pushStatus === "idle" || pushStatus === "error") && (
          <button
            type="button"
            onClick={onRequestPush}
            className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            이 기기에서 알림 받기
          </button>
        )}
        {pushStatus === "loading" && (
          <span className="text-xs text-slate-400">연결 중...</span>
        )}
      </div>
    </>
  );
}

export default function ReminderSettingsPanel({
  auth,
  reminderPref,
  reminderDraft,
  reminderSaveStatus,
  reminderSavedSnapshot,
  pushStatus,
  pushSubscribed,
  onToggleEnabled,
  onDayChange,
  onTimeChange,
  onSave,
  onRequestPush,
  onRevokePush,
  defaultExpanded = true,
}) {
  const [open, setOpen] = useState(defaultExpanded);

  const cardProps = {
    auth, reminderPref, reminderDraft, reminderSaveStatus, reminderSavedSnapshot,
    pushStatus, pushSubscribed,
    onToggleEnabled, onDayChange, onTimeChange, onSave, onRequestPush, onRevokePush,
  };

  if (defaultExpanded) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <ExpandedCards {...cardProps} />
      </div>
    );
  }

  const scheduleSummary = reminderPref
    ? `주간 경험 회수 · ${fmtSchedule(reminderPref.preferred_day_of_week, reminderPref.preferred_time_local)}`
    : "아직 저장된 일정이 없습니다";
  const nextSummary = getNextReminderSummary(reminderPref);
  const pushSummary = getPushSummary(pushStatus, pushSubscribed);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">알림 설정</div>
          <div className="mt-0.5 truncate text-xs text-slate-500">{scheduleSummary}</div>
          {nextSummary && <div className="mt-0.5 text-xs text-slate-400">{nextSummary}</div>}
          {pushSummary && <div className="mt-0.5 text-xs text-slate-400">{pushSummary}</div>}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400 transition active:bg-slate-50"
        >
          {open ? "접기" : "알림 설정하기"}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-100 bg-slate-50 p-4 space-y-3">
          <ExpandedCards {...cardProps} />
        </div>
      )}
    </div>
  );
}
