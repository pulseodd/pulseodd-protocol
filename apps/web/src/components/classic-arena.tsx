"use client";

import { ASSETS, mockErc20Abi, predictClassicAbi, ZERO_ADDRESS } from "@pulseodd/sdk";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Radio,
  Rows3,
  Trophy,
  Wallet,
  ArrowLeft,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useReadContract, useWriteContract } from "wagmi";
import { paymentToken, rhConfig } from "@/config/rh";
import { pulseoddToken } from "@/config/pulseodd-token";
import { ArrivalScene } from "./arrival-scene";
import { TradingView } from "./trading-view";
import { PulseoddMark } from "./pulseodd-mark";
import { WalletControl } from "./wallet-control";

type Direction = "UP" | "DOWN";
type MarketMode = "classic" | "ladder";
type AssetKey = keyof typeof ASSETS;
type Position = {
  id: number;
  roundId: number;
  symbol: string;
  side: Direction;
  amount: string;
  status: "Live" | "Locked" | "Claimable" | "Claimed" | "Lost";
  claimable: string;
};

const productName = "Pulseodd";
const quickAmounts = ["1", "5", "10", "50"];
const marketKeys = Object.keys(ASSETS) as AssetKey[];
const paymentSymbol = rhConfig.demo || rhConfig.tokenAddress !== ZERO_ADDRESS ? paymentToken.symbol : "ETH";
const assetIcons: Partial<Record<AssetKey, string>> = {
  BTC: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png",
  ETH: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png",
  SOL: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/sol.png",
  BNB: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/bnb.png",
  XRP: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png"
};
const demoReferencePrices: Record<AssetKey, number> = {
  BTC: 84273.17,
  ETH: 2638.42,
  SOL: 144.76,
  BNB: 694.18,
  XRP: 2.17,
  NVDA: 181.42,
  TSLA: 327.61,
  SPY: 643.28,
  GOLD: 3387.15
};

const demoBets = [
  { address: "0x71b4...a902", side: "UP", amount: "18.4 RH", market: "BTC" },
  { address: "0x02ea...19f1", side: "DOWN", amount: "7 RH", market: "ETH" },
  { address: "0xa8cc...d512", side: "UP", amount: "42 RH", market: "NVDA" },
  { address: "0x119d...88e0", side: "DOWN", amount: "3.5 RH", market: "GOLD" }
] as const;

const history = [
  { id: 1208, result: "UP", market: "BTC", start: "84,251.18", end: "84,273.17" },
  { id: 1207, result: "DOWN", market: "ETH", start: "2,641.11", end: "2,638.42" },
  { id: 1206, result: "REFUND", market: "TSLA", start: "327.61", end: "327.61" }
] as const;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function formatRoundTime(timestamp: number) {
  if (!timestamp) return "--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC"
  }).format(timestamp * 1000);
}

export function ClassicArena() {
  const [hasLaunched, setHasLaunched] = useState(false);
  const [marketMode, setMarketMode] = useState<MarketMode>("classic");
  const [marketOpen, setMarketOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [assetKey, setAssetKey] = useState<AssetKey>("BTC");
  const [timeframe, setTimeframe] = useState<60 | 300>(60);
  const [stake, setStake] = useState("5");
  const [side, setSide] = useState<Direction>("UP");
  const [now, setNow] = useState(0);
  const [positions, setPositions] = useState<Position[]>([
    { id: 1, roundId: 1208, symbol: "BTC", side: "UP", amount: "10 RH", status: "Claimable", claimable: "18.2 RH" },
    { id: 2, roundId: 1209, symbol: "NVDA", side: "DOWN", amount: "5 RH", status: "Live", claimable: "0 RH" }
  ]);
  const [demoBalance, setDemoBalance] = useState<number | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: balance } = useBalance({
    address,
    token: !rhConfig.demo && rhConfig.tokenAddress !== ZERO_ADDRESS ? (rhConfig.tokenAddress as `0x${string}`) : undefined,
    query: { enabled: Boolean(address) && !rhConfig.demo }
  });
  const asset = ASSETS[assetKey];
  const targetPrice = demoReferencePrices[assetKey] * 1.005;

  const copyHeaderToken = () => {
    void navigator.clipboard.writeText(pulseoddToken.address);
    setTokenCopied(true);
    window.setTimeout(() => setTokenCopied(false), 1_800);
  };

  const demoStorageKey = address ? `pulseodd-test-usd:${address.toLowerCase()}` : null;
  const legacyDemoStorageKey = address ? `vanta-test-usd:${address.toLowerCase()}` : null;

  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!rhConfig.demo || !demoStorageKey) {
      setDemoBalance(null);
      return;
    }
    const stored = window.localStorage.getItem(demoStorageKey) ?? (legacyDemoStorageKey ? window.localStorage.getItem(legacyDemoStorageKey) : null);
    if (stored !== null && window.localStorage.getItem(demoStorageKey) === null) {
      window.localStorage.setItem(demoStorageKey, stored);
    }
    setDemoBalance(stored === null ? null : Number(stored));
  }, [demoStorageKey, legacyDemoStorageKey]);

  const demoRound = useMemo(() => {
    const epoch = Math.floor(now / timeframe);
    const startTs = epoch * timeframe;
    const endTs = startTs + timeframe;
    const lockTs = endTs - (timeframe === 60 ? 10 : 15);
    const remaining = Math.max(0, endTs - now);
    const locked = now >= lockTs;
    const seed = asset.symbol.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const upAmount = timeframe === 60 ? 520 + (seed % 160) : 1_140 + (seed % 240);
    const downAmount = timeframe === 60 ? 500 + ((seed * 3) % 160) : 1_100 + ((seed * 5) % 240);
    const referencePrice = demoReferencePrices[assetKey];
    const basisPointShift = ((epoch + seed) % 7) - 3;
    const startPrice = referencePrice * (1 + basisPointShift / 10_000);
    return {
      id: epoch,
      startTs,
      lockTs,
      endTs,
      remaining,
      locked,
      upAmount,
      downAmount,
      startPrice: startPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    };
  }, [assetKey, asset.symbol, now, timeframe]);

  const liveRound = useReadContract({
    address: rhConfig.predictContract as `0x${string}`,
    abi: predictClassicAbi,
    functionName: "getCurrentRound",
    args: [asset.key, BigInt(timeframe)],
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
      toast.error("This round is locked");
      return;
    }
    if (rhConfig.demo) {
      const amount = Number(stake);
      if (demoBalance === null) {
      toast.error(`Claim your ${paymentToken.faucetAmount.toLocaleString("en-US")} ${paymentSymbol} test balance first`);
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0 || amount > demoBalance) {
        toast.error("Enter an amount within your available test balance");
        return;
      }
      toast.promise(new Promise((resolve) => window.setTimeout(resolve, 850)), {
        loading: "Submitting prediction...",
        success: () => {
          const nextBalance = demoBalance - amount;
          setDemoBalance(nextBalance);
          if (demoStorageKey) window.localStorage.setItem(demoStorageKey, String(nextBalance));
          setPositions((items) => [
            {
              id: Date.now(),
              roundId: demoRound.id,
              symbol: asset.symbol,
              side,
              amount: `${stake} ${paymentSymbol}`,
              status: "Live",
              claimable: "0 RH"
            },
            ...items
          ]);
          return "Prediction entered";
        },
        error: "Prediction failed"
      });
      return;
    }

    if (rhConfig.predictContract === ZERO_ADDRESS) {
      toast.error("Prediction contract is not configured");
      return;
    }

    if (rhConfig.tokenAddress !== ZERO_ADDRESS) {
      const approval = writeContractAsync({
        address: rhConfig.tokenAddress as `0x${string}`,
        abi: mockErc20Abi,
        functionName: "approve",
        args: [rhConfig.predictContract as `0x${string}`, parseEther(stake)]
      });
      toast.promise(approval, {
        loading: "Approving test credits...",
        success: "Credits approved",
        error: "Approval failed"
      });
      await approval;
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
      success: "Prediction entered",
      error: "Transaction failed"
    });
  }

  function enterLadder(stakeAmount: string, band: number, payout: number, symbol: "BTC" | "ETH") {
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    if (!rhConfig.demo) {
      toast.error("Ladder is currently available in the test environment only");
      return;
    }
    const amount = Number(stakeAmount);
    if (demoBalance === null) {
      toast.error(`Claim your ${paymentToken.faucetAmount.toLocaleString("en-US")} ${paymentSymbol} test balance first`);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > demoBalance) {
      toast.error("Enter an amount within your available test balance");
      return;
    }
    toast.promise(new Promise((resolve) => window.setTimeout(resolve, 700)), {
      loading: "Entering ladder band...",
      success: () => {
        const nextBalance = demoBalance - amount;
        setDemoBalance(nextBalance);
        if (demoStorageKey) window.localStorage.setItem(demoStorageKey, String(nextBalance));
        setPositions((items) => [{
          id: Date.now(),
          roundId: Math.floor(now / 10),
          symbol,
          side: band > 0 ? "UP" : "DOWN",
          amount: `${stakeAmount} ${paymentSymbol}`,
          status: "Live",
          claimable: `${payout.toFixed(2)} ${paymentSymbol}`
        }, ...items]);
        return "Ladder position entered";
      },
      error: "Ladder entry failed"
    });
  }

  function claimTestTokens() {
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    if (rhConfig.demo) {
      if (!demoStorageKey) return;
      if (demoBalance !== null) {
        toast.info("This wallet has already claimed its test balance");
        return;
      }
      window.localStorage.setItem(demoStorageKey, String(paymentToken.faucetAmount));
      setDemoBalance(paymentToken.faucetAmount);
      toast.success(`${paymentToken.faucetAmount.toLocaleString("en-US")} ${paymentSymbol} added to your test balance`);
      return;
    }
    if (rhConfig.tokenAddress === ZERO_ADDRESS) {
      toast.error("Configure a test token address before claiming funds");
      return;
    }
    const tx = writeContractAsync({
      address: rhConfig.tokenAddress as `0x${string}`,
      abi: mockErc20Abi,
      functionName: "claimFaucet"
    });
    toast.promise(tx, {
      loading: "Claiming test tokens...",
      success: "Test tokens claimed",
      error: "Claim failed or already used"
    });
  }

  async function claim(positionId: number) {
    const position = positions.find((item) => item.id === positionId);
    if (!position || position.status !== "Claimable") return;
    if (rhConfig.demo) {
      const payout = Number(position.claimable.split(" ")[0]);
      const nextBalance = (demoBalance || 0) + payout;
      setDemoBalance(nextBalance);
      if (demoStorageKey) window.localStorage.setItem(demoStorageKey, String(nextBalance));
      toast.success(`${position.claimable.replace("RH", paymentSymbol)} added to your test balance`);
      setPositions((items) => items.map((item) => item.id === positionId ? { ...item, status: "Claimed", claimable: "0 RH" } : item));
      return;
    }
    const tx = writeContractAsync({
      address: rhConfig.predictContract as `0x${string}`,
      abi: predictClassicAbi,
      functionName: "claim",
      args: [BigInt(position.roundId)]
    });
    toast.promise(tx, { loading: "Claiming payout...", success: "Payout claimed", error: "Claim failed" });
    await tx;
    setPositions((items) =>
      items.map((item) =>
        item.id === positionId ? { ...item, status: "Claimed", claimable: "0 RH" } : item
      )
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-rh-bg text-rh-text">
      {!hasLaunched ? (
        <ArrivalScene onLaunch={() => setHasLaunched(true)} />
      ) : (
      <div id="arena" className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center shadow-sm"><PulseoddMark className="h-10 w-10 text-[#c8ff38]" title="Pulseodd" /></div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">{productName}</h2>
              <p className="text-xs text-slate-500">{marketMode === "classic" ? "Classic pool terminal" : "Ladder market terminal"}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/docs" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block">Docs</Link>
            <a href="mailto:pulse@pulseodd.com" className="hidden text-sm font-medium text-slate-600 transition hover:text-slate-950 sm:block">Support</a>
            <a href={pulseoddToken.buyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-slate-950" title="Buy $PODD">
              {pulseoddToken.symbol} <ArrowUpRight size={14} />
            </a>
            <button type="button" onClick={copyHeaderToken} aria-label="Copy $PODD contract address" className="inline-flex h-9 w-9 items-center justify-center border border-slate-200 text-slate-600 transition hover:border-slate-950 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600" title="Copy $PODD contract address">
              {tokenCopied ? <Check size={15} /> : <Copy size={15} />}
            </button>
            <div className="flex h-11 items-center gap-2 border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
              <Wallet size={16} />
              {rhConfig.demo ? `${(demoBalance || 0).toLocaleString()} ${paymentSymbol}` : balance ? `${Number(balance.formatted).toFixed(2)} ${balance.symbol}` : `0 ${paymentSymbol}`}
            </div>
            <button
              onClick={claimTestTokens}
              disabled={!isConnected || (rhConfig.demo ? demoBalance !== null : faucetClaimed.data === true)}
              className="border border-emerald-600 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:border-slate-200 disabled:text-slate-400"
            >
              {rhConfig.demo ? demoBalance !== null ? "Test funds claimed" : `Claim ${paymentToken.faucetAmount.toLocaleString("en-US")} ${paymentSymbol}` : faucetClaimed.data ? "Test funds claimed" : `Claim ${paymentToken.faucetAmount.toLocaleString("en-US")} ${paymentSymbol}`}
            </button>
            <WalletControl onProfile={() => setProfileOpen(true)} />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1500px] px-4 py-7 md:px-6">
        <div className="animate-page-in grid gap-5">
          <nav aria-label="Market categories" className="flex w-fit border border-slate-200 bg-white p-1">
            <button onClick={() => setMarketMode("classic")} className={`px-4 py-2 text-sm font-semibold transition ${marketMode === "classic" ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-950"}`}>Classic</button>
            <button onClick={() => setMarketMode("ladder")} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition ${marketMode === "ladder" ? "bg-[#c8ff38] text-slate-950" : "text-slate-500 hover:text-slate-950"}`}><Rows3 size={16} /> Ladder</button>
          </nav>
          {marketMode === "ladder" ? (
            <LadderMarket now={now} paymentSymbol={paymentSymbol} onEnter={enterLadder} />
          ) : (
          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,390px)]">
            <div className="min-w-0 space-y-5">
              {marketOpen ? (
                <button onClick={() => setMarketOpen(false)} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"><ArrowLeft size={16} /> All markets</button>
              ) : (
                <>
                  <Intro />
                  <MarketStrip selected={assetKey} onSelect={(key) => { setAssetKey(key); setMarketOpen(true); }} />
                </>
              )}
              {marketOpen && <>
              <TradingView symbol={asset.chartSymbol} />
              <div className="grid gap-4 xl:grid-cols-2">
                <Panel title="Live Order Flow" icon={<Activity size={16} />}>
                  <div className="space-y-2">
                    {demoBets.map((bet) => (
                      <div key={`${bet.address}-${bet.amount}`} className="grid grid-cols-[1fr_54px_84px_80px] items-center gap-2 border-b border-white/8 pb-2 text-sm">
                        <span className="text-slate-400">{bet.address}</span>
                        <span>{bet.market}</span>
                        <span className={bet.side === "UP" ? "text-rh-green" : "text-rh-red"}>{bet.side}</span>
                        <span className="text-right">{bet.amount.replace("RH", paymentSymbol)}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Recent Rounds" icon={<Trophy size={16} />}>
                  <div className="space-y-2">
                    {history.map((round) => (
                      <div key={round.id} className="grid grid-cols-[58px_50px_1fr_72px] items-center gap-2 border-b border-white/8 pb-2 text-sm">
                        <span className="text-slate-500">#{round.id}</span>
                        <span className="text-slate-300">{round.market}</span>
                        <span className="text-slate-400">{round.start} to {round.end}</span>
                        <span className={round.result === "UP" ? "text-rh-green" : round.result === "DOWN" ? "text-rh-red" : "text-slate-300"}>{round.result}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
              </>}
            </div>

            <aside className="min-w-0 space-y-5">
              {marketOpen ? <>
              <Panel title={`${asset.symbol}/USD Classic`} icon={<CircleDollarSign size={16} />}>
                <div className="mb-4 flex items-center justify-between border border-slate-200 bg-slate-50 p-3">
                  <div>
                    <div className="text-lg font-semibold">{asset.name}</div>
                    <div className="text-xs text-slate-500">{asset.venue} market</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Oracle source</div>
                    <div className="text-sm text-slate-700">On-chain adapter</div>
                  </div>
                </div>

                <div className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm">
                  <div className="font-semibold text-emerald-900">1 minute target</div>
                  <p className="mt-1 leading-6 text-emerald-800">UP is modeled above {targetPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. DOWN is modeled below this 0.5% target.</p>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                  {([60, 300] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setTimeframe(value)}
                      className={`border px-3 py-2 text-sm font-semibold transition ${timeframe === value ? "border-rh-green bg-rh-green text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}
                    >
                      {value === 60 ? "1 minute" : "5 minutes"}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Start" value={formatRoundTime(demoRound.startTs)} />
                  <Stat label="Lock" value={formatRoundTime(demoRound.lockTs)} />
                  <Stat label="End" value={formatRoundTime(demoRound.endTs)} />
                </div>

                <div className="my-5 border border-slate-200 bg-slate-50 p-4 text-center">
                  <div className="mb-1 flex items-center justify-center gap-2 text-slate-500">
                    <Clock3 size={16} />
                    {lockDisabled ? "Entry closed" : "Entry window open"}
                  </div>
                  <div className="font-mono text-5xl font-bold">{formatCountdown(demoRound.remaining)}</div>
                  <div className="mt-2 text-sm text-slate-500">On-chain snapshot {demoRound.startPrice}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <DirectionButton active={side === "UP"} side="UP" onClick={() => setSide("UP")} />
                  <DirectionButton active={side === "DOWN"} side="DOWN" onClick={() => setSide("DOWN")} />
                </div>

                <label className="mt-5 block text-sm text-slate-600">Stake amount</label>
                <div className="mt-2 flex border border-slate-300 bg-white">
                  <input
                    value={stake}
                    onChange={(event) => setStake(event.target.value)}
                    inputMode="decimal"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3 text-lg outline-none"
                  />
                  <span className="px-3 py-3 text-slate-500">{paymentSymbol}</span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <button key={amount} onClick={() => setStake(amount)} className="border border-slate-200 bg-white py-2 text-sm text-slate-700 transition hover:border-slate-400">
                      {amount}
                    </button>
                  ))}
                </div>

                <PoolMeter upPool={upPool} downPool={downPool} totalPool={totalPool} side={side} multiplier={multiplier} timeframe={timeframe} paymentSymbol={paymentSymbol} />

                <button
                  disabled={lockDisabled}
                  onClick={placeBet}
                  className="mt-5 flex w-full items-center justify-center gap-2 bg-slate-950 px-4 py-4 text-base font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  Enter Round <ChevronRight size={18} />
                </button>
              </Panel>

              <Panel title="Profile" icon={<Wallet size={16} />}>
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 text-sm">
                  <span className="text-slate-500">Wallet</span>
                  <span className="font-mono text-slate-800">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm"><span className="text-slate-500">Test balance</span><strong>{rhConfig.demo ? `${(demoBalance || 0).toLocaleString("en-US")} ${paymentSymbol}` : balance ? `${Number(balance.formatted).toFixed(2)} ${balance.symbol}` : `0 ${paymentSymbol}`}</strong></div>
              </Panel>

              <Panel title="Active positions" icon={<Activity size={16} />}>
                <div className="space-y-3">
                  {positions.map((position) => (
                    <div key={position.id} className="border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">{position.symbol} Round #{position.roundId}</span>
                        <span className={position.side === "UP" ? "text-rh-green" : "text-rh-red"}>{position.side}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span>{position.amount.replace("RH", paymentSymbol)}</span>
                        <span>{position.status}</span>
                      </div>
                      <button
                        disabled={position.status !== "Claimable"}
                        onClick={() => claim(position.id)}
                        className="mt-3 w-full border border-slate-300 bg-white py-2 text-sm transition hover:border-slate-500 disabled:text-slate-400"
                      >
                        Claim {position.claimable.replace("RH", paymentSymbol)}
                      </button>
                    </div>
                  ))}
                </div>
              </Panel>
              </> : <Panel title="Your test account" icon={<Wallet size={16} />}>
                <p className="text-sm leading-6 text-slate-600">Open a market to view the price chart, enter a prediction, and manage active positions.</p>
                <div className="mt-5 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Test balance</span><strong>{(demoBalance || 0).toLocaleString("en-US")} {paymentSymbol}</strong></div></div>
              </Panel>}
            </aside>
          </section>
          )}

        </div>
      </section>
      </div>
      )}
      {profileOpen && <ProfileModal address={address} balance={demoBalance || 0} positions={positions} onClose={() => setProfileOpen(false)} />}
    </main>
  );
}

function LadderMarket({ now, paymentSymbol, onEnter }: { now: number; paymentSymbol: string; onEnter: (stake: string, band: number, payout: number, symbol: "BTC" | "ETH") => void }) {
  const [stake, setStake] = useState("10");
  const [selection, setSelection] = useState<{ level: number; horizon: number; multiplier: number } | null>(null);
  const [ladderAsset, setLadderAsset] = useState<"BTC" | "ETH">("BTC");
  const [displayPrice, setDisplayPrice] = useState<number | null>(null);
  const [priceAnchor, setPriceAnchor] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const latestPriceRef = useRef<number | null>(null);
  const ladderConfig = ladderAsset === "BTC"
    ? { name: "Bitcoin", spot: 84273.17, step: 0.05, icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png" }
    : { name: "Ethereum", spot: 2638.42, step: 0.005, icon: "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png" };
  const { step } = ladderConfig;
  const livePrice = displayPrice ?? ladderConfig.spot;
  const spot = priceAnchor ?? livePrice;
  const roundStart = Math.floor(now / 10) * 10;
  const remaining = Math.max(0, roundStart + 10 - now);
  const levels = [6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6];
  const timeColumns = Array.from({ length: 11 }, (_, index) => (index - 5) * 10);
  const estimatedPayout = (Number(stake) || 0) * (selection?.multiplier || 0);
  const history = priceHistory.length ? [...Array(Math.max(0, 6 - priceHistory.length)).fill(spot), ...priceHistory.slice(-6)] : Array(6).fill(spot);
  const maxDeviation = Math.max(...history.map((price) => Math.abs(price - spot)));
  const plotStep = Math.max(step, maxDeviation / 5);
  const historyLevels = history.map((price) => Math.max(-6, Math.min(6, (price - spot) / plotStep)));
  const liveLevel = historyLevels[historyLevels.length - 1];
  const historyPoints = historyLevels.map((level, index) => ({ x: (index + 0.5) * 100, y: (6 - level + 0.5) * 50 }));
  const livePath = historyPoints.length < 2
    ? `M ${historyPoints[0]?.x ?? 50} ${historyPoints[0]?.y ?? 325}`
    : `${historyPoints.slice(1, -1).reduce((path, point, index) => {
      const next = historyPoints[index + 2];
      return `${path} Q ${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
    }, `M ${historyPoints[0].x} ${historyPoints[0].y}`)} Q ${historyPoints.at(-1)!.x} ${historyPoints.at(-1)!.y} ${historyPoints.at(-1)!.x} ${historyPoints.at(-1)!.y}`;
  const liveX = 550;
  const liveY = (6 - liveLevel + 0.5) * 50;

  useEffect(() => {
    let cancelled = false;
    const symbol = ladderAsset === "BTC" ? "BTCUSDT" : "ETHUSDT";
    const updateDisplayPrice = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
        const data: unknown = await response.json();
        if (!cancelled && typeof data === "object" && data !== null && "price" in data) {
          const price = Number(data.price);
          if (Number.isFinite(price)) {
            latestPriceRef.current = price;
            setDisplayPrice(price);
            setPriceAnchor((current) => current ?? price);
            setPriceHistory((items) => items.length ? [...items.slice(0, -1), price] : [price]);
          }
        }
      } catch {
        // The configured demo reference remains available if the display ticker is unavailable.
      }
    };
    const loadRecentHistory = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1s&limit=101`);
        const data: unknown = await response.json();
        if (!cancelled && Array.isArray(data)) {
          const prices = data
            .filter((_, index) => index % 10 === 0)
            .map((row) => Array.isArray(row) ? Number(row[4]) : Number.NaN)
            .filter((price) => Number.isFinite(price))
            .slice(-6);
          const latest = prices.at(-1);
          if (prices.length && latest !== undefined) {
            latestPriceRef.current = latest;
            setDisplayPrice(latest);
            setPriceAnchor(latest);
            setPriceHistory(prices);
          }
        }
      } catch {
        // Live trades and the ticker remain available if historical candles fail.
      }
    };
    setDisplayPrice(null);
    setPriceAnchor(null);
    setPriceHistory([]);
    latestPriceRef.current = null;
    void updateDisplayPrice();
    void loadRecentHistory();
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
    socket.onmessage = (event) => {
      try {
        const data: unknown = JSON.parse(String(event.data));
        if (typeof data === "object" && data !== null && "p" in data) {
          const price = Number(data.p);
          if (Number.isFinite(price) && !cancelled) {
            latestPriceRef.current = price;
            setDisplayPrice(price);
            setPriceAnchor((current) => current ?? price);
            setPriceHistory((items) => items.length ? [...items.slice(0, -1), price] : [price]);
          }
        }
      } catch {
        // The HTTP ticker remains the display fallback if a stream payload cannot be read.
      }
    };
    const pollInterval = window.setInterval(updateDisplayPrice, 2_000);
    const snapshotInterval = window.setInterval(() => {
      const price = latestPriceRef.current;
      if (price !== null) setPriceHistory((items) => [...items, price].slice(-6));
    }, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(pollInterval);
      window.clearInterval(snapshotInterval);
      socket.close();
    };
  }, [ladderAsset]);

  function multiplierFor(level: number, horizon: number) {
    const distance = Math.min(8, Math.abs(level) + Math.floor(horizon / 20));
    return [1.12, 1.2, 1.32, 1.5, 1.8, 2.2, 2.8, 3.6, 4.8][distance];
  }

  return <section className="ladder-board relative min-h-[calc(100svh-138px)] overflow-hidden border border-[#20263d] bg-[#070a14] text-white shadow-[0_24px_70px_rgba(8,10,24,0.26)]">
    <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#0b1020]/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex items-center gap-3"><Rows3 size={18} className="text-[#c8ff38]" /><div><div className="text-sm font-semibold">Ladder</div><div className="text-xs text-slate-400">10 second price zones</div></div></div>
      <div className="flex items-center gap-2">
        {(["BTC", "ETH"] as const).map((key) => <button key={key} onClick={() => { setLadderAsset(key); setSelection(null); }} className={`flex items-center gap-2 border px-3 py-2 text-sm font-semibold transition ${ladderAsset === key ? "border-[#c8ff38] bg-[#c8ff38] text-slate-950" : "border-white/15 text-slate-300 hover:border-white/40"}`}><img src={key === "BTC" ? "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png" : "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png"} alt="" className="h-4 w-4" />{key}/USD</button>)}
      </div>
      <div className="flex items-center gap-5 font-mono text-sm"><span className="hidden text-slate-400 sm:inline">SPOT <b className="ml-2 text-white">{livePrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span><span className="hidden text-[10px] uppercase tracking-[.14em] text-slate-500 md:inline">Binance live display</span><span className="text-slate-400">ROUND <b className="ml-2 text-[#c8ff38]">00:{remaining.toString().padStart(2, "0")}</b></span></div>
    </header>

    <div className="min-h-[calc(100svh-208px)] overflow-x-auto bg-[#090d1b] p-3 sm:p-5">
      <div className="relative min-w-[1040px]">
        <div className="grid grid-cols-[104px_repeat(11,minmax(78px,1fr))] border-b border-white/10 pb-3 text-center font-mono text-[10px] uppercase tracking-[.13em] text-slate-500"><span className="text-left">Price / {ladderAsset}</span>{timeColumns.map((offset) => <span key={offset} className={offset === 0 ? "font-bold text-[#f36ca8]" : offset > 0 ? "text-[#c8ff38]/70" : ""}>{offset === 0 ? "Now" : `${offset > 0 ? "+" : ""}${offset}s`}</span>)}</div>
        <div className="relative mt-2">
          <svg className="pointer-events-none absolute bottom-0 left-[104px] right-0 top-0 z-10 h-full w-[calc(100%-104px)] overflow-visible" viewBox="0 0 1100 650" preserveAspectRatio="none" aria-hidden="true"><path className="ladder-flow-line" d={livePath} fill="none" stroke="#f36ca8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" /><circle className="ladder-flow-dot" cx={liveX} cy={liveY} r="7" fill="#fff" /></svg>
          <div className="space-y-1">
            {levels.map((level) => <div key={level} className={`grid grid-cols-[104px_repeat(11,minmax(78px,1fr))] gap-1 ${level === 0 ? "ladder-spot-row py-1" : ""}`}>
              <div className={`flex items-center font-mono text-xs ${level > 0 ? "text-emerald-300" : level < 0 ? "text-rose-300" : "font-semibold text-white"}`}>{(spot + level * plotStep).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              {timeColumns.map((offset, columnIndex) => {
                const multiplier = multiplierFor(level, Math.max(0, offset));
                const chosen = selection?.level === level && selection.horizon === offset;
                const live = level === Math.round(liveLevel) && columnIndex === 5;
                const historical = offset < 0;
                return <button key={offset} disabled={historical} onClick={() => setSelection({ level, horizon: offset, multiplier })} className={`relative h-11 border text-sm font-semibold transition sm:h-12 ${chosen ? "border-[#c8ff38] bg-[#c8ff38] text-slate-950 shadow-[0_0_28px_rgba(200,255,56,.25)]" : live ? "border-[#f36ca8] bg-[#3a132d] text-white" : historical ? "cursor-default border-white/[.06] bg-white/[.015] text-slate-600" : level > 0 ? "border-emerald-400/20 bg-emerald-400/[.045] text-emerald-100 hover:border-emerald-300/70 hover:bg-emerald-400/[.09]" : level < 0 ? "border-rose-400/20 bg-rose-400/[.045] text-rose-100 hover:border-rose-300/70 hover:bg-rose-400/[.09]" : "border-white/20 bg-white/[.05] text-white hover:border-white/60"}`}>{live && <span className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-[#f36ca8]" />}{historical ? "·" : `${multiplier.toFixed(2)}x`}</button>;
              })}
            </div>)}
          </div>
        </div>
      </div>
    </div>

    {selection && <div className="relative z-20 border-t border-[#c8ff38]/50 bg-[#11182b] px-4 py-4 shadow-[0_-16px_48px_rgba(0,0,0,.3)] md:px-6"><div className="grid items-center gap-4 lg:grid-cols-[1fr_150px_220px]">
      <div><p className="font-mono text-[10px] uppercase tracking-[.16em] text-[#c8ff38]">Selected cell</p><p className="mt-1 text-sm text-slate-300">{ladderAsset}/USD at {(spot + selection.level * plotStep).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selection.horizon === 0 ? "now" : `in ${selection.horizon} seconds`}</p><p className="mt-1 text-xl font-semibold text-white">{selection.multiplier.toFixed(2)}x <span className="text-sm font-normal text-slate-400">fixed test multiplier</span></p></div>
      <div className="flex border border-white/15 bg-[#080d1b]"><input value={stake} onChange={(event) => setStake(event.target.value)} inputMode="decimal" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-lg outline-none" /><span className="px-3 py-3 text-slate-400">{paymentSymbol}</span></div>
      <button onClick={() => onEnter(stake, selection.level || 1, estimatedPayout, ladderAsset)} className="flex items-center justify-center gap-2 bg-[#c8ff38] px-4 py-3.5 font-bold text-slate-950 transition hover:bg-white">Enter for {estimatedPayout.toFixed(2)} {paymentSymbol} <ChevronRight size={18} /></button>
    </div></div>}
  </section>;
}

function ProfileModal({ address, balance, positions, onClose }: { address?: string; balance: number; positions: Position[]; onClose: () => void }) {
  const [board, setBoard] = useState<"volume" | "winRate">("volume");
  const leaderboard = board === "volume"
    ? [["0x9a1c...20f4", "18,420 tUSDC", "71%"], ["0x7e42...8b1e", "15,980 tUSDC", "68%"], ["0x36...65a6", "12,640 tUSDC", "64%"], ["0xf0b3...1ca8", "9,255 tUSDC", "61%"]]
    : [["0x9a1c...20f4", "18,420 tUSDC", "71%"], ["0x52a1...f901", "8,330 tUSDC", "69%"], ["0x7e42...8b1e", "15,980 tUSDC", "68%"], ["0x36...65a6", "12,640 tUSDC", "64%"]];
  const wins = positions.filter((item) => item.status === "Claimable" || item.status === "Claimed").length;

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm md:p-8">
    <section role="dialog" aria-modal="true" className="mx-auto my-8 max-w-5xl border border-slate-200 bg-[#f6f7f5] shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-7">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Pulseodd profile</p><h2 className="mt-1 text-xl font-semibold text-slate-950">Account activity</h2></div>
        <button onClick={onClose} aria-label="Close profile" className="grid h-9 w-9 place-items-center border border-slate-200 bg-white text-slate-600 hover:border-slate-500"><X size={18} /></button>
      </header>
      <div className="grid gap-6 p-5 md:p-7 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-5">
          <section className="border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-4"><div className="grid h-12 w-12 place-items-center bg-slate-950 text-sm font-bold text-white">PO</div><div><div className="font-mono text-sm text-slate-700">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet not connected"}</div><p className="mt-1 text-sm text-slate-500">Test environment</p></div></div>
            <div className="mt-6 border-t border-slate-200 pt-4"><div className="text-xs uppercase tracking-wide text-slate-500">Test balance</div><div className="mt-1 text-3xl font-semibold text-slate-950">{balance.toLocaleString("en-US")} <span className="text-base font-medium text-slate-500">tUSDC</span></div></div>
          </section>
          <section className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 bg-white text-center"><div className="p-4"><div className="text-lg font-semibold">{positions.length}</div><div className="mt-1 text-xs text-slate-500">Entries</div></div><div className="p-4"><div className="text-lg font-semibold">{wins}</div><div className="mt-1 text-xs text-slate-500">Wins</div></div><div className="p-4"><div className="text-lg font-semibold">{positions.length ? Math.round((wins / positions.length) * 100) : 0}%</div><div className="mt-1 text-xs text-slate-500">Win rate</div></div></section>
        </div>
        <section className="border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Leaderboard</p><h3 className="mt-1 text-lg font-semibold">Top predictors</h3></div><Trophy size={19} className="text-emerald-700" /></div>
          <div className="mt-4 flex gap-2 border-b border-slate-200"><button onClick={() => setBoard("volume")} className={`border-b-2 px-1 pb-2 text-sm font-medium ${board === "volume" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-500"}`}>Volume</button><button onClick={() => setBoard("winRate")} className={`border-b-2 px-1 pb-2 text-sm font-medium ${board === "winRate" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-500"}`}>Win rate</button></div>
          <div className="mt-2">{leaderboard.map(([wallet, volume, winRate], index) => <div key={wallet} className="grid grid-cols-[32px_1fr_auto_auto] items-center gap-3 border-b border-slate-100 py-3 text-sm"><span className="font-mono text-slate-400">{index + 1}</span><span className="font-mono text-slate-700">{wallet}</span><span className="text-slate-500">{volume}</span><span className="font-semibold text-emerald-700">{winRate}</span></div>)}</div>
        </section>
      </div>
      <section className="border-t border-slate-200 bg-white p-5 md:p-7"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Bet history</p><h3 className="mt-1 text-lg font-semibold">Your recent activity</h3><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-y border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="py-3 font-medium">Market</th><th className="font-medium">Round</th><th className="font-medium">Side</th><th className="font-medium">Entry</th><th className="font-medium">Status</th><th className="text-right font-medium">Payout</th></tr></thead><tbody>{positions.map((position) => <tr key={position.id} className="border-b border-slate-100"><td className="py-3 font-medium">{position.symbol}/USD</td><td>#{position.roundId}</td><td className={position.side === "UP" ? "text-emerald-700" : "text-rose-700"}>{position.side}</td><td>{position.amount.replace("RH", paymentSymbol)}</td><td className="text-slate-600">{position.status}</td><td className="text-right font-medium">{position.claimable.replace("RH", paymentSymbol)}</td></tr>)}</tbody></table></div></section>
    </section>
  </div>;
}

function Intro() {
  return (
    <section className="border border-slate-200 bg-white p-5">
      <div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-emerald-700">
            <Radio size={13} /> Markets are live
          </div>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
            One next move. Two sides. The pool decides.
          </h2>
        </div>
      </div>
    </section>
  );
}

function MarketStrip({ selected, onSelect }: { selected: AssetKey; onSelect: (asset: AssetKey) => void }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {marketKeys.map((key) => {
        const asset = ASSETS[key];
        const active = selected === key;
        const upChance = 42 + ((asset.symbol.length * 7 + asset.name.length) % 17);
        return (
          <article key={key} className={`border p-4 transition ${active ? "border-slate-900 bg-white shadow-[0_12px_30px_rgba(20,30,22,0.09)]" : "border-slate-200 bg-white hover:border-slate-400"}`}>
            <button onClick={() => onSelect(key)} className="w-full text-left">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AssetMark assetKey={key} symbol={asset.symbol} />
                  <div>
                    <div className="font-semibold text-slate-950">{asset.symbol} Up or Down</div>
                    <div className="mt-0.5 text-xs text-slate-500">{asset.name} / USD</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-500">{active ? "Selected" : "1 min"}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <span className="border border-slate-200 py-2 text-center text-sm font-medium text-emerald-700">Up</span>
                <span className="border border-slate-200 py-2 text-center text-sm font-medium text-rose-700">Down</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden bg-rose-100">
                <div className="h-full bg-emerald-500" style={{ width: `${upChance}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-500"><span>{upChance}% Up</span><span>{100 - upChance}% Down</span></div>
            </button>
          </article>
        );
      })}
    </section>
  );
}

function AssetMark({ assetKey, symbol }: { assetKey: AssetKey; symbol: string }) {
  const icon = assetIcons[assetKey];
  if (icon) return <img src={icon} alt="" className="h-9 w-9 rounded-md" />;
  if (assetKey === "NVDA") return <NvidiaMark />;
  if (assetKey === "TSLA") return <TeslaMark />;
  if (assetKey === "SPY") return <SpyMark />;
  if (assetKey === "GOLD") return <GoldMark />;
  return <span className="grid h-9 w-9 place-items-center rounded-md bg-slate-900 text-xs font-bold text-white">{symbol.slice(0, 1)}</span>;
}

function NvidiaMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="h-9 w-9 rounded-md">
      <rect width="36" height="36" rx="7" fill="#76B900" />
      <path d="M6.8 18.2c3-4.6 7-6.9 12-6.9 4.3 0 7.8 1.7 10.4 5.1-2.7-2.1-5.9-3.1-9.5-3.1-4.7 0-8.6 1.7-11.7 5.1l-1.2-.2Z" fill="#07130a" />
      <path d="M10.1 19.2c2.3-2.6 5.1-3.9 8.4-3.9 3.7 0 6.6 1.7 8.8 5.1-2.5 2.9-5.4 4.3-8.8 4.3-3.3 0-6.1-1.8-8.4-5.5Z" fill="#07130a" />
      <path d="M14.1 19.8c1.1-1.3 2.4-1.9 4-1.9s2.9.7 4 2.1c-1.1 1.4-2.5 2.1-4 2.1-1.6 0-2.9-.8-4-2.3Z" fill="#76B900" />
      <circle cx="18.4" cy="20" r="1.7" fill="#07130a" />
    </svg>
  );
}

function TeslaMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="h-9 w-9 rounded-md">
      <rect width="36" height="36" rx="7" fill="#E82127" />
      <path d="M9 9.6h18v4.1c-2.2-1.2-5.2-1.9-9-1.9s-6.8.7-9 1.9V9.6Z" fill="white" />
      <path d="M15.9 14.6h4.2l1.8 13.1h-3l-.9-8.2-.9 8.2h-3l1.8-13.1Z" fill="white" />
    </svg>
  );
}

function SpyMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="h-9 w-9 rounded-md">
      <rect width="36" height="36" rx="7" fill="#081119" />
      <path d="M10 11h16v4H14v3h10v4H14v3h12v4H10V11Z" fill="white" />
      <path d="M24.5 11H29v18h-4.5V11Z" fill="#c8ff38" />
    </svg>
  );
}

function GoldMark() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="h-9 w-9 rounded-md">
      <rect width="36" height="36" rx="7" fill="#F8B81F" />
      <path d="m18 8 10 6v8l-10 6-10-6v-8l10-6Z" fill="#6b4300" opacity="0.22" />
      <path d="M13.1 22.2v-8.4h8.6c1.4 0 2.5.3 3.2 1l-2.1 2.1c-.3-.2-.7-.3-1.2-.3h-5.2v4.7h4.9v-1.2h-2.6v-2.5h5.9v6.6h-3.1v-.9c-.8.7-1.8 1-3 1h-2.4c-1.9 0-3-.7-3-2.1Z" fill="#2d2100" />
    </svg>
  );
}

function DirectionButton({ active, side, onClick }: { active: boolean; side: Direction; onClick: () => void }) {
  const up = side === "UP";
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 border px-4 py-4 text-lg font-bold transition ${active ? (up ? "border-rh-green bg-rh-green text-white" : "border-rh-red bg-rh-red text-white") : up ? "border-emerald-300 text-emerald-700 hover:bg-emerald-50" : "border-rose-300 text-rose-700 hover:bg-rose-50"}`}
    >
      {up ? <ArrowUp size={22} /> : <ArrowDown size={22} />}
      {side}
    </button>
  );
}

function PoolMeter({ upPool, downPool, totalPool, side, multiplier, timeframe, paymentSymbol }: { upPool: number; downPool: number; totalPool: number; side: Direction; multiplier: number; timeframe: 60 | 300; paymentSymbol: string }) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-rh-green">UP {upPool.toLocaleString("en-US")} {paymentSymbol}</span>
        <span className="text-rh-red">DOWN {downPool.toLocaleString("en-US")} {paymentSymbol}</span>
      </div>
      <div className="flex h-2 overflow-hidden bg-rose-200">
        <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(upPool / totalPool) * 100}%` }} />
      </div>
      <div className="mt-3 flex justify-between text-sm text-slate-600">
        <span>Estimated multiplier</span>
        <strong className={side === "UP" ? "text-rh-green" : "text-rh-red"}>
          {timeframe === 60 ? "~1.8x target" : `${multiplier.toFixed(2)}x live`}
        </strong>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="border border-slate-200 bg-rh-panel p-4 shadow-[0_12px_28px_rgba(20,30,22,0.06)]">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
        {icon}
        {title}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-slate-200 bg-white p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm text-slate-900">{value}</div>
    </div>
  );
}
