# Production readiness runbook

## Monitoring

- Configure the hosting platform to probe `GET /api/health`. A `503` means the API must not receive production traffic.
- Alert on repeated process restarts, HTTP 5xx responses, payment events in `review`, and purchases pending longer than 15 minutes.
- Never place authorization headers, cookies, PINs, provider payloads, or email bodies in logs.
- Use a hosted error tracker with environment and release identifiers before public launch. Keep its DSN in deployment secrets.

## Backup and restore

1. Enable encrypted automated MongoDB snapshots with at least daily frequency and a documented retention period.
2. Restrict backup access to production operators and require multi-factor authentication.
3. Restore the latest snapshot into an isolated non-production replica set every quarter.
4. Run `npm run payment:preflight` against the restored database.
5. Compare wallet, ledger, transaction, payment-event, user, and utility record counts with the backup source.
6. Record the recovery time and any manual steps. A snapshot is not considered verified until this restore succeeds.

Never restore over the live database during a drill and never repair wallet discrepancies by manually changing balances.

## Provider staging certification

For Paystack, Monnify, VTPass, and Club Konnect, record evidence for:

- successful, declined, and timed-out requests;
- duplicate callbacks and repeated client requests;
- delayed status confirmation and worker reconciliation;
- exact customer debit, provider amount, ledger entry, and final business status;
- prepaid token delivery without fabricated fallback values;
- provider secrets and raw responses remaining absent from client responses and logs.

Run a small controlled live deposit and utility purchase after staging succeeds. Reconcile both against provider statements before opening the platform to customers.

## Deployment and shutdown

- Deploy only against a MongoDB replica set or sharded cluster.
- Run `npm test`, the client reliability lint, the production build, and `npm run payment:preflight` before release.
- Allow the process time to handle `SIGTERM`: it stops scheduled work, closes the HTTP listener, and disconnects MongoDB.
- Roll back application code rather than mixing old and new versions against the same wallet database.
