import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 36,
    paddingHorizontal: 30,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    fontSize: 11,
    lineHeight: 1.55,
  },
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
  },
  meta: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 8,
  },
  lead: {
    fontSize: 11,
    color: "#334155",
    lineHeight: 1.65,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  },
  card: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: "#334155",
  },
  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: "row",
    marginTop: 3,
    paddingRight: 8,
  },
  bulletMark: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.55,
    color: "#334155",
  },
  axisMeta: {
    fontSize: 9.5,
    color: "#64748B",
    marginBottom: 4,
  },
  sectionIntro: {
    fontSize: 10,
    color: "#475569",
    marginBottom: 6,
    lineHeight: 1.55,
  },
});

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function BulletList({ items = [] }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <View style={styles.bulletList}>
      {safeItems.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{String(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionBlock({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function AxisSummarySection({ items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title="5축 요약">
      <Text style={styles.sectionIntro}>
        레이더 시각 요소는 이번 PDF에서 텍스트 요약으로 단순화했습니다.
      </Text>
      {safeItems.map((item) => (
        <View key={item.axisKey} style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>{item.label}</Text>
          <Text style={styles.axisMeta}>
            {item.score5 != null ? `점수 ${item.score5}/5` : "점수 정보 없음"}
            {item.band ? ` · 밴드 ${item.band}` : ""}
          </Text>
          {item.summary ? <Text style={styles.paragraph}>{item.summary}</Text> : null}
        </View>
      ))}
    </SectionBlock>
  );
}

function TopRiskSection({ items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title="주요 리스크">
      {safeItems.map((item) => (
        <View key={item.key} style={styles.card} wrap={false}>
          {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
          {item.body ? <Text style={styles.paragraph}>{item.body}</Text> : null}
        </View>
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
      {block.sectionTitle ? <Text style={styles.sectionIntro}>{block.sectionTitle}</Text> : null}
      {block.intro ? <Text style={styles.paragraph}>{block.intro}</Text> : null}
      {cards.map((card) => (
        <View key={card.id} style={styles.card} wrap={false}>
          {card.title ? <Text style={styles.cardTitle}>{card.title}</Text> : null}
          {card.body ? <Text style={styles.paragraph}>{card.body}</Text> : null}
          <BulletList items={card.bullets} />
        </View>
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
        <View key={item.axisKey} style={styles.card} wrap={false}>
          {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
          {item.introText ? <Text style={styles.paragraph}>{item.introText}</Text> : null}
          {item.cautionText ? <Text style={styles.paragraph}>{item.cautionText}</Text> : null}
        </View>
      ))}
    </SectionBlock>
  );
}

function SimpleListSection({ title, items }) {
  const safeItems = toArr(items);
  if (safeItems.length === 0) return null;

  return (
    <SectionBlock title={title}>
      <View style={styles.card} wrap={false}>
        <BulletList items={safeItems} />
      </View>
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
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>지원 직무 특징</Text>
          {targetJobRead.title ? <Text style={styles.sectionIntro}>{targetJobRead.title}</Text> : null}
          {targetJobRead.body ? <Text style={styles.paragraph}>{targetJobRead.body}</Text> : null}
          <BulletList items={targetJobRead.bullets} />
        </View>
      ) : null}

      {hasIndustryTraits ? (
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>지원 산업 특징</Text>
          {industryTraits.label ? <Text style={styles.sectionIntro}>{industryTraits.label}</Text> : null}
          {industryTraits.summary ? <Text style={styles.paragraph}>{industryTraits.summary}</Text> : null}
          <BulletList items={industryTraits.whyIndustryMatters} />
          <BulletList items={industryTraits.evaluationCriteria} />
        </View>
      ) : hasTargetIndustry ? (
        <View style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>지원 산업 특징</Text>
          {targetIndustryRead.title ? <Text style={styles.sectionIntro}>{targetIndustryRead.title}</Text> : null}
          {targetIndustryRead.summary ? <Text style={styles.paragraph}>{targetIndustryRead.summary}</Text> : null}
          <BulletList items={targetIndustryRead.bullets} />
        </View>
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
        <View style={styles.card} wrap={false}>
          {description ? <Text style={styles.paragraph}>{description}</Text> : null}
          {table?.meta?.targetJobLabel ? (
            <Text style={styles.paragraph}>?Ñ‰ì­© ï§žê³·Ð¢: {table.meta.targetJobLabel}</Text>
          ) : null}
          {table?.meta?.targetIndustryLabel ? (
            <Text style={styles.paragraph}>?Ñ‰ì­© ?ê³—ë¾½: {table.meta.targetIndustryLabel}</Text>
          ) : null}
          {metaNote ? <Text style={styles.paragraph}>{metaNote}</Text> : null}
        </View>
        {rows.length > 0 ? rows.map((row, index) => (
          <View key={row?.rowKey || index} style={styles.card} wrap={false}>
            <Text style={styles.cardTitle}>{`${itemLabel}: ${getItemLabel(row)}`}</Text>
            {row?.evidence ? (
              <Text style={styles.paragraph}>
                {evidenceLabel + ": " + row.evidence}
              </Text>
            ) : null}
            <Text style={styles.paragraph}>
              {linkageLabel + ": " + (getLinkageText(row) || "-")}
            </Text>
          </View>
        )) : (
          <View style={styles.card} wrap={false}>
            <Text style={styles.paragraph}>{emptyStateText}</Text>
          </View>
        )}
      </SectionBlock>
    );
  }

  return (
    <SectionBlock title={title}>
      <View style={styles.card} wrap={false}>
        {description ? <Text style={styles.paragraph}>{description}</Text> : null}
        {table?.meta?.targetJobLabel ? (
          <Text style={styles.paragraph}>희망 직무: {table.meta.targetJobLabel}</Text>
        ) : null}
        {table?.meta?.targetIndustryLabel ? (
          <Text style={styles.paragraph}>희망 산업: {table.meta.targetIndustryLabel}</Text>
        ) : null}
        {metaNote ? <Text style={styles.paragraph}>{metaNote}</Text> : null}
      </View>
      {rows.length > 0 ? rows.map((row, index) => (
        <View key={row?.rowKey || index} style={styles.card} wrap={false}>
          <Text style={styles.cardTitle}>{`${itemLabel}: ${getItemLabel(row)}`}</Text>
          {row?.evidence ? (
            <Text style={styles.paragraph}>
              {evidenceLabel + ": " + row.evidence}
            </Text>
          ) : null}
          <Text style={styles.paragraph}>
            {jobLinkageLabel + ": " + (getJobLinkageText(row) || "-")}
          </Text>
          <Text style={styles.paragraph}>
            {industryLinkageLabel + ": " + (getIndustryLinkageText(row) || "-")}
          </Text>
        </View>
      )) : (
        <View style={styles.card} wrap={false}>
          <Text style={styles.paragraph}>{emptyStateText}</Text>
        </View>
      )}
    </SectionBlock>
  );
}

export default function TransitionLitePdfDocument({ model }) {
  if (!model || typeof model !== "object") return null;

  const topRepairSignals = toArr(model.topRepairSignals).map((item) => item.title || item.body).filter(Boolean);

  return (
    <Document
      title={model.reportTitle || "PASSMAP Transition Lite Report"}
      author="PASSMAP"
      subject="Transition Lite Report"
      creator="PASSMAP"
      producer="PASSMAP"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <Text style={styles.title}>{model.reportTitle || "직무산업 분석 리포트"}</Text>
          {model.generatedAt ? <Text style={styles.meta}>생성일 {model.generatedAt}</Text> : null}
          {model.topSummary ? <Text style={styles.lead}>{model.topSummary}</Text> : null}
        </View>

        <AxisSummarySection items={model.axisSummary} />
        <TopRiskSection items={model.topRisks} />
        <ReadBlockSection title="핵심 해석" block={model.interviewerRead} />
        <NewgradGoalComparisonSection table={model.newgradGoalComparisonTable} />
        <DetailedReadSection items={model.detailedRead} />
        <SimpleListSection title="핵심 보강 포인트" items={topRepairSignals} />

        {model.strengthEvidence ? (
          <SectionBlock title="강점 연결 근거">
            <View style={styles.card} wrap={false}>
              <BulletList items={model.strengthEvidence.matchedStrengthLabels} />
              <BulletList items={model.strengthEvidence.matchedWorkStyleLabels} />
              <BulletList items={model.strengthEvidence.allStrengthLabels} />
            </View>
          </SectionBlock>
        ) : null}

        <SimpleListSection title="강점 활용" items={model.strengths} />
        <SimpleListSection title="왜 이렇게 읽히는가" items={model.whyThisRead} />
        {model.whyThisReadSupportLine ? (
          <SectionBlock title="보조 해석 문장">
            <View style={styles.card} wrap={false}>
              <Text style={styles.paragraph}>{model.whyThisReadSupportLine}</Text>
            </View>
          </SectionBlock>
        ) : null}
        <ReferenceReadsSection referenceReads={model.referenceReads} />
      </Page>
    </Document>
  );
}
