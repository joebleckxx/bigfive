"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/app/components/ui/logo";
import Image from "next/image";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";

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
const PAID_KEY = "bigfive_paid_v1";
const ANSWERS_KEY = "personality_answers_v1";

/**
 * Avatary: P01 → 0, P02 → 1, ..., P16 → 15
 */
const AVATARS = Array.from({ length: 16 }, (_, i) => {
  const id = String(i + 1).padStart(2, "0");
  return `/avatars/placeholder/avatar-${id}.png`;
});

function avatarIndexFromTypeCode(code: string) {
  const n = Number(code.replace("P", ""));
  return Number.isFinite(n) ? Math.max(0, Math.min(15, n - 1)) : 0;
}

function pct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
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

export default function ResultPage() {
  const router = useRouter();

  const t = useTranslations("Result");
  const tt = useTranslations("Types");
  const ta = useTranslations("AddOns");

  const [data, setData] = useState<StoredResultV1 | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showBigFive, setShowBigFive] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const paid = localStorage.getItem(PAID_KEY) === "true";
      if (!paid) {
        router.replace("/pay");
        return;
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace("/test");
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

  // ✅ PRZYWRÓCONE: add-ons (payload -> fallback na tłumaczenia)
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

  async function copySummary() {
    if (!data) return;

    const summary =
      `${t("copy.myType")}: ${typeName}\n\n` +
      `${t("copy.addOns")}:\n` +
      `• ${t("cards.stress.title")}\n` +
      `• ${t("cards.subtype.title")}\n` +
      `• ${t("cards.mode.title")}\n`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  function retake() {
    try {
      localStorage.removeItem(PAID_KEY);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ANSWERS_KEY);
    } catch {}
    router.push("/test");
  }

  if (!loaded || !data) return null;

  const emotionalStability = 100 - data.scores.N;

  const bigFiveRows = [
    { key: "E", label: t("traits.E"), value: data.scores.E },
    { key: "O", label: t("traits.O"), value: data.scores.O },
    { key: "C", label: t("traits.C"), value: data.scores.C },
    { key: "A", label: t("traits.A"), value: data.scores.A },
    { key: "N", label: t("traits.N"), value: data.scores.N, note: t("traitsNotes.N") },
    // ✅ POPRAWIONE: S = 100 - N (nie "stability" wyniku)
    { key: "S", label: t("traits.S"), value: emotionalStability, note: t("traitsNotes.S") }
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-5 py-10 text-white">
      <div className="relative mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Logo className="text-indigo-200" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{t("brandTitle")}</div>
              <div className="text-xs text-white/55">{t("brandSubtitle")}</div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="mt-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-semibold">
              {t("hero.before")}{" "}
              <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                {t("hero.accent")}
              </span>
            </h1>
            <p className="text-white/65">{t("hero.sub")}</p>
          </div>

          <button
            onClick={retake}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/15"
            type="button"
          >
            {t("retake")}
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/50">
                {t("yourTypeLabel")}
              </div>

              <div className="mt-2 flex items-center gap-4">
                <Image
                  src={avatarSrc}
                  alt=""
                  width={256}
                  height={256}
                  className="h-24 w-24 rounded-full object-cover"
                  unoptimized
                  priority
                />
                <h2 className="text-3xl font-semibold">{typeName}</h2>
              </div>
            </div>

            <button
              onClick={copySummary}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
              type="button"
            >
              {copied ? t("copy.copied") : t("copy.cta")}
            </button>
          </div>

          <p className="mt-4 text-white/80">{typeDescription}</p>

          {/* ✅ PRZYWRÓCONE: opisy add-ons */}
          {(stress || subtype || mode) && (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {stress && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white/85">
                      {t("cards.stress.title")}
                    </div>
                    <div className="text-xs text-white/55">
                      {t("cards.stress.stability")}: {stabilityLabel}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-white/80">{stress.label}</div>
                  <div className="mt-2 text-xs leading-relaxed text-white/60">
                    {stress.note}
                  </div>
                </div>
              )}

              {subtype && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="text-sm font-semibold text-white/85">
                    {t("cards.subtype.title")}
                  </div>
                  <div className="mt-2 text-sm text-white/80">{subtype.label}</div>
                  <div className="mt-2 text-xs leading-relaxed text-white/60">
                    {subtype.note}
                  </div>
                </div>
              )}

              {mode && (
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                  <div className="text-sm font-semibold text-white/85">
                    {t("cards.mode.title")}
                  </div>
                  <div className="mt-2 text-sm text-white/80">{mode.label}</div>
                  <div className="mt-2 text-xs leading-relaxed text-white/60">
                    {mode.note}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowBigFive((v) => !v)}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-4 py-2 text-sm font-semibold"
              type="button"
            >
              {showBigFive ? t("bigFive.hide") : t("bigFive.show")}
            </button>

            <div className="text-xs text-white/45">
              {t("bigFive.note")}
            </div>
          </div>
        </div>

        {showBigFive && (
          <div className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-xl">
            <div className="mt-6 space-y-4">
              {bigFiveRows.map((row) => (
                <div key={row.key}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/80">{row.label}</div>
                    <div className="text-sm text-white/70">{pct(row.value)}</div>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400"
                      style={{ width: `${pct(row.value)}%` }}
                    />
                  </div>
                  {row.note && (
                    <div className="mt-1 text-xs text-white/45">{row.note}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-white/45">
              {t("bigFive.inverseNote")}
            </div>
            <p className="mt-4 text-center text-xs text-white/40">
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