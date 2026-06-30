export type Role = "client" | "attorney" | "admin";

export type FeeModel =
  | "retainer"
  | "contingency"
  | "no_retainer"
  | "free_initial_review"
  | "custom";

export type AvailabilityStatus = "online" | "offline" | "busy" | "available";

export type AgreementType =
  | "retainer_agreement"
  | "contingency_fee_agreement"
  | "limited_scope_representation_agreement"
  | "consultation_agreement"
  | "custom_attorney_client_agreement";

export type LegalCategory = {
  id: string;
  name: string;
  slug: string;
  defaultFeeModel: FeeModel;
  active: boolean;
  urgency: string;
  accent: string;
};

export type PracticeArea = {
  legalCategoryId: string;
  feeModel: FeeModel;
  retainerRequired: boolean;
  retainerAmount: number | null;
  contingencyPercentage: number | null;
  preliminaryGuidanceMinutes: number;
  customFeeText?: string;
};

export type Attorney = {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  firmName: string;
  barLicenseNumber: string;
  licenseStatus: "approved" | "pending" | "rejected" | "suspended";
  profilePhotoUrl: string;
  shortBio: string;
  fullBio: string;
  yearsExperience: number;
  languages: string[];
  jurisdictions: string[];
  officeAddress: string;
  serviceZipCodes: string[];
  availabilityStatus: AvailabilityStatus;
  rating: number;
  subscriptionStatus: "active" | "trialing" | "past_due" | "inactive";
  premiumListingLevel: "basic" | "premium" | "featured" | "priority_queue";
  practiceAreas: PracticeArea[];
  integrationPreference: IntegrationType;
};

export type ClientUser = {
  id: string;
  role: "client";
  name: string;
  email: string;
  phone: string;
  preferredLanguage: string;
  locationPermission: boolean;
  stripeCustomerId: string;
  defaultPaymentMethodId: string;
  emergencyContact?: string;
};

export type AdminUser = {
  id: string;
  role: "admin";
  name: string;
  email: string;
  phone: string;
};

export type VideoCall = {
  id: string;
  clientId: string;
  attorneyId: string;
  legalCategoryId: string;
  status: "requested" | "active" | "ended";
  videoRoomId: string;
  videoRoomUrl: string;
  startedAt: string;
  endedAt?: string;
  preliminaryGuidanceSeconds: number;
  recordingUrl?: string;
};

export type CaseRecord = {
  id: string;
  clientId: string;
  attorneyId: string;
  legalCategoryId: string;
  matterType: string;
  feeModel: FeeModel;
  status: "draft" | "signature_pending" | "payment_pending" | "attorney_acceptance_pending" | "represented";
  agreementId?: string;
  paymentId?: string;
  attorneyAcceptanceStatus: "not_requested" | "pending" | "accepted" | "declined";
  representationStartedAt?: string;
  incidentLocation?: string;
  incidentTime?: string;
  createdAt: string;
  updatedAt: string;
};

export type Agreement = {
  id: string;
  caseId: string;
  clientId: string;
  attorneyId: string;
  agreementType: AgreementType;
  agreementText: string;
  signedByClient: boolean;
  clientSignature?: string;
  clientSignedAt?: string;
  attorneyAccepted: boolean;
  attorneyAcceptedAt?: string;
  fullyExecuted: boolean;
  fullyExecutedAt?: string;
  pdfUrl?: string;
  createdAt: string;
};

export type Payment = {
  id: string;
  caseId: string;
  clientId: string;
  attorneyId: string;
  stripePaymentIntentId?: string;
  amount: number;
  currency: "usd";
  paymentType: "retainer" | "subscription";
  status: "not_required" | "requires_payment_method" | "processing" | "succeeded" | "failed";
  createdAt: string;
};

export type IntegrationType =
  | "clio"
  | "mycase"
  | "practicepanther"
  | "filevine"
  | "lawmatics"
  | "smokeball"
  | "casepeer"
  | "zapier"
  | "make"
  | "email_export"
  | "pdf_case_packet";

export type CasePacket = {
  caseId: string;
  reference: string;
  client: Pick<ClientUser, "name" | "email" | "phone" | "preferredLanguage">;
  attorney: Pick<Attorney, "name" | "firmName" | "email" | "phone" | "jurisdictions">;
  matter: {
    category: string;
    feeModel: FeeModel;
    incidentLocation?: string;
    incidentTime?: string;
  };
  agreement: Pick<Agreement, "agreementType" | "clientSignedAt" | "attorneyAcceptedAt" | "fullyExecuted">;
  payment: Pick<Payment, "amount" | "currency" | "paymentType" | "status"> | { status: "not_required" };
  callNotes: string[];
  recordingLink: string;
  nextSteps: string[];
};
