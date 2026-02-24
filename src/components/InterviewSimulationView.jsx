// src/components/InterviewSimulationView.jsx

import React from "react";

function toneLine(avgPriority) {
  if (avgPriority >= 70) return "❗ 서류 단계에서 보수적으로 해석될 가능성이 높습니다.";
  if (avgPriority >= 50) return "⚠️ 면접관이 ‘검증 비용’을 계산하게 만드는 신호가 보입니다.";
  if (avgPriority >= 30) return "🟡 일부 표현이 리스크로 해석될 수 있어 보완 여지가 있습니다.";
  return "🟢 전반적으로 안정적이지만, 약한 신호는 미리 보완하는 게 좋습니다.";
}

export default function InterviewSimulationView({
  vm,
  isPremium,
  renderRiskCard, // 기존 HypothesisCard 재사용을 위해 “렌더 콜백”으로 받기
  onCtaRewrite,
  onCtaQuestions,
  onCtaConsult,
}) {
  const avg = vm?.meta?.avgPriority || 0;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* STEP 0: 충격/진입 */}
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>🧠 탈락 시뮬레이터</div>
        <div style={{ marginTop: 6, color: "#111827" }}>{toneLine(avg)}</div>
        <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
          (엔진은 동일하고, “면접관 해석 방식”으로 재표현한 화면입니다)
        </div>
      </div>

      {/* STEP 1: 면접관 판단 로그 */}
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>🧠 면접관 판단 로그</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#111827" }}>
          {(vm?.logs || []).map((x, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{x}</li>
          ))}
        </ul>
      </div>

      {/* STEP 2: 유형 */}
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>🪪 당신의 유형</div>
        <div style={{ fontSize: 16, fontWeight: 800 }}>{vm?.userType?.title || "—"}</div>
        <div style={{ marginTop: 6, color: "#374151" }}>{vm?.userType?.description || ""}</div>
      </div>

      {/* STEP 3: 컷 신호 TOP3 */}
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>🚩 컷 신호 TOP 3</div>
        <div style={{ display: "grid", gap: 10 }}>
          {(vm?.top3 || []).map((r, idx) => (
            <div key={r?.id || idx}>
              {renderRiskCard ? renderRiskCard(r, idx) : (
                <div style={{ padding: 12, borderRadius: 10, border: "1px solid #f3f4f6", background: "#fafafa" }}>
                  <div style={{ fontWeight: 700 }}>{r?.title || r?.id || "risk"}</div>
                  <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                    priority: {r?.priority ?? "-"} / group: {r?.group ?? "-"} / layer: {r?.layer ?? "-"}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 4: 잠금(유료) */}
      <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>🔒 다음 단계</div>

        {!isPremium ? (
          <>
            <div style={{ color: "#111827" }}>
              “왜 위험한지”와 “통과형으로 바꾸는 방법”은 잠겨 있습니다.
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button onClick={onCtaRewrite} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #111827", background: "#111827", color: "#fff" }}>
                🔓 위험 문장 수정하기
              </button>
              <button onClick={onCtaQuestions} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>
                🎯 예상 질문 보기
              </button>
              <button onClick={onCtaConsult} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff" }}>
                📞 30분 전략 상담
              </button>
            </div>
          </>
        ) : (
          <div style={{ color: "#111827" }}>
            (Premium) 여기서부터 “수정 전/후 예시, JD 기준 재작성, 예상 질문”이 펼쳐집니다.
          </div>
        )}
      </div>
    </div>
  );
}