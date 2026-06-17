import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getDateRecordStatus, getDateStatusClassName, getDateStatusLabel } from "./calendarRecordStatus.js";

function formatDateLabel(date) {
  const [year, month, day] = String(date || "").split("-");
  if (!year || !month || !day) return date || "선택한 날짜";
  return `${Number(month)}월 ${Number(day)}일`;
}

function recordTitle(record) {
  return String(record?.title || record?.summary || "경험 기록").trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function joinTags(value) {
  return Array.isArray(value) ? value.map((tag) => String(tag || "").trim()).filter(Boolean).join(", ") : "";
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildEditForm(record, selectedDate) {
  const raw = record?.rawPayload || record?.raw_payload || {};
  return {
    recordDate: firstNonEmpty(record?.record_date, record?.date, record?.startDate, raw.recordDate, raw.date, selectedDate),
    title: firstNonEmpty(record?.title, raw.title),
    description: firstNonEmpty(record?.description, record?.summary, raw.description, raw.summary, raw.text),
    task: firstNonEmpty(record?.task, raw.task, raw.projectActions),
    result: firstNonEmpty(record?.result, record?.reflectedSentence, raw.result, raw.projectResult),
    projectName: firstNonEmpty(record?.project_name, record?.projectName, raw.projectName),
    strengthTags: joinTags(record?.strength_tags || record?.strengthTags || raw.strengthTags || raw.roleTags),
    skillTags: joinTags(record?.skill_tags || record?.skillTags || raw.skillTags || raw.collaborationTags),
  };
}

function buildPatch(form) {
  return {
    record_date: String(form.recordDate || "").trim(),
    title: String(form.title || "").trim(),
    description: String(form.description || "").trim() || null,
    task: String(form.task || "").trim() || null,
    result: String(form.result || "").trim() || null,
    project_name: String(form.projectName || "").trim() || null,
    strength_tags: splitTags(form.strengthTags),
    skill_tags: splitTags(form.skillTags),
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

export default function CalendarDateDrawer({
  selectedDate,
  records = [],
  cardsByRecordId = {},
  createDraft = null,
  onCreateRecord,
  onOpenResumeResult,
  onUpdateRecord,
  onDeleteRecord,
}) {
  const status = getDateRecordStatus(records, cardsByRecordId);
  const isEmpty = records.length === 0;
  const selectedDateLabel = formatDateLabel(selectedDate);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [createMode, setCreateMode] = useState(Boolean(createDraft));
  const [editForm, setEditForm] = useState(() => buildEditForm(createDraft?.record || null, createDraft?.date || selectedDate));
  const [saveStatus, setSaveStatus] = useState("idle");
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const editingRecord = records.find((record) => String(record?.id || "") === String(editingRecordId || "")) || null;

  function startEdit(record) {
    setEditingRecordId(record?.id || null);
    setCreateMode(false);
    setEditForm(buildEditForm(record, selectedDate));
    setSaveStatus("idle");
    setDeleteStatus("idle");
    setFeedbackMessage("");
  }

  function startCreate(record = null) {
    setEditingRecordId(null);
    setCreateMode(true);
    setEditForm(buildEditForm(record, selectedDate));
    setSaveStatus("idle");
    setDeleteStatus("idle");
    setFeedbackMessage("");
  }

  function updateField(key, value) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSave(event) {
    event.preventDefault();
    const patch = buildPatch(editForm);
    if (!patch.record_date || !patch.title) {
      setSaveStatus("error");
      setFeedbackMessage("날짜와 제목을 입력해 주세요.");
      return;
    }
    if (createMode) {
      if (typeof onCreateRecord !== "function") return;
      setSaveStatus("saving");
      setFeedbackMessage("");
      try {
        await onCreateRecord(patch);
        setSaveStatus("saved");
        setCreateMode(false);
        setFeedbackMessage("새 기록을 저장했어요.");
      } catch {
        setSaveStatus("error");
        setFeedbackMessage("새 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
      return;
    }
    if (!editingRecord || typeof onUpdateRecord !== "function") return;
    setSaveStatus("saving");
    setFeedbackMessage("");
    try {
      await onUpdateRecord(editingRecord, patch);
      setSaveStatus("saved");
      setFeedbackMessage("수정한 내용을 저장했어요.");
    } catch {
      setSaveStatus("error");
      setFeedbackMessage("수정 내용을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleDelete(record) {
    if (!record || typeof onDeleteRecord !== "function") return;
    setDeleteStatus("deleting");
    setFeedbackMessage("");
    try {
      const deleted = await onDeleteRecord(record);
      if (deleted === false) {
        setDeleteStatus("idle");
        return;
      }
      setDeleteStatus("deleted");
      setEditingRecordId(null);
      setCreateMode(false);
      setFeedbackMessage("기록을 삭제했어요.");
    } catch {
      setDeleteStatus("error");
      setFeedbackMessage("기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  if (editingRecord || createMode) {
    const isCreateMode = createMode && !editingRecord;
    return (
      <div className="rounded-[24px] border border-violet-200 bg-white shadow-lg shadow-violet-100/60 ring-1 ring-violet-100">
        <div className="border-b border-violet-100 bg-violet-50/70 px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-slate-950">{formatDateLabel(editForm.recordDate || selectedDate)} 경험 기록</p>
              <p className="mt-1 text-xs leading-relaxed text-violet-700">{isCreateMode ? "선택한 날짜에 새 경험 기록을 남깁니다." : "선택한 날짜의 기록을 수정하거나 보완할 수 있어요."}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateLabel(editForm.recordDate || selectedDate)}</p>
            </div>
            <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-900" onClick={() => {
              setEditingRecordId(null);
              setCreateMode(false);
            }}>
              목록으로
            </button>
          </div>
        </div>
        <form className="space-y-3 px-4 py-4" onSubmit={handleSave}>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
            <p className="text-sm font-semibold text-amber-900">{isCreateMode ? "새 기록으로 저장합니다. 기존 기록은 바뀌지 않아요." : "기존 기록을 직접 수정합니다. 원래 내용은 저장 후 바뀌어요."}</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">{isCreateMode ? "제목과 날짜를 확인한 뒤 필요한 설명, 결과, 태그를 보완해 주세요." : "원본을 보존하고 싶다면 “이 기록 보완하기”를 사용하세요."}</p>
          </div>

          <Field label="날짜">
            <input type="date" value={editForm.recordDate} onChange={(event) => updateField("recordDate", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="제목">
            <input value={editForm.title} onChange={(event) => updateField("title", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="업무 내용 / 설명">
            <textarea value={editForm.description} onChange={(event) => updateField("description", event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="한 일">
            <textarea value={editForm.task} onChange={(event) => updateField("task", event.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="결과">
            <textarea value={editForm.result} onChange={(event) => updateField("result", event.target.value)} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="프로젝트명">
            <input value={editForm.projectName} onChange={(event) => updateField("projectName", event.target.value)} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none focus:border-slate-400" />
          </Field>
          <Field label="강점 태그">
            <input value={editForm.strengthTags} onChange={(event) => updateField("strengthTags", event.target.value)} placeholder="문제해결, 협업, 문서화" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400" />
          </Field>
          <Field label="역량 태그">
            <input value={editForm.skillTags} onChange={(event) => updateField("skillTags", event.target.value)} placeholder="운영개선, 데이터정리" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400" />
          </Field>

          {feedbackMessage ? (
            <p className={`text-xs ${saveStatus === "error" || deleteStatus === "error" ? "text-red-600" : "text-emerald-700"}`}>{feedbackMessage}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" className="h-8 rounded-full bg-slate-900 px-3 text-xs text-white hover:bg-slate-800" disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? "저장하는 중" : isCreateMode ? "새 기록 저장하기" : "이 기록 수정 저장하기"}
            </Button>
            {!isCreateMode && onCreateRecord ? (
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs" onClick={() => startCreate(editingRecord)}>
                이 기록 보완하기
              </Button>
            ) : null}
            {!isCreateMode ? (
              <Button type="button" variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs text-red-600 hover:text-red-700" onClick={() => handleDelete(editingRecord)} disabled={deleteStatus === "deleting"}>
                {deleteStatus === "deleting" ? "삭제하는 중" : "기록 삭제하기"}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-violet-200 bg-white shadow-lg shadow-violet-100/60 ring-1 ring-violet-100">
      <div className="border-b border-violet-100 bg-violet-50/70 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-slate-950">{selectedDateLabel} 경험 기록</p>
            <p className="mt-1 text-xs leading-relaxed text-violet-700">선택한 날짜의 기록을 확인하고 보완할 수 있어요.</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${getDateStatusClassName(status)}`}>
            {getDateStatusLabel(status)}
          </span>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/70 px-4 py-5">
            <p className="text-base font-semibold text-slate-950">아직 이 날짜에는 기록이 없어요.</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">오늘 한 일, 배운 점, 결과를 짧게 남겨도 괜찮아요.</p>
            {onCreateRecord ? (
              <Button size="sm" className="mt-4 h-10 w-full rounded-full bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm shadow-violet-200 hover:bg-violet-700" onClick={() => startCreate(null)}>
                이 날짜에 경험 남기기
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-600">
              {records.length === 1
                ? "이 기록을 면접 답변으로 발전시켜볼까요?"
                : "이 날짜의 기록 중 이어갈 경험을 골라보세요."}
            </p>
            <p className="text-xs leading-relaxed text-slate-500">직접 수정하면 기존 기록이 바뀌고, 보완하기는 새 기록을 추가해요.</p>
            {feedbackMessage ? (
              <p className={`rounded-lg px-3 py-2 text-xs ${deleteStatus === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{feedbackMessage}</p>
            ) : null}
            <div className="space-y-2">
              {records.map((record) => {
                const cards = cardsByRecordId?.[String(record?.id || "")] || [];
                const recordStatus = getDateRecordStatus([record], { [String(record?.id || "")]: cards });
                return (
                  <div key={record?.id || recordTitle(record)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{recordTitle(record)}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                          {record?.summary || record?.description || record?.reflectedSentence || "성과 수치나 결과를 한 줄 더 붙이면 더 좋아요."}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getDateStatusClassName(recordStatus)}`}>
                        {getDateStatusLabel(recordStatus)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {onUpdateRecord ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs" onClick={() => startEdit(record)}>
                          이 기록 수정하기
                        </Button>
                      ) : null}
                      {onCreateRecord ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs" onClick={() => startCreate(record)}>
                          이 기록 보완하기
                        </Button>
                      ) : null}
                      {onOpenResumeResult ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs" onClick={onOpenResumeResult}>
                          이력서 후보 보기
                        </Button>
                      ) : null}
                      {onDeleteRecord ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs text-red-600 hover:text-red-700" onClick={() => handleDelete(record)} disabled={deleteStatus === "deleting"}>
                          기록 삭제하기
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
