import { createHash } from "node:crypto";
import { PostHog } from "posthog-node";
import type Stripe from "stripe";
import { ANALYTICS_VERSION, POSTHOG_HOST, POSTHOG_KEY } from "./analytics-config";

export function paymentCapture(session: Stripe.Checkout.Session) {
  // Stable UUID and timestamp make webhook retries the same PostHog event.
  const hex = createHash("sha256").update(`tmj:payment_paid:${session.id}`).digest("hex");
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  return {
    distinctId: session.metadata?.posthog_distinct_id || `stripe:${session.id}`,
    event: "payment_paid",
    uuid,
    timestamp: new Date(session.created * 1000),
    properties: {
      locale: session.metadata?.locale || "unknown",
      test_attempt_id: session.metadata?.test_attempt_id || null,
      checkout_attempt_id: session.client_reference_id,
      stripe_session_id: session.id,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency,
      analytics_version: ANALYTICS_VERSION,
      environment: process.env.VERCEL_ENV || "development",
      integration_test: !session.livemode || session.metadata?.analytics_test === "true",
      $process_person_profile: false,
      $geoip_disable: true,
    },
  };
}

export async function capturePayment(session: Stripe.Checkout.Session) {
  if (session.metadata?.posthog_disabled === "true") return;
  const ph = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0, requestTimeout: 5000, fetchRetryCount: 1 });
  try { await ph.captureImmediate(paymentCapture(session)); }
  finally { await ph.shutdown(); }
}
