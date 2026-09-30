"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { Toaster } from "sonner";
import { wagmiConfig } from "@/config/rh";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en" theme={darkTheme({ accentColor: "#17f78b" })}>
          {children}
          <Toaster richColors position="bottom-right" />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
