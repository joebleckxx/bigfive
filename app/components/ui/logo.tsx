import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 30, className = "" }: LogoProps) {
  const scaledSize = Math.round(size * 1.1);

  return (
    <Image
      src="/icon.png"
      alt="Personality test logo"
      width={scaledSize}
      height={scaledSize}
      className={`rounded-lg object-cover ${className}`.trim()}
      loading="eager"
    />
  );
}
