import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import LegalFooter from "@/app/components/ui/legal-footer";
import Image from "next/image";
import TMJBackground from "@/app/components/ui/background";

export const CTA_GRADIENT =
  "bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-400";

export default async function Page({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale;
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#02030A] px-6 sm:px-5 py-10 text-white"
    >
      <TMJBackground />

      <div className="relative mx-auto w-full max-w-md">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <Link
              href="/"
              className="text-sm font-bold tracking-tight text-white/80"
              style={{
                fontFamily:
                  '"Satoshi", var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              {t("brand.title")}
            </Link>
            <div className="text-xs text-white/55">{t("brand.subtitle")}</div>
          </div>
          
          <LanguageSwitcher />
        </div>

        {/* HERO */}
        <h1 className="mt-10 break-normal text-[2.4rem] sm:text-[2.6rem] font-semibold leading-[1.05] tracking-tight [hyphens:auto] [text-wrap:balance]">
          {t("headline.before")}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {t("headline.accent")}
          </span>
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-white/90">
          {t("subheadline")}
        </p>

        {/* EDITORIAL – VARIANT A */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/80">
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
            <p className="m-0">{t("editorial.line3")}</p>
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
        </div>

        {/* CTA */}
        <div className="mt-8">
          <Link
            href="/test"
            className={[
              "relative inline-flex w-full items-center justify-center rounded-3xl px-6 py-4 text-base font-semibold text-white",
              CTA_GRADIENT,
              "shadow-[0_20px_60px_rgba(99,102,241,0.28)]",
              "transition",
              "focus:outline-none focus:ring-4 focus:ring-indigo-400/30",
              "cursor-pointer",
            ].join(" ")}
          >
            {t("cta")} →
          </Link>

        </div>

        {/* COLLAGE */}
        <div className="mt-8 flex justify-center">
          <div className="relative w-full max-w-md">
            <Image
              src="/graphics/avatars-collage-compact-beta.webp"
              alt=""
              width={900}
              height={420}
              priority
              sizes="(max-width: 640px) 100vw, 448px"
              className="w-full select-none [filter:drop-shadow(0_0_26px_rgba(0,0,0,0.5))]"
            />
          </div>
        </div>

        <LegalFooter />
      </div>
    </main>
  );
}
