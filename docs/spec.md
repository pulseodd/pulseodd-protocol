# Pulseodd Protocol Specification

**Status: proposed hardening specification; not implemented by this documentation update.** Contract names and candidate methods below identify the intended implementation location, not deployed features. No contract changes, tests or deployments accompany this update. See [current implementation versus plan](implementation-status.md) and [release gates](checklist.md).

## Roles and authority

| Role | Responsibility | Cannot do |
| --- | --- | --- |
| User | Enter, exit before lock, claim with their own wallet | Choose settlement prices or withdraw another position |
| Keeper | Create BTC rounds, lock and settle after their deadlines | Bypass timestamps or oracle validation |
| Relayer | Publish attributed, positive price observations | Place arbitrary settlement results in a round |
| Admin (target) | Schedule configuration changes; emergency pause | Immediately change fee/oracle/keeper policy or sweep active stakes |

Admin should be a reviewed multisig. Source independence is operational as well as contractual: two reporter addresses controlled by one party are not two independent markets.

## Lifecycle

`created -> open -> locked -> settled -> claimable -> claimed`

Creation immediately opens a round. Claimable is a derived per-wallet state, not a separate round enum. The existing numeric ABI stays stable: Upcoming=0, LiveBetting=1, Locked=2, Settling=3, Settled=4, Refunded=5 (VOID). A failed oracle or missed keeper deadline branches to VOID. A new round can follow either Settled or VOID.

- Entry requires `startTs <= now < lockTs`, an enabled market, a valid side and stake bounds.
- No second lock or settlement is allowed. A late keeper cannot invent a new reference time.
- Lock uses the observation at or before `lockTs`; settlement uses the observation at or before `endTs`.
- Winners claim pro rata. Equal prices or an empty winning side refund both sides without settlement fees.
- Claims are user-driven and protected against reentrancy and double payment.
- While paused, trading/creation/lock/settlement/ordinary claims are blocked. Emergency refunds are the user withdrawal route. A settled round keeps its settled entitlement; pausing must never turn a losing position into a principal refund funded by other rounds.
- VOID/tie refunds do not expire. Winning claims expire after the round's snapshotted claim window. Only that round's remaining balance can then be swept to its snapshotted treasury.

## Risk policy

Candidate settings for review: 80% side concentration, bootstrap liquidity of ten minimum stakes, 0.1% early-exit fee, 30-day winning claim window, 15-second keeper delay, and a 15-second observation age limit. These are proposed settings, not source defaults or approved mainnet parameters. Only the 80% concentration threshold was specified by the incoming checklist; the remaining numerical choices need approval and implementation.

When the opposite side is empty, the entire selected side is capped at the bootstrap amount. Splitting across wallets or transactions cannot bypass this cap. Once both sides have liquidity, additions exceeding 80% concentration are rejected. Exits may increase concentration; a user is never forced to retain a position to balance other users.

`earlyExit(roundId, side, amount)` is available only before lock and reduces both the wallet position and the round liability. The exit fee is separate from settlement fees. A later VOID refunds remaining stakes, not fees for already completed exits.

## Administrative changes

Proposed design: configuration is scheduled by the hash of the exact setter calldata with a two-day candidate delay. Anyone can inspect the pending hash and activation time; only the owner can apply it. An operation is consumed once and can be cancelled. Emergency pause remains immediate; unpause would be delayed. Existing ownership transfer is two-step and should end at a multisig. None of the timelock behavior exists in the current contracts.

Target behavior: oracle address, treasury, fee, liquidity/risk limits and claim rules are captured at creation so governance cannot reprice an open round. The adapter should have its own delayed reporter/risk configuration. `setKeeper` would remain as a deprecated delayed compatibility entry point; proposed `setKeepers` would replace the full allowlist. Currently setters execute immediately and configuration is global.

## Scope and compatibility

The existing `placeBet`, `lockRound`, `settleRound`, `createNextRound` and `claim` selectors must remain. The current bet entry point is named `placeBet`, not `bet`. This repository does not promise storage-compatible upgrades of deployed contracts. The current contract has native-currency and ERC-20 branches, but does not enforce exact received amounts; exact-transfer accounting is an additional release gate. Rebasing and fee-on-transfer tokens should not be used. The public Pulseodd token CA is not automatically the collateral token.

## Target contract map

- `PredictClassic`: concentration limits, early exit, per-round accounting, VOID, claim expiry, keeper list management and timelocked configuration.
- `PriceOracleAdapter`: two-source observations and historical boundary snapshots.
- `IPriceOracle`: compatible historical-read interface design (proposed `getPriceAt`).
- `Treasury`: reviewed fee allocation and withdrawal policy; automatic buybacks are not present.
- `TimelockedAdmin` (proposed new contract, not in source): schedule/cancel/apply administrative operations.

All lifecycle statements above define the target behavior. Existing timing guards, user-driven claims and default tie refunds are present, but do not imply that the proposed safety extensions have shipped.
