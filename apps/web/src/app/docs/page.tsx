import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleDollarSign, Clock3, Landmark, ShieldCheck, Target, Wallet, Network, Coins, Code2, GitBranch, TimerReset } from "lucide-react";

const quickSections = [
  {
    icon: <Target size={18} />,
    title: "Purpose",
    body: "Pulseodd is built to make short-horizon market calls transparent: users choose a side, see the active pool, and follow a visible path from entry to settlement."
  },
  {
    icon: <Clock3 size={18} />,
    title: "Round lifecycle",
    body: "Markets run in short windows. Entry closes before settlement, the final result is recorded, and winning positions become claimable through the same wallet flow."
  },
  {
    icon: <ShieldCheck size={18} />,
    title: "Settlement discipline",
    body: "Charts are context only. The outcome is intended to come from the configured on-chain oracle path, keeping display data separate from the settlement source."
  },
  {
    icon: <Wallet size={18} />,
    title: "Working protocol",
    body: "The current release runs on Robinhood Chain with wallet connection, market rounds, entry, lock, settlement, and claim flows represented in the product."
  }
];

const roadmap = [
  { label: "Live now", title: "Robinhood network", body: "The Pulseodd product and protocol flow are currently presented as operational on Robinhood Chain, including market discovery, wallet interaction, round lifecycle, and settlement UX." },
  { label: "Ready", title: "Mainnet preparation", body: "The mainnet plan covers contract verification, oracle and keeper monitoring, treasury controls, buyback execution, incident response, and launch communications." },
  { label: "8 October 2026", title: "Mainnet launch", body: "Pulseodd's planned mainnet launch date is 8 October 2026, subject to final deployment checks, security sign-off, and network readiness." }
];

const technicalSections = [
  {
    icon: <Code2 size={20} />,
    eyebrow: "Contract layer",
    title: "A round is an explicit state machine.",
    body: "Each market round carries an identifier, asset symbol, duration, entry deadline, end timestamp, reference price, final price, side totals, settlement state, and claim state. The contract rejects entries after lock, prevents double settlement, and keeps claims separate from settlement so payout execution remains user-driven.",
    points: ["Open → locked → settled → claimable", "Per-round positions accumulate by account and side", "Tie outcomes follow the configured refund path", "Emergency pause is reserved for operational incidents"]
  },
  {
    icon: <GitBranch size={20} />,
    eyebrow: "Oracle and keeper",
    title: "Display data and settlement authority stay separate.",
    body: "The frontend chart is a read-only market context layer. A configured oracle adapter records the settlement observation, while the keeper coordinates time-based lock, settlement, and next-round creation. This separation makes the path auditable and allows monitoring to detect stale or missing inputs.",
    points: ["Oracle adapter validates the settlement relay", "Keeper actions are time-gated and observable", "Round creation can be resumed after an interruption", "The UI surfaces status instead of inventing an outcome"]
  },
  {
    icon: <TimerReset size={20} />,
    eyebrow: "Operations",
    title: "Mainnet readiness is a release process.",
    body: "Before the 8 October 2026 target, deployment addresses, bytecode, permissions, oracle relayers, keeper credentials, treasury routes, monitoring alerts, and rollback procedures should be reviewed as one operational system. Environment-driven configuration keeps testnet and mainnet values isolated.",
    points: ["Never expose keeper credentials to the browser", "Verify contract addresses and chain IDs at deploy time", "Track fee routing and buybacks with on-chain evidence", "Publish incident contacts and status updates"]
  }
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-[#f7f8f6] px-5 py-10 text-slate-950 md:px-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/classic" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> Back to terminal</Link>

        <section className="mt-12 border-b border-slate-200 pb-12">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Pulseodd documentation</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">A prediction market built for clear market calls.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Pulseodd turns short market direction questions into a simple pooled experience: pick Up or Down, enter before lock, let the oracle path settle the round, and claim from the pool when your side wins.</p>
            </div>
            <div className="border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Protocol direction</p>
              <p className="mt-4 text-2xl font-semibold">Transparent pools first. Sustainable token economics second.</p>
              <p className="mt-4 leading-7 text-slate-600">Pulseodd is currently presented as an operational Robinhood Chain product. The protocol is being prepared for a scheduled mainnet launch on 8 October 2026, with deployment and security checks tracked as release gates.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-10 md:grid-cols-2 lg:grid-cols-4">
          {quickSections.map((section) => <article key={section.title} className="border border-slate-200 bg-white p-6"><div className="text-emerald-700">{section.icon}</div><h2 className="mt-5 text-xl font-semibold">{section.title}</h2><p className="mt-3 leading-7 text-slate-600">{section.body}</p></article>)}
        </section>

        <section className="grid gap-5 border-t border-slate-200 py-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Vision</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">A clean market layer for fast, understandable outcomes.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-600">
            <p>Our vision is to make prediction markets feel less like a hidden order book and more like a direct decision interface. A user should understand the reference price, the timer, the pool, the settlement route, and the claim path without needing to decode protocol internals.</p>
            <p>Pulseodd starts with Classic pooled markets because the structure is easy to inspect: both sides contribute to a shared pool, the winning side shares the claimable amount after fees, and the settlement record explains why the round resolved the way it did.</p>
          </div>
        </section>

        <section className="grid gap-5 border-t border-slate-200 py-12 lg:grid-cols-3">
          <article className="border border-slate-200 bg-[#081119] p-7 text-white lg:col-span-2">
            <CircleDollarSign className="text-[#c8ff38]" size={24} />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-lime-200">Mainnet economics</p>
            <h2 className="mt-3 text-3xl font-semibold">1% protocol fee, with 80% planned for buybacks.</h2>
            <p className="mt-5 max-w-3xl leading-8 text-slate-300">The planned mainnet model applies a 1% protocol fee to completed transactions. 80% of collected fees is earmarked for token buybacks, while the remaining 20% is reserved for protocol operations, infrastructure, monitoring, and treasury needs. Buybacks should be executed through a transparent, auditable route with clear treasury permissions and on-chain reporting.</p>
          </article>
          <article className="border border-slate-200 bg-white p-7">
            <Landmark className="text-emerald-700" size={24} />
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Treasury controls</p>
            <h2 className="mt-3 text-2xl font-semibold">Buyback execution must be visible.</h2>
            <p className="mt-4 leading-7 text-slate-600">Fee collection, buyback transactions, and treasury movements should be trackable on-chain so users can verify that the economic model is being followed.</p>
          </article>
        </section>

        <section className="border-t border-slate-200 py-12">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="border border-slate-200 bg-white p-6 md:col-span-2">
              <div className="flex items-center gap-3 text-emerald-700"><Coins size={21} /><p className="text-xs font-semibold uppercase tracking-[0.16em]">Token reference</p></div>
              <h2 className="mt-4 text-2xl font-semibold">Pulseodd token on Robinhood Chain</h2>
              <p className="mt-3 leading-7 text-slate-600">This is the public contract address supplied for the Pulseodd token. Always verify the chain, bytecode, ownership state, and liquidity venue before interacting with any asset.</p>
              <code className="mt-5 block overflow-x-auto border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-900">0x3E5300c0664Ae607bF0A9A2D84A4aAD6bEbbfB98</code>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="font-mono text-slate-500">CA: 0x3E5300c0664Ae607bF0A9A2D84A4aAD6bEbbfB98</span>
                <a href="https://www.ponsfamily.com/launchpad/0x3E5300c0664Ae607bF0A9A2D84A4aAD6bEbbfB98" target="_blank" rel="noreferrer" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 hover:text-slate-950">Buy Token</a>
              </div>
            </article>
            <article className="border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 text-emerald-700"><Network size={21} /><p className="text-xs font-semibold uppercase tracking-[0.16em]">Network status</p></div>
              <h2 className="mt-4 text-2xl font-semibold">Robinhood Chain</h2>
              <p className="mt-3 leading-7 text-slate-600">The app is configured around Robinhood Chain infrastructure. Network parameters and deployment addresses remain environment-driven for safer releases.</p>
            </article>
          </div>
        </section>

        <section className="border-t border-slate-200 py-12">
          <div className="mb-7 flex items-end justify-between gap-6">
            <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Technical architecture</p><h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl">The protocol is designed to be inspected at every step.</h2></div>
            <p className="hidden max-w-xs text-right text-sm leading-6 text-slate-500 md:block">Web app → SDK → contracts → oracle → keeper → treasury</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {technicalSections.map((section) => <article key={section.title} className="border border-slate-200 bg-white p-6"><div className="text-emerald-700">{section.icon}</div><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{section.eyebrow}</p><h3 className="mt-3 text-2xl font-semibold leading-tight">{section.title}</h3><p className="mt-4 leading-7 text-slate-600">{section.body}</p><ul className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm leading-6 text-slate-700">{section.points.map((point) => <li key={point} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{point}</li>)}</ul></article>)}
          </div>
        </section>

        <section className="border-t border-slate-200 py-12">
          <div className="mb-7 flex items-center gap-3"><CalendarDays className="text-emerald-700" size={22} /><h2 className="text-3xl font-semibold tracking-tight">Roadmap to mainnet</h2></div>
          <div className="grid gap-4 md:grid-cols-3">
            {roadmap.map((item) => <article key={item.title} className="border border-slate-200 bg-white p-6"><p className="font-mono text-xs uppercase tracking-[0.16em] text-emerald-700">{item.label}</p><h3 className="mt-4 text-xl font-semibold">{item.title}</h3><p className="mt-3 leading-7 text-slate-600">{item.body}</p></article>)}
          </div>
        </section>

        <section className="border-t border-slate-200 py-12">
          <h2 className="text-3xl font-semibold tracking-tight">Release and risk disclosure</h2>
          <p className="mt-4 max-w-3xl leading-8 text-slate-600">The 8 October 2026 date is the current launch plan, not a guarantee. Smart contracts, oracle inputs, keeper operations, fee routing, buyback execution, and treasury permissions must be independently reviewed before value-bearing mainnet use. Nothing on this page is a promise of returns or financial advice.</p>
        </section>

        <section className="border-t border-slate-200 py-12">
          <div className="grid gap-5 border border-slate-200 bg-white p-7 md:grid-cols-[0.8fr_1.2fr] md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Support and contact</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Reach the Pulseodd team.</h2>
            </div>
            <div>
              <p className="leading-8 text-slate-600">For support, testnet feedback, technical questions, or partnership inquiries, contact the team by email.</p>
              <a href="mailto:pulse@pulseodd.com" className="mt-5 inline-flex border border-slate-950 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950">pulse@pulseodd.com</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
