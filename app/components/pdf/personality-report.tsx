import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Font
} from "@react-pdf/renderer";

type Trait = "E" | "O" | "C" | "A" | "N" | "S";

export type PdfReportData = {
  brandTitle: string;
  brandSubtitle: string;
  generatedLabel: string;
  dateISO: string;
  titleBefore: string;
  titleAccent: string;
  subtitle: string;
  profileLabel: string;
  traitsTitle: string;

  typeName: string;
  typeDescription: string;
  avatarUrl?: string;

  bigFive: Array<{
    key: string;
    label: string;
    value: number;
    note?: string;
  }>;
  bigFiveLevels: {
    low: string;
    medium: string;
    high: string;
  };

  disclaimer: string;
};

const C = {
  bg: "#0B0C14",
  cardBg: "#23242C",
  border: "#303037",
  title: "rgba(255,255,255,0.90)",
  titleAccentStart: "#A5B4FC",
  text85: "rgba(255,255,255,0.85)",
  text80: "rgba(255,255,255,0.80)",
  text70: "rgba(255,255,255,0.70)",
  text65: "rgba(255,255,255,0.65)",
  text55: "rgba(255,255,255,0.55)",
  text50: "rgba(255,255,255,0.50)",
  text45: "rgba(255,255,255,0.45)",
  text40: "rgba(255,255,255,0.40)",
  barBg: "#1F212A",
  gradStart: "#6366F1",
  gradMid: "#8B5CF6",
  gradEnd: "#EC4899"
};

let fontRegistered = false;

if (typeof window !== "undefined" && !fontRegistered) {
  const baseUrl = window.location.origin;
  Font.register({
    family: "GeistSans",
    fonts: [
      { src: `${baseUrl}/fonts/GeistSans-Regular.ttf`, fontWeight: 400 },
      { src: `${baseUrl}/fonts/GeistSans-Bold.ttf`, fontWeight: 700 }
    ]
  });
  fontRegistered = true;
}

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "GeistSans",
    color: "#FFFFFF",
    backgroundColor: C.bg
  },
  pageBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18
  },
  brand: { flexDirection: "row", alignItems: "center" },
  mark: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.border,
    marginRight: 10
  },
  brandTitle: { fontSize: 12, fontWeight: 700, color: C.text85 },
  brandSubtitle: { fontSize: 9, color: C.text55, marginTop: 1 },

  title: { fontSize: 24, fontWeight: 700, marginBottom: 6, color: C.title },
  titleAccent: { color: C.titleAccentStart },
  sub: { fontSize: 10, color: C.text65, marginBottom: 16 },

  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: C.cardBg
  },

  profileRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 64, height: 64, borderRadius: 999, marginRight: 14 },
  typeLabel: {
    fontSize: 8.5,
    color: C.text55,
    marginBottom: 4,
    letterSpacing: 0.6
  },
  typeName: { fontSize: 20, fontWeight: 700, color: C.text85 },
  typeDesc: { fontSize: 10, color: C.text80, marginTop: 8, lineHeight: 1.35 },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
    color: C.text85
  },

  barRow: { marginBottom: 10 },
  barTop: { flexDirection: "row", justifyContent: "space-between" },
  barLabelRow: { flexDirection: "row", alignItems: "center" },
  barLabel: { fontSize: 10, color: C.text80 },
  barVal: { fontSize: 10, color: C.text70 },
  barBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: C.barBg,
    marginTop: 5,
    overflow: "hidden"
  },
  barFillWrap: { height: 8, borderRadius: 999, overflow: "hidden" },
  barGradient: { width: "100%", height: "100%" },
  barMetaRow: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  barMetaText: { fontSize: 9, color: C.text55, lineHeight: 1.2 },
  barMetaNote: { fontSize: 8.5, color: C.text55, marginLeft: 4, lineHeight: 1.2 },
  topTrait: { marginLeft: 6 },

  disclaimer: { fontSize: 8.5, color: C.text40, lineHeight: 1.3, marginTop: 8 }
});

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function levelKey(v: number): "low" | "medium" | "high" {
  const x = clampPct(v);
  if (x <= 33) return "low";
  if (x <= 66) return "medium";
  return "high";
}

function toUpper(value: string) {
  return value.toLocaleUpperCase();
}

export function PersonalityReportPDF({ data }: { data: PdfReportData }) {
  const levels = data.bigFiveLevels;

  const bigFiveOrder: Trait[] = ["S", "E", "O", "C", "A", "N"];
  const bigFiveMap = new Map(data.bigFive.map((row) => [row.key, row]));
  const isBigFiveRow = (
    row: PdfReportData["bigFive"][number] | undefined
  ): row is PdfReportData["bigFive"][number] => Boolean(row);

  const orderedBigFive = [
    ...bigFiveOrder.map((key) => bigFiveMap.get(key)).filter(isBigFiveRow),
    ...data.bigFive.filter((row) => !bigFiveOrder.includes(row.key as Trait))
  ];

  const topTrait = orderedBigFive.reduce(
    (best, row) => (row.value > best.value ? row : best),
    orderedBigFive[0] ?? data.bigFive[0]
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.pageBg} fixed>
          <Svg width="100%" height="100%" viewBox="0 0 595 842">
            <Defs>
              <LinearGradient id="pageFade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.06} />
                <Stop offset="60%" stopColor="#FFFFFF" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="595" height="300" fill="url(#pageFade)" />
          </Svg>
        </View>

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

        <Text style={styles.title}>
          {data.titleBefore}{" "}
          <Text style={styles.titleAccent}>{data.titleAccent}</Text>
        </Text>
        <Text style={styles.sub}>{data.subtitle}</Text>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            {data.avatarUrl ? (
              <Image style={styles.avatar} src={data.avatarUrl} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border }
                ]}
              />
            )}

            <View style={{ flexGrow: 1 }}>
              <Text style={styles.typeLabel}>{toUpper(data.profileLabel)}</Text>
              <Text style={styles.typeName}>{data.typeName}</Text>
              <Text style={styles.typeDesc}>{data.typeDescription}</Text>
            </View>
          </View>
        </View>

        {/* Big Five card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{data.traitsTitle}</Text>

          {orderedBigFive.map((row) => (
            <View key={row.key} style={styles.barRow}>
              <View style={styles.barTop}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>{row.label}</Text>
                  {topTrait && row.key === topTrait.key ? (
                    <Svg style={styles.topTrait} width={10} height={10} viewBox="0 0 24 24">
                      <Path
                        d="M12 2l2.83 6.63 7.17.62-5.45 4.74 1.64 7.01L12 17.27 5.81 21l1.64-7.01L2 9.25l7.17-.62L12 2z"
                        fill="#FDE68A"
                      />
                    </Svg>
                  ) : null}
                </View>
                <Text style={styles.barVal}>{clampPct(row.value)}</Text>
              </View>

              <View style={styles.barBg}>
                <View style={[styles.barFillWrap, { width: `${clampPct(row.value)}%` }]}>
                  <Svg style={styles.barGradient} viewBox="0 0 100 8" preserveAspectRatio="none">
                    <Defs>
                      <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0%" stopColor={C.gradStart} />
                        <Stop offset="50%" stopColor={C.gradMid} />
                        <Stop offset="100%" stopColor={C.gradEnd} />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100" height="8" fill="url(#barGrad)" rx="999" ry="999" />
                  </Svg>
                </View>
              </View>

              <View style={styles.barMetaRow}>
                <Text style={styles.barMetaText}>{levels[levelKey(row.value)]}</Text>
                {row.note ? <Text style={styles.barMetaNote}>({row.note})</Text> : null}
              </View>
            </View>
          ))}

          <Text style={styles.disclaimer}>{data.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  );
}
