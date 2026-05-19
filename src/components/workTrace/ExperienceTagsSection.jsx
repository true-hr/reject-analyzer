// src/components/workTrace/ExperienceTagsSection.jsx
// Shows job/industry context tags extracted from saved experience cards.
// These are context tags, not skill tags.

function toCleanTextList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

function uniqueTextList(items, limit = 10) {
  return [...new Set(items)].slice(0, limit);
}

function TagGroup({ title, tags }) {
  if (!tags.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ExperienceTagsSection({ cards = [] }) {
  const safeCards = Array.isArray(cards) ? cards : [];

  const jobTags = uniqueTextList(
    safeCards.flatMap((card) => toCleanTextList(card?.job_tags)),
    10
  );

  const industryTags = uniqueTextList(
    safeCards.flatMap((card) => toCleanTextList(card?.industry_tags)),
    10
  );

  if (jobTags.length === 0 && industryTags.length === 0) return null;

  return (
    <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          직무·산업 연결 태그
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          저장한 경험에서 함께 감지된 직무·산업 맥락입니다.
        </p>
      </div>

      <div className="mt-3 space-y-3">
        <TagGroup title="직무 맥락" tags={jobTags} />
        <TagGroup title="산업 맥락" tags={industryTags} />
      </div>
    </section>
  );
}
