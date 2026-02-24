// src/components/HypothesisCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HypothesisCard({ h }) {
  const pr = (() => {
    const raw = typeof h?.priority === "number" ? h.priority : Number(h?.priority ?? 0);
    const n = Number.isFinite(raw) ? raw : 0;
    const p = n <= 1 ? n * 100 : n; // 0~1 또는 0~100 혼재 방어
    return Math.round(Math.max(0, Math.min(100, p)));
  })();
  const tier = pr >= 75 ? "high" : pr >= 55 ? "mid" : "low";
  const badgeVariant = tier === "high" ? "destructive" : tier === "mid" ? "secondary" : "outline";

  // [PATCH] context impact display (A-stage, append-only)
  const impactLevel = h?.impactLevel ?? h?.explain?.impactLevel;
  const importanceWeight = h?.importanceWeight ?? h?.explain?.importanceWeight;
  const impactReasons = h?.impactReasons ?? h?.explain?.impactReasons;

  // [PATCH] optional context fields (A-stage, append-only)
  const contextSummary = h?.contextSummary ?? h?.explain?.contextSummary;
  const contextChips = h?.contextChips ?? h?.explain?.contextChips;

  const __num = (v) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const __w = __num(importanceWeight);
  const __weightText = __w != null ? `x${__w.toFixed(2)}` : null;

  // [PATCH] robust impact badge variant (handle KR/EN; do not depend on file-encoded literals)
  // [PATCH] robust impact badge variant (ASCII-safe)
  const __il = typeof impactLevel === "string" ? impactLevel.trim() : "";
  const __ilLow = __il.toLowerCase();

  const impactBadgeVariant =
    __ilLow.includes("high") || __ilLow.includes("critical") || __ilLow.includes("severe")
      ? "destructive"
      : (__ilLow.includes("mid") || __ilLow.includes("medium") || __ilLow.includes("normal"))
        ? "secondary"
        : "outline";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="rounded-2xl border bg-card shadow-sm"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-base font-semibold leading-tight">{h?.title ?? "가설"}</div>
            <div className="text-xs text-muted-foreground">
              단정이 아닌 가설입니다. 입력 정보가 많을수록 정확해질 가능성이 커집니다.
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <Badge variant={badgeVariant}>우선순위 {pr}/100</Badge>

            {impactLevel ? (
              <Badge variant={impactBadgeVariant} className="text-xs">
                영향 {impactLevel}
              </Badge>
            ) : null}

            {__weightText ? (
              <Badge variant="outline" className="text-xs">
                {__weightText}
              </Badge>
            ) : null}
          </div>
        </div>

        {/* WHY */}
        <div className="text-sm leading-relaxed text-foreground/90">{h?.why ?? "-"}</div>

        {/* [PATCH] optional context summary/chips (A-stage, append-only) */}
        {contextSummary ? (
          <div className="rounded-xl bg-muted/20 p-3">
            <div className="text-xs font-semibold mb-1">맥락 요약</div>
            <div className="text-xs text-foreground/80 leading-relaxed">{contextSummary}</div>
          </div>
        ) : null}

        {Array.isArray(contextChips) && contextChips.length ? (
          <div className="flex flex-wrap gap-2">
            {contextChips.map((c, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {c}
              </Badge>
            ))}
          </div>
        ) : null}

        {/* Impact reasons */}
        {Array.isArray(impactReasons) && impactReasons.length ? (
          <div className="rounded-xl bg-muted/30 p-3">
            <div className="text-xs font-semibold mb-1">중요도/영향 근거</div>
            <ul className="list-disc pl-5 text-xs text-foreground/80 space-y-1">
              {impactReasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Signals */}
        <div className="flex flex-wrap gap-2">
          {(h?.signals?.length ? h.signals : ["입력 신호 부족"]).map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-2">
          <div className="text-sm font-semibold">다음 액션</div>
          <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1">
            {(h?.actions?.length ? h.actions : ["-"]).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        {/* Counter / exception */}
        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            반례/예외
          </div>
          <div className="mt-1 text-sm text-foreground/90 leading-relaxed">{h?.counter ?? "-"}</div>
        </div>
      </div>
    </motion.div>
  );
}