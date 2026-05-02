import { BarChart3, ChevronRight, FileText, LogIn, PenLine } from "lucide-react";

export default function MobileHomeDashboard({ onNavigate, auth, pmLastInput, careerLabel, onLogin }) {
  const navigate = onNavigate ?? (() => {});
  const isLoggedIn = Boolean(auth?.loggedIn);
  const userName = auth?.user?.name || null;
  const hasRecord = pmLastInput != null;

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 p-5 text-white shadow-sm">
        <p className="text-xs font-medium opacity-80">PASSMAP</p>
        {isLoggedIn && userName ? (
          <h2 className="mt-1 text-lg font-bold leading-snug">{userName}님, 오늘의 행동을 이어가세요</h2>
        ) : (
          <h2 className="mt-1 text-lg font-bold leading-snug">오늘 한 일을 기록하고{"\n"}이력서를 만들어보세요</h2>
        )}
        {careerLabel ? (
          <p className="mt-1 text-xs opacity-70">목표 직무: {careerLabel}</p>
        ) : (
          <p className="mt-1 text-xs opacity-70">기록 → 이력서 → 분석까지 한 곳에서</p>
        )}
      </div>

      {/* Login CTA — 미로그인 사용자 전용 */}
      {!isLoggedIn && (
        <button
          type="button"
          onClick={onLogin}
          className="flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4 shadow-sm active:bg-violet-100"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <LogIn className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-slate-900">로그인하면 기록이 저장돼요</p>
            <p className="mt-0.5 text-xs text-slate-500">내 기록 · 이력서 · 분석 결과를 언제든 다시 확인할 수 있어요</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-violet-500" />
        </button>
      )}

      {/* Action cards */}
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
              <p className="text-sm font-semibold text-slate-900">오늘 한 일을 기록하세요</p>
              <p className="mt-0.5 text-xs text-slate-500">짧은 기록이 이력서 문장으로 이어집니다</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate("analysis")}
          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm active:bg-slate-50"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
            <BarChart3 className="h-4 w-4 text-violet-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-slate-900">이력서·JD 분석하기</p>
            <p className="mt-0.5 text-xs text-slate-500">서류 탈락 원인과 직무 적합도를 점검해요</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
