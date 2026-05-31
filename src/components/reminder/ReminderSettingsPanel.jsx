import { useState } from "react";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function fmtSchedule(day, time) {
  return `매주 ${DAY_LABELS[day]}요일 ${(time || "").slice(0, 5)}`;
}

function getPushSummary(pushStatus, pushSubscribed) {
  if (pushStatus === "granted" && pushSubscribed) return "이 기기에서 알림 수신 중";
  if (pushStatus === "granted" && !pushSubscribed) return "알림 권한 허용됨 · 기기 등록 필요";
  if (pushStatus === "idle" || pushStatus === "error") return "브라우저 알림 미설정";
  if (pushStatus === "denied") return "브라우저 알림 차단됨";
  if (pushStatus === "unsupported") return "이 브라우저는 알림 미지원";
  if (pushStatus === "key_missing") return "브라우저 알림 비활성화됨";
  return "";
}

function getProviderLabel(provider) {
  if (provider === "google") return "Google";
  if (provider === "kakao") return "Kakao";
  if (provider === "naver" || provider === "custom:naver") return "Naver";
  return provider || "소셜 로그인";
}

function getAccountSummary(auth) {
  if (!auth?.loggedIn) return "로그인 필요";
  const user = auth?.user || {};
  const primary = user.name || user.email || "로그인 사용자";
  const provider = getProviderLabel(user.provider);
  return user.email && user.name ? `${primary} · ${user.email} · ${provider}` : `${primary} · ${provider}`;
}

function getPermissionSummary(pushStatus) {
  if (pushStatus === "granted") return "권한 켜짐";
  if (pushStatus === "denied") return "권한 차단됨";
  if (pushStatus === "unsupported") return "알림 미지원";
  if (pushStatus === "key_missing") return "서비스 비활성";
  if (pushStatus === "loading") return "확인 중";
  return "권한 꺼짐";
}

function getSubscriptionSummary(pushStatus, pushSubscribed, checkStatus) {
  if (pushStatus === "unsupported" || pushStatus === "key_missing") return "확인 불가";
  if (checkStatus === "checking") return "확인 중";
  if (checkStatus === "error") return "확인 불가";
  if (pushSubscribed && checkStatus === "found") return "등록됨";
  if (pushSubscribed) return "브라우저 등록됨 · 서버 확인 필요";
  return "등록 필요";
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getLastRegisteredSummary(record, checkStatus) {
  if (checkStatus === "error") return "확인 불가";
  if (!record) return "아직 등록 기록 없음";
  return formatDateTime(record.last_seen_at || record.updated_at || record.created_at) || "확인 불가";
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
  pushSubscriptionRecord,
  pushSubscriptionCheckStatus,
  testPushStatus,
  testPushMessage,
  onToggleEnabled,
  onDayChange,
  onTimeChange,
  onSave,
  onRequestPush,
  onRevokePush,
  onSendTestPush,
}) {
  const loggedIn = auth?.loggedIn;
  const accountSummary = getAccountSummary(auth);
  const permissionSummary = getPermissionSummary(pushStatus);
  const subscriptionSummary = getSubscriptionSummary(pushStatus, pushSubscribed, pushSubscriptionCheckStatus);
  const lastRegisteredSummary = getLastRegisteredSummary(pushSubscriptionRecord, pushSubscriptionCheckStatus);
  const hasConfirmedPushRegistration =
    pushSubscriptionCheckStatus === "found" ||
    pushSubscriptionCheckStatus === "registered" ||
    !!pushSubscriptionRecord;
  const showTestPushButton = loggedIn && pushStatus === "granted" && pushSubscribed;
  const canSendTestPush = showTestPushButton && hasConfirmedPushRegistration && typeof onSendTestPush === "function";
  const testPushDisabled = !canSendTestPush || testPushStatus === "sending";
  const testPushStatusGuide =
    pushSubscriptionCheckStatus === "checking"
      ? "등록 상태를 확인하는 중이에요."
      : !hasConfirmedPushRegistration
        ? "현재 기기 등록 확인 후 테스트 알림을 보낼 수 있어요."
        : "";
  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">현재 계정 / 현재 기기</div>
          <div className="mt-1 text-xs leading-relaxed text-slate-500">
            알림 시간 설정을 저장하는 것과 이 기기에서 브라우저 알림을 허용하는 것은 별도입니다.
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase text-slate-400">현재 계정</div>
            <div className="mt-1 truncate text-xs font-medium text-slate-800">{accountSummary}</div>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase text-slate-400">현재 기기</div>
            <div className="mt-1 text-xs font-medium text-slate-800">{permissionSummary}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">Push subscription: {subscriptionSummary}</div>
            <div className="mt-0.5 text-[11px] text-slate-400">마지막 등록: {lastRegisteredSummary}</div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700">
          PC, 모바일, iPhone은 각각 따로 알림을 켜야 합니다. iPhone은 Safari에서 PASSMAP을 홈 화면에 추가한 뒤 알림을 허용해야 할 수 있습니다.
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
          테스트 알림은 현재 기기가 알림을 받을 수 있는지 확인하는 용도입니다.
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">주간 경험 회수</div>
            <div className="mt-1 text-xs font-medium text-slate-600">현재는 주 1회 알림만 지원합니다.</div>
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
            <div>매주 선택한 요일/시간에 한 번 알림을 보냅니다.</div>
            <div>매일/평일/직접 설정 알림은 이후 지원 예정입니다.</div>
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
        <div className="text-xs leading-relaxed text-slate-400">알림 시간 저장은 계정 설정이고, 브라우저 알림 허용은 현재 기기 설정입니다.</div>
        {pushStatus === "unsupported" && (
          <div className="text-xs text-slate-400">이 브라우저는 웹 푸시를 지원하지 않습니다.</div>
        )}
        {pushStatus === "key_missing" && (
          <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="text-xs text-slate-500">
              운영 알림 키를 읽지 못해 브라우저 알림을 시작할 수 없습니다. 최신 화면으로 다시 불러온 뒤 확인해 주세요.
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              알림 상태 다시 확인
            </button>
          </div>
        )}
        {pushStatus === "denied" && (
          <div className="text-xs text-amber-600">브라우저 설정에서 알림을 허용한 후 다시 시도해 주세요.</div>
        )}
        {!loggedIn && pushStatus !== "unsupported" && pushStatus !== "key_missing" && (
          <div className="text-xs text-slate-400">로그인 후 이 기기를 등록할 수 있습니다.</div>
        )}
        {loggedIn && pushStatus === "granted" && pushSubscribed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-emerald-600 font-medium">이 기기에서 알림을 받을 수 있어요</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSendTestPush}
                  disabled={testPushDisabled}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    testPushDisabled
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-900 text-white hover:bg-slate-700"
                  }`}
                >
                  {testPushStatus === "sending" ? "테스트 알림 보내는 중..." : "테스트 알림 보내기"}
                </button>
                <button
                  type="button"
                  onClick={onRevokePush}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-400 transition"
                >
                  이 기기 알림 끄기
                </button>
              </div>
            </div>
            {(testPushStatusGuide || testPushMessage) && (
              <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center">
                {testPushStatusGuide && <span className="text-slate-400">{testPushStatusGuide}</span>}
                {testPushMessage && (
                  <span className={testPushStatus === "error" ? "text-red-500" : "text-emerald-600"}>
                    {testPushMessage}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        {loggedIn && (pushStatus === "idle" || pushStatus === "error" || (pushStatus === "granted" && !pushSubscribed)) && (
          <button
            type="button"
            onClick={onRequestPush}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 transition sm:w-auto sm:rounded-full sm:py-2"
          >
            이 기기에서 알림 켜기
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
  pushSubscriptionRecord,
  pushSubscriptionCheckStatus,
  testPushStatus,
  testPushMessage,
  onToggleEnabled,
  onDayChange,
  onTimeChange,
  onSave,
  onRequestPush,
  onRevokePush,
  onSendTestPush,
  defaultExpanded = true,
}) {
  const [open, setOpen] = useState(defaultExpanded);

  const cardProps = {
    auth, reminderPref, reminderDraft, reminderSaveStatus, reminderSavedSnapshot,
    pushStatus, pushSubscribed, pushSubscriptionRecord, pushSubscriptionCheckStatus,
    testPushStatus, testPushMessage,
    onToggleEnabled, onDayChange, onTimeChange, onSave, onRequestPush, onRevokePush, onSendTestPush,
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
