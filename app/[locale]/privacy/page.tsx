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

        <h1 className="text-xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-xs text-white/55">Last updated: 2026-02-12</p>
        <p className="mt-3 text-xs text-white/55">
          This document is provided in English. Translations may be provided for convenience only.
        </p>

        <article className="mt-7 text-sm text-white/70 leading-relaxed">
          <section className="pt-7 first:pt-0">
            <h2 className="text-base font-semibold text-white">1. Introduction</h2>
            <p className="mt-2">
              This Privacy Policy explains how <span className="font-semibold text-white">tellmejoe.</span> (“we”, “us”,
              “our”) handles information when you use our Service. We aim to collect as little personal data as possible.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">2. Key Principle: Your Quiz Data Stays in Your Browser</h2>
            <p className="mt-2">
              We do <span className="font-semibold text-white">not</span> collect or store your quiz answers or results on
              our servers. Your quiz progress and results may be stored using your browser’s{" "}
              <span className="font-semibold text-white">local storage</span> on your device, and do not leave your browser
              unless you choose to share them.
            </p>
            <p className="mt-3">
              You can delete this data at any time by clearing your browser’s site data / storage.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">3. Information We May Collect</h2>

            <div className="mt-3 space-y-5">
              <div>
                <h3 className="text-[13px] font-semibold text-white">A) Device and usage data (analytics)</h3>
                <p className="mt-2">
                  We use <span className="font-semibold text-white">Vercel Analytics</span> to understand performance and
                  usage (e.g., page views, device type, general usage metrics). This data is used to improve reliability
                  and user experience.
                </p>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-white">B) Payment-related information</h3>
                <p className="mt-2">
                  If you purchase access, payments are processed by <span className="font-semibold text-white">Stripe</span>.
                  Stripe may collect and process information such as payment method details, billing country, and transaction
                  identifiers. We may receive limited information necessary to provide the purchase and support refunds
                  (e.g., confirmation that a payment succeeded, transaction ID, amount, currency).
                </p>
                <p className="mt-2">We do not receive or store full card numbers.</p>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-white">C) Support communications</h3>
                <p className="mt-2">
                  If you email us, we will process the content of your message and your email address to respond and handle
                  requests (including refunds).
                </p>
              </div>
            </div>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">4. How We Use Information</h2>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-[13px]">
              <li>operate and maintain the Service;</li>
              <li>process purchases and refunds;</li>
              <li>respond to support inquiries;</li>
              <li>monitor performance and prevent abuse;</li>
              <li>comply with legal obligations.</li>
            </ul>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">5. Legal Bases (GDPR)</h2>
            <p className="mt-2">Where GDPR applies, we rely on:</p>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-[13px]">
              <li>
                <span className="font-semibold text-white">Contract</span> (to deliver the purchased digital content and
                process refunds);
              </li>
              <li>
                <span className="font-semibold text-white">Legitimate interests</span> (to secure and improve the Service,
                prevent fraud/abuse, run analytics);
              </li>
              <li>
                <span className="font-semibold text-white">Legal obligations</span> (e.g., accounting requirements related
                to transactions);
              </li>
              <li>
                <span className="font-semibold text-white">Consent</span> where required by law (e.g., certain
                cookies/tracking, if introduced later).
              </li>
            </ul>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">6. Sharing and Third Parties</h2>
            <p className="mt-2">We share information with:</p>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-[13px]">
              <li><span className="font-semibold text-white">Stripe</span> (payment processing and refunds);</li>
              <li><span className="font-semibold text-white">Vercel</span> (hosting and analytics);</li>
              <li>service providers assisting with operation and security (if used).</li>
            </ul>
            <p className="mt-3">We do not sell your personal data.</p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">7. International Transfers</h2>
            <p className="mt-2">
              Because we use providers that may process data outside the EU/EEA, your information may be transferred
              internationally. Where required, we rely on appropriate safeguards such as standard contractual clauses.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">8. Data Retention</h2>
            <ul className="mt-3 list-disc pl-5 space-y-2 text-[13px]">
              <li>
                <span className="font-semibold text-white">Quiz results/answers:</span> stored locally on your device (local
                storage). We do not retain them on our servers.
              </li>
              <li>
                <span className="font-semibold text-white">Payments:</span> transaction records may be retained as required
                for accounting, tax, and fraud prevention.
              </li>
              <li>
                <span className="font-semibold text-white">Support emails:</span> retained as needed to address your request
                and for record-keeping.
              </li>
            </ul>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">9. Your Rights</h2>
            <p className="mt-2">
              Where applicable, you may have rights to access, correct, delete, or restrict processing of your personal
              data, and to object to certain processing. You may also have the right to lodge a complaint with your
              supervisory authority.
            </p>
            <p className="mt-3">
              To exercise rights, contact{" "}
              <a className="underline underline-offset-4 hover:text-white transition" href="mailto:support@hellotmj.com">
                support@hellotmj.com
              </a>
              .
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">10. Security</h2>
            <p className="mt-2">
              We use reasonable administrative and technical measures to protect information. No online service can be
              100% secure.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">11. Children’s Privacy</h2>
            <p className="mt-2">
              The Service is not intended for children under the age where parental consent is required under applicable
              law. If you believe a child has provided personal data to us, contact us.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">12. Changes to This Policy</h2>
            <p className="mt-2">
              We may update this Privacy Policy from time to time. The “Last updated” date reflects the latest version.
            </p>
          </section>

          <section className="pt-7">
            <h2 className="text-base font-semibold text-white">13. Contact</h2>
            <p className="mt-2">
              Contact:{" "}
              <a className="underline underline-offset-4 hover:text-white transition" href="mailto:support@hellotmj.com">
                support@hellotmj.com
              </a>
            </p>
          </section>

          <footer className="pt-8">
            <p className="mt-10 text-center text-xs text-white/40">
              tellmejoe. TMJ © {new Date().getFullYear()}
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}