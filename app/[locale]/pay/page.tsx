"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/app/components/ui/logo";
import { QUESTIONS } from "@/lib/personality";
import { calculateResult } from "@/lib/scoring";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";

const PAID_KEY = "personality_paid_v1";
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

export default function PayPage() {
  const router = useRouter();
  const t = useTranslations("Pay");

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

  function handleUnlock() {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      if (!raw) {
        router.push("/test");
        return;
      }

      const answers = JSON.parse(raw) as number[];
      if (!Array.isArray(answers) || !isCompleteAnswers(answers)) {
        router.push("/test");
        return;
      }

      const payload = calculateResult(answers);

      localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
      localStorage.setItem(PAID_KEY, "true");

      router.push("/result");
    } catch {
      router.push("/test");
    }
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
            className="relative inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white
              bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
              shadow-[0_20px_60px_rgba(99,102,241,0.35)]
              transition active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
            type="button"
          >
            {t("cta")}
          </button>

          <p className="mt-3 text-center text-xs text-white/55">{t("note")}</p>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}
