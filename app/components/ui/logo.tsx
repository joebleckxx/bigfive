import Image from "next/image";
import { BRAND } from "@/lib/brand";
import { Link } from "@/navigation";

type LogoProps = { size?: number; className?: string };

export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <span className={`tmj-logo ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <Image src={BRAND.logoSrc} alt="" width={size} height={size} sizes={`${size}px`} className="tmj-logo-image" />
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
