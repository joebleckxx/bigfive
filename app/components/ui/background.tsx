import React from "react";

type Props = {
  className?: string;
};

export default function TMJBackground({ className = "" }: Props) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      {/* Base tone: very dark with slight cool bias */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(160deg, #02030A 0%, #040617 52%, #010209 100%)",
        }}
      />

      {/* Main color field: smooth, no hard circles */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(120% 95% at 84% 84%, rgba(36,78,255,0.26) 0%, rgba(36,78,255,0) 68%)",
            "radial-gradient(100% 80% at 76% 30%, rgba(122,56,236,0.28) 0%, rgba(122,56,236,0) 70%)",
            "radial-gradient(90% 70% at 24% 88%, rgba(188,62,232,0.14) 0%, rgba(188,62,232,0) 72%)",
            "radial-gradient(120% 100% at 12% 12%, rgba(72,64,220,0.12) 0%, rgba(72,64,220,0) 62%)",
          ].join(", "),
        }}
      />

      {/* Accent sweep for depth */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.42,
          background:
            "linear-gradient(130deg, rgba(5,6,18,0) 18%, rgba(96,58,186,0.14) 48%, rgba(8,9,24,0) 78%)",
        }}
      />

      {/* Soft bloom, intentionally subtle */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.34,
          filter: "blur(72px)",
          backgroundImage:
            "radial-gradient(58% 52% at 72% 76%, rgba(120,74,255,0.30) 0%, rgba(120,74,255,0) 100%)",
        }}
      />

      {/* Vignette + top sheen */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/65" />
      <div className="absolute inset-0 [background:radial-gradient(130%_95%_at_50%_28%,transparent_32%,rgba(0,0,0,0.8)_100%)]" />

      {/* Tiny dither to reduce visible gradient banding */}
      <div
        className="absolute inset-0 opacity-[0.028] mix-blend-soft-light"
        style={{
          backgroundImage: [
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 4px)",
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0) 2px, rgba(255,255,255,0) 4px)",
          ].join(", "),
          backgroundSize: "3px 3px, 3px 3px",
        }}
      />
    </div>
  );
}
