import {defineRouting} from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pl", "en", "sv", "es", "de", "fr", "pt"] as const,
  defaultLocale: "en"
});

export type Locale = (typeof routing.locales)[number];
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
