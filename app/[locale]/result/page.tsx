"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { calculateResult } from "@/lib/scoring";
import { AVATARS } from "@/lib/avatars";
import { toast } from "sonner";
import LegalFooter from "@/app/components/ui/legal-footer";
import TMJBackground from "@/app/components/ui/background";

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
  "Just a perspective - not the whole story.",
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
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = true;

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
        let paidAt = Number(localStorage.getItem(PAID_AT_KEY) ?? "0");
        // legacy: paid=true without paidAt → start grace window now
        if (!paidAt && paid) {
          paidAt = Date.now();
          localStorage.setItem(PAID_AT_KEY, String(paidAt));
        }
        const withinGrace = paidAt > 0 && Date.now() - paidAt < GRACE_MS;

        // Jeśli mamy zapisany wynik + dostęp → pokaż od razu
        if (raw && withinGrace) {
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

  useEffect(() => {
    setAvatarError(false);
  }, [avatarSrc]);

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

      const avatarUrl = await (async () => {
        try {
          const absoluteUrl = new URL(avatarSrc, window.location.origin).toString();
          if (!absoluteUrl.toLowerCase().endsWith(".svg")) return absoluteUrl;

          const svgRes = await fetch(absoluteUrl);
          if (!svgRes.ok) return absoluteUrl;

          const svgRaw = await svgRes.text();
          const svgWhite = svgRaw
            .replace(/currentColor/gi, "#FFFFFF")
            .replace(/stroke=(['"])black\1/gi, 'stroke="#FFFFFF"')
            .replace(/fill=(['"])black\1/gi, 'fill="#FFFFFF"')
            .replace(/stroke=(['"])#000(?:000)?\1/gi, 'stroke="#FFFFFF"')
            .replace(/fill=(['"])#000(?:000)?\1/gi, 'fill="#FFFFFF"')
            .replace(/<svg\b/i, '<svg color="#FFFFFF" ');

          const svgBlob = new Blob([svgWhite], { type: "image/svg+xml;charset=utf-8" });
          const svgBlobUrl = URL.createObjectURL(svgBlob);

          try {
            const pngDataUrl = await new Promise<string | undefined>((resolve) => {
              const img = new window.Image();
              img.onload = () => {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = 128;
                  canvas.height = 128;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) {
                    resolve(undefined);
                    return;
                  }
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  resolve(canvas.toDataURL("image/png"));
                } catch {
                  resolve(undefined);
                }
              };
              img.onerror = () => resolve(undefined);
              img.src = svgBlobUrl;
            });

            return pngDataUrl ?? absoluteUrl;
          } finally {
            URL.revokeObjectURL(svgBlobUrl);
          }
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

  // ✅ safe i18n fallback (nie wywali jeśli brakuje klucza w JSON)
   const tr = (key: string, fallback: string) =>
     safeGet(() => t(key as any), fallback);
 
   async function shareResult() {
     try {
       const url = window.location.origin; // share homepage (auto language detect)
       const title = tr("shareTitle", "tellmejoe.");
       const text = tr("shareText", "Take the test and see your result.");
 
       if (navigator.share) {
         await navigator.share({ title, text, url });
         return;
       }
 
       if (navigator.clipboard?.writeText) {
         await navigator.clipboard.writeText(url);
         toast(tr("shareCopied", "Link copied"));
         return;
       }
 
       window.prompt(tr("sharePrompt", "Copy this link:"), url);
     } catch (e: any) {
      // iOS: user closed share sheet (cancel) -> AbortError (to nie jest błąd)
      const name = e?.name || "";
      const msg = String(e?.message || "");

      if (
        name === "AbortError" ||
        name === "NotAllowedError" ||
        /abort/i.test(msg)
      ) {
        return; // user cancelled — nic nie pokazuj
      }

      console.error("Share failed:", e);
      toast(tr("shareError", "Couldn’t share right now"));
    }
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
    {
      key: "core",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-indigo-300/75"
        >
          <path d="M12 18V5" />
          <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
          <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
          <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
          <path d="M18 18a4 4 0 0 0 2-7.464" />
          <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
          <path d="M6 18a4 4 0 0 1-2-7.464" />
          <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
        </svg>
      ),
      title: t("profileSections.core"),
      lines: profile?.core ?? []
    },
    {
      key: "daily",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-indigo-400/75"
        >
          <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
      ),
      title: t("profileSections.daily"),
      lines: profile?.daily ?? [],
    },
    {
      key: "strengths",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-violet-400/75"
        >
          {/* główna gwiazda — gradient */}
          <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />

          {/* mały plus — bez gradientu, czytelny */}
          <path d="M20 2v4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M22 4h-4" stroke="currentColor" strokeWidth="1.8" />

          {/* kółko — bez gradientu, czytelne */}
          <circle cx="4" cy="20" r="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      ),
      title: t("profileSections.strengths"),
      lines: profile?.strengths ?? [],
    },
    {
      key: "watchOut",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-violet-500/75"
        >
          <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      ),
      title: t("profileSections.watchOut"),
      lines: profile?.watchOut ?? [],
    },
    {
      key: "underPressure",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-fuchsia-400/75"
        >
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>
      ),
      title: t("profileSections.underPressure"),
      lines: profile?.underPressure ?? [],
    },
    {
      key: "relationships",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-pink-400/75"
        >
          <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
        </svg>
      ),
      title: t("profileSections.relationships"),
      lines: profile?.relationships ?? [],
    },
  ] as const;

  // --- Card text formatting (Option #1): split into sentences + emphasize last ---
  function splitIntoSentences(input: string) {
    const text = (input || "").trim();
    if (!text) return [];

    // split on sentence end + space (keeps it simple & safe for short copy)
    const parts = text
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    return parts;
  }

  function renderCardLines(lines: string[]) {
    const arr = (lines || []).map((s) => (s || "").trim()).filter(Boolean);
    if (arr.length === 0) return null;

    // Case 1: mamy 1 długi tekst -> oddziel tylko ostatnie zdanie
    if (arr.length === 1) {
      const sentences = splitIntoSentences(arr[0]);
      if (sentences.length <= 1) {
        return (
          <div className="mt-2 text-sm leading-relaxed">
            <p className="whitespace-normal text-white/70">{arr[0]}</p>
          </div>
        );
      }

      const body = sentences.slice(0, -1).join(" ");
      const last = sentences[sentences.length - 1];

      return (
        <div className="mt-2 text-sm leading-relaxed">
          <p className="whitespace-normal text-white/70">{body}</p>
          <p className="mt-3 whitespace-normal text-white/85 font-medium">{last}</p>
        </div>
      );
    }

    // Case 2: mamy kilka linijek -> ostatnia linijka jako puenta
    const body = arr.slice(0, -1).join(" ");
    const last = arr[arr.length - 1];

    return (
      <div className="mt-2 text-sm leading-relaxed">
        {body && (
          <p className="whitespace-normal text-white/70">
            {body}
          </p>
        )}
        {last && (
          <p className="mt-4 whitespace-normal text-white/85 font-medium">
            {last}
          </p>
        )}
      </div>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#02030A] px-6 sm:px-5 py-10 text-white"
    >
      <TMJBackground />

      <div className="relative mx-auto w-full max-w-xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight min-w-0">
            <a
              href="/"
              className="text-sm font-bold text-white/80 hover:text-white/95 transition"
              style={{
                fontFamily:
                  '"Satoshi", var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              {t("brandTitle")}
            </a>
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
                  transition focus:outline-none
                  cursor-pointer"
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
                      text-white/70 hover:text-white/90 hover:bg-white/8"
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
        <div className="mt-8 rounded-3xl bg-white/2 px-6 py-7 shadow-xl sm:px-8 sm:py-8">
          {/* Profile header + CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {showAvatar && (
                  <div className="relative shrink-0">
                    <div className="pointer-events-none absolute -inset-3 rounded-full bg-black/20 blur-2xl" />
                    <div
                      role="img"
                      aria-label={typeName}
                      className="relative z-10 flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/10"
                    >
                      {avatarError ? (
                        <div
                          aria-hidden="true"
                          className="text-2xl font-semibold text-white"
                        >
                          {typeName?.charAt(0) || "?"}
                        </div>
                      ) : (
                        <img
                          src={avatarSrc}
                          alt=""
                          className="h-11 w-11 object-contain"
                          style={{ filter: "brightness(0) invert(1)" }}
                          onError={() => setAvatarError(true)}
                        />
                      )}
                    </div>
                  </div>
                )}

                <div className="min-w-0 text-center sm:text-left">
                  <h2 className="text-3xl font-semibold">
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
          <p className="mt-5 text-xs text-white/50 italic">
            {joeLine} <span className="text-white/45">- Joe</span>
          </p>

        {/* ✅ Profile sections (6) */}
        <div className="mt-6 space-y-4">
          {sections.map((s) => (
            <div
              key={s.key}
              className="rounded-3xl bg-white/5 px-4 py-5 shadow-xl sm:px-5 sm:py-6"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/60 whitespace-normal">
                <span className="inline-flex items-center justify-center text-indigo-300/70 -translate-y-[0.5px]">
                  {s.icon}
                </span>
                <span>{s.title}</span>
              </div>
              {renderCardLines(s.lines)}
            </div>
          ))}
        </div>

        {/* Big Five panel */}
        <div className="mt-6 rounded-3xl bg-white/5 p-5 shadow-xl sm:p-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/85">
              {t("bigFive.title")}
            </div>
            <div className="mt-1 text-xs text-white/40">
              {t("bigFive.note")}
            </div>
          </div>
          <div className="mt-6 space-y-4">
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

          <div className="mt-8 mb-2 grid grid-cols-2 gap-3">
            <button
              onClick={downloadPdf}
              aria-disabled={downloading}
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-3xl px-6 py-2.5
                text-base font-semibold text-white
                bg-white/10 backdrop-blur
                border border-white/10
                hover:border-white/60
                active:scale-[0.99]
                active:border-white/70
                transition-[border-color,transform] duration-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45
                cursor-pointer
                aria-disabled:opacity-60 aria-disabled:pointer-events-none"
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

            <button
              onClick={shareResult}
              className="relative inline-flex w-full items-center justify-center gap-2 rounded-3xl px-6 py-2.5
                text-base font-semibold text-white
                bg-white/10 backdrop-blur
                border border-white/10
                hover:border-white/60
                active:scale-[0.99]
                active:border-white/70
                transition-[border-color,transform] duration-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-white/45
                cursor-pointer"
              type="button"
              aria-label={tr("share", "Share")}
              title={tr("share", "Share")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
                aria-hidden="true"
              >
                <path d="M12 2v13" />
                <path d="m16 6-4-4-4 4" />
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              </svg>
              <span>{tr("share", "Share")}</span>
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-white/40">
            {t("disclaimer")}
          </p>
        </div>    
        <LegalFooter />      
      </div>
    </main>
  );
}
