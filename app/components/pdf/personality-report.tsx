import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image
} from "@react-pdf/renderer";

type Trait = "E" | "O" | "C" | "A" | "N";

export type PdfReportData = {
  brandTitle: string;
  brandSubtitle: string;
  generatedLabel: string; // e.g. "Generated"
  dateISO: string;

  typeName: string;
  typeDescription: string;
  avatarUrl?: string; // absolute URL

  addOns: {
    stressTitle: string;
    stressValue?: string;
    stressNote?: string;
    stabilityLabel?: string;

    subtypeTitle: string;
    subtypeValue?: string;
    subtypeNote?: string;

    modeTitle: string;
    modeValue?: string;
    modeNote?: string;
  };

  bigFive: Array<{
    key: string;
    label: string;
    value: number; // 0-100
    note?: string;
  }>;

  footer: string;       // e.g. "Personality test"
  disclaimer: string;   // print-friendly disclaimer
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111827",
    backgroundColor: "#FFFFFF"
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#EEF2FF" // light indigo
  },
  brandTitle: { fontSize: 12, fontWeight: 700 },
  brandSubtitle: { fontSize: 9, color: "#6B7280", marginTop: 1 },

  title: { fontSize: 22, fontWeight: 800, marginBottom: 6 },
  sub: { fontSize: 10, color: "#6B7280", marginBottom: 16 },

  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14
  },

  profileRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 999 },
  typeName: { fontSize: 18, fontWeight: 800 },
  typeDesc: { fontSize: 10, color: "#374151", marginTop: 8, lineHeight: 1.35 },

  pillsRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  pill: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10
  },
  pillTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6
  },
  pillTitle: { fontSize: 10, fontWeight: 700 },
  pillMeta: { fontSize: 9, color: "#6B7280" },
  pillValue: { fontSize: 11, fontWeight: 700 },
  pillNote: { fontSize: 9, color: "#6B7280", marginTop: 4, lineHeight: 1.25 },

  sectionTitle: { fontSize: 12, fontWeight: 800, marginBottom: 10 },

  barRow: { marginBottom: 10 },
  barTop: { flexDirection: "row", justifyContent: "space-between" },
  barLabel: { fontSize: 10, color: "#111827" },
  barVal: { fontSize: 10, color: "#6B7280" },
  barBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    marginTop: 5,
    overflow: "hidden"
  },
  barFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#6366F1" // indigo-500
  },
  barNote: { fontSize: 9, color: "#6B7280", marginTop: 3, lineHeight: 1.25 },

  disclaimer: { fontSize: 8.5, color: "#6B7280", lineHeight: 1.3, marginTop: 8 },
  footer: { fontSize: 9, color: "#9CA3AF", textAlign: "center", marginTop: 10 }
});

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function PersonalityReportPDF({ data }: { data: PdfReportData }) {
  const a = data.addOns;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <View style={styles.mark} />
            <View>
              <Text style={styles.brandTitle}>{data.brandTitle}</Text>
              <Text style={styles.brandSubtitle}>{data.brandSubtitle}</Text>
            </View>
          </View>
          <Text style={styles.brandSubtitle}>
            {data.generatedLabel} {data.dateISO}
          </Text>
        </View>

        <Text style={styles.title}>Personality report</Text>
        <Text style={styles.sub}>A one-page overview of your personality result.</Text>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            {data.avatarUrl ? (
              <Image style={styles.avatar} src={data.avatarUrl} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "#F3F4F6" }]} />
            )}

            <View style={{ flexGrow: 1 }}>
              <Text style={styles.typeName}>{data.typeName}</Text>
              <Text style={styles.typeDesc}>{data.typeDescription}</Text>
            </View>
          </View>

          <View style={styles.pillsRow}>
            <View style={styles.pill}>
              <View style={styles.pillTitleRow}>
                <Text style={styles.pillTitle}>{a.stressTitle}</Text>
                <Text style={styles.pillMeta}>{a.stabilityLabel ?? ""}</Text>
              </View>
              <Text style={styles.pillValue}>{a.stressValue ?? "—"}</Text>
              {a.stressNote ? <Text style={styles.pillNote}>{a.stressNote}</Text> : null}
            </View>

            <View style={styles.pill}>
              <View style={styles.pillTitleRow}>
                <Text style={styles.pillTitle}>{a.subtypeTitle}</Text>
                <Text style={styles.pillMeta}> </Text>
              </View>
              <Text style={styles.pillValue}>{a.subtypeValue ?? "—"}</Text>
              {a.subtypeNote ? <Text style={styles.pillNote}>{a.subtypeNote}</Text> : null}
            </View>

            <View style={styles.pill}>
              <View style={styles.pillTitleRow}>
                <Text style={styles.pillTitle}>{a.modeTitle}</Text>
                <Text style={styles.pillMeta}> </Text>
              </View>
              <Text style={styles.pillValue}>{a.modeValue ?? "—"}</Text>
              {a.modeNote ? <Text style={styles.pillNote}>{a.modeNote}</Text> : null}
            </View>
          </View>
        </View>

        {/* Big Five card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Big Five details</Text>

          {data.bigFive.map((row) => (
            <View key={row.key} style={styles.barRow}>
              <View style={styles.barTop}>
                <Text style={styles.barLabel}>{row.label}</Text>
                <Text style={styles.barVal}>{clampPct(row.value)}</Text>
              </View>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${clampPct(row.value)}%` }]} />
              </View>
              {row.note ? <Text style={styles.barNote}>{row.note}</Text> : null}
            </View>
          ))}

          <Text style={styles.disclaimer}>{data.disclaimer}</Text>
        </View>

        <Text style={styles.footer}>© {new Date().getFullYear()} {data.footer}</Text>
      </Page>
    </Document>
  );
}
