# Local demonstration authentication

Phase 10 demo accounts are disabled unless `AGENTCLINIC_ENABLE_DEMO_ACCOUNTS=true` is supplied to the seed process. Passwords and password hashes are deliberately absent from tracked files.

Provide `AGENTCLINIC_DEMO_PASSWORD_HASHES` at seed time as a JSON object mapping each approved demo email to an independently salted `scrypt-v1` verifier generated outside the repository:

- `staff@demo.agentclinic.test`
- `ada@demo.agentclinic.test`
- `juniper@demo.agentclinic.test`
- `patch@demo.agentclinic.test`

The value is secret deployment input: keep it in a local untracked environment or secret manager, never commit it, and do not paste it into logs or support output. The seed validates that every identity has a distinct approved verifier, upserts stable account IDs, and creates no sessions. Actual demo passwords must be shared through an out-of-band channel rather than repository documentation.

This credential provisioning is intentionally local/demo-only. Phase 10 does not define production credential management.
