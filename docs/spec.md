# Pulseodd Protocol Specification

This document describes the hardened source release, not proof of a deployed or audited system. Existing deployments must not be assumed to implement these rules. See [release gates](checklist.md).

## Roles and authority

| Role | Responsibility | Cannot do |
| --- | --- | --- |
| User | Enter, exit before lock, claim with their own wallet | Choose settlement prices or withdraw another position |
| Keeper | Create BTC rounds, lock and settle after their deadlines | Bypass timestamps or oracle validation |
| Relayer | Publish attributed, positive price observations | Place arbitrary settlement results in a round |
| Admin | Schedule configuration changes; emergency pause | Immediately change fee/oracle/keeper policy or sweep active stakes |

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

Defaults: 80% side concentration, bootstrap liquidity of ten minimum stakes, 0.1% early-exit fee, 30-day winning claim window, 15-second keeper delay, and a 15-second observation age limit. Limits are explicit source defaults, not recommendations for mainnet.

When the opposite side is empty, the entire selected side is capped at the bootstrap amount. Splitting across wallets or transactions cannot bypass this cap. Once both sides have liquidity, additions exceeding 80% concentration are rejected. Exits may increase concentration; a user is never forced to retain a position to balance other users.

`earlyExit(roundId, side, amount)` is available only before lock and reduces both the wallet position and the round liability. The exit fee is separate from settlement fees. A later VOID refunds remaining stakes, not fees for already completed exits.

## Administrative changes

Configuration is scheduled by the hash of the exact setter calldata with a fixed two-day delay. Anyone can inspect the pending hash and activation time; only the owner can apply it. An operation is consumed once and can be cancelled. Emergency pause is immediate; unpause is delayed. Ownership transfer remains two-step and should end at a multisig.

Oracle address, treasury, fee, liquidity/risk limits and claim rules are captured at creation so governance cannot reprice an open round. The adapter has its own delayed reporter/risk configuration. `setKeeper` remains as a deprecated delayed compatibility entry point; `setKeepers` replaces the full allowlist.

## Scope and compatibility

The existing `placeBet`, `lockRound`, `settleRound`, `createNextRound` and `claim` selectors remain. This repository does not promise storage-compatible upgrades of deployed contracts. Native currency and exact-transfer ERC-20 collateral are supported; rebasing and fee-on-transfer tokens are not. The public Pulseodd token CA is not automatically the collateral token.
