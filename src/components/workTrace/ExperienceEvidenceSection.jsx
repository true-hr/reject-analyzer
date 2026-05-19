// src/components/workTrace/ExperienceEvidenceSection.jsx
// Shows evidence snippets for saved experience cards in the resume view.
// Evidence text is raw user-pasted content — mask common PII before truncating.

function maskSensitiveText(value) {
  return String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[이메일]")
    .replace(/(?:\+82[-\s.]?)?0?1[016789][-\s.]?\d{3,4}[-\s.]?\d{4}/g, "[전화번호]")
    .replace(/\b\d{2,3}[-\s.]\d{3,4}[-\s.]\d{4}\b/g, "[전화번호]");
}

function truncateText(value, max = 120) {
  const text = maskSensitiveText(value).trim();
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function ExperienceEvidenceSection({ cards = [] }) {
  const items = (Array.isArray(cards) ? cards : [])
    .map((card) => {
      const evidenceList = Array.isArray(card?.experience_evidence)
        ? card.experience_evidence
        : [];
      const snippets = evidenceList
        .map((ev) => truncateText(ev?.evidence_text, 120))
        .filter(Boolean)
        .slice(0, 2);
      if (snippets.length === 0) return null;
      return {
        id: card.id,
        title: String(card?.title || "저장한 경험").trim(),
        bullet: String(card?.suggested_resume_bullet || "").trim(),
        snippets,
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  if (items.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <details>
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          경험 근거 확인
          <span className="ml-2 text-xs font-normal text-slate-500">
            저장한 경험이 어떤 업무흔적에서 나왔는지 확인할 수 있어요.
          </span>
        </summary>
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">{item.title}</p>
              {item.bullet ? (
                <p className="mt-1 text-xs text-slate-600">{item.bullet}</p>
              ) : null}
              <div className="mt-2 space-y-2">
                {item.snippets.map((snippet, idx) => (
                  <div key={`${item.id}-${idx}`} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                    <span className="mr-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      원문 발췌
                    </span>
                    {snippet}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
