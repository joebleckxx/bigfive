"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/navigation";
import { locales, type Locale } from "@/i18n/routing";

const LABEL: Record<Locale, string> = {
  en: "EN",
  pl: "PL",
  sv: "SV",
};

export function LanguageSwitcher() {
  const active = useLocale() as Locale;
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const items = useMemo(
    () => locales.map((l) => ({ locale: l, label: LABEL[l] })),
    []
  );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeLabel = LABEL[active] ?? "EN";

  return (
    <div ref={ref} className="relative">
      {/* Trigger (very subtle) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-xl
          px-2.5 py-1.5 text-[11px] font-semibold tracking-wider
          text-white/70 hover:text-white/90
          border border-white/10 hover:border-white/20
          bg-transparent hover:bg-white/5
          transition focus:outline-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Language"
      >
        {activeLabel}
        <span className="ml-1.5 text-white/35">▾</span>
      </button>

      {/* Dropdown (only letters) */}
      {open ? (
        <div
          className="absolute right-0 z-50 mt-2
            rounded-xl border border-white/10
            bg-[#0B0C14]/90 backdrop-blur-xl
            shadow-xl overflow-hidden"
          role="menu"
        >
          <div className="flex flex-col p-1">
            {items
              .filter((i) => i.locale !== active)
              .map((item) => (
                <Link
                  key={item.locale}
                  href={pathname}
                  locale={item.locale}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2
                    text-[11px] font-semibold tracking-wider
                    text-white/75 hover:text-white
                    hover:bg-white/8 transition"
                  role="menuitem"
                >
                  {item.label}
                </Link>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
