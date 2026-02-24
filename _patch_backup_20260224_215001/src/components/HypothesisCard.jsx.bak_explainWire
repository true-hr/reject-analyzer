import React from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function HypothesisCard({ h }) {
  const pr = Math.round((h?.priority ?? 0) * 100);
  const tier = pr >= 75 ? "high" : pr >= 55 ? "mid" : "low";
  const badgeVariant = tier === "high" ? "destructive" : tier === "mid" ? "secondary" : "outline";

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
              단정이 아닌 가설입니다. 입력 정보가 많을수록 품질이 올라갑니다.
            </div>
          </div>
          <Badge variant={badgeVariant} className="shrink-0">
            우선순위 {pr}/100
          </Badge>
        </div>

        <div className="text-sm leading-relaxed text-foreground/90">{h?.why ?? "-"}</div>

        <div className="flex flex-wrap gap-2">
          {(h?.signals?.length ? h.signals : ["입력 신호 부족"]).map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-semibold">다음 액션</div>
          <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1">
            {(h?.actions?.length ? h.actions : ["-"]).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

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
