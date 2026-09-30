# Threat Model

| Threat | Source-level mitigation | Residual risk / release gate |
| --- | --- | --- |
| Late bet / double settlement | Timestamp and state guards | Inclusion timing and chain reorganization |
| Oracle manipulation | Two attributed streams, age and deviation checks | Colluding reporters or shared upstream source |
| Late keeper | Per-round grace and permissionless timeout VOID | RPC outages, transaction censorship and gas availability |
| Governance repricing | Two-day configuration delay; round snapshots | Malicious governance and adapter upgrades/configuration |
| Cross-round drain | Separate round reserve; no principal refunds after settlement | Requires independent invariant review |
| Reentrant receiver | Withdrawal/entry reentrancy guards and effects before transfers | Malicious or nonstandard collateral excluded |
| One-sided liquidity | Aggregate bootstrap cap and 80% entry limit | Exits and Sybil participants can change distribution |
| Stolen keeper key | Restricted lifecycle authority and replacement allowlist | Griefing and authorized early VOID on oracle failure |
| Leaked secret | Server-only keeper/relayer configuration | Operator endpoint and CI security |
| Misleading UI | Demo/live separation; indexed status; receipt confirmation | Indexer/RPC can be unavailable or lagging |

## Trust boundaries

The browser is never a settlement authority. The indexer is a read model, not a custodian or signer. Transactions must still pass contract guards. The keeper handles timing, not price construction. The admin can pause immediately but cannot retroactively promise that principal is refundable after a settled payout.

## Verification

Unit, fuzz and stateful invariants cover reserve conservation, timing, replay, exits and oracle failures. They do not constitute an audit or a proof of all possible behaviors. Public testnet execution, bytecode verification, multisig review, independent security assessment and a sustained BTC 60s/300s soak are still required. See [audit notes](audit-notes.md).
