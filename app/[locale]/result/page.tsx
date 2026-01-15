"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { calculateResult } from "@/lib/scoring";

// ✅ PDF
import {
  PersonalityReportPDF,
  type PdfReportData
} from "@/app/components/pdf/personality-report";

type Trait = "E" | "O" | "C" | "A" | "N";

/* ✅ Joe — result microcopy (5 variants, random) */
const JOE_RESULTS = [
  "This is just a snapshot. Use it gently.",
  "Take what’s useful. Leave the rest.",
  "A result, not a rule.",
  "Just a perspective — not the whole story.",
  "This is one way of seeing it."
];

type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: string; // P01–P16
  typeName?: string;
  typeDescription?: string;
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

function isValidTypeCode(code: unknown): code is string {
  if (typeof code !== "string") return false;
  const m = /^P(\d{2})$/.exec(code);
  if (!m) return false;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 1 && n <= 16;
}

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
    isValidTypeCode(x.typeCode) &&
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

function longestByKeys<T extends string>(
  keys: readonly T[],
  get: (key: T) => string
) {
  return pickLongest(keys.map((key) => safeGet(() => get(key), "")));
}

export default function ResultPage() {
  const router = useRouter();

  const t = useTranslations("Result");
  const tt = useTranslations("Types");
  const tp = useTranslations("Profiles");

  const [data, setData] = useState<StoredResultV1 | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showBigFive, setShowBigFive] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ✅ menu ⋯ (jak na /test)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ✅ Joe line (pick once per mount)
  const joeLine = useMemo(() => {
    return JOE_RESULTS[Math.floor(Math.random() * JOE_RESULTS.length)];
  }, []);

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
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session_id");

        const raw = localStorage.getItem(STORAGE_KEY);

        const paid = localStorage.getItem(PAID_KEY) === "true";
        const paidAt = Number(localStorage.getItem(PAID_AT_KEY) ?? "0");
        const withinGrace = paidAt > 0 && Date.now() - paidAt < GRACE_MS;

        // Jeśli mamy zapisany wynik + dostęp → pokaż od razu
        if (raw && (paid || withinGrace)) {
          const parsed = JSON.parse(raw);
          if (!isResultShape(parsed)) {
            router.replace("/test");
            return;
          }
          setData(parsed);
          setLoaded(true);
          return;
        }

        // Wracamy ze Stripe → weryfikuj payment
        if (sessionId) {
          const res = await fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`);
          const json = await res.json().catch(() => null);

          if (!res.ok || !json?.paid) {
            router.replace("/pay");
            return;
          }

          localStorage.setItem(PAID_KEY, "true");
          localStorage.setItem(PAID_AT_KEY, String(json.paidAt ?? Date.now()));

          // Policz wynik z answers
          const rawAnswers = localStorage.getItem(ANSWERS_KEY);
          if (!rawAnswers) {
            router.replace("/test");
            return;
          }
          const answers = JSON.parse(rawAnswers);
          const payload = calculateResult(answers);

          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
          setData(payload);
          setLoaded(true);

          // Usuń session_id z URL (czyściutko)
          params.delete("session_id");
          const newQs = params.toString();
          const newUrl = window.location.pathname + (newQs ? `?${newQs}` : "");
          window.history.replaceState({}, "", newUrl);

          return;
        }

        // Brak dostępu
        router.replace("/pay");
      } catch (e) {
        console.error("Result gate error:", e);
        router.replace("/test");
      }
    })();
  }, [router]);

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

  // ✅ Profiles (6 sekcji) — potrzebne do PDF
  const profile = useMemo(() => {
    if (!data) return null;

    const code = data.typeCode;

    // next-intl: arrays pobieramy przez .raw
    const raw = (tp as any).raw as (key: string) => any;

    const getLines = (k: string): string[] => {
      try {
        const v = raw(`${code}.${k}`);
        return Array.isArray(v) ? v : [];
      } catch {
        return [];
      }
    };

    return {
      core: getLines("core"),
      daily: getLines("daily"),
      strengths: getLines("strengths"),
      watchOut: getLines("watchOut"),
      underPressure: getLines("underPressure"),
      relationships: getLines("relationships")
    };
  }, [data, tp]);

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

        profileSections: [
          { key: "core", icon: "🧠", title: t("profileSections.core"), lines: profile?.core ?? [] },
          { key: "daily", icon: "🎯", title: t("profileSections.daily"), lines: profile?.daily ?? [] },
          { key: "strengths", icon: "🌟", title: t("profileSections.strengths"), lines: profile?.strengths ?? [] },
          { key: "watchOut", icon: "⚠️", title: t("profileSections.watchOut"), lines: profile?.watchOut ?? [] },
          { key: "underPressure", icon: "⚡", title: t("profileSections.underPressure"), lines: profile?.underPressure ?? [] },
          { key: "relationships", icon: "👥", title: t("profileSections.relationships"), lines: profile?.relationships ?? [] }
        ].filter((s) => Array.isArray(s.lines) && s.lines.length > 0),

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

        disclaimer: t("pdf.disclaimer")
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

  const highestTrait = bigFiveRows.reduce(
    (max, row) => (row.value > max.value ? row : max),
    bigFiveRows[0]
  );

  const sections = [
    { key: "core", icon: "🧠", title: t("profileSections.core"), lines: profile?.core ?? [] },
    { key: "daily", icon: "🎯", title: t("profileSections.daily"), lines: profile?.daily ?? [] },
    { key: "strengths", icon: "🌟", title: t("profileSections.strengths"), lines: profile?.strengths ?? [] },
    { key: "watchOut", icon: "⚠️", title: t("profileSections.watchOut"), lines: profile?.watchOut ?? [] },
    { key: "underPressure", icon: "⚡", title: t("profileSections.underPressure"), lines: profile?.underPressure ?? [] },
    { key: "relationships", icon: "👥", title: t("profileSections.relationships"), lines: profile?.relationships ?? [] }
  ] as const;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-6 py-6 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight min-w-0">
            <div
              className="text-sm font-bold text-white/80"
              style={{
                fontFamily:
                  '"Satoshi", var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              {t("brandTitle")}
            </div>
            <div className="text-xs text-white/55">
              {t("brandSubtitle")}
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
          <h1 className="mb-2 text-[2.4rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.6rem] break-normal [overflow-wrap:normal] hyphens-auto [text-wrap:balance]">
            {t("hero.before")}{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent hyphens-auto">
              {t("hero.accent")}
            </span>
          </h1>
          <p className="text-base text-white/65 sm:text-lg">
            {t("hero.sub")}
          </p>
        </div>

        {/* Main card */}
        <div className="mt-8 rounded-3xl bg-white/2 px-5 py-6 shadow-xl sm:px-7 sm:py-7">
          {/* Profile header + CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="pointer-events-none absolute -inset-4 rounded-full bg-[radial-gradient(circle,_rgba(14,18,32,0.95)_30%,_rgba(58,76,125,0.85)_55%,_rgba(122,141,190,0.25)_78%)] blur-3xl" />
                  <div
                    role="img"
                    aria-label={typeName}
                    className="relative z-10 h-28 w-28 shrink-0 overflow-hidden rounded-full bg-center bg-cover bg-no-repeat"
                    style={{ backgroundImage: `url(${avatarSrc})` }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-3xl font-semibold [text-wrap:balance] [word-break:normal] [overflow-wrap:normal] hyphens-auto">
                    {typeName}
                  </h2>

                  <p className="mt-2 text-sm text-white/70 italic">
                    {typeDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Joe line */}
          <p className="mt-5 text-xs text-white/45 italic">
            {joeLine} <span className="text-white/40">— Joe</span>
          </p>

        {/* ✅ Profile sections (6) */}
        <div className="mt-6 space-y-4">
          {sections.map((s) => (
            <div
              key={s.key}
              className="rounded-3xl bg-white/5 p-5 shadow-xl sm:p-6"
            >
              <div className="text-xs uppercase tracking-wider text-white/45 whitespace-normal">
                {s.icon} {s.title}
              </div>

              <div className="mt-2 space-y-2 text-[0.95rem] leading-relaxed text-white/70">
                {s.lines.map((line, i) => (
                  <p
                    key={i}
                    className="whitespace-normal"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBigFive((v) => !v)}
              className="inline-flex flex-1 min-w-0 items-center justify-center gap-2 rounded-full
                px-5 py-2.5 text-sm font-semibold sm:text-base
                text-white/90
                bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
                ring-1 ring-white/20
                shadow-[0_10px_30px_rgba(99,102,241,0.25)]
                hover:brightness-105
                active:scale-[0.99]
                transition
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              type="button"
            >
              <span className="truncate">
                {showBigFive ? t("bigFive.hide") : t("bigFive.show")}
              </span>
              <span className="shrink-0 text-white/70">{showBigFive ? "▴" : "▾"}</span>
            </button>

            <button
              onClick={downloadPdf}
              disabled={downloading}
              className="inline-flex shrink-0 items-center gap-2 justify-center rounded-full
                px-5 py-2.5 text-sm font-semibold whitespace-nowrap sm:text-base
                text-white
                bg-white/14 backdrop-blur
                border border-white/25
                ring-1 ring-white/25
                shadow-[0_10px_30px_rgba(255,255,255,0.06)]
                hover:bg-white/18 hover:ring-white/40
                disabled:opacity-60
                active:scale-[0.99]
                transition
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45"
              type="button"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="opacity-90"
              >
                <path
                  d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 2v6h6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 15h8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M8 18h6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              <span>{downloading ? t("pdf.downloading") : t("pdf.download")}</span>
            </button>
          </div>

          <div className="mt-2 text-xs text-white/40">{t("bigFive.note")}</div>
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
                      <div className="flex items-center gap-2 text-sm text-white/80">
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
                          ({row.key === "S" ? t("traitsNotes.S") : t("traitsNotes.N")})
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

            <p className="mt-4 text-center text-xs text-white/40">
              {t("disclaimer")}
            </p>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-white/40">
          tellmejoe. TMJ © {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}