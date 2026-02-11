import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { locales, type Locale } from "../../i18n/routing";
import { Toaster } from "sonner";

import en from "../../messages/en.json";
import pl from "../../messages/pl.json";
import sv from "../../messages/sv.json";
import es from "../../messages/es.json";
import de from "../../messages/de.json";
import fr from "../../messages/fr.json";
import pt from "../../messages/pt.json";

const MESSAGES: Record<Locale, any> = { en, pl, sv, es, de, fr, pt };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);

  const messages = MESSAGES[locale as Locale];

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
      <Toaster
        position="bottom-center"
        closeButton={false}
      />
    </NextIntlClientProvider>
  );
}
