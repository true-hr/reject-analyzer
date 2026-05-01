import React from "react";

const styles = {
  page: {
    backgroundColor: "#f8fafc",
    color: "#0f172a",
    margin: 0,
    fontFamily: "\"Noto Sans KR\", \"Apple SD Gothic Neo\", \"Malgun Gothic\", sans-serif",
  },
  shell: {
    maxWidth: "860px",
    margin: "0 auto",
    padding: "32px 24px 48px",
  },
  header: {
    paddingBottom: "20px",
    marginBottom: "20px",
    borderBottom: "1px solid #e2e8f0",
  },
  title: {
    fontSize: "28px",
    fontWeight: 800,
    lineHeight: 1.3,
    margin: 0,
  },
  meta: {
    marginTop: "8px",
    fontSize: "13px",
    color: "#475569",
  },
  lead: {
    marginTop: "14px",
    fontSize: "15px",
    lineHeight: 1.75,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },
  section: {
    marginTop: "20px",
  },
  sectionTitle: {
    fontSize: "20px",
    fontWeight: 800,
    margin: "0 0 12px",
  },
  sectionIntro: {
    fontSize: "14px",
    lineHeight: 1.7,
    color: "#475569",
    margin: "0 0 12px",
    whiteSpace: "pre-wrap",
  },
  card: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "16px 18px",
    marginBottom: "10px",
    breakInside: "avoid",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    margin: "0 0 8px",
  },
  axisMeta: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 8px",
  },
  paragraph: {
    fontSize: "14px",
    lineHeight: 1.75,
    color: "#334155",
    margin: 0,
    whiteSpace: "pre-wrap",
  },
  list: {
    margin: "8px 0 0",
    paddingLeft: "18px",
  },
  listItem: {
    fontSize: "14px",
    lineHeight: 1.75,
    color: "#334155",
    marginTop: "4px",
  },
};

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function BulletList({ items = [] }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <ul style={styles.list}>
      {safeItems.map((item, index) => (
        <li key={index} style={styles.listItem}>{String(item)}</li>
      ))}
    </ul>
  );
}

function SectionBlock({ title, children }) {
  return (
    <section style={styles.section}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function AxisSummarySection({ items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title="5축 요약">
      {safeItems.map((item) => (
        <article key={item.axisKey} style={styles.card}>
          <h3 style={styles.cardTitle}>{item.label}</h3>
          <p style={styles.axisMeta}>
            {item.score5 != null ? `점수 ${item.score5}/5` : "점수 미산정"}
            {item.band ? ` · 밴드 ${item.band}` : ""}
          </p>
          {item.summary ? <p style={styles.paragraph}>{item.summary}</p> : null}
        </article>
      ))}
    </SectionBlock>
  );
}

function TopRiskSection({ items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title="핵심 리스크">
      {safeItems.map((item) => (
        <article key={item.key} style={styles.card}>
          {item.title ? <h3 style={styles.cardTitle}>{item.title}</h3> : null}
          {item.body ? <p style={styles.paragraph}>{item.body}</p> : null}
        </article>
      ))}
    </SectionBlock>
  );
}

function ReadBlockSection({ title, block }) {
  if (!block) return null;
  const cards = toArr(block.cards);
  if (!block.sectionTitle && !block.intro && cards.length === 0) return null;

  return (
    <SectionBlock title={title}>
      {block.sectionTitle ? <p style={styles.sectionIntro}>{block.sectionTitle}</p> : null}
      {block.intro ? <p style={styles.paragraph}>{block.intro}</p> : null}
      {cards.map((card) => (
        <article key={card.id} style={styles.card}>
          {card.title ? <h3 style={styles.cardTitle}>{card.title}</h3> : null}
          {card.body ? <p style={styles.paragraph}>{card.body}</p> : null}
          <BulletList items={card.bullets} />
        </article>
      ))}
    </SectionBlock>
  );
}

function DetailedReadSection({ items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title="세부 판독">
      {safeItems.map((item) => (
        <article key={item.axisKey} style={styles.card}>
          {item.title ? <h3 style={styles.cardTitle}>{item.title}</h3> : null}
          {item.introText ? <p style={styles.paragraph}>{item.introText}</p> : null}
          {item.cautionText ? <p style={{ ...styles.paragraph, marginTop: "8px" }}>{item.cautionText}</p> : null}
        </article>
      ))}
    </SectionBlock>
  );
}

function SimpleListSection({ title, items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title={title}>
      <article style={styles.card}>
        <BulletList items={safeItems} />
      </article>
    </SectionBlock>
  );
}

function ReferenceReadsSection({ referenceReads }) {
  if (!referenceReads || typeof referenceReads !== "object") return null;

  const targetJobRead = referenceReads.targetJobRead || {};
  const targetIndustryRead = referenceReads.targetIndustryRead || {};
  const industryTraits = referenceReads.industryTraits || null;

  const hasTargetJob =
    targetJobRead.title || targetJobRead.body || toArr(targetJobRead.bullets).length > 0;
  const hasIndustryTraits =
    industryTraits &&
    (industryTraits.label ||
      industryTraits.summary ||
      toArr(industryTraits.whyIndustryMatters).length > 0 ||
      toArr(industryTraits.evaluationCriteria).length > 0);
  const hasTargetIndustry =
    targetIndustryRead.title ||
    targetIndustryRead.summary ||
    toArr(targetIndustryRead.bullets).length > 0;

  if (!hasTargetJob && !hasIndustryTraits && !hasTargetIndustry) return null;

  return (
    <SectionBlock title="참고 정보">
      {hasTargetJob ? (
        <article style={styles.card}>
          <h3 style={styles.cardTitle}>지원 직무 특징</h3>
          {targetJobRead.title ? <p style={styles.sectionIntro}>{targetJobRead.title}</p> : null}
          {targetJobRead.body ? <p style={styles.paragraph}>{targetJobRead.body}</p> : null}
          <BulletList items={targetJobRead.bullets} />
        </article>
      ) : null}

      {hasIndustryTraits ? (
        <article style={styles.card}>
          <h3 style={styles.cardTitle}>지원 산업 특징</h3>
          {industryTraits.label ? <p style={styles.sectionIntro}>{industryTraits.label}</p> : null}
          {industryTraits.summary ? <p style={styles.paragraph}>{industryTraits.summary}</p> : null}
          <BulletList items={industryTraits.whyIndustryMatters} />
          <BulletList items={industryTraits.evaluationCriteria} />
        </article>
      ) : hasTargetIndustry ? (
        <article style={styles.card}>
          <h3 style={styles.cardTitle}>지원 산업 특징</h3>
          {targetIndustryRead.title ? <p style={styles.sectionIntro}>{targetIndustryRead.title}</p> : null}
          {targetIndustryRead.summary ? <p style={styles.paragraph}>{targetIndustryRead.summary}</p> : null}
          <BulletList items={targetIndustryRead.bullets} />
        </article>
      ) : null}
    </SectionBlock>
  );
}

function NewgradGoalComparisonSection({ table }) {
  const rows = toArr(table?.rows);
  const emptyStateText = String(table?.emptyStateText || "").trim();
  if (rows.length === 0 && !emptyStateText) return null;
  const isV2 = String(table?.version || "").trim() === "newgrad_goal_table_v2";
  const title = table?.title || "입력한 내용으로 보는 직무·산업 연결";
  const description = table?.description || "입력한 내용 중 목표 직무와 산업에 연결해 볼 수 있는 항목만 정리했어요.";
  const metaNote = table?.metaNote || "";
  const itemLabel = table?.columns?.item || "입력 항목";
  const evidenceLabel = table?.columns?.evidence || "내가 입력한 내용";
  const jobLinkageLabel = table?.columns?.jobLinkage || "직무 쪽 해석";
  const industryLinkageLabel = table?.columns?.industryLinkage || "산업 쪽 해석";
  const linkageLabel = "연결 해석";
  const getItemLabel = (row) => String(row?.itemLabel || row?.label || "").trim();
  const getJobLinkageText = (row) => String(row?.jobLinkage || "").trim();
  const getIndustryLinkageText = (row) => String(row?.industryLinkage || "").trim();
  const getLinkageText = (row) => String(row?.linkage || "").trim();

  if (!isV2) {
    return (
      <SectionBlock title={title}>
        <article style={styles.card}>
          {description ? <p style={styles.paragraph}>{description}</p> : null}
          {table?.meta?.targetJobLabel ? <p style={styles.paragraph}>?Ñ‰ì­© ï§žê³·Ð¢: {table.meta.targetJobLabel}</p> : null}
          {table?.meta?.targetIndustryLabel ? <p style={styles.paragraph}>?Ñ‰ì­© ?ê³—ë¾½: {table.meta.targetIndustryLabel}</p> : null}
          {metaNote ? <p style={styles.paragraph}>{metaNote}</p> : null}
        </article>
        {rows.length > 0 ? rows.map((row, index) => (
          <article key={row?.rowKey || index} style={styles.card}>
            <h3 style={styles.cardTitle}>{`${itemLabel}: ${getItemLabel(row)}`}</h3>
            {row?.evidence ? (
              <p style={styles.paragraph}>{evidenceLabel + ": " + row.evidence}</p>
            ) : null}
            <p style={styles.paragraph}>{linkageLabel + ": " + (getLinkageText(row) || "-")}</p>
          </article>
        )) : (
          <article style={styles.card}>
            <p style={styles.paragraph}>{emptyStateText}</p>
          </article>
        )}
      </SectionBlock>
    );
  }

  return (
    <SectionBlock title={title}>
      <article style={styles.card}>
        {description ? <p style={styles.paragraph}>{description}</p> : null}
        {table?.meta?.targetJobLabel ? <p style={styles.paragraph}>희망 직무: {table.meta.targetJobLabel}</p> : null}
        {table?.meta?.targetIndustryLabel ? <p style={styles.paragraph}>희망 산업: {table.meta.targetIndustryLabel}</p> : null}
        {metaNote ? <p style={styles.paragraph}>{metaNote}</p> : null}
      </article>
      {rows.length > 0 ? rows.map((row, index) => (
        <article key={row?.rowKey || index} style={styles.card}>
          <h3 style={styles.cardTitle}>{`${itemLabel}: ${getItemLabel(row)}`}</h3>
          {row?.evidence ? (
            <p style={styles.paragraph}>{evidenceLabel + ": " + row.evidence}</p>
          ) : null}
          <p style={styles.paragraph}>{jobLinkageLabel + ": " + (getJobLinkageText(row) || "-")}</p>
          <p style={styles.paragraph}>{industryLinkageLabel + ": " + (getIndustryLinkageText(row) || "-")}</p>
        </article>
      )) : (
        <article style={styles.card}>
          <p style={styles.paragraph}>{emptyStateText}</p>
        </article>
      )}
    </SectionBlock>
  );
}

export default function TransitionLitePdfHtmlDocument({ model }) {
  if (!model || typeof model !== "object") return null;

  const topRepairSignals = toArr(model.topRepairSignals).map((item) => item.title || item.body).filter(Boolean);

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <h1 style={styles.title}>{model.reportTitle || "PASSMAP Transition Lite Report"}</h1>
          {model.generatedAt ? <div style={styles.meta}>생성일 {model.generatedAt}</div> : null}
          {model.topSummary ? <div style={styles.lead}>{model.topSummary}</div> : null}
        </header>

        <AxisSummarySection items={model.axisSummary} />
        <TopRiskSection items={model.topRisks} />
        <ReadBlockSection title="핵심 해석" block={model.interviewerRead} />
        <NewgradGoalComparisonSection table={model.newgradGoalComparisonTable} />
        <DetailedReadSection items={model.detailedRead} />
        <SimpleListSection title="핵심 보강 포인트" items={topRepairSignals} />

        {model.strengthEvidence ? (
          <SectionBlock title="강점 근거">
            <article style={styles.card}>
              <BulletList items={model.strengthEvidence.matchedStrengthLabels} />
              <BulletList items={model.strengthEvidence.matchedWorkStyleLabels} />
              <BulletList items={model.strengthEvidence.allStrengthLabels} />
            </article>
          </SectionBlock>
        ) : null}

        <SimpleListSection title="강점 활용" items={model.strengths} />
        <SimpleListSection title="왜 이렇게 읽히는가" items={model.whyThisRead} />
        {model.whyThisReadSupportLine ? (
          <SectionBlock title="보조 해석 설명">
            <article style={styles.card}>
              <p style={styles.paragraph}>{model.whyThisReadSupportLine}</p>
            </article>
          </SectionBlock>
        ) : null}
        <ReferenceReadsSection referenceReads={model.referenceReads} />
      </div>
    </main>
  );
}
