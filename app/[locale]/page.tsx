"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/navigation";
import { Logo } from "@/app/components/ui/logo";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";

export default function Page() {
  const t = useTranslations("Home");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-6 sm:px-5 py-10 text-white">
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

          <LanguageSwitcher />
        </div>

        {/* HERO */}
        <h1 className="mt-10 break-words text-[2.4rem] sm:text-[2.6rem] font-semibold leading-[1.05] tracking-tight">
          {t("headline.before")}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {t("headline.accent")}
          </span>
        </h1>

        {/* EDITORIAL – VARIANT A */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/70">
          <div className="flex gap-3">
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
            <p className="m-0">{t("editorial.line1")}</p>
          </div>

          <div className="flex gap-3">
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
            <p className="m-0">{t("editorial.line2")}</p>
          </div>

          <div className="flex gap-3">
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
            <p className="m-0">{t("editorial.line3")}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Link
            href="/test"
            className="relative inline-flex w-full items-center justify-center rounded-2xl px-6 py-4 text-base font-semibold text-white
              bg-gradient-to-r from-emerald-500 via-green-500 to-lime-500
              shadow-[0_20px_60px_rgba(16,185,129,0.35)]
              transition active:scale-[0.98]
              focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
          >
            {t("cta")} →
          </Link>

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

        <p className="mt-10 text-center text-xs text-white/40">
          © {new Date().getFullYear()} {t("footer")}
        </p>
      </div>
    </main>
  );
}
