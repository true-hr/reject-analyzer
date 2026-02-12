// src/components/RadarSelfCheck.jsx
import React, { useMemo } from "react";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function RadarSelfCheck({ selfCheck }) {
  const data = useMemo(() => {
    const sc = selfCheck || {};
    const points = [
      { key: "coreFit", label: "핏", v: sc.coreFit ?? 3 },
      { key: "proofStrength", label: "증거", v: sc.proofStrength ?? 3 },
      { key: "roleClarity", label: "명확", v: sc.roleClarity ?? 3 },
      { key: "storyConsistency", label: "스토리", v: sc.storyConsistency ?? 3 },
      { key: "riskSignals", label: "리스크", v: sc.riskSignals ?? 3 },
    ].map((p) => ({ ...p, v: clamp(Number(p.v), 1, 5) }));
    return points;
  }, [selfCheck]);

  // SVG polygon (원형 5축)
  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const r = 62;

  function polar(i, total, radius) {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i) / total;
    return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
  }

  const polygon = useMemo(() => {
    const total = data.length;
    const pts = data.map((p, i) => {
      const rr = (p.v / 5) * r;
      const [x, y] = polar(i, total, rr);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(" ");
  }, [data]);

  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground mb-2">자가진단 레이더 (보조 신호)</div>
      <div className="flex items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* grid */}
          {[1, 2, 3, 4, 5].map((lv) => {
            const rr = (lv / 5) * r;
            const ring = data.map((_, i) => polar(i, data.length, rr)).map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
            return <polygon key={lv} points={ring} fill="none" stroke="rgba(0,0,0,0.08)" />;
          })}

          {/* axes */}
          {data.map((_, i) => {
            const [x, y] = polar(i, data.length, r);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" />;
          })}

          {/* value polygon */}
          <polygon points={polygon} fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.55)" strokeWidth="2" />

          {/* center */}
          <circle cx={cx} cy={cy} r="2" fill="rgba(99,102,241,0.8)" />
        </svg>

        <div className="text-xs space-y-1">
          {data.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{p.label}</span>
              <span className="font-medium">{p.v}/5</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
