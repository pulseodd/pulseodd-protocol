# Security Policy

This source release is experimental. It is not independently audited or approved for value-bearing mainnet use.

Report vulnerabilities privately to **pulse@pulseodd.com**, with subject `SECURITY: Pulseodd`, affected commit, reproduction steps, impact and a minimal test. Do not disclose exploitable details in public issues before coordination. Never send private keys, seed phrases, access tokens or user personal information. No response SLA or bug-bounty reward is currently promised.

## Incident response

1. Assess scope without making new deposits or publishing secrets.
2. Authorized admin pauses affected markets immediately.
3. Preserve transaction hashes, blocks, timestamps and sanitized logs.
4. Users of unfinished rounds use emergency refunds; settled entitlements must not be converted into principal refunds.
5. Schedule compromised keeper/reporter replacement and remediation through the timelock.
6. Review tests, reserves and independent findings before delayed unpause.
7. Publish a factual incident report and updated deployment manifest.

Never put signer secrets in `NEXT_PUBLIC_*`, browser bundles, Git history or indexer responses. Use a secrets manager, separate relayer and keeper keys, least privilege and a multisig owner. Rotate any credential exposed in chat or version control. A deleted file does not remove Git history.
