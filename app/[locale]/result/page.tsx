"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { calculateResult } from "@/lib/scoring";
import { AVATARS } from "@/lib/avatars";
import { toast } from "sonner";
import LegalFooter from "@/app/components/ui/legal-footer";
import { Brand } from "@/app/components/ui/logo";
import { BRAND } from "@/lib/brand";
import TMJBackground from "@/app/components/ui/background";

const BIG_FIVE_ICON_SRC = "/graphics/bigfive-icon.svg";

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
};

const STORAGE_KEY = "personality_result_v1";
const ANSWERS_KEY = "personality_answers_v1";
const QUESTION_ORDER_KEY = "personality_question_order_v1";

const PAID_KEY = "personality_paid_v1";
const PAID_AT_KEY = "personality_paid_at_v1";
const CHECKOUT_ATTEMPT_KEY = "personality_checkout_attempt_v1";
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

function visualStretchPct(n: number) {
  const x = pct(n);
  const center = 50;
  const normalized = (x - center) / center;
  const stretched = Math.sign(normalized) * Math.pow(Math.abs(normalized), 0.82);
  return Math.max(0, Math.min(100, Math.round(center + stretched * center)));
}

function isResultShape(x: unknown): x is StoredResultV1 {
  if (typeof x !== "object" || x === null) return false;
  const candidate = x as Partial<StoredResultV1> & {
    scores?: Partial<Record<Trait, unknown>>;
  };

  return (
    isValidTypeCode(candidate.typeCode) &&
    !!candidate.scores &&
    typeof candidate.scores.E === "number" &&
    typeof candidate.scores.O === "number" &&
    typeof candidate.scores.C === "number" &&
    typeof candidate.scores.A === "number" &&
    typeof candidate.scores.N === "number" &&
    typeof candidate.stability === "number"
  );
}

function safeGet<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function readQuestionOrder(total: number): string[] | undefined {
  try {
    const raw = localStorage.getItem(QUESTION_ORDER_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== total) return undefined;
    if (!parsed.every((id) => typeof id === "string")) return undefined;
    return parsed;
  } catch {
    return undefined;
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
  const [downloading, setDownloading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const showAvatar = true;

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
          const checkoutAttemptId = sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);
          if (!checkoutAttemptId) {
            router.replace("/pay");
            return;
          }

          const res = await fetch(
            `/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}&attempt_id=${encodeURIComponent(checkoutAttemptId)}`
          );
          const json = await res.json().catch(() => null);

          if (!res.ok || !json?.paid) {
            router.replace("/pay");
            return;
          }

          localStorage.setItem(PAID_KEY, "true");
          localStorage.setItem(PAID_AT_KEY, String(json.paidAt ?? Date.now()));
          sessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);

          // Policz wynik z answers
          const rawAnswers = localStorage.getItem(ANSWERS_KEY);
          if (!rawAnswers) {
            router.replace("/test");
            return;
          }
          const answers = JSON.parse(rawAnswers);
          const questionOrder = readQuestionOrder(answers.length);
          const payload = calculateResult(answers, questionOrder);

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
    const raw = (tp as typeof tp & { raw: (key: string) => unknown }).raw;

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

      const bigFiveIconUrl = await (async () => {
        try {
          const absoluteUrl = new URL("/graphics/bigfive-icon.svg", window.location.origin).toString();
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
          key: "S",
          label: t("traits.S"),
          value: emotionalStability,
          note: t("traitsNotes.S")
        }
      ];

      const reportTypeName = useMax ? maxTypeName : typeName;
      const reportTypeDesc = useMax ? maxTypeDesc : typeDescription;

      const report: PdfReportData = {
        brandTitle: BRAND.name,
        brandSubtitle: t("brandSubtitle"),
        generatedLabel: t("pdf.generated"),
        dateISO: new Date().toISOString().slice(0, 10),
        bigFiveIconUrl,
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
          note: r.key === "S" || r.key === "N" ? undefined : r.note,
          leftPole: t(`bigFive.poles.${r.key}.left`),
          rightPole: t(`bigFive.poles.${r.key}.right`)
        })),
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
    safeGet(() => t(key as Parameters<typeof t>[0]), fallback);
 
  async function shareResult() {
    try {
      const url = window.location.origin; // share homepage (auto language detect)
      const title = BRAND.name;
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
    } catch (e: unknown) {
      // iOS: user closed share sheet (cancel) -> AbortError (to nie jest błąd)
      const err =
        typeof e === "object" && e !== null
          ? (e as { name?: string; message?: string })
          : {};
      const name = err.name ?? "";
      const msg = String(err.message ?? "");

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
      accent: {
        solid: "#42D65A",
        gradient: "linear-gradient(135deg, #20C979 0%, #42D65A 52%, #7BE58C 100%)",
        shadow: "rgba(66, 214, 90, 0.28)",
      },
      snapshotLabel: rowSnapshotLabel("S", emotionalStability),
    },
    {
      key: "E",
      label: t("traits.E"),
      value: data.scores.E,
      accent: {
        solid: "#58D7FF",
        gradient: "linear-gradient(135deg, #4ED7FF 0%, #69C8FF 55%, #86E0FF 100%)",
        shadow: "rgba(78, 215, 255, 0.28)",
      },
      snapshotLabel: rowSnapshotLabel("E", data.scores.E),
    },
    {
      key: "O",
      label: t("traits.O"),
      value: data.scores.O,
      accent: {
        solid: "#A17CFF",
        gradient: "linear-gradient(135deg, #7D66FF 0%, #A67EFF 55%, #C68BFF 100%)",
        shadow: "rgba(161, 124, 255, 0.28)",
      },
      snapshotLabel: rowSnapshotLabel("O", data.scores.O),
    },
    {
      key: "C",
      label: t("traits.C"),
      value: data.scores.C,
      accent: {
        solid: "#FF72C4",
        gradient: "linear-gradient(135deg, #F25FB3 0%, #FF7DCC 58%, #FF9FB8 100%)",
        shadow: "rgba(255, 114, 196, 0.26)",
      },
    },
    {
      key: "A",
      label: t("traits.A"),
      value: data.scores.A,
      accent: {
        solid: "#FFB15B",
        gradient: "linear-gradient(135deg, #FF9B5F 0%, #FFB15B 52%, #FFD08A 100%)",
        shadow: "rgba(255, 177, 91, 0.26)",
      },
    }
  ];

  const topCircleRows = bigFiveRows.slice(0, 3);

  function rowSnapshotLabel(key: string, value: number) {
    const high = pct(value) >= 50;
    return t(`bigFive.poles.${key}.${high ? "right" : "left"}`);
  }

  const sections = [
    {
      key: "core",
      cardClass: "bg-[var(--tmj-surface)]",
      iconWrapClass: "bg-[rgba(89,202,115,0.13)]",
      accentColor: "#59CA73",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-[#59CA73]"
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
      cardClass: "bg-[var(--tmj-surface)]",
      iconWrapClass: "bg-[rgba(87,214,255,0.16)]",
      accentColor: "#57D6FF",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-[#57D6FF]"
        >
          <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
      ),
      title: t("profileSections.daily"),
      lines: profile?.daily ?? [],
    },
    {
      key: "strengths",
      cardClass: "bg-[var(--tmj-surface)]",
      iconWrapClass: "bg-[rgba(124,182,255,0.16)]",
      accentColor: "#7CB6FF",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-[#7CB6FF]"
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
      cardClass: "bg-[var(--tmj-surface)]",
      iconWrapClass: "bg-[rgba(165,142,255,0.16)]",
      accentColor: "#A58EFF",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-[#A58EFF]"
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
      cardClass: "bg-[var(--tmj-surface)]",
      iconWrapClass: "bg-[rgba(197,126,255,0.15)]",
      accentColor: "#C57EFF",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-[#C57EFF]"
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
      cardClass: "bg-[var(--tmj-surface)]",
      iconWrapClass: "bg-[rgba(240,140,255,0.14)]",
      accentColor: "#F08CFF",
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5 text-[#F08CFF]"
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

  function renderCardLines(lines: string[], accentColor: string) {
    const arr = (lines || []).map((s) => (s || "").trim()).filter(Boolean);
    if (arr.length === 0) return null;

    // Case 1: mamy 1 długi tekst -> oddziel tylko ostatnie zdanie
    if (arr.length === 1) {
      const sentences = splitIntoSentences(arr[0]);
      if (sentences.length <= 1) {
        return (
          <div className="mt-2 text-sm leading-relaxed">
            <p className="whitespace-normal text-white/75">{arr[0]}</p>
          </div>
        );
      }

      const body = sentences.slice(0, -1).join(" ");
      const last = sentences[sentences.length - 1];

      return (
        <div className="mt-2 text-sm leading-relaxed">
          <p className="whitespace-normal text-white/75">{body}</p>
          <p className="mt-3 whitespace-normal text-white/90 font-medium">
            <span
              aria-hidden="true"
              className="mr-3 inline-block h-4 w-4 align-[-0.05em]"
              style={{
                backgroundColor: accentColor,
                WebkitMaskImage: "url('/icons/result/card-emphasis.svg')",
                maskImage: "url('/icons/result/card-emphasis.svg')",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
                WebkitMaskSize: "contain",
                maskSize: "contain",
              }}
            />
            {last}
          </p>
        </div>
      );
    }

    // Case 2: mamy kilka linijek -> ostatnia linijka jako puenta
    const body = arr.slice(0, -1).join(" ");
    const last = arr[arr.length - 1];

    return (
      <div className="mt-2 text-sm leading-relaxed">
        {body && (
          <p className="whitespace-normal text-white/75">
            {body}
          </p>
        )}
        {last && (
          <>
            <p className="mt-4 whitespace-normal text-white/90 font-medium">
              <span
                aria-hidden="true"
                className="mr-3 inline-block h-4 w-4 align-[-0.05em]"
                style={{
                  backgroundColor: accentColor,
                  WebkitMaskImage: "url('/icons/result/card-emphasis.svg')",
                  maskImage: "url('/icons/result/card-emphasis.svg')",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                }}
              />
              {last}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0b0c14] tmj-page-gutter py-10 text-white"
    >
      <TMJBackground />

      <div className="tmj-container">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Brand />

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
        <div className="mt-10 px-4 text-center sm:px-6">
          <h1
            className="mx-auto mb-2 max-w-[24rem] font-semibold tracking-tight break-normal [overflow-wrap:normal] hyphens-auto [text-wrap:balance] sm:max-w-[26rem]"
            style={{
              fontSize: "clamp(3.1rem, 10.2vw, 3.5rem)",
              lineHeight: 1.02,
            }}
          >
            <span className="block">{t("hero.before")}</span>
            <span className="mt-2 block whitespace-normal [overflow-wrap:anywhere] [word-break:normal] tmj-gradient-text hyphens-auto">
              {t("hero.accent")}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-[22rem] text-base leading-relaxed text-white/75 sm:max-w-[24rem]">
            {t("hero.sub")}
          </p>
        </div>

        {/* Main card */}
        <div className="mt-7 rounded-[2.35rem] border border-white/[0.025] bg-[var(--tmj-surface)] px-6 py-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_30px_70px_rgba(0,0,0,0.24)] sm:mt-8 sm:px-8 sm:py-8">
          {/* Profile header + CTA */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                {showAvatar && (
                  <div className="relative shrink-0">
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-violet-400/20 blur-2xl" />
                    {avatarError ? (
                      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/5 text-3xl">{typeName?.charAt(0) || "?"}</div>
                    ) : (
                      <Image src={avatarSrc} alt={typeName} width={256} height={256}
                        className="relative h-32 w-32 object-contain" onError={() => setAvatarError(true)} />
                    )}
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
        {/* ✅ Profile sections (6) */}
        <div className="mt-8 space-y-4">
          {sections.map((s) => (
            <div
              key={s.key}
              className={`rounded-[2.15rem] border border-white/[0.04] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_24px_56px_rgba(0,0,0,0.22)] sm:px-6 sm:py-6 ${s.cardClass}`}
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40 whitespace-normal">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${s.iconWrapClass}`}>
                  {s.icon}
                </span>
                <span>{s.title}</span>
              </div>
              {renderCardLines(s.lines, s.accentColor)}
            </div>
          ))}
        </div>

		        {/* Big Five panel */}
		            <div className="mt-8 rounded-[2.15rem] border border-white/[0.04] bg-[var(--tmj-surface)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_24px_56px_rgba(0,0,0,0.22)] px-5 pt-6 pb-8 sm:p-6 sm:pt-5 sm:pb-8">
		          <div className="flex items-center justify-between gap-4">
		            <div className="min-w-0">
		              <div className="text-sm font-medium uppercase tracking-[0.12em] text-white/85">
		                {t("bigFive.title")}
		              </div>
		            </div>

	            <div className="relative shrink-0">
	              <div className="pointer-events-none absolute -inset-2 rounded-full bg-black/20 blur-xl" />
	              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/10">
		                <Image
		                  src={BIG_FIVE_ICON_SRC}
		                  alt=""
		                  aria-hidden="true"
                      width={32}
                      height={32}
		                  className="h-8 w-8 object-contain opacity-100"
		                  style={{ filter: "brightness(0) invert(1)" }}
		                />
	              </div>
	            </div>
		          </div>
		          <div className="mt-5">
              <div className="flex items-start justify-between gap-3 px-2 py-3 sm:gap-5 sm:px-3 sm:py-4">
              {topCircleRows.map((row) => {
                const value = pct(row.value);
                const size = 112;
                const strokeWidth = 8;
                const radius = (size - strokeWidth) / 2;
                const circumference = 2 * Math.PI * radius;
                const dash = Math.max((value / 100) * circumference, strokeWidth * 1.35);
                const gap = Math.max(circumference - dash, 0);

                return (
                  <div
                    key={row.key}
                    className="min-w-0 flex-1 text-center"
                  >
                    <div className="mx-auto flex w-full justify-center">
                      <div className="relative h-[5.25rem] w-[5.25rem] sm:h-[6.5rem] sm:w-[6.5rem]">
                        <div
                          className="absolute inset-0 rounded-full blur-2xl"
                          style={{ backgroundColor: row.accent.shadow }}
                        />
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              "radial-gradient(circle at center, rgba(5,12,30,0.9) 50%, rgba(9,16,36,0.36) 100%)",
                          }}
                        />
                        <svg
                          viewBox={`0 0 ${size} ${size}`}
                          className="absolute inset-0 h-full w-full -rotate-90"
                          aria-hidden="true"
                        >
                          <defs>
                            <linearGradient
                              id={`bigfive-ring-${row.key}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              {row.key === "S" && (
                                <>
                                  <stop offset="0%" stopColor="#20C979" />
                                  <stop offset="52%" stopColor="#42D65A" />
                                  <stop offset="100%" stopColor="#7BE58C" />
                                </>
                              )}
                              {row.key === "E" && (
                                <>
                                  <stop offset="0%" stopColor="#4ED7FF" />
                                  <stop offset="55%" stopColor="#69C8FF" />
                                  <stop offset="100%" stopColor="#86E0FF" />
                                </>
                              )}
                              {row.key === "O" && (
                                <>
                                  <stop offset="0%" stopColor="#7D66FF" />
                                  <stop offset="55%" stopColor="#A67EFF" />
                                  <stop offset="100%" stopColor="#C68BFF" />
                                </>
                              )}
                            </linearGradient>
                          </defs>
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke="rgba(154, 144, 212, 0.24)"
                            strokeWidth={strokeWidth}
                          />
                          <circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            fill="none"
                            stroke={`url(#bigfive-ring-${row.key})`}
                            strokeWidth={strokeWidth}
                            strokeLinecap="round"
                            strokeDasharray={`${dash} ${gap}`}
                          />
                        </svg>
                        <div
                          className="absolute inset-[9px] rounded-full bg-[var(--tmj-surface)] sm:inset-[10px]"
                          style={{
                            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04), 0 0 22px ${row.accent.shadow}`,
                          }}
                        />
                        <div
                          className="absolute inset-[7px] rounded-full border border-white/8 sm:inset-[8px]"
                          style={{
                            background:
                              "radial-gradient(circle at 50% 40%, rgba(18,32,66,0.4), rgba(5,10,24,0.03) 72%, transparent 100%)",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[1.35rem] font-medium tracking-[-0.05em] text-white sm:text-[1.6rem]">
                            {value}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm font-medium tracking-[0.01em] text-white/88 sm:mt-5">
                      {row.label}
                    </div>
                    <div
                      className="mt-1 text-sm tracking-[0.01em]"
                      style={{ color: row.accent.solid }}
                    >
                      {row.snapshotLabel}
                    </div>
	                  </div>
	                );
	              })}
              </div>

              <div className="mt-7 space-y-4 border-t border-white/8 pt-6 sm:mt-8 sm:space-y-5 sm:pt-7">
              {bigFiveRows.map((row) => {
                const value = visualStretchPct(row.value);

                return (
                  <div key={`${row.key}-list`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-medium text-white/92">
                        {row.label}
                      </div>
                      <div
                        className="text-sm font-semibold tracking-[0.01em]"
                        style={{ color: row.accent.solid }}
                      >
                        {pct(row.value)}%
                      </div>
                    </div>

                    <div className="mt-3 h-2.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${value}%`,
                          background: row.accent.gradient,
                          boxShadow: `0 0 14px ${row.accent.shadow}`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4 text-[0.78rem] font-medium tracking-[0.02em] text-white/42">
                      <span>{t(`bigFive.poles.${row.key}.left`)}</span>
                      <span className="text-right">{t(`bigFive.poles.${row.key}.right`)}</span>
                    </div>
	                  </div>
	                );
	              })}
              </div>
	          </div>
	        </div>

	        <div className="mt-8 mb-2 flex items-center justify-center gap-4">
	          <div className="relative">
	            <div className="pointer-events-none absolute -inset-3 rounded-full bg-black/20 blur-2xl" />
	            <button
	              onClick={downloadPdf}
	              aria-disabled={downloading}
	              type="button"
	              aria-label={t("pdf.download")}
	              title={t("pdf.download")}
	              className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full
	                bg-black/25 ring-1 ring-white/20 text-white
	                focus:outline-none
	                cursor-pointer
	                aria-disabled:pointer-events-none"
	            >
	              <svg
	                width="18"
	                height="18"
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
	            </button>
	          </div>

	          <div className="relative">
	            <div className="pointer-events-none absolute -inset-3 rounded-full bg-black/20 blur-2xl" />
	            <button
	              onClick={shareResult}
	              type="button"
	              aria-label={tr("share", "Share")}
	              title={tr("share", "Share")}
	              className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full
	                bg-black/25 ring-1 ring-white/20 text-white
	                focus:outline-none
	                cursor-pointer"
	            >
	              <svg
	                xmlns="http://www.w3.org/2000/svg"
	                width="18"
	                height="18"
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
	            </button>
	          </div>
	        </div>

	          <p className="mt-6 text-center text-xs text-white/40">
	            {t("disclaimer")}
	          </p>
    
	        <LegalFooter />      
	      </div>
	    </main>
	  );
	}
