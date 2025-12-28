"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/app/components/ui/logo";

type Trait = "E" | "O" | "C" | "A" | "N";

type StoredResultV1 = {
  version: "v1";
  createdAt: string;
  answers: number[];
  scores: Record<Trait, number>;
  stability: number;
  typeCode: string;
  typeName: string;
  typeDescription: string;
  addOns: {
    stressProfile: { label: string; note: string };
    subtype: { label: string; note: string };
    mode: { label: string; note: string };
  };
};

const STORAGE_KEY = "personality_result_v1";
const PAID_KEY = "bigfive_paid_v1";
const ANSWERS_KEY = "personality_answers_v1";

function pct(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function isResultShape(x: any): x is StoredResultV1 {
  return (
    x &&
    typeof x.typeCode === "string" &&
    x.typeCode.length > 0 &&
    x.scores &&
    typeof x.scores.E === "number" &&
    typeof x.scores.O === "number" &&
    typeof x.scores.C === "number" &&
    typeof x.scores.A === "number" &&
    typeof x.scores.N === "number" &&
    typeof x.stability === "number" &&
    x.addOns?.stressProfile?.label &&
    x.addOns?.subtype?.label &&
    x.addOns?.mode?.label
  );
}

export default function ResultPage() {
  const router = useRouter();
  const t = useTranslations("Result");

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
    } catch {
      router.replace("/test");
    } finally {
      setLoaded(true);
    }
  }, [router]);

  const stabilityLabel = useMemo(() => {
    if (!data) return "";
    const s = data.stability;
    if (s >= 67) return t("stability.high");
    if (s >= 34) return t("stability.medium");
    return t("stability.low");
  }, [data, t]);

  async function copySummary() {
    if (!data) return;

    const summary =
      `${t("copy.myType")}: ${data.typeCode}\n` +
      `${data.typeName}\n\n` +
      `${t("copy.addOns")}:\n` +
      `• ${t("cards.stress.title")}: ${data.addOns.stressProfile.label}\n` +
      `• ${t("cards.subtype.title")}: ${data.addOns.subtype.label}\n` +
      `• ${t("cards.mode.title")}: ${data.addOns.mode.label}\n`;

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
    } catch {
      // ignore
    }
    router.push("/test");
  }

  if (!loaded) return null;

  if (!data) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-5 py-10 text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
          <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
          <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-lg">
              <Logo className="text-indigo-200" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                {t("brandTitle")}
              </div>
              <div className="text-xs text-white/55">{t("brandSubtitle")}</div>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-2xl shadow-xl">
            <h1 className="mb-2 text-2xl font-semibold">{t("noData.title")}</h1>
            <p className="mb-6 text-white/70">{t("noData.text")}</p>
            <button
              onClick={() => router.push("/test")}
              className="inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white
                bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
                shadow-[0_20px_60px_rgba(99,102,241,0.35)]
                transition active:scale-[0.98]"
              type="button"
            >
              {t("noData.backToTest")}
            </button>
          </div>

          <p className="mt-10 text-center text-xs text-white/40">
            © {new Date().getFullYear()} {t("footer")}
          </p>
        </div>
      </main>
    );
  }

  const bigFiveRows: Array<{
    key: Trait | "S";
    label: string;
    value: number;
    note?: string;
  }> = [
    { key: "E", label: t("traits.E"), value: data.scores.E },
    { key: "O", label: t("traits.O"), value: data.scores.O },
    { key: "C", label: t("traits.C"), value: data.scores.C },
    { key: "A", label: t("traits.A"), value: data.scores.A },
    { key: "N", label: t("traits.N"), value: data.scores.N, note: t("traitsNotes.N") },
    { key: "S", label: t("traits.S"), value: data.stability, note: t("traitsNotes.S") }
  ];

  const prettyName =
    data.typeName.startsWith(data.typeCode)
      ? data.typeName.replace(data.typeCode, "").trim()
      : data.typeName;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-lg">
            <Logo className="text-indigo-200" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">{t("brandTitle")}</div>
            <div className="text-xs text-white/55">{t("brandSubtitle")}</div>
          </div>
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

        <div className="mt-8 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-2xl shadow-xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/50">
                {t("yourTypeLabel")}
              </div>
              <h2 className="mt-2 text-3xl font-semibold leading-tight">
                {data.typeCode}
                <span className="ml-3 text-xl font-medium text-white/70">
                  {prettyName}
                </span>
              </h2>
            </div>

            <button
              onClick={copySummary}
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
              type="button"
            >
              {copied ? t("copy.copied") : t("copy.cta")}
            </button>
          </div>

          <p className="mt-4 text-white/80">{data.typeDescription}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wider text-white/50">
                {t("cards.stress.title")}
              </div>
              <div className="mt-2 font-semibold">{data.addOns.stressProfile.label}</div>
              <div className="mt-1 text-sm text-white/70">{data.addOns.stressProfile.note}</div>
              <div className="mt-2 text-xs text-white/45">
                {t("cards.stress.stability")}: {stabilityLabel}
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wider text-white/50">
                {t("cards.subtype.title")}
              </div>
              <div className="mt-2 font-semibold">{data.addOns.subtype.label}</div>
              <div className="mt-1 text-sm text-white/70">{data.addOns.subtype.note}</div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl">
              <div className="text-xs uppercase tracking-wider text-white/50">
                {t("cards.mode.title")}
              </div>
              <div className="mt-2 font-semibold">{data.addOns.mode.label}</div>
              <div className="mt-1 text-sm text-white/70">{data.addOns.mode.note}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setShowBigFive((v) => !v)}
              className="rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(99,102,241,0.35)] hover:opacity-95"
              type="button"
            >
              {showBigFive ? t("bigFive.hide") : t("bigFive.show")}
            </button>

            <div className="text-xs text-white/45">{t("bigFive.note")}</div>
          </div>
        </div>

        {showBigFive ? (
          <div className="mt-6 rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-2xl shadow-xl">
            <div className="text-sm font-semibold">{t("bigFive.title")}</div>
            <div className="mt-1 text-xs text-white/50">{t("bigFive.subtitle")}</div>

            <div className="mt-6 space-y-4">
              {bigFiveRows.map((row) => (
                <div key={row.key}>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/80">{row.label}</div>
                    <div className="text-sm text-white/70">{pct(row.value)}</div>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400"
                      style={{ width: `${pct(row.value)}%` }}
                    />
                  </div>
                  {row.note ? <div className="mt-1 text-xs text-white/45">{row.note}</div> : null}
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-white/45">{t("bigFive.inverseNote")}</div>
          </div>
        ) : null}

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}
