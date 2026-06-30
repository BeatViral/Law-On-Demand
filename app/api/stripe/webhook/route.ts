import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET_KEY;

  if (secret && stripeSecret && signature) {
    const stripe = new Stripe(stripeSecret);
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      return NextResponse.json({ received: true, type: event.type });
    } catch {
      return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
    }
  }

  return NextResponse.json({ received: true, mode: "demo" });
}
