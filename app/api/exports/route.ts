import { NextResponse } from "next/server";
import { demoClient, attorneys, legalCategories } from "@/lib/data";
import type { Agreement, CaseRecord, Payment } from "@/lib/types";
import { createAgreement, createCasePacket, createCaseRecord, createPayment } from "@/lib/workflows";

const isStaticExport = process.env.STATIC_EXPORT === "true";

function escapePdfText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]) {
  const text = lines
    .slice(0, 26)
    .map((line, index) => `BT /F1 12 Tf 54 ${750 - index * 24} Td (${escapePdfText(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${text.length} >> stream\n${text}\nendstream endobj`
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

export async function GET(request: Request) {
  const url = isStaticExport ? null : new URL(request.url);
  const format = url?.searchParams.get("format") ?? "json";
  const attorney = attorneys[0];
  const category = legalCategories[0];
  const caseRecord: CaseRecord = {
    ...createCaseRecord(attorney.id, category.id),
    id: url?.searchParams.get("caseId") ?? "case_demo_export",
    status: "represented",
    attorneyAcceptanceStatus: "accepted"
  };
  const agreement: Agreement = {
    ...createAgreement(caseRecord, demoClient.name),
    attorneyAccepted: true,
    fullyExecuted: true
  };
  const payment: Payment = createPayment(caseRecord, "succeeded");
  const packet = createCasePacket(caseRecord, agreement, payment);

  if (format === "pdf") {
    const pdf = buildSimplePdf([
      "Lawyer On Demand Case Packet",
      `Reference: ${packet.reference}`,
      `Client: ${packet.client.name}`,
      `Client phone: ${packet.client.phone}`,
      `Attorney: ${packet.attorney.name}`,
      `Firm: ${packet.attorney.firmName}`,
      `Matter: ${packet.matter.category}`,
      `Fee model: ${packet.matter.feeModel}`,
      `Agreement: ${packet.agreement.agreementType}`,
      `Fully executed: ${String(packet.agreement.fullyExecuted)}`,
      `Payment status: ${packet.payment.status}`,
      "Recording: Placeholder only; enable with compliant consent.",
      "Next steps:",
      ...packet.nextSteps.map((step) => `- ${step}`)
    ]);

    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${packet.reference}.pdf"`
      }
    });
  }

  return NextResponse.json(packet, {
    headers: {
      "Content-Disposition": `attachment; filename="${packet.reference}.json"`
    }
  });
}
