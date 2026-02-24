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
            // violet (primary)
            "radial-gradient(112% 88% at 74% 30%, rgba(124,58,237,0.28) 0%, rgba(124,58,237,0) 72%)",
            // blue (primary, equal weight)
            "radial-gradient(118% 92% at 86% 84%, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0) 70%)",
            // indigo (accent, smaller + softer)
            "radial-gradient(82% 62% at 22% 86%, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0) 72%)",
            // lift (keeps shadows from going flat)
            "radial-gradient(120% 100% at 12% 12%, rgba(124,58,237,0.10) 0%, rgba(124,58,237,0) 62%)",
          ].join(", "),
        }}
      />

      {/* Accent sweep for depth */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.4,
          background:
            "linear-gradient(130deg, rgba(5,6,18,0) 18%, rgba(99,102,241,0.10) 46%, rgba(59,130,246,0.10) 52%, rgba(8,9,24,0) 78%)",
        }}
      />

      {/* Soft bloom, intentionally subtle */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.34,
          filter: "blur(72px)",
          backgroundImage:
            [
              "radial-gradient(62% 56% at 72% 76%, rgba(124,58,237,0.22) 0%, rgba(124,58,237,0) 100%)",
              "radial-gradient(62% 56% at 78% 80%, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0) 100%)",
            ].join(", "),
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
