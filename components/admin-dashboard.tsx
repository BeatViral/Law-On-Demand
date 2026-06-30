import {
  BadgeDollarSign,
  BriefcaseBusiness,
  CheckCircle2,
  DatabaseZap,
  FileSignature,
  Gavel,
  Link2,
  ShieldAlert,
  UsersRound,
  Video
} from "lucide-react";
import { adminStats, attorneys, demoClient, legalCategories } from "@/lib/data";
import { Badge } from "./ui/badge";
import { Panel } from "./ui/panel";

export function AdminDashboard() {
  const statCards = [
    ["Total users", adminStats.totalUsers, <UsersRound className="h-7 w-7" key="users" />],
    ["Total attorneys", adminStats.totalAttorneys, <Gavel className="h-7 w-7" key="attorneys" />],
    ["Online attorneys", adminStats.onlineAttorneys, <Video className="h-7 w-7" key="online" />],
    ["Total calls", adminStats.totalCalls, <DatabaseZap className="h-7 w-7" key="calls" />],
    ["Signed agreements", adminStats.totalSignedAgreements, <FileSignature className="h-7 w-7" key="agreements" />],
    ["Retained cases", adminStats.totalRetainedCases, <BriefcaseBusiness className="h-7 w-7" key="cases" />],
    ["Retainer payments", adminStats.totalRetainerPayments, <BadgeDollarSign className="h-7 w-7" key="payments" />],
    ["Pending acceptance", adminStats.pendingAcceptanceCases, <ShieldAlert className="h-7 w-7" key="pending" />]
  ];

  return (
    <main className="min-h-screen bg-app text-ink">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[8px] border border-slate-200 bg-white p-5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="dark">Admin dashboard</Badge>
            <h1 className="mt-3 text-4xl font-black sm:text-6xl">Operational command center.</h1>
            <p className="mt-2 max-w-2xl text-base font-bold leading-7 text-graphite">
              Clean tables for approvals, users, cases, payments, subscriptions, and integrations.
            </p>
          </div>
          <a className="font-black text-cobalt" href="/">
            Client app
          </a>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(([label, value, icon]) => (
            <div className="rounded-[8px] border border-slate-200 bg-white p-5 shadow-sm" key={label as string}>
              <div className="flex items-center justify-between text-cobalt">
                {icon}
                <span className="text-3xl font-black text-ink">{value as number}</span>
              </div>
              <p className="mt-4 text-sm font-black uppercase text-graphite">{label as string}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel className="overflow-hidden">
            <TableTitle title="Manage attorneys" subtitle="Approve, reject, suspend, and verify licenses manually." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-graphite">
                  <tr>
                    <th className="px-4 py-3">Attorney</th>
                    <th className="px-4 py-3">Practice</th>
                    <th className="px-4 py-3">License</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Integration</th>
                  </tr>
                </thead>
                <tbody>
                  {attorneys.map((attorney) => (
                    <tr className="border-t border-slate-200" key={attorney.id}>
                      <td className="px-4 py-4">
                        <p className="font-black text-ink">{attorney.name}</p>
                        <p className="font-bold text-graphite">{attorney.firmName}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-graphite">
                        {attorney.practiceAreas.length} areas
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone="green">{attorney.licenseStatus}</Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone="cyan">{attorney.availabilityStatus}</Badge>
                      </td>
                      <td className="px-4 py-4 font-bold text-graphite">
                        {attorney.integrationPreference.replace("_", " ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <TableTitle title="Manage legal categories" subtitle="Default payment flows by matter type." />
            <div className="divide-y divide-slate-200">
              {legalCategories.map((category) => (
                <div className="flex items-center justify-between gap-3 p-4" key={category.id}>
                  <div>
                    <p className="font-black text-ink">{category.name}</p>
                    <p className="text-sm font-bold text-graphite">{category.urgency}</p>
                  </div>
                  <Badge tone={category.defaultFeeModel === "retainer" ? "gold" : "cyan"}>
                    {category.defaultFeeModel.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <Panel className="overflow-hidden lg:col-span-2">
            <TableTitle title="Manage cases" subtitle="Agreement, payment, acceptance, and representation status." />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase text-graphite">
                  <tr>
                    <th className="px-4 py-3">Case ID</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Attorney</th>
                    <th className="px-4 py-3">Matter</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attorneys.slice(0, 4).map((attorney, index) => (
                    <tr className="border-t border-slate-200" key={attorney.id}>
                      <td className="px-4 py-4 font-black text-ink">LOD-{String(4100 + index)}</td>
                      <td className="px-4 py-4 font-bold text-graphite">{demoClient.name}</td>
                      <td className="px-4 py-4 font-bold text-graphite">{attorney.name}</td>
                      <td className="px-4 py-4 font-bold text-graphite">
                        {legalCategories[index]?.name ?? "Other Legal Help"}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={index % 2 ? "blue" : "green"}>
                          {index % 2 ? "pending acceptance" : "represented"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="p-5">
            <Badge tone="blue">Subscriptions</Badge>
            <h2 className="mt-3 text-3xl font-black">Attorney plans</h2>
            <div className="mt-5 grid gap-3">
              {["Basic listing", "Premium listing", "Featured listing", "Priority queue listing"].map((plan) => (
                <div className="flex items-center gap-3 rounded-[8px] border border-slate-200 p-3" key={plan}>
                  <CheckCircle2 className="h-5 w-5 text-verdict" />
                  <span className="text-sm font-black text-ink">{plan}</span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel className="p-5">
            <Badge tone="gold">Payments</Badge>
            <h2 className="mt-3 text-3xl font-black">Retainers, subscriptions, failures, refunds.</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {["Retainer payments", "Attorney subscriptions", "Failed payments", "Refund placeholder"].map((item) => (
                <div className="rounded-[8px] bg-slate-50 p-4 font-black text-graphite" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </Panel>
          <Panel className="p-5">
            <Badge tone="cyan">Integrations</Badge>
            <h2 className="mt-3 text-3xl font-black">Export health and fallback status.</h2>
            <div className="mt-5 grid gap-3">
              {["Clio exports healthy", "PDF fallback enabled", "JSON payload generated", "Email export placeholder"].map(
                (item) => (
                  <div className="flex items-center gap-3 rounded-[8px] bg-slate-50 p-4 font-black text-graphite" key={item}>
                    <Link2 className="h-5 w-5 text-cobalt" />
                    {item}
                  </div>
                )
              )}
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function TableTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-slate-200 p-5">
      <h2 className="text-2xl font-black text-ink">{title}</h2>
      <p className="mt-1 text-sm font-bold text-graphite">{subtitle}</p>
    </div>
  );
}
