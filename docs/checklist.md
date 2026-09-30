# Mainnet Release Gates

Target: **8 October 2026, subject to security sign-off**. This is a plan, not a deployment attestation. Evidence must identify the chain, contract, commit, transaction and reviewer.

- [ ] Contract addresses published for this release
- [ ] Deployed bytecode verified against the release commit
- [ ] Owner is a reviewed multisig
- [ ] Keeper secrets absent from frontend bundles and Git history
- [ ] Two independent oracle sources and relayer operators documented
- [ ] Fee wallet and buyback wallet public
- [ ] Emergency pause tested on testnet
- [ ] Refund paths tested on testnet, including already-settled rounds
- [ ] BTC 60s and 5m rounds: 24-hour continuous loop with monitored receipts
- [ ] Monitoring alerts delivered and acknowledged in a failure drill
- [ ] Incident contact operational: pulse@pulseodd.com
- [x] LICENSE and SECURITY.md included in source

The incoming checklist said "24s loop test". A 24-second run cannot cover even one 60-second round. This release gate deliberately requires 24 hours; no soak run is claimed here.
