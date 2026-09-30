# Economic Model and Accounting

## Settlement

Let `U` and `D` be stakes still present at lock, `T = U + D`, and `W` the winning side. The hardened source defaults to a 1% settlement fee on the total settled pool: `F = floor(T * 100 / 10000)`. This replaces the legacy source's 5% charge on the winning pool. Existing deployments retain their original code and must be identified separately.

For a winning position `s`, payout is `floor(s * (T - F) / W)`. Integer rounding always rounds down; aggregate payouts cannot exceed the round reserve. The displayed multiplier is `(T - F) / W`, excluding gas and future entries. It is not a guaranteed quote while betting is open.

Tie, VOID and empty-winning-side rounds return each wallet's remaining stake with zero settlement fee. The fee configuration and treasury are captured at round creation. No later setter may change an already-created round's payout formula.

## Early exit

The default fee is 10 basis points (0.1%) of the exited amount. The user's stake and total round liability decrease by the full amount; the user receives amount minus fee and the treasury receives the fee. No exit is allowed at or after lock. Gas is additional. Early exits do not establish a profitable trade or yield.

## Reserves and expiry

Each round tracks its own remaining liability. Deposits increase it; exits, fees, claims and a permitted sweep decrease it. A sweep cannot touch another round's liability. Winning claims have a 30-day default window from settlement; after expiry the snapshotted treasury may receive residual unclaimed funds and rounding dust through a permissionless `unclaimedSweep`. Refunds never expire and cannot be swept.

Native funds sent directly outside a bet are not round stakes. Token collateral must transfer the exact requested amount. No pool solvency claim includes rebasing or malicious collateral behavior.

## Fee allocation versus execution

The project policy allocates collected fees 80% to buybacks and 20% to treasury operations. Collection in PredictClassic does not itself execute a swap, burn, discount or automated 80/20 split. Publication of fee and buyback wallets, a reviewed executor and transaction evidence are release gates. See [tokenomics](tokenomics.md). Never interpret planned buybacks as a return guarantee.
