import { LogOut, LogIn, User } from "lucide-react";

const PROVIDER_LABEL = {
  google: "Google",
  kakao: "Kakao",
  "custom:naver": "Naver",
  naver: "Naver",
};

export default function MobileSettingsTab({ auth, onLogin, onLogout }) {
  const isLoggedIn = auth?.loggedIn && auth?.user;
  const user = auth?.user;

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <h2 className="text-base font-semibold text-slate-800">설정</h2>

      {isLoggedIn ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100">
              <User size={20} className="text-violet-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {user.name || "이름 정보 없음"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.email || "이메일 정보 없음"}
              </p>
            </div>
            {user.provider && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {PROVIDER_LABEL[user.provider] ?? user.provider}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 py-2.5 text-sm font-medium text-red-600 active:bg-red-100"
          >
            <LogOut size={15} />
            로그아웃
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-1 text-sm font-medium text-slate-800">로그인이 필요합니다</p>
          <p className="mb-4 text-xs leading-relaxed text-slate-500">
            로그인하면 면접 기록 저장과 이력서 관리를 계속 이어갈 수 있어요.
          </p>
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white active:bg-violet-700"
          >
            <LogIn size={15} />
            로그인
          </button>
        </div>
      )}
    </div>
  );
}
