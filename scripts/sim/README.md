# Pulseodd Simulation Scenarios

This directory is reserved for deterministic protocol simulations that exercise the same lifecycle as production:

- balanced `UP` and `DOWN` pools;
- one-sided liquidity;
- multiple entries from one account;
- tie and refund behavior;
- late entry rejection after lock;
- stale oracle and failed keeper recovery;
- 1% fee accounting and the planned 80/20 allocation.

Simulation outputs should be reproducible, use explicit seeds, and never contain private keys or production credentials.
