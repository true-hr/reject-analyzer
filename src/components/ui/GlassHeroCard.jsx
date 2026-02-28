import React from "react";

export default function GlassHeroCard({ children, className = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl p-[1px] ${className}`}>
      {/* soft blurred gradient backdrop */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -inset-10 bg-gradient-to-br from-purple-500/35 via-pink-400/25 to-indigo-500/35 blur-3xl opacity-80" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,0.18),transparent_50%),radial-gradient(circle_at_60%_80%,rgba(168,85,247,0.18),transparent_55%)]" />
      </div>

      {/* glass surface */}
      <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_24px_80px_-30px_rgba(2,6,23,0.55)]">
        {children}
      </div>
    </div>
  );
}