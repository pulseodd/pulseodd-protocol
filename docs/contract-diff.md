# Contract Diff Reference

This page records the method names requested for the next contract revision. The reference is intentionally name-based until real testnet deployments exist.

## Current source

`PredictClassic` currently exposes:

- `placeBet`
- `lockRound`
- `settleRound`
- `claim`

## Planned diff

`PredictClassicV2` adds the planned interface names:

- `earlyExit`
- `setKeepers`
- `circuitBreaker`

The protocol interface is [`packages/contracts/src/PredictClassicV2.sol`](../packages/contracts/src/PredictClassicV2.sol). Contract names remain the canonical references in this diff.
