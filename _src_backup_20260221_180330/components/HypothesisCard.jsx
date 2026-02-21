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
            <div className="text-base font-semibold leading-tight">{h?.title ?? "媛??}</div>
            <div className="text-xs text-muted-foreground">
              ?⑥젙???꾨땶 媛?ㅼ엯?덈떎. ?낅젰 ?뺣낫媛 留롮쓣?섎줉 ?덉쭏???щ씪媛묐땲??
            </div>
          </div>
          <Badge variant={badgeVariant} className="shrink-0">
            ?곗꽑?쒖쐞 {pr}/100
          </Badge>
        </div>

        <div className="text-sm leading-relaxed text-foreground/90">{h?.why ?? "-"}</div>

        <div className="flex flex-wrap gap-2">
          {(h?.signals?.length ? h.signals : ["?낅젰 ?좏샇 遺議?]).map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-semibold">?ㅼ쓬 ?≪뀡</div>
          <ul className="list-disc pl-5 text-sm text-foreground/90 space-y-1">
            {(h?.actions?.length ? h.actions : ["-"]).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl bg-muted/50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertCircle className="h-4 w-4" />
            諛섎?/?덉쇅
          </div>
          <div className="mt-1 text-sm text-foreground/90 leading-relaxed">{h?.counter ?? "-"}</div>
        </div>
      </div>
    </motion.div>
  );
}
