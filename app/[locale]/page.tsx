import { getTranslations } from "next-intl/server";
import HomeStartLink from "@/app/components/home-start-link";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import LegalFooter from "@/app/components/ui/legal-footer";
import Image from "next/image";
import { Brand } from "@/app/components/ui/logo";
import { BRAND } from "@/lib/brand";
import styles from "./home.module.css";
import payStyles from "./pay/pay.module.css";
import { AVATARS } from "@/lib/avatars";

export const metadata = { title: BRAND.name };

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [t, tp] = await Promise.all([
    getTranslations({ locale, namespace: "Home" }),
    getTranslations({ locale, namespace: "Pay" }),
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Brand />
          <LanguageSwitcher />
        </header>

        <h1 className={styles.headline}>
          <span>{t("landing.headline")}</span>
          <span className={styles.accent}>{t("landing.headlineAccent")}</span>
        </h1>

        <ul className={styles.features}>
          {(["questions", "profiles", "insights"] as const).map((feature) => (
            <li key={feature}>
              <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="m5 17 8 8L28 7" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{t(`landing.${feature}`)}</span>
            </li>
          ))}
        </ul>

        <div className={styles.action}>
          <HomeStartLink label={t("landing.cta")} locale={locale} placement="hero" className={styles.cta} />
          <p className={styles.note}>
            <Image src="/icons/shared/privacy-lock.svg" alt="" aria-hidden="true" width={17} height={17} className={styles.privacyIcon} />
            <span>{t("noteSecondary")}</span>
          </p>
        </div>

        <section className={payStyles.socialProof}>
          <Image
            src="/graphics/community-portraits.png"
            alt=""
            width={1600}
            height={520}
            sizes="(max-width: 640px) 78vw, 360px"
            className={payStyles.communityPortraits}
          />
          <div className={payStyles.socialCount}>
            {tp("socialProofCount").replace("+", "").toUpperCase()}<sup>+</sup>
          </div>
          <p>{tp("socialProof")}</p>
        </section>

        <section className={payStyles.profilesTeaser} aria-labelledby="profiles-teaser-title">
          <h2 id="profiles-teaser-title" className={payStyles.profilesTeaserTitle}>
            {tp("profilesTeaserTitle")}
          </h2>
          <p className={payStyles.profilesTeaserBody}>{tp("profilesTeaserBody")}</p>
          <div className={payStyles.avatarWindow} aria-hidden="true">
            <div className={payStyles.avatarCollage}>
              {[6, 4, 15, 13, 9].map((avatar) => (
                <Image key={avatar} src={AVATARS[avatar]} alt="" width={112} height={112} sizes="112px" className={payStyles.teaserAvatar} />
              ))}
            </div>
          </div>
          <p className={payStyles.profilesTeaserCaption}>{tp("profilesTeaserCaption")}</p>
        </section>

        <LegalFooter />
      </div>
    </main>
  );
}
