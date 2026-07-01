"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileSignature,
  FileText,
  PlugZap,
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
import { cn, formatCurrency } from "@/lib/utils";

type ClientStep = "home" | "attorneys" | "call" | "agreement" | "payment" | "acceptance" | "confirmed" | "packet" | "integrations";
type AppMode = "client" | "attorney" | "admin";
type AttorneyDashStep = "availability" | "video" | "agreement" | "case" | "integrations";
type AdminDashStep = "overview" | "attorneys" | "cases";

type AcceptanceResponse = {
  caseRecord: CaseRecord;
  agreement: Agreement;
  packet: CasePacket;
};

const urgentCategoryIds = ["cat_dui", "cat_stop", "cat_infraction", "cat_auto", "cat_injury", "cat_criminal"];

const appCategories = urgentCategoryIds
  .map((id) => legalCategories.find((category) => category.id === id))
  .filter(Boolean) as LegalCategory[];

const integrationOptions = [
  ["Cl", "Clio"],
  ["MC", "MyCase"],
  ["PP", "PracticePanther"],
  ["FV", "Filevine"],
  ["LM", "Lawmatics"],
  ["SB", "Smokeball"],
  ["CP", "CASEpeer"],
  ["Zp", "Zapier"],
  ["Mk", "Make"],
  ["PDF", "PDF Export"],
  ["Mail", "Email Export"]
];

function resetScroll() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function secondsToClock(seconds: number) {
  const remaining = Math.max(0, 300 - seconds);
  const minutes = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const secs = (remaining % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function attorneyInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function issueGlyph(category: LegalCategory) {
  if (category.id === "cat_dui") return "DUI";
  if (category.id === "cat_stop") return "TS";
  if (category.id === "cat_infraction") return "TI";
  if (category.id === "cat_auto") return "AA";
  if (category.id === "cat_injury") return "PI";
  if (category.id === "cat_criminal") return "CD";
  return "LO";
}

function isNoUpfront(category: LegalCategory) {
  return category.defaultFeeModel === "contingency" || category.defaultFeeModel === "no_retainer";
}

function categoryKind(category: LegalCategory) {
  return isNoUpfront(category) ? "No upfront retainer" : "Retainer required";
}

function categoryTileClass(category: LegalCategory) {
  return isNoUpfront(category) ? "lod-issue-tile lod-issue-tile--contingency" : "lod-issue-tile lod-issue-tile--retainer";
}

function feeTypeLabel(attorney: Attorney, category: LegalCategory) {
  const area = getPracticeArea(attorney, category.id);
  if (area.feeModel === "retainer") return "Retainer Required";
  if (area.feeModel === "contingency") return "Contingency / No upfront retainer";
  if (area.feeModel === "no_retainer") return "No upfront retainer";
  return area.customFeeText ?? "Custom fee terms";
}

function feeTag(attorney: Attorney, category: LegalCategory) {
  const area = getPracticeArea(attorney, category.id);
  if (area.feeModel === "retainer") return `Retainer ${formatCurrency(area.retainerAmount)}`;
  if (area.feeModel === "contingency") return "No upfront retainer";
  if (area.feeModel === "no_retainer") return "No upfront retainer";
  return area.customFeeText ?? "Fee review";
}

function agreementTitle(caseRecord: CaseRecord | null) {
  if (!caseRecord) return "Agreement";
  if (caseRecord.feeModel === "retainer") return "Retainer Agreement";
  if (caseRecord.feeModel === "contingency") return "Contingency Fee Agreement";
  if (caseRecord.feeModel === "no_retainer") return "No-Upfront-Retainer Agreement";
  return "Attorney-Client Agreement";
}

function agreementCopy(caseRecord: CaseRecord, attorney: Attorney, category: LegalCategory) {
  if (caseRecord.feeModel === "retainer") {
    return `This Retainer Agreement is entered into between ${demoClient.name} and ${attorney.firmName} for ${category.name}. Full representation begins only after electronic signature, successful retainer payment, and attorney acceptance.`;
  }

  return `This Contingency Fee Agreement is entered into between ${demoClient.name} and ${attorney.firmName} for ${category.name}. No upfront retainer is required. Full representation begins only after electronic signature and attorney acceptance.`;
}

function paymentStatusLabel(payment: Payment | null, caseRecord: CaseRecord | null) {
  if (!caseRecord) return "Not started";
  if (!requiresRetainer(caseRecord.feeModel)) return "No upfront retainer";
  if (payment?.status === "succeeded") return "Retainer paid";
  return "Retainer required";
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
  const [mode, setMode] = useState<AppMode>("client");
  const [step, setStep] = useState<ClientStep>("home");
  const [attorneyDashStep, setAttorneyDashStep] = useState<AttorneyDashStep>("availability");
  const [adminDashStep, setAdminDashStep] = useState<AdminDashStep>("overview");
  const [selectedCategory, setSelectedCategory] = useState<LegalCategory | null>(null);
  const [selectedAttorney, setSelectedAttorney] = useState<Attorney | null>(null);
  const [bioAttorney, setBioAttorney] = useState<Attorney | null>(null);
  const [videoCall, setVideoCall] = useState<VideoCall | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [casePacket, setCasePacket] = useState<CasePacket | null>(null);
  const [typedSignature, setTypedSignature] = useState(demoClient.name);
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState("Clio");
  const [exported, setExported] = useState(false);

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
      "Law On Demand Case Packet",
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

  function openClientStep(nextStep: ClientStep) {
    setMode("client");
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
    setTypedSignature(demoClient.name);
    setConsent(true);
    setExported(false);
  }

  function chooseCategory(category: LegalCategory) {
    setSelectedCategory(category);
    resetEngagementState();
    openClientStep("attorneys");
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
    openClientStep("call");
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
    openClientStep("agreement");
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
      openClientStep("payment");
    } else {
      const noRetainerPayment = await postJson<Payment>(
        "/api/payments",
        { caseRecord },
        () => createPayment(caseRecord, "not_required")
      );
      setPayment(noRetainerPayment);
      openClientStep("acceptance");
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
    openClientStep("acceptance");
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
    openClientStep("confirmed");
    setBusy(false);
  }

  const activeAttorney = selectedAttorney ?? attorneys[0];
  const activeCategory = selectedCategory ?? appCategories[0];

  return (
    <main className="lod-app-root">
      <div className="lod-meta-bar">
        <div className="lod-eyebrow">Production MVP Prototype</div>
        <h1>Law On Demand</h1>
        <p>Client app, attorney dashboard, admin console, and attorney-owned Integration Suite.</p>
      </div>

      <div className="lod-mode-tabs" aria-label="App mode">
        <ModeTab active={mode === "client"} onClick={() => setMode("client")}>Client App</ModeTab>
        <ModeTab active={mode === "attorney"} onClick={() => setMode("attorney")}>Attorney Portal</ModeTab>
        <ModeTab active={mode === "admin"} onClick={() => setMode("admin")}>Admin Console</ModeTab>
      </div>

      {mode === "client" && (
        <div className="lod-device">
          <div className="lod-notch" />

          {step === "home" && <HomeScreen onChooseCategory={chooseCategory} />}

          {step === "attorneys" && selectedCategory && (
            <AttorneysScreen
              category={selectedCategory}
              attorneys={availableAttorneys}
              busy={busy}
              onBack={() => openClientStep("home")}
              onCall={connectNow}
              onBio={setBioAttorney}
            />
          )}

          {step === "call" && selectedAttorney && selectedCategory && (
            <CallScreen
              attorney={selectedAttorney}
              category={selectedCategory}
              elapsed={elapsed}
              busy={busy}
              onHire={beginHire}
              onBack={() => openClientStep("attorneys")}
              onEnd={() => openClientStep("attorneys")}
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
              onBack={() => openClientStep("call")}
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
              onBack={() => openClientStep("agreement")}
              onPay={payRetainer}
            />
          )}

          {step === "acceptance" && selectedAttorney && selectedCategory && caseRecord && agreement && (
            <AcceptanceScreen
              attorney={selectedAttorney}
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
              caseRecord={caseRecord}
              casePacket={casePacket}
              payment={payment}
              onPacket={() => openClientStep("packet")}
              onHome={() => openClientStep("home")}
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
              onBack={() => openClientStep("confirmed")}
              onIntegrations={() => openClientStep("integrations")}
              onHome={() => openClientStep("home")}
            />
          )}

          {step === "integrations" && (
            <IntegrationSuiteScreen
              casePacket={casePacket}
              selectedIntegration={selectedIntegration}
              exported={exported}
              onBack={() => openClientStep("packet")}
              onSelect={setSelectedIntegration}
              onExport={() => setExported(true)}
            />
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
      )}

      {mode === "attorney" && (
        <AttorneyDashboard
          step={attorneyDashStep}
          attorney={activeAttorney}
          category={activeCategory}
          caseRecord={caseRecord}
          agreement={agreement}
          payment={payment}
          casePacket={casePacket}
          onStep={setAttorneyDashStep}
        />
      )}

      {mode === "admin" && (
        <AdminDashboard step={adminDashStep} onStep={setAdminDashStep} />
      )}
    </main>
  );
}

function ModeTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button className={cn("lod-mode-tab", active && "is-active")} onClick={onClick}>
      {children}
    </button>
  );
}

function HomeScreen({ onChooseCategory }: { onChooseCategory: (category: LegalCategory) => void }) {
  return (
    <section className="lod-screen is-active">
      <div className="lod-home-head">
        <div className="lod-brand-mark">
          <div className="lod-brand-glyph">L</div>
          <span>Law On Demand</span>
        </div>
        <h1>Tap your legal issue.</h1>
        <p className="lod-sub">Connect with an available attorney in 3 clicks. No waiting, no forms first.</p>
      </div>

      <div className="lod-legend" aria-label="Payment path guide">
        <span className="lod-legend-item"><span className="lod-sw lod-sw--navy" />Retainer required</span>
        <span className="lod-legend-item"><span className="lod-sw lod-sw--green" />No upfront retainer</span>
      </div>

      <div className="lod-tile-grid" id="urgent-categories">
        {appCategories.map((category) => {
          const count = getAvailableAttorneys(category.id).length;
          return (
            <button
              className={categoryTileClass(category)}
              key={category.id}
              onClick={() => onChooseCategory(category)}
              data-testid={`category-${category.slug}`}
            >
              <span className="lod-issue-icon">{issueGlyph(category)}</span>
              <span className="lod-issue-name">{category.name}</span>
              <span className="lod-issue-count">{count} online</span>
              <span className={cn("lod-issue-fee", isNoUpfront(category) && "lod-issue-fee--green")}>
                {categoryKind(category)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="lod-home-foot">
        <a className="lod-home-link" href={appPath("/attorney/")} aria-label="Open attorney portal">
          Attorney Portal
        </a>
      </div>
    </section>
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
    <section className="lod-screen is-active">
      <Topbar onBack={onBack} title={category.name} tag="Tap a photo to connect" />

      <div className="lod-results-head">
        <StatusPill live>{availableAttorneys.length} attorneys available now</StatusPill>
      </div>

      <div className="lod-attorney-list">
        {availableAttorneys.map((attorney, index) => (
          <AttorneyCard
            key={attorney.id}
            attorney={attorney}
            category={category}
            featured={index === 0}
            busy={busy}
            onCall={() => onCall(attorney)}
            onBio={() => onBio(attorney)}
          />
        ))}
      </div>
    </section>
  );
}

function AttorneyCard({
  attorney,
  category,
  featured,
  busy,
  onCall,
  onBio
}: {
  attorney: Attorney;
  category: LegalCategory;
  featured: boolean;
  busy: boolean;
  onCall: () => void;
  onBio: () => void;
}) {
  return (
    <article className={cn("lod-attorney-card", featured && "lod-attorney-card--hero")}>
      <div className="lod-attorney-row">
        <button
          className="lod-photo-wrap"
          onClick={onCall}
          disabled={busy}
          aria-label={`Start video call with ${attorney.name}`}
          data-testid={`call-${attorney.id}`}
        >
          <PhotoRing attorney={attorney} />
          <span className="lod-photo-badge">●</span>
        </button>
        <div className="lod-attorney-info">
          <div className="lod-attorney-name">{attorney.name}</div>
          <div className="lod-attorney-firm">{attorney.firmName}</div>
          <div className="lod-tags">
            <span className="lod-tag">{category.name}</span>
            <span className={cn("lod-tag", isNoUpfront(category) ? "lod-tag--green" : "lod-tag--fee")}>
              {feeTag(attorney, category)}
            </span>
            <span className="lod-tag">{attorney.jurisdictions[0]}</span>
          </div>
        </div>
      </div>
      <p className="lod-card-summary">{attorney.shortBio}</p>
      <div className="lod-card-actions">
        <button className="lod-bio-link" onClick={onBio}>Full Bio</button>
        <button className="lod-connect-btn" onClick={onCall}>
          <Video className="h-4 w-4" />
          Connect Now
        </button>
      </div>
      <p className="lod-tap-note">Tap photo to call</p>
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
  attorney: Attorney;
  category: LegalCategory;
  elapsed: number;
  busy: boolean;
  onHire: () => void;
  onBack: () => void;
  onEnd: () => void;
}) {
  return (
    <section className="lod-screen lod-call-screen is-active">
      <div className="lod-call-stage">
        <div className="lod-call-top-info">
          <div className="lod-call-name-tag">
            <div className="lod-call-name">{attorney.name}</div>
            <div className="lod-call-cat">{category.name} - Preliminary Guidance</div>
          </div>
          <div className="lod-guidance-timer">
            <div className="lod-guidance-label">Preliminary Guidance Period</div>
            <div className="lod-guidance-time">{secondsToClock(elapsed)}</div>
          </div>
        </div>
        <div className="lod-attorney-video-avatar">{attorneyInitials(attorney.name)}</div>
        <div className="lod-self-video">You</div>
      </div>
      <div className="lod-call-disclaimer">
        Preliminary guidance only. Full representation begins after you sign, pay if required, and the attorney accepts.
      </div>
      <div className="lod-call-actions">
        <button className="lod-hire-btn" onClick={onHire} disabled={busy} data-testid="hire-now">Hire Me Now</button>
        <div className="lod-call-row-actions">
          <button className="lod-switch-attorney" onClick={onBack} data-testid="choose-another">Choose Another Attorney</button>
          <button className="lod-end-call" onClick={onEnd} data-testid="end-call">End Call</button>
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
  const area = getPracticeArea(attorney, category.id);

  return (
    <section className="lod-screen is-active">
      <Topbar onBack={onBack} title={agreementTitle(caseRecord)} tag="Sign to proceed" />

      <div className="lod-sign-summary">
        <SummaryRow label="Attorney" value={attorney.name} />
        <SummaryRow label="Matter" value={category.name} />
        <SummaryRow label="Agreement type" value={agreementTitle(caseRecord)} />
      </div>

      <span className="lod-field-label">Agreement</span>
      <div className="lod-agreement-box">{agreementCopy(caseRecord, attorney, category)}</div>

      <span className="lod-field-label">Type your full legal name to sign</span>
      <input
        className="lod-sig-input"
        type="text"
        value={typedSignature}
        onChange={(event) => onSignatureChange(event.target.value)}
        placeholder={demoClient.name}
        data-testid="typed-signature"
      />

      <label className="lod-consent-row">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => onConsentChange(event.target.checked)}
          data-testid="signature-consent"
        />
        <span>I agree this constitutes my electronic signature and I consent to be bound by this agreement.</span>
      </label>

      <div className={cn("lod-fee-note", !retainer && "lod-fee-note--green")}>
        {retainer
          ? `Retainer required for this matter. Your card will be charged ${formatCurrency(area.retainerAmount)} once signed.`
          : "No upfront retainer required for this matter."}
      </div>

      <div className="lod-px lod-bottom-pad">
        <button
          className="lod-btn-primary"
          onClick={onContinue}
          disabled={!typedSignature.trim() || !consent || busy}
          data-testid="sign-agreement"
        >
          {retainer ? "Sign & Continue to Payment" : "Sign Agreement"}
        </button>
      </div>
    </section>
  );
}

function PaymentScreen({
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
    <section className="lod-screen is-active">
      <Topbar onBack={onBack} title="Pay Retainer" tag="Final step - retainer matters" />

      <div className="lod-sign-summary">
        <SummaryRow label="Retainer amount" value={formatCurrency(retainerAmount)} />
        <SummaryRow label="Card on file" value="Visa ending 4242" />
        <SummaryRow label="Charged only" value="after signature" />
      </div>

      <div className="lod-fee-note">
        Your card will be charged the full retainer amount. This does not create representation until the attorney accepts.
      </div>

      <div className="lod-px lod-bottom-pad">
        <button className="lod-btn-primary" onClick={onPay} disabled={busy} data-testid="pay-retainer">
          <CircleDollarSign className="h-4 w-4" />
          Pay Retainer - {formatCurrency(retainerAmount)}
        </button>
      </div>
    </section>
  );
}

function AcceptanceScreen({
  attorney,
  caseRecord,
  agreement,
  payment,
  busy,
  onAccept
}: {
  attorney: Attorney;
  caseRecord: CaseRecord;
  agreement: Agreement;
  payment: Payment | null;
  busy: boolean;
  onAccept: () => void;
}) {
  const retainer = requiresRetainer(caseRecord.feeModel);

  return (
    <section className="lod-screen is-active">
      <div className="lod-wait-wrap">
        <div className="lod-spinner" />
        <h2>Waiting for attorney acceptance</h2>
        <p>
          Your signed agreement{retainer ? " and retainer payment" : ""} have been sent to {attorney.name}.
        </p>

        <div className="lod-wait-card">
          <StatusRow label="Signature" value={agreement.signedByClient ? "Complete" : "Pending"} active={agreement.signedByClient} />
          {retainer ? (
            <StatusRow label="Retainer payment" value={payment?.status === "succeeded" ? "Paid" : "Pending"} active={payment?.status === "succeeded"} />
          ) : (
            <StatusRow label="Payment" value="No upfront retainer" active />
          )}
          <StatusRow label="Attorney acceptance" value="Pending" active={false} />
        </div>

        <div className="lod-demo-tag">Demo control - simulates the attorney dashboard</div>
        <button className="lod-btn-primary lod-btn-primary--amber" onClick={onAccept} disabled={busy} data-testid="accept-engagement">
          Attorney Accepts
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function ConfirmedScreen({
  attorney,
  caseRecord,
  casePacket,
  payment,
  onPacket,
  onHome
}: {
  attorney: Attorney;
  caseRecord: CaseRecord;
  casePacket: CasePacket;
  payment: Payment | null;
  onPacket: () => void;
  onHome: () => void;
}) {
  const retainer = requiresRetainer(caseRecord.feeModel);

  return (
    <section className="lod-screen is-active">
      <div className="lod-confirm-wrap">
        <div className="lod-confirm-badge">✓</div>
        <h2>Representation Started</h2>
        <p className="lod-sub">{attorney.name} has accepted your signed agreement. Full representation has begun.</p>

        <div className="lod-confirm-details">
          <DetailRow label="Case reference" value={casePacket.reference} />
          <DetailRow label="Agreement" value="Fully executed" ok />
          <DetailRow label={retainer ? "Retainer" : "Payment"} value={retainer ? `${formatCurrency(payment?.amount)} paid` : "No upfront retainer"} ok />
          <DetailRow label="Attorney" value={attorney.name} />
        </div>

        <button className="lod-btn-primary lod-mb-10" onClick={onPacket}>View Case Packet</button>
        <button className="lod-btn-secondary" onClick={onHome}>Back to Home</button>
      </div>
    </section>
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
  onBack,
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
  onBack: () => void;
  onIntegrations: () => void;
  onHome: () => void;
}) {
  if (!casePacket || !caseRecord || !agreement || !attorney || !category) {
    return (
      <section className="lod-screen is-active">
        <div className="lod-confirm-wrap">
          <div className="lod-confirm-badge">i</div>
          <h2>No case packet yet</h2>
          <p className="lod-sub">Choose a legal issue, call an attorney, sign, and complete acceptance to create a packet.</p>
          <button className="lod-btn-primary" onClick={onHome}>Start New Matter</button>
        </div>
      </section>
    );
  }

  return (
    <section className="lod-screen is-active">
      <Topbar onBack={onBack} title="Case Packet" tag={`Case ${casePacket.reference}`} />

      <PacketSection title="Client">
        <DetailRow label="Name" value={casePacket.client.name} />
        <DetailRow label="Contact" value={casePacket.client.email} />
      </PacketSection>

      <PacketSection title="Attorney">
        <DetailRow label="Name" value={attorney.name} />
        <DetailRow label="Firm" value={attorney.firmName} />
      </PacketSection>

      <PacketSection title="Matter">
        <DetailRow label="Type" value={category.name} />
        <DetailRow label="Agreement status" value={agreement.fullyExecuted ? "Fully executed" : "Pending"} ok={agreement.fullyExecuted} />
        <DetailRow label="Payment status" value={paymentStatusLabel(payment, caseRecord)} ok />
        <DetailRow label="Attorney acceptance" value={caseRecord.attorneyAcceptanceStatus} ok />
      </PacketSection>

      <PacketSection title="Exports">
        <div className="lod-export-links">
          <a href={packetJsonHref} target="_blank" download={`${casePacket.reference}.json`}>
            <Download className="h-4 w-4" />
            JSON
          </a>
          <a href={packetPdfHref} target="_blank" download={`${casePacket.reference}.${isStaticDemo ? "txt" : "pdf"}`}>
            <Download className="h-4 w-4" />
            PDF
          </a>
        </div>
      </PacketSection>

      <div className="lod-px lod-bottom-pad">
        <button className="lod-btn-primary" onClick={onIntegrations}>Export to Integration Suite</button>
      </div>
    </section>
  );
}

function IntegrationSuiteScreen({
  casePacket,
  selectedIntegration,
  exported,
  onBack,
  onSelect,
  onExport
}: {
  casePacket: CasePacket | null;
  selectedIntegration: string;
  exported: boolean;
  onBack: () => void;
  onSelect: (integration: string) => void;
  onExport: () => void;
}) {
  return (
    <section className="lod-screen is-active">
      <Topbar onBack={onBack} title="Integration Suite" tag="Send case to your software" />
      <p className="lod-integration-copy">Attorney-owned export destination. Law On Demand brings the client; the attorney's existing software handles the case.</p>

      <div className="lod-integration-grid">
        {integrationOptions.map(([abbr, name]) => (
          <button
            className={cn("lod-integration-card", selectedIntegration === name && "is-selected")}
            key={name}
            onClick={() => onSelect(name)}
          >
            <span className="lod-integration-ic">{abbr}</span>
            <span className="lod-integration-name">{name}</span>
          </button>
        ))}
      </div>

      {exported && (
        <div className="lod-export-success">Case packet exported to {selectedIntegration}. PDF and JSON backups saved.</div>
      )}

      <div className="lod-px lod-bottom-pad">
        <button className="lod-btn-primary" onClick={onExport}>
          Send to Case Software
        </button>
      </div>
    </section>
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
    <div className="lod-sheet-backdrop">
      <section className="lod-bio-sheet">
        <div className="lod-sheet-head">
          <h2>Full Bio</h2>
          <button onClick={onClose} aria-label="Close bio"><X className="h-5 w-5" /></button>
        </div>
        <div className="lod-attorney-row">
          <button className="lod-photo-wrap" onClick={onCall} aria-label={`Start video call with ${attorney.name}`}>
            <PhotoRing attorney={attorney} />
            <span className="lod-photo-badge">●</span>
          </button>
          <div className="lod-attorney-info">
            <div className="lod-attorney-name">{attorney.name}</div>
            <div className="lod-attorney-firm">{attorney.firmName}</div>
            <div className="lod-tags">
              <span className="lod-tag">{category.name}</span>
              <span className={cn("lod-tag", isNoUpfront(category) ? "lod-tag--green" : "lod-tag--fee")}>{feeTag(attorney, category)}</span>
            </div>
          </div>
        </div>
        <p className="lod-card-summary">{attorney.fullBio}</p>
        <button className="lod-btn-primary" onClick={onCall}>Tap photo to call</button>
      </section>
    </div>
  );
}

function AttorneyDashboard({
  step,
  attorney,
  category,
  caseRecord,
  agreement,
  payment,
  casePacket,
  onStep
}: {
  step: AttorneyDashStep;
  attorney: Attorney;
  category: LegalCategory;
  caseRecord: CaseRecord | null;
  agreement: Agreement | null;
  payment: Payment | null;
  casePacket: CasePacket | null;
  onStep: (step: AttorneyDashStep) => void;
}) {
  return (
    <DashboardFrame
      title="Attorney Portal"
      url="app.lawyerondemand.com/attorney"
      sidebar={[
        ["availability", "Availability"],
        ["video", "Video Room"],
        ["agreement", "Agreement Review"],
        ["case", "Case Management"],
        ["integrations", "Integration Suite"]
      ]}
      active={step}
      onStep={(value) => onStep(value as AttorneyDashStep)}
    >
      {step === "availability" && (
        <>
          <DashHeader title="Availability" sub="Only online attorneys appear in instant client results." right={<StatusPill live>Online</StatusPill>} />
          <PanelCard title="Your status" desc="Toggle this any time. It controls whether clients can reach you right now.">
            <div className="lod-avail-toggle">
              <button className="is-selected">Available</button>
              <button>Busy</button>
              <button>Offline</button>
            </div>
          </PanelCard>
          <PanelCard title="Incoming calls" desc="Clients who tapped your photo appear here in real time.">
            <div className="lod-incoming-row">
              <div>
                <div className="lod-row-name">{demoClient.name}</div>
                <div className="lod-row-meta">{category.name} - requesting now</div>
              </div>
              <button className="lod-mini-btn" onClick={() => onStep("video")}>Accept</button>
            </div>
          </PanelCard>
        </>
      )}

      {step === "video" && (
        <>
          <DashHeader title="Video Room" sub={`${casePacket?.reference ?? "LOD-DEMO"} - Preliminary Guidance`} right={<StatusPill>Timer 02:47</StatusPill>} />
          <PanelCard dark>
            <div className="lod-dash-video-row">
              <div className="lod-client-video">Client video</div>
              <div>
                <div className="lod-dash-video-name">{demoClient.name}</div>
                <div className="lod-dash-video-meta">{category.name} - Preliminary guidance only</div>
                <div className="lod-dash-video-note">Hire Me Now: {caseRecord ? "triggered" : "not yet triggered"}</div>
              </div>
            </div>
          </PanelCard>
          <PanelCard title="Private notes" desc="Not visible to the client. Carries into the case packet if hired.">
            <textarea className="lod-notes-area" defaultValue="Advised client to preserve records and avoid missing deadlines. Client indicated intent to hire." />
          </PanelCard>
          <button className="lod-mini-btn" onClick={() => onStep("agreement")}>Client Tapped Hire Me Now</button>
        </>
      )}

      {step === "agreement" && (
        <>
          <DashHeader title="Agreement Review" sub="Confirm terms before accepting the engagement." />
          <PanelCard title={demoClient.name} desc={`${category.name} - ${caseRecord ? agreementTitle(caseRecord) : categoryKind(category)}`}>
            <DashTable
              rows={[
                ["Agreement", agreement?.signedByClient ? "Signed electronically" : "Awaiting signature"],
                ["Payment", paymentStatusLabel(payment, caseRecord)],
                ["Matter", category.name]
              ]}
            />
            <label className="lod-checkbox-row">
              <input type="checkbox" defaultChecked />
              <span>I accept this signed agreement and agree to represent this client.</span>
            </label>
            <button className="lod-mini-btn lod-mini-btn--amber" onClick={() => onStep("case")}>Accept Engagement</button>
          </PanelCard>
        </>
      )}

      {step === "case" && (
        <>
          <DashHeader title="Case Management" sub={`${casePacket?.reference ?? "LOD-DEMO"} - Representation active`} right={<StatusPill green>Active</StatusPill>} />
          <PanelCard>
            <DashTable
              rows={[
                ["Client", demoClient.name],
                ["Matter", category.name],
                ["Agreement", agreement?.fullyExecuted ? "Executed" : "Pending"],
                ["Payment", paymentStatusLabel(payment, caseRecord)],
                ["Recording", "Placeholder link"],
                ["Documents", "None uploaded"]
              ]}
            />
            <button className="lod-mini-btn lod-mini-btn--outline" onClick={() => onStep("integrations")}>Export to Integration Suite</button>
          </PanelCard>
        </>
      )}

      {step === "integrations" && (
        <>
          <DashHeader title="Integration Suite" sub="Choose where new cases get sent automatically." />
          <div className="lod-int-grid-desktop">
            {integrationOptions.map(([abbr, name], index) => (
              <div className={cn("lod-int-card-d", index === 0 && "is-selected")} key={name}>
                <div className="lod-int-card-ic">{abbr}</div>
                <div className="lod-int-card-name">{name}</div>
              </div>
            ))}
          </div>
          <PanelCard title={casePacket?.reference ?? "Case packet"} desc="Sent to Clio. PDF and JSON backups generated automatically.">
            <StatusPill green>Export successful</StatusPill>
          </PanelCard>
        </>
      )}
    </DashboardFrame>
  );
}

function AdminDashboard({ step, onStep }: { step: AdminDashStep; onStep: (step: AdminDashStep) => void }) {
  return (
    <DashboardFrame
      title="Admin Console"
      url="app.lawyerondemand.com/admin"
      sidebar={[
        ["overview", "Overview"],
        ["attorneys", "Attorneys"],
        ["cases", "Cases"]
      ]}
      active={step}
      onStep={(value) => onStep(value as AdminDashStep)}
    >
      {step === "overview" && (
        <>
          <DashHeader title="Overview" sub="Live platform activity" />
          <div className="lod-stat-grid">
            <StatCard value="1,204" label="Total users" />
            <StatCard value="86" label="Total attorneys" />
            <StatCard value="34" label="Online now" />
            <StatCard value="512" label="Total calls" />
            <StatCard value="318" label="Signed agreements" />
            <StatCard value="296" label="Retained cases" />
            <StatCard value="$412K" label="Retainer payments" />
            <StatCard value="7" label="Pending approvals" />
          </div>
          <PanelCard title="Pending attorney approvals">
            <div className="lod-incoming-row">
              <div>
                <div className="lod-row-name">Amara Osei</div>
                <div className="lod-row-meta">Family Law - Bar #NSW-88213</div>
              </div>
              <button className="lod-mini-btn" onClick={() => onStep("attorneys")}>Review</button>
            </div>
          </PanelCard>
        </>
      )}

      {step === "attorneys" && (
        <>
          <DashHeader title="Manage Attorneys" sub="Approve, suspend, or verify license status" />
          <DataTable
            headers={["Name", "Firm", "Category", "Status"]}
            rows={[
              ["Sarah Mitchell", "Mitchell Defence Group", "DUI / DWI", "Approved"],
              ["Elena Rodriguez", "Rodriguez Injury Law", "Auto Accident", "Approved"],
              ["Michael Grant", "Grant Criminal Defence", "Criminal Defence", "Approved"],
              ["Amara Osei", "Osei Family Law", "Family Law", "Pending"]
            ]}
          />
        </>
      )}

      {step === "cases" && (
        <>
          <DashHeader title="Manage Cases" sub="Full pipeline status per case" />
          <DataTable
            headers={["Case", "Client", "Attorney", "Matter", "Payment", "Status"]}
            rows={[
              ["LOD-88213", "A. Johnson", "S. Mitchell", "DUI / DWI", "Paid", "Active"],
              ["LOD-88214", "R. Nguyen", "E. Rodriguez", "Auto Accident", "No upfront retainer", "Active"],
              ["LOD-88215", "T. Brooks", "M. Grant", "Criminal Defence", "Pending", "Awaiting acceptance"]
            ]}
          />
        </>
      )}
    </DashboardFrame>
  );
}

function DashboardFrame({
  title,
  url,
  sidebar,
  active,
  onStep,
  children
}: {
  title: string;
  url: string;
  sidebar: Array<[string, string]>;
  active: string;
  onStep: (step: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="lod-desktop">
      <div className="lod-browser-bar">
        <div className="lod-browser-dot lod-red" />
        <div className="lod-browser-dot lod-yellow" />
        <div className="lod-browser-dot lod-green" />
        <div className="lod-browser-url">{url}</div>
      </div>
      <div className="lod-dash-layout">
        <aside className="lod-sidebar">
          <div className="lod-sidebar-brand">
            <div className="lod-brand-glyph">L</div>
            <span>{title}</span>
          </div>
          {sidebar.map(([id, label]) => (
            <button className={cn("lod-sidebar-item", active === id && "is-on")} key={id} onClick={() => onStep(id)}>
              {label}
            </button>
          ))}
          <div className="lod-sidebar-divider" />
          <div className="lod-sidebar-foot">Law On Demand</div>
        </aside>
        <section className="lod-dash-main">{children}</section>
      </div>
    </div>
  );
}

function Topbar({ title, tag, onBack }: { title: string; tag: string; onBack?: () => void }) {
  return (
    <div className="lod-topbar">
      {onBack && (
        <button className="lod-back-circle" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      <div>
        <h2>{title}</h2>
        <div className="lod-step-tag">{tag}</div>
      </div>
    </div>
  );
}

function PhotoRing({ attorney }: { attorney: Attorney }) {
  return (
    <span className="lod-photo-ring">
      <span className="lod-photo-inner">{attorneyInitials(attorney.name)}</span>
    </span>
  );
}

function StatusPill({
  children,
  live,
  green
}: {
  children: ReactNode;
  live?: boolean;
  green?: boolean;
}) {
  return (
    <span className={cn("lod-status-pill", green && "lod-status-pill--green")}>
      {live && <span className="lod-live-dot" />}
      {children}
    </span>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="lod-summary-row">
      <span className="lod-summary-key">{label}</span>
      <span className="lod-summary-value">{value}</span>
    </div>
  );
}

function StatusRow({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="lod-wait-row">
      <span className="lod-wait-key">{label}</span>
      <span className={cn("lod-wait-value", active && "is-active")}>{active ? "✓ " : ""}{value}</span>
    </div>
  );
}

function DetailRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="lod-detail-row">
      <span className="lod-detail-key">{label}</span>
      <span className={cn("lod-detail-value", ok && "is-ok")}>{value}</span>
    </div>
  );
}

function PacketSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="lod-packet-section">
      <div className="lod-packet-heading">{title}</div>
      {children}
    </section>
  );
}

function DashHeader({ title, sub, right }: { title: string; sub: string; right?: ReactNode }) {
  return (
    <div className="lod-dash-header">
      <div>
        <h2>{title}</h2>
        <div className="lod-dash-sub">{sub}</div>
      </div>
      {right}
    </div>
  );
}

function PanelCard({ title, desc, dark, children }: { title?: string; desc?: string; dark?: boolean; children: ReactNode }) {
  return (
    <section className={cn("lod-panel-card", dark && "lod-panel-card--dark")}>
      {title && <h3>{title}</h3>}
      {desc && <p className="lod-panel-desc">{desc}</p>}
      {children}
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article className="lod-stat-card">
      <div className="lod-stat-value">{value}</div>
      <div className="lod-stat-label">{label}</div>
    </article>
  );
}

function DashTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="lod-dash-table">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <td>{label}</td>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="lod-data-table">
      <thead>
        <tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join("-")}>{row.map((cell, index) => <td key={`${cell}-${index}`}>{cell}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}
