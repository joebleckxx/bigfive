import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { locale, checkoutAttemptId } = await req
      .json()
      .catch(() => ({ locale: "en", checkoutAttemptId: null }));

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
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
