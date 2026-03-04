"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";
import { calculateResult } from "@/lib/scoring";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { useLocale } from "next-intl";
import LegalFooter from "@/app/components/ui/legal-footer";
import TMJBackground from "@/app/components/ui/background";

export const CTA_GRADIENT =
  "bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-400";

const PAID_KEY = "personality_paid_v1";
const PAID_AT_KEY = "personality_paid_at_v1"; // ✅ NEW
const ANSWERS_KEY = "personality_answers_v1";
const RESULT_KEY = "personality_result_v1";
const QUESTION_ORDER_KEY = "personality_question_order_v1";
const CHECKOUT_ATTEMPT_KEY = "personality_checkout_attempt_v1";

function isCompleteAnswers(answers: number[]) {
  return (
    answers.length === QUESTIONS.length &&
    answers.every((v) => Number.isInteger(v) && v >= 1 && v <= 5)
  );
}

function readQuestionOrder(total: number): string[] | undefined {
  try {
    const raw = localStorage.getItem(QUESTION_ORDER_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== total) return undefined;
    if (!parsed.every((id) => typeof id === "string")) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-6 w-6 shrink-0 text-indigo-300"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function PremiumRingLoader() {
  return (
    <div className="relative h-14 w-14">
      {/* rotating arc */}
      <div
        className={[
          "absolute inset-0 rounded-full",
          "animate-[spin_1.1s_linear_infinite]",
          // thin line only
          "[mask:radial-gradient(farthest-side,transparent_calc(100%-3px),#000_calc(100%-2px))]",
          // short arc, not full ring
          "bg-[conic-gradient(from_0deg,transparent_0deg,transparent_220deg,#6366F1_260deg,#8B5CF6_300deg,#EC4899_330deg,transparent_360deg)]",
          "opacity-95",
        ].join(" ")}
      />

      {/* subtle glow */}
      <div
        className={[
          "absolute inset-0 rounded-full blur-lg",
          "animate-[spin_1.1s_linear_infinite]",
          "[mask:radial-gradient(farthest-side,transparent_calc(100%-4px),#000_calc(100%-3px))]",
          "bg-[conic-gradient(from_0deg,transparent_0deg,transparent_220deg,#6366F1_260deg,#8B5CF6_300deg,#EC4899_330deg,transparent_360deg)]",
          "opacity-40",
        ].join(" ")}
      />
    </div>
  );
}

export default function PayPage() {
  const router = useRouter();
  const t = useTranslations("Pay");
  const tt = useTranslations("Types");
  const tp = useTranslations("Profiles");
  const tr = useTranslations("Result");
  const locale = useLocale();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ANSWERS_KEY);
      if (!raw) {
        router.replace("/test");
        return;
      }
      const answers = JSON.parse(raw) as number[];
      if (!Array.isArray(answers) || !isCompleteAnswers(answers)) {
        router.replace("/test");
        return;
      }
    } catch {
      router.replace("/test");
    }
  }, [router]);

  // Guard: browser back from external checkout (Stripe)
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      // triggered when restoring from bfcache (Safari / iOS, browser back)
      if (e.persisted) {
        window.location.replace(`/${locale}/result`);
      }
    };

    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [locale]);

  async function handleUnlock() {
    // ✅ Preview/test mode: payments disabled → unlock locally (no Stripe)
    if (process.env.NEXT_PUBLIC_PAYMENTS_DISABLED === "true") {
      try {
        const raw = localStorage.getItem(ANSWERS_KEY);
        if (!raw) {
          return router.push("/test");
        }

        const answers = JSON.parse(raw) as number[];
        if (!Array.isArray(answers) || !isCompleteAnswers(answers)) {
          return router.push("/test");
        }

        const questionOrder = readQuestionOrder(QUESTIONS.length);
        const payload = calculateResult(answers, questionOrder);

        localStorage.setItem(RESULT_KEY, JSON.stringify(payload));
        localStorage.setItem(PAID_KEY, "true");
        localStorage.setItem(PAID_AT_KEY, String(Date.now()));

        router.push("/result");
        return;
      } catch (e) {
        console.error("Local unlock failed", e);
        alert("Unlock error. Please try again.");
        return;
      }
    }

    // ✅ Normal: Stripe Checkout
    try {
      const checkoutAttemptId =
        globalThis.crypto?.randomUUID?.() ??
        `attempt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, checkoutAttemptId);

      setIsRedirecting(true);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, checkoutAttemptId }),
      });

      const json = await res.json();

      if (json?.url) {
        window.location.href = json.url; // 👉 Stripe Checkout
        return;
      }

      console.error("Stripe checkout: missing url", json);
    } catch (e) {
      console.error("Stripe checkout failed", e);
    }
    setIsRedirecting(false);
    alert("Payment setup error. Please try again.");
  }

  const previewTypeCode = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        const raw = localStorage.getItem(ANSWERS_KEY);
        if (!raw) return null;
        const answers = JSON.parse(raw) as number[];
        if (!Array.isArray(answers) || !isCompleteAnswers(answers)) return null;
        const questionOrder = readQuestionOrder(QUESTIONS.length);
        const payload = calculateResult(answers, questionOrder);
        return payload?.typeCode ?? null;
      } catch {
        return null;
      }
    },
    () => null
  );

  const avatarSrc = previewTypeCode
    ? `/avatars/placeholder/avatar-${previewTypeCode.slice(1)}.svg`
    : "/avatars/placeholder/avatar-01.svg";

  const profileName = previewTypeCode ? tt(`${previewTypeCode}.name`) : "";
  const profileDesc = previewTypeCode ? tt(`${previewTypeCode}.desc`) : "";
  const coreLine1 = previewTypeCode ? tp(`${previewTypeCode}.core.0`) : "";
  const relationshipsLine1 = previewTypeCode
    ? tp(`${previewTypeCode}.relationships.0`)
    : "";

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#02030A] px-6 sm:px-5 py-10 text-white"
    >
      <TMJBackground />

      <div className="relative mx-auto w-full max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <Link
              href="/"
              className="text-sm font-bold tracking-tight text-white/80"
              style={{
                fontFamily:
                  '"Satoshi", var(--font-geist-sans), system-ui, sans-serif',
              }}
            >
              {t("brandTitle")}
            </Link>
            <div className="text-xs text-white/55">{t("brandSubtitle")}</div>
          </div>

          <LanguageSwitcher />
        </div>

        <h1 className="mt-10 text-[2.4rem] font-semibold leading-[1.1] tracking-tight break-words">
          {t("headline.before")}{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
            {t("headline.accent")}
          </span>{" "}
          {t("headline.after")}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-white/90">
          {t("description")}
        </p>

        {previewTypeCode && (
            <div className="mt-6 overflow-hidden rounded-3xl bg-white/2 px-6 pt-5 pb-0 shadow-xl sm:px-8">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="relative shrink-0 sm:ml-1">
                  <div className="pointer-events-none absolute -inset-3 rounded-full bg-black/20 blur-2xl" />
                  <div
                    role="img"
                    aria-label={profileName}
                    className="relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/10"
                  >
                    {!avatarError ? (
                      <Image
                        src={avatarSrc}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                        style={{ filter: "brightness(0) invert(1)" }}
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="text-2xl font-semibold text-white"
                      >
                        {profileName?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0 text-center sm:text-left">
                  <div className="mt-1 text-3xl font-semibold tracking-tight">
                    {profileName}
                  </div>
                  <div className="mt-2 text-sm text-white/70 italic">
                    {profileDesc}
                  </div>
                </div>
              </div>

              <div className="relative mt-5 -mx-6 bg-white/5 px-6 pt-5 pb-0 sm:-mx-8 sm:px-8 sm:pt-6 sm:pb-0">
                <div className="relative pr-5 blur-[4px] opacity-80 sm:pr-6">
                  <div className="pointer-events-none absolute right-0 top-2 bottom-2 z-[1] w-[3px] rounded-full bg-white/12">
                    <div className="absolute left-0 top-[11px] h-10 w-[3px] rounded-full bg-white/45 shadow-[0_0_12px_rgba(255,255,255,0.2)]" />
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-5 w-5 text-indigo-300/75"
                    >
                      <path d="M12 18V5" />
                      <path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4" />
                      <path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5" />
                      <path d="M17.997 5.125a4 4 0 0 1 2.526 5.77" />
                      <path d="M18 18a4 4 0 0 0 2-7.464" />
                      <path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517" />
                      <path d="M6 18a4 4 0 0 1-2-7.464" />
                      <path d="M6.003 5.125a4 4 0 0 0-2.526 5.77" />
                    </svg>
                    {tr("profileSections.core")}
                  </div>
                  <div className="mt-3 space-y-2">
                    <p className="m-0 text-sm leading-relaxed text-white/75">
                      {coreLine1}
                    </p>
                    {!coreLine1 && (
                      <div className="h-3 w-11/12 rounded bg-white/10" />
                    )}
                  </div>

                  <div className="mt-5 border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/40">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-5 w-5 text-pink-400/75"
                      >
                        <path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762" />
                      </svg>
                      {tr("profileSections.relationships")}
                    </div>
                    <div className="relative mt-3 max-h-14 overflow-hidden">
                      <p className="m-0 text-sm leading-relaxed text-white/75">
                        {relationshipsLine1}
                      </p>
                      {!relationshipsLine1 && (
                        <div className="h-3 w-10/12 rounded bg-white/10" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-transparent via-black/20 to-black/35" />
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <p className="text-sm tracking-wide text-white/70">
                    {(() => {
                      try {
                        return t("profileReady");
                      } catch {
                        return "Your profile is ready.";
                      }
                    })()}
                  </p>
                </div>
              </div>
            </div>
        )}

        {/* CTA */}
        <div className="mt-8">
          <button
            onClick={handleUnlock}
            className={[
              "relative inline-flex w-full items-center justify-center rounded-[1.9rem] px-6 py-4 text-base font-semibold text-white",
              CTA_GRADIENT,
              "shadow-[0_20px_60px_rgba(99,102,241,0.28)]",
              "transition",
              "focus:outline-none focus:ring-4 focus:ring-indigo-400/30",
              "cursor-pointer",
              ].join(" ")}
          >
            {t("cta")} →
          </button>

          <p className="mt-4 text-center text-sm text-white/75">
            {t("note")}
          </p>
          <p className="mt-2 mb-1 text-center text-xs text-white/50">
            {(() => {
              const stripeNote = t("stripeNote");
              const stripeWord = "Stripe";

              if (!stripeNote.includes(stripeWord)) {
                return stripeNote;
              }

              const [before, ...rest] = stripeNote.split(stripeWord);
              const after = rest.join(stripeWord);

              return (
                <>
                  {before}
                  <a
                    href="https://stripe.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold transition hover:text-white/80"
                  >
                    Stripe
                  </a>
                  {after}
                </>
              );
            })()}
          </p>
          <p className="mt-8 text-center text-sm text-white/60">
            {(() => {
              try {
                return t("whatWillIGet");
              } catch {
                return "What will I get?";
              }
            })()}
          </p>

        </div>

        {/* 3 lines – same pattern as Home */}
        <div className="mt-7 space-y-4 text-sm leading-relaxed text-white/80">
          <div className="flex gap-3">
            <CheckIcon />
            <p className="m-0">{t("editorial.line1")}</p>
          </div>

          <div className="flex gap-3">
            <CheckIcon />
            <p className="m-0">{t("editorial.line2")}</p>
          </div>

          <div className="flex gap-3">
            <CheckIcon />
            <p className="m-0">{t("editorial.line3")}</p>
          </div>
        </div>

        <LegalFooter />        
      </div>

      {isRedirecting && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 backdrop-blur-md">
          <div className="flex flex-col items-center gap-4 px-8 py-7">
            <PremiumRingLoader />
            <p className="text-center text-sm font-medium text-white/85">
              {t("loading")}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
