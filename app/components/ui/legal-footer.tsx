"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function LegalFooter() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const labels: Record<string, { privacy: string; terms: string; support: string }> = {
    en: { privacy: "Privacy", terms: "Terms", support: "Support" },
    pl: { privacy: "Prywatność", terms: "Regulamin", support: "Kontakt" },
    sv: { privacy: "Integritet", terms: "Villkor", support: "Support" },
    de: { privacy: "Datenschutz", terms: "AGB", support: "Support" },
    fr: { privacy: "Confidentialité", terms: "Conditions", support: "Support" },
    es: { privacy: "Privacidad", terms: "Términos", support: "Soporte" },
    pt: { privacy: "Privacidade", terms: "Termos", support: "Suporte" },
  };

  const t = labels[locale] ?? labels.en;

  return (
    <footer className="mt-10 border-t border-white/10 pt-6">
      <div className="flex items-center justify-center gap-3 text-xs text-white/45">
        <Link
          href={`/${locale}/privacy`}
          className="hover:text-white/70 transition"
        >
          {t.privacy}
        </Link>
        <span className="opacity-70">·</span>
        <Link
          href={`/${locale}/terms`}
          className="hover:text-white/70 transition"
        >
          {t.terms}
        </Link>
        <span className="opacity-70">·</span>
        <a
          href="mailto:support@hellotmj.com"
          className="hover:text-white/70 transition"
        >
          {t.support}
        </a>
      </div>

      <p className="mt-5 text-center text-xs text-white/40">
        <Link
          href={`/${locale}`}
          className="hover:text-white/70 transition"
          aria-label="Back to home"
        >
          tellmejoe.
        </Link>{" "}
        TMJ © {new Date().getFullYear()}
      </p>
    </footer>
  );
}