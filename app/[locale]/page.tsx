"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Logo } from "@/app/components/ui/logo";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";

const IconClock = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const IconLock = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect x="5" y="11" width="14" height="8" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const IconSpark = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3z" />
  </svg>
);

export default function Page() {
  const t = useTranslations("Home");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-5 py-10 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-xl ring-1 ring-white/15 shadow-lg">
              <Logo className="text-indigo-200" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">
                {t("brand.title")}
              </div>
              <div className="text-xs text-white/55">
                {t("brand.subtitle")}
              </div>
            </div>
          </div>

          {/* 🌍 Language switcher */}
          <LanguageSwitcher />
        </div>

        {/* HERO */}
        <h1 className="mt-10 text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
          {t("headline.before")}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {t("headline.accent")}
          </span>
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/70">
          {t("description")}
        </p>

        {/* TRUST PILLS */}
        <div className="mt-6 flex flex-wrap gap-2 text-sm text-white/70">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <IconClock />
              {t("pills.time")}
            </span>
          </span>

          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <IconLock />
              {t("pills.anonymous")}
            </span>
          </span>

          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md">
            <span className="inline-flex items-center gap-2">
              <IconSpark />
              {t("pills.ux")}
            </span>
          </span>
        </div>

        <p className="mt-3 text-sm text-white/55">{t("note")}</p>

        {/* CTA */}
        <div className="mt-8">
          <Link
            href="/test"
            className="relative inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white
              bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500
              shadow-[0_20px_60px_rgba(99,102,241,0.35)]
              transition active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
          >
            {t("cta")} →
          </Link>

          <p className="mt-3 text-center text-xs text-white/55">
            {t("ctaNote")}
          </p>
        </div>

        {/* COLLAGE */}
        <div className="mt-8 flex justify-center">
          <img
            src="/graphics/avatars-collage-compact-beta.png"
            alt=""
            width={900}
            height={420}
            className="w-full max-w-md select-none"
            loading="eager"
          />
        </div>

        {/* INFO CARDS */}
        <div className="mt-10 space-y-3">
          <InfoCard title={t("cards.what.title")} text={t("cards.what.text")} />
          <InfoCard
            title={t("cards.anonymous.title")}
            text={t("cards.anonymous.text")}
          />
          <InfoCard
            title={t("cards.questions.title")}
            text={t("cards.questions.text")}
          />
        </div>

        <p className="mt-10 text-center text-xs text-white/40">
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
