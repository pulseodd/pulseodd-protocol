import "dotenv/config";

import { ASSETS, predictClassicAbi, ZERO_ADDRESS } from "@pulseodd/sdk";
import { type Abi, createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const chainId = Number(process.env.RH_CHAIN_ID || 0);
const rpcUrl = process.env.RH_RPC_URL;
const predictContract = process.env.PREDICT_CONTRACT as `0x${string}` | undefined;
const keeperPrivateKey = process.env.KEEPER_PRIVATE_KEY as `0x${string}` | undefined;

if (!chainId || !rpcUrl || !predictContract || predictContract === ZERO_ADDRESS || !keeperPrivateKey) {
  throw new Error("Missing RH_CHAIN_ID, RH_RPC_URL, PREDICT_CONTRACT, or KEEPER_PRIVATE_KEY");
}

const contractAddress = predictContract;
const rpcEndpoint = rpcUrl;

// TODO(RH): chain params - replace placeholders with canonical RH Network metadata.
const rhNetwork = defineChain({
  id: chainId,
  name: "RH Network",
  nativeCurrency: { name: "RH", symbol: "RH", decimals: 18 },
  rpcUrls: { default: { http: [rpcEndpoint] } }
});

const account = privateKeyToAccount(keeperPrivateKey);
const publicClient = createPublicClient({ chain: rhNetwork, transport: http(rpcEndpoint) });
const walletClient = createWalletClient({ account, chain: rhNetwork, transport: http(rpcEndpoint) });

const timeframes = [60n, 300n] as const;

async function tick() {
  const now = BigInt(Math.floor(Date.now() / 1000));

  for (const timeframe of timeframes) {
    const round = await publicClient.readContract({
      address: contractAddress,
      abi: predictClassicAbi,
      functionName: "getCurrentRound",
      args: [ASSETS.BTC.key, timeframe]
    });

    if (round.id === 0n || round.status === 4) {
      await send("createNextRound", [ASSETS.BTC.key, timeframe]);
      continue;
    }

    if (round.status === 1 && now >= round.lockTs) {
      await send("lockRound", [round.id]);
      continue;
    }

    if (round.status === 2 && now >= round.endTs) {
      await send("settleRound", [round.id]);
    }
  }
}

async function send(functionName: "createNextRound" | "lockRound" | "settleRound", args: readonly unknown[]) {
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: [
      ...predictClassicAbi,
      {
        type: "function",
        name: "createNextRound",
        stateMutability: "nonpayable",
        inputs: [
          { name: "asset", type: "bytes32" },
          { name: "timeframe", type: "uint256" }
        ],
        outputs: [{ name: "roundId", type: "uint256" }]
      },
      {
        type: "function",
        name: "lockRound",
        stateMutability: "nonpayable",
        inputs: [{ name: "roundId", type: "uint256" }],
        outputs: []
      },
      {
        type: "function",
        name: "settleRound",
        stateMutability: "nonpayable",
        inputs: [{ name: "roundId", type: "uint256" }],
        outputs: []
      }
    ] as Abi,
    functionName,
    args: args as never
  });
  console.log(`${functionName}: ${hash}`);
}

setInterval(() => {
  tick().catch((error) => console.error(error));
}, 2_000);

tick().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
