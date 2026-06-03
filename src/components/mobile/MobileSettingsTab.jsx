import { useEffect, useState } from "react";
import { Bell, Bot, ChevronDown, HelpCircle, Inbox, LogIn, LogOut, Shield, User } from "lucide-react";
import ReminderSettingsPanel from "../reminder/ReminderSettingsPanel.jsx";
import McpConnectionPanel from "../mcp/McpConnectionPanel.jsx";
import { JOB_CATEGORY_OPTIONS, INDUSTRY_CATEGORY_OPTIONS } from "../input/categoryOptions.js";

const PROVIDER_LABEL = {
  google: "Google",
  kakao: "Kakao",
  "custom:naver": "Naver",
  naver: "Naver",
};

const INITIAL_CAREER = {
  audienceType: "",
  currentJobMajor: "",
  currentJobSub: "",
  currentIndustryMajor: "",
  currentIndustrySub: "",
  targetJobMajor: "",
  targetJobSub: "",
  targetIndustryMajor: "",
  targetIndustrySub: "",
};

function parseCareerFromRecord(record) {
  const s = record?.settings;
  if (!s || typeof s !== "object") return INITIAL_CAREER;
  return {
    audienceType: s.audienceType || "",
    currentJobMajor: s.currentJobMajor || "",
    currentJobSub: s.currentJobSub || "",
    currentIndustryMajor: s.currentIndustryMajor || "",
    currentIndustrySub: s.currentIndustrySub || "",
    targetJobMajor: s.targetJobMajor || "",
    targetJobSub: s.targetJobSub || "",
    targetIndustryMajor: s.targetIndustryMajor || "",
    targetIndustrySub: s.targetIndustrySub || "",
  };
}

function SettingsCard({ icon, title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Disclosure({ title, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-semibold text-slate-700"
      >
        <span>{title}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-slate-100 bg-white p-3">{children}</div>}
    </div>
  );
}

function TwoLevelSelect({ label, options, majorValue, subValue, onMajorChange, onSubChange }) {
  const subs = options.find((o) => o.v === majorValue)?.subs || [];
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-slate-600">{label}</p>
      <div className="space-y-1">
        <select
          value={majorValue}
          onChange={(e) => onMajorChange(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-violet-300 focus:outline-none"
        >
          <option value="">대분류 선택</option>
          {options.map((opt) => (
            <option key={opt.v} value={opt.v}>{opt.t}</option>
          ))}
        </select>
        <select
          value={subValue}
          onChange={(e) => onSubChange(e.target.value)}
          disabled={!majorValue}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-violet-300 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">소분류 선택</option>
          {subs.map((sub) => (
            <option key={sub.v} value={sub.v}>{sub.t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="min-w-0 truncate font-medium text-slate-800">{value || "미설정"}</span>
    </div>
  );
}

export default function MobileSettingsTab({ auth, onLogin, onLogout, reminderProps, careerBaselineProps, onNavigateRecord }) {
  const isLoggedIn = auth?.loggedIn && auth?.user;
  const user = auth?.user;
  const [career, setCareer] = useState(INITIAL_CAREER);

  const cbValue = careerBaselineProps?.value ?? null;
  const cbStatus = careerBaselineProps?.status ?? "idle";

  useEffect(() => {
    setCareer(parseCareerFromRecord(cbValue));
  }, [cbValue]);

  function updateCareer(field, value) {
    setCareer((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "currentJobMajor") next.currentJobSub = "";
      if (field === "currentIndustryMajor") next.currentIndustrySub = "";
      if (field === "targetJobMajor") next.targetJobSub = "";
      if (field === "targetIndustryMajor") next.targetIndustrySub = "";
      return next;
    });
  }

  function handleSave() {
    if (careerBaselineProps?.onSave) careerBaselineProps.onSave(career);
  }

  const summaryCurrentJob = career.currentJobSub || career.currentJobMajor;
  const summaryCurrentIndustry = career.currentIndustrySub || career.currentIndustryMajor;
  const summaryTargetJob = career.targetJobSub || career.targetJobMajor;
  const summaryTargetIndustry = career.targetIndustrySub || career.targetIndustryMajor;
  const currentSummary = [summaryCurrentJob, summaryCurrentIndustry].filter(Boolean).join(" · ");
  const targetSummary = [summaryTargetJob, summaryTargetIndustry].filter(Boolean).join(" · ");

  const saveDisabled = !isLoggedIn || cbStatus === "saving" || cbStatus === "loading";
  const saveLabel =
    cbStatus === "saving" ? "저장 중..." :
    cbStatus === "saved" ? "저장되었습니다" :
    "커리어 기준 저장";
  const saveSubText =
    cbStatus === "error" ? "저장에 실패했어요. 다시 시도해 주세요." :
    !isLoggedIn ? "로그인하면 커리어 기준을 저장할 수 있습니다." :
    null;

  return (
    <div className="flex flex-col gap-3 px-4 pb-24 pt-5">
      <div className="pb-1">
        <h2 className="text-lg font-semibold text-slate-900">설정</h2>
        <p className="mt-1 text-xs text-slate-500">계정, 알림, AI 연결, 개인정보를 관리합니다.</p>
      </div>

      <SettingsCard icon={<User size={18} />} title="계정" description="로그인 계정과 상태를 확인합니다.">
        {isLoggedIn ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <User size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{user.name || "이름 정보 없음"}</p>
                <p className="truncate text-xs text-slate-500">{user.email || "이메일 정보 없음"}</p>
              </div>
              {user.provider && (
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {PROVIDER_LABEL[user.provider] ?? user.provider}
                </span>
              )}
            </div>
            <Disclosure title="계정 상세 관리">
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 py-2.5 text-sm font-medium text-red-600 active:bg-red-100"
              >
                <LogOut size={15} />
                로그아웃
              </button>
            </Disclosure>
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">로그인하고 나만의 커리어 기록을 쌓아보세요.</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              업무기록, 분석결과, 이력서 후보 문장을 계정 기준으로 저장할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={onLogin}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 py-2.5 text-sm font-medium text-white active:bg-violet-700"
            >
              <LogIn size={15} />
              로그인
            </button>
          </div>
        )}
      </SettingsCard>

      <SettingsCard icon={<Bell size={18} />} title="알림" description="주간 경험 회수 시간을 관리합니다.">
        <Disclosure title="알림 설정 관리">
          {reminderProps ? (
            <ReminderSettingsPanel {...reminderProps} defaultExpanded={false} />
          ) : (
            <p className="text-xs text-slate-500">알림 설정을 불러오는 중입니다.</p>
          )}
        </Disclosure>
      </SettingsCard>

      <SettingsCard icon={<Bot size={18} />} title="AI 연결" description="ChatGPT, Claude, 브라우저 확장에서 PASSMAP으로 업무기록을 보낼 수 있어요.">
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5">
            <p className="text-xs leading-relaxed text-slate-600">
              AI에서 저장한 내용은 AI Inbox에 초안으로 도착합니다.
            </p>
            <button
              type="button"
              onClick={onNavigateRecord}
              disabled={!onNavigateRecord}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Inbox size={14} />
              AI Inbox 보기
            </button>
          </div>
          <Disclosure title="Claude MCP 연결 관리">
            <McpConnectionPanel isLoggedIn={isLoggedIn} />
          </Disclosure>
        </div>
      </SettingsCard>

      <SettingsCard icon={<Shield size={18} />} title="개인정보" description="내 정보와 동의 항목을 확인합니다.">
        <div className="space-y-2">
          <Disclosure title="커리어 기준 관리">
            <div className="space-y-4">
              <div className="space-y-1.5 rounded-lg bg-violet-50 px-3 py-2 text-violet-800">
                <SummaryRow label="분석 대상" value={career.audienceType} />
                <SummaryRow label="현재" value={currentSummary} />
                <SummaryRow label="목표" value={targetSummary} />
              </div>
              <div>
                <p className="mb-1 text-[11px] font-medium text-slate-600">분석 대상</p>
                <select
                  value={career.audienceType}
                  onChange={(e) => updateCareer("audienceType", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 focus:border-violet-300 focus:outline-none"
                >
                  <option value="">선택하세요</option>
                  <option value="신입">신입</option>
                  <option value="경력">경력</option>
                </select>
              </div>
              <TwoLevelSelect
                label="현재 직무"
                options={JOB_CATEGORY_OPTIONS}
                majorValue={career.currentJobMajor}
                subValue={career.currentJobSub}
                onMajorChange={(v) => updateCareer("currentJobMajor", v)}
                onSubChange={(v) => updateCareer("currentJobSub", v)}
              />
              <TwoLevelSelect
                label="현재 산업"
                options={INDUSTRY_CATEGORY_OPTIONS}
                majorValue={career.currentIndustryMajor}
                subValue={career.currentIndustrySub}
                onMajorChange={(v) => updateCareer("currentIndustryMajor", v)}
                onSubChange={(v) => updateCareer("currentIndustrySub", v)}
              />
              <TwoLevelSelect
                label="목표 직무"
                options={JOB_CATEGORY_OPTIONS}
                majorValue={career.targetJobMajor}
                subValue={career.targetJobSub}
                onMajorChange={(v) => updateCareer("targetJobMajor", v)}
                onSubChange={(v) => updateCareer("targetJobSub", v)}
              />
              <TwoLevelSelect
                label="목표 산업"
                options={INDUSTRY_CATEGORY_OPTIONS}
                majorValue={career.targetIndustryMajor}
                subValue={career.targetIndustrySub}
                onMajorChange={(v) => updateCareer("targetIndustryMajor", v)}
                onSubChange={(v) => updateCareer("targetIndustrySub", v)}
              />
              <div className="border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saveDisabled}
                  className={[
                    "mb-1.5 w-full rounded-lg border py-2.5 text-xs font-medium transition-colors",
                    saveDisabled
                      ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
                      : cbStatus === "saved"
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-violet-200 bg-violet-50 text-violet-700 active:bg-violet-100",
                  ].join(" ")}
                >
                  {saveLabel}
                </button>
                {saveSubText && (
                  <p className={["text-center text-[10px]", cbStatus === "error" ? "text-red-500" : "text-slate-400"].join(" ")}>
                    {saveSubText}
                  </p>
                )}
              </div>
            </div>
          </Disclosure>

          <Disclosure title="내 정보와 동의 항목">
            <div className="space-y-3">
              <div className="space-y-2.5">
                {[
                  { label: "업무기록", desc: "저장된 기록은 이력서 재료로 사용됩니다." },
                  { label: "분석결과", desc: "최근 분석 결과 관리 기능은 준비 중입니다." },
                  { label: "이력서 후보 문장", desc: "업무기록 기반 문장 관리 기능은 준비 중입니다." },
                ].map(({ label, desc }) => (
                  <div key={label}>
                    <p className="text-xs font-medium text-slate-700">{label}</p>
                    <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-3">
                {["마케팅 안내 수신", "커넥터 연결 동의", "서비스 개선 사용 동의"].map((label) => (
                  <div key={label} className="flex items-center justify-between gap-2 py-0.5">
                    <span className="text-xs text-slate-700">{label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">준비 중</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <button type="button" disabled className="cursor-not-allowed text-xs text-slate-400">개인정보처리방침</button>
                <span className="select-none text-slate-200">|</span>
                <button type="button" disabled className="cursor-not-allowed text-xs text-slate-400">이용약관</button>
              </div>
            </div>
          </Disclosure>
        </div>
      </SettingsCard>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
          <HelpCircle size={16} />
          문의/지원
        </div>
        <Disclosure title="지원 메뉴 보기">
          <div className="space-y-2">
            {["오류 신고", "기능 제안", "문의하기"].map((label) => (
              <button
                key={label}
                type="button"
                disabled
                className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-400"
              >
                {label}
                <span className="text-[10px] text-slate-300">준비 중</span>
              </button>
            ))}
          </div>
        </Disclosure>
      </section>
    </div>
  );
}
