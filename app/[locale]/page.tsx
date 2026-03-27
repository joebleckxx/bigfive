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
  const featureCards = [
    {
      icon: "/icons/home/feature-questions.svg",
      iconAlt: "Questions feature icon",
      iconBgClass: "bg-[rgba(56,167,214,0.18)]",
      title: t("features.item1.title"),
      description: t("editorial.line1"),
    },
    {
      icon: "/icons/home/feature-insights.svg",
      iconAlt: "Insights feature icon",
      iconBgClass: "bg-[rgba(170,85,247,0.17)]",
      title: t("features.item2.title"),
      description: t("editorial.line2"),
    },
    {
      icon: "/icons/home/feature-hybrid.svg",
      iconAlt: "Hybrid model feature icon",
      iconBgClass: "bg-[rgba(129,99,246,0.17)]",
      title: t("features.item3.title"),
      description: t("editorial.line3"),
    },
  ];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#02030A] px-6 py-10 text-white sm:px-5"
    >
      <TMJBackground />

      <div className="relative mx-auto w-full max-w-md">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <Link
              href="/"
              className="bg-[linear-gradient(90deg,#57D6FF_0%,#7CB6FF_42%,#C08CFF_72%,#F08CFF_100%)] bg-clip-text text-sm font-bold tracking-tight text-transparent"
            >
              {t("brand.title")}
            </Link>
          </div>
          
          <LanguageSwitcher />
        </div>

        {/* HERO */}
        <div className="mt-18 flex justify-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.04] bg-[#0D1A34]/95 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_40px_rgba(0,0,0,0.16)]">
            <Image
              src="/icons/home/badge-sparkle.svg"
              alt=""
              aria-hidden="true"
              width={16}
              height={16}
              className="h-4 w-4"
            />
            <span className="text-[0.78rem] font-bold tracking-[0.16em] text-[#79D9FF]">
              {t("badge")}
            </span>
          </div>
        </div>

        <h1
          className="mt-10 text-center text-[clamp(3.35rem,15.8vw,4.41rem)] font-bold leading-[1] tracking-[-0.05em] text-[#E8ECFF]"
        >
          <span className="block">{t("headline.line1")}</span>
          <span className="mt-2 block">
            {t("headline.line2")}{" "}
            <span className="inline-block bg-[linear-gradient(90deg,#4ED8FF_0%,#66C6FF_30%,#7EAAFF_68%,#B38CFF_100%)] bg-clip-text text-transparent">
              {t("headline.line2Accent")}
            </span>
          </span>
          <span className="mt-2 block">
            <span className="inline-block bg-[linear-gradient(90deg,#9A7BFF_0%,#C57EFF_52%,#F08CFF_100%)] bg-clip-text text-transparent">
              {t("headline.line3")}
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-[23rem] text-center text-[1.14rem] leading-[1.72] tracking-[-0.02em] text-[#C7CAE0] sm:max-w-[24.5rem] sm:text-[1.2rem]">
          {t("subheadline")}
        </p>

        <div className="mt-16 space-y-7">
          {featureCards.map((card) => (
            <section
              key={card.title}
              className="rounded-[2.35rem] border border-white/[0.025] bg-[#071126]/95 px-7 pb-10 pt-9 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_30px_70px_rgba(0,0,0,0.24)]"
            >
              <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${card.iconBgClass}`}>
                <Image
                  src={card.icon}
                  alt={card.iconAlt}
                  width={34}
                  height={34}
                  className="h-[2.125rem] w-[2.125rem]"
                />
              </div>
              <h2 className="mt-10 text-[1.76rem] font-bold leading-[1.08] tracking-[-0.04em] text-[#EEF1FF]">
                {card.title}
              </h2>
              <p className="mx-auto mt-5 max-w-[19rem] text-[1.06rem] leading-[1.72] tracking-[-0.02em] text-[#B8BDD8]">
                {card.description}
              </p>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/test"
            className={[
              "relative inline-flex min-w-[16.5rem] items-center justify-center gap-3 rounded-full px-8 py-5 text-[1.05rem] font-bold text-[#09101D]",
              "bg-[linear-gradient(90deg,#52D4FF_0%,#79C1FF_32%,#B79FFF_69%,#F087EE_100%)]",
              "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_35px_rgba(199,110,255,0.22),0_0_70px_rgba(79,206,255,0.14)]",
              "transition-transform duration-200 hover:scale-[1.01]",
              "focus:outline-none focus:ring-4 focus:ring-indigo-400/30",
              "cursor-pointer",
            ].join(" ")}
          >
            <span>{t("cta")}</span>
            <Image
              src="/icons/home/cta-arrow.svg"
              alt=""
              aria-hidden="true"
              width={28}
              height={28}
              className="h-7 w-7"
            />
          </Link>
          <p className="mt-7 text-[0.7rem] font-medium tracking-[0.32em] text-white/35">
            {t("note")}
          </p>
          {t.has("noteSecondary") && (
            <p className="mt-2 text-[0.7rem] font-medium tracking-[0.15em] text-white/35">
              {t("noteSecondary")}
            </p>
          )}
        </div>

        <LegalFooter />
      </div>
    </main>
  );
}
