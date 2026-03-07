import { useEffect, useState, useRef } from "react";
import ModeSelector from "./ModeSelector";
import IndustrySelector from "./IndustrySelector";
import RoleSelector from "./RoleSelector";
import CareerQuestions from "./CareerQuestions";
import JDInput from "./JDInput";
import ResumeInput from "./ResumeInput";
import { ChevronLeft } from "lucide-react";
import { extractTextFromFile } from "../../lib/extract/extractTextFromFile.js";

// flowStep: App.jsx??`step` 蹂?섏? 異⑸룎 諛⑹?瑜??꾪빐 蹂꾨룄 ?ㅼ엫 ?ъ슜
const FLOW = {
  MODE:             1,
  INDUSTRY_CURRENT: 2,
  INDUSTRY_TARGET:  3,
  ROLE:             4,
  CAREER:           5,
  COMPENSATION:     6,
  JD:               7,
  RESUME:           8,
  ANALYZE:          9,
};

// KSCO major 직무군 (1차 선택)
const KSCO_MAJOR_OPTIONS = [
  { v: "unknown", t: "모름 / 기타" },
  { v: "ksco_2",  t: "전문가 및 관련 종사자" },
  { v: "ksco_3",  t: "사무 종사자" },
  { v: "ksco_5",  t: "판매영업" },
  { v: "ksco_8",  t: "장치·기계 조작 및 조립" },
];

// ksco_3(사무 종사자) 세부 직무 (2차 선택)
const OFFICE_SUB_OPTIONS = [
  { v: "office_general",     t: "일반 사무" },
  { v: "office_admin",       t: "행정" },
  { v: "office_accounting",  t: "회계" },
  { v: "office_hr",          t: "인사" },
  { v: "office_bizsupport",  t: "경영 지원" },
  { v: "office_finance",     t: "재무" },
  { v: "office_planning",    t: "기획" },
  { v: "office_opsSupport",  t: "운영 지원" },
  { v: "office_sales",       t: "영업(국내/해외/기술)" },
  { v: "office_marketing",   t: "마케팅" },
  { v: "office_procurement", t: "구매/조달" },
];

// fast: 1??????????  /  deep: 1??????????????
export default function InputFlow({ state, setState, onAnalyze, onGoDoc, onExtract }) {
  const [flowStep, setFlowStep] = useState(FLOW.MODE);
  const [mode, setMode] = useState(null);
  const [submitError, setSubmitError] = useState("");
  // ROLE 단계 내부 상태: "current-major" / "current-sub" / "target-major" / "target-sub"
  const [roleMajorStep, setRoleMajorStep] = useState("current-major");
  const [roleMajorSelected, setRoleMajorSelected] = useState("");
  const [currentMajorSelected, setCurrentMajorSelected] = useState("");
  // append-only: 泥⑤? ?곹깭 ?쒖떆??  const [attachedFileName, setAttachedFileName] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState(null);
  const fileInputRef = useRef(null);

  const totalSteps = mode === "deep" ? 8 : 6;
  const progress = Math.round(((flowStep - 1) / totalSteps) * 100);
  const isEntryLevelMode = Boolean(state?.entryLevelMode);

  const handleMode = (m) => {
    setSubmitError("");
    setMode(m);
    setFlowStep(FLOW.INDUSTRY_CURRENT);
  };

  const handleIndustryCurrent = (v) => {
    setSubmitError("");
    setState((prev) => ({ ...prev, industryCurrent: v }));
    setFlowStep(FLOW.INDUSTRY_TARGET);
  };

  const handleIndustryTarget = (v) => {
    setSubmitError("");
    setState((prev) => ({ ...prev, industryTarget: v }));
    setRoleMajorStep(isEntryLevelMode ? "target-major" : (state.currentRole ? "target-major" : "current-major"));
    setFlowStep(FLOW.ROLE);
  };

  const handleEntryLevelModeChange = (checked) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      entryLevelMode: checked,
      ...(checked
        ? {
          industryCurrent: "unknown",
          currentRole: "unknown",
          roleCurrent: "unknown",
          currentRoleKscoMajor: "unknown",
          currentRoleKscoOfficeSub: "",
          salaryCurrent: "",
          companySizeCandidate: "unknown",
        }
        : {}),
    }));
    if (checked) {
      setSalaryImeBuffer((prev) => ({ ...prev, salaryCurrent: "" }));
      setRoleMajorStep("target-major");
      setCurrentMajorSelected("");
      if (flowStep === FLOW.INDUSTRY_CURRENT) {
        setFlowStep(FLOW.INDUSTRY_TARGET);
      }
    }
  };

  const handleCurrentRole = (label, major, sub) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      currentRole: label,
      roleCurrent: label,
      currentRoleKscoMajor: major ?? "unknown",
      currentRoleKscoOfficeSub: sub ?? "",
    }));
    setCurrentMajorSelected("");
    setRoleMajorStep("target-major");
  };

  const handleRole = (roleLabel, major, sub) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      role: roleLabel,
      roleTarget: roleLabel,
      roleKscoMajor: major ?? "unknown",
      roleKscoOfficeSub: sub ?? "",
    }));
    setRoleMajorStep("current-major");
    setRoleMajorSelected("");
    setFlowStep(FLOW.CAREER);
  };

  // CareerQuestions??onChange濡?state瑜?吏곸젒 ?낅뜲?댄듃?섎?濡? onDone? ?⑥닚 ?대룞
  const handleCareerDone = () => {
    setSubmitError("");
    setFlowStep(FLOW.COMPENSATION);
  };

  const handleCompensationDone = () => {
    setSubmitError("");
    setFlowStep(mode === "fast" ? FLOW.ANALYZE : FLOW.JD);
  };

  // JDInput / ResumeInput??onChange濡?吏곸젒 ?낅뜲?댄듃?섎?濡?onDone? ?⑥닚 ?대룞
  const handleJDDone = () => {
    setSubmitError("");
    setFlowStep(FLOW.RESUME);
  };

  const handleResumeDone = () => {
    setSubmitError("");
    setFlowStep(FLOW.ANALYZE);
  };

  const [salaryImeBuffer, setSalaryImeBuffer] = useState({ salaryCurrent: "", salaryTarget: "" });
  const [salaryComposing, setSalaryComposing] = useState({ salaryCurrent: false, salaryTarget: false });

  useEffect(() => {
    if (!isEntryLevelMode) return;
    if (roleMajorStep === "current-major" || roleMajorStep === "current-sub") {
      setRoleMajorStep("target-major");
      setCurrentMajorSelected("");
    }
  }, [isEntryLevelMode, roleMajorStep]);

  const getSalaryValue = (key) => {
    const hasBuffer = salaryImeBuffer[key] !== "";
    return hasBuffer ? salaryImeBuffer[key] : String(state?.[key] ?? "");
  };

  const commitSalary = (key, raw) => {
    const v = String(raw ?? "");
    setState((prev) => ({
      ...prev,
      [key]: v,
      ...(key === "salaryTarget" ? { salaryExpected: v } : {}),
    }));
    setSalaryImeBuffer((prev) => ({ ...prev, [key]: "" }));
  };

  // append-only: JD 泥⑤? ?곹깭
  const [jdAttachedFileName, setJdAttachedFileName] = useState(null);
  const jdFileInputRef = useRef(null);
  const [jdFileError, setJdFileError] = useState("");
  const [resumeFileError, setResumeFileError] = useState("");
  // append-only: JD URL 불러오기 상태
  const [jdUrl, setJdUrl] = useState("");
  const [jdUrlLoadStatus, setJdUrlLoadStatus] = useState("idle"); // idle | loading | success | error
  const [jdUrlError, setJdUrlError] = useState("");

  const JD_URL_HOST_ALLOW = new Set([
    "saramin.co.kr",
    "www.saramin.co.kr",
    "jobkorea.co.kr",
    "www.jobkorea.co.kr",
    "wanted.co.kr",
    "www.wanted.co.kr",
  ]);

  const getJdUrlErrorMessage = (code) => {
    if (code === "UNSUPPORTED_DOMAIN") return "현재는 사람인 / 잡코리아 / 원티드 링크만 지원합니다.";
    if (code === "FETCH_FAILED") return "링크에서 채용공고를 불러오지 못했습니다.";
    if (code === "TEXT_TOO_SHORT") {
      return "채용공고 내용을 충분히 추출하지 못했습니다. 텍스트 붙여넣기 또는 파일 첨부를 이용해 주세요.";
    }
    return "올바른 채용공고 링크를 입력해 주세요.";
  };

  const getFileExtractErrorMessage = (res, file) => {
    const code = String(res?.error || res?.message || "").trim().toUpperCase();
    const warning = Array.isArray(res?.meta?.warnings)
      ? String(res.meta.warnings.find(Boolean) || "").trim()
      : "";
    const ext = String(file?.name || "").toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "";
    const mime = String(file?.type || "").toLowerCase();
    const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext) || mime.startsWith("image/");
    const isDocLike =
      ext === "pdf" ||
      ext === "docx" ||
      ext === "txt" ||
      mime === "application/pdf" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime.startsWith("text/");

    if (code === "OCR_REQUEST_FAILED") return "OCR 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    if (code === "OCR_EMPTY_TEXT") return "이미지에서 텍스트를 읽지 못했습니다. 더 선명한 이미지로 다시 시도해 주세요.";
    if (isDocLike) return "PDF/Word 텍스트 추출에 실패했습니다. 파일 형식을 확인하거나 다른 파일로 시도해 주세요.";
    if (!isImage && !isDocLike) {
      return "지원하지 않는 형식이거나 파일을 읽지 못했습니다. (PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP 지원)";
    }
    if (warning) return warning;
    return "파일에서 텍스트를 추출하지 못했습니다. 파일 형식/내용을 확인해 주세요.";
  };

  // append-only: 踰꾪듉??泥⑤? ?몃뱾??(resume)
  const handleAttachFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setResumeFileError("");
    const res = await extractTextFromFile(file, "resume");
    if (res.ok && res.text?.trim() && typeof onExtract === "function") {
      console.log("[InputFlow.onExtract]", {
        field: "resume",
        textLen: res?.text?.length
      });
      onExtract("resume", res.text, res.meta);
      setAttachedFileName(file.name);
      setResumeFileError("");
    } else if (res.ok && !res.text?.trim()) {
      setAttachedFileName(null);
      setResumeFileError("파일에서 텍스트를 추출하지 못했습니다. 다른 파일로 다시 시도해 주세요.");
    } else if (!res.ok) {
      setAttachedFileName(null);
      setResumeFileError(getFileExtractErrorMessage(res, file));
    }
    if (e.target) e.target.value = "";
  };

  // append-only: 踰꾪듉??泥⑤? ?몃뱾??(jd)
  const handleAttachJDFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setJdFileError("");
    const res = await extractTextFromFile(file, "jd");
    if (res.ok && res.text?.trim() && typeof onExtract === "function") {
      console.log("[OCR->InputFlow]", {
        ok: res?.ok,
        textLen: typeof res?.text === "string" ? res.text.length : null,
        textPreview: typeof res?.text === "string" ? res.text.slice(0, 120) : null,
        kind: "jd",
      });
      console.log("[InputFlow.onExtract]", {
        field: "jd",
        textLen: res?.text?.length
      });
      onExtract("jd", res.text, res.meta);
      setJdAttachedFileName(file.name);
      setJdFileError("");
    } else if (res.ok && !res.text?.trim()) {
      setJdAttachedFileName(null);
      setJdFileError("파일에서 텍스트를 추출하지 못했습니다. 다른 파일로 다시 시도해 주세요.");
    } else if (!res.ok) {
      setJdAttachedFileName(null);
      setJdFileError(getFileExtractErrorMessage(res, file));
    }
    if (e.target) e.target.value = "";
  };

  // append-only: URL로 JD 불러오기 (MVP)
  const handleLoadJDFromUrl = async () => {
    const raw = String(jdUrl || "").trim();
    if (!raw) {
      setJdUrlLoadStatus("error");
      setJdUrlError("올바른 채용공고 링크를 입력해 주세요.");
      return;
    }

    let parsed = null;
    try {
      parsed = new URL(raw);
    } catch {
      setJdUrlLoadStatus("error");
      setJdUrlError("올바른 채용공고 링크를 입력해 주세요.");
      return;
    }

    const host = String(parsed.hostname || "").toLowerCase();
    if (!JD_URL_HOST_ALLOW.has(host)) {
      setJdUrlLoadStatus("error");
      setJdUrlError("현재는 사람인 / 잡코리아 / 원티드 링크만 지원합니다.");
      return;
    }

    setJdUrlLoadStatus("loading");
    setJdUrlError("");
    try {
      const isLocalDevOn5173 =
        Boolean(import.meta?.env?.DEV) &&
        typeof window !== "undefined" &&
        window.location?.hostname === "localhost" &&
        String(window.location?.port || "") === "5173";
      const endpoint = isLocalDevOn5173 ? "http://localhost:3000/api/extract-job-posting" : "/api/extract-job-posting";
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: raw }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.ok || !String(data?.text || "").trim()) {
        setJdUrlLoadStatus("error");
        setJdUrlError(getJdUrlErrorMessage(String(data?.error || "")));
        return;
      }

      const nextText = String(data.text || "").trim();
      setState((prev) => ({ ...prev, jd: nextText }));
      setJdUrlLoadStatus("success");
      setJdUrlError("");
    } catch {
      setJdUrlLoadStatus("error");
      setJdUrlError("링크에서 채용공고를 불러오지 못했습니다.");
    }
  };

  const getSubmitValidationMessage = (intent) => {
    const targetRoleRaw = state?.targetRole ?? state?.roleTarget ?? "";
    const currentRoleRaw = state?.roleCurrent ?? state?.currentRole ?? "";
    const legacyRoleRaw = state?.role ?? "";
    const hasTargetRole =
      !!String(targetRoleRaw).trim() ||
      (!!String(legacyRoleRaw).trim() && !String(currentRoleRaw).trim());
    const hasIndustryCurrent = !!String(state?.industryCurrent || state?.currentIndustry || "").trim();
    const hasIndustryTarget = !!String(state?.industryTarget || state?.targetIndustry || "").trim();
    const hasCareerObject = !!(state?.career && typeof state.career === "object");
    const totalYearsRaw = state?.career?.totalYears;
    const hasCareerYearsInput =
      totalYearsRaw !== null &&
      totalYearsRaw !== undefined &&
      String(totalYearsRaw).trim() !== "";
    const totalYears = hasCareerYearsInput ? Number(totalYearsRaw) : NaN;
    const hasCareerYears = hasCareerYearsInput && Number.isFinite(totalYears) && totalYears >= 0;
    const hasJd = !!String(state?.jd || state?.jdText || "").trim();
    const hasResume = !!String(state?.resume || state?.resumeText || "").trim();
    const entryLevelMode = Boolean(state?.entryLevelMode);

    if (!hasTargetRole) return "지원 직무를 먼저 선택해주세요.";
    if (!hasIndustryTarget) return "지원 산업을 먼저 선택해주세요.";
    if (!entryLevelMode && !hasIndustryCurrent) return "현재 산업을 먼저 선택해주세요.";
    if (!hasCareerObject || !hasCareerYears) {
      return "경력 정보가 비어 있어 분석 정확도가 크게 떨어질 수 있습니다. 총 경력을 먼저 입력해주세요.";
    }
    if (intent === "analyze" && mode === "deep" && !hasJd && !hasResume) {
      return "JD 또는 이력서를 붙여넣거나 첨부한 뒤 정밀 분석을 진행해주세요.";
    }
    return "";
  };

  const handleAnalyzeClick = async () => {
    const validationMessage = getSubmitValidationMessage("analyze");
    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }
    setSubmitError("");
    if (typeof onAnalyze !== "function") {
      setSubmitError("분석 기능을 다시 불러온 뒤 시도해주세요.");
      return;
    }
    try {
      await Promise.resolve(onAnalyze());
    } catch (err) {
      setSubmitError("분석 요청 중 오류가 발생했습니다. 입력값을 확인한 뒤 다시 시도해주세요.");
      // TMP_DEBUG: remove after confirm
      try {
        globalThis.__INPUTFLOW_SUBMIT_ERR__ = {
          at: Date.now(),
          where: "InputFlow.handleAnalyzeClick",
          message: err?.message || String(err),
          stack: err?.stack || null,
          flowStep,
          mode,
        };
      } catch { }
    }
  };

  const handleGoDocClick = async () => {
    const validationMessage = getSubmitValidationMessage("goDoc");
    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }
    setSubmitError("");
    if (typeof onGoDoc !== "function") {
      setSubmitError("자가진단 기능을 다시 불러온 뒤 시도해주세요.");
      return;
    }
    try {
      await Promise.resolve(onGoDoc());
    } catch (err) {
      setSubmitError("자가진단 화면 이동 중 오류가 발생했습니다. 다시 시도해주세요.");
      // TMP_DEBUG: remove after confirm
      try {
        globalThis.__INPUTFLOW_SUBMIT_ERR__ = {
          at: Date.now(),
          where: "InputFlow.handleGoDocClick",
          message: err?.message || String(err),
          stack: err?.stack || null,
          flowStep,
          mode,
        };
      } catch { }
    }
  };

  return (
    <div className="flex flex-col gap-6 px-1 pb-10">
      {/* ?곷떒 ?ㅻ뜑 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {flowStep > FLOW.MODE && (
            <button
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setFlowStep((s) => Math.max(s - 1, FLOW.MODE))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs text-slate-400">
            {flowStep < FLOW.ANALYZE ? `${flowStep} / ${totalSteps}` : ""}
          </span>
        </div>
        {/* 湲곗〈 ?낅젰 諛⑹떇?쇰줈 留곹겕 ?쒓굅 (SHOW_LEGACY_JOB_INPUTS = false ?뺤콉???곕씪 ?곴뎄 ?④?) */}
      </div>

      {/* 吏꾪뻾 諛?*/}
      {flowStep < FLOW.ANALYZE && (
        <div className="h-1 w-full rounded-full bg-slate-100">
          <div
            className="h-1 rounded-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {flowStep >= FLOW.INDUSTRY_CURRENT && (
        <label className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="flex items-center gap-2 font-medium text-slate-900">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isEntryLevelMode}
              onChange={(e) => handleEntryLevelModeChange(e.target.checked)}
            />
            신입이거나 현재 재직 정보가 없습니다
          </span>
          <span className="mt-2 block text-xs text-slate-500">
            이 경우 현재 산업, 현재 직무, 현재 연봉, 현재 기업규모는 입력하지 않아도 됩니다.
          </span>
          <span className="block text-xs text-slate-500">
            분석 시 해당 정보는 모름 기준으로 처리됩니다.
          </span>
        </label>
      )}

      {/* ?④퀎蹂?而댄룷?뚰듃 */}
      {flowStep === FLOW.MODE             && <ModeSelector onSelect={handleMode} />}
      {flowStep === FLOW.INDUSTRY_CURRENT && (
        isEntryLevelMode ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm text-slate-600">
              신입/현재 정보 없음 모드에서는 현재 산업 입력을 건너뜁니다.
            </div>
            <button
              className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white self-start"
              onClick={() => setFlowStep(FLOW.INDUSTRY_TARGET)}
            >
              다음
            </button>
          </div>
        ) : (
          <IndustrySelector label="현재 재직 중인 산업" onSelect={handleIndustryCurrent} />
        )
      )}
      {flowStep === FLOW.INDUSTRY_TARGET  && <IndustrySelector label="지원하는 산업" onSelect={handleIndustryTarget} />}
      {flowStep === FLOW.ROLE && (
        roleMajorStep === "current-major" ? (
          <div className="flex flex-col gap-4">
            <div className="text-lg font-semibold text-slate-900">
              현재 직무를 선택하세요{" "}
              <span className="text-sm font-normal text-slate-400">(선택)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {KSCO_MAJOR_OPTIONS.map(({ v, t }) => (
                <button
                  key={v}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                  onClick={() => {
                    if (v === "ksco_3") {
                      setCurrentMajorSelected(v);
                      setRoleMajorStep("current-sub");
                    } else {
                      handleCurrentRole(t, v, "");
                    }
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : roleMajorStep === "current-sub" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => { setRoleMajorStep("current-major"); setCurrentMajorSelected(""); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-lg font-semibold text-slate-900">현재 세부 직무를 선택하세요</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OFFICE_SUB_OPTIONS.map(({ v, t }) => (
                <button
                  key={v}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                  onClick={() => handleCurrentRole(t, currentMajorSelected, v)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : roleMajorStep === "target-sub" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => { setRoleMajorStep("target-major"); setRoleMajorSelected(""); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-lg font-semibold text-slate-900">지원 세부 직무를 선택하세요</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OFFICE_SUB_OPTIONS.map(({ v, t }) => (
                <button
                  key={v}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                  onClick={() => handleRole(t, roleMajorSelected, v)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  if (isEntryLevelMode) {
                    setFlowStep(FLOW.INDUSTRY_TARGET);
                    return;
                  }
                  setRoleMajorStep("current-major");
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-lg font-semibold text-slate-900">지원 직무를 선택하세요</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {KSCO_MAJOR_OPTIONS.map(({ v, t }) => (
                <button
                  key={v}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                  onClick={() => {
                    if (v === "ksco_3") {
                      setRoleMajorSelected(v);
                      setRoleMajorStep("target-sub");
                    } else {
                      handleRole(t, v, "");
                    }
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )
      )}
      {flowStep === FLOW.CAREER           && (
        <CareerQuestions state={state} setState={setState} onDone={handleCareerDone} />
      )}
      {flowStep === FLOW.COMPENSATION     && (
        <div className="flex flex-col gap-5">
          <div className="text-lg font-semibold text-slate-900">연봉/기업규모/나이</div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">나이</span>
              <input
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                value={state?.age ?? ""}
                onChange={(e) => setState((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="예: 30"
              />
            </label>

            {!isEntryLevelMode && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">현재 기업 규모</span>
                <select
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                  value={state?.companySizeCandidate || "unknown"}
                  onChange={(e) => setState((prev) => ({ ...prev, companySizeCandidate: e.target.value }))}
                >
                  <option value="unknown">선택 안 함</option>
                  <option value="startup">스타트업</option>
                  <option value="small_mid">중소/강소기업</option>
                  <option value="mid_large">중견기업</option>
                  <option value="large">대기업</option>
                  <option value="public">공공/기관</option>
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">지원 회사 기업 규모</span>
              <select
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                value={state?.companySizeTarget || "unknown"}
                onChange={(e) => setState((prev) => ({ ...prev, companySizeTarget: e.target.value }))}
              >
                <option value="unknown">선택 안 함</option>
                <option value="startup">스타트업</option>
                <option value="small_mid">중소/강소기업</option>
                <option value="mid_large">중견기업</option>
                <option value="large">대기업</option>
                <option value="public">공공/기관</option>
              </select>
            </label>

            {!isEntryLevelMode && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">현재 연봉(만원)</span>
                <input
                  inputMode="numeric"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                  placeholder="예: 4500"
                  value={getSalaryValue("salaryCurrent")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSalaryImeBuffer((prev) => ({ ...prev, salaryCurrent: v }));
                    if (!salaryComposing.salaryCurrent) {
                      setState((prev) => ({ ...prev, salaryCurrent: v }));
                    }
                  }}
                  onCompositionStart={() => setSalaryComposing((prev) => ({ ...prev, salaryCurrent: true }))}
                  onCompositionEnd={(e) => {
                    setSalaryComposing((prev) => ({ ...prev, salaryCurrent: false }));
                    commitSalary("salaryCurrent", e.currentTarget.value);
                  }}
                  onBlur={(e) => commitSalary("salaryCurrent", e.currentTarget.value)}
                />
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">목표 연봉(만원)</span>
              <input
                inputMode="numeric"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                placeholder="예: 6000"
                value={getSalaryValue("salaryTarget")}
                onChange={(e) => {
                  const v = e.target.value;
                  setSalaryImeBuffer((prev) => ({ ...prev, salaryTarget: v }));
                  if (!salaryComposing.salaryTarget) {
                    setState((prev) => ({ ...prev, salaryTarget: v, salaryExpected: v }));
                  }
                }}
                onCompositionStart={() => setSalaryComposing((prev) => ({ ...prev, salaryTarget: true }))}
                onCompositionEnd={(e) => {
                  setSalaryComposing((prev) => ({ ...prev, salaryTarget: false }));
                  commitSalary("salaryTarget", e.currentTarget.value);
                }}
                onBlur={(e) => commitSalary("salaryTarget", e.currentTarget.value)}
              />
            </label>
          </div>

          <button
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            onClick={handleCompensationDone}
          >
            다음
          </button>
        </div>
      )}
      {flowStep === FLOW.JD               && (
        <div className="flex flex-col gap-4">
          {/* append-only: JD URL 입력 블록 */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">채용공고 링크로 가져오기</div>
            <p className="text-xs text-slate-500">
              사람인 / 잡코리아 / 원티드 채용공고 링크를 붙여넣으면 텍스트를 자동으로 불러옵니다.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                placeholder="사람인 / 잡코리아 / 원티드 채용공고 URL 붙여넣기"
                value={jdUrl}
                onChange={(e) => {
                  setJdUrl(e.target.value);
                  if (jdUrlLoadStatus !== "idle") setJdUrlLoadStatus("idle");
                  if (jdUrlError) setJdUrlError("");
                }}
              />
              <button
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLoadJDFromUrl}
                disabled={jdUrlLoadStatus === "loading"}
              >
                {jdUrlLoadStatus === "loading" ? "불러오는 중..." : "불러오기"}
              </button>
            </div>
            {/* 지원 사이트 바로가기 */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              <a
                href="https://www.saramin.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 hover:opacity-80"
              >
                <img
                  src={`${import.meta.env.BASE_URL}logos/saramin.svg`}
                  className="h-5 w-auto"
                  alt="사람인"
                />
                <span>사람인</span>
              </a>

              <a
                href="https://www.jobkorea.co.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-50 hover:opacity-80"
              >
                <img
                  src={`${import.meta.env.BASE_URL}logos/jobkorea.svg`}
                  className="h-5 w-auto"
                  alt="잡코리아"
                />
                <span>잡코리아</span>
              </a>
            </div>
            {jdUrlLoadStatus === "success" && !jdUrlError && (
              <div className="text-xs text-emerald-700">채용공고 내용을 불러왔습니다. 아래에서 바로 수정할 수 있습니다.</div>
            )}
            {jdUrlError && <div className="text-xs text-red-600">{jdUrlError}</div>}
          </div>
          <JDInput state={state} setState={setState} onDone={handleJDDone} />
          {/* append-only: JD 踰꾪듉??泥⑤? UI */}
          <div className="flex flex-col gap-2">
            <input
              ref={jdFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleAttachJDFile}
            />
            <button
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => jdFileInputRef.current?.click()}
            >
              {jdAttachedFileName ? "다시 첨부" : "📎 첨부하기"}
            </button>
            {jdAttachedFileName && (
              <span className="text-xs text-slate-500 truncate">{jdAttachedFileName} 쨌 泥⑤? ?꾨즺</span>
            )}
            {jdFileError && (
              <div className="text-xs text-red-600">{jdFileError}</div>
            )}
          </div>
        </div>
      )}
      {flowStep === FLOW.RESUME           && (
        <div className="flex flex-col gap-4">
          <ResumeInput state={state} setState={setState} onDone={handleResumeDone} />
          {/* append-only: 踰꾪듉??泥⑤? UI */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleAttachFile}
            />
            <button
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {attachedFileName ? "다시 첨부" : "📎 첨부하기"}
            </button>
            {attachedFileName && (
              <span className="text-xs text-slate-500 truncate">{attachedFileName} 쨌 泥⑤? ?꾨즺</span>
            )}
            {resumeFileError && (
              <div className="text-xs text-red-600">{resumeFileError}</div>
            )}
          </div>
        </div>
      )}

      {/* 최종 분석 단계 — CTA 2개로 분기 */}
      {flowStep === FLOW.ANALYZE && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-xl font-semibold text-slate-900">준비 완료</div>
          <p className="text-sm text-slate-500 text-center">
            입력한 정보를 바탕으로 합격 리스크를 분석합니다.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {submitError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {submitError}
              </div>
            ) : null}
            {mode === "deep" && typeof onGoDoc === "function" && (
              <button
                className="rounded-full border border-slate-900 px-8 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                onClick={handleGoDocClick}
              >
                자가진단하고 더 상세하게 진단
              </button>
            )}
            <button
              className="rounded-full bg-slate-900 px-10 py-3 font-semibold text-white"
              onClick={handleAnalyzeClick}
            >
              바로 분석
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
