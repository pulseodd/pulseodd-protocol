"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ASSETS, mockErc20Abi, predictClassicAbi, ZERO_ADDRESS } from "@pulseodd/sdk";
import { Activity, ArrowDown, ArrowUp, BadgeDollarSign, Clock3, Trophy, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { rhConfig } from "@/config/rh";
import { TradingView } from "./trading-view";

type Direction = "UP" | "DOWN";
type Position = {
  id: number;
  roundId: number;
  side: Direction;
  amount: string;
  status: "Live" | "Locked" | "Claimable" | "Lost";
  claimable: string;
};

const quickAmounts = ["1", "5", "10", "50"];
const demoBets = [
  { address: "0x71b4...a902", side: "UP", amount: "18.4 RH" },
  { address: "0x02ea...19f1", side: "DOWN", amount: "7 RH" },
  { address: "0xa8cc...d512", side: "UP", amount: "42 RH" },
  { address: "0x119d...88e0", side: "DOWN", amount: "3.5 RH" }
] as const;

const history = [
  { id: 1208, result: "UP", start: "63,840.22", end: "63,912.40", pool: "18,420 RH" },
  { id: 1207, result: "DOWN", start: "63,902.10", end: "63,788.66", pool: "11,908 RH" },
  { id: 1206, result: "REFUND", start: "63,744.00", end: "63,744.00", pool: "8,430 RH" }
] as const;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

export function ClassicArena() {
  const [timeframe, setTimeframe] = useState<60 | 300>(60);
  const [stake, setStake] = useState("5");
  const [side, setSide] = useState<Direction>("UP");
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [positions, setPositions] = useState<Position[]>([
    { id: 1, roundId: 1208, side: "UP", amount: "10 RH", status: "Claimable", claimable: "18.2 RH" },
    { id: 2, roundId: 1209, side: "DOWN", amount: "5 RH", status: "Live", claimable: "0 RH" }
  ]);
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: balance } = useBalance({ address });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const demoRound = useMemo(() => {
    const epoch = Math.floor(now / timeframe);
    const startTs = epoch * timeframe;
    const endTs = startTs + timeframe;
    const lockTs = endTs - (timeframe === 60 ? 10 : 15);
    const remaining = Math.max(0, endTs - now);
    const locked = now >= lockTs;
    const upAmount = timeframe === 60 ? 12840 : 38110;
    const downAmount = timeframe === 60 ? 9130 : 41520;
    return {
      id: epoch,
      startTs,
      lockTs,
      endTs,
      remaining,
      locked,
      upAmount,
      downAmount,
      startPrice: "63,842.81"
    };
  }, [now, timeframe]);

  const liveRound = useReadContract({
    address: rhConfig.predictContract as `0x${string}`,
    abi: predictClassicAbi,
    functionName: "getCurrentRound",
    args: [ASSETS.BTC.key, BigInt(timeframe)],
    query: {
      enabled: !rhConfig.demo && rhConfig.predictContract !== ZERO_ADDRESS,
      refetchInterval: 2_000
    }
  });
  const faucetClaimed = useReadContract({
    address: rhConfig.tokenAddress as `0x${string}`,
    abi: mockErc20Abi,
    functionName: "hasClaimed",
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: Boolean(address) && rhConfig.tokenAddress !== ZERO_ADDRESS,
      refetchInterval: 5_000
    }
  });

  const upPool = liveRound.data ? Number(formatEther(liveRound.data.upAmount)) : demoRound.upAmount;
  const downPool = liveRound.data ? Number(formatEther(liveRound.data.downAmount)) : demoRound.downAmount;
  const totalPool = Math.max(1, upPool + downPool);
  const lockDisabled = liveRound.data ? liveRound.data.status !== 1 : demoRound.locked;
  const multiplier =
    side === "UP"
      ? 1 + (downPool * 0.95) / Math.max(1, upPool)
      : 1 + (upPool * 0.95) / Math.max(1, downPool);

  async function placeBet() {
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    if (lockDisabled) {
      toast.error("Round is locked");
      return;
    }
    if (rhConfig.demo || rhConfig.predictContract === ZERO_ADDRESS) {
      toast.promise(new Promise((resolve) => window.setTimeout(resolve, 900)), {
        loading: "Sending demo bet...",
        success: () => {
          setPositions((items) => [
            {
              id: Date.now(),
              roundId: demoRound.id,
              side,
              amount: `${stake} RH`,
              status: "Live",
              claimable: "0 RH"
            },
            ...items
          ]);
          return "Bet placed";
        },
        error: "Bet failed"
      });
      return;
    }

    const hash = writeContractAsync({
      address: rhConfig.predictContract as `0x${string}`,
      abi: predictClassicAbi,
      functionName: "placeBet",
      args: [liveRound.data?.id || 0n, side === "UP" ? 1 : 2, parseEther(stake)],
      value: rhConfig.tokenAddress === ZERO_ADDRESS ? parseEther(stake) : 0n
    });
    toast.promise(hash, {
      loading: "Transaction pending...",
      success: "Bet placed",
      error: "Transaction failed"
    });
  }

  function claimTestRh() {
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    if (rhConfig.tokenAddress === ZERO_ADDRESS) {
      toast.info("Native RH faucet is handled by the RH testnet faucet.");
      return;
    }
    const tx = writeContractAsync({
      address: rhConfig.tokenAddress as `0x${string}`,
      abi: mockErc20Abi,
      functionName: "claimFaucet"
    });
    toast.promise(tx, {
      loading: "Claiming test RH...",
      success: "Test RH claimed",
      error: "Claim failed or already used"
    });
  }

  function claim(positionId: number) {
    toast.success("Claim queued");
    setPositions((items) =>
      items.map((item) =>
        item.id === positionId ? { ...item, status: "Lost", claimable: "0 RH" } : item
      )
    );
  }

  return (
    <main className="min-h-screen bg-rh-bg text-rh-text">
      <header className="flex flex-col gap-4 border-b border-rh-line px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border border-rh-green bg-rh-green/10 font-black text-rh-green">
            RH
          </div>
          <div>
            <h1 className="text-xl font-semibold">Pulseodd Classic</h1>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="border border-rh-green/50 px-2 py-0.5 text-rh-green">RH Network</span>
              <span>{rhConfig.demo ? "Demo mode" : "On-chain mode"}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-rh-line bg-rh-panel px-3 py-2 text-sm text-slate-300">
            <Wallet size={16} />
            {balance ? `${Number(balance.formatted).toFixed(3)} ${balance.symbol}` : "Balance --"}
          </div>
          <button
            onClick={claimTestRh}
            disabled={!isConnected || faucetClaimed.data === true}
            className="border border-rh-green/60 bg-rh-green/10 px-3 py-2 text-sm font-semibold text-rh-green disabled:border-rh-line disabled:text-slate-600"
          >
            {faucetClaimed.data ? "Test RH claimed" : "Claim test RH"}
          </button>
          <ConnectButton />
        </div>
      </header>

      <section className="grid gap-4 p-4 lg:grid-cols-[1fr_390px] lg:p-6">
        <div className="space-y-4">
          <TradingView symbol={ASSETS.BTC.chartSymbol} />
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Live Bets" icon={<Activity size={16} />}>
              <div className="space-y-2">
                {demoBets.map((bet) => (
                  <div key={`${bet.address}-${bet.amount}`} className="flex items-center justify-between border-b border-rh-line/60 pb-2 text-sm">
                    <span className="text-slate-400">{bet.address}</span>
                    <span className={bet.side === "UP" ? "text-rh-green" : "text-rh-red"}>{bet.side}</span>
                    <span>{bet.amount}</span>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel title="Recent Rounds" icon={<Trophy size={16} />}>
              <div className="space-y-2">
                {history.map((round) => (
                  <div key={round.id} className="grid grid-cols-[64px_1fr_70px] items-center gap-3 border-b border-rh-line/60 pb-2 text-sm">
                    <span className="text-slate-500">#{round.id}</span>
                    <span className="text-slate-300">
                      {round.start} to {round.end}
                    </span>
                    <span className={round.result === "UP" ? "text-rh-green" : round.result === "DOWN" ? "text-rh-red" : "text-slate-300"}>{round.result}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <aside className="space-y-4">
          <Panel title="BTC/USD" icon={<BadgeDollarSign size={16} />}>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {([60, 300] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setTimeframe(value)}
                  className={`border px-3 py-2 text-sm font-semibold ${timeframe === value ? "border-rh-green bg-rh-green text-black" : "border-rh-line bg-black/20 text-slate-300"}`}
                >
                  {value === 60 ? "1m" : "5m"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Start" value={new Date(demoRound.startTs * 1000).toLocaleTimeString()} />
              <Stat label="Lock" value={new Date(demoRound.lockTs * 1000).toLocaleTimeString()} />
              <Stat label="End" value={new Date(demoRound.endTs * 1000).toLocaleTimeString()} />
            </div>

            <div className="my-5 border border-rh-line bg-black/25 p-4 text-center">
              <div className="mb-1 flex items-center justify-center gap-2 text-slate-400">
                <Clock3 size={16} />
                {lockDisabled ? "Locked" : "Betting closes soon"}
              </div>
              <div className="font-mono text-5xl font-bold">{formatCountdown(demoRound.remaining)}</div>
              <div className="mt-2 text-sm text-slate-400">Oracle start {demoRound.startPrice}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setSide("UP")} className={`flex items-center justify-center gap-2 border px-4 py-4 text-lg font-black ${side === "UP" ? "border-rh-green bg-rh-green text-black" : "border-rh-green/50 text-rh-green"}`}>
                <ArrowUp size={22} /> UP
              </button>
              <button onClick={() => setSide("DOWN")} className={`flex items-center justify-center gap-2 border px-4 py-4 text-lg font-black ${side === "DOWN" ? "border-rh-red bg-rh-red text-white" : "border-rh-red/50 text-rh-red"}`}>
                <ArrowDown size={22} /> DOWN
              </button>
            </div>

            <label className="mt-5 block text-sm text-slate-400">Stake</label>
            <div className="mt-2 flex border border-rh-line bg-black/30">
              <input
                value={stake}
                onChange={(event) => setStake(event.target.value)}
                inputMode="decimal"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-lg outline-none"
              />
              <span className="px-3 py-3 text-slate-400">RH</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <button key={amount} onClick={() => setStake(amount)} className="border border-rh-line bg-black/20 py-2 text-sm text-slate-300">
                  {amount}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-rh-green">UP {upPool.toLocaleString()} RH</span>
                <span className="text-rh-red">DOWN {downPool.toLocaleString()} RH</span>
              </div>
              <div className="flex h-3 overflow-hidden bg-rh-red/30">
                <div className="bg-rh-green" style={{ width: `${(upPool / totalPool) * 100}%` }} />
              </div>
              <div className="mt-3 flex justify-between text-sm text-slate-300">
                <span>Estimated multiplier</span>
                <strong className={side === "UP" ? "text-rh-green" : "text-rh-red"}>
                  {timeframe === 60 ? "~1.8x" : `${multiplier.toFixed(2)}x`}
                </strong>
              </div>
            </div>

            <button
              disabled={lockDisabled}
              onClick={placeBet}
              className="mt-5 w-full bg-rh-green px-4 py-4 text-base font-black text-black disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              Place Bet
            </button>
          </Panel>

          <Panel title="My Positions" icon={<Wallet size={16} />}>
            <div className="space-y-3">
              {positions.map((position) => (
                <div key={position.id} className="border border-rh-line bg-black/20 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Round #{position.roundId}</span>
                    <span className={position.side === "UP" ? "text-rh-green" : "text-rh-red"}>{position.side}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>{position.amount}</span>
                    <span>{position.status}</span>
                  </div>
                  <button
                    disabled={position.status !== "Claimable"}
                    onClick={() => claim(position.id)}
                    className="mt-3 w-full border border-rh-line py-2 text-sm disabled:text-slate-600"
                  >
                    Claim {position.claimable}
                  </button>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-rh-line bg-rh-panel p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-rh-line bg-black/20 p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}
