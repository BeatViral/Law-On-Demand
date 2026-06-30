import { NextResponse } from "next/server";
import { acceptEngagement, createCasePacket, createCaseRecord } from "@/lib/workflows";
import type { Agreement, CaseRecord, Payment } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "accept";
    attorneyId?: string;
    legalCategoryId?: string;
    caseRecord?: CaseRecord;
    agreement?: Agreement;
    payment?: Payment;
  };

  if (body.action === "accept") {
    if (!body.caseRecord || !body.agreement) {
      return NextResponse.json({ error: "Case and agreement are required." }, { status: 400 });
    }

    const accepted = acceptEngagement(body.caseRecord, body.agreement, body.payment);
    const packet = createCasePacket(accepted.caseRecord, accepted.agreement, body.payment);

    return NextResponse.json({
      ...accepted,
      packet
    });
  }

  if (!body.attorneyId || !body.legalCategoryId) {
    return NextResponse.json({ error: "Attorney and category are required." }, { status: 400 });
  }

  return NextResponse.json(createCaseRecord(body.attorneyId, body.legalCategoryId));
}
