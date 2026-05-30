import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient.js";
import { getSession, onAuthStateChange } from "@/lib/auth.js";
import { listCalendarWorkRecords } from "@/lib/workRecordRepository.js";

const EVENT = "passmap:work-records-changed";
const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildWeekDays() {
  const today = new Date();
  const dow = today.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { dateStr: localDateStr(d), label: DAY_LABELS[i], num: d.getDate() };
  });
}

export default function MobileWeekStrip({ initialSelectedDate = "", onRecordDateRequest = null }) {
  const todayStr = useMemo(() => localDateStr(new Date()), []);
  const weekDays = useMemo(() => buildWeekDays(), []);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate || todayStr);

  useEffect(() => {
    if (!initialSelectedDate) return;
    setSelectedDate(initialSelectedDate);
  }, [initialSelectedDate]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    getSession().then((session) => {
      if (!cancelled) setIsLoggedIn(Boolean(session?.user));
    }).catch(() => {});
    const sub = onAuthStateChange((_, session) => {
      if (!cancelled) setIsLoggedIn(Boolean(session?.user));
    });
    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !isLoggedIn) {
      setRecords([]);
      return;
    }
    let cancelled = false;
    async function loadRecords() {
      try {
        const rows = await listCalendarWorkRecords({ limit: 50 });
        if (!cancelled) setRecords(rows);
      } catch (_) {
        if (!cancelled) setRecords([]);
      }
    }
    loadRecords();
    const handler = () => { loadRecords(); };
    window.addEventListener(EVENT, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(EVENT, handler);
    };
  }, [isLoggedIn]);

  const byDate = useMemo(() => {
    const map = {};
    for (const r of records) {
      const d = typeof r.record_date === "string" ? r.record_date.slice(0, 10) : "";
      if (!d) continue;
      if (!map[d]) map[d] = [];
      map[d].push(r);
    }
    return map;
  }, [records]);

  const weekCount = useMemo(
    () => weekDays.reduce((n, { dateStr }) => n + (byDate[dateStr]?.length ?? 0), 0),
    [weekDays, byDate]
  );
  const selectedRecords = byDate[selectedDate] ?? [];

  return (
    <div className="mb-3 px-4">
      <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">이번 주 기록</span>
          {weekCount > 0 ? (
            <span className="text-xs text-slate-400">이번 주 {weekCount}건</span>
          ) : isLoggedIn ? (
            <span className="text-xs text-slate-400">이번 주 첫 기록을 남겨보세요.</span>
          ) : null}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map(({ dateStr, label, num }) => {
            const count = byDate[dateStr]?.length ?? 0;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={dateStr}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${label}요일 ${num}일${count > 0 ? ` ${count}건` : ""}`}
                onClick={() => setSelectedDate(dateStr)}
                className={[
                  "flex flex-col items-center rounded-xl py-1.5 transition-colors",
                  isSelected
                    ? "bg-violet-600 text-white"
                    : isToday
                      ? "bg-violet-50 ring-1 ring-violet-200"
                      : "hover:bg-slate-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[10px] font-medium leading-none",
                    isSelected ? "text-violet-200" : "text-slate-400",
                  ].join(" ")}
                >
                  {label}
                </span>
                <span
                  className={[
                    "mt-0.5 text-sm font-bold leading-none",
                    isSelected ? "text-white" : isToday ? "text-violet-700" : "text-slate-700",
                  ].join(" ")}
                >
                  {num}
                </span>
                {count > 0 ? (
                  <span
                    className={[
                      "mt-0.5 text-[9px] font-semibold leading-none",
                      isSelected ? "text-violet-200" : "text-emerald-500",
                    ].join(" ")}
                  >
                    {count}
                  </span>
                ) : (
                  <span className="mt-0.5 block h-1.5 w-1" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-2.5 border-t border-slate-100 pt-2">
          <p className="mb-1 text-xs font-medium text-slate-500">
            {selectedDate === todayStr
              ? "오늘 기록"
              : `${selectedDate.slice(5).replace("-", "/")} 기록`}
          </p>
          {selectedRecords.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">이 날은 아직 기록이 없어요.</p>
              {typeof onRecordDateRequest === "function" ? (
                <button
                  type="button"
                  onClick={() => onRecordDateRequest(selectedDate)}
                  className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700 active:bg-violet-100"
                >
                  이 날짜 기록하기
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="space-y-1">
              {selectedRecords.slice(0, 3).map((r) => (
                <li key={r.id ?? r.record_date} className="flex min-w-0 items-start gap-1.5">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span className="truncate text-xs text-slate-700">
                    {r.title ||
                      r.project_name ||
                      (typeof r.description === "string" ? r.description.slice(0, 60) : "") ||
                      "기록"}
                  </span>
                </li>
              ))}
              {selectedRecords.length > 3 && (
                <p className="text-xs text-slate-400">외 {selectedRecords.length - 3}건</p>
              )}
            </ul>
          )}
        </div>

        {isLoggedIn && weekCount > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            기록한 날이 쌓일수록 이력서와 분석 근거가 선명해져요.
          </p>
        )}
      </div>
    </div>
  );
}
