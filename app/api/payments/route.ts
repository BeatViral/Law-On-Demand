import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAttorneyById } from "@/lib/data";
import type { CaseRecord, Payment } from "@/lib/types";
import { createPayment, getPracticeArea, requiresRetainer } from "@/lib/workflows";
import { makeId, nowIso } from "@/lib/utils";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    caseRecord?: CaseRecord;
    customerId?: string;
    paymentMethodId?: string;
  };

  if (!body.caseRecord) {
    return NextResponse.json({ error: "Case is required." }, { status: 400 });
  }

  if (!requiresRetainer(body.caseRecord.feeModel)) {
    return NextResponse.json(createPayment(body.caseRecord, "not_required"));
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const attorney = getAttorneyById(body.caseRecord.attorneyId);
  const area = attorney ? getPracticeArea(attorney, body.caseRecord.legalCategoryId) : null;
  const amount = area?.retainerAmount ?? 0;

  if (secretKey && body.customerId && body.paymentMethodId && !body.paymentMethodId.startsWith("pm_demo")) {
    const stripe = new Stripe(secretKey);
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: body.customerId,
      payment_method: body.paymentMethodId,
      confirm: true,
      off_session: true,
      metadata: {
        caseId: body.caseRecord.id,
        attorneyId: body.caseRecord.attorneyId,
        platform: "lawyer_on_demand"
      }
    });

    const payment: Payment = {
      id: makeId("pay"),
      caseId: body.caseRecord.id,
      clientId: body.caseRecord.clientId,
      attorneyId: body.caseRecord.attorneyId,
      stripePaymentIntentId: intent.id,
      amount,
      currency: "usd",
      paymentType: "retainer",
      status: intent.status === "succeeded" ? "succeeded" : "processing",
      createdAt: nowIso()
    };

    return NextResponse.json(payment);
  }

  return NextResponse.json(createPayment(body.caseRecord, "succeeded"));
}
