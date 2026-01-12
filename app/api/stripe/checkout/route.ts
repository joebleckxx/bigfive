import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { locale } = await req.json().catch(() => ({ locale: "en" }));

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${appUrl}/${locale}/result?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${locale}/pay`
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
  console.error("STRIPE CHECKOUT ERROR:", e);
  return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}