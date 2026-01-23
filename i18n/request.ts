import {getRequestConfig} from "next-intl/server";
import {routing} from "./routing";

import en from "../messages/en.json";
import pl from "../messages/pl.json";
import sv from "../messages/sv.json";
import es from "../messages/es.json";
import de from "../messages/de.json";
import fr from "../messages/fr.json";
import pt from "../messages/pt.json";

const MESSAGES: Record<string, any> = {en, pl, sv, es, de, fr, pt};

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = routing.locales.includes(requested as any)
    ? (requested as string)
    : routing.defaultLocale;

  return {
    locale,
    messages: MESSAGES[locale]
  };
});
