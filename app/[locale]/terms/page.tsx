"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function TermsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0C14] px-6 sm:px-5 py-10 text-white">
      {/* Background (main-like blobs + overlay) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -left-40 h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute bottom-0 -right-40 h-[360px] w-[360px] rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="text-xs text-white/70 hover:text-white transition"
          >
            ← Back
          </Link>
          <div className="text-[11px] text-white/45">tellmejoe.</div>
        </div>

        <h1 className="text-xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-xs text-white/55">Last updated: 2026-02-12</p>
        <p className="mt-3 text-xs text-white/55">
          This document is provided in English. Translations may be provided for convenience only.
        </p>

        <article className="mt-7 text-sm text-white/70 leading-relaxed">
          <section className="pt-7 first:pt-0">
            <h2 className="text-base font-semibold text-white">1. Agreement to Terms</h2>
            <p className="mt-2">
              By accessing or using <span className="font-semibold text-white">tellmejoe.</span> (the “Service”), you
              agree to be bound by these Terms of Service (“Terms”). If you do not agree, do not use the Service.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">2. Who We Are</h2>
            <p className="mt-2">
              <span className="font-semibold text-white">tellmejoe.</span> is operated by an individual sole proprietor
              based in <span className="font-semibold text-white">Sweden</span> (“we”, “us”, “our”). For support, contact{" "}
              <a className="underline underline-offset-4 hover:text-white transition" href="mailto:support@hellotmj.com">
                support@hellotmj.com
              </a>
              .
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">3. Eligibility</h2>
            <p className="mt-2">
              You must be at least the age of majority in your country (or have permission from a parent/guardian) to
              purchase digital content from the Service.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">4. The Service and Important Disclaimer</h2>
            <p className="mt-2">
              The Service provides personality-test style content and results for informational and educational purposes.
            </p>

            <p className="mt-3">
              <span className="font-semibold text-white">Not medical or professional advice.</span> The Service is not a
              medical device and does not provide medical, psychological, or clinical diagnosis. It does not replace
              professional advice, therapy, counseling, or treatment. If you are experiencing distress or need
              professional support, seek help from a qualified professional.
            </p>

            <p className="mt-3">
              <span className="font-semibold text-white">No guarantees.</span> Results are generated based on your inputs
              and are inherently interpretive. We do not guarantee accuracy, completeness, or outcomes, and you should
              not rely on the Service as the sole basis for important decisions (e.g., health, legal, financial, or
              employment decisions).
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">5. Purchases and Payment</h2>
            <p className="mt-2">
              The Service may offer paid access to digital content (e.g., a full result or report) for a{" "}
              <span className="font-semibold text-white">one-time fee</span>. Prices are shown before checkout and again
              during payment.
            </p>
            <p className="mt-3">
              Payments are processed by <span className="font-semibold text-white">Stripe</span> or its payment partners.
              We do not store your full card details. Your payment may be subject to Stripe’s terms and policies.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">6. Refunds (7-Day, No-Questions-Asked)</h2>
            <p className="mt-2">
              You may request a refund within <span className="font-semibold text-white">7 days</span> of your purchase,{" "}
              <span className="font-semibold text-white">no questions asked</span>.
            </p>

            <ul className="mt-3 list-disc pl-5 space-y-2 text-[13px]">
              <li>
                Request by email:{" "}
                <a className="underline underline-offset-4 hover:text-white transition" href="mailto:support@hellotmj.com">
                  support@hellotmj.com
                </a>
              </li>
              <li>
                Include enough information to locate the transaction (e.g., Stripe receipt email, payment ID, or
                approximate purchase time).
              </li>
            </ul>

            <p className="mt-3">
              We aim to process eligible refunds within{" "}
              <span className="font-semibold text-white">3 business days</span>. Refunds are issued to the original
              payment method. Your bank/card issuer may take additional time to display the refund.
            </p>

            <p className="mt-3">
              <span className="font-semibold text-white">One refund per user:</span> We allow{" "}
              <span className="font-semibold text-white">one refund per user</span>. We may use reasonable methods to
              enforce this policy (for example, transaction identifiers and technical signals). Abuse of the refund
              policy may result in denial of further refund requests.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">7. License and Acceptable Use</h2>
            <p className="mt-2">
              We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service
              for personal, non-commercial use.
            </p>

            <p className="mt-3">You may not:</p>
            <ul className="mt-2 list-disc pl-5 space-y-2 text-[13px]">
              <li>copy, reproduce, distribute, sell, or exploit the Service or its content except as permitted by law;</li>
              <li>attempt to reverse engineer or interfere with the Service;</li>
              <li>use the Service to violate laws or the rights of others;</li>
              <li>scrape, automate, or overload the Service.</li>
            </ul>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">8. Intellectual Property</h2>
            <p className="mt-2">
              All content, design, questions, results, text, logos, and software related to the Service are owned by us
              or our licensors and are protected by intellectual property laws. “tellmejoe.” and associated branding may
              be trademarks.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">9. Availability and Changes</h2>
            <p className="mt-2">
              We may modify, suspend, or discontinue any part of the Service at any time. We do not guarantee
              uninterrupted availability.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">10. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, we will not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits, data, goodwill, or business interruption
              arising from or related to your use of (or inability to use) the Service.
            </p>
            <p className="mt-3">
              Our total liability for any claim arising out of or relating to the Service will not exceed the amount you
              paid to us for the relevant purchase (if any) in the{" "}
              <span className="font-semibold text-white">12 months</span> preceding the claim.
            </p>
            <p className="mt-3">
              Some jurisdictions do not allow certain limitations, so some of the above may not apply to you.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">11. Indemnity</h2>
            <p className="mt-2">
              You agree to indemnify and hold us harmless from claims, damages, liabilities, and expenses (including
              reasonable legal fees) arising out of your misuse of the Service or your violation of these Terms.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">12. Governing Law and Disputes</h2>
            <p className="mt-2">
              These Terms are governed by the laws of <span className="font-semibold text-white">Sweden</span>, without
              regard to conflict of laws rules. Any disputes shall be handled in the competent courts in Sweden, unless
              mandatory consumer laws in your country require otherwise.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">13. Changes to These Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. The “Last updated” date reflects the latest version.
              Continued use of the Service after changes means you accept the updated Terms.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">14. Contact</h2>
            <p className="mt-2">
              Support:{" "}
              <a className="underline underline-offset-4 hover:text-white transition" href="mailto:support@hellotmj.com">
                support@hellotmj.com
              </a>
            </p>
          </section>

          <footer className="pt-6">
            <p className="mt-10 text-center text-xs text-white/40">
              tellmejoe. TMJ © {new Date().getFullYear()}
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}