import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, CheckCircle2, ChevronRight, Clock, FileText, LogIn, MessageSquareText, PenLine } from "lucide-react";
import { supabase } from "@/lib/supabaseClient.js";
import { listCalendarWorkRecords } from "@/lib/workRecordRepository.js";

const WORK_RECORDS_CHANGED = "passmap:work-records-changed";

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekStartKey() {
  const now = new Date();
  const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function computeRecordStats(records) {
  const todayKey = getTodayKey();
  const weekStartKey = getWeekStartKey();
  let todayCount = 0;
  let weekCount = 0;
  for (const r of records) {
    const dateKey = String(r.record_date || r.created_at || "").slice(0, 10);
    if (dateKey === todayKey) todayCount++;
    if (dateKey >= weekStartKey) weekCount++;
  }
  return { totalCount: records.length, todayCount, weekCount, loaded: true };
}

function RecordStatusCard({ stats, onNavigate }) {
  const { totalCount, todayCount, weekCount } = stats;

  if (todayCount > 0) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <p className="text-sm font-semibold text-slate-900">오늘 {todayCount}건 기록했어요</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          이번 주에는 {weekCount}건의 기록이 쌓였어요. 기록이 이력서와 분석의 재료가 됩니다.
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
              오늘 {todayCount}건
            </span>
            <span className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
              이번 주 {weekCount}건
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("record")}
            className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-emerald-700"
          >
            기록 더 추가하기
          </button>
        </div>
      </div>
    );
  }

  if (totalCount > 0) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 shrink-0 text-amber-400" />
          <p className="text-sm font-semibold text-slate-900">오늘은 아직 기록이 없어요</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          짧게라도 오늘 한 일을 남기면 이력서·분석에 활용할 수 있어요.
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
              누적 {totalCount}건
            </span>
            {weekCount > 0 && (
              <span className="rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                이번 주 {weekCount}건
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate("record")}
            className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white active:bg-slate-900"
          >
            오늘 한 일 기록하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 shrink-0 text-slate-400" />
        <p className="text-sm font-semibold text-slate-900">첫 기록을 남겨보세요</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        기록이 쌓이면 직무·산업 분석과 이력서 초안 준비에 활용됩니다.
      </p>
      <button
        type="button"
        onClick={() => onNavigate("record")}
        className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-xs font-semibold text-white active:bg-slate-900"
      >
        첫 기록 남기기
      </button>
    </div>
  );
}

export default function MobileHomeDashboard({ onNavigate, onOpenAiInbox, auth, pmLastInput, careerLabel, onLogin }) {
  const navigate = onNavigate ?? (() => {});
  const openAiInbox = onOpenAiInbox ?? (() => navigate("record"));
  const isLoggedIn = Boolean(auth?.loggedIn);
  const userName = auth?.user?.name || null;
  const hasRecord = pmLastInput != null;
  const [recordStats, setRecordStats] = useState(null);

  useEffect(() => {
    if (!supabase || !isLoggedIn) {
      setRecordStats(null);
      return;
    }
    let cancelled = false;
    async function fetchStats() {
      try {
        const rows = await listCalendarWorkRecords({ limit: 50 });
        if (!cancelled) setRecordStats(computeRecordStats(rows));
      } catch (_) {
        if (!cancelled) setRecordStats(null);
      }
    }
    fetchStats();
    const handler = () => { fetchStats(); };
    window.addEventListener(WORK_RECORDS_CHANGED, handler);
    return () => {
      cancelled = true;
      window.removeEventListener(WORK_RECORDS_CHANGED, handler);
    };
  }, [isLoggedIn]);

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 p-5 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80">PASSMAP</p>
        {isLoggedIn && userName ? (
          <h2 className="mt-1 text-lg font-bold leading-snug">{userName}님, 오늘의 행동을 이어가세요</h2>
        ) : (
          <h2 className="mt-1 text-lg font-bold leading-snug">오늘 한 일을{"\n"}커리어 자산으로 정리하세요</h2>
        )}
        <p className="mt-1 text-xs opacity-70">기록 → 경험 초안 → 이력서·면접 활용</p>
        {careerLabel && careerLabel !== "미선택" ? (
          <p className="mt-0.5 text-[11px] opacity-60">목표 직무: {careerLabel}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-emerald-50 p-4 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-violet-700">
          <MessageSquareText className="h-3.5 w-3.5" />
          AI 작업 자동 회수
        </div>
        <h3 className="mt-3 text-lg font-bold leading-snug text-slate-950">ChatGPT 업무기록 자동 저장</h3>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          ChatGPT에서 정리한 업무 대화를 PASSMAP AI Inbox로 보내고, 맞는 내용만 이력서 재료로 확정하세요.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={openAiInbox}
            className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white active:bg-violet-700"
          >
            연결 코드 발급하기
          </button>
          <button
            type="button"
            onClick={openAiInbox}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 active:bg-slate-50"
          >
            AI Inbox 보기
          </button>
        </div>
      </div>

      {/* 로그인 기록 상태 카드 */}
      {isLoggedIn && recordStats != null && (
        <RecordStatusCard stats={recordStats} onNavigate={navigate} />
      )}

      {/* 주요 액션 카드 */}
      <div className="flex flex-col gap-3">
        {hasRecord ? (
          <button
            type="button"
            onClick={() => navigate("resume")}
            className="flex items-center gap-3 rounded-xl border border-violet-100 bg-white p-4 shadow-sm active:bg-violet-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <FileText className="h-4 w-4 text-violet-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">기록이 이력서로 이어졌어요</p>
              <p className="mt-0.5 text-xs text-slate-500">이력서 탭에서 반영된 내용을 확인하세요</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate("record")}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm active:bg-slate-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <PenLine className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">오늘 한 일 기록하기</p>
              <p className="mt-0.5 text-xs text-slate-500">짧게 적어도 괜찮아요. AI가 경험 초안으로 정리합니다</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        )}

        {/* 미로그인 전용 로그인 CTA */}
        {!isLoggedIn && (
          <button
            type="button"
            onClick={onLogin}
            className="flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-4 shadow-sm active:bg-violet-100"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600">
              <LogIn className="h-4 w-4" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">로그인하면 기록이 저장돼요</p>
              <p className="mt-0.5 text-xs text-slate-500">내 기록 · 이력서 · 분석 결과를 언제든 다시 확인할 수 있어요</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-violet-500" />
          </button>
        )}

        {isLoggedIn && recordStats?.totalCount > 0 && (
          <button
            type="button"
            onClick={() => navigate("record")}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm active:bg-slate-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-slate-900">업무관리 캘린더</p>
              <p className="mt-0.5 text-xs text-slate-500">이번 주·이번 달 기록을 캘린더로 확인하세요</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">기록 다음에 할 수 있는 것</div>
          <p className="mt-1 text-xs leading-5 text-slate-500">기록을 이력서·면접·분석·상담에 활용해요.</p>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={() => navigate("analysis")}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 active:bg-violet-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                <BarChart3 className="h-4 w-4 text-violet-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">직무산업 분석</p>
                <p className="mt-0.5 text-xs text-slate-500">목표 직무·산업과 내 경험의 연결성을 봅니다</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => navigate("analysis")}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 active:bg-violet-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50">
                <FileText className="h-4 w-4 text-sky-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">서류 탈락 원인 분석</p>
                <p className="mt-0.5 text-xs text-slate-500">JD와 이력서 기준으로 걸릴 수 있는 지점을 확인합니다</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
            <a
              href="/reject-analyzer/?page=consulting-lead&type=mini"
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 active:bg-violet-50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <MessageSquareText className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-slate-900">상담 신청</p>
                <p className="mt-0.5 text-xs text-slate-500">정리된 기록으로 이력서·면접 상담을 준비합니다</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
