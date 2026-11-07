import React from "react";
import { BRAND } from "@/lib/brand";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Font
} from "@react-pdf/renderer";

type Trait = "E" | "O" | "C" | "A" | "N" | "S";

export type PdfProfileSection = {
  key: string;
  title: string;
  lines: string[];
};

export type PdfReportData = {
  brandTitle: string;
  brandSubtitle: string;
  generatedLabel: string;
  dateISO: string;
  logoImageUrl?: string;
  bigFiveIconUrl?: string;

  titleBefore: string;
  titleAccent: string;
  subtitle: string;

  profileLabel: string;

  typeName: string;
  typeDescription: string;
  avatarUrl?: string;

  traitsTitle: string;
  bigFive: Array<{
    key: string;
    label: string;
    value: number;
    note?: string;
    leftPole?: string;
    rightPole?: string;
  }>;

  // ✅ 6 sections (core/daily/strengths/watchOut/underPressure/relationships)
  profileSections: PdfProfileSection[];

  // ✅ PDF-only legal line (use Result.pdf.disclaimer)
  disclaimer: string;
};

const C = {
  bg: "#0b0c14",
  cardBg: "#191829",
  border: "#292739",
  title: "rgba(255,255,255,0.90)",
  brandAccent: "#9F7AEA",
  titleAccentFirst: "#a4afff",
  titleAccentSecond: "#f582d0",
  text90: "rgba(255,255,255,0.90)",
  text85: "rgba(255,255,255,0.85)",
  text80: "rgba(255,255,255,0.80)",
  text75: "rgba(255,255,255,0.75)",
  text70: "rgba(255,255,255,0.70)",
  text65: "rgba(255,255,255,0.65)",
  text55: "rgba(255,255,255,0.55)",
  text50: "rgba(255,255,255,0.50)",
  text45: "rgba(255,255,255,0.45)",
  text40: "rgba(255,255,255,0.40)",
  barBg: "#2d293d",
  gradStart: "#52D4FF",
  gradMid: "#79C1FF",
  gradMid2: "#B79FFF",
  gradEnd: "#F087EE"
};

const SECTION_ICON_SIZE = 18;
const SECTION_ICON_OPACITY = 1;
const SECTION_ICON_COLORS = {
  core: "#59CA73",
  daily: "#57D6FF",
  strengths: "#7CB6FF",
  watchOut: "#A58EFF",
  underPressure: "#C57EFF",
  relationships: "#F582AE"
} as const;

let fontRegistered = false;

// Embed the bundled font to preserve accented characters across all report languages.
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
    paddingBottom: 60,
    fontSize: 10,
    fontFamily: "GeistSans",
    color: "#FFFFFF",
    backgroundColor: C.bg
  },
  pageBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18
  },
  brand: { flexDirection: "column" },
  brandLogo: { width: 65, height: 14, objectFit: "contain" },
  brandSubtitle: { fontSize: 9, color: C.text55, marginTop: 1 },

  title: { fontSize: 26, lineHeight: 1.12, fontWeight: 700, marginBottom: 6, color: C.title },
  sub: { fontSize: 10, lineHeight: 1.5, color: C.text75, marginBottom: 20 },

  card: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    backgroundColor: C.cardBg
  },

  profileRow: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    marginRight: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171922",
    borderWidth: 1,
    borderColor: C.border
  },
  avatarIcon: { width: 64, height: 64, objectFit: "contain" },
  avatarFallback: { fontSize: 20, fontWeight: 700, color: C.text90 },
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

  bigFiveHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  bigFiveIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171922",
    borderWidth: 1,
    borderColor: C.border
  },
  bigFiveIcon: { width: 22, height: 22, objectFit: "contain" },
  barRow: { marginBottom: 12 },
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
  barMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4
  },
  barMetaText: { fontSize: 8.5, color: C.text45, lineHeight: 1.2 },
  barMetaNote: { fontSize: 8.5, color: C.text55, marginTop: 3, lineHeight: 1.2 },
  topTrait: { marginLeft: 6 },

  // profile sections
  psTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, borderLeftWidth: 2 },
  psKicker: {
    fontSize: 10,
    fontWeight: 700,
    flex: 1,
    color: C.text90,
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  psIconWrap: {
    width: 22,
    height: 22,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9
  },

  psBody: { fontSize: 10, color: C.text75, lineHeight: 1.45 },
  psPara: { marginTop: 6 },

  disclaimer: { fontSize: 8.5, color: C.text40, lineHeight: 1.3, marginTop: 8 },

  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 24,
    fontSize: 8.5,
    color: C.text40,
    textAlign: "center"
  }
});

function clampPct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function getYearFromISO(dateISO: string) {
  const y = Number(String(dateISO).slice(0, 4));
  return Number.isFinite(y) ? String(y) : String(new Date().getFullYear());
}

function SectionIcon({ sectionKey }: { sectionKey: string }) {
  const color =
    SECTION_ICON_COLORS[sectionKey as keyof typeof SECTION_ICON_COLORS] ??
    SECTION_ICON_COLORS.core;
  const pathProps = {
    stroke: color,
    strokeOpacity: SECTION_ICON_OPACITY,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.6,
    fill: "none"
  };

  switch (sectionKey) {
    case "core":
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path {...pathProps} d="M12 18V5" />
          <Path {...pathProps} d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
          <Path {...pathProps} d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
          <Path {...pathProps} d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
          <Path {...pathProps} d="M18 18a4 4 0 0 0 2-7.464" />
          <Path {...pathProps} d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
          <Path {...pathProps} d="M6 18a4 4 0 0 1-2-7.464" />
          <Path {...pathProps} d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
        </Svg>
      );
    case "daily":
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path {...pathProps} d="M3 6h3m4 0h11M3 12h11m4 0h3M3 18h5m4 0h9" />
          <Circle {...pathProps} cx="8" cy="6" r="2" />
          <Circle {...pathProps} cx="16" cy="12" r="2" />
          <Circle {...pathProps} cx="10" cy="18" r="2" />
        </Svg>
      );
    case "strengths":
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path {...pathProps} d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3Z" />
          <Path {...pathProps} d="m13 7-5 6h4l-1 4 5-6h-4l1-4Z" fill={color} stroke="none" />
        </Svg>
      );
    case "watchOut":
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path {...pathProps} d="M2 12c2.5-4.5 6-7 10-7s7.5 2.5 10 7c-2.5 4.5-6 7-10 7S4.5 16.5 2 12Z" />
          <Circle {...pathProps} cx="12" cy="12" r="3" />
        </Svg>
      );
    case "underPressure":
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path {...pathProps} d="M4.2 19a9 9 0 1 1 15.6 0" />
          <Path {...pathProps} d="m12 14 3.5-5" />
          <Circle {...pathProps} cx="12" cy="14" r="1.5" fill={color} stroke="none" />
        </Svg>
      );
    case "relationships":
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path {...pathProps} d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
        </Svg>
      );
    default:
      return (
        <Svg
          width={SECTION_ICON_SIZE}
          height={SECTION_ICON_SIZE}
          viewBox="0 0 24 24"
        >
          <Path d="M12 12h.01" {...pathProps} />
        </Svg>
      );
  }
}

function PageBackground() {
  return (
    <View style={styles.pageBg} fixed>
      <Svg width="100%" height="100%" viewBox="0 0 595 842">
        <Defs>
          <LinearGradient id="pageBaseBg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#282846" />
            <Stop offset="48%" stopColor="#141321" />
            <Stop offset="100%" stopColor="#0b0c14" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="595" height="842" fill="url(#pageBaseBg)" />
      </Svg>
    </View>
  );
}

function ReportHeader({ data }: { data: PdfReportData }) {
  return (
    <View style={styles.headerRow} fixed>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={data.logoImageUrl ?? BRAND.logoSrc} style={{ width: 32, height: 32, borderRadius: 9 }} />
        <View>
          <Text style={{ fontSize: 13, fontWeight: 700 }}>{BRAND.name}</Text>
          <Text style={styles.brandSubtitle}>{BRAND.tagline}</Text>
        </View>
      </View>
    </View>
  );
}

const TRAIT_COLORS: Record<string, [string, string, string]> = {
  S: ["#20C979", "#42D65A", "#7BE58C"],
  E: ["#4ED7FF", "#69C8FF", "#86E0FF"],
  O: ["#7D66FF", "#A67EFF", "#C68BFF"],
  C: ["#F25FB3", "#FF7DCC", "#FF9FB8"],
  A: ["#FF9B5F", "#FFB15B", "#FFD08A"]
};

function blendColor(from: string, to: string, amount: number) {
  const channels = [1, 3, 5].map((offset) => {
    const start = parseInt(from.slice(offset, offset + 2), 16);
    const end = parseInt(to.slice(offset, offset + 2), 16);
    return Math.round(start + (end - start) * amount).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function titleGradient(position: number) {
  return position <= 0.48
    ? blendColor("#a4afff", "#c4afff", position / 0.48)
    : blendColor("#c4afff", "#f582d0", Math.min(1, (position - 0.48) / 0.44));
}

function Footer({ data }: { data: PdfReportData }) {
  return (
    <Text style={styles.footer} fixed>
      {BRAND.name} © {getYearFromISO(data.dateISO)}
    </Text>
  );
}

export function PersonalityReportPDF({ data }: { data: PdfReportData }) {
  const showAvatar = true;

  const bigFiveOrder: Trait[] = ["S", "E", "O", "C", "A", "N"];
  const bigFiveMap = new Map(data.bigFive.map((row) => [row.key, row]));
  const isBigFiveRow = (
    row: PdfReportData["bigFive"][number] | undefined
  ): row is PdfReportData["bigFive"][number] => Boolean(row);

  const orderedBigFive = [
    ...bigFiveOrder.map((key) => bigFiveMap.get(key)).filter(isBigFiveRow),
    ...data.bigFive.filter((row) => !bigFiveOrder.includes(row.key as Trait))
  ];

  const sections = (data.profileSections ?? []).filter(
    (s) => Array.isArray(s.lines) && s.lines.length > 0
  );

  return (
    <Document title={`${BRAND.name} — ${data.typeName}`} author={BRAND.name}>
      {/* PAGE 1+: header + hero + profile + 6 sections (wrap across pages) */}
      <Page size="A4" style={styles.page} wrap>
        <PageBackground />
        <ReportHeader data={data} />

        <Text style={styles.title}>
          {data.titleBefore}{" "}
          {[...data.titleAccent].map((character, index, characters) => (
            <Text key={index} style={{ color: titleGradient(index / Math.max(1, characters.length - 1)) }}>{character}</Text>
          ))}
        </Text>
        <Text style={styles.sub}>{data.subtitle}</Text>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            {showAvatar && (
              <View style={styles.avatarWrap}>
                {data.avatarUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image
                    style={styles.avatarIcon}
                    src={data.avatarUrl}
                  />
                ) : (
                  <Text style={styles.avatarFallback}>
                    {data.typeName?.charAt(0) || "?"}
                  </Text>
                )}
              </View>
            )}

            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={styles.typeName}>{data.typeName}</Text>
              <Text style={styles.typeDesc}>{data.typeDescription}</Text>
            </View>
          </View>
        </View>

        {/* Keep each section together when paginating. */}
        {sections.map((section) => {
          const accent = SECTION_ICON_COLORS[section.key as keyof typeof SECTION_ICON_COLORS] ?? SECTION_ICON_COLORS.core;
          const copy = section.lines.map((line) => line.trim()).filter(Boolean).join(" ");
          return (
            <View key={section.key} style={styles.card} wrap={false}>
              <View style={[styles.psTitleRow, { backgroundColor: blendColor(C.cardBg, accent, 0.08), borderLeftColor: blendColor(C.cardBg, accent, 0.6) }]}>
                <View style={styles.psIconWrap}>
                  <SectionIcon sectionKey={section.key} />
                </View>
                <Text style={styles.psKicker}>{section.title}</Text>
              </View>
              <Text style={styles.psBody}>{copy}</Text>
            </View>
          );
        })}

        <Footer data={data} />
      </Page>

      {/* LAST PAGE: Big Five details */}
      <Page size="A4" style={styles.page}>
        <PageBackground />
        <ReportHeader data={data} />

        <View style={styles.card}>
          <View style={styles.bigFiveHeader}>
            <Text style={styles.sectionTitle}>{data.traitsTitle}</Text>
            {data.bigFiveIconUrl ? (
              <View style={styles.bigFiveIconWrap}>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image style={styles.bigFiveIcon} src={data.bigFiveIconUrl} />
              </View>
            ) : null}
          </View>

          {orderedBigFive.map((row) => (
            <View key={row.key} style={styles.barRow}>
              <View style={styles.barTop}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>{row.label}</Text>
                </View>
                <Text style={[styles.barVal, { color: (TRAIT_COLORS[row.key] ?? TRAIT_COLORS.O)[1], fontWeight: 700 }]}>{clampPct(row.value)}%</Text>
              </View>

              <View style={styles.barBg}>
                <View style={[styles.barFillWrap, { width: `${clampPct(row.value)}%` }]}>
                  <Svg style={styles.barGradient} viewBox="0 0 100 8" preserveAspectRatio="none">
                    <Defs>
                      <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0%" stopColor={(TRAIT_COLORS[row.key] ?? TRAIT_COLORS.O)[0]} />
                        <Stop offset="55%" stopColor={(TRAIT_COLORS[row.key] ?? TRAIT_COLORS.O)[1]} />
                        <Stop offset="100%" stopColor={(TRAIT_COLORS[row.key] ?? TRAIT_COLORS.O)[2]} />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="100" height="8" fill="url(#barGrad)" rx="999" ry="999" />
                  </Svg>
                </View>
              </View>

              <View style={styles.barMetaRow}>
                <Text style={styles.barMetaText}>{row.leftPole ?? ""}</Text>
                <Text style={styles.barMetaText}>{row.rightPole ?? ""}</Text>
              </View>
              {row.note ? <Text style={styles.barMetaNote}>{row.note}</Text> : null}
            </View>
          ))}

          <Text style={styles.disclaimer}>{data.disclaimer}</Text>
        </View>

        <Footer data={data} />
      </Page>
    </Document>
  );
}
