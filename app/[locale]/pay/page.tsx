"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";
import { calculateResult } from "@/lib/scoring";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { useLocale } from "next-intl";

const PAID_KEY = "personality_paid_v1";
const PAID_AT_KEY = "personality_paid_at_v1"; // ✅ NEW
const ANSWERS_KEY = "personality_answers_v1";
const RESULT_KEY = "personality_result_v1";

function isCompleteAnswers(answers: number[]) {
  return (
    answers.length === QUESTIONS.length &&
    answers.every((v) => Number.isInteger(v) && v >= 1 && v <= 5)
  );
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-6 w-6 shrink-0 text-indigo-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function PremiumRingLoader() {
  return (
    <div className="relative h-14 w-14">
      {/* soft glow */}
      <div className="absolute inset-0 rounded-full blur-xl opacity-70 bg-[conic-gradient(from_180deg,#818CF8,#A78BFA,#F472B6,#60A5FA,#818CF8)]" />
  
      {/* ring */}
      <div
        className={[
          "absolute inset-0 rounded-full",
          "animate-spin",
          // ring thickness via mask
          "[mask:radial-gradient(farthest-side,transparent_calc(100%-6px),#000_calc(100%-5px))]",
          "bg-[conic-gradient(from_180deg,#818CF8,#A78BFA,#F472B6,#60A5FA,#818CF8)]",
          "opacity-95",
        ].join(" ")}
      />

      {/* inner subtle glass */}
      <div className="absolute inset-[10px] rounded-full bg-white/5 backdrop-blur-sm border border-white/10" />
    </div>
  );
}

export default function PayPage() {
  const router = useRouter();
  const t = useTranslations("Pay");
  const locale = useLocale();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      if (!raw) {
        router.replace("/test");
        return;
      }
      const answers = JSON.parse(raw) as number[];
      if (!Array.isArray(answers) || !isCompleteAnswers(answers)) {
        router.replace("/test");
        return;
      }
    } catch {
      router.replace("/test");
    }
  }, [router]);

  async function handleUnlock() {
    // ✅ Preview/test mode: payments disabled → unlock locally (no Stripe)
    if (process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === "true") {
      try {
        const raw = localStorage.getItem(ANSWERS_KEY);
        if (!raw) {
          return router.push("/test");
        }

        const answers = JSON.parse(raw) as number[];
        if (!Array.isArray(answers) || !isCompleteAnswers(answers)) {
          return router.push("/test");
        }

        const payload = calculateResult(answers);

        localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
        localStorage.setItem(PAID_KEY, "true");
        localStorage.setItem(PAID_AT_KEY, String(Date.now()));

        router.push("/result");
        return;
      } catch (e) {
        console.error("Local unlock failed", e);
        alert("Unlock error. Please try again.");
        return;
      }
    }

    // ✅ Normal: Stripe Checkout
    try {
      setIsRedirecting(true);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });

      const json = await res.json();

      if (json?.url) {
        window.location.href = json.url; // 👉 Stripe Checkout
        return;
      }

      console.error("Stripe checkout: missing url", json);
    } catch (e) {
      console.error("Stripe checkout failed", e);
    }
    setIsRedirecting(false);
    alert("Payment setup error. Please try again.");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] text-white px-6 sm:px-5 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <div
              className="text-sm font-bold tracking-tight text-white/80"
              style={{
                fontFamily:
                  '"Satoshi", var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              {t("brandTitle")}
            </div>
            <div className="text-xs text-white/55">{t("brandSubtitle")}</div>
          </div>

          <LanguageSwitcher />
        </div>

        <h1 className="mt-10 text-[2.4rem] font-semibold leading-[1.1] tracking-tight break-words">
          {t("headline.before")}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {t("headline.accent")}
          </span>{" "}
          {t("headline.after")}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          {t("description")}
        </p>

        {/* 3 lines – same pattern as Home */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
          <div className="flex gap-3">
            <CheckIcon />
            <p className="m-0">{t("editorial.line1")}</p>
          </div>

          <div className="flex gap-3">
            <CheckIcon />
            <p className="m-0">{t("editorial.line2")}</p>
          </div>

          <div className="flex gap-3">
            <CheckIcon />
            <p className="m-0">{t("editorial.line3")}</p>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleUnlock}
            className="relative inline-flex w-full items-center justify-center rounded-3xl px-6 py-4 text-base font-semibold text-white
              bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
              shadow-[0_20px_60px_rgba(99,102,241,0.35)]
              transition active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-indigo-400/30
              cursor-pointer"
            type="button"
          >
            {t("cta")} →
          </button>

          <p className="mt-3 text-center text-xs text-white/55">{t("note")}</p>
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
          <a
            href="/"
            className="hover:text-white/55 transition"
          >
            tellmejoe
          </a>
          . TMJ © {new Date().getFullYear()}
        </p>        
      </div>

      {isRedirecting && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-8 py-7 shadow-2xl">
            <PremiumRingLoader />
            <p className="text-center text-sm font-medium text-white/85">{t("loading")}</p>
          </div>
        </div>
      )}

    </main>
  );
}
