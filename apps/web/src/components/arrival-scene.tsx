"use client";

import { ArrowUpRight, ChartNoAxesCombined, Rocket, ShieldCheck, Waves } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { PulseoddMark } from "./pulseodd-mark";

export function ArrivalScene({ onLaunch }: { onLaunch: () => void }) {
  const [entering, setEntering] = useState(false);
  const audioRef = useRef<{ context: AudioContext; gain: GainNode; interval: number } | null>(null);

  const startSound = useCallback(() => {
    if (audioRef.current) return;
    const context = new AudioContext();
    void context.resume();
    const gain = context.createGain();
    gain.gain.value = 0.32;
    gain.connect(context.destination);
    const notes = [146.83, 174.61, 220, 174.61];
    let step = 0;
    const playNote = () => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = notes[step++ % notes.length];
      envelope.gain.setValueAtTime(0.0001, context.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.08);
      envelope.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.1);
      oscillator.connect(envelope).connect(gain);
      oscillator.start();
      oscillator.stop(context.currentTime + 1.15);
    };
    playNote();
    const interval = window.setInterval(playNote, 1_280);
    audioRef.current = { context, gain, interval };
  }, []);

  const enterApp = useCallback(() => {
    if (entering) return;
    startSound();
    const audio = audioRef.current;
    if (audio) {
      [440, 659.25, 880].forEach((frequency, index) => {
        const oscillator = audio.context.createOscillator();
        const envelope = audio.context.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(0.0001, audio.context.currentTime + index * 0.07);
        envelope.gain.exponentialRampToValueAtTime(0.14, audio.context.currentTime + index * 0.07 + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.0001, audio.context.currentTime + index * 0.07 + 0.28);
        oscillator.connect(envelope).connect(audio.gain);
        oscillator.start(audio.context.currentTime + index * 0.07);
        oscillator.stop(audio.context.currentTime + index * 0.07 + 0.32);
      });
    }
    setEntering(true);
    window.setTimeout(() => {
      onLaunch();
    }, 360);
  }, [entering, onLaunch, startSound]);

  return (<>
    <section onPointerDown={startSound} className={`relative isolate flex min-h-[100svh] items-center overflow-hidden bg-[#05080d] px-5 py-8 transition-[opacity,transform] duration-500 md:px-10 ${entering ? "scale-[1.025] opacity-0" : "opacity-100"}`}>
      <div className="hero-grid absolute inset-0 -z-10 opacity-45" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />
      <div className="absolute right-0 top-1/4 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full bg-cyan-400/10 blur-[150px]" />
      <div className="absolute bottom-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-rose-500/10 blur-[160px]" />

      <div className="mx-auto grid w-full max-w-[1480px] items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 max-w-2xl py-16">
          <div className="mb-7 flex items-center gap-3 text-sm font-medium text-slate-300">
            <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_18px_rgba(190,255,105,0.8)]" />
            Short horizon markets, settled on-chain
          </div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.18em] text-cyan-200/70">Robinhood Chain / Classic pools</p>
          <h1 className="max-w-xl text-5xl font-semibold leading-[0.96] text-white sm:text-7xl">
            See the move.
            <span className="block text-slate-400">Make the call.</span>
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-slate-400 md:text-lg">
            A focused prediction market for the next minute. Choose a side, enter before lock, and follow a visible settlement path from oracle to claim.
          </p>
          <button onClick={enterApp} className="mt-10 inline-flex items-center gap-2 border border-cyan-100/60 bg-cyan-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200">
            <Rocket size={17} /> Launch App
          </button>
        </div>

        <div className="pointer-events-none relative grid h-[320px] w-full place-items-center opacity-90 sm:h-[440px] lg:h-[580px] lg:opacity-100" aria-hidden="true">
          <div className={`hero-logo-sweep relative grid h-52 w-52 place-items-center border border-lime-200/30 bg-[#c8ff38] shadow-[0_32px_100px_rgba(200,255,56,0.24)] sm:h-72 sm:w-72 ${entering ? "scale-[1.65]" : ""}`}>
            <PulseoddMark className="h-full w-full text-[#c8ff38]" />
          </div>
          <div className="absolute bottom-[11%] left-1/2 hidden -translate-x-1/2 border-t border-white/10 pt-3 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 lg:block">Pulseodd / Classic pools</div>
        </div>
      </div>

    </section>
    <section className="overflow-hidden bg-[#f7f8f6] px-5 py-20 text-slate-900 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Pulseodd beta</p><h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight md:text-6xl">The mechanics behind a decisive market call.</h2></div>
          <p className="max-w-xl text-base leading-8 text-slate-600 md:text-lg">Pulseodd makes a very short price question explicit. A market opens with a visible reference, its entry window closes on a clock, and a final oracle observation resolves the result. The chart gives context. The settlement route gives the outcome.</p>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="min-h-[340px] border border-slate-200 bg-[#081119] p-7 text-white md:p-10">
            <div className="flex h-full max-w-xl flex-col justify-end"><Waves size={24} className="mb-auto text-lime-200" /><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-lime-100">01 / Shared liquidity</p><h3 className="mt-3 text-3xl font-semibold">One pool, two market views.</h3><p className="mt-3 leading-7 text-slate-300">Every Up and Down entry contributes to the active market pool. After the result is known, eligible winning entries claim their proportional share. This is a Classic pool structure, not a fixed-odds promise.</p></div>
          </article>
          <article className="min-h-[340px] border border-slate-200 bg-white p-7 md:p-10">
            <div className="flex h-full max-w-xl flex-col justify-end"><ShieldCheck size={24} className="mb-auto text-emerald-700" /><p className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-700">02 / Oracle settlement</p><h3 className="mt-3 text-3xl font-semibold">The chart is context. The oracle decides.</h3><p className="mt-3 leading-7 text-slate-700">Prices used to settle a round are recorded by the configured on-chain oracle adapter. A display chart is never the settlement authority, which keeps the interface and outcome cleanly separated.</p></div>
          </article>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="border border-slate-200 bg-white p-7"><ChartNoAxesCombined className="text-emerald-700" size={22} /><p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Choose a market</p><h3 className="mt-3 text-xl font-semibold">A reference, a target, and a timer.</h3><p className="mt-3 leading-7 text-slate-600">Open BTC, ETH, SOL, or another listed pair. The market view makes the current reference, directional target, and remaining entry time easy to inspect before you decide.</p></div>
          <div className="border border-slate-200 bg-white p-7"><ArrowUpRight className="text-emerald-700" size={22} /><p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Enter before lock</p><h3 className="mt-3 text-xl font-semibold">Up or Down is a clear position.</h3><p className="mt-3 leading-7 text-slate-600">Select a side and enter a tUSDC amount while a round is live. The test environment allows multiple entries, gives immediate position visibility, and never pretends its credits have value.</p></div>
          <div className="border border-slate-200 bg-white p-7"><ShieldCheck className="text-emerald-700" size={22} /><p className="mt-8 font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">Settle and claim</p><h3 className="mt-3 text-xl font-semibold">A recorded outcome and a direct claim.</h3><p className="mt-3 leading-7 text-slate-600">When a round ends, the contract uses the configured settlement data to record a winner. Winning entries become claimable through the same wallet flow used to enter the market.</p></div>
        </div>

        <div className="mt-20 grid gap-12 border-t border-slate-200 pt-14 md:grid-cols-2">
          <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Beta environment</p><h3 className="mt-3 text-3xl font-semibold">Built to test the full path before value arrives.</h3><p className="mt-5 max-w-xl leading-8 text-slate-600">The current release runs in a testnet environment and uses tUSDC, a deliberately valueless test credit. It exists to exercise wallet connection, faucet claims, market entry, keeper operation, oracle controls, settlement behavior, and claims without exposing participants to financial loss.</p></div>
          <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700">Mainnet direction</p><h3 className="mt-3 text-3xl font-semibold">Designed around transparent protocol economics.</h3><p className="mt-5 max-w-xl leading-8 text-slate-600">The proposed mainnet model applies a 1 percent fee to completed transactions. The present direction is to allocate 80 percent of collected protocol fees to token buybacks, subject to governance, legal review, security review, and final launch parameters. Testnet functionality does not create a promise of value or yield.</p></div>
        </div>
      </div>
    </section>
  </>);
}
