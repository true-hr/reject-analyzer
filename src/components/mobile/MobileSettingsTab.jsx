import { useState, useEffect } from "react";
import { LogOut, LogIn, User, ChevronDown } from "lucide-react";
import ReminderSettingsPanel from "../reminder/ReminderSettingsPanel.jsx";
import McpConnectionPanel from "../mcp/McpConnectionPanel.jsx";
import { JOB_CATEGORY_OPTIONS, INDUSTRY_CATEGORY_OPTIONS } from "../input/categoryOptions.js";

function CollapsibleSection({ title, description, open, onToggle, children }) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full items-start justify-between gap-2 text-left"
      >
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{description}</p>
          )}
        </div>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && children}
    </section>
  );
}

const PROVIDER_LABEL = {
  google: "Google",
  kakao: "Kakao",
  "custom:naver": "Naver",
  naver: "Naver",
};

function SectionTitle({ title, description }) {
  return (
    <div className="mb-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {description && (
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{description}</p>
      )}
    </div>
  );
}

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

export default function MobileSettingsTab({ auth, onLogin, onLogout, reminderProps, careerBaselineProps, onNavigateRecord }) {
  const isLoggedIn = auth?.loggedIn && auth?.user;
  const user = auth?.user;
  const [career, setCareer] = useState(INITIAL_CAREER);
  const [careerOpen, setCareerOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

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

  const hasAnySetting =
    career.audienceType ||
    career.currentJobMajor ||
    career.currentIndustryMajor ||
    career.targetJobMajor ||
    career.targetIndustryMajor;

  const summaryCurrentJob = career.currentJobSub || career.currentJobMajor;
  const summaryCurrentIndustry = career.currentIndustrySub || career.currentIndustryMajor;
  const summaryTargetJob = career.targetJobSub || career.targetJobMajor;
  const summaryTargetIndustry = career.targetIndustrySub || career.targetIndustryMajor;

  const saveDisabled = !isLoggedIn || cbStatus === "saving" || cbStatus === "loading";
  const saveLabel =
    cbStatus === "saving" ? "저장 중..." :
    cbStatus === "saved"  ? "저장됐어요" :
    "커리어 기준 저장";
  const saveSubText =
    cbStatus === "error"  ? "저장에 실패했어요. 다시 시도해 주세요." :
    !isLoggedIn           ? "로그인 후 커리어 기준을 저장할 수 있습니다." :
    null;

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 pt-6">
      <h2 className="text-base font-semibold text-slate-800">설정</h2>

      {/* ── 내 계정 ── */}
      <section>
        <SectionTitle title="내 계정" />
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
            <p className="mb-1 text-sm font-medium text-slate-800">
              로그인하고 나만의 커리어 기록을 쌓아보세요
            </p>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              업무기록, 분석결과, 이력서 후보 문장을 계정 기준으로 저장할 수 있어요.
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
      </section>

      {/* ── 내 커리어 기준 ── */}
      <CollapsibleSection
        title="내 커리어 기준"
        description="분석 결과와 이력서 문장을 만들 때 참고할 기본 정보입니다."
        open={careerOpen}
        onToggle={() => setCareerOpen((v) => !v)}
      >
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {hasAnySetting && (
            <div className="rounded-lg bg-violet-50 px-3 py-2 text-xs leading-relaxed text-violet-700">
              {career.audienceType && (
                <p>분석 대상: <span className="font-medium">{career.audienceType}</span></p>
              )}
              {(summaryCurrentJob || summaryCurrentIndustry) && (
                <p>
                  현재:{" "}
                  <span className="font-medium">
                    {[summaryCurrentJob, summaryCurrentIndustry].filter(Boolean).join(" · ")}
                  </span>
                </p>
              )}
              {(summaryTargetJob || summaryTargetIndustry) && (
                <p>
                  목표:{" "}
                  <span className="font-medium">
                    {[summaryTargetJob, summaryTargetIndustry].filter(Boolean).join(" · ")}
                  </span>
                </p>
              )}
            </div>
          )}

          {/* 분석 대상 */}
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
              <p className={[
                "text-center text-[10px]",
                cbStatus === "error" ? "text-red-500" : "text-slate-400",
              ].join(" ")}>
                {saveSubText}
              </p>
            )}
          </div>
        </div>
      </CollapsibleSection>

      {/* ── 경험 회수 알림 ── */}
      <section>
        <SectionTitle
          title="경험 회수 알림"
          description="이번 주 경험이 흐려지기 전에 기록하도록 알려드려요."
        />
        {reminderProps && <ReminderSettingsPanel {...reminderProps} defaultExpanded={false} />}
      </section>

      {/* ── MCP 연동 설정 ── */}
      <CollapsibleSection
        title="MCP 연동 설정"
        description="Claude Desktop에서 PASSMAP에 경험 후보를 저장/검색할 수 있도록 연결합니다."
        open={mcpOpen}
        onToggle={() => setMcpOpen((v) => !v)}
      >
        <McpConnectionPanel isLoggedIn={isLoggedIn} />
      </CollapsibleSection>

      {/* ── AI 작업기록 안내 (본체는 경험 정리하기 탭으로 이동) ── */}
      <section>
        <SectionTitle
          title="AI 작업기록"
          description="저장된 AI 작업기록과 이력서 재료함은 경험 정리하기에서 확인하세요."
        />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-relaxed text-slate-500">
            Claude·ChatGPT·Gemini에서 MCP로 보낸 경험 후보를 검토하고 이력서 재료로 확정하는 화면은 기록 탭으로 옮겼어요.
          </p>
          <button
            type="button"
            onClick={onNavigateRecord}
            disabled={!onNavigateRecord}
            className="mt-3 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            기록 탭에서 열기
          </button>
        </div>
      </section>

      {/* ── 내 데이터 관리 ── */}
      <CollapsibleSection
        title="내 데이터 관리"
        description="로그인하면 업무기록과 분석결과가 계정 기준으로 저장됩니다."
        open={dataOpen}
        onToggle={() => setDataOpen((v) => !v)}
      >
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2.5">
            {[
              { label: "업무기록", desc: "저장된 기록을 이력서 재료로 활용" },
              { label: "분석결과", desc: "최근 분석 결과 관리 기능 준비 중" },
              { label: "이력서 후보 문장", desc: "업무기록 기반으로 생성된 문장 관리 예정" },
            ].map(({ label, desc }) => (
              <div key={label}>
                <p className="text-xs font-medium text-slate-700">{label}</p>
                <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-400"
            >
              저장된 분석 보기
            </button>
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-400"
            >
              업무기록 관리
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400">기능 준비 중입니다</p>
        </div>
      </CollapsibleSection>

      {/* ── 동의 관리 ── */}
      <CollapsibleSection
        title="동의 관리"
        description="내 커리어 데이터가 어디까지 활용될지 직접 관리할 수 있어요."
        open={consentOpen}
        onToggle={() => setConsentOpen((v) => !v)}
      >
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            {["마케팅 안내 수신", "컨설팅 연결 동의", "서비스 개선 활용 동의"].map((label) => (
              <div key={label} className="flex items-center justify-between gap-2 py-0.5">
                <span className="text-xs text-slate-700">{label}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                  준비 중
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              disabled
              className="cursor-not-allowed text-xs text-slate-400"
            >
              개인정보처리방침
            </button>
            <span className="select-none text-slate-200">|</span>
            <button
              type="button"
              disabled
              className="cursor-not-allowed text-xs text-slate-400"
            >
              이용약관
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── 고객지원 ── */}
      <CollapsibleSection
        title="고객지원"
        description="분석 결과가 어색하거나 오류가 있으면 알려주세요."
        open={supportOpen}
        onToggle={() => setSupportOpen((v) => !v)}
      >
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
      </CollapsibleSection>
    </div>
  );
}
