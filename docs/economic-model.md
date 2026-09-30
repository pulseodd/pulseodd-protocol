# Economic Model and Accounting

**Status: current-code analysis plus a proposed mainnet model. No implementation or testing in this update.**

## Current contract

`PredictClassic` initializes `feeBps = 500`: 5% of the winning-side stake pool, not 1% of every transaction. For winning-side pool `W` and losing pool `L`, settlement pays `floor(W * feeBps / 10000)` to treasury. Claim calculation uses `L + floor(W * (10000 - feeBps) / 10000)` and distributes it pro rata. These two floor operations can leave rounding dust.

The current `getMultiplier` formula applies the fee to the opposite pool instead; it is not identical to actual claim accounting. Also, claims read the current global fee, which can change after settlement. Both mismatches require source changes before the published economic plan can be considered implemented.

## Proposed settlement

Let `U` and `D` be stakes still present at lock, `T = U + D`, and `W` the winning side. A candidate implementation of the planned 1% model charges the total settled pool: `F = floor(T * 100 / 10000)`. This basis must be approved before changing the current winning-pool basis. No source or deployed fee is changed by this document.

For a winning position `s`, payout is `floor(s * (T - F) / W)`. Integer rounding always rounds down; aggregate payouts cannot exceed the round reserve. The displayed multiplier is `(T - F) / W`, excluding gas and future entries. It is not a guaranteed quote while betting is open.

Tie, VOID and empty-winning-side rounds return each wallet's remaining stake with zero settlement fee. The fee configuration and treasury are captured at round creation. No later setter may change an already-created round's payout formula.

## Proposed early exit

The candidate fee is 10 basis points (0.1%) of the exited amount, subject to approval. The user's stake and total round liability would decrease by the full amount; the user would receive amount minus fee and the treasury would receive the fee. No exit should be allowed at or after lock. Gas is additional. Early exits do not establish a profitable trade or yield. `PredictClassic.earlyExit` does not currently exist.

## Proposed reserves and expiry

The target is for each round to track its own remaining liability. Deposits increase it; exits, fees, claims and a permitted sweep decrease it. A sweep must never touch another round's liability. A candidate 30-day winning claim window would run from settlement; after expiry a snapshotted treasury could receive residual unclaimed funds and rounding dust through `unclaimedSweep`. This expiry policy requires explicit approval and clear user disclosure. Refunds should never expire or be swept. The current contract has neither claim expiry nor `unclaimedSweep`.

Native funds sent directly outside a bet are not round stakes. Token collateral must transfer the exact requested amount. No pool solvency claim includes rebasing or malicious collateral behavior.

## Fee allocation versus execution

The project policy allocates collected fees 80% to buybacks and 20% to treasury operations. Collection in PredictClassic does not itself execute a swap, burn, discount or automated 80/20 split. Publication of fee and buyback wallets, a reviewed executor and transaction evidence are release gates. See [tokenomics](tokenomics.md). Never interpret planned buybacks as a return guarantee.
