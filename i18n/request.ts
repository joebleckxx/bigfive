import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

import en from "../messages/en.json";
import pl from "../messages/pl.json";
import sv from "../messages/sv.json";
import es from "../messages/es.json";
import de from "../messages/de.json";
import fr from "../messages/fr.json";
import pt from "../messages/pt.json";

type Locale = (typeof routing.locales)[number];
type Messages = Record<string, unknown>;

const MESSAGES: Record<Locale, Messages> = {en, pl, sv, es, de, fr, pt};

function isLocale(value: string): value is Locale {
  return routing.locales.includes(value as Locale);
}

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale =
    typeof requested === "string" && isLocale(requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale]
  };
});
