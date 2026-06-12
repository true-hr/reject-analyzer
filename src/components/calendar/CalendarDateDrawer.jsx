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

export default function CalendarDateDrawer({
  selectedDate,
  records = [],
  cardsByRecordId = {},
  onOpenRecordInput,
  onOpenResumeResult,
}) {
  const status = getDateRecordStatus(records, cardsByRecordId);
  const isEmpty = records.length === 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-none">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatDateLabel(selectedDate)}</p>
            <p className="mt-1 text-xs text-slate-500">날짜를 누르면 이곳에서 기록을 바로 이어갈 수 있어요.</p>
          </div>
          <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold ${getDateStatusClassName(status)}`}>
            {getDateStatusLabel(status)}
          </span>
        </div>
      </div>
      <div className="space-y-3 px-4 py-4">
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4">
            <p className="text-sm font-semibold text-slate-900">이 날짜에 아직 기록이 없어요</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              오늘 한 일 한 줄만 남겨도 커리어 자산으로 쌓여요.
            </p>
            {onOpenRecordInput ? (
              <Button size="sm" className="mt-3 h-8 rounded-full bg-violet-600 px-3 text-xs text-white hover:bg-violet-700" onClick={() => onOpenRecordInput({ date: selectedDate })}>
                이 날짜에 경험 남기기
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-600">
              {records.length === 1
                ? "이 기록을 면접 답변으로 발전시켜볼까요?"
                : "이 날짜의 기록 중 보완할 경험을 골라보세요."}
            </p>
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
                      {onOpenRecordInput ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs" onClick={() => onOpenRecordInput({ date: selectedDate, recordId: record?.id })}>
                          이 기록 보완하기
                        </Button>
                      ) : null}
                      {onOpenResumeResult ? (
                        <Button variant="outline" size="sm" className="h-8 rounded-full bg-white text-xs" onClick={onOpenResumeResult}>
                          이력서 후보 보기
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
