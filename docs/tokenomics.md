# Pulseodd Token and Fee Model

## Public token reference

- Network: Robinhood Chain
- Contract address: `0x3E5300c0664Ae607bF0A9A2D84A4aAD6bEbbfB98`
- Planned mainnet launch: 8 October 2026

Always verify the chain, deployed bytecode, ownership state, and official links before interacting with a token contract.

## Protocol fee direction

The current mainnet plan applies a 1% protocol fee to completed transactions. The planned allocation is:

- 80% earmarked for Pulseodd token buybacks.
- 20% reserved for operations, infrastructure, monitoring, treasury management, and incident response.

The fee route must be observable on-chain. Buyback execution should publish the source treasury transaction, execution route, token amount, and destination burn or treasury policy where applicable.

These figures describe the current project plan. They are not a promise of returns, yield, token appreciation, or future liquidity.

## Publication and implementation status

- Buyback wallet: not yet published or verified.
- Fee treasury wallet: not yet published or verified for this release.
- Vesting: no unlock schedule published.
- Intended token utility: fee discounts and buyback participation only. Fee discounts and automatic buyback execution are not implemented by PredictClassic; no discount rate is promised.
- There is no requirement to hold the Pulseodd token to trade.
- The supplied token reference is not proof of deployed protocol contracts, network identity, ownership or an audit.
- The current `PredictClassic` source initializes a 5% fee on the winning pool. The 1% rate and 80/20 allocation are plans, not implemented by this update. A total-settled-pool fee basis is a candidate for review, not a token transfer tax. See [the accounting specification](economic-model.md).
- Planned launch: 8 October 2026, subject to security sign-off.
