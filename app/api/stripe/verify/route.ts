import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json({ paid: false, error: "missing_session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid = session.payment_status === "paid";
    const paidAt = session.created ? session.created * 1000 : Date.now();

    return NextResponse.json({ paid, paidAt });
  } catch (e) {
    console.error("STRIPE VERIFY ERROR:", e);
    return NextResponse.json({ paid: false, error: "verify_failed" }, { status: 500 });
  }
}