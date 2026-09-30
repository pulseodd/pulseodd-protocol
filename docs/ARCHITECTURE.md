# Pulseodd Protocol Architecture

Pulseodd is a short-horizon pooled prediction market for Robinhood Chain. The repository is intentionally kept as one monorepo so contract interfaces, frontend behavior, keeper operations, and technical documentation evolve together.

## Repository map

```text
apps/web/          Next.js product UI, landing scene, classic terminal, docs route
packages/contracts Foundry contracts, oracle adapter, treasury, mocks, tests
packages/sdk       Shared asset metadata and ABI-facing frontend helpers
scripts/keeper     Time-based round lock, settlement, and next-round automation
scripts/sim        Deterministic simulation notes and future scenario runners
docs/              Protocol architecture, tokenomics, operations, and release notes
```

## Round lifecycle

1. A market round is created with an asset, duration, start and end timestamps, and a reference price.
2. Users select `UP` or `DOWN` while the round is open. Positions accumulate by account and side.
3. The keeper locks the round after the entry deadline. New entries are rejected after lock.
4. The oracle adapter records the settlement observation and the contract resolves the winning side.
5. The winner pool becomes claimable. Claims are calculated from the winning position and eligible pool balance.
6. A new round is created only after the previous lifecycle reaches a terminal state.

The chart is never the settlement authority. It is a context surface; the oracle and contract state are the source of truth.

## Security boundaries

- Browser code never receives `KEEPER_PRIVATE_KEY` or treasury signing credentials.
- Chain IDs, RPC URLs, contract addresses, and explorer URLs are environment-driven.
- Settlement and claim are separate operations to reduce coupling and make monitoring clearer.
- Pause and emergency refund paths are reserved for operational incidents and should be governed by explicit permissions.
- Mainnet deployment requires bytecode, ownership, relayer, keeper, treasury, and oracle checks before launch.
