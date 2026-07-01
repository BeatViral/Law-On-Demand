"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileSignature,
  FileText,
  Home,
  Landmark,
  PhoneCall,
  PlugZap,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  Video,
  WalletCards,
  X
} from "lucide-react";
import { attorneys, demoClient, getAvailableAttorneys, legalCategories } from "@/lib/data";
import { appPath, isStaticDemo } from "@/lib/routing";
import {
  acceptEngagement,
  createAgreement,
  createCasePacket,
  createCaseRecord,
  createPayment,
  getPracticeArea,
  requiresRetainer
} from "@/lib/workflows";
import type { Agreement, Attorney, CasePacket, CaseRecord, LegalCategory, Payment, VideoCall } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "./ui/button";

type Step =
  | "home"
  | "attorneys"
  | "call"
  | "agreement"
  | "payment"
  | "acceptance"
  | "confirmed"
  | "packet"
  | "integrations"
  | "calls"
  | "cases"
  | "profile"
  | "attorney-dashboard"
  | "admin-dashboard";

type AcceptanceResponse = {
  caseRecord: CaseRecord;
  agreement: Agreement;
  packet: CasePacket;
};

const urgentCategoryIds = ["cat_dui", "cat_stop", "cat_infraction", "cat_auto", "cat_injury", "cat_criminal"];

const appCategories = urgentCategoryIds
  .map((id) => legalCategories.find((category) => category.id === id))
  .filter(Boolean) as LegalCategory[];

function secondsToClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function attorneyInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function categoryTone(category: LegalCategory) {
  if (category.defaultFeeModel === "retainer") return "from-[#ff3d57] via-[#ff7a18] to-[#ffd166]";
  if (category.defaultFeeModel === "contingency") return "from-[#00c2ff] via-[#2ee59d] to-[#b8ff6a]";
  return "from-[#155dfc] via-[#02c7ee] to-[#11a36a]";
}

function feeTypeLabel(attorney: Attorney, category: LegalCategory) {
  const area = getPracticeArea(attorney, category.id);
  if (area.feeModel === "retainer") return "Retainer Required";
  if (area.feeModel === "contingency") return "Contingency / No Upfront Retainer";
  if (area.feeModel === "no_retainer") return "No Upfront Retainer";
  return area.customFeeText ?? "Custom Fee Terms";
}

function feeDetail(attorney: Attorney, category: LegalCategory) {
  const area = getPracticeArea(attorney, category.id);
  if (area.feeModel === "retainer") return `${formatCurrency(area.retainerAmount)} retainer`;
  if (area.feeModel === "contingency") return `${area.contingencyPercentage ?? 33}% contingency`;
  if (area.feeModel === "no_retainer") return "No upfront charge";
  return area.customFeeText ?? "Attorney review";
}

function agreementTitle(caseRecord: CaseRecord | null) {
  if (!caseRecord) return "Agreement";
  if (caseRecord.feeModel === "retainer") return "Retainer Agreement";
  if (caseRecord.feeModel === "contingency") return "Contingency / No-Retainer Agreement";
  if (caseRecord.feeModel === "no_retainer") return "No-Upfront-Retainer Agreement";
  return "Attorney-Client Agreement";
}

function paymentStatusLabel(payment: Payment | null, caseRecord: CaseRecord | null) {
  if (!caseRecord) return "Not started";
  if (!requiresRetainer(caseRecord.feeModel)) return "Not required";
  if (payment?.status === "succeeded") return "Paid";
  return "Required";
}

function resetScroll() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function postJson<T>(path: string, body: unknown, fallback: () => T): Promise<T> {
  if (isStaticDemo) return fallback();

  try {
    const response = await fetch(appPath(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return (await response.json()) as T;
  } catch {
    return fallback();
  }
}

export function ClientApp() {
  const [step, setStep] = useState<Step>("home");
  const [selectedCategory, setSelectedCategory] = useState<LegalCategory | null>(null);
  const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null);
  const [bioAttorney, setBioAttorney] = useState<Attorney | null>(null);
  const [videoCall, setVideoCall] = useState<VideoCall | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [casePacket, setCasePacket] = useState<CasePacket | null>(null);
  const [typedSignature, setTypedSignature] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const availableAttorneys = useMemo(() => {
    if (!selectedCategory) return [];
    return getAvailableAttorneys(selectedCategory.id);
  }, [selectedCategory]);

  const selectedPracticeArea =
    selectedAttorney && selectedCategory ? getPracticeArea(selectedAttorney, selectedCategory.id) : null;

  const packetJsonHref = useMemo(() => {
    if (!casePacket || !caseRecord) return "#";
    if (!isStaticDemo) return appPath(`/api/exports?caseId=${caseRecord.id}&format=json`);
    return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(casePacket, null, 2))}`;
  }, [casePacket, caseRecord]);

  const packetPdfHref = useMemo(() => {
    if (!casePacket || !caseRecord) return "#";
    if (!isStaticDemo) return appPath(`/api/exports?caseId=${caseRecord.id}&format=pdf`);

    const packetText = [
      "Lawyer On Demand Case Packet",
      `Reference: ${casePacket.reference}`,
      `Client: ${casePacket.client.name}`,
      `Attorney: ${casePacket.attorney.name}`,
      `Matter: ${casePacket.matter.category}`,
      `Agreement fully executed: ${casePacket.agreement.fullyExecuted}`,
      `Payment status: ${casePacket.payment.status}`,
      ...casePacket.nextSteps.map((item) => `Next step: ${item}`)
    ].join("\n");

    return `data:text/plain;charset=utf-8,${encodeURIComponent(packetText)}`;
  }, [casePacket, caseRecord]);

  useEffect(() => {
    if (step !== "call") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  function openStep(nextStep: Step) {
    setStep(nextStep);
    resetScroll();
  }

  function resetEngagementState() {
    setSelectedAttorney(null);
    setBioAttorney(null);
    setVideoCall(null);
    setElapsed(0);
    setCaseRecord(null);
    setAgreement(null);
    setPayment(null);
    setCasePacket(null);
    setTypedSignature("");
    setConsent(false);
  }

  function startLegalHelp() {
    openStep("home");
    window.setTimeout(() => document.getElementById("urgent-categories")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function chooseCategory(category: LegalCategory) {
    setSelectedCategory(category);
    resetEngagementState();
    openStep("attorneys");
  }

  async function connectNow(attorney: Attorney) {
    if (!selectedCategory) return;
    setBusy(true);
    setSelectedAttorney(attorney);

    const call = await postJson<VideoCall>(
      "/api/video-room",
      {
        attorneyId: attorney.id,
        legalCategoryId: selectedCategory.id,
        clientId: demoClient.id
      },
      () => ({
        id: `call_${Date.now()}`,
        clientId: demoClient.id,
        attorneyId: attorney.id,
        legalCategoryId: selectedCategory.id,
        status: "active",
        videoRoomId: `lod-${selectedCategory.slug}-demo`,
        videoRoomUrl: "#",
        startedAt: new Date().toISOString(),
        preliminaryGuidanceSeconds: 0,
        recordingUrl: "Recording placeholder: enable after consent and jurisdiction checks."
      })
    );

    setVideoCall(call);
    setElapsed(0);
    setBioAttorney(null);
    openStep("call");
    setBusy(false);
  }

  async function beginHire() {
    if (!selectedAttorney || !selectedCategory) return;
    setBusy(true);
    const created = await postJson<CaseRecord>(
      "/api/cases",
      {
        attorneyId: selectedAttorney.id,
        legalCategoryId: selectedCategory.id
      },
      () => createCaseRecord(selectedAttorney.id, selectedCategory.id)
    );
    setCaseRecord(created);
    openStep("agreement");
    setBusy(false);
  }

  async function signAgreement() {
    if (!caseRecord || !typedSignature.trim() || !consent) return;
    setBusy(true);
    const signed = await postJson<Agreement>(
      "/api/agreements",
      {
        caseRecord,
        signature: typedSignature.trim()
      },
      () => createAgreement(caseRecord, typedSignature.trim())
    );
    setAgreement(signed);

    if (requiresRetainer(caseRecord.feeModel)) {
      openStep("payment");
    } else {
      const noRetainerPayment = await postJson<Payment>(
        "/api/payments",
        { caseRecord },
        () => createPayment(caseRecord, "not_required")
      );
      setPayment(noRetainerPayment);
      openStep("acceptance");
    }
    setBusy(false);
  }

  async function payRetainer() {
    if (!caseRecord) return;
    setBusy(true);
    const processed = await postJson<Payment>(
      "/api/payments",
      {
        caseRecord,
        customerId: demoClient.stripeCustomerId,
        paymentMethodId: demoClient.defaultPaymentMethodId
      },
      () => createPayment(caseRecord, "succeeded")
    );
    setPayment(processed);
    openStep("acceptance");
    setBusy(false);
  }

  async function acceptEngagementNow() {
    if (!caseRecord || !agreement) return;
    setBusy(true);
    const accepted = await postJson<AcceptanceResponse>(
      "/api/cases",
      {
        action: "accept",
        caseRecord,
        agreement,
        payment
      },
      () => {
        const acceptedCase = acceptEngagement(caseRecord, agreement, payment ?? undefined);
        return {
          ...acceptedCase,
          packet: createCasePacket(acceptedCase.caseRecord, acceptedCase.agreement, payment ?? undefined)
        };
      }
    );
    setCaseRecord(accepted.caseRecord);
    setAgreement(accepted.agreement);
    setCasePacket(accepted.packet);
    openStep("confirmed");
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e8fbff_0%,#f4f7ff_38%,#dbeafe_100%)] text-ink md:grid md:place-items-center md:py-6">
      <div className="relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#f7f9fc] shadow-2xl md:min-h-[860px] md:rounded-[34px] md:border-[10px] md:border-[#08111f]">
        {step === "call" ? (
          <CallScreen
            attorney={selectedAttorney}
            category={selectedCategory}
            elapsed={elapsed}
            busy={busy}
            onHire={beginHire}
            onBack={() => openStep("attorneys")}
            onEnd={() => openStep("home")}
          />
        ) : (
          <>
            <div className="flex-1 pb-28">
              {step === "home" && <HomeScreen onStart={startLegalHelp} onChooseCategory={chooseCategory} />}

              {step === "attorneys" && selectedCategory && (
                <AttorneysScreen
                  category={selectedCategory}
                  attorneys={availableAttorneys}
                  busy={busy}
                  onBack={() => openStep("home")}
                  onCall={connectNow}
                  onBio={setBioAttorney}
                />
              )}

              {step === "agreement" && selectedAttorney && selectedCategory && caseRecord && (
                <AgreementScreen
                  attorney={selectedAttorney}
                  category={selectedCategory}
                  caseRecord={caseRecord}
                  typedSignature={typedSignature}
                  consent={consent}
                  busy={busy}
                  onBack={() => openStep("call")}
                  onSignatureChange={setTypedSignature}
                  onConsentChange={setConsent}
                  onContinue={signAgreement}
                />
              )}

              {step === "payment" && selectedAttorney && selectedCategory && caseRecord && selectedPracticeArea && (
                <PaymentScreen
                  attorney={selectedAttorney}
                  category={selectedCategory}
                  retainerAmount={selectedPracticeArea.retainerAmount}
                  busy={busy}
                  onBack={() => openStep("agreement")}
                  onPay={payRetainer}
                />
              )}

              {step === "acceptance" && selectedAttorney && selectedCategory && caseRecord && agreement && (
                <AcceptanceScreen
                  attorney={selectedAttorney}
                  category={selectedCategory}
                  caseRecord={caseRecord}
                  agreement={agreement}
                  payment={payment}
                  busy={busy}
                  onAccept={acceptEngagementNow}
                />
              )}

              {step === "confirmed" && selectedAttorney && selectedCategory && caseRecord && agreement && casePacket && (
                <ConfirmedScreen
                  attorney={selectedAttorney}
                  category={selectedCategory}
                  casePacket={casePacket}
                  onPacket={() => openStep("packet")}
                  onIntegrations={() => openStep("integrations")}
                />
              )}

              {step === "packet" && (
                <CasePacketScreen
                  attorney={selectedAttorney}
                  category={selectedCategory}
                  caseRecord={caseRecord}
                  agreement={agreement}
                  payment={payment}
                  casePacket={casePacket}
                  packetJsonHref={packetJsonHref}
                  packetPdfHref={packetPdfHref}
                  onIntegrations={() => openStep("integrations")}
                  onHome={() => openStep("home")}
                />
              )}

              {step === "integrations" && (
                <IntegrationSuiteScreen
                  casePacket={casePacket}
                  onBack={() => (casePacket ? openStep("packet") : openStep("profile"))}
                />
              )}

              {step === "calls" && (
                <CallsScreen
                  attorney={selectedAttorney}
                  category={selectedCategory}
                  videoCall={videoCall}
                  onHome={() => openStep("home")}
                  onReturn={() => (selectedAttorney && selectedCategory ? openStep("call") : openStep("home"))}
                />
              )}

              {step === "cases" && (
                <CasesScreen casePacket={casePacket} onPacket={() => openStep("packet")} onHome={() => openStep("home")} />
              )}

              {step === "profile" && (
                <ProfileScreen
                  onIntegrations={() => openStep("integrations")}
                  onAttorneyDashboard={() => openStep("attorney-dashboard")}
                  onAdminDashboard={() => openStep("admin-dashboard")}
                />
              )}

              {step === "attorney-dashboard" && (
                <DashboardPlaceholder
                  title="Attorney Dashboard"
                  eyebrow="Attorney workspace"
                  body="Availability, incoming calls, signed agreements, payment status, acceptance controls, and case exports live here."
                  metrics={[
                    ["Online", "Availability"],
                    ["3", "Pending accepts"],
                    ["12", "Open cases"]
                  ]}
                  href={appPath("/attorney")}
                  onBack={() => openStep("profile")}
                />
              )}

              {step === "admin-dashboard" && (
                <DashboardPlaceholder
                  title="Admin Dashboard"
                  eyebrow="Platform controls"
                  body="Manage attorney approvals, category routing, agreement templates, payments, cases, and integration health."
                  metrics={[
                    ["8", "Online attorneys"],
                    ["14", "Live calls"],
                    ["42", "Signed agreements"]
                  ]}
                  href={appPath("/admin")}
                  onBack={() => openStep("profile")}
                />
              )}
            </div>

            <BottomNav
              step={step}
              onHome={() => openStep("home")}
              onCalls={() => openStep("calls")}
              onCases={() => (casePacket ? openStep("packet") : openStep("cases"))}
              onProfile={() => openStep("profile")}
            />
          </>
        )}

        {bioAttorney && selectedCategory && (
          <FullBioSheet
            attorney={bioAttorney}
            category={selectedCategory}
            onClose={() => setBioAttorney(null)}
            onCall={() => connectNow(bioAttorney)}
          />
        )}
      </div>
    </main>
  );
}

function HomeScreen({
  onStart,
  onChooseCategory
}: {
  onStart: () => void;
  onChooseCategory: (category: LegalCategory) => void;
}) {
  return (
    <AppScreen className="gap-5">
      <section className="rounded-[28px] bg-[#09111f] p-5 text-white shadow-[0_24px_70px_rgba(9,17,31,0.24)]">
        <div className="flex items-center justify-between gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-[18px] bg-white text-[#09111f]">
            <Landmark className="h-6 w-6" />
          </div>
          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-200">
            Attorneys online
          </span>
        </div>
        <h1 className="mt-5 text-4xl font-black leading-[0.98] tracking-normal">Lawyer On Demand</h1>
        <p className="mt-3 text-base font-bold leading-6 text-cyan-50">
          Connect with an available attorney in 3 clicks.
        </p>
        <button
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-lg font-black text-[#09111f] shadow-lg"
          onClick={onStart}
          data-testid="start-help"
        >
          <PhoneCall className="h-5 w-5 text-[#155dfc]" />
          Get Legal Help Now
        </button>
      </section>

      <section id="urgent-categories" className="space-y-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-black uppercase text-[#155dfc]">Choose issue</p>
            <h2 className="text-2xl font-black text-[#09111f]">Urgent legal help</h2>
          </div>
          <p className="text-right text-xs font-black text-slate-500">Click 1 of 3</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {appCategories.map((category) => (
            <button
              className="group min-h-36 rounded-[26px] border border-white bg-white p-3 text-left shadow-[0_14px_35px_rgba(15,23,42,0.08)] transition active:scale-[0.98]"
              key={category.id}
              onClick={() => onChooseCategory(category)}
              data-testid={`category-${category.slug}`}
            >
              <span
                className={cn(
                  "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                  categoryTone(category)
                )}
              >
                <ShieldCheck className="h-6 w-6" />
              </span>
              <span className="mt-4 block text-xl font-black leading-6 text-[#09111f]">{category.name}</span>
              <span className="mt-2 block text-xs font-bold leading-5 text-slate-500">{category.urgency}</span>
            </button>
          ))}
        </div>
      </section>
    </AppScreen>
  );
}

function AttorneysScreen({
  category,
  attorneys: availableAttorneys,
  busy,
  onBack,
  onCall,
  onBio
}: {
  category: LegalCategory;
  attorneys: Attorney[];
  busy: boolean;
  onBack: () => void;
  onCall: (attorney: Attorney) => void;
  onBio: (attorney: Attorney) => void;
}) {
  return (
    <AppScreen>
      <ScreenHeader
        title="Available Attorneys"
        subtitle={category.name}
        eyebrow="Click 2 of 3"
        onBack={onBack}
      />

      <div className="space-y-4">
        {availableAttorneys.map((attorney) => (
          <LiveAttorneyCard
            key={attorney.id}
            attorney={attorney}
            category={category}
            busy={busy}
            onCall={() => onCall(attorney)}
            onBio={() => onBio(attorney)}
          />
        ))}
      </div>
    </AppScreen>
  );
}

function LiveAttorneyCard({
  attorney,
  category,
  busy,
  onCall,
  onBio
}: {
  attorney: Attorney;
  category: LegalCategory;
  busy: boolean;
  onCall: () => void;
  onBio: () => void;
}) {
  return (
    <article className="rounded-[30px] border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
      <div className="flex items-start gap-4">
        <button
          className="relative shrink-0"
          onClick={onCall}
          disabled={busy}
          aria-label={`Start video call with ${attorney.name}`}
          data-testid={`call-${attorney.id}`}
        >
          <AttorneyAvatar attorney={attorney} size="lg" />
          <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black leading-6 text-[#09111f]">{attorney.name}</h2>
              <p className="truncate text-sm font-bold text-slate-500">{attorney.firmName}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black uppercase text-emerald-700">
              {attorney.availabilityStatus}
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            <AppFact label="Specialty" value={category.name} />
            <AppFact label="Fee type" value={feeTypeLabel(attorney, category)} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm font-bold leading-6 text-slate-600">{attorney.shortBio}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <button className="text-sm font-black text-[#155dfc]" onClick={onBio}>
          Full Bio
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-[#09111f] px-4 py-2 text-sm font-black text-white" onClick={onCall}>
          <Video className="h-4 w-4" />
          Tap photo to call
        </button>
      </div>
    </article>
  );
}

function CallScreen({
  attorney,
  category,
  elapsed,
  busy,
  onHire,
  onBack,
  onEnd
}: {
  attorney: Attorney | null;
  category: LegalCategory | null;
  elapsed: number;
  busy: boolean;
  onHire: () => void;
  onBack: () => void;
  onEnd: () => void;
}) {
  if (!attorney || !category) return null;

  return (
    <section className="flex min-h-[100dvh] flex-col bg-[#050914] text-white md:min-h-[840px]">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <button
          className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white"
          onClick={onBack}
          aria-label="Choose another attorney"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-xs font-black uppercase text-cyan-200">Preliminary Guidance Period</p>
          <p className="text-lg font-black">{secondsToClock(elapsed)}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-emerald-400/15 text-emerald-200">
          <BadgeCheck className="h-5 w-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 px-4 pb-5">
        <div className="relative min-h-[410px] flex-1 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,#155dfc_0%,#09111f_52%,#020617_100%)] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.38)]">
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="relative flex h-full min-h-[380px] flex-col items-center justify-center text-center">
            <div className="grid h-32 w-32 place-items-center rounded-full border border-white/20 bg-white/95 text-5xl font-black text-[#09111f] shadow-2xl">
              {attorneyInitials(attorney.name)}
            </div>
            <h1 className="mt-5 text-4xl font-black leading-tight">{attorney.name}</h1>
            <p className="mt-1 text-base font-bold text-cyan-100">{category.name}</p>
            <div className="mt-4 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-black text-emerald-200">
              Live call connected
            </div>
          </div>
          <div className="absolute bottom-4 right-4 h-28 w-20 overflow-hidden rounded-3xl border border-white/20 bg-white/90 p-2 text-[#09111f] shadow-2xl">
            <div className="grid h-full place-items-center rounded-2xl bg-slate-100">
              <div className="text-center">
                <UserRound className="mx-auto h-7 w-7" />
                <p className="mt-1 text-[10px] font-black">You</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/8 p-4 backdrop-blur">
          <p className="text-xs font-black uppercase text-cyan-200">Disclaimer</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-200">
            Preliminary guidance only. Full legal representation begins only after you hire the attorney, sign the
            agreement, complete required payment if applicable, and the attorney accepts the engagement.
          </p>
        </div>

        <div className="grid gap-3">
          <button
            className="min-h-14 rounded-2xl bg-white text-lg font-black text-[#09111f] shadow-xl disabled:opacity-60"
            onClick={onHire}
            disabled={busy}
            data-testid="hire-now"
          >
            Hire Me Now
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="min-h-[52px] rounded-2xl bg-white/10 px-3 text-sm font-black text-white"
              onClick={onBack}
              data-testid="choose-another"
            >
              Choose Another Attorney
            </button>
            <button
              className="min-h-[52px] rounded-2xl bg-[#ef4444] px-3 text-sm font-black text-white"
              onClick={onEnd}
              data-testid="end-call"
            >
              End Call
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function AgreementScreen({
  attorney,
  category,
  caseRecord,
  typedSignature,
  consent,
  busy,
  onBack,
  onSignatureChange,
  onConsentChange,
  onContinue
}: {
  attorney: Attorney;
  category: LegalCategory;
  caseRecord: CaseRecord;
  typedSignature: string;
  consent: boolean;
  busy: boolean;
  onBack: () => void;
  onSignatureChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  onContinue: () => void;
}) {
  const retainer = requiresRetainer(caseRecord.feeModel);

  return (
    <AppScreen>
      <ScreenHeader title="Agreement" subtitle={category.name} eyebrow="Hire Me Now" onBack={onBack} />
      <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#155dfc] text-white">
            <FileSignature className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-black leading-7 text-[#09111f]">{agreementTitle(caseRecord)}</h1>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
              {attorney.name}, {attorney.firmName}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] bg-slate-50 p-4">
          <p className="text-xs font-black uppercase text-[#155dfc]">Agreement logic</p>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
            {retainer
              ? "This matter requires a retainer after signature before attorney acceptance."
              : "This matter uses contingency or no-upfront-retainer logic and skips payment after signature."}
          </p>
        </div>

        <label className="mt-5 block">
          <span className="text-xs font-black uppercase text-slate-500">Signature field</span>
          <input
            className="mt-2 min-h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg font-black text-[#09111f] outline-none transition focus:border-[#155dfc] focus:ring-4 focus:ring-blue-100"
            value={typedSignature}
            onChange={(event) => onSignatureChange(event.target.value)}
            placeholder={demoClient.name}
            data-testid="typed-signature"
          />
        </label>

        <label className="mt-4 flex items-start gap-3 rounded-[22px] border border-slate-200 p-4 text-sm font-bold leading-6 text-slate-600">
          <input
            className="mt-1 h-5 w-5 accent-[#155dfc]"
            type="checkbox"
            checked={consent}
            onChange={(event) => onConsentChange(event.target.checked)}
            data-testid="signature-consent"
          />
          I consent to electronic signature and understand representation begins only after attorney acceptance.
        </label>

        <button
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#09111f] text-lg font-black text-white disabled:opacity-50"
          onClick={onContinue}
          disabled={!typedSignature.trim() || !consent || busy}
          data-testid="sign-agreement"
        >
          Continue
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>
    </AppScreen>
  );
}

function PaymentScreen({
  attorney,
  category,
  retainerAmount,
  busy,
  onBack,
  onPay
}: {
  attorney: Attorney;
  category: LegalCategory;
  retainerAmount: number | null;
  busy: boolean;
  onBack: () => void;
  onPay: () => void;
}) {
  return (
    <AppScreen>
      <ScreenHeader title="Payment" subtitle={category.name} eyebrow="Retainer required" onBack={onBack} />
      <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-amber-100 text-amber-700">
          <WalletCards className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-3xl font-black leading-tight text-[#09111f]">Pay retainer to continue.</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
          {attorney.name} can accept representation after the retainer succeeds.
        </p>
        <div className="mt-5 rounded-[26px] bg-[#09111f] p-5 text-white">
          <p className="text-xs font-black uppercase text-amber-200">Retainer</p>
          <p className="mt-2 text-5xl font-black">{formatCurrency(retainerAmount)}</p>
          <p className="mt-4 text-sm font-bold text-slate-200">Visa ending in 4242</p>
        </div>
        <button
          className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#155dfc] text-lg font-black text-white disabled:opacity-50"
          onClick={onPay}
          disabled={busy}
          data-testid="pay-retainer"
        >
          <CircleDollarSign className="h-5 w-5" />
          Pay Retainer
        </button>
      </section>
    </AppScreen>
  );
}

function AcceptanceScreen({
  attorney,
  category,
  caseRecord,
  agreement,
  payment,
  busy,
  onAccept
}: {
  attorney: Attorney;
  category: LegalCategory;
  caseRecord: CaseRecord;
  agreement: Agreement;
  payment: Payment | null;
  busy: boolean;
  onAccept: () => void;
}) {
  return (
    <AppScreen>
      <ScreenHeader title="Waiting for attorney acceptance" subtitle={category.name} eyebrow="Final step" />
      <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <div className="flex items-center gap-4">
          <AttorneyAvatar attorney={attorney} />
          <div>
            <h1 className="text-2xl font-black leading-7 text-[#09111f]">{attorney.name}</h1>
            <p className="text-sm font-bold text-slate-500">{attorney.firmName}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <StatusLine label="Client signed agreement" active={agreement.signedByClient} />
          <StatusLine
            label={requiresRetainer(caseRecord.feeModel) ? "Retainer processed" : "No upfront retainer required"}
            active={payment?.status === "succeeded" || payment?.status === "not_required"}
          />
          <StatusLine label="Attorney acceptance pending" active={false} />
        </div>
        <button
          className="mt-5 min-h-14 w-full rounded-2xl bg-[#09111f] text-lg font-black text-white disabled:opacity-50"
          onClick={onAccept}
          disabled={busy}
          data-testid="accept-engagement"
        >
          Attorney Accepts
        </button>
      </section>
    </AppScreen>
  );
}

function ConfirmedScreen({
  attorney,
  category,
  casePacket,
  onPacket,
  onIntegrations
}: {
  attorney: Attorney;
  category: LegalCategory;
  casePacket: CasePacket;
  onPacket: () => void;
  onIntegrations: () => void;
}) {
  return (
    <AppScreen>
      <section className="rounded-[32px] bg-[#09111f] p-6 text-white shadow-[0_24px_70px_rgba(9,17,31,0.24)]">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-[#09111f]">
          <Check className="h-9 w-9" />
        </div>
        <p className="mt-5 text-xs font-black uppercase text-emerald-200">Case created</p>
        <h1 className="mt-2 text-4xl font-black leading-[1.02]">Representation Started</h1>
        <p className="mt-4 text-sm font-bold leading-6 text-slate-200">
          {attorney.name} accepted the {category.name} matter. Your case packet is ready.
        </p>
      </section>

      <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <StatusLine label={`Case reference: ${casePacket.reference}`} active />
        <StatusLine label="Agreement fully executed" active />
        <StatusLine label="Attorney acceptance complete" active />
        <div className="mt-5 grid gap-3">
          <button className="min-h-14 rounded-2xl bg-[#155dfc] text-lg font-black text-white" onClick={onPacket}>
            View Case Packet
          </button>
          <button className="min-h-14 rounded-2xl border border-slate-200 bg-white text-lg font-black text-[#09111f]" onClick={onIntegrations}>
            Export Case
          </button>
        </div>
      </section>
    </AppScreen>
  );
}

function CasePacketScreen({
  attorney,
  category,
  caseRecord,
  agreement,
  payment,
  casePacket,
  packetJsonHref,
  packetPdfHref,
  onIntegrations,
  onHome
}: {
  attorney: Attorney | null;
  category: LegalCategory | null;
  caseRecord: CaseRecord | null;
  agreement: Agreement | null;
  payment: Payment | null;
  casePacket: CasePacket | null;
  packetJsonHref: string;
  packetPdfHref: string;
  onIntegrations: () => void;
  onHome: () => void;
}) {
  if (!casePacket || !caseRecord || !agreement || !attorney || !category) {
    return (
      <EmptyState
        title="No case packet yet"
        body="Choose a legal issue, call an attorney, sign, and complete acceptance to create a packet."
        action="Start New Matter"
        onAction={onHome}
      />
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Case Packet" subtitle={casePacket.reference} eyebrow="Export ready" />
      <section className="space-y-3 rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <PacketRow label="Client info" value={`${casePacket.client.name} - ${casePacket.client.phone}`} />
        <PacketRow label="Matter type" value={category.name} />
        <PacketRow label="Agreement status" value={agreement.fullyExecuted ? "Fully executed" : "Pending"} />
        <PacketRow label="Payment status" value={paymentStatusLabel(payment, caseRecord)} />
        <PacketRow label="Attorney acceptance status" value={caseRecord.attorneyAcceptanceStatus} />
        <PacketRow label="Attorney" value={`${attorney.name}, ${attorney.firmName}`} />
      </section>

      <button
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#09111f] text-lg font-black text-white"
        onClick={onIntegrations}
      >
        <PlugZap className="h-5 w-5" />
        Export to Integration Suite
      </button>

      <div className="grid grid-cols-2 gap-3">
        <a
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-[#09111f] shadow-sm"
          href={packetJsonHref}
          target="_blank"
          download={`${casePacket.reference}.json`}
        >
          <Download className="h-4 w-4" />
          JSON
        </a>
        <a
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-[#09111f] shadow-sm"
          href={packetPdfHref}
          target="_blank"
          download={`${casePacket.reference}.${isStaticDemo ? "txt" : "pdf"}`}
        >
          <Download className="h-4 w-4" />
          PDF
        </a>
      </div>
    </AppScreen>
  );
}

function IntegrationSuiteScreen({ casePacket, onBack }: { casePacket: CasePacket | null; onBack: () => void }) {
  const integrations = [
    "Clio",
    "MyCase",
    "PracticePanther",
    "Filevine",
    "Lawmatics",
    "Smokeball",
    "CASEpeer",
    "Zapier",
    "Make",
    "PDF Export",
    "Email Export"
  ];

  return (
    <AppScreen>
      <ScreenHeader title="Integration Suite" subtitle={casePacket?.reference ?? "Export destinations"} eyebrow="Case export" onBack={onBack} />
      <div className="grid gap-3">
        {integrations.map((item) => (
          <article className="flex min-h-20 items-center gap-4 rounded-[24px] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.07)]" key={item}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f1ff] text-[#155dfc]">
              {item.includes("Export") ? <FileText className="h-6 w-6" /> : <PlugZap className="h-6 w-6" />}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-black text-[#09111f]">{item}</h2>
              <p className="text-xs font-bold text-slate-500">
                {casePacket ? "Ready to receive this case packet" : "Connector placeholder"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </article>
        ))}
      </div>
    </AppScreen>
  );
}

function CallsScreen({
  attorney,
  category,
  videoCall,
  onHome,
  onReturn
}: {
  attorney: Attorney | null;
  category: LegalCategory | null;
  videoCall: VideoCall | null;
  onHome: () => void;
  onReturn: () => void;
}) {
  if (!attorney || !category || !videoCall) {
    return (
      <EmptyState
        title="No active calls"
        body="Choose an urgent legal issue and tap an attorney photo to start a call."
        action="Choose Issue"
        onAction={onHome}
      />
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Calls" subtitle="Recent call room" eyebrow="Video" />
      <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <div className="flex items-center gap-4">
          <AttorneyAvatar attorney={attorney} />
          <div>
            <h1 className="text-2xl font-black text-[#09111f]">{attorney.name}</h1>
            <p className="text-sm font-bold text-slate-500">{category.name}</p>
          </div>
        </div>
        <button className="mt-5 min-h-14 w-full rounded-2xl bg-[#09111f] text-lg font-black text-white" onClick={onReturn}>
          Return to Call
        </button>
      </section>
    </AppScreen>
  );
}

function CasesScreen({
  casePacket,
  onPacket,
  onHome
}: {
  casePacket: CasePacket | null;
  onPacket: () => void;
  onHome: () => void;
}) {
  if (!casePacket) {
    return (
      <EmptyState
        title="No cases yet"
        body="Your retained matters appear here after attorney acceptance."
        action="Start New Matter"
        onAction={onHome}
      />
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Cases" subtitle="Active representation" eyebrow="1 open case" />
      <article className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <p className="text-xs font-black uppercase text-[#155dfc]">{casePacket.reference}</p>
        <h1 className="mt-2 text-2xl font-black text-[#09111f]">{casePacket.matter.category}</h1>
        <p className="mt-2 text-sm font-bold text-slate-500">{casePacket.attorney.name}</p>
        <button className="mt-5 min-h-14 w-full rounded-2xl bg-[#09111f] text-lg font-black text-white" onClick={onPacket}>
          Open Case Packet
        </button>
      </article>
    </AppScreen>
  );
}

function ProfileScreen({
  onIntegrations,
  onAttorneyDashboard,
  onAdminDashboard
}: {
  onIntegrations: () => void;
  onAttorneyDashboard: () => void;
  onAdminDashboard: () => void;
}) {
  return (
    <AppScreen>
      <ScreenHeader title="Profile" subtitle={demoClient.email} eyebrow="Client account" />
      <section className="rounded-[30px] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-[#09111f] text-xl font-black text-white">
            {attorneyInitials(demoClient.name)}
          </span>
          <div>
            <h1 className="text-2xl font-black text-[#09111f]">{demoClient.name}</h1>
            <p className="text-sm font-bold text-slate-500">{demoClient.phone}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3">
          <ProfileAction label="Integration Suite" icon={<PlugZap className="h-5 w-5" />} onClick={onIntegrations} />
          <ProfileAction label="Attorney Dashboard" icon={<UserRoundCheck className="h-5 w-5" />} onClick={onAttorneyDashboard} />
          <ProfileAction label="Admin Dashboard" icon={<BriefcaseBusiness className="h-5 w-5" />} onClick={onAdminDashboard} />
        </div>
      </section>
    </AppScreen>
  );
}

function DashboardPlaceholder({
  title,
  eyebrow,
  body,
  metrics,
  href,
  onBack
}: {
  title: string;
  eyebrow: string;
  body: string;
  metrics: Array<[string, string]>;
  href: string;
  onBack: () => void;
}) {
  return (
    <AppScreen>
      <ScreenHeader title={title} subtitle={body} eyebrow={eyebrow} onBack={onBack} />
      <section className="grid gap-3">
        {metrics.map(([value, label]) => (
          <article className="rounded-[24px] bg-white p-4 shadow-sm" key={label}>
            <p className="text-3xl font-black text-[#09111f]">{value}</p>
            <p className="mt-1 text-sm font-black uppercase text-slate-500">{label}</p>
          </article>
        ))}
      </section>
      <a className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#09111f] text-lg font-black text-white" href={href}>
        Open Full Page
        <ChevronRight className="h-5 w-5" />
      </a>
    </AppScreen>
  );
}

function FullBioSheet({
  attorney,
  category,
  onClose,
  onCall
}: {
  attorney: Attorney;
  category: LegalCategory;
  onClose: () => void;
  onCall: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#09111f]/70 md:absolute">
      <section className="max-h-[88vh] w-full overflow-auto rounded-t-[32px] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#09111f]">Full Bio</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close bio">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <button className="relative shrink-0" onClick={onCall} aria-label={`Start video call with ${attorney.name}`}>
            <AttorneyAvatar attorney={attorney} size="lg" />
            <span className="absolute bottom-0 right-0 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-400" />
          </button>
          <div>
            <h3 className="text-2xl font-black text-[#09111f]">{attorney.name}</h3>
            <p className="text-sm font-bold text-slate-500">{attorney.firmName}</p>
          </div>
        </div>
        <p className="mt-5 text-sm font-bold leading-7 text-slate-600">{attorney.fullBio}</p>
        <div className="mt-5 grid gap-3">
          <PacketRow label="Specialty" value={category.name} />
          <PacketRow label="Fee type" value={feeTypeLabel(attorney, category)} />
          <PacketRow label="Fee detail" value={feeDetail(attorney, category)} />
          <PacketRow label="Jurisdictions" value={attorney.jurisdictions.join(", ")} />
          <PacketRow label="Experience" value={`${attorney.yearsExperience} years`} />
        </div>
        <button className="mt-5 min-h-14 w-full rounded-2xl bg-[#09111f] text-lg font-black text-white" onClick={onCall}>
          Tap photo to call
        </button>
      </section>
    </div>
  );
}

function BottomNav({
  step,
  onHome,
  onCalls,
  onCases,
  onProfile
}: {
  step: Step;
  onHome: () => void;
  onCalls: () => void;
  onCases: () => void;
  onProfile: () => void;
}) {
  const items = [
    { label: "Home", icon: <Home className="h-5 w-5" />, active: step === "home" || step === "attorneys", onClick: onHome },
    { label: "Calls", icon: <PhoneCall className="h-5 w-5" />, active: step === "calls", onClick: onCalls },
    {
      label: "Cases",
      icon: <FileText className="h-5 w-5" />,
      active: step === "cases" || step === "packet" || step === "confirmed",
      onClick: onCases
    },
    {
      label: "Profile",
      icon: <UserRound className="h-5 w-5" />,
      active: step === "profile" || step === "integrations" || step === "attorney-dashboard" || step === "admin-dashboard",
      onClick: onProfile
    }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[430px] border-t border-slate-200 bg-white/95 px-4 pb-4 pt-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:absolute md:rounded-b-[24px]">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <button
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition",
              item.active ? "bg-[#09111f] text-white" : "text-slate-500"
            )}
            key={item.label}
            onClick={item.onClick}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function AppScreen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={cn("flex flex-col gap-4 p-4", className)}>{children}</section>;
}

function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
}) {
  return (
    <header className="flex items-start gap-3 pt-1">
      {onBack && (
        <button className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#09111f] shadow-sm" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-xs font-black uppercase text-[#155dfc]">{eyebrow}</p>}
        <h1 className="text-3xl font-black leading-[1.02] text-[#09111f]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{subtitle}</p>}
      </div>
    </header>
  );
}

function AttorneyAvatar({ attorney, size = "md" }: { attorney: Attorney; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-[linear-gradient(135deg,#155dfc,#02c7ee,#11a36a)] font-black text-white shadow-lg",
        size === "lg" ? "h-24 w-24 text-3xl" : "h-16 w-16 text-xl"
      )}
    >
      {attorneyInitials(attorney.name)}
    </span>
  );
}

function AppFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-black leading-5 text-[#09111f]">{value}</p>
    </div>
  );
}

function StatusLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-slate-50 px-3">
      <span className={cn("grid h-8 w-8 place-items-center rounded-full", active ? "bg-emerald-500 text-white" : "bg-white text-slate-400")}>
        {active ? <Check className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
      </span>
      <span className="text-sm font-black text-[#09111f]">{label}</span>
    </div>
  );
}

function PacketRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[10px] font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-black leading-5 text-[#09111f]">{value}</p>
    </div>
  );
}

function ProfileAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button className="flex min-h-14 items-center justify-between rounded-2xl bg-slate-50 px-4 text-left text-[#09111f]" onClick={onClick}>
      <span className="flex items-center gap-3 text-sm font-black">
        {icon}
        {label}
      </span>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function EmptyState({
  title,
  body,
  action,
  onAction
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <AppScreen>
      <section className="grid min-h-[560px] place-items-center rounded-[32px] bg-white p-6 text-center shadow-[0_18px_45px_rgba(15,23,42,0.09)]">
        <div>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#e9f1ff] text-[#155dfc]">
            <FileText className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-black text-[#09111f]">{title}</h1>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-500">{body}</p>
          <button className="mt-6 min-h-14 w-full rounded-2xl bg-[#09111f] px-6 text-lg font-black text-white" onClick={onAction}>
            {action}
          </button>
        </div>
      </section>
    </AppScreen>
  );
}
