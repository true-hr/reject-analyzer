// src/components/HypothesisCard.jsx
import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HypothesisCard({ h }) {
  const pr = Math.round((h?.priority ?? 0) * 100);
  const tier = pr >= 75 ? "high" : pr >= 55 ? "mid" : "low";
  const badgeVariant =
    tier === "high" ? "destructive" : tier === "mid" ? "secondary" : "outline";

  // ------------------------------
  // [PATCH] prefer explain payload when available (append-only)
  // - App.jsx를 안 건드리고, riskProfile.explain(ctx) 결과가 raw에 실려오는 경우를 우선 표시
  // - 없으면 기존 h.title/h.why/h.actions/h.signals/h.counter 그대로 유지
  // ------------------------------
  const ex =
    (h?.raw && typeof h.raw === "object" && (h.raw.explain || h.raw.explanation)) ||
    null;

  const exTitle =
    ex && typeof ex.title === "string" && ex.title.trim() ? ex.title.trim() : null;

  const exWhyArr = Array.isArray(ex?.why) ? ex.why.filter(Boolean) : null;
  const exWhyStr =
    ex && typeof ex.why === "string" && ex.why.trim() ? ex.why.trim() : null;

  const exSignals = Array.isArray(ex?.signals) ? ex.signals.filter(Boolean) : null;
  const exActions = Array.isArray(ex?.action) ? ex.action.filter(Boolean) : null;

  const exCounterArr = Array.isArray(ex?.counter) ? ex.counter.filter(Boolean) : null;
  const exCounterStr =
    ex && typeof ex.counter === "string" && ex.counter.trim() ? ex.counter.trim() : null;

  const viewTitle = exTitle || h?.title || "가설";
  const viewWhy =
    (exWhyArr && exWhyArr.length ? exWhyArr.join(" ") : null) ||
    exWhyStr ||
    h?.why ||
    "";

  const viewSignals =
    (exSignals && exSignals.length ? exSignals : null) ||
    (Array.isArray(h?.signals) && h.signals.length ? h.signals : null) ||
    null;

  const viewActions =
    (exActions && exActions.length ? exActions : null) ||
    (Array.isArray(h?.actions) && h.actions.length ? h.actions : null) ||
    null;

  const viewCounter =
    (exCounterArr && exCounterArr.length ? exCounterArr.join(" ") : null) ||
    exCounterStr ||
    h?.counter ||
    "-";

  // ------------------------------
  // [PATCH] prevent duplicated static subtitle (append-only)
  // - 왜(why)가 비어있을 때만 안내문을 보여주고, 그 외에는 숨김
  // ------------------------------
  const showSubtitle = !viewWhy;

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
            <div className="text-base font-semibold leading-tight">
              {viewTitle}
            </div>
            {showSubtitle ? (
              <div className="text-xs text-muted-foreground">
                단정이 아닌 가설입니다. 입력 정보가 많을수록 품질이 올라갑니다.
              </div>
            ) : null}
          </div>
          <Badge variant={badgeVariant} className="shrink-0">
            우선순위 {pr}/100
          </Badge>
        </div>

        <div className="text-sm leading-relaxed text-foreground/90">
          {viewWhy || "-"}
        </div>

        <div className="flex flex-wrap gap-2">
          {(viewSignals && viewSignals.length ? viewSignals : ["입력 신호 부족"]).map(
            (s, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {s}
              </Badge>
            )
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-semibold">다음 액션</div>
          <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1">
            {(viewActions && viewActions.length ? viewActions : ["-"]).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            반례/예외
          </div>
          <div className="mt-1 text-sm text-foreground/90 leading-relaxed">
            {viewCounter}
          </div>
        </div>
      </div>
    </motion.div>
  );
}