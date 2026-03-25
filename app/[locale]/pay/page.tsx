"use client";

import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";
import { QUESTIONS } from "@/lib/personality";
import { calculateResult } from "@/lib/scoring";
import { AVATARS } from "@/lib/avatars";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { useLocale } from "next-intl";
import LegalFooter from "@/app/components/ui/legal-footer";
import TMJBackground from "@/app/components/ui/background";

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
  const th = useTranslations("Home");
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
    ? AVATARS[avatarIndexFromTypeCode(previewTypeCode)]
    : AVATARS[0];
  const socialProofAvatars = [
    "/images/pay/social-proof-01.png",
    "/images/pay/social-proof-02.png",
    "/images/pay/social-proof-03.png",
  ];

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
      className="relative min-h-screen overflow-hidden bg-[#02030A] px-6 sm:px-5 py-10 text-white"
    >
      <TMJBackground />

      <div className="relative mx-auto w-full max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div className="leading-tight">
            <Link
              href="/"
              className="bg-[linear-gradient(90deg,#57D6FF_0%,#7CB6FF_42%,#C08CFF_72%,#F08CFF_100%)] bg-clip-text text-sm font-bold tracking-tight text-transparent"
            >
              {th("brand.title")}
            </Link>
          </div>

          <LanguageSwitcher />
        </div>

        <div className="mt-18 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-white/[0.04] bg-[#2A1C4D]/95 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_40px_rgba(0,0,0,0.16)]">
            <span className="text-[0.78rem] font-bold tracking-[0.16em] text-[#C57EFF]">
              {t("badge")}
            </span>
          </div>
        </div>

        <h1 className="mt-10 text-center text-[clamp(3.35rem,15.8vw,4.41rem)] font-bold leading-[1] tracking-[-0.05em] text-[#E8ECFF]">
          <span className="block">{headlineLine1}</span>
          <span className="mt-2 block">{headlineLine2}</span>
          <span className="mt-2 block">
            <span className="bg-[linear-gradient(90deg,#4ED8FF_0%,#66C6FF_30%,#7EAAFF_68%,#B38CFF_100%)] bg-clip-text text-transparent">
              {headlineLine3Accent}
            </span>
            {" "}
            <span className="bg-[linear-gradient(90deg,#9A7BFF_0%,#C57EFF_52%,#F08CFF_100%)] bg-clip-text text-transparent">
              {headlineLine3}
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-8 max-w-[23rem] text-center text-[1.14rem] leading-[1.72] tracking-[-0.02em] text-[#C7CAE0] sm:max-w-[24.5rem] sm:text-[1.2rem]">
          {t("description")}
        </p>

        {previewTypeCode && (
          <div className="relative mt-16 overflow-hidden rounded-[2.35rem] border border-white/[0.03] bg-[#071126]/88 px-6 pt-5 pb-0 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_48px_rgba(0,0,0,0.28),0_0_42px_rgba(82,212,255,0.08)] sm:px-8">
            <div className="flex min-h-[28rem] flex-col items-center justify-center py-10 text-center blur-[3.5px] opacity-85">
              <div className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-white/42">
                {t("primaryArchetype")}
              </div>

              <div className="relative mt-6 shrink-0">
                <div className="pointer-events-none absolute -inset-4 rounded-full bg-black/20 blur-2xl" />
                <div
                  role="img"
                  aria-label={profileName}
                  className="relative z-10 flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-black/25 ring-1 ring-white/10"
                >
                  {!avatarError ? (
                    <Image
                      src={avatarSrc}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 object-contain"
                      style={{ filter: "brightness(0) invert(1)" }}
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
              <button
                onClick={handleUnlock}
                className={[
                  "relative inline-flex min-w-[16.5rem] items-center justify-center gap-3 rounded-full px-8 py-5 text-[1.05rem] font-bold text-[#09101D]",
                  "bg-[linear-gradient(90deg,#52D4FF_0%,#79C1FF_32%,#B79FFF_69%,#F087EE_100%)]",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_35px_rgba(199,110,255,0.22),0_0_70px_rgba(79,206,255,0.14)]",
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
        )}

        <div className={`${previewTypeCode ? "mt-10" : "mt-16"} text-center`}>
          <div className="mx-auto grid w-full min-w-0 grid-cols-2 gap-3.5">
            <div className="min-w-0 rounded-[1.8rem] border border-white/[0.04] bg-[rgba(15,24,46,0.74)] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_20px_45px_rgba(0,0,0,0.18)]">
              <div className="relative flex h-11 items-center">
                {socialProofAvatars.map((src, index) => (
                <div
                  key={src}
                  className={`${index === 0 ? "" : "-ml-3"} relative z-0 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 border-[#0B1730] bg-[#121C34] shadow-[0_8px_18px_rgba(0,0,0,0.18)]`}
                >
                    <Image
                      src={src}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                ))}
                <div className="-ml-3 relative z-10 flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#0B1730] bg-[#9A5FFF] text-[1rem] font-semibold tracking-tight text-white shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
                  {t("socialProofCount")}
                </div>
              </div>
              <p className="mt-5 m-0 max-w-[10.5rem] text-[0.98rem] font-medium leading-[1.35] tracking-[-0.03em] text-white/80">
                {t("socialProof")}
              </p>
            </div>

            <div className="min-w-0 rounded-[1.8rem] border border-white/[0.04] bg-[rgba(15,24,46,0.74)] px-4 py-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_20px_45px_rgba(0,0,0,0.18)]">
              <div className="flex min-h-[8.25rem] flex-col justify-center gap-4">
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/icons/pay/one-time-payment.svg"
                  alt=""
                  aria-hidden="true"
                  width={20}
                  height={20}
                  className="h-5 w-5 opacity-100"
                />
                <span className="text-[0.92rem] font-medium text-white/80">
                  {noteParts[0]}
                </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/icons/pay/no-subscription.svg"
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="h-5 w-5 opacity-100"
                  />
                  <span className="text-[0.92rem] font-medium text-white/80">
                    {noteParts[1]}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Image
                    src="/icons/pay/only-one-dollar.svg"
                    alt=""
                    aria-hidden="true"
                    width={20}
                    height={20}
                    className="h-5 w-5 opacity-100"
                  />
                  <span className="text-[0.92rem] text-white/80">
                    {t("onlyOneDollarPrefix")} <span className="font-bold">{t("onlyOneDollarAmount")}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-12 text-center text-[0.76rem] font-medium tracking-[0.18em] text-white/90 uppercase">
            {t("whatWillIGet")}
          </p>

        </div>

        <div className="mt-10 space-y-3.5">
          {benefitCards.map((card) => (
            <div
              key={card.text}
              className="flex items-center gap-4 rounded-[2rem] border border-white/[0.04] bg-[#071126]/95 px-5 py-5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_24px_56px_rgba(0,0,0,0.22)]"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${card.iconBgClass}`}>
                <Image
                  src={card.icon}
                  alt={card.iconAlt}
                  aria-hidden="true"
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0"
                />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[1rem] font-bold leading-snug text-white/88">
                  {card.title}
                </p>
                <p className="mt-2 m-0 text-sm leading-relaxed text-white/80">
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>

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
