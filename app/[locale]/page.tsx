import { getTranslations } from "next-intl/server";
import { Link } from "@/navigation";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import LegalFooter from "@/app/components/ui/legal-footer";
import Image from "next/image";
import { Brand } from "@/app/components/ui/logo";
import { BRAND } from "@/lib/brand";
import styles from "./home.module.css";

export const metadata = { title: BRAND.name };

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Home" });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Brand hero />
          <div className={styles.language}><LanguageSwitcher /></div>
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
          <Link href={{ pathname: "/test", query: { from: "main" } }} className={styles.cta}>
            {t("landing.cta")} <span aria-hidden="true">→</span>
          </Link>
          <p className={styles.note}>
            <Image src="/icons/shared/privacy-lock.svg" alt="" aria-hidden="true" width={17} height={17} className={styles.privacyIcon} />
            <span>{t("noteSecondary")}</span>
          </p>
        </div>

        <Image
          src="/graphics/personality-avatars.png"
          alt=""
          width={1600}
          height={520}
          sizes="(max-width: 632px) calc(100vw - 56px), 560px"
          className={styles.avatars}
          priority
        />
        <div className={styles.footer}><LegalFooter /></div>
      </div>
    </main>
  );
}
