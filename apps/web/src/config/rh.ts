import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { createConfig, http, injected } from "wagmi";
import { defineChain } from "viem";
import { ZERO_ADDRESS } from "@pulseodd/sdk";

const robinhoodTestnetRpc = "https://rpc.testnet.chain.robinhood.com";
const robinhoodTestnetExplorer = "https://explorer.testnet.chain.robinhood.com";
const suppliedRhRpc = process.env.NEXT_PUBLIC_RH_RPC_URL;
const suppliedRhChainId = process.env.NEXT_PUBLIC_RH_CHAIN_ID;
const configuredChainId = Number(suppliedRhChainId || 46630);
const isMainnet = configuredChainId === 4663;
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

export const rhConfig = {
  chainId: configuredChainId,
  rpcUrl: suppliedRhRpc || robinhoodTestnetRpc,
  explorerUrl: process.env.NEXT_PUBLIC_RH_EXPLORER_URL || robinhoodTestnetExplorer,
  tokenAddress: process.env.NEXT_PUBLIC_RH_TOKEN_ADDRESS || ZERO_ADDRESS,
  predictContract: process.env.NEXT_PUBLIC_PREDICT_CONTRACT || ZERO_ADDRESS,
  demo: process.env.NEXT_PUBLIC_DEMO !== "0",
  networkMode: isMainnet ? "mainnet" : "testnet"
} as const;

export const paymentToken = {
  name: "Pulseodd Test USD",
  symbol: "tUSDC",
  faucetAmount: 1_000
} as const;

// TODO(RH): update these values only from official Robinhood Chain documentation.
export const rhNetwork = defineChain({
  id: rhConfig.chainId,
  name: isMainnet ? "Robinhood Chain" : "Pulseodd Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rhConfig.rpcUrl] } },
  blockExplorers: { default: { name: "Robinhood Chain Explorer", url: rhConfig.explorerUrl } }
});

export const wagmiConfig = walletConnectProjectId
  ? getDefaultConfig({
      appName: "Pulseodd",
      projectId: walletConnectProjectId,
      chains: [rhNetwork],
      transports: { [rhNetwork.id]: http(rhConfig.rpcUrl) },
      ssr: true
    })
  : createConfig({
      chains: [rhNetwork],
      // EIP-6963 exposes separately installed browser wallets, including MetaMask and Zerion.
      connectors: [injected({ target: "metaMask" }), injected({ target: "zerion" }), injected()],
      transports: { [rhNetwork.id]: http(rhConfig.rpcUrl) },
      ssr: true
    });
