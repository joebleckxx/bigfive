import { BRAND } from "@/lib/brand";
import { Link } from "@/navigation";

type LogoProps = { size?: number; className?: string };

export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <span className={`tmj-logo ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox={BRAND.mark.viewBox} fill="none">
        <path d={BRAND.mark.loop} stroke="currentColor" strokeWidth="3.5" />
        <path d={BRAND.mark.slash} stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" transform="rotate(13 35 28)" />
      </svg>
    </span>
  );
}

export function Brand() {
  return (
    <Link href="/" className="tmj-brand" aria-label={BRAND.name}>
      <Logo size={40} />
      <span className="tmj-brand-copy">
        <span className="tmj-brand-name">{BRAND.name}</span>
        <span className="tmj-brand-tagline">{BRAND.tagline}</span>
      </span>
    </Link>
  );
}
