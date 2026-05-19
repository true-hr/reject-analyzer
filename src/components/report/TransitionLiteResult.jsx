import { Download, Home } from "lucide-react";
import { useState } from "react";
import { useCareerFitAiEvidence } from "@/hooks/useCareerFitAiEvidence";
import { useNewgradJobIndustryBridge } from "@/hooks/useNewgradJobIndustryBridge";
import { buildNewgradWhatIfSimulation } from "@/lib/analysis/whatIf/buildNewgradWhatIfSimulation";
import { computeNewgradPreparationWhatIfPreview } from "@/lib/analysis/whatIf/buildNewgradPreparationWhatIfPreviewPack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResumeRecommendationSheet from "@/components/report/ResumeRecommendationSheet";

function isUsableTransitionReadLine(value) {
  const text = String(value || "").trim();
  return Boolean(text) && !/<[^>]+>/.test(text);
}

function ListBlock({ items = [], compact = false, tone = "default" }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;

  const itemClassName = compact
    ? tone === "job"
      ? "flex gap-3.5 rounded-[18px] border border-indigo-200/70 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:gap-3 sm:px-3.5 sm:py-3"
      : tone === "industry"
        ? "flex gap-3.5 rounded-[18px] border border-sky-200/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:gap-3 sm:px-3.5 sm:py-3"
        : "flex gap-3.5 rounded-[16px] border border-slate-200 bg-slate-50/50 px-4 py-3 sm:gap-3 sm:px-3.5 sm:py-2.5"
    : "flex items-start gap-3.5 rounded-[18px] border border-slate-200 bg-slate-50/70 px-4.5 py-3.5 sm:gap-3 sm:px-4 sm:py-3";
  const dotClassName = compact
    ? tone === "job"
      ? "mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400"
      : tone === "industry"
        ? "mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400"
        : "mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"
    : "mt-1 h-2 w-2 shrink-0 rounded-full bg-primary";

  return (
    <ul className={compact ? "space-y-2.5 text-[13px] leading-[1.75] text-slate-500 sm:space-y-2 sm:leading-6" : "space-y-3.5 text-sm leading-[1.75] text-slate-700 sm:space-y-3 sm:leading-6"}>
      {safeItems.map((item, index) => (
        <li
          key={`${index}_${String(item).slice(0, 24)}`}
          className={itemClassName}
        >
          <span className={dotClassName} />
          <span className={compact && tone !== "default" ? "text-slate-700" : ""}>{String(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function takeLeadingSentences(value, limit = 4) {
  const text = String(value || "").trim();
  if (!text) return "";

  const matches = text.match(/[^.!?]+(?:[.!?]+|$)/g);
  const sentences = Array.isArray(matches)
    ? matches.map((item) => item.trim()).filter(Boolean)
    : [text];

  return sentences.slice(0, limit).join(" ").trim();
}

function flattenGoalTableTexts(value) {
  if (value == null) return [];
  if (typeof value === "string") {
    const text = value.trim();
    return text ? [text] : [];
  }
  if (typeof value === "number" && Number.isFinite(value)) return [String(value)];
  if (Array.isArray(value)) return value.flatMap((item) => flattenGoalTableTexts(item));
  if (typeof value !== "object") return [];

  const candidateKeys = [
    "text",
    "label",
    "title",
    "body",
    "summary",
    "value",
    "content",
    "itemLabel",
    "evidence",
    "jobLinkage",
    "industryLinkage",
    "linkage",
  ];

  return candidateKeys.flatMap((key) => flattenGoalTableTexts(value?.[key]));
}

function toGoalTableText(value) {
  const texts = [...new Set(flattenGoalTableTexts(value).map((item) => String(item || "").trim()).filter(Boolean))];
  return texts.join(", ").trim();
}

function isMissingGoalTableText(value) {
  const text = toGoalTableText(value);
  if (!text) return true;
  return text === "아직 입력한 내용 없음"
    || text === "입력한 내용 없음"
    || text === "내용 없음";
}

const NEWGRAD_GOAL_TABLE_V2 = "newgrad_goal_table_v2";

function normalizeNewgradGoalComparisonTable(table) {
  if (!table || typeof table !== "object") return null;

  const version = toGoalTableText(table?.version);
  const rawRows = Array.isArray(table?.rows) ? table.rows : [];
  const rows = rawRows
    .map((row, index) => {
      const itemLabel = toGoalTableText(row?.itemLabel || row?.label);
      const evidence = toGoalTableText(row?.evidence);
      const jobLinkage = toGoalTableText(row?.jobLinkage);
      const industryLinkage = toGoalTableText(row?.industryLinkage);
      const linkage = toGoalTableText(row?.linkage);
      if (isMissingGoalTableText(evidence)) return null;

      return {
        rowKey: String(row?.rowKey || `row_${index + 1}`).trim() || `row_${index + 1}`,
        itemLabel,
        label: itemLabel,
        evidence,
        jobLinkage,
        industryLinkage,
        linkage,
      };
    })
    .filter(Boolean);

  const normalized = {
    version,
    title: toGoalTableText(table?.title) || "입력한 내용으로 보는 직무·산업 연결",
    description: toGoalTableText(table?.description) || "입력한 내용 중 목표 직무와 산업에 연결해 볼 수 있는 항목만 정리했어요.",
    metaNote: toGoalTableText(table?.metaNote),
    emptyStateText: toGoalTableText(table?.emptyStateText) || "입력한 내용이 아직 적어서 연결해서 볼 항목이 많지 않아요.",
    meta: {
      targetJobLabel: toGoalTableText(table?.meta?.targetJobLabel),
      targetIndustryLabel: toGoalTableText(table?.meta?.targetIndustryLabel),
    },
    columns: {
      item: toGoalTableText(table?.columns?.item) || "입력 항목",
      evidence: toGoalTableText(table?.columns?.evidence) || "내가 입력한 내용",
      jobLinkage: toGoalTableText(table?.columns?.jobLinkage) || "직무 쪽 해석",
      industryLinkage: toGoalTableText(table?.columns?.industryLinkage) || "산업 쪽 해석",
    },
    rows,
  };

  try {
    if (typeof globalThis !== "undefined") {
      globalThis.__NEWGRAD_GOAL_TABLE_RENDER__ = {
        at: Date.now(),
        raw: {
          title: table?.title,
          description: table?.description,
          columns: table?.columns,
          rowCount: rawRows.length,
          rows: rawRows.slice(0, 10).map((row) => ({
            itemLabel: row?.itemLabel,
            label: row?.label,
            evidence: row?.evidence,
            jobLinkage: row?.jobLinkage,
            industryLinkage: row?.industryLinkage,
            linkage: row?.linkage,
          })),
        },
        normalized: {
          title: normalized.title,
          description: normalized.description,
          columns: normalized.columns,
          rowCount: normalized.rows.length,
          rows: normalized.rows.slice(0, 10),
        },
      };
    }
  } catch {}

  return normalized;
}

function getNewgradScoreBadgeClass(band) {
  if (band === "very_low" || band === "low") return "bg-rose-100 text-rose-800 ring-1 ring-inset ring-rose-300";
  if (band === "mid") return "bg-slate-200/80 text-slate-700 ring-1 ring-inset ring-slate-300";
  return "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-300";
}

function getComparisonConfidenceLabel(confidence) {
  if (confidence === "high") return "\uADFC\uAC70 \uB192\uC74C";
  if (confidence === "low") return "\uADFC\uAC70 \uC81C\uD55C";
  return "\uADFC\uAC70 \uBCF4\uD1B5";
}

function getNonScoreVerdictLabel(row) {
  const band = String(row?.band || "").trim();
  if (band === "very_low") return "\uB9E4\uC6B0 \uB0AE\uC74C";
  if (band === "low") return "아직 약함";
  if (band === "mid") return "\uBCF4\uD1B5";
  if (band === "mid_high" || band === "high") return "\uB192\uC74C";

  const currentValue = String(row?.currentValue || "").trim();
  if (/^\uB9E4\uC6B0 \uB0AE\uC74C$|^\uB0AE\uC74C$|^\uC57D\uD568$|^\uBBF8\uC57D$|^\uC81C\uD55C\uC801$/.test(currentValue)) return "아직 약함";
  if (/^\uBCF4\uD1B5$|^\uBCF4\uC870\uC801$|^\uBCF4\uC870 \uD655\uC778$|^\uB2E8\uC77C \uADFC\uAC70$/.test(currentValue)) return "\uBCF4\uD1B5";
  if (/^\uB192\uC74C$|^\uCDA9\uBD84$|^\uD655\uC778\uB428$|^\uBC18\uBCF5 \uD655\uC778$|^\uC5F0\uACB0 \uD3EC\uC778\uD2B8 \uC788\uC74C$|^\uCC38\uACE0 \uAC00\uB2A5$/.test(currentValue)) return "\uB192\uC74C";

  const confidence = String(row?.confidence || "").trim();
  if (confidence === "low") return "아직 약함";
  if (confidence === "high") return "\uB192\uC74C";
  return "\uBCF4\uD1B5";
}

function VerdictSlot({ row }) {
  if (Number.isFinite(row?.score)) return <FitBar score={row.score} band={row.band} />;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[13px] font-medium text-slate-400">{"\uD310\uC815 \uC218\uC900"}</span>
      <span className="text-[13px] text-slate-400">{getNonScoreVerdictLabel(row)}</span>
    </div>
  );
}

function buildDetailedReadLabels(items = [], fallbackText = "", emptyFallback = "") {
  const labels = Array.isArray(items) ? items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
  if (labels.length > 0) return labels;
  const fallback = String(fallbackText || "").trim();
  if (fallback) return [fallback];
  return emptyFallback ? [emptyFallback] : [];
}

function buildRowActionText(row) {
  const explicit = String(row?.actionHint || "").trim();
  if (explicit) return explicit;
  const limitText = String(row?.limitText || "").trim();
  if (limitText) return limitText;
  return "\uC0AC\uB840\uB97C \uB354 \uAD6C\uCCB4\uC801\uC73C\uB85C \uBCF4\uAC15\uD558\uBA74 \uD310\uB2E8 \uADFC\uAC70\uAC00 \uB354 \uC120\uBA85\uD574\uC9D1\uB2C8\uB2E4.";
}

function getVisibleComparisonRows(block) {
  return Array.isArray(block?.rows)
    ? block.rows.filter((row) => row && row.visible !== false && row.displayMode !== "hidden")
    : [];
}

function NewgradComparisonBlock({ block }) {
  const rows = getVisibleComparisonRows(block);
  if (rows.length === 0) return null;

  return (
    <div className="space-y-2.5 rounded-md border border-slate-200/80 bg-white/85 px-2.5 py-2.5">
      <p className="text-[13px] font-medium text-slate-500">{block?.title || "\uC138\uBD80 \uD310\uB3C5"}</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.rowKey} className="rounded-md border border-slate-100 bg-slate-50/70 px-2.5 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-medium leading-[1.55] text-slate-700">{row.label}</p>
                {row.displayMode !== "text_only" && row.currentValue ? (
                  <p className="mt-0.5 text-[12px] leading-[1.55] text-slate-500">{String(row.currentValue)}</p>
                ) : null}
              </div>
              {row.displayMode === "label_with_score" && Number.isFinite(row.score) ? (
                <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${getNewgradScoreBadgeClass(row.band)}`}>
                  {row.score}/5
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-[13px] leading-[1.65] text-slate-600">{row.summaryText}</p>
            {row.cautionText ? (
              <p className="mt-1 text-[11px] leading-[1.55] text-slate-500">{row.cautionText}</p>
            ) : null}
          </div>
        ))}
      </div>
      {block?.cautionText ? (
        <p className="text-[11px] leading-[1.55] text-slate-500">{block.cautionText}</p>
      ) : null}
    </div>
  );
}

function NewgradGoalComparisonSection({ table }) {
  const normalizedTable = normalizeNewgradGoalComparisonTable(table);
  const rows = Array.isArray(normalizedTable?.rows) ? normalizedTable.rows.filter(Boolean) : [];
  const emptyStateText = String(normalizedTable?.emptyStateText || "").trim();
  if (rows.length === 0 && !emptyStateText) return null;
  const isV2 = normalizedTable?.version === NEWGRAD_GOAL_TABLE_V2;

  const title = String(normalizedTable?.title || "입력한 내용으로 보는 직무·산업 연결").trim();
  const description = String(
    normalizedTable?.description || "입력한 내용 중 목표 직무와 산업에 연결해 볼 수 있는 항목만 정리했어요."
  ).trim();
  const metaNote = String(normalizedTable?.metaNote || "").trim();
  const targetJobLabel = String(normalizedTable?.meta?.targetJobLabel || "").trim();
  const targetIndustryLabel = String(normalizedTable?.meta?.targetIndustryLabel || "").trim();
  const itemColumnLabel = String(normalizedTable?.columns?.item || "입력 항목").trim();
  const evidenceColumnLabel = String(normalizedTable?.columns?.evidence || "내가 입력한 내용").trim();
  const jobLinkageColumnLabel = String(normalizedTable?.columns?.jobLinkage || "직무 쪽 해석").trim();
  const industryLinkageColumnLabel = String(normalizedTable?.columns?.industryLinkage || "산업 쪽 해석").trim();
  const mobileItemLabel = itemColumnLabel;
  const mobileEvidenceLabel = evidenceColumnLabel;
  const mobileJobLinkageLabel = jobLinkageColumnLabel;
  const mobileIndustryLinkageLabel = industryLinkageColumnLabel;
  const getItemLabel = (row) => String(row?.itemLabel || row?.label || "").trim();
  const getJobLinkageText = (row) => String(row?.jobLinkage || "").trim();
  const getIndustryLinkageText = (row) => String(row?.industryLinkage || "").trim();

  return (
    <section className="mb-5 sm:mb-6">
      <div className="rounded-[20px] border border-slate-200 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5 sm:py-4" data-print-card="true">
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="text-[18px] font-semibold tracking-tight text-slate-950 sm:text-[19px]">{title}</h3>
            <p className="mt-1 text-[13px] leading-[1.65] text-slate-500">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-2 sm:gap-2">
            <div className="rounded-full border border-slate-200/50 bg-slate-50/30 px-3 py-1.5 sm:rounded-[16px] sm:border-slate-200 sm:bg-slate-50/80 sm:px-3 sm:py-3">
              <span className="text-[10.5px] font-medium text-slate-400 sm:text-[11.5px]">{"희망 직무"}</span>
              <span className="ml-1.5 text-[12.5px] font-semibold text-slate-900 sm:mt-1 sm:ml-0 sm:block sm:text-[13px]">{targetJobLabel || "-"}</span>
            </div>
            <div className="rounded-full border border-slate-200/50 bg-slate-50/30 px-3 py-1.5 sm:rounded-[16px] sm:border-slate-200 sm:bg-slate-50/80 sm:px-3 sm:py-3">
              <span className="text-[10.5px] font-medium text-slate-400 sm:text-[11.5px]">{"희망 산업"}</span>
              <span className="ml-1.5 text-[12.5px] font-semibold text-slate-900 sm:mt-1 sm:ml-0 sm:block sm:text-[13px]">{targetIndustryLabel || "-"}</span>
            </div>
          </div>
          {metaNote ? <p className="text-[12px] leading-[1.6] text-slate-500">{metaNote}</p> : null}
        </div>

        {rows.length > 0 ? (
          <>
            <div className="mt-4 hidden overflow-hidden rounded-[18px] border border-slate-200 sm:block">
              <div className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-slate-50/80">
                <div className="border-b border-r border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-500">{itemColumnLabel}</div>
                <div className="border-b border-r border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-500">{evidenceColumnLabel}</div>
                <div className="border-b border-r border-slate-200 bg-indigo-50/45 px-3 py-2 text-[12px] font-semibold text-indigo-700">{jobLinkageColumnLabel}</div>
                <div className="border-b border-slate-200 bg-sky-50/55 px-3 py-2 text-[12px] font-semibold text-sky-700">{industryLinkageColumnLabel}</div>
              </div>
              {rows.map((row, index) => (
                <div key={row.rowKey || index} className="grid grid-cols-[120px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] bg-white">
                  <div className="border-r border-slate-200 px-3 py-3 text-[13px] font-semibold text-slate-900">{getItemLabel(row)}</div>
                  <div className="border-r border-slate-200 px-3 py-3 text-[13px] leading-[1.65] text-slate-700">{String(row?.evidence || "")}</div>
                  <div className="border-r border-slate-200 bg-indigo-50/20 px-3 py-3 text-[13px] leading-[1.65] text-slate-700">
                    {getJobLinkageText(row) || "-"}
                  </div>
                  <div className="bg-sky-50/25 px-3 py-3 text-[13px] leading-[1.65] text-slate-700">
                    {getIndustryLinkageText(row) || "-"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 sm:hidden">
              {rows.map((row, index) => (
                <div key={row.rowKey || index} className="rounded-[14px] border border-slate-200 bg-white/85 px-3 py-2.5">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="text-[10.5px] font-semibold text-slate-400">{getItemLabel(row)}</span>
                    <span className="text-[12.5px] font-semibold text-slate-900">{String(row?.evidence || "")}</span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    <div className="rounded-[10px] bg-indigo-50/45 px-2.5 py-1.5">
                      <span className="text-[10.5px] font-semibold text-indigo-700">{mobileJobLinkageLabel}</span>
                      <p className="mt-0.5 text-[12px] leading-[1.45] text-slate-700">{getJobLinkageText(row) || "-"}</p>
                    </div>
                    <div className="rounded-[10px] bg-sky-50/45 px-2.5 py-1.5">
                      <span className="text-[10.5px] font-semibold text-sky-700">{mobileIndustryLinkageLabel}</span>
                      <p className="mt-0.5 text-[12px] leading-[1.45] text-slate-700">{getIndustryLinkageText(row) || "-"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-[13px] leading-[1.65] text-slate-600">
            {emptyStateText}
          </div>
        )}
      </div>
    </section>
  );
}

function getRadarAxisShortLabel(label) {
  const text = String(label || "").trim();
  if (!text) return "";

  const labelMap = {
    "\uC9C1\uBB34 \uAD6C\uC870 \uC5F0\uACB0\uC131": "\uC9C1\uBB34 \uAD6C\uC870",
    "\uC0B0\uC5C5 \uB9E5\uB77D \uC5F0\uACB0\uC131": "\uC0B0\uC5C5 \uB9E5\uB77D",
    "\uC5ED\uD560 \uBC94\uC704 \uC5F0\uACB0\uC131": "\uC5ED\uD560 \uBC94\uC704",
    "\uACE0\uAC1D \uC720\uD615 \uC5F0\uACB0\uC131": "\uACE0\uAC1D \uC720\uD615",
    "\uC9C1\uBB34 \uC131\uACA9 \uC5F0\uACB0\uC131": "\uC9C1\uBB34 \uC131\uACA9",
    "전공과 직무의 연결성 (Job Fit)": "직무 연결",
    "전공과 직무의 연결성": "직무 연결",
    "산업 연관성": "산업 연관성",
    "산업 분야 이해도": "산업 이해도",
    "유사한 경험이 있는가?": "경험 연결",
    "이력·스펙·경험 연결성": "경험 연결",
    "고객 커뮤니케이션 적합성": "소통 적합성",
    "이해관계자 소통 적합성": "소통 적합성",
    "강점과 재능": "강점과 재능",
  };

  if (labelMap[text]) return labelMap[text];
  return text.replace(/\s*\uC5F0\uACB0\uC131$/, "").trim() || text;
}

function TraitSection({ title, items = [], tone = "default" }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean).slice(0, 2) : [];
  if (safeItems.length === 0) return null;

  return (
    <div className="space-y-3.5 sm:space-y-3">
      <div className="flex items-center gap-2">
        <span className={tone === "industry" ? "h-4 w-1 rounded-full bg-sky-400/80" : "h-4 w-1 rounded-full bg-slate-300"} />
        <div className="text-[13px] font-semibold leading-5 tracking-tight text-slate-800">{title}</div>
      </div>
      <ListBlock items={safeItems} compact tone={tone} />
    </div>
  );
}

function RiskList({ items = [], activeExplanationRowKey = null, onSelectExplanationRow = null, onExplanationRowMount = null, buyingMotionPanel = null, decisionStructurePanel = null, customerStructurePanel = null, operatingContextPanel = null, jobRoleSummaryPanel = null, jobKeyOutputsPanel = null, jobScopePanel = null, jobDecisionCriteriaPanel = null }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-3">
      {safeItems.map((item, index) => (
        <div
          key={`${index}_${String(item?.title || "").slice(0, 24)}`}
          className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3.5 shadow-none sm:rounded-[20px] sm:px-5 sm:py-4 sm:shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
        >
          <div className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200/80">
            {"\uB9AC\uC2A4\uD06C \uC2E0\uD638"}
          </div>
          <div className="mt-3.5 text-[14px] font-semibold leading-6 text-slate-900 sm:mt-3 sm:text-[15px]">{String(item?.title || "")}</div>
          <p className="mt-2.5 text-sm leading-[1.75] text-slate-700 sm:mt-2 sm:leading-6">{String(item?.body || "")}</p>
          {item?.comparisonTable && typeof item.comparisonTable === "object" ? (
            <RiskComparisonTable
              table={item.comparisonTable}
              activeExplanationRowKey={activeExplanationRowKey}
              onSelectExplanationRow={onSelectExplanationRow}
              onExplanationRowMount={onExplanationRowMount}
              buyingMotionPanel={buyingMotionPanel}
              decisionStructurePanel={decisionStructurePanel}
              customerStructurePanel={customerStructurePanel}
              operatingContextPanel={operatingContextPanel}
              jobRoleSummaryPanel={jobRoleSummaryPanel}
              jobKeyOutputsPanel={jobKeyOutputsPanel}
              jobScopePanel={jobScopePanel}
              jobDecisionCriteriaPanel={jobDecisionCriteriaPanel}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

const NEWGRAD_DETAILED_READ_HELP_TEXT = {
  jobStructure: "전공과 경험이 목표 직무와 얼마나 직접 맞닿아 있는지 살펴봅니다.",
  industryContext: "전공·자격·경험이 목표 산업을 얼마나 이해하는 근거가 되는지 살펴봅니다.",
  responsibilityScope: "성과를 낸 경험이 있는지, 얼마나 꾸준히 해봤는지, 관련 경험이 함께 있는지를 봅니다.",
  customerType: "누구를 상대해봤는지와 그 상대가 목표 직무에서 중요한 이해관계자인지, 직접 설명하거나 조율한 경험이 있는지를 함께 봅니다.",
  roleCharacter: "강점과 업무 스타일은 직접 입력한 내용이므로 참고용으로 함께 봅니다.",
};

function getNewgradDetailedReadHelpText(axisKey, title) {
  const safeAxisKey = String(axisKey || "").trim();
  if (NEWGRAD_DETAILED_READ_HELP_TEXT[safeAxisKey]) {
    return NEWGRAD_DETAILED_READ_HELP_TEXT[safeAxisKey];
  }

  const safeTitle = String(title || "").trim();
  if (safeTitle === "전공 연관 정도" || safeTitle === "직무 관련 경험") {
    return NEWGRAD_DETAILED_READ_HELP_TEXT.jobStructure;
  }
  if (safeTitle === "산업 이해 근거" || safeTitle === "산업 맥락") {
    return NEWGRAD_DETAILED_READ_HELP_TEXT.industryContext;
  }
  if (safeTitle === "유사 경험이 얼마나 실제 수행 근거로 읽히는지 확인" || safeTitle === "이력·스펙·경험 연결성") {
    return NEWGRAD_DETAILED_READ_HELP_TEXT.responsibilityScope;
  }
  if (safeTitle === "고객 커뮤니케이션 적합성" || safeTitle === "이해관계자 소통 적합성" || safeTitle === "고객 유형 연관성") {
    return NEWGRAD_DETAILED_READ_HELP_TEXT.customerType;
  }
  if (safeTitle === "강점과 재능" || safeTitle === "직무 성격 연관성") {
    return NEWGRAD_DETAILED_READ_HELP_TEXT.roleCharacter;
  }
  return "";
}

const NEWGRAD_DETAILED_READ_HELP_TEXT_OVERRIDE = {
  jobStructure: "전공과 경험이 목표 직무와 얼마나 직접 맞닿아 있는지 살펴봅니다.",
  industryContext: "전공·자격·경험이 목표 산업을 얼마나 이해하는 근거가 되는지 살펴봅니다.",
  responsibilityScope: "성과를 낸 경험이 있는지, 얼마나 꾸준히 해봤는지, 관련 경험이 함께 있는지를 봅니다.",
  customerType: "누구를 상대해봤는지와 그 상대가 목표 직무에서 중요한 이해관계자인지, 직접 설명하거나 조율한 경험이 있는지를 함께 봅니다.",
  roleCharacter: "강점과 업무 스타일은 직접 입력한 내용이므로 참고용으로 함께 봅니다.",
};

const NEWGRAD_DETAILED_READ_HELP_KEY_BY_TITLE = {
  "전공 연관 정도": "jobStructure",
  "직무 관련 경험": "jobStructure",
  "산업 이해 근거": "industryContext",
  "산업 맥락": "industryContext",
  "유사 경험이 얼마나 실제 수행 근거로 읽히는지 확인": "responsibilityScope",
  "이력·스펙·경험 연결성": "responsibilityScope",
  "고객 커뮤니케이션 적합성": "customerType",
  "이해관계자 소통 적합성": "customerType",
  "고객 유형 연관성": "customerType",
  "강점과 재능": "roleCharacter",
  "직무 성격 연관성": "roleCharacter",
};

function resolveNewgradDetailedReadHelp(axisKey, title) {
  const safeAxisKey = String(axisKey || "").trim();
  const safeTitle = String(title || "").trim();
  const helpKey = NEWGRAD_DETAILED_READ_HELP_TEXT_OVERRIDE[safeAxisKey]
    ? safeAxisKey
    : NEWGRAD_DETAILED_READ_HELP_KEY_BY_TITLE[safeTitle] || "";

  return {
    helpKey,
    helpText: helpKey ? NEWGRAD_DETAILED_READ_HELP_TEXT_OVERRIDE[helpKey] || "" : "",
  };
}

function NewgradDetailedReadSection({ items = [], isOpen, onToggle }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;
  const [openHelpKey, setOpenHelpKey] = useState(null);
  const [openCapabilityHelpKey, setOpenCapabilityHelpKey] = useState(null);

  return (
    <div className="space-y-4 sm:space-y-3">
      {isOpen ? safeItems.map((item, index) => {
        const rows = getVisibleComparisonRows(item?.block);
        if (rows.length === 0) return null;
        const footerHint = String(item?.actionHint || item?.cautionText || item?.block?.cautionText || "").trim();
        const axisKey = String(item?.axisKey || index);
        const title = String(item?.title || "").trim();
        const { helpKey, helpText } = resolveNewgradDetailedReadHelp(axisKey, title);
        const isHelpOpen = Boolean(helpText) && openHelpKey === helpKey;
        const capabilityLabels = Array.isArray(item?.block?.capabilityLabels)
          ? item.block.capabilityLabels.filter(Boolean)
          : [];

        return (
          <div
            key={`${axisKey}_${String(item?.title || "").slice(0, 20)}`}
            className="rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3.5 shadow-none sm:rounded-[20px] sm:px-5 sm:py-4 sm:shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <div className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/80">
              {item?.badge || "\uC138\uBD80 \uD310\uB3C5"}
            </div>
            <div className="mt-3.5 flex items-start justify-between gap-3 sm:mt-3">
              <div className="min-w-0 text-[14px] font-semibold leading-6 text-slate-900 sm:text-[15px]">
                {title}
              </div>
              {helpText ? (
                <button
                  type="button"
                  aria-label={`${title || String(item?.badge || "\uC138\uBD80 \uD310\uB3C5")} \uC124\uBA85 ${isHelpOpen ? "\uB2EB\uAE30" : "\uBCF4\uAE30"}`}
                  aria-expanded={isHelpOpen}
                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-[12px] font-semibold leading-none text-slate-700"
                  onClick={() => setOpenHelpKey((prev) => (prev === helpKey ? null : helpKey))}
                >
                  ?
                </button>
              ) : null}
            </div>
            {capabilityLabels.length > 0 ? (
              <div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="text-[11px] font-semibold tracking-tight text-sky-700">{"이 결과에 영향을 준 역량"}</div>
                  <button
                    type="button"
                    aria-label={`역량 설명 ${openCapabilityHelpKey === axisKey ? "닫기" : "보기"}`}
                    aria-expanded={openCapabilityHelpKey === axisKey}
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sky-300 bg-sky-50 text-[11px] font-semibold leading-none text-sky-700"
                    onClick={(e) => { e.stopPropagation(); setOpenCapabilityHelpKey((prev) => (prev === axisKey ? null : axisKey)); }}
                  >
                    ?
                  </button>
                </div>
                {openCapabilityHelpKey === axisKey ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {capabilityLabels.map((label, capabilityIndex) => (
                      <span
                        key={`${axisKey}_capability_${capabilityIndex}_${String(label).slice(0, 24)}`}
                        className="inline-flex items-center rounded-full border border-sky-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-sky-700"
                      >
                        {String(label)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : item?.block?.capabilityLabelLine ? (
              <p className="mt-1.5 text-[13px] font-medium leading-[1.65] text-slate-500">
                {String(item.block.capabilityLabelLine)}
              </p>
            ) : null}
            {item?.block?.capabilityWhyLine && openCapabilityHelpKey === axisKey ? (
              <p className="mt-1.5 text-[13px] leading-[1.65] text-slate-700">
                {String(item.block.capabilityWhyLine)}
              </p>
            ) : null}
            {helpText && isHelpOpen ? (
              <p className="mt-1.5 text-[13px] leading-[1.65] text-slate-700">{helpText}</p>
            ) : null}
            <div className="mt-3 space-y-2.5">
              {rows.map((row) => {
                const exactPositiveLabels = buildDetailedReadLabels(
                  row?.exactEvidencePhrases,
                  "",
                  ""
                );
                const positiveLabels = exactPositiveLabels.length > 0
                  ? exactPositiveLabels
                  : buildDetailedReadLabels(
                    row?.positiveEvidenceLabels,
                    "",
                    "\uC544\uC9C1 \uB69C\uB837\uD558\uAC8C \uB4DC\uB7EC\uB09C \uC0AC\uB840\uAC00 \uB9CE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4."
                  );
                const missingLabels = buildDetailedReadLabels(
                  row?.missingEvidenceLabels,
                  "",
                  "\uC9C1\uC811 \uC5F0\uACB0\uB418\uB294 \uC0AC\uB840\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4."
                );

                if (row.axis1DetailReading) {
                  const detailReading = row.axis1DetailReading;
                  return (
                    <div key={row.rowKey} className="rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-3 sm:px-3.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-5 text-slate-900">{"\uD310\uC815"}</p>
                      </div>
                      <div className="mt-2 space-y-3">
                        <p className="text-[13px] leading-[1.65] text-slate-700">{String(detailReading.judgmentText || "")}</p>
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[13px] font-semibold leading-5 text-slate-900">{"\uC65C \uC774\uB807\uAC8C \uBCF4\uC774\uB294\uC9C0"}</p>
                          <p className="mt-2 text-[13px] leading-[1.65] text-slate-700">{String(detailReading.reasonText || "")}</p>
                        </div>
                        <div className="border-t border-slate-200 pt-3">
                          <p className="text-[13px] font-semibold leading-5 text-slate-900">{"\uB2E4\uC74C\uC5D0 \uB5A0\uC62C\uB9B4 \uADFC\uAC70"}</p>
                          <p className="mt-2 text-[13px] leading-[1.65] text-slate-700">{String(detailReading.nextText || "")}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={row.rowKey} className="rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-3 sm:px-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold leading-5 text-slate-900">{String(row.label || "")}</p>
                    </div>
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className="text-[12px] font-semibold text-slate-500">{"\uD655\uC778\uB41C \uADFC\uAC70"}</p>
                        <p className="mt-0.5 text-[13px] leading-[1.65] text-slate-600">{positiveLabels.join(", ")}</p>
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-slate-500">{"\uBCF4\uC644 \uD3EC\uC778\uD2B8"}</p>
                        <p className="mt-0.5 text-[13px] leading-[1.65] text-slate-600">{missingLabels.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {item?.industryImportanceProfile?.signals?.length > 0 ? (
              <div className="mt-3 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
                <div className="text-[11px] font-semibold text-violet-600">{"산업 맥락 체크"}</div>
                <div className="mt-1 text-[13px] font-semibold text-slate-900">{item.industryImportanceProfile.title}</div>
                <p className="mt-1 text-[12px] leading-5 text-slate-600">{item.industryImportanceProfile.summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.industryImportanceProfile.signals.map((signal) => (
                    <span key={signal.key} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-violet-100">
                      {signal.label}
                    </span>
                  ))}
                </div>
                <div className="mt-2 space-y-1.5">
                  {item.industryImportanceProfile.signals.map((signal) => (
                    <p key={`${signal.key}-text`} className="text-[12px] leading-5 text-slate-600">
                      <span className="font-medium text-slate-700">{signal.label}</span>
                      {" · "}
                      {signal.text}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-[12px] leading-5 text-slate-500">{item.industryImportanceProfile.guidance}</p>
              </div>
            ) : null}
            {footerHint ? (
              <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/70 px-3 py-2.5">
                <p className="text-[11px] font-medium text-sky-700">{"\uC774 \uCD95\uC758 \uC885\uD569 \uBCF4\uC644 \uD3EC\uC778\uD2B8"}</p>
                <p className="mt-1 text-[13px] leading-[1.65] text-slate-600">{footerHint}</p>
              </div>
            ) : null}
          </div>
        );
      }) : null}
      {safeItems.length > 0 && typeof onToggle === "function" ? (
        <div className="pt-1">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900"
            onClick={onToggle}
          >
            <span>{isOpen ? "세부판독 접기" : "세부판독 펼치기"}</span>
            <svg
              className={"h-4 w-4 transition-transform duration-150" + (isOpen ? " rotate-180" : "")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}

const COMPARISON_HELP_BY_ROW_KEY = {
  industry_customer_structure: {
    why: "이 행은 각 산업에서 실제로 누가 구매하고 사용하는지를 보여줍니다. 기업 구매팀인지, 일반 소비자인지, 공공기관인지, 기관 담당자인지에 따라 관계 형성 방식과 소통 논리가 달라집니다. 고객 유형을 모르면 면접에서 맥락 없는 경험을 늘어놓게 됩니다.",
    how: "두 항목의 고객 유형을 비교하세요. B2B 기업 구매팀 → B2C 소비자, 또는 공공기관 → 민간기업으로 이동한다면, 상대방의 구매 논리와 소통 방식이 어떻게 달라지는지 파악하세요. 고객 유형이 같다면 경험 이전이 수월합니다.",
    interviewQuestion: "이전에 상대한 고객층과 저희 산업의 고객층이 다른데, 이 차이가 업무 방식에 어떤 영향을 준다고 생각하시나요?",
    answerGuide: "'고객이 다르다는 걸 안다'는 충분하지 않습니다. 이전 고객이 무엇을 중시했는지 → 새 고객층은 무엇이 다른지 → 그 차이를 메우기 위해 어떤 경험이 있는지 순서로 연결하세요.",
  },
  industry_buying_motion: {
    why: "이 행은 제품이나 서비스가 실제로 어떤 방식으로 도입·구매되는지를 보여줍니다. 입찰·승인을 거치는지, 담당자가 직접 구독하는지, 관계 영업으로 장기 계약을 맺는지 — 이 흐름을 알면 해당 산업에서 어떤 역량이 핵심인지 보입니다.",
    how: "두 항목의 구매·도입 방식을 비교하세요. 프로세스가 긴가 짧은가, 결정권자가 한 명인가 여러 명인가, 계약 사이클이 어떻게 다른가를 살펴보세요. 방식이 비슷하면 경험이 그대로 통하고, 다르면 그 구조에서 어떻게 일할지 준비가 필요합니다.",
    interviewQuestion: "저희 산업의 구매·도입 방식이 이전 산업과 어떻게 다른지 이해하고 계신가요? 그 구조에서 어떻게 성과를 낼 수 있을 것 같으신가요?",
    answerGuide: "구매 방식의 차이를 구체적으로 짚고, 그 방식에서 성과를 내기 위한 핵심 역량이 무엇인지 말하세요. 이미 비슷한 구조를 경험했거나 준비하고 있다면 근거를 구체적으로 제시하세요.",
  },
  industry_decision_structure: {
    why: "이 행은 구매나 사업 결정이 누구를 거쳐 최종 승인되는지를 보여줍니다. 실무 담당자인지, 부서장인지, 위원회인지, 외부 규제기관인지에 따라 설득해야 할 대상과 설득 방식이 달라집니다. 이 구조를 모르면 좋은 제안도 엉뚱한 곳에서 막힙니다.",
    how: "두 산업의 최종 결정권자와 승인 경로를 비교하세요. 현재 산업은 팀장이 결정하지만 지원 산업은 위원회 승인이 필요할 수 있습니다. 결정 체계가 복잡해질수록 이해관계자 관리와 상위 레벨 소통 역량이 필요합니다.",
    interviewQuestion: "이전 업무에서 중요한 결정을 통과시키기 위해 설득해야 했던 이해관계자 구조는 어땠나요? 저희 환경과 어떻게 다를 것 같으신가요?",
    answerGuide: "의사결정 구조를 알고 있다는 것 자체가 강점입니다. 복잡한 승인 구조를 통과시킨 경험이 있다면 구체적으로 말하고, 구조가 다를 경우 어떻게 빠르게 파악하고 적응할지 방법을 제시하세요.",
  },
  industry_operating_context: {
    why: "이 행은 각 산업에서 일이 어떤 제약과 리듬 속에서 돌아가는지를 보여줍니다. SLA 준수, 규제 대응, 예산 집행 주기, 안전 기준 등 운영 제약은 직무 수행 방식을 결정합니다. 이 맥락을 모르면 새 환경에서 왜 이렇게 일하는지 이해하기 어렵습니다.",
    how: "두 산업의 운영 제약을 비교하세요. 빠른 실험을 허용하는 환경인지, 사전 승인이 필요한 환경인지, 컴플라이언스가 일하는 방식에 얼마나 깊이 개입하는지를 살펴보세요. 운영 맥락이 다를수록 일처리 습관의 의도적 조정이 필요합니다.",
    interviewQuestion: "이전 산업의 운영 환경과 제약 조건이 저희 산업과 어떻게 다르다고 생각하시나요? 그 차이에 어떻게 적응할 계획인가요?",
    answerGuide: "제약의 종류와 강도를 구체적으로 인지하고 있음을 보여주세요. SLA, 규제, 예산 사이클 등 운영 제약을 파악하고 있다면, 그 맥락에서 어떻게 일한 경험이 있는지 또는 어떻게 적응할지 방법을 제시하세요.",
  },
  job_core_role: {
    why: "이 항목은 직무가 조직 안에서 본질적으로 무엇을 하는 역할인지를 보여줍니다. 같은 기획이라도 전략 수립인지, 운영 효율 개선인지, 고객 경험 설계인지에 따라 필요한 역량이 달라집니다. 역할의 본질이 다르면 어떤 경험을 중심에 놓고 설명할지도 달라집니다.",
    how: "두 직무의 핵심 역할 문장을 읽고 이 직무는 결국 무엇을 위해 존재하는가를 비교해보세요. 역할 본질이 유사하면 경험이 직접 통하고, 다르면 현재 경험 중 어떤 부분이 새 역할의 본질과 연결되는지 찾아야 합니다.",
    interviewQuestion: "저희 직무가 조직 안에서 어떤 역할을 하는 포지션이라고 이해하고 계신가요? 그 이해를 바탕으로 본인의 어떤 경험이 가장 적합하다고 생각하시나요?",
    answerGuide: "지원 직무의 본질적 역할을 정확히 파악했다는 것을 먼저 보여주세요. 그 역할의 본질과 본인의 경험이 어떻게 연결되는지를 구체적인 업무 사례로 설명하면 설득력이 높아집니다.",
  },
  job_key_outputs: {
    why: "이 행은 각 직무가 실제로 무엇을 만들고 납품해야 하는지를 보여줍니다. 보고서인지, 데이터 분석 결과인지, 제품 기능인지, 고객 계약인지 — 기대 산출물이 다르면 필요한 역량과 하루 일의 성격이 달라집니다. '무엇을 만들었다'는 말이 면접관에게 역량보다 더 명확하게 들립니다.",
    how: "두 직무의 주요 기대 산출물을 비교하세요. 산출물 유형이 유사하면 경험을 그대로 제시할 수 있고, 다르면 내가 만들어온 산출물과 새 직무의 기대 산출물 사이 연결점을 찾아야 합니다.",
    interviewQuestion: "지금까지 주로 어떤 형태의 산출물을 만들어오셨나요? 그 산출물이 저희 직무에서 기대하는 것과 어떻게 연결되나요?",
    answerGuide: "'분석 역량이 있다'보다 '이런 보고서를 만들어 이런 의사결정에 기여했다'가 훨씬 설득력 있습니다. 지원 직무의 기대 산출물과 본인이 만들어온 산출물을 직접 비교하며 공통점을 보여주세요.",
  },
  job_scope: {
    why: "같은 직무라도 어디까지 스스로 판단하고 실행하느냐에 따라 기대 수준이 달라집니다. 현재보다 넓은 범위로 이동하면 오너십 확장 의지를 보여야 하고, 더 좁거나 다른 범위로 이동하면 왜 그 방향이 더 적합한지 설명할 수 있어야 합니다. 책임 범위 차이를 이해하고 있다는 점 자체가 면접에서 좋은 인상을 줍니다.",
    how: "두 직무의 책임 범위를 비교해보세요. 단독 수행인지 협업 중심인지, 실행 단계까지인지 기획까지 포함하는지, 팀 단위 범위인지 사업 단위 범위인지 살펴보면 좋습니다. 범위가 확장되는 전환이라면 기존 경험에서 범위를 넘어 일한 사례를 함께 정리해두는 것이 좋습니다.",
    interviewQuestion: "이전 역할에서는 어디까지 책임지고 일하셨나요? 저희 직무의 책임 범위와 비교하면 어떤 차이가 있다고 보시나요?",
    answerGuide: "책임 범위 차이를 분명히 인지하고 있다는 점을 먼저 보여주세요. 그리고 이전 경험에서 비슷한 범위를 이미 다뤘거나, 더 넓은 범위를 감당할 준비가 되어 있다는 점을 구체적인 사례로 연결해 설명하면 설득력이 높아집니다.",
  },
  job_decision_criteria: {
    why: "이 행은 각 직무에서 '잘한다'의 기준이 무엇인지를 보여줍니다. 속도인지 정확성인지, 아이디어인지 실행인지, 매출인지 관계인지 — 평가 기준이 다르면 강점으로 내세울 경험도 달라져야 합니다. 기준을 먼저 파악해야 면접에서 엉뚱한 강점을 어필하지 않을 수 있습니다.",
    how: "두 직무의 판단 기준을 비교하세요. 기준이 같다면 본인의 판단 스타일이 잘 맞는다는 신호입니다. 다르다면 그 기준에 맞게 일한 경험이 있는지 찾거나, 기준에 맞게 일하는 방법을 보여주세요.",
    interviewQuestion: "이전 직무에서 '잘한다'의 기준이 무엇이었나요? 저희 직무에서 중요하게 보는 기준과 어떻게 다르고, 어떻게 맞추실 수 있을 것 같으신가요?",
    answerGuide: "본인이 잘해온 기준을 솔직하게 말하되, 지원 직무의 평가 기준도 파악하고 있음을 보여주세요. 기준이 다르다면 그 기준에 맞춰 성과를 낸 사례나 구체적인 적응 방법을 제시하면 신뢰를 줍니다.",
  },
};


const COMPARISON_HELP_SECTION_LABELS = {
  why: "왜 중요한가",
  how: "어떻게 읽을까",
  interviewQuestion: "면접 질문 예시",
  answerGuide: "답변 가이드",
};

function FitBar({ score, band }) {
  if (!Number.isFinite(score) || score < 1 || score > 5) return null;
  const filled = Math.round(score);
  const filledBarClass = filled <= 2
    ? "bg-rose-400"
    : filled === 3
      ? "bg-sky-400"
      : "bg-emerald-400";
  const metaTextClass = filled <= 2
    ? "text-rose-700"
    : filled === 3
      ? "text-sky-700"
      : "text-emerald-700";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-slate-500">적합도</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={[
              "h-2 w-4.5 rounded-sm",
              i <= filled ? filledBarClass : "bg-slate-300",
            ].join(" ")}
          />
        ))}
      </div>
      <span className={`text-[11px] font-semibold ${metaTextClass}`}>{filled}/5</span>
      {band ? <span className={`text-[11px] font-medium ${metaTextClass}`}>· {band}</span> : null}
    </div>
  );
}

function DecisionStructureBlock({ title, items = [], tone = "" }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;

  const isApprovalFlow = title === "최종 승인 구조";

  return (
    <div className="space-y-2">
      <div className="text-[12px] font-semibold tracking-tight text-slate-900">{title}</div>
      {isApprovalFlow ? (
        <div className="space-y-2">
          {safeItems.slice(0, 2).map((item, idx) => (
            <div
              key={`${title}_${item?.raw || idx}`}
              className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
            >
              <div className="text-[13px] leading-relaxed text-slate-700">{String(item?.label || item?.raw || "")}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {safeItems.map((item, idx) => (
            <span
              key={`${title}_${item?.raw || idx}`}
              className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-semibold ${tone}`}
            >
              {String(item?.label || item?.raw || "")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function JobRoleSummaryPanelBlocks({ section }) {
  const summary = String(section?.summary || "").trim();
  const supportingSignals = Array.isArray(section?.supportingSignals) ? section.supportingSignals.filter(Boolean) : [];
  if (!summary && supportingSignals.length === 0) return null;
  return (
    <div className="space-y-2.5 border-l-2 border-sky-100 pl-3">
      {summary ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"역할 중심"}</div>
          <div className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
            <div className="text-[13px] leading-relaxed text-slate-700">{summary}</div>
          </div>
        </div>
      ) : null}
      {supportingSignals.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"실제 강점으로 연결되는 신호"}</div>
          <div className="space-y-1.5">
            {supportingSignals.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobSignalListPanelBlocks({ section }) {
  const signals = Array.isArray(section?.signals) ? section.signals.filter(Boolean) : [];
  if (signals.length === 0) return null;
  return (
    <div className="space-y-1.5 border-l-2 border-sky-100 pl-3">
      {signals.map((sig, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
        >
          <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
        </div>
      ))}
    </div>
  );
}

function JobOutputsPanelBlocks({ section }) {
  const primary = Array.isArray(section?.primaryOutputs) ? section.primaryOutputs.filter(Boolean) : [];
  const performance = Array.isArray(section?.performanceOutputs) ? section.performanceOutputs.filter(Boolean) : [];
  if (primary.length === 0 && performance.length === 0) return null;
  return (
    <div className="space-y-2.5 border-l-2 border-sky-100 pl-3">
      {primary.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"대표 결과물"}</div>
          <div className="space-y-1.5">
            {primary.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {performance.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"성과로 연결되는 출력"}</div>
          <div className="space-y-1.5">
            {performance.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobDecisionCriteriaPanelBlocks({ section }) {
  const criteria = Array.isArray(section?.coreCriteria) ? section.coreCriteria.filter(Boolean) : [];
  const roleShift = Array.isArray(section?.roleShiftSignals) ? section.roleShiftSignals.filter(Boolean) : [];
  if (criteria.length === 0 && roleShift.length === 0) return null;
  return (
    <div className="space-y-2.5 border-l-2 border-sky-100 pl-3">
      {criteria.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"중요하게 보는 기준"}</div>
          <div className="space-y-1.5">
            {criteria.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {roleShift.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"역할 이동 방향 신호"}</div>
          <div className="space-y-1.5">
            {roleShift.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function JobScopePanelBlocks({ section }) {
  const direct = Array.isArray(section?.directOwnership) ? section.directOwnership.filter(Boolean) : [];
  const expanded = Array.isArray(section?.expandedResponsibility) ? section.expandedResponsibility.filter(Boolean) : [];
  if (direct.length === 0 && expanded.length === 0) return null;
  return (
    <div className="space-y-2.5 border-l-2 border-sky-100 pl-3">
      {direct.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"직접 책임지는 것"}</div>
          <div className="space-y-1.5">
            {direct.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {expanded.length > 0 ? (
        <div className="space-y-1">
          <div className="text-[11px] font-semibold tracking-tight text-slate-500">{"조율하거나 확장해서 맡는 것"}</div>
          <div className="space-y-1.5">
            {expanded.map((sig, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <div className="text-[13px] leading-relaxed text-slate-700">{String(sig)}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DecisionStructurePanelBlocks({ section, tone = "" }) {
  if (!section || typeof section !== "object") return null;

  const hasVisibleBlocks =
    (Array.isArray(section.reviewers) && section.reviewers.length > 0) ||
    (Array.isArray(section.approvalFlow) && section.approvalFlow.length > 0) ||
    (Array.isArray(section.decisionCriteria) && section.decisionCriteria.length > 0);

  if (!hasVisibleBlocks) return null;

  return (
    <div className="space-y-3 border-l-2 border-sky-100 pl-3">
      <DecisionStructureBlock title="주요 검토 주체" items={section.reviewers} tone={tone} />
      <DecisionStructureBlock title="최종 승인 구조" items={section.approvalFlow} tone={tone} />
      <DecisionStructureBlock title="실제 판단 기준" items={section.decisionCriteria} tone={tone} />
    </div>
  );
}

function OperatingContextBlock({ title, items = [] }) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];
  if (safeItems.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-[12px] font-semibold tracking-tight text-slate-900">{title}</div>
      <div className="space-y-1.5">
        {safeItems.map((item, idx) => (
          <div
            key={`${title}_${item?.raw || idx}`}
            className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <div className="text-[13px] leading-relaxed text-slate-700">
              {String(item?.label || item?.raw || "")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OperatingContextPanelBlocks({ section }) {
  if (!section || typeof section !== "object") return null;
  const hasAny =
    (Array.isArray(section.workRhythm) && section.workRhythm.length > 0) ||
    (Array.isArray(section.constraints) && section.constraints.length > 0) ||
    (Array.isArray(section.practicalFocus) && section.practicalFocus.length > 0);
  if (!hasAny) return null;
  return (
    <div className="space-y-3 border-l-2 border-sky-100 pl-3">
      <OperatingContextBlock title={"일의 리듬"} items={section.workRhythm} />
      <OperatingContextBlock title={"핵심 제약"} items={section.constraints} />
      <OperatingContextBlock title={"실무에서 먼저 챙길 것"} items={section.practicalFocus} />
    </div>
  );
}

function RiskComparisonTable({ table, activeExplanationRowKey = null, onSelectExplanationRow = null, onExplanationRowMount = null, buyingMotionPanel = null, decisionStructurePanel = null, customerStructurePanel = null, operatingContextPanel = null, jobRoleSummaryPanel = null, jobKeyOutputsPanel = null, jobScopePanel = null, jobDecisionCriteriaPanel = null }) {
  const rows = Array.isArray(table?.rows) ? table.rows.filter(Boolean) : [];
  const [openHelpKey, setOpenHelpKey] = useState(null);
  const [showAllMobileRows, setShowAllMobileRows] = useState(false);
  if (rows.length < 2) return null;

  const tableKind = String(table?.tableKind || "").trim();
  const title = String(table?.title || "\uC0B0\uC5C5 \uAD6C\uC870 \uBE44\uAD50");
  const description = String(table?.description || "").trim();
  const metaNote = String(table?.metaNote || "").trim();
  const currentLabel = String(table?.columns?.current || "").trim() || "\uD604\uC7AC";
  const targetLabel = String(table?.columns?.target || "").trim() || "\uC9C0\uC6D0";
  const isJobStructureTable = tableKind === "job_structure" || title === "직무 구조 비교";
  const isIndustrySupportTable = tableKind === "industry_context_support" || title === "산업 구조 비교";
  const displayTitle = isIndustrySupportTable
    ? "\uC0B0\uC5C5 \uAD6C\uC870 \uBE44\uAD50"
    : isJobStructureTable
      ? "\uC9C1\uBB34 \uAD6C\uC870 \uBE44\uAD50"
      : title;
  const shouldHideHeaderCopy = isJobStructureTable || isIndustrySupportTable;
  const displayDescription = shouldHideHeaderCopy ? "" : description;
  const displayMetaNote = shouldHideHeaderCopy ? "" : metaNote;
  const ctaBadge = "핵심 정보";
  const ctaTitle = "면접관이 보는 차이 더 보기";
  const ctaSubtitle = isJobStructureTable
    ? "비슷해 보여도 실제 평가 기준은 다를 수 있습니다"
    : "산업이 바뀌면 기대 맥락과 판단 기준도 달라집니다";
  const mobilePriorityRowKeys =
    isJobStructureTable
      ? ["job_core_role", "job_decision_criteria"]
      : isIndustrySupportTable
        ? ["industry_customer_structure", "industry_buying_motion"]
        : [];
  const prioritizedRows = mobilePriorityRowKeys
    .map((rowKey) => rows.find((row) => String(row?.rowKey || "").trim() === rowKey))
    .filter(Boolean);
  const fallbackRows = rows.filter((row) => !prioritizedRows.includes(row));
  const mobileVisibleRows = [...prioritizedRows, ...fallbackRows].slice(0, 2);
  const mobileVisibleRowKeys = new Set(
    mobileVisibleRows.map((row) => String(row?.rowKey || "").trim() || String(row?.label || ""))
  );
  const mobileHiddenRows = rows.filter((row) => {
    const rowKey = String(row?.rowKey || "").trim() || String(row?.label || "");
    return !mobileVisibleRowKeys.has(rowKey);
  });
  const mobileRowsToRender = showAllMobileRows
    ? [...mobileVisibleRows, ...mobileHiddenRows]
    : mobileVisibleRows;

  return (
    <div className="mt-4 rounded-none border-0 bg-transparent md:rounded-[18px] md:border md:border-slate-200 md:bg-slate-50/80">
      <div className="border-b border-slate-200 px-1.5 py-3 md:px-4">
        <div className="text-sm font-semibold tracking-tight text-slate-900">{displayTitle}</div>
        {displayDescription ? (
          <p className="mt-1.5 text-[12px] leading-5 text-slate-600">{displayDescription}</p>
        ) : null}
        {displayMetaNote ? (
          <p className="mt-1 text-[11px] leading-5 text-slate-500">{displayMetaNote}</p>
        ) : null}
      </div>
      <div className="space-y-2.5 px-0 pt-3 md:hidden">
        {mobileRowsToRender.map((row, index) => {
          const rowKey = typeof row?.rowKey === "string" ? row.rowKey.trim() : "";
          const rowIdentity = rowKey || String(row?.label || "row");
          const linkedPanel =
            rowKey === "industry_customer_structure"
              ? customerStructurePanel
              : rowKey === "industry_buying_motion"
              ? buyingMotionPanel
              : rowKey === "industry_decision_structure"
                ? decisionStructurePanel
                : rowKey === "industry_operating_context"
                  ? operatingContextPanel
                  : rowKey === "job_core_role"
                    ? jobRoleSummaryPanel
                    : rowKey === "job_key_outputs"
                      ? jobKeyOutputsPanel
                      : rowKey === "job_scope"
                        ? jobScopePanel
                        : rowKey === "job_decision_criteria"
                          ? jobDecisionCriteriaPanel
                          : null;
          const isLinkedExplanationRow = Boolean(linkedPanel?.visible);
          const isActiveExplanationRow = isLinkedExplanationRow && activeExplanationRowKey === rowKey;
          const isInteractiveExplanationRow = isLinkedExplanationRow && typeof onSelectExplanationRow === "function";
          const isMobileRowWrapperInteractive = false;
          const hasLinkedGuide = isLinkedExplanationRow;
          const currentValue = String(row?.current || "");
          const targetValue = String(row?.target || "");
          const helpContent = rowKey ? COMPARISON_HELP_BY_ROW_KEY[rowKey] || null : null;
          const isMobileHelpOpen = Boolean(helpContent) && openHelpKey === rowKey;
          const showHelpTrigger = Boolean(helpContent);
          const showLinkedGuideTrigger = hasLinkedGuide;
          const showActionArea = showHelpTrigger || showLinkedGuideTrigger;

          const handleSelectExplanationRow = () => {
            if (!isInteractiveExplanationRow) return;
            onSelectExplanationRow(isActiveExplanationRow ? null : rowKey);
          };

          return (
            <div
              key={`${rowIdentity}_${index}`}
              ref={isLinkedExplanationRow && typeof onExplanationRowMount === "function" ? onExplanationRowMount : undefined}
              className={[
                "overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 shadow-none",
                isLinkedExplanationRow ? "border-sky-200 bg-gradient-to-br from-sky-50/75 via-white to-white" : "",
                isActiveExplanationRow ? "shadow-[inset_0_0_0_1px_rgba(125,211,252,0.45)]" : "",
              ].join(" ").trim()}
            >
              <div
                role={isMobileRowWrapperInteractive ? "button" : undefined}
                tabIndex={isMobileRowWrapperInteractive ? 0 : undefined}
                aria-controls={isMobileRowWrapperInteractive ? "transition-lite-explanation-panel-mobile" : undefined}
                aria-pressed={isMobileRowWrapperInteractive ? isActiveExplanationRow : undefined}
                onClick={isMobileRowWrapperInteractive ? handleSelectExplanationRow : undefined}
                onKeyDown={isMobileRowWrapperInteractive ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectExplanationRow();
                  }
                } : undefined}
                className={[
                  "px-3 py-3",
                  isLinkedExplanationRow ? "border-l-[3px] border-l-sky-300/90" : "",
                  isMobileRowWrapperInteractive ? "cursor-pointer transition-colors hover:bg-sky-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2" : "",
                  isActiveExplanationRow ? "bg-sky-100/50" : "",
                ].join(" ").trim()}
              >
                <div className="min-w-0 whitespace-normal text-[13px] font-semibold text-slate-900 [overflow-wrap:break-word] [word-break:keep-all]">
                  {String(row?.label || "")}
                </div>
                <div className="mt-3 grid gap-2">
                  <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{currentLabel}</div>
                    <div className="mt-1 min-w-0 whitespace-normal text-[13px] leading-5 text-slate-700 [overflow-wrap:break-word] [word-break:keep-all]">{currentValue}</div>
                  </div>
                  <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-500">{targetLabel}</div>
                    <div className="mt-1 min-w-0 whitespace-normal text-[13px] leading-5 text-slate-700 [overflow-wrap:break-word] [word-break:keep-all]">{targetValue}</div>
                  </div>
                </div>
                {Number.isFinite(row?.fitScore) && row.fitScore >= 1 && row.fitScore <= 5 ? (
                  <div className="mt-2">
                    <FitBar score={row.fitScore} band={row.fitBand} />
                  </div>
                ) : null}
                {showActionArea ? (
                  <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                    <div className="flex flex-wrap items-center gap-3">
                      {showHelpTrigger ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setOpenHelpKey(isMobileHelpOpen ? null : rowKey); }}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 active:text-indigo-800"
                          aria-expanded={isMobileHelpOpen}
                        >
                          <span>{"\uC124\uBA85 \uBCF4\uAE30"}</span>
                          <svg className={"h-3.5 w-3.5 transition-transform duration-150" + (isMobileHelpOpen ? " rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      ) : null}
                      {showLinkedGuideTrigger ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectExplanationRow(isActiveExplanationRow ? null : rowKey);
                          }}
                          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-indigo-600 active:text-indigo-800"
                          aria-expanded={isActiveExplanationRow}
                          aria-controls="transition-lite-explanation-panel-mobile"
                        >
                          <span>{String(linkedPanel?.title || "\uC790\uC138\uD788 \uBCF4\uAE30")}</span>
                          <svg className={"h-3.5 w-3.5 transition-transform duration-150" + (isActiveExplanationRow ? " rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
              {isMobileHelpOpen && helpContent ? (
                <div className="border-t border-indigo-100 bg-gradient-to-b from-indigo-50/55 via-white to-white px-3 pb-3.5 pt-3">
                  <div className="space-y-3 rounded-[16px] border border-indigo-200/70 bg-white px-3.5 py-3.5">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        <span>{COMPARISON_HELP_SECTION_LABELS.why}</span>
                      </div>
                      <div className="text-[13px] leading-[1.75] text-slate-700">{helpContent.why}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        <span>{COMPARISON_HELP_SECTION_LABELS.how}</span>
                      </div>
                      <div className="text-[13px] leading-[1.75] text-slate-700">{helpContent.how}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        <span>면접 질문 예시</span>
                      </div>
                      <div className="text-[13px] leading-[1.75] text-slate-700">{helpContent.interviewQuestion}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                        <span>답변 방향</span>
                      </div>
                      <div className="text-[13px] leading-[1.75] text-slate-700">{helpContent.answerGuide}</div>
                    </div>
                  </div>
                </div>
              ) : null}
              {isActiveExplanationRow && linkedPanel ? (
                <div
                  id="transition-lite-explanation-panel-mobile"
                  className="border-t border-sky-100 bg-gradient-to-b from-sky-50/50 via-white to-white px-3 pb-3.5 pt-3"
                >
                  {linkedPanel.title ? (
                    <div className="mb-2 text-[13px] font-semibold text-slate-900">
                      {String(linkedPanel.title)}
                    </div>
                  ) : null}
                  {linkedPanel.intro ? (
                    <div className="mb-3 text-[13px] leading-relaxed text-slate-600">
                      {String(linkedPanel.intro)}
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    {(() => {
                      const isJobPanel = linkedPanel?.panelKind === "job_role_summary" || linkedPanel?.panelKind === "job_signal_list";
                      const sectionTitle = isJobPanel ? ["현재 직무", "지원 직무"] : ["현재 산업", "지원 산업"];
                      return [
                        { key: "current", tone: "bg-slate-100 text-slate-700 border-slate-200", title: sectionTitle[0], section: linkedPanel.current },
                        { key: "target", tone: "bg-sky-50 text-sky-700 border-sky-200", title: sectionTitle[1], section: linkedPanel.target },
                      ].map(({ key, tone, title, section }) => {
                        const isDecisionStructurePanel = linkedPanel === decisionStructurePanel;
                        const isOperatingContextPanel = linkedPanel === operatingContextPanel;
                        const isJobRoleSummary = linkedPanel?.panelKind === "job_role_summary";
                        const isJobSignalList = linkedPanel?.panelKind === "job_signal_list";
                        const sectionItems = Array.isArray(section?.items) ? section.items.filter(Boolean) : [];
                        const hasDecisionBlocks =
                          isDecisionStructurePanel &&
                          (
                            (Array.isArray(section?.reviewers) && section.reviewers.length > 0) ||
                            (Array.isArray(section?.approvalFlow) && section.approvalFlow.length > 0) ||
                            (Array.isArray(section?.decisionCriteria) && section.decisionCriteria.length > 0)
                          );
                        const hasOperatingContextBlocks =
                          isOperatingContextPanel &&
                          (
                            (Array.isArray(section?.workRhythm) && section.workRhythm.length > 0) ||
                            (Array.isArray(section?.constraints) && section.constraints.length > 0) ||
                            (Array.isArray(section?.practicalFocus) && section.practicalFocus.length > 0)
                          );
                        const isJobScope = linkedPanel?.panelKind === "job_scope_2block";
                        const isJobOutputs = linkedPanel?.panelKind === "job_outputs_2block";
                        const isJobDecisionCriteria2 = linkedPanel?.panelKind === "job_decision_criteria_2block";
                        const hasJobRoleSummary = isJobRoleSummary && (Boolean(String(section?.summary || "").trim()) || (Array.isArray(section?.supportingSignals) && section.supportingSignals.filter(Boolean).length > 0));
                        const hasJobSignals = isJobSignalList && Array.isArray(section?.signals) && section.signals.filter(Boolean).length > 0;
                        const hasJobScope = isJobScope && ((Array.isArray(section?.directOwnership) && section.directOwnership.filter(Boolean).length > 0) || (Array.isArray(section?.expandedResponsibility) && section.expandedResponsibility.filter(Boolean).length > 0));
                        const hasJobOutputs = isJobOutputs && ((Array.isArray(section?.primaryOutputs) && section.primaryOutputs.filter(Boolean).length > 0) || (Array.isArray(section?.performanceOutputs) && section.performanceOutputs.filter(Boolean).length > 0));
                        const hasJobDecisionCriteria2 = isJobDecisionCriteria2 && Array.isArray(section?.coreCriteria) && section.coreCriteria.filter(Boolean).length > 0;
                        if (!hasDecisionBlocks && !hasOperatingContextBlocks && !hasJobRoleSummary && !hasJobSignals && !hasJobScope && !hasJobOutputs && !hasJobDecisionCriteria2 && sectionItems.length === 0) return null;
                        return (
                          <div key={key} className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 text-[13px] font-semibold text-slate-900">{title}</div>
                              {section?.label ? (
                                <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
                                  {String(section.label)}
                                </span>
                              ) : null}
                            </div>
                            {hasDecisionBlocks ? (
                              <DecisionStructurePanelBlocks section={section} tone={tone} />
                            ) : hasOperatingContextBlocks ? (
                              <OperatingContextPanelBlocks section={section} />
                            ) : hasJobRoleSummary ? (
                              <JobRoleSummaryPanelBlocks section={section} />
                            ) : hasJobOutputs ? (
                              <JobOutputsPanelBlocks section={section} />
                            ) : hasJobScope ? (
                              <JobScopePanelBlocks section={section} />
                            ) : hasJobDecisionCriteria2 ? (
                              <JobDecisionCriteriaPanelBlocks section={section} />
                            ) : hasJobSignals ? (
                              <JobSignalListPanelBlocks section={section} />
                            ) : (
                              <div className="space-y-2 border-l-2 border-sky-100 pl-3">
                                {sectionItems.map((item, idx) => (
                                  <div key={`${key}_${item?.raw || idx}`} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-none">
                                    <div className="min-w-0 break-words whitespace-normal text-[13px] font-semibold text-slate-900">{String(item?.displayLabel || item?.raw || "")}</div>
                                    {item?.shortDescription ? (
                                      <div className="mt-1 break-words whitespace-normal text-[13px] leading-relaxed text-slate-500">{String(item.shortDescription)}</div>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
        {mobileHiddenRows.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowAllMobileRows((prev) => !prev)}
            className={[
              "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition-colors active:scale-[0.99]",
              showAllMobileRows
                ? "border-indigo-300/80 bg-gradient-to-br from-indigo-50 via-sky-50 to-white text-indigo-950 shadow-[inset_0_0_0_1px_rgba(199,210,254,0.9)]"
                : "border-sky-200/90 bg-gradient-to-br from-sky-50 via-indigo-50/80 to-white text-sky-950 shadow-[0_1px_2px_rgba(59,130,246,0.08)] hover:border-sky-300 hover:from-sky-100 hover:via-indigo-50 hover:to-white active:border-sky-300",
            ].join(" ")}
            aria-expanded={showAllMobileRows}
          >
            <span className="min-w-0">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  showAllMobileRows
                    ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200/80"
                    : "bg-sky-100 text-sky-700 ring-1 ring-sky-200/80",
                ].join(" ")}
              >
                {ctaBadge}
              </span>
              <span className={["mt-2 block text-[13px] font-semibold leading-5", showAllMobileRows ? "text-indigo-950" : "text-sky-950"].join(" ")}>
                {ctaTitle}
              </span>
              <span className={["mt-0.5 block text-[12px] leading-5", showAllMobileRows ? "text-indigo-700" : "text-sky-700"].join(" ")}>
                {ctaSubtitle}
              </span>
            </span>
            <svg
              className={[
                `h-4 w-4 shrink-0 transition-transform duration-150${showAllMobileRows ? " rotate-180" : ""}`,
                showAllMobileRows ? "text-indigo-600" : "text-sky-600",
              ].join(" ")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : null}
      </div>
      <div className="hidden md:block md:overflow-x-auto">
        <div className="md:min-w-[520px]">
          <div className="grid grid-cols-[168px_minmax(0,1fr)_minmax(0,1fr)] items-start border-b border-slate-200 bg-white/70 text-[12px] font-semibold text-slate-500">
            <div className="px-4 py-3">{"\uBE44\uAD50 \uD56D\uBAA9"}</div>
            <div className="px-4 py-3">{currentLabel}</div>
            <div className="px-4 py-3">{targetLabel}</div>
          </div>
          {rows.map((row, index) => {
            const rowKey = typeof row?.rowKey === "string" ? row.rowKey.trim() : "";
            const helpContent = rowKey ? COMPARISON_HELP_BY_ROW_KEY[rowKey] || null : null;
            const isOpen = Boolean(helpContent) && openHelpKey === rowKey;
            const helpPanelId = rowKey ? `comparison-help-${rowKey}` : null;
            const rowIdentity = rowKey || String(row?.label || "row");
            const linkedPanel =
              rowKey === "industry_customer_structure"
                ? customerStructurePanel
                : rowKey === "industry_buying_motion"
                ? buyingMotionPanel
                : rowKey === "industry_decision_structure"
                  ? decisionStructurePanel
                  : rowKey === "industry_operating_context"
                    ? operatingContextPanel
                    : rowKey === "job_core_role"
                      ? jobRoleSummaryPanel
                      : rowKey === "job_key_outputs"
                        ? jobKeyOutputsPanel
                        : rowKey === "job_scope"
                          ? jobScopePanel
                          : rowKey === "job_decision_criteria"
                            ? jobDecisionCriteriaPanel
                            : null;
            const isLinkedExplanationRow = Boolean(linkedPanel?.visible);
            const isActiveExplanationRow = isLinkedExplanationRow && activeExplanationRowKey === rowKey;
            const isInteractiveExplanationRow = isLinkedExplanationRow && typeof onSelectExplanationRow === "function";

            const handleSelectExplanationRow = () => {
              if (!isInteractiveExplanationRow) return;
              onSelectExplanationRow(isActiveExplanationRow ? null : rowKey);
            };

            return (
              <div
                key={`${rowIdentity}_${index}`}
                ref={isLinkedExplanationRow && typeof onExplanationRowMount === "function" ? onExplanationRowMount : undefined}
                className={[
                  "border-b border-slate-200 last:border-b-0",
                  isLinkedExplanationRow ? "bg-gradient-to-r from-sky-50/60 via-white to-white" : "",
                  isOpen ? "bg-gradient-to-br from-indigo-50/60 via-white to-white" : "",
                ].join(" ").trim()}
              >
                <div
                  role={isInteractiveExplanationRow ? "button" : undefined}
                  tabIndex={isInteractiveExplanationRow ? 0 : undefined}
                  aria-controls={isInteractiveExplanationRow ? "transition-lite-explanation-panel" : undefined}
                  aria-pressed={isInteractiveExplanationRow ? isActiveExplanationRow : undefined}
                  onClick={isInteractiveExplanationRow ? handleSelectExplanationRow : undefined}
                  onKeyDown={isInteractiveExplanationRow ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectExplanationRow();
                    }
                  } : undefined}
                  className={[
                    "grid grid-cols-[168px_minmax(0,1fr)_minmax(0,1fr)] items-start",
                    isLinkedExplanationRow ? "relative border-l-[3px] border-l-sky-300/90 bg-sky-50/35 transition-colors" : "",
                    isInteractiveExplanationRow ? "cursor-pointer hover:bg-sky-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 focus-visible:ring-offset-2" : "",
                    isActiveExplanationRow ? "bg-sky-100/60 shadow-[inset_0_0_0_1px_rgba(125,211,252,0.45)]" : "",
                    isOpen ? "border-y border-indigo-200/80 bg-indigo-50/40" : "",
                  ].join(" ").trim()}
                >
                  <div className={[
                    "min-w-0 px-4 py-3 text-[13px] font-semibold",
                    isLinkedExplanationRow ? "text-slate-900" : "",
                    isOpen ? "text-slate-900" : "text-slate-700",
                  ].join(" ")}>
                    <div className="flex min-h-8 items-start gap-2">
                      <span className={["min-w-0 whitespace-normal [overflow-wrap:break-word] [word-break:keep-all]", isLinkedExplanationRow ? "inline-flex items-center gap-2" : ""].join(" ").trim()}>
                        {isLinkedExplanationRow ? <span className="h-2 w-2 rounded-full bg-sky-400" /> : null}
                        <span>{String(row?.label || "")}</span>
                      </span>
                      {helpContent ? (
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={helpPanelId || undefined}
                          aria-label={String(row?.label || "") + " \uC124\uBA85 \uBCF4\uAE30"}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenHelpKey(isOpen ? null : rowKey);
                          }}
                          className={[
                            "inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[12px] font-semibold transition-colors",
                            isLinkedExplanationRow && !isOpen
                              ? "border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                              : "",
                            isActiveExplanationRow && !isOpen
                              ? "border-sky-400 bg-sky-100 text-sky-800 ring-1 ring-sky-200/80"
                              : "",
                            isOpen
                              ? "border-indigo-400 bg-indigo-100 text-indigo-700 shadow-[0_1px_2px_rgba(99,102,241,0.16)] ring-1 ring-indigo-200/70"
                              : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200",
                          ].join(" ")}
                        >
                          ?
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className={["min-w-0 whitespace-normal px-4 py-3 text-[13px] leading-6 [overflow-wrap:break-word] [word-break:keep-all]", isLinkedExplanationRow ? "text-slate-700" : "text-slate-600"].join(" ")}>
                    {String(row?.current || "")}
                  </div>
                  <div className={["min-w-0 whitespace-normal px-4 py-3 text-[13px] leading-6 [overflow-wrap:break-word] [word-break:keep-all]", isLinkedExplanationRow ? "text-slate-700" : "text-slate-600"].join(" ")}>
                    {String(row?.target || "")}
                  </div>
                </div>
                {Number.isFinite(row?.fitScore) && row.fitScore >= 1 && row.fitScore <= 5 ? (
                  <div className="px-4 pb-2.5 pt-0">
                    <FitBar score={row.fitScore} band={row.fitBand} />
                  </div>
                ) : null}
                {isOpen && helpContent ? (
                  <div
                    id={helpPanelId || undefined}
                    className="border-t border-indigo-100 bg-gradient-to-b from-indigo-50/55 via-white to-white px-4 pb-4 pt-3.5 sm:px-4"
                  >
                    <div className="space-y-4 rounded-[18px] border border-indigo-200/70 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-4 sm:py-4">
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span>{COMPARISON_HELP_SECTION_LABELS.why}</span>
                        </div>
                        <div className="text-[13px] leading-6 text-slate-700">{helpContent.why}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span>{COMPARISON_HELP_SECTION_LABELS.how}</span>
                        </div>
                        <div className="text-[13px] leading-6 text-slate-700">{helpContent.how}</div>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span>면접 질문 예시</span>
                        </div>
                        <div className="text-[13px] leading-6 text-slate-700">{helpContent.interviewQuestion}</div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-2 text-[12px] font-semibold tracking-tight text-slate-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          <span>답변 방향</span>
                        </div>
                        <div className="text-[13px] leading-6 text-slate-700">{helpContent.answerGuide}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {isActiveExplanationRow && linkedPanel ? (
                  <div
                    id="transition-lite-explanation-panel"
                    className="border-t border-sky-100 bg-gradient-to-b from-sky-50/50 via-white to-white px-4 pb-4 pt-3.5"
                  >
                    {linkedPanel.title ? (
                      <div className="mb-2 text-[13px] font-semibold text-slate-900">
                        {String(linkedPanel.title)}
                      </div>
                    ) : null}
                    {linkedPanel.intro ? (
                      <div className="mb-3 text-[13px] leading-relaxed text-slate-600">
                        {String(linkedPanel.intro)}
                      </div>
                    ) : null}
                    <div className="space-y-3">
                      {(() => {
                        const isJobPanel = linkedPanel?.panelKind === "job_role_summary" || linkedPanel?.panelKind === "job_signal_list";
                        const sectionTitle = isJobPanel ? ["현재 직무", "지원 직무"] : ["현재 산업", "지원 산업"];
                        return [
                          { key: "current", tone: "bg-slate-100 text-slate-700 border-slate-200", title: sectionTitle[0], section: linkedPanel.current },
                          { key: "target", tone: "bg-sky-50 text-sky-700 border-sky-200", title: sectionTitle[1], section: linkedPanel.target },
                        ].map(({ key, tone, title, section }) => {
                          const sectionItems = Array.isArray(section?.items) ? section.items.filter(Boolean) : [];
                          const isDecisionStructurePanel = linkedPanel === decisionStructurePanel;
                          const isOperatingContextPanel = linkedPanel === operatingContextPanel;
                          const isJobRoleSummary = linkedPanel?.panelKind === "job_role_summary";
                          const isJobSignalList = linkedPanel?.panelKind === "job_signal_list";
                          const hasDecisionBlocks =
                            isDecisionStructurePanel &&
                            (
                              (Array.isArray(section?.reviewers) && section.reviewers.filter(Boolean).length > 0) ||
                              (Array.isArray(section?.approvalFlow) && section.approvalFlow.filter(Boolean).length > 0) ||
                              (Array.isArray(section?.decisionCriteria) && section.decisionCriteria.filter(Boolean).length > 0)
                            );
                          const hasOperatingContextBlocks =
                            isOperatingContextPanel &&
                            (
                              (Array.isArray(section?.workRhythm) && section.workRhythm.filter(Boolean).length > 0) ||
                              (Array.isArray(section?.constraints) && section.constraints.filter(Boolean).length > 0) ||
                              (Array.isArray(section?.practicalFocus) && section.practicalFocus.filter(Boolean).length > 0)
                            );
                          const isJobScope = linkedPanel?.panelKind === "job_scope_2block";
                          const isJobOutputs = linkedPanel?.panelKind === "job_outputs_2block";
                          const isJobDecisionCriteria2 = linkedPanel?.panelKind === "job_decision_criteria_2block";
                          const hasJobRoleSummary = isJobRoleSummary && (Boolean(String(section?.summary || "").trim()) || (Array.isArray(section?.supportingSignals) && section.supportingSignals.filter(Boolean).length > 0));
                          const hasJobSignals = isJobSignalList && Array.isArray(section?.signals) && section.signals.filter(Boolean).length > 0;
                          const hasJobScope = isJobScope && ((Array.isArray(section?.directOwnership) && section.directOwnership.filter(Boolean).length > 0) || (Array.isArray(section?.expandedResponsibility) && section.expandedResponsibility.filter(Boolean).length > 0));
                          const hasJobOutputs = isJobOutputs && ((Array.isArray(section?.primaryOutputs) && section.primaryOutputs.filter(Boolean).length > 0) || (Array.isArray(section?.performanceOutputs) && section.performanceOutputs.filter(Boolean).length > 0));
                          const hasJobDecisionCriteria2 = isJobDecisionCriteria2 && Array.isArray(section?.coreCriteria) && section.coreCriteria.filter(Boolean).length > 0;
                          if (!hasDecisionBlocks && !hasOperatingContextBlocks && !hasJobRoleSummary && !hasJobSignals && !hasJobScope && !hasJobOutputs && !hasJobDecisionCriteria2 && sectionItems.length === 0) return null;
                          return (
                            <div key={key} className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-[13px] font-semibold text-slate-900">{title}</div>
                                {section?.label ? (
                                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-semibold ${tone}`}>
                                    {String(section.label)}
                                  </span>
                                ) : null}
                              </div>
                              {hasDecisionBlocks ? (
                                <DecisionStructurePanelBlocks section={section} tone={tone} />
                              ) : hasOperatingContextBlocks ? (
                                <OperatingContextPanelBlocks section={section} />
                              ) : hasJobRoleSummary ? (
                                <JobRoleSummaryPanelBlocks section={section} />
                              ) : hasJobOutputs ? (
                                <JobOutputsPanelBlocks section={section} />
                              ) : hasJobScope ? (
                                <JobScopePanelBlocks section={section} />
                              ) : hasJobDecisionCriteria2 ? (
                                <JobDecisionCriteriaPanelBlocks section={section} />
                              ) : hasJobSignals ? (
                                <JobSignalListPanelBlocks section={section} />
                              ) : (
                                <div className="space-y-2 border-l-2 border-sky-100 pl-3">
                                  {sectionItems.map((item, idx) => (
                                    <div key={`${key}_${item?.raw || idx}`} className="rounded-lg border border-slate-200/80 bg-white/90 px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                      <div className="text-[13px] font-semibold text-slate-900">{String(item?.displayLabel || item?.raw || "")}</div>
                                      {item?.shortDescription ? (
                                        <div className="mt-1 text-[13px] leading-relaxed text-slate-500">{String(item.shortDescription)}</div>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TransitionReadCards({ cards = [] }) {
  const safeCards = Array.isArray(cards)
    ? cards.filter(
        (card) =>
          card &&
          typeof card === "object" &&
          (String(card.title || "").trim() || (Array.isArray(card.body) && card.body.filter(Boolean).length > 0))
      )
    : [];

  if (safeCards.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-3">
      {safeCards.map((card, index) => {
        const bodyItems = Array.isArray(card.body) ? card.body.filter(isUsableTransitionReadLine) : [];
        if (!String(card.title || "").trim() && bodyItems.length === 0) return null;

        return (
          <div
            key={`${String(card.key || "card")}_${index}`}
            className="rounded-xl border border-slate-200/80 bg-white/85 px-3 py-3.5 sm:rounded-[20px] sm:bg-slate-50/70 sm:px-5 sm:py-4"
          >
            {String(card.title || "").trim() ? (
              <div className="mb-3.5 text-[14px] font-semibold leading-6 text-slate-900 sm:mb-3 sm:text-[15px]">{String(card.title)}</div>
            ) : null}
            <ListBlock items={bodyItems} compact />
          </div>
        );
      })}
    </div>
  );
}

function MobileSection({ sectionKey, title, isOpen, onToggle, children }) {
  return (
    <>
      <button
        type="button"
        className="flex w-full items-center justify-between px-1 py-4 text-left active:bg-slate-50/70 md:hidden"
        onClick={() => onToggle(sectionKey)}
        aria-expanded={isOpen}
      >
        <span className="text-[17px] font-semibold leading-tight text-slate-900">{title}</span>
        <svg
          className={`ml-2 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200${isOpen ? " rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={isOpen ? undefined : "max-md:hidden"}>
        {children}
      </div>
      {!isOpen && <div className="border-b border-slate-200/70 md:hidden" />}
    </>
  );
}

function SectionCard({
  title,
  children,
  variant = "default",
  titleClassName = "",
  contentClassName = "",
  hideMobileTitle = false,
  printCard = false,
}) {
  const cardClassName =
    variant === "hero"
      ? "rounded-none border-0 border-b border-slate-200/70 bg-transparent shadow-none md:rounded-[24px] md:border md:border-slate-300 md:bg-white md:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
      : variant === "risk"
        ? "rounded-none border-0 border-b border-slate-200/70 bg-transparent shadow-none md:rounded-[24px] md:border md:border-slate-200 md:bg-white md:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
        : variant === "muted"
          ? "rounded-none border-0 border-b border-slate-200/70 bg-transparent shadow-none md:rounded-[24px] md:border md:border-slate-200 md:bg-white md:shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          : variant === "compact"
            ? "rounded-none border-0 border-b border-slate-200/70 bg-transparent shadow-none md:rounded-[22px] md:border md:border-slate-200 md:bg-white"
            : "rounded-none border-0 border-b border-slate-200/70 bg-transparent shadow-none md:rounded-[24px] md:border md:border-slate-200 md:bg-white md:shadow-[0_1px_2px_rgba(15,23,42,0.04)]";

  const headerClassName = hideMobileTitle
    ? "max-md:hidden px-1.5 pb-3 pt-4 md:px-6 md:pb-3 md:pt-6"
    : variant === "hero"
      ? "px-1.5 pb-3 pt-4 md:px-6 md:pb-3 md:pt-6"
      : "px-1.5 pb-3 pt-4 md:px-6 md:pb-3 md:pt-6";

  const contentBaseClassName =
    variant === "compact"
      ? "px-1.5 pb-4.5 pt-0 md:px-5 md:pb-5"
      : "px-1.5 pb-4.5 pt-0 md:px-6 md:pb-6";

  return (
    <Card className={cardClassName} data-print-card={printCard ? "true" : undefined}>
      <CardHeader className={headerClassName}>
        <CardTitle className={titleClassName}>{title}</CardTitle>
      </CardHeader>
      <CardContent className={`${contentBaseClassName} ${contentClassName}`.trim()}>{children}</CardContent>
    </Card>
  );
}

// 임시 비노출 플래그 — true로 바꾸면 즉시 복구
const SHOW_RECOMMENDATION_REVIEW_SECTION = false;
// 자격증 What-if 시뮬레이션 — 맥락 기반 추천 및 Before/After UI 완성 후 true로 변경
const ENABLE_NEWGRAD_CERT_WHAT_IF = false;

const TONE_STYLES = {
  indigo: { badge: "bg-indigo-100 text-indigo-700 border-indigo-200", bar: "bg-indigo-400", ring: "ring-indigo-300" },
  emerald: { badge: "bg-emerald-100 text-emerald-700 border-emerald-200", bar: "bg-emerald-400", ring: "ring-emerald-300" },
  rose: { badge: "bg-rose-100 text-rose-700 border-rose-200", bar: "bg-rose-400", ring: "ring-rose-300" },
  amber: { badge: "bg-amber-100 text-amber-700 border-amber-200", bar: "bg-amber-400", ring: "ring-amber-300" },
  sky: { badge: "bg-sky-100 text-sky-700 border-sky-200", bar: "bg-sky-400", ring: "ring-sky-300" },
  violet: { badge: "bg-violet-100 text-violet-700 border-violet-200", bar: "bg-violet-400", ring: "ring-violet-300" },
};

const WHATIF_RECOMMENDED_ACTIONS = {
  jobStructure: {
    id: "rec_job_structure_project",
    label: "목표 직무 관련 미니 프로젝트 만들기",
    subtitle: "현재 경험이 목표 직무의 실제 산출물과 직접 연결되도록, 작게라도 결과물이 남는 프로젝트를 추가해보세요.",
    impactLabel: "+0.5",
    impactDelta: 0.45,
    defaultSelected: false,
    tone: "indigo",
    isRecommended: true,
    axisImpacts: { jobStructure: 0.3, responsibilityScope: 0.15 },
  },
  industryContext: {
    id: "rec_industry_context_research",
    label: "목표 산업 리서치/사례 분석 정리",
    subtitle: "지원 산업의 고객, 수익 구조, 주요 이슈를 조사해 내 경험과 연결할 근거를 만들어보세요.",
    impactLabel: "+0.4",
    impactDelta: 0.4,
    defaultSelected: false,
    tone: "emerald",
    isRecommended: true,
    axisImpacts: { industryContext: 0.3, jobStructure: 0.1 },
  },
  responsibilityScope: {
    id: "rec_responsibility_portfolio",
    label: "포트폴리오에 결과물·역할 범위 정리하기",
    subtitle: "내가 맡은 역할, 만든 결과물, 판단한 기준을 정리하면 경험의 깊이를 더 잘 보여줄 수 있어요.",
    impactLabel: "+0.4",
    impactDelta: 0.4,
    defaultSelected: false,
    tone: "sky",
    isRecommended: true,
    axisImpacts: { responsibilityScope: 0.3, roleCharacter: 0.1 },
  },
  customerType: {
    id: "rec_customer_problem_case",
    label: "고객·사용자 관점의 문제 해결 사례 만들기",
    subtitle: "목표 직무에서 만나는 고객이나 이해관계자를 기준으로 문제를 정의하고 해결안을 정리해보세요.",
    impactLabel: "+0.4",
    impactDelta: 0.4,
    defaultSelected: false,
    tone: "amber",
    isRecommended: true,
    axisImpacts: { customerType: 0.3, responsibilityScope: 0.1 },
  },
  roleCharacter: {
    id: "rec_role_character_case",
    label: "업무 성향을 증명할 사례 정리하기",
    subtitle: "강점이나 업무 스타일을 말로만 쓰기보다, 실제 행동 사례와 결과로 보여줄 수 있게 정리해보세요.",
    impactLabel: "+0.4",
    impactDelta: 0.4,
    defaultSelected: false,
    tone: "violet",
    isRecommended: true,
    axisImpacts: { roleCharacter: 0.3, responsibilityScope: 0.1 },
  },
};
const WHATIF_AXIS_PRIORITY = ["jobStructure", "industryContext", "responsibilityScope", "customerType", "roleCharacter"];

const WHATIF_COPY_BY_CATEGORY = {
  IT_DATA_DIGITAL: {
    jobStructure: {
      subtitle: "데이터 분석·개발·기획 관련 개인 프로젝트나 인턴 경험을 JD 핵심 역할과 연결해 정리하세요.",
    },
    industryContext: {
      subtitle: "IT·플랫폼·SaaS 산업의 비즈니스 모델과 기술 스택을 조사해 정리한 자료를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "사이드 프로젝트나 팀 협업에서 요구사항 정의, 일정 관리, 배포까지 주도한 경험을 문서화하세요.",
    },
    customerType: {
      subtitle: "사용자 인터뷰, 리서치, 또는 내부 발표를 통해 이해관계자 소통 역량을 입증하는 경험을 추가하세요.",
    },
    roleCharacter: {
      subtitle: "SQL 쿼리, 데이터 시각화, A/B 테스트 결과 등 수치 기반 분석을 포트폴리오에 포함하세요.",
    },
  },
  MARKETING: {
    jobStructure: {
      subtitle: "캠페인 기획·SNS 운영·콘텐츠 마케팅 등 실제 지표가 포함된 경험을 목표 직무 역할과 연결해 정리하세요.",
    },
    industryContext: {
      subtitle: "목표 산업의 소비자 행동, 경쟁사 포지셔닝, 채널 믹스를 분석한 리포트나 케이스 스터디를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "마케팅 캠페인의 기획부터 성과 측정까지 주도한 경험이나 콘텐츠 일정·예산 관리 경험을 구체화하세요.",
    },
    customerType: {
      subtitle: "소비자 설문, 사용자 인터뷰, 리뷰 분석 등 고객 인사이트를 수집·해석한 경험을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "CTR, 전환율, ROAS 등 마케팅 핵심 지표로 캠페인 성과를 숫자로 설명할 자료를 추가하세요.",
    },
  },
  FINANCE_ACCOUNTING: {
    jobStructure: {
      subtitle: "재무제표 분석, 원가 계산, 예산 수립 관련 실습이나 인턴 경험을 JD 핵심 역할과 연결하세요.",
    },
    industryContext: {
      subtitle: "금융·회계 규정이나 산업별 재무 특성을 학습한 리포트 자료를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "엑셀 모델링, 결산 보조, 내부 감사 지원 등 전체 프로세스에 기여한 경험을 중심으로 정리하세요.",
    },
    customerType: {
      subtitle: "경영진, 타부서, 외부 감사인 등 이해관계자에게 재무 데이터를 보고하거나 설명한 경험을 구체화하세요.",
    },
    roleCharacter: {
      subtitle: "전산회계·세무 자격증, 재무 모델링, ERP/SAP 실습 등 실무 도구 활용 근거를 추가하세요.",
    },
  },
  MANUFACTURING_QUALITY_PRODUCTION: {
    jobStructure: {
      subtitle: "생산 공정, 품질 검사, 설비 관리 관련 현장 실습이나 인턴 경험을 JD 핵심 요건에 맞춰 구체화하세요.",
    },
    industryContext: {
      subtitle: "목표 산업군의 생산 방식, 품질 기준, 인증 규격을 조사해 산업 이해 근거로 정리하세요.",
    },
    responsibilityScope: {
      subtitle: "품질 개선 제안, 불량률 감소 프로젝트, 공정 표준화에 기여한 경험을 문서화하세요.",
    },
    customerType: {
      subtitle: "협력업체, 구매팀, 고객 QA 담당자와 소통한 경험이나 현장 감사·내부 검증 활동을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "SPC, FMEA, 8D 등 품질 방법론 적용 경험이나 관련 자격·교육 이수 내용을 추가하세요.",
    },
  },
  RESEARCH_PROFESSIONAL: {
    jobStructure: {
      subtitle: "연구 보조, 논문 발표, 학회 참여 등 전문 연구 역할을 JD 요구사항과 연결해 서술하세요.",
    },
    industryContext: {
      subtitle: "목표 기업의 R&D 파이프라인, 기술 트렌드, 특허 현황을 조사하고 분석 자료를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "실험 설계, 데이터 수집, 보고서 작성을 처음부터 끝까지 수행한 연구 프로젝트 경험을 구체화하세요.",
    },
    customerType: {
      subtitle: "내부 발표, 논문 리뷰, 산학 협업 등 전문가·이해관계자와 소통한 경험을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "R, Python, MATLAB, 실험 장비 등 핵심 도구 활용 역량과 논문·보고서 기여 실적을 정리하세요.",
    },
  },
  BUSINESS: {
    jobStructure: {
      subtitle: "사업기획, 전략 수립, 시장 조사, 운영 개선 경험을 목표 직무의 핵심 역할과 연결해 정리하세요.",
    },
    industryContext: {
      subtitle: "목표 산업의 수익 구조, 경쟁 구도, 주요 고객군을 분석한 자료를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "프로젝트 기획부터 실행·성과 점검까지 맡았던 경험을 단계별로 문서화하세요.",
    },
    customerType: {
      subtitle: "내부 부서, 외부 파트너, 고객사와 협의하며 문제를 조율한 경험을 구체화하세요.",
    },
    roleCharacter: {
      subtitle: "엑셀 분석, 리서치, 보고서 작성, 의사결정 지원 경험을 결과 중심으로 정리하세요.",
    },
  },
  SALES: {
    jobStructure: {
      subtitle: "영업, 제안, 고객 응대, 리드 발굴 경험을 목표 직무의 매출·고객관리 역할과 연결하세요.",
    },
    industryContext: {
      subtitle: "목표 산업의 고객 구매 기준, 영업 채널, 경쟁사 제안 방식을 조사해 정리하세요.",
    },
    responsibilityScope: {
      subtitle: "상담, 제안, 계약, 사후관리 중 직접 맡았던 범위와 성과를 구체적으로 문서화하세요.",
    },
    customerType: {
      subtitle: "개인 고객, 기업 고객, 파트너사 등 실제 상대했던 고객 유형과 커뮤니케이션 방식을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "전환율, 재구매, 계약 건수, 고객 만족도 등 영업 성과를 숫자로 설명할 자료를 추가하세요.",
    },
  },
  DESIGN: {
    jobStructure: {
      subtitle: "UX/UI, 콘텐츠, 브랜드, 시각 디자인 작업을 목표 직무의 산출물 기준과 연결해 정리하세요.",
    },
    industryContext: {
      subtitle: "목표 산업의 사용자 경험, 브랜드 톤, 디자인 트렌드를 분석한 레퍼런스 자료를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "문제 정의, 시안 제작, 피드백 반영, 최종 산출물 완성까지의 과정을 포트폴리오에 담으세요.",
    },
    customerType: {
      subtitle: "사용자, 클라이언트, 기획자, 개발자와 협업하며 디자인 의도를 설명한 경험을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "Figma, Photoshop, Illustrator 등 디자인 도구 활용과 결과물 개선 근거를 함께 정리하세요.",
    },
  },
  HR_ORGANIZATION: {
    jobStructure: {
      subtitle: "채용, 교육, 평가, 조직문화 관련 경험을 목표 HR 직무의 핵심 역할과 연결해 정리하세요.",
    },
    industryContext: {
      subtitle: "목표 산업의 인재상, 조직 구조, 채용 방식, 직무별 인력 수요를 조사한 자료를 준비하세요.",
    },
    responsibilityScope: {
      subtitle: "채용 운영, 교육 기획, 구성원 커뮤니케이션 등 직접 맡은 업무 범위와 결과를 문서화하세요.",
    },
    customerType: {
      subtitle: "지원자, 구성원, 현업 부서, 외부 교육기관 등 HR 이해관계자와 소통한 경험을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "면접 운영, 교육 만족도, 채용 전환율, 조직문화 설문 등 HR 지표를 다룬 경험을 정리하세요.",
    },
  },
  CUSTOMER_OPERATIONS: {
    jobStructure: {
      subtitle: "고객 응대, 운영 관리, CS 개선, 서비스 품질 관리 경험을 목표 직무 역할과 연결하세요.",
    },
    industryContext: {
      subtitle: "목표 산업의 고객 여정, 문의 유형, 운영 프로세스, 서비스 품질 기준을 조사해 정리하세요.",
    },
    responsibilityScope: {
      subtitle: "문의 접수부터 문제 해결, 재발 방지, 프로세스 개선까지 맡았던 범위를 구체화하세요.",
    },
    customerType: {
      subtitle: "일반 고객, VIP 고객, B2B 고객, 내부 운영팀 등 상대했던 고객·이해관계자 유형을 강조하세요.",
    },
    roleCharacter: {
      subtitle: "응답률, 해결률, 만족도 등 CS·운영 성과를 수치로 정리할 자료를 추가하세요.",
    },
  },
};

function buildRecommendedWhatIfActions(currentAxisScores) {
  const recs = [];
  for (const axisKey of WHATIF_AXIS_PRIORITY) {
    if ((currentAxisScores?.[axisKey] ?? 3) <= 2) {
      const action = WHATIF_RECOMMENDED_ACTIONS[axisKey];
      if (action) recs.push({ ...action, axisKey });
      if (recs.length >= 3) break;
    }
  }
  return recs;
}

function applyWhatIfCategoryCopy(action, jobMajorCategory) {
  const categoryKey = String(jobMajorCategory || "").trim();
  const override = WHATIF_COPY_BY_CATEGORY[categoryKey]?.[action.axisKey];
  if (!override) return action;
  return { ...action, ...override };
}

const MAX_WHATIF_SELECTIONS = 2;

function NewgradWhatIfPreparationSection({ pack, jobMajorCategory = "" }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [otherActionsOpen, setOtherActionsOpen] = useState(false);
  const [selectionLimitMessage, setSelectionLimitMessage] = useState("");
  function toggleAction(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setSelectionLimitMessage("");
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_WHATIF_SELECTIONS) {
        setSelectionLimitMessage("준비 항목은 최대 2개까지만 선택해 비교할 수 있어요.");
        return prev;
      }
      setSelectionLimitMessage("");
      return [...prev, id];
    });
  }

  const recommendedActions = buildRecommendedWhatIfActions(pack.currentAxisScores).map((action) =>
    applyWhatIfCategoryCopy(action, jobMajorCategory)
  );
  const allActions = [...recommendedActions, ...pack.actions];
  const mergedPack = { ...pack, actions: allActions };
  const preview = computeNewgradPreparationWhatIfPreview({ selectedActionIds: selectedIds, pack: mergedPack });
  const hasSelection = selectedIds.length > 0;
  const hasRecommendedActions = recommendedActions.length > 0;
  const shouldShowStandardActions = !hasRecommendedActions || otherActionsOpen;

  const beforeAvgDisplay = preview.beforeAvg.toFixed(1);
  const afterAvgDisplay = preview.afterAvg.toFixed(1);
  const deltaDisplay = preview.delta > 0 ? `+${preview.delta.toFixed(1)}` : preview.delta.toFixed(1);

  // compact radar
  const S = 300, CX = 150, CY = 138, R = 90, LR = 118;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  const pt = (i, ratio) => [
    CX + R * ratio * Math.cos(ang(i)),
    CY + R * ratio * Math.sin(ang(i)),
  ];
  const polyStr = (rs) =>
    rs.map((r, i) => pt(i, r).map((v) => v.toFixed(1)).join(",")).join(" ");
  const GRIDS = [0.2, 0.4, 0.6, 0.8, 1.0];

  const beforeRatios = pack.axisKeys.map((k) => (preview.perAxis[k]?.before ?? 3) / 5);
  const afterRatios = pack.axisKeys.map((k) => Math.min(1, (preview.perAxis[k]?.after ?? 3) / 5));
  const shortLabels = pack.axisKeys.map((k) => pack.axisShortLabels[k] ?? k);

  const maxBarDelta = Math.max(...allActions.map((a) => a.impactDelta), 0.1);

  return (
    <section className="mb-7 sm:mb-6">
      <div className="rounded-[20px] border border-purple-200 bg-white px-4 py-5 sm:px-6 sm:py-6 shadow-sm">
        {/* header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div>
              <h2 className="text-[18px] font-bold leading-tight text-slate-900 sm:text-[20px]">
                What-if 시뮬레이션
              </h2>
              <p className="mt-0.5 text-[13px] leading-[1.6] text-slate-500 sm:text-[14px]">
                준비 행동을 추가했을 때 직무 적합도 변화와 보완 가능성을 미리 확인해보세요.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[13px] font-medium text-slate-600 hover:bg-slate-100"
          >
            {guideOpen ? "사용법 접기" : "사용법 보기"}
          </button>
        </div>

        {/* guide card */}
        {guideOpen && (
          <div className="mt-3 mb-4 rounded-2xl border border-purple-100 bg-purple-50/70 p-4 text-[13px] leading-[1.65] text-slate-700 sm:text-[14px]">
            <p className="text-[14px] font-semibold text-slate-900 sm:text-[15px]">What-if는 준비 후 변화를 비교하는 기능입니다</p>
            <p className="mt-1 text-[13px] leading-[1.6] text-slate-600 sm:text-[14px]">
              합격 예측이 아니라, 지금 부족한 부분을 어떤 준비로 보완할 수 있는지 비교합니다.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {[
                ["1", "준비 선택", "해볼 수 있는 준비를 선택합니다."],
                ["2", "변화 확인", "Before / 예상 후 점수 변화를 봅니다."],
                ["3", "보완축 확인", "어떤 축이 오르는지 확인합니다."],
              ].map(([step, title, body]) => (
                <div key={step} className="rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-[12px] font-bold text-purple-700">
                    {step}
                  </span>
                  <p className="mt-2 text-[13px] font-semibold text-slate-900 sm:text-[14px]">{title}</p>
                  <p className="mt-1 text-[12px] leading-[1.5] text-slate-600 sm:text-[13px]">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-slate-200 bg-white/90 p-3">
              <p className="text-[13px] font-semibold text-slate-900 sm:text-[14px]">숫자는 이렇게 보세요</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700 sm:text-[13px]">+0.7 = 예상 개선폭</p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700 sm:text-[13px]">보라색 = 준비 후 변화</p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700 sm:text-[13px]">많이 오른 축 = 보완 효과가 큰 영역</p>
              </div>
            </div>
            <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[12px] leading-[1.55] text-amber-800 sm:text-[13px]">
              주의: 이 결과는 합격 가능성이나 서류 통과 확률이 아니라, 현재 입력값 기준의 보완 방향 참고용입니다.
            </p>
          </div>
        )}

        {/* 2-column body */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 sm:gap-5">
          {/* left: action list */}
          <div>
            <p className="mb-2.5 text-[14px] font-semibold text-slate-700">
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[12px] font-bold text-slate-600">1</span>
              가정 추가하기
            </p>
            {recommendedActions.length > 0 && (
              <div className="mb-3 rounded-xl border border-violet-200 bg-violet-50/60 px-3.5 py-3">
                <p className="mb-0.5 text-[12px] font-bold text-violet-700">추천 준비 항목</p>
                <p className="mb-2.5 text-[11px] leading-[1.55] text-violet-500">
                  부족한 축을 보완하기 위한 준비 항목입니다. 1~2개를 선택해 예상 변화를 확인해보세요.
                </p>
                <div className="flex flex-col gap-2">
                  {recommendedActions.map((action) => {
                    const selected = selectedIds.includes(action.id);
                    const ts = TONE_STYLES[action.tone] ?? TONE_STYLES.indigo;
                    return (
                      <div key={action.id}>
                        <button
                          type="button"
                          onClick={() => toggleAction(action.id)}
                          className={[
                            "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
                            selected
                              ? `border-current ${ts.badge} ring-1 ${ts.ring}`
                              : "border-slate-200 bg-white hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[11px] font-bold transition-colors",
                              selected ? "border-current bg-white text-current" : "border-slate-300 bg-white text-transparent",
                            ].join(" ")}
                          >
                            {selected ? "✓" : ""}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-semibold leading-tight text-slate-800">
                              {action.label}
                            </span>
                            <span className="block text-[12px] text-slate-500">{action.subtitle}</span>
                          </span>
                          <span className={[
                            "shrink-0 rounded-full border px-2 py-0.5 text-[12px] font-bold",
                            ts.badge,
                          ].join(" ")}>
                            {action.impactLabel}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {selectionLimitMessage && (
              <p className="mt-2 text-[11px] font-medium text-amber-600">
                {selectionLimitMessage}
              </p>
            )}
            {hasRecommendedActions ? (
              <button
                type="button"
                onClick={() => setOtherActionsOpen((v) => !v)}
                className="mt-1 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[12px] font-semibold text-slate-500 transition-colors hover:bg-slate-100"
              >
                <span>{otherActionsOpen ? "기타 준비 항목 접기" : "기타 준비 항목 보기"}</span>
                <span className="text-slate-400 text-[10px]">{otherActionsOpen ? "▲" : "▼"}</span>
              </button>
            ) : (
              <p className="mb-2 text-[12px] font-semibold text-slate-500">기타 준비 항목</p>
            )}
            {shouldShowStandardActions && (
              <div className="mt-2 flex flex-col gap-2">
                {pack.actions.map((action) => {
                  const selected = selectedIds.includes(action.id);
                  const ts = TONE_STYLES[action.tone] ?? TONE_STYLES.indigo;
                  return (
                    <div key={action.id}>
                      <button
                        type="button"
                        onClick={() => toggleAction(action.id)}
                        className={[
                          "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all",
                          selected
                            ? `border-current ${ts.badge} ring-1 ${ts.ring}`
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-[11px] font-bold transition-colors",
                            selected ? "border-current bg-white text-current" : "border-slate-300 bg-white text-transparent",
                          ].join(" ")}
                        >
                          {selected ? "✓" : ""}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-semibold leading-tight text-slate-800">
                            {action.label}
                          </span>
                          <span className="block text-[12px] text-slate-500">{action.subtitle}</span>
                        </span>
                        <span className={[
                          "shrink-0 rounded-full border px-2 py-0.5 text-[12px] font-bold",
                          ts.badge,
                        ].join(" ")}>
                          {action.impactLabel}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* right: results */}
          <div className="flex flex-col gap-3">
            <p className="mb-0.5 text-[14px] font-semibold text-slate-700">
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[12px] font-bold text-slate-600">2</span>
              예상 변화 결과
            </p>

            {/* before / after score cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                <p className="text-[12px] font-medium text-slate-500 mb-1">Before</p>
                <p className="text-[26px] font-bold text-slate-700 leading-none">{beforeAvgDisplay}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">/ 5.0</p>
              </div>
              <div className={[
                "rounded-xl border px-3 py-3 text-center",
                hasSelection ? "border-purple-200 bg-purple-50" : "border-slate-200 bg-slate-50",
              ].join(" ")}>
                <p className="text-[12px] font-medium text-slate-500 mb-1">
                  예상 후
                  {hasSelection && (
                    <span className="ml-1 font-bold text-purple-600">{deltaDisplay}</span>
                  )}
                </p>
                <p className={[
                  "text-[26px] font-bold leading-none",
                  hasSelection ? "text-purple-700" : "text-slate-400",
                ].join(" ")}>
                  {hasSelection ? afterAvgDisplay : "-"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">/ 5.0</p>
                {hasSelection && (
                  <p className="text-[10px] text-purple-300 mt-0.5">참고 시뮬레이션</p>
                )}
              </div>
            </div>

            {/* compact radar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-2 py-3 flex justify-center">
              <svg viewBox={`0 0 ${S} ${S - 20}`} width="100%" style={{ maxWidth: 260 }} aria-hidden="true">
                {GRIDS.map((g) => (
                  <polygon key={g} points={polyStr([g, g, g, g, g])} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                ))}
                {[0, 1, 2, 3, 4].map((i) => {
                  const [x2, y2] = pt(i, 1.0);
                  return <line key={i} x1={CX} y1={CY} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="#e2e8f0" strokeWidth="1" />;
                })}
                <polygon points={polyStr(beforeRatios)} fill="rgba(148,163,184,0.18)" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
                {hasSelection && (
                  <polygon points={polyStr(afterRatios)} fill="rgba(147,51,234,0.14)" stroke="#9333ea" strokeWidth="2" strokeLinejoin="round" />
                )}
                {shortLabels.map((label, i) => {
                  const [lx, ly] = pt(i, LR / R);
                  return (
                    <text
                      key={label}
                      x={lx.toFixed(1)}
                      y={ly.toFixed(1)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fill="#111827"
                      fontFamily="sans-serif"
                    >
                      {label}
                    </text>
                  );
                })}
                {/* legend */}
                <rect x="8" y={S - 34} width="10" height="3" rx="1.5" fill="#94a3b8" />
                <text x="22" y={S - 31} fontSize="10" fill="#94a3b8" fontFamily="sans-serif">현재</text>
                <rect x="50" y={S - 34} width="10" height="3" rx="1.5" fill="#9333ea" />
                <text x="64" y={S - 31} fontSize="10" fill="#9333ea" fontFamily="sans-serif">가정 적용 후</text>
              </svg>
            </div>

            {/* breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
              <p className="text-[12px] font-semibold text-slate-600 mb-2">영향도 Breakdown</p>
              {!hasSelection ? (
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  준비 행동을 선택하면 예상 보완 효과가 표시됩니다.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {allActions
                    .filter((a) => selectedIds.includes(a.id))
                    .map((action) => {
                      const ts = TONE_STYLES[action.tone] ?? TONE_STYLES.indigo;
                      const pct = Math.round((action.impactDelta / maxBarDelta) * 100);
                      return (
                        <div key={action.id}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[12px] text-slate-600 truncate">{action.label}</span>
                            <span className={[
                              "ml-2 shrink-0 rounded-full border px-1.5 py-px text-[11px] font-bold",
                              ts.badge,
                            ].join(" ")}>
                              {action.impactLabel}
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${ts.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* disclaimer */}
        <p className="mt-4 text-[12px] leading-[1.65] text-slate-500 font-medium">
          실제 합격률을 보장하는 수치는 아니며, 현재 입력값 기준으로 어떤 준비 행동이 어느 축을 보완할 가능성이 큰지 보여주는 참고 시뮬레이션입니다.
        </p>
      </div>
    </section>
  );
}

const WHATIF_PRESETS = [
  { label: "ADsP", displayName: "ADsP" },
  { label: "SQLD", displayName: "SQLD" },
  { label: "GA4", displayName: "GA4" },
  { label: "컴퓨터활용능력 1급", displayName: "컴활 1급" },
  { label: "전산회계 1급", displayName: "전산회계 1급" },
];

function WhatIfCertSection({ sourceInput, baseVm }) {
  const [selectedCert, setSelectedCert] = useState(null);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState(null);

  function handleSelectCert(preset) {
    if (isRunning) return;
    if (selectedCert?.label === preset.label && whatIfResult) return;
    setSelectedCert(preset);
    setWhatIfResult(null);
    setRunError(null);
    setIsRunning(true);
    try {
      const { delta, error } = buildNewgradWhatIfSimulation({
        baseInput: sourceInput,
        baseVm,
        virtualCert: { label: preset.label },
      });
      if (error) {
        setRunError(error);
      } else {
        setWhatIfResult(delta);
      }
    } catch (e) {
      setRunError(e?.message || "simulation_error");
    } finally {
      setIsRunning(false);
    }
  }

  const summaryColorMap = {
    "도움 있음": "text-emerald-700",
    "변화 작음": "text-amber-700",
    "거의 변화 없음": "text-slate-500",
  };

  const bandLabel = (band) => {
    const map = { very_low: "매우 낮음", low: "낮음", mid: "보통", mid_high: "높음", high: "매우 높음" };
    return map[band] || band;
  };

  return (
    <section className="mb-7 sm:mb-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <p className="text-[13px] font-semibold text-slate-800 mb-1">자격증을 추가하면 결과가 바뀔까요?</p>
        <p className="text-[12px] text-slate-500 mb-4 leading-relaxed">
          가상으로 자격증을 추가해 보완 신호를 미리 확인합니다. 실제 저장·분석 결과는 변하지 않습니다.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {WHATIF_PRESETS.map((preset) => {
            const isActive = selectedCert?.label === preset.label;
            return (
              <button
                key={preset.label}
                onClick={() => handleSelectCert(preset)}
                disabled={isRunning}
                className={[
                  "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  isActive
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500",
                  isRunning ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                ].join(" ")}
              >
                {preset.displayName}
              </button>
            );
          })}
        </div>

        {isRunning && (
          <p className="text-[12px] text-slate-400">시뮬레이션 중...</p>
        )}

        {runError && !isRunning && (
          <p className="text-[12px] text-red-500">시뮬레이션 중 오류가 발생했습니다.</p>
        )}

        {whatIfResult && !isRunning && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-600">영향 요약:</span>
              <span className={["text-[13px] font-bold", summaryColorMap[whatIfResult.summaryLabel] || "text-slate-700"].join(" ")}>
                {whatIfResult.summaryLabel}
              </span>
            </div>

            {whatIfResult.changedAxes.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-slate-600 mb-2">변화하는 축</p>
                <div className="space-y-2">
                  {whatIfResult.changedAxes.map((ax) => (
                    <div key={ax.axisKey} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-[12px]">
                      <span className="text-slate-700 font-medium">{ax.label}</span>
                      <span className="text-slate-500">
                        {bandLabel(ax.beforeBand)} → <span className="font-semibold text-slate-800">{bandLabel(ax.afterBand)}</span>
                        {ax.delta !== 0 && (
                          <span className={ax.delta > 0 ? "text-emerald-600 ml-1" : "text-red-500 ml-1"}>
                            ({ax.delta > 0 ? "+" : ""}{ax.delta})
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {whatIfResult.helpedParts.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-slate-600 mb-1">설명상 보완</p>
                <p className="text-[12px] text-slate-500">
                  {whatIfResult.helpedParts.map((p) => p.label).join(", ")} 축의 근거 설명이 보완됩니다.
                </p>
              </div>
            )}

            {whatIfResult.unchangedParts.length > 0 && (
              <div>
                <p className="text-[12px] font-semibold text-slate-600 mb-1">그대로 남는 부분</p>
                <p className="text-[12px] text-slate-500">
                  {whatIfResult.unchangedParts.map((p) => p.label).join(", ")}
                </p>
              </div>
            )}

            <div className="rounded-lg bg-slate-50 px-4 py-3">
              <p className="text-[12px] font-semibold text-slate-700 mb-1">추천 다음 행동</p>
              <p className="text-[12px] text-slate-600 leading-relaxed">{whatIfResult.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AiEvidenceChip({ strength }) {
  const map = { high: "bg-emerald-100 text-emerald-800", medium: "bg-amber-100 text-amber-800", low: "bg-slate-100 text-slate-600" };
  const label = { high: "높음", medium: "보통", low: "낮음" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${map[strength] ?? map.medium}`}>
      {label[strength] ?? strength}
    </span>
  );
}

function AiEvidenceList({ items = [], emptyText = "확인된 내용 없음" }) {
  if (!items || items.length === 0) return <p className="text-sm text-slate-400">{emptyText}</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span className="text-sm leading-[1.75] text-slate-700">{typeof item === "string" ? item : String(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function AiEvidenceLoadingCard() {
  return (
    <Card className="mb-6 border border-indigo-100 bg-indigo-50/40" data-print-hidden="true">
      <CardContent className="py-5 px-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="inline-block mt-0.5 w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" aria-hidden="true" />
          <div>
            <p className="text-[13px] font-medium text-slate-800">AI가 직무·산업 전환 포인트를 분석 중입니다.</p>
            <p className="mt-0.5 text-[12px] leading-[1.65] text-slate-500">약 10초 정도 걸릴 수 있습니다. 분석이 끝나면 이력서·면접 준비 포인트를 먼저 보여드립니다.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AiEvidenceErrorNote() {
  return (
    <p className="mb-5 text-[12px] text-slate-400" data-print-hidden="true">
      AI 심화 분석은 일시적으로 불러오지 못했습니다. 기본 리포트를 먼저 보여드립니다.
    </p>
  );
}

function CareerFitAiEvidenceSection({ evidence }) {
  const [expanded, setExpanded] = useState(false);
  if (!evidence) return null;

  const hasBridgeable = Array.isArray(evidence.bridgeableExperienceTypes) && evidence.bridgeableExperienceTypes.some((e) => e.label);
  const hasMissing = Array.isArray(evidence.missingProofPoints) && evidence.missingProofPoints.some((e) => e.proofPoint);
  const hasIndustryContext = evidence.industryJobContext?.summary;
  const hasResumeFocus = evidence.resumeFocus && (
    (evidence.resumeFocus.emphasize?.length > 0) ||
    (evidence.resumeFocus.rewriteDirection?.length > 0)
  );
  const hasRephrase = Array.isArray(evidence.rephraseExamples) && evidence.rephraseExamples.some((e) => e.original && e.reframed);
  const hasInterview = Array.isArray(evidence.interviewQuestions) && evidence.interviewQuestions.length > 0;
  const hasCaution = Array.isArray(evidence.cautionNotes) && evidence.cautionNotes.length > 0;

  return (
    <section className="space-y-3" data-print-hidden="true">
      <Card className="overflow-hidden rounded-[20px] border-slate-200 shadow-[0_1px_4px_rgba(15,23,42,0.06)]">
        <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-[15px] font-semibold text-slate-900">
              AI 전환 준비 포인트
            </CardTitle>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="shrink-0 rounded-full px-3 py-1 text-[12px] font-medium text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              {expanded ? "접기" : "펼치기"}
            </button>
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-0.5 text-[11px] font-medium text-indigo-600">
              AI 분석 · 선택한 직무·산업 조합 기준
            </span>
          </div>
          <p className="mt-1.5 text-[12px] leading-[1.65] text-slate-400">
            개인 경력은 분석에 포함되지 않습니다.
          </p>
          {evidence.summary && (
            <p className="mt-1.5 text-sm leading-[1.75] text-slate-600">{evidence.summary}</p>
          )}
          {evidence.transitionInterpretation && (
            <p className="mt-1 text-[13px] leading-[1.7] text-slate-500">{evidence.transitionInterpretation}</p>
          )}
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-5 pb-5 px-5 sm:px-6">
            {hasBridgeable && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">이력서에 갖추면 좋은 경험 유형</h4>
                <div className="space-y-2.5">
                  {evidence.bridgeableExperienceTypes.filter((e) => e.label).map((item, i) => (
                    <div key={i} className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                      <div className="text-[12.5px] font-semibold text-indigo-700 mb-1">{item.label}</div>
                      {item.whyItMatters && (
                        <p className="text-sm leading-[1.7] text-slate-700">{item.whyItMatters}</p>
                      )}
                      {item.resumeSignal && (
                        <p className="mt-1.5 text-[12.5px] leading-[1.65] text-slate-500">→ {item.resumeSignal}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasMissing && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">이력서·면접에서 추가로 확인될 포인트</h4>
                <div className="space-y-2">
                  {evidence.missingProofPoints.filter((e) => e.proofPoint).map((item, i) => (
                    <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/50 px-4 py-3">
                      <p className="text-sm font-medium leading-[1.7] text-slate-800">{item.proofPoint}</p>
                      {item.whyItMatters && (
                        <p className="mt-1 text-[12.5px] leading-[1.65] text-slate-500">{item.whyItMatters}</p>
                      )}
                      {item.howToPrepare && (
                        <p className="mt-1.5 text-[12.5px] leading-[1.65] text-emerald-700 font-medium">준비: {item.howToPrepare}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasIndustryContext && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">목표 직무가 이 산업에서 읽히는 방식</h4>
                <div className="rounded-xl border border-sky-100 bg-sky-50/50 px-4 py-3">
                  <p className="text-sm leading-[1.75] text-slate-700">{evidence.industryJobContext.summary}</p>
                  {evidence.industryJobContext.stakeholders?.length > 0 && (
                    <div className="mt-2.5">
                      <div className="text-[12px] font-semibold text-slate-500 mb-1.5">주요 이해관계자</div>
                      <AiEvidenceList items={evidence.industryJobContext.stakeholders} />
                    </div>
                  )}
                  {evidence.industryJobContext.decisionCriteria?.length > 0 && (
                    <div className="mt-2.5">
                      <div className="text-[12px] font-semibold text-slate-500 mb-1.5">의사결정 기준</div>
                      <AiEvidenceList items={evidence.industryJobContext.decisionCriteria} />
                    </div>
                  )}
                  {evidence.industryJobContext.riskContext?.length > 0 && (
                    <div className="mt-2.5">
                      <div className="text-[12px] font-semibold text-slate-500 mb-1.5">전환 리스크 맥락</div>
                      <AiEvidenceList items={evidence.industryJobContext.riskContext} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasResumeFocus && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">이력서 구성 방향</h4>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 space-y-2.5">
                  {evidence.resumeFocus.emphasize?.length > 0 && (
                    <div>
                      <div className="text-[12px] font-semibold text-slate-500 mb-1.5">강조할 경험 유형</div>
                      <AiEvidenceList items={evidence.resumeFocus.emphasize} />
                    </div>
                  )}
                  {evidence.resumeFocus.deemphasize?.length > 0 && (
                    <div>
                      <div className="text-[12px] font-semibold text-slate-500 mb-1.5">덜 강조해도 되는 항목</div>
                      <AiEvidenceList items={evidence.resumeFocus.deemphasize} />
                    </div>
                  )}
                  {evidence.resumeFocus.rewriteDirection?.length > 0 && (
                    <div>
                      <div className="text-[12px] font-semibold text-slate-500 mb-1.5">재작성 방향</div>
                      <AiEvidenceList items={evidence.resumeFocus.rewriteDirection} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {hasRephrase && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">현재 직무 경험을 목표 직무 언어로</h4>
                <div className="space-y-2">
                  {evidence.rephraseExamples.filter((e) => e.original && e.reframed).map((item, i) => (
                    <div key={i} className="rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
                      <div className="flex items-start gap-2 text-[12.5px]">
                        <span className="shrink-0 mt-px font-medium text-slate-400">Before</span>
                        <span className="text-slate-600 leading-[1.65]">{item.original}</span>
                      </div>
                      <div className="flex items-start gap-2 text-[12.5px] mt-1.5">
                        <span className="shrink-0 mt-px font-semibold text-violet-600">After</span>
                        <span className="text-slate-800 leading-[1.65] font-medium">{item.reframed}</span>
                      </div>
                      {item.why && (
                        <p className="mt-1.5 text-[12px] leading-[1.6] text-slate-400">{item.why}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasInterview && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">면접 예상 질문</h4>
                <AiEvidenceList items={evidence.interviewQuestions} />
              </div>
            )}

            {hasCaution && (
              <div>
                <h4 className="mb-2.5 text-[13px] font-semibold text-slate-800">이 전환에서 주의할 맥락</h4>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                  <AiEvidenceList items={evidence.cautionNotes} />
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </section>
  );
}

export default function TransitionLiteResult({ viewModel, sourceInput }) {
  const vm = viewModel && typeof viewModel === "object" ? viewModel : {};
  const [resumeSheetOpen, setResumeSheetOpen] = useState(false);
  const [expandedAxisKey, setExpandedAxisKey] = useState(null);

  const axisPack = vm.axisPack && typeof vm.axisPack === "object" ? vm.axisPack : null;
  const isNewgradReport = Boolean(axisPack && typeof axisPack.version === "string" && axisPack.version.startsWith("newgrad"));
  const axisEntries = axisPack && axisPack.axes && typeof axisPack.axes === "object"
    ? [
        axisPack.axes.jobStructure,
        axisPack.axes.industryContext,
        axisPack.axes.responsibilityScope,
        axisPack.axes.customerType,
        axisPack.axes.roleCharacter,
      ].filter(Boolean)
    : [];
  const shouldShowConsultingCta = !isNewgradReport || Boolean(axisPack);

  function getAxisTone(label, band) {
    const safeLabel = typeof label === "string" ? label : "";
    const safeBand = typeof band === "string" ? band : "";

    if (safeLabel === "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131") {
      if (safeBand === "high") return "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB9E4\uC6B0 \uB192\uC544 \uD604\uC7AC \uACBD\uB85C\uAC00 \uBAA9\uD45C \uC2DC\uC7A5\uACFC \uAC15\uD558\uAC8C \uB9DE\uBB3C\uB9BD\uB2C8\uB2E4.";
      if (safeBand === "mid_high") return "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB192\uC740 \uD3B8\uC774\uB77C \uC8FC\uC694 \uBC29\uD5A5\uC131\uC740 \uC798 \uB9DE\uB294 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.";
      if (safeBand === "mid") return "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131\uC740 \uBCF4\uD1B5 \uC218\uC900\uC774\uB77C \uC77C\uBD80 \uC5F0\uACB0 \uC9C0\uC810\uC740 \uB9DE\uC9C0\uB9CC \uBCF4\uC644\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
      if (safeBand === "low") return "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB0AE\uC544 \uBAA9\uD45C \uC2DC\uC7A5\uACFC\uC758 \uC5F0\uACB0 \uB17C\uB9AC\uB97C \uB354 \uBD84\uBA85\uD788 \uB2E4\uB4EC\uC5B4\uC57C \uD569\uB2C8\uB2E4.";
      return "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131\uC740 \uC544\uC9C1 \uBD88\uD655\uC2E4\uD574 \uCD94\uAC00 \uADFC\uAC70\uC640 \uB9E5\uB77D \uC815\uB9AC\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4.";
    }

    if (safeLabel === "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131") {
      if (safeBand === "high") return "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB9E4\uC6B0 \uB192\uC544 \uD0C0\uAE43 \uACE0\uAC1D\uACFC\uC758 \uC811\uC810\uC774 \uBD84\uBA85\uD558\uAC8C \uC774\uC5B4\uC9D1\uB2C8\uB2E4.";
      if (safeBand === "mid_high") return "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB192\uC740 \uD3B8\uC774\uB77C \uC124\uB4DD \uD3EC\uC778\uD2B8\uAC00 \uBE44\uAD50\uC801 \uC798 \uB9DE\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "mid") return "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131\uC740 \uBCF4\uD1B5 \uC218\uC900\uC774\uB77C \uACE0\uAC1D\uAD70 \uC815\uC758\uC640 \uC6B0\uC120\uC21C\uC704 \uBCF4\uC644\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
      if (safeBand === "low") return "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB0AE\uC544 \uB204\uAD6C\uB97C \uBA3C\uC800 \uC124\uB4DD\uD560\uC9C0 \uB354 \uC120\uBA85\uD558\uAC8C \uC881\uD600\uC57C \uD569\uB2C8\uB2E4.";
      return "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131\uC740 \uC544\uC9C1 \uBD88\uD655\uC2E4\uD574 \uACE0\uAC1D \uB9E5\uB77D\uC744 \uB354 \uAD6C\uCCB4\uD654\uD574\uC57C \uD569\uB2C8\uB2E4.";
    }

    if (safeLabel === "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131") {
      if (safeBand === "high") return "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB9E4\uC6B0 \uB192\uC544 \uC2B9\uC778 \uD750\uB984\uACFC \uC124\uB4DD \uACBD\uB85C\uAC00 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC774\uC5B4\uC9D1\uB2C8\uB2E4.";
      if (safeBand === "mid_high") return "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB192\uC740 \uD3B8\uC774\uB77C \uD575\uC2EC \uC758\uC0AC\uACB0\uC815\uC790\uC640\uC758 \uC5F0\uACB0 \uAC00\uB2A5\uC131\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "mid") return "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131\uC740 \uBCF4\uD1B5 \uC218\uC900\uC774\uB77C \uC2B9\uC778 \uAD6C\uC870\uC640 \uC774\uD574\uAD00\uACC4\uC790 \uB9F5\uC744 \uB354 \uC815\uB9AC\uD574\uC57C \uD569\uB2C8\uB2E4.";
      if (safeBand === "low") return "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131\uC774 \uB0AE\uC544 \uC2E4\uC81C \uC758\uC0AC\uACB0\uC815 \uD750\uB984\uC744 \uB2E4\uC2DC \uC9DA\uC5B4\uBCFC \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.";
      return "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131\uC740 \uC544\uC9C1 \uBD88\uD655\uC2E4\uD574 \uCD94\uAC00 \uD655\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
    }

    if (safeLabel === "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131") {
      if (safeBand === "high") return "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131\uC774 \uB9E4\uC6B0 \uB192\uC544 \uC2E4\uC81C \uC5C5\uBB34 \uD658\uACBD\uC5D0 \uBB34\uB9AC \uC5C6\uC774 \uC2A4\uBA70\uB4E4 \uC218 \uC788\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "mid_high") return "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131\uC774 \uB192\uC740 \uD3B8\uC774\uB77C \uD604\uC5C5 \uC801\uC6A9 \uAC00\uB2A5\uC131\uC774 \uC88B\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "mid") return "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131\uC740 \uBCF4\uD1B5 \uC218\uC900\uC774\uB77C \uB3C4\uC785 \uC774\uD6C4\uC758 \uC6B4\uC601 \uC7A5\uBA74\uC744 \uB354 \uAD6C\uCCB4\uD654\uD574\uC57C \uD569\uB2C8\uB2E4.";
      if (safeBand === "low") return "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131\uC774 \uB0AE\uC544 \uD604\uC5C5\uC5D0\uC11C\uC758 \uC0AC\uC6A9 \uC7A5\uBA74\uACFC \uC81C\uC57D\uC744 \uB2E4\uC2DC \uC810\uAC80\uD574\uC57C \uD569\uB2C8\uB2E4.";
      return "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131\uC740 \uC544\uC9C1 \uBD88\uD655\uC2E4\uD574 \uC2E4\uC81C \uC6B4\uC601 \uD658\uACBD \uAC80\uD1A0\uAC00 \uB354 \uD544\uC694\uD569\uB2C8\uB2E4.";
    }

    if (safeLabel === "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131") {
      if (safeBand === "high") return "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131\uC774 \uB9E4\uC6B0 \uB192\uC544 \uD604\uC7AC \uACBD\uD5D8\uC774 \uBAA9\uD45C \uC5ED\uD560\uACFC \uC9C1\uC811\uC801\uC73C\uB85C \uB9DE\uB2FF\uC544 \uC788\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "mid_high") return "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131\uC774 \uB192\uC740 \uD3B8\uC774\uB77C \uD575\uC2EC \uC5ED\uD560 \uC804\uD658\uC774 \uBE44\uAD50\uC801 \uC790\uC5F0\uC2A4\uB7FD\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "mid") return "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131\uC740 \uBCF4\uD1B5 \uC218\uC900\uC774\uB77C \uC77C\uBD80 \uC5ED\uD560 \uC5F0\uACB0\uC740 \uAC00\uB2A5\uD558\uC9C0\uB9CC \uBCF4\uAC15 \uD3EC\uC778\uD2B8\uAC00 \uB0A8\uC544 \uC788\uC2B5\uB2C8\uB2E4.";
      if (safeBand === "low") return "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131\uC774 \uB0AE\uC544 \uC5ED\uD560 \uC804\uD658 \uB17C\uB9AC\uB97C \uB354 \uC120\uBA85\uD558\uAC8C \uB2E4\uB4EC\uC744 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.";
      return "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131\uC740 \uC544\uC9C1 \uBD88\uD655\uC2E4\uD574 \uCD94\uAC00 \uC124\uBA85\uACFC \uADFC\uAC70 \uBCF4\uAC15\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.";
    }

    return "\uC804\uBC18\uC801 \uC801\uD569\uC131\uC740 \uC544\uC9C1 \uB2E8\uC815\uD558\uAE30\uBCF4\uB2E4 \uC138\uBD80 \uB9E5\uB77D\uC744 \uD568\uAED8 \uD655\uC778\uD558\uB294 \uD3B8\uC774 \uC548\uC804\uD569\uB2C8\uB2E4.";
  }

  function getAxisScoreNarrative(axis, score5, tone) {
    const label = String(axis?.label || "").trim();
    const safeTone = String(tone || "").trim();

    const axisType = (() => {
      if (label === "\uC9C1\uBB34 \uAD6C\uC870 \uC5F0\uACB0\uC131" || label === "\uC9C1\uBB34 \uC5ED\uD560 \uC801\uD569\uC131") return "job_structure";
      if (label === "\uC0B0\uC5C5 \uB9E5\uB77D \uC5F0\uACB0\uC131" || label === "\uC6B4\uC601 \uB9E5\uB77D \uC801\uD569\uC131" || label === "\uBB38\uC81C \uD574\uACB0 \uBC29\uC2DD \uC5F0\uACB0\uC131" || label === "\uC2DC\uC7A5 \uAD6C\uC870 \uC801\uD569\uC131") return "industry_context";
      if (label === "\uC5ED\uD560 \uBC94\uC704 \uC5F0\uACB0\uC131" || label === "\uC758\uC0AC\uACB0\uC815 \uAD6C\uC870 \uC801\uD569\uC131" || label === "\uC0B0\uCD9C\uBB3C \uC5F0\uACB0\uC131" || label === "\uACE0\uAC1D \uAD6C\uC870 \uC801\uD569\uC131") return "role_scope";
      if (label === "\uACE0\uAC1D \uC720\uD615 \uC5F0\uACB0\uC131") return "customer_type";
      if (label === "\uC9C1\uBB34 \uC131\uACA9 \uC5F0\uACB0\uC131") return "role_character";
      if (label === "전공과 직무의 연결성 (Job Fit)" || label === "전공과 직무의 연결성") return "newgrad_job_fit";
      if (label === "산업 연관성" || label === "산업 분야 이해도") return "newgrad_domain_interest";
      if (label === "유사한 경험이 있는가?" || label === "이력·스펙·경험 연결성") return "newgrad_execution_depth";
  if (label === "고객 커뮤니케이션 적합성" || label === "이해관계자 소통 적합성") return "newgrad_interaction_fit";
      if (label === "강점과 재능") return "newgrad_soft_skill_match";
      return "generic";
    })();

    const narrativeMap = {
      job_structure: {
        1: "\uC9C0\uAE08\uAE4C\uC9C0 \uD574\uC628 \uC9C1\uBB34\uC640 \uC9C0\uC6D0 \uC9C1\uBB34\uC758 \uD575\uC2EC \uC5C5\uBB34\uAC00 \uB9CE\uC774 \uB2E4\uB985\uB2C8\uB2E4.",
        2: "\uC9C0\uAE08\uAE4C\uC9C0 \uD574\uC628 \uC9C1\uBB34\uC640 \uC9C0\uC6D0 \uC9C1\uBB34\uC758 \uD575\uC2EC \uC5C5\uBB34\uAC00 \uC0C1\uB2F9 \uBD80\uBD84 \uB2E4\uB985\uB2C8\uB2E4.",
        3: "\uAE30\uBCF8\uC801\uC73C\uB85C\uB294 \uD575\uC2EC \uC5C5\uBB34\uAC00 \uC5F0\uACB0\uB418\uC9C0\uB9CC, \uC5B4\uB5A4 \uC810\uC774 \uC774\uC5B4\uC9C0\uB294\uC9C0 \uB354 \uD480\uC5B4\uC8FC\uBA74 \uC88B\uC2B5\uB2C8\uB2E4.",
        4: "\uD574\uC624\uC2E0 \uC77C\uACFC \uC9C0\uC6D0 \uC9C1\uBB34\uAC00 \uAF64 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC774\uC5B4\uC9D1\uB2C8\uB2E4.",
        5: "\uC9C0\uAE08\uAE4C\uC9C0\uC758 \uACBD\uD5D8\uC744 \uAC70\uC758 \uADF8\uB300\uB85C \uAC15\uC810\uC73C\uB85C \uC5F0\uACB0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
      },
      industry_context: {
        1: "\uC0B0\uC5C5\uC758 \uACB0\uC774 \uB9E4\uC6B0 \uB2E4\uB985\uB2C8\uB2E4. \uC0B0\uC5C5\uC758 \uCC28\uC774\uAC00 \uC911\uC694\uD55C \uC9C1\uBB34\uB77C\uBA74 \uC124\uBA85\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
        2: "\uC0B0\uC5C5\uC758 \uACB0\uC774 \uB2E4\uB985\uB2C8\uB2E4. \uC0B0\uC5C5\uC758 \uCC28\uC774\uAC00 \uC911\uC694\uD55C \uC9C1\uBB34\uB77C\uBA74 \uC124\uBA85\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
        3: "\uC0B0\uC5C5\uC758 \uD070 \uCC28\uC774\uB294 \uC5C6\uC9C0\uB9CC, \uC5C5\uACC4 \uC774\uD574\uB97C \uBCF4\uC5EC\uC8FC\uBA74 \uC88B\uC2B5\uB2C8\uB2E4.",
        4: "\uC0B0\uC5C5\uC758 \uBC30\uACBD\uC774 \uAF64 \uBE44\uC2B7\uD574\uC11C \uACBD\uD5D8\uC744 \uC5F0\uACB0\uD558\uAE30 \uC88B\uC2B5\uB2C8\uB2E4.",
        5: "\uC0B0\uC5C5\uC758 \uBC30\uACBD\uC774 \uB9E4\uC6B0 \uC720\uC0AC\uD558\uC5EC \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC774\uC5B4\uC9D1\uB2C8\uB2E4.",
      },
      role_scope: {
        1: "\uC9C0\uAE08\uAE4C\uC9C0 \uB9E1\uC544\uC628 \uCC45\uC784 \uC218\uC900\uACFC \uC9C0\uC6D0 \uC9C1\uBB34\uC758 \uAE30\uB300 \uC218\uC900 \uCC28\uC774\uAC00 \uD07D\uB2C8\uB2E4.",
        2: "\uC77C\uBD80 \uC5F0\uACB0\uB418\uB294 \uACBD\uD5D8\uC740 \uC788\uC9C0\uB9CC, \uCC45\uC784 \uBC94\uC704 \uCC28\uC774\uB97C \uC124\uBA85\uD574\uC918\uC57C \uD569\uB2C8\uB2E4.",
        3: "\uAE30\uBCF8 \uC5F0\uACB0\uC740 \uB418\uC9C0\uB9CC, \uC5B4\uB514\uAE4C\uC9C0 \uB9E1\uC544\uBD24\uB294\uC9C0 \uB354 \uAD6C\uCCB4\uC801\uC73C\uB85C \uBCF4\uC5EC\uC904 \uD544\uC694\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
        4: "\uB9E1\uC544\uC628 \uCC45\uC784 \uC218\uC900\uC774 \uC9C0\uC6D0 \uC9C1\uBB34\uC640 \uAF64 \uC798 \uB9DE\uC2B5\uB2C8\uB2E4.",
        5: "\uCC45\uC784 \uBC94\uC704\uC640 \uAE4A\uC774\uAC00 \uB9E4\uC6B0 \uBE44\uC2B7\uD574 \uBC14\uB85C \uAC15\uC810\uC73C\uB85C \uAC00\uC838\uAC00\uAE30 \uC88B\uC2B5\uB2C8\uB2E4.",
      },
      customer_type: {
        1: "\uC9C0\uAE08\uAE4C\uC9C0 \uC0C1\uB300\uD574\uC628 \uACE0\uAC1D\uACFC \uC9C0\uC6D0 \uC9C1\uBB34\uC758 \uB300\uC0C1\uC774 \uB9CE\uC774 \uB2E4\uB985\uB2C8\uB2E4.",
        2: "\uC77C\uBD80 \uBE44\uC2B7\uD558\uC9C0\uB9CC, \uACE0\uAC1D \uD2B9\uC131 \uCC28\uC774\uB97C \uBCF4\uC644\uD574\uC11C \uC124\uBA85\uD558\uB294 \uAC8C \uC88B\uC2B5\uB2C8\uB2E4.",
        3: "\uD070 \uD2C0\uC5D0\uC11C\uB294 \uC774\uC5B4\uC9C0\uC9C0\uB9CC, \uACE0\uAC1D \uCC28\uC774\uB97C \uC9DA\uC5B4\uC8FC\uBA74 \uB354 \uC124\uB4DD\uB825 \uC788\uC5B4\uC9D1\uB2C8\uB2E4.",
        4: "\uC0C1\uB300\uD574\uC628 \uACE0\uAC1D \uC720\uD615\uC774 \uBE44\uC2B7\uD574 \uC0AC\uB840\uB97C \uC5F0\uACB0\uD558\uAE30 \uC88B\uC2B5\uB2C8\uB2E4.",
        5: "\uACE0\uAC1D \uC720\uD615\uC774 \uB9E4\uC6B0 \uBE44\uC2B7\uD574 \uAE30\uC874 \uACBD\uD5D8\uC744 \uADF8\uB300\uB85C \uD65C\uC6A9\uD558\uAE30 \uC88B\uC2B5\uB2C8\uB2E4.",
      },
      role_character: {
        1: "\uC77C\uD558\uB294 \uBC29\uC2DD\uACFC \uBB38\uC81C\uB97C \uD478\uB294 \uBC29\uC2DD\uC774 \uB9CE\uC774 \uB2E4\uB985\uB2C8\uB2E4.",
        2: "\uBE44\uC2B7\uD55C \uC810\uB3C4 \uC788\uC9C0\uB9CC, \uC77C\uD558\uB294 \uBC29\uC2DD\uC758 \uCC28\uC774\uB97C \uC124\uBA85\uD574\uC8FC\uB294 \uAC8C \uC88B\uC2B5\uB2C8\uB2E4.",
        3: "\uC5B4\uB290 \uC815\uB3C4\uB294 \uB9DE\uC9C0\uB9CC, \uC5B4\uB5A4 \uBC29\uC2DD\uC73C\uB85C \uC77C\uD574\uC654\uB294\uC9C0 \uB354 \uBCF4\uC5EC\uC8FC\uBA74 \uC88B\uC2B5\uB2C8\uB2E4.",
        4: "\uC77C\uD558\uB294 \uBC29\uC2DD\uC774 \uAF64 \uBE44\uC2B7\uD574\uC11C \uC801\uC751 \uBD80\uB2F4\uC774 \uD06C\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
        5: "\uC77C\uD558\uB294 \uBC29\uC2DD\uC774 \uB9E4\uC6B0 \uBE44\uC2B7\uD574 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC5F0\uACB0\uB429\uB2C8\uB2E4.",
      },
      newgrad_job_fit: {
        1: "직무와 직접 연결되는 경험이 아직 충분히 확인되지는 않습니다.",
        2: "직무와 간접적으로 이어지는 경험은 있지만, 핵심 역할과의 거리는 남아 있습니다.",
        3: "전공이나 관련 경험을 바탕으로 직무와 연결할 기반은 갖추고 있습니다.",
        4: "직무와 직접 맞닿아 있는 프로젝트나 인턴 경험이 일부 확인됩니다.",
        5: "직무 역할과 직접 맞닿아 있는 경험이 여러 건 확인됩니다.",
      },
      newgrad_domain_interest: {
        1: "목표 산업과 관련된 경험이 거의 없으며, 산업 특성을 체감해본 흔적이 부족합니다.",
        2: "유사한 활동 경험은 있으나, 목표 산업의 고객이나 서비스 방식과 직접 맞닿아 있지는 않습니다.",
        3: "프로젝트나 활동 일부가 목표 산업과 간접적으로 연결되며, 산업 맥락을 엮어 설명할 여지는 있습니다.",
        4: "프로젝트, 인턴, 대외활동 중 일부가 목표 산업과 직접 연결되어 있어 산업 적응 가능성이 보입니다.",
        5: "목표 산업과 직접 맞닿은 프로젝트나 실무 경험이 있으며, 산업 특성에 대한 이해가 경험 수준에서 드러납니다.",
      },
      newgrad_execution_depth: {
        1: "관련 경험이 아직 충분히 쌓여 있지는 않습니다.",
        2: "제한적인 경험은 있지만, 경험의 폭과 밀도는 아직 낮은 편입니다.",
        3: "기초적인 수준의 경험이 누적되어 있어 직무와 연결해 설명할 수 있습니다.",
        4: "복수의 경험을 통해 일정 수준 이상의 결과물이나 실행 흔적이 확인됩니다.",
        5: "프로젝트와 실무형 경험이 함께 축적되어 있어 관련 경험의 밀도가 높습니다.",
      },
      newgrad_interaction_fit: {
        1: "사람이나 이해관계자와 직접 맞닿은 경험이 아직 많지 않습니다.",
        2: "제한적인 상호작용 경험은 있지만, 직접 접점의 밀도는 높지 않습니다.",
        3: "팀이나 다양한 상대와 소통한 경험이 일정 수준 확인됩니다.",
        4: "직접 상대를 마주하며 소통한 경험이 복수 확인됩니다.",
        5: "고객 또는 다양한 이해관계자와의 직접 접점 경험이 높은 수준으로 확인됩니다.",
      },
      newgrad_soft_skill_match: {
        1: "현재 입력만 보면 직무와 잘 맞는 강점 신호가 뚜렷하지 않습니다.",
        2: "일부 맞는 강점은 있지만, 직무와의 일치도는 아직 제한적입니다.",
        3: "직무와 맞는 강점과 일하는 방식이 어느 정도 확인됩니다.",
        4: "직무에서 요구되는 강점과 일하는 방식이 비교적 잘 맞아 있습니다.",
        5: "직무에서 요구되는 강점과 일하는 방식이 높은 수준으로 맞아 있습니다.",
      },
      generic: {
        1: "\uD604\uC7AC \uACBD\uD5D8\uC744 \uADF8\uB300\uB85C \uC5F0\uACB0\uD558\uAE30\uBCF4\uB2E4, \uD574\uB2F9 \uCD95\uC758 \uAE30\uC900\uC73C\uB85C \uB2E4\uC2DC \uD480\uC5B4 \uC124\uBA85\uD560 \uD544\uC694\uAC00 \uD07D\uB2C8\uB2E4.",
        2: "\uC77C\uBD80 \uC811\uC810\uC740 \uC788\uC9C0\uB9CC, \uC9C0\uC6D0 \uAD00\uC810\uC5D0\uC11C \uB2E4\uC2DC \uBB36\uC5B4 \uC124\uBA85\uD558\uB294 \uC791\uC5C5\uC774 \uD544\uC694\uD569\uB2C8\uB2E4.",
        3: "\uAE30\uBCF8 \uC5F0\uACB0\uC740 \uAC00\uB2A5\uD558\uC9C0\uB9CC, \uD575\uC2EC \uADFC\uAC70\uB97C \uB354 \uC120\uBA85\uD558\uAC8C \uC7A1\uC544\uC8FC\uB294 \uD3B8\uC774 \uC88B\uC2B5\uB2C8\uB2E4.",
        4: "\uC9C0\uC6D0 \uAD00\uC810\uC5D0\uC11C\uB3C4 \uD604\uC7AC \uACBD\uD5D8\uC744 \uBE44\uAD50\uC801 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC5F0\uACB0\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
        5: "\uD604\uC7AC \uACBD\uD5D8\uC744 \uD575\uC2EC \uAC15\uC810\uC73C\uB85C \uAC70\uC758 \uADF8\uB300\uB85C \uC5F0\uACB0\uD574\uB3C4 \uBB34\uB9AC\uAC00 \uC801\uC2B5\uB2C8\uB2E4.",
      },
    };

    return narrativeMap[axisType]?.[score5] || safeTone || narrativeMap.generic[3];
  }
  function toAxisUiScore5(axis) {
    const band = typeof axis?.band === "string" ? axis.band : "";
    if (band === "high") return 5;
    if (band === "mid_high") return 4;
    if (band === "mid") return 3;
    if (band === "low") return 2;
    if (band === "very_low") return 1;
    const ds = Number.isFinite(axis?.displayScore) ? axis.displayScore : 20;
    return Math.max(1, Math.min(5, Math.round(1 + (ds - 20) / 20)));
  }

  function getAxisUiScoreLabel(score5) {
    if (score5 === 5) return "\uB9E4\uC6B0 \uB192\uC74C";
    if (score5 === 4) return "\uB192\uC74C";
    if (score5 === 3) return "\uBCF4\uD1B5";
    if (score5 === 2) return "\uB0AE\uC74C";
    return "\uB9E4\uC6B0 \uB0AE\uC74C";
  }
  const topRisks = Array.isArray(vm.topRisks) ? vm.topRisks.filter(Boolean) : [];
  const activeExplanationRowKey = typeof vm.activeExplanationRowKey === "string" ? vm.activeExplanationRowKey : null;
  const onSelectExplanationRow = typeof vm.onSelectExplanationRow === "function" ? vm.onSelectExplanationRow : null;
  const onExplanationRowMount = typeof vm.onExplanationRowMount === "function" ? vm.onExplanationRowMount : null;
  const buyingMotionPanel = vm.buyingMotionPanel && typeof vm.buyingMotionPanel === "object" ? vm.buyingMotionPanel : null;
  const decisionStructurePanel = vm.decisionStructurePanel && typeof vm.decisionStructurePanel === "object" ? vm.decisionStructurePanel : null;
  const customerStructurePanel = vm.customerStructurePanel && typeof vm.customerStructurePanel === "object" ? vm.customerStructurePanel : null;
  const operatingContextPanel = vm.operatingContextPanel && typeof vm.operatingContextPanel === "object" ? vm.operatingContextPanel : null;
  const jobRoleSummaryPanel = vm.jobRoleSummaryPanel && typeof vm.jobRoleSummaryPanel === "object" ? vm.jobRoleSummaryPanel : null;
  const jobKeyOutputsPanel = vm.jobKeyOutputsPanel && typeof vm.jobKeyOutputsPanel === "object" ? vm.jobKeyOutputsPanel : null;
  const jobScopePanel = vm.jobScopePanel && typeof vm.jobScopePanel === "object" ? vm.jobScopePanel : null;
  const jobDecisionCriteriaPanel = vm.jobDecisionCriteriaPanel && typeof vm.jobDecisionCriteriaPanel === "object" ? vm.jobDecisionCriteriaPanel : null;
  const whyThisRead = Array.isArray(vm.whyThisRead) ? vm.whyThisRead.filter(Boolean) : [];
  const whyThisReadSupportLine = String(vm.whyThisReadSupportLine || "").trim();
  const transitionCompoundRead = !isNewgradReport && vm.transitionCompoundRead && typeof vm.transitionCompoundRead === "object" ? vm.transitionCompoundRead : null;
  const strengths = Array.isArray(vm.strengths) ? vm.strengths.filter(Boolean) : [];
  const topRepairSignals = isNewgradReport && Array.isArray(vm.topRepairSignals) ? vm.topRepairSignals.filter(Boolean) : [];
  const strengthEvidenceRead = isNewgradReport && vm.strengthEvidenceRead && typeof vm.strengthEvidenceRead === "object" ? vm.strengthEvidenceRead : null;
  const newgradGoalComparisonTable = isNewgradReport && vm.newgradGoalComparisonTable && typeof vm.newgradGoalComparisonTable === "object"
    ? vm.newgradGoalComparisonTable
    : null;
  const whatIfPreparationPack =
    isNewgradReport && vm.whatIfPreparationPack && Array.isArray(vm.whatIfPreparationPack.actions) && vm.whatIfPreparationPack.actions.length > 0
      ? vm.whatIfPreparationPack
      : null;
  const whatIfJobMajorCategory = isNewgradReport
    ? String(vm.taxonomyContextPack?.jobContext?.majorCategory || "").trim()
    : "";
  const validationReadBlock =
    vm.validationReadBlock && typeof vm.validationReadBlock === "object" ? vm.validationReadBlock : null;
  const transitionReadBlock =
    vm.transitionReadBlock && typeof vm.transitionReadBlock === "object" ? vm.transitionReadBlock : {};
  const primaryTransitionReadBlock =
    validationReadBlock &&
    (isUsableTransitionReadLine(validationReadBlock.intro) ||
      (Array.isArray(validationReadBlock.cards) && validationReadBlock.cards.filter(Boolean).length > 0))
      ? validationReadBlock
      : transitionReadBlock;
  const transitionReadSectionTitle = String(
    primaryTransitionReadBlock.sectionTitle || "\uC804\uD658 \uD310\uB3C5, \uD55C\uB208\uC5D0 \uBCF4\uB294 \uD574\uC11D"
  ).trim();
  const transitionReadIntro = isUsableTransitionReadLine(primaryTransitionReadBlock.intro)
    ? String(primaryTransitionReadBlock.intro || "").trim()
    : "";
  const transitionReadCards = Array.isArray(primaryTransitionReadBlock.cards)
    ? primaryTransitionReadBlock.cards.filter(Boolean)
    : [];
  const hasTransitionReadBlock = Boolean(transitionReadIntro || transitionReadCards.length > 0);
  const newgradComparisonCards = isNewgradReport
    ? axisEntries
        .map((axis, index) => {
          const rows = getVisibleComparisonRows(axis?.comparisonBlock);
          if (rows.length === 0) return null;
          const score5 = toAxisUiScore5(axis);
          return {
            axisKey: axis?.key || `axis_${index + 1}`,
            badge: "\uC138\uBD80 \uD310\uB3C5",
            title: String(axis?.comparisonBlock?.title || axis?.label || "").trim(),
            introText: takeLeadingSentences(String(axis?.comparisonBlock?.introText || axis?.description || "").trim(), 1),
            cautionText: String(axis?.comparisonBlock?.cautionText || "").trim(),
            score5,
            block: axis?.comparisonBlock,
            industryImportanceProfile: axis?.industryImportanceProfile || null,
          };
        })
        .filter(Boolean)
    : [];
  const weakAxisEntries = isNewgradReport
    ? [...axisEntries]
        .map((axis, index) => ({
          axisKey: axis?.key || `axis_${index + 1}`,
          label: String(axis?.label || `Axis ${index + 1}`).trim(),
          score5: toAxisUiScore5(axis),
          scoreLabel: getAxisUiScoreLabel(toAxisUiScore5(axis)),
          band: String(axis?.band || "").trim(),
        }))
        .sort((a, b) => (a.score5 - b.score5) || a.label.localeCompare(b.label))
    : [];
  const weakestAxes = weakAxisEntries.slice(0, 2);
  const isTiedWeakest = weakestAxes.length >= 2 && weakestAxes[0]?.score5 === weakestAxes[1]?.score5;
  const radarInterpretation = isNewgradReport
    ? weakestAxes.length >= 2
      ? isTiedWeakest
        ? `현재는 ${weakestAxes[0].label}을 포함한 여러 축이 함께 낮게 나타나 직무산업 적합도를 낮추고 있습니다.`
        : `\uD604\uC7AC\uB294 ${weakestAxes[0].label}\uACFC ${weakestAxes[1].label}\uC774 \uC9C1\uBB34\uC0B0\uC5C5 \uC801\uD569\uB3C4\uB97C \uAC00\uC7A5 \uD06C\uAC8C \uB0AE\uCD94\uACE0 \uC788\uC2B5\uB2C8\uB2E4.`
      : weakestAxes.length === 1
        ? `\uD604\uC7AC\uB294 ${weakestAxes[0].label}\uC774 \uC9C1\uBB34\uC0B0\uC5C5 \uC801\uD569\uB3C4\uC5D0\uC11C \uAC00\uC7A5 \uC57D\uD55C \uCD95\uC73C\uB85C \uBCF4\uC785\uB2C8\uB2E4.`
        : ""
    : "";
  const newgradRepairCards = isNewgradReport && Array.isArray(topRepairSignals)
    ? topRepairSignals
        .filter(Boolean)
        .slice(0, 3)
        .map((signal) => {
          const body = String(signal?.body || "").trim();
          const axisKey = String(signal?.axisKey || "").trim();
          const title = String(signal?.title || "").trim();
          const matchedAxis = weakAxisEntries.find((item) => item.axisKey === axisKey);
          const defaultActionMap = {
            jobStructure: {
              title: "\uC9C1\uBB34\uC640 \uC9C1\uC811 \uC5F0\uACB0\uB418\uB294 \uACBD\uD5D8 \uBB38\uC7A5 \uBCF4\uAC15",
              why: "\uC11C\uB958 \uB2E8\uACC4\uC5D0\uC11C\uB294 \uC804\uACF5\uACFC \uACBD\uD5D8\uC774 \uBAA9\uD45C \uC9C1\uBB34\uC640 \uC5B4\uB5BB\uAC8C \uC774\uC5B4\uC9C0\uB294\uC9C0\uAC00 \uBA3C\uC800 \uBCF4\uC785\uB2C8\uB2E4.",
              how: "\uD504\uB85C\uC81D\uD2B8\uC640 \uC778\uD134 \uC911 \uAC00\uC7A5 \uC9C1\uBB34\uC5D0 \uAC00\uAE4C\uC6B4 \uC0AC\uB840\uB97C \uC120\uD0DD\uD574 \uC5ED\uD560, \uC0B0\uCD9C\uBB3C, \uC9C1\uBB34 \uC5F0\uACB0 \uBB38\uC7A5\uC73C\uB85C \uB2E4\uC2DC \uC815\uB9AC\uD558\uC138\uC694.",
            },
            industryContext: {
              title: "\uC0B0\uC5C5 \uB9E5\uB77D \uADFC\uAC70 \uB97C \uC774\uB825\uC11C\uC5D0 \uB354 \uBA85\uC2DC",
              why: "\uAD00\uC2EC \uC790\uCCB4\uBCF4\uB2E4 \uC2E4\uC81C \uB9E5\uB77D\uC744 \uC774\uD574\uD574\uBCF8 \uD754\uC801\uC774 \uC788\uB294\uC9C0\uAC00 \uC0B0\uC5C5 \uC804\uD658\uC5D0\uC11C \uC911\uC694\uD569\uB2C8\uB2E4.",
              how: "\uAD00\uB828 \uACFC\uBAA9, \uC790\uACA9, \uD504\uB85C\uC81D\uD2B8 \uC911 \uBAA9\uD45C \uC0B0\uC5C5\uC758 \uACE0\uAC1D\u00B7\uC11C\uBE44\uC2A4\u00B7\uC6B4\uC601 \uD2B9\uC131\uC744 \uBCF4\uC5EC\uC8FC\uB294 \uADFC\uAC70\uB97C \uBA3C\uC800 \uC55E\uC73C\uB85C \uB2F9\uACA8 \uC801\uC5B4\uC8FC\uC138\uC694.",
            },
            responsibilityScope: {
              title: "\uACB0\uACFC\uBB3C\uACFC \uC5ED\uD560 \uBC94\uC704\uB97C \uB354 \uAD6C\uCCB4\uD654",
              why: "\uC720\uC0AC \uACBD\uD5D8\uC740 \uD55C \uAC83\uC744 \uD574\uBD24\uB2E4\uB294 \uC0AC\uC2E4\uBCF4\uB2E4 \uBB34\uC5C7\uC744 \uB05D\uAE4C\uC9C0 \uB9CC\uB4E4\uC5C8\uB294\uC9C0\uB85C \uD310\uB2E8\uB429\uB2C8\uB2E4.",
              how: "\uD504\uB85C\uC81D\uD2B8\uB098 \uC778\uD134 \uC0AC\uB840\uC5D0 \uACB0\uACFC\uBB3C, \uBCF8\uC778 \uC5ED\uD560, \uC9C0\uC18D \uAE30\uAC04, \uB9C8\uBB34\uB9AC \uCC45\uC784\uC744 \uD55C \uBB38\uC7A5 \uC548\uC5D0 \uD568\uAED8 \uB123\uC5B4 \uBCF4\uC644\uD558\uC138\uC694.",
            },
            customerType: {
              title: "\uD611\uC5C5\uACFC \uC0AC\uC6A9\uC790 \uC811\uC810 \uACBD\uD5D8 \uBCF4\uC644",
              why: "\uC18C\uD1B5 \uC801\uD569\uC131\uC740 \uC131\uD5A5 \uBB38\uAD6C\uBCF4\uB2E4 \uB204\uAD6C\uC640 \uBB34\uC5C7\uC744 \uC870\uC728\uD588\uB294\uC9C0\uC5D0 \uC758\uD574 \uC124\uB4DD\uB429\uB2C8\uB2E4.",
              how: "\uD300 \uD611\uC5C5, \uACE0\uAC1D \uB300\uC751, \uC774\uD574\uAD00\uACC4\uC790 \uC870\uC728 \uC0AC\uB840 \uC911 \uD558\uB098\uB97C \uACE8\uB77C \uC0C1\uB300\uBC29\uACFC \uB2F9\uC2E0\uC758 \uC5ED\uD560\uC774 \uBCF4\uC774\uAC8C \uC801\uC5B4\uC8FC\uC138\uC694.",
            },
            roleCharacter: {
              title: "\uAC15\uC810\uC744 \uC2E4\uC81C \uC0AC\uB840\uB85C \uC5F0\uACB0",
              why: "\uAC15\uC810 \uBB38\uAD6C\uB294 \uB3C5\uB9BD \uADFC\uAC70\uAC00 \uC544\uB2CC \uC774\uC0C1 \uB2E8\uB3C5\uC73C\uB85C\uB294 \uC124\uB4DD\uB825\uC774 \uC57D\uD569\uB2C8\uB2E4.",
              how: "\uAC15\uC810 \uD0A4\uC6CC\uB4DC\uB97C \uADF8\uB300\uB85C \uB098\uC5F4\uD558\uC9C0 \uB9D0\uACE0 \uD574\uB2F9 \uAC15\uC810\uC774 \uBCF4\uC778 \uD504\uB85C\uC81D\uD2B8\u00B7\uD611\uC5C5 \uC0AC\uB840\uC640 \uD568\uAED8 \uBB36\uC5B4 \uC4F0\uC138\uC694.",
            },
          };
          const fallback = defaultActionMap[axisKey] || {
            title: title || "\uC2E4\uD589 \uC6B0\uC120\uC21C\uC704 \uC815\uB9AC",
            why: matchedAxis ? `${matchedAxis.label} \uCD95\uC5D0\uC11C \uC57D\uD55C \uACE0\uB9AC\uAC00 \uBA3C\uC800 \uBCF4\uC644\uB418\uC5B4\uC57C \uC804\uCCB4 \uC804\uD658 \uB17C\uB9AC\uAC00 \uC548\uC815\uB429\uB2C8\uB2E4.` : body,
            how: body || "\uD604\uC7AC \uC774\uB825\uC11C\uC5D0\uC11C \uAC00\uC7A5 \uBD80\uC871\uD55C \uADFC\uAC70\uB97C \uC55E\uCABD \uC0AC\uB840\uB85C \uBCF4\uC644\uD558\uC138\uC694.",
          };
          return {
            axisKey,
            title: fallback.title,
            why: fallback.why,
            how: fallback.how,
          };
        })
    : [];
  const repairSignalMap = new Map(
    newgradRepairCards
      .filter((item) => item.axisKey)
      .map((item) => [item.axisKey, item])
  );
  const newgradComparisonCardsWithAction = newgradComparisonCards.map((item) => ({
    ...item,
    actionHint: item?.cautionText || "",
  }));
  const shouldRenderNewgradRepairSignalsSection = false;
  const newgradDifficultyLabel = isNewgradReport
    ? weakestAxes[0]?.score5 <= 2
      ? "\uB0AE\uC74C"
      : weakestAxes[0]?.score5 === 3
        ? "\uBCF4\uD1B5"
        : "\uB192\uC74C"
    : "";
  const newgradDifficultyBadgeClass = newgradDifficultyLabel === "\uB192\uC74C"
    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/80"
    : newgradDifficultyLabel === "\uBCF4\uD1B5"
      ? "bg-sky-100 text-sky-800 ring-1 ring-sky-300/80"
      : "bg-rose-100 text-rose-800 ring-1 ring-rose-300/80";
  const newgradHeadline = isNewgradReport
    ? weakestAxes[0]?.score5 <= 1
      ? "\uC9C1\uBB34\uC0B0\uC5C5 \uC801\uD569\uB3C4\uB97C \uBA3C\uC800 \uB2E4\uC2DC \uC815\uB9AC\uD574\uC57C \uD558\uB294 \uC0C1\uD0DC\uC785\uB2C8\uB2E4."
      : weakestAxes[0]?.score5 === 2
        ? "\uC77C\uBD80 \uC5F0\uACB0\uC740 \uBCF4\uC774\uC9C0\uB9CC \uD575\uC2EC \uADFC\uAC70 \uBCF4\uAC15\uC774 \uBA3C\uC800 \uD544\uC694\uD55C \uC0C1\uD0DC\uC785\uB2C8\uB2E4."
        : "\uAE30\uBCF8 \uC5F0\uACB0\uC740 \uC788\uC9C0\uB9CC \uC6B0\uC120 \uBCF4\uC644 \uCD95\uC744 \uC9DA\uACE0 \uAC00\uB294 \uD3B8\uC774 \uC548\uC804\uD569\uB2C8\uB2E4."
    : "";
  const targetJobRead = vm.targetJobRead && typeof vm.targetJobRead === "object" ? vm.targetJobRead : {};
  const targetIndustryRead = vm.targetIndustryRead && typeof vm.targetIndustryRead === "object" ? vm.targetIndustryRead : {};
  const industryTraitsAsset = vm.industryTraitsAsset && typeof vm.industryTraitsAsset === "object" ? vm.industryTraitsAsset : null;
  const targetJobBody = String(targetJobRead.body || "").trim();
  const targetIndustrySummary = String(targetIndustryRead.summary || "").trim();
  const targetJobBullets = Array.isArray(targetJobRead.bullets) ? targetJobRead.bullets.filter(Boolean) : [];
  const targetJobTags = Array.isArray(targetJobRead.tags) ? targetJobRead.tags.filter(Boolean) : [];
  const targetIndustryBullets = Array.isArray(targetIndustryRead.bullets) ? targetIndustryRead.bullets.filter(Boolean) : [];
  const industryTraitsLabel = String(industryTraitsAsset?.label || "").trim();
  const targetIndustryLabel = String(vm.targetIndustryLabel || "").trim();
  const industryTraitsDisplayLabel = industryTraitsLabel || targetIndustryLabel;
  const industryTraitsSummary = takeLeadingSentences(
    String(industryTraitsAsset?.summaryTemplate || "")
      .trim()
      .replaceAll("{label}", industryTraitsLabel),
    4
  );
  const industryTraitsWhy = Array.isArray(industryTraitsAsset?.whyIndustryMatters) ? industryTraitsAsset.whyIndustryMatters.filter(Boolean).slice(0, 2) : [];
  const industryTraitsEvaluation = Array.isArray(industryTraitsAsset?.evaluationCriteria) ? industryTraitsAsset.evaluationCriteria.filter(Boolean).slice(0, 2) : [];
  const industryTraitsBusinessStructure = typeof industryTraitsAsset?.businessStructure?.[0] === "string" ? industryTraitsAsset.businessStructure[0].trim() : "";
  const industryTraitsCustomerStructure = typeof industryTraitsAsset?.customerStructure?.[0] === "string" ? industryTraitsAsset.customerStructure[0].trim() : "";
  const industryTraitsOperatingLanguage = typeof industryTraitsAsset?.operatingLanguage?.[0] === "string" ? industryTraitsAsset.operatingLanguage[0].trim() : "";
  const hasIndustryTraitsAsset = Boolean(
    industryTraitsLabel ||
    industryTraitsSummary ||
    industryTraitsWhy.length > 0 ||
    industryTraitsEvaluation.length > 0
  );
  const hasReferenceInfo = Boolean(
    targetJobRead.title ||
    targetJobBody ||
    targetJobBullets.length > 0 ||
    hasIndustryTraitsAsset ||
    targetIndustryRead.title ||
    targetIndustryBullets.length > 0
  );
  const shareAnchorRef = vm.shareAnchorRef ?? null;
  const onGoHome = typeof vm.onGoHome === "function" ? vm.onGoHome : null;
  const onOpenShare = typeof vm.onOpenShare === "function" ? vm.onOpenShare : null;
  const onOpenTransitionLiteNextStep = typeof vm.onOpenTransitionLiteNextStep === "function"
    ? vm.onOpenTransitionLiteNextStep
    : null;
  const onOpenTransitionLitePrecisePath = typeof vm.onOpenTransitionLitePrecisePath === "function"
    ? vm.onOpenTransitionLitePrecisePath
    : null;
  const transitionMeta = transitionReadBlock?.meta && typeof transitionReadBlock.meta === "object"
    ? transitionReadBlock.meta
    : {};
  const resumeRequestContext = {
    currentRole: String(transitionMeta?.currentJobLabel || "").trim() || null,
    currentIndustry: null,
    targetRole: String(targetJobRead?.title || transitionMeta?.targetJobLabel || "").trim() || null,
    targetIndustry: String(industryTraitsDisplayLabel || targetIndustryRead?.title || "").trim() || null,
    candidateType: null,
    topRisk1: String(topRisks?.[0]?.title || topRisks?.[0]?.key || "").trim() || null,
  };

  const careerCurrentJobLabel = String(
    transitionMeta?.currentJobLabel ||
    vm.taxonomyContextPack?.currentJobContext?.label ||
    ""
  ).trim();
  const careerTargetJobLabel = String(
    transitionMeta?.targetJobLabel ||
    targetJobRead?.title ||
    vm.taxonomyContextPack?.targetJobContext?.label ||
    vm.targetJobDisplayLabel ||
    ""
  ).trim();
  const careerCurrentIndustryLabel = String(
    transitionMeta?.currentIndustryLabel ||
    vm.taxonomyContextPack?.currentIndustryContext?.label ||
    ""
  ).trim();
  const careerTargetIndustryLabel = String(
    targetIndustryLabel ||
    transitionMeta?.targetIndustryLabel ||
    industryTraitsLabel ||
    targetIndustryRead?.title ||
    vm.taxonomyContextPack?.targetIndustryContext?.label ||
    vm.targetIndustryDisplayLabel ||
    ""
  ).trim();

  const aiEvidence = useCareerFitAiEvidence({
    isCareerReport: !isNewgradReport,
    currentJobLabel: careerCurrentJobLabel,
    targetJobLabel: careerTargetJobLabel,
    currentIndustryLabel: careerCurrentIndustryLabel,
    targetIndustryLabel: careerTargetIndustryLabel,
    reportContext: {
      axisPack,
      topRisks,
      targetJobContext: targetJobRead ? {
        body: typeof targetJobRead.body === "string" ? targetJobRead.body : "",
        bullets: Array.isArray(targetJobRead.bullets) ? targetJobRead.bullets.filter(Boolean) : [],
      } : null,
      industryContext: industryTraitsAsset ? {
        summaryTemplate: typeof industryTraitsAsset.summaryTemplate === "string" ? industryTraitsAsset.summaryTemplate : "",
        evaluationCriteria: Array.isArray(industryTraitsAsset.evaluationCriteria) ? industryTraitsAsset.evaluationCriteria.filter(Boolean) : [],
      } : null,
    },
  });

  const bridgeResult = useNewgradJobIndustryBridge({
    payload: isNewgradReport ? (vm.jobIndustryBridgePayload ?? null) : null,
  });

  const [openSections, setOpenSections] = useState(() => new Set(["top_risk", "interviewer_focus"]));
  const toggleSection = (key) => setOpenSections(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const handlePrintResult = () => {
    if (typeof window === "undefined" || typeof window.print !== "function") return;
    window.print();
  };

  const handleDownloadPdf = () => {
    handlePrintResult();
  };

  return (
    <div className="space-y-0" data-print-root="transition-lite-result">
      <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3" data-print-hidden="true">
        <div className="flex items-center">
          {onGoHome ? (
            <Button
              type="button"
              variant="outline"
              onClick={onGoHome}
              className="h-10 rounded-full border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:text-slate-900"
            >
              <Home className="mr-2 h-4 w-4" />
              홈으로
            </Button>
          ) : null}
        </div>
        <div className="hidden md:flex flex-col items-end gap-2">
        <Button
          type="button"
          className="rounded-full h-11 px-5"
          onClick={handleDownloadPdf}
        >
          <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
            <Download className="h-4 w-4" />
            <span>PDF로 저장하기</span>
          </span>
        </Button>
        <p className="text-right text-[12px] leading-5 text-slate-500">
          클릭 후 인쇄 창에서 &quot;PDF로 저장&quot;을 선택해 주세요.
        </p>
        </div>
      </div>
      {isNewgradReport && axisEntries.length > 0 ? (
        <section className="mb-5 sm:mb-6">
          <div className="rounded-[20px] border border-slate-200/60 bg-white/80 px-3 py-3 sm:border-slate-200 sm:bg-white sm:px-5 sm:py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]" data-print-card="true">
            <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <h3 className="text-[18px] font-semibold tracking-tight text-slate-950 sm:text-[19px]">{"\uC9C1\uBB34\uC0B0\uC5C5 \uC801\uD569\uB3C4 \uB9AC\uD3EC\uD2B8"}</h3>
                <p className="mt-1 text-[13px] leading-[1.65] text-slate-700">{newgradHeadline}</p>
              </div>
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${newgradDifficultyBadgeClass}`}>
                {`\uC9C1\uBB34 \uC801\uD569\uB3C4: ${newgradDifficultyLabel}`}
              </div>
            </div>
            <div className="mt-3 space-y-2 sm:mt-2.5 sm:grid sm:grid-cols-1 sm:gap-2.5 sm:grid-cols-3">
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="rounded-[16px] border border-slate-200/60 bg-slate-50/80 px-3 py-2.5 sm:rounded-[16px] sm:border-slate-200 sm:bg-white sm:px-3 sm:py-3">
                  <p className="text-[10px] font-medium text-slate-400 sm:text-[11.5px]">{isTiedWeakest ? "우선 보완 축" : "\uAC00\uC7A5 \uC57D\uD55C \uCD95"}</p>
                  <p className="mt-0.5 text-[12.5px] font-semibold leading-[1.35] text-slate-900 sm:mt-1 sm:text-[13px] sm:leading-[1.4]">{weakestAxes[0]?.label || "-"}</p>
                  <p className="mt-1 text-[10px] text-slate-500 sm:mt-1 sm:text-[12px]">{weakestAxes[0] ? `${weakestAxes[0].score5}/5 ${weakestAxes[0].scoreLabel}` : ""}</p>
                </div>
                <div className="rounded-[16px] border border-slate-200/60 bg-slate-50/80 px-3 py-2.5 sm:rounded-[16px] sm:border-slate-200 sm:bg-white sm:px-3 sm:py-3">
                  <p className="text-[10px] font-medium text-slate-400 sm:text-[11.5px]">{isTiedWeakest ? "함께 낮게 나온 축" : "\uB450 \uBC88\uC9F8\uB85C \uC57D\uD55C \uCD95"}</p>
                  <p className="mt-0.5 text-[12.5px] font-semibold leading-[1.35] text-slate-900 sm:mt-1 sm:text-[13px] sm:leading-[1.4]">{weakestAxes[1]?.label || "-"}</p>
                  <p className="mt-1 text-[10px] text-slate-500 sm:mt-1 sm:text-[12px]">{weakestAxes[1] ? `${weakestAxes[1].score5}/5 ${weakestAxes[1].scoreLabel}` : ""}</p>
                </div>
              </div>
              <div className="rounded-[16px] border border-amber-100/60 bg-amber-50/35 px-3 py-3 sm:rounded-[16px] sm:border-slate-200 sm:bg-white sm:px-3 sm:py-3">
                <p className="text-[9.5px] font-semibold uppercase tracking-wide text-amber-700/70 sm:text-[11.5px] sm:text-slate-400">{"\uAC00\uC7A5 \uBA3C\uC800 \uBCF4\uC644\uD574\uC57C \uD560 \uC810"}</p>
                <p className="mt-1 text-[13px] font-semibold leading-[1.4] text-slate-900 sm:mt-1 sm:text-[13px] sm:leading-[1.55]">
                  {newgradRepairCards[0]?.title || weakestAxes[0]?.label || "-"}
                </p>
                <p className="mt-1 text-[11.5px] leading-[1.5] text-slate-700 sm:mt-1 sm:text-[12px] sm:leading-[1.55]">
                  {newgradRepairCards[0]?.how || radarInterpretation}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!isNewgradReport && aiEvidence.eligible && aiEvidence.loading && (
        <AiEvidenceLoadingCard />
      )}
      {!isNewgradReport && aiEvidence.eligible && !aiEvidence.loading && !aiEvidence.data && aiEvidence.error && (
        <AiEvidenceErrorNote />
      )}

      {!isNewgradReport && axisEntries.length > 0 ? (() => {
        const tJobLabel = String(transitionMeta?.targetJobLabel || targetJobRead?.title || "").trim();
        const tIndLabel = String(targetIndustryLabel || "").trim();
        const contextLine = tJobLabel
          ? `${tJobLabel}${tIndLabel ? ` · ${tIndLabel}` : ""} 기준 분석 결과입니다.`
          : "";
        const weakSorted = [...axisEntries]
          .map(a => ({ label: String(a?.label || "").trim(), score5: toAxisUiScore5(a) }))
          .filter(a => a.label)
          .sort((a, b) => a.score5 - b.score5);
        const weakLabel = weakSorted[0]?.label || "";
        return (
          <div className="mb-4 md:hidden rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4" data-print-hidden="true">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">현재 입력 기준 요약</p>
            {contextLine ? (
              <p className="mt-1.5 text-[13px] font-medium text-slate-800">{contextLine}</p>
            ) : null}
            <p className="mt-2 text-[12.5px] leading-[1.7] text-slate-600">
              현재 입력 기준으로 희망 직무와의 연결성을 요약했습니다. 아래 점수보다 먼저, 어떤 근거가 강하고 어떤 부분을 보강해야 하는지 확인해 보세요.
            </p>
            {weakLabel ? (
              <p className="mt-2 text-[12px] leading-[1.6] text-slate-500">
                {`현재 입력상 ${weakLabel} 축이 가장 낮게 나타납니다. 단정이 아닌 참고 기준입니다.`}
              </p>
            ) : null}
          </div>
        );
      })() : null}

      {axisEntries.length > 0 && (isNewgradReport ? newgradRepairCards.length > 0 : topRisks.length > 0) ? (() => {
        const repairTitle = isNewgradReport
          ? (newgradRepairCards[0]?.title || weakestAxes[0]?.label || "")
          : (topRisks[0]?.title || "");
        const repairHow = isNewgradReport ? (newgradRepairCards[0]?.how || "") : "";
        return repairTitle ? (
          <div className="mb-4 md:hidden space-y-2" data-print-hidden="true">
            {!isNewgradReport && (
              <div className="rounded-[18px] border border-amber-200/70 bg-amber-50/60 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">가장 먼저 보강할 부분</p>
                <p className="mt-1.5 text-[13px] font-semibold leading-[1.55] text-slate-900">{repairTitle}</p>
                {repairHow ? (
                  <p className="mt-1 text-[12px] leading-[1.65] text-slate-600">{repairHow}</p>
                ) : null}
              </div>
            )}
            {!isNewgradReport && (
              <div className="rounded-[14px] border border-slate-200 bg-white/80 px-3 py-2.5 sm:rounded-[18px] sm:px-4 sm:py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 sm:text-[11px]">지금 할 수 있는 행동</p>
                <p className="mt-1 text-[12px] leading-[1.6] text-slate-600 sm:mt-1.5 sm:text-[12.5px] sm:leading-[1.7]">
                  아래 상세 분석을 확인하며 이 부분의 이력서 표현을 먼저 점검해 보세요. 더 빠른 진단이 필요하다면 하단 무료 상담을 활용하세요.
                </p>
              </div>
            )}
          </div>
        ) : null;
      })() : null}

      {isNewgradReport && newgradGoalComparisonTable ? (
        <NewgradGoalComparisonSection table={newgradGoalComparisonTable} />
      ) : null}

      {axisEntries.length > 0 ? (
        <section className="mb-7 sm:mb-8">
          <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5 sm:py-5.5" data-print-card="true">
            <div className="hidden flex-col gap-1" aria-hidden="true">
              <h3 className="text-[15px] font-semibold text-slate-900">핵심 적합성 레이더</h3>
              <p className="text-[12px] leading-5 text-slate-500">
                항목별 적합성을 한눈에 비교하기 위한 요약 뷰입니다.
              </p>
            </div>

            <div className={isNewgradReport ? "flex flex-col gap-1" : "flex flex-col gap-2"}>
              <h3 className="text-lg font-semibold leading-7 text-slate-900 sm:text-[20px]">{"\uC9C1\uBB34 \uC801\uD569\uB3C4 \uB808\uC774\uB354"}</h3>
              <p className={isNewgradReport ? "text-sm leading-6 text-slate-600" : "max-w-2xl text-sm leading-6 text-slate-600"}>
                {"\uC544\uB798 5\uAC1C\uC758 \uCD95\uC740 \uD604\uC7AC \uACBD\uD5D8\uACFC \uBAA9\uD45C \uC9C1\uBB34\uC0B0\uC5C5 \uC0AC\uC774\uC758 \uC5F0\uACB0 \uC815\uB3C4\uB97C \uBCF4\uC5EC\uC90D\uB2C8\uB2E4."}
              </p>
            </div>

            {(() => {
              const showRadar = axisEntries.length === 5;
              const S = 440, CX = 220, CY = 160, R = 96, LR = 128;
              const GRIDS = [0.2, 0.4, 0.6, 0.8, 1.0];
              const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / 5;
              const pt = (i, ratio) => [
                CX + R * ratio * Math.cos(ang(i)),
                CY + R * ratio * Math.sin(ang(i)),
              ];
              const polyStr = (rs) =>
                rs.map((r, i) => pt(i, r).map((v) => v.toFixed(1)).join(",")).join(" ");
              const shortLabels = axisEntries.map((axis) => getRadarAxisShortLabel(axis?.label));
              const score5s = [0, 1, 2, 3, 4].map((i) => toAxisUiScore5(axisEntries[i]));
              const ratios = score5s.map((s) => s / 5);
              return (
                <>
                  {showRadar ? (
                    <div className={isNewgradReport ? "mt-5 flex flex-col gap-4 sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)] sm:items-center" : "mt-5 rounded-[18px] border border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5 sm:py-5"}>
                      {!isNewgradReport && (() => {
                        const cJob = String(transitionMeta?.currentJobLabel || "").trim() || "정보 없음";
                        const tJob = String(transitionMeta?.targetJobLabel || "").trim() || "정보 없음";
                        const cInd = String(transitionMeta?.currentIndustryLabel || "").trim() || "정보 없음";
                        const tInd = String(targetIndustryLabel || transitionMeta?.targetIndustryLabel || "").trim() || "정보 없음";
                        return (
                          <div className="min-w-0 border-b border-slate-200/80 pb-3 text-left sm:pb-3.5">
                            <p className="mb-2 text-xs font-semibold tracking-tight text-slate-500">비교 기준</p>
                            <div className="space-y-1.5 text-[13px] leading-6 text-slate-700">
                              <p className="flex items-start gap-2">
                                <span className="shrink-0 font-medium text-slate-600">현재 직무:</span>
                                <span className="min-w-0 whitespace-normal break-keep [overflow-wrap:break-word]">{cJob} → {tJob}</span>
                              </p>
                              <p className="flex items-start gap-2">
                                <span className="shrink-0 font-medium text-slate-600">현재 산업:</span>
                                <span className="min-w-0 whitespace-normal break-keep [overflow-wrap:break-word]">{cInd} → {tInd}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                      <div className={isNewgradReport ? "flex justify-center rounded-[18px] border border-slate-200 bg-slate-50/80 px-3 py-4 sm:px-4" : "mt-4 flex justify-center sm:mt-5"}>
                        <svg viewBox={`0 0 ${S} 300`} width="100%" style={{ maxWidth: isNewgradReport ? 340 : 410 }} aria-hidden="true">
                        {GRIDS.map((g) => (
                          <polygon key={g} points={polyStr([g, g, g, g, g])} fill="none" stroke="#e2e8f0" strokeWidth="1" />
                        ))}
                        {[0, 1, 2, 3, 4].map((i) => {
                          const [x2, y2] = pt(i, 1.0);
                          return <line key={i} x1={CX} y1={CY} x2={x2.toFixed(1)} y2={y2.toFixed(1)} stroke="#e2e8f0" strokeWidth="1" />;
                        })}
                        <polygon points={polyStr(ratios)} fill="rgba(99,102,241,0.16)" stroke="#6366f1" strokeWidth="1.8" strokeLinejoin="round" />
                        {ratios.map((r, i) => {
                          const [x, y] = pt(i, r);
                          return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill="#6366f1" />;
                        })}
                        {[0, 1, 2, 3, 4].map((i) => {
                          const angle = ang(i);
                          const sinA = Math.sin(angle);
                          const cosA = Math.cos(angle);
                          const [x, y] = pt(i, LR / R);
                          const textAnchor = cosA > 0.1 ? "start" : cosA < -0.1 ? "end" : "middle";
                          const dominantBaseline = sinA < -0.1 ? "auto" : sinA > 0.1 ? "hanging" : "middle";
                          const dy = sinA < -0.1 ? "-0.3em" : sinA > 0.1 ? "0.3em" : "0";
                          return (
                            <text key={i} x={x.toFixed(1)} y={y.toFixed(1)} textAnchor={textAnchor} dominantBaseline={dominantBaseline} dy={dy} fontSize="12.5" fontWeight="650" fill="#334155">
                              {shortLabels[i] || `Axis ${i + 1}`}
                            </text>
                          );
                        })}
                        </svg>
                      </div>
                      {isNewgradReport ? (
                        <div className="flex flex-col gap-3">
                          <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3 py-3 sm:px-3.5">
                            <div className="space-y-2">
                              {axisEntries.map((axis, index) => {
                                const label = typeof axis?.label === "string" ? axis.label : `Axis ${index + 1}`;
                                const score5 = toAxisUiScore5(axis);
                                const scoreLabel = getAxisUiScoreLabel(score5);
                                return (
                                  <div key={`${label}_${index}`} className="flex items-center justify-between gap-3 text-[13px] leading-5 text-slate-700">
                                    <span className="min-w-0 truncate pr-2">{label}</span>
                                    <span className="shrink-0 font-medium text-slate-500">{`${score5}/5 ${scoreLabel}`}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {radarInterpretation ? (
                            <p className="text-[13px] leading-[1.65] text-slate-600">{radarInterpretation}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className={showRadar ? "mt-5" : "mt-4"}>
                    {isNewgradReport ? (
                      showRadar ? null : (
                      <div className="space-y-3">
                        <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-3 py-3 sm:px-3.5">
                          <div className="space-y-2">
                            {axisEntries.map((axis, index) => {
                              const label = typeof axis?.label === "string" ? axis.label : `Axis ${index + 1}`;
                              const score5 = toAxisUiScore5(axis);
                              const scoreLabel = getAxisUiScoreLabel(score5);
                              return (
                                <div key={`${label}_${index}`} className="flex items-center justify-between gap-3 text-[13px] leading-5 text-slate-700">
                                  <span className="min-w-0 truncate pr-2">{label}</span>
                                  <span className="shrink-0 font-medium text-slate-500">{`${score5}/5 ${scoreLabel}`}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {radarInterpretation ? (
                          <p className="text-[13px] leading-[1.65] text-slate-600">{radarInterpretation}</p>
                        ) : null}
                      </div>
                      )
                    ) : (
                      <div className="divide-y divide-slate-100">
                    {axisEntries.map((axis, index) => {
                      const label = typeof axis?.label === "string" ? axis.label : `??${index + 1}`;
                      const band = typeof axis?.band === "string" ? axis.band : "";
                      const tone = getAxisTone(label, band);
                      const score5 = toAxisUiScore5(axis);
                      const scoreLabel = getAxisUiScoreLabel(score5);
                      const narrative = getAxisScoreNarrative(axis, score5, tone);
                      const explanation = axis?.explanation?.available ? axis.explanation : null;
                      const isExpanded = expandedAxisKey === label;
                      const slotLead = typeof explanation?.lead === "string" ? explanation.lead.trim() : "";
                      const slotCriteria = typeof explanation?.criteria === "string" ? explanation.criteria.trim() : "";
                      const slotScoreReason = typeof explanation?.scoreReason === "string" ? explanation.scoreReason.trim() : "";
                      const slotLiftOrLimit = typeof explanation?.liftOrLimit === "string" ? explanation.liftOrLimit.trim() : "";
                      const slotFieldCount = [slotLead, slotCriteria, slotScoreReason, slotLiftOrLimit].filter(Boolean).length;
                      const hasSlots = Boolean(explanation) && slotFieldCount >= 2;
                      const explanationSummary = typeof explanation?.summary === "string" ? explanation.summary.trim() : "";
                      const primaryBody = hasSlots
                        ? (slotLead || narrative || "")
                        : (explanationSummary || narrative);
                      const secondaryBody = hasSlots ? (slotScoreReason || "") : "";
                      const explanationReasons = Array.isArray(explanation?.reasons)
                        ? explanation.reasons
                            .map((reason) => String(reason?.label || "").trim())
                            .filter(Boolean)
                            .slice(0, hasSlots ? 1 : 2)
                        : [];
                      const explanationPositives = Array.isArray(explanation?.positives)
                        ? explanation.positives
                            .map((item) => String(item || "").trim())
                            .filter(Boolean)
                            .slice(0, hasSlots ? 1 : 2)
                        : [];
                      const explanationGaps = Array.isArray(explanation?.gaps)
                        ? explanation.gaps
                            .map((item) => String(item || "").trim())
                            .filter(Boolean)
                            .slice(0, hasSlots ? 1 : 2)
                        : [];
                      const comparisonRows = isNewgradReport ? getVisibleComparisonRows(axis?.comparisonBlock) : [];
                      const hasComparisonBlock = comparisonRows.length > 0;
                      const hasExperienceDetail = Boolean(explanation?.experienceSupportLine)
                        || Boolean(explanation?.experienceReason)
                        || (Array.isArray(explanation?.experienceHighlights) && explanation.experienceHighlights.some(Boolean));
                      const hasSelfReportDetail = Boolean(explanation?.selfReportSupportLine)
                        || (Array.isArray(explanation?.selfReportHighlights) && explanation.selfReportHighlights.some(Boolean));
                      const showLegacyExperienceDetail = hasExperienceDetail && !hasComparisonBlock;
                      const showLegacySelfReportDetail = hasSelfReportDetail && !hasComparisonBlock;
                      // Round 6: axis1 producer fields (append-only, safe when absent)
                      const isAxis1 = axis?.key === "jobStructure";
                      const axis1BridgeContext  = isAxis1 && typeof explanation?.explanationBridgeContext  === "string" ? explanation.explanationBridgeContext.trim()  : "";
                      const axis1WhyNotHigher   = isAxis1 && typeof explanation?.explanationWhyNotHigher   === "string" ? explanation.explanationWhyNotHigher.trim()   : "";
                      const isCareerAxisCard = !isNewgradReport;
                      const hasSummarySignalBox = isCareerAxisCard && (explanationPositives.length > 0 || explanationGaps.length > 0);
                      const hasExplanationDetail = hasSlots
                        || showLegacyExperienceDetail
                        || showLegacySelfReportDetail
                        || explanationReasons.length > 0
                        || explanationPositives.length > 0
                        || explanationGaps.length > 0
                        || Boolean(axis1BridgeContext)
                        || Boolean(axis1WhyNotHigher);
                      return (
                        <div key={label} id={isNewgradReport ? `newgrad-axis-detail-${index}` : undefined} className={isNewgradReport ? "py-3 scroll-mt-16" : "py-3.5"}>
                          <div className="flex items-start justify-between gap-3">
                            <div className={isNewgradReport ? "text-[13px] font-semibold text-slate-900" : "text-[15px] leading-6 font-semibold text-slate-800"}>{label}</div>
                            {isNewgradReport ? (
                              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getNewgradScoreBadgeClass(band)}`}>
                                {score5}/5 {scoreLabel}
                              </span>
                            ) : (
                              <div className="shrink-0 pt-0.5 text-sm font-medium text-slate-700">{score5}/5 <span className="font-medium text-slate-600">{scoreLabel}</span></div>
                            )}
                          </div>
                          {axis?.description ? (
                            <p className="mt-1 text-sm leading-6 text-slate-600">{axis.description}</p>
                          ) : null}
                          {hasSummarySignalBox && (!isCareerAxisCard || isExpanded) ? (
                            <div className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50/85 px-4 py-3 space-y-3">
                              {explanationPositives.length > 0 ? (
                                <div>
                                  <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uAC15\uC810 \uC2E0\uD638"}</p>
                                  <ul className="space-y-1.5">
                                    {explanationPositives.map((p, i) => (
                                      <li key={`${label}-summary-positive-${i}`} className="flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                                        <span className="mt-0.5 shrink-0 text-emerald-500">{"\u2713"}</span>{p}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                              {explanationGaps.length > 0 ? (
                                <div>
                                  <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uBCF4\uC644 \uD3EC\uC778\uD2B8"}</p>
                                  <ul className="space-y-1.5">
                                    {explanationGaps.map((g, i) => (
                                      <li key={`${label}-summary-gap-${i}`} className="flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                                        <span className="mt-0.5 shrink-0 text-amber-400">{"\u25B3"}</span>{g}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                          {(!isCareerAxisCard || hasSlots) ? (
                            <>
                              <p className={isNewgradReport ? "mt-1.5 text-sm leading-[1.65] text-slate-700" : "mt-1.5 text-sm leading-6 text-slate-600"}>{primaryBody}</p>
                              {secondaryBody ? (
                                <p className="mt-1.5 text-sm leading-6 text-slate-500">{secondaryBody}</p>
                              ) : null}
                            </>
                          ) : null}
                          {explanation && hasExplanationDetail ? (
                            <>
                              {(!isCareerAxisCard || !isExpanded) ? (
                                <button
                                  type="button"
                                  className={[
                                    (hasSummarySignalBox && (!isCareerAxisCard || isExpanded)) ? "mt-2.5" : "mt-1",
                                    "inline-flex items-center rounded-full bg-slate-100/90 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-800"
                                  ].join(" ")}
                                  onClick={() => setExpandedAxisKey(isExpanded ? null : label)}
                                >
                                  {isExpanded ? "닫기" : "상세보기"}
                                </button>
                              ) : null}
                              {isExpanded ? (
                                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                                  {isCareerAxisCard && !hasSlots ? (
                                    <div className="space-y-2.5 border-b border-slate-200/80 pb-3">
                                      <p className="text-sm leading-6 text-slate-600">{primaryBody}</p>
                                      {secondaryBody ? (
                                        <p className="text-sm leading-6 text-slate-500">{secondaryBody}</p>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {hasSlots && slotCriteria ? (
                                    <div>
                                      <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uD310\uB2E8 \uAE30\uC900"}</p>
                                      <p className="text-sm leading-6 text-slate-600">{slotCriteria}</p>
                                    </div>
                                  ) : null}
                                  {hasSlots && slotLiftOrLimit ? (
                                    <div>
                                      <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uB2E4\uC74C \uBCF4\uC644 \uBC29\uD5A5"}</p>
                                      <p className="text-sm leading-6 text-slate-600">{slotLiftOrLimit}</p>
                                    </div>
                                  ) : null}
                                  {isNewgradReport && index === 1 && (() => {
                                    const bridge = bridgeResult?.data?.bridgeResult;
                                    const bridgeCore = bridge?.bridge;
                                    const industryVariables = Array.isArray(bridgeCore?.industryVariablesForJob) ? bridgeCore.industryVariablesForJob : [];
                                    const roleInIndustry = String(bridgeCore?.roleInIndustry || "").trim();
                                    const nextEvidencePrompt = String(bridge?.axisRewrites?.industryContext?.nextEvidencePrompt || "").trim();
                                    const passGuard = bridge &&
                                      bridge.qualityFlags?.tooGeneric !== true &&
                                      bridge.qualityFlags?.missingIndustryVariables !== true &&
                                      bridge.qualityFlags?.weakRoleInIndustry !== true &&
                                      industryVariables.length >= 3 &&
                                      roleInIndustry.length >= 30 &&
                                      nextEvidencePrompt.length >= 20;
                                    if (!passGuard) return null;
                                    const prompt = nextEvidencePrompt;
                                    const vars = industryVariables.slice(0, 3);
                                    return (
                                      <div>
                                        <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uC774 \uC9C1\uBB34\u00D7\uC0B0\uC5C5 \uC5F0\uACB0 \uB9E5\uB77D"}</p>
                                        <p className="text-[12px] leading-[1.7] text-slate-500">{roleInIndustry}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-600">{prompt}</p>
                                        {vars.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="text-[11px] text-slate-400">{"\uC0B0\uC5C5 \uBCC0\uC218"}</span>
                                            {vars.map((v, i) => (
                                              <span key={i} className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11.5px] font-medium text-sky-700">{v}</span>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  {isNewgradReport && explanation?.whyThisAxisMatters ? (
                                    <div>
                                      <p className="mb-1 text-[10px] font-medium text-slate-400">왜 이 축을 보나요?</p>
                                      <p className="text-[10.5px] leading-[1.6] text-slate-500">{explanation.whyThisAxisMatters}</p>
                                    </div>
                                  ) : null}
                                  {showLegacyExperienceDetail ? (
                                    <div className="rounded-lg border border-sky-100 bg-white/90 px-3 py-3">
                                      <p className="mb-1.5 text-[13px] font-semibold text-sky-700">{"\uC2E4\uC804 \uACBD\uD5D8 \uBC18\uC601"}</p>
                                      {explanation.experienceSupportLine ? (
                                        <p className="text-sm leading-6 text-slate-600">{explanation.experienceSupportLine}</p>
                                      ) : null}
                                      {explanation.experienceReason ? (
                                        <p className="mt-1.5 text-sm leading-6 text-slate-500">{explanation.experienceReason}</p>
                                      ) : null}
                                      {Array.isArray(explanation.experienceHighlights) && explanation.experienceHighlights.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                          {explanation.experienceHighlights.map((item, i) => (
                                            <span key={`${label}-experience-${i}`} className="inline-flex items-center rounded-full bg-sky-50 px-2 py-0.5 text-[11.5px] font-medium text-sky-700">
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {showLegacySelfReportDetail ? (
                                    <div className="rounded-lg border border-indigo-100 bg-white/90 px-3 py-3">
                                      <p className="mb-1.5 text-[13px] font-semibold text-indigo-600">{"\uC785\uB825 \uAE30\uBC18 \uD574\uC11D"}</p>
                                      {explanation.selfReportSupportLine ? (
                                        <p className="text-sm leading-6 text-slate-600">{explanation.selfReportSupportLine}</p>
                                      ) : null}
                                      {Array.isArray(explanation.selfReportHighlights) && explanation.selfReportHighlights.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                          {explanation.selfReportHighlights.map((item, i) => (
                                            <span key={`${label}-self-report-${i}`} className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11.5px] font-medium text-indigo-600">
                                              {item}
                                            </span>
                                          ))}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                  {isNewgradReport && !hasSlots && explanationReasons.length > 0 ? (
                                    <div>
                                      <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uBC18\uC601 \uC774\uC720"}</p>
                                      <ul className="space-y-1.5">
                                        {explanationReasons.map((reasonLabel, i) => (
                                          <li key={`${label}-reason-${i}`} className="flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                                            <span className="mt-0.5 shrink-0 text-slate-300">{"\u2022"}</span>{reasonLabel}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                  {!hasSlots && !hasSummarySignalBox && explanationPositives.length > 0 ? (
                                    <div>
                                      <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uAC15\uC810 \uC2E0\uD638"}</p>
                                      <ul className="space-y-1.5">
                                        {explanationPositives.map((p, i) => (
                                          <li key={i} className="flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                                            <span className="mt-0.5 shrink-0 text-emerald-500">{"\u2713"}</span>{p}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                  {!hasSlots && !hasSummarySignalBox && explanationGaps.length > 0 ? (
                                    <div>
                                      <p className="mb-1.5 text-[13px] font-semibold text-slate-700">{"\uBCF4\uC644 \uD3EC\uC778\uD2B8"}</p>
                                      <ul className="space-y-1.5">
                                        {explanationGaps.map((g, i) => (
                                          <li key={i} className="flex items-start gap-1.5 text-sm leading-6 text-slate-600">
                                            <span className="mt-0.5 shrink-0 text-amber-400">{"\u25B3"}</span>{g}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ) : null}
                                  {axis1BridgeContext ? (
                                    <div className="mt-1">
                                      <p className="mb-1 text-[13px] font-semibold text-slate-700">{"\uC5F0\uACB0\uB418\uB294 \uC9C0\uC810"}</p>
                                      <p className="text-sm leading-[1.65] text-slate-600">{axis1BridgeContext}</p>
                                    </div>
                                  ) : null}
                                  {axis1WhyNotHigher ? (
                                    <div className="mt-1">
                                      <p className="mb-1 text-[13px] font-semibold text-slate-700">{"\uB354 \uB192\uAC8C \uBCF4\uAE30 \uC5B4\uB824\uC6B4 \uC774\uC720"}</p>
                                      <p className="text-sm leading-[1.65] text-slate-600">{axis1WhyNotHigher}</p>
                                    </div>
                                  ) : null}
                                  {isCareerAxisCard ? (
                                    <button
                                      type="button"
                                      className="inline-flex items-center rounded-full bg-slate-100/90 px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-800"
                                      onClick={() => setExpandedAxisKey(null)}
                                    >
                                      {"닫기"}
                                    </button>
                                  ) : null}
                                </div>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      );
                    })}
                      </div>
                    )}
                  </div>

                  {false ? (
                    <p className="mt-3 text-[11px] leading-5 text-slate-400">
                      ??關履?????レ챺????⑤베源? ?怨뚮옖???癲ル슣????筌믨퀡?꾬┼?????쭕???怨뚮옖甕???ш낄猷?湲븐땡?堉온 ?????? ?????????덊렡.
                    </p>
                  ) : null}
                </>
              );
            })()}
          </div>
        </section>
      ) : null}

      {ENABLE_NEWGRAD_CERT_WHAT_IF && isNewgradReport && sourceInput ? (
        <WhatIfCertSection sourceInput={sourceInput} baseVm={vm} />
      ) : null}

      {topRisks.length > 0 ? (
        <section className="mb-7 sm:mb-6">
          <MobileSection sectionKey="top_risk" title={"\uC0C1\uC704 \uB9AC\uC2A4\uD06C \uC2E0\uD638"} isOpen={openSections.has("top_risk")} onToggle={toggleSection}>
            <SectionCard
              variant="risk"
              title={"\uC0C1\uC704 \uB9AC\uC2A4\uD06C \uC2E0\uD638"}
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-amber-300 sm:mb-4" />
              <RiskList
                items={topRisks}
                activeExplanationRowKey={activeExplanationRowKey}
                onSelectExplanationRow={onSelectExplanationRow}
                onExplanationRowMount={onExplanationRowMount}
                buyingMotionPanel={buyingMotionPanel}
                decisionStructurePanel={decisionStructurePanel}
                customerStructurePanel={customerStructurePanel}
                operatingContextPanel={operatingContextPanel}
                jobRoleSummaryPanel={jobRoleSummaryPanel}
                jobKeyOutputsPanel={jobKeyOutputsPanel}
                jobScopePanel={jobScopePanel}
                jobDecisionCriteriaPanel={jobDecisionCriteriaPanel}
              />
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {hasTransitionReadBlock && !isNewgradReport ? (
        <section className="mb-8 sm:mb-7">
          <MobileSection sectionKey="interviewer_focus" title={transitionReadSectionTitle} isOpen={openSections.has("interviewer_focus")} onToggle={toggleSection}>
            <SectionCard
              variant="muted"
              title={transitionReadSectionTitle}
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-primary sm:mb-4" />
              {transitionReadIntro ? (
                <p className="mb-5.5 text-[15px] leading-[1.85] text-slate-700 sm:mb-5 sm:text-base sm:leading-7">{transitionReadIntro}</p>
              ) : null}
              <TransitionReadCards cards={transitionReadCards} />
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {shouldRenderNewgradRepairSignalsSection && isNewgradReport && topRepairSignals.length > 0 ? (
        <section className="mb-6 sm:mb-5">
          <MobileSection sectionKey="repair_signals" title="핵심 보강 포인트" isOpen={openSections.has("repair_signals")} onToggle={toggleSection}>
            <SectionCard
              variant="muted"
              title="핵심 보강 포인트"
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-amber-300 sm:mb-4" />
              <div className="space-y-3">
                {newgradRepairCards.map((signal, idx) => (
                  <div key={signal.axisKey || idx} className="rounded-[14px] border border-amber-100 bg-amber-50/70 px-3.5 py-3">
                    <div className="mb-1 text-[13px] font-semibold text-amber-800">{signal.title}</div>
                    <p className="text-[12.5px] leading-[1.65] text-slate-700">{signal.why}</p>
                    <p className="mt-1.5 text-[12.5px] leading-[1.65] text-slate-600">{signal.how}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {newgradComparisonCardsWithAction.length > 0 ? (
        <section id="newgrad-detailed-read" className="mb-7 sm:mb-6">
          <MobileSection sectionKey="newgrad_detailed_read" title={"\uC138\uBD80 \uD310\uB3C5"} isOpen={openSections.has("newgrad_detailed_read")} onToggle={toggleSection}>
            <SectionCard
              variant="muted"
              title={"\uC138\uBD80 \uD310\uB3C5"}
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-sky-300 sm:mb-4" />
              <NewgradDetailedReadSection items={newgradComparisonCardsWithAction} isOpen={openSections.has("newgrad_detailed_read")} onToggle={() => toggleSection("newgrad_detailed_read")} />
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {whatIfPreparationPack ? (
        <NewgradWhatIfPreparationSection pack={whatIfPreparationPack} jobMajorCategory={whatIfJobMajorCategory} />
      ) : null}

      {isNewgradReport && strengthEvidenceRead ? (
        <section className="mb-6 sm:mb-5">
          <MobileSection sectionKey="strength_evidence" title="강점 연결 근거" isOpen={openSections.has("strength_evidence")} onToggle={toggleSection}>
            <SectionCard
              variant="default"
              title="강점 연결 근거"
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-violet-200 sm:mb-4" />
              {strengthEvidenceRead.hasDirectMatch ? (
                <div className="space-y-3">
                  {strengthEvidenceRead.matchedStrengthLabels.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-[12.5px] font-medium text-slate-500">목표 직무와 연결되는 강점</p>
                      <div className="flex flex-wrap gap-1.5">
                        {strengthEvidenceRead.matchedStrengthLabels.map((label, i) => (
                          <span key={i} className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[12px] font-medium text-violet-700">{label}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {strengthEvidenceRead.matchedWorkStyleLabels.length > 0 ? (
                    <div>
                      <p className="mb-1.5 text-[12.5px] font-medium text-slate-500">목표 직무와 연결되는 일하는 방식</p>
                      <div className="flex flex-wrap gap-1.5">
                        {strengthEvidenceRead.matchedWorkStyleLabels.map((label, i) => (
                          <span key={i} className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[12px] font-medium text-sky-700">{label}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="text-[11px] leading-5 text-slate-400">아래 강점은 목표 직무의 성격과 비교적 직접 맞닿아 있습니다. 자가보고 기반이므로 실제 경험 근거와 함께 어필하세요.</p>
                </div>
              ) : (
                <p className="mb-2 text-[12.5px] leading-relaxed text-slate-500">입력한 강점은 있으나, 현재 정보만으로는 목표 직무와 직접 연결되는 강점이 뚜렷하게 잡히지 않았습니다.</p>
              )}
              {strengthEvidenceRead.allStrengthLabels.length > 0 ? (
                <div className={strengthEvidenceRead.hasDirectMatch ? "mt-4 border-t border-slate-100 pt-3" : "mt-2"}>
                  <p className="mb-1.5 text-[12px] font-medium text-slate-400">입력한 강점</p>
                  <div className="flex flex-wrap gap-1.5">
                    {strengthEvidenceRead.allStrengthLabels.map((label, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">{label}</span>
                    ))}
                  </div>
                </div>
              ) : null}
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {transitionCompoundRead ? (
        <section className="mb-7 sm:mb-6">
          <MobileSection sectionKey="compound_read" title={transitionCompoundRead?.title || "이 전환은 어떻게 읽히나요?"} isOpen={openSections.has("compound_read")} onToggle={toggleSection}>
            <SectionCard
              variant="default"
              title={transitionCompoundRead?.title || "이 전환은 어떻게 읽히나요?"}
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-slate-300 sm:mb-4" />
              <div className="space-y-3.5 sm:space-y-3">
                {transitionCompoundRead.headline ? (
                  <div className="rounded-[16px] border border-slate-200 bg-slate-50/70 px-4.5 py-3.5 sm:gap-3 sm:px-4 sm:py-3">
                    <p className="text-sm font-semibold leading-[1.75] text-slate-950 sm:leading-6">
                      {transitionCompoundRead.headline}
                    </p>
                  </div>
                ) : null}
                {transitionCompoundRead.body ? (
                  <div className="rounded-[16px] border border-slate-200 bg-white px-4.5 py-3.5 sm:gap-3 sm:px-4 sm:py-3">
                    <p className="text-sm leading-[1.75] text-slate-700 sm:leading-6">
                      {transitionCompoundRead.body}
                    </p>
                  </div>
                ) : null}
                {transitionCompoundRead.actionFrame ? (
                  <div className="rounded-[16px] border border-amber-100 bg-amber-50/40 px-4.5 py-3.5 sm:gap-3 sm:px-4 sm:py-3">
                    <p className="text-[13px] leading-[1.75] text-slate-600 sm:leading-6">
                      <span className="font-semibold text-slate-700">다음 단계:</span> {transitionCompoundRead.actionFrame}
                    </p>
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {strengths.length > 0 && !(isNewgradReport && strengthEvidenceRead) ? (
        <section className="mb-7 sm:mb-6">
          <MobileSection sectionKey="strengths_or_appeal" title={"\uAC15\uC810 \uD65C\uC6A9 / \uC5B4\uD544 \uD3EC\uC778\uD2B8"} isOpen={openSections.has("strengths_or_appeal")} onToggle={toggleSection}>
            <SectionCard
              variant="default"
              title={"\uAC15\uC810 \uD65C\uC6A9 / \uC5B4\uD544 \uD3EC\uC778\uD2B8"}
              printCard
              titleClassName="text-[19px] font-semibold leading-7 tracking-tight text-slate-950 sm:text-xl sm:leading-none"
              hideMobileTitle
            >
              <div className="mb-4.5 h-1 w-10 rounded-full bg-slate-300 sm:mb-4" />
              <ListBlock items={strengths} />
            </SectionCard>
          </MobileSection>
        </section>
      ) : null}

      {hasReferenceInfo ? (
        <section className="space-y-4 sm:space-y-3">
          <div className="hidden px-1 text-[13px] font-semibold leading-6 text-slate-500 sm:leading-5 md:block">{"\uCC38\uACE0 \uC815\uBCF4"}</div>

          {targetJobRead.title || targetJobBody || targetJobBullets.length > 0 ? (
            <MobileSection sectionKey="target_job_read" title={"\uC9C0\uC6D0 \uC9C1\uBB34 \uD2B9\uC9D5"} isOpen={openSections.has("target_job_read")} onToggle={toggleSection}>
            <SectionCard
              variant="compact"
              title={"\uC9C0\uC6D0 \uC9C1\uBB34 \uD2B9\uC9D5"}
              printCard
              titleClassName="flex items-center gap-3 text-[18px] font-semibold leading-6 tracking-tight text-slate-950 sm:text-[19px] sm:leading-none before:h-6 before:w-1 before:rounded-full before:bg-indigo-500/90 before:content-['']"
              hideMobileTitle
            >
              {(targetJobRead.title || targetJobTags.length > 0) ? (
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    {targetJobRead.title ? (
                      <span className="inline-flex rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3 py-1 text-[12px] font-medium leading-5 text-indigo-700">{String(targetJobRead.title)}</span>
                    ) : null}
                  </div>
                  {targetJobTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 sm:ml-6 sm:max-w-[58%] sm:justify-end">
                      {targetJobTags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center rounded-full bg-violet-500 px-3 py-1 text-[12px] font-semibold leading-5 text-white shadow-sm">{`#${tag}`}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {targetJobBody ? (
                <div className="mb-5 rounded-[18px] border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-violet-50 to-white px-4.5 py-4 text-[14px] leading-[1.8] text-slate-800 shadow-[0_1px_2px_rgba(99,102,241,0.08)] sm:mb-4.5 sm:px-4 sm:py-3.5 sm:text-[15px] sm:leading-7">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-700/80">{"\uD575\uC2EC \uC694\uC57D"}</span>
                  </div>
                  <div className="whitespace-pre-line">{targetJobBody}</div>
                </div>
              ) : null}
              <ListBlock items={targetJobBullets} compact tone="job" />
            </SectionCard>
            </MobileSection>
          ) : null}

          {hasIndustryTraitsAsset ? (
            <MobileSection sectionKey="target_industry_read" title={"\uC9C0\uC6D0 \uC0B0\uC5C5 \uD2B9\uC9D5"} isOpen={openSections.has("target_industry_read")} onToggle={toggleSection}>
            <SectionCard
              variant="compact"
              title={"\uC9C0\uC6D0 \uC0B0\uC5C5 \uD2B9\uC9D5"}
              printCard
              titleClassName="flex items-center gap-3 text-[18px] font-semibold leading-6 tracking-tight text-slate-950 sm:text-[19px] sm:leading-none before:h-6 before:w-1 before:rounded-full before:bg-sky-500/90 before:content-['']"
              hideMobileTitle
            >
              {industryTraitsDisplayLabel ? (
                <div className="mb-4 inline-flex rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 text-[12px] font-medium leading-5 text-sky-700 sm:mb-3.5">{industryTraitsDisplayLabel}</div>
              ) : null}
              {industryTraitsSummary ? (
                <div className="mb-6 rounded-[18px] border border-sky-200/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-white px-4.5 py-4 text-[14px] leading-[1.82] text-slate-800 shadow-[0_1px_2px_rgba(14,165,233,0.08)] sm:mb-5.5 sm:px-4 sm:py-3.5 sm:text-[15px] sm:leading-7">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700/80">{"\uD575\uC2EC \uC694\uC57D"}</span>
                  </div>
                  <div className="whitespace-pre-line">{industryTraitsSummary}</div>
                </div>
              ) : null}
              <div className="space-y-6.5 border-t border-sky-100 pt-5.5 sm:space-y-6 sm:pt-5">
                <TraitSection title={"\uC65C \uC774 \uC0B0\uC5C5\uC774 \uC911\uC694\uD55C\uAC00"} items={industryTraitsWhy} tone="industry" />
                <TraitSection title={"\uC2E4\uBB34 \uD3C9\uAC00 \uAE30\uC900"} items={industryTraitsEvaluation} tone="industry" />
                {(industryTraitsBusinessStructure || industryTraitsCustomerStructure || industryTraitsOperatingLanguage) ? (
                  <div className="space-y-2 border-t border-sky-100 pt-4">
                    {industryTraitsBusinessStructure ? (
                      <div className="flex gap-2 text-[13px] leading-[1.7] text-slate-700 sm:text-[14px]">
                        <span className="shrink-0 font-medium text-slate-500">{"\uC0AC\uC5C5 \uAD6C\uC870"}</span>
                        <span>{industryTraitsBusinessStructure}</span>
                      </div>
                    ) : null}
                    {industryTraitsCustomerStructure ? (
                      <div className="flex gap-2 text-[13px] leading-[1.7] text-slate-700 sm:text-[14px]">
                        <span className="shrink-0 font-medium text-slate-500">{"\uACE0\uAC1D \uAD6C\uC870"}</span>
                        <span>{industryTraitsCustomerStructure}</span>
                      </div>
                    ) : null}
                    {industryTraitsOperatingLanguage ? (
                      <div className="flex gap-2 text-[13px] leading-[1.7] text-slate-700 sm:text-[14px]">
                        <span className="shrink-0 font-medium text-slate-500">{"\uD604\uC5C5 \uC5B8\uC5B4"}</span>
                        <span>{industryTraitsOperatingLanguage}</span>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </SectionCard>
            </MobileSection>
          ) : targetIndustryRead.title || targetIndustryBullets.length > 0 ? (
            <MobileSection sectionKey="target_industry_read" title={"\uC9C0\uC6D0 \uC0B0\uC5C5 \uD2B9\uC9D5"} isOpen={openSections.has("target_industry_read")} onToggle={toggleSection}>
            <SectionCard
              variant="compact"
              title={"\uC9C0\uC6D0 \uC0B0\uC5C5 \uD2B9\uC9D5"}
              printCard
              titleClassName="flex items-center gap-3 text-[18px] font-semibold leading-6 tracking-tight text-slate-950 sm:text-[19px] sm:leading-none before:h-6 before:w-1 before:rounded-full before:bg-sky-500/90 before:content-['']"
              hideMobileTitle
            >
              {targetIndustryRead.title ? (
                <div className="mb-4 inline-flex rounded-full border border-sky-200/80 bg-sky-50/80 px-3 py-1 text-[12px] font-medium leading-5 text-sky-700 sm:mb-3.5">{String(targetIndustryRead.title)}</div>
              ) : null}
              {targetIndustrySummary ? (
                <div className="mb-5 rounded-[18px] border border-sky-200/80 bg-gradient-to-br from-sky-50 via-cyan-50 to-white px-4.5 py-4 text-[14px] leading-[1.82] text-slate-800 shadow-[0_1px_2px_rgba(14,165,233,0.08)] sm:mb-4.5 sm:px-4 sm:py-3.5 sm:text-[15px] sm:leading-7">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700/80">{"\uD575\uC2EC \uC694\uC57D"}</span>
                  </div>
                  <div className="whitespace-pre-line">{targetIndustrySummary}</div>
                </div>
              ) : null}
              <ListBlock items={targetIndustryBullets} compact tone="industry" />
            </SectionCard>
            </MobileSection>
          ) : null}
        </section>
      ) : null}

      {!isNewgradReport && aiEvidence.eligible && !aiEvidence.loading && aiEvidence.data && (
        <CareerFitAiEvidenceSection evidence={aiEvidence.data} data-print-hidden="true" />
      )}

      {shouldShowConsultingCta && (
      <section className="mt-7 sm:mt-6" data-print-hidden="true">
        <Card className="mt-6 rounded-2xl border bg-background/70 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-900 leading-snug">
              {"분석 결과를 실제 합격 전략으로 바꿔보세요"}
            </CardTitle>
            <div className="mt-1 text-sm text-slate-500 leading-relaxed">
              {"현재 분석 결과를 바탕으로, 지원 직무에 맞는 표현으로 정리하고 합격 관점에서 더 설득력 있게 보완할 수 있습니다."}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 text-sm sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Card 1: QUICK CHECK */}
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="text-[10px] font-semibold tracking-widest text-blue-500 uppercase mb-2">{"QUICK CHECK"}</div>
                <div className="text-sm font-bold text-slate-900 mb-1">{"미니 컨설팅"}</div>
                <div className="text-xs text-slate-500 mb-3 sm:mb-4">{"지금 내 상태가 궁금할 때"}</div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-5">{"무료"}</div>
                <ul className="space-y-2 mb-4 sm:mb-5 flex-1">
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-400 shrink-0">✓</span>{"15분 빠른 점검"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-400 shrink-0">✓</span>{"핵심 포인트 피드백"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-400 shrink-0">✓</span>{"온라인 진행"}</li>
                </ul>
                <a
                  className="mt-auto block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  href="/reject-analyzer/?page=consulting-lead&type=mini"
                >
                  {"신청하기"}
                </a>
              </div>

              {/* Card 2: EMERGENCY (emphasized) */}
              <div className="relative flex flex-col rounded-2xl border-2 border-blue-600 bg-blue-50/20 p-3 sm:p-5 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-blue-600 px-3 py-0.5 text-xs font-semibold text-white whitespace-nowrap">{"인기"}</span>
                </div>
                <span className="absolute top-3 right-3 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-medium text-orange-500">{"한시적 이벤트"}</span>
                <div className="text-[10px] font-semibold tracking-widest text-blue-600 uppercase mb-2">{"EMERGENCY"}</div>
                <div className="text-sm font-bold text-slate-900 mb-1">{"원포인트 컨설팅"}</div>
                <div className="text-xs text-slate-500 mb-3 sm:mb-4">{"당장 제출이나 면접이 급할 때"}</div>
                <div className="mb-4 sm:mb-5">
                  <div className="text-sm text-slate-400 line-through">{"200,000원"}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900">{"120,000원"}</div>
                </div>
                <ul className="space-y-2 mb-4 sm:mb-5 flex-1">
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-500 shrink-0">✓</span>{"1회 60분 집중 진행"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-500 shrink-0">✓</span>{"서류 혹은 면접 택 1"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-500 shrink-0">✓</span>{"합격 맞춤형 정밀 첨삭"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-500 shrink-0">✓</span>{"집중 모의 면접 (선택 시)"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-blue-500 shrink-0">✓</span>{"온라인 진행"}</li>
                </ul>
                <a
                  className="mt-auto block w-full rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                  href="/reject-analyzer/?page=consulting-lead&type=onepoint"
                >
                  {"1:1 원포인트 신청하기"}
                </a>
              </div>

              {/* Card 3: MASTER CLASS */}
              <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="text-[10px] font-semibold tracking-widest text-slate-500 uppercase mb-2">{"MASTER CLASS"}</div>
                <div className="text-sm font-bold text-slate-900 mb-1">{"1:1 집중 취업 밀착 케어"}</div>
                <div className="text-xs text-slate-500 mb-3 sm:mb-4">{"취업, 이직의 판을 바꾸고 싶을 때"}</div>
                <div className="text-2xl font-bold text-slate-700 mb-4 sm:mb-5">{"상담 후 결정"}</div>
                <ul className="space-y-2 mb-4 sm:mb-5 flex-1">
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-slate-400 shrink-0">✓</span>{"1시간 x 4회 완성"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-slate-400 shrink-0">✓</span>{"커리어 전환/합격 전략 설계"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-slate-400 shrink-0">✓</span>{"입사서류 + 면접 + 산업분석"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-slate-400 shrink-0">✓</span>{"1:1 멘탈 관리 및 동기부여"}</li>
                  <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-700"><span className="mt-0.5 text-slate-400 shrink-0">✓</span>{"온·오프라인 하이브리드"}</li>
                </ul>
                <a
                  className="mt-auto block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  href="/reject-analyzer/?page=consulting-lead&type=care"
                >
                  {"커스텀 견적 문의하기"}
                </a>
              </div>
            </div>
            {SHOW_RECOMMENDATION_REVIEW_SECTION && <div className="rounded-[24px] border border-slate-300/90 bg-gradient-to-br from-white via-slate-50/90 to-slate-100/80 px-4 py-4.5 shadow-[0_10px_24px_rgba(15,23,42,0.06)] sm:px-5 sm:py-5">
              <div className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-700">
                추천 기회 검토
              </div>
              <div className="mt-3 text-[17px] font-semibold leading-6 tracking-tight text-slate-950 sm:text-[18px]">
                이력서 등록하고 추천 기회 받아보기
              </div>
              <div className="mt-2 text-[15px] font-medium leading-6 text-slate-800">
                내 경력이 실제로 통할 수 있는 포지션이 있는지 먼저 확인해보세요.
              </div>
              <div className="mt-1.5 text-sm leading-[1.7] text-slate-600">
                현재 결과와 이력서를 함께 보고, 추천 가능한 기회가 있는 경우에만 이메일로 별도 안내드립니다.
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="rounded-2xl bg-white/90 px-3.5 py-3 ring-1 ring-slate-200/80">
                  <div className="text-[13px] font-semibold text-slate-900">추천 가능한 포지션 추가 검토</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">분석 결과만으로 끝내지 않고, 이력서까지 함께 보고 실제로 검토 가능한 기회가 있는지 한 번 더 확인합니다.</div>
                </div>
                <div className="rounded-2xl bg-white/90 px-3.5 py-3 ring-1 ring-slate-200/80">
                  <div className="text-[13px] font-semibold text-slate-900">내 경력이 어디서 더 설득될지 확인</div>
                  <div className="mt-1 text-sm leading-6 text-slate-600">혼자 계속 지원하기 전에, 현재 경력이 어떤 방향에서 더 설득력 있게 읽힐지 먼저 검토합니다.</div>
                </div>
              </div>
              <ul className="mt-4 space-y-2.5 text-sm leading-6 text-slate-700">
                <li className="flex items-start gap-2.5 rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-200/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  <span>상세 이력서는 동의 없이 바로 공유되지 않습니다</span>
                </li>
                <li className="flex items-start gap-2.5 rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-200/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  <span>익명 요약 형태로 먼저 검토가 진행됩니다</span>
                </li>
                <li className="flex items-start gap-2.5 rounded-2xl bg-white/80 px-3 py-2.5 ring-1 ring-slate-200/80">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  <span>추천 가능한 경우에만 별도로 안내드립니다</span>
                </li>
              </ul>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-2 text-[12px] font-medium text-slate-700 ring-1 ring-slate-200/80">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] text-slate-700 ring-1 ring-slate-200">✓</span>
                  <span>동의 전 외부 공유 없음</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-auto min-h-12 rounded-xl border-slate-400 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
                  onClick={() => setResumeSheetOpen(true)}
                >
                  이력서 등록하기
                </Button>
              </div>
            </div>}

            <div className="text-xs text-slate-500 leading-6 sm:leading-relaxed">
              {"\u203B \uD604\uC7AC \uBD84\uC11D \uACB0\uACFC\uB97C \uAE30\uC900\uC73C\uB85C, \uBB38\uC7A5 \uB2E8\uC704\uAE4C\uC9C0 \uAD6C\uCCB4\uC801\uC73C\uB85C \uD568\uAED8 \uC815\uB9AC\uD569\uB2C8\uB2E4."}
            </div>
          </CardContent>
        </Card>
      </section>
      )}

      <div className="flex justify-center pt-2" ref={shareAnchorRef} data-print-hidden="true">
        <Button
          variant="outline"
          className="rounded-full h-11 px-5"
          onClick={() => onOpenShare?.()}
        >
          {"\uD83D\uDCE4 \uACF5\uC720\uD558\uAE30"}
        </Button>
      </div>

      <div data-print-hidden="true">
        <ResumeRecommendationSheet
          open={resumeSheetOpen}
          onClose={() => setResumeSheetOpen(false)}
          payloadContext={resumeRequestContext}
        />
      </div>
      </div>
    </div>
  );
}
