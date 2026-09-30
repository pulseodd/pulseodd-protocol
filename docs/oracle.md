# Oracle Observations and Settlement

**Status: proposed two-source design, not implemented.** Current `PriceOracleAdapter` stores one latest observation per asset. Its deviation check compares a new price with the previous price, not with an independent second source. Current `PredictClassic` reads the latest price when a keeper transaction executes; it does not read a historical boundary snapshot.

## Proposed two-source adapter

PriceOracleAdapter accepts two separately attributed source streams. Each source has a distinct authorized reporter. Observations use positive integer prices in the same eight-decimal quote unit and monotonically increasing timestamps. A reporter cannot write the other source. Configure independent upstream markets and failure domains before release; the contract cannot prove off-chain source honesty.

Snapshots select the last observation at or before the requested boundary using timestamp-ordered history. Both observations must be within `stalePriceWindow` of that boundary. The lower price is the denominator for `abs(p1 - p2) * 10000 / min(p1, p2)`; exceeding `maxDeviationBps` rejects the snapshot. The accepted price is the integer midpoint. No post-boundary observation substitutes for the boundary price.

The target protocol stores accepted lock and end prices and observation timestamps. A future indexer would expose source observations and snapshot boundaries. The proposed history is append-only with binary-search reads. Relayers should publish at least once per observation window and before both boundaries. Relayer configuration and risk changes should be delayed. Reporter changes should establish a new observation epoch; old observations must not be reused under a new source identity.

## Proposed failure handling

The proposed circuit breaker converts missing, stale or divergent observations to VOID/full remaining-stake refunds when lock or settlement is attempted. A candidate 15-second keeper execution grace, captured per round, would make a 20-second delay void rather than settle using a late price. After grace expiry, any account could invoke the timeout circuit breaker. This behavior is absent from the current code: oracle failure currently reverts, and there is no maximum keeper lateness.

`live`, `locked`, `waiting-oracle`, `settled` and `void` are UI states. Waiting-oracle means a deadline has passed without finalization, not that a chart price is authoritative. Chart data never settles the contract.

These five status labels and indexed timestamps are UI requirements, not a statement that all are displayed today. Candidate methods: `PriceOracleAdapter.updateSourcePrice`, `getSourceAt`, `getPriceAt`; `PredictClassic.circuitBreaker`. These names describe planned interfaces only.

## Operations

Monitor reporter cadence, timestamp age, source disagreement, RPC lag, failed transactions and missing lock/settlement receipts. Two keeper keys improve availability but do not decentralize a single relayer operator. A native decentralized oracle integration and external audit remain future work, not delivered guarantees. Do not use sample or mocked prices with real funds.
