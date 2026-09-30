export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const ASSETS = {
  BTC: {
    key: "0x4254430000000000000000000000000000000000000000000000000000000000",
    symbol: "BTC",
    name: "Bitcoin",
    venue: "Crypto",
    chartSymbol: "BINANCE:BTCUSDT"
  },
  ETH: {
    key: "0x4554480000000000000000000000000000000000000000000000000000000000",
    symbol: "ETH",
    name: "Ethereum",
    venue: "Crypto",
    chartSymbol: "BINANCE:ETHUSDT"
  },
  SOL: {
    key: "0x534f4c0000000000000000000000000000000000000000000000000000000000",
    symbol: "SOL",
    name: "Solana",
    venue: "Crypto",
    chartSymbol: "BINANCE:SOLUSDT"
  },
  BNB: {
    key: "0x424e420000000000000000000000000000000000000000000000000000000000",
    symbol: "BNB",
    name: "BNB",
    venue: "Crypto",
    chartSymbol: "BINANCE:BNBUSDT"
  },
  XRP: {
    key: "0x5852500000000000000000000000000000000000000000000000000000000000",
    symbol: "XRP",
    name: "XRP",
    venue: "Crypto",
    chartSymbol: "BINANCE:XRPUSDT"
  },
  NVDA: {
    key: "0x4e56444100000000000000000000000000000000000000000000000000000000",
    symbol: "NVDA",
    name: "NVIDIA",
    venue: "Equity",
    chartSymbol: "NASDAQ:NVDA"
  },
  TSLA: {
    key: "0x54534c4100000000000000000000000000000000000000000000000000000000",
    symbol: "TSLA",
    name: "Tesla",
    venue: "Equity",
    chartSymbol: "NASDAQ:TSLA"
  },
  SPY: {
    key: "0x5350590000000000000000000000000000000000000000000000000000000000",
    symbol: "SPY",
    name: "S&P 500 ETF",
    venue: "ETF",
    chartSymbol: "AMEX:SPY"
  },
  GOLD: {
    key: "0x474f4c4400000000000000000000000000000000000000000000000000000000",
    symbol: "GOLD",
    name: "Gold",
    venue: "Commodity",
    chartSymbol: "TVC:GOLD"
  }
} as const;

export const predictClassicAbi = [
  {
    type: "function",
    name: "placeBet",
    stateMutability: "payable",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "side", type: "uint8" },
      { name: "amount", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "claim",
    stateMutability: "nonpayable",
    inputs: [{ name: "roundId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "getCurrentRound",
    stateMutability: "view",
    inputs: [
      { name: "asset", type: "bytes32" },
      { name: "timeframe", type: "uint256" }
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "asset", type: "bytes32" },
          { name: "timeframe", type: "uint256" },
          { name: "startTs", type: "uint256" },
          { name: "lockTs", type: "uint256" },
          { name: "endTs", type: "uint256" },
          { name: "startPrice", type: "int256" },
          { name: "endPrice", type: "int256" },
          { name: "upAmount", type: "uint256" },
          { name: "downAmount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "winner", type: "uint8" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "claimable",
    stateMutability: "view",
    inputs: [
      { name: "roundId", type: "uint256" },
      { name: "user", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

export const mockErc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "claimFaucet",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "hasClaimed",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;
