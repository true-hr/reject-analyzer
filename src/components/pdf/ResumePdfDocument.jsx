import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    color: "#0F172A",
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#CBD5E1",
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  meta: {
    color: "#475569",
    fontSize: 9.5,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 2,
  },
  itemMeta: {
    color: "#64748B",
    fontSize: 9.5,
    marginBottom: 3,
  },
  bullet: {
    marginBottom: 2,
  },
});

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function clean(value) {
  return String(value || "").trim();
}

function dateRange(startDate, endDate) {
  const start = clean(startDate);
  const end = clean(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function BulletList({ bullets }) {
  const items = list(bullets);
  if (!items.length) return null;
  return (
    <View>
      {items.map((bullet, index) => {
        const text = clean(bullet?.text || bullet);
        return text ? <Text key={bullet?.id || index} style={styles.bullet}>- {text}</Text> : null;
      })}
    </View>
  );
}

export default function ResumePdfDocument({ profile = {} }) {
  const identity = profile.identity || {};
  const contacts = [identity.email, identity.phone, identity.location, ...list(identity.links)]
    .map(clean)
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{clean(identity.name) || "Resume"}</Text>
          {contacts.length ? <Text style={styles.meta}>{contacts.join(" | ")}</Text> : null}
          {profile.headline?.summary ? <Text>{profile.headline.summary}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {list(profile.experiences).map((item) => (
            <View key={item.id} wrap={false}>
              <Text style={styles.itemTitle}>{[item.title, item.company].map(clean).filter(Boolean).join(" | ") || "Experience"}</Text>
              <Text style={styles.itemMeta}>{[dateRange(item.startDate, item.endDate), item.employmentType].map(clean).filter(Boolean).join(" | ")}</Text>
              <BulletList bullets={item.bullets} />
            </View>
          ))}
        </View>

        {list(profile.projects).length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {list(profile.projects).map((item) => (
              <View key={item.id} wrap={false}>
                <Text style={styles.itemTitle}>{clean(item.name) || "Project"}</Text>
                <BulletList bullets={item.bullets} />
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
