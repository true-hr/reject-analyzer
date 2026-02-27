// src/components/RadarSelfCheck.jsx
import React, { useMemo } from "react";

function clamp(n, min, max) {
  const nn = Number(n);
  if (!Number.isFinite(nn)) return min;
  return Math.max(min, Math.min(max, nn));
}

function toNum(v, fallback = 3) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function pick(obj, key, fallback) {
  try {
    return obj && Object.prototype.hasOwnProperty.call(obj, key) ? obj[key] : fallback;
  } catch {
    return fallback;
  }
}

function sum(arr) {
  let s = 0;
  for (const x of arr) s += Number(x) || 0;
  return s;
}

function avg(arr) {
  if (!arr || !arr.length) return 0;
  return sum(arr) / arr.length;
}

// new 6 axes (doc)
const DOC6 = [
  { key: "logic", label: "기본" }, // 기본 논리
  { key: "roleFit", label: "직무" }, // 직무 적합성
  { key: "evidence", label: "증거" }, // 증거 강도
  { key: "expression", label: "표현" }, // 표현력
  { key: "consistency", label: "일관" }, // 스토리 일관성
  { key: "tailoring", label: "맞춤" }, // 맞춤도
];
// new 6 axes (interview)
const INTERVIEW6 = [
  { key: "roleFit", label: "직무" }, // 역할 적합
  { key: "orgFit", label: "조직" }, // 조직/문화 적합
  { key: "structure", label: "구조" }, // 답변 구조
  { key: "evidence", label: "근거" }, // 근거/사례
  { key: "delivery", label: "전달" }, // 전달력
  { key: "environment", label: "환경" }, // 외부요인(참고용)
];
// legacy 5 axes (current UI)
const LEGACY5 = [
  { key: "coreFit", label: "기본" },
  { key: "roleClarity", label: "직무" },
  { key: "proofStrength", label: "증거" },
  { key: "storyConsistency", label: "표현" }, // (기존 코드에서 label이 깨져있었음)
  { key: "cultureFit", label: "맞춤" },
];

function normalizeAxisList(points, fallbackLen = 5) {
  const arr = Array.isArray(points) ? points : [];
  const out = arr.map((p) => ({
    key: String(p?.key || ""),
    label: String(p?.label || ""),
    v: clamp(toNum(p?.v, 3), 1, 5),
  }));
  if (out.length) return out;
  // fallback empty
  return new Array(fallbackLen).fill(0).map((_, i) => ({
    key: `axis_${i}`,
    label: `축${i + 1}`,
    v: 3,
  }));
}

function buildPointsFromSelfCheck(selfCheck, mode = "doc") {
  const sc = selfCheck || {};
  const m = String(mode || "doc").trim().toLowerCase();

  // ✅ 인터뷰 모드: interview.axes 6축 우선
  if (m === "interview") {
    const ivAxes =
      (sc?.interview && sc.interview.axes && typeof sc.interview.axes === "object") ? sc.interview.axes :
        null;

    const hasAnyIv6Key =
      !!ivAxes &&
      INTERVIEW6.some((a) => Object.prototype.hasOwnProperty.call(ivAxes, a.key));

    if (hasAnyIv6Key) {
      return INTERVIEW6.map((a) => ({
        key: a.key,
        label: a.label,
        v: clamp(toNum(pick(ivAxes, a.key, 3), 3), 1, 5),
      }));
    }

    // 인터뷰 축이 없으면(legacy 없음) 기본값 3으로 6축 표시
    return INTERVIEW6.map((a) => ({
      key: a.key,
      label: a.label,
      v: 3,
    }));
  }

  // ===== doc(기존 동작 유지) =====

  // NEW: prefer doc.axes (6-axis) if present
  const docAxes =
    (sc?.doc && sc.doc.axes && typeof sc.doc.axes === "object") ? sc.doc.axes :
      (sc?.axes && typeof sc.axes === "object") ? sc.axes :
        null;

  // if it looks like new schema (has any of DOC6 keys), use DOC6
  const hasAnyDoc6Key =
    !!docAxes &&
    DOC6.some((a) => Object.prototype.hasOwnProperty.call(docAxes, a.key));

  if (hasAnyDoc6Key) {
    return DOC6.map((a) => ({
      key: a.key,
      label: a.label,
      v: clamp(toNum(pick(docAxes, a.key, 3), 3), 1, 5),
    }));
  }

  // LEGACY fallback (5-axis)
  return LEGACY5.map((a) => ({
    key: a.key,
    label: a.label,
    v: clamp(toNum(pick(sc, a.key, 3), 3), 1, 5),
  }));
}

function buildPointsFromEngineAxes(engineAxes, templatePoints) {
  // engineAxes can be:
  // - object: { logic: 2.5, roleFit: 3, ... } or { coreFit: 3, ... }
  // - array: [{key,label,v}, ...]
  if (!engineAxes) return null;

  if (Array.isArray(engineAxes)) {
    const pts = normalizeAxisList(engineAxes, templatePoints?.length || 5);
    // length mismatch -> trim/pad to template
    const need = templatePoints?.length || pts.length;
    if (pts.length === need) return pts;
    if (pts.length > need) return pts.slice(0, need);
    const pad = [];
    for (let i = pts.length; i < need; i++) {
      pad.push({
        key: templatePoints?.[i]?.key || `axis_${i}`,
        label: templatePoints?.[i]?.label || `축${i + 1}`,
        v: 3,
      });
    }
    return [...pts, ...pad];
  }

  if (typeof engineAxes === "object") {
    const tpl = Array.isArray(templatePoints) && templatePoints.length ? templatePoints : LEGACY5;
    return tpl.map((a) => ({
      key: a.key,
      label: a.label,
      v: clamp(toNum(pick(engineAxes, a.key, 3), 3), 1, 5),
    }));
  }

  return null;
}

export default function RadarSelfCheck({ selfCheck, engineAxes, mode = "doc" }) {
  const data = useMemo(() => {
    return buildPointsFromSelfCheck(selfCheck, mode);
  }, [selfCheck, mode]);

  const engineData = useMemo(() => {
    return buildPointsFromEngineAxes(engineAxes, data);
  }, [engineAxes, data]);

  // SVG polygon
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

  const polygonEngine = useMemo(() => {
    if (!engineData || !engineData.length) return "";
    const total = engineData.length;
    const pts = engineData.map((p, i) => {
      const rr = (p.v / 5) * r;
      const [x, y] = polar(i, total, rr);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return pts.join(" ");
  }, [engineData]);

  const avgSelf = useMemo(() => avg(data.map((p) => p.v)), [data]);
  const avgEng = useMemo(() => (engineData ? avg(engineData.map((p) => p.v)) : null), [engineData]);

  return (
    <div className="rounded-xl border bg-background/60 p-3">
      <div className="text-xs text-muted-foreground mb-2">
        자가진단 레이더 (보조 신호)
        {engineData ? (
          <span className="ml-2 text-[11px] text-muted-foreground">
            · 비교: 엔진 환산
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* grid */}
          {[1, 2, 3, 4, 5].map((lv) => {
            const rr = (lv / 5) * r;
            const ring = data
              .map((_, i) => polar(i, data.length, rr))
              .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
              .join(" ");
            return <polygon key={lv} points={ring} fill="none" stroke="rgba(0,0,0,0.08)" />;
          })}

          {/* axes */}
          {data.map((_, i) => {
            const [x, y] = polar(i, data.length, r);
            return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(0,0,0,0.08)" />;
          })}

          {/* engine polygon (inner) */}
          {polygonEngine ? (
            <polygon
              points={polygonEngine}
              fill="rgba(16,185,129,0.10)"
              stroke="rgba(16,185,129,0.55)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          ) : null}

          {/* self polygon (outer) */}
          <polygon points={polygon} fill="rgba(99,102,241,0.18)" stroke="rgba(99,102,241,0.55)" strokeWidth="2" />

          {/* center */}
          <circle cx={cx} cy={cy} r="2" fill="rgba(99,102,241,0.8)" />
        </svg>

        <div className="text-xs space-y-1 min-w-[92px]">
          {data.map((p) => (
            <div key={p.key} className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">{p.label}</span>
              <span className="font-medium">{p.v}/5</span>
            </div>
          ))}

          <div className="pt-2 mt-2 border-t text-[11px] text-muted-foreground space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span>평균(자가)</span>
              <span className="font-medium text-foreground">{avgSelf.toFixed(1)}</span>
            </div>
            {avgEng != null ? (
              <div className="flex items-center justify-between gap-2">
                <span>평균(엔진)</span>
                <span className="font-medium text-foreground">{avgEng.toFixed(1)}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}