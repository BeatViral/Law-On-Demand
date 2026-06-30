import { NextResponse } from "next/server";
import { createAgreement } from "@/lib/workflows";
import type { CaseRecord } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    caseRecord?: CaseRecord;
    signature?: string;
  };

  if (!body.caseRecord || !body.signature?.trim()) {
    return NextResponse.json({ error: "Case and signature are required." }, { status: 400 });
  }

  return NextResponse.json(createAgreement(body.caseRecord, body.signature.trim()));
}
