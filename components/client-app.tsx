"use client";

import { useEffect, useMemo, useState } from "react";
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
  Gavel,
  Landmark,
  MapPin,
  PhoneCall,
  ReceiptText,
  ShieldCheck,
  Siren,
  Sparkles,
  UserRoundCheck,
  Video,
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
import { formatCurrency } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Panel } from "./ui/panel";

type Step =
  | "home"
  | "results"
  | "call"
  | "post-call"
  | "hire"
  | "signature"
  | "payment"
  | "pending"
  | "confirmed";

type AcceptanceResponse = {
  caseRecord: CaseRecord;
  agreement: Agreement;
  packet: CasePacket;
};

function secondsToClock(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remaining = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remaining}`;
}

function feeLabel(attorney: Attorney, category: LegalCategory) {
  const area = getPracticeArea(attorney, category.id);
  if (area.feeModel === "retainer") return `${formatCurrency(area.retainerAmount)} retainer`;
  if (area.feeModel === "contingency") return `${area.contingencyPercentage ?? 33}% contingency`;
  if (area.feeModel === "no_retainer") return "No upfront retainer";
  return area.customFeeText ?? "Custom fee terms";
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
    const matching = getAvailableAttorneys(selectedCategory.id);
    return matching.length ? matching : attorneys.slice(0, 3);
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
      `Fee model: ${casePacket.matter.feeModel}`,
      `Agreement fully executed: ${casePacket.agreement.fullyExecuted}`,
      `Payment status: ${casePacket.payment.status}`,
      "Recording placeholder: enable only with compliant consent.",
      ...casePacket.nextSteps.map((step) => `Next step: ${step}`)
    ].join("\n");

    return `data:text/plain;charset=utf-8,${encodeURIComponent(packetText)}`;
  }, [casePacket, caseRecord]);

  useEffect(() => {
    if (step !== "call") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  function chooseCategory(category: LegalCategory) {
    setSelectedCategory(category);
    setSelectedAttorney(null);
    setElapsed(0);
    setStep("results");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setStep("call");
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setStep("hire");
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setStep("payment");
    } else {
      const noRetainerPayment = await postJson<Payment>(
        "/api/payments",
        { caseRecord },
        () => createPayment(caseRecord, "not_required")
      );
      setPayment(noRetainerPayment);
      setStep("pending");
    }
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setStep("pending");
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setStep("confirmed");
    setBusy(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen overflow-hidden bg-app text-ink">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-30 -mx-4 border-b border-white/70 bg-white/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <button
              className="flex items-center gap-3 text-left"
              onClick={() => setStep("home")}
              aria-label="Go to Lawyer On Demand home"
            >
              <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-ink text-white shadow-panel">
                <Landmark className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-lg font-black leading-tight sm:text-2xl">Lawyer On Demand</span>
                <span className="block text-xs font-bold text-graphite sm:text-sm">
                  Available attorney in 3 clicks
                </span>
              </span>
            </button>
            <nav className="flex items-center gap-2">
              <a
                className="hidden rounded-[8px] border border-slate-200 bg-white px-4 py-3 text-sm font-black text-ink shadow-sm transition hover:border-cobalt hover:text-cobalt sm:inline-flex"
                href={appPath("/attorney")}
              >
                Attorney Login
              </a>
              <a
                className="rounded-[8px] bg-ink px-4 py-3 text-sm font-black text-white shadow-panel transition hover:bg-slate-800"
                href={appPath("/admin")}
              >
                Admin
              </a>
            </nav>
          </div>
        </header>

        {step === "home" && (
          <>
            <section className="grid min-h-[78vh] items-center gap-8 py-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-6">
                <Badge tone="red" className="text-sm">
                  <Siren className="mr-2 h-4 w-4" />
                  Urgent legal access
                </Badge>
                <div className="space-y-4">
                  <h1 className="max-w-3xl text-5xl font-black leading-[0.96] text-ink sm:text-6xl lg:text-7xl">
                    Connect with an available attorney in 3 clicks.
                  </h1>
                  <p className="max-w-2xl text-lg font-bold leading-8 text-graphite sm:text-xl">
                    Open app, choose the issue, tap the attorney photo. Your preliminary guidance call starts
                    immediately.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    size="lg"
                    icon={<Siren className="h-5 w-5" />}
                    onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Get Legal Help Now
                  </Button>
                  <a
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-6 text-lg font-black text-ink shadow-sm transition hover:border-cobalt hover:text-cobalt"
                    href={appPath("/attorney")}
                  >
                    <UserRoundCheck className="h-5 w-5" />
                    Attorney Login
                  </a>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {legalCategories.slice(0, 4).map((category) => (
                    <button
                      className="flex min-h-16 items-center justify-between gap-3 rounded-[8px] border border-slate-200 bg-white px-4 text-left shadow-sm transition hover:border-cobalt hover:text-cobalt"
                      key={category.id}
                      onClick={() => chooseCategory(category)}
                    >
                      <span className="text-base font-black text-ink">{category.name}</span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-cobalt" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative min-h-[520px] overflow-hidden rounded-[8px] border border-slate-200 bg-ink p-4 shadow-legal-glow sm:p-5">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(21,93,252,0.55),rgba(2,199,238,0.28)_45%,rgba(17,163,106,0.2))]" />
                <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="relative flex h-full min-h-[488px] flex-col justify-between rounded-[8px] border border-white/20 bg-white/10 p-4 backdrop-blur sm:p-6">
                  <div className="flex items-center justify-between">
                    <Badge tone="green">5 online now</Badge>
                    <Badge tone="cyan">Preliminary guidance</Badge>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-black uppercase text-cyan-100">Tap photo to call</p>
                    <div className="grid grid-cols-2 gap-3">
                      {attorneys.slice(0, 4).map((attorney) => (
                        <button
                          className="group overflow-hidden rounded-[8px] bg-white text-left shadow-panel transition hover:translate-y-[-2px]"
                          key={attorney.id}
                          onClick={() => {
                            const category =
                              legalCategories.find((item) =>
                                attorney.practiceAreas.some((area) => area.legalCategoryId === item.id)
                              ) ?? legalCategories[0];
                            chooseCategory(category);
                            window.setTimeout(() => connectNow(attorney), 50);
                          }}
                        >
                          <img
                            className="h-36 w-full object-cover"
                            src={attorney.profilePhotoUrl}
                            alt={`${attorney.name} attorney portrait`}
                          />
                          <span className="block p-3">
                            <span className="block text-base font-black text-ink">{attorney.name}</span>
                            <span className="block text-xs font-bold text-graphite">{attorney.firmName}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="rounded-[8px] bg-white/95 p-4 text-sm font-bold leading-6 text-graphite">
                    Preliminary guidance only. Full representation begins after signing, payment if required,
                    and attorney acceptance.
                  </p>
                </div>
              </div>
            </section>

            <section id="categories" className="space-y-4 pb-12">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase text-cobalt">Choose legal issue</p>
                  <h2 className="text-3xl font-black text-ink sm:text-5xl">Large emergency buttons.</h2>
                </div>
                <p className="max-w-xl text-base font-bold leading-7 text-graphite">
                  No queue screen. No directory maze. Available attorneys appear instantly after the issue is selected.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {legalCategories.map((category) => (
                  <button
                    className="group min-h-36 rounded-[8px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:translate-y-[-2px] hover:border-cobalt hover:shadow-legal-glow"
                    key={category.id}
                    onClick={() => chooseCategory(category)}
                  >
                    <span className="flex items-center justify-between gap-4">
                      <span className="grid h-12 w-12 place-items-center rounded-[8px] bg-ink text-white">
                        <Gavel className="h-6 w-6" />
                      </span>
                      <ChevronRight className="h-6 w-6 text-cobalt transition group-hover:translate-x-1" />
                    </span>
                    <span className="mt-5 block text-2xl font-black text-ink">{category.name}</span>
                    <span className="mt-2 block text-sm font-bold leading-6 text-graphite">{category.urgency}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {step === "results" && selectedCategory && (
          <section className="grid gap-6 py-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div className="space-y-4">
              <Button variant="ghost" icon={<ArrowLeft className="h-5 w-5" />} onClick={() => setStep("home")}>
                Change issue
              </Button>
              <div>
                <Badge tone="green">Online attorneys available now</Badge>
                <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">{selectedCategory.name}</h1>
                <p className="mt-3 text-lg font-bold leading-8 text-graphite">
                  Tap an attorney photo to begin the video call. Attorney cards stay brief so you can move fast.
                </p>
              </div>
              <Panel className="p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-6 w-6 text-verdict" />
                  <p className="text-sm font-bold leading-6 text-graphite">
                    This is a preliminary guidance call. Full representation begins only after you hire the attorney,
                    sign the agreement, complete required payment, and the attorney accepts the engagement.
                  </p>
                </div>
              </Panel>
            </div>

            <div className="grid gap-4">
              {availableAttorneys.map((attorney) => (
                <article
                  className="grid gap-4 rounded-[8px] border border-slate-200 bg-white p-4 shadow-panel sm:grid-cols-[180px_1fr]"
                  key={attorney.id}
                >
                  <button
                    className="group relative min-h-60 overflow-hidden rounded-[8px] bg-slate-100 sm:min-h-full"
                    onClick={() => connectNow(attorney)}
                    disabled={busy}
                    aria-label={`Start video call with ${attorney.name}`}
                  >
                    <img
                      className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      src={attorney.profilePhotoUrl}
                      alt={`${attorney.name} attorney portrait`}
                    />
                    <span className="absolute inset-x-3 bottom-3 flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-white/95 px-3 text-base font-black text-ink shadow-panel">
                      <Video className="h-5 w-5 text-cobalt" />
                      Connect now
                    </span>
                  </button>
                  <div className="flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="green">Online</Badge>
                        <Badge tone={requiresRetainer(getPracticeArea(attorney, selectedCategory.id).feeModel) ? "gold" : "cyan"}>
                          {feeLabel(attorney, selectedCategory)}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-ink">{attorney.name}</h2>
                        <p className="text-base font-black text-cobalt">{attorney.firmName}</p>
                      </div>
                      <p className="text-sm font-bold leading-6 text-graphite">{attorney.shortBio}</p>
                      <div className="grid gap-2 text-sm font-bold text-graphite sm:grid-cols-2">
                        <span className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-cobalt" />
                          {attorney.jurisdictions.join(", ")}
                        </span>
                        <span className="flex items-center gap-2">
                          <BadgeCheck className="h-4 w-4 text-verdict" />
                          {attorney.yearsExperience} years experience
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      icon={<ReceiptText className="h-5 w-5" />}
                      onClick={() => setBioAttorney(attorney)}
                    >
                      Full Bio
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {step === "call" && selectedAttorney && selectedCategory && (
          <section className="grid gap-5 py-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-hidden rounded-[8px] bg-ink shadow-legal-glow">
              <div className="relative min-h-[520px]">
                <img
                  className="absolute inset-0 h-full w-full object-cover opacity-72"
                  src={selectedAttorney.profilePhotoUrl}
                  alt={`${selectedAttorney.name} on video call`}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,17,31,0.18),rgba(9,17,31,0.88))]" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <Badge tone="green">Live video room</Badge>
                  <Badge tone="cyan">{videoCall?.videoRoomId ?? "room-ready"}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 space-y-4">
                  <div>
                    <h1 className="text-4xl font-black text-white sm:text-6xl">{selectedAttorney.name}</h1>
                    <p className="text-lg font-black text-cyan-100">{selectedCategory.name}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div className="rounded-[8px] border border-white/20 bg-white/95 p-4">
                      <p className="text-xs font-black uppercase text-cobalt">Preliminary Guidance Period</p>
                      <p className="mt-1 text-5xl font-black text-ink">{secondsToClock(elapsed)}</p>
                    </div>
                    <div className="min-h-32 rounded-[8px] border border-white/20 bg-white/20 p-3 backdrop-blur">
                      <div className="h-full rounded-[8px] bg-[linear-gradient(135deg,#155dfc,#11a36a)] p-3 text-white">
                        <p className="text-xs font-black uppercase">You</p>
                        <p className="mt-8 text-lg font-black">{demoClient.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Panel className="p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-6 w-6 text-verdict" />
                  <div>
                    <h2 className="text-2xl font-black text-ink">Preliminary guidance only.</h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-graphite">
                      Full representation begins after signing, payment if required, and attorney acceptance.
                    </p>
                  </div>
                </div>
              </Panel>
              <Panel className="p-5">
                <h3 className="text-lg font-black text-ink">Basic guidance may include</h3>
                <div className="mt-4 grid gap-3">
                  {[
                    "Stay calm and follow lawful instructions.",
                    "Do not volunteer unnecessary information.",
                    "Ask whether you are being detained or arrested.",
                    "Keep the phone nearby if safe and lawful.",
                    "Decide whether you want to formally retain counsel."
                  ].map((item) => (
                    <p className="flex gap-3 text-sm font-bold leading-6 text-graphite" key={item}>
                      <Check className="mt-1 h-4 w-4 shrink-0 text-verdict" />
                      {item}
                    </p>
                  ))}
                </div>
              </Panel>
              <div className="grid gap-3">
                <Button
                  size="lg"
                  icon={<BriefcaseBusiness className="h-5 w-5" />}
                  onClick={beginHire}
                  disabled={busy}
                >
                  Hire Me Now
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  icon={<ArrowLeft className="h-5 w-5" />}
                  onClick={() => setStep("results")}
                >
                  Return to Attorneys
                </Button>
                <Button size="lg" variant="danger" icon={<X className="h-5 w-5" />} onClick={() => setStep("post-call")}>
                  End Call
                </Button>
              </div>
            </div>
          </section>
        )}

        {step === "post-call" && selectedAttorney && (
          <section className="mx-auto grid max-w-3xl gap-5 py-12">
            <Badge tone="dark">Call ended</Badge>
            <h1 className="text-4xl font-black text-ink sm:text-6xl">What would you like to do next?</h1>
            <div className="grid gap-3">
              <Button size="lg" icon={<BriefcaseBusiness className="h-5 w-5" />} onClick={beginHire}>
                Hire This Attorney
              </Button>
              <Button size="lg" variant="secondary" icon={<ArrowLeft className="h-5 w-5" />} onClick={() => setStep("results")}>
                Choose Another Attorney
              </Button>
              <Button size="lg" variant="ghost" icon={<X className="h-5 w-5" />} onClick={() => setStep("home")}>
                End Session
              </Button>
            </div>
          </section>
        )}

        {step === "hire" && selectedAttorney && selectedCategory && caseRecord && selectedPracticeArea && (
          <section className="mx-auto grid max-w-5xl gap-5 py-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <Badge tone={requiresRetainer(caseRecord.feeModel) ? "gold" : "cyan"}>
                {requiresRetainer(caseRecord.feeModel) ? "Retainer matter" : "No upfront retainer"}
              </Badge>
              <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">Hire {selectedAttorney.name}</h1>
              <p className="mt-4 text-lg font-bold leading-8 text-graphite">
                The agreement is matched to the matter type and the attorney&apos;s fee setup. Attorney acceptance is
                still required before representation begins.
              </p>
            </div>
            <Panel className="p-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileSignature className="h-7 w-7 text-cobalt" />
                  <div>
                    <p className="text-sm font-black uppercase text-cobalt">Agreement flow</p>
                    <h2 className="text-2xl font-black text-ink">
                      {caseRecord.feeModel === "retainer" ? "Retainer agreement" : "Contingency / no-retainer agreement"}
                    </h2>
                  </div>
                </div>
                <div className="grid gap-3">
                  {[
                    "Client signs electronically.",
                    requiresRetainer(caseRecord.feeModel)
                      ? `${formatCurrency(selectedPracticeArea.retainerAmount)} retainer is charged to card on file.`
                      : "No upfront charge is made for this matter.",
                    "Attorney accepts the signed agreement.",
                    "Agreement becomes fully executed and representation begins."
                  ].map((item) => (
                    <div className="flex gap-3 rounded-[8px] bg-slate-50 p-3 text-sm font-bold text-graphite" key={item}>
                      <Check className="h-5 w-5 shrink-0 text-verdict" />
                      {item}
                    </div>
                  ))}
                </div>
                <Button size="lg" icon={<FileSignature className="h-5 w-5" />} onClick={() => setStep("signature")}>
                  Review and Sign
                </Button>
              </div>
            </Panel>
          </section>
        )}

        {step === "signature" && selectedAttorney && caseRecord && (
          <section className="mx-auto grid max-w-5xl gap-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Badge tone="blue">Electronic signature MVP</Badge>
              <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">Sign to request engagement.</h1>
              <p className="mt-4 text-lg font-bold leading-8 text-graphite">
                Typing your name and checking consent creates the client signature record. Execution still requires
                attorney acceptance.
              </p>
            </div>
            <Panel className="overflow-hidden">
              <div className="max-h-72 overflow-auto border-b border-slate-200 bg-slate-50 p-5">
                <pre className="whitespace-pre-wrap font-sans text-sm font-bold leading-7 text-graphite">
                  {`Lawyer On Demand ${caseRecord.feeModel === "retainer" ? "Retainer Agreement" : "Contingency / No-Retainer Agreement"}\n\nClient: ${demoClient.name}\nAttorney: ${selectedAttorney.name}, ${selectedAttorney.firmName}\n\nThis is not executed by the call. Representation begins only after client signature, required payment if applicable, and attorney acceptance.\n\nRecording support is a placeholder in this MVP and must only be enabled with compliant consent.`}
                </pre>
              </div>
              <div className="space-y-4 p-5">
                <label className="flex items-start gap-3 rounded-[8px] border border-slate-200 p-4 text-sm font-bold leading-6 text-graphite">
                  <input
                    className="mt-1 h-5 w-5 accent-cobalt"
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                  />
                  I agree to sign electronically and understand that attorney acceptance is required before formal
                  representation begins.
                </label>
                <label className="block">
                  <span className="text-sm font-black uppercase text-cobalt">Typed signature</span>
                  <input
                    className="mt-2 min-h-14 w-full rounded-[8px] border border-slate-200 px-4 text-xl font-black outline-none transition focus:border-cobalt focus:ring-4 focus:ring-blue-100"
                    value={typedSignature}
                    onChange={(event) => setTypedSignature(event.target.value)}
                    placeholder={demoClient.name}
                  />
                </label>
                <Button
                  size="lg"
                  icon={<FileSignature className="h-5 w-5" />}
                  onClick={signAgreement}
                  disabled={!typedSignature.trim() || !consent || busy}
                >
                  Sign Agreement
                </Button>
              </div>
            </Panel>
          </section>
        )}

        {step === "payment" && selectedAttorney && selectedPracticeArea && caseRecord && (
          <section className="mx-auto grid max-w-4xl gap-5 py-8">
            <Badge tone="gold">Retainer required</Badge>
            <h1 className="text-4xl font-black text-ink sm:text-6xl">Pay retainer to continue.</h1>
            <Panel className="p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[8px] bg-slate-50 p-4">
                  <p className="text-sm font-black uppercase text-cobalt">Retainer</p>
                  <p className="mt-2 text-4xl font-black text-ink">{formatCurrency(selectedPracticeArea.retainerAmount)}</p>
                </div>
                <div className="rounded-[8px] bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-black uppercase text-cobalt">Saved card</p>
                  <p className="mt-2 text-2xl font-black text-ink">Visa ending in 4242</p>
                  <p className="mt-1 text-sm font-bold text-graphite">Stripe-ready route with sandbox fallback for demo.</p>
                </div>
              </div>
              <Button
                className="mt-5 w-full"
                size="lg"
                icon={<CircleDollarSign className="h-5 w-5" />}
                onClick={payRetainer}
                disabled={busy}
              >
                Pay Retainer
              </Button>
            </Panel>
          </section>
        )}

        {step === "pending" && selectedAttorney && caseRecord && agreement && (
          <section className="mx-auto grid max-w-4xl gap-5 py-10">
            <Badge tone="blue">Attorney acceptance pending</Badge>
            <h1 className="text-4xl font-black text-ink sm:text-6xl">Waiting for attorney acceptance.</h1>
            <Panel className="p-5">
              <div className="grid gap-3">
                <StatusLine label="Client signed" active={agreement.signedByClient} />
                <StatusLine
                  label={requiresRetainer(caseRecord.feeModel) ? "Retainer processed" : "No upfront retainer required"}
                  active={payment?.status === "succeeded" || payment?.status === "not_required"}
                />
                <StatusLine label="Attorney accepts engagement" active={false} />
              </div>
              <div className="mt-5 rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-graphite">
                Attorney dashboard control: &quot;I accept this signed agreement and agree to represent this client.&quot;
              </div>
              <Button
                className="mt-5 w-full"
                size="lg"
                icon={<UserRoundCheck className="h-5 w-5" />}
                onClick={acceptEngagementNow}
                disabled={busy}
              >
                Demo Attorney Accepts Engagement
              </Button>
            </Panel>
          </section>
        )}

        {step === "confirmed" && selectedAttorney && selectedCategory && caseRecord && agreement && casePacket && (
          <section className="mx-auto grid max-w-5xl gap-5 py-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Badge tone="green">Agreement executed</Badge>
              <h1 className="mt-4 text-4xl font-black text-ink sm:text-6xl">Attorney retained.</h1>
              <p className="mt-4 text-lg font-bold leading-8 text-graphite">
                Representation has begun because signature, required payment logic, and attorney acceptance are complete.
              </p>
            </div>
            <Panel className="p-5">
              <div className="grid gap-3">
                <StatusLine label="Attorney retained" active />
                <StatusLine label="Agreement fully executed" active={agreement.fullyExecuted} />
                <StatusLine label={`Payment status: ${payment?.status ?? "not required"}`} active />
                <StatusLine label={`Case reference: ${casePacket.reference}`} active />
              </div>
              <div className="mt-5 rounded-[8px] bg-slate-50 p-4">
                <p className="text-sm font-black uppercase text-cobalt">Attorney contact</p>
                <p className="mt-2 text-xl font-black text-ink">{selectedAttorney.name}</p>
                <p className="text-sm font-bold text-graphite">
                  {selectedAttorney.phone} · {selectedAttorney.email}
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] bg-ink px-4 font-black text-white"
                  href={packetJsonHref}
                  target="_blank"
                  download={`${casePacket.reference}.json`}
                >
                  <Download className="h-5 w-5" />
                  JSON Packet
                </a>
                <a
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 font-black text-ink"
                  href={packetPdfHref}
                  target="_blank"
                  download={`${casePacket.reference}.${isStaticDemo ? "txt" : "pdf"}`}
                >
                  <Download className="h-5 w-5" />
                  PDF Packet
                </a>
              </div>
            </Panel>
          </section>
        )}
      </div>

      {bioAttorney && selectedCategory && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink/70 p-0 backdrop-blur sm:place-items-center sm:p-6">
          <section className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-t-[8px] bg-white shadow-legal-glow sm:rounded-[8px]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 p-4 backdrop-blur">
              <h2 className="text-xl font-black text-ink">Full Bio</h2>
              <Button variant="ghost" size="icon" onClick={() => setBioAttorney(null)} aria-label="Close bio">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid gap-5 p-4 sm:grid-cols-[320px_1fr] sm:p-6">
              <button
                className="relative min-h-96 overflow-hidden rounded-[8px]"
                onClick={() => connectNow(bioAttorney)}
                aria-label={`Start video call with ${bioAttorney.name}`}
              >
                <img
                  className="absolute inset-0 h-full w-full object-cover"
                  src={bioAttorney.profilePhotoUrl}
                  alt={`${bioAttorney.name} attorney portrait`}
                />
                <span className="absolute inset-x-4 bottom-4 flex min-h-14 items-center justify-center gap-2 rounded-[8px] bg-white/95 px-4 text-lg font-black text-ink shadow-panel">
                  <Video className="h-5 w-5 text-cobalt" />
                  Tap photo to call
                </span>
              </button>
              <div className="space-y-4">
                <div>
                  <h3 className="text-4xl font-black text-ink">{bioAttorney.name}</h3>
                  <p className="text-lg font-black text-cobalt">{bioAttorney.firmName}</p>
                </div>
                <p className="text-base font-bold leading-8 text-graphite">{bioAttorney.fullBio}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <BioFact label="Experience" value={`${bioAttorney.yearsExperience} years`} />
                  <BioFact label="Practice Areas" value={bioAttorney.practiceAreas.length.toString()} />
                  <BioFact label="Languages" value={bioAttorney.languages.join(", ")} />
                  <BioFact label="Jurisdictions" value={bioAttorney.jurisdictions.join(", ")} />
                  <BioFact label="Office" value={bioAttorney.officeAddress} />
                  <BioFact label="Fee Structure" value={feeLabel(bioAttorney, selectedCategory)} />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatusLine({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-[8px] border border-slate-200 bg-white px-4">
      <span
        className={`grid h-8 w-8 place-items-center rounded-[8px] ${
          active ? "bg-verdict text-white" : "bg-slate-100 text-graphite"
        }`}
      >
        {active ? <Check className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
      </span>
      <span className="text-sm font-black text-ink">{label}</span>
    </div>
  );
}

function BioFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-black uppercase text-cobalt">{label}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-graphite">{value}</p>
    </div>
  );
}
