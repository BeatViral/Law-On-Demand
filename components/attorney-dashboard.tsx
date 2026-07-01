"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  CloudUpload,
  FileJson,
  FileText,
  Link2,
  MonitorCheck,
  PhoneIncoming,
  Power,
  Radio,
  ShieldCheck,
  UserRoundCheck,
  Video
} from "lucide-react";
import { attorneys, demoClient, legalCategories } from "@/lib/data";
import { appPath } from "@/lib/routing";
import { getPracticeArea } from "@/lib/workflows";
import type { AvailabilityStatus, IntegrationType } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Panel } from "./ui/panel";

function attorneyInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const integrationOptions: Array<{ key: IntegrationType; label: string }> = [
  { key: "clio", label: "Clio" },
  { key: "mycase", label: "MyCase" },
  { key: "practicepanther", label: "PracticePanther" },
  { key: "filevine", label: "Filevine" },
  { key: "lawmatics", label: "Lawmatics" },
  { key: "smokeball", label: "Smokeball" },
  { key: "casepeer", label: "CASEpeer" },
  { key: "zapier", label: "Zapier" },
  { key: "make", label: "Make" },
  { key: "email_export", label: "Email export" },
  { key: "pdf_case_packet", label: "PDF case packet" }
];

export function AttorneyDashboard() {
  const attorney = attorneys[0];
  const [status, setStatus] = useState<AvailabilityStatus>("online");
  const [integration, setIntegration] = useState<IntegrationType>(attorney.integrationPreference);
  const [accepted, setAccepted] = useState(false);
  const [exported, setExported] = useState(false);

  const feeRows = useMemo(
    () =>
      legalCategories
        .map((category) => ({
          category,
          area: getPracticeArea(attorney, category.id)
        }))
        .filter((row) => attorney.practiceAreas.some((area) => area.legalCategoryId === row.category.id)),
    [attorney]
  );

  return (
    <main className="min-h-screen bg-app text-ink">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[8px] border border-slate-200 bg-white p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-[8px] bg-[linear-gradient(135deg,#155dfc,#02c7ee,#11a36a)] text-2xl font-black text-white shadow-panel">
              {attorneyInitials(attorney.name)}
            </div>
            <div>
              <Badge tone="green">Attorney dashboard</Badge>
              <h1 className="mt-2 text-3xl font-black sm:text-5xl">{attorney.name}</h1>
              <p className="font-bold text-graphite">{attorney.firmName}</p>
            </div>
          </div>
          <a className="font-black text-cobalt" href={appPath("/")}>
            Client app
          </a>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-cobalt">Availability</p>
                <h2 className="text-2xl font-black">Instant routing status</h2>
              </div>
              <Radio className="h-8 w-8 text-verdict" />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(["online", "available", "busy", "offline"] as AvailabilityStatus[]).map((option) => (
                <button
                  className={`min-h-16 rounded-[8px] border px-3 text-sm font-black transition ${
                    status === option
                      ? "border-cobalt bg-blue-50 text-cobalt"
                      : "border-slate-200 bg-white text-graphite hover:border-cobalt"
                  }`}
                  key={option}
                  onClick={() => setStatus(option)}
                >
                  {option.replace("_", " ").toUpperCase()}
                </button>
              ))}
            </div>
            <p className="mt-4 text-sm font-bold leading-6 text-graphite">
              Only approved, online attorneys with matching practice areas appear in instant client results.
            </p>
          </Panel>

          <Panel className="p-5">
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <Badge tone="red">Incoming call</Badge>
                <h2 className="mt-3 text-3xl font-black">Avery Johnson needs DUI / DWI guidance.</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-graphite">
                  Location: Los Angeles, CA · Matter type: roadside DUI · Preliminary guidance only.
                </p>
              </div>
              <div className="grid gap-2">
                <Button icon={<PhoneIncoming className="h-5 w-5" />}>Accept Call</Button>
                <Button variant="secondary" icon={<Power className="h-5 w-5" />}>
                  Decline
                </Button>
              </div>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Panel className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-cobalt">Fee structure by practice area</p>
                <h2 className="text-2xl font-black">Payment flow settings</h2>
              </div>
              <CircleDollarSign className="h-8 w-8 text-amberlaw" />
            </div>
            <div className="mt-5 grid gap-3">
              {feeRows.map(({ category, area }) => (
                <div
                  className="grid gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[1fr_auto]"
                  key={category.id}
                >
                  <div>
                    <h3 className="text-lg font-black">{category.name}</h3>
                    <p className="text-sm font-bold text-graphite">
                      {area.feeModel === "retainer"
                        ? `${formatCurrency(area.retainerAmount)} required after signature`
                        : `No upfront retainer · ${area.contingencyPercentage ?? 33}% contingency`}
                    </p>
                  </div>
                  <Badge tone={area.feeModel === "retainer" ? "gold" : "cyan"}>{area.feeModel.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-cobalt" />
              <div>
                <p className="text-sm font-black uppercase text-cobalt">Call room</p>
                <h2 className="text-2xl font-black">Private notes</h2>
              </div>
            </div>
            <textarea
              className="mt-5 min-h-48 w-full resize-none rounded-[8px] border border-slate-200 p-4 text-sm font-bold outline-none focus:border-cobalt focus:ring-4 focus:ring-blue-100"
              defaultValue="Client is calm. Preliminary guidance: preserve paperwork, do not discuss facts with third parties, call if detained."
            />
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <Panel className="p-5">
            <Badge tone="blue">Agreement acceptance</Badge>
            <h2 className="mt-3 text-3xl font-black">Client signed. Retainer confirmed.</h2>
            <div className="mt-5 grid gap-3">
              <Status label="User details" value={`${demoClient.name} · ${demoClient.phone}`} />
              <Status label="Agreement type" value="Retainer agreement" />
              <Status label="Payment status" value="$2,500 retainer succeeded" />
            </div>
            <label className="mt-5 flex items-start gap-3 rounded-[8px] border border-slate-200 bg-slate-50 p-4 text-sm font-bold leading-6 text-graphite">
              <input
                className="mt-1 h-5 w-5 accent-cobalt"
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              I accept this signed agreement and agree to represent this client.
            </label>
            <Button
              className="mt-4 w-full"
              disabled={!accepted}
              icon={<UserRoundCheck className="h-5 w-5" />}
            >
              Accept Engagement
            </Button>
          </Panel>

          <Panel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge tone="dark">Integration Suite</Badge>
                <h2 className="mt-3 text-3xl font-black">Your software handles the case.</h2>
              </div>
              <CloudUpload className="h-9 w-9 text-cobalt" />
            </div>
            <p className="mt-3 text-sm font-bold leading-6 text-graphite">
              Lawyer On Demand brings you the client. Export a structured case packet into your existing workflow.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {integrationOptions.map((option) => (
                <button
                  className={`min-h-14 rounded-[8px] border px-3 text-sm font-black transition ${
                    integration === option.key
                      ? "border-cobalt bg-blue-50 text-cobalt"
                      : "border-slate-200 bg-white text-graphite hover:border-cobalt"
                  }`}
                  key={option.key}
                  onClick={() => setIntegration(option.key)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Button variant="secondary" icon={<FileText className="h-5 w-5" />}>
                PDF Packet
              </Button>
              <Button variant="secondary" icon={<FileJson className="h-5 w-5" />}>
                JSON Payload
              </Button>
              <Button
                icon={exported ? <Check className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                onClick={() => setExported(true)}
              >
                {exported ? "Exported" : "Send to Case Software"}
              </Button>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Profile approved", <ShieldCheck className="h-7 w-7" key="a" />],
            ["License manually verified", <BadgeCheck className="h-7 w-7" key="b" />],
            ["Cases ready", <BriefcaseBusiness className="h-7 w-7" key="c" />],
            ["Exports healthy", <MonitorCheck className="h-7 w-7" key="d" />]
          ].map(([label, icon]) => (
            <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm" key={label as string}>
              <div className="text-cobalt">{icon}</div>
              <p className="mt-4 text-xl font-black">{label}</p>
              <ChevronRight className="mt-3 h-5 w-5 text-graphite" />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-white p-3">
      <p className="text-xs font-black uppercase text-cobalt">{label}</p>
      <p className="mt-1 text-sm font-bold text-graphite">{value}</p>
    </div>
  );
}
