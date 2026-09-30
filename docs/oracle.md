# Oracle Observations and Settlement

## Two-source adapter

PriceOracleAdapter accepts two separately attributed source streams. Each source has a distinct authorized reporter. Observations use positive integer prices in the same eight-decimal quote unit and monotonically increasing timestamps. A reporter cannot write the other source. Configure independent upstream markets and failure domains before release; the contract cannot prove off-chain source honesty.

Snapshots select the last observation at or before the requested boundary using timestamp-ordered history. Both observations must be within `stalePriceWindow` of that boundary. The lower price is the denominator for `abs(p1 - p2) * 10000 / min(p1, p2)`; exceeding `maxDeviationBps` rejects the snapshot. The accepted price is the integer midpoint. No post-boundary observation substitutes for the boundary price.

The protocol stores accepted lock and end prices and observation timestamps. Indexed tick responses expose source observations and snapshot boundaries. History reads are logarithmic; stored observations are append-only. Relayers should publish at least once per observation window and before both boundaries. Relayer configuration and risk changes are delayed. Reporter changes establish a new observation epoch; old observations cannot be reused under a new source identity.

## Failure handling

Missing, stale or divergent observations lead to VOID/full remaining-stake refunds when lock or settlement is attempted. Keepers have a 15-second default execution grace, captured per round. A 20-second delay therefore voids rather than settling using a late price. Once the grace expires, any account can invoke the circuit breaker to avoid dependence on a live keeper. Before grace expiry only the authorized lifecycle actions evaluate snapshots.

`live`, `locked`, `waiting-oracle`, `settled` and `void` are UI states. Waiting-oracle means a deadline has passed without finalization, not that a chart price is authoritative. Chart data never settles the contract.

## Operations

Monitor reporter cadence, timestamp age, source disagreement, RPC lag, failed transactions and missing lock/settlement receipts. Two keeper keys improve availability but do not decentralize a single relayer operator. A native decentralized oracle integration and external audit remain future work, not delivered guarantees. Do not use sample or mocked prices with real funds.
