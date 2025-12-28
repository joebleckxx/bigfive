"use client";

import { useEffect } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/app/components/ui/logo";
import { computeResult, QUESTIONS } from "@/lib/personality";

const PAID_KEY = "bigfive_paid_v1";
const ANSWERS_KEY = "personality_answers_v1";
const RESULT_KEY = "personality_result_v1";

function isCompleteAnswers(answers: number[]) {
  return (
    answers.length === QUESTIONS.length &&
    answers.every((v) => Number.isInteger(v) && v >= 1 && v <= 5)
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

      const payload = computeResult(answers);
      localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
      localStorage.setItem(PAID_KEY, "true");
      router.push("/result");
    } catch {
      router.push("/test");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] text-white px-5 py-10">
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

        <h1 className="mt-10 text-[2.4rem] font-semibold leading-[1.1] tracking-tight">
          {t("headline.before")}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {t("headline.accent")}
          </span>{" "}
          {t("headline.after")}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          {t("description")}
        </p>

        <div className="mt-8 space-y-3">
          <InfoCard title={t("cards.unlock.title")} text={t("cards.unlock.text")} />
          <InfoCard title={t("cards.once.title")} text={t("cards.once.text")} />
          <InfoCard title={t("cards.demo.title")} text={t("cards.demo.text")} />
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

          <button
            onClick={() => router.push("/test")}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-base font-semibold text-white/85
              backdrop-blur-md transition hover:border-white/40"
            type="button"
          >
            {t("backToTest")}
          </button>

          <p className="mt-3 text-center text-xs text-white/55">{t("note")}</p>
        </div>

        <div className="h-6" />

        <p className="mt-8 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xl shadow-lg">
      <div className="text-sm font-semibold text-white/85">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{text}</p>
    </div>
  );
}
