export const locales = ["pl", "en", "sv"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
