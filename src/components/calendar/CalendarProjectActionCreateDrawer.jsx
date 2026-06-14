import { useState } from "react";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS = [
  { value: "planned", label: "계획" },
  { value: "in_progress", label: "진행 중" },
  { value: "completed", label: "완료" },
  { value: "needs_review", label: "확인 필요" },
];

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function normalizeDate(value) {
  return String(value || "").slice(0, 10);
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildForm(draft) {
  const raw = safeObject(draft?.raw_payload || draft?.rawPayload);
  const recommendedAction = safeObject(draft?.recommendedAction || raw.recommendedAction);
  const startDate = normalizeDate(firstNonEmpty(draft?.startDate, raw.startDate, recommendedAction.suggestedDate, draft?.date));
  return {
    recordDate: normalizeDate(firstNonEmpty(draft?.date, raw.date, startDate)),
    projectName: firstNonEmpty(draft?.projectName, raw.projectName, recommendedAction.projectName),
    title: firstNonEmpty(draft?.title, draft?.task, raw.title, raw.projectActions, recommendedAction.title, recommendedAction.description),
    task: firstNonEmpty(draft?.task, raw.task, raw.projectActions, recommendedAction.title, recommendedAction.description),
    description: firstNonEmpty(draft?.description, raw.description, raw.projectContext, recommendedAction.description),
    startDate,
    endDate: normalizeDate(firstNonEmpty(draft?.endDate, raw.endDate, recommendedAction.endDate, startDate)),
    status: firstNonEmpty(draft?.actionStatus, raw.actionStatus, "planned"),
    projectResult: firstNonEmpty(draft?.projectResult, raw.projectResult),
    projectInsight: firstNonEmpty(draft?.projectInsight, raw.projectInsight),
    projectGoal: firstNonEmpty(draft?.projectGoal, raw.projectGoal),
    projectContext: firstNonEmpty(draft?.projectContext, raw.projectContext, recommendedAction.description),
    strengthTags: "",
    skillTags: "",
  };
}

function buildCreatePayload(draft, form) {
  const raw = safeObject(draft?.raw_payload || draft?.rawPayload);
  const recommendedAction = safeObject(draft?.recommendedAction || raw.recommendedAction);
  const projectActions = String(form.task || form.title || "").trim();
  const projectResult = String(form.projectResult || "").trim();
  const projectInsight = String(form.projectInsight || "").trim();
  const projectContext = String(form.projectContext || form.description || "").trim();
  const startDate = normalizeDate(form.startDate || form.recordDate);
  const endDate = normalizeDate(form.endDate || startDate);

  return {
    record_date: normalizeDate(form.recordDate || startDate),
    title: String(form.title || projectActions || "").trim(),
    description: String(form.description || projectContext || "").trim() || null,
    task: projectActions || null,
    result: projectResult || null,
    project_name: String(form.projectName || "").trim() || null,
    strength_tags: splitTags(form.strengthTags),
    skill_tags: splitTags(form.skillTags),
    work_type: "project",
    source: "project_action_drawer",
    raw_payload: {
      ...raw,
      date: normalizeDate(form.recordDate || startDate),
      startDate,
      endDate,
      projectName: String(form.projectName || "").trim(),
      projectActions,
      projectResult,
      projectInsight,
      projectGoal: String(form.projectGoal || "").trim(),
      projectContext,
      actionStatus: String(form.status || "planned").trim(),
      mode: "project-action",
      track: "project",
      recordType: "teamProject",
      ...(Object.keys(recommendedAction).length ? { recommendedAction } : {}),
    },
  };
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export default function CalendarProjectActionCreateDrawer({
  draft,
  isLoggedIn = false,
  onCreateRecord,
  onOpenLogin,
}) {
  const [form, setForm] = useState(() => buildForm(draft));
  const [saveStatus, setSaveStatus] = useState("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const isRecommendation = Boolean(draft?.recommendedAction || draft?.raw_payload?.recommendedAction || draft?.rawPayload?.recommendedAction);

  if (!draft) return null;

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!isLoggedIn) {
      setFeedbackMessage("로그인하면 이 Action을 저장할 수 있어요.");
      return;
    }
    if (typeof onCreateRecord !== "function") {
      setSaveStatus("error");
      setFeedbackMessage("저장 경로를 준비하지 못했습니다.");
      return;
    }

    setSaveStatus("saving");
    setFeedbackMessage("");
    try {
      await onCreateRecord(buildCreatePayload(draft, form));
      setSaveStatus("saved");
      setFeedbackMessage("프로젝트 Action으로 저장했어요.");
    } catch {
      setSaveStatus("error");
      setFeedbackMessage("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <div className="rounded-[24px] border border-violet-200 bg-white shadow-lg shadow-violet-100/60 ring-1 ring-violet-100">
      <div className="border-b border-violet-100 bg-violet-50/70 px-4 py-4">
        <p className="text-lg font-semibold text-slate-950">
          {isRecommendation ? "추천 행동을 Action으로 만들기" : "새 Action 만들기"}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-violet-700">
          기간과 결과를 적으면 프로젝트뷰에서 진행 상태를 볼 수 있어요.
        </p>
      </div>

      <form className="space-y-3 px-4 py-4" onSubmit={handleSave}>
        <Field label="프로젝트명">
          <input value={form.projectName} onChange={(event) => updateField("projectName", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </Field>
        <Field label="Action 제목">
          <input value={form.title} onChange={(event) => updateField("title", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </Field>
        <Field label="한 일">
          <textarea value={form.task} onChange={(event) => updateField("task", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="시작일">
            <input type="date" value={normalizeDate(form.startDate)} onChange={(event) => updateField("startDate", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="종료일">
            <input type="date" value={normalizeDate(form.endDate)} onChange={(event) => updateField("endDate", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
        </div>
        <Field label="상태">
          <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-slate-400">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
        <Field label="결과/산출물">
          <textarea value={form.projectResult} onChange={(event) => updateField("projectResult", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </Field>
        <Field label="다음 액션/학습">
          <textarea value={form.projectInsight} onChange={(event) => updateField("projectInsight", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </Field>
        <Field label="기간 정리 메모">
          <textarea value={form.projectContext} onChange={(event) => updateField("projectContext", event.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
        </Field>
        <Field label="강점 태그">
          <input value={form.strengthTags} onChange={(event) => updateField("strengthTags", event.target.value)} placeholder="문제해결, 협업" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400" />
        </Field>
        <Field label="역량 태그">
          <input value={form.skillTags} onChange={(event) => updateField("skillTags", event.target.value)} placeholder="운영개선, 데이터정리" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400" />
        </Field>

        {!isLoggedIn ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            로그인하면 이 Action을 저장할 수 있어요.
          </div>
        ) : null}

        {feedbackMessage ? (
          <p className={`text-xs ${saveStatus === "error" ? "text-red-600" : saveStatus === "saved" ? "text-emerald-700" : "text-amber-700"}`}>{feedbackMessage}</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {isLoggedIn ? (
            <Button type="submit" size="sm" className="h-8 rounded-full bg-slate-900 px-3 text-xs text-white hover:bg-slate-800" disabled={saveStatus === "saving" || saveStatus === "saved"}>
              {saveStatus === "saving" ? "저장 중" : saveStatus === "saved" ? "저장 완료" : "프로젝트 Action으로 저장하기"}
            </Button>
          ) : (
            <Button type="button" size="sm" className="h-8 rounded-full bg-slate-900 px-3 text-xs text-white hover:bg-slate-800" onClick={onOpenLogin || undefined}>
              로그인하고 Action 저장하기
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
