"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/app/components/ui/logo";
import Image from "next/image";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";

// ✅ PDF
import {
  PersonalityReportPDF,
  type PdfReportData
} from "@/app/components/pdf/personality-report";

type Trait = "E" | "O" | "C" | "A" | "N";

type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: string; // P01–P16
  typeName?: string;
  typeDescription?: string;
  addOns?: {
    stressProfile?: { label: string; note: string };
    subtype?: { label: string; note: string };
    mode?: { label: string; note: string };
    stressKey?: string;
    subtypeKey?: string;
    modeKey?: string;
  };
};

const STORAGE_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";

const PAID_KEY = "personality_paid_v1";
const PAID_AT_KEY = "personality_paid_at_v1";
const GRACE_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Avatary: P01 → 0, P02 → 1, ..., P16 → 15
 */
const AVATARS = Array.from({ length: 16 }, (_, i) => {
  const id = String(i + 1).padStart(2, "0");
  return `/avatars/placeholder/avatar-${id}.png`;
});

const TYPE_CODES = Array.from({ length: 16 }, (_, i) =>
  `P${String(i + 1).padStart(2, "0")}`
);
const STRESS_KEYS = ["sensitive", "steady"] as const;
const SUBTYPE_KEYS = [
  "empathicVisionary",
  "independentInnovator",
  "supportivePragmatist",
  "directRealist"
] as const;
const MODE_KEYS = [
  "driveDeliver",
  "planPerfect",
  "exploreAdapt",
  "flowImprovise"
] as const;

function avatarIndexFromTypeCode(code: string) {
  const n = Number(code.replace("P", ""));
  return Number.isFinite(n) ? Math.max(0, Math.min(15, n - 1)) : 0;
}

function pct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ✅ Big Five UX label key (i18n via json)
function levelKey(v: number): "low" | "medium" | "high" {
  const x = pct(v);
  if (x <= 33) return "low";
  if (x <= 66) return "medium";
  return "high";
}

function isResultShape(x: any): x is StoredResultV1 {
  return (
    x &&
    typeof x.typeCode === "string" &&
    x.typeCode.startsWith("P") &&
    x.scores &&
    typeof x.scores.E === "number" &&
    typeof x.scores.O === "number" &&
    typeof x.scores.C === "number" &&
    typeof x.scores.A === "number" &&
    typeof x.scores.N === "number" &&
    typeof x.stability === "number"
  );
}

function safeGet<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function pickLongest(values: string[]) {
  return values.reduce(
    (best, value) => (value.length > best.length ? value : best),
    ""
  );
}

function longestByKeys<T extends string>(keys: readonly T[], get: (key: T) => string) {
  return pickLongest(keys.map((key) => safeGet(() => get(key), "")));
}

export default function ResultPage() {
  const router = useRouter();

  const t = useTranslations("Result");
  const tt = useTranslations("Types");
  const ta = useTranslations("AddOns");

  const [data, setData] = useState<StoredResultV1 | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showBigFive, setShowBigFive] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ✅ menu ⋯ (jak na /test)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      const target = e.target as Node;
      if (!menuRef.current.contains(target)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        router.replace("/test");
        return;
      }

      const paid = localStorage.getItem(PAID_KEY) === "true";
      const paidAt = Number(localStorage.getItem(PAID_AT_KEY) ?? "0");
      const withinGrace = paidAt > 0 && Date.now() - paidAt < GRACE_MS;

      if (!paid && !withinGrace) {
        router.replace("/pay");
        return;
      }

      const parsed = JSON.parse(raw);
      if (!isResultShape(parsed)) {
        router.replace("/test");
        return;
      }

      setData(parsed);
      setLoaded(true);
    } catch {
      router.replace("/test");
    }
  }, [router]);

  const stabilityLabel = useMemo(() => {
    if (!data) return "";
    if (data.stability >= 67) return t("stability.high");
    if (data.stability >= 34) return t("stability.medium");
    return t("stability.low");
  }, [data, t]);

  function stabilityDotClass(stability: number) {
    if (stability >= 67) return "bg-emerald-400";
    if (stability >= 34) return "bg-amber-400";
    return "bg-rose-400";
  }

  const typeName = useMemo(() => {
    if (!data) return "";
    return safeGet(
      () => tt(`${data.typeCode}.name`),
      data.typeName ?? data.typeCode
    );
  }, [data, tt]);

  const typeDescription = useMemo(() => {
    if (!data) return "";
    return safeGet(
      () => tt(`${data.typeCode}.desc`),
      data.typeDescription ?? ""
    );
  }, [data, tt]);

  const avatarSrc = useMemo(() => {
    if (!data) return AVATARS[0];
    return AVATARS[avatarIndexFromTypeCode(data.typeCode)];
  }, [data]);

  const stress = useMemo(() => {
    if (!data?.addOns) return null;

    if (data.addOns.stressProfile?.label || data.addOns.stressProfile?.note) {
      return {
        label: data.addOns.stressProfile?.label ?? "",
        note: data.addOns.stressProfile?.note ?? ""
      };
    }

    const key = data.addOns.stressKey as "sensitive" | "steady" | undefined;
    if (!key) return null;

    return {
      label: safeGet(() => ta(`stress.${key}.label`), ""),
      note: safeGet(() => ta(`stress.${key}.note`), "")
    };
  }, [data, ta]);

  const subtype = useMemo(() => {
    if (!data?.addOns) return null;

    if (data.addOns.subtype?.label || data.addOns.subtype?.note) {
      return {
        label: data.addOns.subtype?.label ?? "",
        note: data.addOns.subtype?.note ?? ""
      };
    }

    const key = data.addOns.subtypeKey as
      | "empathicVisionary"
      | "independentInnovator"
      | "supportivePragmatist"
      | "directRealist"
      | undefined;

    if (!key) return null;

    return {
      label: safeGet(() => ta(`subtype.${key}.label`), ""),
      note: safeGet(() => ta(`subtype.${key}.note`), "")
    };
  }, [data, ta]);

  const mode = useMemo(() => {
    if (!data?.addOns) return null;

    if (data.addOns.mode?.label || data.addOns.mode?.note) {
      return {
        label: data.addOns.mode?.label ?? "",
        note: data.addOns.mode?.note ?? ""
      };
    }

    const key = data.addOns.modeKey as
      | "driveDeliver"
      | "planPerfect"
      | "exploreAdapt"
      | "flowImprovise"
      | undefined;

    if (!key) return null;

    return {
      label: safeGet(() => ta(`mode.${key}.label`), ""),
      note: safeGet(() => ta(`mode.${key}.note`), "")
    };
  }, [data, ta]);

  async function downloadPdf() {
    if (!data || downloading) return;

    setDownloading(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const useMax =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("pdf") === "max";

      const maxTypeName = longestByKeys(TYPE_CODES, (code) =>
        tt(`${code}.name`)
      );
      const maxTypeDesc = longestByKeys(TYPE_CODES, (code) =>
        tt(`${code}.desc`)
      );

      const maxStressLabel = longestByKeys(STRESS_KEYS, (key) =>
        ta(`stress.${key}.label`)
      );
      const maxStressNote = longestByKeys(STRESS_KEYS, (key) =>
        ta(`stress.${key}.note`)
      );
      const maxSubtypeLabel = longestByKeys(SUBTYPE_KEYS, (key) =>
        ta(`subtype.${key}.label`)
      );
      const maxSubtypeNote = longestByKeys(SUBTYPE_KEYS, (key) =>
        ta(`subtype.${key}.note`)
      );
      const maxModeLabel = longestByKeys(MODE_KEYS, (key) =>
        ta(`mode.${key}.label`)
      );
      const maxModeNote = longestByKeys(MODE_KEYS, (key) =>
        ta(`mode.${key}.note`)
      );

      const stabilityOptions = [
        { label: t("stability.high"), color: "#34D399" },
        { label: t("stability.medium"), color: "#FBBF24" },
        { label: t("stability.low"), color: "#FB7185" }
      ];
      const maxStability = stabilityOptions.reduce((best, option) =>
        option.label.length > best.label.length ? option : best
      );

      const avatarUrl = (() => {
        try {
          return new URL(avatarSrc, window.location.origin).toString();
        } catch {
          return undefined;
        }
      })();

      const emotionalStability = 100 - data.scores.N;

      const bigFiveRows = [
        { key: "E", label: t("traits.E"), value: data.scores.E },
        { key: "O", label: t("traits.O"), value: data.scores.O },
        { key: "C", label: t("traits.C"), value: data.scores.C },
        { key: "A", label: t("traits.A"), value: data.scores.A },
        {
          key: "N",
          label: t("traits.N"),
          value: data.scores.N,
          note: t("traitsNotes.N")
        },
        {
          key: "S",
          label: t("traits.S"),
          value: emotionalStability,
          note: t("traitsNotes.S")
        }
      ];

      const reportTypeName = useMax ? maxTypeName : typeName;
      const reportTypeDesc = useMax ? maxTypeDesc : typeDescription;
      const reportStressLabel = useMax ? maxStressLabel : stress?.label;
      const reportStressNote = useMax ? maxStressNote : stress?.note;
      const reportSubtypeLabel = useMax ? maxSubtypeLabel : subtype?.label;
      const reportSubtypeNote = useMax ? maxSubtypeNote : subtype?.note;
      const reportModeLabel = useMax ? maxModeLabel : mode?.label;
      const reportModeNote = useMax ? maxModeNote : mode?.note;

      const reportStability =
        useMax
          ? {
              label: maxStability.label,
              color: maxStability.color
            }
          : {
              label: stabilityLabel,
              color:
                data.stability >= 67
                  ? "#34D399"
                  : data.stability >= 34
                    ? "#FBBF24"
                    : "#FB7185"
            };

      const report: PdfReportData = {
        brandTitle: t("brandTitle"),
        brandSubtitle: t("brandSubtitle"),
        generatedLabel: t("pdf.generated"),
        dateISO: new Date().toISOString().slice(0, 10),
        titleBefore: t("hero.before"),
        titleAccent: t("hero.accent"),
        subtitle: t("hero.sub"),
        profileLabel: t("yourTypeLabel"),
        traitsTitle: t("bigFive.title"),

        typeName: reportTypeName,
        typeDescription: reportTypeDesc,
        avatarUrl,

        addOns: {
          stressTitle: t("cards.stress.title"),
          stressValue: reportStressLabel,
          stressNote: reportStressNote,
          stabilityLabel: `${t("cards.stress.stability")}: ${reportStability.label}`,
          stabilityColor: reportStability.color,

          subtypeTitle: t("cards.subtype.title"),
          subtypeValue: reportSubtypeLabel,
          subtypeNote: reportSubtypeNote,

          modeTitle: t("cards.mode.title"),
          modeValue: reportModeLabel,
          modeNote: reportModeNote
        },

        bigFive: bigFiveRows.map((r) => ({
          key: r.key,
          label: r.label,
          value: r.value,
          note: (r as any).note
        })),
        bigFiveLevels: {
          low: t("bigFive.levels.low"),
          medium: t("bigFive.levels.medium"),
          high: t("bigFive.levels.high")
        },

        disclaimer: t("disclaimer")
      };

      const blob = await pdf(<PersonalityReportPDF data={report} />).toBlob();

      const filename = `personality-report-${report.dateISO}.pdf`;
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert(t("pdf.error"));
    } finally {
      setDownloading(false);
    }
  }

  function retake() {
    const ok = window.confirm(t("retakeConfirm"));
    if (!ok) return;

    try {
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(PAID_AT_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ANSWERS_KEY);
    } catch {}

    router.push("/test");
  }

  if (!loaded || !data) return null;

  const emotionalStability = 100 - data.scores.N;

  const bigFiveRows = [
    {
      key: "S",
      label: t("traits.S"),
      value: emotionalStability,
      note: t("traitsNotes.S")
    },
    { key: "E", label: t("traits.E"), value: data.scores.E },
    { key: "O", label: t("traits.O"), value: data.scores.O },
    { key: "C", label: t("traits.C"), value: data.scores.C },
    { key: "A", label: t("traits.A"), value: data.scores.A },
    {
      key: "N",
      label: t("traits.N"),
      value: data.scores.N,
      note: t("traitsNotes.N")
    }
  ];

  const highestTrait = bigFiveRows.reduce((max, row) =>
    row.value > max.value ? row : max
  , bigFiveRows[0]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-4 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>
      <div className="relative mx-auto w-full max-w-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Logo className="text-indigo-200" />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                {t("brandTitle")}
              </div>
              <div className="text-xs text-white/55 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                {t("brandSubtitle")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {/* Menu ⋯ (jak na /test) */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center rounded-xl
                  px-2 py-1.5 text-xs font-semibold tracking-tight
                  text-white/70 hover:text-white/90
                  border border-white/10 hover:border-white/20
                  bg-transparent hover:bg-white/5
                  transition focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label={t("menu")}
              >
                ⋯
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-max
                    rounded-xl border border-white/10
                    bg-[#0B0C14]/90 backdrop-blur-xl
                    shadow-xl overflow-hidden p-1"
                  role="menu"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      retake();
                    }}
                    className="block w-full whitespace-nowrap rounded-lg
                      px-3 py-2 text-sm font-medium tracking-tight
                      text-white/75 hover:text-white hover:bg-white/8"
                    role="menuitem"
                  >
                    {t("menuRetake")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="mt-10">
          <h1 className="mb-2 text-4xl font-semibold tracking-tight sm:text-5xl break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:balance]">
            {t("hero.before")}{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:balance]">
              {t("hero.accent")}
            </span>
          </h1>
          <p className="text-base text-white/65 sm:text-lg break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
            {t("hero.sub")}
          </p>
        </div>

        {/* Main card */}
        <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-xl sm:p-6">
          {/* Profile header + CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-wider text-white/50 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                {t("yourTypeLabel")}
              </div>

              <div className="mt-2 flex items-center gap-4">
                <Image
                  src={avatarSrc}
                  alt={typeName}
                  width={256}
                  height={256}
                  className="h-24 w-24 rounded-full object-cover"
                  unoptimized
                  priority
                />
                <h2 className="text-3xl font-semibold break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:balance]">
                  {typeName}
                </h2>
              </div>
            </div>

            <div className="flex items-center sm:justify-end">
              <button
                onClick={downloadPdf}
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/15 disabled:opacity-60"
                type="button"
                disabled={downloading}
              >
                {downloading ? t("pdf.downloading") : t("pdf.download")}
              </button>
            </div>
          </div>

          <p className="mt-4 text-white/80 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
            {typeDescription}
          </p>

          {/* Add-ons cards */}
          {(stress || subtype || mode) && (
            <div className="mt-6 space-y-4">
              {stress && (
                <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-pink-500/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs uppercase tracking-wider text-white/45 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                      {t("cards.stress.title")}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span
                        className={`h-2 w-2 rounded-full ${stabilityDotClass(
                          data.stability
                        )}`}
                      />
                      <span className="break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                        {t("cards.stress.stability")}: {stabilityLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-white/90 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {stress.label}
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-white/60 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {stress.note}
                  </p>
                </div>
              )}

              {subtype && (
                <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-pink-500/10 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {t("cards.subtype.title")}
                  </div>

                  <div className="mt-2 text-sm font-semibold text-white/90 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {subtype.label}
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-white/60 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {subtype.note}
                  </p>
                </div>
              )}

              {mode && (
                <div className="rounded-2xl border border-white/15 bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-pink-500/10 p-4">
                  <div className="text-xs uppercase tracking-wider text-white/45 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {t("cards.mode.title")}
                  </div>

                  <div className="mt-2 text-sm font-semibold text-white/90 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {mode.label}
                  </div>

                  <p className="mt-2 text-xs leading-relaxed text-white/60 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                    {mode.note}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Big Five toggle */}
          <div className="mt-6 flex flex-col items-start gap-4">
            <button
              onClick={() => setShowBigFive((v) => !v)}
              className="inline-flex items-center gap-2 self-start rounded-xl
                bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
                px-3 py-2 text-xs font-semibold text-white/90
                shadow-[0_10px_30px_rgba(99,102,241,0.25)]
                hover:brightness-105"
              type="button"
            >
              <span>{showBigFive ? t("bigFive.hide") : t("bigFive.show")}</span>
              <span className="text-white/60">{showBigFive ? "▴" : "▾"}</span>
            </button>

            <div className="text-xs text-white/45 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
              {t("bigFive.note")}
            </div>
          </div>
        </div>

        {/* Big Five panel */}
        {showBigFive && (
          <div className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl">
            <div className="mt-2 space-y-4">
              {bigFiveRows.map((row) => {
                const k = levelKey(row.value);
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-white/80 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
                        {row.label}
                        {row.key === highestTrait.key && (
                          <span
                            className="text-yellow-300/90 text-sm"
                            title={t("bigFive.topTrait")}
                            aria-label={t("bigFive.topTrait")}
                          >
                            ★
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-white/70">{pct(row.value)}</div>
                    </div>

                    <div className="mt-1 text-xs text-white/50">
                      {t(`bigFive.levels.${k}`)}
                      {(row.key === "S" || row.key === "N") && (
                        <span className="ml-1 text-[11px] leading-none">
                          ({row.key === "S"
                            ? t("traitsNotes.S")
                            : t("traitsNotes.N")})
                        </span>
                      )}
                    </div>

                    <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400"
                        style={{ width: `${pct(row.value)}%` }}
                      />
                    </div>

                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-center text-xs text-white/40 break-words [overflow-wrap:break-word] [hyphens:auto] [text-wrap:pretty]">
              {t("disclaimer")}
            </p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}
