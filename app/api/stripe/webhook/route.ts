import Stripe from "stripe";
import { NextResponse } from "next/server";
import { track } from "@vercel/analytics/server";
import { capturePayment } from "@/lib/analytics-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json(
      { error: "missing_stripe_signature" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "missing_webhook_secret" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const body = await req.text(); // RAW body – bardzo ważne
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status !== "paid") return NextResponse.json({ received: true });

    try {
      await capturePayment(session);
    } catch (error) {
      console.error("PostHog payment delivery failed; Stripe should retry", error);
      return NextResponse.json({ error: "analytics_delivery_failed" }, { status: 503 });
    }
    // A Vercel analytics failure must not make Stripe retry an already captured payment.
    try {
      if (session.livemode && session.metadata?.analytics_test !== "true") await track("payment_paid", {
        locale: session.metadata?.locale ?? "unknown",
        amount: (session.amount_total ?? 0) / 100
      });
    } catch (error) { console.error("Vercel payment analytics failed", error); }
  }

  return NextResponse.json({ received: true });
}
