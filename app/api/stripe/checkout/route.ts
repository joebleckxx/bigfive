import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { locale, checkoutAttemptId, analytics } = await req
      .json()
      .catch(() => ({ locale: "en", checkoutAttemptId: null }));

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      metadata: {
        locale: typeof locale === "string" && locale.length > 0 ? locale : "unknown",
        ...(typeof analytics?.distinctId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(analytics.distinctId)
          ? { posthog_distinct_id: analytics.distinctId } : {}),
        ...(typeof analytics?.testAttemptId === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(analytics.testAttemptId)
          ? { test_attempt_id: analytics.testAttemptId } : {}),
        posthog_disabled: analytics?.enabled === false ? "true" : "false",
        analytics_test: analytics?.isTest === true ? "true" : "false"
      },
      client_reference_id:
        typeof checkoutAttemptId === "string" &&
        checkoutAttemptId.length > 0 &&
        checkoutAttemptId.length <= 255
          ? checkoutAttemptId
          : undefined,

      // ✅ Jedyna kluczowa zmiana dla metod płatności:
      // Apple Pay / Google Pay pojawią się jako "card wallets", a znikają dziwne metody.
      payment_method_types: ["card"],

      success_url: `${appUrl}/${locale}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/pay?canceled=1`
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("STRIPE CHECKOUT ERROR:", e);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
