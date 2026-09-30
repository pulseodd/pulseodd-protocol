# Mainnet Operations Checklist

Target launch date: **8 October 2026**.

## Release gates

- Confirm Robinhood Chain network parameters and explorer links.
- Verify every deployed address from the release environment.
- Verify contract bytecode and owner or role assignments.
- Test oracle relay freshness, stale data handling, and tie behavior.
- Run keeper lock, settle, and create-next-round rehearsals.
- Confirm treasury permissions and the 1% fee route.
- Confirm buyback accounting for the planned 80% allocation.
- Configure alerting for failed transactions, stale rounds, and paused contracts.
- Keep all private credentials outside the frontend bundle and repository.

## Incident response

If oracle data is stale, keeper execution fails, or a contract invariant is uncertain, pause new entries, preserve the relevant transaction hashes, communicate the incident, and resume only after the state transition is independently verified.
