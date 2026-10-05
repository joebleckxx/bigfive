"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Link } from "@/navigation";
import { track } from "@/lib/analytics";

type Props = { label: string; locale: string; placement: "hero" | "bottom" };

export default function HomeStartLink({ label, locale, placement }: Props) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const viewed = useRef(false);

  useEffect(() => {
    const link = linkRef.current;
    if (!link || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.5 || viewed.current) return;
      viewed.current = true;
      track("home_cta_viewed", { locale, placement, home_version: "cta_top_v1" });
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(link);
    return () => observer.disconnect();
  }, [locale, placement]);

  return (
    <Link
      ref={linkRef}
      href={{ pathname: "/test", query: { from: "main" } }}
      data-cta-placement={placement}
      onClick={() => track("home_cta_clicked", { locale, placement, home_version: "cta_top_v1" })}
      className="relative inline-flex min-w-[16.5rem] max-w-full items-center justify-center gap-3 rounded-full bg-[linear-gradient(90deg,#52D4FF_0%,#79C1FF_32%,#B79FFF_69%,#F087EE_100%)] px-8 py-5 text-[1.05rem] font-bold text-[#09101D] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_35px_rgba(199,110,255,0.22),0_0_70px_rgba(79,206,255,0.14)] transition-transform duration-200 hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-indigo-400/30 cursor-pointer"
    >
      <span>{label}</span>
      <Image src="/icons/home/cta-arrow.svg" alt="" aria-hidden="true" width={28} height={28} className="h-7 w-7 shrink-0" />
    </Link>
  );
}
