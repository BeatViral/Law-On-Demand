import { attorneys, demoClient, getAttorneyById, getCategoryById, legalCategories } from "./data";
import type {
  Agreement,
  AgreementType,
  Attorney,
  CasePacket,
  CaseRecord,
  FeeModel,
  Payment,
  PracticeArea
} from "./types";
import { formatCurrency, makeId, nowIso } from "./utils";

export function getPracticeArea(attorney: Attorney, legalCategoryId: string): PracticeArea {
  const category = getCategoryById(legalCategoryId);
  const practiceArea = attorney.practiceAreas.find((area) => area.legalCategoryId === legalCategoryId);

  if (practiceArea) return practiceArea;

  return {
    legalCategoryId,
    feeModel: category?.defaultFeeModel ?? "custom",
    retainerRequired: category?.defaultFeeModel === "retainer",
    retainerAmount: category?.defaultFeeModel === "retainer" ? 1500 : null,
    contingencyPercentage: category?.defaultFeeModel === "contingency" ? 33 : null,
    preliminaryGuidanceMinutes: 5,
    customFeeText: "Attorney will confirm fee terms before formal engagement."
  };
}

export function requiresRetainer(feeModel: FeeModel) {
  return feeModel === "retainer";
}

export function agreementTypeForFeeModel(feeModel: FeeModel): AgreementType {
  if (feeModel === "retainer") return "retainer_agreement";
  if (feeModel === "contingency") return "contingency_fee_agreement";
  if (feeModel === "no_retainer") return "limited_scope_representation_agreement";
  if (feeModel === "free_initial_review") return "consultation_agreement";
  return "custom_attorney_client_agreement";
}

export function createCaseRecord(attorneyId: string, legalCategoryId: string): CaseRecord {
  const attorney = getAttorneyById(attorneyId);
  if (!attorney) throw new Error("Attorney not found");
  const category = getCategoryById(legalCategoryId);
  const area = getPracticeArea(attorney, legalCategoryId);
  const timestamp = nowIso();

  return {
    id: makeId("case"),
    clientId: demoClient.id,
    attorneyId,
    legalCategoryId,
    matterType: category?.name ?? "Other Legal Help",
    feeModel: area.feeModel,
    status: "signature_pending",
    attorneyAcceptanceStatus: "not_requested",
    incidentLocation: "Current user location",
    incidentTime: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function generateAgreementText(caseRecord: CaseRecord, attorney: Attorney) {
  const area = getPracticeArea(attorney, caseRecord.legalCategoryId);
  const category = getCategoryById(caseRecord.legalCategoryId);
  const feeCopy =
    area.feeModel === "retainer"
      ? `A retainer of ${formatCurrency(area.retainerAmount)} is required after the client signs and before the attorney may accept the engagement.`
      : area.feeModel === "contingency"
        ? `No upfront retainer is required. The attorney may work on a contingency fee currently configured at ${area.contingencyPercentage ?? 33}% of qualifying recovery, subject to final attorney acceptance.`
        : "No upfront retainer is required unless the attorney later presents a custom written fee term accepted by the client.";

  return [
    `Law On Demand ${agreementTypeForFeeModel(area.feeModel).replaceAll("_", " ")}.`,
    `Client: ${demoClient.name}. Attorney: ${attorney.name}, ${attorney.firmName}. Matter: ${category?.name ?? caseRecord.matterType}.`,
    "The call before this agreement was a preliminary guidance call only. Full legal representation does not begin from the call itself.",
    feeCopy,
    "This agreement becomes fully executed only after the client signs electronically, required retainer payment succeeds if applicable, and the attorney accepts the engagement.",
    "Attorney acceptance is required before representation begins. The platform does not independently create an attorney-client relationship.",
    "Recording support is placeholder-only in this MVP and must be enabled only when legally compliant with all required consent rules."
  ].join("\n\n");
}

export function createAgreement(caseRecord: CaseRecord, signature?: string): Agreement {
  const attorney = getAttorneyById(caseRecord.attorneyId);
  if (!attorney) throw new Error("Attorney not found");
  const timestamp = nowIso();

  return {
    id: makeId("agr"),
    caseId: caseRecord.id,
    clientId: caseRecord.clientId,
    attorneyId: caseRecord.attorneyId,
    agreementType: agreementTypeForFeeModel(caseRecord.feeModel),
    agreementText: generateAgreementText(caseRecord, attorney),
    signedByClient: Boolean(signature),
    clientSignature: signature,
    clientSignedAt: signature ? timestamp : undefined,
    attorneyAccepted: false,
    fullyExecuted: false,
    pdfUrl: `/api/exports?caseId=${caseRecord.id}&format=pdf`,
    createdAt: timestamp
  };
}

export function createPayment(caseRecord: CaseRecord, status: Payment["status"] = "succeeded"): Payment {
  const attorney = getAttorneyById(caseRecord.attorneyId);
  if (!attorney) throw new Error("Attorney not found");
  const area = getPracticeArea(attorney, caseRecord.legalCategoryId);

  return {
    id: makeId("pay"),
    caseId: caseRecord.id,
    clientId: caseRecord.clientId,
    attorneyId: caseRecord.attorneyId,
    stripePaymentIntentId: requiresRetainer(caseRecord.feeModel) ? makeId("pi_demo") : undefined,
    amount: requiresRetainer(caseRecord.feeModel) ? area.retainerAmount ?? 0 : 0,
    currency: "usd",
    paymentType: "retainer",
    status: requiresRetainer(caseRecord.feeModel) ? status : "not_required",
    createdAt: nowIso()
  };
}

export function canAttorneyAccept(caseRecord: CaseRecord, agreement: Agreement, payment?: Payment) {
  if (!agreement.signedByClient) return false;
  if (requiresRetainer(caseRecord.feeModel)) return payment?.status === "succeeded";
  return true;
}

export function acceptEngagement(caseRecord: CaseRecord, agreement: Agreement, payment?: Payment) {
  if (!canAttorneyAccept(caseRecord, agreement, payment)) {
    throw new Error("Attorney cannot accept until signature and required payment are complete.");
  }

  const timestamp = nowIso();
  return {
    caseRecord: {
      ...caseRecord,
      status: "represented" as const,
      attorneyAcceptanceStatus: "accepted" as const,
      representationStartedAt: timestamp,
      updatedAt: timestamp
    },
    agreement: {
      ...agreement,
      attorneyAccepted: true,
      attorneyAcceptedAt: timestamp,
      fullyExecuted: true,
      fullyExecutedAt: timestamp
    }
  };
}

export function createCasePacket(caseRecord: CaseRecord, agreement: Agreement, payment?: Payment): CasePacket {
  const attorney = getAttorneyById(caseRecord.attorneyId) ?? attorneys[0];
  const category = getCategoryById(caseRecord.legalCategoryId) ?? legalCategories[0];

  return {
    caseId: caseRecord.id,
    reference: `LOD-${caseRecord.id.slice(-6).toUpperCase()}`,
    client: {
      name: demoClient.name,
      email: demoClient.email,
      phone: demoClient.phone,
      preferredLanguage: demoClient.preferredLanguage
    },
    attorney: {
      name: attorney.name,
      firmName: attorney.firmName,
      email: attorney.email,
      phone: attorney.phone,
      jurisdictions: attorney.jurisdictions
    },
    matter: {
      category: category.name,
      feeModel: caseRecord.feeModel,
      incidentLocation: caseRecord.incidentLocation,
      incidentTime: caseRecord.incidentTime
    },
    agreement: {
      agreementType: agreement.agreementType,
      clientSignedAt: agreement.clientSignedAt,
      attorneyAcceptedAt: agreement.attorneyAcceptedAt,
      fullyExecuted: agreement.fullyExecuted
    },
    payment: payment
      ? {
          amount: payment.amount,
          currency: payment.currency,
          paymentType: payment.paymentType,
          status: payment.status
        }
      : { status: "not_required" },
    callNotes: [
      "Preliminary guidance completed before formal engagement.",
      "Client advised to preserve documents, photos, deadlines, and communication records."
    ],
    recordingLink: "Recording placeholder: enable only with compliant consent workflow.",
    nextSteps: [
      "Attorney contacts client directly.",
      "Client uploads documents and photos.",
      "Firm opens case in preferred practice management system."
    ]
  };
}
