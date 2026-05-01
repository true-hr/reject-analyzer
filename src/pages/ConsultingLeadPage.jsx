import React, { useRef } from "react";

const KAKAO_URL = "http://pf.kakao.com/_FCxcuX/chat";

const HERO_COPY = {
  mini: {
    title: "지금 당장 뭐부터 고쳐야 할지 모르겠다면",
    subtitle: "15분 안에 핵심 수정 포인트를 짚어드립니다.",
  },
  onepoint: {
    title: "한 가지만 제대로 잡고 싶다면",
    subtitle: "가장 급한 문제 하나에 집중해서 정리해드립니다.",
  },
  care: {
    title: "처음부터 끝까지 함께 준비하고 싶다면",
    subtitle: "서류·면접 전 과정을 1:1로 함께 설계합니다.",
  },
};

const TARGET_COPY = {
  mini: [
    "리포트 결과는 나왔는데 어디서부터 손대야 할지 막막한 분",
    "빠르게 방향만 먼저 잡고 싶은 분",
    "긴 상담 전에 가볍게 감을 잡고 싶은 분",
  ],
  onepoint: [
    "문제는 알겠는데 혼자 고치기 어려운 분",
    "서류 한 부분이나 면접 답변 하나를 집중해서 다듬고 싶은 분",
    "시간과 비용을 효율적으로 쓰고 싶은 분",
  ],
  care: [
    "이번 기회에 제대로 준비하고 싶은 분",
    "서류·면접 둘 다 불안한 분",
    "전담으로 관리받고 싶은 분",
  ],
};

const TYPE_CTA = {
  mini: "무료로 먼저 문의하기",
  onepoint: "1:1 원포인트 신청하기",
  care: "전담 케어 신청하기",
};

const TYPE_CTA_SUB = {
  mini: "부담 없이 현재 상태만 먼저 확인해보셔도 괜찮습니다.",
  onepoint: "지금 가장 급한 한 가지를 중심으로 먼저 도와드립니다.",
  care: "처음부터 끝까지 함께 설계가 필요한 경우에 적합합니다.",
};

const FAQ_TYPE = {
  mini: {
    q: "15분 안에 실제로 도움이 되나요?",
    a: "전체를 다 다루는 방식은 아니지만, 지금 가장 먼저 손봐야 할 핵심 포인트를 빠르게 짚어드리는 데 초점을 둡니다.",
  },
  onepoint: {
    q: "주제를 미리 정해야 하나요?",
    a: "대략적인 고민만 있어도 괜찮습니다. 카카오톡에서 현재 상황을 먼저 듣고, 어떤 한 가지를 집중해서 볼지 함께 정해드립니다.",
  },
  care: {
    q: "몇 회 진행해야 효과가 있나요?",
    a: "목표와 현재 상태에 따라 다르지만, 기본적으로는 여러 회차를 통해 서류와 면접 흐름을 함께 잡는 방식이 더 안정적입니다.",
  },
};

export default function ConsultingLeadPage({ type = "mini" }) {
  const ctaRef = useRef(null);

  const hero = HERO_COPY[type] || HERO_COPY.mini;
  const targets = TARGET_COPY[type] || TARGET_COPY.mini;
  const ctaLabel = TYPE_CTA[type] || TYPE_CTA.mini;
  const ctaSub = TYPE_CTA_SUB[type] || TYPE_CTA_SUB.mini;
  const typeFaq = FAQ_TYPE[type] || FAQ_TYPE.mini;

  function handleScrollToCta(e) {
    e.preventDefault();
    if (ctaRef.current) {
      ctaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <a href="/reject-analyzer/" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
            ← PASSMAP으로 돌아가기
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 space-y-14">

        {/* ── SECTION 1: HERO ── */}
        <section className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900 leading-snug">
            {hero.title}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {hero.subtitle}
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            지금 상황을 간단히 남겨주시면, 어떤 방식이 맞는지 먼저 안내드립니다.
          </p>
          <button
            type="button"
            className="inline-block rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={handleScrollToCta}
          >
            아래에서 바로 문의하기
          </button>
        </section>

        {/* ── SECTION 2: 대표 소개 ── */}
        {/* 추후 상세 이력 교체 시 이 섹션 블록만 수정하면 됨 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">누가 직접 진행하나요?</h2>
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">최지혜 대표가 현재 상황과 목표에 맞춰 직접 상담을 진행합니다.</p>
          </div>

          {/* 프로필 카드 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              {/* 사진 */}
              <div className="w-full sm:w-40 md:w-48 shrink-0">
                <img
                  src={`${import.meta.env.BASE_URL}consulting/choi-jihye-profile.png`}
                  alt="최지혜 대표 프로필"
                  className="w-full rounded-2xl object-cover"
                />
              </div>
              {/* 텍스트 */}
              <div className="min-w-0 flex-1 space-y-3">
                <div className="text-xs font-semibold text-slate-400">최지혜 대표</div>
                <div className="text-sm font-bold text-slate-900 leading-snug">
                  15년, 누적 1,000명 이상의 합격을 함께 만든 취업 전략가
                </div>
                <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                  <li className="text-xs text-slate-700 leading-relaxed">現 최지혜커리어파트너스 대표</li>
                  <li className="text-xs text-slate-700 leading-relaxed">現 경희대학교 겸임교수</li>
                  <li className="text-xs text-slate-500 leading-relaxed">前 서울대학교 경력개발센터 취업컨설턴트</li>
                </ul>
                {/* 미니 신뢰 배지 */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { title: "서울대 경력개발센터", sub: "만족도 4.9/5" },
                    { title: "숨고 최상위 1%", sub: "만족도 4.9/5" },
                    { title: "대학·기관 다수", sub: "서울대 · 강남취창업허브 등" },
                  ].map(({ title, sub }) => (
                    <div key={title} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-2 flex flex-col items-center justify-center gap-y-1 text-center">
                      <div className="text-[10px] font-semibold text-slate-700 leading-snug">{title}</div>
                      <div className="text-[10px] text-slate-400 leading-snug">{sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 신뢰 포인트 */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 space-y-1.5">
            {[
              "서울대학교 경력개발센터 취업컨설턴트 만족도 4.9/5",
              "숨고 최상위 1% 취업컨설턴트, 만족도 4.9/5",
              "서울대 1:1 맞춤 취업컨설팅, 강남취·창업허브센터 1:1 맞춤 컨설팅 등 다양한 대학·기관 취업 컨설팅 및 강의 수행",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-500 leading-relaxed">
                <span className="mt-0.5 text-slate-300 shrink-0">✓</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3: 추천 대상 ── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">이런 분께 추천합니다</h2>
          <ul className="space-y-2">
            {targets.map((item, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ── SECTION 4: 진행 방식 ── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">진행 방식</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: "01", title: "카카오톡으로 문의하기", desc: "현재 상황을 간단히 알려주세요" },
              { step: "02", title: "현재 상황 확인 및 상담 방식 안내", desc: "맞는 방식을 먼저 안내드립니다" },
              { step: "03", title: "일정 조율 후 상담 진행", desc: "온라인으로 1:1 진행합니다" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <div className="text-xs font-semibold text-slate-400 mb-2">{step}</div>
                <div className="text-xs font-semibold text-slate-900 mb-1 leading-snug">{title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 5: FAQ ── */}
        <section className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">자주 묻는 질문</h2>
          <div className="space-y-2">
            {/* 공통 FAQ 1 */}
            <details className="group rounded-xl border border-slate-200 bg-white px-4 py-3 open:pb-4 transition-all">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800 list-none flex items-center justify-between select-none gap-2">
                <span>상담 전 무엇을 준비해야 하나요?</span>
                <span className="text-slate-400 text-xs shrink-0 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                현재 이력서나 자기소개서가 있다면 함께 보내주시면 더 정확하게 안내드릴 수 있습니다. 아직 정리가 안 되어 있어도 괜찮습니다.
              </p>
            </details>

            {/* 공통 FAQ 2 */}
            <details className="group rounded-xl border border-slate-200 bg-white px-4 py-3 open:pb-4 transition-all">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800 list-none flex items-center justify-between select-none gap-2">
                <span>어떤 상담이 맞는지 모르겠어요.</span>
                <span className="text-slate-400 text-xs shrink-0 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                현재 상황만 말씀해 주시면, 미니 / 원포인트 / 집중 케어 중 어떤 방식이 맞는지 먼저 안내드립니다.
              </p>
            </details>

            {/* type별 FAQ */}
            <details className="group rounded-xl border border-slate-200 bg-white px-4 py-3 open:pb-4 transition-all">
              <summary className="cursor-pointer text-sm font-semibold text-slate-800 list-none flex items-center justify-between select-none gap-2">
                <span>{typeFaq.q}</span>
                <span className="text-slate-400 text-xs shrink-0 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                {typeFaq.a}
              </p>
            </details>
          </div>
        </section>

        {/* ── SECTION 6: BOTTOM CTA ── */}
        <section
          ref={ctaRef}
          id="cta-section"
          className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4"
        >
          <p className="text-xs text-slate-400">상담 신청은 카카오톡 채널로 연결됩니다</p>
          <a
            href={KAKAO_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-block w-full rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            카카오톡으로 문의하기
          </a>
          <p className="text-sm text-slate-500 leading-relaxed">
            어떤 상담이 맞는지 모르겠다면, 현재 상황만 말씀해 주시면 먼저 안내드립니다.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            {ctaSub}
          </p>
        </section>

      </main>
    </div>
  );
}
