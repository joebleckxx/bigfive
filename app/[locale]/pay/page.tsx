"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "@/navigation";
import { track } from "@vercel/analytics";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";
import { calculateResult } from "@/lib/scoring";
import { AVATARS } from "@/lib/avatars";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { useLocale } from "next-intl";
import LegalFooter from "@/app/components/ui/legal-footer";
import { Brand } from "@/app/components/ui/logo";
import styles from "./pay.module.css";
import TMJBackground from "@/app/components/ui/background";

const PAID_KEY = "personality_paid_v1";
const PAID_AT_KEY = "personality_paid_at_v1"; // ✅ NEW
const ANSWERS_KEY = "personality_answers_v1";
const RESULT_KEY = "personality_result_v1";
const QUESTION_ORDER_KEY = "personality_question_order_v1";
const CHECKOUT_ATTEMPT_KEY = "personality_checkout_attempt_v1";
const CHECKOUT_CANCELED_TRACKED_KEY = "personality_checkout_canceled_tracked_v1";

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

function avatarIndexFromTypeCode(code: string) {
  const n = Number(code.replace("P", ""));
  return Number.isFinite(n) ? Math.max(0, Math.min(15, n - 1)) : 0;
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

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isCanceled = params.get("canceled") === "1";
      const hasAttemptId = !!sessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);
      const alreadyTracked =
        sessionStorage.getItem(CHECKOUT_CANCELED_TRACKED_KEY) === "true";

      if (!isCanceled || !hasAttemptId || alreadyTracked) return;

      track("checkout_canceled", { locale });
      sessionStorage.setItem(CHECKOUT_CANCELED_TRACKED_KEY, "true");
    } catch {
      // ignore
    }
  }, [locale]);

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
      sessionStorage.removeItem(CHECKOUT_CANCELED_TRACKED_KEY);
      track("checkout_started", { locale });

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
    ? AVATARS[avatarIndexFromTypeCode(previewTypeCode)]
    : AVATARS[0];

  const profileName = previewTypeCode ? tt(`${previewTypeCode}.name`) : "";
  const profileDesc = previewTypeCode ? tt(`${previewTypeCode}.desc`) : "";
  const noteParts = t("note").split("·").map((part) => part.trim()).filter(Boolean);
  const benefitCards = [
    {
      icon: "/icons/pay/benefit-traits.svg",
      iconAlt: "Trait scores icon",
      iconBgClass: "bg-[rgba(56,167,214,0.18)]",
      title: t("editorial.title1"),
      text: t("editorial.line1"),
    },
    {
      icon: "/icons/pay/benefit-strengths.svg",
      iconAlt: "Strengths icon",
      iconBgClass: "bg-[rgba(170,85,247,0.17)]",
      title: t("editorial.title2"),
      text: t("editorial.line2"),
    },
    {
      icon: "/icons/pay/benefit-balance.svg",
      iconAlt: "Balance icon",
      iconBgClass: "bg-[rgba(129,99,246,0.17)]",
      title: t("editorial.title3"),
      text: t("editorial.line3"),
    },
  ];
  const headlineBeforeWords = t("headline.before").trim().split(/\s+/);
  const headlineLine1 = headlineBeforeWords[0] ?? "";
  const headlineLine2 = headlineBeforeWords.slice(1, -1).join(" ");
  const headlineLine3Accent = headlineBeforeWords.at(-1) ?? "";
  const headlineLine3 = t("headline.accent");
  const stripeLabel = t("stripeLabel");

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#0b0c14] tmj-page-gutter py-10 text-white"
    >
      <TMJBackground />

      <div className="tmj-container">
        <div className="flex items-center justify-between gap-3">
          <Brand />

          <LanguageSwitcher />
        </div>

        <div className={styles.readyStatus}>
          <div className={styles.reportMark} aria-hidden="true">
            <svg viewBox="0 0 64 72" fill="none">
              <rect x="17" y="7" width="38" height="51" rx="7" transform="rotate(10 17 7)" fill="#302348" stroke="#8361bc" />
              <rect x="10" y="10" width="38" height="51" rx="7" fill="#211b32" stroke="#b49ae4" />
              <path d="M18 24h22M18 32h15M18 44h4M27 44h4M36 44h4" stroke="#c6aff1" strokeWidth="2" strokeLinecap="round" />
              <circle cx="45" cy="53" r="11" fill="#8b43ed" stroke="#c19aff" />
              <path d="m40 53 3 3 6-7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p>{t("profileReady")}</p>
        </div>

        <h1 className="mt-10 text-center text-[clamp(3.35rem,15.8vw,4.41rem)] font-bold leading-[1] tracking-[-0.05em] text-[#E8ECFF]">
          <span className="block">{headlineLine1}</span>
          {headlineLine2 && <span className="mt-2 block">{headlineLine2}</span>}
          <span className={styles.headlineAccent}>
            {headlineLine3Accent} {headlineLine3}
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-[23rem] text-center text-[1.14rem] leading-[1.72] tracking-[-0.02em] text-[#C7CAE0] sm:max-w-[24.5rem] sm:text-[1.2rem]">
          {t("description")}
        </p>

        {previewTypeCode && (
          <div className="relative mt-16 overflow-hidden rounded-[2.35rem] border border-white/[0.03] bg-[var(--tmj-surface)] px-6 pt-5 pb-0 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_48px_rgba(0,0,0,0.28),0_0_42px_rgba(82,212,255,0.08)] sm:px-8">
            <div className="flex min-h-[28rem] flex-col items-center justify-center py-10 text-center blur-[3.5px] opacity-85">
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-white/42">
                {t("primaryArchetype")}
              </div>

              <div className="relative mt-6 shrink-0">
                <div className="pointer-events-none absolute -inset-4 rounded-full bg-black/20 blur-2xl" />
                <div
                  role="img"
                  aria-label={profileName}
                  className="relative z-10 flex h-34 w-34 shrink-0 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/10"
                >
                  {!avatarError ? (
                    <Image
                      src={avatarSrc}
                      alt=""
                      width={256}
                      height={256}
                      className="h-34 w-34 object-contain"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="text-3xl font-semibold text-white"
                    >
                      {profileName?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0 text-center">
                <div className="mt-6 text-[2.6rem] font-semibold tracking-tight text-white">
                  {profileName}
                </div>
                <div className="mx-auto mt-3 max-w-[20rem] text-[1.02rem] leading-relaxed text-white/72 italic">
                  {profileDesc}
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-b from-transparent via-black/14 to-black/26" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center sm:px-8">
              <div className={styles.purchaseGroup}>
              <div className={styles.price}>{t("onlyOneDollarAmount")}</div>
              <button
                onClick={handleUnlock}
                className={[
                  "relative inline-flex w-full max-w-[20rem] min-w-0 items-center justify-center gap-3 rounded-full px-4 py-5 text-[1.05rem] font-bold text-[#09101D]",
                  "bg-[image:var(--tmj-action-gradient)]",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_35px_rgba(0,198,76,0.16),0_0_70px_rgba(0,184,137,0.10)]",
                  "transition-transform duration-200 hover:scale-[1.01]",
                  "focus:outline-none focus:ring-4 focus:ring-indigo-400/30",
                  "cursor-pointer",
                ].join(" ")}
              >
                <Image
                  src="/icons/pay/cta-icon.svg"
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  className="h-[1.125rem] w-[1.125rem]"
                />
                <span>{t("cta")}</span>
              </button>
              <div className="flex items-center justify-center gap-2">
                <Image
                  src="/icons/pay/secure-checkout.svg"
                  alt=""
                  aria-hidden="true"
                  width={16}
                  height={16}
                  className="h-4 w-4 opacity-100"
                />
                <p className="m-0 text-center text-[0.82rem] font-medium text-[rgba(255,255,255,0.88)]">
                  {(() => {
                    const stripeNote = t("stripeNote");
                    const stripeWord = stripeLabel;

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
              </div>
              </div>
            </div>
          </div>
        )}

        <div className={styles.paymentTerms}>
          <span>{noteParts[0]}</span>
          <span className={styles.paymentDivider} aria-hidden="true">·</span>
          <span>{noteParts[1]}</span>
        </div>

        <section className={styles.benefits} aria-labelledby="pay-benefits-title">
          <h2 id="pay-benefits-title" className={styles.sectionTitle}>{t("whatWillIGet")}</h2>
          <ol className={styles.benefitList}>
            {benefitCards.map((card, index) => (
              <li key={card.title} className={styles.benefit}>
                <span className={styles.step} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.socialProof}>
          <Image
            src="/graphics/community-portraits.png"
            alt=""
            width={1600}
            height={520}
            sizes="(max-width: 640px) 78vw, 360px"
            className={styles.communityPortraits}
          />
          <div className={styles.socialCount}>
            {t("socialProofCount").replace("+", "").toUpperCase()}<sup>+</sup>
          </div>
          <p>{t("socialProof")}</p>
        </section>

        <div className="mt-12">
          <LegalFooter />
        </div>
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
