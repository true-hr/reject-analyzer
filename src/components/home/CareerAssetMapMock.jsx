import React from "react";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Mock Data (교체 가능 구조) ────────────────────────────────────────────────
// 실제 데이터로 교체 시: 이 객체를 props나 API 응답 구조로 교체하면 됩니다.
export const CAREER_ASSET_MAP_MOCK_DATA = {
  summaryCards: [
    {
      id: "flow",
      label: "현재 경험 흐름",
      value: "문제 발견 → 기준 정리 → 실행 조율",
      wrapperCls: "border-teal-200 bg-teal-50",
      labelCls: "text-teal-600",
      valueCls: "text-teal-800",
    },
    {
      id: "pattern",
      label: "가장 자주 보이는 패턴",
      value: "애매한 문제를 구조화하는 흐름",
      wrapperCls: "border-blue-200 bg-blue-50",
      labelCls: "text-blue-600",
      valueCls: "text-blue-800",
    },
    {
      id: "asset",
      label: "지금 쌓인 자산",
      value: "문제 구조화 · 기준화 · 협업 조율",
      wrapperCls: "border-violet-200 bg-violet-50",
      labelCls: "text-violet-600",
      valueCls: "text-violet-800",
    },
    {
      id: "direction",
      label: "활용 가능한 방향",
      value: "이력서 핵심 경험 · 면접 사례 · 직무 포지셔닝",
      wrapperCls: "border-orange-200 bg-orange-50",
      labelCls: "text-orange-600",
      valueCls: "text-orange-800",
    },
  ],
  columns: [
    {
      id: "traces",
      label: "업무 흔적",
      stepNum: "01",
      headerCls: "bg-teal-50 border-teal-200",
      headerTextCls: "text-teal-700",
      dotCls: "bg-teal-400",
      itemBorderCls: "border-teal-100",
      items: [
        "반복 문의를 정리했다",
        "기준이 달랐던 내용을 맞췄다",
        "우선순위를 다시 잡았다",
        "반영 범위를 조율했다",
      ],
    },
    {
      id: "patterns",
      label: "반복 패턴",
      stepNum: "02",
      headerCls: "bg-blue-50 border-blue-200",
      headerTextCls: "text-blue-700",
      dotCls: "bg-blue-400",
      itemBorderCls: "border-blue-100",
      items: [
        "흩어진 문제를 묶어낸다",
        "애매한 기준을 정리한다",
        "제한된 리소스에서 판단한다",
        "사람 사이의 간극을 줄인다",
      ],
    },
    {
      id: "assets",
      label: "쌓인 자산",
      stepNum: "03",
      headerCls: "bg-violet-50 border-violet-200",
      headerTextCls: "text-violet-700",
      dotCls: "bg-violet-400",
      itemBorderCls: "border-violet-100",
      items: [
        "문제 구조화 자산",
        "운영 기준화 자산",
        "우선순위 판단 자산",
        "협업 조율 자산",
      ],
    },
    {
      id: "directions",
      label: "활용 방향",
      stepNum: "04",
      headerCls: "bg-orange-50 border-orange-200",
      headerTextCls: "text-orange-700",
      dotCls: "bg-orange-400",
      itemBorderCls: "border-orange-100",
      items: [
        "이력서 핵심 경험으로 전환 가능",
        "운영/기획 직무 포지셔닝에 활용 가능",
        "면접에서 문제 해결 사례로 설명 가능",
        "경력 방향성을 정리하는 근거로 활용 가능",
      ],
    },
  ],
  insight:
    "최근 기록 기준으로, 당신의 경험은 문제를 구조화하고 기준을 만드는 방향으로 가장 선명하게 자산화되고 있습니다.",
};

const COL_COUNT = 4;
// 7-column grid: [content, arrow, content, arrow, content, arrow, content]
const CANVAS_GRID = "1fr 32px 1fr 32px 1fr 32px 1fr";

export default function CareerAssetMapMock({ onOpenRecordInput, onOpenResumeResult }) {
  const { summaryCards, columns, insight } = CAREER_ASSET_MAP_MOCK_DATA;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-sm">
      {/* ── 헤더 ─────────────────────────────────────────────────────── */}
      <div className="space-y-3 border-b border-slate-100 bg-slate-50/80 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-600 sm:px-2.5 sm:py-1 sm:text-[13px]">
            #커리어 자산
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 sm:px-2.5 sm:py-1 sm:text-[13px]">
            #패턴 분석
          </span>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <h2 className="text-[22px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[28px]">
              내 커리어 자산 맵
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
              기록된 업무에서 반복되는 패턴을 찾아, 지금 내게 쌓이고 있는 커리어 자산을 보여드립니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              size="sm"
              className="h-8 rounded-full bg-violet-600 px-4 text-sm text-white shadow-sm hover:bg-violet-700 sm:h-9 sm:px-5 sm:text-[15px]"
              onClick={onOpenRecordInput ?? undefined}
            >
              경험 기록하기
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-full border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm hover:bg-slate-50 sm:h-9 sm:px-4 sm:text-[15px]"
              onClick={onOpenResumeResult ?? undefined}
            >
              이력서 보기
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {/* ── 요약 카드 4개 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.id}
              className={`rounded-2xl border px-3 py-3 sm:px-4 ${card.wrapperCls}`}
            >
              <div
                className={`text-[10px] font-semibold uppercase tracking-[0.07em] sm:text-[11px] ${card.labelCls}`}
              >
                {card.label}
              </div>
              <div className={`mt-1.5 text-xs font-semibold leading-snug sm:text-sm ${card.valueCls}`}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── 분석 캔버스 ───────────────────────────────────────────── */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4">
          {/* 모바일: 세로 스택 + 아래 방향 화살표 */}
          <div className="space-y-4 md:hidden">
            {columns.map((col, i) => (
              <div key={col.id}>
                <div className={`rounded-xl border px-3 py-2 ${col.headerCls}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold opacity-50 ${col.headerTextCls}`}>
                      {col.stepNum}
                    </span>
                    <span className={`text-sm font-semibold ${col.headerTextCls}`}>{col.label}</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  {col.items.map((item) => (
                    <div key={item} className={`rounded-lg border bg-white px-3 py-2 ${col.itemBorderCls}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${col.dotCls}`} />
                        <p className="text-xs leading-relaxed text-slate-700">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {i < COL_COUNT - 1 && (
                  <div className="mt-3 flex justify-center">
                    <ArrowDown className="h-4 w-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 데스크탑: 4열 캔버스 + 행별 연결 화살표 */}
          <div className="hidden md:block">
            {/* 열 헤더 행 */}
            <div
              className="mb-3"
              style={{ display: "grid", gridTemplateColumns: CANVAS_GRID, alignItems: "center" }}
            >
              {columns.map((col, i) => (
                <React.Fragment key={col.id}>
                  <div className={`rounded-xl border px-3 py-2.5 ${col.headerCls}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold opacity-50 ${col.headerTextCls}`}>
                        {col.stepNum}
                      </span>
                      <span className={`text-sm font-semibold ${col.headerTextCls}`}>{col.label}</span>
                    </div>
                  </div>
                  {i < COL_COUNT - 1 && (
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-slate-400" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* 아이템 행 (행별 연결 화살표 포함) */}
            {Array.from({ length: 4 }, (_, rowIdx) => (
              <div
                key={rowIdx}
                className="mb-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: CANVAS_GRID,
                  alignItems: "stretch",
                }}
              >
                {columns.map((col, colIdx) => (
                  <React.Fragment key={col.id}>
                    <div className={`rounded-lg border bg-white px-3 py-2.5 ${col.itemBorderCls}`}>
                      <div className="flex items-start gap-2">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${col.dotCls}`} />
                        <p className="text-xs leading-relaxed text-slate-700">{col.items[rowIdx]}</p>
                      </div>
                    </div>
                    {colIdx < COL_COUNT - 1 && (
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── 핵심 인사이트 바 ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-500 sm:h-5 sm:w-5" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-violet-600 sm:text-xs">
                  핵심 인사이트
                </div>
                <p className="mt-1 text-xs leading-relaxed text-violet-900 sm:text-sm">{insight}</p>
              </div>
            </div>
            <Button
              size="sm"
              className="h-8 shrink-0 rounded-full bg-violet-600 px-4 text-xs text-white shadow-sm hover:bg-violet-700 sm:h-9 sm:text-sm"
              onClick={onOpenRecordInput ?? undefined}
            >
              경험 기록하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
