"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronDown, Wallet } from "lucide-react";

export function WalletControl({ onProfile }: { onProfile: () => void }) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, mounted, openChainModal, openConnectModal }) => {
        const connected = mounted && Boolean(account && chain);

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              className="inline-flex h-11 items-center gap-2 border border-cyan-200/55 bg-cyan-100 px-4 text-sm font-semibold text-slate-950 transition hover:bg-white"
            >
              <Wallet size={16} /> Connect wallet
            </button>
          );
        }

        if (chain?.unsupported) {
          return (
            <button onClick={openChainModal} className="h-11 border border-rose-300/60 bg-rose-400/10 px-4 text-sm font-semibold text-rose-200">
              Switch network
            </button>
          );
        }

        return (
          <button
            onClick={onProfile}
            className="inline-flex h-11 items-center gap-2 border border-white/15 bg-white/[0.06] px-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-100/50 hover:bg-white/[0.1]"
          >
            <span className="grid h-6 w-6 place-items-center border border-lime-300/50 bg-lime-300/10 text-[10px] text-lime-200">VP</span>
            <span className="font-mono text-xs">{account?.displayName}</span>
            <ChevronDown size={15} className="text-slate-400" />
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
}
